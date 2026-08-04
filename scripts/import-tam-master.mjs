// Seed the sales pipeline from the reconciled TAM_Master workbook.
//
// This replaces the fuzzy name-matching in import-workbook.mjs. Every row in
// TAM_Master carries a `Reg ID` — the FDIC certificate or NCUA charter number —
// which IS the platform's canonical FI key (`bank-<cert>` / `cu-<charter>`).
// So the join is a deterministic ID lookup with no name normalization at all.
//
// Invariant (inherited from import-workbook.mjs): workbook rows NEVER create FI
// records. They only attach pipeline data to canonical FDIC/NCUA institutions.
// Anything that can't be joined by ID goes to the triage queue — we never guess.
//
// NOTE: this regenerates the seed from scratch, which wipes LOS/Core coming from
// the TruStage list. Run `npm run seed:rebuild` rather than this script alone —
// it chains import-los-core.mjs afterwards and then re-overlays the workbook's
// own LOS/Core values on top.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import xlsx from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const WORKBOOK = path.join(ROOT, "scripts/data/Pipeline_Reconciliation_and_Funnel7-28-26pm.xlsx");
const SHEET = "TAM_Master";
const BANKS = path.join(ROOT, "src/data/universe-banks.json");
const CUS = path.join(ROOT, "src/data/universe-cus.json");
const OUT_SEED = path.join(ROOT, "src/data/pipeline-seed.json");
const OUT_TRIAGE = path.join(ROOT, "src/data/pipeline-triage.json");
const OUT_REPORT = path.join(ROOT, "scripts/data/tam-import-report.md");

/** Calendar year closed-won / closed-lost deals are attributed to. */
const DATA_YEAR = 2026;

/** Email statuses we consider deliverable. Anything else means we can't reach them. */
const USABLE_EMAIL_STATUS = new Set(["VALID", "CATCHALL", "SOURCED CATCHALL"]);

/** LOS/Core cells that are artifacts of the source export, not real system names. */
const JUNK_ATTR = new Set(["", "#N/A", "N/A", "NA", "TRUE", "FALSE", "0", "NONE", "NULL"]);

// ── helpers ──────────────────────────────────────────────────────────────────

const str = (v) => String(v ?? "").trim();
const isCU = (fiType) => str(fiType).toLowerCase().startsWith("credit");

/** Reg ID cells arrive as numbers, so "9247" can read back as "9247.0". */
function regId(v) {
  const s = str(v).replace(/\.0+$/, "");
  return /^\d+$/.test(s) ? String(Number(s)) : s;
}

function cleanAttr(v) {
  const s = str(v);
  if (JUNK_ATTR.has(s.toUpperCase())) return "";
  // "FALSE [FI Nav]" / "True" are FI Navigator boolean leakage, not system names.
  if (/^(true|false)\b/i.test(s)) return "";
  return s;
}

/** Stable triage id — content-addressed so a re-import doesn't renumber rows.
 *  (The old importer used positional `unmatched-${i}`, which silently re-pointed
 *  persisted resolvedUnmatched entries at different institutions.) */
function triageId(company, rid, stage) {
  const h = crypto.createHash("sha1").update(`${company}|${rid}|${stage}`).digest("hex");
  return `triage-${h.slice(0, 12)}`;
}

/** Read a sheet as rows of objects, finding the header row by sentinel column. */
function sheetRows(wb, name, sentinel) {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`sheet "${name}" not found`);
  const grid = xlsx.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" });
  const h = grid.findIndex((row) => row.some((c) => str(c) === sentinel));
  if (h < 0) throw new Error(`sheet "${name}": header column "${sentinel}" not found`);
  const header = grid[h].map(str);
  return grid.slice(h + 1)
    .filter((row) => row.some((c) => str(c) !== ""))
    .map((row) => Object.fromEntries(header.map((k, i) => [k, row[i] ?? ""])));
}

// ── stage mapping ────────────────────────────────────────────────────────────

/** Workbook Funnel Stage → platform StageId.
 *  `null` means "no stage" — the FI sits in the computed Active Pursuit tier.
 *  "Needs Contact (pre-AP)" is deliberately absent: it's resolved per-row by
 *  hasUsableContact(), because the label is stale on ~half the rows. */
const STAGE_MAP = {
  "Active Pursuit": null,
  "Short-Term Nurture": "short-term-nurture",
  "Long-Term Nurture": "long-term-nurture",
  MQL: "mql",
  // The workbook's "SQL" is the Sales Qualified Lead stage, stored as
  // "qualified" (the id predates the label).
  SQL: "qualified",
  "Proposal Sent": "proposal-sent",
  "Discovery Complete": "discovery-complete",
  "Verbal Commitment": "verbal-commitment",
  "Contract & Due Diligence Sent": "contract-sent",
  "Closed Won": "closed-won",
  "Closed Lost": "closed-lost",
};

const NEEDS_CONTACT_LABEL = "Needs Contact (pre-AP)";

/** Furthest-along wins when several workbook rows land on one FI. */
const STAGE_RANK = {
  "needs-contact": 0,
  mql: 1,
  "short-term-nurture": 2,
  "long-term-nurture": 2,
  qualified: 3,
  "discovery-complete": 4,
  "proposal-sent": 5,
  "verbal-commitment": 6,
  "contract-sent": 7,
  "closed-lost": 8,
  "closed-won": 9,
};

// ── load ─────────────────────────────────────────────────────────────────────

const banks = JSON.parse(fs.readFileSync(BANKS, "utf8"));
const cus = JSON.parse(fs.readFileSync(CUS, "utf8"));
const UNIVERSE = new Map();
for (const fi of [...banks.institutions, ...cus.institutions]) UNIVERSE.set(fi.id, fi);

const wb = xlsx.readFile(WORKBOOK);
const rows = sheetRows(wb, SHEET, "Company name");

console.log(`TAM_Master: ${rows.length} rows`);
console.log(`Universe:   ${UNIVERSE.size} institutions (${banks.institutions.length} banks, ${cus.institutions.length} CUs)`);

// ── pass 1: dedupe ───────────────────────────────────────────────────────────
// The workbook has ~197 duplicate groups. Where the owner agrees we keep the
// most complete row. Where owners CONFLICT we keep neither silently — the
// account would change hands without anyone deciding — so it goes to triage.

const groups = new Map();
for (const r of rows) {
  const key = `${str(r["Company name"])}|${regId(r["Reg ID"])}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

const completeness = (r) =>
  Object.values(r).filter((v) => str(v) && str(v) !== "#N/A").length;

const deduped = [];
const ownerConflicts = [];
let droppedDupes = 0;

for (const [, group] of groups) {
  if (group.length === 1) {
    deduped.push(group[0]);
    continue;
  }
  const owners = new Set(group.map((r) => str(r["Owner (final)"])).filter(Boolean));
  if (owners.size > 1) {
    // Keep the most complete row so the FI still lands in the pipeline, but
    // flag the ownership decision for a human.
    const best = [...group].sort((a, b) => completeness(b) - completeness(a))[0];
    deduped.push(best);
    ownerConflicts.push({ rows: group, owners: [...owners] });
    droppedDupes += group.length - 1;
  } else {
    const best = [...group].sort((a, b) => completeness(b) - completeness(a))[0];
    deduped.push(best);
    droppedDupes += group.length - 1;
  }
}

console.log(`Dedupe:     ${rows.length} → ${deduped.length} (${droppedDupes} duplicate rows dropped, ${ownerConflicts.length} owner conflicts flagged)`);

// ── pass 2: join by Reg ID ───────────────────────────────────────────────────

const records = new Map();
const triage = [];
const report = {
  joined: 0,
  byStage: {},
  needsContactKept: 0,
  needsContactCleared: 0,
  collapsed: [],
  triageByClass: {},
};

function getRecord(fiId) {
  if (!records.has(fiId)) {
    records.set(fiId, { fiId, stage: null, owner: null });
  }
  return records.get(fiId);
}

function addTriage(row, cls, reason, intended) {
  const company = str(row["Company name"]);
  const rid = regId(row["Reg ID"]);
  triage.push({
    id: triageId(company, rid, str(row["Funnel Stage"])),
    name: company,
    sheet: SHEET,
    class: cls,
    reason,
    regId: rid,
    fiType: str(row["FI Type"]),
    assets: Number(row["Asset ($)"]) || null,
    intended,
  });
  report.triageByClass[cls] = (report.triageByClass[cls] ?? 0) + 1;
}

/** Does this row carry contact details we could actually act on? */
function hasUsableContact(row) {
  const email = str(row.Email);
  if (!email) return false;
  return USABLE_EMAIL_STATUS.has(str(row["Email Status"]).toUpperCase());
}

function resolveStage(row) {
  const label = str(row["Funnel Stage"]);
  if (label === NEEDS_CONTACT_LABEL) {
    if (hasUsableContact(row)) {
      report.needsContactCleared++;
      return null; // reachable → belongs in Active Pursuit, not a contact queue
    }
    report.needsContactKept++;
    return "needs-contact";
  }
  return label in STAGE_MAP ? STAGE_MAP[label] : undefined;
}

const owners = new Set();

for (const row of deduped) {
  const company = str(row["Company name"]);
  const rid = regId(row["Reg ID"]);
  const fiType = str(row["FI Type"]);
  const stageLabel = str(row["Funnel Stage"]);
  const owner = str(row["Owner (final)"]);

  const stage = resolveStage(row);
  const intended = { stage: stage ?? undefined, owner: owner || undefined };

  if (!rid) {
    addTriage(row, "no-reg-id", "No Reg ID — institution could not be identified", intended);
    continue;
  }
  if (stage === undefined) {
    addTriage(row, "unknown-stage", `Unrecognized Funnel Stage "${stageLabel}"`, intended);
    continue;
  }

  const fiId = `${isCU(fiType) ? "cu" : "bank"}-${rid}`;
  let fi = UNIVERSE.get(fiId);

  if (!fi) {
    // Reg ID is valid but filed under the wrong FI Type — check the other registry.
    const altId = `${isCU(fiType) ? "bank" : "cu"}-${rid}`;
    if (UNIVERSE.get(altId)) {
      addTriage(row, "wrong-registry",
        `FI Type is "${fiType}" but Reg ID ${rid} resolves in the other registry (${altId})`,
        intended);
    } else {
      addTriage(row, "not-in-universe",
        `Reg ID ${rid} is not in the current FDIC/NCUA universe (merged, closed, or bad ID)`,
        intended);
    }
    continue;
  }

  const rec = getRecord(fiId);
  report.joined++;

  // Stage — furthest along wins if this FI was already touched.
  if (stage) {
    if (rec.stage && rec.stage !== stage) {
      const keep = (STAGE_RANK[stage] ?? 0) > (STAGE_RANK[rec.stage] ?? 0) ? stage : rec.stage;
      report.collapsed.push(`${fi.name} (${fiId}): had "${rec.stage}", row says "${stage}" → kept "${keep}"`);
      rec.stage = keep;
    } else {
      rec.stage = stage;
    }
    if (rec.stage === "closed-won" || rec.stage === "closed-lost") rec.closedYear = DATA_YEAR;
    else delete rec.closedYear;
  }

  // Everything in TAM_Master is vetted as addressable.
  rec.platformFit = true;

  if (owner && !rec.owner) {
    rec.owner = owner;
    owners.add(owner);
  }

  // Contacts — only when we have a name, and only attach an email we trust.
  const contactName = str(row["Contact (best)"]);
  if (contactName && !rec.contacts) {
    const email = str(row.Email);
    const contact = { name: contactName };
    if (email && USABLE_EMAIL_STATUS.has(str(row["Email Status"]).toUpperCase())) {
      contact.email = email;
    }
    rec.contacts = [contact];
  }

  const los = cleanAttr(row.LOS);
  const core = cleanAttr(row.Core);
  if (los) rec.los = los;
  if (core) rec.coreSystem = core;

  const key = rec.stage ?? "(active pursuit)";
  report.byStage[key] = (report.byStage[key] ?? 0) + 1;
}

// Owner conflicts go to triage after the join so the record already exists.
for (const c of ownerConflicts) {
  const row = c.rows[0];
  addTriage(row, "owner-conflict",
    `Duplicate rows assign different owners: ${c.owners.join(" vs ")}`,
    { owner: undefined });
}

// ── settings ─────────────────────────────────────────────────────────────────

const prev = fs.existsSync(OUT_SEED) ? JSON.parse(fs.readFileSync(OUT_SEED, "utf8")) : null;
const prevSettings = prev?.settings ?? {};

/** Stages removed in the 2026-07 funnel redefinition. Carrying their
 *  probabilities forward would leave dead rows on the settings page. */
const RETIRED_STAGES = [
  "warm-lead",
  "discovery-scheduled",
  "demo-completed",
  "disqualified",
  "bad-contact-info",
  "signed-with-competitor",
  "sql",
];
const prevProbs = { ...(prevSettings.stageProbabilities ?? {}) };
for (const dead of RETIRED_STAGES) delete prevProbs[dead];

const settings = {
  ...prevSettings,
  owners: [...owners].sort((a, b) => a.localeCompare(b)),
  salesGoal: prevSettings.salesGoal ?? 21,
  defaultDealArr: prevSettings.defaultDealArr ?? 75000,
  stageProbabilities: {
    ...prevProbs,
    "needs-contact": 0,
    "contract-sent": 0.95,
  },
};

// ── write ────────────────────────────────────────────────────────────────────

const now = new Date().toISOString();
const seed = {
  records: Object.fromEntries(
    [...records.entries()].map(([id, r]) => [id, { ...r, updatedAt: now }]),
  ),
  settings,
  updatedAt: now,
};

fs.writeFileSync(OUT_SEED, JSON.stringify(seed, null, 2));
fs.writeFileSync(OUT_TRIAGE, JSON.stringify(triage, null, 2));

// ── report ───────────────────────────────────────────────────────────────────

const lines = [];
lines.push("# TAM_Master import report", "");
lines.push(`Generated ${now}`, "");
lines.push(`Source: \`${path.relative(ROOT, WORKBOOK)}\` — sheet \`${SHEET}\``, "");
lines.push("## Join", "");
lines.push("Every join is an exact `Reg ID` → `fiId` lookup. No fuzzy name matching is performed.", "");
lines.push("| | count |", "|---|---|");
lines.push(`| Workbook rows | ${rows.length} |`);
lines.push(`| After dedupe | ${deduped.length} |`);
lines.push(`| Joined to universe | ${report.joined} |`);
lines.push(`| Sent to triage | ${triage.length} |`);
lines.push(`| Records written | ${records.size} |`);
lines.push("");
lines.push("## Stage distribution", "");
lines.push("| stage | count |", "|---|---|");
for (const [k, v] of Object.entries(report.byStage).sort((a, b) => b[1] - a[1])) {
  lines.push(`| ${k} | ${v} |`);
}
lines.push("");
lines.push("## Needs Contact resolution", "");
lines.push("The workbook label is stale on about half its rows, so it is applied conditionally:");
lines.push("a row keeps `needs-contact` only when it has no email with a deliverable status.", "");
lines.push(`- kept as \`needs-contact\`: **${report.needsContactKept}**`);
lines.push(`- cleared to Active Pursuit (has usable contact): **${report.needsContactCleared}**`);
lines.push("");
lines.push("## Triage queue", "");
lines.push("| class | count |", "|---|---|");
for (const [k, v] of Object.entries(report.triageByClass).sort((a, b) => b[1] - a[1])) {
  lines.push(`| ${k} | ${v} |`);
}
lines.push("");
for (const cls of Object.keys(report.triageByClass).sort()) {
  lines.push(`### ${cls}`, "");
  for (const t of triage.filter((x) => x.class === cls)) {
    lines.push(`- **${t.name}** (Reg ID ${t.regId || "—"}, ${t.fiType}) — ${t.reason}`);
  }
  lines.push("");
}
if (report.collapsed.length) {
  lines.push("## Collapsed duplicate stages", "");
  for (const c of report.collapsed) lines.push(`- ${c}`);
  lines.push("");
}
fs.writeFileSync(OUT_REPORT, lines.join("\n"));

console.log(`Joined:     ${report.joined}`);
console.log(`Triage:     ${triage.length}`, report.triageByClass);
console.log(`needs-contact: kept ${report.needsContactKept}, cleared ${report.needsContactCleared}`);
console.log(`Records:    ${records.size}`);
console.log(`Owners:     ${settings.owners.length}`);
console.log(`Wrote ${path.relative(ROOT, OUT_SEED)}, ${path.relative(ROOT, OUT_TRIAGE)}, ${path.relative(ROOT, OUT_REPORT)}`);
