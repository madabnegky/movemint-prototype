#!/usr/bin/env node
// Reassign owners in the LIVE pipeline blob — without touching anything else.
//
// Reads the live state, works out which records violate the ownership rules,
// and PATCHes only the `owner` field on those records. The seed is never read:
// live is the source of truth here, so stage moves, notes, ARR, contacts and
// triage resolutions the team has made all survive untouched.
//
// One rule: if a record is owned by anyone outside the four active sellers,
// it moves to Amaha. If one of the four already owns it, leave it alone —
// including bank records, which the four legitimately work. Records with no
// owner are left alone too: "unassigned" is a real state, not a misassignment.
//
// Exception: closed-won deals keep their original owner so historical win
// credit stays accurate.
//
// Dry-run by default. Nothing is written until you pass --apply.
//
//   ADMIN_PASSWORD=... node scripts/fix-live-owners.mjs --url https://movemint-prototype.netlify.app
//   ADMIN_PASSWORD=... node scripts/fix-live-owners.mjs --url https://... --apply
//
// A timestamped backup of the live state is written to backups/ before any
// write. The blob is the only copy of the team's work — see dump-live.mjs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BACKUP_DIR = path.join(ROOT, "backups");

const OWNER = "Amaha Selassie";
const SELLERS = new Set(["Robbie Sink", "Elise Cushing", "Avery Flynn", OWNER]);

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}
const APPLY = args.includes("--apply");
const BASE = arg("--url", process.env.PIPELINE_URL ?? "http://localhost:3000");
const url = `${BASE.replace(/\/$/, "")}/api/pipeline`;

const headers = { "Content-Type": "application/json" };
if (process.env.ADMIN_PASSWORD) {
  const token = Buffer.from(`movemint:${process.env.ADMIN_PASSWORD}`).toString("base64");
  headers.Authorization = `Basic ${token}`;
}

// ---- Read live ----
console.log(`GET ${url}`);
const res = await fetch(url, { headers });
if (!res.ok) {
  console.error(`Failed: HTTP ${res.status} ${res.statusText}`);
  if (res.status === 401) console.error("Set ADMIN_PASSWORD to authenticate.");
  process.exit(1);
}
const state = await res.json();
const records = state.records ?? {};
console.log(`  ${Object.keys(records).length} records, last updated ${state.updatedAt ?? "unknown"}`);

// ---- Always snapshot before doing anything ----
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(BACKUP_DIR, `live-${stamp}-pre-owner-fix.json`);
fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.writeFileSync(backup, JSON.stringify(state, null, 2));
console.log(`  backup → ${path.relative(ROOT, backup)}\n`);

// ---- Assess ----
const toFix = [];
const skippedClosedWon = [];
const unassigned = [];

for (const [fiId, rec] of Object.entries(records)) {
  const owner = rec.owner ?? null;

  if (owner === null) {
    // No owner to correct — leave unassigned records unassigned.
    unassigned.push(fiId);
    continue;
  }
  // One of the four active sellers already owns it: leave it alone, whether
  // it's a bank or a credit union.
  if (SELLERS.has(owner)) continue;

  if (rec.stage === "closed-won") {
    skippedClosedWon.push({ fiId, owner, stage: rec.stage });
    continue;
  }
  toFix.push({ fiId, from: owner, stage: rec.stage ?? null });
}

// ---- Report ----
const byOwner = {};
for (const r of toFix) byOwner[r.from] = (byOwner[r.from] ?? 0) + 1;
const staged = toFix.filter((r) => r.stage);

console.log("=== ASSESSMENT (live blob) ===");
console.log(`Records to reassign to ${OWNER}: ${toFix.length}`);
console.log(
  `  ${toFix.filter((r) => r.fiId.startsWith("bank-")).length} bank / ` +
    `${toFix.filter((r) => !r.fiId.startsWith("bank-")).length} credit union`,
);
console.log(`  ${staged.length} of these carry an active stage:`);
for (const [s, n] of Object.entries(
  staged.reduce((a, r) => ({ ...a, [r.stage]: (a[r.stage] ?? 0) + 1 }), {}),
)) {
  console.log(`      ${s}: ${n}`);
}
console.log("\nCurrent owners losing records:");
for (const [o, n] of Object.entries(byOwner).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${o}`);
}
console.log(`\nLeft alone:`);
console.log(`  ${skippedClosedWon.length} closed-won deals (win credit preserved)`);
for (const r of skippedClosedWon) console.log(`      ${r.fiId} — ${r.owner}`);
console.log(`  ${unassigned.length} records with no owner`);

if (!toFix.length) {
  console.log("\nNothing to do.");
  process.exit(0);
}

if (!APPLY) {
  console.log("\nDRY RUN — nothing written. Re-run with --apply to make these changes.");
  process.exit(0);
}

// ---- Apply ----
// One bulk PATCH: the server does read-merge-write per record, spreading our
// { owner } onto the existing record, so every other field is preserved.
console.log(`\nPATCHing ${toFix.length} records…`);
const patchRes = await fetch(url, {
  method: "PATCH",
  headers,
  body: JSON.stringify({
    type: "records",
    fiIds: toFix.map((r) => r.fiId),
    patch: { owner: OWNER },
  }),
});
if (!patchRes.ok) {
  console.error(`PATCH failed: HTTP ${patchRes.status} ${patchRes.statusText}`);
  console.error(`Live state is unchanged. Backup at ${path.relative(ROOT, backup)}`);
  process.exit(1);
}

// ---- Verify by re-reading ----
const after = await (await fetch(url, { headers })).json();
const stillWrong = Object.entries(after.records ?? {}).filter(([, rec]) => {
  const o = rec.owner ?? null;
  if (o === null || SELLERS.has(o)) return false;
  if (rec.stage === "closed-won") return false;
  return true;
});
console.log(`\n=== VERIFIED (re-read from live) ===`);
console.log(`Records still violating the rules: ${stillWrong.length} (expected 0)`);
const ownerCounts = {};
for (const rec of Object.values(after.records ?? {})) {
  const o = rec.owner ?? "(unassigned)";
  ownerCounts[o] = (ownerCounts[o] ?? 0) + 1;
}
console.log("Live owner distribution now:");
for (const [o, n] of Object.entries(ownerCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${o}`);
}
console.log(`\nDone. Backup of the prior state: ${path.relative(ROOT, backup)}`);
