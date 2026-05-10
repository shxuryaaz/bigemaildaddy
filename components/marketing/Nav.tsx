import Image from "next/image";
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8e4dc] bg-[#faf8f4]/95 px-6 py-3.5 backdrop-blur-sm">
      <a href="/" className="flex items-center gap-2.5">
        <Image
          src="/logo.png"
          alt="BigEmailDaddy"
          width={36}
          height={36}
          priority
          className="object-contain"
        />
        <span
          className="text-[17px] font-black tracking-tight text-[#111010]"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          BigEmailDaddy
        </span>
      </a>

      <Link
        href="/signin"
        className="rounded-md bg-[#111010] px-4 py-2 text-[11px] uppercase tracking-wider text-[#faf8f4] transition-opacity hover:opacity-75"
        style={{ fontFamily: "var(--font-mono), monospace" }}
      >
        Get started →
      </Link>
    </nav>
  );
}
