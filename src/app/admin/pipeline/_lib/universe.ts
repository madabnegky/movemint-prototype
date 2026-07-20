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

/** FIs belonging to a tier or stage list. */
export function listMembers(listId: ListId, state: PipelineState): FI[] {
  const records = state.records;
  switch (listId) {
    case "universe":
      return UNIVERSE;
    case "addressable-asset":
      return UNIVERSE.filter(inAssetBand);
    case "addressable-fit":
      return UNIVERSE.filter((fi) => inAssetBand(fi) && isPlatformFit(fi, records));
    case "active-pursuit":
      return UNIVERSE.filter(
        (fi) => inAssetBand(fi) && isPlatformFit(fi, records) && !records[fi.id]?.stage,
      );
    default:
      return UNIVERSE.filter((fi) => records[fi.id]?.stage === listId);
  }
}

export interface FunnelCounts {
  total: number;
  cu: number;
  bank: number;
}

export function countMembers(listId: ListId, state: PipelineState): FunnelCounts {
  const members = listMembers(listId, state);
  let cu = 0;
  for (const fi of members) if (fi.type === "cu") cu++;
  return { total: members.length, cu, bank: members.length - cu };
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

export function computeMetrics(state: PipelineState): PipelineMetrics {
  let weightedPipeline = 0;
  let closedWonCount = 0;
  let closedWonArr = 0;
  const stageArr: Record<string, number> = {};
  const openStages = new Set<StageId>(
    MAIN_STAGES.filter((s) => s !== "closed-won" && s !== "closed-lost"),
  );
  for (const rec of Object.values(state.records)) {
    if (!rec.stage) continue;
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
