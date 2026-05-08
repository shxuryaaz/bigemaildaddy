export type UserProfileDraft = {
  headline: string;
  skills: string[];
  eduSummary: string;
};

export type TasteModel = {
  intellectualSignature: {
    coreThemes: string[];
    methodologicalLeaning: "theoretical" | "applied" | "mixed";
    stylisticMarkers: string[];
    rigorIndicators: string[];
  };
  unstatedPreferences: {
    impliedFutureWork: string[];
    pastAcceptedProfiles: string[];
    likelyTurnoffs: string[];
  };
  hooks: Array<{
    angle: string;
    reasoning: string;
    requires: string[];
  }>;
  papers?: Array<{
    title: string;
    year: number;
    coreClaim: string;
    futureWorkExtracted: string[];
  }>;
  hiringPattern?: {
    seniority: string;
    requiredSkills: string[];
    successfulHireProfile: string;
    problemSpace: string;
  };
};

export type CompatibilityMatch = {
  bridge: string;
  senderEvidence: {
    source: "project" | "experience" | "skill";
    detail: string;
  };
  targetEvidence: {
    source: "paper" | "futureWork" | "theme";
    detail: string;
  };
  conceptualOverlap: string;
  confidence: "high" | "medium";
  suggestedAngles: ("alignment" | "contribution" | "curiosity")[];
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
    url: string | null;
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
