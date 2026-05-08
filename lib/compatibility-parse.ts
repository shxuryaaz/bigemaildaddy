import type { CompatibilityMatch } from "@/types";

const SENDER_SOURCES = new Set(["project", "experience", "skill"]);
const TARGET_SOURCES = new Set(["paper", "futureWork", "theme"]);
const ANGLES = new Set(["alignment", "contribution", "curiosity"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseSuggestedAngles(v: unknown): CompatibilityMatch["suggestedAngles"] {
  if (!Array.isArray(v)) return [];
  const out: CompatibilityMatch["suggestedAngles"] = [];
  for (const x of v) {
    if (typeof x === "string" && ANGLES.has(x)) {
      out.push(x as CompatibilityMatch["suggestedAngles"][number]);
    }
  }
  return out;
}

function parseEvidence(
  v: unknown,
  sourceSet: Set<string>,
): { source: string; detail: string } | null {
  if (!isRecord(v)) return null;
  const source = v.source;
  const detail = v.detail;
  if (typeof source !== "string" || !sourceSet.has(source)) return null;
  if (typeof detail !== "string" || !detail.trim()) return null;
  return { source, detail: detail.trim() };
}

/** Normalize model output: drop invalid entries, cap at 2, drop unknown confidence. */
export function parseCompatibilityMatches(raw: string): CompatibilityMatch[] {
  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    return [];
  }
  if (!isRecord(data) || !Array.isArray(data.matches)) return [];

  const out: CompatibilityMatch[] = [];
  for (const m of data.matches) {
    if (!isRecord(m)) continue;
    const bridge = m.bridge;
    const conceptualOverlap = m.conceptualOverlap;
    const confidence = m.confidence;
    if (typeof bridge !== "string" || !bridge.trim()) continue;
    if (typeof conceptualOverlap !== "string" || !conceptualOverlap.trim()) continue;
    if (confidence !== "high" && confidence !== "medium") continue;

    const senderEvidence = parseEvidence(m.senderEvidence, SENDER_SOURCES);
    const targetEvidence = parseEvidence(m.targetEvidence, TARGET_SOURCES);
    if (!senderEvidence || !targetEvidence) continue;

    out.push({
      bridge: bridge.trim(),
      senderEvidence: {
        source: senderEvidence.source as CompatibilityMatch["senderEvidence"]["source"],
        detail: senderEvidence.detail,
      },
      targetEvidence: {
        source: targetEvidence.source as CompatibilityMatch["targetEvidence"]["source"],
        detail: targetEvidence.detail,
      },
      conceptualOverlap: conceptualOverlap.trim(),
      confidence,
      suggestedAngles: parseSuggestedAngles(m.suggestedAngles),
    });
    if (out.length >= 2) break;
  }
  return out;
}
