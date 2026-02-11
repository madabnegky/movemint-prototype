"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Check, Shield, Clock, DollarSign } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";

export default function OfferDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { offers } = useStore();

    const offerId = params.id as string;
    const offer = offers.find(o => o.id === offerId);

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

    // Product-specific benefits
    const getBenefits = () => {
        switch (offer.productType) {
            case 'auto-loan':
            case 'auto-refi':
                return [
                    { icon: DollarSign, text: "Competitive rates tailored to your profile" },
                    { icon: Clock, text: "Quick approval process" },
                    { icon: Shield, text: "No hidden fees or prepayment penalties" },
                ];
            case 'heloc':
            case 'home-loan':
                return [
                    { icon: DollarSign, text: "Flexible credit line for your needs" },
                    { icon: Clock, text: "Draw funds when you need them" },
                    { icon: Shield, text: "Tax-deductible interest (consult your tax advisor)" },
                ];
            case 'credit-card':
            case 'credit-limit-increase':
                return [
                    { icon: DollarSign, text: "Earn rewards on every purchase" },
                    { icon: Clock, text: "No annual fee" },
                    { icon: Shield, text: "Fraud protection included" },
                ];
            case 'gap':
            case 'mrc':
            case 'debt-protection':
                return [
                    { icon: Shield, text: "Protect yourself from unexpected costs" },
                    { icon: Clock, text: "Easy claims process" },
                    { icon: DollarSign, text: "Affordable monthly premiums" },
                ];
            default:
                return [
                    { icon: Check, text: "Personalized offer just for you" },
                    { icon: Clock, text: "Quick and easy application" },
                    { icon: Shield, text: "Trusted by thousands of members" },
                ];
        }
    };

    const benefits = getBenefits();

    // Get badge based on variant
    const getBadge = () => {
        if (offer.isRedeemed) {
            return (
                <span className="inline-block bg-[#9BA7AE] text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wide">
                    Redeemed
                </span>
            );
        }

        switch (offer.variant) {
            case 'preapproved':
            case 'auto-refi':
            case 'credit-limit':
                return (
                    <span className="inline-block bg-[#7CEB87] text-[#1a472a] text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wide">
                        You're Preapproved!
                    </span>
                );
            case 'ita':
                return (
                    <span className="inline-block bg-[#C4B5FD] text-[#4c1d95] text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wide">
                        Apply Now
                    </span>
                );
            case 'wildcard':
            case 'protection':
                return (
                    <span className="inline-block bg-[#374151] text-white text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wide">
                        Special Offer
                    </span>
                );
            default:
                return null;
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

            <main className="max-w-[900px] mx-auto px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-6">
                    {/* Image */}
                    <div className="relative w-full aspect-[2.5/1]">
                        <img
                            src={offer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80"}
                            alt={offer.title}
                            className="w-full h-full object-cover object-center"
                        />
                    </div>

                    {/* Content */}
                    <div className="p-6 lg:p-8">
                        {/* Badge */}
                        <div className="mb-3">
                            {getBadge()}
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl lg:text-3xl font-semibold text-[#262C30] mb-3">
                            {offer.title}
                        </h1>

                        {/* Description */}
                        <p className="text-[#677178] text-[15px] leading-relaxed mb-6 max-w-2xl">
                            {offer.featuredDescription || offer.description || "Take advantage of this exclusive offer tailored just for you. Apply today and enjoy competitive rates with personalized terms."}
                        </p>

                        {/* Attributes */}
                        {offer.attributes && offer.attributes.length > 0 && (
                            <div className="flex flex-wrap gap-8 mb-6 pb-6 border-b border-gray-200">
                                {offer.attributes.map((attr, idx) => (
                                    <div key={idx}>
                                        <div className="text-[11px] text-[#677178] uppercase tracking-wide mb-1">
                                            {attr.label}
                                        </div>
                                        <div className="text-3xl font-bold text-[#262C30]">
                                            {attr.value}
                                            {attr.subtext && (
                                                <span className="text-[13px] font-normal text-[#677178] ml-1">
                                                    {attr.subtext}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Benefits */}
                        <div className="mb-6">
                            <h3 className="text-[13px] font-semibold text-[#262C30] uppercase tracking-wide mb-3">
                                What You Get
                            </h3>
                            <div className="space-y-3">
                                {benefits.map((benefit, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[#E8EBED] flex items-center justify-center">
                                            <benefit.icon className="w-4 h-4 text-[#143C67]" />
                                        </div>
                                        <span className="text-[14px] text-[#374151]">{benefit.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA */}
                        {!offer.isRedeemed && (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href={`/storefront/offer/${offer.id}/apply`}
                                    className="inline-flex items-center justify-center px-8 py-3 bg-[#262C30] text-white text-[13px] font-bold tracking-wider uppercase rounded-full hover:bg-black transition-colors"
                                >
                                    Continue
                                </Link>
                                <Link
                                    href="/storefront"
                                    className="inline-flex items-center justify-center px-8 py-3 bg-white text-[#262C30] text-[13px] font-medium border border-gray-300 rounded-full hover:border-gray-400 transition-colors"
                                >
                                    Back to Offers
                                </Link>
                            </div>
                        )}

                        {offer.isRedeemed && (
                            <div className="bg-[#F3F4F6] rounded-lg p-4">
                                <p className="text-[14px] text-[#677178]">
                                    {offer.redeemedTitle || "You've already redeemed this offer."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Disclosures */}
                <div className="text-[11px] text-[#677178] leading-relaxed">
                    <p>
                        *APR = Annual Percentage Rate. Rates are subject to change and are based on individual creditworthiness.
                        †All loans subject to approval. Terms and conditions apply. See a representative for details.
                        This is a prototype for demonstration purposes only.
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
