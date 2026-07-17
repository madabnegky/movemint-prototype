"use client";

import { useMemo } from "react";
import { useStore, DEFAULT_OFFERS } from "@/context/StoreContext";
import type { Offer, MemberProfile } from "@/context/StoreContext";
import { evaluateCampaignProduct, generateOfferFromCampaignProduct, aggregateOffersFromAllCampaigns, GeneratedOffer } from "@/lib/ruleEvaluator";
import { useInjectedStorefrontData } from "./useStorefrontData";

export const CREDIT_MOUNTAIN_SECTION = "Credit Monitoring & Coaching";

export interface StorefrontSection {
    name: string;
    offers: (Offer | GeneratedOffer)[];
    isCreditMountain?: boolean;
}

export interface StorefrontData {
    // The filtered, processed offers ready for display
    featuredOffers: (Offer | GeneratedOffer)[];
    sections: StorefrontSection[];

    // Metadata about the current state
    selectedProfile: MemberProfile | null;
    isCreditMountainGraduate: boolean;
    isLiveMode: boolean;
    showCreditMountainSection: boolean;
    showFeaturedCarousel: boolean;

    // For empty states
    hasOffers: boolean;
    liveCampaignsCount: number;
}

/**
 * Centralized hook for storefront data.
 * All presentation components should consume this hook to ensure consistent offer display.
 *
 * Returns injected data when a StorefrontDataProvider is present (see /demo);
 * otherwise derives it from StoreContext via useLegacyStorefront below.
 */
export function useStorefront(): StorefrontData {
    const injected = useInjectedStorefrontData();
    // Must run unconditionally — hook order cannot depend on `injected`.
    const legacy = useLegacyStorefront();
    return injected ?? legacy;
}

/**
 * Derives storefront data from StoreContext: previewMode + selected member profile
 * drive rule evaluation. This is the behavior every non-/demo surface uses.
 */
function useLegacyStorefront(): StorefrontData {
    const {
        offers,
        sections: configuredSections,
        featureFlags,
        campaigns,
        products,
        memberProfiles,
        selectedProfileId,
        previewMode
    } = useStore();

    // Get the selected member profile
    const selectedProfile = useMemo(() => {
        if (!selectedProfileId) return null;
        return memberProfiles.find(p => p.id === selectedProfileId) || null;
    }, [memberProfiles, selectedProfileId]);

    // Check if Credit Mountain Graduate
    const isCreditMountainGraduate = useMemo(() => {
        return !!(selectedProfile?.attributes?.usedCreditMountain && selectedProfile?.attributes?.creditScoreImproved);
    }, [selectedProfile]);

    // Is live mode with profile selected?
    const isLiveMode = previewMode === 'live' && !!selectedProfile;

    // Count live campaigns
    const liveCampaignsCount = useMemo(() => {
        return campaigns.filter(c => c.status === "live").length;
    }, [campaigns]);

    // Feature flag checks
    const showCreditMountainSection = featureFlags.storefront_creditMountain;

    // Don't show featured carousel when Credit Mountain or Showcase Mode is enabled
    const showFeaturedCarousel = !featureFlags.storefront_creditMountain && !featureFlags.storefront_trustageShowcase;

    // Generate offers based on mode (demo vs live)
    const generatedOffers: GeneratedOffer[] = useMemo(() => {
        if (!selectedProfile) return [];

        if (previewMode === 'live') {
            // Live mode: aggregate from ALL live campaigns
            return aggregateOffersFromAllCampaigns(campaigns, selectedProfile, products);
        } else {
            // Demo mode with profile: use first live campaign (legacy behavior)
            const liveCampaigns = campaigns.filter(c => c.status === "live");
            const activeCampaign = liveCampaigns.find(c => c.type === "perpetual") || liveCampaigns.find(c => c.type === "targeted") || liveCampaigns[0];

            if (!activeCampaign) return [];

            const allCampaignProducts = [
                ...activeCampaign.featuredOffersSection.products,
                ...activeCampaign.sections.flatMap(s => s.products.map(p => ({ ...p, sectionName: s.name }))),
            ];

            const generated: GeneratedOffer[] = [];

            for (const cp of allCampaignProducts) {
                const evaluation = evaluateCampaignProduct(cp, selectedProfile);
                if (evaluation.show) {
                    const product = products.find(p => p.id === cp.productId);
                    const sectionName = 'sectionName' in cp ? (cp as { sectionName: string }).sectionName : activeCampaign.featuredOffersSection.name;
                    generated.push(generateOfferFromCampaignProduct(cp, product, evaluation, sectionName));
                }
            }

            return generated;
        }
    }, [selectedProfile, previewMode, campaigns, products]);

    // Build featured offers list
    const featuredOffers = useMemo(() => {
        // If Showcase Mode is enabled, no featured offers
        if (featureFlags.storefront_trustageShowcase) return [];

        // If Credit Mountain feature is enabled, no featured offers
        if (!showFeaturedCarousel) return [];

        // For Credit Mountain Graduates, no featured offers
        if (isCreditMountainGraduate) return [];

        if (selectedProfile) {
            // Use generated offers
            return generatedOffers.filter(o => o.isFeatured && !o.isRedeemed);
        }

        // Use configured offers
        return offers
            .filter(o => o.isFeatured && !o.isRedeemed)
            .sort((a, b) => (a.isRedeemed ? 1 : 0) - (b.isRedeemed ? 1 : 0));
    }, [showFeaturedCarousel, isCreditMountainGraduate, selectedProfile, generatedOffers, offers, featureFlags.storefront_trustageShowcase]);

    // Build sections with their offers
    const sections: StorefrontSection[] = useMemo(() => {
        // TruStage Showcase Mode: Show ONLY Insurance & Protection category containing all active offers in that section
        if (featureFlags.storefront_trustageShowcase && featureFlags.storefront_trustageInsurance) {
            const trustageOffers = offers.filter(o =>
                !o.isRedeemed &&
                o.section === "Insurance & Protection"
            );
            return [{
                name: "Insurance & Protection",
                offers: trustageOffers
            }];
        }

        // For Low Credit Member, if Credit Mountain is enabled, ONLY show the Credit Mountain tile (with no other offers)
        const isLowCredit = selectedProfile?.id === 'low-credit' || (selectedProfile?.attributes?.creditScore !== undefined && selectedProfile.attributes.creditScore < 650);
        if (isLowCredit && showCreditMountainSection) {
            return [{
                name: CREDIT_MOUNTAIN_SECTION,
                offers: [], // Empty offers so only the tile shows
                isCreditMountain: true
            }];
        }

        // For Credit Mountain Graduates, only show the Credit Mountain section
        if (isCreditMountainGraduate && showCreditMountainSection) {
            let creditMountainOffers = offers.filter(o =>
                !o.isRedeemed &&
                o.section === CREDIT_MOUNTAIN_SECTION
            );

            // Ensure the Personal Loan offer is present even if the scenario cleared it
            const hasPersonalLoan = creditMountainOffers.some(o => o.id === 'demo-10');
            if (!hasPersonalLoan) {
                const defaultPersonalLoan = DEFAULT_OFFERS.find(o => o.id === 'demo-10');
                if (defaultPersonalLoan) {
                    creditMountainOffers = [...creditMountainOffers, defaultPersonalLoan];
                }
            }

            return [{
                name: CREDIT_MOUNTAIN_SECTION,
                offers: creditMountainOffers,
                isCreditMountain: true
            }];
        }

        const result: StorefrontSection[] = [];

        if (selectedProfile) {
            // Build sections from generated offers
            const sectionMap = new Map<string, (Offer | GeneratedOffer)[]>();

            for (const offer of generatedOffers) {
                if (offer.isFeatured) continue; // Featured offers handled separately
                const section = offer.section || "Other Offers";
                if (!sectionMap.has(section)) {
                    sectionMap.set(section, []);
                }
                sectionMap.get(section)!.push(offer);
            }

            // Convert map to array, prioritizing "Your Prequalified Offers"
            const prequalSection = "Your Prequalified Offers";
            if (sectionMap.has(prequalSection)) {
                result.push({
                    name: prequalSection,
                    offers: sectionMap.get(prequalSection)!
                });
            }

            for (const [name, sectionOffers] of sectionMap) {
                if (name !== prequalSection && name !== CREDIT_MOUNTAIN_SECTION && name !== "Insurance & Protection") {
                    result.push({ name, offers: sectionOffers });
                }
            }
        } else {
            // Build sections from configured offers
            const sectionOrder = [
                "Your Prequalified Offers",
                "Auto Loans & Offers",
                "Home Loans & Offers",
                "Credit Cards",
                "Savings & Deposits",
                "Retirement & Savings",
                "Special Offers"
            ];

            const sectionMap = new Map<string, Offer[]>();

            for (const offer of offers) {
                if (offer.isFeatured || offer.isRedeemed) continue;
                if (offer.section === CREDIT_MOUNTAIN_SECTION) continue; // Handled separately
                if (offer.section === "Insurance & Protection") continue; // Handled separately

                const section = offer.section || "Other Offers";
                if (!sectionMap.has(section)) {
                    sectionMap.set(section, []);
                }
                sectionMap.get(section)!.push(offer);
            }

            // Sort sections by predefined order
            const sortedSections = Array.from(sectionMap.entries()).sort((a, b) => {
                const aIdx = sectionOrder.indexOf(a[0]);
                const bIdx = sectionOrder.indexOf(b[0]);
                const aOrder = aIdx === -1 ? 999 : aIdx;
                const bOrder = bIdx === -1 ? 999 : bIdx;
                return aOrder - bOrder;
            });

            for (const [name, sectionOffers] of sortedSections) {
                result.push({ name, offers: sectionOffers });
            }
        }

        // Add Credit Mountain section if enabled (and not a graduate - they only see this section)
        if (showCreditMountainSection) {
            const creditMountainOffers = offers.filter(o =>
                !o.isRedeemed &&
                o.section === CREDIT_MOUNTAIN_SECTION
            );
            result.push({
                name: CREDIT_MOUNTAIN_SECTION,
                offers: creditMountainOffers,
                isCreditMountain: true
            });
        }

        // Add TruStage Insurance section if enabled
        if (featureFlags.storefront_trustageInsurance) {
            const trustageOffers = offers.filter(o =>
                !o.isRedeemed &&
                o.section === "Insurance & Protection"
            );
            if (trustageOffers.length > 0) {
                result.push({
                    name: "Insurance & Protection",
                    offers: trustageOffers
                });
            }
        }

        return result;
    }, [isCreditMountainGraduate, showCreditMountainSection, selectedProfile, generatedOffers, offers, featureFlags.storefront_trustageShowcase, featureFlags.storefront_trustageInsurance]);

    // Check if we have any offers to display
    const hasOffers = featuredOffers.length > 0 || sections.some(s => s.offers.length > 0) || showCreditMountainSection;

    return {
        featuredOffers,
        sections,
        selectedProfile,
        isCreditMountainGraduate,
        isLiveMode,
        showCreditMountainSection,
        showFeaturedCarousel,
        hasOffers,
        liveCampaignsCount
    };
}
