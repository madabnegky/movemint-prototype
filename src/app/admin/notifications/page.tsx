"use client";

import { useState } from "react";
import {
    Bell,
    BellOff,
    Check,
    ChevronDown,
    ChevronRight,
    Car,
    Home,
    CreditCard,
    Landmark,
    DollarSign,
    PiggyBank,
    Shield,
    Smartphone,
    Send,
    Eye,
    Sparkles,
    TrendingUp,
    AlertTriangle,
    RefreshCw,
    BarChart3,
    Users,
    Zap,
    MessageSquare,
    Building2,
    User,
    Settings,
    Moon,
    Trash2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────

type ViewMode = "admin" | "client" | "member";

interface FrequencyRules {
    maxPerDay: number;
    maxPerWeek: number;
    minHoursBetween: number;
    quietHoursStart: string;
    quietHoursEnd: string;
    quietHoursTimezone: string;
}

interface OfferEventConfig {
    enabled: boolean;
    priority: "high" | "medium" | "low";
    template: string;
    daysBeforeExpiry?: number[];
}

interface ProductRule {
    enabled: boolean;
    priority: number;
    allowPush: boolean;
}

interface NotificationTemplate {
    id: string;
    name: string;
    title: string;
    bodyVariants: Record<string, string>;
    deepLink: string;
}

// ── Default Data ───────────────────────────────────

const DEFAULT_FREQUENCY: FrequencyRules = {
    maxPerDay: 2,
    maxPerWeek: 5,
    minHoursBetween: 4,
    quietHoursStart: "21:00",
    quietHoursEnd: "08:00",
    quietHoursTimezone: "America/Chicago",
};

const DEFAULT_EVENTS: Record<string, OfferEventConfig> = {
    "offer.created": { enabled: true, priority: "high", template: "new_offer" },
    "offer.improved": { enabled: true, priority: "high", template: "improved_offer" },
    "offer.expiring": { enabled: true, priority: "medium", template: "expiring_offer", daysBeforeExpiry: [7, 3, 1] },
    "offer.refreshed": { enabled: false, priority: "low", template: "refreshed_offer" },
};

const DEFAULT_PRODUCTS: Record<string, ProductRule> = {
    auto_loan: { enabled: true, priority: 1, allowPush: true },
    heloc: { enabled: true, priority: 2, allowPush: true },
    credit_card: { enabled: true, priority: 3, allowPush: true },
    personal_loan: { enabled: true, priority: 4, allowPush: true },
    mortgage: { enabled: true, priority: 5, allowPush: true },
    checking: { enabled: true, priority: 6, allowPush: false },
    certificate: { enabled: false, priority: 7, allowPush: false },
};

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
    {
        id: "new_offer",
        name: "New Offer",
        title: "New offer from {{cuName}}",
        bodyVariants: {
            auto_loan: "You're pre-approved for {{rate}}% on a {{subtype}} auto loan up to {{amount}}",
            heloc: "Tap into your home equity — {{amount}} line at {{rate}}%",
            credit_card: "A {{cardName}} card is waiting for you — {{rate}}% intro APR",
            personal_loan: "You're approved for a personal loan up to {{amount}}",
            mortgage: "Your mortgage options just got better — rates from {{rate}}%",
            _default: "You have a new offer available — tap to view",
        },
        deepLink: "extension/CUnexusDSF/offers?id={{offerId}}",
    },
    {
        id: "improved_offer",
        name: "Improved Offer",
        title: "Your offer just got better",
        bodyVariants: {
            auto_loan: "Your auto loan rate dropped to {{rate}}% — up to {{amount}}",
            heloc: "Your home equity line just increased to {{amount}}",
            _default: "One of your offers has been updated — tap to see what changed",
        },
        deepLink: "extension/CUnexusDSF/offers?id={{offerId}}",
    },
    {
        id: "expiring_offer",
        name: "Expiring Offer",
        title: "Don't miss out",
        bodyVariants: {
            _1_day: "Your {{productName}} offer expires tomorrow",
            _3_days: "Your {{productName}} offer expires in 3 days",
            _7_days: "Your {{productName}} offer expires next week",
            _default: "Your {{productName}} offer is expiring soon — tap to review",
        },
        deepLink: "extension/CUnexusDSF/offers?id={{offerId}}",
    },
    {
        id: "refreshed_offer",
        name: "Refreshed Offer",
        title: "Your offers have been updated",
        bodyVariants: {
            _default: "Your personalized offers have been refreshed — tap to see the latest",
        },
        deepLink: "extension/CUnexusDSF/offers",
    },
];

// ── Helpers ─────────────────────────────────────────

const PRODUCT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    auto_loan: { label: "Auto Loan", icon: <Car className="w-4 h-4" />, color: "blue" },
    heloc: { label: "HELOC", icon: <Home className="w-4 h-4" />, color: "emerald" },
    credit_card: { label: "Credit Card", icon: <CreditCard className="w-4 h-4" />, color: "purple" },
    personal_loan: { label: "Personal Loan", icon: <DollarSign className="w-4 h-4" />, color: "amber" },
    mortgage: { label: "Mortgage", icon: <Landmark className="w-4 h-4" />, color: "rose" },
    checking: { label: "Checking", icon: <PiggyBank className="w-4 h-4" />, color: "cyan" },
    certificate: { label: "Certificate", icon: <Shield className="w-4 h-4" />, color: "slate" },
};

const EVENT_META: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
    "offer.created": { label: "New Offer Created", description: "When a new pre-approved offer is generated for a member", icon: <Sparkles className="w-5 h-5" /> },
    "offer.improved": { label: "Offer Improved", description: "When an existing offer's terms get better (lower rate, higher amount)", icon: <TrendingUp className="w-5 h-5" /> },
    "offer.expiring": { label: "Offer Expiring", description: "Reminder notifications before an offer expires", icon: <AlertTriangle className="w-5 h-5" /> },
    "offer.refreshed": { label: "Offers Refreshed", description: "When a member's offers are recalculated after a data update", icon: <RefreshCw className="w-5 h-5" /> },
};

const TIMEZONES = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Anchorage",
    "Pacific/Honolulu",
];

// ── Shared Components ──────────────────────────────

function Toggle({ enabled, onChange, size = "default" }: { enabled: boolean; onChange: (v: boolean) => void; size?: "default" | "lg" }) {
    const sizeClasses = size === "lg"
        ? { track: "h-7 w-12", thumb: "h-5 w-5", on: "translate-x-6", off: "translate-x-1" }
        : { track: "h-6 w-11", thumb: "h-4 w-4", on: "translate-x-6", off: "translate-x-1" };
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex ${sizeClasses.track} items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${enabled ? "bg-indigo-600" : "bg-slate-200"}`}
        >
            <span className={`inline-block ${sizeClasses.thumb} transform rounded-full bg-white transition-transform ${enabled ? sizeClasses.on : sizeClasses.off}`} />
        </button>
    );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
    const styles = {
        high: "bg-red-100 text-red-700",
        medium: "bg-amber-100 text-amber-700",
        low: "bg-slate-100 text-slate-600",
    };
    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[priority]}`}>
            {priority}
        </span>
    );
}

function Section({ title, description, children, badge }: { title: string; description?: string; children: React.ReactNode; badge?: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-slate-900">{title}</h2>
                    {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
                </div>
                {badge}
            </div>
            {children}
        </div>
    );
}

function NotificationPreview({ template, product }: { template: NotificationTemplate; product: string }) {
    const body = template.bodyVariants[product] || template.bodyVariants._default || "";
    const previewBody = body
        .replace("{{cuName}}", "Demopolis FCU")
        .replace("{{rate}}", "3.9")
        .replace("{{amount}}", "$35,000")
        .replace("{{subtype}}", "new")
        .replace("{{cardName}}", "Visa Platinum")
        .replace("{{productName}}", PRODUCT_META[product]?.label || "Auto Loan")
        .replace("{{offerId}}", "offer_123");
    const previewTitle = template.title.replace("{{cuName}}", "Demopolis FCU");

    return (
        <div className="bg-slate-900 rounded-2xl p-4 max-w-xs shadow-xl">
            <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900">Demopolis FCU</span>
                            <span className="text-[10px] text-slate-400">now</span>
                        </div>
                        <p className="text-xs font-medium text-slate-800 mt-0.5">{previewTitle}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{previewBody}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════
//  ADMIN VIEW
// ══════════════════════════════════════════════════════

function AdminView({
    masterEnabled, setMasterEnabled, frequency, setFrequency,
    events, setEvents, products, setProducts, templates,
    expandedTemplate, setExpandedTemplate, previewProduct, setPreviewProduct,
}: {
    masterEnabled: boolean; setMasterEnabled: (v: boolean) => void;
    frequency: FrequencyRules; setFrequency: (v: FrequencyRules) => void;
    events: Record<string, OfferEventConfig>; setEvents: (v: Record<string, OfferEventConfig>) => void;
    products: Record<string, ProductRule>; setProducts: (v: Record<string, ProductRule>) => void;
    templates: NotificationTemplate[];
    expandedTemplate: string | null; setExpandedTemplate: (v: string | null) => void;
    previewProduct: string; setPreviewProduct: (v: string) => void;
}) {
    const enabledProductCount = Object.values(products).filter(p => p.enabled && p.allowPush).length;
    const enabledEventCount = Object.values(events).filter(e => e.enabled).length;

    return (
        <div className="space-y-8">
            {/* Summary Banner */}
            <div className={`rounded-xl p-6 text-white transition-all ${masterEnabled ? "bg-gradient-to-r from-indigo-500 to-purple-600" : "bg-slate-400"}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {masterEnabled ? <Bell className="w-8 h-8" /> : <BellOff className="w-8 h-8" />}
                        <div>
                            <p className="text-sm opacity-80">Platform Notification Status</p>
                            <p className="text-xl font-bold">
                                {masterEnabled ? "Active" : "Disabled"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        {masterEnabled && (
                            <>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{enabledEventCount}</p>
                                    <p className="text-xs opacity-80">Event Triggers</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{enabledProductCount}</p>
                                    <p className="text-xs opacity-80">Product Types</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{frequency.maxPerDay}</p>
                                    <p className="text-xs opacity-80">Max/Day</p>
                                </div>
                            </>
                        )}
                        <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                            <span className="text-sm">Master</span>
                            <Toggle enabled={masterEnabled} onChange={setMasterEnabled} />
                        </div>
                    </div>
                </div>
            </div>

            {masterEnabled && (
                <>
                    {/* Provider */}
                    <Section title="Provider" description="Push notification delivery provider">
                        <div className="p-6">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                                    <Smartphone className="w-6 h-6 text-slate-700" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900">Q2 Mobile SDK + Firebase Cloud Messaging</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Delivers via FCM through the Q2 home banking app. Deep links into CUnexus DSF extension.</p>
                                </div>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Connected</span>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-4">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-500">Deep Link Base</p>
                                    <p className="text-sm font-mono text-slate-700 mt-0.5">extension/CUnexusDSF/</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-500">SDK Module</p>
                                    <p className="text-sm font-mono text-slate-700 mt-0.5">cunexus_dsf_push</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-500">Registered Devices</p>
                                    <p className="text-sm font-semibold text-slate-700 mt-0.5">2,847</p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Event Triggers */}
                    <Section
                        title="Event Triggers"
                        description="Choose which offer lifecycle events trigger push notifications"
                        badge={<span className="text-xs text-slate-500">{enabledEventCount} of {Object.keys(events).length} active</span>}
                    >
                        <div className="divide-y divide-slate-100">
                            {Object.entries(events).map(([eventKey, config]) => {
                                const meta = EVENT_META[eventKey];
                                return (
                                    <div key={eventKey} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2 rounded-lg ${config.enabled ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                                                {meta.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-slate-900">{meta.label}</h3>
                                                    <PriorityBadge priority={config.priority} />
                                                </div>
                                                <p className="text-sm text-slate-500 mt-0.5">{meta.description}</p>
                                                {eventKey === "offer.expiring" && config.enabled && config.daysBeforeExpiry && (
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <span className="text-xs text-slate-500">Remind at:</span>
                                                        {config.daysBeforeExpiry.map(d => (
                                                            <span key={d} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                                                                {d} day{d !== 1 ? "s" : ""}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Toggle enabled={config.enabled} onChange={(v) => setEvents({ ...events, [eventKey]: { ...config, enabled: v } })} />
                                    </div>
                                );
                            })}
                        </div>
                    </Section>

                    {/* Product Rules */}
                    <Section
                        title="Product Types"
                        description="Control which product categories can trigger push notifications"
                        badge={<span className="text-xs text-slate-500">{enabledProductCount} of {Object.keys(products).length} push-enabled</span>}
                    >
                        <div className="divide-y divide-slate-100">
                            {Object.entries(products).map(([productKey, rule]) => {
                                const meta = PRODUCT_META[productKey];
                                return (
                                    <div key={productKey} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg ${rule.enabled ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                                                {meta.icon}
                                            </div>
                                            <h3 className="font-medium text-slate-900 text-sm">{meta.label}</h3>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">Priority</span>
                                                <select
                                                    value={rule.priority}
                                                    onChange={(e) => setProducts({ ...products, [productKey]: { ...rule, priority: Number(e.target.value) } })}
                                                    className="px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>#{n}</option>)}
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2 min-w-[120px] justify-end">
                                                <span className="text-xs text-slate-500">Push</span>
                                                <Toggle enabled={rule.allowPush} onChange={(v) => setProducts({ ...products, [productKey]: { ...rule, allowPush: v, enabled: v || rule.enabled } })} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                            <p className="text-xs text-slate-500">When multiple offers trigger simultaneously, the product with the highest priority (lowest number) is sent first.</p>
                        </div>
                    </Section>

                    {/* Templates */}
                    <Section title="Message Templates" description="Customize notification copy per event type and product">
                        <div className="divide-y divide-slate-100">
                            {templates.map((template) => {
                                const isExpanded = expandedTemplate === template.id;
                                return (
                                    <div key={template.id}>
                                        <button
                                            onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <MessageSquare className="w-5 h-5 text-slate-400" />
                                                <div>
                                                    <h3 className="font-medium text-slate-900">{template.name}</h3>
                                                    <p className="text-sm text-slate-500 mt-0.5">{Object.keys(template.bodyVariants).length} variant{Object.keys(template.bodyVariants).length !== 1 ? "s" : ""}</p>
                                                </div>
                                            </div>
                                            {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                                        </button>
                                        {isExpanded && (
                                            <div className="px-6 pb-6">
                                                <div className="grid grid-cols-5 gap-6">
                                                    <div className="col-span-3 space-y-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                                                            <input type="text" value={template.title} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-500 mb-1">Deep Link</label>
                                                            <input type="text" value={template.deepLink} readOnly className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 font-mono text-xs" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-500 mb-2">Body Variants</label>
                                                            <div className="space-y-2">
                                                                {Object.entries(template.bodyVariants).map(([key, body]) => (
                                                                    <div key={key} className="flex items-start gap-2">
                                                                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-1.5 whitespace-nowrap">{key}</span>
                                                                        <p className="text-sm text-slate-600 flex-1">{body}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-xs font-medium text-slate-500 mb-1">Preview</label>
                                                        <select value={previewProduct} onChange={(e) => setPreviewProduct(e.target.value)} className="w-full mb-3 px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none">
                                                            {Object.entries(PRODUCT_META).map(([key, meta]) => (
                                                                <option key={key} value={key}>{meta.label}</option>
                                                            ))}
                                                        </select>
                                                        <NotificationPreview template={template} product={previewProduct} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Section>

                    {/* Analytics */}
                    <Section title="Delivery Analytics" description="Notification performance (simulated data)">
                        <div className="p-6">
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                {[
                                    { label: "Sent (7d)", value: "1,247", icon: <Send className="w-4 h-4" />, change: "+12%" },
                                    { label: "Delivered", value: "1,183", icon: <Check className="w-4 h-4" />, change: "94.9%" },
                                    { label: "Opened", value: "412", icon: <Eye className="w-4 h-4" />, change: "34.8%" },
                                    { label: "Converted", value: "67", icon: <Zap className="w-4 h-4" />, change: "5.4%" },
                                ].map((stat) => (
                                    <div key={stat.label} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-slate-400">{stat.icon}</span>
                                            <span className="text-xs font-medium text-emerald-600">{stat.change}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="h-48 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm border border-slate-200">
                                <BarChart3 className="w-5 h-5 mr-2" />
                                Delivery timeline chart (coming soon)
                            </div>
                        </div>
                    </Section>

                    {/* Device Registry */}
                    <Section title="Device Registry" description="Members with registered push notification devices">
                        <div className="p-6">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-2xl font-bold text-slate-900">2,847</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Total Devices</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-2xl font-bold text-slate-900">2,391</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Unique Members</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-2xl font-bold text-slate-900">83.9%</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Push Opt-In Rate</p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="text-left py-2.5 px-4 font-medium text-slate-600">Member</th>
                                            <th className="text-left py-2.5 px-4 font-medium text-slate-600">Device</th>
                                            <th className="text-left py-2.5 px-4 font-medium text-slate-600">Platform</th>
                                            <th className="text-left py-2.5 px-4 font-medium text-slate-600">Last Active</th>
                                            <th className="text-left py-2.5 px-4 font-medium text-slate-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {[
                                            { member: "Sarah M.", device: "iPhone 15 Pro", platform: "iOS", lastActive: "2 min ago", status: "active" },
                                            { member: "James T.", device: "Pixel 8", platform: "Android", lastActive: "1 hr ago", status: "active" },
                                            { member: "Maria L.", device: "Samsung S24", platform: "Android", lastActive: "3 hrs ago", status: "active" },
                                            { member: "Robert K.", device: "iPhone 14", platform: "iOS", lastActive: "2 days ago", status: "stale" },
                                            { member: "Lisa W.", device: "iPad Air", platform: "iOS", lastActive: "5 days ago", status: "stale" },
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="py-2.5 px-4"><div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /><span className="text-slate-900">{row.member}</span></div></td>
                                                <td className="py-2.5 px-4 text-slate-600">{row.device}</td>
                                                <td className="py-2.5 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${row.platform === "iOS" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"}`}>{row.platform}</span></td>
                                                <td className="py-2.5 px-4 text-slate-500 text-xs">{row.lastActive}</td>
                                                <td className="py-2.5 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${row.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{row.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Section>
                </>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════
//  CLIENT (CU) VIEW
// ══════════════════════════════════════════════════════

function ClientView() {
    const [cuEnabled, setCuEnabled] = useState(true);
    const [cuFrequency, setCuFrequency] = useState({
        maxPerDay: 2,
        maxPerWeek: 5,
        minHoursBetween: 4,
        quietHoursStart: "21:00",
        quietHoursEnd: "08:00",
        quietHoursTimezone: "America/Chicago",
    });
    const [cuProducts, setCuProducts] = useState<Record<string, boolean>>({
        auto_loan: true,
        heloc: true,
        credit_card: true,
        personal_loan: true,
        mortgage: true,
        checking: false,
        certificate: false,
    });
    const [cuBranding, setCuBranding] = useState({
        displayName: "Demopolis Federal Credit Union",
        shortName: "Demopolis FCU",
        notificationTone: "default",
    });
    const [cuTemplateOverrides, setCuTemplateOverrides] = useState<Record<string, string>>({
        new_offer_title: "",
        improved_offer_title: "",
        expiring_offer_title: "",
    });
    const [saved, setSaved] = useState(false);

    const enabledProducts = Object.values(cuProducts).filter(Boolean).length;

    return (
        <div className="space-y-8">
            {/* CU Banner */}
            <div className={`rounded-xl p-6 text-white transition-all ${cuEnabled ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-slate-400"}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Building2 className="w-8 h-8" />
                        <div>
                            <p className="text-sm opacity-80">Credit Union Configuration</p>
                            <p className="text-xl font-bold">{cuBranding.shortName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        {cuEnabled && (
                            <>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{enabledProducts}</p>
                                    <p className="text-xs opacity-80">Products</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{cuFrequency.maxPerDay}/day</p>
                                    <p className="text-xs opacity-80">Max Freq</p>
                                </div>
                            </>
                        )}
                        <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                            <span className="text-sm">Enabled</span>
                            <Toggle enabled={cuEnabled} onChange={setCuEnabled} />
                        </div>
                    </div>
                </div>
            </div>

            {cuEnabled && (
                <>
                    {/* Branding */}
                    <Section title="Branding" description="How your credit union appears in push notifications">
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
                                    <input
                                        type="text"
                                        value={cuBranding.displayName}
                                        onChange={(e) => setCuBranding({ ...cuBranding, displayName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Full name shown in notification details</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Short Name</label>
                                    <input
                                        type="text"
                                        value={cuBranding.shortName}
                                        onChange={(e) => setCuBranding({ ...cuBranding, shortName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Abbreviated name for notification header (keep under 20 chars)</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notification Preview</label>
                                <div className="bg-slate-900 rounded-2xl p-4 max-w-xs shadow-xl">
                                    <div className="bg-white rounded-xl p-3 shadow-sm">
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Bell className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-slate-900">{cuBranding.shortName || "Your CU"}</span>
                                                    <span className="text-[10px] text-slate-400">now</span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-800 mt-0.5">New offer from {cuBranding.shortName || "Your CU"}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">You&apos;re pre-approved for 3.9% on a new auto loan up to $35,000</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* CU Frequency */}
                    <Section title="Frequency Limits" description="Set notification frequency for your members">
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Max per Day</label>
                                    <select
                                        value={cuFrequency.maxPerDay}
                                        onChange={(e) => setCuFrequency({ ...cuFrequency, maxPerDay: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        {[1, 2, 3, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Max per Week</label>
                                    <select
                                        value={cuFrequency.maxPerWeek}
                                        onChange={(e) => setCuFrequency({ ...cuFrequency, maxPerWeek: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Cooldown Period</label>
                                    <select
                                        value={cuFrequency.minHoursBetween}
                                        onChange={(e) => setCuFrequency({ ...cuFrequency, minHoursBetween: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                                    >
                                        {[2, 4, 6, 8, 12, 24].map(n => <option key={n} value={n}>{n} hours</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="border-t border-slate-100 pt-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Moon className="w-4 h-4" />
                                    Quiet Hours
                                </h3>
                                <p className="text-sm text-slate-500 mb-4">Notifications sent during quiet hours will be queued and delivered when the window opens.</p>
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Do Not Disturb Start</label>
                                        <input type="time" value={cuFrequency.quietHoursStart} onChange={(e) => setCuFrequency({ ...cuFrequency, quietHoursStart: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Do Not Disturb End</label>
                                        <input type="time" value={cuFrequency.quietHoursEnd} onChange={(e) => setCuFrequency({ ...cuFrequency, quietHoursEnd: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
                                        <select value={cuFrequency.quietHoursTimezone} onChange={(e) => setCuFrequency({ ...cuFrequency, quietHoursTimezone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                                            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace("America/", "").replace("Pacific/", "").replace("_", " ")}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* CU Product Preferences */}
                    <Section
                        title="Product Notifications"
                        description="Choose which product types your members can receive notifications about"
                        badge={<span className="text-xs text-slate-500">{enabledProducts} of {Object.keys(cuProducts).length} enabled</span>}
                    >
                        <div className="divide-y divide-slate-100">
                            {Object.entries(cuProducts).map(([productKey, enabled]) => {
                                const meta = PRODUCT_META[productKey];
                                return (
                                    <div key={productKey} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-lg ${enabled ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                                                {meta.icon}
                                            </div>
                                            <h3 className="font-medium text-slate-900 text-sm">{meta.label}</h3>
                                        </div>
                                        <Toggle enabled={enabled} onChange={(v) => setCuProducts({ ...cuProducts, [productKey]: v })} />
                                    </div>
                                );
                            })}
                        </div>
                    </Section>

                    {/* Template Overrides */}
                    <Section title="Message Customization" description="Override default notification copy with your own messaging (leave blank to use defaults)">
                        <div className="p-6 space-y-5">
                            {[
                                { key: "new_offer_title", label: "New Offer Title", placeholder: "New offer from {{cuName}}", icon: <Sparkles className="w-4 h-4" /> },
                                { key: "improved_offer_title", label: "Improved Offer Title", placeholder: "Your offer just got better", icon: <TrendingUp className="w-4 h-4" /> },
                                { key: "expiring_offer_title", label: "Expiring Offer Title", placeholder: "Don't miss out", icon: <AlertTriangle className="w-4 h-4" /> },
                            ].map((field) => (
                                <div key={field.key}>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                                        <span className="text-slate-400">{field.icon}</span>
                                        {field.label}
                                    </label>
                                    <input
                                        type="text"
                                        value={cuTemplateOverrides[field.key]}
                                        onChange={(e) => setCuTemplateOverrides({ ...cuTemplateOverrides, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
                                    />
                                </div>
                            ))}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs text-blue-700">
                                    Available variables: <code className="bg-blue-100 px-1 rounded">{"{{cuName}}"}</code> <code className="bg-blue-100 px-1 rounded">{"{{rate}}"}</code> <code className="bg-blue-100 px-1 rounded">{"{{amount}}"}</code> <code className="bg-blue-100 px-1 rounded">{"{{productName}}"}</code>
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* CU Analytics */}
                    <Section title="Your Performance" description="Notification metrics for Demopolis FCU">
                        <div className="p-6">
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: "Members Enrolled", value: "2,391", icon: <Users className="w-4 h-4" /> },
                                    { label: "Sent This Month", value: "3,842", icon: <Send className="w-4 h-4" /> },
                                    { label: "Open Rate", value: "34.8%", icon: <Eye className="w-4 h-4" /> },
                                    { label: "Offers Redeemed", value: "127", icon: <Zap className="w-4 h-4" /> },
                                ].map((stat) => (
                                    <div key={stat.label} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-slate-400">{stat.icon}</span>
                                        <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>
                </>
            )}

            {/* Save */}
            <div className="flex justify-end">
                <button
                    onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                    className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${saved ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                >
                    {saved ? <><Check className="w-4 h-4" />Saved!</> : "Save Changes"}
                </button>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════
//  MEMBER VIEW
// ══════════════════════════════════════════════════════

function MemberView() {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [categories, setCategories] = useState<Record<string, boolean>>({
        auto_loan: true,
        heloc: true,
        credit_card: true,
        personal_loan: true,
        mortgage: false,
    });
    const [quietOverride, setQuietOverride] = useState({
        enabled: false,
        start: "22:00",
        end: "07:00",
    });
    const [saved, setSaved] = useState(false);

    const SAMPLE_HISTORY = [
        { title: "New offer from Demopolis FCU", body: "You're pre-approved for 3.9% on a new auto loan up to $35,000", time: "Today, 10:32 AM", status: "opened", product: "auto_loan" },
        { title: "Your offer just got better", body: "Your home equity line just increased to $75,000", time: "Yesterday, 2:15 PM", status: "opened", product: "heloc" },
        { title: "Don't miss out", body: "Your Credit Card offer expires in 3 days", time: "Mar 8, 9:00 AM", status: "dismissed", product: "credit_card" },
        { title: "New offer from Demopolis FCU", body: "You're approved for a personal loan up to $15,000", time: "Mar 5, 11:45 AM", status: "tapped", product: "personal_loan" },
        { title: "Your offers have been updated", body: "Your personalized offers have been refreshed — tap to see the latest", time: "Mar 1, 8:00 AM", status: "dismissed", product: "_default" },
    ];

    return (
        <div className="space-y-8">
            {/* Member Banner */}
            <div className={`rounded-xl p-6 text-white transition-all ${pushEnabled ? "bg-gradient-to-r from-blue-500 to-cyan-600" : "bg-slate-400"}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm opacity-80">Member Preferences</p>
                            <p className="text-xl font-bold">Sarah Mitchell</p>
                            <p className="text-sm opacity-70">Member ID: CU-2847 &middot; Demopolis FCU</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold">12</p>
                            <p className="text-xs opacity-80">Received</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">8</p>
                            <p className="text-xs opacity-80">Opened</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                            <span className="text-sm">Push</span>
                            <Toggle enabled={pushEnabled} onChange={setPushEnabled} />
                        </div>
                    </div>
                </div>
            </div>

            {pushEnabled && (
                <>
                    {/* Category Preferences */}
                    <Section title="Notification Categories" description="Choose which types of offers you want to hear about">
                        <div className="divide-y divide-slate-100">
                            {Object.entries(categories).map(([productKey, enabled]) => {
                                const meta = PRODUCT_META[productKey];
                                if (!meta) return null;
                                const descriptions: Record<string, string> = {
                                    auto_loan: "New and used vehicle financing offers",
                                    heloc: "Home equity lines of credit",
                                    credit_card: "Credit card offers and upgrades",
                                    personal_loan: "Personal and signature loans",
                                    mortgage: "Home purchase and refinance offers",
                                };
                                return (
                                    <div key={productKey} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${enabled ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                                                {meta.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-slate-900">{meta.label}</h3>
                                                <p className="text-sm text-slate-500">{descriptions[productKey]}</p>
                                            </div>
                                        </div>
                                        <Toggle enabled={enabled} onChange={(v) => setCategories({ ...categories, [productKey]: v })} />
                                    </div>
                                );
                            })}
                        </div>
                    </Section>

                    {/* Quiet Hours Override */}
                    <Section title="Do Not Disturb" description="Set your own quiet hours (overrides credit union defaults)">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Moon className="w-5 h-5 text-slate-500" />
                                    <div>
                                        <h3 className="font-medium text-slate-900">Custom Quiet Hours</h3>
                                        <p className="text-sm text-slate-500">Override the default 9 PM - 8 AM quiet window</p>
                                    </div>
                                </div>
                                <Toggle enabled={quietOverride.enabled} onChange={(v) => setQuietOverride({ ...quietOverride, enabled: v })} />
                            </div>
                            {quietOverride.enabled && (
                                <div className="grid grid-cols-2 gap-6 pl-12">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Silence After</label>
                                        <input type="time" value={quietOverride.start} onChange={(e) => setQuietOverride({ ...quietOverride, start: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Resume At</label>
                                        <input type="time" value={quietOverride.end} onChange={(e) => setQuietOverride({ ...quietOverride, end: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Section>

                    {/* Devices */}
                    <Section title="Your Devices" description="Devices registered for push notifications">
                        <div className="divide-y divide-slate-100">
                            {[
                                { name: "Sarah's iPhone", model: "iPhone 15 Pro", platform: "iOS", lastActive: "Active now", primary: true },
                                { name: "iPad", model: "iPad Air (5th gen)", platform: "iOS", lastActive: "3 hours ago", primary: false },
                            ].map((device, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-slate-900">{device.name}</h3>
                                                {device.primary && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Primary</span>}
                                            </div>
                                            <p className="text-sm text-slate-500">{device.model} &middot; {device.lastActive}</p>
                                        </div>
                                    </div>
                                    <button className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Notification History */}
                    <Section title="Recent Notifications" description="Your notification history">
                        <div className="divide-y divide-slate-100">
                            {SAMPLE_HISTORY.map((notif, i) => {
                                const meta = PRODUCT_META[notif.product];
                                const statusStyles: Record<string, { label: string; class: string }> = {
                                    opened: { label: "Opened", class: "bg-emerald-50 text-emerald-600" },
                                    tapped: { label: "Tapped", class: "bg-blue-50 text-blue-600" },
                                    dismissed: { label: "Dismissed", class: "bg-slate-100 text-slate-500" },
                                };
                                const status = statusStyles[notif.status] || statusStyles.dismissed;
                                return (
                                    <div key={i} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                                        <div className={`p-2 rounded-lg mt-0.5 ${notif.status === "dismissed" ? "bg-slate-100 text-slate-400" : "bg-blue-100 text-blue-600"}`}>
                                            {meta?.icon || <Bell className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-slate-900 text-sm">{notif.title}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${status.class}`}>{status.label}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-0.5">{notif.body}</p>
                                            <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                </>
            )}

            {!pushEnabled && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Push Notifications Disabled</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        You won&apos;t receive push notifications about new offers or changes to your existing offers.
                        You can still view all your offers by opening the app.
                    </p>
                    <button
                        onClick={() => setPushEnabled(true)}
                        className="mt-6 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Turn On Notifications
                    </button>
                </div>
            )}

            {/* Save */}
            {pushEnabled && (
                <div className="flex justify-end">
                    <button
                        onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                        className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${saved ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                    >
                        {saved ? <><Check className="w-4 h-4" />Saved!</> : "Save Preferences"}
                    </button>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════
//  MAIN PAGE WITH TAB SWITCHER
// ══════════════════════════════════════════════════════

const VIEW_TABS: { id: ViewMode; label: string; description: string; icon: React.ReactNode; color: string }[] = [
    { id: "admin", label: "Admin", description: "Platform configuration", icon: <Settings className="w-4 h-4" />, color: "indigo" },
    { id: "client", label: "Client (CU)", description: "Credit union settings", icon: <Building2 className="w-4 h-4" />, color: "emerald" },
    { id: "member", label: "Member", description: "End-user preferences", icon: <User className="w-4 h-4" />, color: "blue" },
];

export default function NotificationsConfigPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("admin");
    const [saved, setSaved] = useState(false);

    // Admin state
    const [masterEnabled, setMasterEnabled] = useState(true);
    const [frequency, setFrequency] = useState<FrequencyRules>(DEFAULT_FREQUENCY);
    const [events, setEvents] = useState<Record<string, OfferEventConfig>>(DEFAULT_EVENTS);
    const [products, setProducts] = useState<Record<string, ProductRule>>(DEFAULT_PRODUCTS);
    const [templates] = useState<NotificationTemplate[]>(DEFAULT_TEMPLATES);
    const [expandedTemplate, setExpandedTemplate] = useState<string | null>("new_offer");
    const [previewProduct, setPreviewProduct] = useState("auto_loan");

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const colorMap: Record<string, { active: string; inactive: string }> = {
        indigo: { active: "bg-indigo-600 text-white border-indigo-600", inactive: "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50" },
        emerald: { active: "bg-emerald-600 text-white border-emerald-600", inactive: "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50" },
        blue: { active: "bg-blue-600 text-white border-blue-600", inactive: "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50" },
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Push Notifications</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Configure push notification behavior at every level — platform, credit union, and member.
                </p>
            </div>

            {/* View Switcher */}
            <div className="flex gap-3">
                {VIEW_TABS.map((tab) => {
                    const isActive = viewMode === tab.id;
                    const colors = colorMap[tab.color];
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id)}
                            className={`flex-1 flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all ${isActive ? colors.active : colors.inactive}`}
                        >
                            <div className={`p-2 rounded-lg ${isActive ? "bg-white/20" : "bg-slate-100"}`}>
                                {tab.icon}
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-sm">{tab.label}</p>
                                <p className={`text-xs ${isActive ? "opacity-80" : "text-slate-500"}`}>{tab.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Active View */}
            {viewMode === "admin" && (
                <AdminView
                    masterEnabled={masterEnabled} setMasterEnabled={setMasterEnabled}
                    frequency={frequency} setFrequency={setFrequency}
                    events={events} setEvents={setEvents}
                    products={products} setProducts={setProducts}
                    templates={templates}
                    expandedTemplate={expandedTemplate} setExpandedTemplate={setExpandedTemplate}
                    previewProduct={previewProduct} setPreviewProduct={setPreviewProduct}
                />
            )}
            {viewMode === "client" && <ClientView />}
            {viewMode === "member" && <MemberView />}

            {/* Admin Save (only for admin tab since client/member have their own) */}
            {viewMode === "admin" && (
                <div className="flex justify-end pb-8">
                    <button
                        type="button"
                        onClick={handleSave}
                        className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${saved ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                    >
                        {saved ? <><Check className="w-4 h-4" />Saved!</> : "Save Changes"}
                    </button>
                </div>
            )}
        </div>
    );
}
