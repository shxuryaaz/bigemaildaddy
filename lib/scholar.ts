/**
 * Semantic Scholar Graph API helpers (same auth headers as target search).
 */

function s2Headers(): HeadersInit {
  const contact = process.env.SEMANTIC_SCHOLAR_CONTACT?.trim();
  const apiKey =
    process.env.SEMANTIC_SCHOLAR_API_KEY?.trim() ??
    process.env.S2_API_KEY?.trim();
  const h: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": contact
      ? `BigEmailDaddy/1.0 (mailto:${contact})`
      : "BigEmailDaddy/1.0 (https://github.com/)",
  };
  if (apiKey) {
    h["x-api-key"] = apiKey;
  }
  return h;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function s2Fetch(url: string, retries = 1): Promise<Response> {
  let res = await fetch(url, { headers: s2Headers(), cache: "no-store" });
  if (res.status === 429 && retries > 0) {
    await sleep(2500);
    res = await fetch(url, { headers: s2Headers(), cache: "no-store" });
  }
  return res;
}

export type ScholarAuthorHit = {
  authorId: string;
  name: string;
};

/** Best-effort author search; returns first hit or null. */
export async function searchAuthor(
  query: string,
): Promise<ScholarAuthorHit | null> {
  const fields = ["authorId", "name"].join(",");
  const url = `https://api.semanticscholar.org/graph/v1/author/search?query=${encodeURIComponent(query)}&limit=5&fields=${fields}`;
  const res = await s2Fetch(url);
  if (!res.ok) {
    console.error("[scholar] searchAuthor", res.status, await res.text().catch(() => ""));
    return null;
  }
  const json = (await res.json()) as { data?: Array<{ authorId: string; name: string }> };
  const first = json.data?.[0];
  if (!first?.authorId) return null;
  return { authorId: first.authorId, name: first.name };
}

export type AuthorPaperRow = {
  paperId: string;
  title: string;
  year: number;
  abstract: string;
};

/** Up to 20 papers for an author, newest by year first. */
export async function getAuthorPapers(
  authorId: string,
  limit = 20,
): Promise<AuthorPaperRow[]> {
  const fields = ["paperId", "title", "year", "abstract"].join(",");
  const url = `https://api.semanticscholar.org/graph/v1/author/${encodeURIComponent(authorId)}/papers?limit=${limit}&fields=${fields}`;
  const res = await s2Fetch(url);
  if (!res.ok) {
    console.error("[scholar] getAuthorPapers", res.status, await res.text().catch(() => ""));
    return [];
  }
  const json = (await res.json()) as {
    data?: Array<{
      paperId?: string;
      title?: string;
      year?: number;
      abstract?: string;
    }>;
  };
  const rows = (json.data ?? [])
    .filter((p) => p.paperId && p.title)
    .map((p) => ({
      paperId: p.paperId as string,
      title: p.title as string,
      year: typeof p.year === "number" ? p.year : 0,
      abstract: (p.abstract ?? "").trim(),
    }));
  rows.sort((a, b) => b.year - a.year);
  return rows.slice(0, limit);
}

function tldrToString(tldr: unknown): string {
  if (typeof tldr === "string") return tldr;
  if (tldr && typeof tldr === "object" && "text" in tldr) {
    const t = (tldr as { text?: string }).text;
    return typeof t === "string" ? t : "";
  }
  return "";
}

const FUTURE_WORK_PATTERNS = [
  /future work[:.]?\s*([^\n.]{20,400})/gi,
  /open (?:problems?|questions?|challenges?)[:.]?\s*([^\n.]{20,400})/gi,
  /we (?:plan|intend|leave|will) to\s+([^\n.]{20,400})/gi,
  /promising (?:direction|avenue|extension)s?[:.]?\s*([^\n.]{20,400})/gi,
];

export function extractFutureWorkMentions(text: string): string[] {
  const out = new Set<string>();
  const hay = text.replace(/\s+/g, " ").trim();
  if (!hay) return [];
  for (const re of FUTURE_WORK_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(hay)) !== null) {
      const chunk = (m[1] ?? m[0]).trim();
      if (chunk.length >= 20 && chunk.length <= 500) out.add(chunk);
    }
  }
  if (out.size === 0) {
    const idx = hay.toLowerCase().indexOf("future work");
    if (idx >= 0) {
      out.add(hay.slice(idx, Math.min(hay.length, idx + 350)).trim());
    }
  }
  return Array.from(out).slice(0, 8);
}

export type PaperDetails = {
  paperId: string;
  title: string;
  year: number;
  abstract: string;
  tldr: string;
  futureWorkMentions: string[];
};

export async function getPaperDetails(paperId: string): Promise<PaperDetails | null> {
  const fields = ["paperId", "title", "year", "abstract", "tldr"].join(",");
  const url = `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(paperId)}?fields=${fields}`;
  const res = await s2Fetch(url);
  if (!res.ok) {
    console.error("[scholar] getPaperDetails", paperId, res.status);
    return null;
  }
  const p = (await res.json()) as {
    paperId?: string;
    title?: string;
    year?: number;
    abstract?: string;
    tldr?: unknown;
  };
  if (!p.paperId) return null;
  const abstract = (p.abstract ?? "").trim();
  const tldr = tldrToString(p.tldr).trim();
  const fused = `${abstract}\n\n${tldr}`.trim();
  return {
    paperId: p.paperId,
    title: p.title ?? "",
    year: typeof p.year === "number" ? p.year : 0,
    abstract,
    tldr,
    futureWorkMentions: extractFutureWorkMentions(fused),
  };
}
