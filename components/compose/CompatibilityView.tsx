"use client";

import type { CompatibilityMatch } from "@/types";

type Props = {
  matches: CompatibilityMatch[];
  loading?: boolean;
  error?: string | null;
};

function labelSenderSource(s: CompatibilityMatch["senderEvidence"]["source"]): string {
  switch (s) {
    case "project":
      return "Project";
    case "experience":
      return "Experience";
    case "skill":
      return "Skill";
    default:
      return s;
  }
}

function labelTargetSource(s: CompatibilityMatch["targetEvidence"]["source"]): string {
  switch (s) {
    case "paper":
      return "Paper";
    case "futureWork":
      return "Future work";
    case "theme":
      return "Theme";
    default:
      return s;
  }
}

export default function CompatibilityView({ matches, loading, error }: Props) {
  if (loading) {
    return (
      <div className="border-[1.5px] border-[#1c1b17] bg-white px-5 py-8 text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
          Finding bridges
        </p>
        <p className="mt-2 text-sm text-[#5a5850]">
          Mapping your work to what this person actually cares about…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="border-[1.5px] border-[#7a4a10] bg-[#fff0d4] px-4 py-3 text-[13px] text-[#7a4a10]"
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="border-[1.5px] border-[#1c1b17] bg-[#faf8f4] px-5 py-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
          No strong bridge yet
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#5a5850]">
          We did not find a defensible, non-obvious overlap between your profile and
          this target’s taste model. A thin personalization line is worse than none —
          you can still draft from hooks in the taste model, or pick another target.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
          Conceptual bridges
        </p>
        <p
          className="mt-1 max-w-2xl text-lg font-semibold leading-snug tracking-tight text-[#1c1b17]"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          Specific overlaps that could anchor your email — not generic domain match.
        </p>
      </header>

      <ul className="space-y-4">
        {matches.map((m, i) => (
          <li
            key={`${m.bridge.slice(0, 48)}-${i}`}
            className="border-[1.5px] border-[#1c1b17] bg-white p-5"
          >
            <p
              className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]"
            >
              Bridge {i + 1} · {m.confidence} confidence
            </p>
            <p
              className="mt-3 text-lg font-semibold leading-snug text-[#1c1b17]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              <span className="text-[#5a5850]">Your</span>{" "}
              <span className="text-[#1c1b17]">{m.senderEvidence.detail}</span>
              <span className="mx-2 text-[#c8c4ba]">↔</span>
              <span className="text-[#5a5850]">Their</span>{" "}
              <span className="text-[#1c1b17]">{m.targetEvidence.detail}</span>
            </p>
            <p className="mt-4 text-[13px] leading-relaxed text-[#7a7568]">
              {m.conceptualOverlap}
            </p>
            <p
              className="mt-3 text-[12px] leading-relaxed text-[#5a5850]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              {m.bridge}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
              <span>
                {labelSenderSource(m.senderEvidence.source)} ·{" "}
                {labelTargetSource(m.targetEvidence.source)}
              </span>
              {m.suggestedAngles.length > 0 ? (
                <span className="text-[#c8c4ba]">·</span>
              ) : null}
              {m.suggestedAngles.map((a) => (
                <span
                  key={a}
                  className="border-[1.5px] border-[#c8c4ba] px-2 py-0.5 text-[#5a5850]"
                >
                  {a}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
