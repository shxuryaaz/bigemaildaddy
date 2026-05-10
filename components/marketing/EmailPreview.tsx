import {
  LayoutTemplate,
  Paperclip,
  SendHorizontal,
  Smile,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/marketing/Reveal";

const WHY = [
  ["01", "Section-level specificity", 'Not "your research" — the exact open problem they named in print'],
  ["02", "Proof, not claims", 'GitHub repo as evidence, not "I\'m passionate about alignment"'],
  ["03", "Zero-risk ask", "Offer the repo first — they lose nothing saying yes"],
];

function TrafficLights() {
  return (
    <div className="flex items-center gap-2 pl-1" aria-hidden>
      <span className="h-3 w-3 rounded-full bg-[#ff5f57] ring-1 ring-black/8" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e] ring-1 ring-black/8" />
      <span className="h-3 w-3 rounded-full bg-[#28c840] ring-1 ring-black/8" />
    </div>
  );
}

export default function EmailPreview() {
  return (
    <section id="examples" className="border-t border-[#e8e4dc] bg-[#faf8f4] px-4 py-16 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Reveal from="up">
          <p
            id="live-example-label"
            className="mb-6 text-[11px] uppercase tracking-[0.22em] text-[#8a867c]"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            Live example
          </p>
        </Reveal>

        <Reveal from="up" delay={120}>
        <div
          className="overflow-hidden rounded-[11px] border border-black/[0.12] shadow-[0_18px_50px_-20px_rgba(0,0,0,0.35)]"
          aria-labelledby="live-example-label"
        >
          {/* Title bar */}
          <div className="flex h-11 items-center border-b border-[#d9d9d9] bg-[#ececec]/90 px-4 backdrop-blur-sm">
            <TrafficLights />
            <span className="flex-1 text-center text-[12px] font-medium text-[#6b6966]">
              New Message
            </span>
            <span className="w-[52px]" aria-hidden />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-5 border-b border-[#ddd9d4] bg-[#f7f7f7] px-4 py-2 text-[#5c5c5c]">
            <span className="text-[13px] font-semibold tracking-tight text-[#3c3c3c]" title="Formatting">
              Aa
            </span>
            <Smile size={17} strokeWidth={1.5} className="opacity-85" aria-hidden />
            <Sparkles size={17} strokeWidth={1.5} className="opacity-85" aria-hidden />
            <LayoutTemplate size={17} strokeWidth={1.5} className="opacity-85" aria-hidden />
            <Paperclip size={17} strokeWidth={1.5} className="opacity-85" aria-hidden />
            <SendHorizontal
              size={18}
              strokeWidth={1.5}
              className="ml-auto opacity-90 text-[#2b6cff]"
              aria-hidden
            />
          </div>

          {/* Headers */}
          <div className="divide-y divide-[#e8e6e3] bg-white">
            <div className="flex min-h-[38px] items-center gap-3 px-4 py-2 text-[13px]">
              <span className="w-16 shrink-0 text-right text-[#8e8e93]">To:</span>
              <span className="inline-flex rounded-full bg-[#d6ebff] px-2.5 py-1 text-[12.5px] font-medium text-[#0b5cbf] ring-1 ring-[#bcdfff]/80">
                Prof. Elena Maris
              </span>
              <span className="text-[12.5px] text-[#3d3d3f]">
                MIT CSAIL, Alignment Lab
              </span>
            </div>

            <div className="flex min-h-[36px] items-center gap-3 px-4 py-1.5 text-[13px]">
              <span className="w-16 shrink-0 text-right text-[#8e8e93]">Cc:</span>
              <span className="text-[#c8c8cc]">&nbsp;</span>
            </div>

            <div className="flex min-h-[36px] items-center gap-3 px-4 py-1.5 text-[13px]">
              <span className="w-16 shrink-0 text-right text-[#8e8e93]">Subject:</span>
              <span className="min-w-0 text-[13px] text-[#1d1d1f]">
                Section 3 of your ICML paper + something I built
              </span>
            </div>

            <div className="flex min-h-[36px] items-center gap-3 px-4 py-1.5 text-[13px]">
              <span className="w-16 shrink-0 text-right text-[#8e8e93]">From:</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#1d1d1f]">
                amara@university.edu
              </span>
              <span className="shrink-0 text-[11px] text-[#8e8e93]">
                Signature:{" "}
                <span className="text-[#c8c8cc]">None</span>
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="border-t border-[#e8e6e3] bg-white px-4 pb-10 pt-5 md:px-8 md:pb-14 md:pt-7">
            <div
              className="mx-auto max-w-[34rem] space-y-4 text-[14px] leading-[1.7] tracking-[-0.01em] text-[#1d1d1f]"
              style={{ fontFamily: "var(--font-sans), ui-sans-serif, system-ui" }}
            >
              <p>Hi Prof. Maris,</p>
              <p>
                Read your ICML paper earlier this year. The open problem in
                Section 3 around reward hacking under sparse feedback is exactly
                what I&apos;ve been working on for the past year.
              </p>
              <p>
                I built a reward shaping approach targeting that failure mode and
                got ~40% reduction in failure rates across Atari benchmarks. Repo
                is here if you want to look:{" "}
                <span className="break-all text-[#0b5cbf] underline decoration-[#aecfff] underline-offset-2">
                  github.com/amara/sparse-reward
                </span>
              </p>
              <p>
                If it&apos;s relevant to anything your lab is working on,
                I&apos;d love to get your take. Open to a quick call whenever
                works for you.
              </p>
              <p>Amara</p>
            </div>
          </div>
        </div>
        </Reveal>

        <div className="mt-14 grid gap-10 border-t border-[#e8e4dc] pt-14 sm:grid-cols-3">
          {WHY.map(([n, title, desc], i) => (
            <Reveal key={n} from="up" delay={i * 100}>
              <span
                className="text-[10px] uppercase tracking-[0.16em] text-[#a39e94]"
                style={{ fontFamily: "var(--font-mono), monospace" }}
              >
                {n}
              </span>
              <p className="mt-2 text-[13px] font-semibold tracking-tight text-[#252422]">{title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[#6b7280]">{desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
