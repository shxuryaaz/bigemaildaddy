import { HeroCTAs } from "@/components/marketing/HeroCTAs";

export default function Hero() {
  return (
    <section className="px-6 py-20 text-center md:py-28">
      <div className="mx-auto max-w-3xl">
        <h1
          className="text-5xl font-black leading-[0.95] tracking-[-2px] text-[#111010] md:text-[72px]"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          <span className="hero-animate block" style={{ animationDelay: "0ms" }}>
            Your cold
          </span>
          <span className="hero-animate block" style={{ animationDelay: "80ms" }}>
            emails are
          </span>
          <span
            className="hero-animate block"
            style={{
              animationDelay: "160ms",
              WebkitTextStroke: "2px #111010",
              color: "transparent",
            }}
          >
            trash.
          </span>
          <span className="hero-animate block italic" style={{ animationDelay: "240ms" }}>
            Ours aren&apos;t.
          </span>
        </h1>

        <HeroCTAs />
      </div>
    </section>
  );
}
