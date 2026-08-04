// Server-side persistence for the partner pipeline.
//
// Production (Netlify): a Netlify Blob in store "partner-pipeline", key "state".
// Local dev (plain `next dev` with no Netlify context): a gitignored JSON file
// at the repo root, so the tool works offline without any setup.
//
// Deliberately a SEPARATE store from "sales-pipeline": partner edits must never
// participate in the FI overlay's read-modify-write, and either pipeline has to
// be resettable to seed without touching the other.

import { promises as fs } from "node:fs";
import { join } from "node:path";
import seed from "@/data/partner-seed.json";
import type { PartnerState } from "@/app/admin/partners/_lib/types";

const STORE_NAME = "partner-pipeline";
const KEY = "state";
const DEV_FILE = join(process.cwd(), ".partner-dev-store.json");

const SEED = seed as unknown as PartnerState;

function blobsAvailable(): boolean {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

async function getBlobStore() {
  const { getStore } = await import("@netlify/blobs");
  // Strong consistency: PATCH is a read-modify-write, and under the default
  // eventual consistency a read can return a value up to 60s stale — silently
  // dropping a concurrent edit (e.g. two people restaging partners at once).
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export function seedState(): PartnerState {
  return structuredClone(SEED);
}

/** Forward-compat shims for blobs written before a schema change. Nothing to
 *  migrate yet — the hook exists so the first schema change doesn't need to
 *  invent the pattern under pressure. */
function migrate(state: PartnerState): PartnerState {
  for (const p of Object.values(state.partners ?? {})) {
    // A record written before fiReach was structured could carry a bare string.
    const reach = p.fiReach as unknown;
    if (typeof reach === "string") {
      p.fiReach = { raw: reach, value: null, qualifier: "unknown" };
    }
    if (!Array.isArray(p.categories)) p.categories = [];
  }
  return state;
}

export async function readState(): Promise<PartnerState> {
  if (blobsAvailable()) {
    const store = await getBlobStore();
    const raw = await store.get(KEY, { type: "json" });
    if (raw) return migrate(raw as PartnerState);
    return seedState();
  }
  try {
    const raw = await fs.readFile(DEV_FILE, "utf8");
    return migrate(JSON.parse(raw) as PartnerState);
  } catch {
    return seedState();
  }
}

export async function writeState(state: PartnerState): Promise<void> {
  state.updatedAt = new Date().toISOString();
  if (blobsAvailable()) {
    const store = await getBlobStore();
    await store.setJSON(KEY, state);
    return;
  }
  await fs.writeFile(DEV_FILE, JSON.stringify(state, null, 2));
}
