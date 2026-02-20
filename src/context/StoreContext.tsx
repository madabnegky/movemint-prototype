"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// --- Types ---

// Offer variants matching the design spec
export type OfferVariant =
    | 'preapproved'      // "You're preapproved!" - green badge
    | 'prequalified'     // "You're prequalified!" - green badge (consumer-initiated)
    | 'ita'              // "Apply Now" - Invited to Apply
    | 'wildcard'         // "Special Offer" - promotional
    | 'redeemed'         // Greyed out, already claimed
    | 'auto-refi'        // Auto refinance with savings display
    | 'credit-limit'     // Credit card limit increase
    | 'protection'       // GAP, MRC, etc.
    | 'new-member';      // "Become a Member Today" - membership offer

// Stranger storefront offer selection with per-offer variant override
export interface StrangerOffer {
    offerId: string;
    variant: OfferVariant;
    isFeatured: boolean;
}

// Product types for redemption flow routing
export type ProductType =
    | 'auto-loan'
    | 'auto-refi'
    | 'home-loan'
    | 'heloc'
    | 'credit-card'
    | 'credit-limit-increase'
    | 'personal-loan'
    | 'term-life'
    | 'gap'
    | 'mrc'
    | 'debt-protection'
    // Deposit products
    | 'savings'
    | 'checking'
    | 'money-market'
    | 'certificate'
    // Membership
    | 'membership';

export interface OfferAttribute {
    label: string;       // e.g., "Up to", "As low as", "Save up to"
    value: string;       // e.g., "$50,000", "3.99%"
    subtext?: string;    // e.g., "APR*", "/mo."
}

// --- Product Types (for Product Configuration) ---

export interface ProductAttribute {
    label: string;       // e.g., "As low as", "Up to"
    value: string;       // e.g., "3.99%", "$50,000"
    subtext?: string;    // e.g., "APR*"
}

export interface Product {
    id: string;
    name: string;                      // "New Auto Loan"
    type: ProductType;                 // 'auto-loan', 'credit-card', etc.
    description?: string;              // Short description

    // Display attributes (used when generating offers)
    imageUrl?: string;
    attributes: ProductAttribute[];    // Rate info, limits, etc.

    // Metadata
    createdAt: string;
    updatedAt: string;
    isActive: boolean;                 // Can be added to campaigns
}

// --- Member Profile Types (for Preview As functionality) ---

export interface MemberProfileAttributes {
    creditScore: number;
    hasAutoLoan: boolean;
    hasMortgage: boolean;
    hasCreditCard: boolean;
    memberTenureYears: number;
    accountBalance: number;
    directDeposit: boolean;
    // Additional attributes for rule matching
    bankruptcyIndicator?: boolean;
    mlaIndicator?: boolean;
    debtToIncome?: number;
    // Credit Mountain attributes
    usedCreditMountain?: boolean;
    creditScoreImproved?: boolean;
    previousCreditScore?: number;
}

export interface MemberProfile {
    id: string;
    name: string;                      // "High Credit Member (720+)"
    description: string;               // "Excellent credit, long tenure"
    attributes: MemberProfileAttributes;
    isBuiltIn: boolean;                // System-provided vs custom
}

export interface Offer {
    id: string;
    title: string;                    // Product display name (15-28 chars recommended)
    variant: OfferVariant;
    productType: ProductType;
    section: string;                  // Category for filtering
    description?: string;             // Short description for wildcard tiles

    // Featured offer config
    isFeatured: boolean;
    featuredHeadline?: string;        // 15-28 chars recommended
    featuredDescription?: string;     // Max 100 chars recommended

    // Display attributes
    attributes: OfferAttribute[];
    imageUrl?: string;                // 800x500 to 1200x750 recommended

    // CTA config
    ctaText?: string;                 // e.g., "Learn More", "Review Offer"
    ctaLink?: string;

    // Auto-refi specific
    monthlySavings?: number;          // For "Save up to $X/mo" display

    // Redeemed state
    isRedeemed?: boolean;
    redeemedTitle?: string;           // e.g., "You've redeemed this new auto loan offer!"
}

// Storefront configuration
export interface StorefrontConfig {
    userName?: string;                // For "Hi Cameron," greeting
    welcomeMessage: string;           // Subheading text
    footerDisclaimer: string;         // Footer legal text
    theme: 'galaxy' | 'big-bend' | 'adirondack';
}

// --- Campaign Types ---

export type CampaignType = 'targeted' | 'untargeted' | 'perpetual';
export type CampaignStatus = 'draft' | 'pending' | 'live' | 'completed';

// Preview mode for consumer-facing views
export type PreviewMode = 'demo' | 'live';

// Perpetual campaign offer lifecycle settings
export type OfferExpirationTrigger = 'manual' | 'days' | 'redemptions' | 'date';
export type OfferReplacementBehavior = 'add' | 'replace_specific' | 'clear_all';
export type OfferExpirationAction = 'remove' | 'replace' | 'notify';

export interface PerpetualOfferSettings {
    // How long should this offer run?
    expirationTrigger: OfferExpirationTrigger;
    expirationDays?: number;              // If trigger is 'days'
    expirationRedemptions?: number;       // If trigger is 'redemptions'
    expirationDate?: string;              // If trigger is 'date' (ISO date)

    // What happens to existing offers when this is added?
    replacementBehavior: OfferReplacementBehavior;
    replaceOfferId?: string;              // If behavior is 'replace_specific'

    // When this offer expires, what happens?
    expirationAction: OfferExpirationAction;
    replacementOfferId?: string;          // If action is 'replace'
}

export type RuleOperator =
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'greater_than_or_equal'
    | 'less_than_or_equal'
    | 'contains'
    | 'not_contains'
    | 'is_true'
    | 'is_false';

export interface RuleClause {
    id: string;
    attribute: string;          // Customer field name (e.g., "Credit Score", "MLA Indicator")
    operator: RuleOperator;
    value: string;
}

export interface Rule {
    id: string;
    clauses: RuleClause[];      // ANDed together within a rule
    // For preapproval rules:
    preapprovalLimit?: number;
    // For intro rate rules:
    introRate?: number;
    introTermLength?: number;
    introTermUnit?: 'months' | 'days';
    offerIntroRateOnPurchases?: boolean;
    offerIntroRateOnBalanceTransfers?: boolean;
    balanceTransferIntroRate?: number;
    balanceTransferTermLength?: number;
    balanceTransferTermUnit?: 'months' | 'days';
}

export interface CampaignProduct {
    id: string;
    productId: string;          // References an Offer id
    productName: string;
    productType: ProductType;
    sectionId: string;
    isFeaturedOffer: boolean;
    // Featured offer text
    featuredPreapprovalHeadline?: string;
    featuredPreapprovalDescription?: string;
    featuredApplicationHeadline?: string;
    featuredApplicationDescription?: string;
    featuredHeadline?: string;
    featuredDescription?: string;
    // Rules (targeted campaigns only)
    isDefaultCampaignProduct: boolean;
    productRules: Rule[];       // ORed together - if ANY rule matches, product is shown
    preapprovalRules: Rule[];   // ORed together - highest matching limit wins
    introRateRules: Rule[];     // For credit cards/PLOCs
    consumerPrequalRules: Rule[]; // Consumer-initiated prequalification rules
    // Perpetual campaign settings (perpetual campaigns only)
    perpetualSettings?: PerpetualOfferSettings;
    // Lifecycle tracking for perpetual offers
    addedAt?: string;           // ISO date when offer was added
    expiresAt?: string;         // Calculated expiration date (if applicable)
    redemptionCount?: number;   // Current redemption count (for redemption-based expiration)
    status?: 'active' | 'expiring_soon' | 'expired' | 'queued';
}

export interface CampaignSection {
    id: string;
    name: string;
    order: number;
    products: CampaignProduct[];
}

export interface CustomerFileUpload {
    id: string;
    fileName: string;
    uploadedAt: string;
    recordCount: number;
    status: 'processing' | 'complete' | 'error';
    errorMessage?: string;
}

// Acceptance Rules - what happens when a customer redeems a preapproved offer
export interface AcceptanceRuleCondition {
    id: string;
    productId: string; // "all" or specific campaign product id
}

export interface AcceptanceRule {
    id: string;
    triggerProductId: string; // "any" or specific campaign product id
    preapprovedProducts: AcceptanceRuleCondition[];
}

// Reconciliation Rules - what happens when offers are redeemed outside the platform (e.g., in a LOS)
export type ReconciliationRuleOption =
    | 'no_change'           // Option 1: Do not change existing offers
    | 'same_loan_class'     // Option 2: Set same loan class offers to ITA
    | 'all_offers'          // Option 3: Set all offers to ITA
    | 'custom'              // Custom rules by loan class (feature flagged)
    | 'custom_product';     // Custom rules by product (feature flagged)

// Loan classes for custom reconciliation rules
export type LoanClass = 'vehicle_loan' | 'credit_card' | 'personal_loan' | 'home_equity';

export interface CustomReconciliationRuleCondition {
    id: string;
    loanClass: LoanClass | 'all'; // "all" or specific loan class
}

export interface CustomReconciliationRule {
    id: string;
    triggerLoanClass: LoanClass | 'any'; // "any" or specific loan class
    affectedLoanClasses: CustomReconciliationRuleCondition[];
}

export interface EnhancedCustomerFile {
    id: string;
    fileName: string;
    uploadedAt: string;
    recordCount: number;
    bureau: 'experian' | 'equifax' | 'transunion';
}

export interface Campaign {
    id: string;
    name: string;
    type: CampaignType;
    status: CampaignStatus;
    startDate: string;          // ISO date string
    endDate?: string;           // Optional for untargeted
    createdAt: string;
    // File processing (targeted only)
    customerFile?: CustomerFileUpload;
    enhancedCustomerFile?: EnhancedCustomerFile;
    // Products organized in sections
    featuredOffersSection: CampaignSection;
    sections: CampaignSection[];
    // Summary metrics (mock data for prototype)
    metrics?: {
        customerFileTotal: number;
        enhancedCustomerFileTotal: number;
        productMatches: number;
        preapprovals: number;
        applications: number;
    };
    // Acceptance rules - what happens when offers are redeemed within the platform
    acceptanceRules: AcceptanceRule[];
    // Reconciliation rules - what happens when offers are redeemed outside the platform (e.g., LOS)
    reconciliationRule?: ReconciliationRuleOption;
    // Custom reconciliation rules by loan class (when reconciliationRule is 'custom')
    customReconciliationRules?: CustomReconciliationRule[];
    // Custom reconciliation rules by product (when reconciliationRule is 'custom_product')
    // Reuses AcceptanceRule structure since it's the same format
    productReconciliationRules?: AcceptanceRule[];
}

// Feature flags for prototyping new features
export interface FeatureFlags {
    // Storefront features
    storefront_heroAutoRotate: boolean;        // Auto-rotate hero carousel
    storefront_showBadges: boolean;            // Show variant badges on cards
    storefront_animatedCards: boolean;         // Card hover animations
    storefront_creditMountain: boolean;        // Show Credit Mountain AI Coach when no preapprovals

    // Landing page features
    landing_showTestimonials: boolean;         // Testimonials section
    landing_showStats: boolean;                // Stats/metrics section

    // Home Banking features
    homeBanking_showOfferWidget: boolean;      // Show personalized offers carousel
    homeBanking_showQuickActions: boolean;     // Show quick actions panel
    homeBanking_showAccountBalances: boolean;  // Show account balance summary

    // Consumer prequalification features
    consumer_prequalification: boolean;        // Consumer-initiated prequalification (TransUnion soft pull)

    // Admin features
    admin_bulkActions: boolean;                // Bulk edit/delete offers
    admin_offerAnalytics: boolean;             // Show offer performance metrics
    admin_optimizationDashboard: boolean;      // Show Optimization Dashboard in File Processing
    admin_optimizationRevio: boolean;          // Show Revio ROI optimization slider
    admin_optimizationVertice: boolean;        // Show Vertice AI propensity score optimization

    // Campaign features
    campaigns_perpetualType: boolean;          // Enable perpetual (always-on) campaign type
    campaigns_reconciliationCustomRules: boolean; // Enable custom reconciliation rules by loan class
    campaigns_reconciliationProductRules: boolean; // Enable custom reconciliation rules by product
}

interface StoreContextType {
    offers: Offer[];
    sections: string[];
    storefrontConfig: StorefrontConfig;
    featureFlags: FeatureFlags;
    campaigns: Campaign[];
    customerFields: string[];
    products: Product[];
    memberProfiles: MemberProfile[];
    selectedProfileId: string | null;
    previewMode: PreviewMode;
    strangerOffers: StrangerOffer[];
    strangerWelcomeMessage: string;
    addOffer: (offer: Offer) => void;
    updateOffer: (offer: Offer) => void;
    deleteOffer: (id: string) => void;
    addSection: (section: string) => void;
    updateStorefrontConfig: (config: Partial<StorefrontConfig>) => void;
    updateFeatureFlags: (flags: Partial<FeatureFlags>) => void;
    resetFeatureFlags: () => void;
    addCampaign: (campaign: Campaign) => void;
    updateCampaign: (campaign: Campaign) => void;
    deleteCampaign: (id: string) => void;
    addProduct: (product: Product) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string) => void;
    setSelectedProfileId: (id: string | null) => void;
    setPreviewMode: (mode: PreviewMode) => void;
    updateStrangerOffers: (offers: StrangerOffer[]) => void;
    updateStrangerWelcomeMessage: (message: string) => void;
}

// --- Defaults ---

const DEFAULT_SECTIONS = [
    "Auto Loans & Offers",
    "Home Loans & Offers",
    "Credit Cards",
    "Savings & Deposits",
    "Retirement & Savings",
    "Credit Monitoring & Coaching",
    "Special Offers"
];

const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
    userName: "Cameron",
    welcomeMessage: "We're glad you're here. Browse these recommended options to help you meet your financial goals.",
    footerDisclaimer: "Storefront footer disclaimers/disclosures. These are configurable in the Appearance tab of the Settings page of Catalyst Admin portal. Lorem ipsum dolor sit amet consectetur. Diam placerat cursus blandit vehicula neque egestas. Lorem sociis lacus non auctor interdum.",
    theme: 'galaxy'
};

// Customer fields available for rules (based on credit bureau data)
const DEFAULT_CUSTOMER_FIELDS: string[] = [
    // Common fields
    "Credit Score",
    "SSN",
    "First Name",
    "Last Name",
    "Address",
    "City",
    "State",
    "Zip Code",
    "DOB",
    // Experian specific
    "FICO Score",
    "Bankruptcy Indicator",
    "MLA Indicator",
    "Address Mismatch Indicator",
    // Equifax specific
    "BNI Score",
    "Consumer IncomeView",
    "Debt to Income",
    // TransUnion specific
    "CreditVision Score",
    "CreditVision Income Estimator",
    "CreditVision Debt to Income Estimator",
    // Financial institution fields
    "Member Since",
    "Account Balance",
    "Has Auto Loan",
    "Has Mortgage",
    "Has Credit Card",
    "Direct Deposit",
    "Loan Delinquency Flag",
];

const DEFAULT_CAMPAIGNS: Campaign[] = [
    {
        id: "campaign-1",
        name: "Q1 2025 Auto Loan Promotion",
        type: "targeted",
        status: "live",
        startDate: "2025-01-15",
        endDate: "2025-03-31",
        createdAt: "2025-01-10",
        customerFile: {
            id: "cf-1",
            fileName: "q1_members_export.csv",
            uploadedAt: "2025-01-12",
            recordCount: 15000,
            status: "complete"
        },
        enhancedCustomerFile: {
            id: "ecf-1",
            fileName: "q1_members_experian_enhanced.csv",
            uploadedAt: "2025-01-14",
            recordCount: 14850,
            bureau: "experian"
        },
        featuredOffersSection: {
            id: "featured-1",
            name: "Featured Offers",
            order: 0,
            products: [
                {
                    id: "cp-1",
                    productId: "product-1",
                    productName: "New Auto Loan",
                    productType: "auto-loan",
                    sectionId: "featured-1",
                    isFeaturedOffer: true,
                    featuredPreapprovalHeadline: "You're preapproved!",
                    featuredPreapprovalDescription: "Get behind the wheel of your dream car with our lowest rates.",
                    featuredApplicationHeadline: "Apply for a New Auto Loan",
                    featuredApplicationDescription: "Competitive rates for new vehicle purchases.",
                    isDefaultCampaignProduct: false,
                    productRules: [
                        {
                            id: "rule-1",
                            clauses: [
                                { id: "clause-1", attribute: "Credit Score", operator: "greater_than_or_equal", value: "680" }
                            ]
                        }
                    ],
                    preapprovalRules: [
                        {
                            id: "pa-rule-1",
                            clauses: [
                                { id: "pa-clause-1", attribute: "Credit Score", operator: "greater_than_or_equal", value: "720" }
                            ],
                            preapprovalLimit: 50000
                        },
                        {
                            id: "pa-rule-2",
                            clauses: [
                                { id: "pa-clause-2", attribute: "Credit Score", operator: "greater_than_or_equal", value: "680" },
                                { id: "pa-clause-3", attribute: "Credit Score", operator: "less_than", value: "720" }
                            ],
                            preapprovalLimit: 35000
                        }
                    ],
                    introRateRules: [],
                    consumerPrequalRules: []
                }
            ]
        },
        sections: [
            {
                id: "section-1",
                name: "Auto Loans & Offers",
                order: 1,
                products: [
                    {
                        id: "cp-2",
                        productId: "product-2",
                        productName: "Used Auto Loan",
                        productType: "auto-loan",
                        sectionId: "section-1",
                        isFeaturedOffer: false,
                        isDefaultCampaignProduct: true,
                        productRules: [],
                        preapprovalRules: [
                            {
                                id: "pa-rule-3",
                                clauses: [
                                    { id: "pa-clause-4", attribute: "Credit Score", operator: "greater_than_or_equal", value: "650" }
                                ],
                                preapprovalLimit: 35000
                            }
                        ],
                        introRateRules: [],
                        consumerPrequalRules: []
                    },
                    {
                        id: "cp-3",
                        productId: "product-4",
                        productName: "Auto Refinance",
                        productType: "auto-refi",
                        sectionId: "section-1",
                        isFeaturedOffer: false,
                        isDefaultCampaignProduct: false,
                        productRules: [
                            {
                                id: "rule-2",
                                clauses: [
                                    { id: "clause-4", attribute: "Has Auto Loan", operator: "is_true", value: "" }
                                ]
                            }
                        ],
                        preapprovalRules: [],
                        introRateRules: [],
                        consumerPrequalRules: []
                    }
                ]
            }
        ],
        metrics: {
            customerFileTotal: 15000,
            enhancedCustomerFileTotal: 14850,
            productMatches: 12500,
            preapprovals: 8750,
            applications: 1240
        },
        acceptanceRules: []
    },
    {
        id: "campaign-2",
        name: "Credit Card Balance Transfer",
        type: "targeted",
        status: "pending",
        startDate: "2025-02-15",
        endDate: "2025-05-15",
        createdAt: "2025-01-28",
        featuredOffersSection: {
            id: "featured-2",
            name: "Featured Offers",
            order: 0,
            products: []
        },
        sections: [],
        metrics: {
            customerFileTotal: 0,
            enhancedCustomerFileTotal: 0,
            productMatches: 0,
            preapprovals: 0,
            applications: 0
        },
        acceptanceRules: []
    },
    {
        id: "campaign-3",
        name: "HELOC Spring Campaign",
        type: "targeted",
        status: "pending",
        startDate: "2025-03-01",
        endDate: "2025-06-30",
        createdAt: "2025-02-01",
        featuredOffersSection: {
            id: "featured-3",
            name: "Featured Offers",
            order: 0,
            products: []
        },
        sections: [],
        acceptanceRules: []
    },
    {
        id: "campaign-4",
        name: "Always-On Deposit Products",
        type: "untargeted",
        status: "live",
        startDate: "2025-01-01",
        createdAt: "2024-12-15",
        featuredOffersSection: {
            id: "featured-4",
            name: "Featured Offers",
            order: 0,
            products: []
        },
        sections: [
            {
                id: "section-2",
                name: "Savings & CDs",
                order: 1,
                products: []
            }
        ],
        acceptanceRules: []
    },
    {
        id: "campaign-5",
        name: "Holiday Auto Loan Special 2024",
        type: "targeted",
        status: "completed",
        startDate: "2024-11-15",
        endDate: "2024-12-31",
        createdAt: "2024-11-01",
        featuredOffersSection: {
            id: "featured-5",
            name: "Featured Offers",
            order: 0,
            products: []
        },
        sections: [],
        metrics: {
            customerFileTotal: 20000,
            enhancedCustomerFileTotal: 19500,
            productMatches: 16000,
            preapprovals: 11200,
            applications: 2450
        },
        acceptanceRules: []
    },
    {
        id: "campaign-6",
        name: "Always-On Member Offers",
        type: "perpetual",
        status: "live",
        startDate: "2025-01-01",
        createdAt: "2024-12-20",
        featuredOffersSection: {
            id: "featured-6",
            name: "Featured Offers",
            order: 0,
            products: [
                {
                    id: "cp-perp-1",
                    productId: "product-1",
                    productName: "New Auto Loan",
                    productType: "auto-loan",
                    sectionId: "featured-6",
                    isFeaturedOffer: true,
                    featuredPreapprovalHeadline: "You're preapproved!",
                    featuredPreapprovalDescription: "Get behind the wheel of your dream car with our lowest rates.",
                    featuredApplicationHeadline: "Apply for a New Auto Loan",
                    featuredApplicationDescription: "Competitive rates for new vehicle purchases.",
                    isDefaultCampaignProduct: true,
                    productRules: [],
                    preapprovalRules: [],
                    introRateRules: [],
                    consumerPrequalRules: [],
                    perpetualSettings: {
                        expirationTrigger: 'days',
                        expirationDays: 90,
                        replacementBehavior: 'add',
                        expirationAction: 'notify'
                    },
                    addedAt: "2025-01-01",
                    expiresAt: "2025-04-01",
                    redemptionCount: 145,
                    status: 'active'
                }
            ]
        },
        sections: [
            {
                id: "section-perp-1",
                name: "Credit Cards",
                order: 1,
                products: [
                    {
                        id: "cp-perp-2",
                        productId: "product-5",
                        productName: "Platinum Rewards Visa",
                        productType: "credit-card",
                        sectionId: "section-perp-1",
                        isFeaturedOffer: false,
                        isDefaultCampaignProduct: true,
                        productRules: [],
                        preapprovalRules: [],
                        introRateRules: [],
                        consumerPrequalRules: [],
                        perpetualSettings: {
                            expirationTrigger: 'manual',
                            replacementBehavior: 'add',
                            expirationAction: 'remove'
                        },
                        addedAt: "2025-01-01",
                        redemptionCount: 89,
                        status: 'active'
                    },
                    {
                        id: "cp-perp-3",
                        productId: "product-3",
                        productName: "Home Equity Line of Credit",
                        productType: "heloc",
                        sectionId: "section-perp-1",
                        isFeaturedOffer: false,
                        isDefaultCampaignProduct: true,
                        productRules: [],
                        preapprovalRules: [],
                        introRateRules: [],
                        consumerPrequalRules: [],
                        perpetualSettings: {
                            expirationTrigger: 'redemptions',
                            expirationRedemptions: 500,
                            replacementBehavior: 'add',
                            expirationAction: 'replace',
                            replacementOfferId: 'product-4'
                        },
                        addedAt: "2025-01-15",
                        redemptionCount: 423,
                        status: 'expiring_soon'
                    }
                ]
            }
        ],
        acceptanceRules: []
    }
];

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
    // Storefront features - all enabled by default
    storefront_heroAutoRotate: false,
    storefront_showBadges: true,
    storefront_animatedCards: true,
    storefront_creditMountain: false,

    // Landing page features
    landing_showTestimonials: false,
    landing_showStats: false,

    // Home Banking features - all enabled by default
    homeBanking_showOfferWidget: true,
    homeBanking_showQuickActions: true,
    homeBanking_showAccountBalances: true,

    // Consumer prequalification features
    consumer_prequalification: false,

    // Admin features
    admin_bulkActions: false,
    admin_offerAnalytics: false,
    admin_optimizationDashboard: false,
    admin_optimizationRevio: false,
    admin_optimizationVertice: false,

    // Campaign features
    campaigns_perpetualType: true,
    campaigns_reconciliationCustomRules: false,
    campaigns_reconciliationProductRules: false,
};

const DEFAULT_PRODUCTS: Product[] = [
    {
        id: "product-1",
        name: "New Auto Loan",
        type: "auto-loan",
        description: "Finance your new vehicle purchase with competitive rates",
        imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "Up to", value: "$50,000" },
            { label: "As low as", value: "3.62%", subtext: "APR*†" }
        ],
        createdAt: "2024-12-01",
        updatedAt: "2024-12-01",
        isActive: true
    },
    {
        id: "product-2",
        name: "Used Auto Loan",
        type: "auto-loan",
        description: "Great rates on pre-owned vehicles",
        imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "Up to", value: "$35,000" },
            { label: "As low as", value: "4.49%", subtext: "APR*†" }
        ],
        createdAt: "2024-12-01",
        updatedAt: "2024-12-01",
        isActive: true
    },
    {
        id: "product-3",
        name: "Home Equity Line of Credit",
        type: "heloc",
        description: "Tap into your home's equity for major expenses",
        imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "Up to", value: "$150,000" }
        ],
        createdAt: "2024-12-01",
        updatedAt: "2024-12-01",
        isActive: true
    },
    {
        id: "product-4",
        name: "Auto Refinance",
        type: "auto-refi",
        description: "Lower your monthly payments by refinancing your auto loan",
        imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "Save up to", value: "$127", subtext: "/mo." },
            { label: "As low as", value: "4.99%", subtext: "APR*" }
        ],
        createdAt: "2024-12-01",
        updatedAt: "2024-12-01",
        isActive: true
    },
    {
        id: "product-5",
        name: "Platinum Rewards Visa",
        type: "credit-card",
        description: "Earn rewards on everyday purchases",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "As low as", value: "12.99%", subtext: "APR*†" }
        ],
        createdAt: "2024-12-01",
        updatedAt: "2024-12-01",
        isActive: true
    },
    {
        id: "product-6",
        name: "GAP Plus Coverage",
        type: "gap",
        description: "Protect yourself from owing more than your vehicle is worth",
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
        attributes: [],
        createdAt: "2024-12-01",
        updatedAt: "2024-12-01",
        isActive: true
    },
    {
        id: "product-7",
        name: "First Mortgage",
        type: "home-loan",
        description: "Make your dream home a reality",
        imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "As low as", value: "6.25%", subtext: "APR*" }
        ],
        createdAt: "2024-12-15",
        updatedAt: "2024-12-15",
        isActive: true
    },
    {
        id: "product-8",
        name: "Credit Limit Increase",
        type: "credit-limit-increase",
        description: "Request a higher credit limit on your existing card",
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "Up to", value: "$10,000", subtext: "increase" }
        ],
        createdAt: "2024-12-15",
        updatedAt: "2024-12-15",
        isActive: true
    },
    // Deposit Products
    {
        id: "product-9",
        name: "High-Yield Savings",
        type: "savings",
        description: "Earn more on your savings with our competitive rates",
        imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "Earn up to", value: "4.50%", subtext: "APY*" }
        ],
        createdAt: "2025-01-15",
        updatedAt: "2025-01-15",
        isActive: true
    },
    {
        id: "product-10",
        name: "Premium Checking",
        type: "checking",
        description: "Full-featured checking with no monthly fees",
        imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "Monthly fee", value: "$0" },
            { label: "ATM access", value: "55,000+", subtext: "free ATMs" }
        ],
        createdAt: "2025-01-15",
        updatedAt: "2025-01-15",
        isActive: true
    },
    {
        id: "product-11",
        name: "Money Market Account",
        type: "money-market",
        description: "Higher rates with easy access to your funds",
        imageUrl: "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "Earn up to", value: "4.75%", subtext: "APY*" },
            { label: "Min. balance", value: "$2,500" }
        ],
        createdAt: "2025-01-15",
        updatedAt: "2025-01-15",
        isActive: true
    },
    {
        id: "product-12",
        name: "12-Month Share Certificate",
        type: "certificate",
        description: "Lock in a great rate with a guaranteed return",
        imageUrl: "https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "Earn", value: "5.00%", subtext: "APY*" },
            { label: "Term", value: "12 months" }
        ],
        createdAt: "2025-01-15",
        updatedAt: "2025-01-15",
        isActive: true
    },
    {
        id: "product-13",
        name: "Personal Loan",
        type: "personal-loan",
        description: "Get funds for any purpose with fixed monthly payments",
        imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
        attributes: [
            { label: "Up to", value: "$25,000" },
            { label: "As low as", value: "8.99%", subtext: "APR*" }
        ],
        createdAt: "2025-01-20",
        updatedAt: "2025-01-20",
        isActive: true
    }
];

const DEFAULT_MEMBER_PROFILES: MemberProfile[] = [
    {
        id: 'high-credit',
        name: 'High Credit Member (720+)',
        description: 'Excellent credit score, qualifies for best rates and preapprovals',
        attributes: {
            creditScore: 750,
            hasAutoLoan: false,
            hasMortgage: true,
            hasCreditCard: true,
            memberTenureYears: 8,
            accountBalance: 25000,
            directDeposit: true,
        },
        isBuiltIn: true,
    },
    {
        id: 'mid-credit',
        name: 'Mid Credit Member (650-719)',
        description: 'Good credit, qualifies for most products as ITA',
        attributes: {
            creditScore: 680,
            hasAutoLoan: true,
            hasMortgage: false,
            hasCreditCard: true,
            memberTenureYears: 3,
            accountBalance: 5000,
            directDeposit: true,
        },
        isBuiltIn: true,
    },
    {
        id: 'new-member',
        name: 'New Member',
        description: 'Recently joined, limited history with the FI',
        attributes: {
            creditScore: 700,
            hasAutoLoan: false,
            hasMortgage: false,
            hasCreditCard: false,
            memberTenureYears: 0,
            accountBalance: 500,
            directDeposit: false,
        },
        isBuiltIn: true,
    },
    {
        id: 'auto-holder',
        name: 'Auto Loan Holder',
        description: 'Has existing auto loan, good candidate for refi',
        attributes: {
            creditScore: 710,
            hasAutoLoan: true,
            hasMortgage: false,
            hasCreditCard: true,
            memberTenureYears: 5,
            accountBalance: 8000,
            directDeposit: true,
        },
        isBuiltIn: true,
    },
    {
        id: 'low-credit',
        name: 'Low Credit Member (<650)',
        description: 'Below average credit, limited preapproval eligibility',
        attributes: {
            creditScore: 620,
            hasAutoLoan: false,
            hasMortgage: false,
            hasCreditCard: false,
            memberTenureYears: 2,
            accountBalance: 1500,
            directDeposit: true,
        },
        isBuiltIn: true,
    },
    {
        id: 'credit-mountain-graduate',
        name: 'Credit Mountain Graduate',
        description: 'Member who improved their credit score using Credit Mountain AI Coach',
        attributes: {
            creditScore: 680,
            previousCreditScore: 620,
            hasAutoLoan: false,
            hasMortgage: false,
            hasCreditCard: false,
            memberTenureYears: 2,
            accountBalance: 3000,
            directDeposit: true,
            usedCreditMountain: true,
            creditScoreImproved: true,
        },
        isBuiltIn: true,
    },
];

const DEFAULT_OFFERS: Offer[] = [
    {
        id: "demo-1",
        title: "New Auto Loan",
        variant: 'preapproved',
        productType: 'auto-loan',
        section: "Auto Loans & Offers",
        isFeatured: true,
        featuredHeadline: "You're preapproved!",
        featuredDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Dictum velit at blandit tortor nunc ut egestas metus.",
        attributes: [
            { label: "Up to", value: "$40,000" },
            { label: "As low as", value: "3.62%", subtext: "APR*†" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
        ctaText: "Learn More"
    },
    {
        id: "demo-2",
        title: "Used Auto Loan",
        variant: 'preapproved',
        productType: 'auto-loan',
        section: "Auto Loans & Offers",
        isFeatured: false,
        attributes: [
            { label: "Up to", value: "$35,000" },
            { label: "As low as", value: "4.49%", subtext: "APR*†" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80",
        ctaText: "Learn More"
    },
    {
        id: "demo-3",
        title: "Home Equity Line of Credit",
        variant: 'preapproved',
        productType: 'heloc',
        section: "Home Loans & Offers",
        isFeatured: false,
        attributes: [
            { label: "Up to", value: "$150,000" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
        ctaText: "Learn More"
    },
    {
        id: "demo-3b",
        title: "First-Time Home Buyer Loan",
        variant: 'ita',
        productType: 'home-loan',
        section: "Home Loans & Offers",
        isFeatured: false,
        attributes: [
            { label: "As low as", value: "6.25%", subtext: "APR*" },
            { label: "Down payment", value: "3%", subtext: "min." }
        ],
        imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
        ctaText: "Learn More"
    },
    {
        id: "demo-4",
        title: "Refinance Your Auto Loan",
        variant: 'auto-refi',
        productType: 'auto-refi',
        section: "Auto Loans & Offers",
        isFeatured: false,
        monthlySavings: 127,
        attributes: [
            { label: "Save up to", value: "$127", subtext: "/mo." },
            { label: "Or as low as", value: "4.99%", subtext: "APR*" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
        ctaText: "Learn More"
    },
    {
        id: "demo-5",
        title: "Platinum Rewards Visa",
        variant: 'ita',
        productType: 'credit-card',
        section: "Credit Cards",
        isFeatured: false,
        attributes: [
            { label: "As low as", value: "12.99%", subtext: "APR*†" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
        ctaText: "Learn More"
    },
    {
        id: "demo-5b",
        title: "Low Rate Mastercard",
        variant: 'preapproved',
        productType: 'credit-card',
        section: "Credit Cards",
        isFeatured: false,
        attributes: [
            { label: "As low as", value: "9.99%", subtext: "APR*" },
            { label: "Credit limit", value: "$5,000", subtext: "up to" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80",
        ctaText: "Apply Now"
    },
    {
        id: "demo-6",
        title: "GAP Plus Coverage",
        variant: 'protection',
        productType: 'gap',
        section: "Special Offers",
        isFeatured: false,
        description: "If your vehicle is deemed a total loss due to an accident or is stolen, GAP Plus addresses the difference between what insurance will pay and what you owe.",
        attributes: [],
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
        ctaText: "Learn More"
    },
    // Deposit Product Offers
    {
        id: "demo-7",
        title: "High-Yield Savings",
        variant: 'wildcard',
        productType: 'savings',
        section: "Savings & Deposits",
        isFeatured: false,
        description: "Grow your savings faster with our top-tier rates. No minimum balance required to earn dividends.",
        attributes: [
            { label: "Earn up to", value: "4.50%", subtext: "APY*" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80",
        ctaText: "Open Account"
    },
    {
        id: "demo-8",
        title: "Premium Checking",
        variant: 'ita',
        productType: 'checking',
        section: "Savings & Deposits",
        isFeatured: false,
        description: "Full-featured checking with no monthly service fees and free access to 55,000+ ATMs nationwide.",
        attributes: [
            { label: "Monthly fee", value: "$0" },
            { label: "ATM access", value: "55,000+", subtext: "free ATMs" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
        ctaText: "Open Account"
    },
    {
        id: "demo-9",
        title: "12-Month Certificate",
        variant: 'wildcard',
        productType: 'certificate',
        section: "Savings & Deposits",
        isFeatured: false,
        description: "Lock in a guaranteed return with our competitive certificate rates. NCUA insured.",
        attributes: [
            { label: "Earn", value: "5.00%", subtext: "APY*" },
            { label: "Term", value: "12 months" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&w=800&q=80",
        ctaText: "Open Certificate"
    },
    // Membership Offer (for Stranger Storefront)
    {
        id: "demo-11",
        title: "Become a Member Today",
        variant: 'new-member',
        productType: 'membership',
        section: "Special Offers",
        isFeatured: false,
        description: "Join our credit union family and unlock exclusive rates, lower fees, and personalized financial guidance.",
        attributes: [],
        imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
        ctaText: "Join Now"
    },
    // Credit Mountain Graduate Personal Loan ITA
    {
        id: "demo-10",
        title: "Personal Loan",
        variant: 'ita',
        productType: 'personal-loan',
        section: "Credit Monitoring & Coaching",
        isFeatured: false,
        description: "Your improved credit score has unlocked new opportunities! Get funds for any purpose with fixed monthly payments.",
        attributes: [
            { label: "Up to", value: "$25,000" },
            { label: "As low as", value: "8.99%", subtext: "APR*" }
        ],
        imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
        ctaText: "Apply Now"
    }
];

// --- Context ---

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [sections, setSections] = useState<string[]>(DEFAULT_SECTIONS);
    const [storefrontConfig, setStorefrontConfig] = useState<StorefrontConfig>(DEFAULT_STOREFRONT_CONFIG);
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<PreviewMode>('demo');
    const [strangerOffers, setStrangerOffers] = useState<StrangerOffer[]>([]);
    const [strangerWelcomeMessage, setStrangerWelcomeMessage] = useState("Explore our offerings and find the right financial products for you.");
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedOffers = localStorage.getItem("movemint_offers");
        const savedSections = localStorage.getItem("movemint_sections");
        const savedConfig = localStorage.getItem("movemint_storefront_config");
        const savedFlags = localStorage.getItem("movemint_feature_flags");
        const savedCampaigns = localStorage.getItem("movemint_campaigns");

        if (savedOffers) {
            // Merge saved offers with defaults to pick up any new default offers
            const parsed = JSON.parse(savedOffers) as Offer[];
            const savedIds = new Set(parsed.map(o => o.id));
            const missingDefaults = DEFAULT_OFFERS.filter(o => !savedIds.has(o.id));
            setOffers([...parsed, ...missingDefaults]);
        } else {
            setOffers(DEFAULT_OFFERS);
        }

        if (savedSections) {
            setSections(JSON.parse(savedSections));
        }

        if (savedConfig) {
            setStorefrontConfig(JSON.parse(savedConfig));
        }

        if (savedFlags) {
            // Merge with defaults to handle new flags added later
            setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(savedFlags) });
        }

        if (savedCampaigns) {
            setCampaigns(JSON.parse(savedCampaigns));
        } else {
            setCampaigns(DEFAULT_CAMPAIGNS);
        }

        const savedProducts = localStorage.getItem("movemint_products");
        if (savedProducts) {
            setProducts(JSON.parse(savedProducts));
        } else {
            setProducts(DEFAULT_PRODUCTS);
        }

        const savedStrangerOffers = localStorage.getItem("movemint_stranger_offers");
        if (savedStrangerOffers) {
            setStrangerOffers(JSON.parse(savedStrangerOffers));
        } else {
            // Migrate from old format (array of IDs)
            const savedStrangerOfferIds = localStorage.getItem("movemint_stranger_offer_ids");
            if (savedStrangerOfferIds) {
                const ids = JSON.parse(savedStrangerOfferIds) as string[];
                setStrangerOffers(ids.map(id => ({ offerId: id, variant: 'ita' as OfferVariant, isFeatured: false })));
                localStorage.removeItem("movemint_stranger_offer_ids");
            }
        }

        const savedStrangerWelcome = localStorage.getItem("movemint_stranger_welcome_message");
        if (savedStrangerWelcome) {
            setStrangerWelcomeMessage(JSON.parse(savedStrangerWelcome));
        }

        setIsInitialized(true);
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem("movemint_offers", JSON.stringify(offers));
        localStorage.setItem("movemint_sections", JSON.stringify(sections));
        localStorage.setItem("movemint_storefront_config", JSON.stringify(storefrontConfig));
        localStorage.setItem("movemint_feature_flags", JSON.stringify(featureFlags));
        localStorage.setItem("movemint_campaigns", JSON.stringify(campaigns));
        localStorage.setItem("movemint_products", JSON.stringify(products));
        localStorage.setItem("movemint_stranger_offers", JSON.stringify(strangerOffers));
        localStorage.setItem("movemint_stranger_welcome_message", JSON.stringify(strangerWelcomeMessage));
    }, [offers, sections, storefrontConfig, featureFlags, campaigns, products, strangerOffers, strangerWelcomeMessage, isInitialized]);

    // Offer Actions
    const addOffer = (offer: Offer) => {
        setOffers(prev => [...prev, offer]);
    };

    const updateOffer = (updatedOffer: Offer) => {
        setOffers(prev => prev.map(o => o.id === updatedOffer.id ? updatedOffer : o));
    };

    const deleteOffer = (id: string) => {
        setOffers(prev => prev.filter(o => o.id !== id));
    };

    const addSection = (section: string) => {
        if (!sections.includes(section)) {
            setSections(prev => [...prev, section]);
        }
    };

    const updateStorefrontConfig = (config: Partial<StorefrontConfig>) => {
        setStorefrontConfig(prev => ({ ...prev, ...config }));
    };

    const updateFeatureFlags = (flags: Partial<FeatureFlags>) => {
        setFeatureFlags(prev => ({ ...prev, ...flags }));
    };

    const resetFeatureFlags = () => {
        setFeatureFlags(DEFAULT_FEATURE_FLAGS);
    };

    // Campaign Actions
    const addCampaign = (campaign: Campaign) => {
        setCampaigns(prev => [...prev, campaign]);
    };

    const updateCampaign = (updatedCampaign: Campaign) => {
        setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
    };

    const deleteCampaign = (id: string) => {
        setCampaigns(prev => prev.filter(c => c.id !== id));
    };

    // Product Actions
    const addProduct = (product: Product) => {
        setProducts(prev => [...prev, product]);
    };

    const updateProduct = (updatedProduct: Product) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };

    const deleteProduct = (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    // Stranger Storefront Actions
    const updateStrangerOffers = (offers: StrangerOffer[]) => {
        setStrangerOffers(offers);
    };

    const updateStrangerWelcomeMessage = (message: string) => {
        setStrangerWelcomeMessage(message);
    };

    return (
        <StoreContext.Provider value={{
            offers,
            sections,
            storefrontConfig,
            featureFlags,
            campaigns,
            customerFields: DEFAULT_CUSTOMER_FIELDS,
            products,
            memberProfiles: DEFAULT_MEMBER_PROFILES,
            selectedProfileId,
            previewMode,
            strangerOffers,
            strangerWelcomeMessage,
            addOffer,
            updateOffer,
            deleteOffer,
            addSection,
            updateStorefrontConfig,
            updateFeatureFlags,
            resetFeatureFlags,
            addCampaign,
            updateCampaign,
            deleteCampaign,
            addProduct,
            updateProduct,
            deleteProduct,
            setSelectedProfileId,
            setPreviewMode,
            updateStrangerOffers,
            updateStrangerWelcomeMessage
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error("useStore must be used within a StoreProvider");
    }
    return context;
}
