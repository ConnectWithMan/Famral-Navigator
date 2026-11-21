# Famral Navigator

**Find Your College. Choose Your Future.**
*From your entrance-exam rank to your counselling preference list, make every admission decision with greater clarity.*

Famral Navigator (`navigator.famral.com`) is a college admission intelligence platform for Indian undergraduate aspirants. Release 1 covers **JEE Main → JoSAA & CSAB** (NITs, IIITs, GFTIs), built on a configurable multi-system architecture with pre-configured templates for **REAP, MHT CET, WBJEE, KCET, and CUET**.

---

## Key Capabilities

- **Configurable College Predictor (`/predictor`)**: Pure, unit-tested engine enforcing strict CRL vs Category Rank guards, config-driven quota matching (`HS`, `OS`, `AI`, `GO`, `JK`, `LA`), `Female-only` + `Gender-Neutral` seat pool rules, configurable near-closing margin, What-If explorer, shareable URLs, CSV export, and print view.
- **Cutoff Explorer (`/cutoffs`, `/cutoffs/:system/:year`, `/cutoffs/:college/:course`)**: Multi-year and multi-round opening/closing ranks with "My Rank" overlay, round-wise movement chart, plain-number YoY comparison, and CSV export.
- **Colleges & Branch-First Discovery (`/colleges`, `/colleges/:slug`, `/branches`)**: Searchable directory with honest `"Not available"` handling for unverified institutional fields, institute profiles, and branch-first comparisons across colleges.
- **Planning Tools (`/compare`, `/saved-colleges`, `/choice-builder`, `/shared/:token`)**: Side-by-side 2–4 college comparison with highlight-differences and personal comparison weights (explicitly labelled as a personal view, never an official ranking), multi-list Choice Builder with drag-and-drop + keyboard move up/down, Dream/Target/Safer tags, read-only Choice List Analyzer, Undo/Redo & version history, offline PWA caching, and revocable read-only share links.
- **Counselling Management (`/counselling`, `/counselling/:system`, `/guides`, `/glossary`)**: Follow systems, track dates and notices with outdated flags, export `.ics` calendars, interactive document readiness checklist, counselling journey tracker, process guides (Freeze/Float/Slide, reporting, withdrawal), and searchable admissions glossary.
- **Student Dashboard & Privacy Controls (`/dashboard`, `/privacy`)**: Profile & rank setup, saved colleges/predictions/comparisons/choice lists, in-app notifications, one-click full JSON data export, and account deletion.
- **Role-Gated Admin Console (`/admin`)**: Multi-step versioned CSV import pipeline (download template, validate, row-level error report, preview, commit with archival of superseded published records, rollback batch), college/cutoff/schedule/notice CRUD & verification queue, student error report inbox, audit logs, and privacy-conscious aggregate metrics.
- **Bilingual UI & PWA**: English and Hindi (`हिन्दी`) switcher, installable Progressive Web App with offline access to saved choice lists, dynamic `/sitemap.xml` and `/robots.txt`.

---

## Data Transparency Rules

1. **Zero fabricated official claims**: Every seeded record carries `isDemo: true` and is visibly labelled **"Demo data — not an official cutoff"** across cards, tables, charts, exports, and printouts.
2. **Historical comparison only**: Predictor results use *Within / Near / Beyond historical closing rank* language and never imply guaranteed admission or probability.
3. **Versioned historical data**: Admin CSV imports archive superseded published cutoffs rather than overwriting them, and every import batch supports one-click rollback.

---

## Local Development, Testing & Build

```bash
# Install dependencies
npm install

# Run automated unit & security-rule tests (Vitest)
npm test

# TypeScript type-check
npm run lint

# Start Express + Vite dev server on port 3000
npm run dev

# Build production bundle
npm run build

# Start production server on port 3000
npm start
```

---

## Accounts & Roles

- **Students**: Sign in with Google (or Email/Password once enabled in Firebase Console) at `/login` or `/signup`.
- **Admin Role**: Protected on both client and Firestore Security Rules (`firestore.rules`). The bootstrapped administrator account is configured for the project owner (`connectwithman@gmail.com`, verified email) and additional admins can be added via documents in the `admins/{uid}` Firestore collection.
- **Seeding Cloud Catalog**: Sign in as Admin → open `/admin` → click **"Seed Demo Catalog to Firestore"** to write the initial demo catalog to Firestore, or upload official datasets via the **CSV Import Pipeline** using `/public/templates/josaa-cutoffs-template.csv`.

---

## Items Requiring External Setup or Official Datasets

- **Official Cutoff Datasets**: Replace/supplement seeded demo records by importing verified official JoSAA/CSAB opening–closing rank CSVs in `/admin` → **CSV Import Pipeline** with `is_demo=false` and official source attribution.
- **Email/Password Sign-In**: Google Sign-In works immediately. To enable Email/Password registration and password reset, toggle the **Email/Password** provider on in Firebase Console → Authentication → Sign-in method.
- **External Email/SMS Reminders**: In-app notifications and `.ics` calendar exports work out of the box. External email/SMS delivery requires configuring an external provider (e.g., SMTP / SendGrid) in a backend worker and is intentionally not mocked.
- **Official Portal Live Integration**: Famral Navigator does not claim live government portal integration; students always fill and lock final choices on `josaa.nic.in` / `csab.nic.in`.
