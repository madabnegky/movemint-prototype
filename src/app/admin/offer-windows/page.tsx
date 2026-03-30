"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Plus,
    Play,
    Circle,
    CheckCircle2,
    RefreshCw,
    Calendar,
    Clock,
    X,
    Info,
} from "lucide-react";

// --- Types ---

type OfferWindowStatus = "live" | "draft" | "completed";
type DataSourceType = "none" | "static" | "dynamic";
type TimeframeType = "dates" | "evergreen";

interface OfferWindowSummary {
    id: string;
    name: string;
    status: OfferWindowStatus;
    dataSource: DataSourceType;
    timeframe: TimeframeType;
    startDate?: string;
    endDate?: string;
    tags: string[];
    productCount: number;
    offersGenerated: number;
    applications: number;
    conversion: number;
    // Dynamic-specific
    refreshSchedule?: string;
    lastRefresh?: { date: string; added: number; removed: number };
    goalCount?: number;
    goalType?: string;
}

// --- Mock data ---

const MOCK_WINDOWS: OfferWindowSummary[] = [
    {
        id: "ow-1",
        name: "Summer Auto Loan Push",
        status: "live",
        dataSource: "static",
        timeframe: "dates",
        startDate: "2026-06-01",
        endDate: "2026-08-31",
        tags: ["Auto Lending"],
        productCount: 2,
        offersGenerated: 4800,
        applications: 312,
        conversion: 6.5,
        goalCount: 500,
        goalType: "applications",
    },
    {
        id: "ow-2",
        name: "Pre-Approved Auto — Rolling",
        status: "live",
        dataSource: "dynamic",
        timeframe: "evergreen",
        tags: ["Auto Lending"],
        productCount: 1,
        offersGenerated: 6200,
        applications: 489,
        conversion: 7.9,
        refreshSchedule: "Every Monday",
        lastRefresh: { date: "Mar 28", added: 342, removed: 18 },
    },
    {
        id: "ow-3",
        name: "Balance Transfer Promo Q2",
        status: "live",
        dataSource: "static",
        timeframe: "dates",
        startDate: "2026-04-01",
        endDate: "2026-06-30",
        tags: ["Credit Cards"],
        productCount: 1,
        offersGenerated: 3100,
        applications: 87,
        conversion: 2.8,
        goalCount: 200,
        goalType: "transfers",
    },
    {
        id: "ow-4",
        name: "Holiday CD Special",
        status: "draft",
        dataSource: "static",
        timeframe: "dates",
        startDate: "2026-11-15",
        endDate: "2026-12-31",
        tags: ["Deposits"],
        productCount: 1,
        offersGenerated: 0,
        applications: 0,
        conversion: 0,
        goalCount: 300,
        goalType: "new CDs",
    },
    {
        id: "ow-5",
        name: "Spring HELOC Blitz",
        status: "completed",
        dataSource: "static",
        timeframe: "dates",
        startDate: "2026-03-01",
        endDate: "2026-04-30",
        tags: ["Home Equity"],
        productCount: 2,
        offersGenerated: 3200,
        applications: 198,
        conversion: 6.2,
    },
];

const ALL_TAGS = ["Auto Lending", "Credit Cards", "Deposits", "Home Equity"];

// --- Components ---

function StatusBadge({ status }: { status: OfferWindowStatus }) {
    const config = {
        live: { label: "Live", icon: Play, dotClass: "bg-emerald-500", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        draft: { label: "Draft", icon: Circle, dotClass: "bg-slate-400", className: "bg-slate-100 text-slate-600 border-slate-200" },
        completed: { label: "Completed", icon: CheckCircle2, dotClass: "bg-blue-500", className: "bg-blue-50 text-blue-700 border-blue-200" },
    };
    const c = config[status];
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border", c.className)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", c.dotClass)} />
            {c.label}
        </span>
    );
}

function DataSourceBadge({ type }: { type: DataSourceType }) {
    if (type === "none") return null;
    const config = {
        static: { label: "Static File", className: "bg-purple-50 text-purple-700 border-purple-200" },
        dynamic: { label: "Dynamic File", icon: RefreshCw, className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    };
    const c = config[type];
    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border", c.className)}>
            {type === "dynamic" && <RefreshCw className="w-3 h-3" />}
            {c.label}
        </span>
    );
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Create Modal
function CreateOfferWindowModal({ isOpen, onClose, onCreate }: {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
}) {
    const [name, setName] = useState("");
    const [timeframe, setTimeframe] = useState<TimeframeType>("dates");
    const [dataSource, setDataSource] = useState<DataSourceType>("static");
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        onCreate(name);
        setName("");
        setTimeframe("dates");
        setDataSource("static");
        setTags([]);
        onClose();
    };

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-semibold text-slate-900">Create Offer Window</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder='e.g., "Summer Auto Loan Push", "Q3 CD Promo"'
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Tags <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map((tag) => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600">
                                            {tag}
                                            <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="text-slate-400 hover:text-slate-600">&times;</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                                placeholder="Type a tag and press Enter..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent"
                            />
                            <p className="text-xs text-slate-400 mt-1">Tags help you filter and group offer windows for reporting.</p>
                        </div>

                        {/* Goal */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Goal <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    placeholder="500"
                                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent"
                                />
                                <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent bg-white">
                                    <option>Applications</option>
                                    <option>Preapprovals</option>
                                    <option>Redemptions</option>
                                </select>
                            </div>
                        </div>

                        {/* Timeframe */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Timeframe</label>
                            <div className="space-y-3">
                                <label className={cn(
                                    "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                    timeframe === "dates" ? "border-blue-200 bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"
                                )}>
                                    <input type="radio" name="timeframe" checked={timeframe === "dates"} onChange={() => setTimeframe("dates")} className="mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Date range</p>
                                        <p className="text-xs text-slate-500">Offers are active during a specific period</p>
                                        {timeframe === "dates" && (
                                            <div className="grid grid-cols-2 gap-3 mt-2">
                                                <input type="date" className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent" />
                                                <input type="date" className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent" />
                                            </div>
                                        )}
                                    </div>
                                </label>
                                <label className={cn(
                                    "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                    timeframe === "evergreen" ? "border-blue-200 bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"
                                )}>
                                    <input type="radio" name="timeframe" checked={timeframe === "evergreen"} onChange={() => setTimeframe("evergreen")} className="mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Evergreen</p>
                                        <p className="text-xs text-slate-500">No end date — runs until you stop it</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Data Source */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Data Source</label>
                            <div className="space-y-3">
                                <label className={cn(
                                    "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                    dataSource === "none" ? "border-blue-200 bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"
                                )}>
                                    <input type="radio" name="datasource" checked={dataSource === "none"} onChange={() => setDataSource("none")} className="mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">No data file</p>
                                        <p className="text-xs text-slate-500">Offers shown to everyone — no targeting or personalization</p>
                                    </div>
                                </label>
                                <label className={cn(
                                    "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                    dataSource === "static" ? "border-blue-200 bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"
                                )}>
                                    <input type="radio" name="datasource" checked={dataSource === "static"} onChange={() => setDataSource("static")} className="mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Static file upload</p>
                                        <p className="text-xs text-slate-500">Upload a customer file once. Offers are generated and locked for the duration.</p>
                                    </div>
                                </label>
                                <label className={cn(
                                    "flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                                    dataSource === "dynamic" ? "border-blue-200 bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"
                                )}>
                                    <input type="radio" name="datasource" checked={dataSource === "dynamic"} onChange={() => setDataSource("dynamic")} className="mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            Dynamic file{" "}
                                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-100 text-indigo-700 ml-1">NEW</span>
                                        </p>
                                        <p className="text-xs text-slate-500">Upload a file and refresh it anytime. Offers update automatically when new data arrives.</p>
                                        {dataSource === "dynamic" && (
                                            <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                                                <p className="text-xs font-medium text-slate-700 mb-1.5">Refresh method:</p>
                                                <div className="space-y-1.5">
                                                    <label className="flex items-center gap-2 text-xs text-slate-600">
                                                        <input type="radio" name="refresh" defaultChecked className="scale-90" />
                                                        Manual — upload a new file whenever you want
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs text-slate-600">
                                                        <input type="radio" name="refresh" className="scale-90" />
                                                        Scheduled — pull from SFTP/API on a cadence
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl sticky bottom-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name}
                            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Create Offer Window
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function OfferWindowsPage() {
    const router = useRouter();
    const [showCreate, setShowCreate] = useState(false);
    const [windows, setWindows] = useState<OfferWindowSummary[]>(MOCK_WINDOWS);
    const [statusFilter, setStatusFilter] = useState<OfferWindowStatus | "all">("all");
    const [tagFilter, setTagFilter] = useState<string | null>(null);

    const filtered = windows.filter(w => {
        if (statusFilter !== "all" && w.status !== statusFilter) return false;
        if (tagFilter && !w.tags.includes(tagFilter)) return false;
        return true;
    });

    const handleCreate = (name: string) => {
        const newWindow: OfferWindowSummary = {
            id: `ow-${Date.now()}`,
            name,
            status: "draft",
            dataSource: "static",
            timeframe: "dates",
            tags: [],
            productCount: 0,
            offersGenerated: 0,
            applications: 0,
            conversion: 0,
        };
        setWindows([newWindow, ...windows]);
    };

    return (
        <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Offer Windows</h1>
                    <p className="text-sm text-slate-500 mt-1">Targeted marketing pushes with specific audiences, timeframes, and goals.</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Offer Window
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 mb-5">
                <span className="text-xs text-slate-500 font-medium">Filter:</span>
                {(["all", "live", "draft", "completed"] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full transition-colors",
                            statusFilter === s
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
                <div className="w-px h-4 bg-slate-200 mx-1" />
                {ALL_TAGS.map((tag) => (
                    <button
                        key={tag}
                        onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                        className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full transition-colors",
                            tagFilter === tag
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {/* Offer Window Cards */}
            <div className="space-y-3">
                {filtered.map((w) => (
                    <div
                        key={w.id}
                        onClick={() => router.push(`/admin/offer-windows/${w.id}`)}
                        className={cn(
                            "bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer",
                            w.status === "completed" && "opacity-60 hover:opacity-80"
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="text-base font-semibold text-slate-900">{w.name}</h3>
                                    <StatusBadge status={w.status} />
                                    <DataSourceBadge type={w.dataSource} />
                                    {w.tags.map((tag) => (
                                        <span key={tag} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                    {w.timeframe === "dates" && w.startDate && w.endDate && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {formatDate(w.startDate)} – {formatDate(w.endDate)}
                                        </span>
                                    )}
                                    {w.timeframe === "evergreen" && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Evergreen (no end date)
                                        </span>
                                    )}
                                    {w.refreshSchedule && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            Refreshes {w.refreshSchedule.toLowerCase()}
                                        </span>
                                    )}
                                    {w.goalCount && w.goalType && (
                                        <span>Goal: {w.goalCount.toLocaleString()} {w.goalType}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
                                    <span>{w.productCount} product{w.productCount !== 1 ? "s" : ""}</span>
                                    {w.offersGenerated > 0 ? (
                                        <>
                                            <span>{w.offersGenerated.toLocaleString()} offers generated</span>
                                            <span>{w.applications.toLocaleString()} applications</span>
                                            <span className="text-emerald-600 font-medium">{w.conversion}% conversion</span>
                                        </>
                                    ) : (
                                        <span className="text-amber-600">Not yet processed</span>
                                    )}
                                    {w.lastRefresh && (
                                        <span className="text-indigo-600">
                                            Last refresh: {w.lastRefresh.date} — +{w.lastRefresh.added} added, -{w.lastRefresh.removed} removed
                                        </span>
                                    )}
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 mt-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="text-center py-12 text-sm text-slate-500">
                        No offer windows match the current filters.
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <CreateOfferWindowModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onCreate={handleCreate}
            />
        </div>
    );
}
