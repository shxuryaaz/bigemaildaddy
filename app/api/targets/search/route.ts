import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import {
  searchProfessorsWeb,
  searchRecruitersWeb,
} from "@/lib/target-search";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  type?: string;
  query?: string;
};

export async function POST(request: Request) {
  try {
    await requireUser();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type === "RECRUITER" ? "RECRUITER" : "PROFESSOR";
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Server missing OPENAI_API_KEY" },
      { status: 503 },
    );
  }

  try {
    if (type === "PROFESSOR") {
      const results = await searchProfessorsWeb(query);
      return NextResponse.json({ type: "PROFESSOR", results });
    }
    const results = await searchRecruitersWeb(query);
    return NextResponse.json({ type: "RECRUITER", results });
  } catch (e) {
    console.error("[targets/search]", e);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 502 },
    );
  }
}
