# Architecture Restructure Plan: Products, Campaigns, and Preview

## Overview

This document outlines the planned restructure to separate **Product Configuration** (admin setup) from **Offer Preview** (consumer-facing testing), with campaigns serving as the bridge that transforms products into offers.

---

## Current State (Problems)

1. **"Offer Manager"** conflates two concepts:
   - Products (what the FI sells)
   - Offers (what consumers see, which depends on rules)

2. **Campaigns pull from "Offers"** but should pull from **Products**

3. **No way to test** how rules affect what a member sees without a real rules engine

4. **Demo scenarios** are hardcoded in the storefront, bypassing configuration entirely

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADMIN CONFIGURATION                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Product Configuration (NEW - /admin/products)                          │
│  ├── Create/edit products (name, type, description, image, rates)       │
│  ├── Products are the "catalog" of what the FI can offer                │
│  └── These get associated to campaigns                                  │
│                                                                         │
│  Campaign Configuration (/admin/campaigns)                              │
│  ├── Add Products → becomes CampaignProduct                             │
│  ├── Configure Rules (targeted) → determines offer variant at runtime   │
│  ├── Configure Lifecycle (perpetual) → rotation/expiration              │
│  └── File Processing (targeted) → customer data                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Rules evaluated against
                                    │ selected member profile
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONSUMER-FACING PREVIEW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Storefront Preview (/storefront)                                       │
│  ├── "Preview As" dropdown (member profiles)                            │
│  ├── Shows offers based on campaign rules + selected profile            │
│  └── Demo Scenarios toggle (bypasses config for canned demos)           │
│                                                                         │
│  Home Banking Preview (/home-banking)                                   │
│  ├── Same "Preview As" dropdown                                         │
│  ├── Shows offers in home banking context                               │
│  └── Demo Scenarios toggle                                              │
│                                                                         │
│  Offer Manager (RELOCATED - now under Preview section)                  │
│  ├── Renamed to "Offer Preview Editor" or similar                       │
│  ├── For creating mock offers to test visual appearance                 │
│  └── Independent from campaign configuration                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model Changes

### New: Product (for configuration)

```typescript
interface Product {
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

interface ProductAttribute {
    label: string;                     // "As low as", "Up to"
    value: string;                     // "3.99%", "$50,000"
    subtext?: string;                  // "APR*"
}
```

### Existing: CampaignProduct (association + rules)

```typescript
interface CampaignProduct {
    id: string;
    productId: string;                 // References Product.id
    // ... existing fields for rules, featured text, etc.
}
```

### New: MemberProfile (for preview)

```typescript
interface MemberProfile {
    id: string;
    name: string;                      // "High Credit Member (720+)"
    description: string;               // "Excellent credit, long tenure"

    // Mock attributes for rule evaluation
    attributes: {
        creditScore: number;
        hasAutoLoan: boolean;
        hasMortgage: boolean;
        hasCreditCard: boolean;
        memberTenureYears: number;
        accountBalance: number;
        directDeposit: boolean;
        // ... etc
    };

    isBuiltIn: boolean;                // System-provided vs custom
}
```

### Existing: Offer (renamed/repurposed for preview)

The existing `Offer` type stays but is understood to be for **preview/demo purposes only**, not connected to campaign configuration.

---

## Navigation Changes

### Current Admin Sidebar:
```
Campaigns
Offer Manager
Settings
  └── Storefront Appearance
  └── Feature Flags
```

### Proposed Admin Sidebar:
```
Products              (NEW)
Campaigns
Preview
  └── Storefront
  └── Home Banking
  └── Offer Editor    (moved from "Offer Manager")
Settings
  └── Appearance
  └── Feature Flags
```

---

## Member Profiles (Built-in)

```typescript
const BUILT_IN_PROFILES: MemberProfile[] = [
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
        id: 'custom',
        name: 'Custom Profile',
        description: 'Configure your own member attributes',
        attributes: { /* user-configurable */ },
        isBuiltIn: false,
    },
];
```

---

## Preview Flow (How Rules Get "Evaluated")

Since we don't have a real rules engine, the prototype will **simulate** rule evaluation:

1. User selects a **Member Profile** in the preview
2. For each **CampaignProduct** in the active campaign:
   - If `isDefaultCampaignProduct` → always show
   - Else, check if profile attributes match any `productRules`
3. For products that match:
   - Check if profile matches any `preapprovalRules` → show as "Preapproved"
   - Else → show as "Invited to Apply"
4. Render the resulting offers in the storefront/home banking preview

```typescript
function evaluateRules(
    campaignProduct: CampaignProduct,
    profile: MemberProfile
): { show: boolean; variant: 'preapproved' | 'ita' } {
    // Default products always show
    if (campaignProduct.isDefaultCampaignProduct) {
        // Check preapproval rules
        const isPreapproved = campaignProduct.preapprovalRules.some(rule =>
            evaluateRule(rule, profile)
        );
        return { show: true, variant: isPreapproved ? 'preapproved' : 'ita' };
    }

    // Check product rules
    const matchesProductRule = campaignProduct.productRules.some(rule =>
        evaluateRule(rule, profile)
    );

    if (!matchesProductRule) {
        return { show: false, variant: 'ita' };
    }

    // Check preapproval rules
    const isPreapproved = campaignProduct.preapprovalRules.some(rule =>
        evaluateRule(rule, profile)
    );

    return { show: true, variant: isPreapproved ? 'preapproved' : 'ita' };
}
```

---

## Implementation Phases

### Phase 1: Product Configuration
- [ ] Create `Product` type in StoreContext
- [ ] Create `/admin/products` page (list + CRUD)
- [ ] Migrate existing `offers` data to `products` format
- [ ] Update campaign "Add Product" to pull from Products (not Offers)

### Phase 2: Navigation Restructure
- [ ] Add "Products" to admin sidebar
- [ ] Create "Preview" section in sidebar
- [ ] Move Offer Manager under Preview → rename to "Offer Editor"
- [ ] Update storefront/home-banking links to go under Preview

### Phase 3: Member Profiles + Preview As
- [ ] Create `MemberProfile` type and built-in profiles
- [ ] Add "Preview As" dropdown to Storefront preview page
- [ ] Add "Preview As" dropdown to Home Banking preview page
- [ ] Implement rule evaluation simulation
- [ ] Connect preview to active campaign's products

### Phase 4: Demo Scenarios Toggle
- [ ] Add "Demo Mode" toggle to preview pages
- [ ] When enabled, show hardcoded demo offers (current behavior)
- [ ] When disabled, show campaign-driven offers based on profile

---

## Questions to Resolve

1. **Which campaign is "active" for preview?**
   - Option A: Most recent live campaign
   - Option B: User selects from dropdown
   - Option C: Perpetual campaign is always the default

2. **What happens in preview if no campaign is live?**
   - Show empty state with prompt to create/launch a campaign?
   - Fall back to demo mode?

3. **Should custom member profiles persist?**
   - LocalStorage like other settings?
   - Or ephemeral per-session?

---

## Files to Create/Modify

### New Files:
- `/src/app/admin/products/page.tsx` - Product list/management
- `/src/app/admin/preview/page.tsx` - Preview landing (optional)
- `/src/components/preview/PreviewAsDropdown.tsx` - Member profile selector
- `/src/lib/ruleEvaluator.ts` - Mock rule evaluation logic

### Modified Files:
- `/src/context/StoreContext.tsx` - Add Product, MemberProfile types
- `/src/components/admin/AdminLayout.tsx` - Update sidebar navigation
- `/src/app/storefront/page.tsx` - Add Preview As dropdown
- `/src/app/home-banking/page.tsx` - Add Preview As dropdown
- `/src/components/admin/campaigns/ProductsTab.tsx` - Pull from Products not Offers

---

## Notes

- This restructure maintains backward compatibility with existing demo scenarios
- The "Offer Editor" (formerly Offer Manager) remains useful for testing visual appearance without needing full campaign setup
- Rule evaluation is simulated, not a real rules engine — good enough for prototyping
