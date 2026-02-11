"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ExternalLink, Home, Gift, Settings, LogOut, Lock, Printer, MoreVertical, Mail, CreditCard, Zap, Store, Grid3X3, Snowflake, Bell, Search, ArrowRightLeft, PiggyBank, User, HelpCircle } from "lucide-react";
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
                {selectedPartner.id === "q2-totalaccess" && (
                    <div className="max-w-5xl mx-auto">
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-300 bg-gray-100">
                            {/* Q2 Header */}
                            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-blue-500" />
                                    <span className="text-xl font-semibold text-blue-500">TotalAccess</span>
                                </div>
                                <div className="text-right text-sm">
                                    <div className="text-gray-700">Good Afternoon, {storefrontConfig.userName || "Sam Moore"}</div>
                                    <div className="text-gray-400 text-xs italic">Last login 04/11/2023 at 11:31 AM</div>
                                </div>
                            </div>

                            {/* Q2 Main Layout */}
                            <div className="flex min-h-[700px]">
                                {/* Q2 Sidebar */}
                                <div className="w-52 bg-white border-r border-gray-200 py-4">
                                    <nav className="space-y-1">
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-blue-600 bg-blue-50 border-l-2 border-blue-600">
                                            <Home className="w-5 h-5" />
                                            <span className="text-sm font-medium">Home</span>
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-blue-500 hover:bg-gray-50">
                                            <Gift className="w-5 h-5" />
                                            <span className="text-sm">Special Offers</span>
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-blue-500 hover:bg-gray-50">
                                            <Settings className="w-5 h-5" />
                                            <span className="text-sm">Settings</span>
                                            <ChevronDown className="w-4 h-4 ml-auto" />
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-blue-500 hover:bg-gray-50">
                                            <LogOut className="w-5 h-5" />
                                            <span className="text-sm">Log Off</span>
                                        </div>
                                    </nav>
                                </div>

                                {/* Q2 Main Content */}
                                <div className="flex-1 bg-gray-50 p-6">
                                    {/* Page Title */}
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-light text-gray-800">Home</h2>
                                        <Printer className="w-5 h-5 text-gray-400" />
                                    </div>

                                    {/* Accounts Section */}
                                    <div className="bg-white rounded-lg border border-gray-200 mb-6">
                                        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                                            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Accounts</h3>
                                            <MoreVertical className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="p-4 grid grid-cols-2 gap-4">
                                            {/* Checking Account */}
                                            <div className="border border-gray-200 rounded-lg p-4 border-l-4 border-l-blue-500">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="text-gray-600 text-sm">Checking</div>
                                                        <div className="text-xs text-gray-400 mt-1">Available Balance</div>
                                                        <div className="text-xs text-gray-400">Current Balance</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <MoreVertical className="w-4 h-4 text-gray-300 mb-2" />
                                                        <div className="text-lg font-bold text-gray-900">$152.34</div>
                                                        <div className="text-xs text-gray-400">$152.30</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Savings Account */}
                                            <div className="border border-gray-200 rounded-lg p-4 border-l-4 border-l-blue-500">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="text-gray-600 text-sm">Savings</div>
                                                        <div className="text-xs text-gray-400 mt-1">Available Balance</div>
                                                        <div className="text-xs text-gray-400">Current Balance</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <MoreVertical className="w-4 h-4 text-gray-300 mb-2" />
                                                        <div className="text-lg font-bold text-gray-900">$645.00</div>
                                                        <div className="text-xs text-gray-400">$645.00</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* THE DSF WIDGET - This is what we're previewing */}
                                    <div className="relative">
                                        <div className="absolute -top-3 left-4 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded uppercase tracking-wider z-10">
                                            DSF Widget
                                        </div>
                                        <Q2OfferWidget />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Q2 Composable Dashboard Frame */}
                {selectedPartner.id === "q2-composable" && (
                    <div className="max-w-6xl mx-auto">
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-300 bg-white">
                            {/* Thrive Header */}
                            <div className="bg-teal-600 px-6 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Snowflake className="w-6 h-6 text-white" />
                                    <span className="text-xl font-semibold text-white">thrive</span>
                                </div>
                                <div className="text-right text-sm text-white">
                                    Good Morning, {storefrontConfig.userName || "cunexus Test User"}
                                </div>
                            </div>

                            {/* Main Layout */}
                            <div className="flex min-h-[700px]">
                                {/* Sidebar */}
                                <div className="w-56 bg-white border-r border-gray-200 py-4">
                                    <nav className="space-y-1">
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-teal-600 bg-teal-50">
                                            <Home className="w-5 h-5" />
                                            <span className="text-sm font-medium">Home</span>
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-gray-600 hover:bg-gray-50">
                                            <Mail className="w-5 h-5" />
                                            <span className="text-sm">Messages</span>
                                            <span className="ml-auto w-5 h-5 bg-yellow-400 rounded-full text-xs flex items-center justify-center text-yellow-900 font-medium">1</span>
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-gray-600 hover:bg-gray-50">
                                            <CreditCard className="w-5 h-5" />
                                            <span className="text-sm">Payments & Transfers</span>
                                            <ChevronDown className="w-4 h-4 ml-auto" />
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-gray-600 hover:bg-gray-50">
                                            <Grid3X3 className="w-5 h-5" />
                                            <span className="text-sm">Advanced Payments</span>
                                            <ChevronDown className="w-4 h-4 ml-auto" />
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-gray-600 hover:bg-gray-50">
                                            <Zap className="w-5 h-5" />
                                            <span className="text-sm">Accelerator</span>
                                            <ChevronDown className="w-4 h-4 ml-auto" />
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-gray-600 hover:bg-gray-50">
                                            <Store className="w-5 h-5" />
                                            <span className="text-sm">Marketplace</span>
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-gray-600 hover:bg-gray-50">
                                            <Gift className="w-5 h-5" />
                                            <span className="text-sm">Services</span>
                                            <ChevronDown className="w-4 h-4 ml-auto" />
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-gray-600 hover:bg-gray-50">
                                            <Settings className="w-5 h-5" />
                                            <span className="text-sm">Settings</span>
                                            <ChevronDown className="w-4 h-4 ml-auto" />
                                        </div>
                                        <div className="px-4 py-2.5 flex items-center gap-3 text-gray-600 hover:bg-gray-50">
                                            <LogOut className="w-5 h-5" />
                                            <span className="text-sm">Log Off</span>
                                        </div>
                                    </nav>
                                </div>

                                {/* Main Content - Widget Grid */}
                                <div className="flex-1 bg-gray-50 p-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        {/* ACCOUNTS Widget */}
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Accounts</h3>
                                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                                                    <CreditCard className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <p className="text-sm text-center">Welcome to your dashboard! You can pick which accounts you'd like to display here.</p>
                                                <button className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                                    Select accounts
                                                </button>
                                            </div>
                                        </div>

                                        {/* RECENT ACTIVITY Widget */}
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recent Activity</h3>
                                                <select className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-500">
                                                    <option>Filter accounts</option>
                                                </select>
                                            </div>
                                            <div className="text-xs text-gray-400 mb-2">TODAY</div>
                                            <div className="space-y-3">
                                                {[
                                                    { desc: "PAID CHECK", amount: "$100.22", sub: "Home Mortgage ARM" },
                                                    { desc: "PAID CHECK", amount: "$100.22", sub: "Total Access Installment..." },
                                                    { desc: "WHOLESALE LOCKB...", amount: "-$43,837.55", sub: "Home Mortgage ARM" },
                                                    { desc: "WHOLESALE LOCKB...", amount: "-$43,837.55", sub: "Total Access Installment..." },
                                                    { desc: "Interest PAID THIS S...", amount: "-$100.33", sub: "Home Mortgage ARM" },
                                                ].map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50">
                                                        <div>
                                                            <div className="text-sm text-gray-700">{item.desc}</div>
                                                            <div className="text-xs text-gray-400">{item.sub}</div>
                                                        </div>
                                                        <div className={cn(
                                                            "text-sm font-medium",
                                                            item.amount.startsWith("-") ? "text-gray-700" : "text-gray-900"
                                                        )}>
                                                            {item.amount}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right Column - SPENDING + YOUR OFFERS */}
                                        <div className="space-y-4">
                                            {/* SPENDING Widget */}
                                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Spending</h3>
                                                <div className="flex items-center justify-center py-4">
                                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <span className="text-2xl text-gray-300">$</span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 text-center mt-2">
                                                    Enroll in financial tools to see the big picture of your finances, even your accounts outside of SDX-Experimental.
                                                </p>
                                                <button className="mt-3 text-xs text-teal-600 hover:underline w-full text-center">
                                                    Enroll in financial tools
                                                </button>
                                            </div>

                                            {/* YOUR OFFERS Widget - THE DSF WIDGET */}
                                            <div className="relative">
                                                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded uppercase tracking-wider z-10">
                                                    DSF Widget
                                                </div>
                                                <Q2ComposableWidget />
                                            </div>
                                        </div>

                                        {/* ACTION LINK CONTENT BLOCK (spans 2 columns) */}
                                        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide text-center mb-4">Action Link Content Block</h3>
                                            <div className="flex items-center justify-center gap-4 py-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <CreditCard className="w-5 h-5 text-gray-400" />
                                                </div>
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Home className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Alkami Digital Banking Frame */}
                {selectedPartner.id === "alkami" && (
                    <div className="max-w-5xl mx-auto">
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-300 bg-white">
                            {/* Alkami Header */}
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                        <PiggyBank className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xl font-semibold text-white">Community Credit Union</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                        <Search className="w-5 h-5" />
                                    </button>
                                    <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative">
                                        <Bell className="w-5 h-5" />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    </button>
                                    <div className="flex items-center gap-2 pl-4 border-l border-white/20">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-sm text-white">{storefrontConfig.userName || "Cameron"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Alkami Main Layout */}
                            <div className="flex min-h-[700px]">
                                {/* Alkami Sidebar */}
                                <div className="w-64 bg-gray-50 border-r border-gray-200 py-6">
                                    <nav className="space-y-1 px-3">
                                        <div className="px-4 py-3 flex items-center gap-3 text-indigo-600 bg-indigo-50 rounded-xl font-medium">
                                            <Home className="w-5 h-5" />
                                            <span className="text-sm">Dashboard</span>
                                        </div>
                                        <div className="px-4 py-3 flex items-center gap-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                            <CreditCard className="w-5 h-5" />
                                            <span className="text-sm">Accounts</span>
                                        </div>
                                        <div className="px-4 py-3 flex items-center gap-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                            <ArrowRightLeft className="w-5 h-5" />
                                            <span className="text-sm">Transfers</span>
                                        </div>
                                        <div className="px-4 py-3 flex items-center gap-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                            <Store className="w-5 h-5" />
                                            <span className="text-sm">Pay Bills</span>
                                        </div>
                                        <div className="px-4 py-3 flex items-center gap-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                            <Gift className="w-5 h-5" />
                                            <span className="text-sm">Offers</span>
                                        </div>
                                        <div className="px-4 py-3 flex items-center gap-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                                            <Settings className="w-5 h-5" />
                                            <span className="text-sm">Settings</span>
                                        </div>
                                    </nav>
                                    <div className="mt-auto pt-6 px-3 border-t border-gray-200 mt-6">
                                        <div className="px-4 py-3 flex items-center gap-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                                            <HelpCircle className="w-5 h-5" />
                                            <span className="text-sm">Help & Support</span>
                                        </div>
                                        <div className="px-4 py-3 flex items-center gap-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                                            <LogOut className="w-5 h-5" />
                                            <span className="text-sm">Sign Out</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Alkami Main Content */}
                                <div className="flex-1 bg-gray-100 p-8">
                                    {/* Welcome Header */}
                                    <div className="mb-8">
                                        <h1 className="text-2xl font-semibold text-gray-900">Good afternoon, {storefrontConfig.userName || "Cameron"}</h1>
                                        <p className="text-gray-500 mt-1">Here's your financial overview</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6">
                                        {/* Left Column - Accounts */}
                                        <div className="col-span-2 space-y-6">
                                            {/* Account Cards */}
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-900">My Accounts</h3>
                                                    <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white">
                                                        <div>
                                                            <div className="text-sm opacity-80">Checking ••••4523</div>
                                                            <div className="text-2xl font-bold mt-1">$8,432.50</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs opacity-70">Available</div>
                                                            <div className="font-semibold">$8,232.50</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                        <div>
                                                            <div className="text-sm text-gray-500">Savings ••••7891</div>
                                                            <div className="text-xl font-bold text-gray-900 mt-1">$24,150.00</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-gray-400">APY</div>
                                                            <div className="font-semibold text-emerald-600">4.25%</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                        <div>
                                                            <div className="text-sm text-gray-500">Auto Loan ••••3456</div>
                                                            <div className="text-xl font-bold text-gray-900 mt-1">$12,840.00</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-gray-400">Payment Due</div>
                                                            <div className="font-semibold text-gray-700">Mar 15</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {[
                                                        { icon: ArrowRightLeft, label: "Transfer" },
                                                        { icon: Store, label: "Pay Bills" },
                                                        { icon: CreditCard, label: "Deposit" },
                                                        { icon: PiggyBank, label: "Save" },
                                                    ].map((action, idx) => (
                                                        <button key={idx} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                                            <action.icon className="w-6 h-6 text-indigo-600" />
                                                            <span className="text-sm text-gray-700">{action.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column - DSF Widget */}
                                        <div className="space-y-6">
                                            {/* THE DSF WIDGET */}
                                            <div className="relative">
                                                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded uppercase tracking-wider z-10">
                                                    DSF Widget
                                                </div>
                                                <AlkamiOfferWidget />
                                            </div>

                                            {/* Recent Activity */}
                                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                                                <div className="space-y-3">
                                                    {[
                                                        { name: "Amazon", amount: "-$42.99", date: "Today" },
                                                        { name: "Direct Deposit", amount: "+$2,450.00", date: "Yesterday" },
                                                        { name: "Starbucks", amount: "-$6.75", date: "Mar 1" },
                                                    ].map((tx, idx) => (
                                                        <div key={idx} className="flex items-center justify-between py-2">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{tx.name}</div>
                                                                <div className="text-xs text-gray-400">{tx.date}</div>
                                                            </div>
                                                            <div className={cn(
                                                                "font-semibold text-sm",
                                                                tx.amount.startsWith("+") ? "text-emerald-600" : "text-gray-900"
                                                            )}>
                                                                {tx.amount}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
