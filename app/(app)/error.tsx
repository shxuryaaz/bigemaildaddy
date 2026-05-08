"use client";

import { useEffect } from "react";

function isDatabaseUnreachable(message: string): boolean {
  return (
    /Can't reach database server/i.test(message) ||
    /PrismaClientInitializationError/i.test(message) ||
    /P1001/i.test(message)
  );
}

export default function AppRouteGroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  const msg = error.message ?? "";
  const db = isDatabaseUnreachable(msg);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#f2efe8] px-6 text-center font-[family-name:var(--font-mono)] text-[#1c1b17]">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
        Error
      </p>
      <h1
        className="text-2xl font-black tracking-tight"
        style={{ fontFamily: "var(--font-serif), serif" }}
      >
        {db ? "Database unreachable" : "Something went wrong"}
      </h1>
      <p className="max-w-md text-[14px] leading-relaxed text-[#5a5850]">
        {db ? (
          <>
            The app cannot reach Postgres — Neon may be asleep. Open the Neon
            console to wake the project, confirm{" "}
            <code className="border-[1px] border-[#c8c4ba] px-1 py-0.5 text-[12px]">
              DATABASE_URL
            </code>{" "}
            and{" "}
            <code className="border-[1px] border-[#c8c4ba] px-1 py-0.5 text-[12px]">
              DIRECT_URL
            </code>{" "}
            in{" "}
            <code className="border-[1px] border-[#c8c4ba] px-1 py-0.5 text-[12px]">
              .env
            </code>
            , then retry.
          </>
        ) : (
          msg
        )}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] hover:bg-[#2e2d28]"
      >
        Try again
      </button>
    </div>
  );
}
