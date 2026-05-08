import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import {
  buildGithubData,
  computeCredibilityScore,
  computeDomainCluster,
} from "@/lib/github";
import { prisma } from "@/lib/db";
import { completeIdentityModel } from "@/lib/identity-openai";
import { extractTextFromPdfBuffer } from "@/lib/pdf-text";
import type { IdentityModel } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  let identityUpdated = false;
  let identity: IdentityModel | undefined;
  if (process.env.OPENAI_API_KEY) {
    try {
      const full = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });
      const url = full?.profile?.resumeFileUrl;
      if (url) {
        const pdfRes = await fetch(url);
        if (pdfRes.ok) {
          const buf = Buffer.from(await pdfRes.arrayBuffer());
          const resumeText = await extractTextFromPdfBuffer(buf);
          if (resumeText) {
            const gh = await buildGithubData(username);
            identity = await completeIdentityModel(
              resumeText,
              JSON.stringify(gh),
            );
            const credibilityScore = computeCredibilityScore(gh);
            const domainCluster = computeDomainCluster(gh);
            await prisma.profile.update({
              where: { userId: user.id },
              data: {
                identityModel: identity as object,
                credibilityScore,
                domainCluster,
              },
            });
            identityUpdated = true;
          }
        }
      }
    } catch (e) {
      console.error("[profile/github] identity rebuild failed", e);
    }
  }

  return NextResponse.json({
    ok: true,
    githubUsername: username,
    identityUpdated,
    ...(identity ? { identity } : {}),
  });
}
