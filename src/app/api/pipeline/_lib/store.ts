// Server-side persistence for the sales pipeline overlay.
//
// Production (Netlify): a Netlify Blob in store "sales-pipeline", key "state".
// Local dev (plain `next dev` with no Netlify context): a gitignored JSON file
// at the repo root, so the tool works offline without any setup.

import { promises as fs } from "node:fs";
import { join } from "node:path";
import seed from "@/data/pipeline-seed.json";
import type { PipelineRecord, PipelineState } from "@/app/admin/pipeline/_lib/types";

const STORE_NAME = "sales-pipeline";
const KEY = "state";
const DEV_FILE = join(process.cwd(), ".pipeline-dev-store.json");

const SEED = seed as unknown as PipelineState;

function blobsAvailable(): boolean {
  // Set by the Netlify Next.js runtime in functions; absent in plain next dev.
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

async function getBlobStore() {
  const { getStore } = await import("@netlify/blobs");
  // Strong consistency is required: PATCH does a read-modify-write, and with
  // the default eventual consistency the read can return a value up to 60s
  // stale, silently clobbering a concurrent edit (e.g. resolving several
  // unmatched MQLs in a row would drop all but the last). Strong consistency
  // guarantees the read-before-write sees the latest committed state.
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export function seedState(): PipelineState {
  return structuredClone(SEED);
}

/**
 * True when a record carries no information worth persisting. The overlay is
 * keyed over ~8,500 FIs, so records that hold nothing are pruned to keep it
 * small. Shared with /api/partners, which can create bare records when linking
 * an FI to a partner and must prune them again on unlink.
 */
export function isEmptyRecord(
  rec: Omit<PipelineRecord, "fiId" | "updatedAt"> & Partial<Pick<PipelineRecord, "fiId">>,
): boolean {
  return (
    !rec.stage &&
    !rec.owner &&
    !rec.platformFit &&
    !rec.leadSource &&
    !rec.channel &&
    !rec.referralPartner &&
    !rec.partnerId &&
    !rec.coreSystem &&
    !rec.los &&
    !rec.homeBanking &&
    !(rec.contacts && rec.contacts.length) &&
    !rec.notes &&
    !rec.lastContact &&
    !rec.lastContactType &&
    rec.arr == null
  );
}

// Stages retired in the 2026-07 funnel redefinition, mapped onto their nearest
// surviving stage so historical blobs keep working. All of these were empty in
// production at the time of the change; the mapping is a safety net for any
// blob (or local dev store) written before the deploy.
const RETIRED_STAGES: Record<string, string> = {
  // "sql" predates the redefinition — it was folded into "qualified", which is
  // now labelled "Sales Qualified Lead". Same destination, different reason.
  sql: "qualified",
  // Warm Lead was replaced by SQL as the post-MQL stage.
  "warm-lead": "qualified",
  // Discovery Scheduled / Demo Completed collapsed into Discovery Complete.
  "discovery-scheduled": "discovery-complete",
  "demo-completed": "discovery-complete",
  // The three removal states collapsed into Closed Lost.
  disqualified: "closed-lost",
  "bad-contact-info": "closed-lost",
  "signed-with-competitor": "closed-lost",
};

/** Probabilities for stages that may be missing from an older blob. */
const DEFAULT_PROBS: Record<string, number> = {
  "needs-contact": 0,
  "contract-sent": 0.95,
};

// Forward-compat shims for blobs written before a schema change.
function migrate(state: PipelineState): PipelineState {
  for (const rec of Object.values(state.records)) {
    const mapped = RETIRED_STAGES[rec.stage as string];
    if (mapped) rec.stage = mapped as PipelineState["records"][string]["stage"];
  }
  const probs = state.settings?.stageProbabilities as Record<string, number> | undefined;
  if (probs) {
    for (const dead of Object.keys(RETIRED_STAGES)) delete probs[dead];
    for (const [id, p] of Object.entries(DEFAULT_PROBS)) {
      if (!(id in probs)) probs[id] = p;
    }
  }
  return state;
}

export async function readState(): Promise<PipelineState> {
  if (blobsAvailable()) {
    const store = await getBlobStore();
    const raw = await store.get(KEY, { type: "json" });
    if (raw) return migrate(raw as PipelineState);
    return seedState();
  }
  try {
    const raw = await fs.readFile(DEV_FILE, "utf8");
    return migrate(JSON.parse(raw) as PipelineState);
  } catch {
    return seedState();
  }
}

export async function writeState(state: PipelineState): Promise<void> {
  state.updatedAt = new Date().toISOString();
  if (blobsAvailable()) {
    const store = await getBlobStore();
    await store.setJSON(KEY, state);
    return;
  }
  await fs.writeFile(DEV_FILE, JSON.stringify(state, null, 2));
}
