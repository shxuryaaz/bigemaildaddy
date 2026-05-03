import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

const GITHUB_USER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const username =
    typeof body === "object" &&
    body !== null &&
    "githubUsername" in body &&
    typeof (body as { githubUsername: unknown }).githubUsername === "string"
      ? (body as { githubUsername: string }).githubUsername.trim()
      : "";

  if (!username) {
    return NextResponse.json(
      { error: "Missing string field `githubUsername`" },
      { status: 400 },
    );
  }

  if (!GITHUB_USER_RE.test(username)) {
    return NextResponse.json(
      { error: "Invalid GitHub username" },
      { status: 400 },
    );
  }

  await prisma.profile.update({
    where: { userId: user.id },
    data: { githubUsername: username },
  });

  return NextResponse.json({ ok: true, githubUsername: username });
}
