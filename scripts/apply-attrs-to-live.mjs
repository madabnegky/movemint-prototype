#!/usr/bin/env node
// Merges the seed's tech attributes (coreSystem/los) and the settings option
// lists into a live-state dump WITHOUT disturbing the team's pipeline edits.
// For each FI that the seed has attributes for, set those fields on the live
// record (creating an attribute-only record if none exists). Everything else
// in live is preserved verbatim.
//
// Usage: node scripts/apply-attrs-to-live.mjs <live.json> --out <merged.json>

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

const out = structuredClone(live);
out.records = out.records ?? {};
out.settings = out.settings ?? {};

// Carry the dropdown option lists over.
out.settings.coreOptions = seed.settings.coreOptions ?? [];
out.settings.losOptions = seed.settings.losOptions ?? [];
out.settings.homeBankingOptions = seed.settings.homeBankingOptions ?? [];

let set = 0;
let created = 0;
for (const [fid, srec] of Object.entries(seed.records)) {
  if (!srec.coreSystem && !srec.los) continue;
  const lrec = out.records[fid];
  if (lrec) {
    // Only fill attributes; never touch stage/owner/etc. Don't overwrite a
    // value a user may have already set in the live tool.
    if (srec.coreSystem && !lrec.coreSystem) lrec.coreSystem = srec.coreSystem;
    if (srec.los && !lrec.los) lrec.los = srec.los;
    set++;
  } else {
    out.records[fid] = {
      fiId: fid,
      stage: null,
      owner: null,
      coreSystem: srec.coreSystem,
      los: srec.los,
      updatedAt: live.updatedAt,
    };
    created++;
  }
}

console.log(`Attributes applied to existing records: ${set}`);
console.log(`Attribute-only records created: ${created}`);
console.log(`Total live records now: ${Object.keys(out.records).length}`);
console.log(`Option lists — core:${out.settings.coreOptions.length} los:${out.settings.losOptions.length}`);

if (outPath) {
  writeFileSync(outPath, JSON.stringify(out));
  console.log(`Wrote ${outPath}`);
}
