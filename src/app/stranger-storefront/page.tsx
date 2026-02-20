"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Info, X, LogIn, UserPlus } from "lucide-react";
import { OfferCard } from "@/components/storefront/OfferCard";
import { PrequalificationCard } from "@/components/storefront/PrequalificationCard";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import type { Offer } from "@/context/StoreContext";

export default function StrangerStorefrontPage() {
    const { offers, strangerOffers, strangerWelcomeMessage, storefrontConfig, featureFlags } = useStore();
    const [hasEnteredAsGuest, setHasEnteredAsGuest] = useState(false);
    const [activeCategory, setActiveCategory] = useState("All");

    // Prequalification state
    const [prequalStatus, setPrequalStatus] = useState<'idle' | 'has_offers' | 'no_offers'>('idle');
    const [prequalOffers, setPrequalOffers] = useState<Offer[]>([]);
    const [bannerDismissed, setBannerDismissed] = useState(false);
    const [prequalCarouselSlide, setPrequalCarouselSlide] = useState(0);

    const handlePrequalComplete = (returnedOffers: Offer[]) => {
        if (returnedOffers.length > 0) {
            setPrequalStatus('has_offers');
            setPrequalOffers(returnedOffers);
        } else {
            setPrequalStatus('no_offers');
        }
    };

    const currentPrequalOffer = prequalOffers[prequalCarouselSlide];
    const goToPrevPrequal = () => {
        setPrequalCarouselSlide(prev => (prev === 0 ? prequalOffers.length - 1 : prev - 1));
    };
    const goToNextPrequal = () => {
        setPrequalCarouselSlide(prev => (prev === prequalOffers.length - 1 ? 0 : prev + 1));
    };

    // Filter to only selected offers and apply per-offer variant + featured overrides
    const publicOffers = useMemo(() => {
        const configMap = new Map(strangerOffers.map(so => [so.offerId, so]));
        return offers
            .filter((o) => configMap.has(o.id) && !o.isRedeemed)
            .map((o) => {
                const config = configMap.get(o.id)!;
                return {
                    ...o,
                    variant: config.variant,
                    isFeatured: config.isFeatured,
                };
            });
    }, [offers, strangerOffers]);

    // Split into featured and section offers
    const featuredOffers = useMemo(() => {
        return publicOffers.filter((o) => o.isFeatured);
    }, [publicOffers]);

    const sections = useMemo(() => {
        const sectionMap = new Map<string, Offer[]>();
        for (const offer of publicOffers) {
            const section = offer.section || "Other Offers";
            if (!sectionMap.has(section)) {
                sectionMap.set(section, []);
            }
            sectionMap.get(section)!.push(offer);
        }

        const sectionOrder = [
            "Auto Loans & Offers",
            "Home Loans & Offers",
            "Credit Cards",
            "Savings & Deposits",
            "Special Offers",
        ];

        return Array.from(sectionMap.entries())
            .sort((a, b) => {
                const aIdx = sectionOrder.indexOf(a[0]);
                const bIdx = sectionOrder.indexOf(b[0]);
                return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
            })
            .map(([name, sectionOffers]) => ({ name, offers: sectionOffers }));
    }, [publicOffers]);

    const sectionNames = sections.map((s) => s.name);

    const getVisibleSections = () => {
        if (activeCategory === "All") return sections;
        return sections.filter((s) => s.name === activeCategory);
    };

    // Featured hero (inline, simplified version — no separate HeroCarousel component since that reads from useStorefront)
    const heroOffer = featuredOffers[0];

    // ── Entry Gate ──
    if (!hasEnteredAsGuest) {
        return (
            <div className="min-h-screen bg-[#E8EBED] font-sans text-[#262C30] flex flex-col">
                {/* Navigation */}
                <nav className="bg-white px-6 lg:px-8 h-14 flex items-center justify-between border-b border-gray-200">
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
                </nav>

                <div className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="max-w-[480px] w-full">
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-[#143C67] rounded-xl flex items-center justify-center mx-auto mb-4">
                                <div className="grid grid-cols-2 gap-[2px] w-6 h-6">
                                    <div className="bg-white rounded-[1px]"></div>
                                    <div className="bg-white rounded-[1px]"></div>
                                    <div className="bg-white rounded-[1px]"></div>
                                    <div className="bg-white/50 rounded-[1px]"></div>
                                </div>
                            </div>
                            <h1 className="text-[26px] font-semibold text-[#262C30] mb-2">
                                Welcome to Credit Union
                            </h1>
                            <p className="text-[14px] text-[#677178] leading-relaxed max-w-sm mx-auto">
                                Already a member? Log in to access your personalized offers and account. Or continue as a guest to explore what we have to offer.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href="/storefront"
                                className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-[#143C67] bg-[#143C67] hover:bg-[#0f2d4d] transition-colors text-left"
                            >
                                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <LogIn className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-[15px] font-semibold text-white">Log In to Home Banking</div>
                                    <div className="text-[12px] text-white/70">Access your accounts, personalized offers, and more</div>
                                </div>
                            </Link>

                            <button
                                onClick={() => setHasEnteredAsGuest(true)}
                                className="w-full flex items-center gap-4 p-5 rounded-xl border-2 border-gray-300 bg-white hover:border-[#143C67] hover:bg-[#143C67]/5 transition-colors text-left"
                            >
                                <div className="w-11 h-11 rounded-full bg-[#E8EBED] flex items-center justify-center shrink-0">
                                    <UserPlus className="w-5 h-5 text-[#143C67]" />
                                </div>
                                <div>
                                    <div className="text-[15px] font-semibold text-[#262C30]">Continue as Guest</div>
                                    <div className="text-[12px] text-[#677178]">Browse our products, rates, and special offers</div>
                                </div>
                            </button>
                        </div>

                        <p className="text-center text-[11px] text-[#677178] mt-6">
                            Not a member yet? Continue as a guest to explore our offerings and apply today.
                        </p>
                    </div>
                </div>

                {/* Prototype Navigation */}
                <div className="fixed bottom-4 right-4 z-50 flex gap-2">
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

    return (
        <div className="min-h-screen bg-[#E8EBED] font-sans text-[#262C30]">
            {/* Navigation */}
            <nav className="bg-white px-6 lg:px-8 h-14 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-6">
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
                    <div className="hidden md:flex items-center gap-4 pl-4 border-l border-gray-200">
                        <span className="text-[13px] font-medium text-[#262C30]">Loans and Credit</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-[1200px] mx-auto px-6 lg:px-8 py-6">
                {/* Welcome Section */}
                <div className="mb-6">
                    <h1 className="text-[26px] font-semibold text-[#262C30] mb-1">
                        Explore Our Offerings
                    </h1>
                    <p className="text-[#677178] text-[14px] leading-relaxed">
                        {strangerWelcomeMessage}
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
                                <div className="min-[804px]:w-[40%] p-6 min-[804px]:p-8 flex flex-col justify-center order-2 min-[804px]:order-1">
                                    <h2 className="text-xl min-[804px]:text-2xl font-semibold text-[#262C30] mb-2 leading-tight">
                                        {currentPrequalOffer.featuredHeadline || "You\u2019re prequalified!"}
                                    </h2>
                                    <p className="text-[#677178] text-[14px] leading-relaxed mb-5 max-w-md">
                                        {currentPrequalOffer.featuredDescription || currentPrequalOffer.description || "Check out this exclusive offer tailored just for you."}
                                    </p>
                                    {currentPrequalOffer.attributes && currentPrequalOffer.attributes.length > 0 && (
                                        <div className="flex gap-8 mb-5">
                                            {currentPrequalOffer.attributes.map((attr, idx) => (
                                                <div key={idx}>
                                                    <div className="text-[10px] text-[#677178] mb-0.5">{attr.label}</div>
                                                    <div className="text-2xl min-[804px]:text-[28px] font-bold text-[#262C30] leading-none">
                                                        {attr.value}
                                                        {attr.subtext && (
                                                            <span className="text-[11px] font-normal text-[#677178] ml-1">{attr.subtext}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-3 items-center min-[804px]:items-stretch max-w-[280px]">
                                        <Link
                                            href={`/stranger-storefront/offer/${currentPrequalOffer.id}`}
                                            className="inline-flex items-center justify-center w-full px-8 py-3.5 bg-[#B8C4E0] text-[#1e293b] text-[12px] font-bold tracking-wider uppercase rounded-full hover:bg-[#a3b1d1] transition-colors"
                                        >
                                            REVIEW OFFER
                                        </Link>
                                    </div>
                                </div>
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
                        {prequalOffers.length > 1 && (
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
                        )}
                    </div>
                )}

                {/* Featured Hero */}
                {heroOffer && (
                    <div className="mb-8">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200">
                            <div className="flex flex-col min-[804px]:flex-row min-h-[280px]">
                                <div className="min-[804px]:w-[40%] p-6 min-[804px]:p-8 flex flex-col justify-center order-2 min-[804px]:order-1">
                                    <h2 className="text-xl min-[804px]:text-2xl font-semibold text-[#262C30] mb-2 leading-tight">
                                        {heroOffer.featuredHeadline || heroOffer.title}
                                    </h2>
                                    <p className="text-[#677178] text-[14px] leading-relaxed mb-5 max-w-md">
                                        {heroOffer.featuredDescription || heroOffer.description || "Discover competitive rates and flexible terms."}
                                    </p>
                                    {heroOffer.attributes && heroOffer.attributes.length > 0 && (
                                        <div className="flex gap-8 mb-5">
                                            {heroOffer.attributes.map((attr, idx) => (
                                                <div key={idx}>
                                                    <div className="text-[10px] text-[#677178] mb-0.5">{attr.label}</div>
                                                    <div className="text-2xl min-[804px]:text-[28px] font-bold text-[#262C30] leading-none">
                                                        {attr.value}
                                                        {attr.subtext && (
                                                            <span className="text-[11px] font-normal text-[#677178] ml-1">{attr.subtext}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-3 items-center min-[804px]:items-stretch max-w-[280px]">
                                        <Link
                                            href={heroOffer.variant === 'new-member' ? '/stranger-storefront/apply/membership' : `/stranger-storefront/offer/${heroOffer.id}`}
                                            className="inline-flex items-center justify-center w-full px-8 py-3.5 bg-[#B8C4E0] text-[#1e293b] text-[12px] font-bold tracking-wider uppercase rounded-full hover:bg-[#a3b1d1] transition-colors"
                                        >
                                            {heroOffer.variant === 'new-member' ? 'JOIN NOW' : 'LEARN MORE'}
                                        </Link>
                                    </div>
                                </div>
                                <div className="min-[804px]:w-[60%] order-1 min-[804px]:order-2 relative">
                                    <div className="w-full h-full min-h-[200px] min-[804px]:min-h-full">
                                        <img
                                            src={heroOffer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}
                                            alt={heroOffer.title}
                                            className="w-full h-full object-cover object-center"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Categories */}
                {sections.length > 0 && (
                    <div className="mb-8">
                        <div className="text-[10px] font-medium text-[#677178] uppercase tracking-wider mb-2">
                            Filter Categories
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
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
                            {sectionNames.map((name) => (
                                <button
                                    key={name}
                                    onClick={() => setActiveCategory(name)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[12px] font-medium transition-all border",
                                        activeCategory === name
                                            ? "bg-[#262C30] text-white border-[#262C30]"
                                            : "bg-white text-[#262C30] border-gray-300 hover:border-gray-400"
                                    )}
                                >
                                    {name}
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
                )}

                {/* Offer Sections */}
                {getVisibleSections().map((section) => {
                    if (section.offers.length === 0) return null;
                    return (
                        <section key={section.name} className="mb-10">
                            <h2 className="text-[20px] font-semibold text-[#262C30] mb-4">
                                {section.name}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {section.offers.map((offer) => (
                                    <OfferCard
                                        key={offer.id}
                                        id={offer.id}
                                        variant={offer.variant}
                                        title={offer.title}
                                        description={offer.description}
                                        attributes={offer.attributes}
                                        imageUrl={offer.imageUrl}
                                        ctaText={offer.ctaText || "Learn More"}
                                        ctaLink={offer.variant === 'new-member' ? '/stranger-storefront/apply/membership' : `/stranger-storefront/offer/${offer.id}`}
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}

                {/* Empty State */}
                {publicOffers.length === 0 && (
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
                            There are no public offers configured yet. Check back soon for new opportunities.
                        </p>
                    </div>
                )}
            </main>

            {/* Footer Disclaimers */}
            <footer className="border-t border-gray-300 mt-4">
                <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-6">
                    <p className="text-[11px] text-[#677178] leading-relaxed">
                        {storefrontConfig.footerDisclaimer}
                    </p>
                </div>
            </footer>

            {/* Prototype Navigation */}
            <div className="fixed bottom-4 right-4 z-50 flex gap-2">
                <Link
                    href="/admin/stranger-storefront"
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
