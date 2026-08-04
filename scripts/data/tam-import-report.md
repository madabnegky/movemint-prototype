# TAM_Master import report

Generated 2026-07-29T19:09:13.350Z

Source: `scripts/data/Pipeline_Reconciliation_and_Funnel7-28-26pm.xlsx` — sheet `TAM_Master`

## Join

Every join is an exact `Reg ID` → `fiId` lookup. No fuzzy name matching is performed.

| | count |
|---|---|
| Workbook rows | 1772 |
| After dedupe | 1574 |
| Joined to universe | 1521 |
| Sent to triage | 102 |
| Records written | 1431 |

## Stage distribution

| stage | count |
|---|---|
| (active pursuit) | 1232 |
| needs-contact | 124 |
| short-term-nurture | 69 |
| mql | 40 |
| qualified | 36 |
| proposal-sent | 7 |
| long-term-nurture | 5 |
| closed-won | 4 |
| closed-lost | 2 |
| verbal-commitment | 1 |
| discovery-complete | 1 |

## Needs Contact resolution

The workbook label is stale on about half its rows, so it is applied conditionally:
a row keeps `needs-contact` only when it has no email with a deliverable status.

- kept as `needs-contact`: **165**
- cleared to Active Pursuit (has usable contact): **153**

## Triage queue

| class | count |
|---|---|
| owner-conflict | 49 |
| no-reg-id | 46 |
| not-in-universe | 5 |
| wrong-registry | 2 |

### no-reg-id

- **Merrimack Valley Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **UK Federal Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Missouri Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **orsa credit union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Prosperity Bancshares, Inc.** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Manufacturers Bank** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Wings Financial Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Central Valley Community Bank** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **OCCU** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Stearns Bank** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **WECU®** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Santa Cruz County Bank** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **First Bank Financial Centre** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Wauchula State Bank** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Bank Of Putnam County** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **UVA Community Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Rrcu** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Firefly Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **sfcu - Sidney Federal Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **FIRST ST BK OF THE FL** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Premier Bank Rochester** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Taylor Bank** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Ukrainian Selfreliance Federal Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **First Bank Texas** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **BANK 34** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Xceed Financial Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **CCCU** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **South Carolina Community Bank** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **BANK OF SF** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Flagship Community Bank** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Sonora Bank** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Innovations FCU** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **BANK & TC** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **FIRST FSB** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **FSU Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Widget Federal Credit Union DBA Widget Financial** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Ohnward Bancshares, Inc.** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Ascu** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Peoples Trust** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **Signal Federal Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **The Kearny County Bank** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **FAST Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **Benchmark Federal Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **FIRST FSB OF KY** (Reg ID —, Bank) — No Reg ID — institution could not be identified
- **NFCU** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified
- **CBC Federal Credit Union** (Reg ID —, Credit Union) — No Reg ID — institution could not be identified

### not-in-universe

- **Community Credit Union of Lynn** (Reg ID 67558, Credit Union) — Reg ID 67558 is not in the current FDIC/NCUA universe (merged, closed, or bad ID)
- **Two Rivers Bank & Trust** (Reg ID 58013, Bank) — Reg ID 58013 is not in the current FDIC/NCUA universe (merged, closed, or bad ID)
- **Field & Main Bank** (Reg ID 13838, Bank) — Reg ID 13838 is not in the current FDIC/NCUA universe (merged, closed, or bad ID)
- **STATE STREET B&TC** (Reg ID 24938, Bank) — Reg ID 24938 is not in the current FDIC/NCUA universe (merged, closed, or bad ID)
- **Link Bank** (Reg ID 14863, Bank) — Reg ID 14863 is not in the current FDIC/NCUA universe (merged, closed, or bad ID)

### owner-conflict

- **University of Wisconsin Credit Union** (Reg ID 66492, Credit Union) — Duplicate rows assign different owners: Amaha Selassie vs Robbie Sink
- **Del-One Federal Credit Union** (Reg ID 13919, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Minnco Credit Union** (Reg ID 63639, Credit Union) — Duplicate rows assign different owners: Amaha Selassie vs Robbie Sink
- **Monterey Credit Union** (Reg ID 97071, Credit Union) — Duplicate rows assign different owners: Amaha Selassie vs Avery Flynn
- **City National Bank** (Reg ID 17281, Bank) — Duplicate rows assign different owners: Alex Cortada vs Craig Durkey
- **Central National Bank** (Reg ID 4702, Bank) — Duplicate rows assign different owners: Amaha Selassie vs Kevin Lutts
- **Knoxville TVA Employees Credit Union** (Reg ID 68085, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Tower Federal Credit Union** (Reg ID 8333, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **North Shore Bank** (Reg ID 26484, Bank) — Duplicate rows assign different owners: Alex Cortada vs Kevin Polinsky
- **Credit Union 1** (Reg ID 66157, Credit Union) — Duplicate rows assign different owners: Amaha Selassie vs Anna Kaminski
- **FedChoice Federal Credit Union** (Reg ID 150, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Lafayette Federal Credit Union** (Reg ID 619, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Alabama Credit Union** (Reg ID 60823, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Alabama One Credit Union** (Reg ID 68595, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Webster First Federal Credit Union** (Reg ID 24557, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Leaders Credit Union** (Reg ID 61185, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **LAFCU** (Reg ID 68632, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Vermont Federal Credit Union** (Reg ID 24405, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Peach State Federal Credit Union** (Reg ID 14676, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Greenville Federal Credit Union** (Reg ID 19116, Credit Union) — Duplicate rows assign different owners: Robbie Sink vs Amaha Selassie
- **BrightStar Credit Union** (Reg ID 67347, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Merck Sharp & Dohme Federal Credit Union** (Reg ID 6574, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Nutmeg State Financial Credit Union** (Reg ID 68657, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Liberty Bay Credit Union** (Reg ID 67541, Credit Union) — Duplicate rows assign different owners: Andrew Davis vs Amaha Selassie
- **Direct Federal Credit Union** (Reg ID 9071, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Reliant Community Federal Credit Union** (Reg ID 20258, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **CPM Federal Credit Union** (Reg ID 21971, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Dover Federal Credit Union** (Reg ID 12443, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Armco Credit Union** (Reg ID 65291, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **APL Federal Credit Union** (Reg ID 9475, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **APCI Federal Credit Union** (Reg ID 9607, Credit Union) — Duplicate rows assign different owners: Kevin Lutts vs Amaha Selassie
- **Northern Credit Union** (Reg ID 68696, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Members Heritage Credit Union** (Reg ID 68661, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Commercial Bank** (Reg ID 12246, Bank) — Duplicate rows assign different owners: Kevin Lutts vs Amaha Selassie
- **Pittsford Federal Credit Union** (Reg ID 19085, Credit Union) — Duplicate rows assign different owners: Tony Salamone vs Amaha Selassie
- **Advantage Federal Credit Union** (Reg ID 24181, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Millbury Federal Credit Union** (Reg ID 24543, Credit Union) — Duplicate rows assign different owners: Kevin Lutts vs Amaha Selassie
- **IAA Credit Union** (Reg ID 68423, Credit Union) — Duplicate rows assign different owners: Amaha Selassie vs Tony Salamone
- **Acadia Federal Credit Union** (Reg ID 15619, Credit Union) — Duplicate rows assign different owners: Kevin Lutts vs Amaha Selassie
- **Signature Federal Credit Union** (Reg ID 20061, Credit Union) — Duplicate rows assign different owners: Amaha Selassie vs Robbie Sink
- **Park View Federal Credit Union** (Reg ID 19541, Credit Union) — Duplicate rows assign different owners: Tony Salamone vs Amaha Selassie
- **Platinum Federal Credit Union** (Reg ID 24631, Credit Union) — Duplicate rows assign different owners: Kevin Lutts vs Amaha Selassie
- **Piedmont Advantage Credit Union** (Reg ID 60160, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Mass Bay Credit Union** (Reg ID 68137, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Orlando Credit Union** (Reg ID 68706, Credit Union) — Duplicate rows assign different owners: Andrew Davis vs Amaha Selassie
- **Minnesota Valley Federal Credit Union** (Reg ID 19440, Credit Union) — Duplicate rows assign different owners: Kevin Polinsky vs Amaha Selassie
- **Intrepid Credit Union** (Reg ID 68495, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **Rockland Federal Credit Union** (Reg ID 24224, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie
- **IDB Global Federal Credit Union** (Reg ID 14176, Credit Union) — Duplicate rows assign different owners: Christopher Tanner vs Amaha Selassie

### wrong-registry

- **St. Mary's Bank** (Reg ID 63829, Bank) — FI Type is "Bank" but Reg ID 63829 resolves in the other registry (cu-63829)
- **Maine Savings** (Reg ID 14565, Bank) — FI Type is "Bank" but Reg ID 14565 resolves in the other registry (cu-14565)

## Collapsed duplicate stages

- UNIVERSITY OF ILLINOIS COMMUNITY (cu-60583): had "mql", row says "short-term-nurture" → kept "short-term-nurture"
