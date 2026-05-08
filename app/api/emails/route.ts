import { EmailStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  const emails = await prisma.email.findMany({
    where: {
      userId: user.id,
      ...(statusParam === "SENT" ? { status: EmailStatus.SENT } : {}),
    },
    orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      target: {
        select: { id: true, name: true, email: true, organization: true },
      },
    },
  });

  return NextResponse.json({
    emails: emails.map((e) => ({
      id: e.id,
      subject: e.subject,
      body: e.body,
      status: e.status,
      sentAt: e.sentAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      angle: e.angle,
      tone: e.tone,
      target: e.target,
    })),
  });
}
