import type { OfferVariant } from "@/context/StoreContext";

/**
 * Demo environment state.
 *
 * Deliberately narrower than StoreContext: the demo has no previewMode/live
 * axis and no member profiles. Offer variants are authored by the sales person,
 * not derived from rule evaluation, so nothing here feeds ruleEvaluator.
 */

/**
 * The canonical storefront sections. `Offer.section` in StoreContext is a bare
 * string, so a typo there silently drops the offer into "Other Offers". Demo
 * code references sections through this union instead.
 */
export const SECTION_NAMES = [
    "Auto Loans & Offers",
    "Home Loans & Offers",
    "Credit Cards",
    "Savings & Deposits",
    "Retirement & Savings",
    "Insurance & Protection",
    "Credit Monitoring & Coaching",
    "Special Offers",
] as const;

export type SectionName = (typeof SECTION_NAMES)[number];

/** Display order for storefront sections. Anything unlisted sorts to the end. */
export const SECTION_ORDER: readonly SectionName[] = SECTION_NAMES;

/**
 * The variants a sales person can pick per offer. A subset of OfferVariant:
 * 'redeemed' is a runtime state rather than an authoring choice, and the
 * remaining variants are product-shape specific rather than demo-relevant.
 */
export const SELECTABLE_VARIANTS = [
    { value: "preapproved", label: "Preapproved" },
    { value: "ita", label: "Invitation to Apply" },
    { value: "wildcard", label: "Special Offer" },
    { value: "new-member", label: "Deposit / Membership" },
] as const satisfies readonly { value: OfferVariant; label: string }[];

export type SelectableVariant = (typeof SELECTABLE_VARIANTS)[number]["value"];

/** An offer chosen for the demo, referenced by id into DEFAULT_OFFERS. */
export interface DemoOfferRef {
    offerId: string;
    variant: OfferVariant;
    isFeatured: boolean;
}

/**
 * Scenario or hand-picked, never both. Modeled as a discriminated union so
 * "a scenario AND a hand-picked list" is unrepresentable.
 */
export type DemoSelection =
    | { mode: "scenario"; scenarioId: string }
    | { mode: "handpicked"; offers: DemoOfferRef[] };

/** Feature toggles a sales person can set. Scenarios may override these. */
export interface DemoFlags {
    /** Consumer-initiated prequalification card on the storefront. */
    prequalification: boolean;
    /** Show only the Insurance & Protection section (TruStage showcase). */
    insuranceShowcase: boolean;
    /** Credit Monitoring & Coaching section. */
    creditMountain: boolean;
}

export const DEFAULT_DEMO_FLAGS: DemoFlags = {
    prequalification: false,
    insuranceShowcase: false,
    creditMountain: false,
};

/** Home banking partners with a working widget. NCR/Fiserv are stubs elsewhere. */
export const HB_PROVIDERS = [
    { value: "q2-totalaccess", label: "Q2 TotalAccess" },
    { value: "q2-composable", label: "Q2 Composable" },
    { value: "alkami", label: "Alkami" },
] as const;

export type HbProvider = (typeof HB_PROVIDERS)[number]["value"];

export function isHbProvider(v: string | null | undefined): v is HbProvider {
    return HB_PROVIDERS.some((p) => p.value === v);
}

/**
 * Promo code prefilled into the landing gate, mimicking the code on a member's
 * mailer. Generated once and persisted rather than derived per render — the code
 * a prospect is looking at must not change underneath them.
 */
export function generatePromoCode(): string {
    let code = "";
    for (let i = 0; i < 16; i++) code += Math.floor(Math.random() * 10);
    return code;
}

/** Formats a 16-digit code for display: 1234 5678 9012 3456. */
export function formatPromoCode(code: string): string {
    return code.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

/**
 * Fallback for configs saved before promoCode existed. A literal rather than a
 * generated value: DEFAULT_DEMO_CONFIG is module-level, and generating there
 * would produce a different code on the server than the client and trip
 * hydration. The provider generates a real one on first load.
 */
export const DEFAULT_PROMO_CODE = "0000000000000000";

export interface DemoConfig {
    /** Financial institution name shown in nav and chrome. */
    fiName: string;
    /** Downscaled logo as a data URL. See logo.ts for size guards. */
    fiLogoDataUrl?: string;
    /** Member first name for the "Hi Cameron," greeting. */
    memberName: string;
    welcomeMessage: string;
    footerDisclaimer: string;
    selection: DemoSelection;
    flags: DemoFlags;
    /** Prefilled in the landing gate's promo field. */
    promoCode: string;
    /**
     * Whether the landing gate has been passed. Persists so a demo isn't
     * re-gated on every reload; Setup exposes a reset to re-arm it for the
     * next pitch.
     */
    landingUnlocked: boolean;
}

export const DEFAULT_DEMO_CONFIG: DemoConfig = {
    fiName: "Credit Union",
    memberName: "Cameron",
    welcomeMessage:
        "We're glad you're here. Browse these recommended options to help you meet your financial goals.",
    footerDisclaimer:
        "*APR = Annual Percentage Rate. Rates shown are the lowest available and are subject to change. Your actual rate may vary based on creditworthiness, loan term, and other factors. All loans subject to approval.",
    selection: { mode: "scenario", scenarioId: "full-storefront" },
    flags: DEFAULT_DEMO_FLAGS,
    promoCode: DEFAULT_PROMO_CODE,
    landingUnlocked: false,
};
