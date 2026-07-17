"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, User } from "lucide-react";
import { CreditMountainCard } from "@/components/storefront/CreditMountainCard";
import { PrequalificationCard } from "@/components/storefront/PrequalificationCard";
import { useStorefront } from "@/hooks/useStorefront";
import { useDemoStore } from "@/demo/DemoStoreContext";
import { resolveSelection } from "@/demo/buildStorefrontData";
import type { Offer } from "@/context/StoreContext";

/**
 * Marketing landing page for the demo.
 *
 * The non-demo /landing bypasses useStorefront and calls
 * aggregateOffersFromAllCampaigns directly — a second data path that drifts
 * from the storefront. This one reads the same hook as every other surface, so
 * one config drives all three.
 *
 * Styling note: /landing uses brand-* classes from tailwind.config.ts, which
 * produce no CSS under Tailwind v4 (tokens must live in globals.css @theme).
 * This page uses the tokens that actually resolve.
 */
export default function DemoLandingPage() {
    const { config } = useDemoStore();
    const { featuredOffers, sections, showCreditMountainSection } = useStorefront();
    const [prequalOffers, setPrequalOffers] = useState<Offer[]>([]);
    const [prequalDone, setPrequalDone] = useState(false);

    const { welcomeMessage } = resolveSelection(config);

    const hero = featuredOffers[0];
    const hasPreapprovals =
        featuredOffers.some((o) => o.variant === "preapproved") ||
        sections.some((s) => s.offers.some((o) => o.variant === "preapproved"));

    // Credit Mountain leads when the story is about building credit, not borrowing.
    const leadWithCreditMountain = showCreditMountainSection && !hasPreapprovals;

    return (
        <div className="min-h-screen bg-page font-sans text-contrast-black">
            <nav className="sticky top-0 z-40 flex items-center justify-between bg-white px-8 py-5 shadow-sm">
                <div className="flex items-center gap-12">
                    <div className="flex items-center gap-2.5">
                        {config.fiLogoDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={config.fiLogoDataUrl}
                                alt={config.fiName}
                                className="h-8 w-auto max-w-[150px] object-contain"
                            />
                        ) : null}
                        <span className="text-[22px] font-bold tracking-tight text-[#143C67]">
                            {config.fiName}
                        </span>
                    </div>
                    <div className="hidden gap-8 text-[14px] font-semibold text-greyscale-08 md:flex">
                        <span className="cursor-pointer transition-colors hover:text-[#143C67]">
                            Loans &amp; Credit
                        </span>
                        <span className="cursor-pointer transition-colors hover:text-[#143C67]">
                            Accounts
                        </span>
                        <span className="cursor-pointer transition-colors hover:text-[#143C67]">
                            Planning
                        </span>
                    </div>
                </div>

                <div className="flex cursor-pointer items-center gap-2 text-[14px] font-semibold text-[#143C67]">
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                    <ChevronDown className="h-4 w-4 text-greyscale-07" />
                </div>
            </nav>

            <main className="mx-auto max-w-[1440px] px-8 py-12">
                <div className="mb-10">
                    <h1 className="mb-2 text-[36px] font-bold leading-tight text-contrast-black">
                        {leadWithCreditMountain
                            ? `${config.memberName}, improve your financial future.`
                            : `${config.memberName}, check out these offers picked just for you.`}
                    </h1>
                    <p className="text-[18px] text-greyscale-08">{welcomeMessage}</p>
                </div>

                {config.flags.prequalification && !prequalDone && (
                    <div className="mb-10 max-w-2xl">
                        <PrequalificationCard
                            onPrequalComplete={(offers) => {
                                setPrequalOffers(offers);
                                setPrequalDone(true);
                            }}
                        />
                    </div>
                )}

                {prequalDone && (
                    <div className="mb-10 max-w-2xl rounded-xl border-l-4 border-system-green bg-system-green/10 px-5 py-4">
                        <p className="text-[14px] font-medium text-contrast-black">
                            {prequalOffers.length > 0
                                ? `You have ${prequalOffers.length} prequalified offer${prequalOffers.length !== 1 ? "s" : ""} waiting.`
                                : "No prequalified offers at this time — check back soon."}
                        </p>
                    </div>
                )}

                {leadWithCreditMountain ? (
                    <CreditMountainCard variant="hero" />
                ) : hero ? (
                    <div className="grid grid-cols-1 items-center gap-12 overflow-hidden rounded-3xl border border-greyscale-03 bg-white p-10 shadow-card lg:grid-cols-2">
                        <div className="space-y-6">
                            <div className="inline-flex items-center rounded-md bg-system-green/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-system-green">
                                {hero.variant === "preapproved" ? "You're Preapproved!" : "Apply Now"}
                            </div>
                            <h2 className="text-[36px] font-bold leading-tight text-[#143C67]">
                                {hero.featuredHeadline || `Check out your ${hero.title} offer`}
                            </h2>
                            <p className="text-[18px] font-medium text-greyscale-08">
                                {hero.featuredDescription ||
                                    hero.description ||
                                    "Rates built for members, with no origination fees."}
                            </p>
                            <div className="flex gap-4 pt-4">
                                <Link
                                    href={`/demo/offer/${hero.id}`}
                                    className="rounded-lg bg-[#143C67] px-8 py-4 font-bold text-white shadow-lg transition-colors hover:bg-[#0f2d4d]"
                                >
                                    {hero.ctaText || "Review Offer"}
                                </Link>
                                <Link
                                    href="/demo/storefront"
                                    className="rounded-lg border-2 border-[#143C67] px-8 py-4 font-bold text-[#143C67] transition-colors hover:bg-[#143C67]/5"
                                >
                                    See All Offers
                                </Link>
                            </div>
                        </div>

                        <div className="relative flex h-full min-h-[300px] items-center justify-center overflow-hidden rounded-2xl bg-greyscale-03">
                            {hero.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={hero.imageUrl}
                                    alt={hero.title}
                                    className="h-full w-full object-cover"
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-3xl border border-greyscale-03 bg-white p-12 text-center">
                        <h2 className="mb-2 text-[18px] font-semibold">No featured offer</h2>
                        <p className="mx-auto max-w-md text-[14px] text-greyscale-08">
                            Mark an offer as the hero in{" "}
                            <Link href="/demo/setup" className="underline">
                                Setup
                            </Link>
                            , or browse{" "}
                            <Link href="/demo/storefront" className="underline">
                                the storefront
                            </Link>
                            .
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
