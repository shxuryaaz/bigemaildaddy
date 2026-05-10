"use client";

import AnglePicker, {
  type EmailAngleChoice,
} from "@/components/compose/AnglePicker";
import CompatibilityView from "@/components/compose/CompatibilityView";
import EmailEditor, {
  type SendSuccessPayload,
} from "@/components/compose/EmailEditor";
import TargetPicker from "@/components/compose/TargetPicker";
import type { ProfessorSearchHit, RecruiterSearchHit, TargetSearchHit } from "@/lib/compose-target";
import { hitDedupeId } from "@/lib/compose-target";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CompatibilityMatch } from "@/types";

const SESSION_KEY = "compose-session";

type SessionCache = {
  hits: TargetSearchHit[];
  matches: CompatibilityMatch[];
  selectedId: string | null;
  previewHit: TargetSearchHit | null;
  draftPreview: { subject: string; body: string; emailId: string } | null;
  pickedAngle: EmailAngleChoice | null;
  mode: SearchMode;
  manualForm: ManualForm;
  recipientEmailInput: string;
  recipientEmailConfirmed: boolean;
  recipientEmailMode: "view_found" | "editing";
  recipientEmailSource: "found" | "manual";
  recipientName: string;
  recipientOrganization: string;
  recipientTargetId: string;
};

function readSession(): Partial<SessionCache> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Partial<SessionCache>) : {};
  } catch {
    return {};
  }
}

function writeSession(data: SessionCache) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch { /* quota exceeded — ignore */ }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

type Step = "1" | "2" | "3" | "4" | "5" | "6" | "7";
type TargetTypeParam = "PROFESSOR" | "RECRUITER";
type SearchMode = "search" | "manual";
type RecipientEmailMode = "view_found" | "editing";

type EmailToneChoice = "FORMAL" | "CONFIDENT" | "CURIOUS";

function parseStep(s: string | null): Step {
  if (s === "2" || s === "3" || s === "4" || s === "5" || s === "6" || s === "7") return s;
  return "1";
}

function formatFollowupDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function parseAngle(s: string | null): EmailAngleChoice | null {
  if (s === "ALIGNMENT" || s === "CONTRIBUTION" || s === "CURIOSITY") return s;
  return null;
}

function parseTone(s: string | null): EmailToneChoice {
  if (s === "FORMAL" || s === "CONFIDENT" || s === "CURIOUS") return s;
  return "FORMAL";
}

function parseType(s: string | null): TargetTypeParam | null {
  if (s === "PROFESSOR" || s === "RECRUITER") return s;
  return null;
}

type ManualForm = {
  name: string;
  organization: string;
  department: string;
  researchAreas: string;
  email: string;
};

const emptyManual: ManualForm = {
  name: "",
  organization: "",
  department: "",
  researchAreas: "",
  email: "",
};

export default function ComposeWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = useMemo(() => parseStep(searchParams.get("step")), [searchParams]);
  const typeParam = useMemo(() => parseType(searchParams.get("type")), [searchParams]);
  const qParam = searchParams.get("q") ?? "";
  const targetIdParam = searchParams.get("targetId") ?? "";
  const angleParam = useMemo(
    () => parseAngle(searchParams.get("angle")),
    [searchParams],
  );
  const toneParam = useMemo(
    () => parseTone(searchParams.get("tone")),
    [searchParams],
  );
  const emailIdParam = searchParams.get("emailId") ?? "";

  // Derive max accessible step from URL params so back-nav never loses state
  const maxAccessibleStep = useMemo((): number => {
    if (emailIdParam) return 6;
    if (angleParam && targetIdParam) return 5;
    if (targetIdParam) return 4;
    if (qParam && typeParam) return 3;
    if (typeParam) return 2;
    return 1;
  }, [emailIdParam, angleParam, targetIdParam, qParam, typeParam]);

  const cached = useRef<Partial<SessionCache> | null>(null);
  if (cached.current === null) {
    cached.current = typeof window !== "undefined" ? readSession() : {};
  }
  const c = cached.current;

  const [mode, setMode] = useState<SearchMode>(c.mode ?? "search");
  const [queryInput, setQueryInput] = useState(qParam);
  const [manualForm, setManualForm] = useState<ManualForm>(c.manualForm ?? emptyManual);
  const [hits, setHits] = useState<TargetSearchHit[]>(c.hits ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(c.selectedId ?? null);
  const [previewHit, setPreviewHit] = useState<TargetSearchHit | null>(c.previewHit ?? null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matches, setMatches] = useState<CompatibilityMatch[]>(c.matches ?? []);
  const [pickedAngle, setPickedAngle] = useState<EmailAngleChoice | null>(c.pickedAngle ?? null);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [draftPreview, setDraftPreview] = useState<{
    subject: string;
    body: string;
    emailId: string;
  } | null>(c.draftPreview ?? null);
  const [sentConfirmation, setSentConfirmation] = useState<SendSuccessPayload | null>(
    null,
  );
  const [sentError, setSentError] = useState<string | null>(null);
  const [recipientEmailInput, setRecipientEmailInput] = useState(c.recipientEmailInput ?? "");
  const [recipientEmailConfirmed, setRecipientEmailConfirmed] = useState(
    c.recipientEmailConfirmed ?? false,
  );
  const [recipientEmailMode, setRecipientEmailMode] = useState<RecipientEmailMode>(
    c.recipientEmailMode ?? "editing",
  );
  const [recipientEmailSource, setRecipientEmailSource] = useState<"found" | "manual">(
    c.recipientEmailSource ?? "manual",
  );
  const [recipientName, setRecipientName] = useState(c.recipientName ?? "");
  const [recipientOrganization, setRecipientOrganization] = useState(c.recipientOrganization ?? "");
  const [recipientEmailBusy, setRecipientEmailBusy] = useState(false);
  const [recipientEmailError, setRecipientEmailError] = useState<string | null>(null);
  const recipientTargetRef = useRef(c.recipientTargetId ?? "");

  useEffect(() => {
    writeSession({
      hits,
      matches,
      selectedId,
      previewHit,
      draftPreview,
      pickedAngle,
      mode,
      manualForm,
      recipientEmailInput,
      recipientEmailConfirmed,
      recipientEmailMode,
      recipientEmailSource,
      recipientName,
      recipientOrganization,
      recipientTargetId: targetIdParam,
    });
  }, [
    hits,
    matches,
    selectedId,
    previewHit,
    draftPreview,
    pickedAngle,
    mode,
    manualForm,
    recipientEmailInput,
    recipientEmailConfirmed,
    recipientEmailMode,
    recipientEmailSource,
    recipientName,
    recipientOrganization,
    targetIdParam,
  ]);

  const setUrl = useCallback(
    (next: Record<string, string | undefined>, replace = false) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      const url = `/compose?${p.toString()}`;
      if (replace) router.replace(url); else router.push(url);
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!targetIdParam.trim()) {
      setRecipientEmailInput("");
      setRecipientEmailConfirmed(false);
      setRecipientEmailMode("editing");
      setRecipientName("");
      setRecipientOrganization("");
      setRecipientEmailError(null);
      recipientTargetRef.current = "";
      return;
    }
    if (recipientTargetRef.current === targetIdParam) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/targets/${targetIdParam}`, {
          credentials: "include",
        });
        const data = (await res.json().catch(() => null)) as {
          email?: string | null;
          name?: string;
          organization?: string;
        } | null;
        if (cancelled || !res.ok) return;
        const email = (data?.email ?? "").trim();
        setRecipientEmailInput(email);
        setRecipientEmailConfirmed(false);
        setRecipientEmailSource(email ? "found" : "manual");
        setRecipientEmailMode(email ? "view_found" : "editing");
        setRecipientName(data?.name ?? "");
        setRecipientOrganization(data?.organization ?? "");
        recipientTargetRef.current = targetIdParam;
      } catch {
        if (!cancelled) setRecipientEmailError("Could not load recipient email.");
      }
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIdParam]);

  const saveRecipientEmail = async () => {
    if (!targetIdParam.trim()) return;
    const email = recipientEmailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRecipientEmailError("Enter a valid email address.");
      return;
    }
    setRecipientEmailBusy(true);
    setRecipientEmailError(null);
    try {
      const res = await fetch(`/api/targets/${targetIdParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        email?: string;
      } | null;
      if (!res.ok || !data?.email) {
        setRecipientEmailError(data?.error ?? "Could not save recipient email.");
        return;
      }
      setRecipientEmailInput(data.email);
      setRecipientEmailConfirmed(true);
      setRecipientEmailMode("view_found");
      setRecipientEmailSource("manual");
    } catch {
      setRecipientEmailError("Network error.");
    } finally {
      setRecipientEmailBusy(false);
    }
  };

  useEffect(() => {
    setQueryInput(qParam);
  }, [qParam]);

  useEffect(() => {
    if (angleParam) setPickedAngle(angleParam);
  }, [angleParam]);

  useEffect(() => {
    if (["1", "2", "3", "4", "5", "6"].includes(step)) {
      setSentConfirmation(null);
    }
  }, [step]);

  useEffect(() => {
    if (step !== "7" || !emailIdParam.trim()) {
      setSentError(null);
      return;
    }
    const id = emailIdParam.trim();
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/emails/${id}`, {
          credentials: "include",
          signal: ac.signal,
        });
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          status?: string;
          subject?: string;
          body?: string;
          target?: { name?: string; email?: string | null; organization?: string };
          followups?: { type: string; sendAt: string }[];
        } | null;
        if (ac.signal.aborted) return;
        if (!res.ok) {
          setSentError(data?.error ?? "Could not load email.");
          return;
        }
        if (data?.status !== "SENT" || !data.followups?.length) {
          setSentError("This email is not in sent state yet.");
          return;
        }
        setSentError(null);
        setSentConfirmation((prev) => {
          if (prev) return prev;
          return {
            subject: data.subject ?? "",
            body: data.body ?? "",
            to: data.target?.email ?? "",
            targetName: data.target?.name ?? "",
            organization: data.target?.organization ?? "",
            followups: data.followups!.map((f) => ({
              type: f.type,
              sendAt: f.sendAt,
            })),
          };
        });
      } catch {
        if (!ac.signal.aborted) setSentError("Network error.");
      }
    })();
    return () => {
      ac.abort();
    };
  }, [step, emailIdParam]);

  const matchedTargetRef = useRef<string>("");

  useEffect(() => {
    if (step !== "4" && step !== "5") return;
    if (!targetIdParam.trim()) {
      setMatches([]);
      setMatchError(null);
      setMatchLoading(false);
      return;
    }
    if (matches.length > 0 && matchedTargetRef.current === targetIdParam.trim()) return;
    let cancelled = false;
    (async () => {
      setMatchLoading(true);
      setMatchError(null);
      try {
        const res = await fetch("/api/emails/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ targetId: targetIdParam.trim() }),
        });
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          matches?: CompatibilityMatch[];
        } | null;
        if (cancelled) return;
        if (!res.ok) {
          setMatches([]);
          setMatchError(data?.error ?? "Could not load compatibility matches.");
          return;
        }
        const fetched = Array.isArray(data?.matches) ? data.matches : [];
        setMatches(fetched);
        matchedTargetRef.current = targetIdParam.trim();
      } catch {
        if (!cancelled) {
          setMatches([]);
          setMatchError("Network error.");
        }
      } finally {
        if (!cancelled) setMatchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, targetIdParam]);

  const searchedQueryRef = useRef<string>("");

  useEffect(() => {
    if (step !== "3" || !typeParam || !qParam.trim()) return;
    const queryKey = `${typeParam}:${qParam.trim()}`;
    if (hits.length > 0 && searchedQueryRef.current === queryKey) return;
    let cancelled = false;
    (async () => {
      setSearchBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/targets/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ type: typeParam, query: qParam.trim() }),
        });
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          results?: TargetSearchHit[];
        } | null;
        if (!res.ok) {
          if (!cancelled) {
            setError(data?.error ?? "Search failed.");
            setHits([]);
          }
          return;
        }
        if (!cancelled) {
          const fetched = Array.isArray(data?.results) ? data.results : [];
          setHits(fetched);
          searchedQueryRef.current = queryKey;
        }
      } catch {
        if (!cancelled) {
          setError("Network error.");
          setHits([]);
        }
      } finally {
        if (!cancelled) setSearchBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, typeParam, qParam]);

  const confirmHit = async (hit: TargetSearchHit) => {
    setSelectedId(hitDedupeId(hit));
    setError(null);
    setActionBusy(true);
    try {
      const email =
        hit.kind === "professor"
          ? (hit.email ?? "")
          : (hit.email ?? "");
      const rawData =
        hit.kind === "professor"
          ? {
              kind: "professor",
              affiliation: hit.affiliation,
              department: hit.department,
              researchAreas: hit.researchAreas,
              profileUrl: hit.profileUrl,
            }
          : {
              kind: "recruiter",
              linkedinUrl: hit.linkedinUrl,
              role: hit.role,
            };

      if (!typeParam) {
        setError("Missing target type. Go back to step 1.");
        return;
      }

      const res = await fetch("/api/targets/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: typeParam,
          name: hit.name,
          organization: hit.organization,
          domain: hit.domain,
          email: email || undefined,
          rawData,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        targetId?: string;
        skipResearch?: boolean;
      } | null;
      if (!res.ok || !data?.targetId) {
        setError(data?.error ?? "Could not confirm target.");
        return;
      }

      if (!data.skipResearch) {
        setResearching(true);
        const rr = await fetch("/api/targets/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ targetId: data.targetId }),
        });
        setResearching(false);
        if (!rr.ok) {
          const err = (await rr.json().catch(() => null)) as { error?: string } | null;
          setError(err?.error ?? "Research failed.");
          return;
        }
      }

      const initialEmail = (email || "").trim().toLowerCase();
      setRecipientEmailInput(initialEmail);
      setRecipientEmailConfirmed(false);
      setRecipientEmailSource(initialEmail ? "found" : "manual");
      setRecipientEmailMode(initialEmail ? "view_found" : "editing");
      setRecipientName(hit.name);
      setRecipientOrganization(hit.organization);
      setRecipientEmailError(null);
      recipientTargetRef.current = data.targetId;

      setUrl({
        step: "4",
        type: typeParam ?? undefined,
        q: qParam || undefined,
        targetId: data.targetId,
      }, true);
    } catch {
      setError("Network error.");
    } finally {
      setActionBusy(false);
      setResearching(false);
    }
  };

  const onPick = (hit: TargetSearchHit) => {
    setSelectedId(hitDedupeId(hit));
    setPreviewHit(hit);
  };

  const onPickConfirm = (hit: TargetSearchHit) => {
    setPreviewHit(null);
    void confirmHit(hit);
  };

  const onManualConfirm = () => {
    if (!typeParam) return;
    const name = manualForm.name.trim();
    const organization = manualForm.organization.trim();
    if (!name || !organization) {
      setError("Name and university/company are required.");
      return;
    }
    setError(null);

    if (typeParam === "PROFESSOR") {
      const hit: ProfessorSearchHit = {
        kind: "professor",
        name,
        affiliation: organization,
        department: manualForm.department.trim(),
        researchAreas: manualForm.researchAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        profileUrl: "",
        organization,
        domain: "academic",
        email: manualForm.email.trim() || undefined,
      };
      void confirmHit(hit);
    } else {
      const hit: RecruiterSearchHit = {
        kind: "recruiter",
        name,
        role: manualForm.department.trim(),
        company: organization,
        domain: "recruiting",
        linkedinUrl: manualForm.researchAreas.trim(),
        organization,
        email: manualForm.email.trim() || undefined,
      };
      void confirmHit(hit);
    }
  };

  const fieldLabel = (text: string, required = false) => (
    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
      {text}
      {required && <span className="ml-0.5 text-[#7a4a10]">*</span>}
    </span>
  );

  const recipientReady = recipientEmailConfirmed && recipientEmailInput.trim().length > 0;
  const showRecipientPanel = (step === "4" || step === "5" || step === "6") && !!targetIdParam.trim();

  const recipientPanel = showRecipientPanel ? (
    <div className="border-[1.5px] border-[#1c1b17] bg-white p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
        Recipient email
      </p>
      <p className="mt-1 text-sm text-[#5a5850]">
        {recipientName ? (
          <>
            Confirm where this email will be sent for{" "}
            <span className="font-semibold text-[#1c1b17]">{recipientName}</span>
            {recipientOrganization ? ` (${recipientOrganization})` : ""}.
          </>
        ) : (
          "Confirm where this email will be sent before proceeding."
        )}
      </p>
      {recipientEmailMode === "view_found" && recipientEmailInput ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="border-[1.5px] border-[#c8c4ba] bg-[#faf8f4] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#5a5850]">
              {recipientEmailSource === "found" ? "Auto-found" : "Manual"}
            </span>
            <span className="text-sm font-medium text-[#1c1b17]">{recipientEmailInput}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRecipientEmailConfirmed(true)}
              className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f2efe8]"
            >
              Confirm email
            </button>
            <button
              type="button"
              onClick={() => {
                setRecipientEmailMode("editing");
                setRecipientEmailConfirmed(false);
              }}
              className="border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
            >
              Edit manually
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <input
            type="email"
            value={recipientEmailInput}
            onChange={(e) => {
              setRecipientEmailInput(e.target.value);
              setRecipientEmailConfirmed(false);
            }}
            placeholder="name@organization.com"
            className="w-full border-[1.5px] border-[#1c1b17] bg-white px-3 py-2.5 text-[15px] outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={recipientEmailBusy || !recipientEmailInput.trim()}
              onClick={() => void saveRecipientEmail()}
              className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f2efe8] disabled:opacity-40"
            >
              {recipientEmailBusy ? "Saving…" : "Save email"}
            </button>
            {recipientEmailInput ? (
              <button
                type="button"
                onClick={() => setRecipientEmailMode("view_found")}
                className="border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      )}
      {recipientEmailError ? (
        <p className="mt-2 text-[12px] text-[#7a4a10]">{recipientEmailError}</p>
      ) : null}
      {recipientReady ? (
        <p className="mt-2 text-[12px] text-[#5a5850]">Recipient confirmed. You can continue.</p>
      ) : (
        <p className="mt-2 text-[12px] text-[#7a4a10]">Confirm a valid recipient email to continue.</p>
      )}
    </div>
  ) : null;

  return (
    <div className="font-[family-name:var(--font-mono)] text-sm text-[#1c1b17]">
      <header className="border-b-[1.5px] border-[#1c1b17] pb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
          Compose
        </p>
        <h1
          className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          New email
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#5a5850]">
          Pick who you are writing to. Later steps will shape angle and tone.
        </p>
      </header>

      <ol className="mt-6 flex flex-wrap gap-6 border-b-[1.5px] border-[#c8c4ba] pb-4 text-[11px] uppercase tracking-[0.16em]">
        {(
          [
            ["1", "Audience"],
            ["2", "Search"],
            ["3", "Pick"],
            ["4", "Bridge"],
            ["5", "Write"],
            ["6", "Edit"],
            ["7", "Sent"],
          ] as const
        ).map(([n, label]) => {
          const isCurrent = step === n;
          const isAccessible = parseInt(n) <= maxAccessibleStep && !isCurrent;
          return (
            <li key={n}>
              {isAccessible ? (
                <button
                  type="button"
                  onClick={() => setUrl({ step: n })}
                  className="text-[#5a5850] underline underline-offset-2 hover:text-[#1c1b17]"
                >
                  {n} — {label}
                </button>
              ) : (
                <span
                  className={
                    isCurrent ? "font-semibold text-[#1c1b17]" : "text-[#c8c4ba]"
                  }
                >
                  {n} — {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {error ? (
        <div
          className="mt-4 border-[1.5px] border-[#7a4a10] bg-[#fff0d4] px-4 py-3 text-[13px] text-[#7a4a10]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {researching || actionBusy ? (
        <div className="mt-6 border-[1.5px] border-[#1c1b17] bg-white px-4 py-6 text-center text-[#5a5850]">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em]">
            {researching ? "Running research" : "Saving target"}
          </p>
          <p className="mt-2 text-sm">
            {researching
              ? "Building taste context for this target…"
              : "Confirming selection…"}
          </p>
        </div>
      ) : null}

      {step === "1" ? (
        <section className="mt-8 space-y-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
            Target type
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {(
              [
                ["PROFESSOR", "Professor"],
                ["RECRUITER", "Recruiter"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex cursor-pointer border-[1.5px] border-[#1c1b17] px-4 py-3 ${
                  typeParam === value ? "bg-[#1c1b17] text-[#f2efe8]" : "bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="tt"
                  className="sr-only"
                  checked={typeParam === value}
                  onChange={() => setUrl({ step: "1", type: value })}
                />
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">
                  {label}
                </span>
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={!typeParam}
            onClick={() => setUrl({ step: "2", type: typeParam ?? undefined })}
            className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:opacity-40"
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === "2" ? (
        <section className="mt-8 max-w-xl space-y-6">
          {/* mode toggle */}
          <div className="flex">
            {(["search", "manual"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`border-[1.5px] border-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] first:border-r-0 ${
                  mode === m ? "bg-[#1c1b17] text-[#f2efe8]" : "bg-white text-[#1c1b17]"
                }`}
              >
                {m === "search" ? "Search" : "Enter manually"}
              </button>
            ))}
          </div>

          {mode === "search" ? (
            <>
              <div className="space-y-2">
                <label
                  className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]"
                  htmlFor="q"
                >
                  Name, role, or description
                </label>
                <input
                  id="q"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && queryInput.trim()) {
                      setUrl({ step: "3", type: typeParam ?? undefined, q: queryInput.trim() });
                    }
                  }}
                  placeholder={
                    typeParam === "RECRUITER"
                      ? "e.g. CEO of Agilow, or head of eng at Razorpay"
                      : "e.g. Andrew Ng, or ML faculty at Stanford CS"
                  }
                  className="w-full border-[1.5px] border-[#1c1b17] bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-[#c8c4ba]"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setUrl({ step: "1", type: typeParam ?? undefined })}
                  className="border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!queryInput.trim()}
                  onClick={() =>
                    setUrl({
                      step: "3",
                      type: typeParam ?? undefined,
                      q: queryInput.trim(),
                    })
                  }
                  className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:opacity-40"
                >
                  Search
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                {fieldLabel(typeParam === "RECRUITER" ? "Full name" : "Full name", true)}
                <input
                  value={manualForm.name}
                  onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={typeParam === "RECRUITER" ? "e.g. Sarah Chen" : "e.g. Andrew Ng"}
                  className="w-full border-[1.5px] border-[#1c1b17] bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-[#c8c4ba]"
                />
              </div>
              <div className="space-y-1.5">
                {fieldLabel(typeParam === "RECRUITER" ? "Company" : "University / Institution", true)}
                <input
                  value={manualForm.organization}
                  onChange={(e) => setManualForm((f) => ({ ...f, organization: e.target.value }))}
                  placeholder={typeParam === "RECRUITER" ? "e.g. Stripe" : "e.g. Stanford University"}
                  className="w-full border-[1.5px] border-[#1c1b17] bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-[#c8c4ba]"
                />
              </div>
              <div className="space-y-1.5">
                {fieldLabel(typeParam === "RECRUITER" ? "Role / Title" : "Department")}
                <input
                  value={manualForm.department}
                  onChange={(e) => setManualForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder={
                    typeParam === "RECRUITER"
                      ? "e.g. Senior Technical Recruiter"
                      : "e.g. Computer Science"
                  }
                  className="w-full border-[1.5px] border-[#1c1b17] bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-[#c8c4ba]"
                />
              </div>
              <div className="space-y-1.5">
                {fieldLabel(
                  typeParam === "RECRUITER" ? "LinkedIn URL" : "Research areas",
                )}
                <input
                  value={manualForm.researchAreas}
                  onChange={(e) => setManualForm((f) => ({ ...f, researchAreas: e.target.value }))}
                  placeholder={
                    typeParam === "RECRUITER"
                      ? "e.g. linkedin.com/in/sarah-chen"
                      : "e.g. machine learning, NLP, reinforcement learning"
                  }
                  className="w-full border-[1.5px] border-[#1c1b17] bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-[#c8c4ba]"
                />
              </div>
              <div className="space-y-1.5">
                {fieldLabel("Email address")}
                <input
                  type="email"
                  value={manualForm.email}
                  onChange={(e) => setManualForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. ang@cs.stanford.edu"
                  className="w-full border-[1.5px] border-[#1c1b17] bg-white px-3 py-2.5 text-[15px] outline-none placeholder:text-[#c8c4ba]"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setUrl({ step: "1", type: typeParam ?? undefined })}
                  className="border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!manualForm.name.trim() || !manualForm.organization.trim() || actionBusy || researching}
                  onClick={onManualConfirm}
                  className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:opacity-40"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {step === "3" ? (
        <section className="mt-8 space-y-6">
          {!typeParam || !qParam.trim() ? (
            <div className="border-[1.5px] border-[#1c1b17] bg-white px-4 py-6 text-sm text-[#5a5850]">
              <p>Invalid compose URL. Start from step 1.</p>
              <button
                type="button"
                className="mt-4 border-[1.5px] border-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                onClick={() => setUrl({ step: "1", type: undefined, q: undefined })}
              >
                Reset
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
                  Results for &quot;{qParam}&quot;
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setUrl({ step: "2", type: typeParam ?? undefined, q: undefined })
                  }
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5a5850] underline"
                >
                  Edit query
                </button>
              </div>
              {searchBusy ? (
                <p className="text-[#5a5850]">Searching…</p>
              ) : (
                <TargetPicker
                  hits={hits}
                  selectedId={selectedId}
                  onSelect={onPick}
                  disabled={actionBusy || researching}
                />
              )}
            </>
          )}
        </section>
      ) : null}

      {step === "4" ? (
        <section className="mt-8 space-y-6">
          {!targetIdParam.trim() ? (
            <div className="border-[1.5px] border-[#1c1b17] bg-white p-6 text-sm text-[#5a5850]">
              <p>Missing target. Go back and confirm a contact.</p>
              <Link
                href="/compose"
                className="mt-4 inline-block border-[1.5px] border-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
              >
                Start over
              </Link>
            </div>
          ) : (
            <>
              <CompatibilityView
                matches={matches}
                loading={matchLoading}
                error={matchError}
              />
              <div className="border-t border-[#e8e4dc]" />
              <AnglePicker
                value={pickedAngle}
                onChange={setPickedAngle}
                matches={matches}
              />
              {recipientPanel}
              <div className="flex flex-wrap gap-3 border-t border-[#e8e4dc] pt-6">
                <button
                  type="button"
                  onClick={() => setUrl({ step: "3" })}
                  className="border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!pickedAngle || matchLoading || !recipientReady}
                  onClick={() => {
                    if (!pickedAngle) return;
                    setGenerateError(null);
                    setUrl({
                      step: "5",
                      type: typeParam ?? undefined,
                      q: qParam || undefined,
                      targetId: targetIdParam,
                      angle: pickedAngle,
                      tone: toneParam,
                    });
                  }}
                  className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:opacity-40"
                >
                  Continue to tone
                </button>
                <Link
                  href="/compose"
                  className="inline-flex items-center border-[1.5px] border-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  Start over
                </Link>
              </div>
            </>
          )}
        </section>
      ) : null}

      {step === "5" ? (
        <section className="mt-8 space-y-6">
          {!targetIdParam.trim() || !angleParam ? (
            <div className="border-[1.5px] border-[#1c1b17] bg-white p-6 text-sm text-[#5a5850]">
              <p>Pick a target and angle first.</p>
              <button
                type="button"
                className="mt-4 border-[1.5px] border-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                onClick={() =>
                  setUrl({
                    step: "4",
                    type: typeParam ?? undefined,
                    q: qParam || undefined,
                    targetId: targetIdParam || undefined,
                  })
                }
              >
                Back to bridge
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
                  Tone
                </p>
                <p
                  className="mt-1 text-lg font-semibold text-[#1c1b17]"
                  style={{ fontFamily: "var(--font-serif), serif" }}
                >
                  How the email should sound
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {(
                    [
                      ["FORMAL", "Formal", "Polished, no contractions"],
                      ["CONFIDENT", "Confident", "Direct claims, still respectful"],
                      ["CURIOUS", "Curious", "Warm inquiry, not an exam"],
                    ] as const
                  ).map(([tone, label, hint]) => (
                    <label
                      key={tone}
                      className={`flex flex-1 cursor-pointer flex-col border-[1.5px] border-[#1c1b17] px-4 py-3 ${
                        toneParam === tone ? "bg-[#1c1b17] text-[#f2efe8]" : "bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tone"
                        className="sr-only"
                        checked={toneParam === tone}
                        onChange={() =>
                          setUrl({
                            step: "5",
                            type: typeParam ?? undefined,
                            q: qParam || undefined,
                            targetId: targetIdParam,
                            angle: angleParam,
                            tone,
                          })
                        }
                      />
                      <span className="text-[12px] font-semibold uppercase tracking-[0.14em]">
                        {label}
                      </span>
                      <span
                        className={`mt-1 text-[11px] ${
                          toneParam === tone ? "text-[#c8c4ba]" : "text-[#5a5850]"
                        }`}
                      >
                        {hint}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {recipientPanel}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setUrl({ step: "4" })}
                  className="border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={generateBusy || matchLoading || !recipientReady}
                  onClick={async () => {
                    setGenerateBusy(true);
                    setGenerateError(null);
                    try {
                      const matchIds = matches.map((_, i) => String(i));
                      const res = await fetch("/api/emails/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                          targetId: targetIdParam.trim(),
                          angle: angleParam,
                          tone: toneParam,
                          matchIds,
                          compatibilityMatches: matches,
                        }),
                      });
                      const data = (await res.json().catch(() => null)) as {
                        error?: string;
                        subject?: string;
                        body?: string;
                        emailId?: string;
                      } | null;
                      if (!res.ok || !data?.subject || !data?.body) {
                        setGenerateError(data?.error ?? "Generation failed.");
                        return;
                      }
                      setDraftPreview({
                        subject: data.subject,
                        body: data.body,
                        emailId: data.emailId ?? "",
                      });
                    } catch {
                      setGenerateError("Network error.");
                    } finally {
                      setGenerateBusy(false);
                    }
                  }}
                  className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:opacity-40"
                >
                  {generateBusy ? "Generating…" : "Generate draft"}
                </button>
              </div>

              {generateError ? (
                <div
                  className="border-[1.5px] border-[#7a4a10] bg-[#fff0d4] px-4 py-3 text-[13px] text-[#7a4a10]"
                  role="alert"
                >
                  {generateError}
                </div>
              ) : null}

              {draftPreview ? (
                <div className="space-y-4 border-[1.5px] border-[#1c1b17] bg-white p-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
                    Draft saved
                  </p>
                  <p
                    className="text-lg font-semibold text-[#1c1b17]"
                    style={{ fontFamily: "var(--font-serif), serif" }}
                  >
                    {draftPreview.subject}
                  </p>
                  <pre className="whitespace-pre-wrap font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-[#1c1b17]">
                    {draftPreview.body}
                  </pre>
                  {draftPreview.emailId ? (
                    <button
                      type="button"
                      onClick={() =>
                        setUrl({
                          step: "6",
                          type: typeParam ?? undefined,
                          q: qParam || undefined,
                          targetId: targetIdParam,
                          angle: angleParam ?? undefined,
                          tone: toneParam,
                          emailId: draftPreview.emailId,
                        }, true)
                      }
                      className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8]"
                    >
                      Edit & refine
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {step === "6" ? (
        <section className="mt-8 space-y-6">
          {!emailIdParam.trim() ? (
            <div className="border-[1.5px] border-[#1c1b17] bg-white p-6 text-sm text-[#5a5850]">
              <p>Missing email id. Generate a draft from step 5 first.</p>
              <button
                type="button"
                className="mt-4 border-[1.5px] border-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                onClick={() =>
                  setUrl({
                    step: "5",
                    type: typeParam ?? undefined,
                    q: qParam || undefined,
                    targetId: targetIdParam || undefined,
                    angle: angleParam ?? undefined,
                    tone: toneParam,
                  })
                }
              >
                Back to write
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setUrl({ step: "5" })}
                  className="border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  Back
                </button>
                <Link
                  href="/compose"
                  className="inline-flex items-center border-[1.5px] border-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  Start over
                </Link>
              </div>
              {recipientPanel}
              <EmailEditor
                emailId={emailIdParam.trim()}
                onSendSuccess={(payload) => {
                  setSentError(null);
                  setSentConfirmation(payload);
                  clearSession();
                  setUrl({
                    step: "7",
                    type: typeParam ?? undefined,
                    q: qParam || undefined,
                    targetId: targetIdParam || undefined,
                    angle: angleParam ?? undefined,
                    tone: toneParam,
                    emailId: emailIdParam.trim(),
                  }, true);
                }}
              />
            </>
          )}
        </section>
      ) : null}

      {step === "7" ? (
        <section className="mt-8 max-w-2xl space-y-6">
          {!emailIdParam.trim() ? (
            <div className="border-[1.5px] border-[#1c1b17] bg-white p-6 text-sm text-[#5a5850]">
              <p>Missing email id.</p>
              <Link
                href="/compose"
                className="mt-4 inline-block border-[1.5px] border-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
              >
                Start over
              </Link>
            </div>
          ) : sentConfirmation ? (
            <div className="space-y-6 border-[1.5px] border-[#1c1b17] bg-white p-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
                Message sent
              </p>
              <h2
                className="text-lg font-semibold tracking-tight text-[#1c1b17]"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                {sentConfirmation.subject}
              </h2>
              <p className="text-sm text-[#5a5850]">
                To{" "}
                <span className="font-medium text-[#1c1b17]">{sentConfirmation.to}</span> ·{" "}
                {sentConfirmation.targetName} ({sentConfirmation.organization})
              </p>
              <div className="border-t border-[#e8e4dc] pt-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
                  Summary
                </p>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-[#1c1b17]">
                  {sentConfirmation.body}
                </pre>
              </div>
              <div className="rounded-sm border border-[#c8c4ba] bg-[#faf8f4] px-4 py-3 text-sm text-[#5a5850]">
                <p className="font-semibold text-[#1c1b17]">Follow-ups scheduled</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {sentConfirmation.followups.map((f) => (
                    <li key={`${f.type}-${f.sendAt}`}>
                      {f.type === "DAY3" ? "Day 3" : f.type === "DAY7" ? "Day 7" : f.type}:{" "}
                      {formatFollowupDate(f.sendAt)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/sent"
                  className="inline-flex items-center border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8]"
                >
                  View in Sent
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearSession();
                    setUrl({
                      step: "1",
                      type: undefined,
                      q: undefined,
                      targetId: undefined,
                      angle: undefined,
                      tone: undefined,
                      emailId: undefined,
                    }, true);
                  }}
                  className="border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  New email
                </button>
              </div>
            </div>
          ) : sentError ? (
            <div className="border-[1.5px] border-[#7a4a10] bg-[#fff0d4] px-4 py-4 text-sm text-[#7a4a10]">
              {sentError}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/sent"
                  className="inline-block border-[1.5px] border-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  View Sent
                </Link>
                <button
                  type="button"
                  className="border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  onClick={() =>
                    setUrl({
                      step: "6",
                      type: typeParam ?? undefined,
                      q: qParam || undefined,
                      targetId: targetIdParam || undefined,
                      angle: angleParam ?? undefined,
                      tone: toneParam,
                      emailId: emailIdParam.trim(),
                    })
                  }
                >
                  Back to edit
                </button>
              </div>
            </div>
          ) : (
            <div className="border-[1.5px] border-[#1c1b17] bg-white px-6 py-10 text-center text-[#5a5850]">
              Loading confirmation…
            </div>
          )}
        </section>
      ) : null}

      {/* Candidate detail modal */}
      {previewHit ? (
        <div
          className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[#1c1b17]/70 px-4"
          onClick={() => setPreviewHit(null)}
        >
          <div
            className="animate-slide-up relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto border-[2px] border-[#1c1b17] bg-[#f2efe8] font-[family-name:var(--font-mono)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b-[1.5px] border-[#1c1b17] px-6 py-5">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
                  Candidate
                </p>
                <h2
                  className="mt-1 text-2xl font-black leading-tight text-[#1c1b17]"
                  style={{ fontFamily: "var(--font-serif), serif" }}
                >
                  {previewHit.name}
                </h2>
                <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.14em] text-[#5a5850]">
                  {previewHit.kind === "professor"
                    ? previewHit.department || "Researcher"
                    : previewHit.role}
                </p>
                <p className="mt-1 text-[14px] text-[#1c1b17]">
                  {previewHit.kind === "professor"
                    ? previewHit.affiliation
                    : previewHit.company}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewHit(null)}
                className="ml-4 mt-0.5 shrink-0 border-[1.5px] border-[#1c1b17] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1c1b17] hover:bg-[#1c1b17] hover:text-[#f2efe8]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Details body */}
            <div className="space-y-5 px-6 py-5">
              {/* Domain */}
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8a8478]">
                  Domain
                </p>
                <p className="mt-1 text-[13px] text-[#1c1b17]">{previewHit.domain}</p>
              </div>

              {/* Research areas — professors */}
              {previewHit.kind === "professor" &&
                previewHit.researchAreas.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8a8478]">
                      Research areas
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {previewHit.researchAreas.map((area) => (
                        <li
                          key={area}
                          className="border-[1px] border-[#c8c4ba] px-2 py-0.5 text-[11px] text-[#5a5850]"
                        >
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Profile / Scholar URL — professors */}
              {previewHit.kind === "professor" && previewHit.profileUrl && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8a8478]">
                    Profile
                  </p>
                  <a
                    href={previewHit.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block break-all text-[12px] text-[#1c1b17] underline underline-offset-2 hover:text-[#5a5850]"
                  >
                    {previewHit.profileUrl}
                  </a>
                </div>
              )}

              {/* LinkedIn — recruiters */}
              {previewHit.kind === "recruiter" && previewHit.linkedinUrl && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8a8478]">
                    LinkedIn
                  </p>
                  <a
                    href={
                      previewHit.linkedinUrl.startsWith("http")
                        ? previewHit.linkedinUrl
                        : `https://${previewHit.linkedinUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block break-all text-[12px] text-[#1c1b17] underline underline-offset-2 hover:text-[#5a5850]"
                  >
                    {previewHit.linkedinUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Footer — confirm button */}
            <div className="border-t-[1.5px] border-[#1c1b17] px-6 py-4">
              {(actionBusy || researching) ? (
                <div className="py-2 text-center text-[12px] uppercase tracking-[0.18em] text-[#5a5850]">
                  {researching ? "Running research…" : "Saving…"}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onPickConfirm(previewHit)}
                  className="w-full border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] hover:bg-[#2e2d28]"
                >
                  Continue with {previewHit.name.split(" ")[0]} →
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
