# DSF Consumer Prototype — Master Plan

## What this is
A Next.js prototype that serves three jobs:
1. **Internal prototyping** — team pulls from GitHub, edits config/flags, demos in standups
2. **Pre-sales demos** — polished, stable, scenario-driven, hosted on Netlify
3. **Demo env replacement** — replaces the existing unstable demo environment

No backend. No database. All state lives in React context (`StoreContext`), seeded from in-repo defaults. Reset = reload the page.

The visual source of truth is the Figma file `CNX Templates/XL Storefront` (root node `6118:207855`). Pixel fidelity to Figma is the goal.

---

## Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — config lives in `src/app/globals.css` via the `@theme` directive (no `tailwind.config.ts` for tokens)
- **lucide-react** for icons
- **clsx + tailwind-merge** via `cn()` helper at `src/lib/utils.ts`
- **GT America** font family for typography (must be loaded — see Fonts section)
- **Netlify** for hosting (`next build`, static-friendly)

The Figma dev-mode export is React + Tailwind with arbitrary values (`bg-[#262c30]`, `rounded-tl-[20px]`, etc.). Prefer pasting Figma values verbatim using arbitrary-value syntax over re-deriving them through abstractions.

---

## File structure (current)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    ← root landing
│   ├── globals.css                 ← Tailwind v4 entry + @theme tokens
│   ├── storefront/
│   │   ├── page.tsx                ← personalized consumer storefront
│   │   ├── offer/[id]/             ← offer detail
│   │   └── prequalification/
│   ├── stranger-storefront/        ← guest/no-SSO view
│   ├── home-banking/               ← embedded widget view
│   ├── credit-mountain/
│   ├── demopolis/
│   ├── landing/
│   └── admin/                      ← internal config + CU admin panels
├── components/
│   ├── storefront/                 ← OfferCard, HeroCarousel, etc.
│   ├── home-banking/
│   ├── admin/
│   └── preview/                    ← PreviewModeToggle, PreviewAsDropdown
├── context/
│   └── StoreContext.tsx            ← all prototype state (offers, flags, profile)
├── hooks/
│   └── useStorefront.ts
└── lib/
    ├── ruleEvaluator.ts
    └── utils.ts                    ← cn() helper
```

---

## Design tokens (Figma-aligned — source of truth)

These live in `src/app/globals.css` inside `@theme`. Use Tailwind utilities that reference them (e.g. `text-contrast-black`, `bg-page`) **or** Figma's arbitrary values (`text-[#262c30]`) — both are acceptable. Never invent ad-hoc colors.

### Colors
| Token | Hex | Use |
|---|---|---|
| `--color-page` | `#E7EAEC` | Outer page background (Greyscale 02) |
| `--color-contrast-white` | `#FBFBFB` | Card/surface background |
| `--color-contrast-black` | `#262C30` | Primary text, dark surfaces, primary button |
| `--color-ultra-black` | `#131515` | Active menu item |
| `--color-greyscale-03` | `#E6EAEB` | Header borders |
| `--color-greyscale-06` | `#9BA7AE` | — |
| `--color-greyscale-07` | `#677178` | Chip border, secondary nav text |
| `--color-greyscale-08` | `#576975` | Eyebrow / secondary text |
| `--color-system-green` | `#269B78` | Preapproved tag |
| `--color-system-purple` | `#8A55FB` | Apply Now tag |
| `--color-tag-neutral` | `#C8CED1` | Redeemed tag bg |

### Shadows
- `--shadow-card: 0 4px 8px 0 rgba(0,0,0,0.06)` — card (Drop Shadows/02)
- `--shadow-header: 0 6px 10px 0 rgba(0,0,0,0.08)` — top nav (Drop Shadows/03)

### Radii
- `--radius-card: 20px` — large/medium cards
- `--radius-card-image: 10px` — large card image
- `--radius-medium-img: 8px` — medium card thumbnail
- `--radius-tag: 20px 0 20px 0` — asymmetric tag (top-left + bottom-right only)
- `--radius-chip: 43px` — filter chip
- `--radius-button: 100px` — primary CTA pill

### Spacing
- `--space-page-pad-x: 48px` — page horizontal gutters
- `--space-section-gap: 48px` — between product sections
- `--space-section-title-gap: 24px` — section title → card grid
- `--space-card-gap: 16px` — between cards in a row
- `--space-card-pad-x: 16px` — card horizontal padding
- `--space-card-content-gap: 8px` — card vertical content gap
- `--space-card-header-h: 102px` — fixed card header (name + values) height
- `--space-hero-col: 116px` — hero-value column width inside cards
- `--space-hero-card-h: 314px` — featured offer card height

### Container widths
- `--width-page: 1296px` — outer frame
- `--width-body: 1200px` — inner body container

### Typography (all GT America)
| Token | Family / Style | Size | Line height | Tracking |
|---|---|---|---|---|
| Title 36 | GT America Extended Regular | 36 | normal | -1 |
| Title 32 | GT America Extended Regular | 32 | 32 | -1 |
| Title 24 | GT America Extended Medium | 24 | 26 | -1 |
| Title 20 | GT America Extended Regular | 20 | 26 | -1 |
| Title 18 | GT America Extended Medium | 18 | normal | -1 |
| Body 16 | GT America Regular | 16 | 20 | 0 |
| Body 14 | GT America Regular | 14 | 20 | 0 |
| Body 14 underline | GT America Medium | 14 | 20 | 0 |
| Body 12 | GT America Regular | 12 | 16 | 0 |
| Tag | GT America Extended Medium | 12 | 20 | 0.5 (uppercase) |

All "Extended Medium" numeric type uses OpenType `font-feature-settings: 'ss03'`.

### Fonts
GT America is a licensed font and must be self-hosted under `public/fonts/` and registered via `next/font/local` in `src/app/layout.tsx`. Until the font files are added, the prototype will fall back to system sans — that's a known visual delta, not a bug in the layout.

---

## Component specs

### Large Storefront Card — `src/components/storefront/LargeStorefrontCard.tsx`
Used in: storefront grid, stranger storefront. Layout: vertical, 4-across grid (each card `flex-1` inside a `1200px` container with `16px` gaps → ~288px wide).

```
┌─────────────────────────┐
│ [TAG BADGE]             │  ← flush top-left, card overflow-clip crops corner
│ Product Display Name    │  ← Title 20 Extended Regular, 102px fixed header
│ Up to      As low as    │  ← Body 14 Regular, #576975
│ [$##,###]  [#.##%] APR* │  ← Title 18 Extended Medium #262C30, 116px cols
│ ┌───────────────────┐   │  ← image: 16px inset, 10px radius, 112px tall
│ │    [image]        │   │
│ └───────────────────┘   │
│       Learn More        │  ← Body 14 underline, centered, pt-4 pb-8
└─────────────────────────┘

card: bg #FBFBFB, radius 20, shadow-card, overflow-clip
header: px-16, fixed h-102, gap-8 column
hero values row: gap-8, two 116px columns
image wrapper: px-16
```

Tag variants:
- `preapproved` → `#269B78` bg, white text, label `"You're preapproved!"` (rendered uppercase via CSS)
- `apply-now` → `#8A55FB` bg, white text, label `"APPLY NOW"`
- `special` → `#262C30` bg, white text, label `"SPECIAL OFFER"`
- `redeemed` → `#C8CED1` bg, `#576975` text, label `"REDEEMED"`

### Medium Storefront Card — `src/components/storefront/MediumStorefrontCard.tsx`
Used in: home-banking widget view. Horizontal row, 2-across grid, 108px tall.

```
┌─────────────────────────────────────────────┐
│ [TAG]                          Learn More   │
│ ┌──────┐  Product Display Name          >  │
│ │ img  │  Up to        As low as           │
│ └──────┘  [$##,###]    [#.##%] APR*        │
└─────────────────────────────────────────────┘

card: same bg/shadow/radius as large card
image: 72×52, radius 8
chevron: 24px, right
product name: Title 18 Extended Regular, single line, ellipsis
hero values: 100px columns, gap 4
```

### Hero / Featured Offer Card — `src/components/storefront/HeroCarousel.tsx`
**Two-pane card, 314px tall, 40/60 split** (left content / right image).

- Left (40%): bg `#FBFBFB`, `rounded-l-20`, `p-32`, column `gap-8`
  - Headline: Title 24 Extended Medium, `#262C30`
  - Body copy: Body 16 Regular, `#576975`
  - Storefront Card Hero Values Row (same component as cards): two `116px` columns
  - Primary button: `bg-#262C30`, `h-48`, full-width, `radius-button`, label `"REVIEW OFFER"` in GT America Extended Regular 16, white, `ss03`
  - `"Details & disclosures"` link below: Body 14 underline, centered, `#262C30`
- Right (60%): `rounded-r-20`, holds full-bleed image, `object-cover`
- Below the card (gap 24): carousel dots (`size-10`, active = filled `#262C30`, inactive = `border-2 #262C30`) flanked by `size-24` left/right chevron buttons

The greeting block (`Hi [name],` + subcopy) sits **above** the hero card inside the page header region, not inside the card. Page header has an absolute `bg-#262C30` tint at 25% opacity over its top 304px.

### Filter Bar — inline in `storefront/page.tsx` (or extract to `FilterBar.tsx`)
- Outer column `gap-8`
- Label row: text `"Filter Categories"` — Body 16 Regular, `#576975`
- Chip row(s): `flex flex-wrap items-center gap-16`
- Chip (inactive): `bg-#FBFBFB`, `border border-#677178`, `px-16 py-10`, `rounded-43`, text Body 16 Regular `#262C30`
- Chip (active): `bg-#262C30`, `text-white`, `px-16 py-10`, `rounded-43`, **no border**
- Categories: All | Auto Loans & Offers | Home Loans & Offers | Credit Cards | Savings & Deposits | Special Offers (extend per `useStorefront` sections)

### Home Banking Shell — `src/components/home-banking/`
Decorative outer chrome — not interactive. Renders sidebar nav (Home, Special Offers, Settings, Log Out), top bar (greeting, last login), and an account summary panel (Checking + Savings mock balances). Widget content sits inside as an inset panel.

---

## Page layout shell (Figma node `6118:207855`)

```
Outer frame  bg-#E7EAEC  w-1296  flex-col

├─ Placeholder Home Banking Header  shadow-header
│    ├─ Navbar  bg-#FBFBFB  border-b #E6EAEB  pl-24 pr-32 py-16
│    │    logo 186×60, "Welcome!", Messages, Self Services, Sign Off
│    └─ Menu   bg-#FBFBFB h-40 border-b
│         Helvetica Bold 16, inactive #576975, active #131515
│         Items: Overview / Accounts / Transfers / Pay Bills / Statements / Alerts / Just For You
│
├─ Storefront Header  h-504
│    abs tint bg-#262C30 opacity-25 h-304 top-0
│    inner wrapper px-48 top-36, gap-32 column
│    ├─ Greeting block ("Hi [Customer Name]," 36 + subcopy 18)
│    └─ Featured Offer Carousel (see hero spec)
│
└─ Body Container  pb-48 px-48  gap-32 column
     ├─ Filter Categories  gap-8 column
     ├─ Sections Container  gap-48 column  w-full
     │    └─ Product Section (×6)  gap-24 column
     │         ├─ Section Title  Title 32 Extended Regular  tracking -1  ss03
     │         └─ Section Card Container  w-1200  gap-16 column
     │              └─ Section Card Row  flex gap-16  (4 cards, flex-1)
     └─ Footer Copy  w-1200 h-180  Body 14 Regular #262C30
```

---

## Data model

State is managed by `StoreContext.tsx`. The shape includes:

```ts
{
  user: { name: string; greeting: string }
  appearance: { institution_name: string; logo_url: string | null; primary_color: string | null }
  flags: {
    show_hero_banner: boolean
    show_filter_bar: boolean
    show_credit_mountain: boolean
    enable_widget_view: boolean
    consumer_prequalification: boolean
  }
  sections: Array<{
    id: string
    name: string
    isCreditMountain?: boolean
    offers: Offer[]
  }>
}
```

`Offer` shape (current — extend as needed for Figma fidelity):

```ts
{
  id: string
  variant: 'preapproved' | 'apply-now' | 'special' | 'redeemed' | ...
  title: string                  // product display name
  description?: string
  attributes?: Array<{ label: string; value: string; subtext?: string }>
  imageUrl?: string
  ctaText?: string               // default "Learn More"
  ctaLink?: string
  isRedeemed?: boolean
}
```

---

## Image assets

Figma's dev-mode export references `http://localhost:3845/assets/...` URLs that **only resolve while Figma desktop is running** — they will 404 on Netlify. Either:
1. Re-export the relevant images from Figma into `public/assets/images/`, OR
2. Use Unsplash / placeholder URLs as a temporary fallback.

The repo already uses option 2 in several places.

---

## Admin panels

### `/admin/prototype-controls` — Internal use only
- Scenario loader buttons
- Feature flag toggles (`flags`)
- Reset to defaults
- "View Storefront" / "View Widget" links
- Label clearly: "PROTOTYPE CONTROLS — NOT FOR CLIENT DEMOS"

### `/admin/storefront-config` (a.k.a. product-config) — Storefront configuration
- Offer editor: create/edit/delete offers
- Section manager: reorder/rename
- Appearance: institution name, logo, colors

### `/admin/cu-admin` — Mocked CU admin
- Products, Campaigns, Notifications tabs
- Visual style matches the real CU admin

---

## Entry points

| Route | Purpose |
|---|---|
| `/` | Root landing |
| `/storefront` | Personalized SSO consumer storefront |
| `/stranger-storefront` | Guest mode (no preapproved offers) |
| `/home-banking` | Embedded widget view inside HB shell |
| `/admin/*` | Internal config + CU admin |

---

## Local dev

```bash
npm install
npm run dev          # next dev — http://localhost:3000
npm run build        # next build
npm run lint
```

---

## Working principles
1. **Figma is the source of truth** for visuals. When in doubt, pull `get_design_context` via the Figma MCP and match values verbatim.
2. **Use design tokens** for any value that exists in the token set. For one-off values that the design specifies but the token set doesn't cover, use Tailwind arbitrary values (`bg-[#262c30]`) — never round to "close enough."
3. **Don't drift the existing app logic** when porting visuals. The state, routing, prequal flow, and admin tooling already work — visual updates should leave behavior intact.
4. **GT America must be loaded** for true pixel match. Until then, accept the system-font fallback as a known delta.
