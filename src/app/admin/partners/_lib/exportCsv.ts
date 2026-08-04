import {
  ALL_PARTNER_STAGES,
  PARTNER_CATEGORY_LABELS,
  PARTNER_STAGE_LABELS,
  REV_SHARE_MODEL_LABELS,
} from "./stages";
import { describeRevShare, listPartners } from "./partners";
import type { Partner, PartnerListId, PartnerState } from "./types";

function esc(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  // BOM so Excel opens UTF-8 company names correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const HEADER = [
  "Company",
  "Stage",
  "Company Type",
  "Categories",
  "FI Clients (as entered)",
  "FI Clients (est.)",
  "Estimate Basis",
  "Notes on FI Clients",
  "Primary Focus",
  "Website",
  "Owner",
  "Rev Share Model",
  "Rev Share Terms",
  "Reseller",
  "Sourced FIs",
  "Movemint Notes",
  "Updated",
];

function rowFor(p: Partner, stageLabel: string): string[] {
  return [
    p.name,
    stageLabel,
    p.companyType,
    p.categories.map((c) => PARTNER_CATEGORY_LABELS[c]).join("; "),
    p.fiReach.raw,
    p.fiReach.value == null ? "" : String(p.fiReach.value),
    p.fiReach.qualifier,
    p.reachNotes ?? "",
    p.primaryFocus ?? "",
    p.website ?? "",
    p.owner ?? "",
    p.revShare ? REV_SHARE_MODEL_LABELS[p.revShare.model] : "",
    p.revShare ? describeRevShare(p.revShare) : "",
    p.revShare?.isReseller ? "Yes" : "",
    String(p.sourcedFiIds?.length ?? 0),
    p.notes ?? "",
    p.updatedAt.slice(0, 10),
  ];
}

const stamp = () => new Date().toISOString().slice(0, 10);

/** One stage — the list the user is currently looking at. */
export function exportPartnerList(listId: PartnerListId, state: PartnerState) {
  const rows: string[][] = [HEADER];
  for (const p of listPartners(listId, state)) {
    rows.push(rowFor(p, PARTNER_STAGE_LABELS[p.stage]));
  }
  const slug = PARTNER_STAGE_LABELS[listId].toLowerCase().replace(/[^a-z0-9]+/g, "-");
  download(`movemint-partners-${slug}-${stamp()}.csv`, rows);
}

/** Every partner, ordered by pipeline stage — the spreadsheet replacement. */
export function exportAllPartners(state: PartnerState) {
  const rows: string[][] = [HEADER];
  for (const stage of ALL_PARTNER_STAGES) {
    for (const p of listPartners(stage, state)) {
      rows.push(rowFor(p, PARTNER_STAGE_LABELS[stage]));
    }
  }
  download(`movemint-partner-pipeline-${stamp()}.csv`, rows);
}
