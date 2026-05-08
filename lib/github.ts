const GITHUB_API = "https://api.github.com";

export type GithubRepoSummary = {
  name: string;
  url: string;
  description: string;
  stars: number;
  language: string;
  readmeSnippet: string;
  recentlyActive: boolean;
};

export type GithubAggregated = {
  totalRepos: number;
  totalStars: number;
  primaryLanguages: string[];
  topRepos: GithubRepoSummary[];
  commitActivity90d: number;
  hasRealProjects: boolean;
};

type GhHeaders = Record<string, string>;

function githubHeaders(): GhHeaders {
  const h: GhHeaders = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

async function ghFetch(path: string): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(),
    next: { revalidate: 0 },
  });
}

export type GithubUserProfile = {
  login: string;
  name: string | null;
  bio: string | null;
  publicRepos: number;
  followers: number;
};

export async function getUserProfile(
  username: string,
): Promise<GithubUserProfile | null> {
  const res = await ghFetch(`/users/${encodeURIComponent(username)}`);
  if (!res.ok) return null;
  const j = (await res.json()) as {
    login: string;
    name: string | null;
    bio: string | null;
    public_repos: number;
    followers: number;
  };
  return {
    login: j.login,
    name: j.name,
    bio: j.bio,
    publicRepos: j.public_repos,
    followers: j.followers,
  };
}

type RepoListItem = {
  name: string;
  description: string | null;
  fork: boolean;
  private: boolean;
  stargazers_count: number;
  pushed_at: string | null;
};

export async function getUserRepos(username: string): Promise<RepoListItem[]> {
  const out: RepoListItem[] = [];
  for (let page = 1; page <= 3; page += 1) {
    const res = await ghFetch(
      `/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner&page=${page}&sort=updated`,
    );
    if (!res.ok) break;
    const batch = (await res.json()) as RepoListItem[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out.filter((r) => !r.fork && !r.private);
}

export async function getRepoLanguages(
  username: string,
  repo: string,
): Promise<Record<string, number>> {
  const res = await ghFetch(
    `/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/languages`,
  );
  if (!res.ok) return {};
  return (await res.json()) as Record<string, number>;
}

export async function getRepoReadme(
  username: string,
  repo: string,
): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/readme`,
    {
      headers: {
        ...githubHeaders(),
        Accept: "application/vnd.github.raw",
      },
      next: { revalidate: 0 },
    },
  );
  if (!res.ok) return "";
  const text = await res.text();
  return text.slice(0, 2000);
}

/** Approximate commit volume from public events in the last 90 days (PushEvent sizes). */
export async function getRecentCommits(username: string): Promise<number> {
  const cutoff = Date.now() - 90 * 86400000;
  let total = 0;
  for (let page = 1; page <= 3; page += 1) {
    const res = await ghFetch(
      `/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
    );
    if (!res.ok) break;
    const events = (await res.json()) as Array<{
      type: string;
      created_at: string;
      payload?: { size?: number; commits?: unknown[] };
    }>;
    if (!Array.isArray(events) || events.length === 0) break;
    for (const e of events) {
      if (new Date(e.created_at).getTime() < cutoff) continue;
      if (e.type !== "PushEvent") continue;
      const size = e.payload?.size;
      if (typeof size === "number" && size > 0) {
        total += size;
      } else if (Array.isArray(e.payload?.commits)) {
        total += e.payload.commits.length;
      }
    }
    if (events.length < 100) break;
  }
  return total;
}

function topLanguageFromBytes(langs: Record<string, number>): string {
  let best = "";
  let max = 0;
  for (const [k, v] of Object.entries(langs)) {
    if (v > max) {
      max = v;
      best = k;
    }
  }
  return best;
}

function mergeLanguageBytes(
  acc: Record<string, number>,
  langs: Record<string, number>,
): void {
  for (const [k, v] of Object.entries(langs)) {
    acc[k] = (acc[k] ?? 0) + v;
  }
}

function primaryLanguagesFromBytes(
  merged: Record<string, number>,
  limit: number,
): string[] {
  return Object.entries(merged)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

const ML_README_RE =
  /\b(torch|pytorch|tensorflow|tf\.|keras|sklearn|scikit|transformers|langchain|huggingface|jax|mlx|onnx)\b/i;
const WEB_README_RE =
  /\b(next\.?js|nextjs|react|vue\.?js|nuxt|svelte|express|remix|tanstack|webpack|vite)\b/i;

export function computeDomainCluster(data: GithubAggregated): string {
  const blob = [
    ...data.primaryLanguages,
    ...data.topRepos.map((r) => `${r.description} ${r.readmeSnippet}`),
  ]
    .join("\n")
    .toLowerCase();

  const pythonBytes = data.primaryLanguages.includes("Python");
  const jsTsTop =
    data.primaryLanguages[0] === "JavaScript" ||
    data.primaryLanguages[0] === "TypeScript" ||
    data.primaryLanguages.slice(0, 2).some((l) => l === "JavaScript" || l === "TypeScript");

  const mlHit = ML_README_RE.test(blob);
  const webHit = WEB_README_RE.test(blob);

  if ((pythonBytes || data.primaryLanguages[0] === "Python") && mlHit) {
    return "ml-heavy";
  }
  if (jsTsTop && webHit) {
    return "web-heavy";
  }
  if (mlHit && !webHit) {
    return "ml-heavy";
  }
  if (webHit && !mlHit) {
    return "web-heavy";
  }
  return "generalist";
}

function starsCredPoints(totalStars: number): number {
  if (totalStars <= 0) return 0;
  if (totalStars <= 9) return 5;
  if (totalStars <= 49) return 10;
  if (totalStars < 500) return 15;
  return 20;
}

export function computeCredibilityScore(data: GithubAggregated): number {
  let score = 0;
  if (data.hasRealProjects) score += 30;
  score += Math.min(30, data.commitActivity90d);
  score += starsCredPoints(data.totalStars);
  const longReadme = data.topRepos.some((r) => r.readmeSnippet.length > 500);
  if (longReadme) score += 20;
  return Math.min(100, Math.round(score));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function buildGithubData(username: string): Promise<GithubAggregated> {
  const empty: GithubAggregated = {
    totalRepos: 0,
    totalStars: 0,
    primaryLanguages: [],
    topRepos: [],
    commitActivity90d: 0,
    hasRealProjects: false,
  };

  const profile = await getUserProfile(username);
  if (!profile) return empty;

  const allRepos = await getUserRepos(username);
  const sorted = [...allRepos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count,
  );
  const top30 = sorted.slice(0, 30);

  const ninetyDaysAgo = Date.now() - 90 * 86400000;

  const mergedBytes: Record<string, number> = {};
  let totalStars = 0;
  for (const r of allRepos) {
    totalStars += r.stargazers_count;
  }

  const topRepos: GithubRepoSummary[] = [];

  for (const batch of chunk(top30, 5)) {
    const rows = await Promise.all(
      batch.map(async (r) => {
        const [langs, readme] = await Promise.all([
          getRepoLanguages(username, r.name),
          getRepoReadme(username, r.name),
        ]);
        mergeLanguageBytes(mergedBytes, langs);
        const pushed = r.pushed_at ? new Date(r.pushed_at).getTime() : 0;
        const recentlyActive = pushed >= ninetyDaysAgo;
        return {
          name: r.name,
          url: `https://github.com/${username}/${r.name}`,
          description: r.description ?? "",
          stars: r.stargazers_count,
          language: topLanguageFromBytes(langs),
          readmeSnippet: readme,
          recentlyActive,
        } satisfies GithubRepoSummary;
      }),
    );
    topRepos.push(...rows);
  }

  const commitActivity90d = await getRecentCommits(username);

  const repos5Plus = topRepos.filter((r) => r.stars >= 5).length;
  const meaningfulReadmes = topRepos.filter((r) => r.readmeSnippet.length >= 400).length;
  const hasRealProjects = repos5Plus >= 3 || meaningfulReadmes >= 2;

  return {
    totalRepos: profile.publicRepos,
    totalStars,
    primaryLanguages: primaryLanguagesFromBytes(mergedBytes, 5),
    topRepos,
    commitActivity90d,
    hasRealProjects,
  };
}
