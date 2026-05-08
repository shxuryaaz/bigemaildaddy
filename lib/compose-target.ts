export type ProfessorSearchHit = {
  kind: "professor";
  name: string;
  affiliation: string;
  department: string;
  researchAreas: string[];
  profileUrl: string;
  organization: string;
  domain: string;
  email?: string;
};

export type RecruiterSearchHit = {
  kind: "recruiter";
  name: string;
  role: string;
  company: string;
  domain: string;
  linkedinUrl: string;
  organization: string;
  email?: string;
};

export type TargetSearchHit = ProfessorSearchHit | RecruiterSearchHit;

export function hitDedupeId(hit: TargetSearchHit): string {
  if (hit.kind === "professor") {
    return `p:${hit.name}|${hit.organization}`;
  }
  return `r:${hit.linkedinUrl}|${hit.name}`;
}
