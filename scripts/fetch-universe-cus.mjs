#!/usr/bin/env node
// Fetches ALL active federally-insured credit unions (no asset floor) into a
// slim universe file for the sales pipeline tool.
//
// Usage: node scripts/fetch-universe-cus.mjs [--quarter 2026-03]
// Output: src/data/universe-cus.json
//
// Source: NCUA quarterly Call Report zip. FOICU.txt is the directory
// (charter number, name, city, state); FS220.txt carries total assets
// (ACCT_010, in dollars). The zip is downloaded to scripts/ncua-tmp/ and
// reused on later runs if already present.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const OUT_FILE = join(REPO_ROOT, "src/data/universe-cus.json");

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);
const QUARTER = args.quarter ?? "2026-03";
const ZIP_URL = `https://ncua.gov/files/publications/analysis/call-report-data-${QUARTER}.zip`;
const TMP_DIR = join(__dirname, "ncua-tmp", `universe-${QUARTER}`);
const ZIP_PATH = join(TMP_DIR, "call-report.zip");

mkdirSync(TMP_DIR, { recursive: true });

if (!existsSync(join(TMP_DIR, "FOICU.txt"))) {
  if (!existsSync(ZIP_PATH)) {
    console.log(`Downloading ${ZIP_URL}...`);
    const res = await fetch(ZIP_URL);
    if (!res.ok) throw new Error(`NCUA download failed: ${res.status}`);
    writeFileSync(ZIP_PATH, Buffer.from(await res.arrayBuffer()));
  }
  console.log("Extracting FOICU.txt + FS220.txt...");
  execFileSync("unzip", ["-o", ZIP_PATH, "FOICU.txt", "FS220.txt", "-d", TMP_DIR], {
    stdio: "inherit",
  });
}

// ---------- CSV reader (handles quoted fields with commas) ----------
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (field !== "" || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadTable(filename) {
  const text = readFileSync(join(TMP_DIR, filename), "latin1");
  const rows = parseCsv(text);
  const header = rows.shift();
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return { rows, idx };
}

const foicu = loadTable("FOICU.txt");
const fs220 = loadTable("FS220.txt");

const assetsByCu = new Map();
for (const row of fs220.rows) {
  assetsByCu.set(row[fs220.idx.CU_NUMBER], Number(row[fs220.idx.ACCT_010]) || 0);
}

const institutions = [];
let skippedNoFinancials = 0;
for (const row of foicu.rows) {
  const cuNumber = row[foicu.idx.CU_NUMBER];
  const assets = assetsByCu.get(cuNumber);
  if (assets == null) {
    // In the directory but filed no FS220 this quarter (merged/liquidated).
    skippedNoFinancials++;
    continue;
  }
  institutions.push({
    id: `cu-${cuNumber}`,
    type: "cu",
    name: String(row[foicu.idx.CU_NAME] ?? "").trim(),
    city: String(row[foicu.idx.CITY] ?? "").trim(),
    state: String(row[foicu.idx.STATE] ?? "").trim(),
    assets,
  });
}

institutions.sort((a, b) => b.assets - a.assets);

const output = {
  meta: {
    source: `NCUA Call Report ${QUARTER} (FOICU + FS220)`,
    fetchedAt: new Date().toISOString(),
    count: institutions.length,
  },
  institutions,
};

writeFileSync(OUT_FILE, JSON.stringify(output));
const sizeMb = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(2);
if (skippedNoFinancials) {
  console.log(`Skipped ${skippedNoFinancials} directory entries with no FS220 filing`);
}
console.log(`Wrote ${institutions.length} CUs to ${OUT_FILE} (${sizeMb} MB)`);
