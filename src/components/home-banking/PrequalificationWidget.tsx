"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, User } from "lucide-react";
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
            const masked = "•".repeat(newActualSSN.length - 4) + newActualSSN.slice(-4);
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

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                        Get prequalified in seconds!
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        See loans and rates you're prequalified for—without impacting your credit.
                    </p>
                </div>
                <div className="ml-3 mt-0.5">
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out",
                    isExpanded ? "flex-1 overflow-y-auto opacity-100" : "max-h-0 overflow-hidden opacity-0"
                )}
            >
                <div className="px-4 pb-4 border-t border-gray-100">
                    <form onSubmit={handleSubmit} className="pt-4 space-y-3">
                        {/* User indicator */}
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-gray-500" />
                            </div>
                            <span className="text-[11px] text-gray-500">Your Information</span>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                placeholder="Enter your full name"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Enter your address"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        {/* SSN */}
                        <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                Social Security Number
                            </label>
                            <input
                                type="text"
                                value={formData.ssn}
                                onChange={handleSSNChange}
                                placeholder="Enter SSN"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono tracking-wider"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className={cn(
                                "w-full py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all",
                                isFormValid && !isSubmitting
                                    ? "bg-gray-900 text-white hover:bg-black"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                                "Submit"
                            )}
                        </button>
                    </form>

                    {/* Disclaimer */}
                    <div className="mt-3 text-[9px] text-gray-400 leading-relaxed space-y-1.5">
                        <p>By clicking "Submit", I acknowledge and agree to the following:</p>
                        <p><strong>1. FCRA Authorization</strong> — I authorize Credit Union to obtain information from my credit profile from consumer reporting agencies.</p>
                        <p><strong>2. No Impact on Credit Score</strong> — This soft inquiry will not affect my credit score.</p>
                        <p><strong>3. Use of Information</strong> — Credit Union may use this to determine my eligibility for loan products.</p>
                        <p><strong>4. Accuracy</strong> — I certify that my information is true and accurate.</p>
                        <p><strong>5. E-Sign Consent</strong> — I agree to receive communications electronically.</p>
                    </div>
                </div>
            </div>

            {/* Collapsed state CTA */}
            {!isExpanded && (
                <div className="px-4 pb-4">
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-xs font-bold tracking-wider uppercase hover:bg-black transition-colors"
                    >
                        Get Prequalified
                    </button>
                    <p className="mt-2 text-[9px] text-gray-400 leading-relaxed">
                        This will not impact your credit score.
                    </p>
                </div>
            )}
        </div>
    );
}
