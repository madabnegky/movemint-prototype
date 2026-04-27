"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, Info, Search, X } from "lucide-react";
import ncuaData from "@/data/ncua-cus.json";

// ---------- Types ----------
type CU = (typeof ncuaData.cus)[number];

type LoanCategory = "firstMortgage" | "heloc" | "auto" | "creditCard" | "unsecured" | "commercial";
type DepositCategory = "drafts" | "regular" | "mma" | "cds" | "ira";

type LoanTakeRates = Record<LoanCategory, number>; // basis points
type DepositTakeRates = Record<DepositCategory, number>; // basis points

const LOAN_LABELS: Record<LoanCategory, string> = {
  firstMortgage: "First mortgage",
  heloc: "HELOC / 2nd lien",
  auto: "Auto",
  creditCard: "Credit card",
  unsecured: "Personal / unsecured",
  commercial: "Commercial",
};

const DEPOSIT_LABELS: Record<DepositCategory, string> = {
  drafts: "Checking (share drafts)",
  regular: "Regular savings",
  mma: "Money market",
  cds: "Share certificates (CDs)",
  ira: "IRA / Keogh",
};

// Defaults: tiered take rates in basis points. Higher rates on stickier
// /more profitable products (cards, checking), lower on rate-shoppy products
// (CDs, mortgage). Tune these in the UI.
const DEFAULT_LOAN_BPS: LoanTakeRates = {
  firstMortgage: 8,
  heloc: 12,
  auto: 15,
  creditCard: 30,
  unsecured: 25,
  commercial: 10,
};

const DEFAULT_DEPOSIT_BPS: DepositTakeRates = {
  drafts: 25,
  regular: 10,
  mma: 8,
  cds: 5,
  ira: 8,
};

// ---------- Helpers ----------
const fmtUSD = (n: number) =>
  n >= 1_000_000_000
    ? `$${(n / 1_000_000_000).toFixed(2)}B`
    : n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}K`
        : `$${n.toFixed(0)}`;

const fmtUSDExact = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// ---------- Page ----------
export default function PricingModelPage() {
  const [selectedCu, setSelectedCu] = useState<CU | null>(null);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Pricing assumptions
  // Penetration is split between loan and deposit modules — a client may have
  // one, the other, or both. Setting either to 0 effectively disables that module.
  const [loanPenetration, setLoanPenetration] = useState(2.5); // %
  const [depositPenetration, setDepositPenetration] = useState(2.5); // %
  const [depositChurnGrossup, setDepositChurnGrossup] = useState(18); // % — gross-up factor on net share growth (we don't have gross deposit inflows from NCUA)
  const [monthlyFloor, setMonthlyFloor] = useState(2500); // $/mo
  const [currentFlatRate, setCurrentFlatRate] = useState(60000); // $/yr — what the CU pays today
  const [loanBps, setLoanBps] = useState<LoanTakeRates>(DEFAULT_LOAN_BPS);
  const [depositBps, setDepositBps] = useState<DepositTakeRates>(DEFAULT_DEPOSIT_BPS);

  // Per-category volume overrides — when set, replace the NCUA-derived estimate.
  // null = use estimate; number = use override. Useful in sales conversations
  // when the CU shares their actual book/origination numbers.
  const [loanOverrides, setLoanOverrides] = useState<Partial<Record<LoanCategory, number>>>({});
  const [depositOverrides, setDepositOverrides] = useState<Partial<Record<DepositCategory, number>>>({});

  // Reset overrides whenever a different CU is selected
  function selectCu(cu: CU) {
    setSelectedCu(cu);
    setLoanOverrides({});
    setDepositOverrides({});
  }

  // ---------- CU search ----------
  const filteredCus = useMemo(() => {
    if (!search) return ncuaData.cus.slice(0, 50);
    const q = search.toLowerCase();
    return ncuaData.cus.filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase() === q).slice(0, 50);
  }, [search]);

  // ---------- Volume estimates from CU data ----------
  // Loan originations: NCUA reports total YTD (= full-year for Q4 file).
  // The parser allocated these across categories using outstanding balance share.
  const loanEstimates: Record<LoanCategory, number> = useMemo(
    () =>
      selectedCu
        ? {
            firstMortgage: selectedCu.originations.firstMortgageEst,
            heloc: selectedCu.originations.helocEst,
            auto: selectedCu.originations.autoEst,
            creditCard: selectedCu.originations.creditCardEst,
            unsecured: selectedCu.originations.unsecuredEst,
            commercial: selectedCu.originations.commercialEst,
          }
        : { firstMortgage: 0, heloc: 0, auto: 0, creditCard: 0, unsecured: 0, commercial: 0 },
    [selectedCu],
  );

  // Deposit "volume" = annual estimated NEW deposit inflow.
  // NCUA only reports stock balances, not flows. We use share balance × an
  // annual gross-inflow factor (default 18%, configurable). This treats the
  // share balance as a proxy for the addressable book of new deposits Movemint
  // could influence — calibrate down as needed.
  const depositEstimates: Record<DepositCategory, number> = useMemo(
    () =>
      selectedCu
        ? {
            drafts: selectedCu.shares.drafts * (depositChurnGrossup / 100),
            regular: selectedCu.shares.regular * (depositChurnGrossup / 100),
            mma: selectedCu.shares.mma * (depositChurnGrossup / 100),
            cds: selectedCu.shares.cds * (depositChurnGrossup / 100),
            ira: selectedCu.shares.ira * (depositChurnGrossup / 100),
          }
        : { drafts: 0, regular: 0, mma: 0, cds: 0, ira: 0 },
    [selectedCu, depositChurnGrossup],
  );

  // Effective volumes: override if set, otherwise the NCUA-derived estimate.
  const loanVolumes: Record<LoanCategory, number> = useMemo(
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

  const depositVolumes: Record<DepositCategory, number> = useMemo(
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

  // ---------- Revenue calc ----------
  // Loan and deposit penetrations are independent — a client may have a
  // lending module, a deposit module, or both. Setting either to 0 disables
  // that module's revenue contribution.
  function calcRevenue(loanPen: number, depositPen: number) {
    const loanFrac = loanPen / 100;
    const depositFrac = depositPen / 100;
    let loanRev = 0;
    (Object.keys(loanVolumes) as LoanCategory[]).forEach((k) => {
      loanRev += loanVolumes[k] * loanFrac * (loanBps[k] / 10000);
    });
    let depositRev = 0;
    (Object.keys(depositVolumes) as DepositCategory[]).forEach((k) => {
      depositRev += depositVolumes[k] * depositFrac * (depositBps[k] / 10000);
    });
    const txnRev = loanRev + depositRev;
    const annualFloor = monthlyFloor * 12;
    const billed = Math.max(annualFloor, txnRev);
    return { loanRev, depositRev, txnRev, annualFloor, billed };
  }

  const projected = calcRevenue(loanPenetration, depositPenetration);

  // Sensitivity table sweeps both penetrations together (1× / 2× / etc. of
  // current settings) so the contour matches what the user actually configured.
  const sensitivities = [0.4, 1, 2, 3].map((mult) => ({
    multiplier: mult,
    loanPen: loanPenetration * mult,
    depositPen: depositPenetration * mult,
    ...calcRevenue(loanPenetration * mult, depositPenetration * mult),
  }));

  // Break-even: keep the loan-to-deposit penetration ratio constant and find
  // the multiplier where transaction revenue equals the flat-rate comparison.
  // revAtMult = mult × (revAtCurrent_loan + revAtCurrent_deposit)
  const revPerLoanPctPoint = useMemo(() => {
    let v = 0;
    (Object.keys(loanVolumes) as LoanCategory[]).forEach((k) => {
      v += loanVolumes[k] * (loanBps[k] / 10000);
    });
    return v / 100; // revenue per 1pp of loan penetration
  }, [loanVolumes, loanBps]);

  const revPerDepositPctPoint = useMemo(() => {
    let v = 0;
    (Object.keys(depositVolumes) as DepositCategory[]).forEach((k) => {
      v += depositVolumes[k] * (depositBps[k] / 10000);
    });
    return v / 100;
  }, [depositVolumes, depositBps]);

  const revAtCurrentMix =
    revPerLoanPctPoint * loanPenetration + revPerDepositPctPoint * depositPenetration;
  const breakEvenMultiplier = revAtCurrentMix > 0 ? currentFlatRate / revAtCurrentMix : null;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pricing Model</h1>
        <p className="text-sm text-slate-500 mt-1">
          Model transaction-based pricing for any U.S. credit union with $50M+ in assets, prefilled from NCUA Call Report data.
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

      {!selectedCu ? (
        <div className="bg-white p-8 md:p-12 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
          Select a credit union to begin modeling.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,420px)] gap-6">
          {/* INPUTS */}
          <div className="space-y-6">
            {/* Core assumptions */}
            <Card title="Core assumptions">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SliderInput
                  label="Lending module penetration"
                  hint="% of new loan originations influenced by Movemint. Set to 0 if the client is deposit-only."
                  value={loanPenetration}
                  onChange={setLoanPenetration}
                  min={0}
                  max={15}
                  step={0.1}
                  suffix="%"
                />
                <SliderInput
                  label="Deposit module penetration"
                  hint="% of new deposit volume influenced by Movemint. Set to 0 if the client is lending-only."
                  value={depositPenetration}
                  onChange={setDepositPenetration}
                  min={0}
                  max={15}
                  step={0.1}
                  suffix="%"
                />
                <SliderInput
                  label="Deposit gross-inflow factor"
                  hint="Annual new-deposit volume estimated as: share balance × this factor. NCUA does not report gross deposit inflows; this is a proxy."
                  value={depositChurnGrossup}
                  onChange={setDepositChurnGrossup}
                  min={5}
                  max={50}
                  step={1}
                  suffix="%"
                  help={
                    <HelpPopover title="What is the deposit gross-inflow factor?">
                      <p>
                        NCUA tells us a credit union&apos;s deposit <i>balance</i> at year-end (a stock), but not how much new
                        money <i>flowed in</i> during the year (the flow). Pricing needs the flow — that&apos;s the volume
                        Movemint can influence.
                      </p>
                      <p>The gross-inflow factor estimates that flow:</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs leading-relaxed">
                        annual new-deposit volume
                        <br />= share balance × gross-inflow factor
                      </div>
                      <p>
                        For <b>{selectedCu?.name ?? "this CU"}</b> at the current setting:
                      </p>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs leading-relaxed">
                        {fmtUSDExact(selectedCu?.shares.total ?? 0)} × {depositChurnGrossup}%
                        <br />= {fmtUSDExact((selectedCu?.shares.total ?? 0) * (depositChurnGrossup / 100))} estimated annual new-deposit volume
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5 mt-2 font-medium">
                          Suggested values by CU profile
                        </div>
                        <ul className="space-y-1 text-xs">
                          <li>
                            <b>8–12%</b> — Sleepy / retiree-heavy / low new-account velocity
                          </li>
                          <li>
                            <b>15–20%</b> — Typical CU
                          </li>
                          <li>
                            <b>25–35%</b> — Growth-mode, active CD/MMA marketing
                          </li>
                          <li>
                            <b>35–50%</b> — High-churn, fintech-style
                          </li>
                        </ul>
                      </div>
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                        <b>This is the most uncertain assumption in the model.</b> When possible, calibrate against the
                        CU&apos;s actual gross deposit inflows from their internal reporting — they&apos;ll have it even though
                        NCUA doesn&apos;t publish it.
                      </p>
                    </HelpPopover>
                  }
                />
                <NumberInput
                  label="Monthly platform floor"
                  hint="Minimum monthly fee billed regardless of transaction volume — your downside protection."
                  value={monthlyFloor}
                  onChange={setMonthlyFloor}
                  prefix="$"
                  step={500}
                />
                <NumberInput
                  label="Comparison: current flat-rate ($/yr)"
                  hint="What this CU would pay (or is paying) under your current flat-rate model."
                  value={currentFlatRate}
                  onChange={setCurrentFlatRate}
                  prefix="$"
                  step={1000}
                />
              </div>
            </Card>

            {/* Loan take rates */}
            <Card
              title={`Lending module — take rates (basis points on origination volume)${
                loanPenetration === 0 ? " · DISABLED (loan penetration = 0%)" : ""
              }`}
            >
              <RowHeader />
              <div className="space-y-2">
                {(Object.keys(LOAN_LABELS) as LoanCategory[]).map((k) => (
                  <BpsRow
                    key={k}
                    label={LOAN_LABELS[k]}
                    bps={loanBps[k]}
                    onChangeBps={(v) => setLoanBps((s) => ({ ...s, [k]: v }))}
                    estimate={loanEstimates[k]}
                    override={loanOverrides[k]}
                    onChangeOverride={(v) =>
                      setLoanOverrides((s) => {
                        const next = { ...s };
                        if (v == null) delete next[k];
                        else next[k] = v;
                        return next;
                      })
                    }
                    penetration={loanPenetration}
                  />
                ))}
              </div>
            </Card>

            {/* Deposit take rates */}
            <Card
              title={`Deposit module — take rates (basis points on estimated new-deposit volume)${
                depositPenetration === 0 ? " · DISABLED (deposit penetration = 0%)" : ""
              }`}
            >
              <RowHeader />
              <div className="space-y-2">
                {(Object.keys(DEPOSIT_LABELS) as DepositCategory[]).map((k) => (
                  <BpsRow
                    key={k}
                    label={DEPOSIT_LABELS[k]}
                    bps={depositBps[k]}
                    onChangeBps={(v) => setDepositBps((s) => ({ ...s, [k]: v }))}
                    estimate={depositEstimates[k]}
                    override={depositOverrides[k]}
                    onChangeOverride={(v) =>
                      setDepositOverrides((s) => {
                        const next = { ...s };
                        if (v == null) delete next[k];
                        else next[k] = v;
                        return next;
                      })
                    }
                    penetration={depositPenetration}
                  />
                ))}
              </div>
            </Card>

            {/* How the math works — uses the live selections */}
            <Card title="How the math works">
              <div className="text-sm text-slate-700 space-y-4 leading-relaxed">
                <p className="text-slate-600">
                  Every row above runs through the same four-step formula. Here&apos;s exactly how it
                  works using one of {selectedCu.name}&apos;s rows as a worked example.
                </p>

                <ExampleWalkthrough
                  cuName={selectedCu.name}
                  loanVolumes={loanVolumes}
                  loanBps={loanBps}
                  penetration={loanPenetration}
                />

                <div className="border-t border-slate-200 pt-4">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">The formula in plain English</div>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-700">
                    <li>
                      <b>Start with annual volume</b> — for loans, this is annual originations. For deposits, this is estimated annual new-deposit inflow.
                    </li>
                    <li>
                      <b>Multiply by the module&apos;s penetration</b> — the % of that volume Movemint influences. Lending and deposit modules have separate penetrations ({loanPenetration}% / {depositPenetration}%) so each can be enabled/disabled or modeled independently.
                    </li>
                    <li>
                      <b>Multiply by the take rate</b> — basis points charged on the influenced volume.
                      <span className="block text-xs text-slate-500 mt-0.5 ml-5">
                        Reminder: 1 bp = 0.01% = 0.0001. So 10 bps on $1M = $1M × 0.001 = $1,000.
                      </span>
                    </li>
                    <li>
                      <b>Sum across all categories</b> → transaction revenue. Then bill <code className="px-1 bg-slate-100 rounded text-xs">max(monthly floor × 12, transaction revenue)</code>.
                    </li>
                  </ol>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Quick reference: basis points</div>
                  <div className="overflow-x-auto -mx-1 px-1">
                    <table className="w-full text-sm font-mono min-w-[420px]">
                      <thead>
                        <tr className="text-xs text-slate-500">
                          <th className="text-left font-medium pb-1">bps</th>
                          <th className="text-right font-medium pb-1">% of volume</th>
                          <th className="text-right font-medium pb-1">$ on $1M</th>
                          <th className="text-right font-medium pb-1">$ on $100M</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {[5, 10, 15, 25, 50, 100].map((b) => (
                          <tr key={b} className="border-t border-slate-100">
                            <td className="py-1">{b}</td>
                            <td className="py-1 text-right text-slate-500">{(b / 100).toFixed(2)}%</td>
                            <td className="py-1 text-right">{fmtUSDExact(1_000_000 * (b / 10000))}</td>
                            <td className="py-1 text-right">{fmtUSDExact(100_000_000 * (b / 10000))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Card>

            {/* Methodology */}
            <Card title="Methodology &amp; data caveats" tone="muted">
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                <p>
                  <b>Source:</b> NCUA 5300 Call Report, {ncuaData.meta.sourceQuarter.toUpperCase()} (published {new Date(ncuaData.meta.generatedAt).toLocaleDateString()}).
                  Public, free, refreshed quarterly.
                </p>
                <p>
                  <b>Loan originations:</b> NCUA reports a single total YTD origination figure per credit union (Acct_031B), not category-level
                  flows. Category breakdowns shown here are <i>estimated</i> by allocating that total proportionally to each category&apos;s share of
                  outstanding loan balances. This is a reasonable approximation but should be calibrated against a CU&apos;s actual book during sales conversations.
                </p>
                <p>
                  <b>Deposit volume:</b> NCUA reports share balances by type, but not gross inflows or new account openings. We estimate annual
                  new-deposit volume as <code className="px-1 bg-slate-100 rounded text-xs">share balance × gross-inflow factor</code> (default 18%).
                  Lower this for sticky deposit institutions; raise it for CUs with active money-market or CD origination programs.
                </p>
                <p>
                  <b>Revenue calc:</b> per category, <code className="px-1 bg-slate-100 rounded text-xs">volume × module penetration × take-rate</code>.
                  Lending and deposit modules each have their own penetration so a client can buy one, the other, or both.
                  Annual billed = <code className="px-1 bg-slate-100 rounded text-xs">max(monthly floor × 12, transaction revenue)</code> — the floor is
                  protection against lending downturns.
                </p>
              </div>
            </Card>
          </div>

          {/* OUTPUT (sticky) */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <Card title="Projected annual revenue" highlight>
              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                    At {loanPenetration}% loan / {depositPenetration}% deposit penetration
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-slate-900 break-all">{fmtUSDExact(projected.billed)}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {projected.billed > projected.txnRev
                      ? `Floor active (${fmtUSDExact(projected.annualFloor)} > transaction revenue)`
                      : "Transaction revenue exceeds floor"}
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
                  <Row
                    label={`Lending module (${loanPenetration}% pen)`}
                    value={fmtUSDExact(projected.loanRev)}
                  />
                  <Row
                    label={`Deposit module (${depositPenetration}% pen)`}
                    value={fmtUSDExact(projected.depositRev)}
                  />
                  <Row label="Total transaction revenue" value={fmtUSDExact(projected.txnRev)} bold />
                  <Row label="Annual floor (12 × monthly)" value={fmtUSDExact(projected.annualFloor)} muted />
                </div>
              </div>
            </Card>

            <Card title="Vs. current flat-rate">
              <div className="space-y-3 text-sm">
                <Row label="Current flat-rate" value={fmtUSDExact(currentFlatRate)} />
                <Row label="Projected (txn model)" value={fmtUSDExact(projected.billed)} />
                <Row
                  label="Δ vs. flat-rate"
                  value={`${projected.billed >= currentFlatRate ? "+" : ""}${fmtUSDExact(projected.billed - currentFlatRate)}`}
                  bold
                  positive={projected.billed >= currentFlatRate}
                />
                {breakEvenMultiplier != null && (
                  <Row
                    label="Break-even (current mix scaled)"
                    value={`${(loanPenetration * breakEvenMultiplier).toFixed(2)}% / ${(depositPenetration * breakEvenMultiplier).toFixed(2)}%`}
                    muted
                  />
                )}
              </div>
            </Card>

            <Card title="Sensitivity (scales current mix)">
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full text-sm min-w-[320px]">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <th className="text-left py-2 font-medium">Loan / Deposit pen</th>
                      <th className="text-right py-2 font-medium">Txn rev</th>
                      <th className="text-right py-2 font-medium">Billed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivities.map((s) => (
                      <tr key={s.multiplier} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 font-mono text-xs">
                          {s.loanPen.toFixed(1)}% / {s.depositPen.toFixed(1)}%
                        </td>
                        <td className="py-2 text-right font-mono text-slate-600">{fmtUSDExact(s.txnRev)}</td>
                        <td className="py-2 text-right font-mono font-semibold text-slate-900">{fmtUSDExact(s.billed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Subcomponents ----------
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

function Card({
  title,
  children,
  highlight,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
  tone?: "muted";
}) {
  return (
    <div
      className={
        highlight
          ? "bg-slate-900 text-white p-4 md:p-6 rounded-xl shadow-sm"
          : tone === "muted"
            ? "bg-slate-50 p-4 md:p-6 rounded-xl border border-slate-200"
            : "bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm"
      }
    >
      <h3 className={`text-sm font-semibold mb-4 ${highlight ? "text-slate-300 uppercase tracking-wider" : "text-slate-700"}`}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function SliderInput({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  help,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  help?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          {help}
        </div>
        <span className="text-sm font-mono font-semibold text-slate-900">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {hint && (
        <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

// Click-to-toggle popover for richer field explanations. Closes on outside
// click or Escape. Trigger is a small "?" icon next to the field label.
function HelpPopover({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={`More info: ${title}`}
        onClick={() => setOpen((v) => !v)}
        className="text-slate-400 hover:text-blue-600 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-30 left-0 top-6 w-[min(440px,calc(100vw-3rem))] bg-white border border-slate-200 rounded-xl shadow-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 -mr-1 -mt-1"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-sm text-slate-600 space-y-3 leading-relaxed">{children}</div>
        </div>
      )}
    </div>
  );
}

function NumberInput({
  label,
  hint,
  value,
  onChange,
  prefix,
  step,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  step?: number;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{prefix}</span>}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full ${prefix ? "pl-7" : "pl-3"} pr-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>
      {hint && (
        <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

function ExampleWalkthrough({
  cuName,
  loanVolumes,
  loanBps,
  penetration,
}: {
  cuName: string;
  loanVolumes: Record<LoanCategory, number>;
  loanBps: LoanTakeRates;
  penetration: number;
}) {
  // Pick the loan category with the largest volume — most relatable example.
  const cats = (Object.keys(loanVolumes) as LoanCategory[]).filter((k) => loanVolumes[k] > 0);
  if (cats.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic">
        Volume estimates are zero — adjust inputs to see a worked example.
      </div>
    );
  }
  const top = cats.reduce((a, b) => (loanVolumes[a] >= loanVolumes[b] ? a : b));
  const volume = loanVolumes[top];
  const bps = loanBps[top];
  const penFrac = penetration / 100;
  const influenced = volume * penFrac;
  const revenue = influenced * (bps / 10000);
  const label = LOAN_LABELS[top];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
      <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">
        Example: {cuName} — {label.toLowerCase()}
      </div>
      <div className="space-y-1.5 font-mono text-sm">
        <div className="flex justify-between items-baseline">
          <span className="text-slate-600">Annual {label.toLowerCase()} volume</span>
          <span className="font-semibold text-slate-900">{fmtUSDExact(volume)}</span>
        </div>
        <div className="flex justify-between items-baseline pl-4 text-xs text-slate-500">
          <span>× {penetration}% penetration</span>
          <span>= {fmtUSDExact(influenced)}</span>
        </div>
        <div className="flex justify-between items-baseline pl-4 text-xs text-slate-500">
          <span>
            × {bps} bps <span className="text-slate-400">(= {(bps / 100).toFixed(2)}%)</span>
          </span>
          <span>
            = {fmtUSDExact(influenced)} × {(bps / 10000).toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between items-baseline pt-2 border-t border-slate-300">
          <span className="text-slate-700 font-semibold">Annual revenue from this category</span>
          <span className="font-bold text-slate-900 text-base">{fmtUSDExact(revenue)}</span>
        </div>
      </div>
    </div>
  );
}

function RowHeader() {
  // Hidden on mobile — BpsRow becomes a labeled stacked layout below `md`.
  return (
    <div className="hidden md:grid md:grid-cols-[1.4fr_180px_140px_130px] items-center gap-3 text-xs uppercase tracking-wider text-slate-400 font-medium pb-2 mb-2 border-b border-slate-200">
      <div>Category</div>
      <div className="text-right">Annual volume</div>
      <div className="text-right">Take rate</div>
      <div className="text-right">Annual revenue</div>
    </div>
  );
}

function BpsRow({
  label,
  bps,
  onChangeBps,
  estimate,
  override,
  onChangeOverride,
  penetration,
}: {
  label: string;
  bps: number;
  onChangeBps: (v: number) => void;
  estimate: number;
  override: number | undefined;
  onChangeOverride: (v: number | null) => void;
  penetration: number;
}) {
  const isOverridden = override != null;
  const volume = isOverridden ? override : estimate;
  const revAtPen = volume * (penetration / 100) * (bps / 10000);

  // Volume input shows USD-millions for ergonomics (originations are big numbers).
  const volumeMillions = Math.round((volume / 1_000_000) * 100) / 100;

  // Volume input + reset link
  const volumeInput = (
    <div className="flex items-center gap-1.5 md:justify-end">
      <span className="text-xs text-slate-400">$</span>
      <input
        type="number"
        value={volumeMillions}
        step={1}
        min={0}
        onChange={(e) => onChangeOverride(Math.max(0, Number(e.target.value)) * 1_000_000)}
        className={`w-20 px-2 py-1 border rounded text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isOverridden ? "border-blue-400 bg-blue-50" : "border-slate-300"
        }`}
        title={isOverridden ? "Override active" : "NCUA-estimated"}
      />
      <span className="text-xs text-slate-400">M</span>
      {isOverridden && (
        <button
          type="button"
          onClick={() => onChangeOverride(null)}
          className="text-[10px] text-blue-600 hover:text-blue-800 underline ml-1 whitespace-nowrap"
          title={`Estimate: ${fmtUSD(estimate)}`}
        >
          reset
        </button>
      )}
    </div>
  );

  // Take-rate (bps) input
  const bpsInput = (
    <div className="flex items-center gap-1 md:justify-end">
      <input
        type="number"
        value={bps}
        onChange={(e) => onChangeBps(Math.max(0, Number(e.target.value)))}
        step={1}
        min={0}
        className="w-16 px-2 py-1 border border-slate-300 rounded text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span className="text-xs text-slate-500">bps</span>
    </div>
  );

  // Mobile: stacked card. Desktop (md+): 4-column grid as before.
  return (
    <div className="md:grid md:grid-cols-[1.4fr_180px_140px_130px] md:items-center md:gap-3 md:py-1 border-b border-slate-100 last:border-0 md:border-0 py-3 first:pt-0">
      <div className="text-sm font-semibold text-slate-800 md:font-normal md:text-slate-700 mb-2 md:mb-0 flex items-baseline justify-between md:block">
        <span>{label}</span>
        {/* Mobile-only: show revenue inline at top-right of the card */}
        <span className="md:hidden font-mono font-semibold text-slate-900 text-sm">{fmtUSDExact(revAtPen)}</span>
      </div>

      {/* Mobile: labeled fields stacked. Desktop: fields fall into grid columns. */}
      <div className="md:contents grid grid-cols-2 gap-3">
        <FieldLabel mobileLabel="Annual volume">{volumeInput}</FieldLabel>
        <FieldLabel mobileLabel="Take rate">{bpsInput}</FieldLabel>
      </div>

      {/* Desktop-only revenue cell (mobile shows it inline above) */}
      <div className="hidden md:block text-right font-mono font-semibold text-slate-900">{fmtUSDExact(revAtPen)}</div>
    </div>
  );
}

// Adds a small label above the field on mobile; renders just the field on desktop.
function FieldLabel({ mobileLabel, children }: { mobileLabel: string; children: React.ReactNode }) {
  return (
    <div className="md:contents">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1 md:hidden">{mobileLabel}</div>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  positive,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-slate-600 ${muted ? "text-slate-400 text-xs" : ""}`}>{label}</span>
      <span
        className={`font-mono ${bold ? "font-bold" : ""} ${muted ? "text-slate-400 text-xs" : "text-slate-900"} ${
          positive === true ? "text-emerald-600" : positive === false ? "text-rose-600" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
