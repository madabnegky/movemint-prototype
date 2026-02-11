"use client";

import { useStore, FeatureFlags } from "@/context/StoreContext";
import { RotateCcw, Sparkles, LayoutGrid, MessageSquare, BarChart3, Layers, TrendingUp, CreditCard, Zap, Eye, Mountain, Gauge, SlidersHorizontal, Brain, UserCheck, Infinity, GitMerge } from "lucide-react";

interface FlagConfig {
    key: keyof FeatureFlags;
    label: string;
    description: string;
    icon: React.ReactNode;
}

interface FlagSection {
    title: string;
    description: string;
    flags: FlagConfig[];
}

const FLAG_SECTIONS: FlagSection[] = [
    {
        title: "Storefront",
        description: "Features for the member-facing storefront experience",
        flags: [
            {
                key: "storefront_heroAutoRotate",
                label: "Auto-Rotate Hero",
                description: "Automatically cycle through featured offers in the hero carousel",
                icon: <RotateCcw className="w-5 h-5" />
            },
            {
                key: "storefront_showBadges",
                label: "Show Badges",
                description: "Display variant badges (Preapproved, Apply Now, etc.) on offer cards",
                icon: <Sparkles className="w-5 h-5" />
            },
            {
                key: "storefront_animatedCards",
                label: "Animated Cards",
                description: "Enable hover animations and transitions on offer cards",
                icon: <LayoutGrid className="w-5 h-5" />
            },
            {
                key: "storefront_creditMountain",
                label: "Credit Mountain",
                description: "Show AI Credit Coach when member has no preapproved offers (bypasses No Offers message)",
                icon: <Mountain className="w-5 h-5" />
            }
        ]
    },
    {
        title: "Landing Page",
        description: "Features for the public landing page",
        flags: [
            {
                key: "landing_showTestimonials",
                label: "Testimonials Section",
                description: "Show member testimonials on the landing page",
                icon: <MessageSquare className="w-5 h-5" />
            },
            {
                key: "landing_showStats",
                label: "Stats Section",
                description: "Display key metrics and statistics on the landing page",
                icon: <BarChart3 className="w-5 h-5" />
            }
        ]
    },
    {
        title: "Home Banking",
        description: "Features for the home banking dashboard experience",
        flags: [
            {
                key: "homeBanking_showOfferWidget",
                label: "Offer Widget",
                description: "Show the personalized offers carousel on the dashboard",
                icon: <CreditCard className="w-5 h-5" />
            },
            {
                key: "homeBanking_showQuickActions",
                label: "Quick Actions",
                description: "Display quick action buttons (Transfer, Pay Bill, etc.)",
                icon: <Zap className="w-5 h-5" />
            },
            {
                key: "homeBanking_showAccountBalances",
                label: "Account Balances",
                description: "Show account balance summary on the dashboard",
                icon: <Eye className="w-5 h-5" />
            }
        ]
    },
    {
        title: "Consumer Prequalification",
        description: "Consumer-initiated prequalification via TransUnion soft pull",
        flags: [
            {
                key: "consumer_prequalification",
                label: "Consumer Prequalification",
                description: "Allow consumers to self-initiate prequalification by entering their info (Name, Address, DOB, SSN) for a soft credit pull",
                icon: <UserCheck className="w-5 h-5" />
            }
        ]
    },
    {
        title: "Admin",
        description: "Features for the admin configuration interface",
        flags: [
            {
                key: "admin_bulkActions",
                label: "Bulk Actions",
                description: "Enable bulk edit and delete operations in Offer Manager",
                icon: <Layers className="w-5 h-5" />
            },
            {
                key: "admin_offerAnalytics",
                label: "Offer Analytics",
                description: "Show performance metrics and analytics for offers",
                icon: <TrendingUp className="w-5 h-5" />
            },
            {
                key: "admin_optimizationDashboard",
                label: "Optimization Dashboard",
                description: "Show Optimization Dashboard step in Campaign File Processing workflow",
                icon: <Gauge className="w-5 h-5" />
            },
            {
                key: "admin_optimizationRevio",
                label: "Revio Integration",
                description: "Enable Revio behavioral data optimization slider (requires Optimization Dashboard)",
                icon: <SlidersHorizontal className="w-5 h-5" />
            },
            {
                key: "admin_optimizationVertice",
                label: "Vertice AI Integration",
                description: "Enable Vertice AI propensity score optimization (requires Optimization Dashboard)",
                icon: <Brain className="w-5 h-5" />
            }
        ]
    },
    {
        title: "Campaigns",
        description: "Campaign management features",
        flags: [
            {
                key: "campaigns_perpetualType",
                label: "Perpetual Campaigns",
                description: "Enable perpetual (always-on) campaign type with automatic offer lifecycle management",
                icon: <Infinity className="w-5 h-5" />
            },
            {
                key: "campaigns_reconciliationCustomRules",
                label: "Custom Reconciliation Rules (Loan Class)",
                description: "Enable custom reconciliation rules configured by loan class (Vehicle Loan, Credit Card, etc.)",
                icon: <GitMerge className="w-5 h-5" />
            },
            {
                key: "campaigns_reconciliationProductRules",
                label: "Custom Reconciliation Rules (Product)",
                description: "Enable custom reconciliation rules configured by specific campaign products (requires manual reconciliation)",
                icon: <GitMerge className="w-5 h-5" />
            }
        ]
    }
];

export default function FeatureFlagsPage() {
    const { featureFlags, updateFeatureFlags, resetFeatureFlags } = useStore();

    const handleToggle = (key: keyof FeatureFlags) => {
        updateFeatureFlags({ [key]: !featureFlags[key] });
    };

    const enabledCount = Object.values(featureFlags).filter(Boolean).length;
    const totalCount = Object.keys(featureFlags).length;

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Feature Flags</h1>
                    <p className="text-slate-600">
                        Toggle experimental features on and off across the prototype.
                        Changes apply immediately.
                    </p>
                </div>
                <button
                    onClick={resetFeatureFlags}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Defaults
                </button>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 text-sm mb-1">Features Enabled</p>
                        <p className="text-3xl font-bold">{enabledCount} / {totalCount}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-indigo-100 text-sm mb-1">Status</p>
                        <p className="text-lg font-medium">
                            {enabledCount === totalCount ? "All features active" :
                                enabledCount === 0 ? "Baseline mode" :
                                    "Custom configuration"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Flag Sections */}
            <div className="space-y-8">
                {FLAG_SECTIONS.map((section) => (
                    <div key={section.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {/* Section Header */}
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                            <p className="text-sm text-slate-500 mt-0.5">{section.description}</p>
                        </div>

                        {/* Flags */}
                        <div className="divide-y divide-slate-100">
                            {section.flags.map((flag) => (
                                <div
                                    key={flag.key}
                                    className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg ${featureFlags[flag.key] ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {flag.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-900">{flag.label}</h3>
                                            <p className="text-sm text-slate-500 mt-0.5">{flag.description}</p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => handleToggle(flag.key)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${featureFlags[flag.key] ? 'bg-indigo-600' : 'bg-slate-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${featureFlags[flag.key] ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Help Text */}
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                    <strong>Tip:</strong> Feature flags persist in your browser's local storage.
                    To test a clean slate, use the "Reset to Defaults" button or clear your browser data.
                </p>
            </div>
        </div>
    );
}
