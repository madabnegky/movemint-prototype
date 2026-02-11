"use client";

import { useMemo } from "react";
import { useStore } from "@/context/StoreContext";
import type { Offer, MemberProfile } from "@/context/StoreContext";
import { evaluateCampaignProduct, generateOfferFromCampaignProduct, aggregateOffersFromAllCampaigns, GeneratedOffer } from "@/lib/ruleEvaluator";

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
 */
export function useStorefront(): StorefrontData {
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

    // Don't show featured carousel when Credit Mountain feature is enabled
    const showFeaturedCarousel = !featureFlags.storefront_creditMountain;

    // Generate offers based on mode (demo vs live)
    const generatedOffers: GeneratedOffer[] = useMemo(() => {
        if (!selectedProfile) return [];

        if (previewMode === 'live') {
            // Live mode: aggregate from ALL live campaigns
            return aggregateOffersFromAllCampaigns(campaigns, selectedProfile, products);
        } else {
            // Demo mode with profile: use first live campaign (legacy behavior)
            const liveCampaigns = campaigns.filter(c => c.status === "live");
            const activeCampaign = liveCampaigns.find(c => c.type === "perpetual") || liveCampaigns[0];

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
    }, [showFeaturedCarousel, isCreditMountainGraduate, selectedProfile, generatedOffers, offers]);

    // Build sections with their offers
    const sections: StorefrontSection[] = useMemo(() => {
        // For Credit Mountain Graduates, only show the Credit Mountain section
        if (isCreditMountainGraduate && showCreditMountainSection) {
            const creditMountainOffers = offers.filter(o =>
                !o.isRedeemed &&
                o.section === CREDIT_MOUNTAIN_SECTION
            );
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
                if (name !== prequalSection && name !== CREDIT_MOUNTAIN_SECTION) {
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

        return result;
    }, [isCreditMountainGraduate, showCreditMountainSection, selectedProfile, generatedOffers, offers]);

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
