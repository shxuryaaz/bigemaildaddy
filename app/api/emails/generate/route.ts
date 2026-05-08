import { EmailAngle, EmailStatus, EmailTone, TargetType } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { packIdentitySummary, packTasteHighlights } from "@/lib/email-context-pack";
import { generateEmailWithQualityPasses } from "@/lib/email-generation-openai";
import {
  buildEmailGenerationSystem,
  formatEmailGenerationUserPrompt,
  type EmailGenerationAngle,
  type EmailGenerationTone,
} from "@/lib/prompts";
import {
  parseCompatibilityMatches,
  resolveSelectedMatches,
} from "@/lib/email-match-resolve";
import { prisma } from "@/lib/db";

export const maxDuration = 120;

const ANGLES = new Set<string>(["ALIGNMENT", "CONTRIBUTION", "CURIOSITY"]);
const TONES = new Set<string>(["FORMAL", "CONFIDENT", "CURIOUS"]);

type Body = {
  targetId?: string;
  angle?: string;
  tone?: string;
  matchIds?: unknown;
  compatibilityMatches?: unknown;
};

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
  const angleRaw = typeof body.angle === "string" ? body.angle.trim().toUpperCase() : "";
  const toneRaw = typeof body.tone === "string" ? body.tone.trim().toUpperCase() : "";

  if (!targetId || !ANGLES.has(angleRaw) || !TONES.has(toneRaw)) {
    return NextResponse.json(
      { error: "Missing or invalid targetId, angle, or tone" },
      { status: 400 },
    );
  }

  const angle = angleRaw as EmailGenerationAngle;
  const tone = toneRaw as EmailGenerationTone;

  const anglePrisma: Record<string, EmailAngle> = {
    ALIGNMENT: EmailAngle.ALIGNMENT,
    CONTRIBUTION: EmailAngle.CONTRIBUTION,
    CURIOSITY: EmailAngle.CURIOSITY,
  };
  const tonePrisma: Record<string, EmailTone> = {
    FORMAL: EmailTone.FORMAL,
    CONFIDENT: EmailTone.CONFIDENT,
    CURIOUS: EmailTone.CURIOUS,
  };

  const matchIds = Array.isArray(body.matchIds)
    ? body.matchIds.filter((x): x is string => typeof x === "string")
    : [];

  const compatibilityMatches = parseCompatibilityMatches(body.compatibilityMatches);
  if (matchIds.length > 0 && compatibilityMatches.length === 0) {
    return NextResponse.json(
      { error: "compatibilityMatches required when matchIds is non-empty" },
      { status: 400 },
    );
  }

  const selected = resolveSelectedMatches(compatibilityMatches, matchIds);

  const profile = user.profile;
  if (!profile?.identityModel) {
    return NextResponse.json(
      { error: "Complete onboarding to build your identity profile first." },
      { status: 422 },
    );
  }

  const target = await prisma.target.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  if (!target.tasteModel) {
    return NextResponse.json(
      { error: "Target has no taste model yet. Run research first." },
      { status: 422 },
    );
  }

  const targetTypeLabel =
    target.type === TargetType.PROFESSOR
      ? "professor (faculty / academic researcher)"
      : "recruiter (hiring contact)";

  const system = buildEmailGenerationSystem({
    targetTypeLabel,
    angle,
    tone,
  });

  const userMessage = formatEmailGenerationUserPrompt({
    compatibilityMatchesJson:
      selected.length > 0 ? JSON.stringify(selected, null, 2) : "[]",
    identitySummary: packIdentitySummary(profile.identityModel),
    tasteHighlights: packTasteHighlights(target.tasteModel),
  });

  let result;
  try {
    result = await generateEmailWithQualityPasses({ system, user: userMessage });
  } catch (err) {
    console.error("[emails/generate]", err);
    return NextResponse.json(
      { error: "Email generation failed." },
      { status: 502 },
    );
  }

  const { draft, violationsFound, violationRegenerated, wordCountRegenerated } =
    result;

  const email = await prisma.email.create({
    data: {
      userId: user.id,
      targetId,
      angle: anglePrisma[angleRaw],
      tone: tonePrisma[toneRaw],
      subject: draft.subject,
      body: draft.body,
      status: EmailStatus.DRAFT,
      generationMetadata: {
        revision: 0,
        matchIds,
        compatibilityMatches,
        angle: angleRaw,
        tone: toneRaw,
        compatibilityMatchCount: compatibilityMatches.length,
        selectedCount: selected.length,
        violationsFound,
        violationRegenerated,
        wordCountRegenerated,
      },
    },
  });

  return NextResponse.json({
    subject: draft.subject,
    body: draft.body,
    emailId: email.id,
  });
}
