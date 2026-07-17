"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
    LargeStorefrontCard,
    type LargeCardTag,
    type LargeCardHeroValue,
} from "@/components/storefront/LargeStorefrontCard";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { CreditMountainCard } from "@/components/storefront/CreditMountainCard";
import { PrequalificationCard } from "@/components/storefront/PrequalificationCard";
import { cn } from "@/lib/utils";
import { useStorefront } from "@/hooks/useStorefront";
import { useDemoStore } from "@/demo/DemoStoreContext";
import { resolveSelection } from "@/demo/buildStorefrontData";
import type { Offer, OfferVariant } from "@/context/StoreContext";
import { DemoNav } from "@/components/demo/DemoNav";

function variantToTag(variant: OfferVariant, isRedeemed?: boolean): LargeCardTag {
    if (isRedeemed) return "redeemed";
    switch (variant) {
        case "preapproved":
        case "prequalified":
        case "auto-refi":
        case "credit-limit":
            return "preapproved";
        case "ita":
            return "apply-now";
        case "redeemed":
            return "redeemed";
        default:
            return "special";
    }
}

function offerToHeroValues(offer: Offer): [LargeCardHeroValue, LargeCardHeroValue] {
    const attrs = offer.attributes ?? [];
    const v = (i: number): LargeCardHeroValue => ({
        label: attrs[i]?.label ?? "",
        value: attrs[i]?.value ?? "",
        suffix: attrs[i]?.subtext,
    });
    return [v(0), v(1)];
}

function OfferAsLargeCard({ offer }: { offer: Offer }) {
    return (
        <LargeStorefrontCard
            productName={offer.title}
            tag={variantToTag(offer.variant, offer.isRedeemed)}
            heroValues={offerToHeroValues(offer)}
            imageUrl={
                offer.imageUrl ??
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80"
            }
            ctaLabel={offer.ctaText}
            // Offer detail lives at /demo/offer/[id], which doesn't exist yet.
            // Unlinked beats a 404 in front of a prospect.
            disableLink
        />
    );
}

/**
 * The consumer storefront.
 *
 * Shared verbatim by /demo/storefront and /demo/landing — the two are the same
 * page reached two ways. Storefront is the SSO path (the member arrives already
 * authenticated from home banking); landing is the standalone URL where they
 * authenticate first. Only the door differs, never the room.
 */
export function DemoStorefront() {
    const { config } = useDemoStore();
    const { sections, hasOffers } = useStorefront();
    const [activeCategory, setActiveCategory] = useState("All");

    /**
     * Prequal results stay in page state. The non-demo storefront writes them
     * into the global store via addOffer/addSection; doing that here would leak
     * demo state into the prototype's offers.
     */
    const [prequalOffers, setPrequalOffers] = useState<Offer[]>([]);
    const [prequalDone, setPrequalDone] = useState(false);

    const { welcomeMessage } = resolveSelection(config);

    const visibleSections =
        activeCategory === "All" ? sections : sections.filter((s) => s.name === activeCategory);

    return (
        <div className="min-h-screen bg-page font-sans text-contrast-black">
            <DemoNav />

            <main className="mx-auto max-w-[1296px] px-[48px] py-6">
                <div className="mb-6">
                    <h1 className="mb-1 text-[26px] font-semibold text-[#262C30]">
                        Hi {config.memberName},
                    </h1>
                    <p className="text-[14px] leading-relaxed text-[#677178]">{welcomeMessage}</p>
                </div>

                {config.flags.prequalification && !prequalDone && (
                    <div className="mb-6">
                        <PrequalificationCard
                            onPrequalComplete={(offers) => {
                                setPrequalOffers(offers);
                                setPrequalDone(true);
                            }}
                        />
                    </div>
                )}

                {prequalDone && prequalOffers.length > 0 && (
                    <section className="mb-8 flex flex-col gap-6">
                        <h2 className="font-ss03 text-[32px] leading-8 tracking-[-1px] text-contrast-black">
                            Your Prequalified Offers
                        </h2>
                        <div className="flex flex-wrap items-start justify-start gap-4">
                            {prequalOffers.map((offer) => (
                                <OfferAsLargeCard key={offer.id} offer={offer} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Offer detail (/demo/offer/[id]) isn't built yet. Point the hero CTA
                    at the offer sections below rather than a 404. */}
                <HeroCarousel offerHref="#offers" />

                {sections.length > 1 && (
                    <div className="mb-12 flex flex-col gap-2">
                        <div className="text-[16px] leading-5 text-greyscale-08">Filter Categories</div>
                        <div className="flex flex-wrap items-center gap-4">
                            {["All", ...sections.map((s) => s.name)].map((name) => (
                                <button
                                    key={name}
                                    onClick={() => setActiveCategory(name)}
                                    className={cn(
                                        "whitespace-nowrap rounded-chip px-4 py-2.5 text-[16px] leading-5 transition-colors",
                                        activeCategory === name
                                            ? "bg-contrast-black text-white"
                                            : "border border-greyscale-07 bg-contrast-white text-contrast-black hover:border-contrast-black",
                                    )}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div id="offers" className="flex flex-col gap-12">
                    {visibleSections.map((section) => {
                        if (section.isCreditMountain) {
                            return (
                                <section key={section.name} className="flex flex-col gap-6">
                                    <h2 className="font-ss03 text-[32px] leading-8 tracking-[-1px] text-contrast-black">
                                        {section.name}
                                    </h2>
                                    <div className="flex flex-wrap items-start justify-start gap-4">
                                        <div className="w-[288px]">
                                            <CreditMountainCard variant="card" />
                                        </div>
                                        {section.offers.map((offer) => (
                                            <OfferAsLargeCard key={offer.id} offer={offer} />
                                        ))}
                                    </div>
                                </section>
                            );
                        }

                        if (section.offers.length === 0) return null;

                        return (
                            <section key={section.name} className="flex flex-col gap-6">
                                <h2 className="font-ss03 text-[32px] leading-8 tracking-[-1px] text-contrast-black">
                                    {section.name}
                                </h2>
                                <div className="flex flex-wrap items-start justify-start gap-4">
                                    {section.offers.map((offer) => (
                                        <OfferAsLargeCard key={offer.id} offer={offer} />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {!hasOffers && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
                        <h3 className="mb-2 text-[18px] font-semibold text-[#262C30]">
                            No offers selected
                        </h3>
                        <p className="mx-auto max-w-md text-[14px] text-[#677178]">
                            Pick a scenario or choose some offers in{" "}
                            <Link href="/demo/setup" className="underline">
                                Setup
                            </Link>
                            .
                        </p>
                    </div>
                )}
            </main>

            <footer id="disclosures" className="mt-4 border-t border-gray-300">
                <div className="mx-auto max-w-[1200px] px-6 py-6 lg:px-8">
                    <p className="text-[11px] leading-relaxed text-[#677178]">
                        {config.footerDisclaimer}
                    </p>
                </div>
            </footer>
        </div>
    );
}
