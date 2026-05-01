import ncuaData from "@/data/ncua-cus.json";

export type CU = (typeof ncuaData.cus)[number];

export type LoanCategory = "firstMortgage" | "heloc" | "auto" | "creditCard" | "unsecured" | "commercial";
export type DepositCategory = "drafts" | "regular" | "mma" | "cds" | "ira";

export type LoanTakeRates = Record<LoanCategory, number>; // basis points
export type DepositTakeRates = Record<DepositCategory, number>; // basis points

export const LOAN_LABELS: Record<LoanCategory, string> = {
  firstMortgage: "First mortgage",
  heloc: "HELOC / 2nd lien",
  auto: "Auto",
  creditCard: "Credit card",
  unsecured: "Personal / unsecured",
  commercial: "Commercial",
};

export const DEPOSIT_LABELS: Record<DepositCategory, string> = {
  drafts: "Checking (share drafts)",
  regular: "Regular savings",
  mma: "Money market",
  cds: "Share certificates (CDs)",
  ira: "IRA / Keogh",
};

// Defaults: tiered take rates in basis points. Higher rates on stickier
// /more profitable products (cards, checking), lower on rate-shoppy products
// (CDs, mortgage). Tune these in the UI.
export const DEFAULT_LOAN_BPS: LoanTakeRates = {
  firstMortgage: 8,
  heloc: 12,
  auto: 15,
  creditCard: 30,
  unsecured: 25,
  commercial: 10,
};

export const DEFAULT_DEPOSIT_BPS: DepositTakeRates = {
  drafts: 25,
  regular: 10,
  mma: 8,
  cds: 5,
  ira: 8,
};

// ---------- Tiered SaaS fee ----------
// Locked tier boundaries (Mode A — only prices are editable). These match
// Movemint's strategic asset-tier breakpoints for FI customers.
export type SaasTier = {
  id: string;
  label: string;
  minAssets: number;          // inclusive
  maxAssets: number | null;   // exclusive; null = no cap
  defaultMonthly: number;     // $/month default; editable in UI
};

export const SAAS_TIERS: SaasTier[] = [
  { id: "t1", label: "$0–$500M",  minAssets: 0,                maxAssets: 500_000_000,    defaultMonthly: 2_000 },
  { id: "t2", label: "$500M–$1B", minAssets: 500_000_000,      maxAssets: 1_000_000_000,  defaultMonthly: 4_000 },
  { id: "t3", label: "$1B–$2B",   minAssets: 1_000_000_000,    maxAssets: 2_000_000_000,  defaultMonthly: 6_500 },
  { id: "t4", label: "$2B–$3B",   minAssets: 2_000_000_000,    maxAssets: 3_000_000_000,  defaultMonthly: 9_000 },
  { id: "t5", label: "$3B–$4B",   minAssets: 3_000_000_000,    maxAssets: 4_000_000_000,  defaultMonthly: 11_500 },
  { id: "t6", label: "$4B–$5B",   minAssets: 4_000_000_000,    maxAssets: 5_000_000_000,  defaultMonthly: 14_000 },
  { id: "t7", label: "$5B+",      minAssets: 5_000_000_000,    maxAssets: null,           defaultMonthly: 20_000 },
];

export type SaasTierPrices = Record<string, number>; // tier id -> $/month

export const DEFAULT_SAAS_TIER_PRICES: SaasTierPrices = Object.fromEntries(
  SAAS_TIERS.map((t) => [t.id, t.defaultMonthly]),
);

// Per-tier multipliers used by the Repricing tab's "rate-card builder" mode.
// Anchored at the middle tier (t4 = $2B–$3B) which defaults to 1×. Other
// tiers scale relative to the base SaaS fee from there. These are starting
// points; users edit them inline on each tier card.
//
// MIDDLE_TIER_ID is exported so consumers can identify the anchor tier.
export const MIDDLE_TIER_ID = "t4";

export const DEFAULT_TIER_MULTIPLIERS: Record<string, number> = {
  t1: 0.4, // $0–$500M
  t2: 0.6, // $500M–$1B
  t3: 0.8, // $1B–$2B
  t4: 1.0, // $2B–$3B (anchor)
  t5: 1.2, // $3B–$4B
  t6: 1.4, // $4B–$5B
  t7: 1.7, // $5B+
};

export function tierForAssets(assets: number): SaasTier {
  for (const t of SAAS_TIERS) {
    if (assets >= t.minAssets && (t.maxAssets == null || assets < t.maxAssets)) return t;
  }
  return SAAS_TIERS[SAAS_TIERS.length - 1];
}

// ---------- Event-count assumptions ----------
// Average ticket sizes for converting origination $ → loan count.
// These are industry rules-of-thumb; surfaced as editable inputs in the UI.
export const DEFAULT_AVG_LOAN_SIZE: Record<LoanCategory, number> = {
  firstMortgage: 300_000,
  heloc: 50_000,
  auto: 30_000,
  creditCard: 5_000,    // initial CL or first transaction; CC "originations" are funky
  unsecured: 10_000,
  commercial: 250_000,
};

export const DEFAULT_AVG_DEPOSIT_SIZE = 5_000; // avg new-deposit account balance, $

export const DEFAULT_APP_TO_FUNDED_RATIO = 2.5;       // applications per funded loan
export const DEFAULT_OFFERS_PER_MEMBER_PER_YEAR = 12; // offers shown per member annually
export const DEFAULT_CLICK_TO_APP_RATE = 0.20;        // 20% of clicks become applications

// Pricing-model identifiers used to drive tab state and comparison aggregation.
export type PricingModelId = "bps" | "redemption" | "application" | "offerGen" | "click";

export const PRICING_MODEL_LABELS: Record<PricingModelId, string> = {
  bps: "BPS take-rate",
  redemption: "SaaS + per redemption",
  application: "SaaS + per application",
  offerGen: "SaaS + per offer generated",
  click: "SaaS + per click",
};
