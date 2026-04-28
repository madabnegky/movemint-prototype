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
 * SaaS + per-event revenue with module-split pricing.
 *   - Lending events priced separately from deposit events
 *   - SaaS base is a single shared monthly fee
 */
export type SaasPerEventInput = {
  monthlySaas: number;
  pricePerEventLoan: number;
  pricePerEventDeposit: number;
  eventCountLoan: number;
  eventCountDeposit: number;
};

export type SaasPerEventOutput = {
  saasRev: number;
  eventRevLoan: number;
  eventRevDeposit: number;
  eventRev: number;
  totalRev: number;
  saasShare: number; // 0..1
};

export function calcSaasPerEventRevenue(i: SaasPerEventInput): SaasPerEventOutput {
  const saasRev = i.monthlySaas * 12;
  const eventRevLoan = i.pricePerEventLoan * i.eventCountLoan;
  const eventRevDeposit = i.pricePerEventDeposit * i.eventCountDeposit;
  const eventRev = eventRevLoan + eventRevDeposit;
  const totalRev = saasRev + eventRev;
  const saasShare = totalRev > 0 ? saasRev / totalRev : 1;
  return { saasRev, eventRevLoan, eventRevDeposit, eventRev, totalRev, saasShare };
}

// ---------- Back-solve ----------
// Given a target revenue and a target SaaS share, derive BOTH the recommended
// monthly SaaS fee AND the per-event prices that together hit:
//   - total revenue = target
//   - SaaS share    = target%  (default 70%)
//
// For Repricing, SaaS is an OUTPUT, not an input — the existing-client tool
// recommends what Movemint should charge, it doesn't validate against a
// pre-set tier price.
//
// Math:
//   saasRev   = targetSaasShare × targetRev
//   eventRev  = (1 - targetSaasShare) × targetRev
//   monthlySaas (recommended) = saasRev / 12
//   eventRev split across modules proportional to event count, then divided
//   by per-module count to get per-event price.

export type BackSolveSaasInput = {
  targetTotalRev: number;
  targetSaasSharePct: number; // e.g. 70 for 70%
  eventCountLoan: number;
  eventCountDeposit: number;
  /**
   * Lending events priced this many × deposit events. Default 1 (equal).
   * Set to e.g. 2 to reflect that loan conversions are higher-value than
   * deposit conversions. Only matters when both module counts are nonzero.
   */
  lendingPremium?: number;
};

export type BackSolveSaasOutput = {
  recommendedMonthlySaas: number;
  recommendedSaasRev: number;        // recommendedMonthlySaas × 12
  pricePerEventLoan: number;
  pricePerEventDeposit: number;
  eventRevTarget: number;
  /** "ok" if both modules have nonzero counts; "no_events" otherwise. */
  feasibility: "ok" | "no_events";
};

export function backSolveSaasPerEvent(i: BackSolveSaasInput): BackSolveSaasOutput {
  const targetSaasShare = i.targetSaasSharePct / 100;
  const recommendedSaasRev = i.targetTotalRev * targetSaasShare;
  const recommendedMonthlySaas = recommendedSaasRev / 12;
  const eventRevTarget = i.targetTotalRev * (1 - targetSaasShare);

  const premium = i.lendingPremium ?? 1;
  const totalCount = i.eventCountLoan + i.eventCountDeposit;

  // Solve for pDep with constraint pLoan = premium × pDep:
  //   eventRev = pLoan × loanCount + pDep × depCount
  //            = premium × pDep × loanCount + pDep × depCount
  //            = pDep × (premium × loanCount + depCount)
  // → pDep = eventRev / (premium × loanCount + depCount)
  // Edge cases: when one module has 0 events, the constraint doesn't bind
  // (no relative pricing to anchor); fall back to allocating all event
  // revenue to the active module.
  let pricePerEventLoan = 0;
  let pricePerEventDeposit = 0;
  if (totalCount > 0) {
    if (i.eventCountLoan === 0) {
      pricePerEventDeposit = eventRevTarget / i.eventCountDeposit;
    } else if (i.eventCountDeposit === 0) {
      pricePerEventLoan = eventRevTarget / i.eventCountLoan;
    } else {
      const denom = premium * i.eventCountLoan + i.eventCountDeposit;
      pricePerEventDeposit = eventRevTarget / denom;
      pricePerEventLoan = premium * pricePerEventDeposit;
    }
  }

  return {
    recommendedMonthlySaas,
    recommendedSaasRev,
    pricePerEventLoan,
    pricePerEventDeposit,
    eventRevTarget,
    feasibility: totalCount > 0 ? "ok" : "no_events",
  };
}

/**
 * Back-solve the BPS model: scale per-category rates AND derive the
 * monthly floor that together hit:
 *   - total revenue = target
 *   - floor share   = targetSaasSharePct  (floor plays the SaaS role here)
 *
 * Math:
 *   floorRev  = targetSaasShare × targetRev → monthlyFloor = floorRev / 12
 *   bpsRev    = (1 - targetSaasShare) × targetRev
 *   multiplier = bpsRev / baseBpsRev    (uniform scale on existing per-category rates)
 */
export type BackSolveBpsInput = {
  targetTotalRev: number;
  targetSaasSharePct: number;
  loanVolumes: Record<LoanCategory, number>;
  depositVolumes: Record<DepositCategory, number>;
  baseLoanBps: LoanTakeRates;
  baseDepositBps: DepositTakeRates;
  loanPenetrationPct: number;
  depositPenetrationPct: number;
};

export type BackSolveBpsOutput = {
  multiplier: number;
  scaledLoanBps: LoanTakeRates;
  scaledDepositBps: DepositTakeRates;
  recommendedMonthlyFloor: number;
  recommendedFloorRev: number;
  projectedBpsRev: number;
  /** "ok" if base bps revenue is nonzero; "no_volume" if there's nothing to scale. */
  feasibility: "ok" | "no_volume";
};

export function backSolveBps(i: BackSolveBpsInput): BackSolveBpsOutput {
  const targetSaasShare = i.targetSaasSharePct / 100;
  const recommendedFloorRev = i.targetTotalRev * targetSaasShare;
  const recommendedMonthlyFloor = recommendedFloorRev / 12;
  const targetBpsRev = i.targetTotalRev * (1 - targetSaasShare);

  // Compute baseline bps revenue at multiplier=1.0 (no floor — the
  // floor is recommended separately above and isn't part of the bps math).
  const lf = i.loanPenetrationPct / 100;
  const df = i.depositPenetrationPct / 100;
  let baseBpsRev = 0;
  (Object.keys(i.loanVolumes) as LoanCategory[]).forEach((k) => {
    baseBpsRev += i.loanVolumes[k] * lf * (i.baseLoanBps[k] / 10000);
  });
  (Object.keys(i.depositVolumes) as DepositCategory[]).forEach((k) => {
    baseBpsRev += i.depositVolumes[k] * df * (i.baseDepositBps[k] / 10000);
  });

  if (baseBpsRev <= 0) {
    return {
      multiplier: 1,
      scaledLoanBps: i.baseLoanBps,
      scaledDepositBps: i.baseDepositBps,
      recommendedMonthlyFloor,
      recommendedFloorRev,
      projectedBpsRev: 0,
      feasibility: "no_volume",
    };
  }

  const multiplier = targetBpsRev / baseBpsRev;
  const scaledLoanBps = scaleRates(i.baseLoanBps, multiplier);
  const scaledDepositBps = scaleRates(i.baseDepositBps, multiplier);

  return {
    multiplier,
    scaledLoanBps,
    scaledDepositBps,
    recommendedMonthlyFloor,
    recommendedFloorRev,
    projectedBpsRev: targetBpsRev,
    feasibility: "ok",
  };
}

function scaleRates<T extends Record<string, number>>(rates: T, mult: number): T {
  const out = {} as T;
  (Object.keys(rates) as Array<keyof T>).forEach((k) => {
    out[k] = (rates[k] * mult) as T[keyof T];
  });
  return out;
}
