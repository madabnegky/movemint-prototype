"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { usePipeline } from "../_lib/PipelineContext";
import { TRIAGE_ROWS } from "../_lib/triage";
import { TriageList } from "./TriageList";

/** Dashboard summary of the manual triage queue. The full workflow lives at
 *  /admin/pipeline/triage — this is the at-a-glance entry point. */
export function UnmatchedPanel() {
  const { state } = usePipeline();
  const [expanded, setExpanded] = useState(false);

  const pending = useMemo(() => {
    const resolved = new Set(state?.resolvedUnmatched ?? []);
    return TRIAGE_ROWS.filter((u) => !resolved.has(u.id));
  }, [state?.resolvedUnmatched]);

  if (!state || pending.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-400 shadow-sm">
      <div className="w-full flex items-center gap-2 px-5 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-left min-w-0"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-sm font-semibold text-slate-800">Needs manual triage</span>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 tabular-nums">
            {pending.length}
          </span>
        </button>
        <Link
          href="/admin/pipeline/triage"
          className="ml-auto shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          Open triage
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {expanded && (
        <div className="px-5 pb-4">
          <TriageList compact />
        </div>
      )}
    </div>
  );
}
