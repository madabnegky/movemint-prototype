#!/usr/bin/env node
// Merges the seed's parsed contacts into a live-state dump without disturbing
// pipeline edits. For each FI the seed has contacts for, set them on the live
// record only if it doesn't already have contacts (never overwrite manual edits).
//
// Usage: node scripts/apply-contacts-to-live.mjs <live.json> --out <merged.json>

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

let set = 0;
let created = 0;
let skippedHasContacts = 0;
for (const [fid, srec] of Object.entries(seed.records)) {
  if (!srec.contacts?.length) continue;
  const lrec = out.records[fid];
  if (lrec) {
    if (lrec.contacts?.length) {
      skippedHasContacts++;
      continue; // preserve whatever's live
    }
    lrec.contacts = srec.contacts;
    set++;
  } else {
    out.records[fid] = {
      fiId: fid,
      stage: null,
      owner: null,
      contacts: srec.contacts,
      updatedAt: live.updatedAt,
    };
    created++;
  }
}

console.log(`Contacts set on existing records: ${set}`);
console.log(`Attribute-only records created: ${created}`);
console.log(`Records that already had contacts (left as-is): ${skippedHasContacts}`);
console.log(`Total live records now: ${Object.keys(out.records).length}`);

if (outPath) {
  writeFileSync(outPath, JSON.stringify(out));
  console.log(`Wrote ${outPath}`);
}
