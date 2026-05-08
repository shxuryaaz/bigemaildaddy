import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { runCompatibilityMapping } from "@/lib/compatibility-openai";
import { parseCompatibilityMatches } from "@/lib/compatibility-parse";
import { prisma } from "@/lib/db";

export const maxDuration = 120;

type Body = { targetId?: string };

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

  const targetId = typeof body.targetId === "string" ? body.targetId.trim() : "";
  if (!targetId) {
    return NextResponse.json({ error: "Missing targetId" }, { status: 400 });
  }
  const profile = user.profile;
  if (!profile?.identityModel) {
    return NextResponse.json(
      { error: "Complete onboarding to build your identity profile first." },
      { status: 422 },
    );
  }

  const target = await prisma.target.findUnique({
    where: { id: targetId },
  });
  if (!target) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  if (!target.tasteModel) {
    return NextResponse.json(
      { error: "Target has no taste model yet. Run research for this target first." },
      { status: 422 },
    );
  }

  const identityJson = JSON.stringify(profile.identityModel);
  const tasteJson = JSON.stringify(target.tasteModel);

  let raw: string;
  try {
    raw = await runCompatibilityMapping(identityJson, tasteJson);
  } catch (err) {
    console.error("[compatibility-match]", err);
    return NextResponse.json(
      { error: "Could not compute compatibility matches." },
      { status: 502 },
    );
  }

  const matches = parseCompatibilityMatches(raw);
  return NextResponse.json({ matches });
}
