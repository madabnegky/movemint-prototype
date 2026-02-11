"use client";

import {
    Campaign,
    ReconciliationRuleOption,
    CustomReconciliationRule,
    LoanClass,
    AcceptanceRule,
} from "@/context/StoreContext";
import { useStore } from "@/context/StoreContext";
import { Lock, Info, AlertTriangle } from "lucide-react";

interface ReconciliationRulesTabProps {
    campaign: Campaign;
    onUpdate: (updates: Partial<Campaign>) => void;
}

const LOAN_CLASSES: { value: LoanClass; label: string }[] = [
    { value: "vehicle_loan", label: "Vehicle Loan" },
    { value: "credit_card", label: "Credit Card" },
    { value: "personal_loan", label: "Personal Loan" },
    { value: "home_equity", label: "Home Equity" },
];

interface ReconciliationOption {
    value: ReconciliationRuleOption;
    description: string;
    featureFlagKey?: "campaigns_reconciliationCustomRules" | "campaigns_reconciliationProductRules";
}

// Base options (always shown) and feature-flagged options
const BASE_OPTIONS: ReconciliationOption[] = [
    {
        value: "no_change",
        description: "Do not change existing offers",
    },
    {
        value: "same_loan_class",
        description:
            'Set existing, unredeemed offers of the same loan class (e.g. "Vehicle Loan" or "Credit Card") to Invitations to Apply',
    },
    {
        value: "all_offers",
        description: "Set all existing, unredeemed offers to Invitations to Apply",
    },
];

const FEATURE_FLAGGED_OPTIONS: ReconciliationOption[] = [
    {
        value: "custom",
        description: "Configure custom rules by loan class",
        featureFlagKey: "campaigns_reconciliationCustomRules",
    },
    {
        value: "custom_product",
        description: "Configure custom rules by product",
        featureFlagKey: "campaigns_reconciliationProductRules",
    },
];

// Get all products from the campaign
function getCampaignProducts(campaign: Campaign) {
    const products: { id: string; name: string }[] = [];

    // Featured section products
    campaign.featuredOffersSection.products.forEach((p) => {
        products.push({ id: p.id, name: p.productName });
    });

    // Other section products
    campaign.sections.forEach((section) => {
        section.products.forEach((p) => {
            products.push({ id: p.id, name: p.productName });
        });
    });

    return products;
}

// Validate a custom loan class rule - returns error message or null if valid
function validateCustomRule(rule: CustomReconciliationRule): string | null {
    // Check for any/all combination (not allowed)
    if (rule.triggerLoanClass === "any") {
        const hasAllClasses = rule.affectedLoanClasses.some(
            (c) => c.loanClass === "all"
        );
        if (hasAllClasses) {
            return "Cannot use 'Any loan class' with 'All loan classes'";
        }
    }

    return null;
}

// Validate a product rule - returns error message or null if valid
function validateProductRule(rule: AcceptanceRule): string | null {
    // Check for any/all combination (not allowed)
    if (rule.triggerProductId === "any") {
        const hasAllProducts = rule.preapprovedProducts.some(
            (pp) => pp.productId === "all"
        );
        if (hasAllProducts) {
            return "Cannot use 'Any product' with 'All products'";
        }
    }

    return null;
}

export default function ReconciliationRulesTab({
    campaign,
    onUpdate,
}: ReconciliationRulesTabProps) {
    const { featureFlags } = useStore();
    const selectedOption = campaign.reconciliationRule;
    const customRules = campaign.customReconciliationRules || [];
    const productRules = campaign.productReconciliationRules || [];
    const isLive = campaign.status === "live";

    const campaignProducts = getCampaignProducts(campaign);

    // Build available options with dynamic numbering
    const availableOptions: (ReconciliationOption & { label: string })[] = [];
    let optionNumber = 1;

    // Add base options (always Options 1, 2, 3)
    BASE_OPTIONS.forEach((opt) => {
        availableOptions.push({ ...opt, label: `Option ${optionNumber}` });
        optionNumber++;
    });

    // Add feature-flagged options with dynamic numbering
    FEATURE_FLAGGED_OPTIONS.forEach((opt) => {
        if (opt.featureFlagKey && featureFlags[opt.featureFlagKey]) {
            availableOptions.push({ ...opt, label: `Option ${optionNumber}` });
            optionNumber++;
        }
    });

    const handleOptionChange = (option: ReconciliationRuleOption) => {
        onUpdate({ reconciliationRule: option });
    };

    // ============ Custom Loan Class Rules (Option 4) ============
    const updateCustomRules = (newRules: CustomReconciliationRule[]) => {
        onUpdate({ customReconciliationRules: newRules });
    };

    const addCustomRule = () => {
        const newRule: CustomReconciliationRule = {
            id: `rule-${Date.now()}`,
            triggerLoanClass: "any",
            affectedLoanClasses: [
                {
                    id: `cond-${Date.now()}`,
                    loanClass: "all",
                },
            ],
        };
        updateCustomRules([...customRules, newRule]);
    };

    const deleteCustomRule = (ruleId: string) => {
        updateCustomRules(customRules.filter((r) => r.id !== ruleId));
    };

    const updateRuleTrigger = (ruleId: string, loanClass: LoanClass | "any") => {
        updateCustomRules(
            customRules.map((r) =>
                r.id === ruleId ? { ...r, triggerLoanClass: loanClass } : r
            )
        );
    };

    const updateAffectedLoanClass = (
        ruleId: string,
        conditionId: string,
        loanClass: LoanClass | "all"
    ) => {
        updateCustomRules(
            customRules.map((r) =>
                r.id === ruleId
                    ? {
                          ...r,
                          affectedLoanClasses: r.affectedLoanClasses.map((c) =>
                              c.id === conditionId ? { ...c, loanClass } : c
                          ),
                      }
                    : r
            )
        );
    };

    const addAffectedLoanClass = (ruleId: string) => {
        updateCustomRules(
            customRules.map((r) =>
                r.id === ruleId
                    ? {
                          ...r,
                          affectedLoanClasses: [
                              ...r.affectedLoanClasses,
                              {
                                  id: `cond-${Date.now()}`,
                                  loanClass: "all" as const,
                              },
                          ],
                      }
                    : r
            )
        );
    };

    const removeAffectedLoanClass = (ruleId: string, conditionId: string) => {
        updateCustomRules(
            customRules.map((r) =>
                r.id === ruleId
                    ? {
                          ...r,
                          affectedLoanClasses: r.affectedLoanClasses.filter(
                              (c) => c.id !== conditionId
                          ),
                      }
                    : r
            )
        );
    };

    // ============ Custom Product Rules (Option 5) ============
    const updateProductRules = (newRules: AcceptanceRule[]) => {
        onUpdate({ productReconciliationRules: newRules });
    };

    const addProductRule = () => {
        const newRule: AcceptanceRule = {
            id: `rule-${Date.now()}`,
            triggerProductId: "any",
            preapprovedProducts: [
                {
                    id: `pp-${Date.now()}`,
                    productId: "all",
                },
            ],
        };
        updateProductRules([...productRules, newRule]);
    };

    const deleteProductRule = (ruleId: string) => {
        updateProductRules(productRules.filter((r) => r.id !== ruleId));
    };

    const updateProductRuleTrigger = (ruleId: string, productId: string) => {
        updateProductRules(
            productRules.map((r) =>
                r.id === ruleId ? { ...r, triggerProductId: productId } : r
            )
        );
    };

    const updateAffectedProduct = (
        ruleId: string,
        conditionId: string,
        productId: string
    ) => {
        updateProductRules(
            productRules.map((r) =>
                r.id === ruleId
                    ? {
                          ...r,
                          preapprovedProducts: r.preapprovedProducts.map((pp) =>
                              pp.id === conditionId ? { ...pp, productId } : pp
                          ),
                      }
                    : r
            )
        );
    };

    const addAffectedProduct = (ruleId: string) => {
        updateProductRules(
            productRules.map((r) =>
                r.id === ruleId
                    ? {
                          ...r,
                          preapprovedProducts: [
                              ...r.preapprovedProducts,
                              {
                                  id: `pp-${Date.now()}`,
                                  productId: "all",
                              },
                          ],
                      }
                    : r
            )
        );
    };

    const removeAffectedProduct = (ruleId: string, conditionId: string) => {
        updateProductRules(
            productRules.map((r) =>
                r.id === ruleId
                    ? {
                          ...r,
                          preapprovedProducts: r.preapprovedProducts.filter(
                              (pp) => pp.id !== conditionId
                          ),
                      }
                    : r
            )
        );
    };

    return (
        <div className="space-y-6">
            {/* Live campaign banner */}
            {isLive && (
                <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Lock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">
                            This campaign is live.
                        </p>
                        <p className="text-sm text-amber-700">
                            Reconciliation rules cannot be edited.
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                    Campaign Reconciliation
                </h2>
            </div>

            {/* Rules Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">Rules</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        When an application is submitted in a third party platform (e.g. your
                        loan origination system) for a consumer who has offers within this
                        campaign, and either automated or manual reconciliation is run, a
                        consumer&apos;s unredeemed, existing offers will follow the rules you
                        define below.
                    </p>
                </div>

                {/* Options */}
                <div className="space-y-1">
                    {availableOptions.map((option) => (
                        <label
                            key={option.value}
                            className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedOption === option.value
                                    ? "border-slate-400 bg-slate-50"
                                    : "border-slate-200 hover:border-slate-300"
                            } ${isLive ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                            <input
                                type="radio"
                                name="reconciliation-rule"
                                value={option.value}
                                checked={selectedOption === option.value}
                                onChange={() => handleOptionChange(option.value)}
                                disabled={isLive}
                                className="mt-1 h-4 w-4 text-slate-900 border-slate-300 focus:ring-slate-950 disabled:cursor-not-allowed"
                            />
                            <div>
                                <p className="text-sm font-medium text-slate-900">
                                    {option.label}
                                </p>
                                <p className="text-sm text-slate-500">{option.description}</p>
                            </div>
                        </label>
                    ))}
                </div>

                {/* Custom Loan Class Rules Section */}
                {selectedOption === "custom" && featureFlags.campaigns_reconciliationCustomRules && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="mb-4">
                            <h4 className="text-base font-semibold text-slate-900">
                                Custom Rules
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">
                                Define which loan classes should change to Invitations to Apply
                                when a specific loan class is redeemed.
                            </p>
                        </div>

                        {/* Custom Rules List */}
                        <div className="space-y-4">
                            {customRules.map((rule, ruleIndex) => {
                                const validationError = validateCustomRule(rule);

                                return (
                                    <div
                                        key={rule.id}
                                        className="border border-slate-200 rounded-lg p-4"
                                    >
                                        {/* Rule Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <h5 className="text-base font-semibold text-slate-900">
                                                Rule {ruleIndex + 1}
                                            </h5>
                                            <button
                                                onClick={() => deleteCustomRule(rule.id)}
                                                disabled={isLive}
                                                className="px-3 py-1 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                DELETE
                                            </button>
                                        </div>

                                        {/* Validation Error */}
                                        {validationError && (
                                            <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-md">
                                                <p className="text-sm text-rose-700">
                                                    {validationError}
                                                </p>
                                            </div>
                                        )}

                                        {/* Trigger Loan Class Row */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-1 mb-2">
                                                <span className="text-sm font-medium text-slate-700">
                                                    Loan Type
                                                </span>
                                                <button
                                                    className="text-slate-400 hover:text-slate-600"
                                                    title="The loan class that triggers this rule when redeemed"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-slate-600 w-10">
                                                    If
                                                </span>
                                                <select
                                                    value={rule.triggerLoanClass}
                                                    onChange={(e) =>
                                                        updateRuleTrigger(
                                                            rule.id,
                                                            e.target.value as LoanClass | "any"
                                                        )
                                                    }
                                                    disabled={isLive}
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                >
                                                    <option value="any">Any loan class</option>
                                                    {LOAN_CLASSES.map((lc) => (
                                                        <option key={lc.value} value={lc.value}>
                                                            {lc.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="text-sm text-slate-600">
                                                    is redeemed
                                                </span>
                                            </div>
                                        </div>

                                        {/* Affected Loan Classes */}
                                        {rule.affectedLoanClasses.map((cond, condIndex) => (
                                            <div key={cond.id} className="mb-4">
                                                <div className="flex items-center gap-1 mb-2">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        Affected Loan Type {condIndex + 1}
                                                    </span>
                                                    <button
                                                        className="text-slate-400 hover:text-slate-600"
                                                        title="Loan classes that will change to Invite to Apply"
                                                    >
                                                        <Info className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-slate-600 w-10">
                                                        Then
                                                    </span>
                                                    <select
                                                        value={cond.loanClass}
                                                        onChange={(e) =>
                                                            updateAffectedLoanClass(
                                                                rule.id,
                                                                cond.id,
                                                                e.target.value as LoanClass | "all"
                                                            )
                                                        }
                                                        disabled={isLive}
                                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="all">All loan classes</option>
                                                        {LOAN_CLASSES.map((lc) => (
                                                            <option key={lc.value} value={lc.value}>
                                                                {lc.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <span className="text-sm text-slate-600">
                                                        change(s) to apply now.
                                                    </span>
                                                    {rule.affectedLoanClasses.length > 1 && (
                                                        <button
                                                            onClick={() =>
                                                                removeAffectedLoanClass(
                                                                    rule.id,
                                                                    cond.id
                                                                )
                                                            }
                                                            disabled={isLive}
                                                            className="text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Remove this condition"
                                                        >
                                                            &times;
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Another Affected Loan Class */}
                                        <button
                                            onClick={() => addAffectedLoanClass(rule.id)}
                                            disabled={isLive}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            + ADD ANOTHER LOAN TYPE
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Rule Button */}
                        <button
                            onClick={addCustomRule}
                            disabled={isLive}
                            className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            + ADD RULE
                        </button>
                    </div>
                )}

                {/* Custom Product Rules Section */}
                {selectedOption === "custom_product" && featureFlags.campaigns_reconciliationProductRules && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        {/* Warning Banner */}
                        <div className="mb-4 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-sm text-amber-800">
                                To use this option, you will not be able to use the automated
                                reconciliation that some Loan Origination Systems allow. You must
                                use the manual reconciliation file/process.
                            </p>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-base font-semibold text-slate-900">
                                Custom Rules
                            </h4>
                            <p className="text-sm text-slate-500 mt-1">
                                Define which products should change to Invitations to Apply
                                when a specific product is redeemed.
                            </p>
                        </div>

                        {/* Product Rules List */}
                        <div className="space-y-4">
                            {productRules.map((rule, ruleIndex) => {
                                const validationError = validateProductRule(rule);

                                return (
                                    <div
                                        key={rule.id}
                                        className="border border-slate-200 rounded-lg p-4"
                                    >
                                        {/* Rule Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <h5 className="text-base font-semibold text-slate-900">
                                                Rule {ruleIndex + 1}
                                            </h5>
                                            <button
                                                onClick={() => deleteProductRule(rule.id)}
                                                disabled={isLive}
                                                className="px-3 py-1 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                DELETE
                                            </button>
                                        </div>

                                        {/* Validation Error */}
                                        {validationError && (
                                            <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-md">
                                                <p className="text-sm text-rose-700">
                                                    {validationError}
                                                </p>
                                            </div>
                                        )}

                                        {/* Trigger Product Row */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-1 mb-2">
                                                <span className="text-sm font-medium text-slate-700">
                                                    Product
                                                </span>
                                                <button
                                                    className="text-slate-400 hover:text-slate-600"
                                                    title="The product that triggers this rule when redeemed"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-slate-600 w-10">
                                                    If
                                                </span>
                                                <select
                                                    value={rule.triggerProductId}
                                                    onChange={(e) =>
                                                        updateProductRuleTrigger(rule.id, e.target.value)
                                                    }
                                                    disabled={isLive}
                                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                >
                                                    <option value="any">Any product</option>
                                                    {campaignProducts.map((product) => (
                                                        <option key={product.id} value={product.id}>
                                                            {product.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="text-sm text-slate-600">
                                                    is redeemed
                                                </span>
                                            </div>
                                        </div>

                                        {/* Affected Products */}
                                        {rule.preapprovedProducts.map((pp, ppIndex) => (
                                            <div key={pp.id} className="mb-4">
                                                <div className="flex items-center gap-1 mb-2">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        Preapproved Product {ppIndex + 1}
                                                    </span>
                                                    <button
                                                        className="text-slate-400 hover:text-slate-600"
                                                        title="Products that will change to Invite to Apply"
                                                    >
                                                        <Info className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-slate-600 w-10">
                                                        Then
                                                    </span>
                                                    <select
                                                        value={pp.productId}
                                                        onChange={(e) =>
                                                            updateAffectedProduct(
                                                                rule.id,
                                                                pp.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        disabled={isLive}
                                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="all">All products</option>
                                                        {campaignProducts.map((product) => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <span className="text-sm text-slate-600">
                                                        change(s) to apply now.
                                                    </span>
                                                    {rule.preapprovedProducts.length > 1 && (
                                                        <button
                                                            onClick={() =>
                                                                removeAffectedProduct(rule.id, pp.id)
                                                            }
                                                            disabled={isLive}
                                                            className="text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Remove this condition"
                                                        >
                                                            &times;
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Another Affected Product */}
                                        <button
                                            onClick={() => addAffectedProduct(rule.id)}
                                            disabled={isLive}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            + ADD ANOTHER PREAPPROVED PRODUCT
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Rule Button */}
                        <button
                            onClick={addProductRule}
                            disabled={isLive}
                            className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            + ADD RULE
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
