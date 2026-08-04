import { NextRequest, NextResponse } from "next/server";
import { readState, seedState, writeState } from "./_lib/store";
import {
  isEmptyRecord,
  readState as readPipelineState,
  writeState as writePipelineState,
} from "@/app/api/pipeline/_lib/store";
import type { Partner, PartnerPatch, PartnerState } from "@/app/admin/partners/_lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readState();
  return NextResponse.json(state);
}

/** Full-state replace — used by the settings page for bulk edits. */
export async function PUT(req: NextRequest) {
  const body = (await req.json()) as PartnerState;
  if (!body || typeof body.partners !== "object" || typeof body.settings !== "object") {
    return NextResponse.json({ error: "malformed state" }, { status: 400 });
  }
  await writeState(body);
  return NextResponse.json({ ok: true, updatedAt: body.updatedAt });
}

/**
 * Mirror partner→FI attribution onto the sales pipeline's records, so an FI
 * drawer can show "sourced via <partner>" without joining across two documents
 * on every read.
 *
 * Both sides are stored, which means they can drift; this function is the single
 * writer that keeps them aligned. It only ever touches FIs whose membership in
 * this partner's list actually changed.
 */
async function syncFiAttribution(
  partnerId: string,
  before: string[] | undefined,
  after: string[] | undefined,
): Promise<void> {
  const prev = new Set(before ?? []);
  const next = new Set(after ?? []);
  const added = [...next].filter((id) => !prev.has(id));
  const removed = [...prev].filter((id) => !next.has(id));
  if (added.length === 0 && removed.length === 0) return;

  const pipeline = await readPipelineState();
  const now = new Date().toISOString();
  let touched = false;

  for (const fiId of added) {
    const existing = pipeline.records[fiId] ?? {
      fiId,
      stage: null,
      owner: null,
      updatedAt: now,
    };
    if (existing.partnerId === partnerId) continue;
    pipeline.records[fiId] = { ...existing, partnerId, updatedAt: now };
    touched = true;
  }

  for (const fiId of removed) {
    const existing = pipeline.records[fiId];
    // Only clear the pointer if it still points at THIS partner — an FI
    // reassigned to a different partner must not be blanked by the old one.
    if (!existing || existing.partnerId !== partnerId) continue;
    const { partnerId: dropped, ...rest } = existing;
    void dropped;
    // Linking an FI can create a record that holds nothing but the pointer;
    // unlinking must not leave that husk behind, or the overlay grows junk
    // records that every count and export then has to step around.
    if (isEmptyRecord(rest)) delete pipeline.records[fiId];
    else pipeline.records[fiId] = { ...rest, updatedAt: now };
    touched = true;
  }

  if (touched) await writePipelineState(pipeline);
}

/**
 * Single-intent updates. Read-merge-write on the server so two users editing
 * different partners at the same time don't clobber each other.
 */
export async function PATCH(req: NextRequest) {
  const patch = (await req.json()) as PartnerPatch;
  const state = await readState();
  const now = new Date().toISOString();

  /** Pending attribution syncs, applied after the partner write succeeds. */
  const syncs: Array<{ id: string; before?: string[]; after?: string[] }> = [];

  const applyPartner = (
    id: string,
    p: Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>,
  ) => {
    const existing = state.partners[id];
    if (!existing) return;
    const merged: Partner = { ...existing, ...p, id, updatedAt: now };
    if ("sourcedFiIds" in p) {
      syncs.push({ id, before: existing.sourcedFiIds, after: merged.sourcedFiIds });
    }
    state.partners[id] = merged;
  };

  switch (patch.type) {
    case "partner":
      applyPartner(patch.id, patch.patch);
      break;
    case "partners":
      for (const id of patch.ids) applyPartner(id, patch.patch);
      break;
    case "create": {
      const incoming = patch.partner;
      if (!incoming?.id || !incoming.name?.trim()) {
        return NextResponse.json({ error: "partner needs an id and name" }, { status: 400 });
      }
      // Resolve id collisions server-side — the client can't see other users'
      // additions, so two people adding "Acme" concurrently must not collide.
      let id = incoming.id;
      if (state.partners[id]) {
        let n = 2;
        while (state.partners[`${id}-${n}`]) n++;
        id = `${id}-${n}`;
      }
      state.partners[id] = { ...incoming, id, createdAt: now, updatedAt: now };
      if (incoming.sourcedFiIds?.length) {
        syncs.push({ id, before: [], after: incoming.sourcedFiIds });
      }
      await writeState(state);
      for (const s of syncs) await syncFiAttribution(s.id, s.before, s.after);
      return NextResponse.json({ ok: true, id, updatedAt: state.updatedAt });
    }
    case "delete": {
      const existing = state.partners[patch.id];
      if (existing?.sourcedFiIds?.length) {
        syncs.push({ id: patch.id, before: existing.sourcedFiIds, after: [] });
      }
      delete state.partners[patch.id];
      break;
    }
    case "settings":
      state.settings = { ...state.settings, ...patch.patch };
      break;
    case "reset": {
      const fresh = seedState();
      await writeState(fresh);
      return NextResponse.json(fresh);
    }
    default:
      return NextResponse.json({ error: "unknown patch type" }, { status: 400 });
  }

  await writeState(state);
  for (const s of syncs) await syncFiAttribution(s.id, s.before, s.after);
  return NextResponse.json({ ok: true, updatedAt: state.updatedAt });
}
