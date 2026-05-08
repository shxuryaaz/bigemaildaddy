import { openai } from "@/lib/openai";
import type { ProfessorSearchHit, RecruiterSearchHit } from "@/lib/compose-target";

export type {
  ProfessorSearchHit,
  RecruiterSearchHit,
  TargetSearchHit,
} from "@/lib/compose-target";

export { hitDedupeId } from "@/lib/compose-target";

const PROFESSOR_RESULTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    results: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          affiliation: { type: "string" },
          department: { type: "string" },
          researchAreas: { type: "array", items: { type: "string" } },
          profileUrl: { type: "string" },
          domain: { type: "string" },
          email: { type: ["string", "null"] },
        },
        required: ["name", "affiliation", "department", "researchAreas", "profileUrl", "domain", "email"],
      },
    },
  },
  required: ["results"],
} as const;

const RECRUITER_RESULTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    results: {
      type: "array",
      minItems: 0,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          company: { type: "string" },
          domain: { type: "string" },
          linkedinUrl: { type: "string" },
          email: { type: ["string", "null"] },
        },
        required: ["name", "role", "company", "domain", "linkedinUrl", "email"],
      },
    },
  },
  required: ["results"],
} as const;

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

export async function searchProfessorsWeb(
  query: string,
): Promise<ProfessorSearchHit[]> {
  const instructions = `You are a precise academic search assistant. Your job is to find real professors, researchers, or department heads based on the user's query.

The query can be:
- A person's name: "Andrew Ng" → find that specific individual on Google Scholar + faculty page
- A role + institution: "head of CSE NIT Noida" → find the actual person holding that role, then also find up to 4 other faculty in that department
- A topic + institution: "NLP professor IIT Delhi" → find multiple professors in that domain at that institution
- A company/org name without academic context: "Co-Founder Agilow" → search for all founders and key people at that organization

CRITICAL — MAXIMIZE RESULTS:
- For ANY query that mentions an institution, department, or organization: do not stop at one person. Search the department/company page and find as many relevant individuals as you can, up to 5.
- For a name query: find that person, then check if they have notable collaborators at the same institution worth including.
- NEVER return just 1 result unless you genuinely cannot find any others after thorough search.
- Return up to 5 distinct individuals. Each must have a non-empty name, affiliation, department, researchAreas (1–5 topics), profileUrl, and domain (e.g. "academic", "AI/ML", "startup", "SaaS" — reflect what the person actually does).
- If the faculty page or Google Scholar profile shows an email address, set "email" to it. Otherwise set "email" to null.`;

  const userPrompt = `Search query: "${query}"

Search thoroughly. If this mentions an institution, department, or company, find MULTIPLE people — not just the most prominent one. Return up to 5 distinct individuals. Output JSON only.`;

  const response = await openai.responses.create({
    model: "gpt-4.1",
    tools: [{ type: "web_search" }],
    tool_choice: "auto",
    instructions,
    input: userPrompt,
    text: {
      format: {
        type: "json_schema",
        name: "professor_search_results",
        strict: true,
        schema: { ...PROFESSOR_RESULTS_SCHEMA },
      },
    },
    max_output_tokens: 4000,
    temperature: 0.2,
  });

  const raw = extractResponsesOutputText(response);
  if (!raw) return [];
  let parsed: {
    results: Array<{
      name: string;
      affiliation: string;
      department: string;
      researchAreas: string[];
      profileUrl: string;
      domain: string;
      email: string | null;
    }>;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const results = Array.isArray(parsed.results) ? parsed.results : [];
  return results.slice(0, 5).map((r) => ({
    kind: "professor" as const,
    name: r.name,
    affiliation: r.affiliation,
    department: r.department,
    researchAreas: r.researchAreas ?? [],
    profileUrl: (r.profileUrl ?? "").trim(),
    organization: r.affiliation,
    domain: (r.domain ?? "academic").trim() || "academic",
    email: r.email ?? undefined,
  }));
}

export async function searchRecruitersWeb(
  query: string,
): Promise<RecruiterSearchHit[]> {
  const instructions = `You are a precise recruiter and hiring contact search assistant. Your job is to find the real people the user is looking for.

The query can be:
- A person's name: "Jane Smith" → find that specific individual on LinkedIn
- A role + company: "CEO of Agilow" → find who holds that role AND find other co-founders/executives at that company
- A company name: "Agilow team" or "Razorpay hiring" → find founders, recruiters, and key hiring contacts at that company
- A department/team: "recruiter at Google India" → find multiple matching hiring contacts

CRITICAL — MAXIMIZE RESULTS:
- For ANY query that mentions a company: do not stop at one person. Search the company's LinkedIn page, website, and Crunchbase to find all co-founders, executives, and hiring contacts — up to 5.
- For a role query like "CEO of X": find the CEO, then also look for other C-suite / co-founders at the same company.
- For a name query: find that person, then check if they have colleagues at the same company worth including.
- NEVER return just 1 result unless you genuinely cannot find any others after searching the company page.
- Each result must have non-empty name, role, company, domain (short label like "edtech", "SaaS", "AI", "fintech"), and linkedinUrl.
- If the LinkedIn profile or company page shows a contact email, set "email" to it. Otherwise set "email" to null.`;

  const userPrompt = `Search query: "${query}"

Search thoroughly. If this mentions a company, find MULTIPLE people there — not just the most prominent one. Check LinkedIn, Crunchbase, and the company website. Return up to 5 distinct individuals. Output JSON only.`;

  const response = await openai.responses.create({
    model: "gpt-4.1",
    tools: [{ type: "web_search" }],
    tool_choice: "auto",
    instructions,
    input: userPrompt,
    text: {
      format: {
        type: "json_schema",
        name: "recruiter_search_results",
        strict: true,
        schema: {
          ...RECRUITER_RESULTS_SCHEMA,
        },
      },
    },
    max_output_tokens: 4000,
    temperature: 0.2,
  });

  const raw = extractResponsesOutputText(response);
  if (!raw) return [];
  let parsed: { results: RecruiterSearchHit[] };
  try {
    parsed = JSON.parse(raw) as { results: RecruiterSearchHit[] };
  } catch {
    return [];
  }
  const results = Array.isArray(parsed.results) ? parsed.results : [];
  return results.slice(0, 5).map((r) => ({
    kind: "recruiter" as const,
    name: r.name,
    role: r.role,
    company: r.company,
    domain: r.domain,
    linkedinUrl: (r.linkedinUrl ?? "").trim(),
    organization: r.company,
    email: (r as { email?: string | null }).email ?? undefined,
  }));
}
