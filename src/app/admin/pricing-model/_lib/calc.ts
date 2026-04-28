import type { LoanCategory, DepositCategory, LoanTakeRates, DepositTakeRates } from "./types";

export type BpsCalcInput = {
  loanVolumes: Record<LoanCategory, number>;
  depositVolumes: Record<DepositCategory, number>;
  loanBps: LoanTakeRates;
  depositBps: DepositTakeRates;
  loanPenetrationPct: number;
  depositPenetrationPct: number;
  monthlyFloor: number;
};

export type BpsCalcOutput = {
  loanRev: number;
  depositRev: number;
  txnRev: number;
  annualFloor: number;
  billed: number; // max(annualFloor, txnRev)
};

export function calcBpsRevenue(i: BpsCalcInput): BpsCalcOutput {
  const lf = i.loanPenetrationPct / 100;
  const df = i.depositPenetrationPct / 100;
  let loanRev = 0;
  (Object.keys(i.loanVolumes) as LoanCategory[]).forEach((k) => {
    loanRev += i.loanVolumes[k] * lf * (i.loanBps[k] / 10000);
  });
  let depositRev = 0;
  (Object.keys(i.depositVolumes) as DepositCategory[]).forEach((k) => {
    depositRev += i.depositVolumes[k] * df * (i.depositBps[k] / 10000);
  });
  const txnRev = loanRev + depositRev;
  const annualFloor = i.monthlyFloor * 12;
  return { loanRev, depositRev, txnRev, annualFloor, billed: Math.max(annualFloor, txnRev) };
}

/**
 * SaaS + per-event revenue. Used by all three event-based pricing models.
 * No floor here — the SaaS base IS the floor (clients pay it regardless).
 */
export function calcSaasPerEventRevenue(args: {
  monthlySaas: number;
  pricePerEvent: number;
  eventCount: number;
}): {
  saasRev: number;
  eventRev: number;
  totalRev: number;
  saasShare: number; // 0..1
} {
  const saasRev = args.monthlySaas * 12;
  const eventRev = args.pricePerEvent * args.eventCount;
  const totalRev = saasRev + eventRev;
  const saasShare = totalRev > 0 ? saasRev / totalRev : 1;
  return { saasRev, eventRev, totalRev, saasShare };
}
