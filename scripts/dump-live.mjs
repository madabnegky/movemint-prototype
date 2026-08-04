// Snapshot the live pipeline state to a timestamped backup file.
//
// The Netlify blob is the ONLY copy of the team's work — owner assignments,
// notes, stage moves, resolved triage rows. Nothing else backs it up. Run this
// before any operation that could write to live.
//
//   node scripts/dump-live.mjs                     # hits the deployed site
//   node scripts/dump-live.mjs --url http://localhost:3000
//   node scripts/dump-live.mjs --out some/path.json
//
// Requires ADMIN_PASSWORD when the target is password-gated (see src/proxy.ts).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BACKUP_DIR = path.join(ROOT, "backups");

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  // indexOf returns -1 when absent; guard explicitly so we never read args[0].
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const BASE = arg("--url", process.env.PIPELINE_URL ?? "http://localhost:3000");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const OUT = arg("--out", path.join(BACKUP_DIR, `live-${stamp}.json`));

const headers = {};
if (process.env.ADMIN_PASSWORD) {
  const token = Buffer.from(`movemint:${process.env.ADMIN_PASSWORD}`).toString("base64");
  headers.Authorization = `Basic ${token}`;
}

const url = `${BASE.replace(/\/$/, "")}/api/pipeline`;
console.log(`GET ${url}`);

const res = await fetch(url, { headers });
if (!res.ok) {
  console.error(`Failed: HTTP ${res.status} ${res.statusText}`);
  if (res.status === 401) console.error("Set ADMIN_PASSWORD to authenticate.");
  process.exit(1);
}

const state = await res.json();
const records = Object.keys(state.records ?? {}).length;
const staged = Object.values(state.records ?? {}).filter((r) => r.stage).length;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(state, null, 2));

console.log(`Wrote ${path.relative(ROOT, OUT)}`);
console.log(`  ${records} records (${staged} staged)`);
console.log(`  ${(state.resolvedUnmatched ?? []).length} resolved triage rows`);
console.log(`  last updated ${state.updatedAt ?? "unknown"}`);
