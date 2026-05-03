import { signOutAction } from "./actions";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

const nav = [
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
    throw e;
  }

  const display = user.name ?? user.email ?? "Account";

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            BigEmailDaddy
          </Link>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-zinc-200 bg-white px-6 py-3">
          <span className="truncate text-sm text-zinc-600">{display}</span>
          {user.image ? (
            <Image
              src={user.image}
              alt={`${display} profile photo`}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium">
              {display.slice(0, 1).toUpperCase()}
            </span>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50"
            >
              Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
