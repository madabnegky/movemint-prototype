"use client";

import { useState } from "react";
import { useStore, Offer, StorefrontConfig, FeatureFlags } from "@/context/StoreContext";
import { Play, RotateCcw, Check, AlertCircle, Car, Home, CreditCard, Shield, Mountain } from "lucide-react";
import Link from "next/link";

// Scenario presets
interface Scenario {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    config: StorefrontConfig;
    offers: Offer[];
    featureFlags?: Partial<FeatureFlags>;
}

const SCENARIOS: Scenario[] = [
    {
        id: 'auto-focus',
        name: 'Auto Loans Focus',
        description: 'Showcase auto lending products with preapproved offers and refinance options.',
        icon: Car,
        config: {
            userName: 'Cameron',
            welcomeMessage: "Great news! Based on your profile, you're preapproved for several auto loan options. See what's available for you below.",
            footerDisclaimer: '*APR = Annual Percentage Rate. Rates shown are the lowest available and are subject to change. Your actual rate may vary based on creditworthiness, loan term, and other factors. All loans subject to approval.',
            theme: 'galaxy',
        },
        offers: [
            {
                id: 'auto-1',
                title: 'New Auto Loan',
                variant: 'preapproved',
                productType: 'auto-loan',
                section: 'Auto Loans',
                isFeatured: true,
                featuredHeadline: "You're preapproved!",
                featuredDescription: "Get behind the wheel of your dream car with our competitive rates and flexible terms.",
                attributes: [
                    { label: 'Up to', value: '$50,000' },
                    { label: 'As low as', value: '4.49%', subtext: 'APR*' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Review Offer',
            },
            {
                id: 'auto-2',
                title: 'Used Auto Loan',
                variant: 'preapproved',
                productType: 'auto-loan',
                section: 'Auto Loans',
                isFeatured: false,
                attributes: [
                    { label: 'Up to', value: '$35,000' },
                    { label: 'As low as', value: '5.24%', subtext: 'APR*' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Learn More',
            },
            {
                id: 'auto-3',
                title: 'Refinance Your Auto',
                variant: 'auto-refi',
                productType: 'auto-refi',
                section: 'Auto Loans',
                isFeatured: false,
                attributes: [
                    { label: 'Save up to', value: '$127', subtext: '/mo.' },
                    { label: 'As low as', value: '4.99%', subtext: 'APR*' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Calculate Savings',
            },
            {
                id: 'auto-4',
                title: 'GAP Plus Coverage',
                variant: 'protection',
                productType: 'gap',
                section: 'Protection Products',
                isFeatured: false,
                description: 'Protect yourself from owing more than your vehicle is worth if it\'s totaled or stolen.',
                attributes: [],
                imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Learn More',
            },
        ],
    },
    {
        id: 'home-focus',
        name: 'Home Lending Focus',
        description: 'Highlight home equity and mortgage products for homeowners.',
        icon: Home,
        config: {
            userName: 'Jordan',
            welcomeMessage: "Unlock the equity in your home! You're preapproved for several home lending options based on your membership history.",
            footerDisclaimer: '*APR = Annual Percentage Rate. Home equity products use your home as collateral. Consult a tax advisor regarding interest deductibility. All loans subject to property appraisal and approval.',
            theme: 'galaxy',
        },
        offers: [
            {
                id: 'home-1',
                title: 'Home Equity Line of Credit',
                variant: 'preapproved',
                productType: 'heloc',
                section: 'Home Loans',
                isFeatured: true,
                featuredHeadline: "Tap into your home's equity",
                featuredDescription: "Access funds when you need them with a flexible line of credit secured by your home.",
                attributes: [
                    { label: 'Up to', value: '$150,000' },
                    { label: 'As low as', value: '6.99%', subtext: 'APR*' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Review Offer',
            },
            {
                id: 'home-2',
                title: 'Home Equity Loan',
                variant: 'preapproved',
                productType: 'home-loan',
                section: 'Home Loans',
                isFeatured: false,
                attributes: [
                    { label: 'Up to', value: '$100,000' },
                    { label: 'Fixed rate', value: '7.25%', subtext: 'APR*' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Learn More',
            },
            {
                id: 'home-3',
                title: 'Mortgage Refinance',
                variant: 'ita',
                productType: 'home-loan',
                section: 'Home Loans',
                isFeatured: false,
                attributes: [
                    { label: 'Rates from', value: '6.49%', subtext: 'APR*' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Check Rates',
            },
        ],
    },
    {
        id: 'credit-cards',
        name: 'Credit Card Showcase',
        description: 'Feature credit card offers and limit increases.',
        icon: CreditCard,
        config: {
            userName: 'Alex',
            welcomeMessage: "You've earned it! Check out these exclusive credit card offers and rewards available to you.",
            footerDisclaimer: '*APR = Annual Percentage Rate. Credit card APRs are variable and subject to change. See card agreement for full terms and conditions.',
            theme: 'galaxy',
        },
        offers: [
            {
                id: 'cc-1',
                title: 'Platinum Rewards Visa',
                variant: 'preapproved',
                productType: 'credit-card',
                section: 'Credit Cards',
                isFeatured: true,
                featuredHeadline: "Earn rewards on every purchase",
                featuredDescription: "Get 2X points on travel and dining, plus a generous sign-up bonus.",
                attributes: [
                    { label: 'As low as', value: '11.99%', subtext: 'APR*' },
                    { label: 'Earn up to', value: '50,000', subtext: 'bonus pts' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Review Offer',
            },
            {
                id: 'cc-2',
                title: 'Cash Back Mastercard',
                variant: 'ita',
                productType: 'credit-card',
                section: 'Credit Cards',
                isFeatured: false,
                attributes: [
                    { label: 'Cash back', value: '1.5%', subtext: 'unlimited' },
                    { label: 'As low as', value: '13.99%', subtext: 'APR*' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Apply Now',
            },
            {
                id: 'cc-3',
                title: 'Credit Limit Increase',
                variant: 'credit-limit',
                productType: 'credit-limit-increase',
                section: 'Credit Cards',
                isFeatured: false,
                attributes: [
                    { label: 'Increase up to', value: '$5,000' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Request Increase',
            },
        ],
    },
    {
        id: 'mixed-portfolio',
        name: 'Mixed Portfolio',
        description: 'A balanced mix of auto, home, and credit products for demos.',
        icon: Shield,
        config: {
            userName: 'Cameron',
            welcomeMessage: "We're glad you're here. Browse these recommended options to help you meet your financial goals.",
            footerDisclaimer: 'All offers subject to approval. Rates and terms may vary based on creditworthiness. This is a prototype for demonstration purposes.',
            theme: 'galaxy',
        },
        offers: [
            {
                id: 'mix-1',
                title: 'New Auto Loan',
                variant: 'preapproved',
                productType: 'auto-loan',
                section: 'Auto Loans & Offers',
                isFeatured: true,
                featuredHeadline: "You're preapproved!",
                featuredDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dictum velit at blandit tortor nunc ut egestas metus.",
                attributes: [
                    { label: 'Up to', value: '$40,000' },
                    { label: 'As low as', value: '3.62%', subtext: 'APR*†' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Learn More',
            },
            {
                id: 'mix-2',
                title: 'Used Auto Loan',
                variant: 'preapproved',
                productType: 'auto-loan',
                section: 'Auto Loans & Offers',
                isFeatured: false,
                attributes: [
                    { label: 'Up to', value: '$35,000' },
                    { label: 'As low as', value: '4.49%', subtext: 'APR*†' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Learn More',
            },
            {
                id: 'mix-3',
                title: 'Home Equity Line of Credit',
                variant: 'preapproved',
                productType: 'heloc',
                section: 'Home Loans & Offers',
                isFeatured: false,
                attributes: [
                    { label: 'Up to', value: '$150,000' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Learn More',
            },
            {
                id: 'mix-4',
                title: 'Refinance Your Auto Loan',
                variant: 'auto-refi',
                productType: 'auto-refi',
                section: 'Auto Loans & Offers',
                isFeatured: false,
                monthlySavings: 127,
                attributes: [
                    { label: 'Save up to', value: '$127', subtext: '/mo.' },
                    { label: 'Or as low as', value: '4.99%', subtext: 'APR*' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Learn More',
            },
            {
                id: 'mix-5',
                title: 'Platinum Rewards Visa',
                variant: 'ita',
                productType: 'credit-card',
                section: 'Credit Cards',
                isFeatured: false,
                attributes: [
                    { label: 'As low as', value: '12.99%', subtext: 'APR*†' },
                ],
                imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Learn More',
            },
            {
                id: 'mix-6',
                title: 'GAP Plus Coverage',
                variant: 'protection',
                productType: 'gap',
                section: 'Special Offers',
                isFeatured: false,
                description: "If your vehicle is deemed a total loss due to an accident or is stolen, GAP Plus addresses the difference between what insurance will pay and what you owe.",
                attributes: [],
                imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80',
                ctaText: 'Learn More',
            },
        ],
    },
    {
        id: 'credit-mountain',
        name: 'Credit Mountain AI Coach',
        description: 'Demo the Credit Mountain experience when a member has no preapproved offers.',
        icon: Mountain,
        config: {
            userName: 'Taylor',
            welcomeMessage: "We're here to help you improve your financial future. Explore personalized tools to build better credit.",
            footerDisclaimer: 'Credit Mountain AI Coach provides educational guidance only and is not financial advice. Your credit score and eligibility for products may vary.',
            theme: 'galaxy',
        },
        offers: [], // No offers - triggers Credit Mountain display
        featureFlags: {
            storefront_creditMountain: true,
        },
    },
];

export default function ScenariosPage() {
    useStore(); // Access store for potential future use
    const [appliedScenario, setAppliedScenario] = useState<string | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    const applyScenario = (scenario: Scenario) => {
        setIsApplying(true);

        // Clear existing data and apply new scenario
        localStorage.setItem('movemint_offers', JSON.stringify(scenario.offers));
        localStorage.setItem('movemint_storefront_config', JSON.stringify(scenario.config));

        // Extract unique sections from offers
        const sections = [...new Set(scenario.offers.map(o => o.section))];
        localStorage.setItem('movemint_sections', JSON.stringify(sections));

        // Apply feature flags if specified
        if (scenario.featureFlags) {
            const currentFlags = JSON.parse(localStorage.getItem('movemint_feature_flags') || '{}');
            const updatedFlags = { ...currentFlags, ...scenario.featureFlags };
            localStorage.setItem('movemint_feature_flags', JSON.stringify(updatedFlags));
        }

        setAppliedScenario(scenario.id);

        // Reload to pick up changes
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    const resetToDefaults = () => {
        setIsApplying(true);
        localStorage.removeItem('movemint_offers');
        localStorage.removeItem('movemint_storefront_config');
        localStorage.removeItem('movemint_sections');

        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Demo Scenarios</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Quickly load preset configurations for different demo contexts.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={resetToDefaults}
                        disabled={isApplying}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset to Defaults
                    </button>
                    <Link
                        href="/storefront"
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        View Storefront
                    </Link>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm text-amber-800 font-medium">Applying a scenario will replace all current offers</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                        Your current configuration will be overwritten. Use "Reset to Defaults" to restore the original demo data.
                    </p>
                </div>
            </div>

            {/* Scenario Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SCENARIOS.map((scenario) => (
                    <div
                        key={scenario.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <scenario.icon className="w-6 h-6 text-slate-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-900">{scenario.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{scenario.description}</p>
                                </div>
                            </div>

                            {/* Preview stats */}
                            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                <span>{scenario.offers.length} offers</span>
                                <span>{scenario.offers.filter(o => o.isFeatured).length} featured</span>
                                <span>{[...new Set(scenario.offers.map(o => o.section))].length} sections</span>
                                {scenario.featureFlags?.storefront_creditMountain && (
                                    <span className="text-amber-600 font-medium">Credit Mountain enabled</span>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={() => applyScenario(scenario)}
                                disabled={isApplying}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                    appliedScenario === scenario.id
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-900 text-white hover:bg-slate-800'
                                } disabled:opacity-50`}
                            >
                                {appliedScenario === scenario.id ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Applied!
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        Apply Scenario
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Scenario Hint */}
            <div className="bg-slate-100 rounded-xl p-6 text-center">
                <p className="text-sm text-slate-600">
                    Need a custom configuration? Use the{' '}
                    <Link href="/admin/product-config" className="font-medium text-slate-900 underline">
                        Offer Manager
                    </Link>
                    {' '}and{' '}
                    <Link href="/admin/storefront-settings" className="font-medium text-slate-900 underline">
                        Storefront Settings
                    </Link>
                    {' '}to build your own.
                </p>
            </div>
        </div>
    );
}
