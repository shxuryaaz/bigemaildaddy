import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

type PatchBody = { email?: string };

async function ensureLinkedTarget(targetId: string, userId: string) {
  const linked = await prisma.email.findFirst({
    where: { userId, targetId },
    select: { id: true },
  });
  return linked;
}

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

  const { id: targetId } = context.params;
  const linked = await ensureLinkedTarget(targetId, user.id);
  if (!linked) {
    return NextResponse.json(
      { error: "You do not have a draft or email for this contact." },
      { status: 403 },
    );
  }

  const target = await prisma.target.findUnique({
    where: { id: targetId },
    select: { id: true, email: true, name: true, organization: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  return NextResponse.json(target);
}

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

  const { id: targetId } = context.params;

  const linked = await ensureLinkedTarget(targetId, user.id);
  if (!linked) {
    return NextResponse.json(
      { error: "You do not have a draft or email for this contact." },
      { status: 403 },
    );
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
  }

  const target = await prisma.target.update({
    where: { id: targetId },
    data: { email },
  });

  return NextResponse.json({
    id: target.id,
    email: target.email,
    name: target.name,
    organization: target.organization,
  });
}
