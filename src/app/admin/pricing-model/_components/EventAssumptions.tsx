"use client";

import type { LoanCategory } from "../_lib/types";
import { LOAN_LABELS } from "../_lib/types";
import type { EventAssumptions as EA } from "../_lib/events";
import { fmtUSDExact, fmtCount } from "../_lib/format";
import { Card } from "./primitives";

type Props = {
  assumptions: EA;
  setAssumptions: (next: EA) => void;
  /** Event focus: which counts to highlight. Affects what's emphasized in the UI. */
  focus: "redemption" | "application" | "offerGen" | "click";
  /** Live derived counts, for inline display. */
  counts: {
    redemptionsTotal: number;
    applicationsTotal: number;
    clicksTotal: number;
    offersGeneratedTotal: number;
  };
  members: number;
};

export function EventAssumptionsEditor({ assumptions, setAssumptions, focus, counts, members }: Props) {
  const update = <K extends keyof EA>(k: K, v: EA[K]) => setAssumptions({ ...assumptions, [k]: v });

  return (
    <Card title="Event-count assumptions">
      <div className="space-y-5">
        {/* Average loan size — drives loan redemptions */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-sm font-medium text-slate-700">Average loan size by category</div>
            <div className="text-xs text-slate-500">Origination $ ÷ avg size = loan count</div>
          </div>
          <div className="space-y-1.5">
            {(Object.keys(LOAN_LABELS) as LoanCategory[]).map((k) => (
              <div key={k} className="grid grid-cols-[1fr_160px] items-center gap-3 text-sm">
                <div className="text-slate-700">{LOAN_LABELS[k]}</div>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-xs text-slate-400">$</span>
                  <input
                    type="number"
                    value={assumptions.avgLoanSize[k]}
                    step={1000}
                    min={0}
                    onChange={(e) =>
                      update("avgLoanSize", {
                        ...assumptions.avgLoanSize,
                        [k]: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-32 px-2 py-1 border border-slate-300 rounded text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Other assumptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <NumField
            label="Avg new-deposit account size"
            value={assumptions.avgDepositSize}
            onChange={(v) => update("avgDepositSize", v)}
            prefix="$"
            step={500}
            hint="Deposit $ ÷ avg = new account count"
          />
          <NumField
            label="Application-to-funded ratio"
            value={assumptions.appToFundedRatio}
            onChange={(v) => update("appToFundedRatio", v)}
            step={0.1}
            hint="Apps per funded loan (industry: 2–3×)"
            suffix="×"
          />
          <NumField
            label="Offers per member per year"
            value={assumptions.offersPerMemberPerYear}
            onChange={(v) => update("offersPerMemberPerYear", v)}
            step={1}
            hint={`Members: ${fmtCount(members)} × this = annual offer volume`}
          />
          <NumField
            label="Click-to-application rate"
            value={Math.round(assumptions.clickToAppRate * 1000) / 10}
            onChange={(v) => update("clickToAppRate", Math.max(0.01, Math.min(100, v)) / 100)}
            step={1}
            hint="% of clicks that become applications. Industry: 15–30%."
            suffix="%"
          />
        </div>

        {/* Live count summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <CountStat label="Offers gen / yr" value={counts.offersGeneratedTotal} active={focus === "offerGen"} />
          <CountStat label="Clicks / yr" value={counts.clicksTotal} active={focus === "click"} />
          <CountStat label="Applications / yr" value={counts.applicationsTotal} active={focus === "application"} />
          <CountStat label="Redemptions / yr" value={counts.redemptionsTotal} active={focus === "redemption"} />
        </div>
      </div>
    </Card>
  );
}

function NumField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{prefix}</span>}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className={`w-full ${prefix ? "pl-6" : "pl-2"} ${suffix ? "pr-6" : "pr-2"} py-1.5 border border-slate-300 rounded text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{suffix}</span>}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

function CountStat({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div className={`text-center ${active ? "" : "opacity-60"}`}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</div>
      <div className={`font-mono font-semibold ${active ? "text-slate-900 text-lg" : "text-slate-700 text-sm"}`}>
        {fmtCount(value)}
      </div>
    </div>
  );
}

// Re-export so legacy imports keep working
export { fmtUSDExact };
