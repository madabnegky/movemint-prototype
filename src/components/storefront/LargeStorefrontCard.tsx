"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type LargeCardTag = "preapproved" | "apply-now" | "special" | "redeemed";

export interface LargeCardHeroValue {
    label: string;
    value: string;
    suffix?: string;
}

export interface LargeStorefrontCardProps {
    productName: string;
    tag: LargeCardTag;
    heroValues: [LargeCardHeroValue, LargeCardHeroValue];
    imageUrl: string;
    ctaLabel?: string;
    ctaHref?: string;
    className?: string;
}

const TAG_STYLES: Record<LargeCardTag, { bg: string; text: string; label: string }> = {
    preapproved: { bg: "bg-[#269B78]", text: "text-[#FBFBFB]", label: "You're preapproved!" },
    "apply-now": { bg: "bg-[#8A55FB]", text: "text-[#FBFBFB]", label: "APPLY NOW" },
    special: { bg: "bg-[#262C30]", text: "text-[#FBFBFB]", label: "SPECIAL OFFER" },
    redeemed: { bg: "bg-[#C8CED1]", text: "text-[#576975]", label: "REDEEMED" },
};

function TagBadge({ tag }: { tag: LargeCardTag }) {
    const { bg, text, label } = TAG_STYLES[tag];
    return (
        <div className={cn("inline-flex items-start px-[16px] py-[2px] tag-radius", bg)}>
            <span
                className={cn(
                    "font-sans text-[12px] leading-[20px] tracking-[0.5px] uppercase whitespace-nowrap font-medium",
                    text
                )}
            >
                {label}
            </span>
        </div>
    );
}

function HeroValue({ label, value, suffix }: LargeCardHeroValue) {
    return (
        <div className="flex flex-col items-start w-[116px]">
            <span className="font-sans text-[14px] leading-[20px] text-[#576975] whitespace-nowrap">
                {label}
            </span>
            <div className="flex items-end gap-[4px] w-full">
                <span className="font-sans text-[18px] leading-none tracking-[-1px] text-[#262C30] font-medium font-ss03">
                    {value}
                </span>
                {suffix && (
                    <span className="font-sans text-[12px] leading-[16px] text-[#262C30]">
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}

export function LargeStorefrontCard({
    productName,
    tag,
    heroValues,
    imageUrl,
    ctaLabel = "Learn More",
    ctaHref = "#",
    className,
}: LargeStorefrontCardProps) {
    const card = (
        <div
            className={cn(
                "flex flex-col items-start w-[288px] bg-[#FBFBFB] rounded-[20px] overflow-clip",
                "shadow-[0_4px_8px_0_rgba(0,0,0,0.06)]",
                className
            )}
        >
            {/* Leaf container — tag flush top-left, card overflow-clip crops the corner */}
            <div className="flex flex-col items-start w-full pb-[8px]">
                <TagBadge tag={tag} />
            </div>

            {/* Card contents */}
            <div className="flex flex-col gap-[8px] w-full">
                {/* Header — fixed 102px tall */}
                <div className="flex flex-col gap-[8px] h-[102px] px-[16px] w-full">
                    <p className="font-sans text-[20px] leading-[26px] tracking-[-1px] text-[#262C30] font-ss03 w-full">
                        {productName}
                    </p>
                    <div className="flex items-start gap-[8px] w-full">
                        <HeroValue {...heroValues[0]} />
                        <HeroValue {...heroValues[1]} />
                    </div>
                </div>

                {/* Image */}
                <div className="px-[16px] w-full">
                    <div className="relative h-[112px] w-full rounded-[10px] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt={productName}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* Learn More footer */}
            <div className="flex items-start justify-center w-full pt-[4px] pb-[8px]">
                <span className="font-sans text-[14px] leading-[20px] text-[#262C30] text-center underline decoration-solid font-medium">
                    {ctaLabel}
                </span>
            </div>
        </div>
    );

    if (tag === "redeemed") return card;

    return (
        <Link href={ctaHref} className="flex">
            {card}
        </Link>
    );
}
