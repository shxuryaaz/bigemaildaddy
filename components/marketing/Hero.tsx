import { signInWithGoogleToDashboard } from "@/app/(marketing)/actions";

export default function Hero() {
  return (
    <section className="px-6 py-20 text-center md:py-28">
      <div className="mx-auto max-w-3xl">
        <p
          className="mb-6 text-[11px] uppercase tracking-[0.22em] text-[#6b7280]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Cold email for university students
        </p>

        <h1
          className="text-5xl font-black leading-[0.95] tracking-[-2px] text-[#111010] md:text-[72px]"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          Your cold
          <br />
          emails are
          <br />
          <span style={{ WebkitTextStroke: "2px #111010", color: "transparent" }}>
            trash.
          </span>
          <br />
          <span className="italic">Ours aren&apos;t.</span>
        </h1>

        <p className="mx-auto mt-8 max-w-md text-[15px] leading-relaxed text-[#6b7280]">
          We research your target — their papers, posts, hiring patterns — then
          find the exact overlap with your work and write one email that
          doesn&apos;t read like a template.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <form action={signInWithGoogleToDashboard}>
            <button
              type="submit"
              className="rounded-md bg-[#111010] px-7 py-3.5 text-[14px] font-medium text-[#faf8f4] transition-opacity hover:opacity-75"
            >
              Get started →
            </button>
          </form>
          <a
            href="#how-it-works"
            className="rounded-md border border-[#e8e4dc] px-6 py-3.5 text-[11px] uppercase tracking-wider text-[#6b7280] transition-colors hover:border-[#111010] hover:text-[#111010]"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            How it works
          </a>
        </div>
      </div>
    </section>
  );
}
