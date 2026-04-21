"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrequalificationWidget() {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        address: "",
        dateOfBirth: "",
        ssn: "",
    });

    // For SSN masking
    const [actualSSN, setActualSSN] = useState("");

    const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Extract only the new digit typed (last character if it's a digit)
        const lastChar = inputValue.slice(-1);
        const isDeleting = inputValue.length < formData.ssn.length;

        let newActualSSN = actualSSN;

        if (isDeleting) {
            // User is deleting - remove last digit from actual SSN
            newActualSSN = actualSSN.slice(0, -1);
        } else if (/\d/.test(lastChar) && actualSSN.length < 9) {
            // User typed a digit and we're under 9 digits
            newActualSSN = actualSSN + lastChar;
        }

        setActualSSN(newActualSSN);

        // Display masked version: show only last 4 digits
        if (newActualSSN.length <= 4) {
            setFormData(prev => ({ ...prev, ssn: newActualSSN }));
        } else {
            const masked = "\u2022".repeat(newActualSSN.length - 4) + newActualSSN.slice(-4);
            setFormData(prev => ({ ...prev, ssn: masked }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        setTimeout(() => {
            router.push("/storefront/prequalification/result");
        }, 1500);
    };

    const isFormValid =
        formData.fullName.trim() !== "" &&
        formData.address.trim() !== "" &&
        formData.dateOfBirth !== "" &&
        actualSSN.length === 9;

    const inputClassName = "w-full px-3 py-2 border border-greyscale-03 rounded-card-image text-sm text-contrast-black placeholder:text-greyscale-06 focus:outline-none focus:ring-2 focus:ring-system-green/20 focus:border-system-green transition-all bg-white";

    return (
        <div className="bg-contrast-white rounded-xl shadow-card overflow-hidden flex flex-col h-full">
            {/* Green accent header */}
            <div className="bg-system-green px-4 py-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5 flex-1">
                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-white mb-0.5">
                                Get prequalified in seconds!
                            </h3>
                            <p className="text-[11px] text-white/80 leading-relaxed">
                                See loans and rates you&apos;re prequalified for&mdash;without impacting your credit.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="ml-2 mt-0.5 text-white/70 hover:text-white transition-colors"
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Collapsed state CTA */}
            {!isExpanded && (
                <div className="px-4 py-3">
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-full py-2.5 bg-system-green text-white rounded-card-image text-[12px] leading-5 font-medium tracking-[0.5px] uppercase hover:bg-[#1e8466] transition-colors"
                    >
                        GET PREQUALIFIED
                    </button>
                    <p className="mt-2 text-[9px] text-greyscale-06 leading-relaxed text-center">
                        This soft inquiry will not impact your credit score.
                    </p>
                </div>
            )}

            {/* Expandable Content */}
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out",
                    isExpanded ? "flex-1 overflow-y-auto opacity-100" : "max-h-0 overflow-hidden opacity-0"
                )}
            >
                <div className="px-4 pb-4 border-t border-greyscale-03">
                    <form onSubmit={handleSubmit} className="pt-4 space-y-3">
                        {/* Full Name */}
                        <div>
                            <label className="block text-[11px] font-medium text-greyscale-08 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                placeholder="Enter your full name"
                                className={inputClassName}
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-[11px] font-medium text-greyscale-08 mb-1">
                                Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Enter your address"
                                className={inputClassName}
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-[11px] font-medium text-greyscale-08 mb-1">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                className={inputClassName}
                            />
                        </div>

                        {/* SSN */}
                        <div>
                            <label className="block text-[11px] font-medium text-greyscale-08 mb-1">
                                Social Security Number
                            </label>
                            <input
                                type="text"
                                value={formData.ssn}
                                onChange={handleSSNChange}
                                placeholder="Enter SSN"
                                className={cn(inputClassName, "font-mono tracking-wider")}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className={cn(
                                "w-full py-2.5 rounded-card-image text-[12px] leading-5 font-medium tracking-[0.5px] uppercase transition-all",
                                isFormValid && !isSubmitting
                                    ? "bg-system-green text-white hover:bg-[#1e8466]"
                                    : "bg-greyscale-03 text-greyscale-06 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
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
                    <div className="mt-3 text-[9px] text-greyscale-06 leading-relaxed space-y-1.5">
                        <p>By clicking &ldquo;Submit&rdquo;, I acknowledge and agree to the following:</p>
                        <p><strong>1. FCRA Authorization</strong> &mdash; I authorize Credit Union to obtain information from my credit profile from consumer reporting agencies.</p>
                        <p><strong>2. No Impact on Credit Score</strong> &mdash; This soft inquiry will not affect my credit score.</p>
                        <p><strong>3. Use of Information</strong> &mdash; Credit Union may use this to determine my eligibility for loan products.</p>
                        <p><strong>4. Accuracy</strong> &mdash; I certify that my information is true and accurate.</p>
                        <p><strong>5. E-Sign Consent</strong> &mdash; I agree to receive communications electronically.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
