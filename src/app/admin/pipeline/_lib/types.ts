export type FIType = "bank" | "cu";

export interface FI {
  id: string; // "bank-<FDIC cert>" | "cu-<NCUA charter>"
  type: FIType;
  name: string;
  city: string;
  state: string;
  assets: number; // dollars
}

export type MainStageId =
  | "mql"
  | "warm-lead"
  | "qualified"
  | "discovery-scheduled"
  | "discovery-complete"
  | "demo-completed"
  | "proposal-sent"
  | "verbal-commitment"
  | "closed-won"
  | "closed-lost";

export type BranchStageId =
  | "short-term-nurture"
  | "long-term-nurture"
  | "disqualified"
  | "bad-contact-info"
  | "signed-with-competitor";

export type StageId = MainStageId | BranchStageId;

/** Computed funnel tiers — never stored, always derived from universe + records. */
export type TierId = "universe" | "addressable" | "active-pursuit";

/** Everything a stage list page can show. */
export type ListId = TierId | StageId;

/** Sales channel: a direct deal vs one sourced through a referral partner. */
export type Channel = "direct" | "referral";

/** A person we're working with at an institution. First in the list is primary. */
export interface Contact {
  name: string;
  email?: string;
  title?: string;
}

export interface PipelineRecord {
  fiId: string;
  stage: StageId | null; // null = no deal; FI sits in the sizing tiers only
  owner: string | null;
  platformFit?: boolean;
  leadSource?: string;
  /** Direct vs referral. Absent = treated as direct. */
  channel?: Channel;
  /** Referral partner name, when channel is "referral". */
  referralPartner?: string;
  /** People we're working with at this institution (first = primary). */
  contacts?: Contact[];
  /** Tech stack (seeded from the TruStage LOS/Core list, editable per FI). */
  coreSystem?: string;
  los?: string;
  homeBanking?: string;
  notes?: string;
  arr?: number; // per-deal ARR override, dollars
  /** Calendar year a closed-won / closed-lost deal is attributed to. */
  closedYear?: number;
  updatedAt: string;
}

export interface PipelineSettings {
  owners: string[];
  salesGoal: number;
  defaultDealArr: number;
  stageProbabilities: Record<StageId, number>;
  /** Common values offered as dropdown options for each tech attribute
   *  (an "Other…" choice always reveals a free-text field on top of these). */
  coreOptions?: string[];
  losOptions?: string[];
  homeBankingOptions?: string[];
}

export interface PipelineState {
  records: Record<string, PipelineRecord>;
  settings: PipelineSettings;
  /** IDs of workbook-unmatched rows that have been linked or dismissed. */
  resolvedUnmatched?: string[];
  updatedAt: string;
}

/** A workbook row that couldn't be auto-matched, for in-app resolution. */
export interface UnmatchedRow {
  id: string;
  name: string;
  sheet: string;
  reason: string;
  intended: { stage?: StageId; owner?: string; leadSource?: string };
}

/** PATCH payloads accepted by /api/pipeline */
export type PipelinePatch =
  | { type: "record"; fiId: string; patch: Partial<Omit<PipelineRecord, "fiId" | "updatedAt">> }
  | { type: "records"; fiIds: string[]; patch: Partial<Omit<PipelineRecord, "fiId" | "updatedAt">> }
  | { type: "settings"; patch: Partial<PipelineSettings> }
  // Link an unmatched workbook row to a chosen FI (applies patch + marks the
  // row resolved) or dismiss it (fiId null, patch omitted).
  | {
      type: "resolveUnmatched";
      unmatchedId: string;
      fiId: string | null;
      patch?: Partial<Omit<PipelineRecord, "fiId" | "updatedAt">>;
    }
  | { type: "reset" };
