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

// ─────────────────────────────────────────────────────────────────────────────
// ROI Calculator — CU perspective
// Models incremental interest income the CU earns from Movemint-driven
// originations vs. the fully-loaded cost (bureau + marketing + Movemint fee).
// ─────────────────────────────────────────────────────────────────────────────

export type RoiLoanProduct = {
  label: string;
  // From NCUA / user override
  totalMembers: number;          // CU member count
  pctMembersWithOffers: number;  // % of members who receive offers (0-100)
  responseRate: number;          // acceptance/response rate (0-100)
  avgLoanSize: number;           // $ per funded loan
  avgYieldPct: number;           // annual interest rate on the loan (%)
  avgTermMonths: number;         // average loan term in months
  organicVolume: number;         // $ originated without Movemint (baseline)
};

export type RoiDepositProduct = {
  label: string;
  totalMembers: number;
  pctMembersWithOffers: number;
  responseRate: number;
  avgAccountSize: number;        // $ per new deposit account
  deploymentYieldPct: number;    // CU deploys funds at this yield (%)
  avgRatePaidPct: number;        // CU pays members this rate (%)
  organicVolume: number;         // new deposit $ opened without Movemint
};

export type RoiNiiProduct = {
  label: string;
  attachmentRatePct: number;     // % of funded loans that purchase this NII product (0-100)
  avgFee: number;                // average net commission/fee revenue per product
  enabled: boolean;
};

export type RoiCosts = {
  bureauCostPerCampaign: number;    // default $30,000
  marketingCostPerCampaign: number; // default $20,000
  campaignsPerYear: number;         // default 4
  movemintAnnualFee: number;        // Movemint fee (standalone input)
};

export type RoiScenarioResult = {
  responseRate: number;           // the rate used for this scenario (%)

  // Loans
  loanOffersGenerated: number;
  loanIncrementalFunded: number;  // count of loans
  loanIncrementalVolume: number;  // $ volume
  loanInterestIncome: number;     // annual interest income $

  // Deposits
  depositOffersGenerated: number;
  depositIncrementalAccounts: number;
  depositIncrementalVolume: number;
  depositNetSpreadIncome: number; // annual net spread income $

  // NII
  niiIncome: number;              // total Non-Interest Income $

  // Totals
  totalIncrementalIncome: number;
  totalCosts: number;
  netRoi: number;                 // income - costs
  roiMultiple: number;            // income / costs (or 0 if costs=0)
};

export type RoiCalcInput = {
  loanProducts: RoiLoanProduct[];
  depositProducts: RoiDepositProduct[];
  niiProducts: RoiNiiProduct[];
  costs: RoiCosts;
  // Three response rate scenarios — computed separately for each
  scenarioRates: [number, number, number]; // e.g. [1, 2, 4]
};

export type RoiCalcOutput = {
  conservative: RoiScenarioResult;
  base: RoiScenarioResult;
  optimistic: RoiScenarioResult;
  // Per-product drill-down (using base rate)
  loanBreakdown: Array<{
    label: string;
    offersGenerated: number;
    incrementalFunded: number;
    incrementalVolume: number;
    interestIncome: number;
    organicVolume: number;
  }>;
  depositBreakdown: Array<{
    label: string;
    offersGenerated: number;
    incrementalAccounts: number;
    incrementalVolume: number;
    netSpreadIncome: number;
    organicVolume: number;
  }>;
  niiBreakdown: Array<{
    label: string;
    attachmentRatePct: number;
    avgFee: number;
    unitsSold: number;
    revenue: number;
    enabled: boolean;
  }>;
};

function calcScenario(
  loanProducts: RoiLoanProduct[],
  depositProducts: RoiDepositProduct[],
  niiProducts: RoiNiiProduct[],
  costs: RoiCosts,
  responseRatePct: number,
): RoiScenarioResult {
  const rr = responseRatePct / 100;

  let loanOffersGenerated = 0;
  let loanIncrementalFunded = 0;
  let loanIncrementalVolume = 0;
  let loanInterestIncome = 0;

  for (const p of loanProducts) {
    const offers = p.totalMembers * (p.pctMembersWithOffers / 100);
    const funded = offers * rr;
    const vol = funded * p.avgLoanSize;
    // Simple interest income: principal × annual rate × (term / 12)
    // Approximates total interest earned over the life of the loan.
    const income = vol * (p.avgYieldPct / 100) * (p.avgTermMonths / 12);
    loanOffersGenerated += offers;
    loanIncrementalFunded += funded;
    loanIncrementalVolume += vol;
    loanInterestIncome += income;
  }

  let depositOffersGenerated = 0;
  let depositIncrementalAccounts = 0;
  let depositIncrementalVolume = 0;
  let depositNetSpreadIncome = 0;

  for (const p of depositProducts) {
    const offers = p.totalMembers * (p.pctMembersWithOffers / 100);
    const accounts = offers * rr;
    const vol = accounts * p.avgAccountSize;
    const netSpreadPct = (p.deploymentYieldPct - p.avgRatePaidPct) / 100;
    const income = vol * netSpreadPct; // annual net spread income
    depositOffersGenerated += offers;
    depositIncrementalAccounts += accounts;
    depositIncrementalVolume += vol;
    depositNetSpreadIncome += income;
  }

  let niiIncome = 0;
  for (const p of niiProducts) {
    if (p.enabled) {
      const units = loanIncrementalFunded * (p.attachmentRatePct / 100);
      const revenue = units * p.avgFee;
      niiIncome += revenue;
    }
  }

  const totalIncrementalIncome = loanInterestIncome + depositNetSpreadIncome + niiIncome;
  const totalCosts =
    costs.bureauCostPerCampaign * costs.campaignsPerYear +
    costs.marketingCostPerCampaign * costs.campaignsPerYear +
    costs.movemintAnnualFee;
  const netRoi = totalIncrementalIncome - totalCosts;
  const roiMultiple = totalCosts > 0 ? totalIncrementalIncome / totalCosts : 0;

  return {
    responseRate: responseRatePct,
    loanOffersGenerated,
    loanIncrementalFunded,
    loanIncrementalVolume,
    loanInterestIncome,
    depositOffersGenerated,
    depositIncrementalAccounts,
    depositIncrementalVolume,
    depositNetSpreadIncome,
    niiIncome,
    totalIncrementalIncome,
    totalCosts,
    netRoi,
    roiMultiple,
  };
}

export function calcRoi(input: RoiCalcInput): RoiCalcOutput {
  const [r1, r2, r3] = input.scenarioRates;
  const conservative = calcScenario(input.loanProducts, input.depositProducts, input.niiProducts, input.costs, r1);
  const base = calcScenario(input.loanProducts, input.depositProducts, input.niiProducts, input.costs, r2);
  const optimistic = calcScenario(input.loanProducts, input.depositProducts, input.niiProducts, input.costs, r3);

  // Per-product drill-down uses the base response rate
  const baseRr = r2 / 100;

  const loanBreakdown = input.loanProducts.map((p) => {
    const offers = p.totalMembers * (p.pctMembersWithOffers / 100);
    const funded = offers * baseRr;
    const vol = funded * p.avgLoanSize;
    const income = vol * (p.avgYieldPct / 100) * (p.avgTermMonths / 12);
    return {
      label: p.label,
      offersGenerated: offers,
      incrementalFunded: funded,
      incrementalVolume: vol,
      interestIncome: income,
      organicVolume: p.organicVolume,
    };
  });

  const depositBreakdown = input.depositProducts.map((p) => {
    const offers = p.totalMembers * (p.pctMembersWithOffers / 100);
    const accounts = offers * baseRr;
    const vol = accounts * p.avgAccountSize;
    const netSpreadPct = (p.deploymentYieldPct - p.avgRatePaidPct) / 100;
    const income = vol * netSpreadPct;
    return {
      label: p.label,
      offersGenerated: offers,
      incrementalAccounts: accounts,
      incrementalVolume: vol,
      netSpreadIncome: income,
      organicVolume: p.organicVolume,
    };
  });

  // Calculate NII at the base rate for the breakdown
  let baseLoanIncrementalFunded = 0;
  for (const p of input.loanProducts) {
    const offers = p.totalMembers * (p.pctMembersWithOffers / 100);
    const funded = offers * baseRr;
    baseLoanIncrementalFunded += funded;
  }

  const niiBreakdown = input.niiProducts.map((p) => {
    const units = p.enabled ? baseLoanIncrementalFunded * (p.attachmentRatePct / 100) : 0;
    const revenue = units * p.avgFee;
    return {
      label: p.label,
      attachmentRatePct: p.attachmentRatePct,
      avgFee: p.avgFee,
      unitsSold: units,
      revenue,
      enabled: p.enabled,
    };
  });

  return { conservative, base, optimistic, loanBreakdown, depositBreakdown, niiBreakdown };
}
