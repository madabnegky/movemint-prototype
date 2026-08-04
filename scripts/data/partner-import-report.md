# Partner Pipeline — Import Report

- Source workbook: `/Users/kylechristian/Downloads/Movemint_Partner_Pipeline8-2-26update.xlsx` (not committed)
- Sheet: **Partner Pipeline**, headers on row 3
- Generated: 2026-08-04T14:39:21.398Z

## Totals

- **33** partners imported
- 0 rows skipped (no company name)
- 4 merged banner rows skipped: `SIGNED` (row 4), `In Discussion` (row 12), `NOT CONTACTED` (row 23), `Not a fit` (row 38)
- Estimated FI reach across quantified partners: **17,383** from 27/33 partners (6 unquantified)

## Stage distribution

| Stage | Count |
| --- | --- |
| not-contacted | 14 |
| signed | 7 |
| active | 5 |
| contacted | 4 |
| dormant | 3 |

## Category distribution

| Category | Count |
| --- | --- |
| fintech | 16 |
| cuso | 8 |
| core-processor | 7 |
| consulting | 3 |
| trade-association | 2 |
| other | 1 |
| managed-services | 1 |

## Banner / cell stage conflicts

The workbook's merged group banners disagree with these rows' own stage
cells. **The cell was used** — it reflects more recent editing than the
visual grouping. Confirm each of these is correct:

| Row | Partner | Banner group | Stage cell | Imported as |
| --- | --- | --- | --- | --- |
| 16 | Posh.ai | In Discussion | Dormant | **dormant** |
| 19 | Banno (Jack Henry) | In Discussion | Contacted | **contacted** |
| 20 | Mahalo Banking | In Discussion | Contacted | **contacted** |
| 21 | Velera | In Discussion | Dormant | **dormant** |
| 22 | SwitchThink | In Discussion | Dormant | **dormant** |
| 39 | CU*Answers | Not a fit | Contacted | **contacted** |
| 40 | Corelation League | Not a fit | Contacted | **contacted** |

## Unrecognized stage values (NOT imported)

_None — every stage value normalized cleanly._

## Slug collisions

_None._

## Sparse rows needing human follow-up

- Row 14: **Cornerstone Advisors** — missing company type and/or FI count + focus
- Row 34: **SRM** — missing company type and/or FI count + focus
- Row 35: **Engage FI** — missing company type and/or FI count + focus

## FI reach parsing

Every row's raw string and how it was interpreted. `value: null` means the
partner contributes nothing to reach rollups.

| Partner | Raw | Parsed value | Qualifier |
| --- | --- | --- | --- |
| Vericast | `45` | 45 | exact |
| TruStage | `~4,000` | 4,000 | approx |
| Tyfone | `~50+` | 50 | min |
| AiVantage | `~5–10` | 8 | range |
| IgniteFI | `N/A` | — | na |
| Nuuvia | `~50` | 50 | approx |
| Payfinia | `30` | 30 | exact |
| Navanta | `700+` | 700 | min |
| Cornerstone Advisors | `(blank)` | — | na |
| Synergent | `200+` | 200 | min |
| Posh.ai | `125+` | 125 | min |
| Aviary.ai | `~15–20` | 18 | range |
| Vertice.ai | `50` | 50 | exact |
| Banno (Jack Henry) | `300+` | 300 | min |
| Mahalo Banking | `~50` | 50 | approx |
| Velera | `4,000+` | 4,000 | min |
| SwitchThink | `~175` | 175 | approx |
| MI League (MCUL) | `172` | 172 | exact |
| COCC | `~175` | 175 | approx |
| Cora (fka Finastra) | `Hundreds` | — | unknown |
| Glia | `500+` | 500 | min |
| Eltropy | `750` | 750 | exact |
| Candescent | `1,300` | 1,300 | exact |
| DCI (Data Center Inc.) | `~150–200` | 175 | range |
| Baker Hill | `500` | 500 | exact |
| Interface.ai | `~100` | 100 | approx |
| Corelation | `300+` | 300 | min |
| SRM | `(blank)` | — | na |
| Engage FI | `(blank)` | — | na |
| AccessSoftek | `400+` | 400 | min |
| CSI (Computer Services Inc.) | `3,000+` | 3,000 | min |
| CU*Answers | `210+` | 210 | min |
| Corelation League | `(blank)` | — | na |
