import Link from "next/link";

const LAST_UPDATED = "May 10, 2026";

const SECTIONS = [
  {
    title: "What we collect",
    body: [
      "When you sign in with Google, we receive your name, email address, and profile picture from Google's OAuth service.",
      "When you upload your resume or LinkedIn export, we extract skills, projects, and experience from that document to build your identity profile. The raw file is not stored — only the extracted data.",
      "When you enter a GitHub username, we fetch your public repositories to understand your work.",
      "When you compose and send emails, we store the draft and a record that the email was sent (recipient, subject, timestamp). We do not store the body of sent emails.",
    ],
  },
  {
    title: "Gmail access",
    body: [
      "We request one Gmail permission: the ability to send emails on your behalf.",
      "We use this exclusively to deliver emails you compose inside BigEmailDaddy when you click Send. The email is sent from your Gmail address and appears in your Sent folder.",
      "We cannot and do not read your inbox, search your emails, access your drafts, or interact with any existing email data.",
      "You can revoke this permission at any time by visiting your Google Account → Security → Third-party apps with account access.",
    ],
  },
  {
    title: "How we use your data",
    body: [
      "Your identity profile (extracted from your resume and GitHub) is used solely to generate personalised cold emails inside the app.",
      "We do not sell, rent, or share your personal data with any third parties for marketing or advertising purposes.",
      "We use OpenAI's API to generate email content and research targets. Content sent to OpenAI is subject to their data usage policies. We do not send your raw resume or full identity profile to OpenAI — only the specific fields needed to generate a given email.",
    ],
  },
  {
    title: "Data storage and security",
    body: [
      "Your data is stored in a Postgres database hosted on Neon (neon.tech), a SOC 2 compliant cloud database provider.",
      "OAuth tokens (used to send Gmail on your behalf) are stored encrypted in our database and are never exposed in the browser or in logs.",
      "We use HTTPS for all data in transit.",
    ],
  },
  {
    title: "Data retention and deletion",
    body: [
      "You can delete your account and all associated data at any time by emailing bigemaildad@gmail.com with the subject line 'Delete my account'.",
      "We will delete your profile, identity model, email records, and OAuth tokens within 7 days of receiving your request.",
    ],
  },
  {
    title: "Contact",
    body: [
      "If you have any questions about this policy or how we handle your data, email us at bigemaildad@gmail.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#faf8f4] px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-12 inline-block text-[11px] uppercase tracking-widest text-[#9ca3af] transition-colors hover:text-[#111010]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          ← Back
        </Link>

        <h1
          className="mt-6 text-[36px] font-black tracking-tight text-[#111010]"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          Privacy Policy
        </h1>
        <p
          className="mt-2 text-[12px] text-[#9ca3af]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Last updated: {LAST_UPDATED}
        </p>

        <p className="mt-6 text-[14px] leading-relaxed text-[#6b7280]">
          BigEmailDaddy is a cold email tool for university students. This page
          explains what data we collect, why we collect it, and what we do with
          it. We&apos;ve written this in plain English on purpose.
        </p>

        <div className="mt-12 space-y-10">
          {SECTIONS.map(({ title, body }) => (
            <div key={title}>
              <h2
                className="text-[18px] font-bold text-[#111010]"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                {title}
              </h2>
              <div className="mt-3 space-y-3">
                {body.map((para) => (
                  <p
                    key={para}
                    className="text-[14px] leading-relaxed text-[#4b5563]"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
