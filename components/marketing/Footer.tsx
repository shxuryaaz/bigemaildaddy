import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#e8e4dc] px-6 py-6">
      <div className="mx-auto flex max-w-5xl items-center gap-6">
        <span
          className="text-[10px] uppercase tracking-wider text-[#9ca3af]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          © {new Date().getFullYear()} BigEmailDaddy
        </span>
        <Link
          href="/privacy"
          className="text-[10px] uppercase tracking-wider text-[#9ca3af] transition-colors hover:text-[#111010]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms"
          className="text-[10px] uppercase tracking-wider text-[#9ca3af] transition-colors hover:text-[#111010]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
