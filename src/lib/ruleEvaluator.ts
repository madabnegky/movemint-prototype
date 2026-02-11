import {
    Campaign,
    CampaignProduct,
    MemberProfile,
    MemberProfileAttributes,
    Rule,
    RuleClause,
    Product,
    OfferVariant,
} from "@/context/StoreContext";

/**
 * Evaluates a single rule clause against member profile attributes
 */
function evaluateClause(clause: RuleClause, attributes: MemberProfileAttributes): boolean {
    // Map clause attribute names to profile attribute keys
    const attributeMap: Record<string, keyof MemberProfileAttributes | ((attrs: MemberProfileAttributes) => number | boolean | undefined)> = {
        "Credit Score": "creditScore",
        "FICO Score": "creditScore",
        "Has Auto Loan": "hasAutoLoan",
        "Has Mortgage": "hasMortgage",
        "Has Credit Card": "hasCreditCard",
        "Member Since": "memberTenureYears",
        "Account Balance": "accountBalance",
        "Direct Deposit": "directDeposit",
        "Bankruptcy Indicator": "bankruptcyIndicator",
        "MLA Indicator": "mlaIndicator",
        "Debt to Income": "debtToIncome",
    };

    const mappedKey = attributeMap[clause.attribute];
    if (!mappedKey) {
        // Unknown attribute, default to false
        return false;
    }

    const profileValue = typeof mappedKey === "function"
        ? mappedKey(attributes)
        : attributes[mappedKey];

    if (profileValue === undefined) {
        return false;
    }

    const clauseValue = clause.value;

    switch (clause.operator) {
        case "equals":
            return String(profileValue) === clauseValue;
        case "not_equals":
            return String(profileValue) !== clauseValue;
        case "greater_than":
            return Number(profileValue) > Number(clauseValue);
        case "less_than":
            return Number(profileValue) < Number(clauseValue);
        case "greater_than_or_equal":
            return Number(profileValue) >= Number(clauseValue);
        case "less_than_or_equal":
            return Number(profileValue) <= Number(clauseValue);
        case "is_true":
            return profileValue === true;
        case "is_false":
            return profileValue === false;
        case "contains":
            return String(profileValue).toLowerCase().includes(clauseValue.toLowerCase());
        case "not_contains":
            return !String(profileValue).toLowerCase().includes(clauseValue.toLowerCase());
        default:
            return false;
    }
}

/**
 * Evaluates a single rule (all clauses ANDed together)
 */
function evaluateRule(rule: Rule, attributes: MemberProfileAttributes): boolean {
    if (rule.clauses.length === 0) {
        return true; // No clauses means rule always matches
    }
    return rule.clauses.every(clause => evaluateClause(clause, attributes));
}

/**
 * Result of evaluating a campaign product against a member profile
 */
export interface EvaluationResult {
    show: boolean;
    variant: OfferVariant;
    preapprovalLimit?: number;
    introRate?: number;
}

/**
 * Evaluates a campaign product's rules against a member profile
 * Returns whether to show the product and what variant to display
 */
export function evaluateCampaignProduct(
    campaignProduct: CampaignProduct,
    profile: MemberProfile
): EvaluationResult {
    const attributes = profile.attributes;

    // Default products always show (at minimum as ITA)
    if (campaignProduct.isDefaultCampaignProduct) {
        // Check preapproval rules to determine variant
        let highestPreapprovalLimit = 0;
        let hasMatchingPreapprovalRule = false;
        for (const rule of campaignProduct.preapprovalRules) {
            if (evaluateRule(rule, attributes)) {
                hasMatchingPreapprovalRule = true;
                if (rule.preapprovalLimit) {
                    highestPreapprovalLimit = Math.max(highestPreapprovalLimit, rule.preapprovalLimit);
                }
            }
        }

        if (hasMatchingPreapprovalRule) {
            return {
                show: true,
                variant: "preapproved",
                preapprovalLimit: highestPreapprovalLimit > 0 ? highestPreapprovalLimit : undefined,
            };
        }

        return { show: true, variant: "ita" };
    }

    // Non-default products: check product rules first
    const matchesProductRule = campaignProduct.productRules.length === 0 ||
        campaignProduct.productRules.some(rule => evaluateRule(rule, attributes));

    if (!matchesProductRule) {
        return { show: false, variant: "ita" };
    }

    // Product rules matched, check preapproval rules
    let highestPreapprovalLimit = 0;
    let hasMatchingPreapprovalRule = false;
    for (const rule of campaignProduct.preapprovalRules) {
        if (evaluateRule(rule, attributes)) {
            hasMatchingPreapprovalRule = true;
            if (rule.preapprovalLimit) {
                highestPreapprovalLimit = Math.max(highestPreapprovalLimit, rule.preapprovalLimit);
            }
        }
    }

    if (hasMatchingPreapprovalRule) {
        return {
            show: true,
            variant: "preapproved",
            preapprovalLimit: highestPreapprovalLimit > 0 ? highestPreapprovalLimit : undefined,
        };
    }

    return { show: true, variant: "ita" };
}

/**
 * Generates an offer-like object from a campaign product and evaluation result
 */
export interface GeneratedOffer {
    id: string;
    title: string;
    variant: OfferVariant;
    productType: CampaignProduct["productType"];
    section: string;
    description?: string;
    isFeatured: boolean;
    featuredHeadline?: string;
    featuredDescription?: string;
    attributes: { label: string; value: string; subtext?: string }[];
    imageUrl?: string;
    ctaText: string;
    ctaLink?: string;
    isRedeemed?: boolean;
    preapprovalLimit?: number;
}

export function generateOfferFromCampaignProduct(
    campaignProduct: CampaignProduct,
    product: Product | undefined,
    evaluation: EvaluationResult,
    sectionName: string
): GeneratedOffer {
    const isPreapproved = evaluation.variant === "preapproved";

    // Use product data if available, otherwise fall back to campaign product data
    const attributes = product?.attributes || [];

    // If preapproved and we have a limit, update the "Up to" attribute
    const displayAttributes = isPreapproved && evaluation.preapprovalLimit
        ? attributes.map(attr => {
            if (attr.label.toLowerCase().includes("up to")) {
                return { ...attr, value: `$${evaluation.preapprovalLimit!.toLocaleString()}` };
            }
            return attr;
        })
        : attributes;

    return {
        id: campaignProduct.id,
        title: campaignProduct.productName,
        variant: evaluation.variant,
        productType: campaignProduct.productType,
        section: sectionName,
        description: product?.description,
        isFeatured: campaignProduct.isFeaturedOffer,
        featuredHeadline: isPreapproved
            ? campaignProduct.featuredPreapprovalHeadline
            : campaignProduct.featuredApplicationHeadline,
        featuredDescription: isPreapproved
            ? campaignProduct.featuredPreapprovalDescription
            : campaignProduct.featuredApplicationDescription,
        attributes: displayAttributes,
        imageUrl: product?.imageUrl,
        ctaText: isPreapproved ? "Review Offer" : "Learn More",
        preapprovalLimit: evaluation.preapprovalLimit,
    };
}

/**
 * Aggregates offers from ALL live campaigns for a given member profile.
 * This is used in "Live Mode" to show what a member would actually see
 * based on all active campaigns and their configured rules.
 *
 * Campaign priority:
 * 1. Perpetual campaigns (always-on member offers)
 * 2. Targeted campaigns (rules-based with customer file)
 * 3. Untargeted campaigns (shown to all)
 *
 * Deduplication: If the same product appears in multiple campaigns,
 * the one with the best offer (preapproved > ITA) wins.
 */
export function aggregateOffersFromAllCampaigns(
    campaigns: Campaign[],
    profile: MemberProfile,
    products: Product[]
): GeneratedOffer[] {
    // Get all live campaigns, sorted by priority
    const liveCampaigns = campaigns
        .filter(c => c.status === "live")
        .sort((a, b) => {
            // Priority: perpetual > targeted > untargeted
            const priority = { perpetual: 0, targeted: 1, untargeted: 2 };
            return priority[a.type] - priority[b.type];
        });

    // Map to track best offer per product (by productId)
    const bestOfferByProduct = new Map<string, GeneratedOffer>();

    // Track sections to maintain order
    const sectionOrder: string[] = [];

    for (const campaign of liveCampaigns) {
        // Get all campaign products from this campaign
        const allCampaignProducts = [
            ...campaign.featuredOffersSection.products,
            ...campaign.sections.flatMap(s =>
                s.products.map(p => ({ ...p, sectionName: s.name }))
            ),
        ];

        for (const cp of allCampaignProducts) {
            const evaluation = evaluateCampaignProduct(cp, profile);

            if (evaluation.show) {
                const product = products.find(p => p.id === cp.productId);
                const sectionName = 'sectionName' in cp
                    ? (cp as { sectionName: string }).sectionName
                    : campaign.featuredOffersSection.name;

                // Track section order
                if (!sectionOrder.includes(sectionName) && sectionName !== "Featured Offers") {
                    sectionOrder.push(sectionName);
                }

                const offer = generateOfferFromCampaignProduct(cp, product, evaluation, sectionName);

                // Check if we already have an offer for this product
                const existingOffer = bestOfferByProduct.get(cp.productId);

                if (!existingOffer) {
                    // First offer for this product
                    bestOfferByProduct.set(cp.productId, offer);
                } else {
                    // Compare: preapproved beats ITA, higher limit beats lower
                    const existingIsPreapproved = existingOffer.variant === "preapproved";
                    const newIsPreapproved = offer.variant === "preapproved";

                    if (newIsPreapproved && !existingIsPreapproved) {
                        // New offer is preapproved, existing is not - use new
                        bestOfferByProduct.set(cp.productId, offer);
                    } else if (newIsPreapproved && existingIsPreapproved) {
                        // Both preapproved - use higher limit
                        const existingLimit = existingOffer.preapprovalLimit || 0;
                        const newLimit = offer.preapprovalLimit || 0;
                        if (newLimit > existingLimit) {
                            bestOfferByProduct.set(cp.productId, offer);
                        }
                    }
                    // If existing is preapproved and new is not, keep existing
                }
            }
        }
    }

    // Convert map to array, preserving section grouping
    const offers = Array.from(bestOfferByProduct.values());

    // Sort by: featured first, then by section order
    return offers.sort((a, b) => {
        // Featured offers first
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;

        // Then by section order
        const aIndex = sectionOrder.indexOf(a.section);
        const bIndex = sectionOrder.indexOf(b.section);
        return aIndex - bIndex;
    });
}
