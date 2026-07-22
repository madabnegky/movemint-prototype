import banksData from "@/data/universe-banks.json";
import cusData from "@/data/universe-cus.json";
import { ASSET_CEILING, ASSET_FLOOR, MAIN_STAGES } from "./stages";
import type { FI, ListId, PipelineRecord, PipelineState, StageId } from "./types";

interface UniverseFile {
  meta: { source: string; fetchedAt: string; count: number };
  institutions: FI[];
}

export const UNIVERSE: FI[] = [
  ...(banksData as UniverseFile).institutions,
  ...(cusData as UniverseFile).institutions,
];

export const FI_BY_ID: Map<string, FI> = new Map(UNIVERSE.map((fi) => [fi.id, fi]));

// ---- Institution search ----
// NCUA/FDIC store terse official names ("SUN" for "Sun Federal Credit Union"),
// so a plain substring search misses the names people actually type. This
// normalizes filler words out of both the query and candidate names before
// matching, and ranks by how well the significant tokens line up.
const SEARCH_STOP = new Set(
  "federal credit union fcu cu bank banking national association na the of and a inc co company trust savings ssb fsb".split(
    " ",
  ),
);
function searchTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w && !SEARCH_STOP.has(w));
}

/**
 * Ranked institution search over the universe. Matches on normalized name
 * tokens (so "Sun Federal Credit Union" finds "SUN") and on city, then sorts
 * by match quality and assets. Returns up to `limit` results.
 *
 * @param records  optional overlay so the search can also match a linked
 *   contact's name or email (used by the global search).
 */
export function searchInstitutions(
  query: string,
  limit = 12,
  records?: Record<string, PipelineRecord>,
): FI[] {
  const raw = query.trim().toLowerCase();
  if (raw.length < 2) return [];
  const qTokens = searchTokens(query);
  const scored: Array<{ fi: FI; score: number }> = [];

  for (const fi of UNIVERSE) {
    const nameLc = fi.name.toLowerCase();
    const cityLc = fi.city.toLowerCase();
    const nTokens = searchTokens(fi.name);
    let score = 0;

    // Raw substring on the full name is the strongest signal.
    if (nameLc.startsWith(raw)) score = 100;
    else if (nameLc.includes(raw)) score = 70;

    // Token overlap catches terse official names vs typed-out names.
    if (qTokens.length) {
      const nSet = new Set(nTokens);
      const shared = qTokens.filter((t) => nSet.has(t)).length;
      if (shared) {
        // Exact normalized-name equality is the best token signal: "Sun
        // Federal Credit Union" and "SUN" both reduce to {sun}, which should
        // beat "SUN EAST" ({sun,east}).
        const exact = shared === qTokens.length && shared === nTokens.length;
        const allQueryMatched = shared === qTokens.length;
        // Fewer extra tokens on the candidate ranks higher within a tier.
        const extra = nTokens.length - shared;
        if (exact) score = Math.max(score, 95);
        else if (allQueryMatched) score = Math.max(score, 55 + shared - extra);
        else score = Math.max(score, 30 + shared * 5 - extra);
      }
    }

    // City is a weaker match.
    if (score === 0) {
      if (cityLc.startsWith(raw)) score = 12;
      else if (cityLc.includes(raw)) score = 6;
    }

    // Contact name/email is the weakest, so a deal can be found by person.
    if (score === 0 && records) {
      const contacts = records[fi.id]?.contacts;
      if (
        contacts?.some(
          (c) =>
            c.name.toLowerCase().includes(raw) ||
            (c.email && c.email.toLowerCase().includes(raw)),
        )
      ) {
        score = 4;
      }
    }

    if (score > 0) scored.push({ fi, score });
  }

  scored.sort((a, b) => b.score - a.score || b.fi.assets - a.fi.assets);
  return scored.slice(0, limit).map((s) => s.fi);
}

export const UNIVERSE_META = {
  banks: (banksData as UniverseFile).meta,
  cus: (cusData as UniverseFile).meta,
};

export function inAssetBand(fi: FI): boolean {
  return fi.assets >= ASSET_FLOOR && fi.assets <= ASSET_CEILING;
}

export function isPlatformFit(fi: FI, records: Record<string, PipelineRecord>): boolean {
  return records[fi.id]?.platformFit === true;
}

const CURRENT_YEAR = new Date().getFullYear();

/** A closed-won/closed-lost record counts as "current year" if its closedYear
 *  is this year or unset (legacy records default to current). */
export function isCurrentYearClose(rec: { closedYear?: number } | undefined): boolean {
  return (rec?.closedYear ?? CURRENT_YEAR) === CURRENT_YEAR;
}

/**
 * FIs belonging to a tier or stage list.
 * @param currentYearOnly  when true, closed-won/closed-lost lists include only
 *   deals attributed to the current year (used by the dashboard funnel so prior
 *   years live in their own panel instead).
 */
export function listMembers(
  listId: ListId,
  state: PipelineState,
  currentYearOnly = false,
): FI[] {
  const records = state.records;
  switch (listId) {
    case "universe":
      return UNIVERSE;
    case "addressable":
      // True addressable market: within the asset band AND a platform fit.
      return UNIVERSE.filter((fi) => inAssetBand(fi) && isPlatformFit(fi, records));
    case "active-pursuit":
      return UNIVERSE.filter(
        (fi) => inAssetBand(fi) && isPlatformFit(fi, records) && !records[fi.id]?.stage,
      );
    default: {
      const closed = listId === "closed-won" || listId === "closed-lost";
      return UNIVERSE.filter((fi) => {
        const rec = records[fi.id];
        if (rec?.stage !== listId) return false;
        if (closed && currentYearOnly && !isCurrentYearClose(rec)) return false;
        return true;
      });
    }
  }
}

export interface FunnelCounts {
  total: number;
  cu: number;
  bank: number;
}

export function countMembers(
  listId: ListId,
  state: PipelineState,
  currentYearOnly = false,
): FunnelCounts {
  const members = listMembers(listId, state, currentYearOnly);
  let cu = 0;
  for (const fi of members) if (fi.type === "cu") cu++;
  return { total: members.length, cu, bank: members.length - cu };
}

/** Count of prior-year closed deals (won + lost), for the "Previous Years" box. */
export function previousYearsClosed(state: PipelineState): {
  won: number;
  lost: number;
  total: number;
} {
  let won = 0;
  let lost = 0;
  for (const rec of Object.values(state.records)) {
    if ((rec.stage === "closed-won" || rec.stage === "closed-lost") && !isCurrentYearClose(rec)) {
      if (rec.stage === "closed-won") won++;
      else lost++;
    }
  }
  return { won, lost, total: won + lost };
}

/** Weighted value of a single FI's deal. */
export function dealValue(rec: PipelineRecord, state: PipelineState): number {
  return rec.arr ?? state.settings.defaultDealArr;
}

export function weightedValue(rec: PipelineRecord, state: PipelineState): number {
  if (!rec.stage) return 0;
  const p = state.settings.stageProbabilities[rec.stage] ?? 0;
  return dealValue(rec, state) * p;
}

export interface PipelineMetrics {
  weightedPipeline: number; // open funnel stages, ARR × probability
  closedWonCount: number;
  closedWonArr: number;
  projectedDeals: number; // closed won + weighted ÷ default ARR
  stageArr: Record<string, number>; // real weighted $ per stage
}

/**
 * @param year  when set, closed-won/lost counts include only deals attributed
 *              to that calendar year (open-pipeline math is unaffected).
 */
export function computeMetrics(state: PipelineState, year?: number): PipelineMetrics {
  let weightedPipeline = 0;
  let closedWonCount = 0;
  let closedWonArr = 0;
  const stageArr: Record<string, number> = {};
  const openStages = new Set<StageId>(
    MAIN_STAGES.filter((s) => s !== "closed-won" && s !== "closed-lost"),
  );
  for (const rec of Object.values(state.records)) {
    if (!rec.stage) continue;
    const isClosed = rec.stage === "closed-won" || rec.stage === "closed-lost";
    // When scoping to a year, exclude closed deals from other years entirely
    // (both their $ and their counts) so the dashboard is internally consistent.
    if (isClosed && year != null && (rec.closedYear ?? year) !== year) continue;
    const wv = weightedValue(rec, state);
    stageArr[rec.stage] = (stageArr[rec.stage] ?? 0) + wv;
    if (openStages.has(rec.stage)) weightedPipeline += wv;
    if (rec.stage === "closed-won") {
      closedWonCount++;
      closedWonArr += dealValue(rec, state);
    }
  }
  const projectedDeals =
    closedWonCount + Math.round(weightedPipeline / state.settings.defaultDealArr);
  return { weightedPipeline, closedWonCount, closedWonArr, projectedDeals, stageArr };
}

/** Distinct closed years present in the data, newest first (always includes the current year). */
export function closedYears(state: PipelineState): number[] {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const rec of Object.values(state.records)) {
    if ((rec.stage === "closed-won" || rec.stage === "closed-lost") && rec.closedYear) {
      years.add(rec.closedYear);
    }
  }
  return [...years].sort((a, b) => b - a);
}
