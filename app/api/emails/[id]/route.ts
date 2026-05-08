import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
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
    include: {
      target: {
        select: {
          id: true,
          name: true,
          email: true,
          organization: true,
        },
      },
      followups: {
        orderBy: { sendAt: "asc" },
        select: { id: true, type: true, sendAt: true, status: true },
      },
    },
  });
  if (!email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: email.id,
    subject: email.subject,
    body: email.body,
    angle: email.angle,
    tone: email.tone,
    status: email.status,
    targetId: email.targetId,
    generationMetadata: email.generationMetadata,
    target: email.target,
    followups: email.followups.map((f) => ({
      id: f.id,
      type: f.type,
      sendAt: f.sendAt.toISOString(),
      status: f.status,
    })),
  });
}

type PatchBody = {
  subject?: string;
  body?: string;
};

export async function PATCH(
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
  const existing = await prisma.email.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subject = typeof body.subject === "string" ? body.subject : undefined;
  const textBody = typeof body.body === "string" ? body.body : undefined;
  if (subject === undefined && textBody === undefined) {
    return NextResponse.json(
      { error: "Provide subject and/or body" },
      { status: 400 },
    );
  }

  const updated = await prisma.email.update({
    where: { id },
    data: {
      ...(subject !== undefined ? { subject } : {}),
      ...(textBody !== undefined ? { body: textBody } : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    subject: updated.subject,
    body: updated.body,
    angle: updated.angle,
    tone: updated.tone,
    generationMetadata: updated.generationMetadata,
  });
}
