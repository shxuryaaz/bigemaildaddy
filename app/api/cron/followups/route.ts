import { NextResponse } from "next/server";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const bearer = req.headers.get("authorization");
  const token = bearer?.startsWith("Bearer ")
    ? bearer.slice("Bearer ".length)
    : null;
  return token === secret;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
