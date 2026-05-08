import { TargetType } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  requireUser,
  UnauthorizedError,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
  findTargetEmail,
  findEmailHunterIo,
  guessEmailDomain,
} from "@/lib/email-finder";
import {
  runProfessorTasteReconstruction,
  runRecruiterTasteReconstruction,
} from "@/lib/taste-reconstruction-openai";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = {
  targetId?: string;
};

const MAX_SOURCE_CHARS = 120_000;

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

export async function POST(request: Request) {
  try {
    await requireUser();
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

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetId = typeof body.targetId === "string" ? body.targetId.trim() : "";
  if (!targetId) {
    return NextResponse.json({ error: "Missing targetId" }, { status: 400 });
  }

  const target = await prisma.target.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  const prevRaw = asRecord(target.rawData);

  try {
    if (target.type === TargetType.PROFESSOR) {
      // Build a source bundle from what we already know about this professor.
      // The taste reconstruction model will use web_search to gather their
      // actual papers and research context — no Semantic Scholar key needed.
      const bundle = {
        targetName: target.name,
        targetOrganization: target.organization,
        department:
          typeof prevRaw.department === "string" ? prevRaw.department : "",
        researchAreas: Array.isArray(prevRaw.researchAreas)
          ? prevRaw.researchAreas
          : [],
        profileUrl:
          typeof prevRaw.profileUrl === "string" ? prevRaw.profileUrl : "",
        knownDomain: target.domain,
      };

      let bundleText = JSON.stringify(bundle, null, 2);
      if (bundleText.length > MAX_SOURCE_CHARS) {
        bundleText = bundleText.slice(0, MAX_SOURCE_CHARS) + "\n\n[truncated]";
      }

      const { tasteJson, cost } = await runProfessorTasteReconstruction(
        target.name,
        target.organization,
        bundleText,
      );
      const tasteParsed = JSON.parse(tasteJson) as object;

      await prisma.target.update({
        where: { id: targetId },
        data: {
          tasteModel: tasteParsed,
          tasteModelVersion: { increment: 1 },
          lastResearchedAt: new Date(),
          rawData: {
            ...prevRaw,
            tasteReconstructedAt: cost.at,
            researchCost: cost,
          },
        },
      });

      await discoverEmail(target, prevRaw);

      return NextResponse.json({ ok: true, targetId, type: "PROFESSOR" });
    }

    // RECRUITER — use web_search to gather LinkedIn/company context
    const recruiterBundle = {
      name: target.name,
      organization: target.organization,
      domain: target.domain,
      linkedinUrl:
        typeof prevRaw.linkedinUrl === "string" ? prevRaw.linkedinUrl : "",
      role: typeof prevRaw.role === "string" ? prevRaw.role : "",
      priorRaw: prevRaw,
    };
    let rText = JSON.stringify(recruiterBundle, null, 2);
    if (rText.length > MAX_SOURCE_CHARS) {
      rText = rText.slice(0, MAX_SOURCE_CHARS) + "\n\n[truncated]";
    }

    const { tasteJson, cost } = await runRecruiterTasteReconstruction(
      target.name,
      target.organization,
      rText,
    );
    const tasteParsed = JSON.parse(tasteJson) as object;

    await prisma.target.update({
      where: { id: targetId },
      data: {
        tasteModel: tasteParsed,
        tasteModelVersion: { increment: 1 },
        lastResearchedAt: new Date(),
        rawData: {
          ...prevRaw,
          tasteReconstructedAt: cost.at,
          researchCost: cost,
        },
      },
    });

    await discoverEmail(target, prevRaw);

    return NextResponse.json({ ok: true, targetId, type: "RECRUITER" });
  } catch (e) {
    console.error("[targets/research]", e);
    const message = e instanceof Error ? e.message : "Research failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function discoverEmail(
  target: { id: string; name: string; organization: string; email: string | null; type: TargetType },
  prevRaw: Record<string, unknown>,
) {
  if (target.email) return;

  try {
    const profileUrl =
      target.type === TargetType.PROFESSOR
        ? (typeof prevRaw.profileUrl === "string" ? prevRaw.profileUrl : undefined)
        : (typeof prevRaw.linkedinUrl === "string" ? prevRaw.linkedinUrl : undefined);

    const found = await findTargetEmail(
      target.name,
      target.organization,
      target.type,
      profileUrl,
    );

    if (found) {
      await prisma.target.update({ where: { id: target.id }, data: { email: found } });
      return;
    }

    if (process.env.HUNTER_API_KEY) {
      const parts = target.name.trim().split(/\s+/);
      const firstName = parts[0] ?? "";
      const lastName = parts.slice(1).join(" ");
      const domain = guessEmailDomain(target.organization, target.type);
      if (domain) {
        const hunterEmail = await findEmailHunterIo(firstName, lastName, domain);
        if (hunterEmail) {
          await prisma.target.update({ where: { id: target.id }, data: { email: hunterEmail } });
        }
      }
    }
  } catch (err) {
    console.error("[targets/research] email discovery failed", err);
  }
}
