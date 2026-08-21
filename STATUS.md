# Portal Site — True Status

> **Last verified:** 2026-08-21  
> **Repo:** `Shamrock2245/shamrock-bail-portal-site` · branch `main`  
> **Product URL:** `https://shamrockbailbonds.biz` (Live public site on Wix Editor; Wix Studio translation in progress)  
> **Role:** Brand clipboard + GAS factory — **Shamrock’s Platform** factory layer  
> **Platform prod checklist:** `shamrock-leads/docs/ECOSYSTEM_PROD_CHECKLIST.md`

---

## 1. What this repo is

| Layer | Tech | Role |
|---|---|---|
| **Frontend (Public / Editor)** | Wix Velo (`src/`) | Live public site (`shamrockbailbonds.biz`) on Wix Editor |
| **Frontend (Studio Rebuild)** | Wix Studio (`src/`) | 🔄 In Progress — Translation to Wix Studio layout & `/portal-start` wizard (not public yet) |
| **Backend** | Google Apps Script (`backend-gas/`, 190+ files) | Factory business logic, webhook processing, school unlocks |
| **Related** | Netlify embeds & Mini-Apps | Netlify paperwork launchpad, Telegram WebApps, Bail School embed |

**Not** the student LMS (that is `shamrock-bail-school`).  
**Not** the arrest Super CRM & multi-state brain (that is `shamrock-leads`).

---

## 2. Code on `main` (Implemented & Current)

| Area | Status |
|---|---|
| **Wix Studio Translation & IA Expansion** | 🔄 In Progress (Phase 8.5) — Multi-state routing, canonical paperwork mapper, and SWFL hero dominance in code; cutover pending completion. |
| **Bond Portal, Telegram, Shannon, DocuSeal** | ✅ Code-enforced: DocuSeal is sole active signing provider; staff-gated issuance in Super CRM; Wix acts as non-issuing clipboard launchpad. |
| **Legacy SignNow Execution** | ✅ **Retired (Live @464)** — All direct routes, factory senders, and legacy webhooks disabled. Historical fields remain read-only. |
| **Surety Realignment** | ✅ Active paperwork requires explicit `surety_id` (OSI preferred, Palmetto policy-gated, Accredited/Bankers mapped via canonical schema). |
| **Bail School Education Management** | ✅ GAS unlock poller, SwipeSimple integration ($199 20hr / $649 120hr / $49 simulator), live catalog aligned. |
| **Security & Secrets Scrub** | ✅ Hardcoded secrets scrubbed; HMAC webhook signatures fail closed; script properties standardized. |
| **MongoDB Atlas Event Logging** | ✅ `MongoLogger.gs` + `mongo_writer.py` logging business events to Atlas. |

---

## 3. Ops Checklist (Runtime Truth)

| Item | Notes |
|---|---|
| **GAS Deployment** | ✅ **@464** on stable portal deployment — DocuSeal guards and SignNow retirement live with no `/exec` URL change. Health check returns `success: true`. |
| **Wix Public Surface** | Live on Wix Editor. Wix Studio migration in active development on `main` branch. Cutover after Studio validation. |
| **Bail School Pricing** | ✅ Verified live — JSON-LD lists 120hr course at $649; $199 20hr. |
| **Netlify Paperwork Host** | Serves role-aware intake launchpad; presents DocuSeal only when staff-issued session exists. |
| **SwipeSimple Gmail Poller** | Automated 5-min trigger active for course unlock and payment plan reconciliation. |

---

## 4. Canonical Links & Related Repos

- **Canonical Paperwork Architecture:** [`docs/CURRENT_PAPERWORK_ARCHITECTURE.md`](docs/CURRENT_PAPERWORK_ARCHITECTURE.md)
- **Super CRM & Scraper Fleet:** `shamrock-leads` (Hetzner VPS Docker stack)
- **Ops Hub & Scheduler:** `shamrock-node-red`
- **Bail School LMS:** `shamrock-bail-school`
- **Telegram Mini-Apps:** `shamrock-telegram-app`

---

*Maintained by Shamrock Engineering & AI Agents*
