import type { DemoFlags, DemoOfferRef } from "./types";

/**
 * Preset demo stories a sales person can load.
 *
 * Two rules make these safe, both learned from /admin/scenarios:
 *
 * 1. Offers are referenced BY ID into DEFAULT_OFFERS, never inlined. Inlined
 *    literals drift from the catalog and invent section names that don't match
 *    DEFAULT_SECTIONS, which silently drops offers into "Other Offers".
 * 2. `flags` is a full declarative overlay applied as {...DEFAULT_DEMO_FLAGS,
 *    ...scenario.flags}, so flags from a previous scenario can never leak.
 *
 * Everything here must stay JSON-serializable — `icon` is a string key, not a
 * component, so a scenario can round-trip through localStorage.
 */

export type ScenarioIconKey =
    | "storefront"
    | "car"
    | "home"
    | "credit-card"
    | "shield"
    | "mountain";

export interface Scenario {
    id: string;
    name: string;
    description: string;
    icon: ScenarioIconKey;
    offers: DemoOfferRef[];
    /** Partial overlay; unlisted flags reset to their default. */
    flags?: Partial<DemoFlags>;
    /** Overrides DemoConfig.welcomeMessage when the scenario is active. */
    welcomeMessage?: string;
}

const ref = (
    offerId: string,
    variant: DemoOfferRef["variant"],
    isFeatured = false,
): DemoOfferRef => ({ offerId, variant, isFeatured });

export const SCENARIOS: Scenario[] = [
    {
        id: "full-storefront",
        name: "Full Storefront",
        description:
            "The complete catalog across every category. The default, broadest story.",
        icon: "storefront",
        welcomeMessage:
            "We're glad you're here. Browse these recommended options to help you meet your financial goals.",
        offers: [
            ref("demo-1", "preapproved", true),
            ref("demo-2", "preapproved"),
            ref("demo-4", "auto-refi"),
            ref("demo-3", "preapproved"),
            ref("demo-3b", "ita"),
            ref("demo-5", "ita"),
            ref("demo-5b", "preapproved"),
            ref("demo-7", "wildcard"),
            ref("demo-8", "ita"),
            ref("demo-9", "wildcard"),
            ref("demo-11", "new-member"),
        ],
    },
    {
        id: "auto-focus",
        name: "Auto Lending",
        description:
            "Auto loans with a preapproved hero, refinance, and GAP protection.",
        icon: "car",
        welcomeMessage:
            "Great news! Based on your profile, you're preapproved for several auto loan options. See what's available for you below.",
        offers: [
            ref("demo-1", "preapproved", true),
            ref("demo-2", "preapproved"),
            ref("demo-4", "auto-refi"),
            ref("demo-6", "protection"),
        ],
    },
    {
        id: "home-focus",
        name: "Home Lending",
        description: "Home equity and first-time buyer products for homeowners.",
        icon: "home",
        welcomeMessage:
            "Your home is your biggest asset. Explore ways to put its value to work for you.",
        offers: [
            ref("demo-3", "preapproved", true),
            ref("demo-3b", "ita"),
            ref("demo-7", "wildcard"),
        ],
    },
    {
        id: "credit-cards",
        name: "Credit Cards",
        description: "Card products with a preapproved rate story.",
        icon: "credit-card",
        welcomeMessage:
            "Find a card that fits how you spend, with rates and rewards built for members.",
        offers: [
            ref("demo-5b", "preapproved", true),
            ref("demo-5", "ita"),
            ref("demo-8", "ita"),
        ],
    },
    {
        id: "trustage-showcase",
        name: "TruStage™ Insurance Showcase",
        description:
            "Only the 9-product Member Protection & Insurance suite. Hides all other categories.",
        icon: "shield",
        welcomeMessage:
            "Protect what matters most. Explore our comprehensive suite of members-only insurance and loan protection products.",
        flags: { insuranceShowcase: true },
        offers: [
            ref("demo-trustage-addd", "preapproved"),
            ref("demo-trustage-auto", "ita"),
            ref("demo-trustage-home", "ita"),
            ref("demo-trustage-life-term", "ita"),
            ref("demo-trustage-life-whole", "ita"),
            ref("demo-6", "protection"),
            ref("demo-mrc", "protection"),
            ref("demo-credit-insurance", "protection"),
            ref("demo-debt-protection", "protection"),
        ],
    },
    {
        id: "credit-mountain",
        name: "Credit Mountain",
        description:
            "Credit coaching journey for a member building credit, plus a personal loan.",
        icon: "mountain",
        welcomeMessage:
            "Building credit takes time. We'll help you get there, one step at a time.",
        flags: { creditMountain: true },
        offers: [ref("demo-10", "ita")],
    },
];

export function getScenario(id: string): Scenario | undefined {
    return SCENARIOS.find((s) => s.id === id);
}
