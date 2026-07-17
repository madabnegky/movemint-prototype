"use client";

import { PiggyBank, Search, Bell, Home, CreditCard, ArrowRightLeft, Zap, Gift, Settings, HelpCircle, LogOut, User, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartnerShellProps } from "./types";

/**
 * Alkami — modern gradient app shell. Indigo/purple, pill nav.
 * The widget sits in a narrow right rail; AlkamiOfferWidget is laid out for it.
 *
 * Chrome only — the DSF widget is injected as children. Extracted verbatim from
 * the original /home-banking page so both it and /demo render identical shells.
 */
export function AlkamiShell({ userName, showWidgetTag = false, children }: PartnerShellProps) {
    return (
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
                            <span className="text-sm text-white">{userName || "Cameron"}</span>
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
                            <h1 className="text-2xl font-semibold text-gray-900">Good afternoon, {userName || "Cameron"}</h1>
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
                                    {showWidgetTag && (
        <div className="absolute -top-3 left-4 px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded uppercase tracking-wider z-10">
            DSF Widget
        </div>
        )}
                                    {children}
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
    );
}
