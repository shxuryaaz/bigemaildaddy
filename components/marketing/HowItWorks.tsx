const STEPS = [
  [
    "01 — Setup",
    "Upload your resume + GitHub",
    "We extract your actual projects, skills, and repos — not what you claim, what you've shipped. This becomes your evidence base for every email.",
  ],
  [
    "02 — Target",
    "Search for who you want to email",
    "Search by name, role, or institution. We web-research them in real-time — papers, posts, LinkedIn — and build a model of what they actually care about.",
  ],
  [
    "03 — Generate",
    "Pick angle + tone. We write it.",
    'We find the non-obvious overlap between your work and theirs, then write one specific email. No templates. No filler. No "I am passionate about your research."',
  ],
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <p
          className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[#6b7280]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          How it works
        </p>
        <h2
          className="text-4xl font-black tracking-tight text-[#111010]"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          Three steps. One email that lands.
        </h2>

        <div className="mt-12 border border-[#e8e4dc] md:grid md:grid-cols-3">
          {STEPS.map(([num, title, desc], i) => (
            <div
              key={num}
              className={`p-8 ${
                i < STEPS.length - 1
                  ? "border-b border-[#e8e4dc] md:border-b-0 md:border-r"
                  : ""
              }`}
            >
              <p
                className="text-[10px] uppercase tracking-widest text-[#6b7280]"
                style={{ fontFamily: "var(--font-mono), monospace" }}
              >
                {num}
              </p>
              <h3
                className="mt-4 text-xl font-bold leading-tight text-[#111010]"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                {title}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-[#6b7280]">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
