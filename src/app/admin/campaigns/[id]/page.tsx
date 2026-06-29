"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useStore, Campaign, FeatureFlags } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Play,
    Circle,
    Target,
    Users,
    Rocket,
    AlertCircle,
    Zap,
} from "lucide-react";

// Import tab components
import CampaignSettingsTab from "@/components/admin/campaigns/CampaignSettingsTab";
import FileProcessingTab from "@/components/admin/campaigns/FileProcessingTab";
import ProductsTab from "@/components/admin/campaigns/ProductsTab";
import AcceptanceRulesTab from "@/components/admin/campaigns/AcceptanceRulesTab";
import ReconciliationRulesTab from "@/components/admin/campaigns/ReconciliationRulesTab";
import AiOptimizationTab from "@/components/admin/campaigns/AiOptimizationTab";

type TabId = "settings" | "file-processing" | "products" | "member-file-upload" | "acceptance-rules" | "reconciliation-rules" | "ai-optimization" | "data-export";

interface Tab {
    id: TabId;
    label: string;
    targetedOnly?: boolean;
    perpetualOnly?: boolean;
    excludePerpetual?: boolean;
    requiresFlag?: keyof FeatureFlags;
}

const TABS: Tab[] = [
    { id: "settings", label: "Campaign Settings" },
    { id: "file-processing", label: "File Processing", targetedOnly: true },
    { id: "products", label: "Products" },
    { id: "member-file-upload", label: "Member File Upload", perpetualOnly: true },
    { id: "acceptance-rules", label: "Acceptance Rules", excludePerpetual: true },
    { id: "reconciliation-rules", label: "Reconciliation Rules", excludePerpetual: true },
    { id: "ai-optimization", label: "AI Optimization", requiresFlag: "campaigns_aiOptimization" },
    { id: "data-export", label: "Data Export" },
];

// Status badge component
function StatusBadge({ status }: { status: Campaign["status"] }) {
    const config = {
        draft: { label: "Draft", icon: Circle, className: "bg-slate-100 text-slate-600 border-slate-200" },
        pending: { label: "Pending", icon: Clock, className: "bg-amber-50 text-amber-700 border-amber-200" },
        live: { label: "Live", icon: Play, className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        completed: { label: "Completed", icon: CheckCircle2, className: "bg-blue-50 text-blue-700 border-blue-200" },
    };
    const { label, icon: Icon, className } = config[status];

    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border", className)}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

// Campaign type badge
function TypeBadge({ type }: { type: Campaign["type"] }) {
    const config = {
        targeted: { label: "Targeted", icon: Target, className: "bg-purple-50 text-purple-700 border-purple-200" },
        untargeted: { label: "Untargeted", icon: Users, className: "bg-slate-50 text-slate-700 border-slate-200" },
        perpetual: { label: "Real-Time / Always-On", icon: Zap, className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    };
    const { label, icon: Icon, className } = config[type];

    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border", className)}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

// Pending status indicator for campaign readiness
function PendingStatusIndicator({ campaign }: { campaign: Campaign }) {
    const issues: string[] = [];

    if (campaign.type === "targeted") {
        if (!campaign.customerFile) {
            issues.push("Customer file not uploaded");
        }
        if (!campaign.enhancedCustomerFile) {
            issues.push("Enhanced customer file not uploaded");
        }
    }

    if (campaign.featuredOffersSection.products.length === 0 && campaign.sections.every(s => s.products.length === 0)) {
        issues.push("No products added to campaign");
    }

    const isReady = issues.length === 0;

    if (campaign.status === "live" || campaign.status === "completed") {
        return null;
    }

    return (
        <div className={cn(
            "flex items-start gap-2 px-4 py-3 rounded-lg border text-sm",
            isReady
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
        )}>
            {isReady ? (
                <>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">Ready for Launch</p>
                        <p className="text-emerald-700">This campaign is configured and ready to go live.</p>
                    </div>
                </>
            ) : (
                <>
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">Configuration Incomplete</p>
                        <ul className="mt-1 space-y-0.5 text-amber-700">
                            {issues.map((issue, idx) => (
                                <li key={idx}>• {issue}</li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}

// Member File Upload Tab for real-time / always-on campaigns
function MemberFileUploadTab() {
    const [uploadState, setUploadState] = useState<"idle" | "processing" | "success">("idle");
    const [dragOver, setDragOver] = useState(false);

    const handleFile = () => {
        setUploadState("processing");
        setTimeout(() => setUploadState("success"), 1800);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFile();
    };

    const handleReset = () => setUploadState("idle");

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-slate-900">Member File Upload</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Upload a new or updated member file at any time. The platform will process the file and generate or refresh offers for affected members — independent of campaign start and end dates.
                </p>
            </div>

            {/* Info banner */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-sm font-medium text-indigo-900">Real-Time Offer Triggering</h4>
                        <p className="text-xs text-indigo-700 mt-1">
                            Offers are generated using the eligibility rules and expiration settings configured on each product. One offer per product type per member. Conflict resolution is applied at generation time — the winning offer is delivered, losers are not stored.
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload area */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Upload Member File</h3>

                {uploadState === "idle" && (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-10 text-center transition-colors",
                            dragOver
                                ? "border-indigo-400 bg-indigo-50"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">Drop your member file here</p>
                                <p className="text-xs text-slate-500 mt-1">CSV, TXT, or fixed-width — any upload triggers offer generation</p>
                            </div>
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    className="sr-only"
                                    onChange={handleFile}
                                    accept=".csv,.txt,.tsv"
                                />
                                <span className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    Browse files
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {uploadState === "processing" && (
                    <div className="border-2 border-dashed border-indigo-300 rounded-xl p-10 text-center bg-indigo-50">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-indigo-500 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-indigo-800">Processing member file...</p>
                                <p className="text-xs text-indigo-600 mt-1">Evaluating eligibility rules and generating offers</p>
                            </div>
                            <div className="w-48 h-1.5 bg-indigo-200 rounded-full overflow-hidden mt-1">
                                <div className="h-full bg-indigo-500 rounded-full animate-pulse w-2/3" />
                            </div>
                        </div>
                    </div>
                )}

                {uploadState === "success" && (
                    <div className="border-2 border-dashed border-emerald-300 rounded-xl p-10 text-center bg-emerald-50">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-800">Offers updated successfully</p>
                                <p className="text-xs text-emerald-600 mt-1">3 generated · 1 updated · 0 removed</p>
                            </div>
                            <button
                                onClick={handleReset}
                                className="mt-1 text-xs text-emerald-700 underline hover:text-emerald-800"
                            >
                                Upload another file
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Product expiration reference */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-900 mb-1">Offer Expiration</h3>
                <p className="text-sm text-slate-500 mb-4">
                    Expiration is configured per product and is independent of campaign dates. Offers generated from bureau-enhanced files must carry an expiration — the default is 60 days, aligning with pre-qualification data freshness guidance.
                </p>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700">Default: 60 days</span>
                    <span className="text-slate-400">·</span>
                    <span>Configurable per product in the Products tab</span>
                </div>
            </div>
        </div>
    );
}


// Placeholder for Data Export tab
function DataExportTab({ campaign: _campaign }: { campaign: Campaign }) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-slate-900">Data Export</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Export campaign data and reports.
                </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <div className="max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="font-medium text-slate-900">Data Export</h3>
                    <p className="text-sm text-slate-500 mt-2">
                        Export campaign configuration, customer data, and application reports.
                        Coming soon in a future update.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { campaigns, updateCampaign, featureFlags } = useStore();
    const [activeTab, setActiveTab] = useState<TabId>("settings");

    const campaign = campaigns.find((c) => c.id === id);

    if (!campaign) {
        return (
            <div className="max-w-6xl">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-slate-900">Campaign not found</h2>
                    <p className="text-slate-500 mt-2">The campaign you&apos;re looking for doesn&apos;t exist.</p>
                    <Link
                        href="/admin/campaigns"
                        className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Campaigns
                    </Link>
                </div>
            </div>
        );
    }

    const handleUpdateCampaign = (updates: Partial<Campaign>) => {
        updateCampaign({ ...campaign, ...updates });
    };

    const handleLaunch = () => {
        updateCampaign({ ...campaign, status: "live" });
    };

    const handleMarkReady = () => {
        updateCampaign({ ...campaign, status: "pending" });
    };

    // Filter tabs based on campaign type
    const availableTabs = TABS.filter((tab) => {
        // Targeted-only tabs
        if (tab.targetedOnly && campaign.type !== "targeted") return false;
        // Perpetual-only tabs
        if (tab.perpetualOnly && campaign.type !== "perpetual") return false;
        // Tabs excluded from perpetual campaigns
        if (tab.excludePerpetual && campaign.type === "perpetual") return false;
        // Feature-flagged tabs
        if (tab.requiresFlag && !featureFlags[tab.requiresFlag]) return false;
        return true;
    });

    // If the active tab isn't available (e.g. its flag was turned off while
    // viewing it), fall back to the first available tab — derived, not stateful,
    // so we never read a hidden tab.
    const effectiveTab: TabId = availableTabs.some((t) => t.id === activeTab)
        ? activeTab
        : availableTabs[0]?.id ?? "settings";

    // Check if campaign is ready to launch
    const canLaunch = campaign.status === "pending" || (
        campaign.status === "draft" &&
        (campaign.type === "untargeted" || (campaign.customerFile && campaign.enhancedCustomerFile)) &&
        (campaign.featuredOffersSection.products.length > 0 || campaign.sections.some(s => s.products.length > 0))
    );

    const canMarkReady = campaign.status === "draft" &&
        (campaign.type === "untargeted" || (campaign.customerFile && campaign.enhancedCustomerFile)) &&
        (campaign.featuredOffersSection.products.length > 0 || campaign.sections.some(s => s.products.length > 0));

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/admin/campaigns"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Campaigns
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
                            <TypeBadge type={campaign.type} />
                            <StatusBadge status={campaign.status} />
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Created on {new Date(campaign.createdAt).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric"
                            })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {campaign.type !== "perpetual" && campaign.status === "draft" && canMarkReady && (
                            <button
                                onClick={handleMarkReady}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Mark as Ready
                            </button>
                        )}
                        {campaign.type !== "perpetual" && (campaign.status === "draft" || campaign.status === "pending") && (
                            <button
                                onClick={handleLaunch}
                                disabled={!canLaunch}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Rocket className="w-4 h-4" />
                                Launch Campaign
                            </button>
                        )}
                        {campaign.type === "perpetual" && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <Zap className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-medium text-indigo-700">Always Live</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Indicator */}
            {campaign.type !== "perpetual" && (campaign.status === "draft" || campaign.status === "pending") && (
                <div className="mb-6">
                    <PendingStatusIndicator campaign={campaign} />
                </div>
            )}

            {/* Main Content with Left Sidebar Navigation */}
            <div className="flex gap-8">
                {/* Left Sidebar Navigation */}
                <nav className="w-48 shrink-0">
                    <ul className="space-y-1">
                        {availableTabs.map((tab) => (
                            <li key={tab.id}>
                                <button
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                        effectiveTab === tab.id
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

                {/* Tab Content */}
                <div className="flex-1 min-w-0">
                    {effectiveTab === "settings" && (
                        <CampaignSettingsTab
                            campaign={campaign}
                            onUpdate={handleUpdateCampaign}
                        />
                    )}
                    {effectiveTab === "file-processing" && campaign.type === "targeted" && (
                        <FileProcessingTab
                            campaign={campaign}
                            onUpdate={handleUpdateCampaign}
                        />
                    )}
                    {effectiveTab === "products" && (
                        <ProductsTab
                            campaign={campaign}
                            onUpdate={handleUpdateCampaign}
                        />
                    )}
                    {effectiveTab === "member-file-upload" && campaign.type === "perpetual" && (
                        <MemberFileUploadTab />
                    )}
                    {effectiveTab === "acceptance-rules" && (
                        <AcceptanceRulesTab campaign={campaign} onUpdate={handleUpdateCampaign} />
                    )}
                    {effectiveTab === "reconciliation-rules" && (
                        <ReconciliationRulesTab campaign={campaign} onUpdate={handleUpdateCampaign} />
                    )}
                    {effectiveTab === "ai-optimization" && featureFlags.campaigns_aiOptimization && (
                        <AiOptimizationTab campaign={campaign} onUpdate={handleUpdateCampaign} />
                    )}
                    {effectiveTab === "data-export" && (
                        <DataExportTab campaign={campaign} />
                    )}
                </div>
            </div>
        </div>
    );
}
