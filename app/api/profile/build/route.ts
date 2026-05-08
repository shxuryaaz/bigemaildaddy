import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
  buildGithubData,
  computeCredibilityScore,
  computeDomainCluster,
} from "@/lib/github";
import { completeIdentityModel } from "@/lib/identity-openai";
import { extractTextFromPdfBuffer } from "@/lib/pdf-text";
import type { IdentityModel } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 5 * 1024 * 1024;

function isPdf(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "application/pdf" ||
    name.endsWith(".pdf")
  );
}

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

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Server missing OPENAI_API_KEY" },
      { status: 503 },
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Server missing BLOB_READ_WRITE_TOKEN" },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const resume = form.get("resume");

  if (!(resume instanceof File)) {
    return NextResponse.json(
      { error: "Expected FormData field `resume` (PDF file)" },
      { status: 400 },
    );
  }

  if (!isPdf(resume)) {
    return NextResponse.json({ error: "Resume must be a PDF" }, { status: 400 });
  }

  if (resume.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Resume must be at most 5MB" },
      { status: 400 },
    );
  }

  const arrayBuffer = await resume.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let resumeFileUrl: string;
  try {
    const blob = await put(
      `resumes/${user.id}/${Date.now()}-${resume.name.replace(/[^\w.-]+/g, "_")}`,
      buffer,
      {
        access: "public",
        contentType: "application/pdf",
        addRandomSuffix: true,
      },
    );
    resumeFileUrl = blob.url;
  } catch (e) {
    console.error("[profile/build] blob put failed", e);
    return NextResponse.json(
      { error: "Failed to store resume file" },
      { status: 502 },
    );
  }

  let resumeText: string;
  try {
    resumeText = await extractTextFromPdfBuffer(buffer);
  } catch (e) {
    console.error("[profile/build] pdf parse failed", e);
    return NextResponse.json(
      { error: "Could not read text from PDF" },
      { status: 400 },
    );
  }

  if (!resumeText) {
    return NextResponse.json(
      { error: "PDF contained no extractable text" },
      { status: 400 },
    );
  }

  const ghForm = form.get("githubUsername");
  const githubUsername =
    typeof ghForm === "string" && ghForm.trim()
      ? ghForm.trim()
      : user.profile?.githubUsername?.trim() ?? "";

  let githubDataJson = "null";
  let githubAgg = null as Awaited<ReturnType<typeof buildGithubData>> | null;
  if (githubUsername) {
    try {
      githubAgg = await buildGithubData(githubUsername);
      githubDataJson = JSON.stringify(githubAgg);
    } catch (e) {
      console.error("[profile/build] github aggregate failed", e);
      githubDataJson = "null";
    }
  }

  let identity: IdentityModel;
  try {
    identity = await completeIdentityModel(resumeText, githubDataJson);
  } catch (e) {
    console.error("[profile/build] openai failed", e);
    return NextResponse.json(
      { error: "Failed to build identity model" },
      { status: 502 },
    );
  }

  const credibilityScore = githubAgg
    ? computeCredibilityScore(githubAgg)
    : 0;
  const domainCluster = githubAgg
    ? computeDomainCluster(githubAgg)
    : "generalist";

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      resumeFileUrl,
      identityModel: identity as object,
      credibilityScore,
      domainCluster,
    },
  });

  return NextResponse.json(identity);
}
