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

    const inputClassName = "w-full bg-[#f3f5f5] border border-greyscale-07 rounded-card-image px-3 py-2.5 text-contrast-black text-sm leading-5 placeholder:text-greyscale-06 focus:outline-none focus:ring-2 focus:ring-[#269B78]/20 focus:border-[#269B78] transition-all";
    const labelClassName = "block text-greyscale-08 text-sm leading-5 mb-2";

    // Placeholder hero imagery — swap when design team provides final asset.
    const HERO_IMAGE = "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80";

    const headerBlock = (
        <div className="flex flex-col gap-2 items-start w-full">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex gap-2 items-center w-full text-left"
            >
                <p
                    className="flex-1 min-w-0 text-contrast-black text-[20px] leading-6.5 tracking-[-1px]"
                    style={{ fontFeatureSettings: "'ss03'" }}
                >
                    Get prequalified in seconds!
                </p>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-contrast-black shrink-0" strokeWidth={2} />
                ) : (
                    <ChevronDown className="w-5 h-5 text-contrast-black shrink-0" strokeWidth={2} />
                )}
            </button>
            <p className="text-greyscale-08 text-sm leading-5 w-full">
                Enter your information to see loans and rates you are prequalified for&mdash;without impacting your credit score.
            </p>
        </div>
    );

    const ctaButton = (
        <button
            onClick={() => setIsExpanded(true)}
            className="bg-[#7eb3fd] flex items-center justify-center px-8 py-2 rounded-button w-full text-ultra-black text-sm leading-5 tracking-[0.25px] text-center whitespace-nowrap"
            style={{ fontFeatureSettings: "'ss03'" }}
        >
            GET PREQUALIFIED
        </button>
    );

    const disclaimer = (
        <p className="text-greyscale-08 text-xs leading-4 w-full whitespace-pre-wrap">
            {`By clicking “SUBMIT” you are providing “written instructions” to [CU Name] under the Fair Credit Reporting Act authorizing [CU Name] to obtain information from your personal credit report and from the Credit Bureau solely to conduct a prequalification for credit. `}
            <br aria-hidden="true" />
            This will not impact your credit score.
        </p>
    );

    const field = (label: string, input: React.ReactNode) => (
        <div>
            <label className={labelClassName}>{label}</label>
            {input}
        </div>
    );

    const form = (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-1 min-[804px]:grid-cols-2 gap-4">
                {field("Full Name", (
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Taylor Lee Joye"
                        className={inputClassName}
                    />
                ))}
                {field("Address", (
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="1234 Main St, Apt 100"
                        className={inputClassName}
                    />
                ))}
                {field("City", (
                    <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Madison"
                        className={inputClassName}
                    />
                ))}
                {field("State", (
                    <div className="relative flex items-stretch bg-[#f3f5f5] border border-greyscale-07 rounded-card-image">
                        <select
                            value={formData.state}
                            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                            className={cn(
                                "flex-1 min-w-0 bg-transparent appearance-none pl-3 py-2.5 pr-2 text-sm leading-5 focus:outline-none",
                                formData.state ? "text-contrast-black" : "text-greyscale-06"
                            )}
                        >
                            <option value="" disabled>Select state</option>
                            {US_STATES.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                        <div className="flex items-center justify-center px-3 py-2 border-l border-greyscale-07 pointer-events-none">
                            <ChevronDown className="w-6 h-6 text-contrast-black" strokeWidth={2} />
                        </div>
                    </div>
                ))}
                {field("ZIP Code", (
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
                ))}
                {field("Date of Birth", (
                    <input
                        type="text"
                        value={formData.dateOfBirth}
                        onChange={handleDOBChange}
                        placeholder="MM/DD/YYYY"
                        maxLength={10}
                        className={inputClassName}
                    />
                ))}
                {field("SSN", (
                    <input
                        type="text"
                        value={formData.ssn}
                        onChange={handleSSNChange}
                        placeholder="***-**-1234"
                        className={cn(inputClassName, "font-mono tracking-wider")}
                    />
                ))}
            </div>

            <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={cn(
                    "w-full flex items-center justify-center px-8 py-2 rounded-button text-sm leading-5 tracking-[0.25px] text-center whitespace-nowrap transition-colors",
                    isFormValid && !isSubmitting
                        ? "bg-[#7eb3fd] text-ultra-black"
                        : "bg-greyscale-03 text-greyscale-06 cursor-not-allowed"
                )}
                style={{ fontFeatureSettings: "'ss03'" }}
            >
                {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
    );

    if (isExpanded) {
        return (
            <div className="bg-contrast-white flex flex-col gap-4 items-start p-4 min-[804px]:p-8 rounded-card shadow-card w-full">
                {headerBlock}
                {form}
                {disclaimer}
            </div>
        );
    }

    return (
        <div className="bg-contrast-white rounded-card shadow-card overflow-hidden w-full">
            <div className="flex flex-col min-[804px]:flex-row">
                <div className="flex flex-col gap-4 p-4 min-[804px]:p-8 min-[804px]:w-[40%] order-2 min-[804px]:order-1">
                    {headerBlock}
                    {ctaButton}
                    {disclaimer}
                </div>
                <div className="order-1 min-[804px]:order-2 min-[804px]:w-[60%] min-h-50 min-[804px]:min-h-78.5 relative">
                    <img
                        src={HERO_IMAGE}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>
            </div>
        </div>
    );
}
