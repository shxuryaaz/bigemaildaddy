import Image from "next/image";
import Link from "next/link";
import { signInWithGoogleToDashboard } from "@/app/(marketing)/actions";
import { SignInWithGoogleForm } from "@/components/marketing/SignInWithGoogleForm";

export default function SignInPage() {
  return (
    <main className="signin-transition flex min-h-screen">
      {/* Left — dark mascot panel */}
      <div className="hidden w-[42%] flex-col items-center justify-center bg-[#111010] md:flex">
        <Image
          src="/mascot.png"
          alt="BigEmailDaddy"
          width={280}
          height={280}
          className="object-contain drop-shadow-2xl"
          priority
        />
        <p
          className="mt-6 text-[22px] font-black tracking-tight text-white"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          BigEmailDaddy
        </p>
        <p
          className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#4b5563]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Cold email that actually works
        </p>
      </div>

      {/* Right — permission explanation */}
      <div className="flex flex-1 flex-col justify-center bg-[#faf8f4] px-10 py-16 md:px-16">
        <Link
          href="/"
          className="mb-12 inline-block text-[11px] uppercase tracking-widest text-[#9ca3af] transition-colors hover:text-[#111010]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          ← Back
        </Link>

        <h1
          className="text-[28px] font-bold leading-[1.2] tracking-tight text-[#111010] md:text-[34px]"
          style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
        >
          Before you hit Continue —<br />here&apos;s exactly what we can and
          can&apos;t do with your Google account.
        </h1>

        <p className="mt-4 text-[14px] leading-relaxed text-[#6b7280]"
          style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
          We ask for one Gmail permission. Nothing more. Here&apos;s what it
          means in plain English.
        </p>

        {/* Permission card */}
        <div className="mt-8 rounded-xl border border-[#e8e4dc] bg-white p-6">
          <p
            className="text-[11px] font-medium uppercase tracking-widest text-[#9ca3af]"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            The one thing we ask for
          </p>
          <p
            className="mt-3 text-[17px] font-semibold text-[#111010]"
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
          >
            Send emails on your behalf
          </p>
          <p
            className="mt-2 text-[13px] leading-relaxed text-[#6b7280]"
            style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
          >
            When you write an email inside BigEmailDaddy and click Send, we
            deliver it through your Gmail. It shows up in your Sent folder, from
            your address — exactly like you sent it yourself.
          </p>
        </div>

        {/* What we won't do */}
        <div className="mt-6 space-y-3">
          {[
            "We cannot read, search, or access any emails in your inbox",
            "We cannot see your contacts, calendar, or any other Google data",
            "We never send anything without you explicitly clicking Send",
            "You can revoke access from your Google account settings at any time",
          ].map((line) => (
            <div key={line} className="flex items-start gap-3">
              <span className="mt-0.5 text-[15px] text-green-500">✓</span>
              <p
                className="text-[13px] leading-relaxed text-[#374151]"
                style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
              >
                {line}
              </p>
            </div>
          ))}
        </div>

        <SignInWithGoogleForm action={signInWithGoogleToDashboard} />
      </div>
    </main>
  );
}
