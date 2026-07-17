"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ExternalLink } from "lucide-react";
import { PartnerShell, type PartnerShellId } from "@/components/home-banking/shells/PartnerShell";
import { useStore } from "@/context/StoreContext";
import { Q2OfferWidget } from "@/components/home-banking/Q2OfferWidget";
import { Q2ComposableWidget } from "@/components/home-banking/Q2ComposableWidget";
import { AlkamiOfferWidget } from "@/components/home-banking/AlkamiOfferWidget";
import { PreviewAsDropdown } from "@/components/preview/PreviewAsDropdown";
import { PreviewModeToggle } from "@/components/preview/PreviewModeToggle";

// Partner platform configurations
interface Partner {
    id: string;
    name: string;
    fullName: string;
    description: string;
    available: boolean;
}

const PARTNERS: Partner[] = [
    {
        id: "q2-totalaccess",
        name: "Q2 TotalAccess",
        fullName: "Q2 TotalAccess",
        description: "Traditional home banking layout",
        available: true,
    },
    {
        id: "q2-composable",
        name: "Q2 Composable",
        fullName: "Q2 Composable Dashboard",
        description: "Widget-based dashboard layout",
        available: true,
    },
    {
        id: "alkami",
        name: "Alkami",
        fullName: "Alkami Digital Banking",
        description: "Modern unified dashboard",
        available: true,
    },
    {
        id: "ncr",
        name: "NCR Voyix",
        fullName: "NCR Digital Banking",
        description: "Coming soon",
        available: false,
    },
    {
        id: "fiserv",
        name: "Fiserv",
        fullName: "Fiserv Digital One",
        description: "Coming soon",
        available: false,
    },
];

export default function PartnerPreviewsPage() {
    const [selectedPartner, setSelectedPartner] = useState(PARTNERS[0]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { storefrontConfig } = useStore();

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Top Control Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
                        ← Back to Launchpad
                    </Link>
                    <div className="h-6 w-px bg-slate-200" />
                    <h1 className="text-lg font-semibold text-slate-900">Partner Widget Preview</h1>
                    <div className="h-6 w-px bg-slate-200" />
                    <PreviewModeToggle />
                    <PreviewAsDropdown />
                </div>

                {/* Partner Selector */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <div
                            className={cn(
                                "w-3 h-3 rounded-full",
                                selectedPartner.available ? "bg-blue-500" : "bg-gray-300"
                            )}
                        />
                        <span className="font-medium text-slate-900">{selectedPartner.name}</span>
                        <ChevronDown className={cn(
                            "w-4 h-4 text-slate-500 transition-transform",
                            dropdownOpen && "rotate-180"
                        )} />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                            {PARTNERS.map((partner) => (
                                <button
                                    key={partner.id}
                                    onClick={() => {
                                        if (partner.available) {
                                            setSelectedPartner(partner);
                                        }
                                        setDropdownOpen(false);
                                    }}
                                    disabled={!partner.available}
                                    className={cn(
                                        "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                                        partner.available
                                            ? "hover:bg-slate-50"
                                            : "opacity-50 cursor-not-allowed",
                                        selectedPartner.id === partner.id && "bg-slate-50"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-3 h-3 rounded-full flex-shrink-0",
                                            partner.available ? "bg-blue-500" : "bg-gray-300"
                                        )}
                                    />
                                    <div>
                                        <div className={cn(
                                            "font-medium text-sm",
                                            partner.available ? "text-slate-900" : "text-slate-400"
                                        )}>
                                            {partner.name}
                                        </div>
                                        <div className={cn(
                                            "text-xs",
                                            partner.available ? "text-slate-500" : "text-slate-400"
                                        )}>
                                            {partner.description}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Container */}
            <div className="p-6">
                {/* Partner Info Banner */}
                <div className="max-w-6xl mx-auto mb-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg bg-blue-600">
                                {selectedPartner.id.startsWith("q2") ? "Q2" : selectedPartner.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">{selectedPartner.fullName}</h2>
                                <p className="text-sm text-slate-500">
                                    Preview how the DSF widget appears in {selectedPartner.name}'s interface
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/admin/product-config"
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                Configure Offers
                            </Link>
                            <Link
                                href="/storefront"
                                className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                            >
                                Full Storefront
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Q2 TotalAccess Frame */}
                {selectedPartner.available && (
                    <PartnerShell
                        partner={selectedPartner.id as PartnerShellId}
                        userName={storefrontConfig.userName}
                        showWidgetTag
                    >
                        {selectedPartner.id === "q2-totalaccess" && <Q2OfferWidget />}
                        {selectedPartner.id === "q2-composable" && <Q2ComposableWidget />}
                        {selectedPartner.id === "alkami" && <AlkamiOfferWidget />}
                    </PartnerShell>
                )}

                {/* Coming Soon Placeholder for other partners */}
                {!selectedPartner.available && (
                    <div className="max-w-5xl mx-auto">
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-300 bg-gray-100 min-h-[600px] flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl font-bold text-gray-400">{selectedPartner.name.charAt(0)}</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-500 mb-2">{selectedPartner.fullName}</h3>
                                <p className="text-gray-400">Design preview coming soon</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Prototype Navigation */}
            <div className="fixed bottom-4 right-4 z-50 flex gap-2">
                <Link
                    href="/storefront"
                    className="px-3 py-1.5 bg-[#143C67] text-white text-[11px] font-medium rounded-full shadow-lg hover:bg-[#0f2d4d] transition-colors"
                >
                    View Storefront
                </Link>
                <Link
                    href="/admin/product-config"
                    className="px-3 py-1.5 bg-[#1A2B3C] text-white text-[11px] font-medium rounded-full shadow-lg hover:bg-black transition-colors"
                >
                    Configure Offers
                </Link>
                <Link
                    href="/"
                    className="px-3 py-1.5 bg-[#262C30] text-white text-[11px] font-medium rounded-full shadow-lg hover:bg-black transition-colors"
                >
                    Exit Prototype
                </Link>
            </div>
        </div>
    );
}
