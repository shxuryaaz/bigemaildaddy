import type { Email, Profile, Target } from "@prisma/client";
import { TargetType } from "@prisma/client";
import { packIdentitySummary, packTasteHighlights } from "@/lib/email-context-pack";
import { generateEmailWithQualityPasses } from "@/lib/email-generation-openai";
import type { EmailGenerationMeta } from "@/lib/email-generation-metadata";
import { parseCompatibilityMatches, resolveSelectedMatches } from "@/lib/email-match-resolve";
import {
  buildEmailGenerationSystem,
  formatEmailGenerationUserPrompt,
  type EmailGenerationAngle,
  type EmailGenerationTone,
} from "@/lib/prompts";

export async function regenerateEmailDraft(params: {
  target: Target;
  profile: Profile;
  angle: EmailGenerationAngle;
  tone: EmailGenerationTone;
  meta: EmailGenerationMeta;
  extraUserHint?: string;
}): Promise<{ subject: string; body: string }> {
  const { target, profile, angle, tone, meta, extraUserHint } = params;

  if (!profile.identityModel) {
    throw new Error("Missing identity model");
  }
  if (!target.tasteModel) {
    throw new Error("Missing taste model");
  }

  const all = parseCompatibilityMatches(meta.compatibilityMatches ?? []);
  const matchIds = meta.matchIds ?? [];
  const selected = resolveSelectedMatches(all, matchIds);

  if (!all.length && matchIds.length > 0) {
    throw new Error("Missing stored compatibility matches for refine");
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

  let userMessage = formatEmailGenerationUserPrompt({
    compatibilityMatchesJson:
      selected.length > 0 ? JSON.stringify(selected, null, 2) : "[]",
    identitySummary: packIdentitySummary(profile.identityModel),
    tasteHighlights: packTasteHighlights(target.tasteModel),
  });

  const rev = typeof meta.revision === "number" ? meta.revision : 0;
  if (extraUserHint) {
    userMessage += `\n\n${extraUserHint}`;
  } else {
    userMessage += `\n\nThis is refinement revision ${rev + 1}. Produce a fresh variation while keeping every factual claim tied to the evidence above.`;
  }

  const { draft } = await generateEmailWithQualityPasses({ system, user: userMessage });
  return draft;
}

export function emailAngleToGeneration(email: Email): EmailGenerationAngle {
  const a = email.angle;
  if (a === "ALIGNMENT" || a === "CONTRIBUTION" || a === "CURIOSITY") return a;
  return "ALIGNMENT";
}

export function emailToneToGeneration(email: Email): EmailGenerationTone {
  const t = email.tone;
  if (t === "FORMAL" || t === "CONFIDENT" || t === "CURIOUS") return t;
  return "FORMAL";
}
