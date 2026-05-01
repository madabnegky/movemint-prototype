"use client";

import type { CU, LoanTakeRates, DepositTakeRates, SaasTierPrices, LoanCategory, DepositCategory } from "../_lib/types";
import type { EventCounts } from "../_lib/events";
import { tierForAssets } from "../_lib/types";
import { calcBpsRevenue, calcSaasPerEventRevenue } from "../_lib/calc";
import { fmtUSDExact } from "../_lib/format";
import { Card } from "./primitives";

export type ComparisonTabProps = {
  selectedCu: CU;

  // BPS inputs
  loanVolumes: Record<LoanCategory, number>;
  depositVolumes: Record<DepositCategory, number>;
  loanBps: LoanTakeRates;
  depositBps: DepositTakeRates;
  loanPenetration: number;
  depositPenetration: number;
  bpsMonthlyFloor: number;

  // SaaS+event inputs (module-split prices)
  tierPrices: SaasTierPrices;
  saasOverride: number | null;
  pricePerRedemptionLoan: number;
  pricePerRedemptionDeposit: number;
  pricePerApplicationLoan: number;
  pricePerApplicationDeposit: number;
  pricePerOfferGenLoan: number;
  pricePerOfferGenDeposit: number;
  pricePerClickLoan: number;
  pricePerClickDeposit: number;
  eventCounts: EventCounts;
};

export function ComparisonTab(props: ComparisonTabProps) {
  const {
    selectedCu,
    loanVolumes,
    depositVolumes,
    loanBps,
    depositBps,
    loanPenetration,
    depositPenetration,
    bpsMonthlyFloor,
    tierPrices,
    saasOverride,
    pricePerRedemptionLoan,
    pricePerRedemptionDeposit,
    pricePerApplicationLoan,
    pricePerApplicationDeposit,
    pricePerOfferGenLoan,
    pricePerOfferGenDeposit,
    pricePerClickLoan,
    pricePerClickDeposit,
    eventCounts,
  } = props;

  const activeTier = tierForAssets(selectedCu.assets);
  const monthlySaas = saasOverride ?? (tierPrices[activeTier.id] ?? activeTier.defaultMonthly);

  // Run all 4 models
  const bps = calcBpsRevenue({
    loanVolumes,
    depositVolumes,
    loanBps,
    depositBps,
    loanPenetrationPct: loanPenetration,
    depositPenetrationPct: depositPenetration,
    monthlyFloor: bpsMonthlyFloor,
  });
  const redemption = calcSaasPerEventRevenue({
    monthlySaas,
    pricePerEventLoan: pricePerRedemptionLoan,
    pricePerEventDeposit: pricePerRedemptionDeposit,
    eventCountLoan: eventCounts.redemptionsLoan,
    eventCountDeposit: eventCounts.redemptionsDeposit,
  });
  const application = calcSaasPerEventRevenue({
    monthlySaas,
    pricePerEventLoan: pricePerApplicationLoan,
    pricePerEventDeposit: pricePerApplicationDeposit,
    eventCountLoan: eventCounts.applicationsLoan,
    eventCountDeposit: eventCounts.applicationsDeposit,
  });
  const offerGen = calcSaasPerEventRevenue({
    monthlySaas,
    pricePerEventLoan: pricePerOfferGenLoan,
    pricePerEventDeposit: pricePerOfferGenDeposit,
    eventCountLoan: eventCounts.offersGeneratedLoan,
    eventCountDeposit: eventCounts.offersGeneratedDeposit,
  });
  const click = calcSaasPerEventRevenue({
    monthlySaas,
    pricePerEventLoan: pricePerClickLoan,
    pricePerEventDeposit: pricePerClickDeposit,
    eventCountLoan: eventCounts.clicksLoan,
    eventCountDeposit: eventCounts.clicksDeposit,
  });

  // For BPS, "SaaS share" = floor share if floor is active; otherwise 0.
  // BPS doesn't have a SaaS base — the floor is the closest analogue.
  const bpsFloorShare = bps.billed > 0 ? bps.annualFloor / bps.billed : 0;
  const bpsTxnShare = bps.billed > 0 ? Math.max(0, bps.txnRev) / bps.billed : 0;

  const rows: ComparisonRow[] = [
    {
      label: "BPS take-rate",
      sublabel: "Pure transaction model with monthly floor",
      total: bps.billed,
      saasShare: bpsFloorShare > 1 ? 1 : bpsFloorShare, // when floor active, "saas share" = 100%
      txnShare: bpsTxnShare,
      saasLabel: "Floor",
      txnLabel: "BPS rev",
    },
    {
      label: "SaaS + per redemption",
      sublabel: `${formatPriceLabel(pricePerRedemptionLoan)} loan / ${formatPriceLabel(pricePerRedemptionDeposit)} deposit · ${formatCount(eventCounts.redemptionsTotal)} total redemptions/yr`,
      total: redemption.totalRev,
      saasShare: redemption.saasShare,
      txnShare: 1 - redemption.saasShare,
      saasLabel: "SaaS",
      txnLabel: "Per event",
    },
    {
      label: "SaaS + per application",
      sublabel: `${formatPriceLabel(pricePerApplicationLoan)} loan / ${formatPriceLabel(pricePerApplicationDeposit)} deposit · ${formatCount(eventCounts.applicationsTotal)} total apps/yr`,
      total: application.totalRev,
      saasShare: application.saasShare,
      txnShare: 1 - application.saasShare,
      saasLabel: "SaaS",
      txnLabel: "Per event",
    },
    {
      label: "SaaS + per click",
      sublabel: `${formatPriceLabel(pricePerClickLoan)} loan / ${formatPriceLabel(pricePerClickDeposit)} deposit · ${formatCount(eventCounts.clicksTotal)} total clicks/yr`,
      total: click.totalRev,
      saasShare: click.saasShare,
      txnShare: 1 - click.saasShare,
      saasLabel: "SaaS",
      txnLabel: "Per event",
    },
    {
      label: "SaaS + per offer generated",
      sublabel: `${formatPriceLabel(pricePerOfferGenLoan)} loan / ${formatPriceLabel(pricePerOfferGenDeposit)} deposit · ${formatCount(eventCounts.offersGeneratedTotal)} total offers/yr`,
      total: offerGen.totalRev,
      saasShare: offerGen.saasShare,
      txnShare: 1 - offerGen.saasShare,
      saasLabel: "SaaS",
      txnLabel: "Per event",
    },
  ];

  return (
    <div className="space-y-6">
      <Card title="Side-by-side comparison" tone="muted">
        <p className="text-sm text-slate-600">
          Compares all four pricing models with the assumptions you&apos;ve set on each tab.
          Strategic target: <b>60–80% of revenue from SaaS / floor</b> (highlighted in green below).
        </p>
        <p className="text-xs text-slate-500 mt-2">
          For <b>{selectedCu.name}</b> ({selectedCu.state}, {fmtUSDExact(selectedCu.assets)} assets).
          Tier: {activeTier.label} → {fmtUSDExact(monthlySaas)}/mo SaaS.
        </p>
      </Card>

      {/* Results cards — one per model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((r) => (
          <ResultCard key={r.label} row={r} />
        ))}
      </div>

      {/* Summary table */}
      <Card title="Summary table">
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="text-left py-2 font-medium">Model</th>
                <th className="text-right py-2 font-medium">Annual revenue</th>
                <th className="text-right py-2 font-medium">SaaS / Floor %</th>
                <th className="text-right py-2 font-medium">Txn %</th>
                <th className="text-right py-2 font-medium">In sweet spot?</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const sharePct = r.saasShare * 100;
                const inSweet = sharePct >= 60 && sharePct <= 80;
                return (
                  <tr key={r.label} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium text-slate-800">{r.label}</td>
                    <td className="py-2 text-right font-mono font-semibold text-slate-900">{fmtUSDExact(r.total)}</td>
                    <td className={`py-2 text-right font-mono ${inSweet ? "text-emerald-700 font-semibold" : "text-slate-700"}`}>
                      {sharePct.toFixed(1)}%
                    </td>
                    <td className="py-2 text-right font-mono text-slate-700">{(r.txnShare * 100).toFixed(1)}%</td>
                    <td className="py-2 text-right">
                      {inSweet ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">✓ Yes</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">No</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recommendation hint */}
      <Card title="Recommendation framework" tone="muted">
        <ul className="text-sm text-slate-700 space-y-2 leading-relaxed">
          <li>
            <b>Highest total revenue</b> wins on the &quot;Annual revenue&quot; column — but only if the mix is strategically right.
          </li>
          <li>
            <b>Strategic mix (60–80% SaaS):</b> models in this band give predictable, recurring revenue you can forecast against.
            Models below 60% SaaS make you too dependent on member activity; above 80% leave money on the table when usage is high.
          </li>
          <li>
            <b>BPS</b> makes sense when usage is high and predictable. <b>Per-redemption</b> aligns price with realized customer
            value. <b>Per-application</b> spreads risk earlier in the funnel. <b>Per-offer-generated</b> works for clients with
            heavy member bases and low conversion expectations.
          </li>
        </ul>
      </Card>
    </div>
  );
}

type ComparisonRow = {
  label: string;
  sublabel: string;
  total: number;
  saasShare: number;
  txnShare: number;
  saasLabel: string;
  txnLabel: string;
};

function ResultCard({ row }: { row: ComparisonRow }) {
  const sharePct = row.saasShare * 100;
  const inSweet = sharePct >= 60 && sharePct <= 80;
  return (
    <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-sm font-semibold text-slate-700">{row.label}</h3>
        {inSweet && (
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
            sweet spot
          </span>
        )}
      </div>
      <div className="text-xs text-slate-500 mb-3">{row.sublabel}</div>
      <div className="text-2xl font-bold text-slate-900 font-mono break-all">{fmtUSDExact(row.total)}</div>
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex h-2 rounded overflow-hidden">
          <div
            className={`${inSweet ? "bg-emerald-500" : "bg-slate-700"}`}
            style={{ width: `${row.saasShare * 100}%` }}
            title={`${row.saasLabel}: ${(row.saasShare * 100).toFixed(1)}%`}
          />
          <div
            className="bg-slate-300"
            style={{ width: `${row.txnShare * 100}%` }}
            title={`${row.txnLabel}: ${(row.txnShare * 100).toFixed(1)}%`}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
          <span>{row.saasLabel} {(row.saasShare * 100).toFixed(0)}%</span>
          <span>{row.txnLabel} {(row.txnShare * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

function formatPriceLabel(p: number): string {
  if (p === 0) return "$0";
  if (p < 1) return `$${p.toFixed(2)}`;
  return fmtUSDExact(p);
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(0)}K`;
  return Math.round(n).toLocaleString("en-US");
}
