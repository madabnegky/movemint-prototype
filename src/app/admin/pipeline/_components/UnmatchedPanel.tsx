"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import unmatchedData from "@/data/pipeline-unmatched.json";
import { usePipeline } from "../_lib/PipelineContext";
import { STAGE_LABELS, fmtAssets } from "../_lib/stages";
import { UNIVERSE } from "../_lib/universe";
import type { FI, StageId, UnmatchedRow } from "../_lib/types";
import { TypeBadge } from "./controls";

const ALL_UNMATCHED = (unmatchedData as { rows: UnmatchedRow[] }).rows;

function LinkSearch({ onPick }: { onPick: (fi: FI) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    return UNIVERSE.filter(
      (fi) =>
        fi.name.toLowerCase().includes(query) || fi.city.toLowerCase().includes(query),
    )
      .sort((a, b) => b.assets - a.assets)
      .slice(0, 6);
  }, [q]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Find the right institution…"
        className="w-full text-sm rounded-lg border border-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />
      {results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-56 overflow-y-auto">
          {results.map((fi) => (
            <button
              key={fi.id}
              onClick={() => {
                onPick(fi);
                setQ("");
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

export function UnmatchedPanel() {
  const { state, resolveUnmatched } = usePipeline();
  const [expanded, setExpanded] = useState(false);

  const pending = useMemo(() => {
    const resolved = new Set(state?.resolvedUnmatched ?? []);
    return ALL_UNMATCHED.filter((u) => !resolved.has(u.id));
  }, [state?.resolvedUnmatched]);

  if (!state || pending.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-400 shadow-sm">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-5 py-3 text-left"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
        <span className="text-sm font-semibold text-slate-800">
          Unmatched from workbook
        </span>
        <span className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 tabular-nums">
          {pending.length}
        </span>
        <span className="text-xs text-slate-400 ml-auto hidden sm:block">
          Rows that couldn’t be auto-matched — link each to the right institution
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-2 max-h-120 overflow-y-auto">
          {pending.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-2 sm:gap-4 sm:items-center rounded-lg border border-slate-100 p-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800">{u.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="bg-slate-100 rounded px-1.5 py-0.5">{u.sheet}</span>
                  {u.intended.stage && (
                    <span>→ {STAGE_LABELS[u.intended.stage as StageId]}</span>
                  )}
                  {u.intended.leadSource && <span>· {u.intended.leadSource}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <LinkSearch
                    onPick={(fi) =>
                      resolveUnmatched(u.id, fi.id, {
                        stage: u.intended.stage ?? null,
                        owner: u.intended.owner ?? null,
                        leadSource: u.intended.leadSource,
                      })
                    }
                  />
                </div>
                <button
                  onClick={() => resolveUnmatched(u.id, null)}
                  title="Dismiss — this institution isn’t in the universe"
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
