"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useStore, Campaign } from "@/context/StoreContext";
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
    Infinity,
} from "lucide-react";

// Import tab components
import CampaignSettingsTab from "@/components/admin/campaigns/CampaignSettingsTab";
import FileProcessingTab from "@/components/admin/campaigns/FileProcessingTab";
import ProductsTab from "@/components/admin/campaigns/ProductsTab";
import AcceptanceRulesTab from "@/components/admin/campaigns/AcceptanceRulesTab";
import ReconciliationRulesTab from "@/components/admin/campaigns/ReconciliationRulesTab";

type TabId = "settings" | "file-processing" | "products" | "offer-lifecycle" | "acceptance-rules" | "reconciliation-rules" | "data-export";

interface Tab {
    id: TabId;
    label: string;
    targetedOnly?: boolean;
    perpetualOnly?: boolean;
    excludePerpetual?: boolean;
}

const TABS: Tab[] = [
    { id: "settings", label: "Campaign Settings" },
    { id: "file-processing", label: "File Processing", targetedOnly: true },
    { id: "products", label: "Products" },
    { id: "offer-lifecycle", label: "Offer Lifecycle", perpetualOnly: true },
    { id: "acceptance-rules", label: "Acceptance Rules", excludePerpetual: true },
    { id: "reconciliation-rules", label: "Reconciliation Rules", excludePerpetual: true },
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
        perpetual: { label: "Perpetual", icon: Infinity, className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
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

// Offer Lifecycle Tab for perpetual campaigns
function OfferLifecycleTab({ campaign, onUpdate }: { campaign: Campaign; onUpdate: (updates: Partial<Campaign>) => void }) {
    // Get all products from all sections
    const allProducts = [
        ...campaign.featuredOffersSection.products,
        ...campaign.sections.flatMap((s) => s.products),
    ];

    const getStatusBadge = (status?: string) => {
        const configs: Record<string, { label: string; className: string }> = {
            active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            expiring_soon: { label: "Expiring Soon", className: "bg-amber-50 text-amber-700 border-amber-200" },
            expired: { label: "Expired", className: "bg-slate-100 text-slate-500 border-slate-200" },
            queued: { label: "Queued", className: "bg-blue-50 text-blue-700 border-blue-200" },
        };
        const config = configs[status || "active"];
        return (
            <span className={cn("inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border", config.className)}>
                {config.label}
            </span>
        );
    };

    const getExpirationLabel = (product: typeof allProducts[0]) => {
        if (!product.perpetualSettings) return "No lifecycle configured";

        switch (product.perpetualSettings.expirationTrigger) {
            case "manual":
                return "Until manually removed";
            case "days":
                return `${product.perpetualSettings.expirationDays} days`;
            case "redemptions":
                return `${product.redemptionCount || 0} / ${product.perpetualSettings.expirationRedemptions} redemptions`;
            case "date":
                return `Until ${new Date(product.perpetualSettings.expirationDate || "").toLocaleDateString()}`;
            default:
                return "—";
        }
    };

    const getExpirationProgress = (product: typeof allProducts[0]) => {
        if (!product.perpetualSettings) return null;

        if (product.perpetualSettings.expirationTrigger === "redemptions" && product.perpetualSettings.expirationRedemptions) {
            const progress = ((product.redemptionCount || 0) / product.perpetualSettings.expirationRedemptions) * 100;
            return Math.min(progress, 100);
        }

        if (product.perpetualSettings.expirationTrigger === "days" && product.addedAt && product.perpetualSettings.expirationDays) {
            const addedDate = new Date(product.addedAt);
            const expiresDate = new Date(addedDate);
            expiresDate.setDate(expiresDate.getDate() + product.perpetualSettings.expirationDays);
            const totalDays = product.perpetualSettings.expirationDays;
            const daysElapsed = Math.floor((Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
            const progress = (daysElapsed / totalDays) * 100;
            return Math.min(progress, 100);
        }

        return null;
    };

    const handleRemoveOffer = (productId: string) => {
        // Remove from featured section
        const updatedFeatured = {
            ...campaign.featuredOffersSection,
            products: campaign.featuredOffersSection.products.filter((p) => p.id !== productId),
        };

        // Remove from other sections
        const updatedSections = campaign.sections.map((section) => ({
            ...section,
            products: section.products.filter((p) => p.id !== productId),
        }));

        onUpdate({
            featuredOffersSection: updatedFeatured,
            sections: updatedSections,
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-slate-900">Offer Lifecycle</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Manage how offers rotate, expire, and get replaced in this perpetual campaign.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Active Offers</p>
                    <p className="text-2xl font-semibold text-slate-900 mt-1">
                        {allProducts.filter((p) => p.status === "active" || !p.status).length}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Expiring Soon</p>
                    <p className="text-2xl font-semibold text-amber-600 mt-1">
                        {allProducts.filter((p) => p.status === "expiring_soon").length}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Total Redemptions</p>
                    <p className="text-2xl font-semibold text-slate-900 mt-1">
                        {allProducts.reduce((sum, p) => sum + (p.redemptionCount || 0), 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Queued Offers</p>
                    <p className="text-2xl font-semibold text-blue-600 mt-1">
                        {allProducts.filter((p) => p.status === "queued").length}
                    </p>
                </div>
            </div>

            {/* Active Offers Table */}
            <div className="bg-white rounded-xl border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">Active Offers</h3>
                </div>
                {allProducts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No offers configured. Add products to this campaign to get started.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Offer
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Lifecycle
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Progress
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Redemptions
                                </th>
                                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    On Expiration
                                </th>
                                <th className="w-24 px-4 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {allProducts.map((product) => {
                                const progress = getExpirationProgress(product);
                                return (
                                    <tr key={product.id} className="border-b border-slate-100 last:border-b-0">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{product.productName}</p>
                                                <p className="text-xs text-slate-500">
                                                    Added {product.addedAt ? new Date(product.addedAt).toLocaleDateString() : "—"}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(product.status)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {getExpirationLabel(product)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {progress !== null ? (
                                                <div className="w-24">
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all",
                                                                progress >= 80 ? "bg-amber-500" : "bg-emerald-500"
                                                            )}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">{Math.round(progress)}%</p>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {(product.redemptionCount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {product.perpetualSettings?.expirationAction === "remove" && "Remove"}
                                            {product.perpetualSettings?.expirationAction === "replace" && "Replace with next"}
                                            {product.perpetualSettings?.expirationAction === "notify" && "Notify admin"}
                                            {!product.perpetualSettings?.expirationAction && "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleRemoveOffer(product.id)}
                                                className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Infinity className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-sm font-medium text-indigo-900">About Perpetual Campaigns</h4>
                        <p className="text-xs text-indigo-700 mt-1">
                            Offers in perpetual campaigns rotate automatically based on their lifecycle settings.
                            When an offer expires, the configured action (remove, replace, or notify) will be executed.
                            You can configure these settings when adding new products to the campaign.
                        </p>
                    </div>
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
    const { campaigns, updateCampaign } = useStore();
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
        return true;
    });

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
                                <Infinity className="w-4 h-4 text-indigo-600" />
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

                {/* Tab Content */}
                <div className="flex-1 min-w-0">
                    {activeTab === "settings" && (
                        <CampaignSettingsTab
                            campaign={campaign}
                            onUpdate={handleUpdateCampaign}
                        />
                    )}
                    {activeTab === "file-processing" && campaign.type === "targeted" && (
                        <FileProcessingTab
                            campaign={campaign}
                            onUpdate={handleUpdateCampaign}
                        />
                    )}
                    {activeTab === "products" && (
                        <ProductsTab
                            campaign={campaign}
                            onUpdate={handleUpdateCampaign}
                        />
                    )}
                    {activeTab === "offer-lifecycle" && campaign.type === "perpetual" && (
                        <OfferLifecycleTab
                            campaign={campaign}
                            onUpdate={handleUpdateCampaign}
                        />
                    )}
                    {activeTab === "acceptance-rules" && (
                        <AcceptanceRulesTab campaign={campaign} onUpdate={handleUpdateCampaign} />
                    )}
                    {activeTab === "reconciliation-rules" && (
                        <ReconciliationRulesTab campaign={campaign} onUpdate={handleUpdateCampaign} />
                    )}
                    {activeTab === "data-export" && (
                        <DataExportTab campaign={campaign} />
                    )}
                </div>
            </div>
        </div>
    );
}
