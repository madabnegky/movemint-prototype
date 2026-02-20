"use client";

import { useState, useRef, useEffect } from "react";
import { Campaign, CustomerFileUpload, EnhancedCustomerFile, useStore } from "@/context/StoreContext";
import {
    Upload,
    Download,
    FileText,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Info,
    X,
    FileSpreadsheet,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileProcessingTabProps {
    campaign: Campaign;
    onUpdate: (updates: Partial<Campaign>) => void;
}

interface RevioScoreBucket {
    label: string;
    min: number;
    max: number;
    count: number;
}

// File upload zone component
function FileUploadZone({
    title,
    description,
    acceptedTypes,
    onFileSelect,
    isProcessing,
    disabled,
}: {
    title: string;
    description: string;
    acceptedTypes: string;
    onFileSelect: (file: File) => void;
    isProcessing?: boolean;
    disabled?: boolean;
}) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        const file = e.dataTransfer.files[0];
        if (file) onFileSelect(file);
    };

    const handleClick = () => {
        if (!disabled) inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileSelect(file);
    };

    return (
        <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                isDragging && !disabled
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-slate-200 hover:border-slate-300",
                disabled && "opacity-50 cursor-not-allowed hover:border-slate-200"
            )}
        >
            <input
                ref={inputRef}
                type="file"
                accept={acceptedTypes}
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
            />

            {isProcessing ? (
                <div className="flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
                    <p className="text-sm font-medium text-slate-700">Processing file...</p>
                    <p className="text-xs text-slate-500 mt-1">You can safely navigate away. We&apos;ll continue processing.</p>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">{title}</p>
                    <p className="text-xs text-slate-500 mt-1">{description}</p>
                </div>
            )}
        </div>
    );
}

// Uploaded file card component
function UploadedFileCard({
    file,
    type,
    onRemove,
}: {
    file: CustomerFileUpload | EnhancedCustomerFile;
    type: "customer" | "enhanced";
    onRemove: () => void;
}) {
    const isCustomerFile = type === "customer";
    const customerFile = isCustomerFile ? (file as CustomerFileUpload) : null;
    const enhancedFile = !isCustomerFile ? (file as EnhancedCustomerFile) : null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        customerFile?.status === "error"
                            ? "bg-rose-100 text-rose-600"
                            : customerFile?.status === "processing"
                                ? "bg-amber-100 text-amber-600"
                                : "bg-emerald-100 text-emerald-600"
                    )}>
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-medium text-slate-900 text-sm">{file.fileName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Uploaded {new Date(file.uploadedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit"
                            })}
                        </p>
                        {enhancedFile && (
                            <p className="text-xs text-slate-500 mt-0.5">
                                Bureau: <span className="capitalize">{enhancedFile.bureau}</span>
                            </p>
                        )}
                    </div>
                </div>
                <button
                    onClick={onRemove}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Status / Metrics */}
            <div className="mt-3 pt-3 border-t border-slate-100">
                {customerFile?.status === "processing" && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                    </div>
                )}
                {customerFile?.status === "error" && (
                    <div className="flex items-start gap-2 text-rose-600 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{customerFile.errorMessage || "An error occurred processing this file."}</span>
                    </div>
                )}
                {(customerFile?.status === "complete" || enhancedFile) && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{file.recordCount.toLocaleString()} records imported</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Generate a realistic, center-weighted distribution of propensity scores
function generateRevioScores(totalMembers: number): RevioScoreBucket[] {
    const buckets = [
        { label: "0–19", min: 0, max: 19, weight: 0.05 },
        { label: "20–39", min: 20, max: 39, weight: 0.15 },
        { label: "40–59", min: 40, max: 59, weight: 0.35 },
        { label: "60–79", min: 60, max: 79, weight: 0.30 },
        { label: "80–100", min: 80, max: 100, weight: 0.15 },
    ];

    // Add jitter so it looks different each time
    const jittered = buckets.map((b) => ({
        ...b,
        weight: b.weight * (0.85 + Math.random() * 0.3),
    }));

    const totalWeight = jittered.reduce((sum, b) => sum + b.weight, 0);

    let remaining = totalMembers;
    return jittered.map((b, i) => {
        const isLast = i === jittered.length - 1;
        const count = isLast ? remaining : Math.round(totalMembers * (b.weight / totalWeight));
        remaining -= count;
        return { label: b.label, min: b.min, max: b.max, count };
    });
}

export default function FileProcessingTab({ campaign, onUpdate }: FileProcessingTabProps) {
    const { featureFlags } = useStore();
    const [isUploading, setIsUploading] = useState<"customer" | "enhanced" | null>(null);
    const [optimizationExpanded, setOptimizationExpanded] = useState(false);
    const [verticeThreshold, setVerticeThreshold] = useState(50);

    // Revio state
    const [revioStatus, setRevioStatus] = useState<"idle" | "loading" | "complete">("idle");
    const [revioScoreDistribution, setRevioScoreDistribution] = useState<RevioScoreBucket[]>([]);
    const [revioThreshold, setRevioThreshold] = useState(0);

    const isLiveOrCompleted = campaign.status === "live" || campaign.status === "completed";

    const totalMembers = campaign.customerFile?.recordCount || 0;

    // Revio derived calculations
    const revioMembersExcluded = revioScoreDistribution
        .filter((bucket) => bucket.max < revioThreshold)
        .reduce((sum, bucket) => sum + bucket.count, 0);
    const revioMembersRemaining = totalMembers - revioMembersExcluded;
    const maxBucketCount = Math.max(...revioScoreDistribution.map((b) => b.count), 0);

    // Combined optimization for export
    const hasRevioOptimization = revioStatus === "complete" && revioThreshold > 0;
    const hasVerticeOptimization = featureFlags.admin_optimizationVertice && verticeThreshold > 0;

    let exportRecordCount = totalMembers;
    if (hasRevioOptimization) {
        exportRecordCount -= revioMembersExcluded;
    }
    if (hasVerticeOptimization) {
        const verticeExclusionsOnRemaining = Math.floor(exportRecordCount * (verticeThreshold / 100) * 0.8);
        exportRecordCount -= verticeExclusionsOnRemaining;
    }

    // Calculate Vertice optimization (threshold-based)
    const verticeExcludedMembers = Math.floor(totalMembers * (verticeThreshold / 100) * 0.8);
    const verticeRemainingMembers = totalMembers - verticeExcludedMembers;
    const verticeCostPerInquiry = 0.85;
    const verticeSavings = verticeExcludedMembers * verticeCostPerInquiry;

    // Simulate file upload
    const handleCustomerFileUpload = (file: File) => {
        setIsUploading("customer");

        // Simulate processing delay
        setTimeout(() => {
            const uploadedFile: CustomerFileUpload = {
                id: `cf-${Date.now()}`,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                recordCount: Math.floor(Math.random() * 15000) + 5000, // Random record count
                status: "complete",
            };

            onUpdate({ customerFile: uploadedFile });
            setIsUploading(null);
        }, 2000);
    };

    const handleEnhancedFileUpload = (file: File) => {
        setIsUploading("enhanced");

        // Simulate processing delay
        setTimeout(() => {
            // Randomly pick a bureau based on filename or random
            const bureaus: Array<"experian" | "equifax" | "transunion"> = ["experian", "equifax", "transunion"];
            const bureau = bureaus[Math.floor(Math.random() * bureaus.length)];

            const baseCount = campaign.customerFile?.recordCount || 10000;
            const uploadedFile: EnhancedCustomerFile = {
                id: `ecf-${Date.now()}`,
                fileName: file.name,
                uploadedAt: new Date().toISOString(),
                recordCount: Math.floor(baseCount * (0.95 + Math.random() * 0.05)), // ~95-100% of original
                bureau,
            };

            // Update metrics with mock data
            const metrics = {
                customerFileTotal: campaign.customerFile?.recordCount || baseCount,
                enhancedCustomerFileTotal: uploadedFile.recordCount,
                productMatches: Math.floor(uploadedFile.recordCount * 0.8),
                preapprovals: Math.floor(uploadedFile.recordCount * 0.6),
                applications: 0,
            };

            onUpdate({ enhancedCustomerFile: uploadedFile, metrics });
            setIsUploading(null);
        }, 2500);
    };

    const handleRemoveCustomerFile = () => {
        onUpdate({
            customerFile: undefined,
            enhancedCustomerFile: undefined,
            metrics: undefined,
        });
    };

    const handleRemoveEnhancedFile = () => {
        onUpdate({
            enhancedCustomerFile: undefined,
            metrics: campaign.customerFile ? {
                customerFileTotal: campaign.customerFile.recordCount,
                enhancedCustomerFileTotal: 0,
                productMatches: 0,
                preapprovals: 0,
                applications: 0,
            } : undefined,
        });
    };

    // Reset Revio state when customer file changes
    useEffect(() => {
        setRevioStatus("idle");
        setRevioScoreDistribution([]);
        setRevioThreshold(0);
    }, [campaign.customerFile?.id]);

    const handleGetRevioScores = () => {
        setRevioStatus("loading");
        setRevioThreshold(0);

        const delay = 2000 + Math.random() * 1000;
        setTimeout(() => {
            const scores = generateRevioScores(totalMembers);
            setRevioScoreDistribution(scores);
            setRevioStatus("complete");
        }, delay);
    };

    const handleExportProcessedFile = () => {
        alert(
            `In production, this would download a processed customer file with ${exportRecordCount.toLocaleString()} records, formatted for your credit bureau.`
        );
    };

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium">File Processing Workflow</p>
                        <ol className="mt-2 space-y-1 list-decimal list-inside text-blue-700">
                            <li>Upload your customer file (.csv) from your core banking system</li>
                            <li>Export the processed file to send to your credit bureau</li>
                            <li>Upload the enhanced customer file received from the bureau</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Step 1: Customer File */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                            1
                        </div>
                        <h2 className="font-semibold text-slate-900">Customer File</h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 ml-8">
                        Upload a customer file from your core banking system. This tool will remove duplicates and reformat it for your credit bureau.
                    </p>
                </div>
                <div className="p-6">
                    {campaign.customerFile ? (
                        <UploadedFileCard
                            file={campaign.customerFile}
                            type="customer"
                            onRemove={handleRemoveCustomerFile}
                        />
                    ) : (
                        <FileUploadZone
                            title="Upload Customer File"
                            description="Drag and drop a .csv file, or click to browse"
                            acceptedTypes=".csv"
                            onFileSelect={handleCustomerFileUpload}
                            isProcessing={isUploading === "customer"}
                            disabled={isLiveOrCompleted}
                        />
                    )}

                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <h4 className="text-xs font-medium text-slate-700 uppercase tracking-wider mb-2">
                            Required Headers
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {["FirstName", "LastName", "SSN"].map((header) => (
                                <span
                                    key={header}
                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-600"
                                >
                                    {header}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Additional customer fields can be added as configured in Settings → Customer Fields.
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 2: Optimization Dashboard (Feature Flagged) */}
            {featureFlags.admin_optimizationDashboard && campaign.customerFile && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                        onClick={() => setOptimizationExpanded(!optimizationExpanded)}
                        className="w-full px-6 py-4 border-b border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                                    2
                                </div>
                                <h2 className="font-semibold text-slate-900">Optimization Dashboard</h2>
                                <span className="ml-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-slate-200 text-slate-600 rounded-full">
                                    Optional
                                </span>
                            </div>
                            {optimizationExpanded ? (
                                <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1 ml-8 text-left">
                            Optimize your campaign audience before sending to the bureau.
                        </p>
                    </button>

                    {optimizationExpanded && (
                        <div className="p-6 space-y-6">
                            {/* Vertice AI Propensity Scores (Sub-feature flag) */}
                            {featureFlags.admin_optimizationVertice && (
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-slate-900">Vertice AI Propensity Scores</h3>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Exclude members with low propensity scores to reduce bureau costs.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600">Minimum propensity score threshold</span>
                                            <span className="font-medium text-slate-900">{verticeThreshold}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="80"
                                            value={verticeThreshold}
                                            onChange={(e) => setVerticeThreshold(Number(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                        />
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>Include all members</span>
                                            <span>High-propensity only (80%+)</span>
                                        </div>

                                        {verticeThreshold > 0 && (
                                            <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Members excluded</p>
                                                        <p className="text-lg font-bold text-slate-900">
                                                            {verticeExcludedMembers.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Bureau file size</p>
                                                        <p className="text-lg font-bold text-slate-900">
                                                            {verticeRemainingMembers.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Est. bureau savings</p>
                                                        <p className="text-lg font-bold text-slate-900">
                                                            ${verticeSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Revio Optimization (Sub-feature flag) */}
                            {featureFlags.admin_optimizationRevio && (
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                    {/* Header */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-slate-900">Revio ROI Optimization</h3>
                                            {revioStatus === "complete" && (
                                                <button
                                                    onClick={handleGetRevioScores}
                                                    disabled={isLiveOrCompleted}
                                                    className="text-xs text-slate-500 hover:text-slate-700 underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Re-fetch scores
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {revioStatus === "complete"
                                                ? "Propensity scores retrieved. Set a minimum threshold to exclude low-propensity members."
                                                : "Send your customer file to Revio for behavioral propensity scoring."}
                                        </p>
                                    </div>

                                    {/* Idle: Get Propensity Scores button */}
                                    {revioStatus === "idle" && (
                                        <button
                                            onClick={handleGetRevioScores}
                                            disabled={isLiveOrCompleted}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Get Propensity Scores
                                        </button>
                                    )}

                                    {/* Loading: Spinner */}
                                    {revioStatus === "loading" && (
                                        <div className="flex flex-col items-center py-6">
                                            <Loader2 className="w-8 h-8 text-slate-500 animate-spin mb-3" />
                                            <p className="text-sm font-medium text-slate-700">Retrieving propensity scores from Revio...</p>
                                            <p className="text-xs text-slate-500 mt-1">This usually takes a few moments.</p>
                                        </div>
                                    )}

                                    {/* Complete: Distribution + Threshold Slider */}
                                    {revioStatus === "complete" && (
                                        <div className="space-y-4">
                                            {/* Score Distribution */}
                                            <div>
                                                <h4 className="text-xs font-medium text-slate-700 uppercase tracking-wider mb-3">Score Distribution</h4>
                                                <div className="space-y-2">
                                                    {revioScoreDistribution.map((bucket) => {
                                                        const widthPercent = maxBucketCount > 0 ? (bucket.count / maxBucketCount) * 100 : 0;
                                                        const isExcluded = bucket.max < revioThreshold;
                                                        return (
                                                            <div key={bucket.label} className="flex items-center gap-3">
                                                                <span className={cn(
                                                                    "text-xs font-mono w-14 text-right shrink-0",
                                                                    isExcluded ? "text-slate-400" : "text-slate-600"
                                                                )}>
                                                                    {bucket.label}
                                                                </span>
                                                                <div className="flex-1 h-6 bg-slate-100 rounded overflow-hidden">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded transition-all",
                                                                            isExcluded ? "bg-slate-300" : "bg-slate-700"
                                                                        )}
                                                                        style={{ width: `${widthPercent}%` }}
                                                                    />
                                                                </div>
                                                                <span className={cn(
                                                                    "text-xs w-16 text-right shrink-0",
                                                                    isExcluded ? "text-slate-400 line-through" : "text-slate-700 font-medium"
                                                                )}>
                                                                    {bucket.count.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Threshold Slider */}
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-slate-600">Remove members scoring below</span>
                                                    <span className="font-medium text-slate-900">
                                                        {revioThreshold === 0 ? "None" : revioThreshold}
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="80"
                                                    step="20"
                                                    value={revioThreshold}
                                                    onChange={(e) => setRevioThreshold(Number(e.target.value))}
                                                    disabled={isLiveOrCompleted}
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>Include all</span>
                                                    <span>High-propensity only (80+)</span>
                                                </div>
                                            </div>

                                            {/* Stats Card */}
                                            {revioThreshold > 0 && (
                                                <div className="p-4 bg-white rounded-lg border border-slate-200">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-1">Members excluded</p>
                                                            <p className="text-lg font-bold text-slate-900">
                                                                {revioMembersExcluded.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-1">Members remaining</p>
                                                            <p className="text-lg font-bold text-slate-900">
                                                                {revioMembersRemaining.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-1">Est. ROI improvement</p>
                                                            <p className="text-lg font-bold text-slate-900">
                                                                +{Math.round(revioThreshold * 0.6)}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* No optimizations message - only show if neither flag is enabled */}
                            {!featureFlags.admin_optimizationRevio && !featureFlags.admin_optimizationVertice && (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                        <Info className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <h3 className="font-medium text-slate-900">No optimizations available</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Enable optimization integrations in Feature Flags to unlock audience optimization tools.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Export Processed File (was Step 2) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
                            campaign.customerFile
                                ? "bg-slate-900 text-white"
                                : "bg-slate-200 text-slate-500"
                        )}>
                            {featureFlags.admin_optimizationDashboard && campaign.customerFile ? "3" : "2"}
                        </div>
                        <h2 className={cn(
                            "font-semibold",
                            campaign.customerFile ? "text-slate-900" : "text-slate-400"
                        )}>
                            Export Processed Customer File
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 ml-8">
                        Download the reformatted file to send to your credit bureau (Experian, Equifax, or TransUnion).
                    </p>
                </div>
                <div className="p-6">
                    {(hasRevioOptimization || hasVerticeOptimization) && (
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="text-slate-700">
                                    Optimized file: <span className="font-semibold">{exportRecordCount.toLocaleString()}</span> records
                                    {totalMembers > 0 && (
                                        <span className="text-slate-500 ml-1">
                                            (reduced from {totalMembers.toLocaleString()})
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleExportProcessedFile}
                        disabled={!campaign.customerFile || isLiveOrCompleted}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export Processed File
                    </button>
                </div>
            </div>

            {/* Step 4: Enhanced Customer File (was Step 3) */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
                            campaign.customerFile
                                ? "bg-slate-900 text-white"
                                : "bg-slate-200 text-slate-500"
                        )}>
                            {featureFlags.admin_optimizationDashboard && campaign.customerFile ? "4" : "3"}
                        </div>
                        <h2 className={cn(
                            "font-semibold",
                            campaign.customerFile ? "text-slate-900" : "text-slate-400"
                        )}>
                            Enhanced Customer File
                        </h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 ml-8">
                        Upload the enhanced file received from your credit bureau. This file includes credit scores and other data needed for offer generation.
                    </p>
                </div>
                <div className="p-6">
                    {campaign.enhancedCustomerFile ? (
                        <UploadedFileCard
                            file={campaign.enhancedCustomerFile}
                            type="enhanced"
                            onRemove={handleRemoveEnhancedFile}
                        />
                    ) : (
                        <FileUploadZone
                            title="Upload Enhanced Customer File"
                            description="Drag and drop the .csv file from your credit bureau"
                            acceptedTypes=".csv"
                            onFileSelect={handleEnhancedFileUpload}
                            isProcessing={isUploading === "enhanced"}
                            disabled={!campaign.customerFile || isLiveOrCompleted}
                        />
                    )}

                    {!campaign.customerFile && (
                        <p className="mt-4 text-xs text-slate-500 flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            Upload a customer file first before importing the enhanced file.
                        </p>
                    )}
                </div>
            </div>

            {/* File Size Warning */}
            <div className="flex items-start gap-2 text-xs text-slate-500">
                <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Files must be smaller than 100MB to be successfully uploaded.</span>
            </div>
        </div>
    );
}
