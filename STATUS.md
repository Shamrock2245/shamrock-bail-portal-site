# Portal Site — True Status

> **Last verified:** 2026-11-23  
> **Repo:** `Shamrock2245/shamrock-bail-portal-site` · branch `main`  
> **Product URL:** `https://shamrockbailbonds.biz` (Live public site on Wix Studio, `uiVersion` 673 — auto-published from `main` via `.github/workflows/wix-deploy.yml`)  
> **Role:** Brand clipboard + GAS factory — **Shamrock’s Platform** factory layer  
> **Platform prod checklist:** `shamrock-leads/docs/ECOSYSTEM_PROD_CHECKLIST.md`

---

## 1. What this repo is

| Layer | Tech | Role |
|---|---|---|
| **Frontend (Public / Studio Live)** | Wix Studio / Velo (`src/`) | ✅ **Live on Wix Studio** (`shamrockbailbonds.biz`, site `a00e3857-675a-493b-91d8-a1dbc5e7c499`, `uiVersion` 673). |
| **Backend Clipboard Services** | Wix Velo Backend (`src/backend/*.jsw`) | ✅ **Live on Wix Studio** — ID OCR, verbatim case hydrator, drafts, canonical sync, signing launchpad, ServiceAreas, session-bound portal reads, BlueBubbles/SMS controls. Default surety is OSI. |
| **Backend Factory** | Google Apps Script (`backend-gas/`, 190+ files) | ✅ **Live @515** on stable `/exec` deployment — webhook processing, TheCloser dry-run & portal resume URLs, review candidate opt-out/FTA/dedup guards, school unlocks, 0 duplicate global symbols. |
| **Related** | Netlify embeds & Mini-Apps | Netlify paperwork launchpad, Telegram WebApps, Bail School embed, Communication Preferences embed. |

**Not** the student LMS (that is `shamrock-bail-school`).  
**Not** the arrest Super CRM & multi-state brain (that is `shamrock-leads`).

---

## 2. Code on `main` (Implemented & Current)

| Area | Status |
|---|---|
| **Wix Studio Cutover & Public SEO/CRO** | ✅ **Live on `main` (PRs #111–#123)** — Studio `uiVersion` 673 live; 67-county + city + jail pages, quick facts SSR fix (`#text67`), county SMS button binding (`#smsBondsmanBtn`), WCAG AA button contrast & mobile dark-canvas sweep, dynamic county sitemap & `robots.txt` AI/LLM indexing, Service/FAQ JSON-LD, verbatim charge hydrator. |
| **Bond Portal, Telegram, Shannon, DocuSeal** | ✅ **Code-enforced:** DocuSeal is sole active signing provider; staff-gated issuance in Super CRM; Wix acts strictly as non-issuing clipboard launchpad. Role-scoped session binding (`portalSessionGuards.js`), cosigner self-invite, live case status & Pay now, and Communication Preferences overlap/save-serialization hardening (PR #119). |
| **Legacy SignNow Execution** | ✅ **Retired (Live @508+)** — Direct routes, factory senders, MCP packet helpers, and Wix portal send wrappers fail closed. Historical fields remain read-only. |
| **Surety Realignment** | ✅ Active paperwork requires explicit `surety_id`. Only OSI and Palmetto are active sureties (OSI default). Accredited and Bankers removed from active lists; Lexington National, Roche, Universal, Bankers remain inactive/future options. |
| **Bail School Education Management** | ✅ GAS unlock poller, SwipeSimple integration ($199 20hr / $649 120hr / $49 simulator), live catalog aligned. |
| **Security & Secrets Scrub** | ✅ Hardcoded secrets scrubbed; HMAC webhook signatures fail closed; GAS risk/Mini App/`caller_context` endpoints require `GAS_API_KEY`; BlueBubbles/SMS web methods owner-only. |
| **MongoDB Atlas Event Logging** | ✅ `MongoLogger.gs` + `mongo_writer.py` logging business events to Atlas. |
| **GAS Closer & Review Hardening** | ✅ **Live @515 (2026-11-22):** `TheCloser.js` dry-run mode + `/portal-landing` resume links; `NodeRedHandlers.js` review candidate DNC/FTA/dedup guards & limit clamping; VM behavioral test suite in CI. |

---

## 2a. Website Applications → CRM Intake & Held Work

| Area | Status |
|---|---|
| **Website applications → CRM** | ✅ **Merged on `main` (PR #24)** — Wizards submit via `backend/leadsIntake.jsw` → CRM `/api/webhooks/wix-intake` (Mongo `intake_queue` first), success only on `success:true`, Pay-by-card on success. See `docs/WIX-TO-CRM-INTAKE.md`. |
| **Sheets Intake Ledger** | ✅ **Merged on `main`** — `backend-gas/IntakeLedger.js` (`appendIntakeLedger`), called by the CRM fan-out after Mongo save. |
| **Staff Portal / Lobby Tablet** | ✅ **Retired in code** — Redirects to CRM / fails closed. Wix visual removals: `docs/STAFF-PORTAL-RETIREMENT.md`. |
| **Held PR #114 (`fix/netlify-communication-preferences-embed`)** | ⏸ **Held pending Codex review & manual GAS redeploy** — Signed-link / CMS+GAS consent sync & `callOptIn` backend (`src/backend/commPrefs.js`, `backend-gas/CommPrefsGate.js`). |
| **Held PR #122 (`seo/indexing-sitemap-first-appearance-2026-11-19`)** | ⏸ **HOLD Draft** — First-appearance county canonicals + custom `/_functions/sitemap` cleanup; held pending Codex review & Brendan's sign-off. |

---

## 3. Ops Checklist (Runtime Truth)

| Item | Notes |
|---|---|
| **GAS Deployment** | ✅ **@515** on stable leads `/exec` ID (`…CvP-Z`), school `/exec` (`…Qa_DMg`). Stable `/exec` URLs preserved in `.gas-config.json`. |
| **Wix Public Surface** | ✅ Live on Wix Studio (`uiVersion` 673) via `wix-deploy.yml` auto-publish on pushes to `src/**`. |
| **Bail School Pricing** | ✅ Verified live — 120hr course at $649; 20hr course marked "Pending course approval" (#648-FL pending course approval) with no public price. |
| **Netlify Paperwork Host** | Serves role-aware intake launchpad and `communication-preferences.html`; presents DocuSeal only when staff-issued session exists. |
| **SwipeSimple Gmail Poller** | Automated 5-min trigger active for course unlock and payment plan reconciliation. |

---

## 4. Canonical Links & Related Repos

- **Phase 8.5 Gap Report:** [`docs/PHASE_85_GAP_REPORT.md`](docs/PHASE_85_GAP_REPORT.md)
- **Canonical Paperwork Architecture:** [`docs/CURRENT_PAPERWORK_ARCHITECTURE.md`](docs/CURRENT_PAPERWORK_ARCHITECTURE.md)
- **Super CRM & Scraper Fleet:** `shamrock-leads` (Hetzner VPS Docker stack)
- **Ops Hub & Scheduler:** `shamrock-node-red`
- **Bail School LMS:** `shamrock-bail-school`
- **Telegram Mini-Apps:** `shamrock-telegram-app`
- **Bond Tracker (private):** [`Shamrock2245/shamrock-bond-tracker`](https://github.com/Shamrock2245/shamrock-bond-tracker) — GPS/IP check-in geolocation; private repo (not missing)
- **Staff Auto-CRM URL:** `https://leads.shamrockbailbonds.biz` (canonical; not raw Hetzner `:8088`)
