/**
 * OpenAI Structured Outputs (strict) schema for IdentityModel (`types/index.ts`).
 * Subset rules: https://platform.openai.com/docs/guides/structured-outputs
 */
export const IDENTITY_MODEL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    basics: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        education: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              school: { type: "string" },
              degree: { type: "string" },
              year: { type: "string" },
            },
            required: ["school", "degree", "year"],
          },
        },
      },
      required: ["name", "email", "education"],
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          rank: {
            type: "string",
            enum: ["core", "strong", "familiar"],
          },
          evidence: { type: "string" },
        },
        required: ["name", "rank", "evidence"],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          domain: { type: "string" },
          depth: {
            type: "string",
            enum: ["shallow", "meaningful", "deep"],
          },
          tech: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["name", "description", "domain", "depth", "tech"],
      },
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          role: { type: "string" },
          org: { type: "string" },
          duration: { type: "string" },
          highlights: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["role", "org", "duration", "highlights"],
      },
    },
    domains: {
      type: "array",
      items: { type: "string" },
    },
    redFlags: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "basics",
    "skills",
    "projects",
    "experience",
    "domains",
    "redFlags",
  ],
} as const;
