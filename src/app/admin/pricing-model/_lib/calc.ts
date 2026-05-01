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
  /**
   * Lock the recommended SaaS at this monthly value (and let per-event
   * pricing absorb the difference between SaaS rev and target). When set,
   * the targetSaasSharePct only determines per-event allocation if that
   * value happens to match — typically used to freeze SaaS at a tier-median
   * (computed at 100% target) so revenue growth flows entirely through
   * transaction fees.
   */
  overrideMonthlySaas?: number;
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
  // If overrideMonthlySaas is provided, freeze SaaS at that value and let
  // per-event pricing absorb the gap to target. Otherwise compute SaaS from
  // the strategic mix (target × saasShare).
  const recommendedMonthlySaas =
    i.overrideMonthlySaas != null
      ? i.overrideMonthlySaas
      : (i.targetTotalRev * (i.targetSaasSharePct / 100)) / 12;
  const recommendedSaasRev = recommendedMonthlySaas * 12;
  const eventRevTarget = Math.max(0, i.targetTotalRev - recommendedSaasRev);

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
 * Back-solve the BPS model — application-derived funded volume.
 *
 * Funded volume is derived from the client's actual application counts in
 * the CSV (no NCUA dependency). Math:
 *
 *   loanFundedCount       = applicationsLoan × loanFundingRate
 *   loanFundedVolume      = loanFundedCount × avgLoanSize
 *   depositFundedCount    = applicationsDeposit × depositFundingRate
 *   depositFundedVolume   = depositFundedCount × avgDepositSize
 *
 * Then back-solve to the strategic mix:
 *
 *   floorRev          = targetSaasShare × targetRev → monthlyFloor = floorRev / 12
 *   bpsRev            = (1 - targetSaasShare) × targetRev
 *   bpsRev split across modules with the same lending-premium constraint as
 *   per-event back-solve. With premium p, total bps revenue is:
 *     bpsRev = bpsLoan × loanVolume + bpsDeposit × depositVolume
 *     bpsLoan = p × bpsDeposit
 *   →  bpsDeposit = bpsRev / (p × loanVolume + depositVolume)  (in dollars per dollar of volume)
 *      bpsLoan    = p × bpsDeposit
 *   The result is the per-module rate-card bps to put on the rate card.
 */
export type BackSolveBpsInput = {
  targetTotalRev: number;
  targetSaasSharePct: number;
  applicationsLoan: number;
  applicationsDeposit: number;
  loanFundingRate: number;     // 0..1 — % of loan apps that fund
  depositFundingRate: number;  // 0..1 — % of deposit apps that fund
  avgLoanSize: number;         // $ — avg funded loan size
  avgDepositSize: number;      // $ — avg new-deposit account size
  /** Lending bps priced this many × deposit bps. Default 1. */
  lendingPremium?: number;
  /**
   * Lock the recommended floor at this monthly value (BPS analogue of
   * overrideMonthlySaas — bps rates absorb the gap to target).
   */
  overrideMonthlyFloor?: number;
};

export type BackSolveBpsOutput = {
  recommendedMonthlyFloor: number;
  recommendedFloorRev: number;
  recommendedLoanBps: number;     // basis points on funded loan volume
  recommendedDepositBps: number;  // basis points on funded deposit volume
  loanFundedVolume: number;       // $ — for transparency in the UI
  depositFundedVolume: number;    // $
  bpsRevTarget: number;
  feasibility: "ok" | "no_volume";
};

export function backSolveBps(i: BackSolveBpsInput): BackSolveBpsOutput {
  // Mirror of backSolveSaasPerEvent: if overrideMonthlyFloor is provided,
  // freeze the floor and let bps rates absorb the gap to target.
  const recommendedMonthlyFloor =
    i.overrideMonthlyFloor != null
      ? i.overrideMonthlyFloor
      : (i.targetTotalRev * (i.targetSaasSharePct / 100)) / 12;
  const recommendedFloorRev = recommendedMonthlyFloor * 12;
  const bpsRevTarget = Math.max(0, i.targetTotalRev - recommendedFloorRev);
  const premium = i.lendingPremium ?? 1;

  const loanFundedVolume = i.applicationsLoan * i.loanFundingRate * i.avgLoanSize;
  const depositFundedVolume = i.applicationsDeposit * i.depositFundingRate * i.avgDepositSize;

  if (loanFundedVolume + depositFundedVolume <= 0) {
    return {
      recommendedMonthlyFloor,
      recommendedFloorRev,
      recommendedLoanBps: 0,
      recommendedDepositBps: 0,
      loanFundedVolume: 0,
      depositFundedVolume: 0,
      bpsRevTarget,
      feasibility: "no_volume",
    };
  }

  // Solve for bpsDeposit (as a decimal rate, not yet bps), then scale to bps.
  // Edge case: if one module has 0 volume, the constraint doesn't bind —
  // allocate all bps revenue to the active module.
  let rateLoan = 0;
  let rateDeposit = 0;
  if (loanFundedVolume === 0) {
    rateDeposit = bpsRevTarget / depositFundedVolume;
  } else if (depositFundedVolume === 0) {
    rateLoan = bpsRevTarget / loanFundedVolume;
  } else {
    const denom = premium * loanFundedVolume + depositFundedVolume;
    rateDeposit = bpsRevTarget / denom;
    rateLoan = premium * rateDeposit;
  }

  return {
    recommendedMonthlyFloor,
    recommendedFloorRev,
    recommendedLoanBps: rateLoan * 10000,
    recommendedDepositBps: rateDeposit * 10000,
    loanFundedVolume,
    depositFundedVolume,
    bpsRevTarget,
    feasibility: "ok",
  };
}
