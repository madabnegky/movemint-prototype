import type { BranchStageId, ListId, MainStageId, StageId, TierId } from "./types";

export const MAIN_STAGES: MainStageId[] = [
  "mql",
  "qualified",
  "discovery-complete",
  "proposal-sent",
  "verbal-commitment",
  "contract-sent",
  "closed-won",
  "closed-lost",
];

export const BRANCH_STAGES: BranchStageId[] = [
  "needs-contact",
  "short-term-nurture",
  "long-term-nurture",
];

export const ALL_STAGES: StageId[] = [...MAIN_STAGES, ...BRANCH_STAGES];

export const TIERS: TierId[] = ["universe", "addressable", "active-pursuit"];

export const STAGE_LABELS: Record<ListId, string> = {
  universe: "Total Universe",
  addressable: "Total Addressable Market",
  "active-pursuit": "Active Pursuit",
  mql: "Marketing Qualified Lead",
  qualified: "Sales Qualified Lead",
  "discovery-complete": "Discovery Complete",
  "proposal-sent": "Proposal Sent",
  "verbal-commitment": "Verbal Commitment",
  "contract-sent": "Contract & Due Diligence Sent",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
  "needs-contact": "Needs Contact",
  "short-term-nurture": "Short-Term Nurture",
  "long-term-nurture": "Long-Term Nurture",
};

/** Compact labels for tight spots (funnel rows, table cells, dropdowns). */
export const STAGE_LABELS_SHORT: Partial<Record<ListId, string>> = {
  mql: "MQL",
  qualified: "SQL",
  "contract-sent": "Contract & DD Sent",
};

export function stageLabel(id: ListId, short = false): string {
  return (short && STAGE_LABELS_SHORT[id]) || STAGE_LABELS[id];
}

/** Who owns the stage, and what qualifies an institution to be in it.
 *  Surfaced through the (i) tooltips on the dashboard. */
export const STAGE_INFO: Record<ListId, { owner: string; definition: string }> = {
  universe: {
    owner: "Product",
    definition: "All credit unions and banks in the U.S.",
  },
  addressable: {
    owner: "Product",
    definition:
      "$250M to $50B in assets and LOS or core integrations available within 12 months.",
  },
  "active-pursuit": {
    owner: "Marketing, BDRs",
    definition:
      "Institution is within the Total Addressable Market (TAM) and contains the minimum contact information required for outreach.",
  },
  mql: {
    owner: "Marketing",
    definition:
      "Material engagement or response through phone, email, LinkedIn, conference, referral, marketing campaign, etc. At least 3 email opens, demo request, ROI request, etc.",
  },
  qualified: {
    owner: "Sales",
    definition: "Sales has connected and completed initial qualification.",
  },
  "discovery-complete": {
    owner: "Sales",
    definition: "Discovery complete and MEDDPICC qualification confirmed.",
  },
  "proposal-sent": {
    owner: "Sales",
    definition: "Proposal and ROI model delivered.",
  },
  "verbal-commitment": {
    owner: "Sales",
    definition: "Negotiation and verbal commitment.",
  },
  "contract-sent": {
    owner: "Sales",
    definition: "Contract & due diligence sent.",
  },
  "closed-won": {
    owner: "Sales",
    definition: "Signed contract.",
  },
  "closed-lost": {
    owner: "Sales",
    definition: "Verbal or e-mail loss notification.",
  },
  "needs-contact": {
    owner: "Marketing, BDRs",
    definition:
      "In the Total Addressable Market but without the contact information Active Pursuit requires. Adding a reachable contact moves it into Active Pursuit.",
  },
  "short-term-nurture": {
    owner: "Marketing, BDRs",
    definition: "No response after 18 pings from Sales or BDRs.",
  },
  "long-term-nurture": {
    owner: "Marketing",
    definition: "No responses to marketing after 90 days.",
  },
};

/** Deal stages that count toward the weighted pipeline (open funnel). */
export const OPEN_FUNNEL_STAGES: MainStageId[] = MAIN_STAGES.filter(
  (s) => s !== "closed-won" && s !== "closed-lost",
);

/** Stages the printed report summarises as a count but never lists institution
 *  by institution. MQL is high-volume and marketing-owned — the names add pages
 *  without adding signal to a sales read-out. Screen views are unaffected. */
export const PRINT_COUNT_ONLY_STAGES = new Set<ListId>(["mql"]);

export function isPrintCountOnly(id: ListId): boolean {
  return PRINT_COUNT_ONLY_STAGES.has(id);
}

export const ASSET_FLOOR = 250_000_000;
export const ASSET_CEILING = 50_000_000_000;

export function isStageId(v: string): v is StageId {
  return (ALL_STAGES as string[]).includes(v);
}
export function isTierId(v: string): v is TierId {
  return (TIERS as string[]).includes(v);
}
export function isListId(v: string): v is ListId {
  return isStageId(v) || isTierId(v);
}

export function fmtAssets(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(n >= 10e9 ? 0 : 1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
