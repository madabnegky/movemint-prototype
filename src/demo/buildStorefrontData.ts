import type { Offer } from "@/context/StoreContext";
import type { StorefrontData, StorefrontSection } from "@/hooks/useStorefront";
import { CREDIT_MOUNTAIN_SECTION } from "@/hooks/useStorefront";
import { getScenario } from "./scenarios";
import { DEFAULT_DEMO_FLAGS, SECTION_ORDER } from "./types";
import type { DemoConfig, DemoFlags, DemoOfferRef } from "./types";

const INSURANCE_SECTION = "Insurance & Protection";

/** Resolve the active offer refs and flags for a config, whichever mode it's in. */
export function resolveSelection(config: DemoConfig): {
    refs: DemoOfferRef[];
    flags: DemoFlags;
    welcomeMessage: string;
} {
    if (config.selection.mode === "scenario") {
        const scenario = getScenario(config.selection.scenarioId);
        return {
            refs: scenario?.offers ?? [],
            // Full overlay, so flags from a previous scenario cannot leak through.
            flags: { ...DEFAULT_DEMO_FLAGS, ...scenario?.flags, ...pickUserFlags(config.flags) },
            welcomeMessage: scenario?.welcomeMessage ?? config.welcomeMessage,
        };
    }
    return {
        refs: config.selection.offers,
        flags: config.flags,
        welcomeMessage: config.welcomeMessage,
    };
}

/**
 * Flags the sales person owns directly rather than the scenario. Prequal is a
 * setup toggle that stays on across scenario switches; the rest are the
 * scenario's to decide.
 */
function pickUserFlags(flags: DemoFlags): Partial<DemoFlags> {
    return { prequalification: flags.prequalification };
}

/**
 * Turn demo config into the shape useStorefront() returns.
 *
 * Pure: no context, no rule evaluation. Variants are authored by the sales
 * person, so ruleEvaluator and member profiles play no part here.
 */
export function buildDemoStorefrontData(
    config: DemoConfig,
    catalog: Offer[],
): StorefrontData {
    const { refs, flags } = resolveSelection(config);

    const byId = new Map(catalog.map((o) => [o.id, o]));

    // Apply each ref's authored variant/featured state over the catalog offer.
    const offers: Offer[] = refs
        .map((r) => {
            const base = byId.get(r.offerId);
            if (!base) return null;
            return { ...base, variant: r.variant, isFeatured: r.isFeatured };
        })
        .filter((o): o is Offer => o !== null);

    const showCreditMountainSection = flags.creditMountain;
    const showFeaturedCarousel = !flags.insuranceShowcase && !flags.creditMountain;

    // Showcase mode collapses the storefront to a single section.
    if (flags.insuranceShowcase) {
        const insuranceOffers = offers.filter((o) => o.section === INSURANCE_SECTION);
        return {
            featuredOffers: [],
            sections: insuranceOffers.length
                ? [{ name: INSURANCE_SECTION, offers: insuranceOffers }]
                : [],
            selectedProfile: null,
            isCreditMountainGraduate: false,
            isLiveMode: false,
            showCreditMountainSection: false,
            showFeaturedCarousel: false,
            hasOffers: insuranceOffers.length > 0,
            liveCampaignsCount: 0,
        };
    }

    const featuredOffers = offers.filter((o) => o.isFeatured && !o.isRedeemed);

    const sectionMap = new Map<string, Offer[]>();
    for (const offer of offers) {
        // Featured offers still appear in their section as a normal card — the
        // hero is additional placement, not a move. (The non-demo storefront
        // hides them from sections; here a hero offer stays browsable below.)
        if (offer.isRedeemed) continue;
        // These two render as their own dedicated sections below.
        if (offer.section === CREDIT_MOUNTAIN_SECTION) continue;
        if (offer.section === INSURANCE_SECTION) continue;

        const name = offer.section || "Other Offers";
        // Drop isFeatured on the section copy so it renders as a standard card
        // rather than inheriting hero treatment.
        const card = offer.isFeatured ? { ...offer, isFeatured: false } : offer;
        const bucket = sectionMap.get(name);
        if (bucket) bucket.push(card);
        else sectionMap.set(name, [card]);
    }

    const order = SECTION_ORDER as readonly string[];
    const sections: StorefrontSection[] = [...sectionMap.entries()]
        .sort(([a], [b]) => {
            const ai = order.indexOf(a);
            const bi = order.indexOf(b);
            return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        })
        .map(([name, sectionOffers]) => ({ name, offers: sectionOffers }));

    if (showCreditMountainSection) {
        sections.push({
            name: CREDIT_MOUNTAIN_SECTION,
            offers: offers.filter(
                (o) => o.section === CREDIT_MOUNTAIN_SECTION && !o.isRedeemed,
            ),
            isCreditMountain: true,
        });
    }

    const insuranceOffers = offers.filter(
        (o) => o.section === INSURANCE_SECTION && !o.isRedeemed,
    );
    if (insuranceOffers.length > 0) {
        sections.push({ name: INSURANCE_SECTION, offers: insuranceOffers });
    }

    return {
        featuredOffers,
        sections,
        selectedProfile: null,
        isCreditMountainGraduate: false,
        isLiveMode: false,
        showCreditMountainSection,
        showFeaturedCarousel,
        hasOffers:
            featuredOffers.length > 0 ||
            sections.some((s) => s.offers.length > 0) ||
            showCreditMountainSection,
        liveCampaignsCount: 0,
    };
}
