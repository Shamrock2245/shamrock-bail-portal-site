# Portal Site — True Status

> **Last verified:** 2026-08-28  
> **Repo:** `Shamrock2245/shamrock-bail-portal-site` · branch `main`  
> **Product URL:** `https://shamrockbailbonds.biz` (Live public site on Wix Editor. Studio canvas is deferred — Editor is the production surface.)  
> **Role:** Brand clipboard + GAS factory — **Shamrock’s Platform** factory layer  
> **Platform prod checklist:** `shamrock-leads/docs/ECOSYSTEM_PROD_CHECKLIST.md`

---

## 1. What this repo is

| Layer | Tech | Role |
|---|---|---|
| **Frontend (Public / Editor Live)** | Wix Velo (`src/`) | Live public site (`shamrockbailbonds.biz`) on Wix Editor. |
| **Frontend (Studio Canvas)** | Wix Studio Canvas | ⏸ **Deferred** — Not required for current production. Live clipboard is the Wix Editor site. |
| **Backend Clipboard Services** | Wix Velo Backend (`src/backend/*.jsw`) | ✅ **Live on Editor (2026-08-25)** — ID OCR, case hydrator, drafts, canonical sync, signing launchpad, ServiceAreas, lobby tablet; factory allowlist + GAS ClipboardBridge wired. |
| **Backend Factory** | Google Apps Script (`backend-gas/`, 190+ files) | Factory business logic, webhook processing, school unlocks, stable `/exec` deployment. |
| **Related** | Netlify embeds & Mini-Apps | Netlify paperwork launchpad, Telegram WebApps, Bail School embed. |

**Not** the student LMS (that is `shamrock-bail-school`).  
**Not** the arrest Super CRM & multi-state brain (that is `shamrock-leads`).

---

## 2. Code on `main` (Implemented & Current)

| Area | Status |
|---|---|
| **Wix Studio Translation & IA Expansion** | ⏸ **Deferred** — Backend clipboard is live on Editor. Visual Studio canvas is not in the current production path. |
| **Bond Portal, Telegram, Shannon, DocuSeal** | ✅ **Code-enforced:** DocuSeal is sole active signing provider; staff-gated issuance in Super CRM; Wix acts strictly as non-issuing clipboard launchpad. Staff Defendant Details opens/texts a staff-issued session only. Staff prompts (finalize / power / custody) use the Command Center iframe modal, with optional Editor lightbox `StaffPromptLightbox`. |
| **Legacy SignNow Execution** | ✅ **Retired (Live @468)** — Direct routes, factory senders, MCP packet helpers, and Wix portal send wrappers fail closed. Historical fields remain read-only. |
| **Surety Realignment** | ✅ Active paperwork requires explicit `surety_id` (OSI preferred, Palmetto policy-gated, Accredited/Bankers mapped via canonical schema). |
| **Bail School Education Management** | ✅ GAS unlock poller, SwipeSimple integration ($199 20hr / $649 120hr / $49 simulator), live catalog aligned. |
| **Security & Secrets Scrub** | ✅ Hardcoded secrets scrubbed; HMAC webhook signatures fail closed; script properties standardized. |
| **MongoDB Atlas Event Logging** | ✅ `MongoLogger.gs` + `mongo_writer.py` logging business events to Atlas. |

---

## 3. Ops Checklist (Runtime Truth)

| Item | Notes |
|---|---|
| **GAS Deployment** | ✅ **@468** on both stable `/exec` IDs (portal `…CvP-Z`, school `…Qa_DMg`). Health returns `{"success":true,"version":"V468"}`. URL unchanged. |
| **Wix Public Surface** | Live on Wix Editor (`wix publish --source local` 2026-08-25). Staff dashboard uses the canonical factory URL. Studio canvas is not the live surface. |
| **Bail School Pricing** | ✅ Verified live — JSON-LD lists 120hr course at $649; $199 20hr. |
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
