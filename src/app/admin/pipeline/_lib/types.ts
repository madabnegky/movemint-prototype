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
  /** Sales Qualified Lead. Stored as "qualified" for backwards compatibility —
   *  the id predates the label. See STAGE_LABELS. */
  | "qualified"
  | "discovery-complete"
  | "proposal-sent"
  | "verbal-commitment"
  | "contract-sent"
  | "closed-won"
  | "closed-lost";

export type BranchStageId =
  /** In TAM but missing the contact info Active Pursuit requires. Assigned by
   *  the importer when no contact carries a usable email — adding one is what
   *  moves the FI into Active Pursuit. */
  | "needs-contact"
  | "short-term-nurture"
  | "long-term-nurture";

export type StageId = MainStageId | BranchStageId;

/** Computed funnel tiers — never stored, always derived from universe + records. */
export type TierId = "universe" | "addressable" | "active-pursuit";

/** Everything a stage list page can show. */
export type ListId = TierId | StageId;

/** Sales channel: a direct deal vs one sourced through a referral partner. */
export type Channel = "direct" | "referral";

/** How the last outreach happened. Offered as dropdown options; "Other" reveals
 *  a free-text field, so the stored value isn't limited to this list. */
export const CONTACT_TYPES = [
  "Call",
  "Email",
  "LinkedIn",
  "Conference",
  "In Person",
] as const;

/** Starting set of lead sources, used when settings carry no list of their own.
 *  Editable in Settings → Lead sources; "Other…" accepts anything not listed. */
export const DEFAULT_LEAD_SOURCES = [
  "Inbound",
  "Outbound",
  "Conference",
  "Referral",
  "Partner",
  "Existing Relationship",
  "Marketing Campaign",
] as const;

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
  /** Referral partner name, when channel is "referral". Free text, predating
   *  the partner pipeline — `partnerId` is the structured successor. */
  referralPartner?: string;
  /** Partner this FI was sourced through, as a Partner.id from the partner
   *  pipeline. Mirrors Partner.sourcedFiIds; /api/partners is the only writer
   *  that keeps the two sides in sync. */
  partnerId?: string;
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
  /** Date of the last outreach to this FI, as "YYYY-MM-DD" (date only, no time —
   *  it's a calendar day, not an instant). Entered via a date picker so the
   *  format can't drift. Absent = never contacted. */
  lastContact?: string;
  /** How that last contact happened — one of CONTACT_TYPES, or free text when
   *  the user picks "Other". Absent = not recorded. */
  lastContactType?: string;
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
  /** How deals are sourced. Same "Other…" free-text escape hatch as the tech
   *  options above, so a new source never blocks logging a deal. Absent on
   *  blobs written before the field existed — DEFAULT_LEAD_SOURCES fills in. */
  leadSourceOptions?: string[];
}

export interface PipelineState {
  records: Record<string, PipelineRecord>;
  settings: PipelineSettings;
  /** IDs of workbook-unmatched rows that have been linked or dismissed. */
  resolvedUnmatched?: string[];
  updatedAt: string;
}

/** Why a workbook row needs a human before it can enter the pipeline. */
export type TriageClass =
  /** Institution has no cert/charter at all — can't be identified. */
  | "no-reg-id"
  /** Reg ID is real but resolves in the other registry (FI Type is wrong). */
  | "wrong-registry"
  /** Reg ID isn't in the current FDIC/NCUA universe — merged, closed, or wrong. */
  | "not-in-universe"
  /** Duplicate rows disagree about who owns the account. */
  | "owner-conflict"
  /** Funnel Stage value the importer doesn't recognize. */
  | "unknown-stage";

/** A workbook row that couldn't be imported, for in-app resolution. */
export interface UnmatchedRow {
  id: string;
  name: string;
  sheet: string;
  /** Which problem this row hit. Absent on rows from the legacy importer. */
  class?: TriageClass;
  reason: string;
  regId?: string;
  fiType?: string;
  assets?: number | null;
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
  // Undo a resolution — the row returns to the Unmatched panel. Does not
  // touch any record the resolve may have created (correct that separately).
  | { type: "unresolveUnmatched"; unmatchedId: string }
  | { type: "reset" };
