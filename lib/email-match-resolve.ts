import type { CompatibilityMatch } from "@/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isCompatibilityMatch(v: unknown): v is CompatibilityMatch {
  if (!isRecord(v)) return false;
  const se = v.senderEvidence;
  const te = v.targetEvidence;
  if (!isRecord(se) || !isRecord(te)) return false;
  return (
    typeof v.bridge === "string" &&
    typeof v.conceptualOverlap === "string" &&
    typeof v.confidence === "string" &&
    typeof se.source === "string" &&
    typeof se.detail === "string" &&
    typeof te.source === "string" &&
    typeof te.detail === "string" &&
    Array.isArray(v.suggestedAngles)
  );
}

export function parseCompatibilityMatches(raw: unknown): CompatibilityMatch[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isCompatibilityMatch);
}

export function resolveSelectedMatches(
  all: CompatibilityMatch[],
  matchIds: string[],
): CompatibilityMatch[] {
  if (!all.length) return [];
  const ids = matchIds.length > 0 ? matchIds : all.map((_, i) => String(i));
  const seen = new Set<number>();
  const out: CompatibilityMatch[] = [];
  for (const id of ids) {
    const i = Number.parseInt(id, 10);
    if (!Number.isInteger(i) || i < 0 || i >= all.length || seen.has(i)) continue;
    seen.add(i);
    out.push(all[i]);
  }
  return out;
}
