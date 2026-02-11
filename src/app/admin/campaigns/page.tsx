"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore, Campaign, CampaignType } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import {
    MoreHorizontal,
    Target,
    Users,
    X,
    Info,
    ChevronUp,
    ChevronDown,
    Rocket,
    Infinity,
} from "lucide-react";

type SortField = "name" | "startDate" | "endDate" | "type";
type SortDirection = "asc" | "desc";

// Pending status types
type PendingStatus = "processing_required" | "ready_for_launch" | "generating_offers";

// Get pending status for a campaign
function getPendingStatus(campaign: Campaign): PendingStatus {
    // Check if it's a targeted campaign that needs file processing
    if (campaign.type === "targeted") {
        if (!campaign.customerFile || !campaign.enhancedCustomerFile) {
            return "processing_required";
        }
    }
    // Check if it has products configured
    const hasProducts =
        campaign.featuredOffersSection.products.length > 0 ||
        campaign.sections.some((s) => s.products.length > 0);

    if (!hasProducts) {
        return "processing_required";
    }

    // Mock: randomly show generating offers for some campaigns
    if (campaign.id.endsWith("2") || campaign.id.endsWith("7")) {
        return "generating_offers";
    }

    return "ready_for_launch";
}

// Pending status badge component
function PendingStatusBadge({ status }: { status: PendingStatus }) {
    const config = {
        processing_required: {
            label: "Processing Required",
            dotClass: "bg-amber-500",
            textClass: "text-amber-700",
        },
        ready_for_launch: {
            label: "Ready for Launch",
            dotClass: "bg-blue-500",
            textClass: "text-blue-700",
        },
        generating_offers: {
            label: "Generating Offers...",
            dotClass: "bg-purple-500 animate-pulse",
            textClass: "text-purple-700",
        },
    };
    const { label, dotClass, textClass } = config[status];

    return (
        <span className={cn("inline-flex items-center gap-1.5 text-sm", textClass)}>
            <span className={cn("w-2 h-2 rounded-full", dotClass)} />
            {label}
        </span>
    );
}

// Format date for display
function formatDate(dateStr?: string): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    }).replace(/\//g, "/");
}

// Campaign type badge component
function CampaignTypeBadge({ type }: { type: CampaignType }) {
    const config = {
        targeted: {
            label: "Targeted",
            icon: Target,
            className: "bg-purple-50 text-purple-700 border-purple-200",
        },
        untargeted: {
            label: "Untargeted",
            icon: Users,
            className: "bg-slate-50 text-slate-700 border-slate-200",
        },
        perpetual: {
            label: "Perpetual",
            icon: Infinity,
            className: "bg-indigo-50 text-indigo-700 border-indigo-200",
        },
    };
    const { label, icon: Icon, className } = config[type];

    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border", className)}>
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

// Sortable column header
function SortableHeader({
    label,
    field,
    currentSort,
    currentDirection,
    onSort,
}: {
    label: string;
    field: SortField;
    currentSort: SortField;
    currentDirection: SortDirection;
    onSort: (field: SortField) => void;
}) {
    const isActive = currentSort === field;
    return (
        <button
            onClick={() => onSort(field)}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
        >
            {label}
            <span className="flex flex-col">
                <ChevronUp
                    className={cn(
                        "w-3 h-3 -mb-1",
                        isActive && currentDirection === "asc" ? "text-slate-900" : "text-slate-300"
                    )}
                />
                <ChevronDown
                    className={cn(
                        "w-3 h-3 -mt-1",
                        isActive && currentDirection === "desc" ? "text-slate-900" : "text-slate-300"
                    )}
                />
            </span>
        </button>
    );
}

// Campaign row menu
function CampaignRowMenu({
    campaign,
    onOpen,
    onDuplicate,
    onCreateUnionCreditCopy,
    onExport,
    onMarkAsReady,
    onDelete,
}: {
    campaign: Campaign;
    onOpen: () => void;
    onDuplicate: () => void;
    onCreateUnionCreditCopy: () => void;
    onExport: () => void;
    onMarkAsReady: () => void;
    onDelete: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const pendingStatus = campaign.status === "pending" || campaign.status === "draft"
        ? getPendingStatus(campaign)
        : null;

    if (showDeleteConfirm) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Delete?</span>
                <button
                    onClick={() => {
                        onDelete();
                        setShowDeleteConfirm(false);
                    }}
                    className="px-2 py-1 text-xs font-medium text-white bg-rose-600 rounded hover:bg-rose-700 transition-colors"
                >
                    Confirm
                </button>
                <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-56 bg-slate-800 rounded-lg shadow-lg py-1 z-50">
                        <button
                            onClick={() => {
                                onOpen();
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-slate-700"
                        >
                            Open
                        </button>
                        <button
                            onClick={() => {
                                onDuplicate();
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-slate-700"
                        >
                            Duplicate
                        </button>
                        <button
                            onClick={() => {
                                onCreateUnionCreditCopy();
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-slate-700"
                        >
                            Create a Union Credit Copy
                        </button>
                        <button
                            onClick={() => {
                                onExport();
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-slate-700"
                        >
                            Export
                        </button>
                        {pendingStatus === "ready_for_launch" && (
                            <button
                                onClick={() => {
                                    onMarkAsReady();
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-slate-700"
                            >
                                Mark as Ready
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setShowDeleteConfirm(true);
                                setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-slate-700"
                        >
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// Create Campaign Modal
function CreateCampaignModal({ isOpen, onClose, onCreate, perpetualEnabled }: {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (campaign: Omit<Campaign, "id" | "createdAt" | "featuredOffersSection" | "sections">) => void;
    perpetualEnabled: boolean;
}) {
    const [name, setName] = useState("");
    const [type, setType] = useState<CampaignType>("targeted");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        // Perpetual campaigns don't need dates
        if (type !== "perpetual" && !startDate) return;

        onCreate({
            name,
            type,
            status: type === "perpetual" ? "live" : "draft", // Perpetual campaigns are always live
            startDate: type === "perpetual" ? new Date().toISOString().split("T")[0] : startDate,
            endDate: endDate || undefined,
            acceptanceRules: [],
            reconciliationRule: 'no_change',
            customReconciliationRules: [],
            productReconciliationRules: [],
        });

        // Reset form
        setName("");
        setType("targeted");
        setStartDate("");
        setEndDate("");
        onClose();
    };

    const getTypeDescription = () => {
        switch (type) {
            case "targeted":
                return "Targeted campaigns use customer file data to determine offers, pre-approvals, and rules.";
            case "untargeted":
                return "Untargeted campaigns show offers to all consumers without personalization.";
            case "perpetual":
                return "Perpetual campaigns are always-on. Offers rotate automatically based on lifecycle rules you define.";
        }
    };

    const isFormValid = () => {
        if (!name) return false;
        if (type === "perpetual") return true; // No date requirements
        if (!startDate) return false;
        if (type === "targeted" && !endDate) return false;
        return true;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Create New Campaign</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 space-y-4">
                        {/* Campaign Type Toggle */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Campaign Type
                            </label>
                            <div className={cn(
                                "flex rounded-lg border border-slate-200 p-1 bg-slate-50",
                                perpetualEnabled ? "grid grid-cols-3" : "grid grid-cols-2"
                            )}>
                                <button
                                    type="button"
                                    onClick={() => setType("targeted")}
                                    className={cn(
                                        "flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        type === "targeted"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    <Target className="w-4 h-4" />
                                    Targeted
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType("untargeted")}
                                    className={cn(
                                        "flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        type === "untargeted"
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    <Users className="w-4 h-4" />
                                    Untargeted
                                </button>
                                {perpetualEnabled && (
                                    <button
                                        type="button"
                                        onClick={() => setType("perpetual")}
                                        className={cn(
                                            "flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                            type === "perpetual"
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-600 hover:text-slate-900"
                                        )}
                                    >
                                        <Infinity className="w-4 h-4" />
                                        Perpetual
                                    </button>
                                )}
                            </div>
                            <p className="mt-2 text-xs text-slate-500 flex items-start gap-1.5">
                                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                {getTypeDescription()}
                            </p>
                        </div>

                        {/* Perpetual Campaign Info Banner */}
                        {type === "perpetual" && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Infinity className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-indigo-900">Always-On Campaign</h4>
                                        <p className="text-xs text-indigo-700 mt-1">
                                            This campaign will go live immediately after creation.
                                            You&apos;ll configure offer lifecycles (duration, expiration, rotation)
                                            when adding products.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Campaign Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                                Campaign Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={type === "perpetual" ? "e.g., Always-On Member Offers" : "Enter campaign name"}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Dates - Hidden for perpetual campaigns */}
                        {type !== "perpetual" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">
                                        Start Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1">
                                        End Date {type === "targeted" && <span className="text-rose-500">*</span>}
                                        {type === "untargeted" && <span className="text-slate-400">(optional)</span>}
                                    </label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent"
                                        required={type === "targeted"}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid()}
                            className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {type === "perpetual" ? "Create & Go Live" : "Create Campaign"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Campaign table for Live and Completed sections
function CampaignTable({
    campaigns,
    sortField,
    sortDirection,
    onSort,
    onOpen,
    onDuplicate,
    onCreateUnionCreditCopy,
    onExport,
    onMarkAsReady,
    onDelete,
}: {
    campaigns: Campaign[];
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
    onOpen: (id: string) => void;
    onDuplicate: (campaign: Campaign) => void;
    onCreateUnionCreditCopy: (campaign: Campaign) => void;
    onExport: (campaign: Campaign) => void;
    onMarkAsReady: (campaign: Campaign) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <table className="w-full">
            <thead>
                <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-3">
                        <SortableHeader
                            label="Campaign Name"
                            field="name"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={onSort}
                        />
                    </th>
                    <th className="text-left px-4 py-3">
                        <SortableHeader
                            label="Start Date"
                            field="startDate"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={onSort}
                        />
                    </th>
                    <th className="text-left px-4 py-3">
                        <SortableHeader
                            label="End Date"
                            field="endDate"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={onSort}
                        />
                    </th>
                    <th className="text-left px-4 py-3">
                        <SortableHeader
                            label="Campaign Type"
                            field="type"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={onSort}
                        />
                    </th>
                    <th className="w-12 px-4 py-3">
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {campaigns.map((campaign) => (
                    <tr
                        key={campaign.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                    >
                        <td className="px-4 py-3">
                            <button
                                onClick={() => onOpen(campaign.id)}
                                className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                            >
                                {campaign.name}
                            </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                            {formatDate(campaign.startDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                            {campaign.type === "perpetual" ? "—" : formatDate(campaign.endDate)}
                        </td>
                        <td className="px-4 py-3">
                            <CampaignTypeBadge type={campaign.type} />
                        </td>
                        <td className="px-4 py-3">
                            <CampaignRowMenu
                                campaign={campaign}
                                onOpen={() => onOpen(campaign.id)}
                                onDuplicate={() => onDuplicate(campaign)}
                                onCreateUnionCreditCopy={() => onCreateUnionCreditCopy(campaign)}
                                onExport={() => onExport(campaign)}
                                onMarkAsReady={() => onMarkAsReady(campaign)}
                                onDelete={() => onDelete(campaign.id)}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// Pending campaigns table (with Pending Status column)
function PendingCampaignTable({
    campaigns,
    sortField,
    sortDirection,
    onSort,
    onOpen,
    onDuplicate,
    onCreateUnionCreditCopy,
    onExport,
    onMarkAsReady,
    onDelete,
}: {
    campaigns: Campaign[];
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
    onOpen: (id: string) => void;
    onDuplicate: (campaign: Campaign) => void;
    onCreateUnionCreditCopy: (campaign: Campaign) => void;
    onExport: (campaign: Campaign) => void;
    onMarkAsReady: (campaign: Campaign) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <table className="w-full">
            <thead>
                <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-3">
                        <SortableHeader
                            label="Campaign Name"
                            field="name"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={onSort}
                        />
                    </th>
                    <th className="text-left px-4 py-3">
                        <SortableHeader
                            label="Start Date"
                            field="startDate"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={onSort}
                        />
                    </th>
                    <th className="text-left px-4 py-3">
                        <SortableHeader
                            label="End Date"
                            field="endDate"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={onSort}
                        />
                    </th>
                    <th className="text-left px-4 py-3">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Pending Status
                        </span>
                    </th>
                    <th className="text-left px-4 py-3">
                        <SortableHeader
                            label="Campaign Type"
                            field="type"
                            currentSort={sortField}
                            currentDirection={sortDirection}
                            onSort={onSort}
                        />
                    </th>
                    <th className="w-12 px-4 py-3">
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {campaigns.map((campaign) => (
                    <tr
                        key={campaign.id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                    >
                        <td className="px-4 py-3">
                            <button
                                onClick={() => onOpen(campaign.id)}
                                className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                            >
                                {campaign.name}
                            </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                            {formatDate(campaign.startDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                            {campaign.type === "perpetual" ? "—" : formatDate(campaign.endDate)}
                        </td>
                        <td className="px-4 py-3">
                            <PendingStatusBadge status={getPendingStatus(campaign)} />
                        </td>
                        <td className="px-4 py-3">
                            <CampaignTypeBadge type={campaign.type} />
                        </td>
                        <td className="px-4 py-3">
                            <CampaignRowMenu
                                campaign={campaign}
                                onOpen={() => onOpen(campaign.id)}
                                onDuplicate={() => onDuplicate(campaign)}
                                onCreateUnionCreditCopy={() => onCreateUnionCreditCopy(campaign)}
                                onExport={() => onExport(campaign)}
                                onMarkAsReady={() => onMarkAsReady(campaign)}
                                onDelete={() => onDelete(campaign.id)}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// Campaign section wrapper
function CampaignSection({
    title,
    campaigns,
    emptyMessage,
    isPending,
    sortField,
    sortDirection,
    onSort,
    onOpen,
    onDuplicate,
    onCreateUnionCreditCopy,
    onExport,
    onMarkAsReady,
    onDelete,
    onLaunchAll,
}: {
    title: string;
    campaigns: Campaign[];
    emptyMessage: string;
    isPending?: boolean;
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: SortField) => void;
    onOpen: (id: string) => void;
    onDuplicate: (campaign: Campaign) => void;
    onCreateUnionCreditCopy: (campaign: Campaign) => void;
    onExport: (campaign: Campaign) => void;
    onMarkAsReady: (campaign: Campaign) => void;
    onDelete: (id: string) => void;
    onLaunchAll?: () => void;
}) {
    // Check if any campaigns are ready for launch
    const readyForLaunchCount = isPending
        ? campaigns.filter((c) => getPendingStatus(c) === "ready_for_launch").length
        : 0;

    return (
        <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 rounded-t-xl">
                <h2 className="font-semibold text-slate-900">{title}</h2>
                {isPending && onLaunchAll && readyForLaunchCount > 0 && (
                    <button
                        onClick={onLaunchAll}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Rocket className="w-4 h-4" />
                        Launch All Pending Campaigns
                    </button>
                )}
            </div>
            {campaigns.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                    {emptyMessage}
                </div>
            ) : isPending ? (
                <PendingCampaignTable
                    campaigns={campaigns}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    onOpen={onOpen}
                    onDuplicate={onDuplicate}
                    onCreateUnionCreditCopy={onCreateUnionCreditCopy}
                    onExport={onExport}
                    onMarkAsReady={onMarkAsReady}
                    onDelete={onDelete}
                />
            ) : (
                <CampaignTable
                    campaigns={campaigns}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={onSort}
                    onOpen={onOpen}
                    onDuplicate={onDuplicate}
                    onCreateUnionCreditCopy={onCreateUnionCreditCopy}
                    onExport={onExport}
                    onMarkAsReady={onMarkAsReady}
                    onDelete={onDelete}
                />
            )}
        </div>
    );
}

export default function CampaignsPage() {
    const router = useRouter();
    const { campaigns, addCampaign, updateCampaign, deleteCampaign, featureFlags } = useStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    // Sort function
    const sortCampaigns = (campaignsToSort: Campaign[]) => {
        return [...campaignsToSort].sort((a, b) => {
            let aVal: string | undefined;
            let bVal: string | undefined;

            switch (sortField) {
                case "name":
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case "startDate":
                    aVal = a.startDate;
                    bVal = b.startDate;
                    break;
                case "endDate":
                    aVal = a.endDate || "";
                    bVal = b.endDate || "";
                    break;
                case "type":
                    aVal = a.type;
                    bVal = b.type;
                    break;
            }

            if (aVal === bVal) return 0;
            if (sortDirection === "asc") {
                return aVal < bVal ? -1 : 1;
            } else {
                return aVal > bVal ? -1 : 1;
            }
        });
    };

    const handleSort = (field: SortField) => {
        if (field === sortField) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Split campaigns by status
    const liveCampaigns = sortCampaigns(campaigns.filter((c) => c.status === "live"));
    const pendingCampaigns = sortCampaigns(campaigns.filter((c) => c.status === "pending" || c.status === "draft"));
    const completedCampaigns = sortCampaigns(campaigns.filter((c) => c.status === "completed"));

    const handleCreate = (campaignData: Omit<Campaign, "id" | "createdAt" | "featuredOffersSection" | "sections">) => {
        const newCampaign: Campaign = {
            ...campaignData,
            id: `campaign-${Date.now()}`,
            createdAt: new Date().toISOString().split("T")[0],
            featuredOffersSection: {
                id: `featured-${Date.now()}`,
                name: "Featured Offers",
                order: 0,
                products: [],
            },
            sections: [],
        };
        addCampaign(newCampaign);
        router.push(`/admin/campaigns/${newCampaign.id}`);
    };

    const handleDuplicate = (campaign: Campaign) => {
        const duplicated: Campaign = {
            ...campaign,
            id: `campaign-${Date.now()}`,
            name: `${campaign.name} (Copy)`,
            status: "draft",
            createdAt: new Date().toISOString().split("T")[0],
            featuredOffersSection: {
                ...campaign.featuredOffersSection,
                id: `featured-${Date.now()}`,
            },
            sections: campaign.sections.map((s, idx) => ({
                ...s,
                id: `section-${Date.now()}-${idx}`,
            })),
            customerFile: undefined,
            enhancedCustomerFile: undefined,
            metrics: undefined,
        };
        addCampaign(duplicated);
    };

    const handleCreateUnionCreditCopy = (campaign: Campaign) => {
        const duplicated: Campaign = {
            ...campaign,
            id: `campaign-${Date.now()}`,
            name: `${campaign.name} (Union Credit)`,
            status: "draft",
            createdAt: new Date().toISOString().split("T")[0],
            featuredOffersSection: {
                ...campaign.featuredOffersSection,
                id: `featured-${Date.now()}`,
            },
            sections: campaign.sections.map((s, idx) => ({
                ...s,
                id: `section-${Date.now()}-${idx}`,
            })),
            customerFile: undefined,
            enhancedCustomerFile: undefined,
            metrics: undefined,
        };
        addCampaign(duplicated);
    };

    const handleExport = (campaign: Campaign) => {
        // Mock export - in production, this would trigger a file download
        alert(`Exporting campaign: ${campaign.name}\n\nIn production, this would download a JSON or CSV export of the campaign configuration.`);
    };

    const handleMarkAsReady = (campaign: Campaign) => {
        updateCampaign({
            ...campaign,
            status: "pending",
        });
    };

    const handleLaunchAll = () => {
        // Launch all campaigns that are ready
        const readyToLaunch = pendingCampaigns.filter(
            (c) => getPendingStatus(c) === "ready_for_launch"
        );
        readyToLaunch.forEach((campaign) => {
            updateCampaign({
                ...campaign,
                status: "live",
            });
        });
    };

    const handleOpen = (id: string) => {
        router.push(`/admin/campaigns/${id}`);
    };

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-50 transition-colors"
                >
                    Create New Campaign
                </button>
            </div>

            {/* Campaign Lists */}
            <div className="space-y-6">
                <CampaignSection
                    title="Live Campaigns"
                    campaigns={liveCampaigns}
                    emptyMessage="No live campaigns"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    onOpen={handleOpen}
                    onDuplicate={handleDuplicate}
                    onCreateUnionCreditCopy={handleCreateUnionCreditCopy}
                    onExport={handleExport}
                    onMarkAsReady={handleMarkAsReady}
                    onDelete={deleteCampaign}
                />

                <CampaignSection
                    title="Pending Campaigns"
                    campaigns={pendingCampaigns}
                    emptyMessage="No pending campaigns"
                    isPending
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    onOpen={handleOpen}
                    onDuplicate={handleDuplicate}
                    onCreateUnionCreditCopy={handleCreateUnionCreditCopy}
                    onExport={handleExport}
                    onMarkAsReady={handleMarkAsReady}
                    onDelete={deleteCampaign}
                    onLaunchAll={handleLaunchAll}
                />

                <CampaignSection
                    title="Completed Campaigns"
                    campaigns={completedCampaigns}
                    emptyMessage="No completed campaigns"
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    onOpen={handleOpen}
                    onDuplicate={handleDuplicate}
                    onCreateUnionCreditCopy={handleCreateUnionCreditCopy}
                    onExport={handleExport}
                    onMarkAsReady={handleMarkAsReady}
                    onDelete={deleteCampaign}
                />
            </div>

            {/* Create Modal */}
            <CreateCampaignModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreate}
                perpetualEnabled={featureFlags.campaigns_perpetualType}
            />
        </div>
    );
}
