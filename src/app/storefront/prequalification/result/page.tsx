"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Car, Home, CreditCard, Landmark } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useStore } from "@/context/StoreContext";
import type { Offer, ProductType } from "@/context/StoreContext";

// Define prequalified offer types for display
interface PrequalOffer {
    id: string;
    productName: string;
    productType: ProductType;
    maxAmount: number;
    minApr: number;
    maxApr: number;
    terms: number[];
    imageUrl: string;
    icon: React.ElementType;
    description: string;
}

// Mock prequalification results - in real implementation this would come from the TU response
const PREQUAL_OFFERS: PrequalOffer[] = [
    {
        id: "prequal-auto",
        productName: "New Auto Loan",
        productType: "auto-loan",
        maxAmount: 45000,
        minApr: 4.49,
        maxApr: 6.99,
        terms: [36, 48, 60, 72],
        imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
        icon: Car,
        description: "Finance your new vehicle purchase with competitive rates."
    },
    {
        id: "prequal-heloc",
        productName: "Home Equity Line of Credit",
        productType: "heloc",
        maxAmount: 125000,
        minApr: 6.99,
        maxApr: 8.99,
        terms: [60, 120, 180, 240],
        imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
        icon: Home,
        description: "Tap into your home's equity for major expenses or debt consolidation."
    },
    {
        id: "prequal-credit-card",
        productName: "Platinum Rewards Visa",
        productType: "credit-card",
        maxAmount: 15000,
        minApr: 12.99,
        maxApr: 18.99,
        terms: [],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
        icon: CreditCard,
        description: "Earn 2X points on every purchase with no annual fee."
    },
    {
        id: "prequal-personal",
        productName: "Personal Loan",
        productType: "auto-loan", // Using auto-loan as fallback product type
        maxAmount: 25000,
        minApr: 7.99,
        maxApr: 12.99,
        terms: [24, 36, 48, 60],
        imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",
        icon: Landmark,
        description: "Flexible financing for any purpose with fixed monthly payments."
    }
];

export default function PrequalificationResultPage() {
    const router = useRouter();
    const { addOffer, addSection, sections, offers } = useStore();
    const hasAddedOffers = useRef(false);

    // Map of prequal offer IDs to store offer IDs
    const [offerIdMap, setOfferIdMap] = useState<Record<string, string>>({});

    // Automatically add all prequalified offers to the storefront on mount
    useEffect(() => {
        if (hasAddedOffers.current) return;
        hasAddedOffers.current = true;

        const prequalSection = "Your Prequalified Offers";
        const newOfferIdMap: Record<string, string> = {};

        // Add the section if it doesn't exist
        if (!sections.includes(prequalSection)) {
            addSection(prequalSection);
        }

        // Create and add each prequalified offer
        PREQUAL_OFFERS.forEach((prequalOffer, index) => {
            // Check if this offer already exists in the store
            const existingOffer = offers.find(o =>
                o.title === prequalOffer.productName &&
                o.section === prequalSection
            );

            if (existingOffer) {
                // Use existing offer ID
                newOfferIdMap[prequalOffer.id] = existingOffer.id;
            } else {
                // Create new offer with unique ID (use index to ensure uniqueness)
                const newOfferId = `prequal-${prequalOffer.productType}-${Date.now()}-${index}`;
                newOfferIdMap[prequalOffer.id] = newOfferId;

                const newOffer: Offer = {
                    id: newOfferId,
                    title: prequalOffer.productName,
                    variant: 'preapproved',
                    productType: prequalOffer.productType,
                    section: prequalSection,
                    isFeatured: false,
                    attributes: prequalOffer.productType === 'credit-card'
                        ? [
                            { label: "Credit limit", value: `$${prequalOffer.maxAmount.toLocaleString()}` },
                            { label: "As low as", value: `${prequalOffer.minApr}%`, subtext: "APR*" }
                        ]
                        : [
                            { label: "Up to", value: `$${prequalOffer.maxAmount.toLocaleString()}` },
                            { label: "As low as", value: `${prequalOffer.minApr}%`, subtext: "APR*" }
                        ],
                    imageUrl: prequalOffer.imageUrl,
                    ctaText: "Review Offer"
                };

                addOffer(newOffer);
            }
        });

        setOfferIdMap(newOfferIdMap);
    }, [addOffer, addSection, sections, offers]);

    const handleRedeemOffer = (prequalOfferId: string) => {
        const storeOfferId = offerIdMap[prequalOfferId];
        if (storeOfferId) {
            router.push(`/storefront/offer/${storeOfferId}/apply`);
        }
    };

    return (
        <div className="min-h-screen bg-[#E8EBED] font-sans text-[#262C30]">
            {/* Navigation */}
            <nav className="bg-white px-6 lg:px-8 h-14 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 text-[13px] font-medium text-[#677178] hover:text-[#262C30] transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="h-5 w-px bg-gray-200" />
                    <Link href="/storefront" className="flex items-center gap-2">
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
                </div>
            </nav>

            <main className="max-w-[800px] mx-auto px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <span className="inline-block text-[10px] font-bold px-3 py-1.5 rounded bg-[#7CEB87] text-[#1a472a] uppercase tracking-wide mb-4">
                        Congratulations!
                    </span>
                    <h1 className="text-[28px] font-semibold text-[#262C30] mb-3">
                        You're Prequalified for {PREQUAL_OFFERS.length} Offers
                    </h1>
                    <p className="text-[15px] text-[#677178] leading-relaxed max-w-lg mx-auto">
                        Great news! Based on your information, you've been prequalified for the following products. These offers have been added to your storefront and are ready to redeem.
                    </p>
                </div>

                {/* Offers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {PREQUAL_OFFERS.map(offer => {
                        const Icon = offer.icon;

                        return (
                            <div
                                key={offer.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Image */}
                                <div className="relative aspect-[2/1] overflow-hidden">
                                    <img
                                        src={offer.imageUrl}
                                        alt={offer.productName}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Badge */}
                                    <div className="absolute bottom-3 left-3">
                                        <span className="inline-block text-[9px] font-bold px-2.5 py-1 rounded bg-emerald-500 text-white uppercase tracking-wide">
                                            Pre-Qualified
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#143C67]/10 flex items-center justify-center shrink-0">
                                            <Icon className="w-5 h-5 text-[#143C67]" />
                                        </div>
                                        <div>
                                            <h3 className="text-[16px] font-semibold text-[#262C30]">{offer.productName}</h3>
                                            <p className="text-[12px] text-[#677178] mt-0.5">{offer.description}</p>
                                        </div>
                                    </div>

                                    {/* Attributes */}
                                    <div className="flex gap-6 mb-4">
                                        <div>
                                            <p className="text-[11px] text-[#677178] uppercase tracking-wide">
                                                {offer.productType === 'credit-card' ? 'Credit Limit' : 'Up to'}
                                            </p>
                                            <p className="text-[20px] font-bold text-[#262C30]">
                                                ${offer.maxAmount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-[#677178] uppercase tracking-wide">As low as</p>
                                            <p className="text-[20px] font-bold text-[#262C30]">
                                                {offer.minApr}%<span className="text-[12px] font-normal text-[#677178] ml-0.5">APR*</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Redeem Button */}
                                    <button
                                        onClick={() => handleRedeemOffer(offer.id)}
                                        className="w-full py-3 bg-[#262C30] text-white text-[11px] font-bold tracking-wider uppercase rounded-full hover:bg-black transition-colors flex items-center justify-center gap-1"
                                    >
                                        Redeem This Offer
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* View Storefront CTA */}
                <div className="text-center mb-8">
                    <p className="text-[14px] text-[#677178] mb-3">
                        Not ready to redeem? No problem—your offers will be waiting for you.
                    </p>
                    <Link
                        href="/storefront"
                        className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-[#262C30] text-[12px] font-bold tracking-wider uppercase rounded-full hover:border-gray-400 transition-colors"
                    >
                        View My Storefront
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Disclaimers */}
                <div className="text-[10px] text-[#9CA3AF] leading-relaxed">
                    <p>
                        * An annual percentage rate (APR) is the annual rate charged for borrowing or earned through an investment, and is expressed as a percentage that represents the actual yearly cost of funds over the term of a loan. Rates shown are the lowest available rates for qualified borrowers. Your actual rate may vary based on creditworthiness and other factors. All offers subject to credit approval.
                    </p>
                </div>
            </main>

            {/* Prototype Navigation */}
            <div className="fixed bottom-4 right-4 z-50 flex gap-2">
                <Link
                    href="/storefront"
                    className="px-3 py-1.5 bg-[#262C30] text-white text-[11px] font-medium rounded-full shadow-lg hover:bg-black transition-colors"
                >
                    Back to Storefront
                </Link>
            </div>
        </div>
    );
}
