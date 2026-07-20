// Server-side persistence for the sales pipeline overlay.
//
// Production (Netlify): a Netlify Blob in store "sales-pipeline", key "state".
// Local dev (plain `next dev` with no Netlify context): a gitignored JSON file
// at the repo root, so the tool works offline without any setup.

import { promises as fs } from "node:fs";
import { join } from "node:path";
import seed from "@/data/pipeline-seed.json";
import type { PipelineState } from "@/app/admin/pipeline/_lib/types";

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
  return getStore(STORE_NAME);
}

export function seedState(): PipelineState {
  return structuredClone(SEED);
}

export async function readState(): Promise<PipelineState> {
  if (blobsAvailable()) {
    const store = await getBlobStore();
    const raw = await store.get(KEY, { type: "json" });
    if (raw) return raw as PipelineState;
    return seedState();
  }
  try {
    const raw = await fs.readFile(DEV_FILE, "utf8");
    return JSON.parse(raw) as PipelineState;
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
