"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useStorefront } from "@/hooks/useStorefront";

export function HeroCarousel() {
    const { featuredOffers, showFeaturedCarousel } = useStorefront();
    const [currentSlide, setCurrentSlide] = useState(0);

    // Don't render if carousel shouldn't be shown or no featured offers
    if (!showFeaturedCarousel || featuredOffers.length === 0) {
        return null;
    }

    const currentOffer = featuredOffers[currentSlide];
    if (!currentOffer) {
        return null;
    }

    const goToPrevious = () => {
        setCurrentSlide(prev => (prev === 0 ? featuredOffers.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentSlide(prev => (prev === featuredOffers.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="mb-8">
            {/* Main Carousel Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200">
                {/*
                    Layout:
                    - Desktop (>=804px): Side by side, 40% content / 60% image
                    - Mobile (<804px): Stacked, image on top
                */}
                <div className="flex flex-col min-[804px]:flex-row min-h-[280px]">

                    {/* Content Section - 40% on desktop */}
                    <div className="min-[804px]:w-[40%] p-6 min-[804px]:p-8 flex flex-col justify-center order-2 min-[804px]:order-1">

                        {/* Headline */}
                        <h2 className="text-xl min-[804px]:text-2xl font-semibold text-[#262C30] mb-2 leading-tight">
                            {currentOffer.featuredHeadline || currentOffer.title}
                        </h2>

                        {/* Description */}
                        <p className="text-[#677178] text-[14px] leading-relaxed mb-5 max-w-md">
                            {currentOffer.featuredDescription || currentOffer.description || "Check out this exclusive offer tailored just for you."}
                        </p>

                        {/* Attributes - Up to / As low as */}
                        {currentOffer.attributes && currentOffer.attributes.length > 0 && (
                            <div className="flex gap-8 mb-5">
                                {currentOffer.attributes.map((attr, idx) => (
                                    <div key={idx}>
                                        <div className="text-[10px] text-[#677178] mb-0.5">
                                            {attr.label}
                                        </div>
                                        <div className="text-2xl min-[804px]:text-[28px] font-bold text-[#262C30] leading-none">
                                            {attr.value}
                                            {attr.subtext && (
                                                <span className="text-[11px] font-normal text-[#677178] ml-1">
                                                    {attr.subtext}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CTA Button */}
                        <div className="flex flex-col gap-3 items-center min-[804px]:items-stretch max-w-[280px]">
                            <Link
                                href={currentOffer.ctaLink || `/storefront/offer/${currentOffer.id}`}
                                className="inline-flex items-center justify-center w-full px-8 py-3.5 bg-[#262C30] text-white text-[12px] font-bold tracking-wider uppercase rounded-full hover:bg-black transition-colors"
                            >
                                REVIEW OFFER
                            </Link>

                            {/* Details & disclosures link */}
                            <Link
                                href="#disclosures"
                                className="text-[12px] text-[#677178] hover:text-[#262C30] underline underline-offset-2 text-center"
                            >
                                Details & disclosures
                            </Link>
                        </div>
                    </div>

                    {/* Image Section - 60% on desktop */}
                    <div className="min-[804px]:w-[60%] order-1 min-[804px]:order-2 relative">
                        <div className="w-full h-full min-h-[200px] min-[804px]:min-h-full">
                            <img
                                src={currentOffer.imageUrl || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"}
                                alt={currentOffer.title}
                                className="w-full h-full object-cover object-center"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Carousel Navigation - arrows + dots */}
            <div className="flex items-center justify-center gap-4 mt-4">
                {/* Left Arrow */}
                <button
                    onClick={goToPrevious}
                    className="w-8 h-8 flex items-center justify-center text-[#677178] hover:text-[#262C30] transition-colors"
                    aria-label="Previous offer"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Dots */}
                <div className="flex items-center gap-2">
                    {featuredOffers.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={cn(
                                "w-2 h-2 rounded-full transition-all duration-200",
                                currentSlide === idx
                                    ? "bg-[#262C30]"
                                    : "bg-[#262C30]/25 hover:bg-[#262C30]/40"
                            )}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>

                {/* Right Arrow */}
                <button
                    onClick={goToNext}
                    className="w-8 h-8 flex items-center justify-center text-[#677178] hover:text-[#262C30] transition-colors"
                    aria-label="Next offer"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
