import type { CU, LoanCategory, DepositCategory } from "./types";
import { DEFAULT_AVG_LOAN_SIZE, DEFAULT_AVG_DEPOSIT_SIZE, DEFAULT_APP_TO_FUNDED_RATIO, DEFAULT_OFFERS_PER_MEMBER_PER_YEAR } from "./types";

/**
 * Volume estimates by category. Originations and new-deposit dollar volumes,
 * before any penetration is applied. These match the BPS tab's volume model.
 */
export type VolumeMix = {
  loans: Record<LoanCategory, number>;   // origination $ per category, full year
  deposits: Record<DepositCategory, number>; // estimated new-deposit $ per category, full year
};

export function deriveLoanVolumes(cu: CU): Record<LoanCategory, number> {
  return {
    firstMortgage: cu.originations.firstMortgageEst,
    heloc: cu.originations.helocEst,
    auto: cu.originations.autoEst,
    creditCard: cu.originations.creditCardEst,
    unsecured: cu.originations.unsecuredEst,
    commercial: cu.originations.commercialEst,
  };
}

export function deriveDepositVolumes(cu: CU, grossInflowPct: number): Record<DepositCategory, number> {
  const f = grossInflowPct / 100;
  return {
    drafts: cu.shares.drafts * f,
    regular: cu.shares.regular * f,
    mma: cu.shares.mma * f,
    cds: cu.shares.cds * f,
    ira: cu.shares.ira * f,
  };
}

/**
 * Event-counting model. Pricing models 2–4 charge per event; this computes
 * the count of events given current volume estimates and overrideable
 * conversion assumptions.
 *
 * Redemptions: a conversion (loan funded or new deposit account opened).
 *   loans:    origination_volume × penetration ÷ avg_loan_size
 *   deposits: deposit_volume     × penetration ÷ avg_deposit_size
 *
 * Applications: started loan/deposit applications, regardless of funding.
 *   = redemptions × app_to_funded_ratio
 *
 * Offers generated: offers shown to members. Largely independent of
 * loan/deposit volume — it's a function of member base × campaign cadence.
 *   = members × offers_per_member_per_year × penetration_blend
 *
 * The `penetration_blend` for offer-gen uses the average of loan & deposit
 * penetration since offers cut across both modules. This is configurable.
 */
export type EventAssumptions = {
  avgLoanSize: Record<LoanCategory, number>;      // editable
  avgDepositSize: number;                         // editable
  appToFundedRatio: number;                       // editable
  offersPerMemberPerYear: number;                 // editable
  loanPenetrationPct: number;                     // shared with BPS tab
  depositPenetrationPct: number;                  // shared with BPS tab
};

export const DEFAULT_EVENT_ASSUMPTIONS: Omit<EventAssumptions, "loanPenetrationPct" | "depositPenetrationPct"> = {
  avgLoanSize: { ...DEFAULT_AVG_LOAN_SIZE },
  avgDepositSize: DEFAULT_AVG_DEPOSIT_SIZE,
  appToFundedRatio: DEFAULT_APP_TO_FUNDED_RATIO,
  offersPerMemberPerYear: DEFAULT_OFFERS_PER_MEMBER_PER_YEAR,
};

export type EventCounts = {
  redemptionsLoan: number;
  redemptionsDeposit: number;
  redemptionsTotal: number;
  applicationsTotal: number;
  offersGeneratedTotal: number;
};

export function calcEventCounts(
  loanVolumes: Record<LoanCategory, number>,
  depositVolumes: Record<DepositCategory, number>,
  members: number,
  assumptions: EventAssumptions,
): EventCounts {
  const loanPen = assumptions.loanPenetrationPct / 100;
  const depPen = assumptions.depositPenetrationPct / 100;

  let redemptionsLoan = 0;
  (Object.keys(loanVolumes) as LoanCategory[]).forEach((k) => {
    const avg = assumptions.avgLoanSize[k];
    if (avg > 0) redemptionsLoan += (loanVolumes[k] * loanPen) / avg;
  });

  const redemptionsDeposit =
    assumptions.avgDepositSize > 0
      ? (Object.values(depositVolumes).reduce((a, b) => a + b, 0) * depPen) / assumptions.avgDepositSize
      : 0;

  const redemptionsTotal = redemptionsLoan + redemptionsDeposit;
  const applicationsTotal = redemptionsTotal * assumptions.appToFundedRatio;

  // Offers generated scales with member count, not balance-sheet volume.
  // Penetration here = blended share of members reached (avg of loan & deposit
  // module penetrations). If both modules are 0, no offers are generated.
  const blendedPen = (loanPen + depPen) / 2;
  const offersGeneratedTotal = members * assumptions.offersPerMemberPerYear * blendedPen;

  return {
    redemptionsLoan,
    redemptionsDeposit,
    redemptionsTotal,
    applicationsTotal,
    offersGeneratedTotal,
  };
}
