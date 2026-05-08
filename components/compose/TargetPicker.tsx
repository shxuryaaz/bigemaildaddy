"use client";

import type { TargetSearchHit } from "@/lib/compose-target";
import { hitDedupeId } from "@/lib/compose-target";

type Props = {
  hits: TargetSearchHit[];
  selectedId: string | null;
  onSelect: (hit: TargetSearchHit) => void;
  disabled?: boolean;
};

export default function TargetPicker({
  hits,
  selectedId,
  onSelect,
  disabled = false,
}: Props) {
  if (hits.length === 0) {
    return (
      <div className="border-[1.5px] border-[#1c1b17] bg-white p-5 text-sm text-[#5a5850]">
        No matches. Try a different name or keyword.
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {hits.map((hit) => {
        const id = hitDedupeId(hit);
        const active = selectedId === id;
        const role =
          hit.kind === "professor" ? hit.department || "Researcher" : hit.role;
        const org =
          hit.kind === "professor" ? hit.affiliation : hit.company;
        const meta =
          hit.kind === "professor"
            ? hit.researchAreas.slice(0, 3).join(" · ") ||
              hit.profileUrl.replace(/^https?:\/\//, "").slice(0, 60)
            : hit.linkedinUrl.replace(/^https?:\/\//, "").slice(0, 48);

        return (
          <li key={id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(hit)}
              className={`flex w-full flex-col border-[1.5px] border-[#1c1b17] p-5 text-left transition-colors ${
                active
                  ? "bg-[#1c1b17] text-[#f2efe8]"
                  : "bg-white hover:bg-[#f8f6f2]"
              } ${disabled ? "cursor-wait opacity-50" : ""}`}
            >
              <span
                className={`text-[10px] font-medium uppercase tracking-[0.2em] ${
                  active ? "text-[#c8c4ba]" : "text-[#8a8478]"
                }`}
              >
                Candidate
              </span>
              <span
                className={`mt-1 text-lg font-semibold leading-tight ${
                  active ? "text-[#f2efe8]" : "text-[#1c1b17]"
                }`}
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                {hit.name}
              </span>
              <span
                className={`mt-2 text-[11px] font-medium uppercase tracking-[0.2em] ${
                  active ? "text-[#c8c4ba]" : "text-[#5a5850]"
                }`}
              >
                {role}
              </span>
              <span
                className={`mt-1 text-sm ${active ? "text-[#e8e4dc]" : "text-[#1c1b17]"}`}
              >
                {org}
              </span>
              <div
                className={`mt-3 flex flex-wrap items-baseline gap-2 border-t-[1.5px] pt-3 ${
                  active ? "border-[#5a5850]" : "border-[#e8e4dc]"
                }`}
              >
                <span
                  className={`text-[10px] font-medium uppercase tracking-[0.2em] ${
                    active ? "text-[#c8c4ba]" : "text-[#8a8478]"
                  }`}
                >
                  Domain
                </span>
                <span className={`text-xs ${active ? "text-[#e8e4dc]" : "text-[#1c1b17]"}`}>
                  {hit.domain}
                </span>
              </div>
              <p
                className={`mt-2 font-[family-name:var(--font-mono)] text-[11px] ${
                  active ? "text-[#c8c4ba]" : "text-[#5a5850]"
                }`}
              >
                {meta}
              </p>
              {(hit.kind === "professor" ? hit.profileUrl : hit.linkedinUrl) && (
                <a
                  href={hit.kind === "professor" ? hit.profileUrl : hit.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-2 inline-block font-[family-name:var(--font-mono)] text-[11px] underline underline-offset-2 ${
                    active
                      ? "text-[#e8e4dc] hover:text-[#f2efe8]"
                      : "text-[#7a4a10] hover:text-[#1c1b17]"
                  }`}
                >
                  {(hit.kind === "professor" ? hit.profileUrl : hit.linkedinUrl)
                    .replace(/^https?:\/\//, "")
                    .slice(0, 55)}
                  {(hit.kind === "professor" ? hit.profileUrl : hit.linkedinUrl).replace(/^https?:\/\//, "").length > 55 ? "…" : ""}
                </a>
              )}
              <span
                className={`mt-3 self-start text-[10px] font-medium uppercase tracking-[0.2em] underline underline-offset-2 ${
                  active ? "text-[#c8c4ba]" : "text-[#8a8478]"
                }`}
              >
                View details →
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
