"use client";

import { hasFutureWorkBridge } from "@/components/compose/AnglePicker";
import { findBannedPhraseRanges } from "@/lib/email-banned-phrases";
import type { CompatibilityMatch } from "@/types";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

function countWords(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

function Tip({
  text,
  children,
  position = "bottom",
}: {
  text: string;
  children: ReactNode;
  position?: "top" | "bottom";
}) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const enter = () => {
    timer.current = setTimeout(() => setShow(true), 1200);
  };
  const leave = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setShow(false);
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const isTop = position === "top";

  return (
    <span className="relative inline-flex" onMouseEnter={enter} onMouseLeave={leave}>
      {children}
      <span
        className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-[#1c1b17] px-3 py-2 text-[11px] leading-snug font-normal normal-case tracking-normal text-[#f2efe8] shadow-xl transition-all duration-200 ${
          isTop ? "bottom-full mb-2.5" : "top-full mt-2.5"
        } ${
          show
            ? `opacity-100 ${isTop ? "translate-y-0" : "translate-y-0"}`
            : `opacity-0 ${isTop ? "translate-y-1" : "-translate-y-1"} scale-95`
        }`}
      >
        {text}
        <span
          className={`absolute left-1/2 -translate-x-1/2 border-[5px] border-transparent ${
            isTop
              ? "top-full border-t-[#1c1b17]"
              : "bottom-full border-b-[#1c1b17]"
          }`}
        />
      </span>
    </span>
  );
}

type EmailToneChoice = "FORMAL" | "CONFIDENT" | "CURIOUS";
type EmailAngleChoice = "ALIGNMENT" | "CONTRIBUTION" | "CURIOSITY";

type TargetPayload = {
  id: string;
  name: string;
  email: string | null;
  organization: string;
};

export type SendSuccessPayload = {
  subject: string;
  body: string;
  to: string;
  targetName: string;
  organization: string;
  followups: { type: string; sendAt: string }[];
};

type EmailPayload = {
  id: string;
  subject: string;
  body: string;
  angle: string;
  tone: string;
  status: string;
  generationMetadata: unknown;
  target: TargetPayload;
  followups?: { id: string; type: string; sendAt: string; status: string }[];
};

function highlightText(text: string): ReactNode {
  if (!text) return "\u00a0";
  const ranges = findBannedPhraseRanges(text);
  if (!ranges.length) return text;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  for (const r of ranges) {
    if (r.start > cursor) {
      nodes.push(<span key={key++}>{text.slice(cursor, r.start)}</span>);
    }
    nodes.push(
      <mark
        key={key++}
        className="bg-transparent text-[#1c1b17] underline decoration-red-600 decoration-2 underline-offset-2"
      >
        {text.slice(r.start, r.end)}
      </mark>,
    );
    cursor = r.end;
  }
  if (cursor < text.length) {
    nodes.push(<span key={key++}>{text.slice(cursor)}</span>);
  }
  return nodes;
}

function readMatchesFromMeta(raw: unknown): CompatibilityMatch[] {
  if (!raw || typeof raw !== "object") return [];
  const cm = (raw as { compatibilityMatches?: unknown }).compatibilityMatches;
  return Array.isArray(cm) ? (cm as CompatibilityMatch[]) : [];
}

type Props = {
  emailId: string;
  onSendSuccess?: (payload: SendSuccessPayload) => void;
};

export default function EmailEditor({ emailId, onSendSuccess }: Props) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [angle, setAngle] = useState<string>("ALIGNMENT");
  const [tone, setTone] = useState<string>("FORMAL");
  const [revision, setRevision] = useState(0);
  const [storedBridges, setStoredBridges] = useState<CompatibilityMatch[]>([]);
  const [saveBusy, setSaveBusy] = useState(false);
  const [refineBusy, setRefineBusy] = useState(false);
  const [sentenceBusy, setSentenceBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [sentenceError, setSentenceError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("DRAFT");
  const [target, setTarget] = useState<TargetPayload | null>(null);
  const [targetEmailInput, setTargetEmailInput] = useState("");
  const [targetEmailBusy, setTargetEmailBusy] = useState(false);
  const [targetEmailError, setTargetEmailError] = useState<string | null>(null);
  const [sendBusy, setSendBusy] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const bodyWords = useMemo(() => countWords(body), [body]);
  const bodyWordOk = bodyWords >= 120 && bodyWords <= 150;
  const contributionOk = useMemo(
    () => hasFutureWorkBridge(storedBridges),
    [storedBridges],
  );
  const readOnly = status === "SENT";

  const fetchEmail = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/emails/${emailId}`, { credentials: "include" });
      const data = (await res.json().catch(() => null)) as EmailPayload & {
        error?: string;
      } | null;
      if (!res.ok || !data?.id) {
        setLoadError(data?.error ?? "Could not load email.");
        return;
      }
      setSubject(data.subject);
      setBody(data.body);
      setAngle(data.angle);
      setTone(data.tone);
      setStatus(data.status ?? "DRAFT");
      setTarget(data.target ?? null);
      setTargetEmailInput(data.target?.email ?? "");
      setStoredBridges(readMatchesFromMeta(data.generationMetadata));
      const meta = data.generationMetadata as { revision?: number } | null;
      setRevision(typeof meta?.revision === "number" ? meta.revision : 0);
    } catch {
      setLoadError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [emailId]);

  useEffect(() => {
    void fetchEmail();
  }, [fetchEmail]);

  const runRefine = async (payload: {
    action: "switch_tone" | "regenerate" | "change_angle";
    newTone?: EmailToneChoice;
    newAngle?: EmailAngleChoice;
  }) => {
    setRefineBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/emails/${emailId}/refine`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        subject?: string;
        body?: string;
        angle?: string;
        tone?: string;
        revision?: number;
      } | null;
      if (!res.ok || !data?.subject || !data?.body) {
        setBanner(data?.error ?? "Refine failed.");
        return;
      }
      setSubject(data.subject);
      setBody(data.body);
      if (data.angle) setAngle(data.angle);
      if (data.tone) setTone(data.tone);
      if (typeof data.revision === "number") setRevision(data.revision);
      setBanner("Draft updated from AI.");
    } catch {
      setBanner("Network error.");
    } finally {
      setRefineBusy(false);
    }
  };

  const saveDraft = async () => {
    setSaveBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, body }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setBanner(data?.error ?? "Save failed.");
        return;
      }
      setBanner("Draft saved.");
    } catch {
      setBanner("Network error.");
    } finally {
      setSaveBusy(false);
    }
  };

  const saveTargetEmail = async () => {
    if (!target?.id) return;
    setTargetEmailBusy(true);
    setTargetEmailError(null);
    try {
      const res = await fetch(`/api/targets/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: targetEmailInput.trim() }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        email?: string;
      } | null;
      if (!res.ok || !data?.email) {
        setTargetEmailError(data?.error ?? "Could not save email.");
        return;
      }
      setTarget((t) => (t ? { ...t, email: data.email ?? null } : t));
      setBanner("Recipient email saved.");
    } catch {
      setTargetEmailError("Network error.");
    } finally {
      setTargetEmailBusy(false);
    }
  };

  const sendViaGmail = async () => {
    setSendBusy(true);
    setSendError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailId }),
      });
      const data = (await res.json().catch(() => null)) as SendSuccessPayload & {
        error?: string;
        messageId?: string;
      } | null;
      if (!res.ok || !data || !Array.isArray(data.followups)) {
        setSendError(data?.error ?? "Send failed.");
        return;
      }
      setStatus("SENT");
      onSendSuccess?.({
        subject: data.subject,
        body: data.body,
        to: data.to,
        targetName: data.targetName,
        organization: data.organization,
        followups: data.followups,
      });
    } catch {
      setSendError("Network error.");
    } finally {
      setSendBusy(false);
    }
  };

  const rewriteSelection = async () => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = body.slice(start, end).trim();
    setSentenceError(null);
    if (!sel || sel.length < 8) {
      setSentenceError("Select a full sentence in the body (drag to highlight).");
      return;
    }
    setSentenceBusy(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/rewrite-sentence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sentence: sel, body, subject }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        replacement?: string;
      } | null;
      if (!res.ok || !data?.replacement) {
        setSentenceError(data?.error ?? "Rewrite failed.");
        return;
      }
      const next = body.slice(0, start) + data.replacement + body.slice(end);
      setBody(next);
      setBanner("Selection rewritten. Save draft to persist.");
    } catch {
      setSentenceError("Network error.");
    } finally {
      setSentenceBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="border-[1.5px] border-[#1c1b17] bg-white px-6 py-10 text-center text-[#5a5850]">
        Loading draft…
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        className="border-[1.5px] border-[#7a4a10] bg-[#fff0d4] px-4 py-3 text-[13px] text-[#7a4a10]"
        role="alert"
      >
        {loadError}
      </div>
    );
  }

  const senderName = target?.name ? undefined : "You";
  const recipientEmail = target?.email ?? "recipient@example.com";
  const recipientName = target?.name ?? "Recipient";

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-[1.5px] border-[#c8c4ba] pb-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
            Edit draft
          </p>
          <h2
            className="mt-1 text-lg font-semibold tracking-tight text-[#1c1b17]"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            Refine before send
          </h2>
          <p className="mt-1 text-[12px] text-[#5a5850]">
            Angle <span className="text-[#1c1b17]">{angle}</span> · Tone{" "}
            <span className="text-[#1c1b17]">{tone}</span>
            {revision > 0 ? (
              <span className="text-[#8a8478]"> · AI revision {revision}</span>
            ) : null}
            {readOnly ? (
              <span className="text-[#7a4a10]"> · Sent (read-only)</span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tip text="Save your current edits without sending">
            <button
              type="button"
              disabled={saveBusy || readOnly}
              onClick={() => void saveDraft()}
              className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:opacity-40"
            >
              {saveBusy ? "Saving…" : "Save draft"}
            </button>
          </Tip>
          <Tip text="Send this email via your connected Gmail">
            <button
              type="button"
              disabled={sendBusy || readOnly || !target?.email?.trim()}
              onClick={() => void sendViaGmail()}
              className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:opacity-40"
            >
              {sendBusy ? "Sending…" : "Send with Gmail"}
            </button>
          </Tip>
        </div>
      </header>

      {/* Alerts */}
      {sendError ? (
        <div
          className="border-[1.5px] border-[#7a4a10] bg-[#fff0d4] px-4 py-3 text-[13px] text-[#7a4a10]"
          role="alert"
        >
          {sendError}
        </div>
      ) : null}

      {target ? (
        <div className="border-[1.5px] border-[#1c1b17] bg-[#fffef8] p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
            Recipient email
          </p>
          <p className="mt-2 text-sm text-[#5a5850]">
            {target.email?.trim() ? "Current recipient for this draft:" : "We don&apos;t have an address for "}
            <span className="font-semibold text-[#1c1b17]">{target.name}</span> at{" "}
            {target.organization}. {target.email?.trim() ? "You can edit it below." : "Add their email to enable send."}
          </p>
          <div className="mt-3 flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="email"
              value={targetEmailInput}
              onChange={(e) => setTargetEmailInput(e.target.value)}
              placeholder="professor@university.edu"
              className="min-w-0 flex-1 border-[1.5px] border-[#1c1b17] bg-white px-3 py-2 text-[15px] outline-none"
            />
            <Tip text="Save this address to the recipient's record">
              <button
                type="button"
                disabled={targetEmailBusy || !targetEmailInput.trim()}
                onClick={() => void saveTargetEmail()}
                className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:opacity-40"
              >
                {targetEmailBusy ? "Saving…" : "Save to contact"}
              </button>
            </Tip>
          </div>
          {targetEmailError ? (
            <p className="mt-2 text-[12px] text-red-600">{targetEmailError}</p>
          ) : null}
        </div>
      ) : null}

      {banner ? (
        <p className="text-[13px] text-[#5a5850]" role="status">
          {banner}
        </p>
      ) : null}

      {/* Two columns: editor card | preview card */}
      <div className="grid gap-8 xl:grid-cols-2">
        {/* Left: editor card */}
        <div className="border-[1.5px] border-[#1c1b17] bg-white p-5">
          <div className="space-y-5">
            <div className="space-y-2">
              <label
                className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]"
                htmlFor="email-subject"
              >
                Subject
              </label>
              <input
                id="email-subject"
                value={subject}
                readOnly={readOnly}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border-[1.5px] border-[#1c1b17] bg-white px-3 py-2.5 text-[15px] outline-none read-only:bg-[#f4f2ed]"
              />
              {findBannedPhraseRanges(subject).length > 0 ? (
                <p className="text-[11px] text-red-600">
                  Subject contains flagged stock phrasing — consider rewriting.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label
                  className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]"
                  htmlFor="email-body"
                >
                  Body
                </label>
                <span
                  className={`text-[11px] font-medium tabular-nums ${
                    bodyWordOk ? "text-[#5a5850]" : "text-red-600"
                  }`}
                >
                  {bodyWords} / 120–150 words
                </span>
              </div>

              <div className="relative max-h-[420px] overflow-y-auto rounded-sm border-[1.5px] border-[#1c1b17] bg-[#faf8f4]">
                <pre
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-0 m-0 whitespace-pre-wrap break-words p-3 font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-[#1c1b17]"
                >
                  {highlightText(body)}
                </pre>
                <textarea
                  id="email-body"
                  ref={bodyRef}
                  value={body}
                  readOnly={readOnly}
                  onChange={(e) => setBody(e.target.value)}
                  spellCheck
                  className="relative z-10 m-0 min-h-[320px] w-full resize-none bg-transparent p-3 font-[family-name:var(--font-mono)] text-[13px] leading-relaxed text-transparent caret-[#1c1b17] outline-none read-only:cursor-default"
                />
              </div>
              <p className="text-[11px] text-[#8a8478]">
                Banned stock phrases are underlined in red as you type.
              </p>
            </div>

            {/* AI toolbar */}
            <div className="space-y-3 border-t border-[#e8e4dc] pt-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
                AI tools
              </p>
              {/* Row 1: Angle */}
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">Angle</span>
                {(
                  [
                    ["ALIGNMENT", "Align", "Lead with shared domain overlap — you already work in their space"],
                    ["CONTRIBUTION", "Contrib", "Lead with a gap in their work your experience maps to"],
                    ["CURIOSITY", "Curiosity", "Lead with a sharp question showing you read their work deeply"],
                  ] as const
                ).map(([a, label, tip]) => {
                  const disabledAngle =
                    a === "CONTRIBUTION"
                      ? !contributionOk
                      : a === "CURIOSITY"
                        ? storedBridges.length === 0
                        : false;
                  return (
                    <Tip key={a} text={tip} position="top">
                      <button
                        type="button"
                        disabled={refineBusy || readOnly || angle === a || disabledAngle}
                        onClick={() => void runRefine({ action: "change_angle", newAngle: a })}
                        className={`border-[1.5px] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] disabled:opacity-40 ${
                          angle === a
                            ? "border-[#1c1b17] bg-[#1c1b17] text-[#f2efe8]"
                            : "border-[#c8c4ba] bg-white text-[#5a5850] hover:border-[#1c1b17]"
                        }`}
                      >
                        {label}
                      </button>
                    </Tip>
                  );
                })}
              </div>
              {/* Row 2: Tone */}
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">Tone</span>
                {(
                  [
                    ["FORMAL", "Formal", "Professional and respectful — best for first contact"],
                    ["CONFIDENT", "Confident", "Direct and assertive — shows conviction in your work"],
                    ["CURIOUS", "Curious", "Exploratory and question-driven — genuine interest"],
                  ] as const
                ).map(([t, label, tip]) => (
                  <Tip key={t} text={tip} position="top">
                    <button
                      type="button"
                      disabled={refineBusy || readOnly || tone === t}
                      onClick={() => void runRefine({ action: "switch_tone", newTone: t })}
                      className={`border-[1.5px] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] disabled:opacity-40 ${
                        tone === t
                          ? "border-[#1c1b17] bg-[#1c1b17] text-[#f2efe8]"
                          : "border-[#c8c4ba] bg-white text-[#5a5850] hover:border-[#1c1b17]"
                      }`}
                    >
                      {label}
                    </button>
                  </Tip>
                ))}
              </div>
              {/* Row 3: Actions */}
              <div className="flex items-center gap-2 border-t border-[#e8e4dc] pt-3">
                <Tip text="Highlight text in the body first, then click to rewrite just that part">
                  <button
                    type="button"
                    disabled={sentenceBusy || readOnly}
                    onClick={() => void rewriteSelection()}
                    className="border-[1.5px] border-[#1c1b17] bg-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] disabled:opacity-40"
                  >
                    {sentenceBusy ? "Rewriting…" : "Rewrite selection"}
                  </button>
                </Tip>
                <Tip text="Throw away this draft and generate a brand new one">
                  <button
                    type="button"
                    disabled={refineBusy || readOnly}
                    onClick={() => void runRefine({ action: "regenerate" })}
                    className="border-[1.5px] border-[#c8c4ba] bg-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#5a5850] hover:border-[#1c1b17] disabled:opacity-40"
                  >
                    {refineBusy ? "Working…" : "Regenerate draft"}
                  </button>
                </Tip>
              </div>
              {sentenceError ? (
                <p className="text-[11px] text-red-600">{sentenceError}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: preview card */}
        <div className="border-[1.5px] border-[#1c1b17] bg-white p-5">
          <div className="space-y-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
              Recipient&apos;s view
            </p>
            <div className="sticky top-6 overflow-hidden rounded-lg border-[1.5px] border-[#c8c4ba] bg-white">
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-[#e8e4dc] bg-[#faf8f4] px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-4 flex-1 truncate text-center text-[11px] font-medium text-[#8a8478]">
                  {subject || "New Message"}
                </span>
              </div>
              {/* Email header fields */}
              <div className="space-y-1 border-b border-[#e8e4dc] px-5 py-3 text-[12px]">
                <div className="flex gap-2">
                  <span className="w-14 shrink-0 text-right font-medium text-[#8a8478]">From:</span>
                  <span className="text-[#1c1b17]">{senderName ?? "You"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="w-14 shrink-0 text-right font-medium text-[#8a8478]">To:</span>
                  <span className="text-[#1c1b17]">
                    {recipientName}
                    {recipientEmail !== "recipient@example.com" && (
                      <span className="ml-1 text-[#8a8478]">&lt;{recipientEmail}&gt;</span>
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="w-14 shrink-0 text-right font-medium text-[#8a8478]">Subject:</span>
                  <span className="font-medium text-[#1c1b17]">{subject || "(no subject)"}</span>
                </div>
              </div>
              {/* Email body */}
              <div className="max-h-[520px] overflow-y-auto px-6 py-5">
                <div className="whitespace-pre-wrap font-sans text-[13.5px] leading-[1.75] text-[#1c1b17]">
                  {body || (
                    <span className="italic text-[#c8c4ba]">Start typing to see preview…</span>
                  )}
                </div>
              </div>
              {/* Footer */}
              <div className="border-t border-[#e8e4dc] bg-[#faf8f4] px-5 py-2 text-[10px] text-[#c8c4ba]">
                Sent via Gmail
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
