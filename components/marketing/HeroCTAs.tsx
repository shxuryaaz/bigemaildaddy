"use client";

import Link from "next/link";

export function HeroCTAs() {
  return (
    <div
      className="hero-animate mt-12 flex flex-wrap items-center justify-center gap-4"
      style={{ animationDelay: "380ms" }}
    >
      <Link
        href="/signin"
        className="rounded-md bg-[#111010] px-7 py-3.5 text-[14px] font-medium text-[#faf8f4] transition-opacity hover:opacity-75"
      >
        Get started →
      </Link>
      <button
        type="button"
        onClick={() => {
          document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="rounded-md border border-[#e8e4dc] px-6 py-3.5 text-[11px] uppercase tracking-wider text-[#6b7280] transition-colors hover:border-[#111010] hover:text-[#111010]"
        style={{ fontFamily: "var(--font-mono), monospace" }}
      >
        How it works
      </button>
    </div>
  );
}
