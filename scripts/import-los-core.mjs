#!/usr/bin/env node
// Merges the TruStage CU LOS/Core list into the pipeline seed as per-FI tech
// attributes (coreSystem, los). Matches name+state against the universe;
// confident unique matches only — ambiguous/no-match rows go to a report.
// Also seeds settings dropdown options (top-5 by frequency + Other via UI).
//
// Usage: node scripts/import-los-core.mjs
// In:  scripts/data/cu-los-core-2026-04-02.xlsx, src/data/pipeline-seed.json
// Out: src/data/pipeline-seed.json (updated), scripts/data/los-core-report.md

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const XLSX_PATH = join(__dirname, "data/cu-los-core-2026-04-02.xlsx");
const SEED_PATH = join(REPO_ROOT, "src/data/pipeline-seed.json");
const REPORT_PATH = join(__dirname, "data/los-core-report.md");

const cus = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/universe-cus.json"))).institutions;

const STOP = new Set(
  "federal credit union fcu cu bank the of and a inc co employees national association savings trust st saint".split(
    " ",
  ),
);
function nameKey(s) {
  return [
    ...new Set(
      String(s ?? "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .split(" ")
        .filter((w) => w && !STOP.has(w)),
    ),
  ]
    .sort()
    .join(" ");
}

// Index universe CUs by normalized name + state.
const byKey = new Map();
for (const c of cus) {
  const k = `${nameKey(c.name)}|${c.state}`;
  (byKey.get(k) ?? byKey.set(k, []).get(k)).push(c);
}

const wb = XLSX.readFile(XLSX_PATH);
const aoa = XLSX.utils.sheet_to_json(wb.Sheets["Sheet1"], { header: 1, defval: "" });
const rows = aoa.slice(2).filter((r) => String(r[0]).trim());

// Column order: CU Name, State, MIL ASTS, LOS, CORE SYSTEM, Credit Card DP
const seed = JSON.parse(readFileSync(SEED_PATH, "utf8"));

const losCount = new Map();
const coreCount = new Map();
let matched = 0;
const ambiguous = [];
const unmatched = [];

for (const r of rows) {
  const name = String(r[0]).trim();
  const state = String(r[1]).trim();
  const los = String(r[3]).trim();
  const core = String(r[4]).trim();
  if (los) losCount.set(los, (losCount.get(los) ?? 0) + 1);
  if (core) coreCount.set(core, (coreCount.get(core) ?? 0) + 1);

  const hits = byKey.get(`${nameKey(name)}|${state}`) ?? [];
  if (hits.length === 1) {
    const fid = hits[0].id;
    const rec = seed.records[fid] ?? { fiId: fid, stage: null, owner: null, updatedAt: seed.updatedAt };
    if (los) rec.los = los;
    if (core) rec.coreSystem = core;
    seed.records[fid] = rec;
    matched++;
  } else if (hits.length > 1) {
    ambiguous.push({ name, state, candidates: hits.map((h) => `${h.name} (${h.city})`) });
  } else {
    unmatched.push({ name, state });
  }
}

const top5 = (m) =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map((e) => e[0]);
seed.settings.losOptions = top5(losCount);
seed.settings.coreOptions = top5(coreCount);
seed.settings.homeBankingOptions = []; // no data yet — Other-only in the UI

writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2));

const lines = [
  "# LOS / Core Import Report",
  "",
  `Source rows: ${rows.length}`,
  `Confident name+state matches (attributes set): ${matched}`,
  `Ambiguous (skipped): ${ambiguous.length}`,
  `No universe match (skipped): ${unmatched.length}`,
  "",
  "## Dropdown options seeded (top 5 by frequency)",
  "",
  "**LOS:** " + seed.settings.losOptions.join(" · "),
  "",
  "**Core:** " + seed.settings.coreOptions.join(" · "),
  "",
  `## Ambiguous name+state (${ambiguous.length}) — resolve manually`,
  "",
  ...ambiguous.map((a) => `- **${a.name}** (${a.state}) → ${a.candidates.join(" | ")}`),
  "",
  `## No universe match (${unmatched.length}) — likely rebrand or below asset floor`,
  "",
  ...unmatched.map((u) => `- ${u.name} (${u.state})`),
  "",
];
writeFileSync(REPORT_PATH, lines.join("\n"));

console.log(`Matched & set attributes on ${matched} CUs`);
console.log(`Ambiguous: ${ambiguous.length}, unmatched: ${unmatched.length}`);
console.log(`LOS options: ${seed.settings.losOptions.join(", ")}`);
console.log(`Core options: ${seed.settings.coreOptions.join(", ")}`);
console.log(`Report: ${REPORT_PATH}`);
