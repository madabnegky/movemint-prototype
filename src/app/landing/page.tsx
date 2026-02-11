"use client";

import Link from "next/link";
import { useMemo } from "react";
import { User, ChevronDown } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { CreditMountainCard } from "@/components/storefront/CreditMountainCard";
import { PrequalificationCard } from "@/components/storefront/PrequalificationCard";
import { PreviewAsDropdown } from "@/components/preview/PreviewAsDropdown";
import { PreviewModeToggle } from "@/components/preview/PreviewModeToggle";
import { aggregateOffersFromAllCampaigns, GeneratedOffer } from "@/lib/ruleEvaluator";

export default function LandingPage() {
    const { offers, featureFlags, campaigns, products, memberProfiles, selectedProfileId, previewMode } = useStore();

    // Get the selected member profile
    const selectedProfile = memberProfiles.find(p => p.id === selectedProfileId);

    // Live mode: aggregate from ALL live campaigns
    const liveOffers: GeneratedOffer[] = useMemo(() => {
        if (!selectedProfile || previewMode !== 'live') return [];
        return aggregateOffersFromAllCampaigns(campaigns, selectedProfile, products);
    }, [selectedProfile, previewMode, campaigns, products]);

    // Check if user has any preapproved offers
    const hasPreapprovals = previewMode === 'live' && selectedProfile
        ? liveOffers.some(o => o.variant === 'preapproved')
        : offers.some(o => o.variant === 'preapproved' || o.variant === 'auto-refi' || o.variant === 'credit-limit');

    // Get featured offer for hero section
    const featuredOffer = previewMode === 'live' && selectedProfile
        ? liveOffers.find(o => o.isFeatured && o.variant === 'preapproved')
        : null;

    // Show Credit Mountain if no preapprovals and flag is on
    const showCreditMountain = !hasPreapprovals && featureFlags.storefront_creditMountain;

    return (
        <div className="min-h-screen bg-brand-light-gray font-sans text-brand-gray">
            {/* Navigation */}
            <nav className="bg-white px-8 py-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-12">
                    <div className="text-2xl font-bold text-brand-navy tracking-tight">Credit Union</div>
                    <div className="hidden md:flex gap-8 text-sm font-semibold text-brand-gray">
                        <Link href="#" className="hover:text-brand-navy transition-colors border-b-2 border-transparent hover:border-brand-navy pb-1">Loans & Credit</Link>
                        <Link href="#" className="hover:text-brand-navy transition-colors border-b-2 border-transparent hover:border-brand-navy pb-1">Accounts</Link>
                        <Link href="#" className="hover:text-brand-navy transition-colors border-b-2 border-transparent hover:border-brand-navy pb-1">Planning</Link>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy cursor-pointer">
                        <User className="w-5 h-5" />
                        <span>Profile</span>
                        <ChevronDown className="w-4 h-4 text-brand-mid-gray" />
                    </div>
                </div>
            </nav>

            {/* Hero / Dashboard */}
            <main className="max-w-[1440px] mx-auto px-8 py-12">

                {/* Preview Controls */}
                <div className="mb-6 flex items-center gap-3">
                    <PreviewModeToggle />
                    <PreviewAsDropdown />
                    {previewMode === 'live' && selectedProfile && (
                        <span className="text-xs text-slate-500">
                            Evaluating {campaigns.filter(c => c.status === 'live').length} live campaign(s) for <span className="font-medium">{selectedProfile.name}</span>
                        </span>
                    )}
                </div>

                {/* Welcome Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-brand-gray mb-2">
                        {showCreditMountain
                            ? "Cameron, improve your financial future."
                            : "Cameron, check out these offers picked just for you."}
                    </h1>
                    <p className="text-brand-mid-gray text-lg">
                        {showCreditMountain
                            ? "Get personalized guidance to build better credit and unlock new opportunities."
                            : "We've analyzed your financial health and found these opportunities."}
                    </p>
                </div>

                {/* Consumer Prequalification Card */}
                {featureFlags.consumer_prequalification && (
                    <div className="mb-10 max-w-2xl">
                        <PrequalificationCard />
                    </div>
                )}

                {/* Categories (Tabs) - Only show if not Credit Mountain mode */}
                {!showCreditMountain && (
                    <div className="flex gap-4 mb-10 overflow-x-auto pb-4">
                        <button className="px-6 py-3 bg-brand-navy text-white font-bold rounded-full shadow-lg shadow-brand-navy/20 whitespace-nowrap">
                            Auto Loan & Offers
                        </button>
                        <button className="px-6 py-3 bg-white text-brand-gray border border-brand-mid-gray/20 font-semibold rounded-full hover:bg-brand-light-gray transition-colors whitespace-nowrap">
                            Home Loans & Offers
                        </button>
                        <button className="px-6 py-3 bg-white text-brand-gray border border-brand-mid-gray/20 font-semibold rounded-full hover:bg-brand-light-gray transition-colors whitespace-nowrap">
                            Credit Tiles
                        </button>
                    </div>
                )}

                {/* Hero Card: Credit Mountain or Auto Loan Preapproval */}
                {showCreditMountain ? (
                    <CreditMountainCard variant="hero" />
                ) : (
                    <div className="bg-white rounded-3xl p-10 shadow-sm border border-brand-border/20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative overflow-hidden group">
                        <div className="relative z-10 space-y-6">
                            <div className="inline-flex items-center px-4 py-1.5 rounded-md bg-brand-teal/10 text-brand-teal font-bold text-xs tracking-wider uppercase">
                                {featuredOffer?.variant === 'preapproved' ? "You're Preapproved!" : hasPreapprovals ? "You're Preapproved!" : "Apply Now"}
                            </div>
                            <h2 className="text-4xl font-bold text-brand-navy leading-tight">
                                {featuredOffer ? (
                                    <>
                                        {featuredOffer.featuredHeadline || `Check out your ${featuredOffer.title} offer`}
                                        {featuredOffer.preapprovalLimit && (
                                            <> with up to <span className="text-brand-teal">${featuredOffer.preapprovalLimit.toLocaleString()}</span></>
                                        )}
                                    </>
                                ) : (
                                    <>Get the car you want with up to <span className="text-brand-teal">$60,000</span> on your new auto loan.</>
                                )}
                            </h2>
                            <p className="text-lg text-brand-mid-gray font-medium">
                                {featuredOffer?.featuredDescription || (
                                    <>Rates as low as <span className="text-brand-gray font-bold">2.4% APR</span>. No origination fees.</>
                                )}
                            </p>
                            <div className="pt-4 flex gap-4">
                                <Link href="/storefront" className="px-8 py-4 bg-brand-navy text-white font-bold rounded-lg hover:bg-[#0f2e50] transition-colors shadow-lg shadow-brand-navy/20">
                                    {featuredOffer?.ctaText || "Review Offer"}
                                </Link>
                                <button className="px-8 py-4 bg-transparent text-brand-navy font-bold rounded-lg border-2 border-brand-navy hover:bg-brand-navy/5 transition-colors">
                                    View Details
                                </button>
                            </div>
                        </div>

                        {/* Visual / Illustration Area */}
                        <div className="relative h-full min-h-[300px] bg-brand-hero-blue/30 rounded-2xl flex items-center justify-center overflow-hidden">
                            {featuredOffer?.imageUrl ? (
                                <img src={featuredOffer.imageUrl} alt={featuredOffer.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-brand-navy/20 font-bold text-2xl">Car Illustration Placeholder</div>
                            )}
                            {/* Decorative Elements */}
                            <div className="absolute top-10 right-10 w-24 h-24 bg-brand-purple/10 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-10 left-10 w-32 h-32 bg-brand-teal/10 rounded-full blur-2xl"></div>
                        </div>
                    </div>
                )}

            </main>

            {/* Floating Prototype Nav */}
            <div className="fixed bottom-6 right-6 z-50">
                <Link href="/" className="px-4 py-2 bg-brand-gray text-white text-xs font-medium rounded-full shadow-xl hover:bg-black backdrop-blur-sm border border-white/20">
                    Menu
                </Link>
            </div>
        </div>
    )
}
