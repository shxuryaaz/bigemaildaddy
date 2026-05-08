import { TargetType } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type Body = {
  type?: string;
  name?: string;
  organization?: string;
  domain?: string;
  email?: string;
  rawData?: unknown;
};

export async function POST(request: Request) {
  try {
    await requireUser();
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

  const type =
    body.type === "RECRUITER" ? TargetType.RECRUITER : TargetType.PROFESSOR;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const organization =
    typeof body.organization === "string" ? body.organization.trim() : "";
  const email =
    typeof body.email === "string" && body.email.trim()
      ? body.email.trim()
      : undefined;
  const domain =
    typeof body.domain === "string" && body.domain.trim()
      ? body.domain.trim()
      : type === TargetType.PROFESSOR
        ? "academic"
        : "recruiting";

  if (!name || !organization) {
    return NextResponse.json(
      { error: "Missing name or organization" },
      { status: 400 },
    );
  }

  const existing = await prisma.target.findUnique({
    where: {
      name_organization: { name, organization },
    },
  });

  if (existing) {
    const fresh =
      existing.lastResearchedAt &&
      Date.now() - existing.lastResearchedAt.getTime() < THIRTY_DAYS_MS;
    if (email && !existing.email) {
      await prisma.target.update({ where: { id: existing.id }, data: { email } });
    }
    return NextResponse.json({
      targetId: existing.id,
      skipResearch: fresh,
      cached: fresh,
    });
  }

  const created = await prisma.target.create({
    data: {
      type,
      name,
      organization,
      domain,
      email,
      rawData: body.rawData === undefined ? undefined : (body.rawData as object),
    },
  });

  return NextResponse.json({
    targetId: created.id,
    skipResearch: false,
    cached: false,
  });
}
