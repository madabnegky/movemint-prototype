"use client";

import { Snowflake, Home, Mail, ArrowRightLeft, Zap, CreditCard, Store, Grid3X3, Settings, LogOut, ChevronDown, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartnerShellProps } from "./types";

/**
 * Q2 Composable — tile-dashboard shell. Teal "thrive" brand.
 * The widget sits in a narrow third-column slot; Q2ComposableWidget is laid out for it.
 *
 * Chrome only — the DSF widget is injected as children. Extracted verbatim from
 * the original /home-banking page so both it and /demo render identical shells.
 */
export function Q2ComposableShell({ userName, showWidgetTag = false, children }: PartnerShellProps) {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-300 bg-white">
                {/* Thrive Header */}
                <div className="bg-teal-600 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Snowflake className="w-6 h-6 text-white" />
                        <span className="text-xl font-semibold text-white">thrive</span>
                    </div>
                    <div className="text-right text-sm text-white">
                        Good Morning, {userName || "cunexus Test User"}
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
                                    {showWidgetTag && (
        <div className="absolute -top-3 left-4 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded uppercase tracking-wider z-10">
            DSF Widget
        </div>
        )}
                                    {children}
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
    );
}
