"use client";

import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, Info, X } from "lucide-react";
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
import type { Offer } from "@/context/StoreContext";

export default function StorefrontPage() {
    const { storefrontConfig, featureFlags, previewMode, addOffer, addSection, sections: storeSections } = useStore();
    const {
        sections,
        selectedProfile,
        isLiveMode,
        hasOffers,
        liveCampaignsCount
    } = useStorefront();

    const [activeCategory, setActiveCategory] = useState("All");

    // Prequalification state
    const [prequalStatus, setPrequalStatus] = useState<'idle' | 'has_offers' | 'no_offers'>('idle');
    const [prequalOffers, setPrequalOffers] = useState<Offer[]>([]);
    const [bannerDismissed, setBannerDismissed] = useState(false);
    const [prequalCarouselSlide, setPrequalCarouselSlide] = useState(0);

    const handlePrequalComplete = (offers: Offer[]) => {
        if (offers.length > 0) {
            setPrequalStatus('has_offers');
            setPrequalOffers(offers);

            // Add offers to the store so they appear in sections
            const prequalSection = "Your Prequalified Offers";
            if (!storeSections.includes(prequalSection)) {
                addSection(prequalSection);
            }
            offers.forEach(offer => {
                addOffer(offer);
            });
        } else {
            setPrequalStatus('no_offers');
        }
    };

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

    // Prequal carousel navigation
    const currentPrequalOffer = prequalOffers[prequalCarouselSlide];
    const goToPrevPrequal = () => {
        setPrequalCarouselSlide(prev => (prev === 0 ? prequalOffers.length - 1 : prev - 1));
    };
    const goToNextPrequal = () => {
        setPrequalCarouselSlide(prev => (prev === prequalOffers.length - 1 ? 0 : prev + 1));
    };

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

                {/* Prequalification Banner - Success */}
                {prequalStatus === 'has_offers' && !bannerDismissed && (
                    <div className="mb-6 bg-[#d4edda] border-l-4 border-[#4D9B56] rounded-r-lg px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#4D9B56] shrink-0" />
                            <p className="text-[14px] text-[#1a472a] font-medium">
                                You have {prequalOffers.length} prequalified offers below.
                            </p>
                        </div>
                        <button
                            onClick={() => setBannerDismissed(true)}
                            className="text-[#1a472a]/60 hover:text-[#1a472a] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Prequalification Banner - No Offers */}
                {prequalStatus === 'no_offers' && !bannerDismissed && (
                    <div className="mb-6 bg-[#d6e4f0] border-l-4 border-[#6b8db5] rounded-r-lg px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Info className="w-5 h-5 text-[#3b6a9a] shrink-0" />
                            <p className="text-[14px] text-[#1e3a5f] font-medium">
                                There are no prequalified offers at this time, come back again.
                            </p>
                        </div>
                        <button
                            onClick={() => setBannerDismissed(true)}
                            className="text-[#1e3a5f]/60 hover:text-[#1e3a5f] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Consumer Prequalification Card - only show before submission */}
                {featureFlags.consumer_prequalification && prequalStatus === 'idle' && (
                    <div className="mb-6">
                        <PrequalificationCard onPrequalComplete={handlePrequalComplete} />
                    </div>
                )}

                {/* Prequalified Offers Carousel */}
                {prequalStatus === 'has_offers' && prequalOffers.length > 0 && currentPrequalOffer && (
                    <div className="mb-8">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200">
                            <div className="flex flex-col min-[804px]:flex-row min-h-[280px]">
                                {/* Content Section */}
                                <div className="min-[804px]:w-[40%] p-6 min-[804px]:p-8 flex flex-col justify-center order-2 min-[804px]:order-1">
                                    <h2 className="text-xl min-[804px]:text-2xl font-semibold text-[#262C30] mb-2 leading-tight">
                                        {currentPrequalOffer.featuredHeadline || "You\u2019re prequalified!"}
                                    </h2>
                                    <p className="text-[#677178] text-[14px] leading-relaxed mb-5 max-w-md">
                                        {currentPrequalOffer.featuredDescription || currentPrequalOffer.description || "Check out this exclusive offer tailored just for you."}
                                    </p>

                                    {/* Attributes */}
                                    {currentPrequalOffer.attributes && currentPrequalOffer.attributes.length > 0 && (
                                        <div className="flex gap-8 mb-5">
                                            {currentPrequalOffer.attributes.map((attr, idx) => (
                                                <div key={idx}>
                                                    <div className="text-[10px] text-[#677178] mb-0.5">
                                                        {attr.label}
                                                    </div>
                                                    <div className="text-2xl min-[804px]:text-[28px] font-bold text-[#262C30] leading-none">
                                                        {attr.value}
                                                        {attr.subtext && (
                                                            <span className="text-[11px] font-normal text-[#677178] ml-1">
                                                                {attr.subtext}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* CTA */}
                                    <div className="flex flex-col gap-3 items-center min-[804px]:items-stretch max-w-[280px]">
                                        <Link
                                            href={`/storefront/offer/${currentPrequalOffer.id}`}
                                            className="inline-flex items-center justify-center w-full px-8 py-3.5 bg-[#B8C4E0] text-[#1e293b] text-[12px] font-bold tracking-wider uppercase rounded-full hover:bg-[#a3b1d1] transition-colors"
                                        >
                                            REVIEW OFFER
                                        </Link>
                                        <Link
                                            href="#disclosures"
                                            className="text-[12px] text-[#677178] hover:text-[#262C30] underline underline-offset-2 text-center"
                                        >
                                            Details & disclosures
                                        </Link>
                                    </div>
                                </div>

                                {/* Image Section */}
                                <div className="min-[804px]:w-[60%] order-1 min-[804px]:order-2 relative">
                                    <div className="w-full h-full min-h-[200px] min-[804px]:min-h-full">
                                        <img
                                            src={currentPrequalOffer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}
                                            alt={currentPrequalOffer.title}
                                            className="w-full h-full object-cover object-center"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Carousel Navigation */}
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <button
                                onClick={goToPrevPrequal}
                                className="w-8 h-8 flex items-center justify-center text-[#677178] hover:text-[#262C30] transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                {prequalOffers.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setPrequalCarouselSlide(idx)}
                                        className={cn(
                                            "w-2 h-2 rounded-full transition-all duration-200",
                                            prequalCarouselSlide === idx
                                                ? "bg-[#262C30]"
                                                : "bg-[#262C30]/25 hover:bg-[#262C30]/40"
                                        )}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={goToNextPrequal}
                                className="w-8 h-8 flex items-center justify-center text-[#677178] hover:text-[#262C30] transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
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
