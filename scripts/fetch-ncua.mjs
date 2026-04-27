#!/usr/bin/env node
// Parses an NCUA Call Report quarterly extract into a slim JSON for the
// pricing model. Run after downloading + unzipping a quarter into
// scripts/ncua-tmp/<quarter>/  (e.g. q4-2025).
//
// Usage:
//   node scripts/fetch-ncua.mjs --quarter q4-2025 --min-assets 50000000
//
// Output: src/data/ncua-cus.json
//
// Schema notes (validated against Q4 2024 and Q4 2025 — FS220 family columns
// are identical across both, so the parser is stable across quarterly releases):
//
//   FOICU.txt   — directory: CU_NUMBER, CU_NAME, STATE, Peer_Group, CU_TYPE
//   FS220.txt   — main financial: assets, members, total YTD originations,
//                 share balances by type
//   FS220A.txt  — outstanding loan balances by category (auto, CC, unsecured)
//   FS220C.txt  — supplemental: indirect originations YTD
//   FS220L.txt  — loan schedule: outstanding balances for 1st-lien mortgage,
//                 junior-lien (HELOC/2nd), commercial
//
// "Originations" reported here are YTD — when the source quarter is Q4, that
// equals full-year originations.
//
// IMPORTANT — origination methodology:
// NCUA's Call Report only reports ONE origination flow at the CU level:
// total YTD loans granted (Acct_031B). It does NOT break originations down
// by category at the CU level (the older 720/721/722 accounts are deprecated
// and zero in current filings). Indirect origination total is the one
// exception (Acct_618).
//
// To estimate originations by loan category, this parser allocates total
// YTD originations across categories proportionally to OUTSTANDING BALANCES
// in each category. This is an approximation — surface it transparently in
// the UI as "estimated, allocated by outstanding balance."

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const QUARTER = args.quarter ?? "q4-2025";
const MIN_ASSETS = Number(args["min-assets"] ?? 50_000_000);
const SRC_DIR = join(__dirname, "ncua-tmp", QUARTER);
const OUT_FILE = join(REPO_ROOT, "src/data/ncua-cus.json");

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
  const path = join(SRC_DIR, filename);
  // NCUA files are mostly UTF-8 but a few (e.g. FS220D) contain CP1252/latin-1
  // bytes. latin-1 is a strict superset for byte-level reads, so use it for
  // safe decoding of all NCUA files.
  const text = readFileSync(path, "latin1");
  const rows = parseCsv(text);
  const header = rows.shift();
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return { rows, idx };
}

const num = (v) => {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ---------- Account code map (validated above) ----------
// FS220 (main)
const A = {
  TOTAL_ASSETS: "ACCT_010",
  MEMBERS: "ACCT_083",
  TOTAL_LOANS_OUTSTANDING: "ACCT_025B",
  TOTAL_ORIG_YTD: "ACCT_031B",
  // Share balances
  SHARES_REGULAR: "ACCT_657",
  SHARES_DRAFTS: "ACCT_902",
  SHARES_MMA: "ACCT_911",
  SHARES_CDS: "ACCT_908C",
  SHARES_TOTAL: "ACCT_013",
};

// FS220A (loan balances by category)
const A_A = {
  AUTO_NEW: "ACCT_385",
  AUTO_USED: "ACCT_370",
  CREDIT_CARD: "ACCT_396",
  OTHER_UNSECURED: "ACCT_397",
};

// FS220B (IRA shares balance)
const A_B = {
  SHARES_IRA: "ACCT_906C",
};

// FS220C (indirect originations YTD)
const A_C = {
  INDIRECT_ORIG_YTD: "ACCT_618",
};

// FS220L (loan schedule — outstanding balances by collateral type)
const A_L = {
  FIRST_LIEN_RE: "ACCT_703A",  // 1st lien 1-4 family residential outstanding
  JUNIOR_LIEN_RE: "ACCT_386A", // junior lien (HELOC + 2nd mortgage) outstanding
  COMMERCIAL: "ACCT_400A1",    // commercial loans to members outstanding
};

// ---------- Load tables ----------
console.log(`Loading ${QUARTER} from ${SRC_DIR}...`);
const foicu = loadTable("FOICU.txt");
const fs220 = loadTable("FS220.txt");
const fs220a = loadTable("FS220A.txt");
const fs220b = loadTable("FS220B.txt");
const fs220c = loadTable("FS220C.txt");
const fs220l = loadTable("FS220L.txt");

// Index by CU_NUMBER for joining
function indexBy(table, key) {
  const idx = table.idx[key];
  const map = new Map();
  for (const row of table.rows) {
    map.set(row[idx], row);
  }
  return map;
}
const foicuByCu = indexBy(foicu, "CU_NUMBER");
const fs220aByCu = indexBy(fs220a, "CU_NUMBER");
const fs220bByCu = indexBy(fs220b, "CU_NUMBER");
const fs220cByCu = indexBy(fs220c, "CU_NUMBER");
const fs220lByCu = indexBy(fs220l, "CU_NUMBER");

// ---------- Build records ----------
const cus = [];
let skippedBelowThreshold = 0;
let skippedNoMatch = 0;

for (const row of fs220.rows) {
  const cuNumber = row[fs220.idx.CU_NUMBER];
  const assets = num(row[fs220.idx[A.TOTAL_ASSETS]]);
  if (assets < MIN_ASSETS) {
    skippedBelowThreshold++;
    continue;
  }

  const dirRow = foicuByCu.get(cuNumber);
  if (!dirRow) {
    skippedNoMatch++;
    continue;
  }
  const aRow = fs220aByCu.get(cuNumber);
  const bRow = fs220bByCu.get(cuNumber);
  const cRow = fs220cByCu.get(cuNumber);
  const lRow = fs220lByCu.get(cuNumber);

  const totalOrigYtd = num(row[fs220.idx[A.TOTAL_ORIG_YTD]]);
  const indirectOrig = cRow ? num(cRow[fs220c.idx[A_C.INDIRECT_ORIG_YTD]]) : 0;

  // Outstanding loan balances by category — used as the basis for allocating
  // total YTD originations across categories.
  const balAutoNew = aRow ? num(aRow[fs220a.idx[A_A.AUTO_NEW]]) : 0;
  const balAutoUsed = aRow ? num(aRow[fs220a.idx[A_A.AUTO_USED]]) : 0;
  const balAuto = balAutoNew + balAutoUsed;
  const balCard = aRow ? num(aRow[fs220a.idx[A_A.CREDIT_CARD]]) : 0;
  const balUnsecured = aRow ? num(aRow[fs220a.idx[A_A.OTHER_UNSECURED]]) : 0;
  const balFirstLienRE = lRow ? num(lRow[fs220l.idx[A_L.FIRST_LIEN_RE]]) : 0;
  const balJuniorLienRE = lRow ? num(lRow[fs220l.idx[A_L.JUNIOR_LIEN_RE]]) : 0;
  const balCommercial = lRow ? num(lRow[fs220l.idx[A_L.COMMERCIAL]]) : 0;
  const balCategorized =
    balAuto + balCard + balUnsecured + balFirstLienRE + balJuniorLienRE + balCommercial;

  // Allocate total YTD originations proportional to outstanding balance share.
  // This is an estimate — surface in the UI as "estimated; allocated by
  // outstanding balance share." NCUA does not report origination flow by
  // category at the CU level (only the total).
  const allocate = (bal) =>
    balCategorized > 0 ? totalOrigYtd * (bal / balCategorized) : 0;

  cus.push({
    cu: cuNumber,
    name: dirRow[foicu.idx.CU_NAME],
    state: dirRow[foicu.idx.STATE],
    peerGroup: num(dirRow[foicu.idx.Peer_Group]),
    cuType: dirRow[foicu.idx.CU_TYPE],
    assets,
    members: num(row[fs220.idx[A.MEMBERS]]),
    loansOutstanding: num(row[fs220.idx[A.TOTAL_LOANS_OUTSTANDING]]),
    originations: {
      total: totalOrigYtd,
      indirect: indirectOrig,
      // estimated by allocation
      firstMortgageEst: allocate(balFirstLienRE),
      helocEst: allocate(balJuniorLienRE),
      autoEst: allocate(balAuto),
      creditCardEst: allocate(balCard),
      unsecuredEst: allocate(balUnsecured),
      commercialEst: allocate(balCommercial),
    },
    balances: {
      auto: balAuto,
      creditCard: balCard,
      unsecured: balUnsecured,
      firstLienRE: balFirstLienRE,
      juniorLienRE: balJuniorLienRE,
      commercial: balCommercial,
    },
    shares: {
      regular: num(row[fs220.idx[A.SHARES_REGULAR]]),
      drafts: num(row[fs220.idx[A.SHARES_DRAFTS]]),
      mma: num(row[fs220.idx[A.SHARES_MMA]]),
      cds: num(row[fs220.idx[A.SHARES_CDS]]),
      ira: bRow ? num(bRow[fs220b.idx[A_B.SHARES_IRA]]) : 0,
      total: num(row[fs220.idx[A.SHARES_TOTAL]]),
    },
  });
}

// Sort by assets descending — biggest CUs first in the dropdown
cus.sort((a, b) => b.assets - a.assets);

// Aggregate sanity check
const totals = cus.reduce(
  (acc, cu) => {
    acc.assets += cu.assets;
    acc.origTotal += cu.originations.total;
    acc.origFirstMtg += cu.originations.firstMortgageEst;
    acc.origHeloc += cu.originations.helocEst;
    acc.origAuto += cu.originations.autoEst;
    acc.origCard += cu.originations.creditCardEst;
    acc.origUnsecured += cu.originations.unsecuredEst;
    acc.origCommercial += cu.originations.commercialEst;
    acc.shares += cu.shares.total;
    return acc;
  },
  {
    assets: 0,
    origTotal: 0,
    origFirstMtg: 0,
    origHeloc: 0,
    origAuto: 0,
    origCard: 0,
    origUnsecured: 0,
    origCommercial: 0,
    shares: 0,
  },
);

const output = {
  meta: {
    sourceQuarter: QUARTER,
    minAssets: MIN_ASSETS,
    cuCount: cus.length,
    generatedAt: new Date().toISOString(),
    aggregates: {
      totalAssets: totals.assets,
      totalOriginations: totals.origTotal,
      totalShares: totals.shares,
      originationMix: {
        firstMortgagePct: totals.origTotal
          ? totals.origFirstMtg / totals.origTotal
          : 0,
        helocPct: totals.origTotal ? totals.origHeloc / totals.origTotal : 0,
        autoPct: totals.origTotal ? totals.origAuto / totals.origTotal : 0,
        creditCardPct: totals.origTotal
          ? totals.origCard / totals.origTotal
          : 0,
        unsecuredPct: totals.origTotal
          ? totals.origUnsecured / totals.origTotal
          : 0,
        commercialPct: totals.origTotal
          ? totals.origCommercial / totals.origTotal
          : 0,
      },
    },
  },
  cus,
};

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(output));

const sizeMb = (Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(2);
console.log(`Skipped ${skippedBelowThreshold} CUs below $${MIN_ASSETS / 1e6}M threshold`);
if (skippedNoMatch) console.log(`Skipped ${skippedNoMatch} CUs with no FOICU directory match`);
console.log(`Wrote ${cus.length} CUs to ${OUT_FILE} (${sizeMb} MB)`);
console.log(`\nAggregates ($${MIN_ASSETS / 1e6}M+ tier):`);
console.log(`  Total assets:        $${(totals.assets / 1e9).toFixed(1)}B`);
console.log(`  Total YTD orig:      $${(totals.origTotal / 1e9).toFixed(1)}B`);
console.log(`  Total shares:        $${(totals.shares / 1e9).toFixed(1)}B`);
console.log(`  Origination mix (allocated by outstanding balance share):`);
console.log(`    First mortgage:    ${(output.meta.aggregates.originationMix.firstMortgagePct * 100).toFixed(1)}%`);
console.log(`    HELOC/junior lien: ${(output.meta.aggregates.originationMix.helocPct * 100).toFixed(1)}%`);
console.log(`    Auto:              ${(output.meta.aggregates.originationMix.autoPct * 100).toFixed(1)}%`);
console.log(`    Credit card:       ${(output.meta.aggregates.originationMix.creditCardPct * 100).toFixed(1)}%`);
console.log(`    Unsecured:         ${(output.meta.aggregates.originationMix.unsecuredPct * 100).toFixed(1)}%`);
console.log(`    Commercial:        ${(output.meta.aggregates.originationMix.commercialPct * 100).toFixed(1)}%`);
