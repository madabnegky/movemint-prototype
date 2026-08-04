// Partner Pipeline types.
//
// Unlike the sales pipeline — where PipelineRecord is an *overlay* on a static
// FDIC/NCUA universe — partners have no canonical registry to fetch. The 34
// rows imported from the CEO's workbook ARE the dataset, and the team adds to
// them in-app. So Partner is a first-class record with full CRUD, not an
// overlay keyed to immutable data.

/** Main partnership lifecycle, in order. */
export type PartnerMainStageId = "not-contacted" | "contacted" | "active" | "signed";

/** Off-funnel states. Still valid move targets. */
export type PartnerBranchStageId = "dormant" | "not-a-fit";

export type PartnerStageId = PartnerMainStageId | PartnerBranchStageId;

/** Computed roll-up "tier" — every partner regardless of stage. */
export type PartnerTierId = "all";

/** Everything a partner list page can show. */
export type PartnerListId = PartnerTierId | PartnerStageId;

/**
 * How precise an FI-client count is. The source workbook mixes exact numbers
 * with "~4,000", "700+", "Hundreds" and "N/A", so the qualifier travels with
 * the value and the original string is never discarded.
 */
export type ReachQualifier =
  /** A plain number: "45". */
  | "exact"
  /** Approximate: "~4,000", "~50". */
  | "approx"
  /** A floor: "700+", "300+". Value holds the floor. */
  | "min"
  /** A range: "~150–200". Value holds the midpoint. */
  | "range"
  /** Explicitly not applicable (consultancies with no FI client base). */
  | "na"
  /** Unquantified prose: "Hundreds". Value is null. */
  | "unknown";

/**
 * Estimated number of FIs a partner can reach.
 *
 * `raw` is what the workbook said (or what a user typed) and is what the UI
 * displays. `value` is the number used for rollups — null when unquantifiable.
 * Rollups must report how many partners contributed null so an "est. reach"
 * total is never mistaken for complete.
 */
export interface FiReach {
  raw: string;
  value: number | null;
  qualifier: ReachQualifier;
}

/** Normalized bucket parsed from the workbook's compound "Company Type"
 *  ("CUSO / Payments" → ["cuso"]). Kept alongside the raw string so filtering
 *  works without losing the team's own phrasing. */
export type PartnerCategory =
  | "cuso"
  | "fintech"
  | "core-processor"
  | "consulting"
  | "trade-association"
  | "managed-services"
  | "other";

/** How Movemint gets paid on business sourced through a partner. */
export type RevShareModel =
  /** No commercial terms agreed yet. */
  | "none"
  /** Percentage of the deal's ARR. */
  | "percent-arr"
  /** A rate per consumer record processed (Vericast's model). */
  | "per-record"
  /** Fixed referral fee per closed deal. */
  | "flat-fee"
  /** Agreed but doesn't fit the shapes above — see revShare.notes. */
  | "other";

/**
 * Commercial terms. Deliberately permissive: most partners have no agreed
 * terms, and the ones that do vary in shape (Vericast is a full reseller on a
 * per-record charge; others are plain referral). Only the fields relevant to
 * `model` are expected to be set.
 */
export interface RevShare {
  model: RevShareModel;
  /** For "percent-arr": share of ARR as a fraction (0.20 = 20%). */
  percent?: number;
  /** For "per-record": dollars per record. Small — often fractions of a cent. */
  perRecordRate?: number;
  /** For "flat-fee": dollars per closed deal. */
  flatFee?: number;
  /** True when Movemint pays the partner; false/absent when the partner pays us. */
  outbound?: boolean;
  /** Full reseller vs referral-only. Resellers own the customer relationship. */
  isReseller?: boolean;
  /** Free text for terms that don't reduce to the fields above. */
  notes?: string;
}

export interface Partner {
  /** Slug derived from the name: "trustage", "banno-jack-henry". */
  id: string;
  name: string;
  /** Raw compound type string from the workbook, e.g. "CUSO / Payments". */
  companyType: string;
  /** Normalized buckets parsed from companyType, for filtering. */
  categories: PartnerCategory[];
  stage: PartnerStageId;
  fiReach: FiReach;
  /** Provenance/caveats for the FI count ("Notes on FI Clients"). */
  reachNotes?: string;
  primaryFocus?: string;
  /** Absolute URL — the importer prefixes bare domains with https://. */
  website?: string;
  /** Movemint's own commentary ("Movemint Notes") — the highest-signal column. */
  notes?: string;
  owner?: string | null;
  /** How many referrals this partner has actually sent us. Entered by hand —
   *  deliberately independent of `sourcedFiIds`, which tracks the institutions
   *  we've linked and lags behind the raw count. Absent = none recorded, which
   *  reads as 0. */
  referralsProvided?: number;
  revShare?: RevShare;
  /** FIs in the sales pipeline attributable to this partner. Mirrors
   *  PipelineRecord.partnerId; the API keeps both sides in sync. */
  sourcedFiIds?: string[];
  /** True for rows that came from the one-time workbook import, so the UI can
   *  show the original imported reach string as provenance. */
  imported?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerSettings {
  owners: string[];
  /** Display-only weighting for the funnel — partners carry no ARR of their
   *  own, so these drive bar emphasis and reach weighting, not dollars. */
  stageProbabilities: Record<PartnerStageId, number>;
  /** Dropdown options for the free-text-ish fields. */
  companyTypeOptions?: string[];
  /** Target number of signed partners for the year. */
  signedGoal?: number;
}

export interface PartnerState {
  partners: Record<string, Partner>;
  settings: PartnerSettings;
  updatedAt: string;
}

/** PATCH payloads accepted by /api/partners. */
export type PartnerPatch =
  | {
      type: "partner";
      id: string;
      patch: Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>;
    }
  | {
      type: "partners";
      ids: string[];
      patch: Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>;
    }
  | { type: "create"; partner: Omit<Partner, "createdAt" | "updatedAt"> }
  | { type: "delete"; id: string }
  | { type: "settings"; patch: Partial<PartnerSettings> }
  | { type: "reset" };
