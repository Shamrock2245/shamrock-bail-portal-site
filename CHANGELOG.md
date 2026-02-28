# CHANGELOG.md

## Overview
This changelog tracks major changes to the Shamrock Bail Bonds Portal.  
Format: **[Date] — [Version] — [Category] — [Change]**

---

### 2025-10-01 — v0.1.0 (MVP Draft)
- **Added**: API_SPEC.md, SCHEMAS.md, PDF_TEMPLATES.md, MANUS.md.
- **Added**: Staff + Defendant + Indemnitor flows (FLOW.md).
- **Added**: Security policies (SECURITY.md).
- **Added**: TASKS.md and AGENTS.md.
- **Added**: OPS.md, DEPLOYMENT.md.
- **Added**: STYLEGUIDE.md, ROADMAP.md, CONTRIBUTING.md.
- **Added**: TESTING.md, ROADRULES.md.
- **Added**: METRICS.md and CHANGELOG.md.

---

### 2026-02-28 — v2.2.0 — Telegram Mini App Intake Hardening

**Fixed:**
- `shared/brand.js` — Changed global Telegram SDK declarations from `const` to `var` to fix `SyntaxError` when loaded alongside `app.js`.
- `intake/app.js` — Complete rewrite: removed duplicate Telegram SDK declarations, wired all `brand.js` shared utilities.
- `intake/index.html` — Removed duplicate `theme.css` include, ensured correct script load order.
- `Telegram_IntakeQueue.js` — Consent field mapping: `consent` → `consentGiven` + `consentTimestamp`.

**Added:**
- `intake/app.js` — `captureLocationTiered()` (4-tier GPS cascade), `gasPost()` (real response handling), session persistence (`saveFormSession`/`loadFormSession`), `skipIdUpload()`, `useManualLocation()`.
- `Telegram_IntakeQueue.js` — 7 new columns in `TelegramIntakeData` sheet: `DefCharges`, `DefBondAmount`, `GPSLatitude`, `GPSLongitude`, `ManualLocation`, `ConsentGiven`, `ConsentTimestamp`.
- `Telegram_IntakeQueue.js` — Wix CMS sync now includes charges and bond amount.
- `_mapCanonicalToDashboardFormat()` — Added `defendantCharges` and `defendantBondAmount` for Dashboard hydration.

**Cleaned:**
- Deleted 17 stale GAS deployments (was at 20/20 limit, now 4/20).

---

### Template for Future Entries
`YYYY-MM-DD — vX.Y.Z`
- **Added**: new feature
- **Changed**: updated behavior
- **Fixed**: bug or issue
- **Removed**: deprecated feature

---

### 2026-02-27 — v2.1.0 — Automation Factory Gap-Fill

**Fixed:**
- `accessCodes.jsw` — Syntax bug in `generateRandomCode()`: `});` inside `for` loop body replaced with `}`. Would have crashed every access code generation call.

**Added:**
- `backend/intakeQueue.jsw` — Full IntakeQueue CMS bridge: `getPendingIntakes`, `searchIntakes`, `matchIntakeToCase`, `rejectIntake`, `buildIndemnitorPayload`, `submitIntake`. Closes Automation DoD item #2 (IntakeQueue → Indemnitor fields auto-fill).
- `backend/pendingDocuments.jsw` — Full PendingDocuments CMS module: create, read, mark-viewed, mark-signed, mark-expired, record ID upload, cleanup. Closes Automation DoD items #4, #5, #6.
- `backend/http-functions.js` — Wix HTTP Functions: `POST /signNowWebhook` (verified with `SIGNNOW_WEBHOOK_SECRET`), `POST /createPendingDoc` (verified with `GAS_API_KEY`), `POST /submitIntake` (public, honeypot-protected), `GET /healthCheck`. Closes SignNow webhook loop.
- `pages/members/DefendantDashboard.js` — Defendant member page: pending docs, embedded signing, post-sign ID upload, check-in.
- `pages/members/IndemnitorDashboard.js` — Indemnitor member page: pending docs, embedded signing, defendant info, ID upload.
- `pages/members/StaffDashboard.js` — Staff member page: intake queue (search, match, reject, payload view), cases (filter, doc progress), magic link generator, GAS dashboard link.

**Changed:**
- `pages/PortalLanding.js` — Added URL-param magic link auto-login (`?code=XYZ`), `?reason=` banner system, improved role check with graceful fallback, inline error/reason banners.

**Wix Secrets Required:**
- `SIGNNOW_WEBHOOK_SECRET` — Set in Wix Dashboard → Settings → Secrets Manager
- `GAS_API_KEY` — Set in Wix Dashboard → Settings → Secrets Manager

**CMS Collections Required:** `IntakeQueue`, `PendingDocuments`, `Cases`, `MemberDocuments`

**New Member Pages Required:** `/members/defendant-dashboard`, `/members/indemnitor-dashboard`, `/members/staff-dashboard`
