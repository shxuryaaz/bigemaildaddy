import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

const { auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
});

/** App Router group `(app)` maps to these URL prefixes (not `/app/...`). */
const appPrefixes = ["/dashboard", "/onboarding", "/compose", "/sent"];

/** `(marketing)/*` has no URL prefix; `/` and other non-app routes stay public here. */
function isProtectedAppPath(pathname: string): boolean {
  return appPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  if (isProtectedAppPath(pathname) && !req.auth) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
