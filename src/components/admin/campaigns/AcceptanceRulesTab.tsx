"use client";

import { Campaign, AcceptanceRule } from "@/context/StoreContext";
import { Info, Lock } from "lucide-react";

interface AcceptanceRulesTabProps {
    campaign: Campaign;
    onUpdate: (updates: Partial<Campaign>) => void;
}

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

// Validate a rule - returns error message or null if valid
function validateRule(rule: AcceptanceRule): string | null {
    // Check for any/any combination (not allowed)
    if (rule.triggerProductId === "any") {
        const hasAllProducts = rule.preapprovedProducts.some(
            (pp) => pp.productId === "all"
        );
        if (hasAllProducts) {
            return "Cannot use 'Any product' with 'All products'";
        }
    }

    // Check for same product in trigger and preapproved (not allowed)
    if (rule.triggerProductId !== "any") {
        const hasSameProduct = rule.preapprovedProducts.some(
            (pp) => pp.productId === rule.triggerProductId
        );
        if (hasSameProduct) {
            return "A product cannot affect itself";
        }
    }

    return null;
}

export default function AcceptanceRulesTab({ campaign, onUpdate }: AcceptanceRulesTabProps) {
    const rules = campaign.acceptanceRules || [];
    const campaignProducts = getCampaignProducts(campaign);
    const isLive = campaign.status === "live";

    const updateRules = (newRules: AcceptanceRule[]) => {
        onUpdate({ acceptanceRules: newRules });
    };

    const addRule = () => {
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
        updateRules([...rules, newRule]);
    };

    const deleteRule = (ruleId: string) => {
        updateRules(rules.filter((r) => r.id !== ruleId));
    };

    const updateRuleTrigger = (ruleId: string, productId: string) => {
        updateRules(
            rules.map((r) =>
                r.id === ruleId ? { ...r, triggerProductId: productId } : r
            )
        );
    };

    const updatePreapprovedProduct = (
        ruleId: string,
        conditionId: string,
        productId: string
    ) => {
        updateRules(
            rules.map((r) =>
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

    const addPreapprovedProduct = (ruleId: string) => {
        updateRules(
            rules.map((r) =>
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

    const removePreapprovedProduct = (ruleId: string, conditionId: string) => {
        updateRules(
            rules.map((r) =>
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
                            Acceptance rules cannot be edited.
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                    Acceptance Rules
                </h2>
            </div>

            {/* Rules Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Rules</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Without acceptance rules configured, when a customer redeems a offer,
                        other preapproved offers remain preapproved. If you don&apos;t have a
                        credit bureau agreement that allows customers to redeem more than one
                        preapproved offer, add rules here to customize exceptions.
                    </p>
                </div>

                {/* Rules List */}
                <div className="space-y-4">
                    {rules.map((rule, ruleIndex) => {
                        const validationError = validateRule(rule);

                        return (
                            <div
                                key={rule.id}
                                className="border border-slate-200 rounded-lg p-4"
                            >
                                {/* Rule Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-base font-semibold text-slate-900">
                                        Rule {ruleIndex + 1}
                                    </h4>
                                    <button
                                        onClick={() => deleteRule(rule.id)}
                                        disabled={isLive}
                                        className="px-3 py-1 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        DELETE
                                    </button>
                                </div>

                                {/* Validation Error */}
                                {validationError && (
                                    <div className="mb-4 px-3 py-2 bg-rose-50 border border-rose-200 rounded-md">
                                        <p className="text-sm text-rose-700">{validationError}</p>
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
                                        <span className="text-sm text-slate-600 w-10">If</span>
                                        <select
                                            value={rule.triggerProductId}
                                            onChange={(e) =>
                                                updateRuleTrigger(rule.id, e.target.value)
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
                                        <span className="text-sm text-slate-600">is redeemed</span>
                                    </div>
                                </div>

                                {/* Preapproved Products */}
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
                                                    updatePreapprovedProduct(
                                                        rule.id,
                                                        pp.id,
                                                        e.target.value
                                                    )
                                                }
                                                disabled={isLive}
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="all">All products</option>
                                                {campaignProducts
                                                    .filter(
                                                        (product) =>
                                                            product.id !== rule.triggerProductId
                                                    )
                                                    .map((product) => (
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
                                                        removePreapprovedProduct(rule.id, pp.id)
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

                                {/* Add Another Preapproved Product */}
                                <button
                                    onClick={() => addPreapprovedProduct(rule.id)}
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
                    onClick={addRule}
                    disabled={isLive}
                    className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    + ADD RULE
                </button>
            </div>
        </div>
    );
}
