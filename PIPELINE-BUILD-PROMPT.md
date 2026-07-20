# One-Shot Build Prompt — Movemint Sales Pipeline Tool

Copy everything below the line into a fresh Claude Code session run from the
`product-config-prototype/` directory.

---

Read `CLAUDE.md` and `PIPELINE-BUILD-PROMPT.md` in full before doing anything else. Then build the complete Sales Pipeline tool described below in one pass — do not ask for confirmation between steps.

## What you are building

A sales pipeline management tool for Movemint's sales and marketing teams, living inside the existing admin app at `/admin/pipeline`. It tracks every US bank and credit union from "exists" down to "closed won," lets the team move institutions between pipeline stages, and assign owners. It replaces a HubSpot-export spreadsheet workflow.

This is a real internal tool, not a demo: pipeline changes must persist and be shared across the whole team.

## Existing codebase — respect these conventions

- Next.js 16 App Router + React 19 + TypeScript, Tailwind CSS v4 (`@theme` in `src/app/globals.css`), `lucide-react` icons, `cn()` helper at `src/lib/utils.ts`. Deployed on Netlify via `@netlify/plugin-nextjs`.
- The admin shell is `src/app/admin/layout.tsx` — a dark slate sidebar (`NAV_ITEMS` array). Add a top-level nav item **"Sales Pipeline"** (`/admin/pipeline`, icon: `Filter` or `TrendingUp`) directly under "Dashboard". Match the existing admin visual language (slate-900 sidebar, white content cards, existing spacing) — do NOT invent a new design system. A reference HTML dashboard exists but visual fidelity to it is NOT required; only its information architecture matters (described below).
- `src/proxy.ts` is an HTTP Basic Auth gate (Next 16 middleware) currently protecting `/admin/pricing-model` with username `movemint` + `ADMIN_PASSWORD` env var, skipped in dev. **Extend its `matcher` to also cover `/admin/pipeline/:path*` and `/api/pipeline/:path*`.** Do not change its behavior otherwise.
- `scripts/fetch-ncua.mjs` already fetches NCUA data; `src/data/ncua-cus.json` and `src/data/fdic-banks.json` exist but are inadequate for this feature (no city field, wrong asset floors). Build new datasets as described below; leave the existing two files untouched (other features use them).

## Part 1 — Canonical FI universe data

Write two fetch scripts (`scripts/fetch-universe-banks.mjs`, `scripts/fetch-universe-cus.mjs`, plain Node, run manually via `node`) that produce `src/data/universe-banks.json` and `src/data/universe-cus.json`. Run them as part of this build so real data is committed.

- **Banks**: FDIC institutions API (`https://banks.data.fdic.gov/api/institutions`). Fetch ALL active institutions — no asset floor. Fields needed: CERT, NAME, CITY, STALP (state), ASSET (thousands of USD — normalize to dollars). Paginate; the API caps page size (use `limit=10000` with `offset`, filter `ACTIVE:1`).
- **Credit unions**: NCUA. Reuse/adapt the approach in `scripts/fetch-ncua.mjs`, but include **city** and fetch ALL active CUs with no asset floor. NCUA quarterly call report data (`foicu.txt` in the call report zip) contains charter number (`CU_NUMBER`), name, city, state; assets come from the FS220 record (`ACCT_010`). If the existing script uses a different NCUA source that lacks city, switch to the call report zip download (https://ncua.gov/analysis/credit-union-corporate-call-report-data — quarterly zips, e.g. `call-report-data-2026-03.zip`).
- Output records, slim and uniform:
  ```ts
  interface FI {
    id: string        // "bank-<CERT>" or "cu-<CHARTER>" — the canonical dedup key
    type: 'bank' | 'cu'
    name: string
    city: string
    state: string     // 2-letter
    assets: number    // dollars
  }
  ```
  Each file: `{ meta: { source, fetchedAt, count }, institutions: FI[] }`.
- Keep the files reasonably small (only the fields above). Expect roughly 4,000–4,500 of each.
- If a fetch fails at build time (network), fall back to generating from whatever data is reachable and say so clearly in your final report — but try hard to get real data.

**Funnel tiers derived from this data (computed, never stored):**
1. **Universe** — every FI in both files.
2. **Addressable by asset size** — `assets >= 250_000_000 && assets <= 50_000_000_000`.
3. **Addressable by asset size + platform fit** — tier 2 AND `platformFit === true` (see overlay below).

## Part 2 — Persistent pipeline state (Netlify Blobs)

Base FI data is static JSON. Everything the team edits lives in a single **overlay document** keyed by FI id, persisted server-side:

```ts
interface PipelineRecord {
  fiId: string
  stage: StageId | null          // null = not in any deal stage (Active Pursuit pool)
  owner: string | null
  platformFit?: boolean          // manual override of the seeded flag
  leadSource?: string            // from MQL import: "AiVantage", "Events", …
  notes?: string
  arr?: number                   // optional per-deal ARR override, dollars
  updatedAt: string
}
interface PipelineState {
  records: Record<string, PipelineRecord>
  settings: {
    owners: string[]             // seeded: Robbie Sink, Avery Flynn, Elise Cushing, Amaha Selassie, BDR (Insource)
    salesGoal: number            // seeded: 21 (2026 closed-won goal)
    defaultDealArr: number       // seeded: 75000 — used for weighted pipeline when arr unset
    stageProbabilities: Record<StageId, number>
  }
  updatedAt: string
}
```

- Use `@netlify/blobs` (`getStore('sales-pipeline')`, key `state`) from Next.js route handlers under `src/app/api/pipeline/route.ts` (GET full state, PUT full state) plus a PATCH endpoint for single-record updates (move stage / assign owner / edit fields) so two users editing different FIs don't clobber each other. PATCH reads current blob, applies the change, writes back.
- **Local dev fallback**: when Blobs isn't available (plain `npm run dev` without Netlify context), read/write a gitignored `./.pipeline-dev-store.json` instead. Detect via try/catch or `process.env.NETLIFY`. Add the file to `.gitignore`.
- Seed behavior: on first GET with no blob present, return the seed state generated in Part 3 (commit it as `src/data/pipeline-seed.json`).
- Client: a `PipelineContext` provider that loads state once, applies optimistic updates on edit, and syncs via the PATCH endpoint. Show a small saving/saved indicator.

## Part 3 — Stages

```ts
type StageId =
  // main funnel (ordered)
  | 'mql' | 'sql' | 'warm-lead' | 'qualified'
  | 'discovery-scheduled' | 'discovery-complete' | 'demo-completed'
  | 'proposal-sent' | 'verbal-commitment' | 'closed-won' | 'closed-lost'
  // branch states (side panel, still movable targets)
  | 'short-term-nurture' | 'long-term-nurture'
  | 'disqualified' | 'bad-contact-info' | 'signed-with-competitor'
```

Display names: MQL = "Marketing Qualified", SQL = "Sales Qualified", others title-cased. Default stage probabilities (editable in settings): mql 0, sql 0.02, warm-lead 0.05, qualified 0.35, discovery-scheduled 0.40, discovery-complete 0.45, demo-completed 0.50, proposal-sent 0.70, verbal-commitment 0.90, closed-won 1.0, closed-lost 0, all branch states 0 (short-term-nurture 0.10 and long-term-nurture 0.05 for the marketing-attributed calc).

**Active Pursuit** is computed, not a stage: tier-3 FIs (asset + platform fit) with `stage === null`.

## Part 4 — Seed import from the workbook

The team's current state is in `scripts/data/kyle-workbook-sales-pipeline.xlsx` (already in the repo). Write `scripts/import-workbook.mjs` (add `xlsx` as a devDependency) that produces `src/data/pipeline-seed.json` + a human-readable match report `scripts/data/import-report.md`. Run it as part of this build.

Sheets:
- **"Addressable Banks"** (headers on row 4) and **"Addressable CUs"** (headers on row 1): columns include `Company name`, `City`, `Company owner`, `Asset Size`. Every FI matched from these sheets gets `platformFit: true` (these tabs represent asset-size fit AND integration fit as vetted by the team).
- **"MQL"** (headers on row 2): `Financial Institution`, `Lead Source`. Matched FIs get `stage: 'mql'` and `leadSource`.
- **"SQL"** (headers on row 2) and **"sales stage"** (headers on row 1): `Deal Name`, `Deal Stage`, `Deal owner`. Note the columns are ragged — some rows omit `Time in Current Stage`, so detect stage values by matching against the known stage vocabulary rather than trusting column position. Stage strings map to StageIds ("Closed WON" → closed-won, "Warm Leads" → warm-lead, "Disqualified or No Fit" → disqualified, etc.). Matched FIs get that stage and `owner` from `Deal owner`.

**Matching & dedup rules (critical — no duplicate records may exist):**
- Canonical identity is always an FI from the universe files; workbook rows never create new FIs.
- Normalize before matching: lowercase; strip punctuation; strip deal-name suffixes (`- New Deal`, `GAC 2026`, trailing parenthesized state like `(WA)` — but use that state as a match hint); expand/strip suffix variants (`federal credit union`/`fcu`/`credit union`/`cu`, `bank`, `n.a.`, `national association`).
- Match priority: (1) normalized name + city (Addressable sheets have city; MQL/SQL/stage sheets don't — for those use name + unique-within-universe, or name + state hint); (2) unique normalized-name match across the universe; (3) high-confidence fuzzy (e.g. token-set similarity ≥ 0.9, unique winner). Anything weaker goes to the report as UNMATCHED/AMBIGUOUS with the candidates listed — do NOT import those rows.
- If one FI appears in multiple sheets/rows, collapse to a single record: the furthest-along main-funnel stage wins; a branch state from the "sales stage" sheet beats MQL. Keep leadSource from MQL regardless. First non-empty owner wins (prefer `Deal owner` over `Company owner`; ignore "(Deactivated User)" owners).
- The report must list: total rows per sheet, matched count, collapsed-duplicate count, and every unmatched/ambiguous row.

Expected ballpark after import (validate, and flag in the report if wildly off): ~380 MQLs, ~8 SQLs, ~170 deals across stages (95 short-term nurture, 31 warm leads, 7 qualified, 7 discovery scheduled, 3 closed won, 3 closed lost, …), ~1,760 platform-fit FIs.

## Part 5 — UI

All pages live under `src/app/admin/pipeline/` and use the shared `PipelineContext`.

### `/admin/pipeline` — Dashboard
- **KPI row**: Universe count · Addressable by asset size (with CU/bank split) · Addressable + platform fit (split) · Active Pursuit · MQL count · Weighted pipeline $ (sum over FIs in main-funnel stages of `(arr ?? defaultDealArr) × probability`, excluding closed-lost; closed-won counts at face value).
- **Goal tracker bar**: closed-won count vs `salesGoal`, plus projected (= closed-won + weighted-pipeline ÷ defaultDealArr, rounded) and the gap. Similar spirit to the reference dashboard.
- **Funnel**: one row per tier/stage in order — Universe, Addressable (asset), Addressable (asset + platform fit), Active Pursuit, then every main-funnel stage. Each row: stage name, probability tag, horizontal bar segmented CU vs bank (use a log or sqrt scale so late stages stay visible), count, and $ (modeled `~$` for sizing tiers using defaultDealArr; real weighted $ for deal stages). **Every row is clickable → the stage list view.**
- **Branch panel** beside the funnel: Short/Long-Term Nurture with counts and marketing-attributed $ (count × defaultDealArr × probability), plus Disqualified / Bad Contact Info / Signed with Competitor counts. Rows clickable too.
- Dark-on-light styling consistent with the rest of `/admin` (the reference HTML is dark; do not copy that).

### `/admin/pipeline/stage/[stageId]` — Stage list view
One route handles every tier and stage (`universe`, `addressable-asset`, `addressable-fit`, `active-pursuit`, and every StageId):
- Table: name, type badge (CU/Bank), city, state, assets (formatted $B/$M), platform-fit indicator, lead source, stage, owner, updatedAt. Default sort: assets desc. Client-side search box (name/city), filters for type, state, owner. Paginate or virtualize — universe view is ~9,000 rows.
- **Move stage**: inline stage dropdown per row (grouped: main funnel / branch states / "Remove from pipeline" = stage null) + multi-select checkboxes with a bulk action bar (bulk move stage, bulk assign owner).
- **Assign owner**: inline dropdown from `settings.owners`.
- **Row click → detail drawer**: full FI info, editable platform fit toggle, owner, stage, ARR override, notes, lead source.
- Sizing tiers (universe/addressable) show the same table; moving an FI into a stage from there is allowed (that's how something enters the pipeline).

### `/admin/pipeline/settings`
Edit owners list (add/remove), sales goal, default deal ARR, stage probabilities. Plus a "Reset pipeline to seed" button (destructive — confirm dialog) and an "Export CSV" of all pipeline records.

## Part 6 — Wrap-up requirements

- TypeScript throughout, no `any`. All new types in `src/app/admin/pipeline/_lib/types.ts` (follow the pricing-model `_lib`/`_components` folder convention).
- `npm run build` must pass. Run it and fix all errors before finishing.
- Update `.gitignore` for the dev store file.
- Finish with a report: data counts fetched, import match stats, any unmatched rows needing human review, and anything you had to assume.

Environment note for the human deploying this: `ADMIN_PASSWORD` already exists in Netlify env (pricing model uses it); Netlify Blobs requires no extra config on this site.
