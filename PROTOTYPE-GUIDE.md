# Movemint DSF Product Config Prototype

## Access URL
**https://unarticulatory-abril-vineless.ngrok-free.dev/**

---

## Important Notes

This is a **front-end prototyping platform** for demonstrating Digital Storefront (DSF) capabilities.

- **No backend or database** - All data is stored in your browser's local storage
- **Session-specific** - Your configurations persist only in YOUR browser
- **Reset anytime** - Clear browser data or use "Reset to Defaults" to start fresh
- **Safe to experiment** - Nothing you do here affects any real systems

---

## Platform Overview

The prototype demonstrates the complete Digital Storefront ecosystem:

| Area | Description |
|------|-------------|
| **Storefront** | Consumer-facing offer marketplace |
| **Landing Page** | Public marketing/entry page |
| **Home Banking Widgets** | Embedded offer widgets for online banking |
| **Admin Portal** | Configuration and campaign management |

---

## Quick Start Guide

### 1. Enable Features
Navigate to **Admin > Feature Flags** to toggle features on/off:
- Perpetual Campaigns (always-on member offers)
- Consumer Prequalification
- Credit Mountain (AI Coach)
- Offer badges and animations
- Home banking widgets
- And more...

### 2. View Consumer Experiences
- **/storefront** - Main offer marketplace
- **/landing** - Public landing page
- **/home-banking** - Partner widget demos (Q2, Alkami, etc.)

### 3. Configure Products & Campaigns
- **Admin > Products** - Manage product catalog
- **Admin > Campaigns** - Set up targeted/perpetual campaigns with rules

---

## Demo Mode vs Live Mode

The prototype supports two preview modes for consumer-facing pages:

### Demo Mode (Default)
- Shows **preset demo offers** from the `DEFAULT_OFFERS` list
- Does not evaluate campaign rules
- Good for showing the UI/UX without needing campaign configuration
- Offers appear as defined in the demo data

### Live Mode
- **Evaluates ALL live campaigns** against the selected member profile
- Shows offers based on actual **Product Rules** and **Preapproval Rules**
- Demonstrates how the rule engine determines offer eligibility
- Requires selecting a **Member Profile** to evaluate against

### How to Use Preview Mode

1. Go to any consumer page (Storefront, Landing, Home Banking)
2. Look for the **Demo/Live toggle** in the preview controls bar
3. Click **Live** to switch to live mode
4. Select a **Member Profile** from the "Preview As..." dropdown
5. The page will re-render showing offers based on campaign rules

### Member Profiles

Built-in profiles for testing different scenarios:

| Profile | Credit Score | Key Attributes |
|---------|--------------|----------------|
| High Credit Member (720+) | 750 | Has mortgage, direct deposit, 8yr tenure |
| Mid Credit Member (650-719) | 680 | Has auto loan, credit card, 3yr tenure |
| New Member | 700 | No existing products, 0yr tenure |
| Auto Loan Holder | 710 | Has auto loan (good for refi offers) |
| Low Credit Member (<650) | 620 | Limited product eligibility |

---

## Product Configuration

### Product Types

The system supports multiple product categories:

**Lending Products:**
- Auto Loan, Auto Refinance
- Home Loan, HELOC
- Credit Card, Credit Limit Increase
- Term Life, GAP Coverage, MRC, Debt Protection

**Deposit Products:**
- Savings Account
- Checking Account
- Money Market Account
- Share Certificate (CD)

### Managing Products

1. Go to **Admin > Products**
2. View all products in the catalog
3. Click **Add Product** to create new products
4. Edit existing products to modify attributes, rates, images
5. Toggle **Active/Inactive** to control campaign availability

---

## Campaign Management

### Campaign Types

| Type | Description | Rules Support |
|------|-------------|---------------|
| **Targeted** | File-based campaigns with customer data | Full rules |
| **Untargeted** | Always-on offers shown to all visitors | No rules |
| **Perpetual** | Always-on member offers with lifecycle management | Full rules |

### Perpetual Campaigns (Always-On Member Offers)

*Feature Flag: `campaigns_perpetualType`*

Perpetual campaigns are designed for ongoing member offers that rotate automatically.

**Key Features:**
- Products can have **Product Rules** (who sees the offer)
- Products can have **Preapproval Rules** (who gets preapproved)
- **Lifecycle Settings** control offer duration and rotation

**Lifecycle Settings:**

| Setting | Options | Description |
|---------|---------|-------------|
| Expiration Trigger | Manual, Days, Redemptions, Date | How the offer expires |
| Replacement Behavior | Add, Replace Specific, Clear All | What happens to existing offers |
| Expiration Action | Remove, Replace, Notify | What happens when offer expires |

**Setting Up a Perpetual Campaign:**
1. Go to **Admin > Campaigns**
2. Create new campaign, select **Perpetual** type
3. Add products to sections
4. Click **Edit** on a product to configure rules
5. Set Product Rules (who sees it as ITA)
6. Set Preapproval Rules (who gets preapproved + limits)
7. Configure Lifecycle Settings (duration, rotation)

### Rule System

**Product Rules:**
- Determine IF a product is displayed to a member
- If ANY rule matches, product shows as **Invite to Apply (ITA)**
- No rules = always show (for default products)

**Preapproval Rules:**
- Determine IF a product shows as **Preapproved** vs ITA
- If ANY preapproval rule matches, variant = **Preapproved**
- Can include preapproval limits (e.g., "Up to $50,000")
- Highest matching limit wins when multiple rules match

**Example Configuration:**
```
Product: New Auto Loan

Product Rule:
- Credit Score >= 600 → Show as ITA

Preapproval Rules:
- Credit Score >= 720 → Preapproved up to $50,000
- Credit Score >= 680 AND < 720 → Preapproved up to $35,000
```

Result:
- Member with 750 score sees: "Preapproved up to $50,000"
- Member with 690 score sees: "Preapproved up to $35,000"
- Member with 620 score sees: "Apply Now" (ITA)
- Member with 580 score sees: Nothing (doesn't meet product rule)

### Rule Operators

| Operator | Description | Example |
|----------|-------------|---------|
| equals | Exact match | State equals "CA" |
| not_equals | Does not match | State not_equals "NY" |
| greater_than | > value | Credit Score > 700 |
| less_than | < value | Debt to Income < 40 |
| greater_than_or_equal | >= value | Credit Score >= 680 |
| less_than_or_equal | <= value | Balance <= 10000 |
| is_true | Boolean true | Has Auto Loan is true |
| is_false | Boolean false | Bankruptcy Indicator is false |
| contains | Text contains | Address contains "Main St" |
| not_contains | Text doesn't contain | Name not contains "Test" |

### Available Rule Attributes

**From Credit Bureau:**
- Credit Score / FICO Score
- Bankruptcy Indicator
- MLA Indicator
- Debt to Income

**From Financial Institution:**
- Member Since (tenure in years)
- Account Balance
- Has Auto Loan
- Has Mortgage
- Has Credit Card
- Direct Deposit

---

## Feature Flags

Navigate to **Admin > Feature Flags** to toggle features:

### Campaign Features
| Flag | Description |
|------|-------------|
| `campaigns_perpetualType` | Enable perpetual (always-on) campaign type |

### Storefront Features
| Flag | Description |
|------|-------------|
| `storefront_heroAutoRotate` | Auto-rotate hero carousel |
| `storefront_showBadges` | Show variant badges on offer cards |
| `storefront_animatedCards` | Enable card hover animations |
| `storefront_creditMountain` | Show Credit Mountain when no preapprovals |

### Consumer Features
| Flag | Description |
|------|-------------|
| `consumer_prequalification` | Enable consumer-initiated prequalification |

### Home Banking Features
| Flag | Description |
|------|-------------|
| `homeBanking_showOfferWidget` | Show personalized offers carousel |
| `homeBanking_showQuickActions` | Show quick actions panel |
| `homeBanking_showAccountBalances` | Show account balance summary |

### Admin Features
| Flag | Description |
|------|-------------|
| `admin_bulkActions` | Enable bulk edit/delete offers |
| `admin_offerAnalytics` | Show offer performance metrics |
| `admin_optimizationDashboard` | Show Optimization Dashboard |
| `admin_optimizationRevio` | Show Revio ROI optimization |
| `admin_optimizationVertice` | Show Vertice AI propensity scoring |

---

## Consumer Prequalification

*Feature Flag: `consumer_prequalification`*

Allows consumers to self-initiate a prequalification check without impacting their credit score.

**How it works:**
1. Consumer sees "Get prequalified in seconds!" card
2. Enters: Full Name, Address, Date of Birth, SSN
3. SSN is masked (only last 4 digits visible)
4. Submits for soft credit pull (simulated)
5. Receives prequalification result with loan terms
6. Can proceed to full application

**Where it appears:**
- Storefront page
- Landing page
- Home Banking widgets (Q2, Alkami, etc.)

---

## Credit Mountain (AI Coach)

*Feature Flag: `storefront_creditMountain`*

When a consumer has no preapproved offers, shows an AI-powered credit coaching experience.

**How it works:**
- Displays a Credit Mountain card with "Meet your AI Coach" CTA
- Consumer is SSO'd into the Credit Mountain experience
- After first visit, CTA changes to "Visit your AI Coach"
- Provides personalized guidance to help build better credit

**Where it appears:**
- Storefront page (when no preapproved offers exist)
- Landing page (as fallback)
- Home Banking widgets (as fallback when no offers)

---

## Offer Variants

| Variant | Badge | Description |
|---------|-------|-------------|
| `preapproved` | "You're Preapproved!" (teal) | Member is preapproved |
| `ita` | "Apply Now" | Invited to apply |
| `wildcard` | "Special Offer" (purple) | Promotional offer |
| `auto-refi` | "Save $X/mo" | Auto refinance with savings |
| `credit-limit` | — | Credit limit increase |
| `protection` | — | GAP, MRC, insurance products |
| `redeemed` | Greyed out | Already claimed |

---

## Home Banking Integrations

Demonstrates how offers appear within online banking platforms:

| Partner | Path | Description |
|---------|------|-------------|
| Q2 | `/home-banking` (select Q2) | Q2 Digital Banking integration |
| Alkami | `/home-banking` (select Alkami) | Alkami integration |

Each widget supports:
- Offer display
- Demo/Live mode toggle
- Preview As member profile selection
- Consumer prequalification
- Credit Mountain fallback

---

## Demo Walkthrough

### Basic Consumer Demo

1. Start at homepage (`/`) - Launchpad
2. Click **Storefront** to view consumer marketplace
3. Note the **Demo/Live toggle** and **Preview As** dropdown
4. Show demo offers (default state)
5. Toggle to **Live** mode
6. Select **High Credit Member** from Preview As dropdown
7. Watch offers update based on campaign rules
8. Click into a preapproved offer, walk through application flow
9. Switch to **Low Credit Member** - show fewer/different offers

### Feature Flag Demo

1. Go to **Admin > Feature Flags**
2. Toggle **Consumer Prequalification** ON
3. Return to Storefront
4. Show the "Get prequalified" card that now appears
5. Demonstrate the self-service prequal flow
6. Toggle **Credit Mountain** ON
7. Select a profile with no preapprovals
8. Show the Credit Mountain AI Coach card

### Campaign Configuration Demo

1. Go to **Admin > Campaigns**
2. Show the perpetual campaign "Always-On Member Offers"
3. Click into the campaign
4. Go to **Products** tab
5. Click **Edit** on a product
6. Show the **Product Rules** section (who sees it)
7. Show the **Preapproval Rules** section (who gets preapproved)
8. Demonstrate adding a rule with clauses
9. Show **Lifecycle Settings** for perpetual campaigns
10. Save and return to Storefront to see changes

### End-to-End Rule Demo

1. Create a new product rule: Credit Score >= 680
2. Create preapproval rule: Credit Score >= 720, Limit $40,000
3. Switch to Storefront, Live mode
4. Select **High Credit (750)** - see preapproved at $40,000
5. Select **Mid Credit (680)** - see as ITA
6. Select **Low Credit (620)** - offer doesn't appear

---

## Data Persistence

All data stored in browser localStorage:

| Key | Contents |
|-----|----------|
| `movemint_offers` | Demo offer configurations |
| `movemint_sections` | Category sections |
| `movemint_storefront_config` | Storefront settings |
| `movemint_feature_flags` | Feature toggle states |
| `movemint_campaigns` | Campaign data |
| `movemint_products` | Product catalog |

**To reset everything:**
1. Go to Admin > Feature Flags
2. Click "Reset to Defaults"
3. Or clear browser localStorage manually
4. Refresh the page

**To see new default products (after updates):**
- Clear `movemint_products` and `movemint_offers` from localStorage
- Refresh to load updated defaults

---

## Technical Notes

- Built with **Next.js 14** (App Router)
- Styled with **Tailwind CSS**
- Icons from **Lucide React**
- State management via **React Context**
- No authentication required
- Responsive design (desktop + mobile)

---

## Troubleshooting

**Offers not updating when switching modes:**
- Make sure you've selected a member profile in Live mode
- Live mode requires a profile to evaluate rules against

**New products not appearing:**
- Clear localStorage for `movemint_products` to reload defaults
- Or add products manually via Admin > Products

**Rules not working as expected:**
- Check that the campaign is set to **Live** status
- Verify the profile has attributes matching your rule conditions
- Remember: Product Rules are ORed, Clauses within a rule are ANDed

---

## Questions or Issues?

This is a prototype for demonstration purposes. For questions about the actual DSF product, contact the Movemint team.
