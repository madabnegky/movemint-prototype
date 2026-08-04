"use client";

import {
  OPEN_FUNNEL_STAGES,
  STAGE_LABELS,
  fmtAssets,
  isPrintCountOnly,
} from "../_lib/stages";
import { listMembers } from "../_lib/universe";
import type { PipelineState } from "../_lib/types";

/** Title block that appears only on the printed page. */
export function PrintHeader({ state }: { state: PipelineState }) {
  const now = new Date();
  return (
    <div data-print="only" className="mb-4 pb-3 border-b-2 border-slate-900">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-slate-900">Movemint — Sales Pipeline</h1>
        <span className="text-xs text-slate-500">
          {now.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mt-1">
        Universe from FDIC BankFind and NCUA Call Report data. Pipeline last updated{" "}
        {new Date(state.updatedAt).toLocaleDateString()}.
      </p>
    </div>
  );
}

/** Every institution in an open funnel stage, grouped by stage.
 *  Print-only — the screen already has the filterable stage list pages. */
export function OpenDealsTable({ state }: { state: PipelineState }) {
  const groups = OPEN_FUNNEL_STAGES.map((stage) => ({
    stage,
    // Count-only stages contribute their total but list no institutions.
    countOnly: isPrintCountOnly(stage),
    // Reverse funnel order so the closest-to-close deals lead the table.
    rows: listMembers(stage, state)
      .map((fi) => ({ fi, rec: state.records[fi.id] }))
      .sort((a, b) => b.fi.assets - a.fi.assets),
  }))
    .filter((g) => g.rows.length > 0)
    .reverse();

  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  if (total === 0) return null;

  return (
    <div data-print="only" data-print-break="true" className="mt-6">
      <div data-print="break-before" />
      <h2 className="text-base font-bold text-slate-900 mb-1">Open deals</h2>
      <p className="text-[11px] text-slate-500 mb-3">
        {total} institutions in an open funnel stage, furthest along first.
      </p>

      {groups.map(({ stage, rows, countOnly }) => (
        <div key={stage} data-print="block" className="mb-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            {STAGE_LABELS[stage]} · {rows.length}
          </h3>
          {countOnly ? (
            <p className="text-[11px] italic text-slate-400">
              Institution detail omitted from this report.
            </p>
          ) : (
            <table>
              <thead>
                <tr className="border-b border-slate-300 text-left">
                  <th className="py-1 pr-2 font-semibold">Institution</th>
                  <th className="py-1 pr-2 font-semibold">Type</th>
                  <th className="py-1 pr-2 font-semibold">Location</th>
                  <th className="py-1 pr-2 font-semibold text-right">Assets</th>
                  <th className="py-1 pr-2 font-semibold">Owner</th>
                  <th className="py-1 font-semibold">Primary contact</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ fi, rec }) => (
                  <tr key={fi.id} className="border-b border-slate-100">
                    <td className="py-1 pr-2">{fi.name}</td>
                    <td className="py-1 pr-2 uppercase text-slate-500">{fi.type}</td>
                    <td className="py-1 pr-2 text-slate-600">
                      {fi.city}, {fi.state}
                    </td>
                    <td className="py-1 pr-2 text-right tabular-nums">{fmtAssets(fi.assets)}</td>
                    <td className="py-1 pr-2 text-slate-600">{rec?.owner ?? "—"}</td>
                    <td className="py-1 text-slate-600">{rec?.contacts?.[0]?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      <ClosedThisYear state={state} />
    </div>
  );
}

/** Closed-won and closed-lost for the current year, for the record. */
function ClosedThisYear({ state }: { state: PipelineState }) {
  const closed = (["closed-won", "closed-lost"] as const)
    .map((stage) => ({
      stage,
      rows: listMembers(stage, state, true)
        .map((fi) => ({ fi, rec: state.records[fi.id] }))
        .sort((a, b) => b.fi.assets - a.fi.assets),
    }))
    .filter((g) => g.rows.length > 0);

  if (closed.length === 0) return null;

  return (
    <div data-print="block" className="mt-4">
      {closed.map(({ stage, rows }) => (
        <div key={stage} className="mb-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
            {STAGE_LABELS[stage]} · {rows.length}
          </h3>
          <table>
            <tbody>
              {rows.map(({ fi, rec }) => (
                <tr key={fi.id} className="border-b border-slate-100">
                  <td className="py-1 pr-2">{fi.name}</td>
                  <td className="py-1 pr-2 text-slate-600">
                    {fi.city}, {fi.state}
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums">{fmtAssets(fi.assets)}</td>
                  <td className="py-1 text-slate-600">{rec?.owner ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
