import { IDENTITY_MODEL_JSON_SCHEMA } from "@/lib/identity-json-schema";

export const PROFILE_BUILD_SYSTEM = `You build concise student outreach profiles from structured inputs.`;

export function profileBuildUserPrompt(summary: string): string {
  return `Summarize this student context for cold outreach:\n${summary}`;
}

/** @deprecated Use {@link buildEmailGenerationSystem} + {@link formatEmailGenerationUserPrompt}. */
export const EMAIL_GENERATION_SYSTEM = `You write respectful, concise cold emails for academic and recruiter outreach.`;

/** @deprecated */
export function coldEmailUserPrompt(details: string): string {
  return `Draft a cold email from the student using:\n${details}`;
}

const EMAIL_GENERATION_SYSTEM_TEMPLATE = `You are writing a single cold email for a BTech student in India to a {{TARGET_TYPE}}. Your output is the email itself — subject + body.

FORMAT (inviolable):
- Exactly 3 paragraphs in the body, each separated by a blank line (\\n\\n). NEVER write a single block of text.
  Para 1 (~35-40 words): hook — open with a specific observation about their work or a shared problem
  Para 2 (~55-65 words): proof — sender's most relevant project/experience and the conceptual bridge to the target; if the project has a GitHub URL in the sender context, include it naturally (e.g. "...in github.com/user/project...") — never as a raw hyperlink tag
  Para 3 (~30-40 words): ask — one concrete, low-friction ask
- Total body: 120 to 150 words. Strict.
- Subject line: max 8 words, specific, references their actual work or a concrete artifact. NOT "Internship inquiry."

QUALITY CONSTRAINTS:
- Must include exactly ONE of: a micro-insight about their work, a mini-extension idea on their research, or a sharp relevant question
- Banned phrases (never use any of these):
  "I am interested in your research"
  "I would love to learn more"
  "I am writing to express my interest"
  "I hope this email finds you well"
  "I am a passionate student"
  "I am eager to contribute"
  Any sentence beginning with "I am writing"

ANGLE: {{ANGLE}}
- ALIGNMENT: open with shared problem space + sender's evidence
- CONTRIBUTION: open with target's specific paper/post → bridge to sender's work that extends it → concrete next-step ask
- CURIOSITY: open with a specific observation about target's work → ask a sharp follow-up question that shows depth → low-friction ask

TONE: {{TONE}}
- formal: you/your, no contractions, professional
- confident: direct claims, "I built X that does Y" (still respectful)
- curious: questions framed as genuine inquiry, not test

ASK GUIDELINES:
- Professors: 15-20 minute conversation, OR offer to share repo/work first
- Recruiters: 15 minute call, OR ask about specific role/team focus
- Never ask for "an opportunity" or "a chance"

Output JSON only: { "subject": "...", "body": "..." }`;

export type EmailGenerationAngle = "ALIGNMENT" | "CONTRIBUTION" | "CURIOSITY";
export type EmailGenerationTone = "FORMAL" | "CONFIDENT" | "CURIOUS";

export function buildEmailGenerationSystem(p: {
  targetTypeLabel: string;
  angle: EmailGenerationAngle;
  tone: EmailGenerationTone;
}): string {
  return EMAIL_GENERATION_SYSTEM_TEMPLATE.replace("{{TARGET_TYPE}}", p.targetTypeLabel)
    .replace("{{ANGLE}}", p.angle)
    .replace("{{TONE}}", p.tone);
}

export const EMAIL_GENERATION_USER_TEMPLATE = `EVIDENCE TO USE (use only what's here — do not invent):
{{COMPATIBILITY_MATCHES}}

SENDER (use selectively — pick the strongest single piece of evidence):
{{IDENTITY_SUMMARY}}

TARGET TASTE NOTES (use to match style + reference specifics):
{{TASTE_HIGHLIGHTS}}

Output JSON: { "subject": "...", "body": "..." }`;

export type EmailGenerationUserParams = {
  compatibilityMatchesJson: string;
  identitySummary: string;
  tasteHighlights: string;
};

export function formatEmailGenerationUserPrompt(
  p: EmailGenerationUserParams,
): string {
  return EMAIL_GENERATION_USER_TEMPLATE.replace(
    "{{COMPATIBILITY_MATCHES}}",
    p.compatibilityMatchesJson,
  )
    .replace("{{IDENTITY_SUMMARY}}", p.identitySummary)
    .replace("{{TASTE_HIGHLIGHTS}}", p.tasteHighlights);
}

export function formatEmailRegenerationAvoidPrompt(p: {
  baseUserPrompt: string;
  violations: string[];
}): string {
  const list = p.violations.map((v) => `- ${v}`).join("\n");
  return `${p.baseUserPrompt}

---
UNIQUENESS / BANNED PHRASES: A prior draft triggered these issues. Rewrite the entire email (new subject + body). Do NOT repeat or closely paraphrase these patterns:
${list}

Also avoid any sentence beginning with "I am writing", and stock phrases like "I am interested in", "I am passionate about", "I am excited about" your research/work.

Output JSON only: { "subject": "...", "body": "..." }`;
}

export const EMAIL_GENERATION_PROMPT = {
  buildSystem: buildEmailGenerationSystem,
  formatUser: formatEmailGenerationUserPrompt,
} as const;

export const EMAIL_VIOLATIONS_CHECK_SYSTEM = `You check cold-email drafts for banned stock phrases and generic "interest" language.

Does the email (subject + body together) contain any of the following — list each hit as a separate short string in "violations" (exact substring or pattern description)? If none, return "violations": [].

1) These exact banned phrases (any casing):
- "I am interested in your research"
- "I would love to learn more"
- "I am writing to express my interest"
- "I hope this email finds you well"
- "I am a passionate student"
- "I am eager to contribute"

2) Any sentence beginning with "I am writing" (after trimming).

3) Any sentence containing "I am interested in" or "I'm interested in" (generic interest, not a technical question).

4) Any sentence containing "I am passionate about" or "I'm passionate about" or "I am excited about" or "I'm excited about" (when used as generic enthusiasm, not a technical claim).

Return JSON only matching schema: { "violations": string[] }`;

const IDENTITY_SCHEMA_TEXT = JSON.stringify(IDENTITY_MODEL_JSON_SCHEMA);

/**
 * System instructions for GPT-4.1 structured identity extraction.
 * Pair with {@link formatIdentityBuildUserPrompt}.
 */
export const IDENTITY_BUILD_SYSTEM = `You are an expert technical recruiter and resume analyst. Your job is to extract a structured, evidence-based identity model from a candidate's resume and (optionally) their GitHub data. You are skeptical by default — you do not accept claims at face value. A skill is only "core" if there are multiple deep projects supporting it. "Strong" requires at least one meaningful project. "Familiar" is the default for anything else.

Aggressively rank skills by EVIDENCE, not by what is claimed on the resume. If the resume says "expert in ML" but no projects, coursework, or roles support it, rank that skill as "familiar" and add a redFlag describing the gap.

GitHub data is ground truth when present. If GitHub data shows zero ML-related repositories or README evidence but the resume claims ML/AI expertise, you MUST add a redFlag calling out that mismatch and rank ML-related skills no higher than "familiar" unless other non-GitHub resume evidence clearly supports them.

For each project, populate the "url" field with the GitHub repository URL (from the GitHub data's "url" field on matching repos). If no GitHub URL can be matched, set "url" to null. Only use URLs that actually appear in the provided GitHub data — never invent URLs.

You must return JSON matching this exact schema (also enforced by the API):
${IDENTITY_SCHEMA_TEXT}

Output ONLY the JSON object. No prose, no markdown fences.`;

export const IDENTITY_BUILD_USER_TEMPLATE = `Resume text:
{{RESUME_TEXT}}

GitHub data (may be empty):
{{GITHUB_DATA}}

Output ONLY the JSON object. No prose.`;

export function formatIdentityBuildUserPrompt(
  resumeText: string,
  githubData: string,
): string {
  return IDENTITY_BUILD_USER_TEMPLATE.replace("{{RESUME_TEXT}}", resumeText).replace(
    "{{GITHUB_DATA}}",
    githubData,
  );
}

/** Named bundle for docs / imports */
export const IDENTITY_BUILD_PROMPT = {
  system: IDENTITY_BUILD_SYSTEM,
  userTemplate: IDENTITY_BUILD_USER_TEMPLATE,
  formatUser: formatIdentityBuildUserPrompt,
} as const;

/**
 * Taste reconstruction — one-shot cached model of how the target thinks.
 * Pair with {@link formatTasteReconstructionUserPrompt}.
 */
export const TASTE_RECONSTRUCTION_SYSTEM = `You are an expert at "taste reconstruction" — building a model of how a specific person thinks, what they find impressive, and what kind of email would actually make them want to reply.

You are NOT writing an email. You are building a TASTE MODEL — a structured profile of the target's intellectual preferences.

CRITICAL RULES:
- The "impliedFutureWork" field is the most important. Look for what the target has hinted at as open problems, gaps, or future directions — especially in their own papers' future work sections, but also in posts, talks, or interviews.
- "Hooks" must be SPECIFIC and DEFENSIBLE. "Mention their ML interests" is NOT a hook. "Reference their 2024 paper's open question on cross-lingual transfer to code-switched data" IS a hook.
- "stylisticMarkers" should capture HOW they write. Do they use formal hedge language ("we suggest", "may indicate") or direct claims? Short punchy sentences or dense academic prose? Identifying this lets us match their style.
- "likelyTurnoffs" should be specific. "Generic praise" is too vague. "Praising the breadth of their work without engaging with any specific paper" is right.

You must return JSON matching the exact schema enforced by the API for this target type (professor includes "papers"; recruiter includes "hiringPattern").

Output ONLY the JSON object. No prose, no markdown fences.`;

export type TasteReconstructionUserParams = {
  type: "PROFESSOR" | "RECRUITER";
  name: string;
  organization: string;
  rawData: string;
};

export function formatTasteReconstructionUserPrompt(
  p: TasteReconstructionUserParams,
): string {
  return `Target type: ${p.type}
Target name: ${p.name}
Target organization: ${p.organization}

Source data:
${p.rawData}

Output ONLY the JSON. No prose.`;
}

export const TASTE_RECONSTRUCTION_PROMPT = {
  system: TASTE_RECONSTRUCTION_SYSTEM,
  formatUser: formatTasteReconstructionUserPrompt,
} as const;

/**
 * Compatibility mapping — non-obvious conceptual bridges for email spine.
 * Pair with {@link formatCompatibilityMappingUserPrompt}.
 */
export const COMPATIBILITY_MAPPING_SYSTEM = `You are an expert at finding NON-OBVIOUS conceptual overlaps between a sender's actual technical work and a target's intellectual taste.

You are given:
1. SENDER IDENTITY MODEL — what they've actually built and learned
2. TARGET TASTE MODEL — how the target thinks and what they care about

Your job: find at most 2 HIGH-CONFIDENCE bridges. A bridge must be:
- Specific to one project/paper, not domain-level
- Defensible — you can name the exact mechanism that's shared
- Non-obvious — "you both work in NLP" is NOT a bridge. "Your sub-word alignment work on Hinglish addresses the open problem they flagged in Section 4 of their 2024 cross-lingual transfer paper" IS a bridge.

Use "confidence" only as "high" or "medium". If no high-confidence bridge exists, return an empty "matches" array. Do not stretch. A bad bridge is worse than no bridge — it makes the user look desperate.

Return JSON matching the schema. Output only JSON.

For "suggestedAngles", pick from: alignment, contribution, curiosity — angles that would honestly work for this specific bridge.`;

export const COMPATIBILITY_MAPPING_USER_TEMPLATE = `SENDER:
{{IDENTITY_MODEL}}

TARGET:
{{TASTE_MODEL}}`;

export type CompatibilityMappingUserParams = {
  identityModel: string;
  tasteModel: string;
};

export function formatCompatibilityMappingUserPrompt(
  p: CompatibilityMappingUserParams,
): string {
  return COMPATIBILITY_MAPPING_USER_TEMPLATE.replace(
    "{{IDENTITY_MODEL}}",
    p.identityModel,
  ).replace("{{TASTE_MODEL}}", p.tasteModel);
}

export const COMPATIBILITY_MAPPING_PROMPT = {
  system: COMPATIBILITY_MAPPING_SYSTEM,
  userTemplate: COMPATIBILITY_MAPPING_USER_TEMPLATE,
  formatUser: formatCompatibilityMappingUserPrompt,
} as const;
