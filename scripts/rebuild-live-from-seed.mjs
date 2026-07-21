#!/usr/bin/env node
// Rebuilds the live pipeline state from the (freshly regenerated, clean) seed,
// carrying forward only the legitimate edits made in the live blob:
//   - settings (salesGoal etc.)
//   - platformFit / owner / notes / arr / closedYear overrides on records
//     that also carry a stage the seed doesn't dictate (genuine manual edits)
//   - resolvedUnmatched, recomputed against the new clean records
//
// This discards the external bulk-match contamination entirely and replaces
// the MQL set with the validated one baked into the new seed.
//
// Usage: node scripts/rebuild-live-from-seed.mjs <live-now.json> --out <corrected.json>

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const args = process.argv.slice(2);
const livePath = args.find((a) => !a.startsWith("--"));
const outPath = args[args.indexOf("--out") + 1];

const live = JSON.parse(readFileSync(livePath, "utf8"));
const seed = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/pipeline-seed.json")));
const unmatched = JSON.parse(
  readFileSync(join(REPO_ROOT, "src/data/pipeline-unmatched.json")),
).rows;
const cus = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/universe-cus.json"))).institutions;
const cuById = new Map(cus.map((c) => [c.id, c]));

// Start from the clean seed records; keep the live settings (goal was edited).
const out = {
  records: structuredClone(seed.records),
  settings: structuredClone(live.settings ?? seed.settings),
  resolvedUnmatched: [],
  updatedAt: live.updatedAt,
};

// Carry forward ONLY genuine user-authored fields that the external batch
// never wrote: notes, arr, and closedYear on seed-known records. We do NOT
// carry stage or platformFit from live — the batch set those, and the seed
// already computes platformFit correctly from the Addressable sheets.
// (A carried platformFit would silently resurrect the batch's bad records.)
let carried = 0;
for (const [fid, lrec] of Object.entries(live.records ?? {})) {
  const srec = out.records[fid];
  if (!srec) continue; // only augment records the clean seed already has
  const extras = {};
  if (lrec.notes) extras.notes = lrec.notes;
  if (lrec.arr != null) extras.arr = lrec.arr;
  if (lrec.closedYear && (srec.stage === "closed-won" || srec.stage === "closed-lost")) {
    extras.closedYear = lrec.closedYear;
  }
  if (Object.keys(extras).length) {
    out.records[fid] = { ...srec, ...extras };
    carried++;
  }
}

// Recompute resolvedUnmatched: a row is resolved when a clean record with a
// stage now confidently matches its name.
const STOP = new Set(
  "federal credit union fcu cu bank the of and a inc co employees national association savings trust state st saint".split(
    " ",
  ),
);
const tk = (s) =>
  new Set(
    String(s ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w && !STOP.has(w)),
  );
const staged = Object.entries(out.records)
  .filter(([, r]) => r.stage)
  .map(([id]) => id);
const resolved = new Set();
for (const row of unmatched) {
  const q = tk(row.name);
  if (!q.size) continue;
  for (const id of staged) {
    const fi = cuById.get(id);
    if (!fi) continue;
    const c = tk(fi.name);
    const inter = [...q].filter((t) => c.has(t)).length;
    if ((inter === q.size && inter === c.size) || ((inter === q.size || inter === c.size) && inter >= 2)) {
      resolved.add(row.id);
      break;
    }
  }
}
out.resolvedUnmatched = [...resolved];

const tally = (s) => Object.values(out.records).filter((r) => r.stage === s).length;
console.log("Rebuilt from clean seed.");
console.log(`  records: ${Object.keys(out.records).length}`);
console.log(`  mql=${tally("mql")} short-term-nurture=${tally("short-term-nurture")} long-term-nurture=${tally("long-term-nurture")} warm-lead=${tally("warm-lead")} qualified=${tally("qualified")} closed-won=${tally("closed-won")}`);
console.log(`  carried-forward live edits: ${carried}`);
console.log(`  salesGoal: ${out.settings.salesGoal}`);
console.log(`  resolvedUnmatched: ${out.resolvedUnmatched.length}/${unmatched.length}`);

if (outPath) {
  writeFileSync(outPath, JSON.stringify(out));
  console.log(`  wrote ${outPath}`);
}
