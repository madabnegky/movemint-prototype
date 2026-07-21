#!/usr/bin/env node
// Imports the team's HubSpot-export workbook into the sales pipeline seed.
//
// Usage: node scripts/import-workbook.mjs
// Inputs:  scripts/data/kyle-workbook-sales-pipeline.xlsx
//          src/data/universe-banks.json + src/data/universe-cus.json
// Outputs: src/data/pipeline-seed.json
//          scripts/data/import-report.md
//
// Matching rules: workbook rows NEVER create FI records — they only attach
// pipeline data to canonical FDIC/NCUA institutions. Rows that can't be
// matched confidently are skipped and listed in the report for human review,
// so duplicates are structurally impossible.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const WB_PATH = join(__dirname, "data/kyle-workbook-sales-pipeline.xlsx");
const OUT_SEED = join(REPO_ROOT, "src/data/pipeline-seed.json");
const OUT_REPORT = join(__dirname, "data/import-report.md");
const OUT_UNMATCHED = join(REPO_ROOT, "src/data/pipeline-unmatched.json");

// ---------- Universe ----------
const banks = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/universe-banks.json"))).institutions;
const cus = JSON.parse(readFileSync(join(REPO_ROOT, "src/data/universe-cus.json"))).institutions;
const universe = [...banks, ...cus];

// ---------- Name normalization ----------
// NCUA directory names omit "Credit Union"/"FCU" suffixes entirely, so those
// words are stripped from both sides before comparing.
const STOP_TOKENS = new Set([
  "federal", "credit", "union", "fcu", "cu", "bank", "banking", "bancorp",
  "bancshares", "bankshares", "holdings", "group", "national", "association",
  "na", "n", "a", "b", "the", "inc", "co", "company", "trust", "savings", "ssb",
  "fsb", "state", "st", "saint", "of", "and",
]);

const ORDINALS = {
  "1st": "first", "2nd": "second", "3rd": "third", "4th": "fourth",
  "5th": "fifth", "6th": "sixth", "7th": "seventh", "8th": "eighth",
  "9th": "ninth", "10th": "tenth",
  // Call-report style abbreviations seen in the HubSpot export
  bk: "bank", bkg: "banking", tr: "trust", tc: "trust", natl: "national",
  nat: "national", mrchs: "merchants", frmrs: "farmers", svgs: "savings",
  cmnty: "community", mtn: "mountain", vly: "valley", cnty: "county",
};

function baseClean(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((t) => ORDINALS[t] ?? t)
    .join(" ");
}

// Infers bank vs cu from naming conventions; null when unclear.
function inferType(rawName) {
  const s = String(rawName ?? "").toLowerCase();
  if (/credit union|\bfcu\b|\bc\.u\.\b/.test(s)) return "cu";
  if (/\bbank|bancorp|bancshares|savings|\btrust\b/.test(s)) return "bank";
  return null;
}

// NCUA names often carry "X CU D.B.A. Y CU" — both halves are valid aliases.
function nameAliases(rawName) {
  const parts = String(rawName ?? "").split(/\bd\.?\s?b\.?\s?a\.?\b/i);
  return parts.map((p) => p.trim()).filter(Boolean);
}

// Strips deal-name noise; returns { name, stateHint }
function cleanDealName(raw) {
  let s = String(raw ?? "").trim();
  let stateHint = null;
  const paren = s.match(/\(([A-Za-z]{2})\)/);
  if (paren) stateHint = paren[1].toUpperCase();
  s = s.replace(/\([^)]*\)/g, " ");
  s = s.split(/\s+[-–—]\s+/)[0]; // "X - New Deal" → "X"
  s = s.replace(/\b(new deal|gac \d{4}|gac|\d{4} renewal|renewal)\b/gi, " ");
  return { name: s, stateHint };
}

function tokens(s) {
  return baseClean(s).split(/\s+/).filter((t) => t && !STOP_TOKENS.has(t));
}
function nameKey(s) {
  return tokens(s).join(" ");
}
function cityKey(s) {
  return baseClean(s).replace(/\bsaint\b/g, "st").replace(/\bfort\b/g, "ft");
}

// ---------- Match indexes ----------
const byNameCity = new Map(); // "name|city" → FI[]
const byName = new Map(); // name → FI[]
for (const fi of universe) {
  for (const alias of nameAliases(fi.name)) {
    const nk = nameKey(alias);
    if (!nk) continue;
    const nck = `${nk}|${cityKey(fi.city)}`;
    const ncList = byNameCity.get(nck) ?? byNameCity.set(nck, []).get(nck);
    if (!ncList.includes(fi)) ncList.push(fi);
    const nList = byName.get(nk) ?? byName.set(nk, []).get(nk);
    if (!nList.includes(fi)) nList.push(fi);
  }
}

function jaccard(aTokens, bTokens) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

// Attempts to resolve a workbook name to exactly one canonical FI.
// Returns { fi, method } or { fi: null, reason, candidates }.
//
// `assets` (from the Addressable sheets) breaks ties between same-named FIs.
function matchFI(rawName, { city = null, stateHint = null, type = null, assets = null } = {}) {
  const { name, stateHint: parsedState } = cleanDealName(rawName);
  const state = stateHint ?? parsedState;
  const effType = type ?? inferType(rawName);
  const nk = nameKey(name);
  if (!nk) return { fi: null, reason: "empty name after normalization", candidates: [] };

  const disambiguate = (list, label) => {
    if (list.length === 1) return { fi: list[0], method: label };
    if (list.length === 0) return null;
    let hits = list;
    if (state) {
      const byState = hits.filter((f) => f.state === state);
      if (byState.length === 1) return { fi: byState[0], method: `${label}+state` };
      if (byState.length > 1) hits = byState;
    }
    if (city) {
      const byCity = hits.filter((f) => cityKey(f.city) === cityKey(city));
      if (byCity.length === 1) return { fi: byCity[0], method: `${label}+city` };
      if (byCity.length > 1) hits = byCity;
    }
    if (assets) {
      const byAssets = hits.filter(
        (f) => f.assets > 0 && Math.abs(f.assets - assets) / Math.max(f.assets, assets) < 0.1,
      );
      if (byAssets.length === 1) return { fi: byAssets[0], method: `${label}+assets` };
    }
    return { fi: null, reason: `ambiguous ${label}`, candidates: hits };
  };

  const attempt = (t) => {
    const narrow = (list) => (t ? list.filter((f) => f.type === t) : list);

    // 1. exact name + city
    if (city) {
      const hits = narrow(byNameCity.get(`${nk}|${cityKey(city)}`) ?? []);
      const r = disambiguate(hits, "name+city");
      if (r) return r;
    }

    // 2. exact name, disambiguated by state/city/assets
    {
      const hits = narrow(byName.get(nk) ?? []);
      const r = disambiguate(hits, "name");
      if (r) return r;
    }

    // 3. containment: query tokens ⊆ candidate tokens or vice versa,
    //    unique winner required (handles "1st Security Bank" vs
    //    "1st Security Bank of Washington", "TopLine FCU" vs "TOPLINE FINANCIAL")
    const qTokens = tokens(name);
    const qSet = new Set(qTokens);
    if (qSet.size > 0) {
      // Containment direction matters. WITH a city to corroborate, either
      // direction is safe (city filters false positives). WITHOUT a city, only
      // accept when the query's full token set is contained in the candidate
      // (query "1st security bank" ⊆ candidate "1st security bank of
      // washington") AND at least two tokens overlap — this stops a 1-token
      // universe name like "MOUNTAIN" from swallowing "Mountain View CU".
      const contained = [];
      for (const fi of universe) {
        if (t && fi.type !== t) continue;
        if (state && fi.state !== state) continue;
        for (const alias of nameAliases(fi.name)) {
          const cSet = new Set(tokens(alias));
          if (cSet.size === 0) continue;
          let ok;
          if (city) {
            const small = qSet.size <= cSet.size ? qSet : cSet;
            const large = qSet.size <= cSet.size ? cSet : qSet;
            ok = [...small].every((tok) => large.has(tok));
          } else {
            const qInC = [...qSet].every((tok) => cSet.has(tok));
            ok = qInC && qSet.size >= 2;
          }
          if (ok) {
            if (!contained.includes(fi)) contained.push(fi);
            break;
          }
        }
      }
      const pool = city
        ? contained.filter((f) => cityKey(f.city) === cityKey(city))
        : contained;
      if (pool.length === 1) return { fi: pool[0], method: city ? "contain+city" : "contain" };
      if (pool.length > 1) {
        const r = disambiguate(pool, "containment");
        if (r?.fi) return r;
      }

      // 4. fuzzy: token-set similarity. Strict without corroboration;
      //    relaxed when the city corroborates.
      let best = null;
      let bestScore = 0;
      let runnerUp = 0;
      for (const fi of universe) {
        if (t && fi.type !== t) continue;
        if (state && fi.state !== state) continue;
        if (city && cityKey(fi.city) !== cityKey(city)) continue;
        let score = 0;
        for (const alias of nameAliases(fi.name)) {
          score = Math.max(score, jaccard(qTokens, tokens(alias)));
        }
        if (score > bestScore) {
          runnerUp = bestScore;
          bestScore = score;
          best = fi;
        } else if (score > runnerUp) {
          runnerUp = score;
        }
      }
      // Without a city, a fuzzy win on a 1-token name is almost always a
      // coincidence ("Mayo" ~ "Mayo Employees"). Require ≥2 query tokens there.
      const threshold = city ? 0.5 : 0.85;
      const enoughTokens = city ? true : qTokens.length >= 2;
      if (best && enoughTokens && bestScore >= threshold && bestScore - runnerUp >= 0.1) {
        return { fi: best, method: `fuzzy(${bestScore.toFixed(2)})` };
      }
      return {
        fi: null,
        reason: `no confident match (best ${bestScore.toFixed(2)}${best ? ` = ${best.name}, ${best.city} ${best.state}` : ""})`,
        candidates: best ? [best] : [],
      };
    }
    return { fi: null, reason: "no tokens", candidates: [] };
  };

  // Try with the (given or inferred) type first; if that produces nothing,
  // retry untyped but ONLY accept city-corroborated results — catches rows
  // misfiled by type (a CU on the banks sheet) without cross-type noise.
  const typed = attempt(effType);
  if (typed.fi) return typed;
  if (effType && city) {
    const untyped = attempt(null);
    if (untyped.fi && /city/.test(untyped.method)) return untyped;
  }
  return typed;
}

// ---------- Stage vocabulary ----------
const STAGE_MAP = {
  "short term nurture": "short-term-nurture",
  "long term nurture": "long-term-nurture",
  "disqualified or no fit": "disqualified",
  "signed with competitor": "signed-with-competitor",
  "discovery scheduled": "discovery-scheduled",
  "discovery complete": "discovery-complete",
  "warm leads": "warm-lead",
  "warm lead": "warm-lead",
  "bad contact info": "bad-contact-info",
  "qualified": "qualified",
  "demo completed": "demo-completed",
  "demo complete": "demo-completed",
  "proposal sent": "proposal-sent",
  "verbal commitment": "verbal-commitment",
  "closed won": "closed-won",
  "closed lost": "closed-lost",
};
// Rank for collapsing duplicates: furthest-along wins. Branch states beat
// MQL (the deal sheet is fresher signal) but lose to active deal stages.
const STAGE_RANK = {
  mql: 1,
  "short-term-nurture": 3,
  "long-term-nurture": 3,
  disqualified: 3,
  "bad-contact-info": 3,
  "signed-with-competitor": 3,
  "warm-lead": 4,
  qualified: 5,
  "discovery-scheduled": 6,
  "discovery-complete": 7,
  "demo-completed": 8,
  "proposal-sent": 9,
  "verbal-commitment": 10,
  "closed-lost": 11,
  "closed-won": 12,
};

const KNOWN_OWNERS = ["Robbie Sink", "Avery Flynn", "Elise Cushing", "Amaha Selassie", "BDR (Insource)"];
function cleanOwner(raw) {
  const s = String(raw ?? "").trim();
  if (!s || /deactivated user/i.test(s)) return null;
  const hit = KNOWN_OWNERS.find((o) => o.toLowerCase() === s.toLowerCase());
  return hit ?? s;
}

// ---------- Read workbook ----------
const wb = XLSX.readFile(WB_PATH);
function sheetRows(name, headerCol) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
  const headerIdx = rows.findIndex((r) => r.some((c) => String(c).trim() === headerCol));
  if (headerIdx === -1) throw new Error(`Header "${headerCol}" not found in sheet "${name}"`);
  const header = rows[headerIdx].map((h) => String(h).trim());
  return rows
    .slice(headerIdx + 1)
    .filter((r) => r.some((c) => String(c).trim() !== ""))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

// ---------- Build records ----------
const records = new Map(); // fiId → PipelineRecord
const report = {
  sheets: {},
  unmatched: [],
  collapsed: [],
  inexact: [],
};

function auditMatch(sheet, rawName, res) {
  if (!/^(name\+city|name)$/.test(res.method)) {
    report.inexact.push(
      `${String(rawName).trim()} → **${res.fi.name}** (${res.fi.city}, ${res.fi.state}) via \`${res.method}\` — _${sheet}_`,
    );
  }
}

function getRecord(fi) {
  if (!records.has(fi.id)) {
    records.set(fi.id, { fiId: fi.id, stage: null, owner: null });
  }
  return records.get(fi.id);
}

// The workbook is the current pipeline snapshot, so closed deals in it are
// attributed to the data-as-of year. Users can re-attribute in the drawer.
const DATA_YEAR = 2026;

function applyStage(fi, stage, source) {
  const rec = getRecord(fi);
  if (rec.stage && rec.stage !== stage) {
    const keep = STAGE_RANK[stage] > STAGE_RANK[rec.stage] ? stage : rec.stage;
    report.collapsed.push(
      `${fi.name} (${fi.id}): had "${rec.stage}", ${source} says "${stage}" → kept "${keep}"`,
    );
    rec.stage = keep;
  } else {
    rec.stage = stage;
  }
  if (rec.stage === "closed-won" || rec.stage === "closed-lost") {
    rec.closedYear = DATA_YEAR;
  } else {
    delete rec.closedYear;
  }
}

function trackSheet(name, total, matched, skipped) {
  report.sheets[name] = { total, matched, skipped };
}

// --- Addressable Banks / CUs → platformFit ---
for (const [sheet, type] of [
  ["Addressable Banks", null], // sheet has a Classification column; trust it over the tab name
  ["Addressable CUs", null],
]) {
  const rows = sheetRows(sheet, "Company name");
  let matched = 0;
  for (const row of rows) {
    const cls = String(row["Classification"] ?? "").toLowerCase();
    const rowType = cls.includes("credit") ? "cu" : cls.includes("bank") ? "bank" : type;
    const assetSize = Number(String(row["Asset Size"]).replace(/[^0-9.]/g, "")) || null;
    const res = matchFI(row["Company name"], {
      city: row["City"] || null,
      type: rowType,
      assets: assetSize,
    });
    if (!res.fi) {
      report.unmatched.push({ sheet, name: row["Company name"], city: row["City"], reason: res.reason });
      continue;
    }
    matched++;
    auditMatch(sheet, row["Company name"], res);
    const rec = getRecord(res.fi);
    rec.platformFit = true;
    const owner = cleanOwner(row["Company owner"]);
    if (owner && !rec.owner) rec.owner = owner;
  }
  trackSheet(sheet, rows.length, matched, rows.length - matched);
}

// --- MQL → stage mql + leadSource ---
{
  const rows = sheetRows("MQL", "Financial Institution");
  let matched = 0;
  for (const row of rows) {
    const res = matchFI(row["Financial Institution"]);
    const src = String(row["Lead Source"] ?? "").trim();
    if (!res.fi) {
      report.unmatched.push({
        sheet: "MQL",
        name: row["Financial Institution"],
        reason: res.reason,
        intended: { stage: "mql", leadSource: src || undefined },
      });
      continue;
    }
    matched++;
    auditMatch("MQL", row["Financial Institution"], res);
    const rec = getRecord(res.fi);
    if (src) rec.leadSource = src;
    applyStage(res.fi, "mql", "MQL sheet");
  }
  trackSheet("MQL", rows.length, matched, rows.length - matched);
}

// --- SQL + sales stage → deal stages + owner ---
// The "Sales Qualified" stage was removed from the pipeline. Both sheets carry
// the real stage in a "Deal Stage" / "Time in Current Stage" cell (the SQL
// sheet's rows all read "Qualified"), so there is no SQL fallback — a row with
// no recognizable stage is reported, not force-assigned.
for (const [sheet, fallbackStage] of [
  ["SQL", null],
  ["sales stage", null],
]) {
  const rows = sheetRows(sheet, "Deal Name");
  let matched = 0;
  for (const row of rows) {
    // Stage can land in "Time in Current Stage" or "Deal Stage" depending on
    // how the row was exported — detect by vocabulary, not position.
    let stage = null;
    for (const cell of Object.values(row)) {
      const key = baseClean(cell);
      if (STAGE_MAP[key]) {
        stage = STAGE_MAP[key];
        break;
      }
    }
    if (!stage) stage = fallbackStage;
    if (!stage) {
      report.unmatched.push({ sheet, name: row["Deal Name"], reason: "no recognizable stage value" });
      continue;
    }
    const owner = cleanOwner(row["Deal owner"]);
    const res = matchFI(row["Deal Name"]);
    if (!res.fi) {
      report.unmatched.push({
        sheet,
        name: row["Deal Name"],
        reason: res.reason,
        intended: { stage, owner: owner || undefined },
      });
      continue;
    }
    matched++;
    auditMatch(sheet, row["Deal Name"], res);
    const rec = getRecord(res.fi);
    if (owner) rec.owner = owner; // deal owner beats company owner
    applyStage(res.fi, stage, `${sheet} sheet`);
  }
  trackSheet(sheet, rows.length, matched, rows.length - matched);
}

// ---------- Seed output ----------
const now = new Date().toISOString();
const outRecords = {};
for (const [id, rec] of records) {
  outRecords[id] = { ...rec, updatedAt: now };
}

const seed = {
  records: outRecords,
  settings: {
    owners: KNOWN_OWNERS,
    salesGoal: 21,
    defaultDealArr: 75000,
    stageProbabilities: {
      mql: 0,
      "warm-lead": 0.05,
      qualified: 0.35,
      "discovery-scheduled": 0.4,
      "discovery-complete": 0.45,
      "demo-completed": 0.5,
      "proposal-sent": 0.7,
      "verbal-commitment": 0.9,
      "closed-won": 1,
      "closed-lost": 0,
      "short-term-nurture": 0.1,
      "long-term-nurture": 0.05,
      disqualified: 0,
      "bad-contact-info": 0,
      "signed-with-competitor": 0,
    },
  },
  updatedAt: now,
};
writeFileSync(OUT_SEED, JSON.stringify(seed, null, 2));

// ---------- Report ----------
const stageCounts = {};
let fitCount = 0;
for (const rec of records.values()) {
  if (rec.platformFit) fitCount++;
  if (rec.stage) stageCounts[rec.stage] = (stageCounts[rec.stage] ?? 0) + 1;
}

const lines = [
  "# Workbook Import Report",
  "",
  `Generated: ${now}`,
  `Universe: ${banks.length} banks + ${cus.length} CUs`,
  "",
  "## Per-sheet match results",
  "",
  "| Sheet | Rows | Matched | Skipped |",
  "|---|---|---|---|",
  ...Object.entries(report.sheets).map(
    ([s, v]) => `| ${s} | ${v.total} | ${v.matched} | ${v.skipped} |`,
  ),
  "",
  "## Seeded pipeline state",
  "",
  `- Records with any data: ${records.size}`,
  `- Platform fit: ${fitCount}`,
  ...Object.entries(stageCounts)
    .sort((a, b) => (STAGE_RANK[a[0]] ?? 0) - (STAGE_RANK[b[0]] ?? 0))
    .map(([s, n]) => `- ${s}: ${n}`),
  "",
  `## Non-exact matches — spot-check these (${report.inexact.length})`,
  "",
  "Accepted via containment/fuzzy/disambiguation rather than an exact name match.",
  "",
  ...report.inexact.map((c) => `- ${c}`),
  "",
  `## Collapsed duplicates (${report.collapsed.length})`,
  "",
  ...report.collapsed.map((c) => `- ${c}`),
  "",
  `## Unmatched / needs human review (${report.unmatched.length})`,
  "",
  "These rows were NOT imported. Resolve manually in the UI (find the FI and set",
  "its stage/owner/fit) or fix the workbook and re-run the import.",
  "",
  ...report.unmatched.map(
    (u) => `- **${String(u.name).trim()}**${u.city ? ` (${u.city})` : ""} — _${u.sheet}_: ${u.reason}`,
  ),
  "",
];
writeFileSync(OUT_REPORT, lines.join("\n"));

// Machine-readable unmatched list, consumed by the in-app "Unmatched from
// workbook" panel so these can be resolved by hand without leaving the tool.
// Only rows that carry an intended stage (MQL / deal sheets) are actionable;
// the Addressable-sheet misses only imply platform fit and are less urgent.
const unmatchedOut = report.unmatched
  .filter((u) => u.intended)
  .map((u, i) => ({
    id: `unmatched-${i}`,
    name: String(u.name).trim(),
    sheet: u.sheet,
    reason: u.reason,
    intended: u.intended,
  }));
writeFileSync(
  OUT_UNMATCHED,
  JSON.stringify({ generatedAt: now, count: unmatchedOut.length, rows: unmatchedOut }, null, 2),
);

console.log(`Wrote ${records.size} seed records to ${OUT_SEED}`);
console.log(`Report: ${OUT_REPORT}`);
console.log("");
for (const [s, v] of Object.entries(report.sheets)) {
  console.log(`${s}: ${v.matched}/${v.total} matched`);
}
console.log(`platformFit: ${fitCount}, unmatched total: ${report.unmatched.length}`);
console.log("Stage counts:", stageCounts);
