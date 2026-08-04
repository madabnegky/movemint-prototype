"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Undo2, X } from "lucide-react";
import { usePipeline } from "../_lib/PipelineContext";
import { STAGE_LABELS, fmtAssets } from "../_lib/stages";
import { searchInstitutions } from "../_lib/universe";
import { TRIAGE_CLASSES, TRIAGE_ROWS, classLabel } from "../_lib/triage";
import type { FI, StageId, TriageClass, UnmatchedRow } from "../_lib/types";
import { TypeBadge } from "./controls";

// Name-similarity guard for the confirm step.
const STOP = new Set(
  "federal credit union fcu cu bank the of and a inc co employees national association savings trust".split(
    " ",
  ),
);
function nameTokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w && !STOP.has(w)),
  );
}
/** True when two names share no significant word — a likely wrong match. */
function looksMismatched(rowName: string, fiName: string): boolean {
  const a = nameTokens(rowName);
  const b = nameTokens(fiName);
  if (a.size === 0 || b.size === 0) return true;
  return [...a].filter((t) => b.has(t)).length === 0;
}

function LinkSearch({ initialQuery, onPick }: { initialQuery: string; onPick: (fi: FI) => void }) {
  // Pre-filled with the workbook name so the user isn't retyping it.
  const [q, setQ] = useState(initialQuery);
  // Results stay closed until the field is focused — otherwise every row on the
  // page would render its own dropdown at once and they'd overlap each other.
  const [open, setOpen] = useState(false);
  const results = useMemo(() => (open ? searchInstitutions(q, 10) : []), [q, open]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Delay so a result click lands before the list unmounts.
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Find the right institution…"
        className="w-full text-sm rounded-lg border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-56 overflow-y-auto">
          {results.map((fi) => (
            <button
              key={fi.id}
              // onMouseDown fires before the input's blur, so the pick registers.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(fi);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <TypeBadge type={fi.type} />
                <span className="text-sm font-medium text-slate-800 truncate">{fi.name}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {fi.city}, {fi.state} · {fmtAssets(fi.assets)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmMatch({
  rowName,
  fi,
  onConfirm,
  onCancel,
}: {
  rowName: string;
  fi: FI;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const mismatch = looksMismatched(rowName, fi.name);
  return (
    <div
      className={
        "rounded-lg border p-3 space-y-2 " +
        (mismatch ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50")
      }
    >
      <div className="text-xs text-slate-600">
        Link <b className="text-slate-800">{rowName}</b> to:
      </div>
      <div className="flex items-center gap-2">
        <TypeBadge type={fi.type} />
        <span className="text-sm font-semibold text-slate-800 truncate">{fi.name}</span>
        <span className="text-xs text-slate-500">
          {fi.city}, {fi.state}
        </span>
      </div>
      {mismatch && (
        <div className="flex items-start gap-1.5 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>
            These names don’t obviously match. Double-check this is the same institution before
            confirming.
          </span>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onConfirm}
          className={
            "text-xs font-semibold rounded-lg px-3 py-1.5 text-white " +
            (mismatch ? "bg-red-600 hover:bg-red-500" : "bg-slate-900 hover:bg-slate-700")
          }
        >
          {mismatch ? "Link anyway" : "Confirm match"}
        </button>
        <button
          onClick={onCancel}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Owner-conflict rows are resolved by choosing an owner, not by linking an FI —
 *  the institution was already imported, only the assignment is undecided. */
function OwnerPicker({ reason, onPick }: { reason: string; onPick: (owner: string) => void }) {
  // reason reads: 'Duplicate rows assign different owners: A vs B'
  const owners = reason.split(":").slice(1).join(":").split(" vs ").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
      <div className="text-xs text-slate-600">Who owns this account?</div>
      <div className="flex flex-wrap gap-2">
        {owners.map((o) => (
          <button
            key={o}
            onClick={() => onPick(o)}
            className="text-xs font-semibold rounded-lg px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TriageList({ compact = false }: { compact?: boolean }) {
  const { state, resolveUnmatched, unresolveUnmatched } = usePipeline();
  const [pendingPick, setPendingPick] = useState<Record<string, FI>>({});
  const [filter, setFilter] = useState<TriageClass | "all">("all");
  const [query, setQuery] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const resolvedIds = useMemo(
    () => new Set(state?.resolvedUnmatched ?? []),
    [state?.resolvedUnmatched],
  );

  const pending = useMemo(
    () => TRIAGE_ROWS.filter((u) => !resolvedIds.has(u.id)),
    [resolvedIds],
  );
  const resolved = useMemo(
    () => TRIAGE_ROWS.filter((u) => resolvedIds.has(u.id)),
    [resolvedIds],
  );

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of pending) m.set(u.class ?? "unmatched", (m.get(u.class ?? "unmatched") ?? 0) + 1);
    return m;
  }, [pending]);

  const visible = useMemo(() => {
    let rows = filter === "all" ? pending : pending.filter((u) => u.class === filter);
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((u) => u.name.toLowerCase().includes(q) || (u.regId ?? "").includes(q));
    return rows;
  }, [pending, filter, query]);

  if (!state) return null;

  const clearPick = (id: string) =>
    setPendingPick((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });

  const rowCard = (u: UnmatchedRow) => {
    const candidate = pendingPick[u.id];
    const isOwnerConflict = u.class === "owner-conflict";
    return (
      <div
        key={u.id}
        className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-2 sm:gap-4 sm:items-start rounded-lg border border-slate-100 p-3"
      >
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-800">{u.name}</div>
          <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
            <span className="bg-slate-100 rounded px-1.5 py-0.5">{classLabel(u.class)}</span>
            {u.regId && <span className="tabular-nums">Reg ID {u.regId}</span>}
            {u.fiType && <span>· {u.fiType}</span>}
            {typeof u.assets === "number" && u.assets > 0 && <span>· {fmtAssets(u.assets)}</span>}
            {u.intended.stage && <span>→ {STAGE_LABELS[u.intended.stage as StageId]}</span>}
            {u.intended.owner && <span>· {u.intended.owner}</span>}
          </div>
          {/* The importer's explanation — why this row needs a human. */}
          <div className="text-xs text-slate-400 mt-1">{u.reason}</div>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {isOwnerConflict ? (
              <OwnerPicker
                reason={u.reason}
                onPick={(owner) => {
                  const fiId = u.regId
                    ? `${u.fiType?.toLowerCase().startsWith("credit") ? "cu" : "bank"}-${u.regId}`
                    : null;
                  resolveUnmatched(u.id, fiId, { owner });
                }}
              />
            ) : candidate ? (
              <ConfirmMatch
                rowName={u.name}
                fi={candidate}
                onConfirm={() => {
                  resolveUnmatched(u.id, candidate.id, {
                    stage: u.intended.stage ?? null,
                    owner: u.intended.owner ?? null,
                    platformFit: true,
                    leadSource: u.intended.leadSource,
                  });
                  clearPick(u.id);
                }}
                onCancel={() => clearPick(u.id)}
              />
            ) : (
              <LinkSearch
                initialQuery={u.name}
                onPick={(fi) => setPendingPick((p) => ({ ...p, [u.id]: fi }))}
              />
            )}
          </div>
          {!candidate && (
            <button
              onClick={() => resolveUnmatched(u.id, null)}
              title="Dismiss — this institution isn’t in the universe"
              className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={
            "text-xs font-semibold rounded-full px-3 py-1 border " +
            (filter === "all"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")
          }
        >
          All {pending.length}
        </button>
        {TRIAGE_CLASSES.filter((c) => counts.get(c.id)).map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            title={c.hint}
            className={
              "text-xs font-semibold rounded-full px-3 py-1 border " +
              (filter === c.id
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400")
            }
          >
            {c.label} {counts.get(c.id)}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or Reg ID…"
          className="ml-auto text-sm rounded-lg border border-slate-200 px-3 py-1.5 w-56 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {filter !== "all" && (
        <p className="text-xs text-slate-500">
          {TRIAGE_CLASSES.find((c) => c.id === filter)?.hint}
        </p>
      )}

      <div className={compact ? "space-y-2 max-h-120 overflow-y-auto" : "space-y-2"}>
        {visible.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            Nothing left to triage here.
          </p>
        ) : (
          visible.map(rowCard)
        )}
      </div>

      {resolved.length > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <button
            onClick={() => setShowResolved((v) => !v)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            {showResolved ? "Hide" : "Show"} {resolved.length} resolved
          </button>
          {showResolved && (
            <div className="mt-2 space-y-1 max-h-80 overflow-y-auto">
              {resolved.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 text-xs text-slate-500 rounded-lg border border-slate-100 px-3 py-2"
                >
                  <span className="font-medium text-slate-700 truncate">{u.name}</span>
                  <span className="bg-slate-100 rounded px-1.5 py-0.5">{classLabel(u.class)}</span>
                  <button
                    onClick={() => unresolveUnmatched(u.id)}
                    title="Return to the triage queue"
                    className="ml-auto shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Undo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
