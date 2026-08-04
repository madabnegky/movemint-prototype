import {
  ALL_PARTNER_STAGES,
  OPEN_PARTNER_STAGES,
  PARTNER_MAIN_STAGES,
} from "./stages";
import type {
  Partner,
  PartnerCategory,
  PartnerListId,
  PartnerState,
  RevShare,
} from "./types";

/** Partners belonging to a tier or stage list, sorted by est. reach desc. */
export function listPartners(listId: PartnerListId, state: PartnerState): Partner[] {
  const all = Object.values(state.partners);
  const scoped = listId === "all" ? all : all.filter((p) => p.stage === listId);
  return scoped.sort(
    (a, b) => (b.fiReach.value ?? -1) - (a.fiReach.value ?? -1) || a.name.localeCompare(b.name),
  );
}

export interface ReachTotal {
  /** Sum of quantified reach values. */
  known: number;
  /** How many partners contributed a number. */
  quantified: number;
  /** How many partners had no usable number ("Hundreds", "N/A", blank). */
  unquantified: number;
  total: number;
}

/**
 * Reach rollup for a list. Reports the unquantified count alongside the sum so
 * the UI can never present an "est. reach" figure as if it were complete —
 * roughly a fifth of the source rows have no usable number.
 */
export function reachTotal(listId: PartnerListId, state: PartnerState): ReachTotal {
  const members = listPartners(listId, state);
  let known = 0;
  let quantified = 0;
  for (const p of members) {
    if (p.fiReach.value != null) {
      known += p.fiReach.value;
      quantified++;
    }
  }
  return {
    known,
    quantified,
    unquantified: members.length - quantified,
    total: members.length,
  };
}

export interface PartnerStageCount {
  id: PartnerListId;
  count: number;
  reach: ReachTotal;
}

export function stageCounts(state: PartnerState): PartnerStageCount[] {
  return ALL_PARTNER_STAGES.map((id) => ({
    id,
    count: listPartners(id, state).length,
    reach: reachTotal(id, state),
  }));
}

export interface CategoryBreakdown {
  category: PartnerCategory;
  count: number;
  reach: number;
  signed: number;
}

/** Partner counts and reach by normalized category. A partner with two
 *  categories ("CUSO / Fintech") counts in both, so counts sum above the
 *  partner total by design. */
export function categoryBreakdown(state: PartnerState): CategoryBreakdown[] {
  const map = new Map<PartnerCategory, CategoryBreakdown>();
  for (const p of Object.values(state.partners)) {
    for (const c of p.categories) {
      const row = map.get(c) ?? { category: c, count: 0, reach: 0, signed: 0 };
      row.count++;
      row.reach += p.fiReach.value ?? 0;
      if (p.stage === "signed") row.signed++;
      map.set(c, row);
    }
  }
  return [...map.values()].sort((a, b) => b.reach - a.reach || b.count - a.count);
}

export interface PartnerMetrics {
  total: number;
  signed: number;
  inDiscussion: number; // contacted + active
  notContacted: number;
  dormant: number;
  notAFit: number;
  /** Reach across signed partners only — the reach we actually have access to. */
  signedReach: ReachTotal;
  /** Reach across every partner, signed or not. */
  allReach: ReachTotal;
  /** Reach across the live conversations (contacted + active). */
  pipelineReach: ReachTotal;
  /** Signed partners with agreed commercial terms. */
  withTerms: number;
  resellers: number;
}

export function computePartnerMetrics(state: PartnerState): PartnerMetrics {
  const all = Object.values(state.partners);
  const signedList = all.filter((p) => p.stage === "signed");
  const openList = all.filter((p) =>
    (OPEN_PARTNER_STAGES as string[]).includes(p.stage),
  );

  const rollup = (list: Partner[]): ReachTotal => {
    let known = 0;
    let quantified = 0;
    for (const p of list) {
      if (p.fiReach.value != null) {
        known += p.fiReach.value;
        quantified++;
      }
    }
    return { known, quantified, unquantified: list.length - quantified, total: list.length };
  };

  return {
    total: all.length,
    signed: signedList.length,
    inDiscussion: openList.length,
    notContacted: all.filter((p) => p.stage === "not-contacted").length,
    dormant: all.filter((p) => p.stage === "dormant").length,
    notAFit: all.filter((p) => p.stage === "not-a-fit").length,
    signedReach: rollup(signedList),
    allReach: rollup(all),
    pipelineReach: rollup(openList),
    withTerms: signedList.filter((p) => p.revShare && p.revShare.model !== "none").length,
    resellers: all.filter((p) => p.revShare?.isReseller).length,
  };
}

/**
 * Partners ranked by reach, for the concentration callout. A handful of
 * partners (TruStage, Velera, CSI) carry most of the theoretical reach, and the
 * dashboard should say so rather than letting a single total imply breadth.
 */
export function reachConcentration(
  state: PartnerState,
  topN = 3,
): { top: Partner[]; topShare: number; totalKnown: number } {
  const quantified = Object.values(state.partners)
    .filter((p) => p.fiReach.value != null)
    .sort((a, b) => (b.fiReach.value ?? 0) - (a.fiReach.value ?? 0));
  const totalKnown = quantified.reduce((n, p) => n + (p.fiReach.value ?? 0), 0);
  const top = quantified.slice(0, topN);
  const topSum = top.reduce((n, p) => n + (p.fiReach.value ?? 0), 0);
  return { top, topShare: totalKnown > 0 ? topSum / totalKnown : 0, totalKnown };
}

/**
 * Modeled annual value of a partner's commercial terms.
 *
 * This is deliberately a *model*, not a forecast: it answers "if this partner
 * delivered N deals of the default size, what would the terms be worth?" The
 * caller supplies the deal assumptions, since partners carry no ARR of their own.
 *
 * Returns null when terms can't be modeled (no agreement, or an "other" shape
 * whose economics live in free text).
 */
export function modelRevShare(
  revShare: RevShare | undefined,
  assumptions: { deals: number; arrPerDeal: number; recordsPerDeal?: number },
): number | null {
  if (!revShare || revShare.model === "none") return null;
  const { deals, arrPerDeal, recordsPerDeal = 0 } = assumptions;
  switch (revShare.model) {
    case "percent-arr": {
      if (revShare.percent == null) return null;
      // Outbound = we pay the partner, so it's a cost against the same volume.
      const gross = deals * arrPerDeal * revShare.percent;
      return revShare.outbound ? -gross : gross;
    }
    case "per-record": {
      if (revShare.perRecordRate == null || !recordsPerDeal) return null;
      const gross = deals * recordsPerDeal * revShare.perRecordRate;
      return revShare.outbound ? -gross : gross;
    }
    case "flat-fee": {
      if (revShare.flatFee == null) return null;
      const gross = deals * revShare.flatFee;
      return revShare.outbound ? -gross : gross;
    }
    default:
      return null;
  }
}

/** One-line human summary of commercial terms, for tables and drawers. */
export function describeRevShare(revShare: RevShare | undefined): string {
  if (!revShare || revShare.model === "none") return "No terms yet";
  const dir = revShare.outbound ? "we pay" : "we earn";
  const reseller = revShare.isReseller ? "Reseller · " : "";
  switch (revShare.model) {
    case "percent-arr":
      return revShare.percent != null
        ? `${reseller}${(revShare.percent * 100).toFixed(revShare.percent * 100 % 1 === 0 ? 0 : 1)}% of ARR (${dir})`
        : `${reseller}% of ARR — rate TBD`;
    case "per-record":
      return revShare.perRecordRate != null
        ? `${reseller}$${revShare.perRecordRate} per record (${dir})`
        : `${reseller}Per-record — rate TBD`;
    case "flat-fee":
      return revShare.flatFee != null
        ? `${reseller}$${revShare.flatFee.toLocaleString()} per deal (${dir})`
        : `${reseller}Flat fee — amount TBD`;
    case "other":
      return `${reseller}${revShare.notes?.slice(0, 60) ?? "Custom terms"}`;
    default:
      return "No terms yet";
  }
}

/** Funnel rows for the dashboard: main stages in order, with counts + reach. */
export function funnelRows(state: PartnerState): PartnerStageCount[] {
  return PARTNER_MAIN_STAGES.map((id) => ({
    id,
    count: listPartners(id, state).length,
    reach: reachTotal(id, state),
  }));
}
