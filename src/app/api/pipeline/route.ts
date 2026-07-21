import { NextRequest, NextResponse } from "next/server";
import { readState, seedState, writeState } from "./_lib/store";
import type {
  PipelinePatch,
  PipelineRecord,
  PipelineState,
} from "@/app/admin/pipeline/_lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readState();
  return NextResponse.json(state);
}

/** Full-state replace — used sparingly (settings page bulk edits). */
export async function PUT(req: NextRequest) {
  const body = (await req.json()) as PipelineState;
  if (!body || typeof body.records !== "object" || typeof body.settings !== "object") {
    return NextResponse.json({ error: "malformed state" }, { status: 400 });
  }
  await writeState(body);
  return NextResponse.json({ ok: true, updatedAt: body.updatedAt });
}

/**
 * Single-intent updates. Read-merge-write on the server so two users editing
 * different FIs at the same time don't clobber each other's changes.
 */
export async function PATCH(req: NextRequest) {
  const patch = (await req.json()) as PipelinePatch;
  const state = await readState();
  const now = new Date().toISOString();

  const applyRecord = (fiId: string, p: Partial<PipelineRecord>) => {
    const existing = state.records[fiId] ?? { fiId, stage: null, owner: null, updatedAt: now };
    const merged: PipelineRecord = { ...existing, ...p, fiId, updatedAt: now };
    // Drop records that carry no information so the overlay stays small.
    const isEmpty =
      !merged.stage &&
      !merged.owner &&
      !merged.platformFit &&
      !merged.leadSource &&
      !merged.notes &&
      merged.arr == null;
    if (isEmpty) delete state.records[fiId];
    else state.records[fiId] = merged;
  };

  switch (patch.type) {
    case "record":
      applyRecord(patch.fiId, patch.patch);
      break;
    case "records":
      for (const fiId of patch.fiIds) applyRecord(fiId, patch.patch);
      break;
    case "settings":
      state.settings = { ...state.settings, ...patch.patch };
      break;
    case "resolveUnmatched": {
      if (patch.fiId && patch.patch) applyRecord(patch.fiId, patch.patch);
      const resolved = new Set(state.resolvedUnmatched ?? []);
      resolved.add(patch.unmatchedId);
      state.resolvedUnmatched = [...resolved];
      break;
    }
    case "reset": {
      const fresh = seedState();
      await writeState(fresh);
      return NextResponse.json(fresh);
    }
    default:
      return NextResponse.json({ error: "unknown patch type" }, { status: 400 });
  }

  await writeState(state);
  return NextResponse.json({ ok: true, updatedAt: state.updatedAt });
}
