/**
 * OpenAI strict JSON schemas for TasteModel (professor vs recruiter variants).
 */

const intellectualSignature = {
  type: "object",
  additionalProperties: false,
  properties: {
    coreThemes: { type: "array", items: { type: "string" } },
    methodologicalLeaning: {
      type: "string",
      enum: ["theoretical", "applied", "mixed"],
    },
    stylisticMarkers: { type: "array", items: { type: "string" } },
    rigorIndicators: { type: "array", items: { type: "string" } },
  },
  required: [
    "coreThemes",
    "methodologicalLeaning",
    "stylisticMarkers",
    "rigorIndicators",
  ],
} as const;

const unstatedPreferences = {
  type: "object",
  additionalProperties: false,
  properties: {
    impliedFutureWork: { type: "array", items: { type: "string" } },
    pastAcceptedProfiles: { type: "array", items: { type: "string" } },
    likelyTurnoffs: { type: "array", items: { type: "string" } },
  },
  required: ["impliedFutureWork", "pastAcceptedProfiles", "likelyTurnoffs"],
} as const;

const hookItem = {
  type: "object",
  additionalProperties: false,
  properties: {
    angle: { type: "string" },
    reasoning: { type: "string" },
    requires: { type: "array", items: { type: "string" } },
  },
  required: ["angle", "reasoning", "requires"],
} as const;

const paperItem = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    year: { type: "number" },
    coreClaim: { type: "string" },
    futureWorkExtracted: { type: "array", items: { type: "string" } },
  },
  required: ["title", "year", "coreClaim", "futureWorkExtracted"],
} as const;

const hiringPattern = {
  type: "object",
  additionalProperties: false,
  properties: {
    seniority: { type: "string" },
    requiredSkills: { type: "array", items: { type: "string" } },
    successfulHireProfile: { type: "string" },
    problemSpace: { type: "string" },
  },
  required: ["seniority", "requiredSkills", "successfulHireProfile", "problemSpace"],
} as const;

export const TASTE_MODEL_JSON_SCHEMA_PROFESSOR = {
  type: "object",
  additionalProperties: false,
  properties: {
    intellectualSignature,
    unstatedPreferences,
    hooks: { type: "array", items: hookItem },
    papers: { type: "array", items: paperItem },
  },
  required: ["intellectualSignature", "unstatedPreferences", "hooks", "papers"],
} as const;

export const TASTE_MODEL_JSON_SCHEMA_RECRUITER = {
  type: "object",
  additionalProperties: false,
  properties: {
    intellectualSignature,
    unstatedPreferences,
    hooks: { type: "array", items: hookItem },
    hiringPattern,
  },
  required: [
    "intellectualSignature",
    "unstatedPreferences",
    "hooks",
    "hiringPattern",
  ],
} as const;
