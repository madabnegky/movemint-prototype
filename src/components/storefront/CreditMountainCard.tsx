"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CreditMountainCardProps {
    className?: string;
    variant?: "card" | "hero" | "widget";
    showSectionHeader?: boolean;
}

// Default section name for Credit Mountain
export const CREDIT_MOUNTAIN_SECTION = "Credit Monitoring & Coaching";

// Credit Mountain URL - points to our mock experience
const CREDIT_MOUNTAIN_URL = "/credit-mountain";

export function CreditMountainCard({ className, variant = "card", showSectionHeader = false }: CreditMountainCardProps) {
    const [hasVisited, setHasVisited] = useState(false);

    // Check localStorage on mount to see if user has visited
    useEffect(() => {
        const visited = localStorage.getItem("creditMountain_visited");
        if (visited === "true") {
            setHasVisited(true);
        }
    }, []);

    const handleClick = () => {
        // Mark as visited in localStorage
        localStorage.setItem("creditMountain_visited", "true");
        setHasVisited(true);
        // Open Credit Mountain in new window
        window.open(CREDIT_MOUNTAIN_URL, "_blank", "noopener,noreferrer");
    };

    const headline = hasVisited ? "Visit Your AI Credit Coach" : "Meet Your AI Credit Coach";
    const description = "Get personalized guidance to improve your credit score and unlock better financial opportunities.";

    // Card variant - standard offer card size
    if (variant === "card") {
        const cardContent = (
            <button
                onClick={handleClick}
                className={cn(
                    "bg-white rounded-2xl overflow-hidden block w-full text-left",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                    "border border-[#E5E7EB]",
                    "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
                    "group",
                    className
                )}
            >
                {/* Top section: Badge + Title */}
                <div className="p-4 pb-2">
                    {/* Badge */}
                    <div className="mb-2">
                        <span className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            AI Credit Coach
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[15px] font-medium text-[#1F2937] leading-snug mb-2">
                        {headline}
                    </h3>

                    {/* Description */}
                    <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">
                        {description}
                    </p>
                </div>

                {/* Image - Credit Mountain tile */}
                <div className="px-3 pb-1">
                    <div className="relative w-full aspect-[2/1] overflow-hidden rounded-lg">
                        <img
                            src="/credit-mountain-tile.png"
                            alt="Credit Mountain - AI Credit Coach"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* CTA Footer */}
                <div className="px-4 py-3 text-center">
                    <span className="text-[13px] font-medium text-[#1F2937] underline underline-offset-2 decoration-1 group-hover:text-blue-600 transition-colors">
                        {hasVisited ? "Continue Learning" : "Get Started"}
                    </span>
                </div>
            </button>
        );

        if (showSectionHeader) {
            return (
                <div>
                    <h2 className="text-[20px] font-semibold text-[#262C30] mb-4">
                        {CREDIT_MOUNTAIN_SECTION}
                    </h2>
                    {cardContent}
                </div>
            );
        }

        return cardContent;
    }

    // Hero variant - for featured/landing page display
    if (variant === "hero") {
        return (
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-md bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 font-bold text-xs tracking-wider uppercase">
                        AI Credit Coach
                    </div>
                    <h2 className="text-4xl font-bold text-slate-800 leading-tight">
                        {headline}
                    </h2>
                    <p className="text-lg text-slate-600 font-medium">
                        {description}
                    </p>
                    <div className="pt-4 flex gap-4">
                        <button
                            onClick={handleClick}
                            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors shadow-lg shadow-amber-500/20"
                        >
                            {hasVisited ? "Continue Learning" : "Get Started"}
                        </button>
                    </div>
                </div>

                {/* Visual / Credit Mountain Image */}
                <div className="relative h-full min-h-[300px] rounded-2xl overflow-hidden">
                    <img
                        src="/credit-mountain-tile.png"
                        alt="Credit Mountain - AI Credit Coach"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        );
    }

    // Widget variant - for home banking widgets
    return (
        <button
            onClick={handleClick}
            className={cn(
                "group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow text-left w-full",
                className
            )}
        >
            {/* Banner header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5">
                <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                    AI CREDIT COACH
                </span>
            </div>
            {/* Content */}
            <div className="p-3 flex items-start gap-3">
                {/* Small square logo */}
                <div className="w-10 h-10 rounded-md overflow-hidden shrink-0">
                    <img
                        src="/credit-mountain-tile.png"
                        alt="Credit Mountain"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm leading-snug">
                        {headline}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                        {description}
                    </p>
                </div>
                <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </button>
    );
}
