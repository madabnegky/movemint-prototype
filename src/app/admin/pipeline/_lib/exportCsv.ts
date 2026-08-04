import { ALL_STAGES, STAGE_LABELS } from "./stages";
import { FI_BY_ID, listMembers, regIdLabel, regIdOf } from "./universe";
import type { ListId, PipelineState } from "./types";

function esc(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  // BOM so Excel opens UTF-8 institution names correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const HEADER = [
  "FI Name",
  "Reg ID",
  "Reg ID Type",
  "FI Type",
  "City",
  "State",
  "Assets",
  "Stage",
  "Owner",
  "Primary Contact",
  "Primary Email",
];

function rowFor(fiId: string, state: PipelineState, stageLabel: string): string[] | null {
  const fi = FI_BY_ID.get(fiId);
  if (!fi) return null;
  const rec = state.records[fiId];
  const contact = rec?.contacts?.[0];
  return [
    fi.name,
    regIdOf(fi),
    regIdLabel(fi),
    fi.type === "cu" ? "Credit Union" : "Bank",
    fi.city,
    fi.state,
    String(fi.assets),
    stageLabel,
    rec?.owner ?? "",
    contact?.name ?? "",
    contact?.email ?? "",
  ];
}

const stamp = () => new Date().toISOString().slice(0, 10);

/** One stage or tier — the list the user is currently looking at. */
export function exportList(listId: ListId, state: PipelineState) {
  const rows: string[][] = [HEADER];
  for (const fi of listMembers(listId, state)) {
    const r = rowFor(fi.id, state, STAGE_LABELS[listId]);
    if (r) rows.push(r);
  }
  const slug = STAGE_LABELS[listId].toLowerCase().replace(/[^a-z0-9]+/g, "-");
  download(`movemint-${slug}-${stamp()}.csv`, rows);
}

/** Every prospect that carries a stage, ordered by funnel position, for
 *  reconciling the pipeline against outside spreadsheets. */
export function exportAllStages(state: PipelineState) {
  const rows: string[][] = [HEADER];
  for (const stage of ALL_STAGES) {
    for (const fi of listMembers(stage, state)) {
      const r = rowFor(fi.id, state, STAGE_LABELS[stage]);
      if (r) rows.push(r);
    }
  }
  download(`movemint-pipeline-by-stage-${stamp()}.csv`, rows);
}
