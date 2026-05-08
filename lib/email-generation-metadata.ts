import type { CompatibilityMatch } from "@/types";

export type EmailGenerationMeta = {
  revision?: number;
  matchIds?: string[];
  compatibilityMatches?: CompatibilityMatch[];
  angle?: string;
  tone?: string;
  compatibilityMatchCount?: number;
  selectedCount?: number;
  violationsFound?: string[];
  violationRegenerated?: boolean;
  wordCountRegenerated?: boolean;
};

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseEmailGenerationMeta(raw: unknown): EmailGenerationMeta {
  if (!isRecord(raw)) return {};
  const matchIds = Array.isArray(raw.matchIds)
    ? raw.matchIds.filter((x): x is string => typeof x === "string")
    : undefined;
  const cm = Array.isArray(raw.compatibilityMatches)
    ? (raw.compatibilityMatches as CompatibilityMatch[])
    : undefined;
  const revRaw = raw.revision;
  const revision =
    typeof revRaw === "number"
      ? revRaw
      : Number.isFinite(Number(revRaw))
        ? Number(revRaw)
        : 0;
  return {
    revision,
    matchIds,
    compatibilityMatches: cm,
    angle: typeof raw.angle === "string" ? raw.angle : undefined,
    tone: typeof raw.tone === "string" ? raw.tone : undefined,
    compatibilityMatchCount:
      typeof raw.compatibilityMatchCount === "number"
        ? raw.compatibilityMatchCount
        : undefined,
    selectedCount: typeof raw.selectedCount === "number" ? raw.selectedCount : undefined,
    violationsFound: Array.isArray(raw.violationsFound)
      ? raw.violationsFound.filter((x): x is string => typeof x === "string")
      : undefined,
    violationRegenerated:
      typeof raw.violationRegenerated === "boolean"
        ? raw.violationRegenerated
        : undefined,
    wordCountRegenerated:
      typeof raw.wordCountRegenerated === "boolean"
        ? raw.wordCountRegenerated
        : undefined,
  };
}

export function bumpRevisionMetadata(
  base: unknown,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  const prev = isRecord(base) ? { ...base } : {};
  const prevRev =
    typeof prev.revision === "number"
      ? prev.revision
      : Number.isFinite(Number(prev.revision))
        ? Number(prev.revision)
        : 0;
  return { ...prev, ...extra, revision: prevRev + 1 };
}
