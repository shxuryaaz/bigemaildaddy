const WHY = [
  ["01", "Section-level specificity", 'Not "your research" — the exact open problem they named in print'],
  ["02", "Proof, not claims", 'GitHub repo as evidence, not "I\'m passionate about alignment"'],
  ["03", "Zero-risk ask", "Offer the repo first — they lose nothing saying yes"],
];

export default function EmailPreview() {
  return (
    <section id="examples" className="bg-[#0f0f0f] px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <p
          className="mb-8 text-[11px] uppercase tracking-[0.22em] text-[#4b5563]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Live example
        </p>

        <div className="overflow-hidden rounded-lg border border-[#1f2937]">
          <div className="border-b border-[#1f2937] bg-[#161616] px-5 py-3.5">
            <div className="flex items-baseline gap-3 text-[12px]">
              <span
                className="w-8 shrink-0 text-[10px] uppercase tracking-widest text-[#4b5563]"
                style={{ fontFamily: "var(--font-mono), monospace" }}
              >
                To
              </span>
              <span className="font-medium text-[#e5e7eb]">
                Prof. Elena Maris — MIT CSAIL, Alignment Lab
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-3 text-[12px]">
              <span
                className="w-8 shrink-0 text-[10px] uppercase tracking-widest text-[#4b5563]"
                style={{ fontFamily: "var(--font-mono), monospace" }}
              >
                Sub
              </span>
              <span className="font-medium text-[#e5e7eb]">
                Your ICML §3 open problem + my reward shaping work
              </span>
            </div>
          </div>

          <div className="px-5 py-6 text-[13.5px] leading-[1.85] text-[#9ca3af]">
            <p>
              Prof. Maris — section 3 of your{" "}
              <span className="rounded bg-[#92400e]/40 px-1.5 py-0.5 text-[#fbbf24]">
                2024 ICML paper
              </span>{" "}
              flagged reward hacking under sparse feedback as an open problem.
              I&apos;ve spent the last year building at exactly this gap — a sparse
              reward shaping approach that cuts failure rates 40% on Atari
              benchmarks (github.com/amara/sparse-reward).
            </p>
            <p className="mt-4">
              Worth 15 minutes? Happy to walk you through the repo first.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 border-t border-[#1f2937] pt-10 sm:grid-cols-3">
          {WHY.map(([n, title, desc]) => (
            <div key={n}>
              <span
                className="text-[10px] uppercase tracking-widest text-[#4b5563]"
                style={{ fontFamily: "var(--font-mono), monospace" }}
              >
                {n}
              </span>
              <p className="mt-2 text-[12px] font-semibold text-[#e5e7eb]">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#6b7280]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
