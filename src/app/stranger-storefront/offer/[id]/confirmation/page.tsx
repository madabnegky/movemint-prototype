"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle, Users, ArrowRight, Phone, Mail, Download, Calendar, FileText } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export default function StrangerConfirmationPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { offers, strangerMembershipSubmitted } = useStore();

    const offerId = params.id as string;
    const offer = offers.find(o => o.id === offerId);

    // Read prefill data from query params
    const firstName = searchParams.get('firstName') || '';
    const lastName = searchParams.get('lastName') || '';
    const phone = searchParams.get('phone') || '';
    const email = searchParams.get('email') || '';
    const offerTitle = searchParams.get('offerTitle') || offer?.title || '';

    // Build the membership application URL with prefill data
    const membershipParams = new URLSearchParams();
    if (firstName) membershipParams.set('firstName', firstName);
    if (lastName) membershipParams.set('lastName', lastName);
    if (phone) membershipParams.set('phone', phone);
    if (email) membershipParams.set('email', email);
    membershipParams.set('fromOffer', offerId);
    membershipParams.set('offerTitle', offerTitle);
    const membershipUrl = `/stranger-storefront/apply/membership?${membershipParams.toString()}`;

    const confirmationNumber = `CU-${offerId.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    if (!offer) {
        return (
            <div className="min-h-screen bg-[#E8EBED] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-[#262C30] mb-2">Offer Not Found</h1>
                    <p className="text-[#677178] mb-4">This offer may no longer be available.</p>
                    <Link href="/stranger-storefront" className="text-[#143C67] underline hover:no-underline">
                        Return to Storefront
                    </Link>
                </div>
            </div>
        );
    }

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
                <Link href="/stranger-storefront" className="flex items-center gap-2">
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
                {/* Progress - all complete */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {["Review", "Apply", "Confirm"].map((label, idx) => (
                        <div key={label} className="flex items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#22C55E] text-white flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <span className="text-[12px] font-medium text-[#22C55E]">{label}</span>
                            </div>
                            {idx < 2 && <div className="w-8 h-px bg-[#22C55E]" />}
                        </div>
                    ))}
                </div>

                {/* Success Card */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-6">
                    <div className="p-6 lg:p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#DCFCE7] mx-auto mb-4 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-[#22C55E]" />
                        </div>

                        <h1 className="text-2xl font-semibold text-[#262C30] mb-2">
                            Application Submitted!
                        </h1>
                        <p className="text-[14px] text-[#677178] mb-6 max-w-md mx-auto">
                            Thank you for your {offer.title.toLowerCase()} application{firstName ? `, ${firstName}` : ''}. We&apos;ve received your information and will be in touch soon.
                        </p>

                        <div className="bg-[#F9FAFB] rounded-lg p-4 mb-6 inline-block">
                            <div className="text-[11px] text-[#677178] uppercase tracking-wide mb-1">
                                Confirmation Number
                            </div>
                            <div className="text-lg font-mono font-semibold text-[#262C30]">
                                {confirmationNumber}
                            </div>
                        </div>

                        {/* Offer Summary */}
                        <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-lg p-4 mb-2 text-left">
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
                </div>

                {/* ═══ MEMBERSHIP PROMPT (only if not already submitted) ═══ */}
                {!strangerMembershipSubmitted ? (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-[#143C67] mb-6">
                        <div className="bg-[#143C67] px-6 py-3 flex items-center gap-2">
                            <Users className="w-5 h-5 text-white" />
                            <span className="text-[14px] font-semibold text-white">One More Step</span>
                        </div>
                        <div className="p-6 lg:p-8">
                            <h2 className="text-xl font-semibold text-[#262C30] mb-2">
                                Become a Member to Complete Your Application
                            </h2>
                            <p className="text-[14px] text-[#677178] mb-4 leading-relaxed">
                                To finalize your <span className="font-medium text-[#262C30]">{offer.title}</span> application,
                                you&apos;ll need to become a member of our credit union. Membership unlocks exclusive
                                rates, lower fees, and personalized financial guidance.
                            </p>

                            <div className="bg-[#F0F7FF] border border-[#BFDBFE] rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-[#143C67] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[13px] font-medium text-[#1e3a5f] mb-1">
                                            We&apos;ll pre-fill your information
                                        </p>
                                        <p className="text-[12px] text-[#3b6a9a]">
                                            The details you already provided (name, email, phone) will be
                                            automatically filled in — no need to re-enter anything.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    "Only takes a few minutes",
                                    "$5.00 minimum deposit to open your membership",
                                    "Add checking, savings clubs, and more",
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-[#22C55E] shrink-0" />
                                        <span className="text-[13px] text-[#374151]">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href={membershipUrl}
                                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#143C67] text-white text-[13px] font-bold tracking-wider uppercase rounded-full hover:bg-[#0f2d4d] transition-colors"
                            >
                                Open Your Membership
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            <p className="text-center mt-3">
                                <Link
                                    href="/stranger-storefront"
                                    className="text-[13px] text-[#677178] underline hover:text-[#262C30] transition-colors"
                                >
                                    I&apos;ll do this later
                                </Link>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#86EFAC] mb-6">
                        <div className="p-6 lg:p-8 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
                                <CheckCircle className="w-5 h-5 text-[#22C55E]" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-semibold text-[#262C30] mb-1">
                                    Membership Application Already Submitted
                                </h3>
                                <p className="text-[13px] text-[#677178] leading-relaxed">
                                    You&apos;ve already submitted your membership application. We&apos;ll process your{" "}
                                    <span className="font-medium text-[#262C30]">{offer.title}</span> application
                                    alongside your membership once approved.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contact Info */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 p-6">
                    <h3 className="text-[13px] font-semibold text-[#262C30] mb-3">Questions?</h3>
                    <div className="flex flex-wrap gap-6">
                        <span className="flex items-center gap-2 text-[13px] text-[#143C67]">
                            <Phone className="w-4 h-4" />
                            1-800-555-0123
                        </span>
                        <span className="flex items-center gap-2 text-[13px] text-[#143C67]">
                            <Mail className="w-4 h-4" />
                            support@creditunion.com
                        </span>
                    </div>
                </div>

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
                    href="/stranger-storefront"
                    className="px-3 py-1.5 bg-[#262C30] text-white text-[11px] font-medium rounded-full shadow-lg hover:bg-black transition-colors"
                >
                    Back to Storefront
                </Link>
            </div>
        </div>
    );
}
