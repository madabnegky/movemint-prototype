import type { BranchStageId, ListId, MainStageId, StageId, TierId } from "./types";

export const MAIN_STAGES: MainStageId[] = [
  "mql",
  "sql",
  "warm-lead",
  "qualified",
  "discovery-scheduled",
  "discovery-complete",
  "demo-completed",
  "proposal-sent",
  "verbal-commitment",
  "closed-won",
  "closed-lost",
];

export const BRANCH_STAGES: BranchStageId[] = [
  "short-term-nurture",
  "long-term-nurture",
  "disqualified",
  "bad-contact-info",
  "signed-with-competitor",
];

export const ALL_STAGES: StageId[] = [...MAIN_STAGES, ...BRANCH_STAGES];

export const TIERS: TierId[] = [
  "universe",
  "addressable-asset",
  "addressable-fit",
  "active-pursuit",
];

export const STAGE_LABELS: Record<ListId, string> = {
  universe: "Universe",
  "addressable-asset": "Addressable — Asset Size",
  "addressable-fit": "Addressable — Asset + Platform Fit",
  "active-pursuit": "Active Pursuit",
  mql: "Marketing Qualified",
  sql: "Sales Qualified",
  "warm-lead": "Warm Lead",
  qualified: "Qualified",
  "discovery-scheduled": "Discovery Scheduled",
  "discovery-complete": "Discovery Complete",
  "demo-completed": "Demo Completed",
  "proposal-sent": "Proposal Sent",
  "verbal-commitment": "Verbal Commitment",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
  "short-term-nurture": "Short-Term Nurture",
  "long-term-nurture": "Long-Term Nurture",
  disqualified: "Disqualified / No Fit",
  "bad-contact-info": "Bad Contact Info",
  "signed-with-competitor": "Signed with Competitor",
};

/** Deal stages that count toward the weighted pipeline (open funnel). */
export const OPEN_FUNNEL_STAGES: MainStageId[] = MAIN_STAGES.filter(
  (s) => s !== "closed-won" && s !== "closed-lost",
);

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
