# DSF Consumer Prototype — Master Rebuild Plan

## What this is
A vanilla HTML/CSS/JS prototype that serves three jobs:
1. **Internal prototyping** — team pulls from GitHub, edits JSON/flags, demos in standups
2. **Pre-sales demos** — polished, stable, scenario-driven, hosted on Netlify
3. **Demo env replacement** — replaces the existing unstable demo environment

No backend. No database. All state is in-memory, loaded from JSON files on session start.
Reset = reload the page.

---

## Stack — do not deviate
- Plain HTML / CSS / JavaScript — no framework, no build step
- CSS custom properties via `tokens.css` for ALL design values
- GT America font family for typography
- Python `http.server` for local dev
- Netlify for hosting (static file deploy)
- No Tailwind, no JS framework, no bundler

---

## File Structure — build exactly this

```
/
├── index.html                  ← Entry: landing / stranger storefront
├── storefront.html             ← Entry: full consumer storefront (SSO)
├── widget.html                 ← Entry: home banking embedded widget
│
├── tokens.css                  ← Design tokens (source of truth for all values)
│
├── components/
│   ├── storefront-card.js      ← Large card (grid layout) — full storefront
│   ├── medium-card.js          ← Medium card (2-col row) — widget view
│   ├── hero-banner.js          ← Featured offer hero unit
│   ├── filter-bar.js           ← Category filter tabs
│   └── hb-shell.js             ← Home banking outer chrome (decorative, not interactive)
│
├── data/
│   ├── default-state.json      ← Loads on every fresh session
│   └── scenarios/
│       ├── auto-loans.json
│       ├── home-lending.json
│       ├── credit-cards.json
│       ├── mixed-portfolio.json
│       └── sales-demo-generic.json
│
├── admin/
│   ├── storefront-config.html  ← How offers are configured per user/segment
│   ├── cu-admin.html           ← CU-facing: products, rates, campaigns
│   └── prototype-controls.html ← Feature flags + scenario loader (internal only)
│
└── assets/
    └── images/                 ← Product/offer images
```

---

## Design Tokens — always use variables, never hardcode

```css
/* Colors */
--color-contrast-white:   #FBFBFB;   /* card backgrounds */
--color-contrast-black:   #262C30;   /* primary text */
--color-greyscale-08:     #576975;   /* eyebrow/secondary text */
--color-system-green:     #269B78;   /* Preapproved tag */
--color-system-purple:    #8A55FB;   /* Apply Now tag */

/* Shadows */
--shadow-card: 0px 4px 8px 0px rgba(0,0,0,0.06);

/* Radii */
--radius-card:       20px;
--radius-card-image: 10px;       /* large card image */
--radius-medium-img: 8px;        /* medium card image */
--radius-tag:        20px 0 20px 0;   /* asymmetric — critical */

/* Spacing */
--space-card-gap:      16px;
--space-section-gap:   48px;
--space-section-title: 59px;     /* title to card grid */
--space-card-pad-x:    16px;
```

---

## Component Specs

### 1. Large Storefront Card (`storefront-card.js`)
Used in: `storefront.html`, `index.html`
Layout: vertical, 4-across grid

```
┌─────────────────────────┐
│ [TAG BADGE]             │  ← flush top-left, overflow:hidden clips corner
│ Product Display Name    │  ← 20px Extended Regular, 2 lines
│ Up to      As low as    │  ← eyebrow 14px #576975
│ [$##,###]  [#.##%] APR  │  ← value 18px Extended Medium #262C30
│ ┌───────────────────┐   │  ← image: 16px inset, 10px radius, 112px tall
│ │    [image]        │   │
│ └───────────────────┘   │
│       Learn More        │  ← 14px Medium, underline, centered
└─────────────────────────┘

card: background #FBFBFB, border-radius 20px, shadow var(--shadow-card), overflow:hidden
tag:  border-radius 20px 0 20px 0, padding 2px 16px, 12px Extended Medium, uppercase, tracking 0.5px
```

Tag variants:
- `.tag--preapproved` → `#269B78` green, text "YOU'RE PREAPPROVED!"
- `.tag--apply-now`   → `#8A55FB` purple, text "APPLY NOW"
- `.tag--special`     → `#262C30` dark, text "SPECIAL OFFER"

### 2. Medium Storefront Card (`medium-card.js`)
Used in: `widget.html`
Layout: horizontal row, 2-across grid, 108px tall

```
┌─────────────────────────────────────────────┐
│ [TAG]                          Learn More   │  ← tag left, CTA right, 14px underline
│ ┌──────┐  Product Display Name          >  │
│ │ img  │  Up to        As low as           │  ← thumbnail 72×52px, radius 8px
│ └──────┘  [$##,###]    [#.##%] APR*        │  ← values same token as large card
└─────────────────────────────────────────────┘

card: same background/shadow/radius as large card
image: 72px wide × 52px tall, border-radius 8px
chevron: 24px icon, right-aligned, top-padded 16px
product name: 18px Extended Regular, single line, ellipsis overflow
hero values: two columns 100px wide each, gap 4px
```

### 3. Home Banking Shell (`hb-shell.js`)
Used in: `widget.html` as outer wrapper
Decorative only — not interactive
Renders: sidebar nav (Home, Special Offers, Settings, Log Out), top bar (greeting, last login), account summary panel (Checking + Savings with mock balances)
The widget content area sits inside this shell as an iframe-like inset panel.

### 4. Hero Banner (`hero-banner.js`)
Used in: `storefront.html`, `widget.html`
Featured offer: full-width image, product name, description text, primary CTA button, "Details & disclosures" link, carousel dots

### 5. Filter Bar (`filter-bar.js`)
Tabs: All | Auto Loans & Offers | Home Loans & Offers | Credit Cards | Savings & Deposits | Special Offers
Active tab: filled dark pill `#262C30` white text
Inactive: outlined pill, transparent

---

## Data Model — `default-state.json`

```json
{
  "user": {
    "name": "Cameron",
    "greeting": "Hi Cameron,"
  },
  "appearance": {
    "institution_name": "Credit Union",
    "logo_url": null,
    "primary_color": null
  },
  "flags": {
    "show_hero_banner": true,
    "show_filter_bar": true,
    "show_credit_mountain": false,
    "enable_widget_view": true
  },
  "sections": [
    {
      "id": "auto-loans",
      "title": "Auto Loans & Offers",
      "offers": []
    }
  ]
}
```

Each offer object:
```json
{
  "id": "offer-001",
  "product_name": "Used Auto Loan",
  "tag": "preapproved",
  "hero_values": [
    { "label": "Up to", "value": "$35,000" },
    { "label": "As low as", "value": "4.49%", "suffix": "APR*†" }
  ],
  "image_url": "/assets/images/auto-loan.jpg",
  "cta_label": "Learn More",
  "cta_url": "#"
}
```

---

## Admin Panels

### `/admin/prototype-controls.html` — Internal use only
- Scenario loader: buttons to apply each scenario JSON
- Feature flag toggles: on/off switches for each flag in `flags`
- Reset to defaults button
- "View Storefront" / "View Widget" links
- Label clearly as "PROTOTYPE CONTROLS — NOT FOR CLIENT DEMOS"

### `/admin/storefront-config.html` — Storefront configuration
- Offer editor: create/edit/delete offers with all fields
- Section manager: reorder sections, rename titles
- Appearance settings: institution name, logo, colors

### `/admin/cu-admin.html` — CU admin panel (mocked)
- Products tab: product catalogue with rates
- Campaigns tab: campaign list with status
- Notifications tab: configurable alerts
- Matches the visual style the actual CU admin would see

---

## Entry Points

### `index.html` — Landing / Stranger Storefront
- No personalization — "guest" mode
- Shows full product grid with "Apply Now" tags only (no preapproved)
- Same layout as storefront.html but without greeting or hero banner

### `storefront.html` — Full Consumer Storefront
- Personalized greeting: "Hi [name],"
- Hero banner (if flag enabled)
- Filter category bar
- Product sections with large storefront cards (4-across grid)
- Footer disclaimers
- Loads `default-state.json` on init, scenario overrides on demand

### `widget.html` — Home Banking Widget
- Renders HB shell (decorative outer chrome)
- Inside: hero banner, filter tabs, sections using medium cards (2-across)
- "Show More" link at bottom
- Scrolls independently inside shell container
- Same data model as storefront — just different card component

---

## Page State & Session Management

```javascript
// On page load
const state = await loadJSON('/data/default-state.json');
renderPage(state);

// On scenario apply
const scenario = await loadJSON('/data/scenarios/auto-loans.json');
Object.assign(state, scenario);
renderPage(state);

// Reset
location.reload();
```

All rendering is done by replacing innerHTML of a `#storefront-content` container.
No virtual DOM. No diffing. Just re-render on state change.

---

## Claude Code Opening Prompt

Paste this exactly when starting your Claude Code session:

```
Read CLAUDE.md in full before doing anything else.

Then build the complete prototype described in it, starting with:
1. tokens.css — all design tokens
2. storefront.html + components/storefront-card.js — the main consumer view
3. data/default-state.json + data/scenarios/*.json — the data layer
4. widget.html + components/medium-card.js + components/hb-shell.js
5. index.html — stranger/landing view
6. admin/prototype-controls.html — scenario loader + feature flags
7. admin/storefront-config.html and admin/cu-admin.html

Build each file completely before moving to the next.
Use only vanilla HTML, CSS, and JavaScript — no frameworks, no build tools.
Use CSS custom properties from tokens.css for all design values — never hardcode.
Do not ask for confirmation between steps.
```