"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { IdentityModel } from "@/types";

const MAX_BYTES = 5 * 1024 * 1024;

type Step = 1 | 2 | 3;

function rankStyles(rank: IdentityModel["skills"][number]["rank"]): string {
  switch (rank) {
    case "core":
      return "border-[#1c1b17] bg-[#1c1b17] text-[#f2efe8]";
    case "strong":
      return "border-[#1c1b17] bg-[#fff0d4] text-[#7a4a10]";
    default:
      return "border-[#c8c4ba] bg-white text-[#5a5850]";
  }
}

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [identity, setIdentity] = useState<IdentityModel | null>(null);
  const [githubUsername, setGithubUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragResume, setDragResume] = useState(false);
  const [dragLinkedin, setDragLinkedin] = useState(false);

  const pickResume = useCallback((file: File | null) => {
    setError(null);
    if (!file) {
      setResumeFile(null);
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Resume must be a PDF.");
      setResumeFile(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Resume must be at most 5MB.");
      setResumeFile(null);
      return;
    }
    setResumeFile(file);
  }, []);

  const pickLinkedin = useCallback((file: File | null) => {
    setError(null);
    if (!file) {
      setLinkedinFile(null);
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("LinkedIn export must be a PDF.");
      setLinkedinFile(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File must be at most 5MB.");
      setLinkedinFile(null);
      return;
    }
    setLinkedinFile(file);
  }, []);

  const submitResume = async () => {
    if (!resumeFile) {
      setError("Choose a PDF resume first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("resume", resumeFile);
      const res = await fetch("/api/profile/build", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => null)) as
        | IdentityModel
        | { error?: string }
        | null;
      if (!res.ok) {
        setError(
          typeof data === "object" && data && "error" in data && data.error
            ? String(data.error)
            : "Upload failed.",
        );
        return;
      }
      setIdentity(data as IdentityModel);
      setStep(2);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const submitGithub = async () => {
    const u = githubUsername.trim();
    if (!u) {
      setError("Enter your GitHub username.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ githubUsername: u }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        identity?: IdentityModel;
      } | null;
      if (!res.ok) {
        setError(data?.error ?? "Could not save GitHub username.");
        return;
      }
      if (data?.identity) {
        setIdentity(data.identity);
      }
      setStep(3);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const submitLinkedin = async () => {
    if (!linkedinFile) {
      setError("Choose a PDF or skip this step.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("linkedin", linkedinFile);
      const res = await fetch("/api/profile/linkedin", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Upload failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const finishSkipLinkedin = () => {
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="font-[family-name:var(--font-mono)] text-sm">
      <header className="border-b-[1.5px] border-[#1c1b17] px-1 pb-6 pt-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]">
          Onboarding
        </p>
        <h1
          className="mt-2 text-3xl font-black tracking-tight text-[#1c1b17] sm:text-4xl"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          Calibrate your signal
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#5a5850]">
          Upload a resume so we can build your evidence-backed identity model. GitHub
          anchors your public work; LinkedIn export is optional.
        </p>
      </header>

      <ol className="mt-8 flex flex-wrap gap-6 border-b-[1.5px] border-[#c8c4ba] pb-6">
        {(
          [
            [1, "Resume"],
            [2, "GitHub"],
            [3, "LinkedIn"],
          ] as const
        ).map(([n, label]) => (
          <li
            key={n}
            className={`flex items-baseline gap-2 ${step === n ? "text-[#1c1b17]" : "text-[#8a8478]"}`}
          >
            <span className="text-xs font-medium tracking-widest">
              {String(n).padStart(2, "0")}
            </span>
            <span
              className={`text-xs uppercase tracking-[0.18em] ${step === n ? "font-semibold" : ""}`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {error ? (
        <div
          className="mt-6 border-[1.5px] border-[#7a4a10] bg-[#fff0d4] px-4 py-3 text-[13px] text-[#7a4a10]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <section className="mt-10 space-y-6">
          <div>
            <label
              className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]"
              htmlFor="resume-input"
            >
              Resume (PDF, max 5MB)
            </label>
            <div
              className={`mt-2 border-[1.5px] border-dashed px-4 py-10 text-center transition-colors ${
                dragResume
                  ? "border-[#1c1b17] bg-[#fff0d4]"
                  : "border-[#c8c4ba] bg-white"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragResume(true);
              }}
              onDragLeave={() => setDragResume(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragResume(false);
                const f = e.dataTransfer.files[0];
                pickResume(f ?? null);
              }}
            >
              <input
                id="resume-input"
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => pickResume(e.target.files?.[0] ?? null)}
              />
              <p className="text-[13px] text-[#5a5850]">
                {resumeFile ? (
                  <>
                    <span className="font-medium text-[#1c1b17]">{resumeFile.name}</span>
                    <span className="text-[#8a8478]">
                      {" "}
                      ({(resumeFile.size / 1024).toFixed(0)} KB)
                    </span>
                  </>
                ) : (
                  "Drag and drop your resume here, or choose a file."
                )}
              </p>
              <button
                type="button"
                className="mt-4 border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#1c1b17] hover:bg-[#f8f6f2]"
                onClick={() => document.getElementById("resume-input")?.click()}
              >
                Choose PDF
              </button>
            </div>
          </div>
          <button
            type="button"
            disabled={busy || !resumeFile}
            onClick={submitResume}
            className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Extracting…" : "Continue"}
          </button>
        </section>
      ) : null}

      {step === 2 && identity ? (
        <section className="mt-10 space-y-8">
          <div>
            <h2
              className="text-xl font-bold text-[#1c1b17]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              Skills from your resume
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#5a5850]">
              Ranked by evidence in the PDF, not by self-reported buzzwords. You can still
              edit outreach later; this is the model we store on your profile.
            </p>
            <ul className="mt-6 space-y-4 border-[1.5px] border-[#1c1b17] bg-white p-4">
              {identity.skills.map((s, i) => (
                <li
                  key={`${s.name}-${i}`}
                  className="border-b-[1.5px] border-[#ddd9d0] pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#1c1b17]">{s.name}</span>
                    <span
                      className={`border-[1.5px] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] ${rankStyles(s.rank)}`}
                    >
                      {s.rank}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#5a5850]">{s.evidence}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label
              className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#8a8478]"
              htmlFor="github-user"
            >
              GitHub username
            </label>
            <input
              id="github-user"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              autoComplete="username"
              placeholder="octocat"
              className="mt-2 w-full max-w-md border-[1.5px] border-[#1c1b17] bg-white px-3 py-2.5 text-[14px] text-[#1c1b17] outline-none ring-0 placeholder:text-[#c8c4ba] focus:bg-[#f8f6f2]"
            />
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={submitGithub}
            className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Saving…" : "Continue"}
          </button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="mt-10 space-y-6">
          <div>
            <h2
              className="text-xl font-bold text-[#1c1b17]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              LinkedIn (optional)
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#5a5850]">
              Save a PDF export of your profile if you want it on file. You can skip and
              finish onboarding.
            </p>
            <div
              className={`mt-4 border-[1.5px] border-dashed px-4 py-8 text-center transition-colors ${
                dragLinkedin
                  ? "border-[#1c1b17] bg-[#fff0d4]"
                  : "border-[#c8c4ba] bg-white"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragLinkedin(true);
              }}
              onDragLeave={() => setDragLinkedin(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragLinkedin(false);
                const f = e.dataTransfer.files[0];
                pickLinkedin(f ?? null);
              }}
            >
              <input
                id="linkedin-input"
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => pickLinkedin(e.target.files?.[0] ?? null)}
              />
              <p className="text-[13px] text-[#5a5850]">
                {linkedinFile ? (
                  <span className="font-medium text-[#1c1b17]">{linkedinFile.name}</span>
                ) : (
                  "Drop a PDF export, or choose a file."
                )}
              </p>
              <button
                type="button"
                className="mt-3 border-[1.5px] border-[#1c1b17] bg-white px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[#1c1b17] hover:bg-[#f8f6f2]"
                onClick={() => document.getElementById("linkedin-input")?.click()}
              >
                Choose PDF
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={finishSkipLinkedin}
              className="border-[1.5px] border-[#1c1b17] bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1c1b17] hover:bg-[#f8f6f2] disabled:opacity-40"
            >
              Skip
            </button>
            <button
              type="button"
              disabled={busy || !linkedinFile}
              onClick={submitLinkedin}
              className="border-[1.5px] border-[#1c1b17] bg-[#1c1b17] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2efe8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Uploading…" : "Save & finish"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
