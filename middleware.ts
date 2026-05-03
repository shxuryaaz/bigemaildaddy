import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthJsSessionToken } from "@/lib/edge-auth-cookie";
import { authJwtDecode } from "@/lib/session-jwt";

function sessionCookieName(secure: boolean) {
  const prefix = secure ? "__Secure-" : "";
  return `${prefix}authjs.session-token`;
}

/** App Router group `(app)` maps to these URL prefixes (not `/app/...`). */
const appPrefixes = ["/dashboard", "/onboarding", "/compose", "/sent"];

/** `(marketing)/*` has no URL prefix; `/` and other non-app routes stay public here. */
function isProtectedAppPath(pathname: string): boolean {
  return appPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  if (!isProtectedAppPath(pathname)) {
    return NextResponse.next();
  }

  const secureCookie = process.env.NODE_ENV === "production";
  const cookieName = sessionCookieName(secureCookie);
  const token = getAuthJsSessionToken(
    request.headers.get("cookie") ?? "",
    cookieName,
  );
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payload = await authJwtDecode({
    token,
    secret,
    salt: cookieName,
  });

  if (!payload) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
