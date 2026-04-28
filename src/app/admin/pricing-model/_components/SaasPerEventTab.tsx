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

type EventKind = "redemption" | "application" | "offerGen";

const EVENT_LABELS: Record<EventKind, { title: string; one: string; many: string; description: string }> = {
  redemption: {
    title: "SaaS + per-redemption",
    one: "redemption",
    many: "redemptions",
    description: "Charge per offer redeemed (loan funded or new deposit account opened).",
  },
  application: {
    title: "SaaS + per-application",
    one: "application",
    many: "applications",
    description: "Charge per loan/deposit application started, regardless of whether it funded.",
  },
  offerGen: {
    title: "SaaS + per-offer-generated",
    one: "offer generated",
    many: "offers generated",
    description: "Charge per offer rendered to a member, regardless of whether they engaged.",
  },
};

export type SaasPerEventTabProps = {
  selectedCu: CU;
  kind: EventKind;
  pricePerEvent: number;
  setPricePerEvent: (v: number) => void;
  tierPrices: SaasTierPrices;
  setTierPrice: (id: string, v: number) => void;
  saasOverride: number | null;
  setSaasOverride: (v: number | null) => void;
  assumptions: EventAssumptions;
  setAssumptions: (a: EventAssumptions) => void;
  eventCounts: EventCounts;
};

export function SaasPerEventTab(props: SaasPerEventTabProps) {
  const { selectedCu, kind, pricePerEvent, setPricePerEvent, tierPrices, saasOverride, setSaasOverride, assumptions, setAssumptions, eventCounts } = props;
  const labels = EVENT_LABELS[kind];

  const eventCount = pickCount(eventCounts, kind);
  const activeTier = tierForAssets(selectedCu.assets);
  const monthlySaas = saasOverride ?? (tierPrices[activeTier.id] ?? activeTier.defaultMonthly);

  const result = calcSaasPerEventRevenue({ monthlySaas, pricePerEvent, eventCount });
  const saasSharePct = result.saasShare * 100;
  const inSweetSpot = saasSharePct >= 60 && saasSharePct <= 80;

  // Inverse: at the current event count + tier SaaS, what price-per-event hits 70% SaaS share?
  // total = saas / 0.70  →  eventRev = total - saas = saas / 0.70 - saas = saas × (1/0.70 - 1)
  // pricePerEvent = eventRev / eventCount
  const pricePerEventForTargetMix = (target: number) => {
    if (eventCount <= 0) return 0;
    const requiredEventRev = result.saasRev * (1 / target - 1);
    return requiredEventRev / eventCount;
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

        <Card title={`Price per ${labels.one}`}>
          <p className="text-sm text-slate-600 mb-3">{labels.description}</p>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">$</span>
            <input
              type="number"
              value={pricePerEvent}
              step={0.01}
              min={0}
              onChange={(e) => setPricePerEvent(Math.max(0, Number(e.target.value)))}
              className="w-40 px-3 py-2 border border-slate-300 rounded-lg text-base font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-500">per {labels.one}</span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <SuggestedPrice
              label="Price for 70% SaaS share"
              value={pricePerEventForTargetMix(0.7)}
              onApply={() => setPricePerEvent(round2(pricePerEventForTargetMix(0.7)))}
            />
            <SuggestedPrice
              label="Price for 60% SaaS share (more event-heavy)"
              value={pricePerEventForTargetMix(0.6)}
              onApply={() => setPricePerEvent(round2(pricePerEventForTargetMix(0.6)))}
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
                label={`Per-${labels.one} (${fmtCount(eventCount)} × ${fmtUSDExact(pricePerEvent)})`}
                value={fmtUSDExact(result.eventRev)}
              />
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
                    ? `Below target — too event-heavy. Lower price per ${labels.one} or raise SaaS tier.`
                    : `Above target — too SaaS-heavy. Raise price per ${labels.one} or lower SaaS tier.`}
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

function pickCount(c: EventCounts, kind: EventKind): number {
  if (kind === "redemption") return c.redemptionsTotal;
  if (kind === "application") return c.applicationsTotal;
  return c.offersGeneratedTotal;
}

function ShareBar({ value }: { value: number }) {
  // Highlight 60-80% sweet spot zone on a 0-100 bar.
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

function SuggestedPrice({ label, value, onApply }: { label: string; value: number; onApply: () => void }) {
  if (!isFinite(value) || value <= 0) {
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
      <div className="font-mono text-slate-900 text-sm font-semibold mt-0.5">${round2(value).toFixed(2)}</div>
      <div className="text-[10px] text-blue-700 mt-0.5">Click to apply</div>
    </button>
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
