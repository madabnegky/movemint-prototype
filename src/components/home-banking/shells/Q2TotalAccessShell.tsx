"use client";

import { Lock, Home, Gift, Settings, LogOut, ChevronDown, Printer, MoreVertical } from "lucide-react";
import type { PartnerShellProps } from "./types";

/**
 * Q2 TotalAccess — legacy list-nav banking shell. Blue accent, narrow sidebar.
 *
 * Chrome only — the DSF widget is injected as children. Extracted verbatim from
 * the original /home-banking page so both it and /demo render identical shells.
 */
export function Q2TotalAccessShell({ userName, showWidgetTag = false, children }: PartnerShellProps) {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-300 bg-gray-100">
                {/* Q2 Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-500" />
                        <span className="text-xl font-semibold text-blue-500">TotalAccess</span>
                    </div>
                    <div className="text-right text-sm">
                        <div className="text-gray-700">Good Afternoon, {userName || "Sam Moore"}</div>
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
                            {showWidgetTag && (
        <div className="absolute -top-3 left-4 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded uppercase tracking-wider z-10">
            DSF Widget
        </div>
        )}
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
