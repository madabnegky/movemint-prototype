"use client";

import type { CU } from "../_lib/types";
import type { SaasTierPrices } from "../_lib/types";
import type { EventAssumptions, EventCounts } from "../_lib/events";
import { calcSaasPerEventRevenue } from "../_lib/calc";
import { tierForAssets } from "../_lib/types";
import { fmtUSDExact, fmtCount } from "../_lib/format";
import { TieredSaasFee } from "./TieredSaasFee";
import { EventAssumptionsEditor } from "./EventAssumptions";
import { Card, Row } from "./primitives";

type EventKind = "redemption" | "application" | "offerGen" | "click";

const EVENT_LABELS: Record<EventKind, { title: string; one: string; description: string }> = {
  redemption: {
    title: "SaaS + per-redemption",
    one: "redemption",
    description: "Charge per offer redeemed (loan funded or new deposit account opened).",
  },
  application: {
    title: "SaaS + per-application",
    one: "application",
    description: "Charge per loan/deposit application started, regardless of whether it funded.",
  },
  offerGen: {
    title: "SaaS + per-offer-generated",
    one: "offer generated",
    description: "Charge per offer rendered to a member, regardless of whether they engaged.",
  },
  click: {
    title: "SaaS + per-click",
    one: "click",
    description: "Charge per click on an offer (intent signal between offer impression and application).",
  },
};

export type SaasPerEventTabProps = {
  selectedCu: CU;
  kind: EventKind;
  pricePerEventLoan: number;
  setPricePerEventLoan: (v: number) => void;
  pricePerEventDeposit: number;
  setPricePerEventDeposit: (v: number) => void;
  tierPrices: SaasTierPrices;
  setTierPrice: (id: string, v: number) => void;
  saasOverride: number | null;
  setSaasOverride: (v: number | null) => void;
  assumptions: EventAssumptions;
  setAssumptions: (a: EventAssumptions) => void;
  eventCounts: EventCounts;
};

export function SaasPerEventTab(props: SaasPerEventTabProps) {
  const {
    selectedCu,
    kind,
    pricePerEventLoan,
    setPricePerEventLoan,
    pricePerEventDeposit,
    setPricePerEventDeposit,
    tierPrices,
    saasOverride,
    setSaasOverride,
    assumptions,
    setAssumptions,
    eventCounts,
  } = props;
  const labels = EVENT_LABELS[kind];

  const counts = pickCounts(eventCounts, kind);
  const eventCountTotal = counts.loan + counts.deposit;
  const activeTier = tierForAssets(selectedCu.assets);
  const monthlySaas = saasOverride ?? (tierPrices[activeTier.id] ?? activeTier.defaultMonthly);

  const result = calcSaasPerEventRevenue({
    monthlySaas,
    pricePerEventLoan,
    pricePerEventDeposit,
    eventCountLoan: counts.loan,
    eventCountDeposit: counts.deposit,
  });
  const saasSharePct = result.saasShare * 100;
  const inSweetSpot = saasSharePct >= 60 && saasSharePct <= 80;

  // For each "suggested price" button, derive the per-event price needed
  // to hit the target SaaS share. The ratio between lending and deposit
  // prices is preserved (or set to 1:1 if both are currently 0).
  const pricesForTargetMix = (target: number) => {
    if (eventCountTotal <= 0) return { loan: 0, deposit: 0 };
    const requiredEventRev = result.saasRev * (1 / target - 1);
    // Default ratio: same per-event price across modules
    let loanShare = 0.5;
    if (counts.loan + counts.deposit > 0) {
      loanShare = counts.loan / (counts.loan + counts.deposit);
    }
    // Preserve current loan/deposit price ratio if user has tuned it
    const currentLoanRev = pricePerEventLoan * counts.loan;
    const currentDepRev = pricePerEventDeposit * counts.deposit;
    const currentTotalRev = currentLoanRev + currentDepRev;
    if (currentTotalRev > 0) {
      loanShare = currentLoanRev / currentTotalRev;
    }
    const eventRevLoan = requiredEventRev * loanShare;
    const eventRevDeposit = requiredEventRev - eventRevLoan;
    return {
      loan: counts.loan > 0 ? eventRevLoan / counts.loan : 0,
      deposit: counts.deposit > 0 ? eventRevDeposit / counts.deposit : 0,
    };
  };

  const apply = (target: number) => {
    const p = pricesForTargetMix(target);
    setPricePerEventLoan(round2(p.loan));
    setPricePerEventDeposit(round2(p.deposit));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,420px)] gap-6">
      {/* INPUTS */}
      <div className="space-y-6">
        <TieredSaasFee
          selectedAssets={selectedCu.assets}
          tierPrices={tierPrices}
          onChangeTierPrice={props.setTierPrice}
          override={saasOverride}
          onChangeOverride={setSaasOverride}
        />

        <Card title={`Price per ${labels.one} — by module`}>
          <p className="text-sm text-slate-600 mb-4">{labels.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ModulePriceField
              label="Lending module"
              hint={`${fmtCount(counts.loan)} ${labels.one}s/yr`}
              value={pricePerEventLoan}
              onChange={setPricePerEventLoan}
              one={labels.one}
            />
            <ModulePriceField
              label="Deposit module"
              hint={`${fmtCount(counts.deposit)} ${labels.one}s/yr`}
              value={pricePerEventDeposit}
              onChange={setPricePerEventDeposit}
              one={labels.one}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <SuggestedPrice
              label="Prices for 70% SaaS share"
              prices={pricesForTargetMix(0.7)}
              onApply={() => apply(0.7)}
            />
            <SuggestedPrice
              label="Prices for 60% SaaS share (more event-heavy)"
              prices={pricesForTargetMix(0.6)}
              onApply={() => apply(0.6)}
            />
          </div>
        </Card>

        <EventAssumptionsEditor
          assumptions={assumptions}
          setAssumptions={setAssumptions}
          focus={kind}
          counts={eventCounts}
          members={selectedCu.members}
        />
      </div>

      {/* OUTPUT (sticky) */}
      <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <Card title="Projected annual revenue" highlight>
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{labels.title}</div>
              <div className="text-3xl md:text-4xl font-bold text-slate-900 break-all">{fmtUSDExact(result.totalRev)}</div>
            </div>
            <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
              <Row label={`SaaS base (${fmtUSDExact(monthlySaas)}/mo × 12)`} value={fmtUSDExact(result.saasRev)} />
              <Row
                label={`Lending: ${fmtCount(counts.loan)} × ${fmtUSDExact(pricePerEventLoan)}`}
                value={fmtUSDExact(result.eventRevLoan)}
              />
              <Row
                label={`Deposit: ${fmtCount(counts.deposit)} × ${fmtUSDExact(pricePerEventDeposit)}`}
                value={fmtUSDExact(result.eventRevDeposit)}
              />
              <Row label="Total per-event revenue" value={fmtUSDExact(result.eventRev)} muted />
              <Row label="Total annual revenue" value={fmtUSDExact(result.totalRev)} bold />
            </div>
          </div>
        </Card>

        <Card title="Revenue mix vs. target (60–80% SaaS)">
          <div className="space-y-3">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs uppercase tracking-wider text-slate-500">SaaS share</span>
                <span
                  className={`text-2xl font-bold font-mono ${inSweetSpot ? "text-emerald-600" : "text-rose-600"}`}
                >
                  {saasSharePct.toFixed(1)}%
                </span>
              </div>
              <ShareBar value={result.saasShare} />
              <div className={`text-xs mt-2 ${inSweetSpot ? "text-emerald-700" : "text-rose-700"}`}>
                {inSweetSpot
                  ? "✓ In strategic sweet spot (60–80%)"
                  : saasSharePct < 60
                    ? `Below target — too event-heavy. Lower per-${labels.one} prices or raise SaaS tier.`
                    : `Above target — too SaaS-heavy. Raise per-${labels.one} prices or lower SaaS tier.`}
              </div>
            </div>
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-sm">
              <Row label="From SaaS" value={`${(result.saasShare * 100).toFixed(1)}%`} />
              <Row label={`From per-${labels.one}`} value={`${((1 - result.saasShare) * 100).toFixed(1)}%`} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function pickCounts(c: EventCounts, kind: EventKind): { loan: number; deposit: number } {
  if (kind === "redemption") return { loan: c.redemptionsLoan, deposit: c.redemptionsDeposit };
  if (kind === "application") return { loan: c.applicationsLoan, deposit: c.applicationsDeposit };
  if (kind === "click") return { loan: c.clicksLoan, deposit: c.clicksDeposit };
  return { loan: c.offersGeneratedLoan, deposit: c.offersGeneratedDeposit };
}

function ShareBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className="absolute top-0 bottom-0 bg-emerald-200/70"
        style={{ left: "60%", right: "20%" }}
        title="Sweet spot 60–80%"
      />
      <div
        className="absolute top-0 bottom-0 bg-slate-900 rounded-full transition-[width] duration-200"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ModulePriceField({
  label,
  hint,
  value,
  onChange,
  one,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  one: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-[11px] text-slate-500 font-mono">{hint}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm">$</span>
        <input
          type="number"
          value={value}
          step={0.01}
          min={0}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-base font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-500">/{one}</span>
      </div>
    </div>
  );
}

function SuggestedPrice({
  label,
  prices,
  onApply,
}: {
  label: string;
  prices: { loan: number; deposit: number };
  onApply: () => void;
}) {
  const valid = isFinite(prices.loan) && isFinite(prices.deposit) && prices.loan + prices.deposit > 0;
  if (!valid) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-400">
        <div className="font-medium">{label}</div>
        <div className="font-mono">—</div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onApply}
      className="bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-lg p-2.5 text-left transition-colors"
    >
      <div className="text-slate-600 font-medium">{label}</div>
      <div className="font-mono text-slate-900 text-sm font-semibold mt-0.5">
        ${round2(prices.loan).toFixed(2)} loan / ${round2(prices.deposit).toFixed(2)} deposit
      </div>
      <div className="text-[10px] text-blue-700 mt-0.5">Click to apply</div>
    </button>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
