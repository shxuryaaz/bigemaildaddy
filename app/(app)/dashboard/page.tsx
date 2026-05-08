import Link from "next/link";
import { EmailStatus } from "@prisma/client";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) redirect("/");
    throw e;
  }

  const [totalSent, totalDraft, recentEmails, totalTargets] = await Promise.all([
    prisma.email.count({ where: { userId: user.id, status: EmailStatus.SENT } }),
    prisma.email.count({ where: { userId: user.id, status: EmailStatus.DRAFT } }),
    prisma.email.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        target: { select: { name: true, organization: true, type: true } },
      },
    }),
    prisma.target.count(),
  ]);

  const hasProfile = user.profile?.identityModel != null;

  const statusLabel: Record<string, string> = {
    SENT: "Sent",
    DRAFT: "Draft",
    REPLIED: "Replied",
    BOUNCED: "Bounced",
  };

  const statusColor: Record<string, string> = {
    SENT: "text-[#1c1b17] border-[#1c1b17]",
    DRAFT: "text-[#8a8478] border-[#c8c4ba]",
    REPLIED: "text-[#2d6a2d] border-[#2d6a2d]",
    BOUNCED: "text-[#7a4a10] border-[#7a4a10]",
  };

  return (
    <div className="mx-auto max-w-4xl font-[family-name:var(--font-mono)] text-[#1c1b17]">
      <header className="border-b-[1.5px] border-[#1c1b17] pb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
          Overview
        </p>
        <h1
          className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          Dashboard
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#5a5850]">
          {hasProfile
            ? "Your cold email activity at a glance."
            : "Complete onboarding to start writing emails."}
        </p>
      </header>

      {!hasProfile ? (
        <section className="mt-8 border-[1.5px] border-[#7a4a10] bg-[#fff0d4] px-5 py-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#7a4a10]">
            Setup required
          </p>
          <p className="mt-2 text-sm text-[#5a5850]">
            Upload your resume so we can build your identity model.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-block border-[1.5px] border-[#7a4a10] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a4a10] hover:bg-[#7a4a10] hover:text-white"
          >
            Go to setup
          </Link>
        </section>
      ) : null}

      {/* Stat cards */}
      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Emails sent", value: totalSent },
          { label: "Drafts", value: totalDraft },
          { label: "Targets researched", value: totalTargets },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="border-[1.5px] border-[#1c1b17] bg-white px-5 py-5"
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
              {label}
            </p>
            <p
              className="mt-2 text-3xl font-black text-[#1c1b17]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              {value}
            </p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="mt-6">
        <Link
          href="/compose?step=1"
          className="inline-block border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] hover:bg-[#2e2d28]"
        >
          Compose new email
        </Link>
      </section>

      {/* Recent activity */}
      {recentEmails.length > 0 ? (
        <section className="mt-10">
          <p className="border-b-[1.5px] border-[#1c1b17] pb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
            Recent emails
          </p>
          <ul className="divide-y-[1.5px] divide-[#e8e4dc]">
            {recentEmails.map((e) => (
              <li key={e.id} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p
                    className="text-base font-semibold text-[#1c1b17]"
                    style={{ fontFamily: "var(--font-serif), serif" }}
                  >
                    {e.subject}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`border-[1px] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${statusColor[e.status] ?? "text-[#8a8478] border-[#c8c4ba]"}`}
                    >
                      {statusLabel[e.status] ?? e.status}
                    </span>
                    {e.status === EmailStatus.DRAFT ? (
                      <Link
                        href={`/compose?step=6&emailId=${encodeURIComponent(e.id)}&targetId=${encodeURIComponent(e.targetId)}&angle=${encodeURIComponent(e.angle)}&tone=${encodeURIComponent(e.tone)}`}
                        className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5a5850] underline underline-offset-2 hover:text-[#1c1b17]"
                      >
                        Edit draft
                      </Link>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-[12px] text-[#5a5850]">
                  {e.target.name} · {e.target.organization}
                </p>
                <p className="mt-0.5 text-[11px] text-[#8a8478]">
                  {e.createdAt.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/sent"
            className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5a5850] underline"
          >
            View all sent →
          </Link>
        </section>
      ) : hasProfile ? (
        <section className="mt-10 border-[1.5px] border-[#c8c4ba] bg-white px-5 py-8 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
            No emails yet
          </p>
          <p className="mt-2 text-sm text-[#5a5850]">
            Write your first cold email to a professor or recruiter.
          </p>
        </section>
      ) : null}
    </div>
  );
}
