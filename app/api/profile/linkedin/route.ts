import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Server missing BLOB_READ_WRITE_TOKEN" },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const file = form.get("linkedin");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Expected FormData field `linkedin` (PDF file)" },
      { status: 400 },
    );
  }

  if (!isPdf(file)) {
    return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be at most 5MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let linkedinFileUrl: string;
  try {
    const blob = await put(
      `linkedin/${user.id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`,
      buffer,
      {
        access: "public",
        contentType: "application/pdf",
        addRandomSuffix: true,
      },
    );
    linkedinFileUrl = blob.url;
  } catch (e) {
    console.error("[profile/linkedin] blob put failed", e);
    return NextResponse.json(
      { error: "Failed to store file" },
      { status: 502 },
    );
  }

  await prisma.profile.update({
    where: { userId: user.id },
    data: { linkedinFileUrl },
  });

  return NextResponse.json({ ok: true, linkedinFileUrl });
}
