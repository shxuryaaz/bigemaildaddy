import { openai } from "@/lib/openai";
import {
  TASTE_RECONSTRUCTION_SYSTEM,
  formatTasteReconstructionUserPrompt,
} from "@/lib/prompts";
import {
  TASTE_MODEL_JSON_SCHEMA_PROFESSOR,
  TASTE_MODEL_JSON_SCHEMA_RECRUITER,
} from "@/lib/taste-model-json-schema";

/** Rough USD estimate for gpt-4.1 (adjust if pricing changes). */
const USD_PER_1M_INPUT = 2.5;
const USD_PER_1M_OUTPUT = 10;

export type TasteUsageCost = {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedUsd: number;
  at: string;
};

function estimateUsd(promptTokens: number, completionTokens: number): number {
  return (
    (promptTokens / 1e6) * USD_PER_1M_INPUT +
    (completionTokens / 1e6) * USD_PER_1M_OUTPUT
  );
}

function logTasteCost(
  label: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number },
  model: string,
  estimatedUsd: number,
): void {
  console.log(
    "[taste-research]",
    JSON.stringify({
      label,
      model,
      promptTokens: usage.prompt_tokens ?? 0,
      completionTokens: usage.completion_tokens ?? 0,
      totalTokens: usage.total_tokens ?? 0,
      estimatedUsd: Number(estimatedUsd.toFixed(4)),
    }),
  );
}

function extractResponsesOutputText(response: {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}): string {
  for (const item of response.output ?? []) {
    if (item.type !== "message" || !item.content) continue;
    for (const c of item.content) {
      if (c.type === "output_text" && c.text) return c.text;
    }
  }
  return "";
}

export async function runProfessorTasteReconstruction(
  targetName: string,
  targetOrg: string,
  sourceDataJson: string,
): Promise<{ tasteJson: string; cost: TasteUsageCost }> {
  const model = "gpt-4.1";
  const userMessage = formatTasteReconstructionUserPrompt({
    type: "PROFESSOR",
    name: targetName,
    organization: targetOrg,
    rawData: sourceDataJson,
  });

  // Use web_search so the model can look up the professor's actual papers,
  // Google Scholar profile, and recent work — no Semantic Scholar key required.
  const response = await openai.responses.create({
    model,
    temperature: 0.4,
    max_output_tokens: 8000,
    tools: [{ type: "web_search" }],
    tool_choice: "auto",
    instructions: TASTE_RECONSTRUCTION_SYSTEM,
    input: userMessage,
    text: {
      format: {
        type: "json_schema",
        name: "TasteModelProfessor",
        strict: true,
        schema: { ...TASTE_MODEL_JSON_SCHEMA_PROFESSOR },
      },
    },
  });

  const usage = response.usage;
  const promptTokens = usage?.input_tokens ?? 0;
  const completionTokens = usage?.output_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;
  const estimatedUsd = estimateUsd(promptTokens, completionTokens);
  logTasteCost(
    "professor",
    {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    },
    model,
    estimatedUsd,
  );

  const raw = extractResponsesOutputText(response);
  if (!raw) {
    throw new Error("Empty taste model response (professor)");
  }

  return {
    tasteJson: raw,
    cost: {
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedUsd,
      at: new Date().toISOString(),
    },
  };
}

export async function runRecruiterTasteReconstruction(
  targetName: string,
  targetOrg: string,
  sourceDataJson: string,
): Promise<{ tasteJson: string; cost: TasteUsageCost }> {
  const model = "gpt-4.1";
  const userMessage = formatTasteReconstructionUserPrompt({
    type: "RECRUITER",
    name: targetName,
    organization: targetOrg,
    rawData: sourceDataJson,
  });

  const response = await openai.responses.create({
    model,
    temperature: 0.4,
    max_output_tokens: 8000,
    tools: [{ type: "web_search" }],
    tool_choice: "auto",
    instructions: TASTE_RECONSTRUCTION_SYSTEM,
    input: userMessage,
    text: {
      format: {
        type: "json_schema",
        name: "TasteModelRecruiter",
        strict: true,
        schema: { ...TASTE_MODEL_JSON_SCHEMA_RECRUITER },
      },
    },
  });

  const usage = response.usage;
  const promptTokens = usage?.input_tokens ?? 0;
  const completionTokens = usage?.output_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;
  const estimatedUsd = estimateUsd(promptTokens, completionTokens);
  logTasteCost(
    "recruiter",
    {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    },
    model,
    estimatedUsd,
  );

  const raw = extractResponsesOutputText(response);
  if (!raw) {
    throw new Error("Empty taste model response (recruiter)");
  }

  return {
    tasteJson: raw,
    cost: {
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedUsd,
      at: new Date().toISOString(),
    },
  };
}
