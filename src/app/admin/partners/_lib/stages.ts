import type {
  FiReach,
  PartnerBranchStageId,
  PartnerCategory,
  PartnerListId,
  PartnerMainStageId,
  PartnerStageId,
  PartnerTierId,
  RevShareModel,
} from "./types";

export const PARTNER_MAIN_STAGES: PartnerMainStageId[] = [
  "not-contacted",
  "contacted",
  "active",
  "signed",
];

export const PARTNER_BRANCH_STAGES: PartnerBranchStageId[] = ["dormant", "not-a-fit"];

export const ALL_PARTNER_STAGES: PartnerStageId[] = [
  ...PARTNER_MAIN_STAGES,
  ...PARTNER_BRANCH_STAGES,
];

export const PARTNER_TIERS: PartnerTierId[] = ["all"];

export const PARTNER_STAGE_LABELS: Record<PartnerListId, string> = {
  all: "All Partners",
  "not-contacted": "Not Contacted",
  contacted: "Contacted",
  active: "In Discussion",
  signed: "Signed",
  dormant: "Dormant",
  "not-a-fit": "Not a Fit",
};

/** Who drives the stage, and what qualifies a partner to be in it. Surfaced
 *  through the (i) tooltips, matching the sales pipeline's StageInfo pattern. */
export const PARTNER_STAGE_INFO: Record<PartnerListId, { owner: string; definition: string }> = {
  all: {
    owner: "Partnerships",
    definition: "Every partner tracked, in any stage.",
  },
  "not-contacted": {
    owner: "Partnerships",
    definition:
      "Identified as a potential channel but no outreach yet. Often waiting on a warm intro or a finished pitch deck.",
  },
  contacted: {
    owner: "Partnerships",
    definition:
      "Outreach made — intro call, conference meeting, or email thread — but no active evaluation underway.",
  },
  active: {
    owner: "Partnerships",
    definition:
      "In live discussion: evaluating fit, reviewing an agreement, or negotiating terms.",
  },
  signed: {
    owner: "Partnerships",
    definition: "Executed partnership agreement. Reseller or referral terms in place.",
  },
  dormant: {
    owner: "Partnerships",
    definition:
      "Was in discussion but has gone quiet or is blocked on a dependency. Re-enters on a new signal.",
  },
  "not-a-fit": {
    owner: "Partnerships",
    definition:
      "Evaluated and set aside — no channel overlap, or a likely competitor rather than a partner.",
  },
};

/** Stages representing a live, forward-moving partnership conversation. */
export const OPEN_PARTNER_STAGES: PartnerMainStageId[] = ["contacted", "active"];

export const PARTNER_CATEGORY_LABELS: Record<PartnerCategory, string> = {
  cuso: "CUSO",
  fintech: "Fintech",
  "core-processor": "Core Processor",
  consulting: "Consulting",
  "trade-association": "Trade Association / League",
  "managed-services": "Managed Services",
  other: "Other",
};

export const PARTNER_CATEGORIES = Object.keys(PARTNER_CATEGORY_LABELS) as PartnerCategory[];

export const REV_SHARE_MODEL_LABELS: Record<RevShareModel, string> = {
  none: "No terms yet",
  "percent-arr": "% of ARR",
  "per-record": "Per record",
  "flat-fee": "Flat referral fee",
  other: "Other terms",
};

export function isPartnerStageId(v: string): v is PartnerStageId {
  return (ALL_PARTNER_STAGES as string[]).includes(v);
}
export function isPartnerTierId(v: string): v is PartnerTierId {
  return (PARTNER_TIERS as string[]).includes(v);
}
export function isPartnerListId(v: string): v is PartnerListId {
  return isPartnerStageId(v) || isPartnerTierId(v);
}

export function partnerStageLabel(id: PartnerListId): string {
  return PARTNER_STAGE_LABELS[id];
}

/** Compact count for display: 4000 → "4,000". */
export function fmtCount(n: number): string {
  return n.toLocaleString();
}

/**
 * Display string for a reach value. Prefers the raw string the team entered —
 * "700+" carries more meaning than "700" — and falls back to the parsed number.
 */
export function fmtReach(reach: FiReach | undefined): string {
  if (!reach) return "—";
  if (reach.raw.trim()) return reach.raw.trim();
  if (reach.value == null) return reach.qualifier === "na" ? "N/A" : "Unknown";
  return fmtCount(reach.value);
}

/** True when this reach contributes a number to rollups. */
export function isQuantified(reach: FiReach | undefined): boolean {
  return reach?.value != null;
}

/**
 * Parse a workbook FI-client string into a structured estimate.
 *
 * Handles the shapes present in the source sheet: plain numbers, "~4,000",
 * "700+", "~50+", "~5–10" (en dash and hyphen), "Hundreds", "N/A", and blanks.
 * Exported so the in-app editor reuses the exact same parsing as the importer.
 */
export function parseReach(input: string): FiReach {
  const raw = (input ?? "").trim();
  if (!raw) return { raw: "", value: null, qualifier: "na" };

  const lower = raw.toLowerCase();
  if (lower === "n/a" || lower === "na" || lower === "none") {
    return { raw, value: null, qualifier: "na" };
  }

  // Strip thousands separators and normalize dash variants before matching.
  const cleaned = raw.replace(/,/g, "").replace(/[–—]/g, "-");
  const approx = /^\s*~/.test(cleaned) || /\bapprox/i.test(cleaned) || /\best\b/i.test(cleaned);

  // Range: "~5-10", "150-200". Midpoint, rounded.
  const range = cleaned.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
      return { raw, value: Math.round((lo + hi) / 2), qualifier: "range" };
    }
  }

  // Floor: "700+", "~50+". The plus wins over the tilde — a floor is more
  // informative than "about".
  const min = cleaned.match(/(\d+(?:\.\d+)?)\s*\+/);
  if (min) {
    const n = Number(min[1]);
    if (Number.isFinite(n)) return { raw, value: n, qualifier: "min" };
  }

  const single = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (single) {
    const n = Number(single[1]);
    if (Number.isFinite(n)) {
      return { raw, value: n, qualifier: approx ? "approx" : "exact" };
    }
  }

  // Prose with no digits at all ("Hundreds").
  return { raw, value: null, qualifier: "unknown" };
}

/**
 * Split the workbook's compound type string into normalized categories.
 * "CUSO / Insurance & Fintech" → ["cuso", "fintech"].
 */
export function parseCategories(companyType: string): PartnerCategory[] {
  const s = (companyType ?? "").toLowerCase();
  const out = new Set<PartnerCategory>();
  if (/\bcuso\b/.test(s)) out.add("cuso");
  if (/\bfintech\b/.test(s)) out.add("fintech");
  if (/core\s*process|core\s*banking/.test(s)) out.add("core-processor");
  if (/consult|advisor/.test(s)) out.add("consulting");
  if (/trade\s*association|\bleague\b/.test(s)) out.add("trade-association");
  if (/managed\s*services/.test(s)) out.add("managed-services");
  if (out.size === 0 && s.trim()) out.add("other");
  return [...out];
}

/** Slug id from a partner name: "Banno (Jack Henry)" → "banno-jack-henry". */
export function partnerSlug(name: string): string {
  return (name ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Normalize a workbook stage cell onto a PartnerStageId. Tolerates the
 *  typo/case/whitespace variants present in the source ("Not contracted",
 *  "Not contacted", "Dormant "). Returns null when unrecognized. */
export function normalizePartnerStage(input: string): PartnerStageId | null {
  const s = (input ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;
  if (s === "signed") return "signed";
  if (s === "active" || s === "in discussion") return "active";
  if (s === "dormant") return "dormant";
  if (s === "contacted") return "contacted";
  // "Not contracted" is a typo for "Not contacted" in the source workbook.
  if (s === "not contacted" || s === "not contracted") return "not-contacted";
  if (s === "not a fit" || s === "no fit") return "not-a-fit";
  return null;
}
