"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Institution, LoanCategory } from "../_lib/types";
import { DEFAULT_AVG_LOAN_SIZE } from "../_lib/types";
import {
  calcRoi,
  type RoiLoanProduct,
  type RoiDepositProduct,
  type RoiNiiProduct,
  type RoiCosts,
  type RoiScenarioResult,
} from "../_lib/calc";
import { fmtUSD, fmtUSDExact, fmtCount } from "../_lib/format";
import { HelpPopover } from "./primitives";

// ─── Default yields by loan product (approximate national averages) ───────────
const DEFAULT_LOAN_YIELD: Record<LoanCategory, number> = {
  firstMortgage: 6.8,
  heloc: 8.5,
  auto: 7.2,
  creditCard: 19.5,
  unsecured: 11.0,
  commercial: 7.5,
};

const DEFAULT_LOAN_TERM: Record<LoanCategory, number> = {
  firstMortgage: 360,
  heloc: 120,
  auto: 60,
  creditCard: 24,
  unsecured: 36,
  commercial: 84,
};

const LOAN_LABELS: Record<LoanCategory, string> = {
  firstMortgage: "First Mortgage",
  heloc: "Home Equity",
  auto: "Vehicle",
  creditCard: "Credit Card",
  unsecured: "Unsecured",
  commercial: "Commercial",
};

const LOAN_KEYS: LoanCategory[] = [
  "auto",
  "firstMortgage",
  "heloc",
  "creditCard",
  "unsecured",
  "commercial",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type LoanInputRow = RoiLoanProduct & { enabled: boolean };
type DepositInputRow = RoiDepositProduct & { enabled: boolean };
type NiiInputRow = RoiNiiProduct;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMultiple(n: number) {
  return `${n.toFixed(2)}×`;
}

function ScenarioColumn({
  label,
  result,
  highlight,
}: {
  label: string;
  result: RoiScenarioResult;
  highlight?: boolean;
}) {
  const positive = result.netRoi >= 0;
  return (
    <div
      className={`rounded-xl p-5 flex flex-col gap-3 ${
        highlight
          ? "bg-emerald-900 text-white"
          : "bg-white border border-slate-200 shadow-sm"
      }`}
    >
      <div className={`text-xs uppercase tracking-wider font-semibold ${highlight ? "text-emerald-300" : "text-slate-500"}`}>
        {label}
      </div>
      <div className={`text-xs ${highlight ? "text-emerald-400" : "text-slate-400"}`}>
        {result.responseRate}% response rate
      </div>

      <div className="space-y-2 mt-1">
        <MetricRow
          label="Loan interest income"
          value={fmtUSD(result.loanInterestIncome)}
          highlight={highlight}
        />
        <MetricRow
          label="Deposit spread income"
          value={fmtUSD(result.depositNetSpreadIncome)}
          highlight={highlight}
        />
        <MetricRow
          label="Non-Interest Income (NII)"
          value={fmtUSD(result.niiIncome)}
          highlight={highlight}
        />
        <div className={`border-t ${highlight ? "border-emerald-700" : "border-slate-100"} pt-2`}>
          <MetricRow
            label="Total incremental income"
            value={fmtUSD(result.totalIncrementalIncome)}
            bold
            highlight={highlight}
          />
        </div>
        <MetricRow
          label="Total costs"
          value={`(${fmtUSD(result.totalCosts)})`}
          highlight={highlight}
          muted
        />
        <div className={`border-t ${highlight ? "border-emerald-700" : "border-slate-100"} pt-2`}>
          <MetricRow
            label="Net ROI"
            value={fmtUSD(result.netRoi)}
            bold
            highlight={highlight}
            colored={positive}
          />
          <MetricRow
            label="ROI multiple"
            value={fmtMultiple(result.roiMultiple)}
            bold
            highlight={highlight}
            colored={positive}
          />
        </div>
      </div>

      <div className={`text-xs mt-2 pt-3 border-t ${highlight ? "border-emerald-700" : "border-slate-100"} space-y-1 ${highlight ? "text-emerald-400" : "text-slate-400"}`}>
        <div className="flex justify-between">
          <span>Loan offers sent</span>
          <span className="font-mono">{fmtCount(result.loanOffersGenerated)}</span>
        </div>
        <div className="flex justify-between">
          <span>Platform redemptions</span>
          <span className="font-mono">{fmtCount(result.loanRedemptions)}</span>
        </div>
        <div className="flex justify-between">
          <span>Loans funded</span>
          <span className="font-mono">{fmtCount(result.loanIncrementalFunded)}</span>
        </div>
        <div className="flex justify-between">
          <span>Loan volume</span>
          <span className="font-mono">{fmtUSD(result.loanIncrementalVolume)}</span>
        </div>
        <div className="flex justify-between">
          <span>Deposit offers sent</span>
          <span className="font-mono">{fmtCount(result.depositOffersGenerated)}</span>
        </div>
        <div className="flex justify-between">
          <span>New accounts opened</span>
          <span className="font-mono">{fmtCount(result.depositIncrementalAccounts)}</span>
        </div>
        <div className="flex justify-between">
          <span>New deposit volume</span>
          <span className="font-mono">{fmtUSD(result.depositIncrementalVolume)}</span>
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  bold,
  muted,
  highlight,
  colored,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  highlight?: boolean;
  colored?: boolean;
}) {
  const baseText = highlight ? "text-white" : "text-slate-900";
  const mutedText = highlight ? "text-emerald-400" : "text-slate-400";
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className={`text-xs ${muted ? mutedText : highlight ? "text-emerald-200" : "text-slate-500"}`}>
        {label}
      </span>
      <span
        className={`text-sm font-mono ${bold ? "font-bold" : ""} ${
          colored === true
            ? "text-emerald-400"
            : colored === false
              ? "text-rose-400"
              : muted
                ? mutedText
                : baseText
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  step?: number;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-2.5 text-slate-400 text-sm pointer-events-none">{prefix}</span>
        )}
        <input
          type="number"
          value={value}
          step={step ?? 1}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full ${prefix ? "pl-6" : "pl-2.5"} ${suffix ? "pr-8" : "pr-2.5"} py-1.5 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white`}
        />
        {suffix && (
          <span className="absolute right-2.5 text-slate-400 text-sm pointer-events-none">{suffix}</span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RoiTab({
  cu,
  loanVolumes,
  movemintAnnualFee,
}: {
  cu: Institution;
  loanVolumes: Record<LoanCategory, number>;
  movemintAnnualFee: number;
}) {
  // ── Scenario rates ────────────────────────────────────────────────────────
  const [scenarioRates, setScenarioRates] = useState<[number, number, number]>([1, 2, 4]);

  // ── Loan Funding Rate ─────────────────────────────────────────────────────
  const [loanFundingRatePct, setLoanFundingRatePct] = useState<number>(60);

  // ── Costs ─────────────────────────────────────────────────────────────────
  const [costs, setCosts] = useState<RoiCosts>({
    bureauCostPerCampaign: 30_000,
    marketingCostPerCampaign: 20_000,
    campaignsPerYear: 4,
    movemintAnnualFee,
  });

  // Keep movemintAnnualFee in sync if parent changes it
  useMemo(() => {
    setCosts((c) => ({ ...c, movemintAnnualFee }));
  }, [movemintAnnualFee]);

  // ── Loan product rows ─────────────────────────────────────────────────────
  const [loanRows, setLoanRows] = useState<LoanInputRow[]>(() =>
    LOAN_KEYS.map((k) => {
      const totalVol = loanVolumes[k] || 0;
      return {
        label: LOAN_LABELS[k],
        totalMembers: cu.members,
        pctMembersWithOffers: 30,
        responseRate: 2,
        avgLoanSize: DEFAULT_AVG_LOAN_SIZE[k],
        avgYieldPct: DEFAULT_LOAN_YIELD[k],
        avgTermMonths: DEFAULT_LOAN_TERM[k],
        organicVolume: totalVol,
        enabled: totalVol > 0,
      } satisfies LoanInputRow;
    })
  );

  // ── Deposit product rows ──────────────────────────────────────────────────
  const [depositRows, setDepositRows] = useState<DepositInputRow[]>(() => [
    {
      label: cu.cuType === "bank" ? "Savings / Money Market" : "Share Savings / Money Market",
      totalMembers: cu.members,
      pctMembersWithOffers: 20,
      responseRate: 2,
      avgAccountSize: 5_000,
      deploymentYieldPct: 5.0,
      avgRatePaidPct: 1.5,
      organicVolume: cu.shares.regular + cu.shares.mma,
      enabled: true,
    },
    {
      label: cu.cuType === "bank" ? "Checking Accounts" : "Checking / Drafts",
      totalMembers: cu.members,
      pctMembersWithOffers: 15,
      responseRate: 2,
      avgAccountSize: 3_000,
      deploymentYieldPct: 5.0,
      avgRatePaidPct: 0.25,
      organicVolume: cu.shares.drafts,
      enabled: true,
    },
    {
      label: cu.cuType === "bank" ? "CDs" : "Certificates (CDs)",
      totalMembers: cu.members,
      pctMembersWithOffers: 15,
      responseRate: 2,
      avgAccountSize: 15_000,
      deploymentYieldPct: 5.0,
      avgRatePaidPct: 4.5,
      organicVolume: cu.shares.cds,
      enabled: cu.shares.cds > 0,
    },
  ]);

  // ── Non-Interest Income (NII) product rows ─────────────────────────────────
  const [niiRows, setNiiRows] = useState<NiiInputRow[]>(() => [
    {
      label: "GAP (Guaranteed Asset Protection)",
      attachmentRatePct: 20,
      avgFee: 450,
      enabled: true,
    },
    {
      label: "MRC (Mechanical Repair Coverage)",
      attachmentRatePct: 15,
      avgFee: 600,
      enabled: true,
    },
    {
      label: "Debt Protection",
      attachmentRatePct: 10,
      avgFee: 350,
      enabled: true,
    },
    {
      label: "Credit Insurance",
      attachmentRatePct: 8,
      avgFee: 200,
      enabled: true,
    },
  ]);

  // ── Expand/collapse ───────────────────────────────────────────────────────
  const [showLoanDrilldown, setShowLoanDrilldown] = useState(false);
  const [showDepositDrilldown, setShowDepositDrilldown] = useState(false);
  const [showNiiDrilldown, setShowNiiDrilldown] = useState(false);
  const [showLoanInputs, setShowLoanInputs] = useState(true);
  const [showDepositInputs, setShowDepositInputs] = useState(true);
  const [showNiiInputs, setShowNiiInputs] = useState(true);

  // ── Calculation ───────────────────────────────────────────────────────────
  const result = useMemo(() =>
    calcRoi({
      loanProducts: loanRows.filter((r) => r.enabled),
      depositProducts: depositRows.filter((r) => r.enabled),
      niiProducts: niiRows,
      loanFundingRatePct,
      costs,
      scenarioRates,
    }),
    [loanRows, depositRows, niiRows, loanFundingRatePct, costs, scenarioRates]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  function updateLoan(idx: number, patch: Partial<LoanInputRow>) {
    setLoanRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function updateDeposit(idx: number, patch: Partial<DepositInputRow>) {
    setDepositRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function updateNii(idx: number, patch: Partial<NiiInputRow>) {
    setNiiRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function updateCost(patch: Partial<RoiCosts>) {
    setCosts((c) => ({ ...c, ...patch }));
  }

  return (
    <div className="space-y-8">

      {/* ── CU Context Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-6 text-sm">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">{cu.cuType === "bank" ? "Bank" : "Credit Union"}</div>
          <div className="font-semibold text-slate-900 mt-0.5">{cu.name}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">Assets</div>
          <div className="font-semibold text-slate-900 mt-0.5">{fmtUSD(cu.assets)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">{cu.cuType === "bank" ? "Customers" : "Members"}</div>
          <div className="font-semibold text-slate-900 mt-0.5">{fmtCount(cu.members)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">Total Originations</div>
          <div className="font-semibold text-slate-900 mt-0.5">
            {fmtUSD(Object.values(loanVolumes).reduce((a, b) => a + b, 0))}
          </div>
        </div>
      </div>

      {/* ── Scenario Rate Inputs ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-slate-700">Response Rate Scenarios</h2>
          <HelpPopover title="Response Rate">
            <p>The percentage of {cu.cuType === "bank" ? "customers" : "members"} who receive an offer and actually accept/fund it. Industry benchmarks: 1% conservative, 2% base, 4% optimistic.</p>
          </HelpPopover>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <NumField
            label="Conservative (%)"
            value={scenarioRates[0]}
            onChange={(v) => setScenarioRates([v, scenarioRates[1], scenarioRates[2]])}
            suffix="%"
            step={0.5}
          />
          <NumField
            label="Base (%)"
            value={scenarioRates[1]}
            onChange={(v) => setScenarioRates([scenarioRates[0], v, scenarioRates[2]])}
            suffix="%"
            step={0.5}
          />
          <NumField
            label="Optimistic (%)"
            value={scenarioRates[2]}
            onChange={(v) => setScenarioRates([scenarioRates[0], scenarioRates[1], v])}
            suffix="%"
            step={0.5}
          />
        </div>
      </div>

      {/* ── Cost Inputs ───────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Cost Assumptions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField
            label="Bureau cost / campaign"
            value={costs.bureauCostPerCampaign}
            onChange={(v) => updateCost({ bureauCostPerCampaign: v })}
            prefix="$"
            hint="Default $30,000"
          />
          <NumField
            label="Marketing cost / campaign"
            value={costs.marketingCostPerCampaign}
            onChange={(v) => updateCost({ marketingCostPerCampaign: v })}
            prefix="$"
            hint="Default $20,000"
          />
          <NumField
            label="Campaigns / year"
            value={costs.campaignsPerYear}
            onChange={(v) => updateCost({ campaignsPerYear: v })}
            hint="Affects bureau + marketing total"
          />
          <NumField
            label="Movemint annual fee"
            value={costs.movemintAnnualFee}
            onChange={(v) => updateCost({ movemintAnnualFee: v })}
            prefix="$"
            hint="Auto-seeded from pricing model"
          />
        </div>
        <div className="mt-3 text-xs text-slate-400">
          Total annual costs: <span className="font-mono font-semibold text-slate-600">{fmtUSDExact(costs.bureauCostPerCampaign * costs.campaignsPerYear + costs.marketingCostPerCampaign * costs.campaignsPerYear + costs.movemintAnnualFee)}</span>
        </div>
      </div>

      {/* ── Loan Product Inputs ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          onClick={() => setShowLoanInputs((v) => !v)}
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Loan Product Parameters</h2>
            <p className="text-xs text-slate-400 mt-0.5">Configure each loan product — seeded from {cu.cuType === "bank" ? "FDIC" : "NCUA"} data</p>
          </div>
          {showLoanInputs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showLoanInputs && (
          <div className="px-5 pb-5 space-y-6 border-t border-slate-100">
            {/* Global Loan Funding Rate Slider */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-5 mb-2 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    Global Loan Funding Rate: <span className="font-mono text-emerald-600 text-sm font-extrabold">{loanFundingRatePct}%</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    The percentage of platform redemptions (started loan applications) that successfully close and fund.
                  </p>
                </div>
                <div className="flex items-center gap-3 min-w-[200px] sm:min-w-[250px]">
                  <span className="text-xs text-slate-400 font-mono">0%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={loanFundingRatePct}
                    onChange={(e) => setLoanFundingRatePct(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-400 font-mono">100%</span>
                </div>
              </div>
            </div>

            {loanRows.map((row, idx) => (
              <div key={row.label}>
                <div className="flex items-center gap-3 mt-5 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) => updateLoan(idx, { enabled: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                      {row.label}
                    </span>
                  </label>
                  {!row.enabled && <span className="text-xs text-slate-400 italic">excluded</span>}
                </div>
                {row.enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <NumField
                      label={cu.cuType === "bank" ? "Customers w/ Offers (%)" : "Members w/ Offers (%)"}
                      value={row.pctMembersWithOffers}
                      onChange={(v) => updateLoan(idx, { pctMembersWithOffers: v })}
                      suffix="%"
                      step={5}
                    />
                    <NumField
                      label="Avg Loan Size"
                      value={row.avgLoanSize}
                      onChange={(v) => updateLoan(idx, { avgLoanSize: v })}
                      prefix="$"
                    />
                    <NumField
                      label="Avg Yield (%)"
                      value={row.avgYieldPct}
                      onChange={(v) => updateLoan(idx, { avgYieldPct: v })}
                      suffix="%"
                      step={0.1}
                      hint={`${cu.cuType === "bank" ? "FDIC" : "NCUA"} avg rate baseline`}
                    />
                    <NumField
                      label="Avg Term (mo)"
                      value={row.avgTermMonths}
                      onChange={(v) => updateLoan(idx, { avgTermMonths: v })}
                    />
                    <NumField
                      label="Organic Volume ($)"
                      value={row.organicVolume}
                      onChange={(v) => updateLoan(idx, { organicVolume: v })}
                      prefix="$"
                      hint="Without Movemint"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Deposit Product Inputs ─────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          onClick={() => setShowDepositInputs((v) => !v)}
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Deposit Product Parameters</h2>
            <p className="text-xs text-slate-400 mt-0.5">Net interest spread on new deposit accounts</p>
          </div>
          {showDepositInputs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showDepositInputs && (
          <div className="px-5 pb-5 space-y-6 border-t border-slate-100">
            {depositRows.map((row, idx) => (
              <div key={row.label}>
                <div className="flex items-center gap-3 mt-5 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) => updateDeposit(idx, { enabled: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                      {row.label}
                    </span>
                  </label>
                  {!row.enabled && <span className="text-xs text-slate-400 italic">excluded</span>}
                </div>
                {row.enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <NumField
                      label={cu.cuType === "bank" ? "Customers w/ Offers (%)" : "Members w/ Offers (%)"}
                      value={row.pctMembersWithOffers}
                      onChange={(v) => updateDeposit(idx, { pctMembersWithOffers: v })}
                      suffix="%"
                      step={5}
                    />
                    <NumField
                      label="Avg Account Size"
                      value={row.avgAccountSize}
                      onChange={(v) => updateDeposit(idx, { avgAccountSize: v })}
                      prefix="$"
                    />
                    <NumField
                      label="Deployment Yield (%)"
                      value={row.deploymentYieldPct}
                      onChange={(v) => updateDeposit(idx, { deploymentYieldPct: v })}
                      suffix="%"
                      step={0.1}
                      hint={`How ${cu.cuType === "bank" ? "bank" : "CU"} deploys the funds`}
                    />
                    <NumField
                      label={cu.cuType === "bank" ? "Rate Paid to Customer (%)" : "Rate Paid to Member (%)"}
                      value={row.avgRatePaidPct}
                      onChange={(v) => updateDeposit(idx, { avgRatePaidPct: v })}
                      suffix="%"
                      step={0.1}
                      hint={`From ${cu.cuType === "bank" ? "FDIC" : "NCUA"} avg deposit rate`}
                    />
                    <NumField
                      label="Organic Volume ($)"
                      value={row.organicVolume}
                      onChange={(v) => updateDeposit(idx, { organicVolume: v })}
                      prefix="$"
                      hint="Without Movemint"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── NII Product Inputs ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          onClick={() => setShowNiiInputs((v) => !v)}
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Non-Interest Income (NII) Parameters</h2>
            <p className="text-xs text-slate-400 mt-0.5">Configure attachment rates and net fee revenue for ancillary products</p>
          </div>
          {showNiiInputs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showNiiInputs && (
          <div className="px-5 pb-5 space-y-6 border-t border-slate-100">
            {niiRows.map((row, idx) => (
              <div key={row.label}>
                <div className="flex items-center gap-3 mt-5 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) => updateNii(idx, { enabled: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                      {row.label}
                    </span>
                  </label>
                  {!row.enabled && <span className="text-xs text-slate-400 italic">excluded</span>}
                </div>
                {row.enabled && (
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <NumField
                      label="Attachment Rate (%)"
                      value={row.attachmentRatePct}
                      onChange={(v) => updateNii(idx, { attachmentRatePct: v })}
                      suffix="%"
                      step={1}
                      hint="% of funded loans"
                    />
                    <NumField
                      label="Avg Net Fee ($)"
                      value={row.avgFee}
                      onChange={(v) => updateNii(idx, { avgFee: v })}
                      prefix="$"
                      hint="Net fee to institution"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3-Column Scenario Results ──────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">ROI Scenarios — {cu.cuType === "bank" ? "Bank" : "CU"} Perspective</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScenarioColumn label="Conservative" result={result.conservative} />
          <ScenarioColumn label="Base Case" result={result.base} highlight />
          <ScenarioColumn label="Optimistic" result={result.optimistic} />
        </div>
      </div>

      {/* ── Loan Drill-Down ────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          onClick={() => setShowLoanDrilldown((v) => !v)}
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Loan Product Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Per-product detail at the base response rate · Movemint-incremental vs. organic baseline</p>
          </div>
          {showLoanDrilldown ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showLoanDrilldown && (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-right font-semibold">Offers Sent</th>
                  <th className="px-4 py-3 text-right font-semibold">Redemptions (Apps)</th>
                  <th className="px-4 py-3 text-right font-semibold">Loans Funded</th>
                  <th className="px-4 py-3 text-right font-semibold">Movemint Volume</th>
                  <th className="px-4 py-3 text-right font-semibold">Organic Baseline</th>
                  <th className="px-4 py-3 text-right font-semibold">Interest Income</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.loanBreakdown.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.label}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(row.offersGenerated)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(row.redemptions)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(row.incrementalFunded)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">{fmtUSD(row.incrementalVolume)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">{fmtUSD(row.organicVolume)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">{fmtUSD(row.interestIncome)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3 text-slate-700">Total</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(result.base.loanOffersGenerated)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(result.base.loanRedemptions)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(result.base.loanIncrementalFunded)}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmtUSD(result.base.loanIncrementalVolume)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">—</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmtUSD(result.base.loanInterestIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Deposit Drill-Down ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          onClick={() => setShowDepositDrilldown((v) => !v)}
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Deposit Product Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Per-product detail at the base response rate</p>
          </div>
          {showDepositDrilldown ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showDepositDrilldown && (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-right font-semibold">Offers Sent</th>
                  <th className="px-4 py-3 text-right font-semibold">Accounts Opened</th>
                  <th className="px-4 py-3 text-right font-semibold">Movemint Volume</th>
                  <th className="px-4 py-3 text-right font-semibold">Organic Baseline</th>
                  <th className="px-4 py-3 text-right font-semibold">Net Spread Income</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.depositBreakdown.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.label}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(row.offersGenerated)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(row.incrementalAccounts)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">{fmtUSD(row.incrementalVolume)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400">{fmtUSD(row.organicVolume)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">{fmtUSD(row.netSpreadIncome)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3 text-slate-700">Total</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(result.base.depositOffersGenerated)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(result.base.depositIncrementalAccounts)}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmtUSD(result.base.depositIncrementalVolume)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">—</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmtUSD(result.base.depositNetSpreadIncome)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── NII Drill-Down ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          onClick={() => setShowNiiDrilldown((v) => !v)}
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Non-Interest Income (NII) Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Per-product detail at the base response rate · Based on funded loans</p>
          </div>
          {showNiiDrilldown ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showNiiDrilldown && (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-right font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Attachment Rate</th>
                  <th className="px-4 py-3 text-right font-semibold">Avg Net Fee</th>
                  <th className="px-4 py-3 text-right font-semibold">Estimated Units Sold</th>
                  <th className="px-4 py-3 text-right font-semibold">Total NII Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.niiBreakdown.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.label}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${row.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>
                        {row.enabled ? "Active" : "Excluded"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{row.attachmentRatePct}%</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtUSD(row.avgFee)}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{fmtCount(row.unitsSold)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">{fmtUSD(row.revenue)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3 text-slate-700" colSpan={2}>Total</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">—</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">—</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    {fmtCount(result.niiBreakdown.reduce((sum, r) => sum + r.unitsSold, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700">
                    {fmtUSD(result.base.niiIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Interest income is calculated as: funded volume × annual yield × (avg term / 12 months). Deposit income is: new balance × (deployment yield − rate paid to {cu.cuType === "bank" ? "customer" : "member"}). Non-interest income (NII) products attach to funded loans: units sold = funded loans × attachment rate. All figures are estimates based on {cu.cuType === "bank" ? "FDIC" : "NCUA"} call report data and configurable assumptions. Not a guarantee of future results.
      </p>
    </div>
  );
}
