"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePipeline } from "./_lib/PipelineContext";
import {
  BRANCH_STAGES,
  MAIN_STAGES,
  OPEN_FUNNEL_STAGES,
  STAGE_LABELS,
  fmtMoney,
} from "./_lib/stages";
import { computeMetrics, countMembers } from "./_lib/universe";
import type { ListId, PipelineState } from "./_lib/types";

const FUNNEL_ROWS: ListId[] = [
  "universe",
  "addressable-asset",
  "addressable-fit",
  "active-pursuit",
  ...MAIN_STAGES,
];

const SIZING_ROWS = new Set<ListId>([
  "universe",
  "addressable-asset",
  "addressable-fit",
  "active-pursuit",
]);

function Kpi({
  label,
  value,
  sub,
  accent,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  href?: string;
}) {
  const card = (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full transition-colors hover:border-slate-300">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </div>
      <div className={cn("text-2xl font-bold text-slate-900", accent)}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

function GoalTracker({ state }: { state: PipelineState }) {
  const m = computeMetrics(state);
  const goal = Math.max(state.settings.salesGoal, 1);
  const wonPct = Math.min((m.closedWonCount / goal) * 100, 100);
  const projected = Math.min(m.projectedDeals, goal);
  const projPct = Math.min(((projected - m.closedWonCount) / goal) * 100, 100 - wonPct);
  const gap = Math.max(goal - m.projectedDeals, 0);
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
            {new Date().getFullYear()} Sales Goal — Pace to Target
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {m.closedWonCount}
            <span className="text-lg font-medium text-slate-400"> / {goal} closed won</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900">
            {Math.round((m.closedWonCount / goal) * 100)}%
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            to goal
          </div>
        </div>
      </div>
      <div className="h-8 rounded-lg bg-slate-100 overflow-hidden flex ring-1 ring-inset ring-slate-200">
        {wonPct > 0 && (
          <div
            className="bg-emerald-500 h-full flex items-center justify-center text-xs font-bold text-white min-w-[24px]"
            style={{ width: `${wonPct}%` }}
          >
            {m.closedWonCount}
          </div>
        )}
        {projPct > 0 && (
          <div
            className="h-full flex items-center justify-center text-xs font-semibold text-emerald-700 bg-[repeating-linear-gradient(45deg,rgba(16,185,129,.15),rgba(16,185,129,.15)_6px,rgba(16,185,129,.3)_6px,rgba(16,185,129,.3)_12px)]"
            style={{ width: `${projPct}%` }}
          >
            +{projected - m.closedWonCount} projected
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-5 text-xs text-slate-500 mt-3">
        <span>
          <b className="text-emerald-600">{m.closedWonCount} won</b> ({fmtMoney(m.closedWonArr)}{" "}
          ARR)
        </span>
        <span>
          <b className="text-slate-700">{fmtMoney(m.weightedPipeline)}</b> weighted open pipeline
        </span>
        <span>
          <b className="text-slate-700">= {m.projectedDeals}</b> projected (
          {Math.round((m.projectedDeals / goal) * 100)}% of goal)
        </span>
        {gap > 0 && (
          <span className="text-red-500 font-semibold">{gap}-deal gap to close</span>
        )}
      </div>
    </div>
  );
}

function Funnel({ state }: { state: PipelineState }) {
  const m = computeMetrics(state);
  const counts = FUNNEL_ROWS.map((id) => ({ id, ...countMembers(id, state) }));
  const max = Math.max(...counts.map((c) => c.total), 1);
  // sqrt scale keeps late stages visible next to the 8,500-FI universe
  const scale = (n: number) => Math.max(Math.sqrt(n / max) * 100, n > 0 ? 4 : 2);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="space-y-1.5">
        {counts.map(({ id, total, cu, bank }) => {
          const sizing = SIZING_ROWS.has(id);
          const prob = state.settings.stageProbabilities[id as keyof typeof state.settings.stageProbabilities];
          const dollars = sizing
            ? total * state.settings.defaultDealArr
            : (m.stageArr[id] ?? 0);
          const width = scale(total);
          const cuPct = total > 0 ? (cu / total) * 100 : 0;
          return (
            <Link
              key={id}
              href={`/admin/pipeline/stage/${id}`}
              className="flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 hover:bg-slate-50 transition-colors group"
            >
              <div className="w-56 shrink-0 flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                <span className="truncate group-hover:text-slate-900">{STAGE_LABELS[id]}</span>
                <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 tabular-nums">
                  {sizing ? "—" : `${Math.round((prob ?? 0) * 100)}%`}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="h-7 rounded-md overflow-hidden flex ring-1 ring-inset ring-slate-200 bg-slate-50"
                  style={{ width: `${width}%`, minWidth: 24 }}
                >
                  {total === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-slate-400">
                      0
                    </div>
                  ) : (
                    <>
                      {cu > 0 && (
                        <div
                          className="bg-emerald-500 h-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden"
                          style={{ width: `${cuPct}%`, minWidth: cu > 0 ? 18 : 0 }}
                        >
                          {cu.toLocaleString()}
                        </div>
                      )}
                      {bank > 0 && (
                        <div
                          className="bg-blue-500 h-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden"
                          style={{ width: `${100 - cuPct}%`, minWidth: bank > 0 ? 18 : 0 }}
                        >
                          {bank.toLocaleString()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "w-20 shrink-0 text-right text-[13px] font-bold tabular-nums",
                  sizing ? "text-slate-400" : "text-emerald-600",
                )}
              >
                {dollars > 0 ? `${sizing ? "~" : ""}${fmtMoney(dollars)}` : "—"}
              </div>
              <div className="w-36 shrink-0 text-xs text-slate-400 tabular-nums truncate">
                {cu.toLocaleString()} CU · {bank.toLocaleString()} bank
              </div>
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-5 text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">
        <span className="inline-flex items-center gap-1.5">
          <i className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Credit Union
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Bank
        </span>
        <span>
          ~$ modeled @ {fmtMoney(state.settings.defaultDealArr)}/deal · $ weighted by stage
          probability
        </span>
      </div>
    </div>
  );
}

function BranchPanel({ state }: { state: PipelineState }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-400 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
        Nurture &amp; Removed
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed mb-4">
        Branches off the main funnel. Deals that go quiet land here and re-enter on an intent
        signal. Nurture is weighted at a recovery probability and credited to Marketing.
      </p>
      <div className="space-y-4">
        {BRANCH_STAGES.map((id) => {
          const { total } = countMembers(id, state);
          const prob = state.settings.stageProbabilities[id] ?? 0;
          const attributed = total * state.settings.defaultDealArr * prob;
          const isNurture = id === "short-term-nurture" || id === "long-term-nurture";
          return (
            <Link
              key={id}
              href={`/admin/pipeline/stage/${id}`}
              className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-slate-50 transition-colors"
            >
              <div>
                <div className="text-[13px] font-semibold text-slate-700">
                  {STAGE_LABELS[id]}
                </div>
                {isNurture && (
                  <div className="text-[11px] text-slate-400">
                    {fmtMoney(attributed)} attributed @ {Math.round(prob * 100)}%
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "text-xl font-bold tabular-nums",
                  isNurture ? "text-amber-500" : "text-slate-400",
                )}
              >
                {total}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function PipelineDashboard() {
  const { state, loading } = usePipeline();

  if (loading || !state) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const universe = countMembers("universe", state);
  const asset = countMembers("addressable-asset", state);
  const fit = countMembers("addressable-fit", state);
  const pursuit = countMembers("active-pursuit", state);
  const m = computeMetrics(state);
  const openDeals = OPEN_FUNNEL_STAGES.reduce(
    (n, s) => n + countMembers(s, state).total,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi
          label="Universe"
          value={universe.total.toLocaleString()}
          sub={`${universe.cu.toLocaleString()} CU · ${universe.bank.toLocaleString()} bank`}
          href="/admin/pipeline/stage/universe"
        />
        <Kpi
          label="Addressable · Assets"
          value={asset.total.toLocaleString()}
          sub={`$250M–$50B · ${asset.cu.toLocaleString()} CU · ${asset.bank.toLocaleString()} bank`}
          accent="text-blue-600"
          href="/admin/pipeline/stage/addressable-asset"
        />
        <Kpi
          label="Addressable · Fit"
          value={fit.total.toLocaleString()}
          sub={`+ platform fit · ${fit.cu.toLocaleString()} CU · ${fit.bank.toLocaleString()} bank`}
          accent="text-violet-600"
          href="/admin/pipeline/stage/addressable-fit"
        />
        <Kpi
          label="Active Pursuit"
          value={pursuit.total.toLocaleString()}
          sub="fit, no open deal yet"
          accent="text-amber-600"
          href="/admin/pipeline/stage/active-pursuit"
        />
        <Kpi
          label="Open Deals"
          value={openDeals.toLocaleString()}
          sub="MQL → verbal commitment"
          accent="text-teal-600"
        />
        <Kpi
          label="Weighted Pipeline"
          value={fmtMoney(m.weightedPipeline)}
          sub="ARR × stage probability"
          accent="text-emerald-600"
        />
      </div>

      <GoalTracker state={state} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
        <Funnel state={state} />
        <BranchPanel state={state} />
      </div>
    </div>
  );
}
