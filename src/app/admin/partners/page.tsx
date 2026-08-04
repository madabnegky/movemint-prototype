"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePartners } from "./_lib/PartnerContext";
import {
  PARTNER_BRANCH_STAGES,
  PARTNER_CATEGORY_LABELS,
  PARTNER_STAGE_LABELS,
  fmtCount,
} from "./_lib/stages";
import {
  categoryBreakdown,
  computePartnerMetrics,
  funnelRows,
  listPartners,
  reachConcentration,
  reachTotal,
} from "./_lib/partners";
import { exportAllPartners } from "./_lib/exportCsv";
import type { PartnerListId, PartnerState } from "./_lib/types";
import { AddPartnerModal } from "./_components/AddPartnerModal";
import { PartnerStageInfo, StageChip } from "./_components/controls";

function Kpi({
  label,
  value,
  sub,
  accent,
  href,
  info,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  href?: string;
  info?: PartnerListId;
}) {
  const card = (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full transition-colors hover:border-slate-300">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {info && <PartnerStageInfo id={info} />}
      </div>
      <div className={cn("text-2xl font-bold text-slate-900", accent)}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

function SignedGoal({ state }: { state: PartnerState }) {
  const m = computePartnerMetrics(state);
  const goal = Math.max(state.settings.signedGoal ?? 12, 1);
  const pct = Math.min((m.signed / goal) * 100, 100);
  const projected = Math.min(m.signed + m.inDiscussion, goal);
  const projPct = Math.min(((projected - m.signed) / goal) * 100, 100 - pct);
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6" data-print="block">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Signed Partners — Pace to Target
          </span>
          <div className="text-3xl font-bold text-emerald-600 mt-1">
            {m.signed}
            <span className="text-lg font-medium text-slate-400"> / {goal} signed</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900">{Math.round(pct)}%</div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            to target
          </div>
        </div>
      </div>
      <div className="h-8 rounded-lg bg-slate-100 overflow-hidden flex ring-1 ring-inset ring-slate-200">
        {pct > 0 && (
          <div
            className="bg-emerald-500 h-full flex items-center justify-center text-xs font-bold text-white min-w-[24px]"
            style={{ width: `${pct}%` }}
          >
            {m.signed}
          </div>
        )}
        {projPct > 0 && (
          <div
            className="h-full flex items-center justify-center text-xs font-semibold text-emerald-700 bg-[repeating-linear-gradient(45deg,rgba(16,185,129,.15),rgba(16,185,129,.15)_6px,rgba(16,185,129,.3)_6px,rgba(16,185,129,.3)_12px)]"
            style={{ width: `${projPct}%` }}
          >
            +{projected - m.signed} in discussion
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-5 text-xs text-slate-500 mt-3">
        <span>
          <b className="text-emerald-600">{m.signed} signed</b> reaching{" "}
          {fmtCount(m.signedReach.known)} FIs
        </span>
        <span>
          <b className="text-slate-700">{m.inDiscussion}</b> in active conversation
        </span>
        <span>
          <b className="text-slate-700">{m.withTerms}</b> with agreed terms · {m.resellers} reseller
          {m.resellers === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

function Funnel({ state }: { state: PartnerState }) {
  const rows = funnelRows(state);
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Partnership Funnel
        </span>
        <button
          onClick={() => exportAllPartners(state)}
          title="Download every partner as CSV"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
          data-print="hide"
        >
          <Download className="w-3.5 h-3.5" /> Export all
        </button>
      </div>
      <div className="space-y-1.5">
        {rows.map(({ id, count, reach }) => {
          // Linear scale: 33 partners with no order-of-magnitude outlier, so the
          // sales pipeline's sqrt compression would only flatten real difference.
          const width = count > 0 ? Math.max((count / max) * 100, 6) : 2;
          return (
            <Link
              key={id}
              href={`/admin/partners/stage/${id}`}
              className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 rounded-lg px-2 py-1.5 sm:py-1 -mx-2 hover:bg-slate-50 transition-colors group"
            >
              <div className="w-full sm:w-44 shrink-0 flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                <span className="truncate group-hover:text-slate-900">
                  {PARTNER_STAGE_LABELS[id]}
                </span>
                <PartnerStageInfo id={id} />
              </div>
              <div className="flex items-center gap-3 w-full min-w-0">
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "h-7 rounded-md overflow-hidden flex items-center justify-center ring-1 ring-inset ring-slate-200",
                      id === "signed" ? "bg-emerald-500" : "bg-slate-300",
                      count === 0 && "bg-slate-50",
                    )}
                    style={{ width: `${width}%`, minWidth: 28 }}
                  >
                    <span
                      className={cn(
                        "text-[11px] font-bold",
                        count === 0 ? "text-slate-400" : "text-white",
                      )}
                    >
                      {count}
                    </span>
                  </div>
                </div>
                <div className="w-28 shrink-0 text-right text-[13px] font-bold tabular-nums text-slate-600">
                  {reach.known > 0 ? `${fmtCount(reach.known)} FIs` : "—"}
                </div>
              </div>
              <div className="hidden lg:block w-28 shrink-0 text-xs text-slate-400 tabular-nums truncate">
                {reach.unquantified > 0 ? `${reach.unquantified} unquantified` : ""}
              </div>
            </Link>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
        FI counts are each partner&apos;s <b>total client base</b> — the theoretical reach a
        partnership opens, not Movemint prospects. Partners whose count is unquantified
        (&ldquo;Hundreds&rdquo;, &ldquo;N/A&rdquo;) contribute nothing to these totals.
      </p>
    </div>
  );
}

function BranchPanel({ state }: { state: PartnerState }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-400 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
        Off-Funnel
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed mb-4">
        Conversations that stalled or were set aside. Dormant partners re-enter the funnel on a new
        signal.
      </p>
      <div className="space-y-3">
        {PARTNER_BRANCH_STAGES.map((id) => {
          const count = listPartners(id, state).length;
          const reach = reachTotal(id, state);
          return (
            <Link
              key={id}
              href={`/admin/partners/stage/${id}`}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                  {PARTNER_STAGE_LABELS[id]}
                  <PartnerStageInfo id={id} />
                </div>
                {reach.known > 0 && (
                  <div className="text-[11px] text-slate-400">
                    {fmtCount(reach.known)} FIs out of reach
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "text-xl font-bold tabular-nums",
                  id === "dormant" ? "text-amber-500" : "text-slate-400",
                )}
              >
                {count}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ConcentrationPanel({ state }: { state: PartnerState }) {
  const { top, topShare, totalKnown } = reachConcentration(state, 3);
  if (top.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-violet-400 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-1">
        Reach Concentration
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed mb-4">
        The top {top.length} partners account for{" "}
        <b className="text-slate-700">{Math.round(topShare * 100)}%</b> of all quantified reach
        ({fmtCount(totalKnown)} FIs). Channel breadth depends on a few relationships.
      </p>
      <div className="space-y-2">
        {top.map((p) => (
          <Link
            key={p.id}
            href={`/admin/partners/stage/${p.stage}`}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 transition-colors"
          >
            <span className="min-w-0 flex items-center gap-2">
              <span className="text-[13px] font-semibold text-slate-700 truncate">{p.name}</span>
              <StageChip stage={p.stage} />
            </span>
            <span className="text-sm font-bold tabular-nums text-slate-600 shrink-0">
              {fmtCount(p.fiReach.value ?? 0)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CategoryPanel({ state }: { state: PartnerState }) {
  const rows = categoryBreakdown(state);
  if (!rows.length) return null;
  const maxReach = Math.max(...rows.map((r) => r.reach), 1);
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Channel Mix by Partner Type
      </span>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.category} className="flex items-center gap-3">
            <span className="w-40 shrink-0 text-[13px] font-semibold text-slate-700 truncate">
              {PARTNER_CATEGORY_LABELS[r.category]}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="h-6 rounded-md bg-violet-400 flex items-center px-2 ring-1 ring-inset ring-slate-200"
                style={{ width: `${Math.max((r.reach / maxReach) * 100, 6)}%`, minWidth: 32 }}
              >
                <span className="text-[10px] font-bold text-white tabular-nums truncate">
                  {fmtCount(r.reach)}
                </span>
              </div>
            </div>
            <span className="w-28 shrink-0 text-right text-xs text-slate-400 tabular-nums">
              {r.count} partner{r.count === 1 ? "" : "s"}
              {r.signed > 0 && ` · ${r.signed} signed`}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
        Bars show est. FI reach. Partners with two types (e.g. &ldquo;CUSO / Fintech&rdquo;) count in
        both rows, so counts total above {Object.keys(state.partners).length}.
      </p>
    </div>
  );
}

export default function PartnerDashboard() {
  const { state, loading } = usePartners();
  const [adding, setAdding] = useState(false);

  if (loading || !state) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const m = computePartnerMetrics(state);

  return (
    <div className="space-y-6" data-print="page">
      <div className="flex items-center justify-between gap-3" data-print="hide">
        <p className="text-sm text-slate-500">
          Channel partners — CUSOs, fintechs, core processors and consultancies whose FI
          relationships Movemint can sell through.
        </p>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Add partner
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <Kpi
          label="All Partners"
          info="all"
          value={String(m.total)}
          sub={`${m.notContacted} not yet contacted`}
          href="/admin/partners/stage/all"
        />
        <Kpi
          label="Signed"
          info="signed"
          value={String(m.signed)}
          sub={`${m.withTerms} with agreed terms`}
          accent="text-emerald-600"
          href="/admin/partners/stage/signed"
        />
        <Kpi
          label="In Discussion"
          info="active"
          value={String(m.inDiscussion)}
          sub="contacted + active"
          accent="text-violet-600"
          href="/admin/partners/stage/active"
        />
        <Kpi
          label="Signed Reach"
          value={fmtCount(m.signedReach.known)}
          sub={`FIs · ${m.signedReach.unquantified} partner${m.signedReach.unquantified === 1 ? "" : "s"} unquantified`}
          accent="text-teal-600"
        />
        <Kpi
          label="Total Est. Reach"
          value={fmtCount(m.allReach.known)}
          sub={`across ${m.allReach.quantified} of ${m.allReach.total} partners`}
          accent="text-slate-900"
        />
      </div>

      <SignedGoal state={state} />

      <div
        className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start"
        data-print="stack"
      >
        <div className="space-y-4" data-print="flow">
          <Funnel state={state} />
          <CategoryPanel state={state} />
        </div>
        <div className="space-y-4" data-print="hide">
          <ConcentrationPanel state={state} />
          <BranchPanel state={state} />
        </div>
      </div>

      {adding && <AddPartnerModal onClose={() => setAdding(false)} />}
    </div>
  );
}
