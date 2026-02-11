"use client";

import { useState, useEffect } from "react";
import { Campaign } from "@/context/StoreContext";
import { Calendar, Save, Target, Users, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignSettingsTabProps {
    campaign: Campaign;
    onUpdate: (updates: Partial<Campaign>) => void;
}

export default function CampaignSettingsTab({ campaign, onUpdate }: CampaignSettingsTabProps) {
    const [name, setName] = useState(campaign.name);
    const [startDate, setStartDate] = useState(campaign.startDate);
    const [endDate, setEndDate] = useState(campaign.endDate || "");
    const [hasChanges, setHasChanges] = useState(false);

    // Track changes
    useEffect(() => {
        const changed =
            name !== campaign.name ||
            startDate !== campaign.startDate ||
            endDate !== (campaign.endDate || "");
        setHasChanges(changed);
    }, [name, startDate, endDate, campaign]);

    const handleSave = () => {
        onUpdate({
            name,
            startDate,
            endDate: endDate || undefined,
        });
        setHasChanges(false);
    };

    const handleReset = () => {
        setName(campaign.name);
        setStartDate(campaign.startDate);
        setEndDate(campaign.endDate || "");
        setHasChanges(false);
    };

    const isLiveOrCompleted = campaign.status === "live" || campaign.status === "completed";

    return (
        <div className="space-y-6">
            {/* Campaign Type Info (read-only) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">Campaign Type</h2>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-xl",
                            campaign.type === "targeted"
                                ? "bg-purple-100 text-purple-600"
                                : "bg-indigo-100 text-indigo-600"
                        )}>
                            {campaign.type === "targeted" ? (
                                <Target className="w-6 h-6" />
                            ) : (
                                <Users className="w-6 h-6" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-medium text-slate-900 capitalize">{campaign.type}</h3>
                            <p className="text-sm text-slate-500">
                                {campaign.type === "targeted"
                                    ? "Uses customer file data to determine offers, pre-approvals, and rules."
                                    : "Shows offers to all consumers without personalization."}
                            </p>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-slate-500 flex items-start gap-1.5 bg-slate-50 px-3 py-2 rounded-lg">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        Campaign type cannot be changed after creation.
                    </p>
                </div>
            </div>

            {/* Campaign Details */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">Campaign Details</h2>
                </div>
                <div className="p-6 space-y-4">
                    {/* Campaign Name */}
                    <div>
                        <label htmlFor="campaign-name" className="block text-sm font-medium text-slate-700 mb-1">
                            Campaign Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="campaign-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLiveOrCompleted}
                            placeholder="Enter campaign name"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-1">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    Start Date <span className="text-rose-500">*</span>
                                </span>
                            </label>
                            <input
                                type="date"
                                id="start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                disabled={isLiveOrCompleted}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 mb-1">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    End Date
                                    {campaign.type === "targeted" && <span className="text-rose-500">*</span>}
                                    {campaign.type === "untargeted" && <span className="text-slate-400 font-normal">(optional)</span>}
                                </span>
                            </label>
                            <input
                                type="date"
                                id="end-date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                disabled={isLiveOrCompleted}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {isLiveOrCompleted && (
                        <p className="text-xs text-slate-500 flex items-start gap-1.5 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                            <span className="text-amber-700">
                                Campaign settings cannot be modified while the campaign is {campaign.status}.
                            </span>
                        </p>
                    )}
                </div>
            </div>

            {/* Campaign Summary (for live/completed campaigns) */}
            {campaign.metrics && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-semibold text-slate-900">Campaign Product Summary</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Campaign numbers based on your customer file, product rules, and preapproval rules.
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-5 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-900">
                                    {campaign.metrics.customerFileTotal.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Customer File Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-900">
                                    {campaign.metrics.enhancedCustomerFileTotal.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Enhanced File Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-900">
                                    {campaign.metrics.productMatches.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Product Matches</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-600">
                                    {campaign.metrics.preapprovals.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Preapprovals</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {campaign.metrics.applications.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Applications</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Bar */}
            {hasChanges && !isLiveOrCompleted && (
                <div className="sticky bottom-0 bg-white border border-slate-200 rounded-xl p-4 shadow-lg flex items-center justify-between">
                    <p className="text-sm text-slate-600">You have unsaved changes</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
