import { IDENTITY_MODEL_JSON_SCHEMA } from "@/lib/identity-json-schema";
import { openai } from "@/lib/openai";
import { IDENTITY_BUILD_PROMPT } from "@/lib/prompts";
import type { IdentityModel } from "@/types";

const MAX_RESUME_CHARS = 100_000;

export async function completeIdentityModel(
  resumeText: string,
  githubDataJson: string,
): Promise<IdentityModel> {
  const clipped =
    resumeText.length > MAX_RESUME_CHARS
      ? `${resumeText.slice(0, MAX_RESUME_CHARS)}\n\n[truncated for model context]`
      : resumeText;

  const userMessage = IDENTITY_BUILD_PROMPT.formatUser(clipped, githubDataJson);

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      { role: "system", content: IDENTITY_BUILD_PROMPT.system },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "IdentityModel",
        strict: true,
        schema: {
          ...IDENTITY_MODEL_JSON_SCHEMA,
        },
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty model response");
  }

  return JSON.parse(raw) as IdentityModel;
}
