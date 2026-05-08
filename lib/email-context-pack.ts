import type { IdentityModel, TasteModel } from "@/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Compact sender context for the email model (no invention beyond this text). */
export function packIdentitySummary(identity: unknown): string {
  if (!isRecord(identity)) return "(No identity model.)";
  const im = identity as Partial<IdentityModel>;
  const lines: string[] = [];
  if (im.basics?.name) lines.push(`Name: ${im.basics.name}`);
  if (Array.isArray(im.domains) && im.domains.length) {
    lines.push(`Domains: ${im.domains.join(", ")}`);
  }
  if (Array.isArray(im.skills)) {
    const top = im.skills
      .filter((s) => s.rank === "core" || s.rank === "strong")
      .slice(0, 5)
      .map((s) => `${s.name} (${s.rank}): ${s.evidence}`);
    if (top.length) lines.push(`Skills:\n${top.join("\n")}`);
  }
  if (Array.isArray(im.projects)) {
    const projs = im.projects
      .filter((p) => p.depth !== "shallow")
      .slice(0, 4)
      .map((p) => {
        const urlPart = (p as { url?: string | null }).url
          ? ` | GitHub: ${(p as { url: string }).url}`
          : "";
        return `- ${p.name} [${p.depth}] (${p.domain})${urlPart}: ${p.description} Tech: ${(p.tech ?? []).join(", ")}`;
      });
    if (projs.length) lines.push(`Projects:\n${projs.join("\n")}`);
  }
  if (Array.isArray(im.experience)) {
    const ex = im.experience.slice(0, 3).map((e) => {
      const h = (e.highlights ?? []).slice(0, 2).join(" | ");
      return `- ${e.role} @ ${e.org} (${e.duration}): ${h}`;
    });
    if (ex.length) lines.push(`Experience:\n${ex.join("\n")}`);
  }
  if (Array.isArray(im.redFlags) && im.redFlags.length) {
    lines.push(`Red flags (do not overclaim past these): ${im.redFlags.join("; ")}`);
  }
  return lines.join("\n\n") || "(Empty identity.)";
}

/** Target taste fields most useful for tone + specifics (JSON string in prompt). */
export function packTasteHighlights(taste: unknown): string {
  if (!isRecord(taste)) return "{}";
  const t = taste as Partial<TasteModel>;
  const pack = {
    coreThemes: t.intellectualSignature?.coreThemes ?? [],
    stylisticMarkers: t.intellectualSignature?.stylisticMarkers ?? [],
    rigorIndicators: t.intellectualSignature?.rigorIndicators ?? [],
    impliedFutureWork: t.unstatedPreferences?.impliedFutureWork ?? [],
    likelyTurnoffs: t.unstatedPreferences?.likelyTurnoffs ?? [],
    hooks: (t.hooks ?? []).slice(0, 5).map((h) => ({
      angle: h.angle,
      reasoning: h.reasoning,
    })),
    papers: (t.papers ?? []).slice(0, 4).map((p) => ({
      title: p.title,
      year: p.year,
      coreClaim: p.coreClaim,
      futureWorkExtracted: (p.futureWorkExtracted ?? []).slice(0, 4),
    })),
    hiringPattern: t.hiringPattern,
  };
  return JSON.stringify(pack, null, 2);
}
