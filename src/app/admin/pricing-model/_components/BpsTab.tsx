"use client";

import type { CU, LoanCategory, DepositCategory, LoanTakeRates, DepositTakeRates } from "../_lib/types";
import { LOAN_LABELS, DEPOSIT_LABELS } from "../_lib/types";
import { fmtUSD, fmtUSDExact } from "../_lib/format";
import { calcBpsRevenue } from "../_lib/calc";
import { Card, Row, SliderInput, NumberInput, HelpPopover } from "./primitives";

export type BpsTabProps = {
  selectedCu: CU;

  loanPenetration: number;
  setLoanPenetration: (v: number) => void;
  depositPenetration: number;
  setDepositPenetration: (v: number) => void;
  depositChurnGrossup: number;
  setDepositChurnGrossup: (v: number) => void;
  monthlyFloor: number;
  setMonthlyFloor: (v: number) => void;

  loanBps: LoanTakeRates;
  setLoanBps: (next: LoanTakeRates) => void;
  depositBps: DepositTakeRates;
  setDepositBps: (next: DepositTakeRates) => void;

  loanEstimates: Record<LoanCategory, number>;
  loanOverrides: Partial<Record<LoanCategory, number>>;
  setLoanOverrides: (next: Partial<Record<LoanCategory, number>>) => void;
  loanVolumes: Record<LoanCategory, number>;

  depositEstimates: Record<DepositCategory, number>;
  depositOverrides: Partial<Record<DepositCategory, number>>;
  setDepositOverrides: (next: Partial<Record<DepositCategory, number>>) => void;
  depositVolumes: Record<DepositCategory, number>;
};

export function BpsTab(props: BpsTabProps) {
  const {
    selectedCu,
    loanPenetration,
    setLoanPenetration,
    depositPenetration,
    setDepositPenetration,
    depositChurnGrossup,
    setDepositChurnGrossup,
    monthlyFloor,
    setMonthlyFloor,
    loanBps,
    setLoanBps,
    depositBps,
    setDepositBps,
    loanEstimates,
    loanOverrides,
    setLoanOverrides,
    loanVolumes,
    depositEstimates,
    depositOverrides,
    setDepositOverrides,
    depositVolumes,
  } = props;

  const projected = calcBpsRevenue({
    loanVolumes,
    depositVolumes,
    loanBps,
    depositBps,
    loanPenetrationPct: loanPenetration,
    depositPenetrationPct: depositPenetration,
    monthlyFloor,
  });

  const sensitivities = [0.4, 1, 2, 3].map((mult) => ({
    multiplier: mult,
    loanPen: loanPenetration * mult,
    depositPen: depositPenetration * mult,
    ...calcBpsRevenue({
      loanVolumes,
      depositVolumes,
      loanBps,
      depositBps,
      loanPenetrationPct: loanPenetration * mult,
      depositPenetrationPct: depositPenetration * mult,
      monthlyFloor,
    }),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,420px)] gap-6">
      {/* INPUTS */}
      <div className="space-y-6">
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
              hint="Annual new-deposit volume estimated as: share balance × this factor."
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
                    money <i>flowed in</i> during the year (the flow). Pricing needs the flow.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs leading-relaxed">
                    annual new-deposit volume
                    <br />= share balance × gross-inflow factor
                  </div>
                  <p>
                    For <b>{selectedCu.name}</b> at the current setting:
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs leading-relaxed">
                    {fmtUSDExact(selectedCu.shares.total)} × {depositChurnGrossup}%
                    <br />= {fmtUSDExact(selectedCu.shares.total * (depositChurnGrossup / 100))} estimated new-deposit volume
                  </div>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    <b>This is the most uncertain assumption in the model.</b> Calibrate against the CU&apos;s actual gross
                    deposit inflows from internal reporting when possible.
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
          </div>
        </Card>

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
                onChangeBps={(v) => setLoanBps({ ...loanBps, [k]: v })}
                estimate={loanEstimates[k]}
                override={loanOverrides[k]}
                onChangeOverride={(v) => {
                  const next = { ...loanOverrides };
                  if (v == null) delete next[k];
                  else next[k] = v;
                  setLoanOverrides(next);
                }}
                penetration={loanPenetration}
              />
            ))}
          </div>
        </Card>

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
                onChangeBps={(v) => setDepositBps({ ...depositBps, [k]: v })}
                estimate={depositEstimates[k]}
                override={depositOverrides[k]}
                onChangeOverride={(v) => {
                  const next = { ...depositOverrides };
                  if (v == null) delete next[k];
                  else next[k] = v;
                  setDepositOverrides(next);
                }}
                penetration={depositPenetration}
              />
            ))}
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
              <div className="text-3xl md:text-4xl font-bold text-slate-900 break-all">
                {fmtUSDExact(projected.billed)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {projected.billed > projected.txnRev
                  ? `Floor active (${fmtUSDExact(projected.annualFloor)} > transaction revenue)`
                  : "Transaction revenue exceeds floor"}
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
              <Row label={`Lending module (${loanPenetration}% pen)`} value={fmtUSDExact(projected.loanRev)} />
              <Row label={`Deposit module (${depositPenetration}% pen)`} value={fmtUSDExact(projected.depositRev)} />
              <Row label="Total transaction revenue" value={fmtUSDExact(projected.txnRev)} bold />
              <Row label="Annual floor (12 × monthly)" value={fmtUSDExact(projected.annualFloor)} muted />
            </div>
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
  );
}

function RowHeader() {
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
  const volumeMillions = Math.round((volume / 1_000_000) * 100) / 100;

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

  return (
    <div className="md:grid md:grid-cols-[1.4fr_180px_140px_130px] md:items-center md:gap-3 md:py-1 border-b border-slate-100 last:border-0 md:border-0 py-3 first:pt-0">
      <div className="text-sm font-semibold text-slate-800 md:font-normal md:text-slate-700 mb-2 md:mb-0 flex items-baseline justify-between md:block">
        <span>{label}</span>
        <span className="md:hidden font-mono font-semibold text-slate-900 text-sm">{fmtUSDExact(revAtPen)}</span>
      </div>
      <div className="md:contents grid grid-cols-2 gap-3">
        <FieldLabel mobileLabel="Annual volume">{volumeInput}</FieldLabel>
        <FieldLabel mobileLabel="Take rate">{bpsInput}</FieldLabel>
      </div>
      <div className="hidden md:block text-right font-mono font-semibold text-slate-900">{fmtUSDExact(revAtPen)}</div>
    </div>
  );
}

function FieldLabel({ mobileLabel, children }: { mobileLabel: string; children: React.ReactNode }) {
  return (
    <div className="md:contents">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1 md:hidden">{mobileLabel}</div>
      {children}
    </div>
  );
}
