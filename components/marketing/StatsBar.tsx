const STATS = [
  ["3.4×", "Higher reply rate vs templates"],
  ["90s", "To your first email draft"],
  ["0", "Generic phrases. Ever."],
];

export default function StatsBar() {
  return (
    <section className="border-y border-[#e8e4dc] bg-[#f5f2ec]">
      <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-[#e8e4dc]">
        {STATS.map(([num, label]) => (
          <div key={num} className="px-8 py-8 text-center">
            <div
              className="text-4xl font-black tracking-tight text-[#111010]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              {num}
            </div>
            <div
              className="mt-1.5 text-[10px] uppercase tracking-widest text-[#6b7280]"
              style={{ fontFamily: "var(--font-mono), monospace" }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
