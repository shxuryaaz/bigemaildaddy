import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

type PatchBody = { email?: string };

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const { id: targetId } = context.params;
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
  try {
    await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const { id: targetId } = context.params;

  const exists = await prisma.target.findUnique({
    where: { id: targetId },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
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
