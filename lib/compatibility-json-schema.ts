/**
 * OpenAI strict JSON schema for compatibility mapping (conceptual bridges).
 */

const senderEvidence = {
  type: "object",
  additionalProperties: false,
  properties: {
    source: { type: "string", enum: ["project", "experience", "skill"] },
    detail: { type: "string" },
  },
  required: ["source", "detail"],
} as const;

const targetEvidence = {
  type: "object",
  additionalProperties: false,
  properties: {
    source: { type: "string", enum: ["paper", "futureWork", "theme"] },
    detail: { type: "string" },
  },
  required: ["source", "detail"],
} as const;

const matchItem = {
  type: "object",
  additionalProperties: false,
  properties: {
    bridge: { type: "string" },
    senderEvidence,
    targetEvidence,
    conceptualOverlap: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium"] },
    suggestedAngles: {
      type: "array",
      items: {
        type: "string",
        enum: ["alignment", "contribution", "curiosity"],
      },
    },
  },
  required: [
    "bridge",
    "senderEvidence",
    "targetEvidence",
    "conceptualOverlap",
    "confidence",
    "suggestedAngles",
  ],
} as const;

export const COMPATIBILITY_MATCHING_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    matches: {
      type: "array",
      maxItems: 2,
      items: matchItem,
    },
  },
  required: ["matches"],
} as const;
