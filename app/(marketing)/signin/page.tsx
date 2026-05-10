import Image from "next/image";
import Link from "next/link";
import { signInWithGoogleToDashboard } from "@/app/(marketing)/actions";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#faf8f4] px-6 py-16">
      {/* Back link */}
      <Link
        href="/"
        className="absolute left-6 top-6 text-[11px] uppercase tracking-widest text-[#9ca3af] transition-colors hover:text-[#111010]"
        style={{ fontFamily: "var(--font-mono), monospace" }}
      >
        ← Back
      </Link>

      <div className="mx-auto w-full max-w-md text-center">
        {/* Mascot */}
        <div className="mx-auto mb-5 flex h-[88px] w-[88px] items-center justify-center drop-shadow-lg">
          <Image
            src="/logo.png"
            alt="BigEmailDaddy"
            width={88}
            height={88}
            className="object-contain"
            priority
          />
        </div>

        <p
          className="text-[13px] font-black tracking-tight text-[#111010]"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          BigEmailDaddy
        </p>

        <h1
          className="mt-8 text-3xl font-black leading-tight tracking-tight text-[#111010] md:text-[38px]"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          Before we send you to Google,
          <br />
          <span className="italic">here&apos;s the one thing we&apos;re asking for.</span>
        </h1>

        {/* Permission card */}
        <div className="mt-8 rounded-xl border border-[#e8e4dc] bg-white p-6 text-left shadow-sm">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 text-2xl">📤</span>
            <div>
              <p className="text-[14px] font-semibold text-[#111010]">
                Send emails from your Gmail
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#6b7280]">
                When you click Send inside BigEmailDaddy, we deliver that email
                through your own Gmail account — so it shows up in your Sent
                folder, from your address, like you sent it yourself.
              </p>
            </div>
          </div>
        </div>

        {/* Reassurance */}
        <p className="mt-6 text-[13.5px] leading-relaxed text-[#6b7280]">
          We never read, scan, or store any of your existing emails.
          <br />
          Nothing sends without you clicking it. Ever.
        </p>

        {/* CTA */}
        <form action={signInWithGoogleToDashboard} className="mt-8">
          <button
            type="submit"
            className="w-full rounded-md bg-[#111010] py-4 text-[14px] font-medium text-[#faf8f4] transition-opacity hover:opacity-75"
          >
            Continue with Google →
          </button>
        </form>

        <p
          className="mt-4 text-[11px] text-[#9ca3af]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          🔒 Secured by Google OAuth 2.0
        </p>
      </div>
    </main>
  );
}
