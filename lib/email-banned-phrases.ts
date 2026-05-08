/** Exact banned stock phrases (case-insensitive match). */
export const BANNED_EMAIL_SNIPPETS = [
  "I am interested in your research",
  "I would love to learn more",
  "I am writing to express my interest",
  "I hope this email finds you well",
  "I am a passionate student",
  "I am eager to contribute",
] as const;

/** Generic "interest / passion / excitement" openers (case-insensitive). */
const GENERIC_INTEREST_RE =
  /\b(?:I am|I'm)\s+(?:interested in|passionate about|excited about)\b/gi;

/** "I am writing" / "I'm writing" stock phrasing. */
const I_AM_WRITING_RE = /\b(?:I\s*am\s+writing|I\s*'?m\s+writing)\b/gi;

export type BannedRange = { start: number; end: number };

function mergeRanges(ranges: BannedRange[]): BannedRange[] {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out: BannedRange[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = out[out.length - 1];
    if (cur.start <= last.end) last.end = Math.max(last.end, cur.end);
    else out.push({ ...cur });
  }
  return out;
}

/** Ranges in `text` to underline as banned (for editor overlay). */
export function findBannedPhraseRanges(text: string): BannedRange[] {
  const hay = text;
  const lower = hay.toLowerCase();
  const ranges: BannedRange[] = [];

  for (const snippet of BANNED_EMAIL_SNIPPETS) {
    const s = snippet.toLowerCase();
    let from = 0;
    while (from < lower.length) {
      const idx = lower.indexOf(s, from);
      if (idx === -1) break;
      ranges.push({ start: idx, end: idx + snippet.length });
      from = idx + 1;
    }
  }

  let m: RegExpExecArray | null;
  const gi = new RegExp(GENERIC_INTEREST_RE.source, "gi");
  while ((m = gi.exec(hay)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }

  const iw = new RegExp(I_AM_WRITING_RE.source, "gi");
  while ((m = iw.exec(hay)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }

  return mergeRanges(ranges);
}
