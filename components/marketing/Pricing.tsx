import { signInWithGoogleToDashboard } from "@/app/(marketing)/actions";

const FEATURES = [
  "Resume + GitHub identity extraction — no hallucinated skills",
  "Real-time web research on every target",
  "Compatibility mapping — non-obvious bridges only",
  "Angle + tone control with sentence-level rewrite",
  "Sends via Gmail directly from the app",
];

export default function Pricing() {
  return (
    <section id="pricing" className="border-t border-[#e8e4dc] bg-[#f5f2ec] px-6 py-20">
      <div className="mx-auto max-w-sm">
        <p
          className="mb-3 text-center text-[11px] uppercase tracking-[0.22em] text-[#6b7280]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Pricing
        </p>

        <div className="rounded-xl border border-[#e8e4dc] bg-white p-8 shadow-sm">
          <div className="mb-8 border-b border-[#e8e4dc] pb-8">
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-5xl font-black tracking-tight text-[#111010]"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                $30
              </span>
              <span className="text-[14px] text-[#6b7280]">/ month</span>
            </div>
            <p className="mt-1 text-[12px] text-[#9ca3af]">
              Cancel anytime. No contracts.
            </p>
          </div>

          <ul className="mb-8 space-y-3.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span
                  className="mt-0.5 shrink-0 text-[11px] text-[#111010]"
                  style={{ fontFamily: "var(--font-mono), monospace" }}
                >
                  →
                </span>
                <span className="text-[13px] leading-snug text-[#374151]">{f}</span>
              </li>
            ))}
          </ul>

          <form action={signInWithGoogleToDashboard}>
            <button
              type="submit"
              className="w-full rounded-md bg-[#111010] py-3.5 text-[14px] font-medium text-white transition-opacity hover:opacity-75"
            >
              Get started →
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-[#9ca3af]">
          One email that gets a reply is worth the month.
        </p>
      </div>
    </section>
  );
}
