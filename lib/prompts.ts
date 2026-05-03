import { IDENTITY_MODEL_JSON_SCHEMA } from "@/lib/identity-json-schema";

export const PROFILE_BUILD_SYSTEM = `You build concise student outreach profiles from structured inputs.`;

export function profileBuildUserPrompt(summary: string): string {
  return `Summarize this student context for cold outreach:\n${summary}`;
}

export const EMAIL_GENERATION_SYSTEM = `You write respectful, concise cold emails for academic and recruiter outreach.`;

export function coldEmailUserPrompt(details: string): string {
  return `Draft a cold email from the student using:\n${details}`;
}

const IDENTITY_SCHEMA_TEXT = JSON.stringify(IDENTITY_MODEL_JSON_SCHEMA);

/**
 * System instructions for GPT-4.1 structured identity extraction.
 * Pair with {@link formatIdentityBuildUserPrompt}.
 */
export const IDENTITY_BUILD_SYSTEM = `You are an expert technical recruiter and resume analyst. Your job is to extract a structured, evidence-based identity model from a candidate's resume and (optionally) their GitHub data. You are skeptical by default — you do not accept claims at face value. A skill is only "core" if there are multiple deep projects supporting it. "Strong" requires at least one meaningful project. "Familiar" is the default for anything else.

Aggressively rank skills by EVIDENCE, not by what is claimed on the resume. If the resume says "expert in ML" but no projects, coursework, or roles support it, rank that skill as "familiar" and add a redFlag describing the gap.

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
