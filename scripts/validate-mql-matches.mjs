#!/usr/bin/env node
// Produces a VALIDATED MQL name->CU map from the Gemini-annotated workbook.
// Gemini's "Matched ID" column is only trusted when the universe CU at that
// charter actually matches the MQL name; bank (Cert) matches are rejected
// outright (the MQL sheet is 100% credit unions); everything else falls back
// to our own strict name matcher. Output: scripts/data/mql-validated.json
//
// Usage: node scripts/validate-mql-matches.mjs "<updated-workbook.xlsx>"

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const wbPath = process.argv[2];
if (!wbPath) {
  console.error('Usage: node scripts/validate-mql-matches.mjs "<workbook.xlsx>"');
  process.exit(1);
}

const cus = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/universe-cus.json"))).institutions;
const cuById = new Map(cus.map((c) => [c.id, c]));

const STOP = new Set(
  "federal credit union fcu cu bank banking bancorp national association na n a b the inc co company trust savings ssb fsb state st saint of and employees".split(
    " ",
  ),
);
const ORD = { "1st": "first", "2nd": "second", "3rd": "third" };
function tk(s) {
  return new Set(
    String(s ?? "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/\bd\.?\s?b\.?\s?a\.?\b/gi, " ")
      .replace(/\([^)]*\)/g, " ")
      .replace(/[-–—].*$/, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .map((t) => ORD[t] ?? t)
      .filter((t) => t && !STOP.has(t)),
  );
}
function strongMatch(q, c) {
  if (q.size === 0 || c.size === 0) return false;
  const inter = [...q].filter((t) => c.has(t)).length;
  // full-set equality, or the smaller set fully inside the larger with >=2 shared
  if (inter === q.size && inter === c.size) return true;
  return (inter === q.size || inter === c.size) && inter >= 2;
}

// build a name index for fallback matching
const byName = new Map();
for (const fi of cus) {
  const key = [...tk(fi.name)].sort().join(" ");
  if (!key) continue;
  (byName.get(key) ?? byName.set(key, []).get(key)).push(fi);
}

const wb = XLSX.readFile(wbPath);
const aoa = XLSX.utils.sheet_to_json(wb.Sheets["MQL"], { header: 1, defval: "" });
const hdr = aoa[1].map((h) => String(h).trim());
const ci = Object.fromEntries(hdr.map((h, i) => [h, i]));
const rows = aoa.slice(2).filter((r) => String(r[ci["Financial Institution"]]).trim());

const result = {};
const stats = { charterOk: 0, charterRejected: 0, bankRejected: 0, fallback: 0, unmatched: 0 };
const unmatched = [];

for (const r of rows) {
  const name = String(r[ci["Financial Institution"]]).trim();
  const id = String(r[ci["Matched ID"]]).trim();
  const mt = String(r[ci["Match Type"]]).trim().toLowerCase();
  const leadSource = String(r[ci["Lead Source"]] ?? "").trim();
  const q = tk(name);

  let fiId = null;
  let via = null;

  // 1. trust Gemini's charter ID only if the CU at that id matches the name
  if (mt === "charter" && id) {
    const fi = cuById.get(`cu-${id}`);
    if (fi && strongMatch(q, tk(fi.name))) {
      fiId = fi.id;
      via = "charter-validated";
      stats.charterOk++;
    } else {
      stats.charterRejected++;
    }
  } else if (mt === "cert") {
    stats.bankRejected++; // bank match for a CU — never trust
  }

  // 2. fallback: our own strict unique-name match
  if (!fiId) {
    const key = [...q].sort().join(" ");
    const hits = byName.get(key) ?? [];
    if (hits.length === 1) {
      fiId = hits[0].id;
      via = "name-unique";
      if (!stats.charterOk || via) stats.fallback++;
    }
  }

  if (fiId) {
    result[fiId] = { fiId, leadSource: leadSource || undefined, via, workbookName: name };
  } else {
    stats.unmatched++;
    unmatched.push(name);
  }
}

writeFileSync(
  join(REPO_ROOT, "scripts/data/mql-validated.json"),
  JSON.stringify({ stats, matches: result, unmatched }, null, 2),
);

console.log("MQL rows:", rows.length);
console.log(stats);
console.log("distinct CUs matched:", Object.keys(result).length);
console.log("unmatched:", unmatched.length);
