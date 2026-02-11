"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Offer, ProductType } from "@/context/StoreContext";

// US states for the dropdown
const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming"
];

// Mock prequalified offers
const PREQUAL_OFFERS: Offer[] = [
    {
        id: `prequal-auto-${Date.now()}`,
        title: "New Auto Loan",
        variant: 'prequalified',
        productType: "auto-loan" as ProductType,
        section: "Auto Loans & Offers",
        isFeatured: false,
        attributes: [
            { label: "Up to", value: "$45,000" },
            { label: "As low as", value: "4.49%", subtext: "APR*" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
        ctaText: "Review Offer",
        description: "Finance your new vehicle purchase with competitive rates.",
        featuredHeadline: "You\u2019re prequalified!",
        featuredDescription: "Get on the road in a car you want with a prequalified new auto loan."
    },
    {
        id: `prequal-heloc-${Date.now()}`,
        title: "Home Equity Line of Credit",
        variant: 'prequalified',
        productType: "heloc" as ProductType,
        section: "Credit Cards & LOC",
        isFeatured: false,
        attributes: [
            { label: "Up to", value: "$125,000" },
            { label: "As low as", value: "6.99%", subtext: "APR*" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
        ctaText: "Review Offer",
        description: "Tap into your home\u2019s equity for major expenses or debt consolidation.",
        featuredHeadline: "You\u2019re prequalified!",
        featuredDescription: "Access your home\u2019s equity with a prequalified line of credit."
    },
    {
        id: `prequal-cc-${Date.now()}`,
        title: "Platinum Rewards Visa",
        variant: 'prequalified',
        productType: "credit-card" as ProductType,
        section: "Credit Cards & LOC",
        isFeatured: false,
        attributes: [
            { label: "Up to", value: "$15,000" },
            { label: "As low as", value: "12.99%", subtext: "APR*" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
        ctaText: "Review Offer",
        description: "Earn 2X points on every purchase with no annual fee.",
        featuredHeadline: "You\u2019re prequalified!",
        featuredDescription: "You\u2019re prequalified for our Platinum Rewards Visa."
    },
    {
        id: `prequal-personal-${Date.now()}`,
        title: "Personal Loan",
        variant: 'prequalified',
        productType: "auto-loan" as ProductType,
        section: "Auto Loans & Offers",
        isFeatured: false,
        attributes: [
            { label: "Up to", value: "$25,000" },
            { label: "As low as", value: "7.99%", subtext: "APR*" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",
        ctaText: "Review Offer",
        description: "Flexible financing for any purpose with fixed monthly payments.",
        featuredHeadline: "You\u2019re prequalified!",
        featuredDescription: "Get a prequalified personal loan with flexible terms."
    }
];

interface PrequalificationCardProps {
    variant?: "default" | "compact";
    onPrequalComplete?: (offers: Offer[]) => void;
}

export function PrequalificationCard({ variant = "default", onPrequalComplete }: PrequalificationCardProps) {
    const isCompact = variant === "compact";
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        dateOfBirth: "",
        ssn: "",
    });

    // For SSN masking - store the actual value separately
    const [actualSSN, setActualSSN] = useState("");

    const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const lastChar = inputValue.slice(-1);
        const isDeleting = inputValue.length < formData.ssn.length;

        let newActualSSN = actualSSN;

        if (isDeleting) {
            newActualSSN = actualSSN.slice(0, -1);
        } else if (/\d/.test(lastChar) && actualSSN.length < 9) {
            newActualSSN = actualSSN + lastChar;
        }

        setActualSSN(newActualSSN);

        // Display masked version with dashes: ***-**-1234
        if (newActualSSN.length === 0) {
            setFormData(prev => ({ ...prev, ssn: "" }));
        } else if (newActualSSN.length <= 3) {
            const masked = "*".repeat(newActualSSN.length);
            setFormData(prev => ({ ...prev, ssn: masked }));
        } else if (newActualSSN.length <= 5) {
            const masked = "***-" + "*".repeat(newActualSSN.length - 3);
            setFormData(prev => ({ ...prev, ssn: masked }));
        } else {
            const visible = newActualSSN.slice(5);
            const masked = "***-**-" + visible;
            setFormData(prev => ({ ...prev, ssn: masked }));
        }
    };

    // DOB auto-formatting: MM/DD/YYYY
    const handleDOBChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, "");
        let formatted = "";

        if (raw.length <= 2) {
            formatted = raw;
        } else if (raw.length <= 4) {
            formatted = raw.slice(0, 2) + "/" + raw.slice(2);
        } else {
            formatted = raw.slice(0, 2) + "/" + raw.slice(2, 4) + "/" + raw.slice(4, 8);
        }

        setFormData(prev => ({ ...prev, dateOfBirth: formatted }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call to TransUnion
        setTimeout(() => {
            setIsSubmitting(false);
            if (onPrequalComplete) {
                onPrequalComplete(PREQUAL_OFFERS);
            }
        }, 1500);
    };

    const isFormValid =
        formData.fullName.trim() !== "" &&
        formData.address.trim() !== "" &&
        formData.city.trim() !== "" &&
        formData.state !== "" &&
        formData.zipCode.trim() !== "" &&
        formData.dateOfBirth.length === 10 &&
        actualSSN.length === 9;

    const inputClassName = cn(
        "w-full border border-gray-200 rounded-lg text-[#262C30] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#143C67]/20 focus:border-[#143C67] transition-all",
        isCompact ? "px-3 py-2 text-sm" : "px-4 py-3 text-[14px]"
    );

    return (
        <div className={cn(
            "bg-white border border-gray-200 overflow-hidden",
            isCompact ? "rounded-lg" : "rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        )}>
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-full flex items-start justify-between text-left hover:bg-gray-50/50 transition-colors",
                    isCompact ? "px-4 py-3" : "px-6 py-5"
                )}
            >
                <div className="flex-1">
                    <h3 className={cn(
                        "font-semibold text-[#262C30] mb-0.5",
                        isCompact ? "text-sm" : "text-[18px] mb-1"
                    )}>
                        Get prequalified in seconds!
                    </h3>
                    <p className={cn(
                        "text-[#677178] leading-relaxed",
                        isCompact ? "text-xs" : "text-[14px]"
                    )}>
                        Enter your information to see loans and rates you are prequalified for—without impacting your credit score.
                    </p>
                </div>
                <div className={cn("ml-3", isCompact ? "mt-0.5" : "ml-4 mt-1")}>
                    {isExpanded ? (
                        <ChevronUp className={cn(isCompact ? "w-4 h-4" : "w-5 h-5", "text-[#677178]")} />
                    ) : (
                        <ChevronDown className={cn(isCompact ? "w-4 h-4" : "w-5 h-5", "text-[#677178]")} />
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded
                        ? isCompact ? "max-h-[1400px] opacity-100" : "max-h-[1200px] opacity-100"
                        : "max-h-0 opacity-0"
                )}
            >
                <div className={cn(
                    "border-t border-gray-100",
                    isCompact ? "px-4 pb-4" : "px-6 pb-6"
                )}>
                    {/* Form */}
                    <form onSubmit={handleSubmit} className={cn("space-y-4", isCompact ? "pt-4 space-y-3" : "pt-5")}>
                        {/* Full Name */}
                        <div>
                            <label className={cn(
                                "block font-medium text-[#374151]",
                                isCompact ? "text-[11px] mb-1" : "text-[13px] mb-1.5"
                            )}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                placeholder="Taylor Lee Joye"
                                className={inputClassName}
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className={cn(
                                "block font-medium text-[#374151]",
                                isCompact ? "text-[11px] mb-1" : "text-[13px] mb-1.5"
                            )}>
                                Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="1234 Main St, Apt 100"
                                className={inputClassName}
                            />
                        </div>

                        {/* City */}
                        <div>
                            <label className={cn(
                                "block font-medium text-[#374151]",
                                isCompact ? "text-[11px] mb-1" : "text-[13px] mb-1.5"
                            )}>
                                City
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                placeholder="Madison"
                                className={inputClassName}
                            />
                        </div>

                        {/* State */}
                        <div>
                            <label className={cn(
                                "block font-medium text-[#374151]",
                                isCompact ? "text-[11px] mb-1" : "text-[13px] mb-1.5"
                            )}>
                                State
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.state}
                                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                    className={cn(inputClassName, "appearance-none pr-10", !formData.state && "text-[#9CA3AF]")}
                                >
                                    <option value="" disabled>Select state</option>
                                    {US_STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                                <ChevronDown className={cn(
                                    "absolute right-3 top-1/2 -translate-y-1/2 text-[#677178] pointer-events-none",
                                    isCompact ? "w-4 h-4" : "w-5 h-5"
                                )} />
                            </div>
                        </div>

                        {/* ZIP Code */}
                        <div>
                            <label className={cn(
                                "block font-medium text-[#374151]",
                                isCompact ? "text-[11px] mb-1" : "text-[13px] mb-1.5"
                            )}>
                                ZIP Code
                            </label>
                            <input
                                type="text"
                                value={formData.zipCode}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                                    setFormData(prev => ({ ...prev, zipCode: val }));
                                }}
                                placeholder="55555"
                                maxLength={5}
                                className={inputClassName}
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className={cn(
                                "block font-medium text-[#374151]",
                                isCompact ? "text-[11px] mb-1" : "text-[13px] mb-1.5"
                            )}>
                                Date of Birth
                            </label>
                            <input
                                type="text"
                                value={formData.dateOfBirth}
                                onChange={handleDOBChange}
                                placeholder="MM/DD/YYYY"
                                maxLength={10}
                                className={inputClassName}
                            />
                        </div>

                        {/* SSN */}
                        <div>
                            <label className={cn(
                                "block font-medium text-[#374151]",
                                isCompact ? "text-[11px] mb-1" : "text-[13px] mb-1.5"
                            )}>
                                SSN
                            </label>
                            <input
                                type="text"
                                value={formData.ssn}
                                onChange={handleSSNChange}
                                placeholder="***-**-1234"
                                className={cn(inputClassName, "font-mono tracking-wider")}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className={cn(
                                "w-full font-bold tracking-wider uppercase transition-all",
                                isCompact ? "py-2.5 rounded-lg text-xs" : "py-3.5 rounded-full text-[13px]",
                                isFormValid && !isSubmitting
                                    ? "bg-[#B8C4E0] text-[#1e293b] hover:bg-[#a3b1d1]"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className={cn("animate-spin", isCompact ? "h-3 w-3" : "h-4 w-4")} viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Checking...
                                </span>
                            ) : (
                                "SUBMIT"
                            )}
                        </button>
                    </form>

                    {/* Disclaimer */}
                    <p className={cn(
                        "text-[#9CA3AF] leading-relaxed",
                        isCompact ? "mt-3 text-[9px]" : "mt-4 text-[10px]"
                    )}>
                        By clicking &ldquo;SUBMIT&rdquo; you are providing &ldquo;written instructions&rdquo; to [CU Name] under the Fair Credit Reporting Act authorizing [CU Name] to obtain information from your personal credit report and from the Credit Bureau solely to conduct a prequalification for credit. This will not impact your credit score.
                    </p>
                </div>
            </div>

            {/* Collapsed state CTA button */}
            {!isExpanded && (
                <div className={isCompact ? "px-4 pb-4" : "px-6 pb-5"}>
                    <button
                        onClick={() => setIsExpanded(true)}
                        className={cn(
                            "w-full bg-[#B8C4E0] text-[#1e293b] font-bold tracking-wider uppercase hover:bg-[#a3b1d1] transition-colors",
                            isCompact ? "py-2.5 rounded-lg text-xs" : "py-3.5 rounded-full text-[13px]"
                        )}
                    >
                        GET PREQUALIFIED
                    </button>
                    <p className={cn(
                        "text-[#9CA3AF] leading-relaxed",
                        isCompact ? "mt-2 text-[9px]" : "mt-3 text-[10px]"
                    )}>
                        By clicking &ldquo;SUBMIT&rdquo; you are providing &ldquo;written instructions&rdquo; to [CU Name] under the Fair Credit Reporting Act authorizing [CU Name] to obtain information from your personal credit report and from the Credit Bureau solely to conduct a prequalification for credit. This will not impact your credit score.
                    </p>
                </div>
            )}
        </div>
    );
}
