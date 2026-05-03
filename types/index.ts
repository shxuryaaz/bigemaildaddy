export type UserProfileDraft = {
  headline: string;
  skills: string[];
  eduSummary: string;
};

export type IdentityModel = {
  basics: {
    name: string;
    email: string;
    education: { school: string; degree: string; year: string }[];
  };
  skills: Array<{
    name: string;
    rank: "core" | "strong" | "familiar";
    evidence: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    domain: string;
    depth: "shallow" | "meaningful" | "deep";
    tech: string[];
  }>;
  experience: Array<{
    role: string;
    org: string;
    duration: string;
    highlights: string[];
  }>;
  domains: string[];
  redFlags: string[];
};
