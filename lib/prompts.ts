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

const EMAIL_GENERATION_SYSTEM_TEMPLATE = `You are writing a cold email from a BTech student in India to a {{TARGET_TYPE}}. Your goal is an email that reads like a real person wrote it — not AI, not a template, not a LinkedIn message blast.

FORMAT:
- 2 to 3 short paragraphs separated by a blank line (\\n\\n). Vary sentence length within paragraphs.
- Total body: 90 to 130 words. Tighter is better.
- Subject line: 5-8 words, specific to their actual work. Avoid colons and em-dashes in the subject. NOT "Quick question" or "Internship inquiry."

SOUND HUMAN — these are the things that make emails read as AI-generated; avoid all of them:
- Do NOT open with a compliment about the target ("Your background is...", "I came across your profile...", "I noticed your impressive...")
- Do NOT write in perfect parallel structure (three balanced sentences, each the same length)
- Do NOT use these phrases: "unusual combination", "hard mix", "rigour", "I am eager", "I am passionate", "I would love to", "I am writing to", "I hope this finds you", "I am interested in your", "I am excited about"
- Do NOT praise their background and then make an ask — that is the AI cold email pattern everyone recognises
- Do NOT list things in triplets: "X, Y, and Z" in every paragraph
- Use contractions where natural (I've, you've, it's, don't) unless FORMAL tone
- One sentence can be a fragment or have an aside in em-dash or parenthesis — that's fine

ANGLE: {{ANGLE}}
- ALIGNMENT: lead with a shared problem or gap you both care about — sender's evidence first, then the bridge
- CONTRIBUTION: reference one specific thing they made (paper, post, project) → what it made you think → your adjacent work
- CURIOSITY: ask one genuinely specific question that reveals you've actually read their work — not a compliment dressed as a question

TONE: {{TONE}}
- formal: no contractions, professional register — but still specific, not stiff
- confident: direct first-person claims ("I built X to do Y"), no hedging
- curious: genuine inquiry tone; questions feel real, not rhetorical

PROOF (when including a project):
- Mention what you actually built and what it does in one clause
- If a GitHub URL is in the sender context, drop it naturally inline (e.g. "github.com/user/project") — not as a hyperlink tag, not bolded

ASK GUIDELINES:
- Professors: ask for a 15-min chat OR offer to share your work for their reaction — not both
- Recruiters: ask about a specific team/role or a 15-min call — not both
- The ask must be one sentence. Never ask for "an opportunity" or "a chance"

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
REWRITE REQUIRED: A prior draft was flagged for these issues. Write a completely different email — new opening, new structure, new subject. Do NOT repeat or closely paraphrase these patterns:
${list}

Hard rules for this rewrite:
- Do not open by complimenting the target's background or profile
- Do not use parallel sentence structure (three similar-length sentences in a row)
- Do not use: "unusual combination", "hard mix", "I am writing", "I am interested in", "I am passionate about", "I am excited about"
- Make it sound like it was typed by a real person in a hurry, not assembled by a system

Output JSON only: { "subject": "...", "body": "..." }`;
}

export const EMAIL_GENERATION_PROMPT = {
  buildSystem: buildEmailGenerationSystem,
  formatUser: formatEmailGenerationUserPrompt,
} as const;

export const EMAIL_VIOLATIONS_CHECK_SYSTEM = `You check cold-email drafts for banned phrases and AI-obvious patterns.

Does the email (subject + body together) contain any of the following? List each hit as a short string in "violations". If none, return "violations": [].

1) Banned stock phrases (any casing):
- "I am interested in your research"
- "I would love to learn more"
- "I am writing to express my interest"
- "I hope this email finds you well"
- "I am a passionate student"
- "I am eager to contribute"
- "unusual combination"
- "hard mix"
- "with rigour" / "same rigour"

2) Any sentence beginning with "I am writing" (after trimming).

3) Any sentence containing "I am interested in" or "I'm interested in" (generic interest).

4) Any sentence containing "I am passionate about" or "I'm passionate about" or "I am excited about" or "I'm excited about" (generic enthusiasm, not a technical claim).

5) An opening sentence that compliments the target's background or profile before making any other point (e.g. "Your background is...", "I came across your profile and...", "I noticed your impressive...").

6) Three consecutive sentences of nearly identical length (±5 words each) — a sign of AI parallel structure.

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
