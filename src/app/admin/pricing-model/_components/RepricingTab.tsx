"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Upload, Download, Trash2, FileWarning, ArrowLeft, Search } from "lucide-react";
import ncuaData from "@/data/ncua-cus.json";

import type { LoanTakeRates, DepositTakeRates } from "../_lib/types";
import { tierForAssets, SAAS_TIERS } from "../_lib/types";
import type { EventAssumptions } from "../_lib/events";
import { deriveLoanVolumes, deriveDepositVolumes } from "../_lib/events";
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
const LENDING_PREMIUM_DEFAULT = 2;   // lending events priced 2× deposit by default

type BillingOption = "bps" | "redemption" | "application" | "offerGen";

const BILLING_OPTION_LABELS: Record<BillingOption, string> = {
  bps: "BPS take-rate",
  redemption: "Per-redemption",
  application: "Per-application",
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

  function persist(next: ExistingClient[]) {
    saveClients(next);
  }

  const clientsHydrated = useMemo<ClientWithNcua[]>(
    () => clients.map((c) => attachNcua(c)),
    [clients],
  );
  const activeClient = clientsHydrated.find((c) => c.id === activeClientId) ?? null;

  return (
    <div className="space-y-6">
      <Card title="Existing-client repricing" tone="muted">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <p className="text-sm text-slate-600 flex-1 min-w-[280px]">
            Upload your existing-client roster and the tool back-solves the recommended SaaS fee + per-event/bps prices
            per client, targeting <b>60–80% from SaaS</b> across <b>100–120% of current revenue</b>. Each client&apos;s
            module mode (lending-only / deposit-only / both) is inferred from their actual event activity in the CSV.
          </p>
          <a
            href="/repricing-guide.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
          >
            Read the guide →
          </a>
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
        </div>
      </Card>

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
          onBack={() => setView("list")}
          loanBps={props.loanBps}
          depositBps={props.depositBps}
          loanPenetration={props.loanPenetration}
          depositPenetration={props.depositPenetration}
          depositChurnGrossup={props.depositChurnGrossup}
        />
      )}

      {view === "tierSummary" && (
        <TierSummaryView
          clients={clientsHydrated}
          targetSaasSharePct={targetSaasShare}
          lendingPremium={lendingPremium}
          billingOption={tierBillingOption}
          setBillingOption={setTierBillingOption}
          onBack={() => setView("list")}
          loanBps={props.loanBps}
          depositBps={props.depositBps}
          loanPenetration={props.loanPenetration}
          depositPenetration={props.depositPenetration}
          depositChurnGrossup={props.depositChurnGrossup}
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
};

function ClientDetailView({
  client,
  targetSaasSharePct,
  lendingPremium,
  onBack,
  ...partialMath
}: {
  client: ClientWithNcua;
  targetSaasSharePct: number;
  lendingPremium: number;
  onBack: () => void;
} & Omit<RepricingMathProps, "lendingPremium">) {
  const mathProps: RepricingMathProps = { ...partialMath, lendingPremium };
  const tier = client.ncua ? tierForAssets(client.ncua.assets) : null;
  const mode = clientMode(client);

  const cells = REVENUE_TARGETS.map((mult) => {
    const targetRev = client.annualFee2025 * mult;
    return {
      mult,
      targetRev,
      ...computeBackSolves(client, targetRev, targetSaasSharePct, mathProps),
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
        {!client.ncua && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <FileWarning className="inline w-4 h-4 mr-1" />
            This client is not associated with an NCUA record. SaaS+event back-solves still work, but BPS back-solve
            requires NCUA volume data.
          </div>
        )}
      </Card>

      <Card title="Recommended pricing — revenue targets × pricing models">
        <p className="text-sm text-slate-600 mb-4">
          Each cell shows the recommended SaaS fee + per-event price (or BPS multiplier + floor) needed to hit that
          revenue target with <b>{targetSaasSharePct}% of revenue from SaaS</b> (or floor for BPS).
        </p>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-medium text-slate-500 uppercase tracking-wider">Target</th>
                <th className="text-left py-2 font-medium text-slate-500 uppercase tracking-wider">BPS</th>
                <th className="text-left py-2 font-medium text-slate-500 uppercase tracking-wider">Per redemption</th>
                <th className="text-left py-2 font-medium text-slate-500 uppercase tracking-wider">Per application</th>
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
                    {c.bps ? <BpsCell bps={c.bps} /> : <span className="text-slate-400 italic">no NCUA data</span>}
                  </td>
                  <SaasEventCellWrap result={c.redemption} mode={mode} unit="redemption" />
                  <SaasEventCellWrap result={c.application} mode={mode} unit="application" />
                  <SaasEventCellWrap result={c.offerGen} mode={mode} unit="offer" />
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
function computeBackSolves(
  client: ClientWithNcua,
  targetRev: number,
  targetSaasSharePct: number,
  mathProps: RepricingMathProps,
) {
  const mode = clientMode(client);

  // Mode-filter the event counts
  const counts = filterCountsByMode(
    {
      redemptionsLoan: client.redemptionsLending,
      redemptionsDeposit: client.redemptionsDeposit,
      applicationsLoan: client.applicationsLending,
      applicationsDeposit: client.applicationsDeposit,
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
  });
  const application = backSolveSaasPerEvent({
    targetTotalRev: targetRev,
    targetSaasSharePct,
    eventCountLoan: counts.applicationsLoan,
    eventCountDeposit: counts.applicationsDeposit,
    lendingPremium: mathProps.lendingPremium,
  });
  const offerGen = backSolveSaasPerEvent({
    targetTotalRev: targetRev,
    targetSaasSharePct,
    eventCountLoan: counts.offersGenLoan,
    eventCountDeposit: counts.offersGenDeposit,
    lendingPremium: mathProps.lendingPremium,
  });

  // BPS back-solve: also mode-filter volumes (zero out the unused module's volumes)
  let bps: ReturnType<typeof backSolveBps> | null = null;
  if (client.ncua) {
    const lvBase = deriveLoanVolumes(client.ncua);
    const dvBase = deriveDepositVolumes(client.ncua, mathProps.depositChurnGrossup);
    const lv = mode === "deposit" ? zeroVolumes(lvBase) : lvBase;
    const dv = mode === "lending" ? zeroVolumes(dvBase) : dvBase;
    bps = backSolveBps({
      targetTotalRev: targetRev,
      targetSaasSharePct,
      loanVolumes: lv,
      depositVolumes: dv,
      baseLoanBps: mathProps.loanBps,
      baseDepositBps: mathProps.depositBps,
      loanPenetrationPct: mathProps.loanPenetration,
      depositPenetrationPct: mathProps.depositPenetration,
    });
  }

  return { redemption, application, offerGen, bps };
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

function zeroVolumes<T extends Record<string, number>>(v: T): T {
  const out = {} as T;
  Object.keys(v).forEach((k) => {
    (out as Record<string, number>)[k] = 0;
  });
  return out;
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
}: {
  result: ReturnType<typeof backSolveSaasPerEvent>;
  mode: ClientMode;
  unit: string;
}) {
  return (
    <td className="py-3 pr-3">
      <SaasEventCell result={result} mode={mode} unit={unit} />
    </td>
  );
}

function SaasEventCell({
  result,
  mode,
  unit,
}: {
  result: ReturnType<typeof backSolveSaasPerEvent>;
  mode: ClientMode;
  unit: string;
}) {
  if (result.feasibility === "no_events") {
    return (
      <div className="rounded-lg p-2 bg-slate-50 border border-slate-200 text-slate-400 italic">no events</div>
    );
  }
  return (
    <div className="rounded-lg p-2 bg-emerald-50 border border-emerald-200">
      <div className="font-mono text-slate-900 font-semibold">
        ${result.recommendedMonthlySaas.toFixed(0)}/mo SaaS
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

function BpsCell({ bps }: { bps: ReturnType<typeof backSolveBps> }) {
  if (bps.feasibility === "no_volume") {
    return (
      <div className="rounded-lg p-2 bg-slate-50 border border-slate-200 text-slate-400 italic">no volume</div>
    );
  }
  return (
    <div className="rounded-lg p-2 bg-emerald-50 border border-emerald-200">
      <div className="font-mono text-slate-900 font-semibold">
        ${bps.recommendedMonthlyFloor.toFixed(0)}/mo floor
      </div>
      <div className="font-mono text-slate-900 mt-0.5">{bps.multiplier.toFixed(2)}× current bps</div>
      <div className="text-[10px] text-slate-500 mt-0.5">scaled uniformly</div>
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
  billingOption,
  setBillingOption,
  onBack,
  ...partialMath
}: {
  clients: ClientWithNcua[];
  targetSaasSharePct: number;
  lendingPremium: number;
  billingOption: BillingOption;
  setBillingOption: (b: BillingOption) => void;
  onBack: () => void;
} & Omit<RepricingMathProps, "lendingPremium">) {
  const mathProps: RepricingMathProps = { ...partialMath, lendingPremium };
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

      {SAAS_TIERS.map((tier) => {
        const tierClients = byTier.get(tier.id) ?? [];
        return (
          <TierBlock
            key={tier.id}
            tierLabel={tier.label}
            clients={tierClients}
            targetSaasSharePct={targetSaasSharePct}
            billingOption={billingOption}
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
  ...mathProps
}: {
  tierLabel: string;
  clients: ClientWithNcua[];
  targetSaasSharePct: number;
  billingOption: BillingOption;
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
          {...mathProps}
        />
        <ModeColumn
          title="Deposit-only"
          accent="bg-violet-100 text-violet-800"
          clients={depositClients}
          mode="deposit"
          targetSaasSharePct={targetSaasSharePct}
          billingOption={billingOption}
          {...mathProps}
        />
        <ModeColumn
          title="Both modules"
          accent="bg-emerald-100 text-emerald-800"
          clients={bothClients}
          mode="both"
          targetSaasSharePct={targetSaasSharePct}
          billingOption={billingOption}
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
  ...mathProps
}: {
  title: string;
  accent: string;
  clients: ClientWithNcua[];
  mode: ClientMode;
  targetSaasSharePct: number;
  billingOption: BillingOption;
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
                <th className="text-left py-1 font-medium text-slate-500">BPS multiplier</th>
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
            const summary = summarizeTierMode(clients, mult, targetSaasSharePct, billingOption, mathProps);
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
                      {summary.medianBpsMultiplier != null ? (
                        <>
                          <div>{summary.medianBpsMultiplier.toFixed(2)}×</div>
                          {summary.minBpsMultiplier !== summary.maxBpsMultiplier && (
                            <div className="text-[10px] text-slate-400">
                              {summary.minBpsMultiplier!.toFixed(2)}×–
                              {summary.maxBpsMultiplier!.toFixed(2)}×
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
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
  medianBpsMultiplier: number | null;
  minBpsMultiplier: number | null;
  maxBpsMultiplier: number | null;
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
): TierModeSummary {
  const monthlySaasValues: number[] = [];
  const perEventLoanValues: number[] = [];
  const perEventDepositValues: number[] = [];
  const bpsMultValues: number[] = [];
  const bpsFloorValues: number[] = [];

  for (const c of clients) {
    const targetRev = c.annualFee2025 * mult;
    const r = computeBackSolves(c, targetRev, targetSaasSharePct, mathProps);

    // Pick the result for the active billing option
    const eventResult =
      billingOption === "redemption"
        ? r.redemption
        : billingOption === "application"
          ? r.application
          : billingOption === "offerGen"
            ? r.offerGen
            : null;

    if (eventResult && eventResult.feasibility === "ok") {
      monthlySaasValues.push(eventResult.recommendedMonthlySaas);
      if (eventResult.pricePerEventLoan > 0) perEventLoanValues.push(eventResult.pricePerEventLoan);
      if (eventResult.pricePerEventDeposit > 0) perEventDepositValues.push(eventResult.pricePerEventDeposit);
    }
    if (billingOption === "bps" && r.bps && r.bps.feasibility === "ok") {
      bpsMultValues.push(r.bps.multiplier);
      bpsFloorValues.push(r.bps.recommendedMonthlyFloor);
    }
  }

  const perEventParts: string[] = [];
  if (perEventLoanValues.length > 0) {
    perEventParts.push(`$${median(perEventLoanValues).toFixed(2)} loan`);
  }
  if (perEventDepositValues.length > 0) {
    perEventParts.push(`$${median(perEventDepositValues).toFixed(2)} dep`);
  }

  return {
    medianMonthlySaas: monthlySaasValues.length > 0 ? median(monthlySaasValues) : null,
    minMonthlySaas: monthlySaasValues.length > 0 ? Math.min(...monthlySaasValues) : null,
    maxMonthlySaas: monthlySaasValues.length > 0 ? Math.max(...monthlySaasValues) : null,
    medianPerEventDisplay: perEventParts.length > 0 ? perEventParts.join(" / ") : null,
    medianBpsMultiplier: bpsMultValues.length > 0 ? median(bpsMultValues) : null,
    minBpsMultiplier: bpsMultValues.length > 0 ? Math.min(...bpsMultValues) : null,
    maxBpsMultiplier: bpsMultValues.length > 0 ? Math.max(...bpsMultValues) : null,
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
