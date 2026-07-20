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
  | "sql"
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
export type TierId = "universe" | "addressable-asset" | "addressable-fit" | "active-pursuit";

/** Everything a stage list page can show. */
export type ListId = TierId | StageId;

export interface PipelineRecord {
  fiId: string;
  stage: StageId | null; // null = no deal; FI sits in the sizing tiers only
  owner: string | null;
  platformFit?: boolean;
  leadSource?: string;
  notes?: string;
  arr?: number; // per-deal ARR override, dollars
  updatedAt: string;
}

export interface PipelineSettings {
  owners: string[];
  salesGoal: number;
  defaultDealArr: number;
  stageProbabilities: Record<StageId, number>;
}

export interface PipelineState {
  records: Record<string, PipelineRecord>;
  settings: PipelineSettings;
  updatedAt: string;
}

/** PATCH payloads accepted by /api/pipeline */
export type PipelinePatch =
  | { type: "record"; fiId: string; patch: Partial<Omit<PipelineRecord, "fiId" | "updatedAt">> }
  | { type: "records"; fiIds: string[]; patch: Partial<Omit<PipelineRecord, "fiId" | "updatedAt">> }
  | { type: "settings"; patch: Partial<PipelineSettings> }
  | { type: "reset" };
