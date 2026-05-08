import Link from "next/link";
import { EmailStatus } from "@prisma/client";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function SentPage() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) redirect("/");
    throw e;
  }

  const emails = await prisma.email.findMany({
    where: { userId: user.id, status: EmailStatus.SENT },
    orderBy: { sentAt: "desc" },
    take: 50,
    include: {
      target: { select: { name: true, email: true, organization: true, type: true } },
      followups: { orderBy: { sendAt: "asc" } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl font-[family-name:var(--font-mono)] text-[#1c1b17]">
      <header className="border-b-[1.5px] border-[#1c1b17] pb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
          Outbox
        </p>
        <h1
          className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          Sent
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#5a5850]">
          Outbound mail sent through your connected Gmail.
        </p>
      </header>

      {emails.length === 0 ? (
        <section className="mt-8 border-[1.5px] border-[#c8c4ba] bg-white px-5 py-10 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
            Nothing sent yet
          </p>
          <p className="mt-3 text-sm text-[#5a5850]">
            Finish a draft in{" "}
            <Link
              href="/compose"
              className="font-semibold text-[#1c1b17] underline"
            >
              Compose
            </Link>
            .
          </p>
        </section>
      ) : (
        <ul className="mt-8 divide-y-[1.5px] divide-[#e8e4dc]">
          {emails.map((e) => {
            const queued = e.followups.filter((f) => f.status === "QUEUED");
            return (
              <li key={e.id} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p
                    className="text-base font-semibold text-[#1c1b17]"
                    style={{ fontFamily: "var(--font-serif), serif" }}
                  >
                    {e.subject}
                  </p>
                  <span className="border-[1px] border-[#1c1b17] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#1c1b17]">
                    Sent
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[#5a5850]">
                  To: {e.target.email ?? "—"} · {e.target.name} (
                  {e.target.organization})
                </p>
                <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[#8a8478]">
                  {e.sentAt
                    ? e.sentAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </p>
                {queued.length > 0 ? (
                  <p className="mt-1 text-[11px] text-[#5a5850]">
                    Follow-ups queued:{" "}
                    {queued
                      .map((f) =>
                        f.type === "DAY3"
                          ? "Day 3"
                          : f.type === "DAY7"
                            ? "Day 7"
                            : f.type,
                      )
                      .join(", ")}
                  </p>
                ) : null}
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#5a5850]">
                  {e.body}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
