export default function Footer() {
  return (
    <footer className="border-t border-[#e8e4dc] px-6 py-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-wider text-[#9ca3af]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          © {new Date().getFullYear()} BigEmailDaddy
        </span>
        <span
          className="text-[10px] uppercase tracking-wider text-[#9ca3af]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Cold email that actually works
        </span>
      </div>
    </footer>
  );
}
