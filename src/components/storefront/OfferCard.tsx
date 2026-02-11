"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { OfferVariant, OfferAttribute } from "@/context/StoreContext";

interface OfferCardProps {
    id: string;
    variant: OfferVariant;
    title: string;
    description?: string;
    attributes?: OfferAttribute[];
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    isRedeemed?: boolean;
    className?: string;
}

export function OfferCard({
    id,
    variant,
    title,
    description,
    attributes = [],
    imageUrl,
    ctaText = "Learn More",
    ctaLink,
    isRedeemed = false,
    className,
}: OfferCardProps) {

    // Determine the badge based on variant
    const getBadge = () => {
        if (isRedeemed) {
            return (
                <span className="inline-block bg-[#9CA3AF] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Redeemed
                </span>
            );
        }

        switch (variant) {
            case 'preapproved':
            case 'auto-refi':
            case 'credit-limit':
                return (
                    <span className="inline-block bg-[#4D9B56] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        You're Preapproved!
                    </span>
                );
            case 'ita':
                return (
                    <span className="inline-block bg-[#7C3AED] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Apply Now
                    </span>
                );
            case 'wildcard':
            case 'protection':
                return (
                    <span className="inline-block bg-[#374151] text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Special Offer
                    </span>
                );
            default:
                return null;
        }
    };

    const href = ctaLink || `/storefront/offer/${id}`;

    const cardContent = (
        <>
            {/* Top section: Badge + Title + Attributes */}
            <div className="p-4 pb-2">
                {/* Badge */}
                <div className="mb-2">
                    {getBadge()}
                </div>

                {/* Title */}
                <h3 className="text-[15px] font-normal text-[#1F2937] leading-snug mb-3">
                    {title}
                </h3>

                {/* Description for wildcard/protection variants */}
                {(variant === 'wildcard' || variant === 'protection') && description && (
                    <p className="text-[11px] text-[#6B7280] leading-relaxed mb-2 line-clamp-2">
                        {description}
                    </p>
                )}

                {/* Attributes */}
                {attributes.length > 0 && (
                    <div className="flex gap-6">
                        {attributes.slice(0, 2).map((attr, idx) => (
                            <div key={idx}>
                                <div className="text-[10px] text-[#9CA3AF] mb-0.5">
                                    {attr.label}
                                </div>
                                <div className="text-[20px] font-bold text-[#111827] leading-tight tracking-tight">
                                    {attr.value}
                                    {attr.subtext && (
                                        <span className="text-[11px] font-normal text-[#9CA3AF] ml-0.5">
                                            {attr.subtext}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Image - with rounded corners */}
            <div className="px-3 pb-1">
                <div className="relative w-full aspect-[2/1] overflow-hidden rounded-lg">
                    <img
                        src={imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}
                        alt={title}
                        className={cn(
                            "absolute inset-0 w-full h-full object-cover object-center",
                            !isRedeemed && "group-hover:scale-105 transition-transform duration-300"
                        )}
                    />
                </div>
            </div>

            {/* CTA Footer */}
            <div className="px-4 py-3 text-center">
                <span className={cn(
                    "text-[13px] font-medium underline underline-offset-2 decoration-1",
                    isRedeemed ? "text-[#9CA3AF]" : "text-[#1F2937]"
                )}>
                    {ctaText}
                </span>
            </div>
        </>
    );

    // Redeemed cards are not clickable
    if (isRedeemed) {
        return (
            <div
                className={cn(
                    "bg-white rounded-2xl overflow-hidden",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                    "border border-[#E5E7EB]",
                    "opacity-60 grayscale",
                    className
                )}
            >
                {cardContent}
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={cn(
                "bg-white rounded-2xl overflow-hidden block",
                "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                "border border-[#E5E7EB]",
                "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
                "group",
                className
            )}
        >
            {cardContent}
        </Link>
    );
}
