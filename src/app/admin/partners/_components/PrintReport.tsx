"use client";

import { PARTNER_STAGE_LABELS, fmtCount, fmtReach } from "../_lib/stages";
import { listPartners } from "../_lib/partners";
import type { PartnerStageId, PartnerState } from "../_lib/types";

/** Title block that appears only on the printed page. */
export function PrintHeader({ state }: { state: PartnerState }) {
  const now = new Date();
  const count = Object.keys(state.partners).length;
  return (
    <div data-print="only" className="mb-4 pb-3 border-b-2 border-slate-900">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-slate-900">Movemint — Partner Pipeline</h1>
        <span className="text-xs text-slate-500">
          {now.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 mt-1">
        {count} channel partners. FI client counts are each partner&apos;s own client base — the
        reach a partnership opens, not Movemint prospects. Last updated{" "}
        {new Date(state.updatedAt).toLocaleDateString()}.
      </p>
    </div>
  );
}

/**
 * Report reading order: furthest-along first, so a reader sees what's closed
 * before what's speculative. Dormant and Not a Fit trail the live stages —
 * they're on the report for completeness, not as pipeline.
 */
const REPORT_ORDER: PartnerStageId[] = [
  "signed",
  "active",
  "contacted",
  "not-contacted",
  "dormant",
  "not-a-fit",
];

/**
 * Every partner grouped by stage, in report order. Print-only — on screen the
 * stage list pages already do this with filtering and sorting.
 */
export function PartnerRoster({ state }: { state: PartnerState }) {
  const groups = REPORT_ORDER.map((stage) => ({
    stage,
    rows: listPartners(stage, state),
  })).filter((g) => g.rows.length > 0);

  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  if (total === 0) return null;

  return (
    <div data-print="only" className="mt-6">
      <div data-print="break-before" />
      <h2 className="text-base font-bold text-slate-900 mb-1">Partner roster</h2>
      <p className="text-[11px] text-slate-500 mb-3">
        All {total} partners by stage, furthest along first. Within each stage, largest FI client
        base first.
      </p>

      {groups.map(({ stage, rows }) => {
        const reach = rows.reduce((n, p) => n + (p.fiReach.value ?? 0), 0);
        const unquantified = rows.filter((p) => p.fiReach.value == null).length;
        const referrals = rows.reduce((n, p) => n + (p.referralsProvided ?? 0), 0);
        return (
          <div key={stage} data-print="block" className="mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              {PARTNER_STAGE_LABELS[stage]} · {rows.length}
              <span className="font-medium normal-case tracking-normal text-slate-400">
                {reach > 0 && (
                  <>
                    {" "}
                    — {fmtCount(reach)} est. FI reach
                    {unquantified > 0 && ` (${unquantified} unquantified)`}
                  </>
                )}
                {referrals > 0 && ` · ${fmtCount(referrals)} referrals provided`}
              </span>
            </h3>
            <table>
              <thead>
                <tr className="border-b border-slate-300 text-left">
                  <th className="py-1 pr-2 font-semibold">Partner</th>
                  <th className="py-1 pr-2 font-semibold">Type</th>
                  <th className="py-1 pr-2 font-semibold text-right">FI clients</th>
                  <th className="py-1 pr-2 font-semibold text-right">Referrals</th>
                  <th className="py-1 pr-2 font-semibold">Focus</th>
                  <th className="py-1 pr-2 font-semibold">Owner</th>
                  <th className="py-1 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 align-top">
                    <td className="py-1 pr-2 font-medium">{p.name}</td>
                    <td className="py-1 pr-2 text-slate-600">{p.companyType || "—"}</td>
                    <td className="py-1 pr-2 text-right tabular-nums whitespace-nowrap">
                      {fmtReach(p.fiReach)}
                    </td>
                    <td className="py-1 pr-2 text-right tabular-nums">
                      {p.referralsProvided ?? 0}
                    </td>
                    <td className="py-1 pr-2 text-slate-600">{p.primaryFocus ?? "—"}</td>
                    <td className="py-1 pr-2 text-slate-600 whitespace-nowrap">
                      {p.owner ?? "—"}
                    </td>
                    <td className="py-1 text-slate-600">{p.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
