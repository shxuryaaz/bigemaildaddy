import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import {
  emailAngleToGeneration,
  emailToneToGeneration,
} from "@/lib/email-regenerate-from-context";
import { rewriteEmailSentence } from "@/lib/email-sentence-rewrite";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

type Body = {
  sentence?: string;
  body?: string;
  subject?: string;
};

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const { id } = context.params;
  const email = await prisma.email.findFirst({
    where: { id, userId: user.id },
  });
  if (!email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sentence = typeof body.sentence === "string" ? body.sentence.trim() : "";
  const fullBody = typeof body.body === "string" ? body.body : email.body;
  const subject = typeof body.subject === "string" ? body.subject.trim() : email.subject;

  if (!sentence || sentence.length < 8) {
    return NextResponse.json(
      { error: "sentence (selected text) is required" },
      { status: 400 },
    );
  }

  if (!fullBody.includes(sentence)) {
    return NextResponse.json(
      { error: "Selected sentence must appear exactly in the current body" },
      { status: 400 },
    );
  }

  let replacement: string;
  try {
    replacement = await rewriteEmailSentence({
      sentence,
      fullBody,
      subject,
      angle: emailAngleToGeneration(email),
      tone: emailToneToGeneration(email),
    });
  } catch (err) {
    console.error("[rewrite-sentence]", err);
    return NextResponse.json({ error: "Rewrite failed" }, { status: 502 });
  }

  return NextResponse.json({ replacement });
}
