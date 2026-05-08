import { EmailStatus, FollowupStatus, FollowupType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/gmail";
import { isRecord } from "@/lib/email-generation-metadata";

export const maxDuration = 60;

type Body = { emailId?: string };

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const emailId = typeof body.emailId === "string" ? body.emailId.trim() : "";
  if (!emailId) {
    return NextResponse.json({ error: "Missing emailId" }, { status: 400 });
  }

  const email = await prisma.email.findFirst({
    where: { id: emailId, userId: user.id },
    include: { target: true },
  });
  if (!email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (email.status !== EmailStatus.DRAFT) {
    return NextResponse.json(
      { error: "Only draft emails can be sent." },
      { status: 400 },
    );
  }
  if (!email.target) {
    return NextResponse.json({ error: "Target missing" }, { status: 404 });
  }

  const to = email.target.email?.trim();
  if (!to) {
    return NextResponse.json(
      {
        error:
          "We don't have an email for this target yet. Please provide one.",
      },
      { status: 400 },
    );
  }

  let gmailResult: { messageId: string; threadId: string };
  try {
    gmailResult = await sendEmail({
      userId: user.id,
      to,
      subject: email.subject,
      body: email.body,
    });
  } catch (err) {
    console.error("[emails/send]", err);
    const msg = err instanceof Error ? err.message : "Gmail send failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const now = new Date();
  const day3 = new Date(now);
  day3.setDate(day3.getDate() + 3);
  const day7 = new Date(now);
  day7.setDate(day7.getDate() + 7);

  const prevMeta = isRecord(email.generationMetadata) ? email.generationMetadata : {};
  const nextMeta: Record<string, unknown> = {
    ...prevMeta,
    gmailMessageId: gmailResult.messageId,
    gmailThreadId: gmailResult.threadId,
    sentAt: now.toISOString(),
  };

  const txResults = await prisma.$transaction([
    prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.SENT,
        sentAt: now,
        generationMetadata: nextMeta as Prisma.InputJsonValue,
      },
    }),
    prisma.followup.create({
      data: {
        emailId,
        type: FollowupType.DAY3,
        sendAt: day3,
        status: FollowupStatus.QUEUED,
      },
    }),
    prisma.followup.create({
      data: {
        emailId,
        type: FollowupType.DAY7,
        sendAt: day7,
        status: FollowupStatus.QUEUED,
      },
    }),
  ]);
  const updated = txResults[0];

  const followups = await prisma.followup.findMany({
    where: { emailId },
    orderBy: { sendAt: "asc" },
  });

  return NextResponse.json({
    messageId: gmailResult.messageId,
    threadId: gmailResult.threadId,
    subject: updated.subject,
    body: updated.body,
    to,
    targetName: email.target.name,
    organization: email.target.organization,
    followups: followups.map((f) => ({
      id: f.id,
      type: f.type,
      sendAt: f.sendAt.toISOString(),
    })),
  });
}
