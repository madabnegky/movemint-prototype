"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ncuaData from "@/data/ncua-cus.json";

import type { CU, LoanCategory, DepositCategory, LoanTakeRates, DepositTakeRates, SaasTierPrices } from "./_lib/types";
import {
  DEFAULT_LOAN_BPS,
  DEFAULT_DEPOSIT_BPS,
  DEFAULT_SAAS_TIER_PRICES,
} from "./_lib/types";
import { fmtUSD } from "./_lib/format";
import { deriveLoanVolumes, deriveDepositVolumes, calcEventCounts, DEFAULT_EVENT_ASSUMPTIONS, type EventAssumptions } from "./_lib/events";

import { Stat, Card } from "./_components/primitives";
import { BpsTab } from "./_components/BpsTab";
import { SaasPerEventTab } from "./_components/SaasPerEventTab";
import { ComparisonTab } from "./_components/ComparisonTab";
import { RepricingTab } from "./_components/RepricingTab";

type TabId = "bps" | "redemption" | "application" | "click" | "offerGen" | "comparison" | "repricing";

const TABS: { id: TabId; label: string; sublabel?: string }[] = [
  { id: "bps", label: "BPS take-rate", sublabel: "Pure transaction" },
  { id: "redemption", label: "SaaS + redemption", sublabel: "$ per conversion" },
  { id: "application", label: "SaaS + application", sublabel: "$ per app started" },
  { id: "click", label: "SaaS + click", sublabel: "$ per click" },
  { id: "offerGen", label: "SaaS + offer generated", sublabel: "$ per impression" },
  { id: "comparison", label: "Compare all 5", sublabel: "Side-by-side" },
  { id: "repricing", label: "Repricing", sublabel: "Existing clients" },
];

export default function PricingModelPage() {
  const [activeTab, setActiveTab] = useState<TabId>("bps");

  const [selectedCu, setSelectedCu] = useState<CU | null>(null);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // ---------- Shared assumptions (used by multiple tabs) ----------
  const [loanPenetration, setLoanPenetration] = useState(2.5);
  const [depositPenetration, setDepositPenetration] = useState(2.5);
  const [depositChurnGrossup, setDepositChurnGrossup] = useState(18);

  // BPS-specific
  const [bpsMonthlyFloor, setBpsMonthlyFloor] = useState(2_500);
  const [loanBps, setLoanBps] = useState<LoanTakeRates>(DEFAULT_LOAN_BPS);
  const [depositBps, setDepositBps] = useState<DepositTakeRates>(DEFAULT_DEPOSIT_BPS);
  const [loanOverrides, setLoanOverrides] = useState<Partial<Record<LoanCategory, number>>>({});
  const [depositOverrides, setDepositOverrides] = useState<Partial<Record<DepositCategory, number>>>({});

  // SaaS-tier prices (global) + per-CU override
  const [tierPrices, setTierPrices] = useState<SaasTierPrices>({ ...DEFAULT_SAAS_TIER_PRICES });
  const [saasOverride, setSaasOverride] = useState<number | null>(null);

  // Per-event prices, split by module (lending vs deposit). All start at 0 —
  // user discovers the right numbers by tuning, or applies a "70% mix"
  // suggestion. 6 prices total (3 event types × 2 modules).
  const [pricePerRedemptionLoan, setPricePerRedemptionLoan] = useState<number>(0);
  const [pricePerRedemptionDeposit, setPricePerRedemptionDeposit] = useState<number>(0);
  const [pricePerApplicationLoan, setPricePerApplicationLoan] = useState<number>(0);
  const [pricePerApplicationDeposit, setPricePerApplicationDeposit] = useState<number>(0);
  const [pricePerOfferGenLoan, setPricePerOfferGenLoan] = useState<number>(0);
  const [pricePerOfferGenDeposit, setPricePerOfferGenDeposit] = useState<number>(0);
  const [pricePerClickLoan, setPricePerClickLoan] = useState<number>(0);
  const [pricePerClickDeposit, setPricePerClickDeposit] = useState<number>(0);

  // Event-count assumptions (shared across the 3 SaaS+event tabs)
  const [eventAssumptionsRaw, setEventAssumptionsRaw] = useState(DEFAULT_EVENT_ASSUMPTIONS);
  const eventAssumptions: EventAssumptions = useMemo(
    () => ({
      ...eventAssumptionsRaw,
      loanPenetrationPct: loanPenetration,
      depositPenetrationPct: depositPenetration,
    }),
    [eventAssumptionsRaw, loanPenetration, depositPenetration],
  );

  // ---------- CU search ----------
  const filteredCus = useMemo(() => {
    if (!search) return ncuaData.cus.slice(0, 50);
    const q = search.toLowerCase();
    return ncuaData.cus
      .filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase() === q)
      .slice(0, 50);
  }, [search]);

  function selectCu(cu: CU) {
    setSelectedCu(cu);
    // Reset all per-CU overrides on switch
    setLoanOverrides({});
    setDepositOverrides({});
    setSaasOverride(null);
  }

  // ---------- Derived volumes (BPS uses these directly; event tabs use them via calcEventCounts) ----------
  const loanEstimates = useMemo<Record<LoanCategory, number>>(
    () =>
      selectedCu
        ? deriveLoanVolumes(selectedCu)
        : { firstMortgage: 0, heloc: 0, auto: 0, creditCard: 0, unsecured: 0, commercial: 0 },
    [selectedCu],
  );

  const depositEstimates = useMemo<Record<DepositCategory, number>>(
    () =>
      selectedCu
        ? deriveDepositVolumes(selectedCu, depositChurnGrossup)
        : { drafts: 0, regular: 0, mma: 0, cds: 0, ira: 0 },
    [selectedCu, depositChurnGrossup],
  );

  const loanVolumes = useMemo<Record<LoanCategory, number>>(
    () =>
      (Object.keys(loanEstimates) as LoanCategory[]).reduce(
        (acc, k) => {
          acc[k] = loanOverrides[k] ?? loanEstimates[k];
          return acc;
        },
        {} as Record<LoanCategory, number>,
      ),
    [loanEstimates, loanOverrides],
  );

  const depositVolumes = useMemo<Record<DepositCategory, number>>(
    () =>
      (Object.keys(depositEstimates) as DepositCategory[]).reduce(
        (acc, k) => {
          acc[k] = depositOverrides[k] ?? depositEstimates[k];
          return acc;
        },
        {} as Record<DepositCategory, number>,
      ),
    [depositEstimates, depositOverrides],
  );

  const eventCounts = useMemo(
    () => calcEventCounts(loanVolumes, depositVolumes, selectedCu?.members ?? 0, eventAssumptions),
    [loanVolumes, depositVolumes, selectedCu, eventAssumptions],
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pricing Model</h1>
        <p className="text-sm text-slate-500 mt-1">
          Estimate annual revenue for a prospective credit union client across four pricing variations. Prefilled with NCUA Call Report data.
        </p>
      </div>

      {/* CU selector */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm relative">
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Credit Union</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or state (e.g. 'Navy', 'CA')…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showDropdown && filteredCus.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {filteredCus.map((cu) => (
                <button
                  key={cu.cu}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    selectCu(cu);
                    setSearch(cu.name);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                >
                  <div className="text-sm font-medium text-slate-900">{cu.name}</div>
                  <div className="text-xs text-slate-500">
                    {cu.state} · {fmtUSD(cu.assets)} assets · {cu.members.toLocaleString()} members
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCu && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Assets" value={fmtUSD(selectedCu.assets)} />
            <Stat label="Members" value={selectedCu.members.toLocaleString()} />
            <Stat label="2025 originations" value={fmtUSD(selectedCu.originations.total)} />
            <Stat label="Total shares" value={fmtUSD(selectedCu.shares.total)} />
          </div>
        )}
      </div>

      {/* Tab switcher — always visible. The 5 prospective-modeling tabs require
          a selected CU; the Repricing tab works off uploaded client data and
          does not require a CU selection. */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[160px] px-4 py-3 text-left border-b-2 transition-colors ${
                  isActive ? "border-blue-600 bg-blue-50/50" : "border-transparent hover:bg-slate-50"
                }`}
              >
                <div className={`text-sm font-semibold ${isActive ? "text-blue-700" : "text-slate-700"}`}>
                  {tab.label}
                </div>
                {tab.sublabel && (
                  <div className={`text-xs ${isActive ? "text-blue-600" : "text-slate-500"} mt-0.5`}>
                    {tab.sublabel}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prospective-modeling tabs need a selected CU */}
      {activeTab !== "repricing" && !selectedCu && (
        <div className="bg-white p-8 md:p-12 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
          Select a credit union above to begin modeling, or switch to the <b>Repricing</b> tab to work with uploaded client data.
        </div>
      )}

      {selectedCu && (
        <>
          {/* Tab content */}
          {activeTab === "bps" && (
            <BpsTab
              selectedCu={selectedCu}
              loanPenetration={loanPenetration}
              setLoanPenetration={setLoanPenetration}
              depositPenetration={depositPenetration}
              setDepositPenetration={setDepositPenetration}
              depositChurnGrossup={depositChurnGrossup}
              setDepositChurnGrossup={setDepositChurnGrossup}
              monthlyFloor={bpsMonthlyFloor}
              setMonthlyFloor={setBpsMonthlyFloor}
              loanBps={loanBps}
              setLoanBps={setLoanBps}
              depositBps={depositBps}
              setDepositBps={setDepositBps}
              loanEstimates={loanEstimates}
              loanOverrides={loanOverrides}
              setLoanOverrides={setLoanOverrides}
              loanVolumes={loanVolumes}
              depositEstimates={depositEstimates}
              depositOverrides={depositOverrides}
              setDepositOverrides={setDepositOverrides}
              depositVolumes={depositVolumes}
            />
          )}

          {activeTab === "redemption" && (
            <SaasPerEventTab
              selectedCu={selectedCu}
              kind="redemption"
              pricePerEventLoan={pricePerRedemptionLoan}
              setPricePerEventLoan={setPricePerRedemptionLoan}
              pricePerEventDeposit={pricePerRedemptionDeposit}
              setPricePerEventDeposit={setPricePerRedemptionDeposit}
              tierPrices={tierPrices}
              setTierPrice={(id, v) => setTierPrices({ ...tierPrices, [id]: v })}
              saasOverride={saasOverride}
              setSaasOverride={setSaasOverride}
              assumptions={eventAssumptions}
              setAssumptions={(a) =>
                setEventAssumptionsRaw({
                  avgLoanSize: a.avgLoanSize,
                  avgDepositSize: a.avgDepositSize,
                  appToFundedRatio: a.appToFundedRatio,
                  offersPerMemberPerYear: a.offersPerMemberPerYear,
                  clickToAppRate: a.clickToAppRate,
                })
              }
              eventCounts={eventCounts}
            />
          )}

          {activeTab === "application" && (
            <SaasPerEventTab
              selectedCu={selectedCu}
              kind="application"
              pricePerEventLoan={pricePerApplicationLoan}
              setPricePerEventLoan={setPricePerApplicationLoan}
              pricePerEventDeposit={pricePerApplicationDeposit}
              setPricePerEventDeposit={setPricePerApplicationDeposit}
              tierPrices={tierPrices}
              setTierPrice={(id, v) => setTierPrices({ ...tierPrices, [id]: v })}
              saasOverride={saasOverride}
              setSaasOverride={setSaasOverride}
              assumptions={eventAssumptions}
              setAssumptions={(a) =>
                setEventAssumptionsRaw({
                  avgLoanSize: a.avgLoanSize,
                  avgDepositSize: a.avgDepositSize,
                  appToFundedRatio: a.appToFundedRatio,
                  offersPerMemberPerYear: a.offersPerMemberPerYear,
                  clickToAppRate: a.clickToAppRate,
                })
              }
              eventCounts={eventCounts}
            />
          )}

          {activeTab === "click" && (
            <SaasPerEventTab
              selectedCu={selectedCu}
              kind="click"
              pricePerEventLoan={pricePerClickLoan}
              setPricePerEventLoan={setPricePerClickLoan}
              pricePerEventDeposit={pricePerClickDeposit}
              setPricePerEventDeposit={setPricePerClickDeposit}
              tierPrices={tierPrices}
              setTierPrice={(id, v) => setTierPrices({ ...tierPrices, [id]: v })}
              saasOverride={saasOverride}
              setSaasOverride={setSaasOverride}
              assumptions={eventAssumptions}
              setAssumptions={(a) =>
                setEventAssumptionsRaw({
                  avgLoanSize: a.avgLoanSize,
                  avgDepositSize: a.avgDepositSize,
                  appToFundedRatio: a.appToFundedRatio,
                  offersPerMemberPerYear: a.offersPerMemberPerYear,
                  clickToAppRate: a.clickToAppRate,
                })
              }
              eventCounts={eventCounts}
            />
          )}

          {activeTab === "offerGen" && (
            <SaasPerEventTab
              selectedCu={selectedCu}
              kind="offerGen"
              pricePerEventLoan={pricePerOfferGenLoan}
              setPricePerEventLoan={setPricePerOfferGenLoan}
              pricePerEventDeposit={pricePerOfferGenDeposit}
              setPricePerEventDeposit={setPricePerOfferGenDeposit}
              tierPrices={tierPrices}
              setTierPrice={(id, v) => setTierPrices({ ...tierPrices, [id]: v })}
              saasOverride={saasOverride}
              setSaasOverride={setSaasOverride}
              assumptions={eventAssumptions}
              setAssumptions={(a) =>
                setEventAssumptionsRaw({
                  avgLoanSize: a.avgLoanSize,
                  avgDepositSize: a.avgDepositSize,
                  appToFundedRatio: a.appToFundedRatio,
                  offersPerMemberPerYear: a.offersPerMemberPerYear,
                  clickToAppRate: a.clickToAppRate,
                })
              }
              eventCounts={eventCounts}
            />
          )}

          {activeTab === "comparison" && (
            <ComparisonTab
              selectedCu={selectedCu}
              loanVolumes={loanVolumes}
              depositVolumes={depositVolumes}
              loanBps={loanBps}
              depositBps={depositBps}
              loanPenetration={loanPenetration}
              depositPenetration={depositPenetration}
              bpsMonthlyFloor={bpsMonthlyFloor}
              tierPrices={tierPrices}
              saasOverride={saasOverride}
              pricePerRedemptionLoan={pricePerRedemptionLoan}
              pricePerRedemptionDeposit={pricePerRedemptionDeposit}
              pricePerApplicationLoan={pricePerApplicationLoan}
              pricePerApplicationDeposit={pricePerApplicationDeposit}
              pricePerOfferGenLoan={pricePerOfferGenLoan}
              pricePerOfferGenDeposit={pricePerOfferGenDeposit}
              pricePerClickLoan={pricePerClickLoan}
              pricePerClickDeposit={pricePerClickDeposit}
              eventCounts={eventCounts}
            />
          )}

          {/* Methodology — shown for prospective-modeling tabs only */}
          <Card title="Methodology &amp; data caveats" tone="muted">
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                <b>Source:</b> NCUA 5300 Call Report, {ncuaData.meta.sourceQuarter.toUpperCase()} (published{" "}
                {new Date(ncuaData.meta.generatedAt).toLocaleDateString()}). Public, free, refreshed quarterly.
              </p>
              <p>
                <b>Loan originations:</b> NCUA reports a single total YTD origination figure per credit union (Acct_031B), not
                category-level flows. Category breakdowns are <i>estimated</i> by allocating that total proportionally to each
                category&apos;s share of outstanding loan balances. Calibrate against actual book during sales conversations.
              </p>
              <p>
                <b>Deposit volume:</b> NCUA reports balances by type, but not gross inflows. We estimate annual new-deposit
                volume as <code className="px-1 bg-slate-100 rounded text-xs">share balance × gross-inflow factor</code>{" "}
                (default 18%).
              </p>
              <p>
                <b>Event counts:</b> redemptions = volume × penetration ÷ avg ticket size. Applications = redemptions ×
                application-to-funded ratio (default 2.5×). Offers generated = members × offers per year × blended penetration.
                All ratios are editable.
              </p>
            </div>
          </Card>
        </>
      )}

      {/* Repricing tab works on uploaded client data — does not need a CU selection */}
      {activeTab === "repricing" && (
        <RepricingTab
          loanBps={loanBps}
          depositBps={depositBps}
          loanPenetration={loanPenetration}
          depositPenetration={depositPenetration}
          bpsMonthlyFloor={bpsMonthlyFloor}
          tierPrices={tierPrices}
          eventAssumptions={eventAssumptions}
          depositChurnGrossup={depositChurnGrossup}
        />
      )}
    </div>
  );
}
