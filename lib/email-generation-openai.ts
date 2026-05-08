import { openai } from "@/lib/openai";
import {
  EMAIL_VIOLATIONS_CHECK_SYSTEM,
  formatEmailRegenerationAvoidPrompt,
} from "@/lib/prompts";
import { EMAIL_DRAFT_JSON_SCHEMA, EMAIL_VIOLATIONS_JSON_SCHEMA } from "@/lib/email-json-schema";

const MODEL = "gpt-4.1";

export type EmailDraft = { subject: string; body: string };

function countWords(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

async function createDraft(
  system: string,
  user: string,
  temperature: number,
): Promise<EmailDraft> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature,
    max_tokens: 600,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "EmailDraft",
        strict: true,
        schema: { ...EMAIL_DRAFT_JSON_SCHEMA },
      },
    },
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty email draft");
  const parsed = JSON.parse(raw) as { subject?: string; body?: string };
  const subject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
  const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
  if (!subject || !body) throw new Error("Invalid email draft JSON");
  return { subject, body };
}

export async function checkEmailViolations(
  subject: string,
  body: string,
): Promise<string[]> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    max_tokens: 400,
    messages: [
      { role: "system", content: EMAIL_VIOLATIONS_CHECK_SYSTEM },
      {
        role: "user",
        content: `Subject:\n${subject}\n\nBody:\n${body}\n\nReturn JSON only.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "EmailViolations",
        strict: true,
        schema: { ...EMAIL_VIOLATIONS_JSON_SCHEMA },
      },
    },
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { violations?: unknown };
    if (!Array.isArray(parsed.violations)) return [];
    return parsed.violations.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  } catch {
    return [];
  }
}

export type GenerateEmailParams = {
  system: string;
  user: string;
};

export async function generateEmailWithQualityPasses(
  params: GenerateEmailParams,
): Promise<{
  draft: EmailDraft;
  violationsFound: string[];
  violationRegenerated: boolean;
  wordCountRegenerated: boolean;
}> {
  const baseUser = params.user;
  let user = baseUser;
  let draft = await createDraft(params.system, user, 0.7);

  let violationsFound = await checkEmailViolations(draft.subject, draft.body);
  let violationRegenerated = false;

  if (violationsFound.length > 0) {
    violationRegenerated = true;
    user = formatEmailRegenerationAvoidPrompt({
      baseUserPrompt: baseUser,
      violations: violationsFound,
    });
    draft = await createDraft(params.system, user, 0.55);
    violationsFound = await checkEmailViolations(draft.subject, draft.body);
  }

  let wordCountRegenerated = false;
  const words = countWords(draft.body);
  if (words < 120 || words > 150) {
    wordCountRegenerated = true;
    user = `${baseUser}\n\n---\nLENGTH FIX: Previous body was ${words} words. Rewrite so the BODY is strictly between 120 and 150 words (inclusive). Keep subject ≤8 words. Output JSON only.`;
    draft = await createDraft(params.system, user, 0.45);
  }

  return {
    draft,
    violationsFound,
    violationRegenerated,
    wordCountRegenerated,
  };
}

export { countWords };
