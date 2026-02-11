"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Download, Phone, Mail, Calendar } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function ConfirmationPage() {
    const params = useParams();
    const { offers, updateOffer } = useStore();

    const offerId = params.id as string;
    const offer = offers.find(o => o.id === offerId);

    // Generate a fake confirmation number
    const confirmationNumber = `CU-${offerId.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    if (!offer) {
        return (
            <div className="min-h-screen bg-[#E8EBED] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-[#262C30] mb-2">Offer Not Found</h1>
                    <p className="text-[#677178] mb-4">This offer may no longer be available.</p>
                    <Link
                        href="/storefront"
                        className="text-[#143C67] underline hover:no-underline"
                    >
                        Return to Storefront
                    </Link>
                </div>
            </div>
        );
    }

    // Mark offer as redeemed (for prototype purposes)
    const handleMarkRedeemed = () => {
        updateOffer({
            ...offer,
            isRedeemed: true,
            redeemedTitle: `You've redeemed this ${offer.title.toLowerCase()} offer!`
        });
    };

    // Get next steps based on product type
    const getNextSteps = () => {
        switch (offer.productType) {
            case 'auto-loan':
            case 'auto-refi':
                return [
                    { icon: Calendar, text: "A loan specialist will contact you within 1 business day" },
                    { icon: Download, text: "Gather your vehicle title and registration documents" },
                    { icon: Phone, text: "Complete final verification over the phone or in-branch" },
                ];
            case 'heloc':
            case 'home-loan':
                return [
                    { icon: Calendar, text: "A home loan specialist will reach out within 2 business days" },
                    { icon: Download, text: "Prepare recent tax returns and property documents" },
                    { icon: Phone, text: "Schedule a property appraisal (if required)" },
                ];
            case 'credit-card':
            case 'credit-limit-increase':
                return [
                    { icon: Mail, text: "Your new card will arrive within 7-10 business days" },
                    { icon: Phone, text: "Activate your card when it arrives" },
                    { icon: Download, text: "Download our mobile app to manage your account" },
                ];
            case 'gap':
            case 'mrc':
            case 'debt-protection':
                return [
                    { icon: Mail, text: "You'll receive your policy documents via email" },
                    { icon: Download, text: "Coverage begins on your next billing cycle" },
                    { icon: Phone, text: "Contact us anytime to update your coverage" },
                ];
            default:
                return [
                    { icon: Calendar, text: "We'll be in touch within 1-2 business days" },
                    { icon: Mail, text: "Check your email for next steps" },
                    { icon: Phone, text: "Call us if you have any questions" },
                ];
        }
    };

    const nextSteps = getNextSteps();

    return (
        <div className="min-h-screen bg-[#E8EBED] font-sans text-[#262C30]">
            {/* Navigation */}
            <nav className="bg-white px-6 lg:px-8 h-14 flex items-center justify-between border-b border-gray-200">
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
            </nav>

            <main className="max-w-[600px] mx-auto px-6 lg:px-8 py-8">
                {/* Progress indicator - all complete */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[12px] font-medium text-[#22C55E]">Review</span>
                    </div>
                    <div className="w-8 h-px bg-[#22C55E]" />
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[12px] font-medium text-[#22C55E]">Apply</span>
                    </div>
                    <div className="w-8 h-px bg-[#22C55E]" />
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[12px] font-medium text-[#22C55E]">Confirm</span>
                    </div>
                </div>

                {/* Success Card */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-6">
                    <div className="p-6 lg:p-8 text-center">
                        {/* Success Icon */}
                        <div className="w-16 h-16 rounded-full bg-[#DCFCE7] mx-auto mb-4 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-[#22C55E]" />
                        </div>

                        <h1 className="text-2xl font-semibold text-[#262C30] mb-2">
                            Application Submitted!
                        </h1>
                        <p className="text-[14px] text-[#677178] mb-6 max-w-md mx-auto">
                            Thank you for your {offer.title.toLowerCase()} application. We've received your information and will be in touch soon.
                        </p>

                        {/* Confirmation Number */}
                        <div className="bg-[#F9FAFB] rounded-lg p-4 mb-6 inline-block">
                            <div className="text-[11px] text-[#677178] uppercase tracking-wide mb-1">
                                Confirmation Number
                            </div>
                            <div className="text-lg font-mono font-semibold text-[#262C30]">
                                {confirmationNumber}
                            </div>
                        </div>

                        {/* Offer Summary */}
                        <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-lg p-4 mb-6 text-left">
                            <div className="text-[13px] font-semibold text-[#166534] mb-2">
                                {offer.title}
                            </div>
                            {offer.attributes && offer.attributes.length > 0 && (
                                <div className="flex flex-wrap gap-4">
                                    {offer.attributes.map((attr, idx) => (
                                        <div key={idx} className="text-[13px] text-[#166534]">
                                            <span className="text-[#15803D]">{attr.label}:</span>{" "}
                                            <span className="font-semibold">{attr.value}</span>
                                            {attr.subtext && <span className="text-[11px]"> {attr.subtext}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Next Steps */}
                    <div className="border-t border-gray-200 p-6 lg:p-8">
                        <h3 className="text-[13px] font-semibold text-[#262C30] uppercase tracking-wide mb-4">
                            What Happens Next
                        </h3>
                        <div className="space-y-4">
                            {nextSteps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#E8EBED] flex items-center justify-center flex-shrink-0">
                                        <step.icon className="w-4 h-4 text-[#143C67]" />
                                    </div>
                                    <span className="text-[14px] text-[#374151] pt-1">{step.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-200 p-6 lg:p-8">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href="/storefront"
                                onClick={handleMarkRedeemed}
                                className="flex-1 inline-flex items-center justify-center px-8 py-3 bg-[#262C30] text-white text-[13px] font-bold tracking-wider uppercase rounded-full hover:bg-black transition-colors"
                            >
                                Return to Offers
                            </Link>
                            <button
                                className="flex-1 inline-flex items-center justify-center px-8 py-3 bg-white text-[#262C30] text-[13px] font-medium border border-gray-300 rounded-full hover:border-gray-400 transition-colors"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Summary
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 p-6">
                    <h3 className="text-[13px] font-semibold text-[#262C30] mb-3">
                        Questions?
                    </h3>
                    <div className="flex flex-wrap gap-6">
                        <a href="tel:1-800-555-0123" className="flex items-center gap-2 text-[13px] text-[#143C67] hover:underline">
                            <Phone className="w-4 h-4" />
                            1-800-555-0123
                        </a>
                        <a href="mailto:support@creditunion.com" className="flex items-center gap-2 text-[13px] text-[#143C67] hover:underline">
                            <Mail className="w-4 h-4" />
                            support@creditunion.com
                        </a>
                    </div>
                </div>

                {/* Disclosures */}
                <div className="mt-6 text-[11px] text-[#677178] leading-relaxed">
                    <p>
                        This is a prototype for demonstration purposes only. No actual application has been submitted.
                        All confirmation numbers and next steps shown are simulated.
                    </p>
                </div>
            </main>

            {/* Prototype Navigation */}
            <div className="fixed bottom-4 right-4 z-50 flex gap-2">
                <Link
                    href="/storefront"
                    onClick={handleMarkRedeemed}
                    className="px-3 py-1.5 bg-[#22C55E] text-white text-[11px] font-medium rounded-full shadow-lg hover:bg-[#16A34A] transition-colors"
                >
                    Mark as Redeemed & Return
                </Link>
                <Link
                    href="/storefront"
                    className="px-3 py-1.5 bg-[#262C30] text-white text-[11px] font-medium rounded-full shadow-lg hover:bg-black transition-colors"
                >
                    Return (Don't Redeem)
                </Link>
            </div>
        </div>
    );
}
