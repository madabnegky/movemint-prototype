"use client";

import { useMemo, useState } from "react";
import { Campaign, CampaignProduct } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import {
    Sparkles,
    TrendingUp,
    Lock,
    Info,
    Check,
    MessageSquareText,
    Megaphone,
    AlertTriangle,
    FileText,
    Save,
    ShieldCheck,
    Users,
    ListOrdered,
    Image as ImageIcon,
    DollarSign,
    ClipboardList,
} from "lucide-react";

interface AiOptimizationTabProps {
    campaign: Campaign;
    onUpdate: (updates: Partial<Campaign>) => void;
}

// ── Goal options (from the product brief) ─────────────────────────────
// Each goal carries an optional target unit so we can ask "by how much?".
// "custom" is the free-form option the brief calls for (predefined list +
// free-form). It reveals a text box instead of taking a numeric target.
type GoalUnit = "%" | "$" | null;

interface GoalOption {
    id: string;
    label: string;
    unit: GoalUnit;          // unit for the optional target amount
    placeholder?: string;    // target field placeholder
    custom?: boolean;        // free-text goal instead of a target number
}

const GOALS: GoalOption[] = [
    { id: "redemption", label: "Increase offer redemption rate", unit: "%", placeholder: "e.g. 2" },
    { id: "funded-volume", label: "Increase funded loan volume", unit: "%", placeholder: "e.g. 15" },
    { id: "auto-originations", label: "Increase auto loan originations", unit: "%", placeholder: "e.g. 10" },
    { id: "cost-per-loan", label: "Reduce cost per funded loan", unit: "%", placeholder: "e.g. 8" },
    { id: "expand-segment", label: "Expand addressable member segment", unit: "%", placeholder: "e.g. 20" },
    { id: "channel-mix", label: "Improve channel mix performance", unit: null },
    { id: "custom", label: "Other — define your own goal", unit: null, custom: true },
];

// ── Deterministic pseudo-random from a string seed ────────────────────
// Forecasts must be stable across reloads (no Math.random), so we derive
// every mock number from the product id. This is prototype mock data —
// in the real feature these come from the analysis pipeline.
function seededInt(seed: string, min: number, max: number): number {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    const n = (h >>> 0) / 4294967295;
    return Math.round(min + n * (max - min));
}

type Confidence = "high" | "med" | "low";

interface ProductForecast {
    product: CampaignProduct;
    predRedemption: number;   // %
    predFundedVol: number;    // $ millions
    predCostPerLoan: number;  // $
    ownCount: number;         // CU's own comparable campaigns
    networkCount: number;     // network comparable campaigns
    confidence: Confidence;
    // live actuals
    actualRedemption: number;
    actualFundedVol: number;
    actualCostPerLoan: number;
}

function buildForecast(product: CampaignProduct): ProductForecast {
    const id = product.id;
    // Own-history depth is the primary driver of confidence. We mock it
    // from the product type: auto products are "established", everything
    // else is thinner — and seed 0 own-campaigns for a low-data case.
    const isAuto =
        product.productType === "auto-loan" ||
        product.productType === "auto-refi" ||
        /auto|vehicle|refinance|refi/i.test(product.productName);

    const ownCount = isAuto ? seededInt(id + "own", 4, 9) : seededInt(id + "own", 0, 3);
    const networkCount = isAuto
        ? seededInt(id + "net", 700, 1400)
        : seededInt(id + "net", 40, 300);

    const confidence: Confidence =
        ownCount >= 4 ? "high" : ownCount >= 1 ? "med" : "low";

    const predRedemption = (seededInt(id + "rr", 28, 66) / 10); // 2.8%–6.6%
    const predFundedVol = seededInt(id + "fv", 4, 28) / 10;     // $0.4M–$2.8M
    const predCostPerLoan = seededInt(id + "cpl", 480, 700);

    // Actuals run a bit under forecast (the locked-campaign story)
    const drift = seededInt(id + "drift", 12, 30) / 100; // 12%–30% under
    return {
        product,
        predRedemption,
        predFundedVol,
        predCostPerLoan,
        ownCount,
        networkCount,
        confidence,
        actualRedemption: +(predRedemption * (1 - drift)).toFixed(1),
        actualFundedVol: +(predFundedVol * 0.45).toFixed(2),
        actualCostPerLoan: Math.round(predCostPerLoan * (1 + drift * 0.3)),
    };
}

// ── Signal-strength meter for FORECAST confidence ─────────────────────
function ForecastMeter({ level, title }: { level: Confidence; title: string }) {
    const colorByLevel: Record<Confidence, string> = {
        high: "bg-emerald-600",
        med: "bg-amber-600",
        low: "bg-red-600",
    };
    const labelByLevel: Record<Confidence, { text: string; cls: string }> = {
        high: { text: "High", cls: "text-emerald-700" },
        med: { text: "Medium", cls: "text-amber-600" },
        low: { text: "Low", cls: "text-red-600" },
    };
    const filled = level === "high" ? 3 : level === "med" ? 2 : 1;
    const heights = ["h-1.5", "h-2.5", "h-3.5"];
    const label = labelByLevel[level];

    return (
        <span className="inline-flex items-center gap-1.5 cursor-help" title={title}>
            <span className="inline-flex items-end gap-0.5 h-3.5">
                {heights.map((h, i) => (
                    <span
                        key={i}
                        className={cn(
                            "w-1 rounded-sm",
                            h,
                            i < filled ? colorByLevel[level] : "bg-slate-300"
                        )}
                    />
                ))}
            </span>
            <span className={cn("text-xs font-medium", label.cls)}>{label.text}</span>
        </span>
    );
}

export default function AiOptimizationTab({ campaign }: AiOptimizationTabProps) {
    // In-progress selection
    const [goalId, setGoalId] = useState(GOALS[0].id);
    const [target, setTarget] = useState("");
    const [customGoal, setCustomGoal] = useState("");
    // Committed (generated) goal — what the recommendations below actually reflect
    const [applied, setApplied] = useState({ goalId: GOALS[0].id, summary: "" });
    const goal = GOALS.find((g) => g.id === goalId) ?? GOALS[0];

    // Build a human-readable summary of the in-progress goal (+ target)
    const buildSummary = () =>
        goal.custom
            ? customGoal.trim() || "your custom goal"
            : target.trim()
            ? `${goal.label.toLowerCase()} by ${goal.unit === "$" ? "$" : ""}${target.trim()}${goal.unit === "%" ? "%" : ""}`
            : goal.label.toLowerCase();

    // Has the in-progress selection diverged from what was last generated?
    const dirty = goalId !== applied.goalId || buildSummary() !== applied.summary;

    const handleGenerate = () => {
        setApplied({ goalId, summary: buildSummary() });
    };

    // The provenance strip reflects the GENERATED goal, falling back to the
    // initial selection so the first render shows something sensible.
    const appliedSummary =
        applied.summary ||
        (GOALS.find((g) => g.id === applied.goalId)?.label.toLowerCase() ?? "");

    const isLocked = campaign.status === "live" || campaign.status === "completed";

    // Pull real products from the campaign
    const products = useMemo(() => {
        return [
            ...campaign.featuredOffersSection.products,
            ...campaign.sections.flatMap((s) => s.products),
        ];
    }, [campaign]);

    const forecasts = useMemo(() => products.map(buildForecast), [products]);

    // ── Overall (aggregate) forecast ──────────────────────────────────
    const overall = useMemo(() => {
        if (forecasts.length === 0) return null;
        const totalFunded = forecasts.reduce((s, f) => s + f.predFundedVol, 0);
        const totalActualFunded = forecasts.reduce((s, f) => s + f.actualFundedVol, 0);
        // Funded-volume-weighted redemption
        const wRedemption =
            forecasts.reduce((s, f) => s + f.predRedemption * f.predFundedVol, 0) /
            (totalFunded || 1);
        const wActualRedemption =
            forecasts.reduce((s, f) => s + f.actualRedemption * f.predFundedVol, 0) /
            (totalFunded || 1);
        const avgCost = Math.round(
            forecasts.reduce((s, f) => s + f.predCostPerLoan, 0) / forecasts.length
        );
        const ownTotal = forecasts.reduce((s, f) => s + f.ownCount, 0);
        const networkTotal = forecasts.reduce((s, f) => s + f.networkCount, 0);
        const lowCount = forecasts.filter((f) => f.confidence === "low").length;
        const overallConf: Confidence =
            lowCount === 0 ? "high" : lowCount < forecasts.length ? "med" : "low";
        return {
            totalFunded,
            totalActualFunded,
            wRedemption,
            wActualRedemption,
            avgCost,
            ownTotal,
            networkTotal,
            overallConf,
            lowCount,
        };
    }, [forecasts]);

    // ── Recommendations (mock, goal-aware where it's cheap to be) ──────
    const recommendations = useMemo(
        () => buildRecommendations(forecasts, applied.goalId),
        [forecasts, applied.goalId]
    );

    if (products.length === 0) {
        return (
            <div className="space-y-6">
                <TabHeader />
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="font-medium text-slate-900">No products to forecast yet</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                        Add products to this campaign in the Products tab, then return here to see
                        predicted performance and AI-generated optimization recommendations.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <TabHeader />

            {/* Lock / lifecycle notice */}
            {isLocked ? (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg border text-sm bg-slate-100 border-slate-200 text-slate-600">
                    <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium text-slate-700">Campaign is locked.</p>
                        <p>
                            Live campaigns can&apos;t be edited. The recommendations below are learnings —
                            apply them to a duplicate or your next campaign.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg border text-sm bg-amber-50 border-amber-200 text-amber-800">
                    <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium">Optimize before launch — config locks when you go live.</p>
                        <p className="text-amber-700">
                            Apply any recommendations you want now. After launch this campaign can&apos;t
                            be edited, so AI Optimization becomes read-only.
                        </p>
                    </div>
                </div>
            )}

            {/* ── SECTION 1: Predicted Performance (overall) ── */}
            {overall && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                                Predicted Performance
                            </h3>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Forecast for the full campaign window — built from{" "}
                                <strong className="text-slate-600">this credit union&apos;s own past campaigns first</strong>,
                                with cross-network data filling the gaps.
                            </p>
                        </div>
                        <span
                            className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-help"
                            title="Your members behave differently from the network average, so the forecast starts from your own campaign history and leans on the network only where your data is thin."
                        >
                            YOUR HISTORY + NETWORK
                        </span>
                    </div>

                    {isLocked ? (
                        <div className="p-6">
                            <div className="grid grid-cols-4 gap-4">
                                <CompareCard
                                    label="Redemption Rate"
                                    actual={`${overall.wActualRedemption.toFixed(1)}%`}
                                    note={`predicted ${overall.wRedemption.toFixed(1)}% · tracking ${overall.wActualRedemption < overall.wRedemption ? "under" : "above"}`}
                                    noteColor={overall.wActualRedemption < overall.wRedemption ? "text-rose-600" : "text-emerald-600"}
                                />
                                <CompareCard
                                    label="Funded Volume"
                                    actual={`$${overall.totalActualFunded.toFixed(2)}M`}
                                    actualSuffix="to date"
                                    note={`forecast $${overall.totalFunded.toFixed(1)}M`}
                                    noteColor="text-slate-400"
                                />
                                <CompareCard
                                    label="Cost / Funded Loan"
                                    actual={`$${overall.avgCost}`}
                                    note="vs. forecast"
                                    noteColor="text-slate-400"
                                />
                                <CompareCard
                                    label="Forecast Confidence"
                                    actualNode={<ForecastMeter level={overall.overallConf} title="Driven by depth of your own campaign history first, then network comparables." />}
                                    note={`${overall.ownTotal} of your campaigns + ${overall.networkTotal.toLocaleString()} network`}
                                    noteColor="text-slate-400"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-3">
                                Predicted vs. actual, refreshed at each analysis run. Use the gaps to inform your
                                next campaign — this one is locked.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="p-6 grid grid-cols-5 gap-4">
                                <StatCard value={`${overall.wRedemption.toFixed(1)}%`} label="Pred. Redemption Rate" sub="network avg 6.1%" />
                                <StatCard value={`$${overall.totalFunded.toFixed(1)}M`} label="Pred. Funded Volume" sub="full-window forecast" />
                                <StatCard value={`$${overall.avgCost}`} label="Pred. Cost / Funded Loan" sub="blended across products" />
                                <StatCard value={(campaign.metrics?.enhancedCustomerFileTotal ?? campaign.metrics?.customerFileTotal ?? 0).toLocaleString() || "—"} label="Reachable Members" sub="from enhanced file" valueColor="text-emerald-600" />
                                <div>
                                    <div className="h-8 flex items-end">
                                        <ForecastMeter
                                            level={overall.overallConf}
                                            title={`Set by how much data backs the forecast, your own history weighted first. Here: ${overall.ownTotal} of your past campaigns + ~${overall.networkTotal.toLocaleString()} network campaigns.`}
                                        />
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                                        Forecast Confidence
                                        <span className="cursor-help text-slate-400" title="How reliable this forecast is — driven by the depth of your own campaign history first, then network comparables.">ⓘ</span>
                                    </div>
                                    {overall.lowCount > 0 && (
                                        <div className="text-[11px] text-amber-600 mt-0.5">
                                            {overall.lowCount} product{overall.lowCount > 1 ? "s" : ""} new to you
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Forecast basis line */}
                            <div className="px-6 pb-5 -mt-2">
                                <div className="flex items-start gap-2 text-xs text-slate-500 bg-indigo-50/60 border border-indigo-100 rounded-lg px-3 py-2">
                                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />
                                    <span>
                                        <strong className="text-slate-600">Forecast basis:</strong> your{" "}
                                        <strong className="text-slate-600">{overall.ownTotal} past campaigns</strong> lead the
                                        forecast, blended with{" "}
                                        <strong className="text-slate-600">~{overall.networkTotal.toLocaleString()} comparable network campaigns</strong>{" "}
                                        where your own data is thin. Where you and the network disagree, your members win.
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── SECTION 2: By Product ── */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-slate-900">By Product</h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {isLocked
                            ? "Compare predicted vs. actual to see which products beat or missed forecast."
                            : "Each product's predicted contribution. Weak performers are where optimization helps most."}
                    </p>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-white">
                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{isLocked ? "Redemption" : "Pred. Redemption"}</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{isLocked ? "Funded Vol." : "Pred. Funded Vol."}</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{isLocked ? "Cost/Loan" : "Pred. Cost/Loan"}</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <span className="inline-flex items-center gap-1">
                                    Forecast Basis
                                    <span className="cursor-help text-slate-400 normal-case" title="What the forecast is built from — your own past campaigns of this type first, then comparable network campaigns. Your history is weighted more heavily.">ⓘ</span>
                                </span>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                <span className="inline-flex items-center gap-1">
                                    Forecast Conf.
                                    <span className="cursor-help text-slate-400 normal-case" title="How reliable this product's forecast is — driven mainly by how many of your own comparable campaigns back it, then network depth.">ⓘ</span>
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {forecasts.map((f) => (
                            <tr
                                key={f.product.id}
                                className={cn(
                                    "border-b border-slate-100 last:border-b-0",
                                    f.confidence === "low" && "bg-amber-50/40"
                                )}
                            >
                                <td className="px-6 py-3">
                                    <div className="font-medium text-slate-900">{f.product.productName}</div>
                                    <div className="text-xs text-slate-500">
                                        {f.product.isFeaturedOffer ? "Featured offer" : f.product.productType.replace(/_/g, " ")}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                    {isLocked ? (
                                        <span>{f.actualRedemption}% <span className="text-xs text-rose-600">vs {f.predRedemption}%</span></span>
                                    ) : (
                                        `${f.predRedemption}%`
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                    {isLocked ? (
                                        <span>${f.actualFundedVol}M <span className="text-xs text-slate-400">to date</span></span>
                                    ) : (
                                        `$${f.predFundedVol}M`
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                    {isLocked ? (
                                        <span>${f.actualCostPerLoan} <span className="text-xs text-rose-600">▲</span></span>
                                    ) : (
                                        `$${f.predCostPerLoan}`
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {f.ownCount === 0 ? (
                                        <span className="cursor-help" title={`You've never run this product, so there's no own-history to anchor the forecast — it relies entirely on ${f.networkCount} network campaigns, which is thin.`}>
                                            <span className="text-red-600 font-medium">0 yours</span>
                                            <span className="text-slate-400"> · {f.networkCount} network only</span>
                                        </span>
                                    ) : (
                                        <span className="cursor-help" title={`You've run ${f.ownCount} comparable campaign${f.ownCount > 1 ? "s" : ""}; the forecast leans mostly on yours, with ${f.networkCount.toLocaleString()} network campaigns as backup.`}>
                                            <span className="text-slate-700 font-medium">{f.ownCount} yours</span>
                                            <span className="text-slate-400"> + {f.networkCount.toLocaleString()} network</span>
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <ForecastMeter
                                        level={f.confidence}
                                        title={
                                            f.ownCount === 0
                                                ? `Low — you've never run this product, so there's no own-history. The forecast leans entirely on ${f.networkCount} network campaigns (thin). Treat it as a rough estimate.`
                                                : `${f.confidence === "high" ? "High" : "Medium"} — based on ${f.ownCount} of your comparable campaigns plus ${f.networkCount.toLocaleString()} network campaigns.`
                                        }
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                    {overall && !isLocked && (
                        <>
                            Total predicted funded volume{" "}
                            <strong className="text-slate-700">${overall.totalFunded.toFixed(1)}M</strong> across{" "}
                            {forecasts.length} product{forecasts.length > 1 ? "s" : ""}. Forecasts for products you&apos;ve
                            run before are anchored in your own results; products new to you are network-only and
                            lower-confidence.
                        </>
                    )}
                    {isLocked && "Actuals to date vs. forecast across all products."}
                </div>
            </div>

            {/* ── SECTION 3: AI Optimization ── */}
            <div>
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    AI Optimization
                </h3>

                {/* Goal selector */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h4 className="font-semibold text-slate-900">What do you want to optimize for?</h4>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Pick a goal — and, if you have one in mind, a target. Recommendations are tailored to it.
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Goal */}
                            <div className={goal.custom ? "col-span-3 sm:col-span-1" : "col-span-2"}>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Optimization goal <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={goalId}
                                    onChange={(e) => setGoalId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent"
                                >
                                    {GOALS.map((g) => (
                                        <option key={g.id} value={g.id}>{g.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Target amount — only for predefined goals that accept one */}
                            {!goal.custom && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Target{" "}
                                        <span className="text-slate-400 font-normal">(optional)</span>
                                    </label>
                                    {goal.unit ? (
                                        <div className="relative">
                                            {goal.unit === "$" && (
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                                            )}
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={target}
                                                onChange={(e) => setTarget(e.target.value)}
                                                placeholder={goal.placeholder}
                                                className={cn(
                                                    "w-full py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent",
                                                    goal.unit === "$" ? "pl-7 pr-3" : "px-3"
                                                )}
                                            />
                                            {goal.unit === "%" && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                                            )}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            disabled
                                            placeholder="No numeric target for this goal"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                                        />
                                    )}
                                </div>
                            )}

                            {/* Free-text goal — when "Other" is selected */}
                            {goal.custom && (
                                <div className="col-span-3 sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Describe your goal <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={customGoal}
                                        onChange={(e) => setCustomGoal(e.target.value)}
                                        placeholder="e.g. Re-engage members who lapsed after their first auto loan"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                A target helps Claude calibrate how aggressive its recommendations should be. Leave it
                                blank for a general &ldquo;just improve it&rdquo; pass.
                            </p>
                            <button
                                onClick={handleGenerate}
                                disabled={(goal.custom && customGoal.trim() === "") || !dirty}
                                className="flex items-center gap-1.5 text-sm font-medium text-white bg-slate-900 px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Sparkles className="w-4 h-4" />
                                {dirty ? "Generate recommendations" : "Recommendations up to date"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Provenance */}
                <div className="flex items-start gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5 mb-4">
                    <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                        <strong>Generated by Claude</strong> from this campaign&apos;s configuration and the
                        cross-network insight library, to{" "}
                        <strong className="font-semibold">{appliedSummary}</strong>. Each recommendation shows its
                        predicted impact and the reasoning behind it.
                    </span>
                </div>

                {/* Confidence legend */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-5">
                    <span className="flex items-center gap-2">
                        <ForecastMeter level="high" title="" />
                        <strong className="text-slate-600">Forecast confidence</strong> — how much data backs a predicted number
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">HIGH CONFIDENCE</span>
                        <strong className="text-slate-600">Recommendation confidence</strong> — how strong the evidence is that a change will help
                    </span>
                    <span className="text-slate-400 w-full">
                        Both are driven by how many comparable campaigns back them —{" "}
                        <strong className="text-slate-500">your own first</strong>, then the network.
                    </span>
                </div>

                <div className="space-y-4">
                    {recommendations.map((rec) => (
                        <RecommendationCard key={rec.id} rec={rec} isLocked={isLocked} />
                    ))}
                </div>

                <div className="text-xs text-slate-400 px-1 py-3 leading-relaxed">
                    Predictions and estimated lifts are directional, drawn from your own history plus comparable
                    cross-network campaigns — not guarantees. Recommendations are scoped to this single campaign.
                    No change is applied until you choose to. Live campaigns are locked and cannot be edited.
                    Recommendations never override your FI&apos;s credit-policy guardrails.
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────

function TabHeader() {
    return (
        <div>
            <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                AI Optimization
                <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    BETA
                </span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
                See how this campaign is predicted to perform — overall and per product, built from{" "}
                <strong className="text-slate-700">your own campaign history first</strong> — then let Claude
                suggest adjustments to improve it.
            </p>
        </div>
    );
}

function StatCard({
    value,
    label,
    sub,
    valueColor = "text-slate-900",
}: {
    value: string;
    label: string;
    sub?: string;
    valueColor?: string;
}) {
    return (
        <div>
            <div className={cn("text-2xl font-bold", valueColor)}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
            {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
        </div>
    );
}

function CompareCard({
    label,
    actual,
    actualSuffix,
    actualNode,
    note,
    noteColor = "text-slate-400",
}: {
    label: string;
    actual?: string;
    actualSuffix?: string;
    actualNode?: React.ReactNode;
    note: string;
    noteColor?: string;
}) {
    return (
        <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="flex items-baseline gap-2 mt-1">
                {actualNode ?? <span className="text-2xl font-bold text-slate-900">{actual}</span>}
                {actualSuffix && <span className="text-xs text-slate-400">{actualSuffix}</span>}
            </div>
            <div className={cn("text-[11px] mt-0.5", noteColor)}>{note}</div>
        </div>
    );
}

// ── Recommendation model + card ───────────────────────────────────────

type RecConfidence = "high" | "review" | "testing";

type RecIcon =
    | "copy"
    | "channel"
    | "review"
    | "eligibility"
    | "segment"
    | "ordering"
    | "imagery"
    | "pricing"
    | "form";

interface Recommendation {
    id: string;
    icon: RecIcon;
    title: string;
    affects: string;
    impact: string;
    confidence: RecConfidence;
    why: string;
    guardrail?: string;
    target: string; // e.g. "Products · offer copy"
}

// Recommendations are tailored to the selected goal. Each goal pulls from a
// different mix of the brief's optimization levers (copy, channel, eligibility,
// form length, presentation order, imagery, segment, pricing). A shared
// "review the weak product" rec is appended where a low-confidence product exists.
function buildRecommendations(forecasts: ProductForecast[], goalId: string): Recommendation[] {
    if (forecasts.length === 0) return [];

    const featured = forecasts.find((f) => f.product.isFeaturedOffer) ?? forecasts[0];
    const name = featured.product.productName;
    const lifted = (delta: number) => +(featured.predRedemption + delta).toFixed(1);

    // Shared: flag the lowest-own-history product for review (always useful)
    const weak = [...forecasts].sort((a, b) => a.ownCount - b.ownCount)[0];
    const reviewRec: Recommendation | null =
        weak && weak.confidence === "low"
            ? {
                  id: "rec-review",
                  icon: "review",
                  title: `Reconsider the ${weak.product.productName} product`,
                  affects: weak.product.productName,
                  impact: `low-confidence forecast (${weak.predRedemption}%, $${weak.predFundedVol}M)`,
                  confidence: "review",
                  why:
                      weak.ownCount === 0
                          ? `You've never run this product, so there's no own-history to anchor it — the forecast leans on just ${weak.networkCount} network campaigns and shows the weakest predicted performance. Options: run it as a deliberate small test to build your own data, tighten eligibility to a higher-propensity segment, or drop it so it doesn't dilute the campaign.`
                          : `This product has thin comparable data and weak predicted performance. Options: tighten its eligibility to a higher-propensity segment, swap it for a stronger offer, or drop it.`,
                  guardrail:
                      "New or thin-data product — forecast is largely network-only and directional. Anything touching eligibility stays within your FI's credit-policy guardrails.",
                  target: "Products",
              }
            : null;

    // Per-goal recommendation sets
    const byGoal: Record<string, Recommendation[]> = {
        redemption: [
            {
                id: "redemption-copy",
                icon: "copy",
                title: `Lead the ${name} headline with monthly savings`,
                affects: name,
                impact: `raises predicted redemption ${featured.predRedemption}% → ~${lifted(1.5)}%`,
                confidence: "high",
                why: `In your own recent comparable campaigns, the variant that led with a concrete dollar-savings headline outperformed — and the network shows the same pattern at scale (~1.5 points higher redemption). Applied to this product's forecast, that raises predicted redemption from ${featured.predRedemption}% to roughly ${lifted(1.5)}%.`,
                target: "Products · offer copy",
            },
            {
                id: "redemption-sms",
                icon: "channel",
                title: "Add an SMS follow-up 3 days after the email send",
                affects: "all products",
                impact: "raises overall predicted redemption by ~0.8 points",
                confidence: "high",
                why: "Sends are email-only and SMS is unused, while most of your eligible file has SMS consent. A short SMS nudge to non-openers converted measurably in comparable campaigns.",
                target: "Channel settings",
            },
            {
                id: "redemption-form",
                icon: "form",
                title: "Drop the 2 optional fields from the application form",
                affects: name,
                impact: "small redemption lift, lower certainty",
                confidence: "testing",
                why: "Your form has two optional fields that correlate weakly with completion drop-off. Removing optional fields shortened time-to-apply in the network, though the signal for this specific campaign type is thinner — treat as a test.",
                target: "Products · form config",
            },
        ],
        "funded-volume": [
            {
                id: "volume-eligibility",
                icon: "eligibility",
                title: `Widen ${name} eligibility to the 660–679 FICO band`,
                affects: name,
                impact: "+2,300 reachable members, est. +$0.4M funded",
                confidence: "review",
                why: `Comparable campaigns that extended the FICO floor from 680 to 660 — paired with a matching rate tier — grew funded volume without a proportional rise in default rate. This adds roughly 2,300 members to your addressable pool.`,
                guardrail: "Touches credit policy — requires sign-off from a credit-policy owner before the eligibility rule changes. Stays within your FI's guardrails.",
                target: "Products · eligibility",
            },
            {
                id: "volume-ordering",
                icon: "ordering",
                title: `Move ${name} to the top of the storefront`,
                affects: "Storefront presentation",
                impact: "est. +6% funded volume on the featured product",
                confidence: "high",
                why: "Presentation order strongly drives volume: the top storefront slot consistently captures the most starts. Your highest-confidence, highest-volume product isn't currently first.",
                target: "Products · ordering",
            },
            {
                id: "volume-sms",
                icon: "channel",
                title: "Add an SMS follow-up to reach non-openers",
                affects: "all products",
                impact: "est. +5% total funded volume",
                confidence: "high",
                why: "Email-only sending leaves volume on the table. An SMS nudge to consented non-openers recovered a measurable share of funded loans in comparable campaigns.",
                target: "Channel settings",
            },
        ],
        "auto-originations": [
            {
                id: "auto-copy",
                icon: "copy",
                title: `Reframe ${name} around "lower your monthly payment"`,
                affects: name,
                impact: `raises predicted redemption ${featured.predRedemption}% → ~${lifted(1.8)}%`,
                confidence: "high",
                why: `For auto products, payment-reduction framing out-pulled rate-focused framing in both your own history and the network. It's especially effective for members with an existing auto loan — most of your eligible file.`,
                target: "Products · offer copy",
            },
            {
                id: "auto-segment",
                icon: "segment",
                title: "Prioritize members with a maturing auto loan elsewhere",
                affects: "Targeting",
                impact: "higher-intent segment, est. +9% auto originations",
                confidence: "high",
                why: "Members whose external auto loans are within 6 months of payoff convert far above baseline on refinance and new-auto offers. Your enhanced file flags this cohort.",
                target: "File Processing · segments",
            },
            {
                id: "auto-pricing",
                icon: "pricing",
                title: "Add a 0.25% rate discount with autopay enrollment",
                affects: name,
                impact: "est. +4% originations, modest margin cost",
                confidence: "testing",
                why: "An autopay rate incentive nudged auto originations upward in the network and improves repayment behavior. Margin impact is small but real — worth testing against your target.",
                target: "Products · pricing",
            },
        ],
        "cost-per-loan": [
            {
                id: "cost-channel",
                icon: "channel",
                title: "Shift spend from direct mail to email + SMS",
                affects: "Channel mix",
                impact: "est. −$70 cost per funded loan",
                confidence: "high",
                why: "Direct mail is your highest cost-per-funded channel. Reallocating to email plus a consented SMS follow-up held redemption roughly flat at a fraction of the cost in comparable campaigns.",
                target: "Channel settings",
            },
            {
                id: "cost-suppress",
                icon: "segment",
                title: "Suppress the lowest-propensity decile from the send",
                affects: "Targeting",
                impact: "est. −$40 cost per funded loan",
                confidence: "high",
                why: "The bottom propensity decile rarely converts but still costs to reach. Suppressing it concentrates spend on members likely to fund, lowering blended cost with negligible volume loss.",
                target: "File Processing · segments",
            },
            {
                id: "cost-drop",
                icon: "review",
                title: `Drop ${weak ? weak.product.productName : "the weakest product"} to lower blended cost`,
                affects: weak ? weak.product.productName : "weakest product",
                impact: "removes your highest predicted cost-per-loan",
                confidence: "review",
                why: `${weak ? weak.product.productName : "This product"} carries the highest predicted cost per funded loan and the weakest predicted redemption. Removing it lowers the campaign's blended cost — at the cost of some reach.`,
                guardrail: "Directional — confirm the volume trade-off is acceptable before removing a product.",
                target: "Products",
            },
        ],
        "expand-segment": [
            {
                id: "segment-eligibility",
                icon: "eligibility",
                title: "Widen eligibility to the 660–679 FICO band",
                affects: "Eligibility rules",
                impact: "+2,300 reachable members",
                confidence: "review",
                why: "Extending the FICO floor from 680 to 660 with a matching rate tier expands your addressable pool by ~2,300 members, in line with comparable campaigns.",
                guardrail: "Touches credit policy — requires credit-policy owner sign-off. Stays within your FI's guardrails.",
                target: "Products · eligibility",
            },
            {
                id: "segment-thin-file",
                icon: "segment",
                title: "Include thin-file members with a soft-pull prequal path",
                affects: "Targeting",
                impact: "est. +1,800 reachable members",
                confidence: "testing",
                why: "Members with limited bureau history are currently excluded. Routing them through a soft-pull prequalification flow surfaces qualified members the campaign would otherwise miss. Conversion for this group is less certain — worth a measured test.",
                target: "File Processing",
            },
            {
                id: "segment-young",
                icon: "copy",
                title: "Add a first-time-borrower variant of the offer",
                affects: name,
                impact: "reaches under-35 members, est. +0.6 points redemption in segment",
                confidence: "testing",
                why: "Younger members respond to different copy and proof points than your core base. A tailored variant broadens who the offer lands with, though own-history for this segment is thin.",
                target: "Products · offer copy",
            },
        ],
        "channel-mix": [
            {
                id: "channel-sms",
                icon: "channel",
                title: "Add an SMS follow-up 3 days after the email send",
                affects: "all products",
                impact: "est. +0.8 points redemption, low incremental cost",
                confidence: "high",
                why: "100% of sends are email; SMS is unused and most of your file has SMS consent. A short follow-up to non-openers is among the highest-ROI channel changes available to this campaign.",
                target: "Channel settings",
            },
            {
                id: "channel-timing",
                icon: "ordering",
                title: "Move the email send to Tuesday morning",
                affects: "Send timing",
                impact: "est. +0.4 points open-to-redeem",
                confidence: "testing",
                why: "Open and click rates for financial offers skew toward early-week mornings in the network. Your current mid-week-afternoon send underperforms that window — a low-risk test.",
                target: "Channel settings",
            },
            {
                id: "channel-mail",
                icon: "pricing",
                title: "Reallocate direct-mail budget to digital",
                affects: "Channel mix",
                impact: "similar reach at lower cost per funded loan",
                confidence: "high",
                why: "Direct mail is your costliest channel per funded loan. Shifting a portion to email and SMS preserved reach at materially lower cost in comparable campaigns.",
                target: "Channel settings",
            },
        ],
    };

    // Custom / unknown goal: a sensible default mix
    const defaultRecs = byGoal["redemption"];
    const goalRecs = byGoal[goalId] ?? defaultRecs;

    // Append the shared review rec if it isn't already a per-goal rec for that product
    const out = [...goalRecs];
    if (reviewRec && !out.some((r) => r.affects === reviewRec.affects)) {
        out.push(reviewRec);
    }
    return out;
}

function RecommendationCard({ rec, isLocked }: { rec: Recommendation; isLocked: boolean }) {
    const iconMap: Record<RecIcon, typeof MessageSquareText> = {
        copy: MessageSquareText,
        channel: Megaphone,
        review: AlertTriangle,
        eligibility: ShieldCheck,
        segment: Users,
        ordering: ListOrdered,
        imagery: ImageIcon,
        pricing: DollarSign,
        form: ClipboardList,
    };
    const Icon = iconMap[rec.icon];
    const isReview = rec.confidence === "review";

    const confBadge =
        rec.confidence === "high"
            ? { text: "HIGH CONFIDENCE", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
            : rec.confidence === "review"
            ? { text: "REVIEW NEEDED", cls: "bg-amber-50 text-amber-700 border-amber-200" }
            : { text: "WORTH TESTING", cls: "bg-slate-100 text-slate-500 border-slate-200" };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg shrink-0", isReview ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600")}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                            <span className={cn("text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded-full border", confBadge.cls)}>
                                {confBadge.text}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Affects <span className="font-medium">{rec.affects}</span> · {rec.impact}
                        </p>
                    </div>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{rec.target}</span>
            </div>
            <div className="px-6 pb-4 pl-[68px] space-y-3">
                <div className="text-sm text-slate-700">
                    <p className="font-medium text-slate-900 mb-1">Why</p>
                    <p>{rec.why}</p>
                </div>
                {rec.guardrail && (
                    <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{rec.guardrail}</span>
                    </div>
                )}
            </div>
            <div className="px-6 py-3 pl-[68px] bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                {isLocked ? (
                    <>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-white">
                            <Save className="w-4 h-4" />
                            Save to next campaign
                        </button>
                        <span className="text-xs text-slate-400">Locked — can&apos;t apply to a live campaign</span>
                    </>
                ) : (
                    <>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800">
                            {isReview ? <FileText className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                            {isReview ? "Review in Products" : "Apply"}
                        </button>
                        {!isReview && (
                            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-white">
                                Edit first
                            </button>
                        )}
                    </>
                )}
                <button className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-600 ml-auto">
                    Dismiss
                </button>
            </div>
        </div>
    );
}
