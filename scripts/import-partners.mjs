// One-time import of the CEO's partner pipeline workbook.
//
// The workbook is NOT committed to this repo — it lives wherever the person
// running the import keeps it (default: ~/Downloads). Only the generated seed
// is committed. After this runs once, partners are managed in-app; re-running
// is a destructive re-baseline, not part of the normal workflow.
//
//   node scripts/import-partners.mjs [path/to/workbook.xlsx]
//
// Outputs:
//   src/data/partner-seed.json          committed seed
//   scripts/data/partner-import-report.md   human-readable match report
//
// Parsing helpers (reach, categories, stage normalization, slugs) are duplicated
// here rather than imported from the TS source: this is a plain-Node script and
// the app's _lib is TypeScript. Keep the two in sync — the canonical versions
// live in src/app/admin/partners/_lib/stages.ts.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import xlsx from "xlsx";

const DEFAULT_WORKBOOK = join(
  homedir(),
  "Downloads",
  "Movemint_Partner_Pipeline8-2-26update.xlsx",
);
const WORKBOOK = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_WORKBOOK;
const SHEET = "Partner Pipeline";
const HEADER_ROW = 2; // 0-indexed: row 3 in the spreadsheet
const OUT_SEED = resolve("src/data/partner-seed.json");
const OUT_REPORT = resolve("scripts/data/partner-import-report.md");

// Seeded from the sales pipeline's owner list — the same team works both.
const OWNERS = ["Robbie Sink", "Avery Flynn", "Elise Cushing", "Amaha Selassie", "BDR (Insource)"];

// ---------------------------------------------------------------- parsing ----

function parseReach(input) {
  const raw = (input ?? "").toString().trim();
  if (!raw) return { raw: "", value: null, qualifier: "na" };
  const lower = raw.toLowerCase();
  if (lower === "n/a" || lower === "na" || lower === "none") {
    return { raw, value: null, qualifier: "na" };
  }
  const cleaned = raw.replace(/,/g, "").replace(/[–—]/g, "-");
  const approx = /^\s*~/.test(cleaned) || /\bapprox/i.test(cleaned) || /\best\b/i.test(cleaned);

  const range = cleaned.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
      return { raw, value: Math.round((lo + hi) / 2), qualifier: "range" };
    }
  }
  const min = cleaned.match(/(\d+(?:\.\d+)?)\s*\+/);
  if (min) {
    const n = Number(min[1]);
    if (Number.isFinite(n)) return { raw, value: n, qualifier: "min" };
  }
  const single = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (single) {
    const n = Number(single[1]);
    if (Number.isFinite(n)) return { raw, value: n, qualifier: approx ? "approx" : "exact" };
  }
  return { raw, value: null, qualifier: "unknown" };
}

function parseCategories(companyType) {
  const s = (companyType ?? "").toString().toLowerCase();
  const out = new Set();
  if (/\bcuso\b/.test(s)) out.add("cuso");
  if (/\bfintech\b/.test(s)) out.add("fintech");
  if (/core\s*process|core\s*banking/.test(s)) out.add("core-processor");
  if (/consult|advisor/.test(s)) out.add("consulting");
  if (/trade\s*association|\bleague\b/.test(s)) out.add("trade-association");
  if (/managed\s*services/.test(s)) out.add("managed-services");
  if (out.size === 0 && s.trim()) out.add("other");
  return [...out];
}

function partnerSlug(name) {
  return (name ?? "")
    .toString()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeStage(input) {
  const s = (input ?? "").toString().trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;
  if (s === "signed") return "signed";
  if (s === "active" || s === "in discussion") return "active";
  if (s === "dormant") return "dormant";
  if (s === "contacted") return "contacted";
  if (s === "not contacted" || s === "not contracted") return "not-contacted";
  if (s === "not a fit" || s === "no fit") return "not-a-fit";
  return null;
}

function normalizeWebsite(input) {
  const s = (input ?? "").toString().trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s.replace(/^\/+/, "")}`;
}

/** Merged banner rows group the sheet visually. They carry no partner data and
 *  their labels are stale relative to the per-row stage cells. */
function isBannerRow(row) {
  const first = (row[0] ?? "").toString().trim();
  const rest = row.slice(1).some((c) => (c ?? "").toString().trim() !== "");
  if (!first) return false;
  if (first.startsWith("▶")) return true;
  // A stage-looking value with every other column empty is a group header.
  return !rest;
}

function clean(v) {
  const s = (v ?? "").toString().trim();
  return s || undefined;
}

// ------------------------------------------------------------------- run ----

if (!existsSync(WORKBOOK)) {
  console.error(`\n✗ Workbook not found: ${WORKBOOK}`);
  console.error(`  Pass a path: node scripts/import-partners.mjs <file.xlsx>\n`);
  process.exit(1);
}

const wb = xlsx.readFile(WORKBOOK);
if (!wb.SheetNames.includes(SHEET)) {
  console.error(`✗ Sheet "${SHEET}" not found. Sheets: ${wb.SheetNames.join(", ")}`);
  process.exit(1);
}
const ws = wb.Sheets[SHEET];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });

const headers = rows[HEADER_ROW].map((h) => h.toString().trim());
const col = (name) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
const C = {
  stage: col("Pipeline Stage"),
  name: col("Company"),
  type: col("Company Type"),
  reach: col("FI Clients (#)"),
  reachNotes: col("Notes on FI Clients"),
  focus: col("Primary Focus"),
  website: col("Website"),
  notes: col("Movemint Notes"),
};
for (const [k, v] of Object.entries(C)) {
  if (v === -1) {
    console.error(`✗ Expected column "${k}" not found in header row. Got: ${headers.join(" | ")}`);
    process.exit(1);
  }
}

const now = new Date().toISOString();
const partners = {};
const report = {
  banners: [],
  imported: 0,
  skippedEmpty: 0,
  unknownStage: [],
  bannerConflicts: [],
  slugCollisions: [],
  sparse: [],
  reachParses: [],
  stageCounts: {},
  categoryCounts: {},
};

// Track the current banner group so we can report where it disagrees with the
// per-row stage cell. The cell wins — the banners in the source are stale.
let currentBanner = null;

for (let i = HEADER_ROW + 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row || row.every((c) => (c ?? "").toString().trim() === "")) continue;

  if (isBannerRow(row)) {
    currentBanner = row[0].toString().replace(/^▶\s*/, "").trim();
    report.banners.push({ row: i + 1, label: currentBanner });
    continue;
  }

  const name = clean(row[C.name]);
  if (!name) {
    report.skippedEmpty++;
    continue;
  }

  const rawStage = (row[C.stage] ?? "").toString();
  const stage = normalizeStage(rawStage);
  if (!stage) {
    report.unknownStage.push({ row: i + 1, name, raw: rawStage });
    continue;
  }

  const bannerStage = normalizeStage(currentBanner ?? "");
  if (bannerStage && bannerStage !== stage) {
    report.bannerConflicts.push({
      row: i + 1,
      name,
      banner: currentBanner,
      cell: rawStage.trim(),
      used: stage,
    });
  }

  let id = partnerSlug(name);
  if (!id) id = `partner-${i}`;
  if (partners[id]) {
    report.slugCollisions.push({ row: i + 1, name, id });
    let n = 2;
    while (partners[`${id}-${n}`]) n++;
    id = `${id}-${n}`;
  }

  const companyType = (row[C.type] ?? "").toString().trim();
  const fiReach = parseReach(row[C.reach]);
  const categories = parseCategories(companyType);
  const notes = clean(row[C.notes]);

  // The workbook has no rev-share column; Vericast's note is the only place
  // terms appear. Seed the flag from that note and leave the rest for the team
  // to fill in-app rather than guessing rates.
  const revShare =
    notes && /full reseller/i.test(notes)
      ? {
          model: "per-record",
          isReseller: true,
          notes: notes.match(/rev share[^.]*\./i)?.[0]?.trim(),
        }
      : undefined;

  partners[id] = {
    id,
    name,
    companyType,
    categories,
    stage,
    fiReach,
    reachNotes: clean(row[C.reachNotes]),
    primaryFocus: clean(row[C.focus]),
    website: normalizeWebsite(row[C.website]),
    notes,
    owner: null,
    ...(revShare ? { revShare } : {}),
    imported: true,
    createdAt: now,
    updatedAt: now,
  };

  report.imported++;
  report.stageCounts[stage] = (report.stageCounts[stage] ?? 0) + 1;
  for (const c of categories) report.categoryCounts[c] = (report.categoryCounts[c] ?? 0) + 1;
  report.reachParses.push({
    name,
    raw: fiReach.raw || "(blank)",
    value: fiReach.value,
    qualifier: fiReach.qualifier,
  });

  // Rows carrying little beyond a name and a note — flagged for human follow-up.
  if (!companyType || (!fiReach.raw && !clean(row[C.focus]))) {
    report.sparse.push({ row: i + 1, name });
  }
}

const state = {
  partners,
  settings: {
    owners: OWNERS,
    // Display weighting only — partners carry no ARR of their own.
    stageProbabilities: {
      "not-contacted": 0,
      contacted: 0.1,
      active: 0.4,
      signed: 1,
      dormant: 0.05,
      "not-a-fit": 0,
    },
    companyTypeOptions: [...new Set(Object.values(partners).map((p) => p.companyType))]
      .filter(Boolean)
      .sort(),
    signedGoal: 12,
  },
  updatedAt: now,
};

mkdirSync(resolve("src/data"), { recursive: true });
mkdirSync(resolve("scripts/data"), { recursive: true });
writeFileSync(OUT_SEED, JSON.stringify(state, null, 2));

// ---------------------------------------------------------------- report ----

const quantified = report.reachParses.filter((r) => r.value != null);
const totalReach = quantified.reduce((n, r) => n + r.value, 0);
const md = [
  "# Partner Pipeline — Import Report",
  "",
  `- Source workbook: \`${WORKBOOK}\` (not committed)`,
  `- Sheet: **${SHEET}**, headers on row ${HEADER_ROW + 1}`,
  `- Generated: ${now}`,
  "",
  "## Totals",
  "",
  `- **${report.imported}** partners imported`,
  `- ${report.skippedEmpty} rows skipped (no company name)`,
  `- ${report.banners.length} merged banner rows skipped: ${report.banners.map((b) => `\`${b.label}\` (row ${b.row})`).join(", ")}`,
  `- Estimated FI reach across quantified partners: **${totalReach.toLocaleString()}** from ${quantified.length}/${report.imported} partners (${report.imported - quantified.length} unquantified)`,
  "",
  "## Stage distribution",
  "",
  "| Stage | Count |",
  "| --- | --- |",
  ...Object.entries(report.stageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([s, n]) => `| ${s} | ${n} |`),
  "",
  "## Category distribution",
  "",
  "| Category | Count |",
  "| --- | --- |",
  ...Object.entries(report.categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => `| ${c} | ${n} |`),
  "",
  "## Banner / cell stage conflicts",
  "",
  report.bannerConflicts.length
    ? [
        "The workbook's merged group banners disagree with these rows' own stage",
        "cells. **The cell was used** — it reflects more recent editing than the",
        "visual grouping. Confirm each of these is correct:",
        "",
        "| Row | Partner | Banner group | Stage cell | Imported as |",
        "| --- | --- | --- | --- | --- |",
        ...report.bannerConflicts.map(
          (c) => `| ${c.row} | ${c.name} | ${c.banner} | ${c.cell} | **${c.used}** |`,
        ),
      ].join("\n")
    : "_None._",
  "",
  "## Unrecognized stage values (NOT imported)",
  "",
  report.unknownStage.length
    ? [
        "| Row | Partner | Raw value |",
        "| --- | --- | --- |",
        ...report.unknownStage.map((u) => `| ${u.row} | ${u.name} | \`${u.raw}\` |`),
      ].join("\n")
    : "_None — every stage value normalized cleanly._",
  "",
  "## Slug collisions",
  "",
  report.slugCollisions.length
    ? report.slugCollisions.map((c) => `- Row ${c.row}: ${c.name} → \`${c.id}\` (suffixed)`).join("\n")
    : "_None._",
  "",
  "## Sparse rows needing human follow-up",
  "",
  report.sparse.length
    ? report.sparse.map((s) => `- Row ${s.row}: **${s.name}** — missing company type and/or FI count + focus`).join("\n")
    : "_None._",
  "",
  "## FI reach parsing",
  "",
  "Every row's raw string and how it was interpreted. `value: null` means the",
  "partner contributes nothing to reach rollups.",
  "",
  "| Partner | Raw | Parsed value | Qualifier |",
  "| --- | --- | --- | --- |",
  ...report.reachParses.map(
    (r) => `| ${r.name} | \`${r.raw}\` | ${r.value == null ? "—" : r.value.toLocaleString()} | ${r.qualifier} |`,
  ),
  "",
].join("\n");

writeFileSync(OUT_REPORT, md);

console.log(`✓ ${report.imported} partners → ${OUT_SEED}`);
console.log(`✓ report → ${OUT_REPORT}`);
console.log(`  stages: ${JSON.stringify(report.stageCounts)}`);
console.log(
  `  reach: ${totalReach.toLocaleString()} est. across ${quantified.length}/${report.imported} quantified`,
);
if (report.bannerConflicts.length) {
  console.log(`  ⚠ ${report.bannerConflicts.length} banner/cell stage conflicts — see report`);
}
if (report.unknownStage.length) {
  console.log(`  ⚠ ${report.unknownStage.length} rows skipped for unknown stage — see report`);
}
