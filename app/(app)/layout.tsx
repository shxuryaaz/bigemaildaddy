import { signOutAction } from "./actions";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import {
  IBM_Plex_Mono,
  Playfair_Display,
} from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

function isDatabaseUnreachable(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  if (e.name === "PrismaClientInitializationError") return true;
  return /Can't reach database server|P1001/i.test(e.message);
}

function DatabaseDown(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f2efe8] px-6 text-center text-[#1c1b17]">
      <h1 className="text-xl font-semibold">Database unreachable</h1>
      <p className="max-w-md text-sm leading-relaxed text-[#5a5850]">
        Postgres is not accepting connections. Wake the project in the Neon
        console, verify env vars, then reload.
      </p>
      <Link
        href="/"
        className="border-[1.5px] border-[#1c1b17] px-4 py-2 text-sm font-medium text-[#1c1b17]"
      >
        Back to home
      </Link>
    </div>
  );
}

const navBase = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/compose", label: "Compose" },
  { href: "/sent", label: "Sent" },
] as const;

export default async function AppChromeLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      redirect("/");
    }
    if (isDatabaseUnreachable(e)) {
      return <DatabaseDown />;
    }
    throw e;
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  const needsResumeIngest = user.profile?.identityModel == null;

  if (
    pathname &&
    needsResumeIngest &&
    pathname !== "/onboarding" &&
    !pathname.startsWith("/onboarding/")
  ) {
    redirect("/onboarding");
  }

  const nav = needsResumeIngest
    ? ([{ href: "/onboarding", label: "Setup" }, ...navBase] as const)
    : navBase;

  const display = user.name ?? user.email ?? "Account";

  return (
    <div
      className={`${playfair.variable} ${plexMono.variable} flex min-h-screen bg-[#f2efe8] text-[#1c1b17]`}
    >
      {/* Sidebar */}
      <aside className="flex w-52 shrink-0 flex-col border-r-[1.5px] border-[#1c1b17] bg-[#f2efe8]">
        <div className="border-b-[1.5px] border-[#1c1b17] px-5 py-5">
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-serif)] text-base font-black tracking-tight text-[#1c1b17]"
          >
            BigEmailDaddy
          </Link>
        </div>
        <nav className="flex flex-col gap-0 py-2">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="border-b-[1px] border-[#ddd9d0] px-5 py-3 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.18em] text-[#5a5850] transition-colors hover:bg-[#ebe8e0] hover:text-[#1c1b17] last:border-b-0"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t-[1.5px] border-[#1c1b17] px-5 py-4">
          {user.image ? (
            <div className="mb-3 flex items-center gap-2">
              <Image
                src={user.image}
                alt={display}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="truncate font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[#5a5850]">
                {display}
              </span>
            </div>
          ) : (
            <p className="mb-3 truncate font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[#5a5850]">
              {display}
            </p>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="border-[1.5px] border-[#1c1b17] bg-transparent px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] font-medium uppercase tracking-[0.16em] text-[#1c1b17] transition-colors hover:bg-[#1c1b17] hover:text-[#f2efe8]"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-8 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
