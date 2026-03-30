"use client";

import { useState, use } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Play,
    Circle,
    CheckCircle2,
    RefreshCw,
    Plus,
    Calendar,
    Clock,
    Pause,
    Info,
    AlertTriangle,
    XCircle,
    Shield,
} from "lucide-react";

// --- Types ---

type OfferWindowStatus = "live" | "draft" | "completed";
type DataSourceType = "none" | "static" | "dynamic";

interface RefreshLogEntry {
    id: string;
    date: string;
    fileName: string;
    status: "success" | "failed" | "flagged";
    added: number | null;
    updated: number | null;
    removed: number | null;
    totalActive: number;
    errorMessage?: string;
}

// --- Mock data ---

const MOCK_WINDOWS: Record<string, {
    id: string;
    name: string;
    status: OfferWindowStatus;
    dataSource: DataSourceType;
    startDate?: string;
    endDate?: string;
    tags: string[];
    goalCount?: number;
    goalType?: string;
    refreshSchedule?: string;
    refreshDay?: string;
    refreshTime?: string;
    metrics: {
        customerFile: number;
        enhancedFile: number;
        offersGenerated: number;
        preapprovals: number;
        applications: number;
        totalRefreshes?: number;
        activeOffers?: number;
    };
    products: { id: string; name: string; isFeatured: boolean; ruleCount: number; preapprovalRuleCount: number }[];
    refreshLog?: RefreshLogEntry[];
}> = {
    "ow-1": {
        id: "ow-1",
        name: "Summer Auto Loan Push",
        status: "live",
        dataSource: "static",
        startDate: "2026-06-01",
        endDate: "2026-08-31",
        tags: ["Auto Lending"],
        goalCount: 500,
        goalType: "Applications",
        metrics: {
            customerFile: 4800,
            enhancedFile: 4650,
            offersGenerated: 4800,
            preapprovals: 2100,
            applications: 312,
        },
        products: [
            { id: "p1", name: "1.9% APR New Auto Loan", isFeatured: true, ruleCount: 3, preapprovalRuleCount: 2 },
            { id: "p2", name: "2.4% APR Used Auto Loan", isFeatured: false, ruleCount: 2, preapprovalRuleCount: 1 },
        ],
    },
    "ow-2": {
        id: "ow-2",
        name: "Pre-Approved Auto — Rolling",
        status: "live",
        dataSource: "dynamic",
        tags: ["Auto Lending"],
        refreshSchedule: "Weekly",
        refreshDay: "Monday",
        refreshTime: "06:00",
        metrics: {
            customerFile: 0,
            enhancedFile: 0,
            offersGenerated: 0,
            preapprovals: 3840,
            applications: 489,
            totalRefreshes: 14,
            activeOffers: 6200,
        },
        products: [
            { id: "p3", name: "Pre-Approved New Auto Loan", isFeatured: true, ruleCount: 4, preapprovalRuleCount: 3 },
        ],
        refreshLog: [
            { id: "r1", date: "Mar 28, 2026", fileName: "auto_preapproved_0328.csv", status: "success", added: 342, updated: 1204, removed: 18, totalActive: 6200 },
            { id: "r2", date: "Mar 21, 2026", fileName: "auto_preapproved_0321.csv", status: "success", added: 289, updated: 1156, removed: 42, totalActive: 5876 },
            { id: "r3", date: "Mar 14, 2026", fileName: "auto_preapproved_0314.csv", status: "flagged", added: 1102, updated: 987, removed: 5, totalActive: 5629 },
            { id: "r4", date: "Mar 7, 2026", fileName: "auto_preapproved_0307.csv", status: "success", added: 198, updated: 1340, removed: 31, totalActive: 4532 },
            { id: "r5", date: "Feb 28, 2026", fileName: "auto_preapproved_0228.csv", status: "failed", added: null, updated: null, removed: null, totalActive: 4365, errorMessage: "Connection timeout after 30s — SFTP server at sftp.acmecu.org did not respond." },
            { id: "r6", date: "Feb 21, 2026", fileName: "auto_preapproved_0221.csv", status: "success", added: 267, updated: 1089, removed: 12, totalActive: 4365 },
        ],
    },
};

// Fallback for unknown IDs
const DEFAULT_WINDOW = MOCK_WINDOWS["ow-1"];

// --- Tab Components ---

function WindowSettingsTab({ window: w }: { window: typeof DEFAULT_WINDOW }) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">Window Settings</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input type="text" defaultValue={w.name} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {w.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                                    {tag} <button className="text-slate-400 hover:text-slate-600">&times;</button>
                                </span>
                            ))}
                            <input type="text" placeholder="Add tag..." className="px-2 py-1 text-xs border-0 focus:outline-none w-24" />
                        </div>
                    </div>
                    {w.dataSource !== "dynamic" && w.startDate && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                <input type="date" defaultValue={w.startDate} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                <input type="date" defaultValue={w.endDate} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                        </div>
                    )}
                    {w.dataSource === "dynamic" && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Timeframe</label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <Clock className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-medium text-indigo-700">Evergreen</span>
                                <span className="text-xs text-indigo-500">— this window runs indefinitely until paused</span>
                            </div>
                        </div>
                    )}
                    {w.goalCount && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Goal</label>
                            <div className="flex gap-3">
                                <input type="number" defaultValue={w.goalCount} className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                <select defaultValue={w.goalType} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                    <option>Applications</option>
                                    <option>Preapprovals</option>
                                    <option>Redemptions</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StaticDataSourceTab() {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">Data Source</h2>
                    <p className="text-sm text-slate-500 mt-0.5">This window uses a <strong>static file</strong>. Customer data was uploaded once and offers are locked.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">summer_auto_members_2026.csv</p>
                                <p className="text-xs text-slate-500">Uploaded May 20, 2026 · 4,800 records</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Processed
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">summer_auto_enhanced_experian.csv</p>
                                <p className="text-xs text-slate-500">Uploaded May 22, 2026 · 4,650 records · Experian</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Processed
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DynamicDataSourceTab({ window: w }: { window: typeof DEFAULT_WINDOW }) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">Data Source</h2>
                    <p className="text-sm text-slate-500 mt-0.5">This window uses a <strong>dynamic file</strong> with scheduled refresh.</p>
                </div>
                <div className="p-6 space-y-6">

                    {/* Connection */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Connection</h3>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Source Type</label>
                                    <select defaultValue="sftp" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                        <option value="sftp">SFTP</option>
                                        <option value="api">API Endpoint</option>
                                        <option value="s3">AWS S3</option>
                                        <option value="manual">Manual Upload</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Host</label>
                                    <input type="text" defaultValue="sftp.acmecu.org" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Path / Directory</label>
                                    <input type="text" defaultValue="/exports/auto-preapprovals/" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-xs" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">File Pattern</label>
                                    <input type="text" defaultValue="auto_preapproved_*.csv" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-xs" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Credentials</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg">
                                        <Shield className="w-4 h-4 text-emerald-500" />
                                        <span className="text-sm text-slate-700">SSH key configured</span>
                                        <button className="ml-auto text-xs text-slate-500 hover:text-slate-700">Change</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Connection Status</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-sm text-emerald-700">Connected — last verified Mar 28</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Test Connection</button>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Refresh Schedule</h3>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Frequency</label>
                                    <select defaultValue={w.refreshSchedule || "Weekly"} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                        <option>Daily</option>
                                        <option>Weekly</option>
                                        <option>Bi-weekly</option>
                                        <option>Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Day</label>
                                    <select defaultValue={w.refreshDay || "Monday"} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                        <option>Monday</option>
                                        <option>Tuesday</option>
                                        <option>Wednesday</option>
                                        <option>Thursday</option>
                                        <option>Friday</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Time</label>
                                    <input type="time" defaultValue={w.refreshTime || "06:00"} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">
                                Next scheduled refresh: <span className="font-medium text-slate-700">Monday, Mar 31, 2026 at 6:00 AM ET</span>
                            </p>
                        </div>
                    </div>

                    {/* Processing Rules */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Processing Rules</h3>
                        <p className="text-xs text-slate-500 mb-3">When a new file arrives, the platform diffs it against the current active offers.</p>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-200">
                            <div className="p-4 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <Plus className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">New rows</p>
                                    <p className="text-xs text-slate-500">Members in the new file that don&apos;t have active offers</p>
                                    <div className="mt-2">
                                        <select className="px-2 py-1 border border-slate-300 rounded text-xs bg-white">
                                            <option>Generate new offers immediately</option>
                                            <option>Queue for review before generating</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <RefreshCw className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">Changed rows</p>
                                    <p className="text-xs text-slate-500">Members whose data has changed (credit score, balance, etc.)</p>
                                    <div className="mt-2">
                                        <select className="px-2 py-1 border border-slate-300 rounded text-xs bg-white">
                                            <option>Re-evaluate rules and update offers</option>
                                            <option>Keep existing offers unchanged</option>
                                            <option>Queue for review</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-900">Missing rows</p>
                                    <p className="text-xs text-slate-500">Members with active offers who are no longer in the new file</p>
                                    <div className="mt-2">
                                        <select className="px-2 py-1 border border-slate-300 rounded text-xs bg-white">
                                            <option>Expire offers immediately</option>
                                            <option>Expire after 7-day grace period</option>
                                            <option>Expire after 30-day grace period</option>
                                            <option>Keep offers active (ignore removal)</option>
                                            <option>Queue for review</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bureau Enhancement */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Credit Bureau Enhancement</h3>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Auto-enhance with bureau data on each refresh</p>
                                    <p className="text-xs text-slate-500">New files will be sent to the bureau automatically. Enhanced data feeds back into rule evaluation.</p>
                                </div>
                                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-emerald-600 transition-colors">
                                    <span className="inline-block h-5 w-5 rounded-full bg-white border-2 border-emerald-600 translate-x-5 transition-transform" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Bureau</label>
                                    <select defaultValue="experian" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                        <option value="experian">Experian</option>
                                        <option value="equifax">Equifax</option>
                                        <option value="transunion">TransUnion</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Enhancement Status</label>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-sm text-emerald-700">Active — auto-enhancing</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Notifications</h3>
                        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
                            {[
                                { label: "Notify on successful refresh", desc: "Email summary of what changed", defaultOn: true },
                                { label: "Notify on failure", desc: "Alert if the refresh fails (connection error, bad file, etc.)", defaultOn: true },
                                { label: "Notify on large changes", desc: "Alert if more than 20% of offers would be added or removed", defaultOn: true },
                            ].map((n) => (
                                <div key={n.label} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-700">{n.label}</p>
                                        <p className="text-xs text-slate-500">{n.desc}</p>
                                    </div>
                                    <button className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                        n.defaultOn ? "bg-emerald-600" : "bg-slate-300"
                                    )}>
                                        <span className={cn(
                                            "inline-block h-5 w-5 rounded-full bg-white border-2 transition-transform",
                                            n.defaultOn ? "translate-x-5 border-emerald-600" : "translate-x-0.5 border-slate-300"
                                        )} />
                                    </button>
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Notification email(s)</label>
                                <input type="text" defaultValue="marketing@acmecu.org, jsmith@acmecu.org" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RefreshHistoryTab({ refreshLog }: { refreshLog: RefreshLogEntry[] }) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-slate-900">Refresh History</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Every time data is refreshed, the platform diffs and logs what changed.</p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                        Refresh Now
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Source File</th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Added</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Updated</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Removed</th>
                                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Total Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {refreshLog.map((entry, idx) => (
                                <tr key={entry.id} className={cn(idx === 0 && "bg-indigo-50/30")}>
                                    <td className={cn("px-4 py-3 text-sm text-slate-900", idx === 0 && "font-medium")}>{entry.date}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{entry.fileName}</td>
                                    <td className="px-4 py-3">
                                        {entry.status === "success" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3" /> Success
                                            </span>
                                        )}
                                        {entry.status === "failed" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                                <XCircle className="w-3 h-3" /> Failed
                                            </span>
                                        )}
                                        {entry.status === "flagged" && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                                <AlertTriangle className="w-3 h-3" /> Large change flagged
                                            </span>
                                        )}
                                    </td>
                                    <td className={cn("px-4 py-3 text-sm text-right", entry.added !== null ? "text-emerald-600 font-medium" : "text-slate-400")}>
                                        {entry.added !== null ? `+${entry.added.toLocaleString()}` : "—"}
                                    </td>
                                    <td className={cn("px-4 py-3 text-sm text-right", entry.updated !== null ? "text-blue-600 font-medium" : "text-slate-400")}>
                                        {entry.updated !== null ? entry.updated.toLocaleString() : "—"}
                                    </td>
                                    <td className={cn("px-4 py-3 text-sm text-right", entry.removed !== null ? "text-rose-600 font-medium" : "text-slate-400")}>
                                        {entry.removed !== null ? `-${entry.removed.toLocaleString()}` : "—"}
                                    </td>
                                    <td className={cn("px-4 py-3 text-sm text-right", entry.status !== "failed" ? "text-slate-900 font-semibold" : "text-slate-400")}>
                                        {entry.totalActive.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Show error detail for failed entries */}
            {refreshLog.filter(e => e.status === "failed").map(entry => (
                <div key={entry.id} className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-rose-900">{entry.date} refresh failed</h4>
                            <p className="text-xs text-rose-700 mt-1">
                                {entry.errorMessage} No offers were changed. The previous week&apos;s data remained active.
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ProductsTab({ products }: { products: typeof DEFAULT_WINDOW.products }) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">Products</h2>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                        <Plus className="w-4 h-4" /> Add Product
                    </button>
                </div>
                <div className="divide-y divide-slate-100">
                    {products.map((product) => (
                        <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-slate-900">{product.name}</p>
                                        {product.isFeatured && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700">Featured</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">{product.ruleCount} product rules · {product.preapprovalRuleCount} preapproval rules</p>
                                </div>
                            </div>
                            <button className="text-sm text-slate-500 hover:text-slate-700">Configure →</button>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-500">No products added yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">{title}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                </div>
                <div className="p-6 text-sm text-slate-500">Same configuration as today&apos;s campaign {title.toLowerCase()}. Scoped to this offer window.</div>
            </div>
        </div>
    );
}

function ReportingTab({ metrics, isDynamic }: { metrics: typeof DEFAULT_WINDOW.metrics; isDynamic: boolean }) {
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-semibold text-slate-900">Reporting</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {isDynamic ? "Performance metrics across all refreshes." : "Performance metrics for this offer window."}
                    </p>
                </div>
                <div className="p-6">
                    <div className={cn("grid gap-4", isDynamic ? "grid-cols-4" : "grid-cols-3")}>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                            <p className="text-2xl font-bold text-slate-900">
                                {isDynamic ? (metrics.activeOffers || 0).toLocaleString() : metrics.offersGenerated.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{isDynamic ? "Active Offers" : "Offers Generated"}</p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                            <p className="text-2xl font-bold text-emerald-600">{metrics.preapprovals.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-1">Preapprovals</p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{metrics.applications.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-1">Applications</p>
                        </div>
                        {isDynamic && (
                            <div className="text-center p-4 bg-slate-50 rounded-lg">
                                <p className="text-2xl font-bold text-indigo-600">{(metrics.totalRefreshes || 0).toLocaleString()}</p>
                                <p className="text-xs text-slate-500 mt-1">Refreshes</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 p-8 border-2 border-dashed border-slate-200 rounded-lg text-center">
                        <p className="text-sm text-slate-500">
                            {isDynamic ? "Trend charts across refreshes would go here." : "Charts and detailed analytics would go here."}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {isDynamic ? "Offers over time, conversion by refresh cycle, churn rate, etc." : "Conversion funnel, timeline, product breakdown, etc."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Page ---

type TabId = "settings" | "data" | "refresh-history" | "products" | "acceptance" | "reconciliation" | "reporting";

export default function OfferWindowDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const w = MOCK_WINDOWS[id] || DEFAULT_WINDOW;
    const isDynamic = w.dataSource === "dynamic";

    const [activeTab, setActiveTab] = useState<TabId>("settings");

    const tabs: { id: TabId; label: string; dynamicOnly?: boolean }[] = [
        { id: "settings", label: "Window Settings" },
        { id: "data", label: "Data Source" },
        { id: "refresh-history", label: "Refresh History", dynamicOnly: true },
        { id: "products", label: "Products" },
        { id: "acceptance", label: "Acceptance Rules" },
        { id: "reconciliation", label: "Reconciliation Rules" },
        { id: "reporting", label: "Reporting" },
    ];

    const availableTabs = tabs.filter(t => !t.dynamicOnly || isDynamic);

    return (
        <div className="max-w-6xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <Link href="/admin/offer-windows" className="hover:text-slate-700">Offer Windows</Link>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="text-slate-900 font-medium">{w.name}</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-900">{w.name}</h1>
                        {/* Status badge */}
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
                            w.status === "live" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            w.status === "draft" ? "bg-slate-100 text-slate-600 border-slate-200" :
                            "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                w.status === "live" ? "bg-emerald-500" : w.status === "draft" ? "bg-slate-400" : "bg-blue-500"
                            )} />
                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                        </span>
                        {/* Data source badge */}
                        {isDynamic ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <RefreshCw className="w-3 h-3" /> Dynamic File
                            </span>
                        ) : w.dataSource === "static" ? (
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                Static File
                            </span>
                        ) : null}
                        {w.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500">{tag}</span>
                        ))}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {w.startDate && w.endDate ? (
                            <>{new Date(w.startDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – {new Date(w.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
                        ) : (
                            <>Evergreen (no end date)</>
                        )}
                        {w.refreshSchedule && <> &nbsp;·&nbsp; Refreshes every {w.refreshDay || "Monday"}</>}
                        {w.goalCount && <> &nbsp;·&nbsp; Goal: {w.goalCount} {w.goalType?.toLowerCase()}</>}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isDynamic && (
                        <button className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh Now
                        </button>
                    )}
                    {w.status === "live" && (
                        <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <Pause className="w-4 h-4" /> Pause
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className={cn("grid gap-4 mb-8", isDynamic ? "grid-cols-5" : "grid-cols-5")}>
                {isDynamic ? (
                    <>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">Active Offers</p>
                            <p className="text-xl font-bold text-slate-900 mt-1">{(w.metrics.activeOffers || 0).toLocaleString()}</p>
                            {w.refreshLog && w.refreshLog[0] && w.refreshLog[0].added !== null && (
                                <p className="text-[10px] text-emerald-600 mt-0.5">+{w.refreshLog[0].added} from last refresh</p>
                            )}
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">Preapprovals</p>
                            <p className="text-xl font-bold text-emerald-600 mt-1">{w.metrics.preapprovals.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">Applications</p>
                            <p className="text-xl font-bold text-blue-600 mt-1">{w.metrics.applications.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">Conversion</p>
                            <p className="text-xl font-bold text-slate-900 mt-1">7.9%</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">Total Refreshes</p>
                            <p className="text-xl font-bold text-indigo-600 mt-1">{(w.metrics.totalRefreshes || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Since Jan 6, 2026</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">Customer File</p>
                            <p className="text-xl font-bold text-slate-900 mt-1">{w.metrics.customerFile.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">Enhanced File</p>
                            <p className="text-xl font-bold text-slate-900 mt-1">{w.metrics.enhancedFile.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">Offers Generated</p>
                            <p className="text-xl font-bold text-slate-900 mt-1">{w.metrics.offersGenerated.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">Preapprovals</p>
                            <p className="text-xl font-bold text-emerald-600 mt-1">{w.metrics.preapprovals.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">Applications</p>
                            <p className="text-xl font-bold text-blue-600 mt-1">{w.metrics.applications.toLocaleString()}</p>
                            {w.goalCount && (
                                <div className="mt-1">
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((w.metrics.applications / w.goalCount) * 100, 100)}%` }} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{((w.metrics.applications / w.goalCount) * 100).toFixed(1)}% of goal</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Tabbed Content */}
            <div className="flex gap-8">
                <nav className="w-48 shrink-0">
                    <ul className="space-y-1">
                        {availableTabs.map((tab) => (
                            <li key={tab.id}>
                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                        activeTab === tab.id
                                            ? "bg-slate-100 text-slate-900"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex-1 min-w-0">
                    {activeTab === "settings" && <WindowSettingsTab window={w} />}
                    {activeTab === "data" && (isDynamic ? <DynamicDataSourceTab window={w} /> : <StaticDataSourceTab />)}
                    {activeTab === "refresh-history" && isDynamic && w.refreshLog && <RefreshHistoryTab refreshLog={w.refreshLog} />}
                    {activeTab === "products" && <ProductsTab products={w.products} />}
                    {activeTab === "acceptance" && <PlaceholderTab title="Acceptance Rules" description="What happens when a customer redeems a preapproved offer in the storefront." />}
                    {activeTab === "reconciliation" && <PlaceholderTab title="Reconciliation Rules" description="What happens when offers are redeemed outside the platform (e.g., in your LOS)." />}
                    {activeTab === "reporting" && <ReportingTab metrics={w.metrics} isDynamic={isDynamic} />}
                </div>
            </div>
        </div>
    );
}
