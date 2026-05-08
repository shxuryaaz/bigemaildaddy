import { openai } from "@/lib/openai";

const EMAIL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    email: { type: ["string", "null"] },
  },
  required: ["email"],
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

/**
 * Layer 2 — dedicated web search to find a target's email address.
 * Only returns an email that appears verbatim on a real page.
 */
export async function findTargetEmail(
  name: string,
  organization: string,
  type: "PROFESSOR" | "RECRUITER",
  knownProfileUrl?: string,
): Promise<string | null> {
  const profileHint = knownProfileUrl
    ? `\nKnown profile URL: ${knownProfileUrl}`
    : "";

  const instructions =
    type === "PROFESSOR"
      ? `You are an email-finding assistant. Find the professional email address for the professor described below.

Search strategy (try in order):
1. Search "${name}" "${organization}" email contact
2. Visit their Google Scholar profile — check the "Email verified at" field
3. Search the university directory page for "${organization}"
4. Check their faculty / department page for an @ address
${profileHint}

RULES:
- Only return an email that appears verbatim on a real, publicly accessible page.
- Do NOT guess patterns like firstname.lastname@domain.
- If you cannot find a confirmed email, return null.`
      : `You are an email-finding assistant. Find the professional email address for the recruiter / executive described below.

Search strategy (try in order):
1. Search "${name}" "${organization}" contact email
2. Check the company website Team / About page
3. Check LinkedIn if accessible
${profileHint}

RULES:
- Only return an email that appears verbatim on a real, publicly accessible page.
- Do NOT guess patterns like firstname.lastname@domain.
- If you cannot find a confirmed email, return null.`;

  const userPrompt = `Find the email for: ${name} at ${organization}. Output JSON only.`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    tools: [{ type: "web_search" }],
    tool_choice: "auto",
    instructions,
    input: userPrompt,
    text: {
      format: {
        type: "json_schema",
        name: "email_finder_result",
        strict: true,
        schema: { ...EMAIL_SCHEMA },
      },
    },
    max_output_tokens: 500,
    temperature: 0,
  });

  const raw = extractResponsesOutputText(response);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { email: string | null };
    const email = typeof parsed.email === "string" ? parsed.email.trim() : null;
    if (email && email.includes("@")) return email;
    return null;
  } catch {
    return null;
  }
}

/**
 * Layer 3 — Hunter.io email finder.
 * Silently returns null if HUNTER_API_KEY is absent.
 */
export async function findEmailHunterIo(
  firstName: string,
  lastName: string,
  domain: string,
): Promise<string | null> {
  const key = process.env.HUNTER_API_KEY;
  if (!key) return null;

  const url = new URL("https://api.hunter.io/v2/email-finder");
  url.searchParams.set("domain", domain);
  url.searchParams.set("first_name", firstName);
  url.searchParams.set("last_name", lastName);
  url.searchParams.set("api_key", key);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: { email?: string; score?: number };
  };

  const email = json.data?.email;
  const score = json.data?.score ?? 0;
  if (email && score >= 50) return email;
  return null;
}

const INDIAN_UNIVERSITY_DOMAINS: Record<string, string> = {
  "iit delhi": "iitd.ac.in",
  "iit bombay": "iitb.ac.in",
  "iit madras": "iitm.ac.in",
  "iit kanpur": "iitk.ac.in",
  "iit kharagpur": "iitkgp.ac.in",
  "iit roorkee": "iitr.ac.in",
  "iit guwahati": "iitg.ac.in",
  "iit hyderabad": "iith.ac.in",
  "iit bhu": "iitbhu.ac.in",
  "iit indore": "iiti.ac.in",
  "iit mandi": "iitmandi.ac.in",
  "iit ropar": "iitrpr.ac.in",
  "iit patna": "iitp.ac.in",
  "iisc bangalore": "iisc.ac.in",
  "iisc": "iisc.ac.in",
  "nit trichy": "nitt.edu",
  "nit warangal": "nitw.ac.in",
  "nit surathkal": "nitk.edu.in",
  "bits pilani": "pilani.bits-pilani.ac.in",
  "niet": "niet.co.in",
  "iiit hyderabad": "iiit.ac.in",
  "iiit delhi": "iiitd.ac.in",
  "delhi university": "du.ac.in",
  "jnu": "jnu.ac.in",
};

const STOPWORDS = new Set([
  "university", "institute", "of", "the", "technology", "college",
  "school", "center", "centre", "department", "national", "indian",
]);

/**
 * Best-effort domain guess for Hunter.io lookups.
 */
export function guessEmailDomain(
  organization: string,
  type: "PROFESSOR" | "RECRUITER",
): string | null {
  const lower = organization.toLowerCase().trim();

  const knownDomain = INDIAN_UNIVERSITY_DOMAINS[lower];
  if (knownDomain) return knownDomain;

  if (type === "PROFESSOR") {
    const isIndian =
      lower.includes("iit") ||
      lower.includes("nit") ||
      lower.includes("iiit") ||
      lower.includes("india") ||
      lower.includes("delhi") ||
      lower.includes("mumbai") ||
      lower.includes("chennai") ||
      lower.includes("kolkata") ||
      lower.includes("bangalore") ||
      lower.includes("hyderabad");

    const words = lower
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => !STOPWORDS.has(w) && w.length > 0);

    if (words.length === 0) return null;
    const slug = words.join(".");
    return isIndian ? `${slug}.ac.in` : `${slug}.edu`;
  }

  // Recruiter — company domain
  const slug = lower.replace(/[^a-z0-9]/g, "");
  return slug ? `${slug}.com` : null;
}
