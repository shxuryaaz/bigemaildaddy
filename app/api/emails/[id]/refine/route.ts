import { EmailAngle, EmailTone, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { bumpRevisionMetadata, parseEmailGenerationMeta } from "@/lib/email-generation-metadata";
import {
  emailAngleToGeneration,
  emailToneToGeneration,
  regenerateEmailDraft,
} from "@/lib/email-regenerate-from-context";
import { prisma } from "@/lib/db";

export const maxDuration = 120;

const ANGLES = new Set(["ALIGNMENT", "CONTRIBUTION", "CURIOSITY"]);
const TONES = new Set(["FORMAL", "CONFIDENT", "CURIOUS"]);

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

type RefineBody = {
  action?: string;
  newTone?: string;
  newAngle?: string;
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
  const email = await prisma.email.findFirst({
    where: { id, userId: user.id },
    include: { target: true },
  });
  if (!email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: RefineBody;
  try {
    body = (await request.json()) as RefineBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  if (!["switch_tone", "regenerate", "change_angle"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile?.identityModel) {
    return NextResponse.json({ error: "Missing identity profile" }, { status: 422 });
  }
  if (!email.target) {
    return NextResponse.json({ error: "Target missing" }, { status: 404 });
  }
  if (!email.target.tasteModel) {
    return NextResponse.json({ error: "Missing target taste model" }, { status: 422 });
  }

  const meta = parseEmailGenerationMeta(email.generationMetadata);
  if (!Array.isArray(meta.compatibilityMatches)) {
    return NextResponse.json(
      {
        error:
          "This draft has no stored compatibility context. Generate a new email from compose to enable refine.",
      },
      { status: 422 },
    );
  }

  let nextAngle = emailAngleToGeneration(email);
  let nextTone = emailToneToGeneration(email);
  let extraHint: string | undefined;

  if (action === "switch_tone") {
    const nt = typeof body.newTone === "string" ? body.newTone.trim().toUpperCase() : "";
    if (!TONES.has(nt)) {
      return NextResponse.json({ error: "newTone required" }, { status: 400 });
    }
    nextTone = nt as typeof nextTone;
    extraHint = `Switch tone to ${nextTone}. Keep the same angle (${nextAngle}) and factual anchors.`;
  } else if (action === "change_angle") {
    const na = typeof body.newAngle === "string" ? body.newAngle.trim().toUpperCase() : "";
    if (!ANGLES.has(na)) {
      return NextResponse.json({ error: "newAngle required" }, { status: 400 });
    }
    nextAngle = na as typeof nextAngle;
    extraHint = `Change angle to ${nextAngle}. Keep tone ${nextTone} and the same evidence bundle.`;
  } else {
    extraHint =
      "Regenerate with the same angle and tone. Use a materially different opening and sentence rhythm while preserving evidence-backed claims.";
  }

  const metaForGen = {
    ...meta,
    angle: nextAngle,
    tone: nextTone,
  };

  let draft;
  try {
    draft = await regenerateEmailDraft({
      target: email.target,
      profile,
      angle: nextAngle,
      tone: nextTone,
      meta: metaForGen,
      extraUserHint: extraHint,
    });
  } catch (err) {
    console.error("[emails/refine]", err);
    return NextResponse.json({ error: "Refine generation failed" }, { status: 502 });
  }

  const newMeta = bumpRevisionMetadata(email.generationMetadata, {
    lastRefineAction: action,
    lastRefineAt: new Date().toISOString(),
    angle: nextAngle,
    tone: nextTone,
    compatibilityMatches: meta.compatibilityMatches,
    matchIds: meta.matchIds ?? [],
  });

  const updated = await prisma.email.update({
    where: { id },
    data: {
      subject: draft.subject,
      body: draft.body,
      angle: anglePrisma[nextAngle],
      tone: tonePrisma[nextTone],
      generationMetadata: newMeta as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({
    subject: updated.subject,
    body: updated.body,
    angle: updated.angle,
    tone: updated.tone,
    revision: (newMeta.revision as number) ?? 0,
    generationMetadata: updated.generationMetadata,
  });
}
