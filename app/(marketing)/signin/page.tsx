import Image from "next/image";
import Link from "next/link";
import { signInWithGoogleToDashboard } from "@/app/(marketing)/actions";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen">
      {/* Left — dark mascot panel */}
      <div className="hidden w-[42%] flex-col items-center justify-center bg-[#111010] md:flex">
        <Image
          src="/logo.png"
          alt="BigEmailDaddy"
          width={120}
          height={120}
          className="object-contain"
          priority
        />
        <p
          className="mt-5 text-[20px] font-black tracking-tight text-white"
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
          className="text-[32px] font-black leading-[1.1] tracking-tight text-[#111010] md:text-[40px]"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          One permission.
          <br />
          <span className="italic">Here&apos;s what it does.</span>
        </h1>

        <div className="mt-8 rounded-xl border border-[#e8e4dc] bg-white p-6">
          <p className="text-[13px] font-semibold uppercase tracking-widest text-[#9ca3af]"
            style={{ fontFamily: "var(--font-mono), monospace" }}>
            What we ask for
          </p>
          <p
            className="mt-3 text-[18px] font-bold text-[#111010]"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            Send emails from your Gmail
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
            When you click Send, we push that one email through your Gmail. It
            lands in your Sent folder, from your address, like you sent it
            yourself. That&apos;s the entire scope.
          </p>
        </div>

        <p className="mt-6 text-[13px] leading-relaxed text-[#9ca3af]">
          We don&apos;t read your inbox. We don&apos;t touch your contacts.
          Nothing goes out without you clicking Send.
        </p>

        <form action={signInWithGoogleToDashboard} className="mt-10">
          <button
            type="submit"
            className="w-full rounded-md bg-[#111010] py-4 text-[14px] font-medium text-[#faf8f4] transition-opacity hover:opacity-75 md:w-auto md:px-10"
          >
            Continue with Google →
          </button>
        </form>
      </div>
    </main>
  );
}
