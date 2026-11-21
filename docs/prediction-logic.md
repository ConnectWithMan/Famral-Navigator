# Famral Navigator — Prediction Engine & Analytics Specification

## 1. Design Philosophy
Famral Navigator separates **counselling system rules** from **UI presentation** and **evaluation logic**.
All prediction rules live in `src/config/systems/registry.ts`, while the pure evaluation engine lives in `src/engine/predictor.ts` and derived analytics live in `src/engine/analytics.ts`.

- **No hardcoded JEE Main / JoSAA assumptions in UI code.** Adding a new system (e.g., REAP, MHT CET, WBJEE, KCET, CUET) requires only a `CounsellingSystemConfig` entry and dataset import.
- **Historical comparison only.** The engine never outputs admission probability or guarantees. Every matched seat is labelled strictly against historical closing rank bands.
- **Explicit failure over silent output.** Incomplete or invalid inputs return field-level validation errors (`FieldValidationError[]`), and empty datasets return a specific `emptyReason` (missing system data, year, round, category/rank type, or filter match).

## 2. Explicit Domain Matching Keys
Every published cutoff record is uniquely keyed by:
`(systemCode, academicYear, roundNumber, institutionId, programmeId, quota, seatCategory, seatPool, rankType)`

The composite key generator (`buildCutoffCompositeKey` in `src/engine/csvValidator.ts`) enforces uniqueness during CSV validation and Firestore persistence.

## 3. Strict Rank-Type Guard
A student's **Common Rank List (CRL)** rank is never compared against a **Category Rank** cutoff, and a **Category Rank** is never compared against a **CRL** cutoff.

Configured per system via `rankTypeByCategory`:
- **JoSAA (`josaa`)**:
  - `OPEN` → `CRL`
  - `OPEN (PwD)`, `EWS`, `EWS (PwD)`, `OBC-NCL`, `OBC-NCL (PwD)`, `SC`, `SC (PwD)`, `ST`, `ST (PwD)` → `CATEGORY_RANK`
- **CSAB Special Rounds (`csab`)**:
  - All categories (`OPEN`, `EWS`, `OBC-NCL`, `SC`, `ST`, and PwD variants) → `CRL`

If a student enters a reserved category in JoSAA without providing `categoryRank`, validation rejects the request with a clear field message rather than silently falling back to `crlRank`.

## 4. Config-Driven Quota Rules
Quota eligibility is evaluated per rule (`evaluateQuotaEligibility`):
- **`all_india` (`AI`)**: Eligible for candidates from any Indian state/UT (e.g., IIITs, applicable GFTIs).
- **`home_state` (`HS`)**: Eligible when normalized `homeState === cutoff.state`.
- **`other_state` (`OS`)**: Eligible when normalized `homeState !== cutoff.state`.
- **`specific_state` (`GO`, `JK`, `LA`)**: Eligible only when both `homeState` is in `eligibleHomeStates` and `cutoff.state` is in `eligibleInstituteStates` per official JoSAA rules.

## 5. Seat Pool Eligibility
- **`Gender-Neutral` candidate**: Matches only `Gender-Neutral` seats.
- **`Female-only` candidate**: Eligible for both `Female-only` (including supernumerary) and `Gender-Neutral` seats.

## 6. Classification Bands (Configurable Margin)
Given `evaluatedRank`, `closingRank`, and configurable `nearMarginPercent` (default `10%`, bounded by `system.maxNearMarginPercent = 25%`):
- `nearUpperBound = Math.ceil(closingRank * (1 + nearMarginPercent / 100))`
- **Within historical closing rank** (`within`): `evaluatedRank <= closingRank`
- **Near historical closing rank** (`near`): `closingRank < evaluatedRank <= nearUpperBound`
- **Beyond historical closing rank** (`beyond`): `evaluatedRank > nearUpperBound`

Matches are ordered deterministically: `within` → `near` → `beyond`, then ascending by `closingRank`.

## 7. Derived Analytics (Strictly From Stored Cutoffs)
- **Round-Wise Movement** (`computeRoundWiseMovement`): Filters published cutoffs for a fixed `(system, year, institute, programme, quota, category, seatPool, rankType)` tuple and sorts ascending by `roundNumber`.
- **Year-over-Year Change** (`computeYoYChange`): Computes plain numeric difference (`closingRank - prevClosingRank`) and plain percentage change (`((diff / prevClosingRank) * 100).toFixed(1)`) across years for the same round and seat keys. No synthetic volatility score.
- **What-If Explorer** (`computeWhatIfScenarios`): Re-runs `runPrediction` across rank shifts (`-15%`, `-5%`, `0%`, `+5%`, `+15%`) without modifying the student's saved profile.
- **Choice List Analyzer** (`analyzeChoiceList`): Read-only inspection counting Dream/Target/Safer/Unassigned choices, flagging duplicate `(institution, programme, quota, seatPool)` entries, choices beyond historical closing rank, missing safer options, and rows without historical data. Never auto-sorts or alters student choice order.
- **Personal Comparison Weights** (`computePersonalComparisonTable`): Transparent per-factor comparison derived strictly from stored fields and student-selected weights; labelled in the UI as a personal view rather than an official ranking.
