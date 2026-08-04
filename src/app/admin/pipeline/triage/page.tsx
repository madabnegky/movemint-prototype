"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePipeline } from "../_lib/PipelineContext";
import { TriageList } from "../_components/TriageList";
import { TRIAGE_ROWS } from "../_lib/triage";

export default function TriagePage() {
  const { state, loading } = usePipeline();

  const resolved = new Set(state?.resolvedUnmatched ?? []);
  const pendingCount = TRIAGE_ROWS.filter((u) => !resolved.has(u.id)).length;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/pipeline"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <h2 className="text-xl font-semibold text-slate-900 mt-2">Manual triage</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Rows from the workbook that couldn’t be attached to an institution automatically. The
          importer only joins on an exact FDIC certificate or NCUA charter number — anything it
          can’t resolve lands here rather than being guessed at.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : pendingCount === 0 ? (
          <p className="text-sm text-slate-600">
            Triage queue is clear. {TRIAGE_ROWS.length} rows were resolved — expand below to undo any
            of them.
          </p>
        ) : null}
        {!loading && <TriageList />}
      </div>
    </div>
  );
}
