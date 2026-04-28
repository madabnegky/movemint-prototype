"use client";

import { SAAS_TIERS, tierForAssets, type SaasTierPrices } from "../_lib/types";
import { fmtUSDExact } from "../_lib/format";
import { Card } from "./primitives";

/**
 * Tiered SaaS fee editor.
 *
 * Two layers of editing:
 *   1. Tier prices — apply to all CUs in that tier (global pricing strategy).
 *      Persisted in component-state for the session.
 *   2. Per-CU override — only this CU; overrides the tier price. Reset on CU change.
 *
 * Tier boundaries are LOCKED (Mode A). Only prices and the per-CU override are editable.
 */

export type TieredSaasFeeProps = {
  selectedAssets: number;
  tierPrices: SaasTierPrices;
  onChangeTierPrice: (tierId: string, monthly: number) => void;
  override: number | null;
  onChangeOverride: (monthly: number | null) => void;
};

export function TieredSaasFee({
  selectedAssets,
  tierPrices,
  onChangeTierPrice,
  override,
  onChangeOverride,
}: TieredSaasFeeProps) {
  const activeTier = tierForAssets(selectedAssets);
  const activeTierPrice = tierPrices[activeTier.id] ?? activeTier.defaultMonthly;
  const effectiveMonthly = override ?? activeTierPrice;

  return (
    <Card title="Tiered SaaS base fee">
      <div className="space-y-4">
        {/* Active tier callout */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs uppercase tracking-wider text-blue-700 font-medium mb-1">Selected CU</div>
          <div className="text-sm text-slate-900">
            <b>{fmtUSDExact(selectedAssets)}</b> in assets — falls in tier <b>{activeTier.label}</b>
          </div>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <span className="text-slate-600">This client pays:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">$</span>
              <input
                type="number"
                value={Math.round(effectiveMonthly)}
                step={100}
                min={0}
                onChange={(e) => {
                  const v = Math.max(0, Number(e.target.value));
                  if (v === activeTierPrice) onChangeOverride(null);
                  else onChangeOverride(v);
                }}
                className={`w-28 px-2 py-1 border rounded text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  override != null ? "border-blue-400 bg-white" : "border-slate-300 bg-white"
                }`}
              />
              <span className="text-xs text-slate-500">/mo</span>
              {override != null && (
                <button
                  type="button"
                  onClick={() => onChangeOverride(null)}
                  className="text-[11px] text-blue-700 hover:text-blue-900 underline whitespace-nowrap"
                  title={`Tier price: ${fmtUSDExact(activeTierPrice)}/mo`}
                >
                  reset to tier
                </button>
              )}
            </div>
          </div>
          {override != null && (
            <div className="text-[11px] text-slate-500 mt-1">Overriding tier price for this CU only.</div>
          )}
        </div>

        {/* All-tiers editor */}
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-medium mb-2">
            All tier prices (apply globally)
          </div>
          <div className="space-y-1.5">
            {SAAS_TIERS.map((t) => {
              const isActive = t.id === activeTier.id;
              const price = tierPrices[t.id] ?? t.defaultMonthly;
              return (
                <div
                  key={t.id}
                  className={`grid grid-cols-[1fr_140px_120px] items-center gap-3 px-3 py-1.5 rounded ${
                    isActive ? "bg-slate-100" : ""
                  }`}
                >
                  <div className="text-sm text-slate-700 font-mono">
                    {t.label}
                    {isActive && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-blue-700 font-semibold">
                        active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      value={price}
                      step={100}
                      min={0}
                      onChange={(e) => onChangeTierPrice(t.id, Math.max(0, Number(e.target.value)))}
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500">/mo</span>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">
                    {fmtUSDExact(price * 12)}/yr
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
