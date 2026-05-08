import { openai } from "@/lib/openai";
import {
  COMPATIBILITY_MAPPING_SYSTEM,
  formatCompatibilityMappingUserPrompt,
} from "@/lib/prompts";
import { COMPATIBILITY_MATCHING_JSON_SCHEMA } from "@/lib/compatibility-json-schema";

const MODEL = "gpt-4.1";

export async function runCompatibilityMapping(
  identityModelJson: string,
  tasteModelJson: string,
): Promise<string> {
  const userMessage = formatCompatibilityMappingUserPrompt({
    identityModel: identityModelJson,
    tasteModel: tasteModelJson,
  });

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 3000,
    messages: [
      { role: "system", content: COMPATIBILITY_MAPPING_SYSTEM },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "CompatibilityMapping",
        strict: true,
        schema: { ...COMPATIBILITY_MATCHING_JSON_SCHEMA },
      },
    },
  });

  const usage = completion.usage;
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  console.log(
    "[compatibility-match]",
    JSON.stringify({
      model: MODEL,
      promptTokens,
      completionTokens,
      totalTokens: usage?.total_tokens ?? promptTokens + completionTokens,
    }),
  );

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty compatibility mapping response");
  }
  return raw;
}
