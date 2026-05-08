/** OpenAI strict JSON for cold email draft output. */

export const EMAIL_DRAFT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
} as const;

export const EMAIL_VIOLATIONS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    violations: { type: "array", items: { type: "string" } },
  },
  required: ["violations"],
} as const;
