"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { OfferCard } from "@/components/storefront/OfferCard";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { CreditMountainCard } from "@/components/storefront/CreditMountainCard";
import { PrequalificationCard } from "@/components/storefront/PrequalificationCard";
import { PreviewAsDropdown } from "@/components/preview/PreviewAsDropdown";
import { PreviewModeToggle } from "@/components/preview/PreviewModeToggle";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useStorefront } from "@/hooks/useStorefront";

export default function StorefrontPage() {
    const { storefrontConfig, featureFlags, previewMode } = useStore();
    const {
        sections,
        selectedProfile,
        isLiveMode,
        hasOffers,
        liveCampaignsCount
    } = useStorefront();

    const [activeCategory, setActiveCategory] = useState("All");

    // Get section names for filter buttons
    const sectionNames = sections.map(s => s.name);

    // Get filtered sections based on active category
    const getVisibleSections = () => {
        if (activeCategory === "All") {
            return sections;
        }
        return sections.filter(s => s.name === activeCategory);
    };

    // Personalized greeting
    const greeting = storefrontConfig.userName
        ? `Hi ${storefrontConfig.userName},`
        : "Offers for You";

    return (
        <div className="min-h-screen bg-[#E8EBED] font-sans text-[#262C30]">

            {/* Navigation */}
            <nav className="bg-white px-6 lg:px-8 h-14 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#143C67] rounded flex items-center justify-center">
                            <div className="grid grid-cols-2 gap-[2px] w-3.5 h-3.5">
                                <div className="bg-white rounded-[1px]"></div>
                                <div className="bg-white rounded-[1px]"></div>
                                <div className="bg-white rounded-[1px]"></div>
                                <div className="bg-white/50 rounded-[1px]"></div>
                            </div>
                        </div>
                        <span className="text-[15px] font-semibold text-[#143C67]">Credit Union</span>
                    </Link>

                    {/* Nav divider + current section */}
                    <div className="hidden md:flex items-center gap-4 pl-4 border-l border-gray-200">
                        <span className="text-[13px] font-medium text-[#262C30]">Loans and Credit</span>
                    </div>
                </div>

                {/* Profile dropdown */}
                <button className="flex items-center gap-1 text-[13px] font-medium text-[#262C30] hover:text-[#143C67] transition-colors">
                    <span>Profile</span>
                    <ChevronDown className="w-4 h-4 text-[#677178]" />
                </button>
            </nav>

            <main className="max-w-[1200px] mx-auto px-6 lg:px-8 py-6">

                {/* Preview Controls Bar */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <PreviewModeToggle />
                        <PreviewAsDropdown />
                    </div>
                    {selectedProfile && (
                        <div className="text-xs text-slate-500">
                            {isLiveMode ? (
                                <>Evaluating <span className="font-medium text-slate-700">{liveCampaignsCount} live campaign{liveCampaignsCount !== 1 ? 's' : ''}</span></>
                            ) : (
                                <>Demo mode: <span className="font-medium text-slate-700">Showing preset offers</span></>
                            )}
                        </div>
                    )}
                </div>

                {/* Welcome Section */}
                <div className="mb-6">
                    <h1 className="text-[26px] font-semibold text-[#262C30] mb-1">
                        {greeting}
                    </h1>
                    <p className="text-[#677178] text-[14px] leading-relaxed">
                        {storefrontConfig.welcomeMessage}
                    </p>
                </div>

                {/* Consumer Prequalification Card */}
                {featureFlags.consumer_prequalification && (
                    <div className="mb-6">
                        <PrequalificationCard />
                    </div>
                )}

                {/* Hero Carousel */}
                <HeroCarousel />

                {/* Filter Categories */}
                <div className="mb-8">
                    <div className="text-[10px] font-medium text-[#677178] uppercase tracking-wider mb-2">
                        Filter Categories
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* All button - filled when active */}
                        <button
                            onClick={() => setActiveCategory("All")}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-[12px] font-medium transition-all border",
                                activeCategory === "All"
                                    ? "bg-[#262C30] text-white border-[#262C30]"
                                    : "bg-white text-[#262C30] border-gray-300 hover:border-gray-400"
                            )}
                        >
                            All
                        </button>
                        {sectionNames.map((sectionName) => (
                            <button
                                key={sectionName}
                                onClick={() => setActiveCategory(sectionName)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[12px] font-medium transition-all border",
                                    activeCategory === sectionName
                                        ? "bg-[#262C30] text-white border-[#262C30]"
                                        : "bg-white text-[#262C30] border-gray-300 hover:border-gray-400"
                                )}
                            >
                                {sectionName}
                            </button>
                        ))}
                        {activeCategory !== "All" && (
                            <button
                                onClick={() => setActiveCategory("All")}
                                className="px-3 py-1.5 text-[12px] font-medium text-[#677178] hover:text-[#262C30] transition-colors underline underline-offset-2"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Offer Sections */}
                {getVisibleSections().map(section => {
                    // For Credit Mountain section, render specially
                    if (section.isCreditMountain) {
                        return (
                            <section key={section.name} className="mb-10">
                                <h2 className="text-[20px] font-semibold text-[#262C30] mb-4">
                                    {section.name}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {/* Credit Mountain Card */}
                                    <CreditMountainCard variant="card" />

                                    {/* Section offers (e.g., Personal Loan ITA for graduates) */}
                                    {section.offers.map(offer => (
                                        <OfferCard
                                            key={offer.id}
                                            id={offer.id}
                                            variant={offer.variant}
                                            title={offer.title}
                                            description={offer.description}
                                            attributes={offer.attributes}
                                            imageUrl={offer.imageUrl}
                                            ctaText={offer.ctaText}
                                            ctaLink={offer.ctaLink}
                                            isRedeemed={offer.isRedeemed}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    }

                    // Regular sections
                    if (section.offers.length === 0) return null;

                    return (
                        <section key={section.name} className="mb-10">
                            <h2 className="text-[20px] font-semibold text-[#262C30] mb-4">
                                {section.name}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {section.offers.map(offer => (
                                    <OfferCard
                                        key={offer.id}
                                        id={offer.id}
                                        variant={offer.variant}
                                        title={offer.title}
                                        description={offer.description}
                                        attributes={offer.attributes}
                                        imageUrl={offer.imageUrl}
                                        ctaText={offer.ctaText}
                                        ctaLink={offer.ctaLink}
                                        isRedeemed={offer.isRedeemed}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}

                {/* Live Mode without profile selected - prompt to select */}
                {previewMode === 'live' && !selectedProfile && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-semibold text-indigo-900 mb-2">
                            Select a Member Profile
                        </h3>
                        <p className="text-[14px] text-indigo-700 max-w-md mx-auto">
                            In Live mode, select a member profile above to see how campaign rules and product configurations generate personalized offers for that member type.
                        </p>
                    </div>
                )}

                {/* Empty State - No Offers message */}
                {(previewMode !== 'live' || selectedProfile) && !hasOffers && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-[#E8EBED] rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#677178]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="text-[18px] font-semibold text-[#262C30] mb-2">
                            No offers available
                        </h3>
                        <p className="text-[14px] text-[#677178] max-w-md mx-auto">
                            {selectedProfile
                                ? "Based on the selected profile's attributes and campaign rules, no offers match for this member type."
                                : "There are no personalized offers for you at this time. Check back soon for new opportunities tailored to your profile."}
                        </p>
                    </div>
                )}

            </main>

            {/* Footer Disclaimers */}
            <footer id="disclosures" className="border-t border-gray-300 mt-4">
                <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-6">
                    <p className="text-[11px] text-[#677178] leading-relaxed">
                        {storefrontConfig.footerDisclaimer}
                    </p>
                </div>
            </footer>

            {/* Prototype Navigation */}
            <div className="fixed bottom-4 right-4 z-50 flex gap-2">
                <Link
                    href="/admin/product-config"
                    className="px-3 py-1.5 bg-[#143C67] text-white text-[11px] font-medium rounded-full shadow-lg hover:bg-[#0f2d4d] transition-colors"
                >
                    Configure Offers
                </Link>
                <Link
                    href="/"
                    className="px-3 py-1.5 bg-[#262C30] text-white text-[11px] font-medium rounded-full shadow-lg hover:bg-black transition-colors"
                >
                    Exit Prototype
                </Link>
            </div>
        </div>
    );
}
