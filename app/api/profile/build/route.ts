import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { IDENTITY_MODEL_JSON_SCHEMA } from "@/lib/identity-json-schema";
import { openai } from "@/lib/openai";
import {
  formatIdentityBuildUserPrompt,
  IDENTITY_BUILD_SYSTEM,
} from "@/lib/prompts";
import type { IdentityModel } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_CHARS = 100_000;

function isPdf(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "application/pdf" ||
    name.endsWith(".pdf")
  );
}

async function pdfBufferToText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return (result.text ?? "").trim();
  } finally {
    await parser.destroy();
  }
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
    resumeText = await pdfBufferToText(buffer);
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

  const githubField = form.get("githubData");
  const githubData =
    typeof githubField === "string" && githubField.trim()
      ? githubField.trim()
      : "null";

  const clipped =
    resumeText.length > MAX_RESUME_CHARS
      ? `${resumeText.slice(0, MAX_RESUME_CHARS)}\n\n[truncated for model context]`
      : resumeText;

  const userMessage = formatIdentityBuildUserPrompt(clipped, githubData);

  let raw: string | null = null;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      max_tokens: 4000,
      messages: [
        { role: "system", content: IDENTITY_BUILD_SYSTEM },
        { role: "user", content: userMessage },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "IdentityModel",
          strict: true,
          schema: {
            ...IDENTITY_MODEL_JSON_SCHEMA,
          },
        },
      },
    });
    raw = completion.choices[0]?.message?.content ?? null;
  } catch (e) {
    console.error("[profile/build] openai failed", e);
    return NextResponse.json(
      { error: "Failed to build identity model" },
      { status: 502 },
    );
  }

  if (!raw) {
    return NextResponse.json(
      { error: "Empty model response" },
      { status: 502 },
    );
  }

  let identity: IdentityModel;
  try {
    identity = JSON.parse(raw) as IdentityModel;
  } catch {
    return NextResponse.json(
      { error: "Model returned invalid JSON" },
      { status: 502 },
    );
  }

  const domainCluster =
    identity.domains?.length ? identity.domains.join(", ") : null;

  await prisma.profile.update({
    where: { userId: user.id },
    data: {
      resumeFileUrl,
      identityModel: identity as object,
      domainCluster,
    },
  });

  return NextResponse.json(identity);
}
