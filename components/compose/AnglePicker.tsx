"use client";

import type { CompatibilityMatch } from "@/types";

export type EmailAngleChoice = "ALIGNMENT" | "CONTRIBUTION" | "CURIOSITY";

type CardDef = {
  id: EmailAngleChoice;
  title: string;
  blurb: string;
  bestFor: string;
  preview: string;
};

const CARDS: CardDef[] = [
  {
    id: "ALIGNMENT",
    title: "Alignment",
    blurb: "I already work in your space",
    bestFor:
      "You have credible overlap with their themes or methods, even without a paper-specific bridge.",
    preview:
      "Open with a concrete problem you have shipped against—then show it sits in the same constraint family they care about, with one specific cite.",
  },
  {
    id: "CONTRIBUTION",
    title: "Contribution",
    blurb: "I can extend or build on your specific work",
    bestFor:
      "You have a defensible bridge to an open direction they named (future work, limitations, or a cited gap).",
    preview:
      "Name their artifact (paper/post) in the first line, state the gap they left, then map your build to that gap with a narrow next step.",
  },
  {
    id: "CURIOSITY",
    title: "Curiosity",
    blurb: "I have a sharp question that shows depth",
    bestFor:
      "You have at least one conceptual bridge so the question is anchored in their specifics.",
    preview:
      "Lead with one precise observation about their mechanism or result, then one follow-up question that only someone who read carefully would ask.",
  },
];

function shorten(text: string, max = 60): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.lastIndexOf(" ", max);
  return clean.slice(0, cut > 20 ? cut : max) + "…";
}

function buildExample(
  angle: EmailAngleChoice,
  matches: CompatibilityMatch[],
): string | null {
  const relevant = matches.filter((m) =>
    m.suggestedAngles.includes(angle.toLowerCase() as "alignment" | "contribution" | "curiosity"),
  );
  const m = relevant[0] ?? matches[0];
  if (!m) return null;

  const you = shorten(m.senderEvidence.detail);
  const them = shorten(m.targetEvidence.detail);

  switch (angle) {
    case "ALIGNMENT":
      return `"I've been working on ${you} — which sits in the same space as ${them}."`;
    case "CONTRIBUTION":
      return `"Your work on ${them} — my experience with ${you} maps directly to that gap."`;
    case "CURIOSITY":
      return `"Reading about ${them}, I noticed a tension with ${you} — how do you reconcile these?"`;
  }
}

type Props = {
  value: EmailAngleChoice | null;
  onChange: (v: EmailAngleChoice) => void;
  matches: CompatibilityMatch[];
};

export function hasFutureWorkBridge(matches: CompatibilityMatch[]): boolean {
  return matches.some((m) => m.targetEvidence.source === "futureWork");
}

export default function AnglePicker({ value, onChange, matches }: Props) {
  const contributionDisabled = !hasFutureWorkBridge(matches);
  const curiosityDisabled = matches.length === 0;

  const disabled = (id: EmailAngleChoice): boolean => {
    if (id === "CONTRIBUTION") return contributionDisabled;
    if (id === "CURIOSITY") return curiosityDisabled;
    return false;
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
          Choose an angle
        </p>
        <p
          className="mt-1 max-w-2xl text-lg font-semibold leading-snug tracking-tight text-[#1c1b17]"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          Pick how you want to enter the conversation. This choice shapes the spine
          of the email.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map((c) => {
          const isDisabled = disabled(c.id);
          const selected = value === c.id;
          const example = !isDisabled ? buildExample(c.id, matches) : null;
          return (
            <button
              key={c.id}
              type="button"
              disabled={isDisabled}
              onClick={() => onChange(c.id)}
              className={`text-left border-[1.5px] border-[#1c1b17] p-5 transition-colors ${
                isDisabled
                  ? "cursor-not-allowed bg-[#f4f2ed] opacity-55"
                  : selected
                    ? "bg-[#1c1b17] text-[#f2efe8]"
                    : "bg-white hover:bg-[#faf8f4]"
              }`}
            >
              <p
                className={`text-[10px] font-medium uppercase tracking-[0.2em] ${
                  selected ? "text-[#c8c4ba]" : "text-[#8a8478]"
                }`}
              >
                {c.title}
              </p>
              <p
                className={`mt-2 text-[15px] font-semibold leading-snug ${
                  selected ? "text-[#f2efe8]" : "text-[#1c1b17]"
                }`}
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                {c.blurb}
              </p>
              <p
                className={`mt-3 text-[11px] leading-relaxed ${
                  selected ? "text-[#c8c4ba]" : "text-[#5a5850]"
                }`}
              >
                <span className="font-medium uppercase tracking-[0.2em]">
                  Best for:{" "}
                </span>
                {c.bestFor}
              </p>
              <p
                className={`mt-3 border-t pt-3 text-[11px] leading-relaxed ${
                  selected ? "border-[#5a5850] text-[#e8e4dc]" : "border-[#e8e4dc] text-[#7a7568]"
                }`}
              >
                <span className="font-medium uppercase tracking-[0.2em]">
                  Opening preview:{" "}
                </span>
                {c.preview}
              </p>
              {example ? (
                <p
                  className={`mt-3 border-t pt-3 text-[11px] italic leading-relaxed ${
                    selected ? "border-[#5a5850] text-[#d4d0c8]" : "border-[#e8e4dc] text-[#8a8478]"
                  }`}
                >
                  <span className="not-italic font-medium uppercase tracking-[0.2em]">
                    Your example:{" "}
                  </span>
                  {example}
                </p>
              ) : null}
              {c.id === "CONTRIBUTION" && contributionDisabled ? (
                <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#7a4a10]">
                  Needs a bridge tied to future work or an explicit open problem in
                  the evidence above.
                </p>
              ) : null}
              {c.id === "CURIOSITY" && curiosityDisabled ? (
                <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#7a4a10]">
                  Needs at least one conceptual bridge from the step above.
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
