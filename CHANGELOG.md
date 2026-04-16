# CHANGELOG.md

## Overview
This changelog tracks major changes to the Shamrock Bail Bonds Portal.  
Format: **[Date] — [Version] — [Category] — [Change]**

---

### 2026-04-16 — v2.5.0 — Site Health & Documentation Refresh

**Fixed:**
- `src/pages/masterPage.js` — Added `setupFooterDynamic()` to `initCriticalUI()`. Dynamically sets copyright year via `new Date().getFullYear()` and overrides broken footer links at runtime.
- `src/public/siteFooter.js` — Corrected footer link paths: Counties → `/#counties`, Directory → `/#counties`, Become a Bondsman → `/how-to-become-a-bondsman`. Removed incorrect `-county` suffix from popular county slugs.
- `src/pages/Testimonials (List).bv3hz.js` — Schema fallback date changed from hardcoded `2025-01-01` to dynamic `${new Date().getFullYear()}-01-01`.

**Changed:**
- All 14 root documentation files updated to current project state (April 16, 2026).
- Node-RED stats corrected across all docs: 21 flow tabs, 836 nodes, 64 crons, 10 dashboard pages.
- `USER.md` priorities updated: MongoDB, CommPrefs, Hetzner runners marked as completed; Review Harvester and The Closer wiring added as immediate priorities.
- `ONBOARDING.md` fixed: replaced references to archived `LOGBOOK.md` and `STANDARD_OPERATING_PROCEDURES.md` with current workflows.
- `TOOLS.md` expanded: added SSH/Wix MCP servers, reorganized skills into categories, removed stale Mem0 reference.
- `COUNTY_STATUS.md` enriched: added cron schedules, accurate stacks from scraper repo, expanded Wave 1 SmartCOP details.
- `TASKS.md` — Added Phase 7.7 (Site Health & SEO Maintenance) as completed.

---

### 2026-04-07 — v2.4.0 — Wix Deploy Pipeline Repair (Crypto ESM + Auth)

**Fixed:**
- `src/backend/http-functions.js`, `auth-utils.jsw`, `auth-utils.js`, `portal-auth.jsw`, `signnow-webhooks.jsw` — Replaced all default `import crypto from 'crypto'` with named imports (`import { createHmac, createHash } from 'crypto'`). Wix Velo's ESM environment forbids CommonJS default imports of Node.js built-ins.
- Stripped all `crypto.` prefixes from call sites (e.g., `crypto.createHmac(...)` → `createHmac(...)`), including multiline chained patterns.
- Resolved naming conflict in `auth-utils.jsw` where local exported `createHash` collided with the import — aliased as `_cryptoCreateHash`.
- `GitHub Secrets / WIX_CLI_API_KEY` — Expired key regenerated from `manage.wix.com/account/api-keys`.

**Result:**
- GitHub Actions Run #25 — ✅ Succeeded (32 seconds)
- Auto-deploy on every push to `main` is fully operational

---

### 2026-04-02 — v2.3.0 — Site-Wide SEO Hardening & Documentation Cleanup

**Added:**
- Unified `Organization`, `LocalBusiness`, `BreadcrumbList`, and `SpeakableSpecification` schema markup on all 9 public pages.
- `FAQPage` schema on Homepage (5 Q&As), About (4 Q&As), and Contact (4 Q&As) pages — 13 total FAQ pairs targeting AI search queries.
- Canonical URLs, Open Graph, and Twitter Card meta tags standardized across all pages.

**Fixed:**
- Standardized phone number format (`+1-239-332-2245`) across all schema markup.
- Added missing Telegram `sameAs` links to Blog, Post, and Testimonials page schemas.
- Corrected placeholder phone number `(239) 555-BAIL` → `(239) 332-2245` in Contact page error handler.

**Changed:**
- Reorganized `.gitignore` — added `*.csv` and `**/service_account*.json` patterns, grouped by category.
- Moved 6 stale root docs to `docs/archive/2026-04/`.
- Moved 11 root Python scripts to `scripts/data-tools/`.
- Moved 12 root JS/MJS test scripts to `scripts/testing/` and `scripts/utilities/`.
- Moved 6 root shell scripts to `scripts/utilities/`.
- Moved 15 root CSV/JSON data files to `data_imports/`.

---

### 2026-03-08 — v2.2.1 — Phase 5: Automated Reporting & Agency Management

**Added:**
- `backend-gas/BondReportingEngine.js` — Automated weekly liability tracking, Agent Commissions (1099), and Void/Discharge Reconciliation.
- `backend-gas/CourtReminderSystem.js` — Automated SMS/WhatsApp court reminders (7, 3, 1 day prior).
- `backend-gas/ClientCheckInSystem.js` — Weekly SMS check-ins for active clients.
- `backend-gas/PaymentPlanReconciliation.js` — SwipeSimple integration for delinquent payment plans (>30 days).

---

### 2026-02-28 — v2.2.0 — Telegram Mini App Intake Hardening

**Fixed:**
- `shared/brand.js` — Changed global Telegram SDK declarations from `const` to `var` to fix `SyntaxError`.
- `intake/app.js` — Complete rewrite: removed duplicate Telegram SDK declarations, wired all `brand.js` shared utilities.
- `intake/index.html` — Removed duplicate `theme.css` include, ensured correct script load order.
- `Telegram_IntakeQueue.js` — Consent field mapping: `consent` → `consentGiven` + `consentTimestamp`.

**Added:**
- `intake/app.js` — `captureLocationTiered()` (4-tier GPS cascade), `gasPost()` (real response handling), session persistence.
- `Telegram_IntakeQueue.js` — 7 new columns in `TelegramIntakeData` sheet.

**Cleaned:**
- Deleted 17 stale GAS deployments (was at 20/20 limit, now 4/20).

---

### 2026-02-27 — v2.1.0 — Automation Factory Gap-Fill

**Fixed:**
- `accessCodes.jsw` — Syntax bug in `generateRandomCode()`: `});` inside `for` loop body.

**Added:**
- `backend/intakeQueue.jsw` — Full IntakeQueue CMS bridge.
- `backend/pendingDocuments.jsw` — Full PendingDocuments CMS module.
- `backend/http-functions.js` — Wix HTTP Functions: `POST /signNowWebhook`, `POST /createPendingDoc`, `POST /submitIntake`, `GET /healthCheck`.
- Member dashboard pages: Defendant, Indemnitor, Staff.

---

### 2025-10-01 — v0.1.0 (MVP Draft)
- **Added**: Initial documentation scaffold: API_SPEC.md, SCHEMAS.md, PDF_TEMPLATES.md, FLOW.md, SECURITY.md, TASKS.md, AGENTS.md, OPS.md, DEPLOYMENT.md, STYLEGUIDE.md, ROADMAP.md, CONTRIBUTING.md, TESTING.md, METRICS.md.

---

### Template for Future Entries
`YYYY-MM-DD — vX.Y.Z`
- **Added**: new feature
- **Changed**: updated behavior
- **Fixed**: bug or issue
- **Removed**: deprecated feature
