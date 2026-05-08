import { openai } from "@/lib/openai";
import type { EmailGenerationAngle, EmailGenerationTone } from "@/lib/prompts";

const SENTENCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    replacement: { type: "string" },
  },
  required: ["replacement"],
} as const;

const SYSTEM = `You rewrite ONE sentence from a cold email so it matches the given angle and tone, stays factual, and avoids generic stock phrases ("I am interested", "I hope this email finds you well", "I am writing to", "passionate student", etc.).

Output JSON only: { "replacement": "..." } — the replacement must be a single sentence (no newlines). Same approximate length as the original unless the original was bloated, then tighten.`;

export async function rewriteEmailSentence(params: {
  sentence: string;
  fullBody: string;
  subject: string;
  angle: EmailGenerationAngle;
  tone: EmailGenerationTone;
}): Promise<string> {
  const user = `Subject: ${params.subject}
Angle: ${params.angle}
Tone: ${params.tone}

Full email body (for context only — do not output this):
---
${params.fullBody}
---

Rewrite ONLY this sentence (keep meaning and specificity; improve voice):
---
${params.sentence}
---

Return JSON: { "replacement": "..." }`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.45,
    max_tokens: 200,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "SentenceReplacement",
        strict: true,
        schema: { ...SENTENCE_SCHEMA },
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty sentence rewrite");
  const parsed = JSON.parse(raw) as { replacement?: string };
  const rep = typeof parsed.replacement === "string" ? parsed.replacement.trim() : "";
  if (!rep) throw new Error("Invalid sentence rewrite");
  return rep.replace(/\n+/g, " ").trim();
}
