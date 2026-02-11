"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrequalificationCardProps {
    variant?: "default" | "compact";
}

export function PrequalificationCard({ variant = "default" }: PrequalificationCardProps) {
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

    // For SSN masking - store the actual value separately
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

        // Simulate API call to TransUnion
        setTimeout(() => {
            // Navigate to prequalification result page
            router.push("/storefront/prequalification/result");
        }, 1500);
    };

    const isFormValid =
        formData.fullName.trim() !== "" &&
        formData.address.trim() !== "" &&
        formData.dateOfBirth !== "" &&
        actualSSN.length === 9;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex-1">
                    <h3 className="text-[18px] font-semibold text-[#262C30] mb-1">
                        Get prequalified in seconds!
                    </h3>
                    <p className="text-[14px] text-[#677178] leading-relaxed">
                        Enter your information to see loans and rates you are prequalified for—without impacting your credit score.
                    </p>
                </div>
                <div className="ml-4 mt-1">
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#677178]" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-[#677178]" />
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="px-6 pb-6 border-t border-gray-100">
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="pt-5 space-y-4">
                        {/* User Avatar Indicator */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-[#E8EBED] rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-[#677178]" />
                            </div>
                            <span className="text-[13px] text-[#677178]">Your Information</span>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-[12px] font-medium text-[#677178] mb-1.5">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-[#262C30] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#143C67]/20 focus:border-[#143C67] transition-all"
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-[12px] font-medium text-[#677178] mb-1.5">
                                Address
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Enter your address"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-[#262C30] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#143C67]/20 focus:border-[#143C67] transition-all"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-[12px] font-medium text-[#677178] mb-1.5">
                                Date of Birth
                            </label>
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-[#262C30] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#143C67]/20 focus:border-[#143C67] transition-all"
                            />
                        </div>

                        {/* SSN */}
                        <div>
                            <label className="block text-[12px] font-medium text-[#677178] mb-1.5">
                                Social Security Number
                            </label>
                            <input
                                type="text"
                                value={formData.ssn}
                                onChange={handleSSNChange}
                                placeholder="Enter SSN"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-[14px] text-[#262C30] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#143C67]/20 focus:border-[#143C67] transition-all font-mono tracking-wider"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className={cn(
                                "w-full py-3.5 rounded-full text-[12px] font-bold tracking-wider uppercase transition-all",
                                isFormValid && !isSubmitting
                                    ? "bg-[#262C30] text-white hover:bg-black"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            )}
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
                                "Submit"
                            )}
                        </button>
                    </form>

                    {/* Disclaimer */}
                    <div className="mt-4 text-[10px] text-[#9CA3AF] leading-relaxed space-y-2">
                        <p>By clicking "Submit", I acknowledge and agree to the following:</p>
                        <p><strong>1. Fair Credit Reporting Act (FCRA) Authorization</strong> — I understand that I am providing "written instructions" to Credit Union under the Fair Credit Reporting Act. This authorizes Credit Union to obtain information from my personal credit profile or other information from one or more consumer reporting agencies (such as Equifax, Experian, or TransUnion).</p>
                        <p><strong>2. No Impact on Credit Score</strong> — I understand that this is a prequalification request. This process uses a "soft inquiry" to evaluate my eligibility for credit offers. This soft inquiry will be visible to me on my credit report but will not affect my credit score and will not be visible to other lenders.</p>
                        <p><strong>3. Use of Information</strong> — I authorize Credit Union to use this information to determine my eligibility for various loan products and to present me with personalized offers. I understand that prequalification does not guarantee a final approval for credit.</p>
                        <p><strong>4. Accuracy of Information</strong> — I certify that all information I provide in this request is true, accurate, and complete. I understand that if I choose to proceed with a full loan application, a "hard inquiry" may be required at that time, which may impact my credit score.</p>
                        <p><strong>5. E-Sign Consent</strong> — I agree to receive disclosures and communications regarding this prequalification request electronically.</p>
                    </div>
                </div>
            </div>

            {/* Collapsed state CTA button */}
            {!isExpanded && (
                <div className="px-6 pb-5">
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-full py-3.5 bg-[#262C30] text-white rounded-full text-[12px] font-bold tracking-wider uppercase hover:bg-black transition-colors"
                    >
                        Get Prequalified
                    </button>
                    <p className="mt-3 text-[10px] text-[#9CA3AF] leading-relaxed">
                        By clicking "Get Prequalified" you are providing "written instructions" to Credit Union under the Fair Credit Reporting Act authorizing Credit Union to obtain information from your personal credit report. This will not impact your credit score.
                    </p>
                </div>
            )}
        </div>
    );
}
