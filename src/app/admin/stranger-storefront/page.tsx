"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { Check, Eye, ChevronDown, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { OfferVariant, StrangerOffer } from "@/context/StoreContext";

// Variants available for the stranger storefront
const STRANGER_VARIANTS: { value: OfferVariant; label: string }[] = [
    { value: "ita", label: "Invite to Apply" },
    { value: "preapproved", label: "Preapproved" },
    { value: "wildcard", label: "Special Offer" },
    { value: "new-member", label: "New Member" },
    { value: "protection", label: "Protection" },
];

interface SelectedOfferConfig {
    variant: OfferVariant;
    isFeatured: boolean;
}

export default function StrangerStorefrontSettingsPage() {
    const { offers, strangerOffers, strangerWelcomeMessage, updateStrangerOffers, updateStrangerWelcomeMessage } = useStore();
    const [saved, setSaved] = useState(false);
    const [selectedOffers, setSelectedOffers] = useState<Map<string, SelectedOfferConfig>>(new Map());
    const [welcomeMessage, setWelcomeMessage] = useState(strangerWelcomeMessage);

    useEffect(() => {
        const map = new Map<string, SelectedOfferConfig>();
        for (const so of strangerOffers) {
            map.set(so.offerId, { variant: so.variant, isFeatured: so.isFeatured });
        }
        setSelectedOffers(map);
        setWelcomeMessage(strangerWelcomeMessage);
    }, [strangerOffers, strangerWelcomeMessage]);

    const toggleOffer = (id: string) => {
        setSelectedOffers((prev) => {
            const next = new Map(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.set(id, { variant: "ita", isFeatured: false });
            }
            return next;
        });
    };

    const setOfferVariant = (id: string, variant: OfferVariant) => {
        setSelectedOffers((prev) => {
            const next = new Map(prev);
            const existing = next.get(id);
            if (existing) {
                next.set(id, { ...existing, variant });
            }
            return next;
        });
    };

    const toggleFeatured = (id: string) => {
        setSelectedOffers((prev) => {
            const next = new Map(prev);
            const existing = next.get(id);
            if (existing) {
                next.set(id, { ...existing, isFeatured: !existing.isFeatured });
            }
            return next;
        });
    };

    const handleSave = () => {
        const strangerOffersList: StrangerOffer[] = Array.from(selectedOffers.entries()).map(
            ([offerId, config]) => ({ offerId, variant: config.variant, isFeatured: config.isFeatured })
        );
        updateStrangerOffers(strangerOffersList);
        updateStrangerWelcomeMessage(welcomeMessage);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Group offers by section for display
    const sectionMap = new Map<string, typeof offers>();
    for (const offer of offers) {
        const section = offer.section || "Other";
        if (!sectionMap.has(section)) {
            sectionMap.set(section, []);
        }
        sectionMap.get(section)!.push(offer);
    }

    const featuredCount = Array.from(selectedOffers.values()).filter(c => c.isFeatured).length;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Stranger Storefront</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Configure which offers are visible to non-members visiting your credit union website.
                    </p>
                </div>
                <Link
                    href="/stranger-storefront"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <Eye className="w-4 h-4" />
                    Preview
                </Link>
            </div>

            {/* Welcome Message */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">Welcome Message</h2>
                </div>
                <div className="p-6">
                    <textarea
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                        placeholder="Explore our offerings and find the right financial products for you."
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Shown as the subtitle on the public storefront. No personalized greeting is used.
                    </p>
                </div>
            </div>

            {/* Offer Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-slate-900">Select Offers</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Choose which offers non-members can see, set the offer type, and mark featured offers.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                            {featuredCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    {featuredCount} featured
                                </span>
                            )}
                            <span>{selectedOffers.size} selected</span>
                        </div>
                    </div>
                </div>
                <div className="divide-y divide-slate-100">
                    {Array.from(sectionMap.entries()).map(([sectionName, sectionOffers]) => (
                        <div key={sectionName}>
                            <div className="px-6 py-2 bg-slate-50/50">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    {sectionName}
                                </span>
                            </div>
                            {sectionOffers.map((offer) => {
                                const isSelected = selectedOffers.has(offer.id);
                                const config = selectedOffers.get(offer.id);
                                const selectedVariant = config?.variant || "ita";
                                const isFeatured = config?.isFeatured || false;
                                return (
                                    <div
                                        key={offer.id}
                                        className={cn(
                                            "flex items-center gap-4 px-6 py-3 transition-colors hover:bg-slate-50",
                                            isSelected && "bg-blue-50/50"
                                        )}
                                    >
                                        {/* Checkbox */}
                                        <button
                                            onClick={() => toggleOffer(offer.id)}
                                            className="shrink-0"
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                isSelected
                                                    ? "bg-slate-900 border-slate-900"
                                                    : "border-slate-300"
                                            )}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </button>

                                        {/* Offer title */}
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-slate-900 truncate block">
                                                {offer.title}
                                            </span>
                                        </div>

                                        {/* Featured toggle + Variant selector - only shown when selected */}
                                        {isSelected ? (
                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Featured star toggle */}
                                                <button
                                                    onClick={() => toggleFeatured(offer.id)}
                                                    className={cn(
                                                        "p-1.5 rounded-lg border transition-colors",
                                                        isFeatured
                                                            ? "border-amber-300 bg-amber-50 text-amber-500"
                                                            : "border-slate-200 bg-white text-slate-300 hover:text-slate-400 hover:border-slate-300"
                                                    )}
                                                    title={isFeatured ? "Remove from featured" : "Mark as featured"}
                                                >
                                                    <Star className={cn("w-3.5 h-3.5", isFeatured && "fill-amber-500")} />
                                                </button>

                                                {/* Variant dropdown */}
                                                <div className="relative">
                                                    <select
                                                        value={selectedVariant}
                                                        onChange={(e) => setOfferVariant(offer.id, e.target.value as OfferVariant)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="appearance-none bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent cursor-pointer"
                                                    >
                                                        {STRANGER_VARIANTS.map((v) => (
                                                            <option key={v.value} value={v.value}>
                                                                {v.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 shrink-0">
                                                Not included
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={handleSave}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                        saved
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                >
                    {saved ? (
                        <>
                            <Check className="w-4 h-4" />
                            Saved!
                        </>
                    ) : (
                        "Save Changes"
                    )}
                </button>
            </div>
        </div>
    );
}
