"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Upload, Download, Trash2, FileWarning, ArrowLeft, Search, Info, X, ChevronDown, ChevronRight } from "lucide-react";
import ncuaData from "@/data/ncua-cus.json";

import type { LoanTakeRates, DepositTakeRates } from "../_lib/types";
import { tierForAssets, SAAS_TIERS, MIDDLE_TIER_ID, DEFAULT_TIER_MULTIPLIERS } from "../_lib/types";
import type { EventAssumptions } from "../_lib/events";
import { fmtUSD, fmtUSDExact, fmtCount } from "../_lib/format";
import {
  type ExistingClient,
  type ClientWithNcua,
  type ClientMode,
  attachNcua,
  clientMode,
  MODE_LABELS,
  clientsStore,
  saveClients,
  clearClients,
  parseCsv,
  buildSampleCsv,
  REQUIRED_CSV_COLUMNS,
} from "../_lib/clients";
import { backSolveSaasPerEvent, backSolveBps } from "../_lib/calc";
import { Card } from "./primitives";

const REVENUE_TARGETS = [1.0, 1.05, 1.1, 1.15, 1.2] as const;
const TARGET_SAAS_SHARE_DEFAULT = 70; // %
const LENDING_PREMIUM_DEFAULT = 2;    // lending events priced 2× deposit by default
const LOAN_FUNDING_RATE_DEFAULT = 35;     // % of loan apps that fund (default 35%)
const DEPOSIT_FUNDING_RATE_DEFAULT = 60;  // % of deposit apps that fund (default 60%)
const BPS_AVG_LOAN_SIZE_DEFAULT = 35_000; // $ — blended avg funded loan size for BPS calc
const BPS_AVG_DEPOSIT_SIZE_DEFAULT = 5_000; // $ — avg new-deposit account size

type BillingOption = "bps" | "redemption" | "application" | "click" | "offerGen";

const BILLING_OPTION_LABELS: Record<BillingOption, string> = {
  bps: "BPS take-rate",
  redemption: "Per-redemption",
  application: "Per-application",
  click: "Per-click",
  offerGen: "Per-offer-generated",
};

export type RepricingTabProps = {
  loanBps: LoanTakeRates;
  depositBps: DepositTakeRates;
  loanPenetration: number;
  depositPenetration: number;
  eventAssumptions: EventAssumptions;
  depositChurnGrossup: number;
  // bpsMonthlyFloor and tierPrices intentionally NOT consumed here — Repricing
  // RECOMMENDS those values, doesn't read them. Pass-through accepted so the
  // page.tsx call site doesn't need surgery.
  bpsMonthlyFloor?: number;
  tierPrices?: unknown;
};

type View = "list" | "detail" | "tierSummary";

export function RepricingTab(props: RepricingTabProps) {
  const clients = useSyncExternalStore(
    clientsStore.subscribe,
    clientsStore.getSnapshot,
    clientsStore.getServerSnapshot,
  );
  const [view, setView] = useState<View>("list");
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [targetSaasShare, setTargetSaasShare] = useState<number>(TARGET_SAAS_SHARE_DEFAULT);
  const [lendingPremium, setLendingPremium] = useState<number>(LENDING_PREMIUM_DEFAULT);
  const [tierBillingOption, setTierBillingOption] = useState<BillingOption>("redemption");
  // BPS funding-rate + avg-size assumptions. Funded volume is derived as:
  //   loan_funded_volume    = applications_lending × loanFundingRate × bpsAvgLoanSize
  //   deposit_funded_volume = applications_deposit × depositFundingRate × bpsAvgDepositSize
  // These replace the NCUA-derived volumes the BPS back-solve previously used.
  const [loanFundingRate, setLoanFundingRate] = useState<number>(LOAN_FUNDING_RATE_DEFAULT);
  const [depositFundingRate, setDepositFundingRate] = useState<number>(DEPOSIT_FUNDING_RATE_DEFAULT);
  const [bpsAvgLoanSize, setBpsAvgLoanSize] = useState<number>(BPS_AVG_LOAN_SIZE_DEFAULT);
  const [bpsAvgDepositSize, setBpsAvgDepositSize] = useState<number>(BPS_AVG_DEPOSIT_SIZE_DEFAULT);
  const [showAssumptions, setShowAssumptions] = useState(false);
  // Rate-card builder mode: when ON, SaaS becomes a static rate card driven
  // by `baseSaasFee × tierMultipliers[clientTier]`, applied flat across all
  // revenue targets and ignoring the SaaS-share % slider. Per-event / bps
  // prices absorb the rest. When OFF, the live back-solve (default behavior)
  // governs everything.
  const [useRateCardMode, setUseRateCardMode] = useState(false);
  // Per-tier multipliers used in rate-card mode. Anchor: middle tier (t4) = 1×.
  const [tierMultipliers, setTierMultipliers] = useState<Record<string, number>>(
    () => ({ ...DEFAULT_TIER_MULTIPLIERS }),
  );
  // Base SaaS fee — the value at the anchor tier (1× multiplier). Either user-set
  // or auto-computed from the middle-tier median at 70%/100%.
  const [baseSaasFeeOverride, setBaseSaasFeeOverride] = useState<number | null>(null);

  function persist(next: ExistingClient[]) {
    saveClients(next);
  }

  const clientsHydrated = useMemo<ClientWithNcua[]>(
    () => clients.map((c) => attachNcua(c)),
    [clients],
  );
  const activeClient = clientsHydrated.find((c) => c.id === activeClientId) ?? null;

  // Auto-computed base SaaS fee: median of middle-tier (anchor tier) clients'
  // back-solved monthly SaaS at 100% revenue / 70% SaaS share. This is the
  // recommended default; user can override with baseSaasFeeOverride.
  const autoBaseSaasFee = useMemo(() => {
    const middleTierClients = clientsHydrated.filter(
      (c) => c.ncua && tierForAssets(c.ncua.assets).id === MIDDLE_TIER_ID,
    );
    if (middleTierClients.length === 0) return null;

    const mathProps: RepricingMathProps = {
      loanBps: props.loanBps,
      depositBps: props.depositBps,
      loanPenetration: props.loanPenetration,
      depositPenetration: props.depositPenetration,
      depositChurnGrossup: props.depositChurnGrossup,
      lendingPremium,
      loanFundingRate,
      depositFundingRate,
      bpsAvgLoanSize,
      bpsAvgDepositSize,
    };
    // Use redemption result by convention — recommended SaaS is the same
    // regardless of event type at any given share, since SaaS is computed
    // from target × share before any event allocation. Auto-suggestion uses
    // the live targetSaasShare so sliding the share % updates the auto value.
    const values: number[] = [];
    for (const c of middleTierClients) {
      const r = computeBackSolves(c, c.annualFee2025, targetSaasShare, mathProps);
      if (r.redemption.feasibility === "ok") values.push(r.redemption.recommendedMonthlySaas);
    }
    if (values.length === 0) return null;
    return median(values);
  }, [
    clientsHydrated,
    targetSaasShare,
    lendingPremium,
    loanFundingRate,
    depositFundingRate,
    bpsAvgLoanSize,
    bpsAvgDepositSize,
    props.loanBps,
    props.depositBps,
    props.loanPenetration,
    props.depositPenetration,
    props.depositChurnGrossup,
  ]);

  // Effective base SaaS fee: user override if set, else auto-computed median, else 0.
  const baseSaasFee = baseSaasFeeOverride ?? autoBaseSaasFee ?? 0;

  // Build the tierMonthlySaas map: { tierId: base × multiplier }.
  // Only relevant when useRateCardMode is on; passed as override to back-solves.
  const tierMonthlySaas = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of SAAS_TIERS) {
      const mult = tierMultipliers[t.id] ?? 1;
      out[t.id] = baseSaasFee * mult;
    }
    return out;
  }, [baseSaasFee, tierMultipliers]);

  return (
    <div className="space-y-6">
      <Card title="Existing-client repricing" tone="muted">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <p className="text-sm text-slate-600 flex-1 min-w-[280px]">
            Upload your existing-client roster and the tool back-solves the recommended SaaS fee + per-event/bps prices
            per client, targeting <b>60–80% from SaaS</b> across <b>100–120% of current revenue</b>. Each client&apos;s
            module mode (lending-only / deposit-only / both) is inferred from their actual event activity in the CSV.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAssumptions(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              <Info className="w-3.5 h-3.5" />
              Assumptions
            </button>
            <a
              href="/repricing-guide.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              Read the guide →
            </a>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium">Target SaaS share:</label>
            <input
              type="number"
              min={50}
              max={90}
              step={1}
              value={targetSaasShare}
              onChange={(e) => setTargetSaasShare(Math.max(50, Math.min(90, Number(e.target.value))))}
              className="w-16 px-2 py-1 border border-slate-300 rounded font-mono text-right text-xs"
            />
            <span className="text-slate-500">% (sweet spot 60–80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium">Lending premium:</label>
            <input
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={lendingPremium}
              onChange={(e) => setLendingPremium(Math.max(1, Math.min(5, Number(e.target.value))))}
              className="w-16 px-2 py-1 border border-slate-300 rounded font-mono text-right text-xs"
            />
            <span className="text-slate-500">× (loan-event price ÷ deposit-event price)</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium">Pricing mode:</label>
            <div className="flex">
              <button
                type="button"
                onClick={() => setUseRateCardMode(false)}
                className={`text-xs px-2.5 py-1 rounded-l border font-medium transition-colors ${
                  !useRateCardMode
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Live back-solve
              </button>
              <button
                type="button"
                onClick={() => setUseRateCardMode(true)}
                className={`text-xs px-2.5 py-1 rounded-r border-y border-r font-medium transition-colors ${
                  useRateCardMode
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                Rate-card builder
              </button>
            </div>
            <span className="text-slate-500">
              {useRateCardMode
                ? "(SaaS = base × tier multiplier, flat across targets; transaction fees absorb the rest)"
                : "(SaaS scales with target & share %)"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAssumptions(true)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            …more BPS assumptions
          </button>
        </div>
      </Card>

      {showAssumptions && (
        <AssumptionsModal
          onClose={() => setShowAssumptions(false)}
          targetSaasShare={targetSaasShare}
          setTargetSaasShare={setTargetSaasShare}
          lendingPremium={lendingPremium}
          setLendingPremium={setLendingPremium}
          loanFundingRate={loanFundingRate}
          setLoanFundingRate={setLoanFundingRate}
          depositFundingRate={depositFundingRate}
          setDepositFundingRate={setDepositFundingRate}
          bpsAvgLoanSize={bpsAvgLoanSize}
          setBpsAvgLoanSize={setBpsAvgLoanSize}
          bpsAvgDepositSize={bpsAvgDepositSize}
          setBpsAvgDepositSize={setBpsAvgDepositSize}
        />
      )}

      {view === "list" && (
        <ClientListView
          clients={clientsHydrated}
          onUpload={(parsed) => persist([...clients, ...parsed])}
          onClear={() => clearClients()}
          onOpenDetail={(id) => {
            setActiveClientId(id);
            setView("detail");
          }}
          onOpenTierSummary={() => setView("tierSummary")}
          onAssociateNcua={(id, cuNumber) =>
            persist(clients.map((c) => (c.id === id ? { ...c, cuNumber } : c)))
          }
          onDelete={(id) => persist(clients.filter((c) => c.id !== id))}
        />
      )}

      {view === "detail" && activeClient && (
        <ClientDetailView
          client={activeClient}
          targetSaasSharePct={targetSaasShare}
          lendingPremium={lendingPremium}
          useRateCardMode={useRateCardMode}
          tierMonthlySaas={tierMonthlySaas}
          onBack={() => setView("list")}
          loanBps={props.loanBps}
          depositBps={props.depositBps}
          loanPenetration={props.loanPenetration}
          depositPenetration={props.depositPenetration}
          depositChurnGrossup={props.depositChurnGrossup}
          loanFundingRate={loanFundingRate}
          depositFundingRate={depositFundingRate}
          bpsAvgLoanSize={bpsAvgLoanSize}
          bpsAvgDepositSize={bpsAvgDepositSize}
        />
      )}

      {view === "tierSummary" && (
        <TierSummaryView
          clients={clientsHydrated}
          targetSaasSharePct={targetSaasShare}
          lendingPremium={lendingPremium}
          useRateCardMode={useRateCardMode}
          tierMonthlySaas={tierMonthlySaas}
          baseSaasFee={baseSaasFee}
          setBaseSaasFee={(v) => setBaseSaasFeeOverride(v)}
          tierMultipliers={tierMultipliers}
          setTierMultiplier={(tierId, v) =>
            setTierMultipliers((prev) => ({ ...prev, [tierId]: v }))
          }
          resetTierMultipliers={() => {
            setTierMultipliers({ ...DEFAULT_TIER_MULTIPLIERS });
            setBaseSaasFeeOverride(null);
          }}
          autoBaseSaasFee={autoBaseSaasFee}
          billingOption={tierBillingOption}
          setBillingOption={setTierBillingOption}
          onBack={() => setView("list")}
          loanBps={props.loanBps}
          depositBps={props.depositBps}
          loanPenetration={props.loanPenetration}
          depositPenetration={props.depositPenetration}
          depositChurnGrossup={props.depositChurnGrossup}
          loanFundingRate={loanFundingRate}
          depositFundingRate={depositFundingRate}
          bpsAvgLoanSize={bpsAvgLoanSize}
          bpsAvgDepositSize={bpsAvgDepositSize}
        />
      )}
    </div>
  );
}

// ============================================================================
// Client List view
// ============================================================================

function ClientListView({
  clients,
  onUpload,
  onClear,
  onOpenDetail,
  onOpenTierSummary,
  onAssociateNcua,
  onDelete,
}: {
  clients: ClientWithNcua[];
  onUpload: (parsed: ExistingClient[]) => void;
  onClear: () => void;
  onOpenDetail: (id: string) => void;
  onOpenTierSummary: () => void;
  onAssociateNcua: (id: string, cuNumber: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const [uploadResult, setUploadResult] = useState<{ warnings: string[]; errors: string[] } | null>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = parseCsv(text);
      if (result.errors.length === 0 && result.clients.length > 0) {
        onUpload(result.clients);
      }
      setUploadResult({ warnings: result.warnings, errors: result.errors });
    };
    reader.readAsText(file);
  }

  function handleDownloadSample() {
    const blob = new Blob([buildSampleCsv()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "movemint-clients-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJson() {
    if (clients.length === 0) return;
    const stripped = clients.map(({ ncua, ...rest }) => {
      void ncua;
      return rest;
    });
    const blob = new Blob([JSON.stringify(stripped, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "movemint-clients.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card title="Upload client data">
        <p className="text-sm text-slate-600 mb-4">
          Upload a CSV with one row per client. Required columns:
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 font-mono text-xs text-slate-700 overflow-x-auto">
          {REQUIRED_CSV_COLUMNS.join(", ")}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Module mode is inferred per client: <b>0 in all lending columns</b> = deposit-only · <b>0 in all deposit
          columns</b> = lending-only · <b>activity on both sides</b> = both modules.
        </p>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={handleDownloadSample}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download sample CSV
          </button>
          {clients.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete all ${clients.length} clients from local storage?`)) onClear();
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-sm font-medium rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            </>
          )}
        </div>

        {uploadResult && (uploadResult.warnings.length > 0 || uploadResult.errors.length > 0) && (
          <div className="mt-4 space-y-2">
            {uploadResult.errors.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-800">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <FileWarning className="w-4 h-4" /> Errors — rows skipped
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {uploadResult.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {uploadResult.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <FileWarning className="w-4 h-4" /> Warnings — rows accepted but unmatched
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {uploadResult.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>

      {clients.length === 0 ? (
        <div className="bg-white p-8 md:p-12 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
          No clients uploaded yet. Drop in a CSV to get started, or download the sample to see the expected format.
        </div>
      ) : (
        <Card
          title={
            <div className="flex items-center justify-between gap-4">
              <span>Client roster ({clients.length})</span>
              <button
                type="button"
                onClick={onOpenTierSummary}
                className="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
              >
                View tier summary →
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="text-left py-2 font-medium">Name</th>
                  <th className="text-left py-2 font-medium">NCUA</th>
                  <th className="text-right py-2 font-medium">Assets</th>
                  <th className="text-right py-2 font-medium">Tier</th>
                  <th className="text-left py-2 font-medium">Mode</th>
                  <th className="text-right py-2 font-medium">2025 fee</th>
                  <th className="text-right py-2 font-medium">Total events</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const totalEvents =
                    c.redemptionsLending + c.redemptionsDeposit +
                    c.applicationsLending + c.applicationsDeposit +
                    c.offersGeneratedLending + c.offersGeneratedDeposit;
                  const tier = c.ncua ? tierForAssets(c.ncua.assets) : null;
                  const mode = clientMode(c);
                  return (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(c.id)}
                          className="hover:underline text-left"
                        >
                          {c.name}
                        </button>
                      </td>
                      <td className="py-2">
                        {c.ncua ? (
                          <span className="text-xs text-slate-500">
                            {c.ncua.name} · {c.ncua.state}
                          </span>
                        ) : (
                          <NcuaAssociatePicker
                            currentCuNumber={c.cuNumber}
                            onPick={(cuNumber) => onAssociateNcua(c.id, cuNumber)}
                          />
                        )}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {c.ncua ? fmtUSD(c.ncua.assets) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-2 text-right text-xs text-slate-600">
                        {tier ? tier.label : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-2">
                        <ModeBadge mode={mode} />
                      </td>
                      <td className="py-2 text-right font-mono">{fmtUSDExact(c.annualFee2025)}</td>
                      <td className="py-2 text-right font-mono text-slate-600">{fmtCount(totalEvents)}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove ${c.name}?`)) onDelete(c.id);
                          }}
                          className="text-rose-600 hover:text-rose-800"
                          aria-label={`Delete ${c.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function ModeBadge({ mode }: { mode: ClientMode }) {
  const styles: Record<ClientMode, string> = {
    lending: "bg-blue-100 text-blue-800",
    deposit: "bg-violet-100 text-violet-800",
    both: "bg-emerald-100 text-emerald-800",
    none: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold ${styles[mode]}`}>
      {MODE_LABELS[mode]}
    </span>
  );
}

function NcuaAssociatePicker({
  currentCuNumber,
  onPick,
}: {
  currentCuNumber: string | null;
  onPick: (cuNumber: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const matches = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return ncuaData.cus
      .filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase() === q)
      .slice(0, 10);
  }, [search]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-blue-600 hover:text-blue-800 underline"
      >
        {currentCuNumber ? `unmatched (${currentCuNumber})` : "associate…"}
      </button>
    );
  }

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1">
        <Search className="w-3 h-3 text-slate-400" />
        <input
          type="text"
          autoFocus
          placeholder="Search NCUA…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-40 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
      {matches.length > 0 && (
        <div className="absolute z-20 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {matches.map((cu) => (
            <button
              key={cu.cu}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(cu.cu);
                setOpen(false);
                setSearch("");
              }}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <div className="font-medium text-slate-900">{cu.name}</div>
              <div className="text-[10px] text-slate-500">
                {cu.state} · {fmtUSD(cu.assets)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Per-client detail view — 5×4 grid (revenue targets × pricing models)
// ============================================================================

type RepricingMathProps = {
  loanBps: LoanTakeRates;
  depositBps: DepositTakeRates;
  loanPenetration: number;
  depositPenetration: number;
  depositChurnGrossup: number;
  /** Used by per-event back-solves — lending events priced this many × deposit events. */
  lendingPremium: number;
  /** % of loan applications that fund (used to derive funded volume for BPS). */
  loanFundingRate: number;
  /** % of deposit applications that fund. */
  depositFundingRate: number;
  /** Blended avg funded loan size, $ — for BPS calc. */
  bpsAvgLoanSize: number;
  /** Avg new-deposit account size, $ — for BPS calc. */
  bpsAvgDepositSize: number;
};

function ClientDetailView({
  client,
  targetSaasSharePct,
  lendingPremium,
  useRateCardMode,
  tierMonthlySaas,
  onBack,
  ...partialMath
}: {
  client: ClientWithNcua;
  targetSaasSharePct: number;
  lendingPremium: number;
  useRateCardMode: boolean;
  tierMonthlySaas: Record<string, number>;
  onBack: () => void;
} & Omit<RepricingMathProps, "lendingPremium">) {
  const mathProps: RepricingMathProps = { ...partialMath, lendingPremium };
  const tier = client.ncua ? tierForAssets(client.ncua.assets) : null;
  const mode = clientMode(client);

  // In rate-card mode, SaaS = base × tier multiplier — same value at every
  // revenue target. Otherwise live back-solve fills the SaaS slot.
  const override = buildRateCardOverride(client, useRateCardMode, tierMonthlySaas);
  const isLocked = override != null;

  const cells = REVENUE_TARGETS.map((mult) => {
    const targetRev = client.annualFee2025 * mult;
    const r = computeBackSolves(client, targetRev, targetSaasSharePct, mathProps, override);
    return {
      mult,
      targetRev,
      lockedRedemption: isLocked,
      lockedApplication: isLocked,
      lockedClick: isLocked,
      lockedOfferGen: isLocked,
      lockedBps: isLocked,
      redemption: r.redemption,
      application: r.application,
      click: r.click,
      offerGen: r.offerGen,
      bps: r.bps,
    };
  });

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to client list
      </button>

      <Card
        title={
          <div className="flex items-center gap-3">
            <span>{client.name}</span>
            <ModeBadge mode={mode} />
          </div>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <DetailStat label="2025 annual fee" value={fmtUSDExact(client.annualFee2025)} />
          <DetailStat label="Tier" value={tier ? tier.label : "—"} />
          <DetailStat label="Assets" value={client.ncua ? fmtUSD(client.ncua.assets) : "—"} />
          <DetailStat label="Members" value={client.ncua ? client.ncua.members.toLocaleString() : "—"} />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <EventStat label="Redemptions" loan={client.redemptionsLending} deposit={client.redemptionsDeposit} mode={mode} />
          <EventStat label="Applications" loan={client.applicationsLending} deposit={client.applicationsDeposit} mode={mode} />
          <EventStat label="Offers generated" loan={client.offersGeneratedLending} deposit={client.offersGeneratedDeposit} mode={mode} />
        </div>
      </Card>

      {useRateCardMode && tier && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          🔒 <b>Rate-card mode on.</b> SaaS for this client is fixed at{" "}
          <b>${Math.round(tierMonthlySaas[tier.id] ?? 0).toLocaleString()}/mo</b> (base × {tier.label} multiplier),
          flat across all revenue targets. Per-event prices and BPS rates absorb the difference.
        </div>
      )}

      <Card title="Recommended pricing — revenue targets × pricing models">
        <p className="text-sm text-slate-600 mb-4">
          Each cell shows the recommended SaaS fee + per-event price (or BPS rates + floor) needed to hit that
          revenue target with <b>{targetSaasSharePct}% of revenue from SaaS</b> (or floor for BPS).
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-medium text-slate-500 uppercase tracking-wider">Target</th>
                <th className="text-left py-2 font-medium text-slate-500 uppercase tracking-wider">BPS</th>
                <th className="text-left py-2 font-medium text-slate-500 uppercase tracking-wider">Per redemption</th>
                <th className="text-left py-2 font-medium text-slate-500 uppercase tracking-wider">Per application</th>
                <th className="text-left py-2 font-medium text-slate-500 uppercase tracking-wider">Per click</th>
                <th className="text-left py-2 font-medium text-slate-500 uppercase tracking-wider">Per offer gen</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((c) => (
                <tr key={c.mult} className="border-b border-slate-100 last:border-0 align-top">
                  <td className="py-3 pr-3">
                    <div className="font-semibold text-slate-900">{(c.mult * 100).toFixed(0)}%</div>
                    <div className="font-mono text-slate-500">{fmtUSDExact(c.targetRev)}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <BpsCell bps={c.bps} mode={mode} locked={c.lockedBps} />
                  </td>
                  <SaasEventCellWrap result={c.redemption} mode={mode} unit="redemption" locked={c.lockedRedemption} />
                  <SaasEventCellWrap result={c.application} mode={mode} unit="application" locked={c.lockedApplication} />
                  <SaasEventCellWrap result={c.click} mode={mode} unit="click" locked={c.lockedClick} />
                  <SaasEventCellWrap result={c.offerGen} mode={mode} unit="offer" locked={c.lockedOfferGen} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Compute back-solves for one client at one revenue target. Mode-aware:
// lending-only zeroes deposit counts before back-solving (so the per-event
// price floats up on lending alone); deposit-only does the inverse.
//
// Optional overrides — when provided, fix SaaS / floor at those values and
// let per-event/bps prices absorb the gap. Used when the SaaS lock is on,
// passing the tier+mode median computed at 100% target.
function computeBackSolves(
  client: ClientWithNcua,
  targetRev: number,
  targetSaasSharePct: number,
  mathProps: RepricingMathProps,
  overrides?: {
    saasMonthly?: number;
    floorMonthly?: number;
  },
) {
  const mode = clientMode(client);

  // Mode-filter the event counts (now includes clicks)
  const counts = filterCountsByMode(
    {
      redemptionsLoan: client.redemptionsLending,
      redemptionsDeposit: client.redemptionsDeposit,
      applicationsLoan: client.applicationsLending,
      applicationsDeposit: client.applicationsDeposit,
      clicksLoan: client.clicksLending,
      clicksDeposit: client.clicksDeposit,
      offersGenLoan: client.offersGeneratedLending,
      offersGenDeposit: client.offersGeneratedDeposit,
    },
    mode,
  );

  const redemption = backSolveSaasPerEvent({
    targetTotalRev: targetRev,
    targetSaasSharePct,
    eventCountLoan: counts.redemptionsLoan,
    eventCountDeposit: counts.redemptionsDeposit,
    lendingPremium: mathProps.lendingPremium,
    overrideMonthlySaas: overrides?.saasMonthly,
  });
  const application = backSolveSaasPerEvent({
    targetTotalRev: targetRev,
    targetSaasSharePct,
    eventCountLoan: counts.applicationsLoan,
    eventCountDeposit: counts.applicationsDeposit,
    lendingPremium: mathProps.lendingPremium,
    overrideMonthlySaas: overrides?.saasMonthly,
  });
  const click = backSolveSaasPerEvent({
    targetTotalRev: targetRev,
    targetSaasSharePct,
    eventCountLoan: counts.clicksLoan,
    eventCountDeposit: counts.clicksDeposit,
    lendingPremium: mathProps.lendingPremium,
    overrideMonthlySaas: overrides?.saasMonthly,
  });
  const offerGen = backSolveSaasPerEvent({
    targetTotalRev: targetRev,
    targetSaasSharePct,
    eventCountLoan: counts.offersGenLoan,
    eventCountDeposit: counts.offersGenDeposit,
    lendingPremium: mathProps.lendingPremium,
    overrideMonthlySaas: overrides?.saasMonthly,
  });

  // BPS back-solve: derives funded volume from the client's applications +
  // funding rates + avg sizes — no NCUA dependency. Mode-filter the
  // applications so single-module clients don't get bps for the unused side.
  const bpsApplicationsLoan =
    mode === "deposit" ? 0 : client.applicationsLending;
  const bpsApplicationsDeposit =
    mode === "lending" ? 0 : client.applicationsDeposit;
  const bps = backSolveBps({
    targetTotalRev: targetRev,
    targetSaasSharePct,
    applicationsLoan: bpsApplicationsLoan,
    applicationsDeposit: bpsApplicationsDeposit,
    loanFundingRate: mathProps.loanFundingRate / 100,
    depositFundingRate: mathProps.depositFundingRate / 100,
    avgLoanSize: mathProps.bpsAvgLoanSize,
    avgDepositSize: mathProps.bpsAvgDepositSize,
    lendingPremium: mathProps.lendingPremium,
    overrideMonthlyFloor: overrides?.floorMonthly,
  });

  return { redemption, application, click, offerGen, bps };
}

/**
 * Build the override payload for one client when rate-card mode is on.
 * The effective SaaS / floor for that client = base × tier multiplier,
 * applied uniformly regardless of revenue target or billing option.
 *
 * When rate-card mode is off, returns undefined (live back-solve takes over).
 * When the client has no NCUA match, returns undefined (no tier to look up).
 */
function buildRateCardOverride(
  client: ClientWithNcua,
  useRateCardMode: boolean,
  tierMonthlySaas: Record<string, number>,
): { saasMonthly?: number; floorMonthly?: number } | undefined {
  if (!useRateCardMode || !client.ncua) return undefined;
  const tier = tierForAssets(client.ncua.assets);
  const monthly = tierMonthlySaas[tier.id];
  if (monthly == null) return undefined;
  // Same number used for both per-event SaaS and BPS floor — they're the
  // same lever conceptually (the base monthly fee Movemint charges).
  return { saasMonthly: monthly, floorMonthly: monthly };
}

function filterCountsByMode<T extends Record<string, number>>(counts: T, mode: ClientMode): T {
  if (mode === "lending") {
    const out = { ...counts } as T;
    Object.keys(out).forEach((k) => {
      if (k.toLowerCase().includes("deposit")) (out as Record<string, number>)[k] = 0;
    });
    return out;
  }
  if (mode === "deposit") {
    const out = { ...counts } as T;
    Object.keys(out).forEach((k) => {
      if (k.toLowerCase().includes("loan")) (out as Record<string, number>)[k] = 0;
    });
    return out;
  }
  return counts;
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</div>
      <div className="text-sm font-semibold text-slate-900 font-mono">{value}</div>
    </div>
  );
}

function EventStat({
  label,
  loan,
  deposit,
  mode,
}: {
  label: string;
  loan: number;
  deposit: number;
  mode: ClientMode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</div>
      <div className="font-mono text-sm">
        <span className={mode === "deposit" ? "text-slate-300 line-through" : "text-slate-900"}>
          Loan: {fmtCount(loan)}
        </span>{" "}
        ·{" "}
        <span className={mode === "lending" ? "text-slate-300 line-through" : "text-slate-900"}>
          Dep: {fmtCount(deposit)}
        </span>
      </div>
    </div>
  );
}

function SaasEventCellWrap({
  result,
  mode,
  unit,
  locked,
}: {
  result: ReturnType<typeof backSolveSaasPerEvent>;
  mode: ClientMode;
  unit: string;
  locked?: boolean;
}) {
  return (
    <td className="py-3 pr-3">
      <SaasEventCell result={result} mode={mode} unit={unit} locked={locked} />
    </td>
  );
}

function SaasEventCell({
  result,
  mode,
  unit,
  locked,
}: {
  result: ReturnType<typeof backSolveSaasPerEvent>;
  mode: ClientMode;
  unit: string;
  locked?: boolean;
}) {
  if (result.feasibility === "no_events") {
    return (
      <div className="rounded-lg p-2 bg-slate-50 border border-slate-200 text-slate-400 italic">no events</div>
    );
  }
  return (
    <div className="rounded-lg p-2 bg-emerald-50 border border-emerald-200">
      <div className="font-mono text-slate-900 font-semibold flex items-center gap-1">
        {locked && <span title="Locked at tier-median (100% target)">🔒</span>}
        <span className={locked ? "text-slate-600" : ""}>
          ${result.recommendedMonthlySaas.toFixed(0)}/mo SaaS
        </span>
      </div>
      {(mode === "lending" || mode === "both") && result.pricePerEventLoan > 0 && (
        <div className="font-mono text-slate-900 mt-0.5">${result.pricePerEventLoan.toFixed(2)} loan</div>
      )}
      {(mode === "deposit" || mode === "both") && result.pricePerEventDeposit > 0 && (
        <div className="font-mono text-slate-900">${result.pricePerEventDeposit.toFixed(2)} deposit</div>
      )}
      <div className="text-[10px] text-slate-500 mt-0.5">per {unit}</div>
    </div>
  );
}

function BpsCell({
  bps,
  mode,
  locked,
}: {
  bps: ReturnType<typeof backSolveBps>;
  mode: ClientMode;
  locked?: boolean;
}) {
  if (bps.feasibility === "no_volume") {
    return (
      <div className="rounded-lg p-2 bg-slate-50 border border-slate-200 text-slate-400 italic">no funded volume</div>
    );
  }
  return (
    <div className="rounded-lg p-2 bg-emerald-50 border border-emerald-200">
      <div className="font-mono text-slate-900 font-semibold flex items-center gap-1">
        {locked && <span title="Locked at tier-median (100% target)">🔒</span>}
        <span className={locked ? "text-slate-600" : ""}>
          ${bps.recommendedMonthlyFloor.toFixed(0)}/mo floor
        </span>
      </div>
      {(mode === "lending" || mode === "both") && bps.recommendedLoanBps > 0 && (
        <div className="font-mono text-slate-900 mt-0.5">
          {bps.recommendedLoanBps.toFixed(1)} bps loan
        </div>
      )}
      {(mode === "deposit" || mode === "both") && bps.recommendedDepositBps > 0 && (
        <div className="font-mono text-slate-900">
          {bps.recommendedDepositBps.toFixed(1)} bps deposit
        </div>
      )}
      <div className="text-[10px] text-slate-500 mt-0.5">on funded volume</div>
    </div>
  );
}

// ============================================================================
// Tier summary view — 3 columns per tier (Lending-only / Deposit-only / Both)
// ============================================================================

function TierSummaryView({
  clients,
  targetSaasSharePct,
  lendingPremium,
  useRateCardMode,
  tierMonthlySaas,
  baseSaasFee,
  setBaseSaasFee,
  tierMultipliers,
  setTierMultiplier,
  resetTierMultipliers,
  autoBaseSaasFee,
  billingOption,
  setBillingOption,
  onBack,
  ...partialMath
}: {
  clients: ClientWithNcua[];
  targetSaasSharePct: number;
  lendingPremium: number;
  useRateCardMode: boolean;
  tierMonthlySaas: Record<string, number>;
  baseSaasFee: number;
  setBaseSaasFee: (v: number) => void;
  tierMultipliers: Record<string, number>;
  setTierMultiplier: (tierId: string, v: number) => void;
  resetTierMultipliers: () => void;
  autoBaseSaasFee: number | null;
  billingOption: BillingOption;
  setBillingOption: (b: BillingOption) => void;
  onBack: () => void;
} & Omit<RepricingMathProps, "lendingPremium">) {
  const mathProps: RepricingMathProps = { ...partialMath, lendingPremium };
  // Default expanded so the user sees it on first switch into rate-card mode.
  // Collapsing hides the inputs but doesn't change any values — so toggling
  // the targetSaasSharePct slider with the builder collapsed lets you watch
  // the tier tables below recompute.
  const [builderExpanded, setBuilderExpanded] = useState(true);
  const byTier = useMemo(() => {
    const grouped = new Map<string, ClientWithNcua[]>();
    SAAS_TIERS.forEach((t) => grouped.set(t.id, []));
    clients.forEach((c) => {
      if (!c.ncua) return;
      const tier = tierForAssets(c.ncua.assets);
      grouped.get(tier.id)?.push(c);
    });
    return grouped;
  }, [clients]);

  const unmatched = clients.filter((c) => !c.ncua).length;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" /> Back to client list
      </button>

      <Card title="Tier summary — recommended pricing per asset tier">
        <p className="text-sm text-slate-600 mb-3">
          For each tier, the recommended pricing uses the <b>median client</b> at <b>{targetSaasSharePct}% from
          SaaS</b>. Three columns per tier: <b>Lending-only</b> clients, <b>Deposit-only</b> clients, and{" "}
          <b>Both modules</b>. Pick a single billing option below to compare across tiers.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-600 font-medium mr-1">Billing option:</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(BILLING_OPTION_LABELS) as BillingOption[]).map((opt) => {
              const isActive = billingOption === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBillingOption(opt)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {BILLING_OPTION_LABELS[opt]}
                </button>
              );
            })}
          </div>
        </div>
        {unmatched > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800 mt-3">
            <FileWarning className="inline w-3.5 h-3.5 mr-1" />
            {unmatched} client{unmatched === 1 ? "" : "s"} not associated with NCUA — excluded from tier analysis.
          </div>
        )}
      </Card>

      {/* Rate-card builder controls — only when in rate-card mode. Collapsible so
          you can hide it and watch tier tables recompute as you slide other controls. */}
      {useRateCardMode && (
        <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setBuilderExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              {builderExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
              Rate-card builder
            </h3>
            {!builderExpanded && (
              <span className="text-xs text-slate-500 font-mono">
                Base ${Math.round(baseSaasFee).toLocaleString()}/mo · click to expand
              </span>
            )}
          </button>
          {builderExpanded && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-slate-600">
              SaaS for each tier = <b>base × tier multiplier</b>, applied flat across every revenue target.
              Per-event prices and BPS rates absorb whatever&apos;s needed to hit each target.
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-600 font-medium">Base SaaS fee (anchor: $2B–$3B tier)</label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    value={Math.round(baseSaasFee)}
                    onChange={(e) => setBaseSaasFee(Math.max(0, Number(e.target.value)))}
                    step={250}
                    min={0}
                    className="w-32 px-2 py-1 border border-slate-300 rounded text-sm font-mono text-right"
                  />
                  <span className="text-xs text-slate-500">/mo</span>
                  {autoBaseSaasFee != null && Math.abs(baseSaasFee - autoBaseSaasFee) > 1 && (
                    <button
                      type="button"
                      onClick={() => setBaseSaasFee(autoBaseSaasFee)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                      title={`Auto-suggested: $${Math.round(autoBaseSaasFee).toLocaleString()}/mo (median of middle-tier clients' back-solved SaaS at current target share)`}
                    >
                      reset to ${Math.round(autoBaseSaasFee).toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={resetTierMultipliers}
                className="text-xs px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors whitespace-nowrap"
              >
                Reset all multipliers
              </button>
            </div>

            {/* Per-tier multiplier table */}
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-1 font-medium text-slate-500 uppercase tracking-wider">Tier</th>
                    <th className="text-right py-1 font-medium text-slate-500 uppercase tracking-wider">Multiplier</th>
                    <th className="text-right py-1 font-medium text-slate-500 uppercase tracking-wider">Effective SaaS / mo</th>
                    <th className="text-right py-1 font-medium text-slate-500 uppercase tracking-wider">Annual</th>
                  </tr>
                </thead>
                <tbody>
                  {SAAS_TIERS.map((t) => {
                    const mult = tierMultipliers[t.id] ?? 1;
                    const monthly = baseSaasFee * mult;
                    const isAnchor = t.id === MIDDLE_TIER_ID;
                    return (
                      <tr key={t.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 font-medium text-slate-800">
                          {t.label}
                          {isAnchor && (
                            <span className="ml-2 text-[9px] uppercase tracking-wider text-blue-600 font-semibold">
                              Anchor
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            value={mult}
                            onChange={(e) =>
                              setTierMultiplier(t.id, Math.max(0, Number(e.target.value)))
                            }
                            step={0.1}
                            min={0}
                            className="w-20 px-2 py-1 border border-slate-300 rounded text-xs font-mono text-right"
                          />
                          <span className="text-xs text-slate-500 ml-1">×</span>
                        </td>
                        <td className="py-2 text-right font-mono font-semibold text-slate-900">
                          ${Math.round(monthly).toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-mono text-slate-500">
                          ${Math.round(monthly * 12).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>
      )}

      {SAAS_TIERS.map((tier) => {
        const tierClients = byTier.get(tier.id) ?? [];
        return (
          <TierBlock
            key={tier.id}
            tierLabel={tier.label}
            clients={tierClients}
            targetSaasSharePct={targetSaasSharePct}
            billingOption={billingOption}
            useRateCardMode={useRateCardMode}
            tierMonthlySaas={tierMonthlySaas}
            {...mathProps}
          />
        );
      })}
    </div>
  );
}

function TierBlock({
  tierLabel,
  clients,
  targetSaasSharePct,
  billingOption,
  useRateCardMode,
  tierMonthlySaas,
  ...mathProps
}: {
  tierLabel: string;
  clients: ClientWithNcua[];
  targetSaasSharePct: number;
  billingOption: BillingOption;
  useRateCardMode: boolean;
  tierMonthlySaas: Record<string, number>;
} & RepricingMathProps) {
  const lendingClients = clients.filter((c) => clientMode(c) === "lending");
  const depositClients = clients.filter((c) => clientMode(c) === "deposit");
  const bothClients = clients.filter((c) => clientMode(c) === "both");

  if (clients.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700">{tierLabel}</h3>
        <div className="text-xs text-slate-400 mt-1">No clients in this tier</div>
      </div>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-baseline justify-between gap-3">
          <span>{tierLabel}</span>
          <span className="text-xs font-mono text-slate-500">
            {clients.length} client{clients.length === 1 ? "" : "s"} · {lendingClients.length} L · {depositClients.length} D · {bothClients.length} B
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ModeColumn
          title="Lending-only"
          accent="bg-blue-100 text-blue-800"
          clients={lendingClients}
          mode="lending"
          targetSaasSharePct={targetSaasSharePct}
          billingOption={billingOption}
          useRateCardMode={useRateCardMode}
          tierMonthlySaas={tierMonthlySaas}
          {...mathProps}
        />
        <ModeColumn
          title="Deposit-only"
          accent="bg-violet-100 text-violet-800"
          clients={depositClients}
          mode="deposit"
          targetSaasSharePct={targetSaasSharePct}
          billingOption={billingOption}
          useRateCardMode={useRateCardMode}
          tierMonthlySaas={tierMonthlySaas}
          {...mathProps}
        />
        <ModeColumn
          title="Both modules"
          accent="bg-emerald-100 text-emerald-800"
          clients={bothClients}
          mode="both"
          targetSaasSharePct={targetSaasSharePct}
          billingOption={billingOption}
          useRateCardMode={useRateCardMode}
          tierMonthlySaas={tierMonthlySaas}
          {...mathProps}
        />
      </div>
    </Card>
  );
}

function ModeColumn({
  title,
  accent,
  clients,
  mode,
  targetSaasSharePct,
  billingOption,
  useRateCardMode,
  tierMonthlySaas,
  ...mathProps
}: {
  title: string;
  accent: string;
  clients: ClientWithNcua[];
  mode: ClientMode;
  targetSaasSharePct: number;
  billingOption: BillingOption;
  useRateCardMode: boolean;
  tierMonthlySaas: Record<string, number>;
} & RepricingMathProps) {
  void mode;

  if (clients.length === 0) {
    return (
      <div className="border border-dashed border-slate-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold ${accent}`}>
            {title}
          </span>
        </div>
        <div className="text-xs text-slate-400 italic">No {title.toLowerCase()} clients in this tier</div>
      </div>
    );
  }

  const isBps = billingOption === "bps";

  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold ${accent}`}>
          {title}
        </span>
        <span className="text-[11px] text-slate-500">
          {clients.length} client{clients.length === 1 ? "" : "s"}
        </span>
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-1 font-medium text-slate-500">Target</th>
            {isBps ? (
              <>
                <th className="text-left py-1 font-medium text-slate-500">Floor / mo</th>
                <th className="text-left py-1 font-medium text-slate-500">BPS on funded volume</th>
              </>
            ) : (
              <>
                <th className="text-left py-1 font-medium text-slate-500">SaaS / mo</th>
                <th className="text-left py-1 font-medium text-slate-500">Price per event</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {REVENUE_TARGETS.map((mult) => {
            const summary = summarizeTierMode(
              clients,
              mult,
              targetSaasSharePct,
              billingOption,
              mathProps,
              useRateCardMode,
              tierMonthlySaas,
            );
            return (
              <tr key={mult} className="border-b border-slate-50 last:border-0 align-top">
                <td className="py-2 pr-2 font-semibold text-slate-900">{(mult * 100).toFixed(0)}%</td>
                {isBps ? (
                  <>
                    <td className="py-2 pr-2 font-mono">
                      {summary.medianBpsFloor != null ? (
                        <>
                          <div>${Math.round(summary.medianBpsFloor).toLocaleString()}</div>
                          {summary.minBpsFloor !== summary.maxBpsFloor && (
                            <div className="text-[10px] text-slate-400">
                              ${Math.round(summary.minBpsFloor!).toLocaleString()}–
                              ${Math.round(summary.maxBpsFloor!).toLocaleString()}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-2 font-mono">
                      {summary.medianBpsDisplay ?? <span className="text-slate-400">—</span>}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 pr-2 font-mono">
                      {summary.medianMonthlySaas != null ? (
                        <>
                          <div>${Math.round(summary.medianMonthlySaas).toLocaleString()}</div>
                          {summary.minMonthlySaas !== summary.maxMonthlySaas && (
                            <div className="text-[10px] text-slate-400">
                              ${Math.round(summary.minMonthlySaas!).toLocaleString()}–
                              ${Math.round(summary.maxMonthlySaas!).toLocaleString()}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-2 font-mono">
                      {summary.medianPerEventDisplay ?? <span className="text-slate-400">—</span>}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type TierModeSummary = {
  medianMonthlySaas: number | null;
  minMonthlySaas: number | null;
  maxMonthlySaas: number | null;
  /** "$X loan / $Y dep" display for median per-event price under the selected event type. */
  medianPerEventDisplay: string | null;
  /** "X bps loan / Y bps dep" display for median bps. */
  medianBpsDisplay: string | null;
  medianBpsFloor: number | null;
  minBpsFloor: number | null;
  maxBpsFloor: number | null;
};

function summarizeTierMode(
  clients: ClientWithNcua[],
  mult: number,
  targetSaasSharePct: number,
  billingOption: BillingOption,
  mathProps: RepricingMathProps,
  useRateCardMode: boolean,
  tierMonthlySaas: Record<string, number>,
): TierModeSummary {
  const monthlySaasValues: number[] = [];
  const perEventLoanValues: number[] = [];
  const perEventDepositValues: number[] = [];
  const bpsLoanValues: number[] = [];
  const bpsDepositValues: number[] = [];
  const bpsFloorValues: number[] = [];

  for (const c of clients) {
    const targetRev = c.annualFee2025 * mult;
    const overrides = buildRateCardOverride(c, useRateCardMode, tierMonthlySaas);
    const r = computeBackSolves(c, targetRev, targetSaasSharePct, mathProps, overrides);

    // Pick the result for the active billing option
    const eventResult =
      billingOption === "redemption"
        ? r.redemption
        : billingOption === "application"
          ? r.application
          : billingOption === "click"
            ? r.click
            : billingOption === "offerGen"
              ? r.offerGen
              : null;

    if (eventResult && eventResult.feasibility === "ok") {
      monthlySaasValues.push(eventResult.recommendedMonthlySaas);
      if (eventResult.pricePerEventLoan > 0) perEventLoanValues.push(eventResult.pricePerEventLoan);
      if (eventResult.pricePerEventDeposit > 0) perEventDepositValues.push(eventResult.pricePerEventDeposit);
    }
    if (billingOption === "bps" && r.bps.feasibility === "ok") {
      bpsFloorValues.push(r.bps.recommendedMonthlyFloor);
      if (r.bps.recommendedLoanBps > 0) bpsLoanValues.push(r.bps.recommendedLoanBps);
      if (r.bps.recommendedDepositBps > 0) bpsDepositValues.push(r.bps.recommendedDepositBps);
    }
  }

  const perEventParts: string[] = [];
  if (perEventLoanValues.length > 0) {
    perEventParts.push(`$${median(perEventLoanValues).toFixed(2)} loan`);
  }
  if (perEventDepositValues.length > 0) {
    perEventParts.push(`$${median(perEventDepositValues).toFixed(2)} dep`);
  }

  const bpsParts: string[] = [];
  if (bpsLoanValues.length > 0) {
    bpsParts.push(`${median(bpsLoanValues).toFixed(1)} bps loan`);
  }
  if (bpsDepositValues.length > 0) {
    bpsParts.push(`${median(bpsDepositValues).toFixed(1)} bps dep`);
  }

  return {
    medianMonthlySaas: monthlySaasValues.length > 0 ? median(monthlySaasValues) : null,
    minMonthlySaas: monthlySaasValues.length > 0 ? Math.min(...monthlySaasValues) : null,
    maxMonthlySaas: monthlySaasValues.length > 0 ? Math.max(...monthlySaasValues) : null,
    medianPerEventDisplay: perEventParts.length > 0 ? perEventParts.join(" / ") : null,
    medianBpsDisplay: bpsParts.length > 0 ? bpsParts.join(" / ") : null,
    medianBpsFloor: bpsFloorValues.length > 0 ? median(bpsFloorValues) : null,
    minBpsFloor: bpsFloorValues.length > 0 ? Math.min(...bpsFloorValues) : null,
    maxBpsFloor: bpsFloorValues.length > 0 ? Math.max(...bpsFloorValues) : null,
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

// ============================================================================
// Assumptions modal — surfaces every assumption the back-solve depends on
// ============================================================================

function AssumptionsModal({
  onClose,
  targetSaasShare,
  setTargetSaasShare,
  lendingPremium,
  setLendingPremium,
  loanFundingRate,
  setLoanFundingRate,
  depositFundingRate,
  setDepositFundingRate,
  bpsAvgLoanSize,
  setBpsAvgLoanSize,
  bpsAvgDepositSize,
  setBpsAvgDepositSize,
}: {
  onClose: () => void;
  targetSaasShare: number;
  setTargetSaasShare: (v: number) => void;
  lendingPremium: number;
  setLendingPremium: (v: number) => void;
  loanFundingRate: number;
  setLoanFundingRate: (v: number) => void;
  depositFundingRate: number;
  setDepositFundingRate: (v: number) => void;
  bpsAvgLoanSize: number;
  setBpsAvgLoanSize: (v: number) => void;
  bpsAvgDepositSize: number;
  setBpsAvgDepositSize: (v: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-start justify-between rounded-t-xl">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Repricing assumptions</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Every assumption the back-solve depends on. Edits apply across the whole tool.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 -mr-1 -mt-1 p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <AssumptionGroup title="Strategic mix">
            <AssumptionRow
              label="Target SaaS share"
              hint="Share of total client revenue from the SaaS / floor (rest is per-event / bps revenue)."
              value={targetSaasShare}
              onChange={(v) => setTargetSaasShare(Math.max(50, Math.min(90, v)))}
              suffix="%"
              min={50}
              max={90}
              step={1}
            />
            <AssumptionRow
              label="Lending premium"
              hint="Lending events / bps priced this many × deposit. Reflects that loan conversions are higher-value. Affects both per-event and BPS back-solves."
              value={lendingPremium}
              onChange={(v) => setLendingPremium(Math.max(1, Math.min(5, v)))}
              suffix="×"
              min={1}
              max={5}
              step={0.1}
            />
          </AssumptionGroup>

          <AssumptionGroup title="BPS — application-funding assumptions">
            <p className="text-xs text-slate-500 mb-2">
              The BPS back-solve estimates funded volume from the client&apos;s actual application counts (no NCUA
              dependency). Funded volume = applications × funding rate × avg size.
            </p>
            <AssumptionRow
              label="Loan funding rate"
              hint="% of loan applications that result in a funded loan. Industry typical: 30–40%."
              value={loanFundingRate}
              onChange={(v) => setLoanFundingRate(Math.max(0, Math.min(100, v)))}
              suffix="%"
              min={0}
              max={100}
              step={1}
            />
            <AssumptionRow
              label="Deposit funding rate"
              hint="% of deposit applications that result in a new account opened. Industry typical: 50–70% (less underwriting friction than loans)."
              value={depositFundingRate}
              onChange={(v) => setDepositFundingRate(Math.max(0, Math.min(100, v)))}
              suffix="%"
              min={0}
              max={100}
              step={1}
            />
            <AssumptionRow
              label="Avg funded loan size"
              hint="Blended average across all loan types. Default $35K reflects a mix of auto, personal, and mortgage. Tune higher if mortgage-heavy, lower if mostly consumer."
              value={bpsAvgLoanSize}
              onChange={(v) => setBpsAvgLoanSize(Math.max(0, v))}
              prefix="$"
              step={1000}
            />
            <AssumptionRow
              label="Avg new deposit account size"
              hint="Avg balance of a newly-opened deposit account. Default $5K is a conservative cross-product estimate."
              value={bpsAvgDepositSize}
              onChange={(v) => setBpsAvgDepositSize(Math.max(0, v))}
              prefix="$"
              step={500}
            />
          </AssumptionGroup>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <FileWarning className="inline w-3.5 h-3.5 mr-1" />
            These assumptions affect every cell in the Repricing tab (per-client detail and tier summary). Changes
            apply immediately. Reload the page to reset to defaults.
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 rounded-b-xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function AssumptionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AssumptionRow({
  label,
  hint,
  value,
  onChange,
  suffix,
  prefix,
  min,
  max,
  step,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  prefix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {prefix && <span className="text-xs text-slate-500">{prefix}</span>}
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-24 px-2 py-1 border border-slate-300 rounded font-mono text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
        </div>
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}
