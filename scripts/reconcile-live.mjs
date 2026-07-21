#!/usr/bin/env node
// One-off reconciliation of the live Netlify pipeline blob after an external
// (Gemini) bulk MQL match introduced bad records. Reads the live-state dump,
// produces a corrected state, prints a diff. Writing is a separate step.
//
// Usage: node scripts/reconcile-live.mjs <live-state.json> [--out corrected.json]
//
// Starts FROM the live state (to preserve legitimate edits: the salesGoal
// change, a platformFit toggle, and Gemini's correct new CU MQLs) and then:
//   1. Deletes "ghost" records whose FI id isn't in our universe.
//   2. Deletes MQL records typed as banks — the MQL sheet is 100% credit
//      unions, so a bank there is a wrong-entity match (e.g. "Sunwest Bank"
//      matched for "Sun West Federal Credit Union").
//   3. Restores nurture deals the batch downgraded to `mql`.
//   4. Marks a workbook-unmatched row resolved only when the CLEANED live data
//      has a confident same-name CU record for it.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
const livePath = args.find((a) => !a.startsWith("--"));
const outIdx = args.indexOf("--out");
const outPath = outIdx >= 0 ? args[outIdx + 1] : null;
if (!livePath) {
  console.error("Usage: node scripts/reconcile-live.mjs <live-state.json> [--out corrected.json]");
  process.exit(1);
}

const live = JSON.parse(readFileSync(livePath, "utf8"));
const seed = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/pipeline-seed.json")));
const unmatched = JSON.parse(
  readFileSync(join(REPO_ROOT, "src/data/pipeline-unmatched.json")),
).rows;
const banks = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/universe-banks.json"))).institutions;
const cus = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/universe-cus.json"))).institutions;
const byId = new Map([...banks, ...cus].map((fi) => [fi.id, fi]));

const STOP = new Set(
  "federal credit union fcu cu bank banking bancorp bancshares bankshares holdings group national association na n a b the inc co company trust savings ssb fsb state st saint of and".split(
    " ",
  ),
);
const ORD = { "1st": "first", "2nd": "second", "3rd": "third", bk: "bank", tr: "trust", natl: "national" };
function toks(s) {
  return new Set(
    String(s ?? "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .map((t) => ORD[t] ?? t)
      .filter((t) => t && !STOP.has(t)),
  );
}

const corrected = structuredClone(live);
corrected.records = corrected.records ?? {};

// (1) + (2) drop ghosts and bank-typed MQLs
const droppedGhost = [];
const droppedBankMql = [];
for (const [fid, rec] of Object.entries(corrected.records)) {
  const fi = byId.get(fid);
  if (!fi) {
    // Keep only if it carries no stage (harmless empty); drop staged ghosts.
    if (rec.stage) {
      droppedGhost.push(fid);
      delete corrected.records[fid];
    }
    continue;
  }
  if (rec.stage === "mql" && fi.type === "bank" && !seed.records[fid]) {
    droppedBankMql.push(`${fi.name} (${fi.city} ${fi.state})`);
    delete corrected.records[fid];
  }
}

// (3) restore downgraded nurture deals to their seed stage
const restored = [];
for (const [fid, srec] of Object.entries(seed.records)) {
  if (srec.stage !== "short-term-nurture" && srec.stage !== "long-term-nurture") continue;
  const lrec = corrected.records[fid];
  if (lrec && lrec.stage === "mql") {
    lrec.stage = srec.stage;
    lrec.updatedAt = live.updatedAt;
    restored.push(`${byId.get(fid)?.name ?? fid}: mql -> ${srec.stage}`);
  }
}

// (4) resolve unmatched rows covered by a confident same-name CU in cleaned data
function covers(rowName) {
  const q = toks(rowName);
  if (q.size === 0) return false;
  for (const [fid, rec] of Object.entries(corrected.records)) {
    if (!rec.stage) continue;
    const fi = byId.get(fid);
    if (!fi || fi.type !== "cu") continue; // unmatched MQL/deal rows are all CUs
    const c = toks(fi.name);
    if (c.size === 0) continue;
    const inter = [...q].filter((t) => c.has(t)).length;
    const equal = inter === q.size && inter === c.size;
    const subset = (inter === q.size || inter === c.size) && inter >= 2;
    if (equal || subset) return true;
  }
  return false;
}
const resolved = new Set(corrected.resolvedUnmatched ?? []);
const stillMissing = [];
for (const row of unmatched) {
  if (covers(row.name)) resolved.add(row.id);
  else stillMissing.push(row.name);
}
corrected.resolvedUnmatched = [...resolved];

const tally = (stage) =>
  Object.values(corrected.records).filter((r) => r.stage === stage).length;

console.log(`Ghost records dropped:        ${droppedGhost.length}  ${droppedGhost.join(", ")}`);
console.log(`Bank-typed MQL records dropped: ${droppedBankMql.length}`);
droppedBankMql.forEach((n) => console.log("   - " + n));
console.log(`\nNurture deals restored: ${restored.length}`);
restored.forEach((r) => console.log("   " + r));
console.log(`\nUnmatched resolved (covered): ${resolved.size}/${unmatched.length}`);
console.log(`Still genuinely missing: ${stillMissing.length}`);
stillMissing.forEach((n) => console.log("   - " + n));

console.log(
  `\nCorrected tallies: mql=${tally("mql")} short-term-nurture=${tally("short-term-nurture")} long-term-nurture=${tally("long-term-nurture")}`,
);
console.log(`Total records: ${Object.keys(corrected.records).length} (live had ${Object.keys(live.records).length})`);
console.log(`salesGoal kept at: ${corrected.settings.salesGoal}`);

if (outPath) {
  writeFileSync(outPath, JSON.stringify(corrected));
  console.log(`\nWrote corrected state to ${outPath}`);
}
