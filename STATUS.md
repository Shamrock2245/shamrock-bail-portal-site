# Portal Site — True Status

> **Last verified:** 2026-09-30  
> **Repo:** `Shamrock2245/shamrock-bail-portal-site` · branch `main`  
> **Product URL:** `https://shamrockbailbonds.biz` (Live public site on Wix Editor. Studio canvas is deferred — Editor is the production surface.)  
> **Role:** Brand clipboard + GAS factory — **Shamrock’s Platform** factory layer  
> **Platform prod checklist:** `shamrock-leads/docs/ECOSYSTEM_PROD_CHECKLIST.md`

---

## 1. What this repo is

| Layer | Tech | Role |
|---|---|---|
| **Frontend (Public / Editor Live)** | Wix Velo (`src/`) | Live public site (`shamrockbailbonds.biz`) on Wix Editor (uiVersion 2775). |
| **Frontend (Studio Canvas)** | Wix Studio Canvas | 🔨 **In Active Build** — Unpublished branch "Wix studio version" (branchId `12e252e4-45a8-4bcc-840b-64d4edbdcaa4` on site `a00e3857-675a-493b-91d8-a1dbc5e7c499`). Grok Bot building visual layout and SEO fields; PR #74 establishes complete SEO baseline, URL map, SEO specs, and content drafts. |
| **Backend Clipboard Services** | Wix Velo Backend (`src/backend/*.jsw`) | ✅ **Live on Editor** — ID OCR, case hydrator, drafts, canonical sync, signing launchpad, ServiceAreas; factory allowlist + GAS ClipboardBridge wired. Default surety is OSI. |
| **Backend Factory** | Google Apps Script (`backend-gas/`, 162 files) | Factory business logic, webhook processing, school unlocks, stable `/exec` deployment. 0 duplicate global symbols. |
| **Related** | Netlify embeds & Mini-Apps | Netlify paperwork launchpad, Telegram WebApps, Bail School embed. |

**Not** the student LMS (that is `shamrock-bail-school`).  
**Not** the arrest Super CRM & multi-state brain (that is `shamrock-leads`).

---

## 2. Code on `main` (Implemented & Current)

| Area | Status |
|---|---|
| **Wix Studio Translation & IA Expansion** | 🔨 **In Progress (PR #74)** — 254-URL SEO baseline crawl, zero-loss URL map (367 rows), 111 Wix 301 redirects, 17 Studio SEO specs, 17 improved content drafts, 67-county official sources catalog, 11 duplicate blog post groups merged, and porting guide. |
| **Bond Portal, Telegram, Shannon, DocuSeal** | ✅ **Code-enforced:** DocuSeal is sole active signing provider; staff-gated issuance in Super CRM; Wix acts strictly as non-issuing clipboard launchpad. Staff Defendant Details opens/texts a staff-issued session only. Staff prompts use Command Center iframe modal. |
| **Legacy SignNow Execution** | ✅ **Retired (Live @508)** — Direct routes, factory senders, MCP packet helpers, and Wix portal send wrappers fail closed. Historical fields remain read-only. |
| **Surety Realignment** | ✅ Active paperwork requires explicit `surety_id`. Only OSI and Palmetto are active sureties (OSI default). Accredited and Bankers removed from active lists; Lexington National, Roche, Universal, Bankers remain inactive/future options. |
| **Bail School Education Management** | ✅ GAS unlock poller, SwipeSimple integration ($199 20hr / $649 120hr / $49 simulator), live catalog aligned. |
| **Security & Secrets Scrub** | ✅ Hardcoded secrets scrubbed; HMAC webhook signatures fail closed; script properties standardized. |
| **MongoDB Atlas Event Logging** | ✅ `MongoLogger.gs` + `mongo_writer.py` logging business events to Atlas. |
| **GAS Global Scope Deduplication** | ✅ **Complete (2026-09-30):** All 25 duplicate global declarations across 162 backend files resolved to canonical implementations; 0 global symbol collisions. |

---

## 2a. Website Applications → CRM Intake (Merged in PR #24)

| Area | Status |
|---|---|
| **Website applications → CRM** | ✅ **Merged on `main` (PR #24)** — Wizards submit via `backend/leadsIntake.jsw` → CRM `/api/webhooks/wix-intake` (Mongo `intake_queue` first), success only on `success:true`, Pay-by-card on success. See `docs/WIX-TO-CRM-INTAKE.md`. |
| **Sheets Intake Ledger** | ✅ **Merged on `main`** — `backend-gas/IntakeLedger.js` (`appendIntakeLedger`), called by the CRM fan-out after Mongo save. Deploys with next GAS versioned push. |
| **Staff Portal / Lobby Tablet** | ✅ **Retired in code** — Redirects to CRM / fails closed. Wix Editor visual removals: `docs/STAFF-PORTAL-RETIREMENT.md`. |
| **Wizard embeds** | 📋 Ready for Wix Editor embed paste: `docs/editor-repaste-2026-09-27/`. |

---

## 3. Ops Checklist (Runtime Truth)

| Item | Notes |
|---|---|
| **GAS Deployment** | ✅ **@508** on both stable `/exec` IDs (portal `…CvP-Z`, school `…Qa_DMg`). Dual OpenAI/Grok failover, trigger resilience, full 16-trigger registry. URL unchanged. |
| **Wix Public Surface** | Live on Wix Editor (uiVersion 2775, published with Florida Bail Bonds landing page `/florida-bail-bonds`). Staff dashboard uses canonical factory URL. |
| **Bail School Pricing** | ✅ Verified live — 120hr course at $649; 20hr course marked "Pending course approval" (#648-FL pending course approval) with no public price. |
| **Netlify Paperwork Host** | Serves role-aware intake launchpad; presents DocuSeal only when staff-issued session exists. |
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
