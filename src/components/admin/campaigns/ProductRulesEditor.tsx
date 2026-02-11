"use client";

import { useState } from "react";
import {
    CampaignProduct,
    Rule,
    RuleClause,
    RuleOperator,
    ProductType,
    PerpetualOfferSettings,
    OfferExpirationTrigger,
    OfferReplacementBehavior,
    OfferExpirationAction,
} from "@/context/StoreContext";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    X,
    Info,
    ToggleLeft,
    ToggleRight,
    DollarSign,
    Percent,
    Clock,
    Calendar,
    RefreshCw,
    Timer,
} from "lucide-react";

interface ProductRulesEditorProps {
    product: CampaignProduct;
    isTargeted: boolean;
    isPerpetual?: boolean;
    onSave: (product: CampaignProduct) => void;
    onCancel: () => void;
}

// Operator labels for display
const OPERATOR_LABELS: Record<RuleOperator, string> = {
    equals: "equals",
    not_equals: "does not equal",
    greater_than: "is greater than",
    less_than: "is less than",
    greater_than_or_equal: "is at least",
    less_than_or_equal: "is at most",
    contains: "contains",
    not_contains: "does not contain",
    is_true: "is true",
    is_false: "is false",
};

// Product type labels
const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
    "auto-loan": "Auto Loan",
    "auto-refi": "Auto Refinance",
    "home-loan": "Home Loan",
    "heloc": "HELOC",
    "credit-card": "Credit Card",
    "credit-limit-increase": "Credit Limit Increase",
    "term-life": "Term Life Insurance",
    "gap": "GAP Coverage",
    "mrc": "MRC",
    "debt-protection": "Debt Protection",
    "personal-loan": "Personal Loan",
    // Deposit products
    "savings": "Savings Account",
    "checking": "Checking Account",
    "money-market": "Money Market Account",
    "certificate": "Share Certificate (CD)",
};

// Products that support intro rates
const INTRO_RATE_PRODUCTS: ProductType[] = ["credit-card", "heloc"];

// Clause Editor Component
function ClauseEditor({
    clause,
    customerFields,
    onChange,
    onRemove,
    showRemove,
}: {
    clause: RuleClause;
    customerFields: string[];
    onChange: (clause: RuleClause) => void;
    onRemove: () => void;
    showRemove: boolean;
}) {
    const needsValue = !["is_true", "is_false"].includes(clause.operator);

    return (
        <div className="flex items-center gap-2 py-2">
            {/* Attribute */}
            <select
                value={clause.attribute}
                onChange={(e) => onChange({ ...clause, attribute: e.target.value })}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 bg-white"
            >
                <option value="">Select attribute...</option>
                {customerFields.map((field) => (
                    <option key={field} value={field}>
                        {field}
                    </option>
                ))}
            </select>

            {/* Operator */}
            <select
                value={clause.operator}
                onChange={(e) => onChange({ ...clause, operator: e.target.value as RuleOperator })}
                className="w-44 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 bg-white"
            >
                {Object.entries(OPERATOR_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                        {label}
                    </option>
                ))}
            </select>

            {/* Value */}
            {needsValue && (
                <input
                    type="text"
                    value={clause.value}
                    onChange={(e) => onChange({ ...clause, value: e.target.value })}
                    placeholder="Value"
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                />
            )}

            {/* Remove button */}
            {showRemove && (
                <button
                    onClick={onRemove}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

// Rule Card Component
function RuleCard({
    rule,
    ruleIndex,
    customerFields,
    onChange,
    onRemove,
    showRemove,
    extraFields,
}: {
    rule: Rule;
    ruleIndex: number;
    customerFields: string[];
    onChange: (rule: Rule) => void;
    onRemove: () => void;
    showRemove: boolean;
    extraFields?: React.ReactNode;
}) {
    const handleClauseChange = (clauseIndex: number, updatedClause: RuleClause) => {
        const newClauses = [...rule.clauses];
        newClauses[clauseIndex] = updatedClause;
        onChange({ ...rule, clauses: newClauses });
    };

    const handleRemoveClause = (clauseIndex: number) => {
        const newClauses = rule.clauses.filter((_, i) => i !== clauseIndex);
        onChange({ ...rule, clauses: newClauses });
    };

    const handleAddClause = () => {
        const newClause: RuleClause = {
            id: `clause-${Date.now()}`,
            attribute: "",
            operator: "equals",
            value: "",
        };
        onChange({ ...rule, clauses: [...rule.clauses, newClause] });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-900">Rule {ruleIndex + 1}</h4>
                {showRemove && (
                    <button
                        onClick={onRemove}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="p-4">
                {/* Clauses */}
                <div className="space-y-1">
                    {rule.clauses.map((clause, idx) => (
                        <div key={clause.id}>
                            {idx > 0 && (
                                <div className="flex items-center gap-2 py-1">
                                    <div className="flex-1 h-px bg-slate-200" />
                                    <span className="text-xs font-medium text-slate-500 uppercase">AND</span>
                                    <div className="flex-1 h-px bg-slate-200" />
                                </div>
                            )}
                            <ClauseEditor
                                clause={clause}
                                customerFields={customerFields}
                                onChange={(c) => handleClauseChange(idx, c)}
                                onRemove={() => handleRemoveClause(idx)}
                                showRemove={rule.clauses.length > 1}
                            />
                        </div>
                    ))}
                </div>

                {/* Add Clause Button */}
                <button
                    onClick={handleAddClause}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                    <Plus className="w-3 h-3" />
                    Add condition (AND)
                </button>

                {/* Extra fields (like preapproval limit) */}
                {extraFields && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        {extraFields}
                    </div>
                )}
            </div>
        </div>
    );
}

// Rules Section Component
function RulesSection({
    title,
    description,
    rules,
    customerFields,
    onChange,
    emptyMessage,
    extraFieldsRender,
}: {
    title: string;
    description: string;
    rules: Rule[];
    customerFields: string[];
    onChange: (rules: Rule[]) => void;
    emptyMessage: string;
    extraFieldsRender?: (rule: Rule, onChange: (rule: Rule) => void) => React.ReactNode;
}) {
    const handleRuleChange = (index: number, updatedRule: Rule) => {
        const newRules = [...rules];
        newRules[index] = updatedRule;
        onChange(newRules);
    };

    const handleRemoveRule = (index: number) => {
        onChange(rules.filter((_, i) => i !== index));
    };

    const handleAddRule = () => {
        const newRule: Rule = {
            id: `rule-${Date.now()}`,
            clauses: [
                {
                    id: `clause-${Date.now()}`,
                    attribute: "",
                    operator: "equals",
                    value: "",
                },
            ],
        };
        onChange([...rules, newRule]);
    };

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>

            <div className="p-4 space-y-4">
                {rules.length === 0 ? (
                    <div className="text-center py-6 text-sm text-slate-500">
                        {emptyMessage}
                    </div>
                ) : (
                    rules.map((rule, idx) => (
                        <div key={rule.id}>
                            {idx > 0 && (
                                <div className="flex items-center gap-2 py-2">
                                    <div className="flex-1 h-px bg-slate-300" />
                                    <span className="text-xs font-bold text-slate-600 uppercase px-2 py-1 bg-slate-200 rounded">
                                        OR
                                    </span>
                                    <div className="flex-1 h-px bg-slate-300" />
                                </div>
                            )}
                            <RuleCard
                                rule={rule}
                                ruleIndex={idx}
                                customerFields={customerFields}
                                onChange={(r) => handleRuleChange(idx, r)}
                                onRemove={() => handleRemoveRule(idx)}
                                showRemove={true}
                                extraFields={extraFieldsRender?.(rule, (r) => handleRuleChange(idx, r))}
                            />
                        </div>
                    ))
                )}

                <button
                    onClick={handleAddRule}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Rule
                </button>
            </div>
        </div>
    );
}

export default function ProductRulesEditor({
    product,
    isTargeted,
    isPerpetual = false,
    onSave,
    onCancel,
    availableProducts = [],
}: ProductRulesEditorProps & { availableProducts?: { id: string; name: string }[] }) {
    const { customerFields, featureFlags } = useStore();

    // Local state for editing
    const [isDefaultProduct, setIsDefaultProduct] = useState(product.isDefaultCampaignProduct);
    const [productRules, setProductRules] = useState<Rule[]>(product.productRules);
    const [preapprovalRules, setPreapprovalRules] = useState<Rule[]>(product.preapprovalRules);
    const [introRateRules, setIntroRateRules] = useState<Rule[]>(product.introRateRules);
    const [consumerPrequalRules, setConsumerPrequalRules] = useState<Rule[]>(product.consumerPrequalRules || []);

    // Featured offer text
    const [featuredPreapprovalHeadline, setFeaturedPreapprovalHeadline] = useState(
        product.featuredPreapprovalHeadline || ""
    );
    const [featuredPreapprovalDescription, setFeaturedPreapprovalDescription] = useState(
        product.featuredPreapprovalDescription || ""
    );
    const [featuredHeadline, setFeaturedHeadline] = useState(product.featuredHeadline || "");
    const [featuredDescription, setFeaturedDescription] = useState(product.featuredDescription || "");

    // Perpetual campaign lifecycle settings
    const [expirationTrigger, setExpirationTrigger] = useState<OfferExpirationTrigger>(
        product.perpetualSettings?.expirationTrigger || "manual"
    );
    const [expirationDays, setExpirationDays] = useState<number | undefined>(
        product.perpetualSettings?.expirationDays
    );
    const [expirationRedemptions, setExpirationRedemptions] = useState<number | undefined>(
        product.perpetualSettings?.expirationRedemptions
    );
    const [expirationDate, setExpirationDate] = useState<string>(
        product.perpetualSettings?.expirationDate || ""
    );
    const [replacementBehavior, setReplacementBehavior] = useState<OfferReplacementBehavior>(
        product.perpetualSettings?.replacementBehavior || "add"
    );
    const [replaceOfferId, setReplaceOfferId] = useState<string | undefined>(
        product.perpetualSettings?.replaceOfferId
    );
    const [expirationAction, setExpirationAction] = useState<OfferExpirationAction>(
        product.perpetualSettings?.expirationAction || "remove"
    );
    const [replacementOfferId, setReplacementOfferId] = useState<string | undefined>(
        product.perpetualSettings?.replacementOfferId
    );

    const supportsIntroRates = INTRO_RATE_PRODUCTS.includes(product.productType);

    const handleSave = () => {
        // Build perpetual settings if applicable
        const perpetualSettings: PerpetualOfferSettings | undefined = isPerpetual ? {
            expirationTrigger,
            expirationDays: expirationTrigger === "days" ? expirationDays : undefined,
            expirationRedemptions: expirationTrigger === "redemptions" ? expirationRedemptions : undefined,
            expirationDate: expirationTrigger === "date" ? expirationDate : undefined,
            replacementBehavior,
            replaceOfferId: replacementBehavior === "replace_specific" ? replaceOfferId : undefined,
            expirationAction,
            replacementOfferId: expirationAction === "replace" ? replacementOfferId : undefined,
        } : undefined;

        onSave({
            ...product,
            isDefaultCampaignProduct: isDefaultProduct,
            productRules,
            preapprovalRules,
            introRateRules,
            consumerPrequalRules,
            featuredPreapprovalHeadline: featuredPreapprovalHeadline || undefined,
            featuredPreapprovalDescription: featuredPreapprovalDescription || undefined,
            featuredHeadline: featuredHeadline || undefined,
            featuredDescription: featuredDescription || undefined,
            perpetualSettings,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Products
                    </button>
                    <h2 className="text-xl font-bold text-slate-900">{product.productName}</h2>
                    <p className="text-sm text-slate-500">
                        {PRODUCT_TYPE_LABELS[product.productType]}
                        {product.isFeaturedOffer && " • Featured Offer"}
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    Save Changes
                </button>
            </div>

            {/* Featured Offer Text (if applicable) */}
            {product.isFeaturedOffer && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-semibold text-slate-900">Featured Offer Display</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Configure the headline and description shown in the featured offers section.
                        </p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Preapproval Headline
                                </label>
                                <input
                                    type="text"
                                    value={featuredPreapprovalHeadline}
                                    onChange={(e) => setFeaturedPreapprovalHeadline(e.target.value)}
                                    placeholder="e.g., You're preapproved!"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Application Headline
                                </label>
                                <input
                                    type="text"
                                    value={featuredHeadline}
                                    onChange={(e) => setFeaturedHeadline(e.target.value)}
                                    placeholder="e.g., Apply for a New Auto Loan"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Preapproval Description
                                </label>
                                <textarea
                                    value={featuredPreapprovalDescription}
                                    onChange={(e) => setFeaturedPreapprovalDescription(e.target.value)}
                                    placeholder="Description for preapproved customers"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Application Description
                                </label>
                                <textarea
                                    value={featuredDescription}
                                    onChange={(e) => setFeaturedDescription(e.target.value)}
                                    placeholder="Description for the offer"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rules Section (for targeted and perpetual campaigns) */}
            {(isTargeted || isPerpetual) && (
                <>
                    {/* Default Product Toggle */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    {isDefaultProduct ? (
                                        <ToggleRight className="w-5 h-5" />
                                    ) : (
                                        <ToggleLeft className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium text-slate-900">Default Campaign Product</h3>
                                    <p className="text-sm text-slate-500">
                                        Show this product to all customers in the campaign file
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDefaultProduct(!isDefaultProduct)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                                    isDefaultProduct ? "bg-emerald-600" : "bg-slate-200"
                                )}
                            >
                                <span
                                    className={cn(
                                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                        isDefaultProduct ? "translate-x-6" : "translate-x-1"
                                    )}
                                />
                            </button>
                        </div>
                        {isDefaultProduct && (
                            <p className="mt-3 text-xs text-slate-500 flex items-start gap-1.5 bg-slate-50 px-3 py-2 rounded-lg">
                                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                When enabled, product rules below are ignored. All customers will see this product.
                            </p>
                        )}
                    </div>

                    {/* Product Rules */}
                    {!isDefaultProduct && (
                        <RulesSection
                            title="Product Rules"
                            description="Define when this product is shown to a customer. If ANY rule matches, the product is displayed."
                            rules={productRules}
                            customerFields={customerFields}
                            onChange={setProductRules}
                            emptyMessage="No product rules configured. Add rules to control who sees this product."
                        />
                    )}

                    {/* Preapproval Rules */}
                    <RulesSection
                        title="Preapproval Rules"
                        description="Define when customers are preapproved. If ANY rule matches, the customer gets the highest matching preapproval limit."
                        rules={preapprovalRules}
                        customerFields={customerFields}
                        onChange={setPreapprovalRules}
                        emptyMessage="No preapproval rules configured. Add rules to enable preapprovals for this product."
                        extraFieldsRender={(rule, onChange) => (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    <span className="flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4" />
                                        Preapproval Limit
                                    </span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        value={rule.preapprovalLimit || ""}
                                        onChange={(e) =>
                                            onChange({
                                                ...rule,
                                                preapprovalLimit: e.target.value
                                                    ? parseInt(e.target.value)
                                                    : undefined,
                                            })
                                        }
                                        placeholder="50,000"
                                        className="w-40 pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                    />
                                </div>
                            </div>
                        )}
                    />

                    {/* Intro Rate Rules (for credit cards / PLOCs) */}
                    {supportsIntroRates && (
                        <RulesSection
                            title="Intro Rate Rules"
                            description="Define introductory rate offers. If ANY rule matches, the customer receives the intro rate."
                            rules={introRateRules}
                            customerFields={customerFields}
                            onChange={setIntroRateRules}
                            emptyMessage="No intro rate rules configured. Add rules to offer introductory rates."
                            extraFieldsRender={(rule, onChange) => (
                                <div className="space-y-4">
                                    {/* Purchase Intro Rate */}
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id={`purchase-intro-${rule.id}`}
                                            checked={rule.offerIntroRateOnPurchases || false}
                                            onChange={(e) =>
                                                onChange({
                                                    ...rule,
                                                    offerIntroRateOnPurchases: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-950"
                                        />
                                        <label
                                            htmlFor={`purchase-intro-${rule.id}`}
                                            className="text-sm font-medium text-slate-700"
                                        >
                                            Offer introductory rate on purchases
                                        </label>
                                    </div>
                                    {rule.offerIntroRateOnPurchases && (
                                        <div className="ml-7 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    <span className="flex items-center gap-1.5">
                                                        <Percent className="w-4 h-4" />
                                                        Intro Rate
                                                    </span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={rule.introRate || ""}
                                                        onChange={(e) =>
                                                            onChange({
                                                                ...rule,
                                                                introRate: e.target.value
                                                                    ? parseFloat(e.target.value)
                                                                    : undefined,
                                                            })
                                                        }
                                                        placeholder="0.00"
                                                        className="w-full pr-8 pl-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        Term Length
                                                    </span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={rule.introTermLength || ""}
                                                        onChange={(e) =>
                                                            onChange({
                                                                ...rule,
                                                                introTermLength: e.target.value
                                                                    ? parseInt(e.target.value)
                                                                    : undefined,
                                                            })
                                                        }
                                                        placeholder="12"
                                                        className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                                    />
                                                    <select
                                                        value={rule.introTermUnit || "months"}
                                                        onChange={(e) =>
                                                            onChange({
                                                                ...rule,
                                                                introTermUnit: e.target.value as
                                                                    | "months"
                                                                    | "days",
                                                            })
                                                        }
                                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 bg-white"
                                                    >
                                                        <option value="months">Months</option>
                                                        <option value="days">Days</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Balance Transfer Intro Rate (credit cards only) */}
                                    {product.productType === "credit-card" && (
                                        <>
                                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                                                <input
                                                    type="checkbox"
                                                    id={`bt-intro-${rule.id}`}
                                                    checked={rule.offerIntroRateOnBalanceTransfers || false}
                                                    onChange={(e) =>
                                                        onChange({
                                                            ...rule,
                                                            offerIntroRateOnBalanceTransfers: e.target.checked,
                                                        })
                                                    }
                                                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-950"
                                                />
                                                <label
                                                    htmlFor={`bt-intro-${rule.id}`}
                                                    className="text-sm font-medium text-slate-700"
                                                >
                                                    Offer introductory rate on balance transfers
                                                </label>
                                            </div>
                                            {rule.offerIntroRateOnBalanceTransfers && (
                                                <div className="ml-7 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                                            <span className="flex items-center gap-1.5">
                                                                <Percent className="w-4 h-4" />
                                                                Balance Transfer Rate
                                                            </span>
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={rule.balanceTransferIntroRate || ""}
                                                                onChange={(e) =>
                                                                    onChange({
                                                                        ...rule,
                                                                        balanceTransferIntroRate: e.target.value
                                                                            ? parseFloat(e.target.value)
                                                                            : undefined,
                                                                    })
                                                                }
                                                                placeholder="0.00"
                                                                className="w-full pr-8 pl-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                                                %
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4" />
                                                                Term Length
                                                            </span>
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                value={rule.balanceTransferTermLength || ""}
                                                                onChange={(e) =>
                                                                    onChange({
                                                                        ...rule,
                                                                        balanceTransferTermLength: e.target.value
                                                                            ? parseInt(e.target.value)
                                                                            : undefined,
                                                                    })
                                                                }
                                                                placeholder="12"
                                                                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                                            />
                                                            <select
                                                                value={rule.balanceTransferTermUnit || "months"}
                                                                onChange={(e) =>
                                                                    onChange({
                                                                        ...rule,
                                                                        balanceTransferTermUnit: e.target.value as
                                                                            | "months"
                                                                            | "days",
                                                                    })
                                                                }
                                                                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 bg-white"
                                                            >
                                                                <option value="months">Months</option>
                                                                <option value="days">Days</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        />
                    )}

                    {/* Consumer Prequal Rules (only when feature flag is enabled) */}
                    {featureFlags.consumer_prequalification && (
                        <RulesSection
                            title="Consumer Prequal Rules"
                            description="Define rules for consumer-initiated prequalification. When a consumer submits their information for a soft credit pull, these rules determine their prequalification status."
                            rules={consumerPrequalRules}
                            customerFields={customerFields}
                            onChange={setConsumerPrequalRules}
                            emptyMessage="No consumer prequal rules configured. Add rules to enable consumer-initiated prequalification for this product."
                            extraFieldsRender={(rule, onChange) => (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        <span className="flex items-center gap-1.5">
                                            <DollarSign className="w-4 h-4" />
                                            Prequalification Limit
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                            $
                                        </span>
                                        <input
                                            type="number"
                                            value={rule.preapprovalLimit || ""}
                                            onChange={(e) =>
                                                onChange({
                                                    ...rule,
                                                    preapprovalLimit: e.target.value
                                                        ? parseInt(e.target.value)
                                                        : undefined,
                                                })
                                            }
                                            placeholder="50,000"
                                            className="w-40 pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                                        />
                                    </div>
                                </div>
                            )}
                        />
                    )}
                </>
            )}

            {/* Non-targeted info (untargeted campaigns only) */}
            {!isTargeted && !isPerpetual && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-indigo-800">
                            <p className="font-medium">Untargeted Campaign</p>
                            <p className="mt-1 text-indigo-700">
                                Product rules, preapproval rules, and intro rate rules are only available for targeted campaigns.
                                This product will be shown to all consumers in the storefront.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Perpetual Campaign Lifecycle Settings */}
            {isPerpetual && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50">
                        <div className="flex items-center gap-2">
                            <Timer className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-semibold text-slate-900">Offer Lifecycle Settings</h3>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Configure how long this offer runs and what happens when it expires.
                        </p>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Expiration Trigger */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    Offer Duration
                                </span>
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="expirationTrigger"
                                        value="manual"
                                        checked={expirationTrigger === "manual"}
                                        onChange={() => setExpirationTrigger("manual")}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">No automatic expiration</p>
                                        <p className="text-xs text-slate-500">Offer runs until manually removed</p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="expirationTrigger"
                                        value="days"
                                        checked={expirationTrigger === "days"}
                                        onChange={() => setExpirationTrigger("days")}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">Expires after duration</p>
                                        <p className="text-xs text-slate-500">Set number of days from when offer is shown to member</p>
                                    </div>
                                    {expirationTrigger === "days" && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={expirationDays || ""}
                                                onChange={(e) => setExpirationDays(e.target.value ? parseInt(e.target.value) : undefined)}
                                                placeholder="30"
                                                min="1"
                                                className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-500">days</span>
                                        </div>
                                    )}
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="expirationTrigger"
                                        value="redemptions"
                                        checked={expirationTrigger === "redemptions"}
                                        onChange={() => setExpirationTrigger("redemptions")}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">Expires after redemptions</p>
                                        <p className="text-xs text-slate-500">Limit total number of redemptions across all members</p>
                                    </div>
                                    {expirationTrigger === "redemptions" && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={expirationRedemptions || ""}
                                                onChange={(e) => setExpirationRedemptions(e.target.value ? parseInt(e.target.value) : undefined)}
                                                placeholder="100"
                                                min="1"
                                                className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-slate-500">redemptions</span>
                                        </div>
                                    )}
                                </label>

                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="radio"
                                        name="expirationTrigger"
                                        value="date"
                                        checked={expirationTrigger === "date"}
                                        onChange={() => setExpirationTrigger("date")}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-900">Expires on specific date</p>
                                        <p className="text-xs text-slate-500">Set a fixed end date for this offer</p>
                                    </div>
                                    {expirationTrigger === "date" && (
                                        <input
                                            type="date"
                                            value={expirationDate}
                                            onChange={(e) => setExpirationDate(e.target.value)}
                                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Replacement Behavior */}
                        <div className="pt-4 border-t border-slate-200">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                <span className="flex items-center gap-1.5">
                                    <RefreshCw className="w-4 h-4" />
                                    When Adding This Offer
                                </span>
                            </label>
                            <select
                                value={replacementBehavior}
                                onChange={(e) => setReplacementBehavior(e.target.value as OfferReplacementBehavior)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option value="add">Add alongside existing offers</option>
                                <option value="replace_specific">Replace a specific existing offer</option>
                                <option value="clear_all">Clear all existing offers first</option>
                            </select>
                            <p className="mt-1 text-xs text-slate-500">
                                {replacementBehavior === "add" && "This offer will be added to the member's offer set without affecting other offers."}
                                {replacementBehavior === "replace_specific" && "This offer will replace a specific existing offer in the member's storefront."}
                                {replacementBehavior === "clear_all" && "All existing offers will be removed before this offer is added."}
                            </p>

                            {/* Select which offer to replace */}
                            {replacementBehavior === "replace_specific" && availableProducts.length > 0 && (
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Select offer to replace
                                    </label>
                                    <select
                                        value={replaceOfferId || ""}
                                        onChange={(e) => setReplaceOfferId(e.target.value || undefined)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                        <option value="">Select an offer...</option>
                                        {availableProducts
                                            .filter(p => p.id !== product.productId)
                                            .map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Expiration Action */}
                        {expirationTrigger !== "manual" && (
                            <div className="pt-4 border-t border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        When This Offer Expires
                                    </span>
                                </label>
                                <select
                                    value={expirationAction}
                                    onChange={(e) => setExpirationAction(e.target.value as OfferExpirationAction)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="remove">Remove the offer</option>
                                    <option value="replace">Replace with another offer</option>
                                    <option value="notify">Notify admin (keep offer visible)</option>
                                </select>
                                <p className="mt-1 text-xs text-slate-500">
                                    {expirationAction === "remove" && "The offer will be automatically removed from member storefronts."}
                                    {expirationAction === "replace" && "The offer will be replaced with a designated follow-up offer."}
                                    {expirationAction === "notify" && "Admin will be notified but the offer remains visible until manually removed."}
                                </p>

                                {/* Select replacement offer on expiration */}
                                {expirationAction === "replace" && availableProducts.length > 0 && (
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Replace with
                                        </label>
                                        <select
                                            value={replacementOfferId || ""}
                                            onChange={(e) => setReplacementOfferId(e.target.value || undefined)}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="">Select a replacement offer...</option>
                                            {availableProducts
                                                .filter(p => p.id !== product.productId)
                                                .map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info banner */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-indigo-700">
                                    Lifecycle settings control how offers rotate in your perpetual campaign.
                                    Each member sees offers based on their profile and these timing rules.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Save Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Cancel
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
    );
}
