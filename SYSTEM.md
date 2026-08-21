# 🏗 Architecture & System

> **Last Updated:** 2026-08-21  
> **Status:** 🟢 Production bond stack · See [`STATUS.md`](./STATUS.md) for git vs live ops  
> **Ecosystem:** Auto-CRM & Multi-State Brain = `shamrock-leads` · Ops Hub = `shamrock-node-red` · School LMS = `shamrock-bail-school`

---

## ⚠️ Mandatory Agent Onboarding Directive

> **ATTENTION AGENTS:** Before modifying, creating, or refactoring any page code or backend endpoints, you MUST thoroughly review **[`USER.md`](./USER.md)**, **[`RULES.md`](./RULES.md)**, **[`docs/CURRENT_PAPERWORK_ARCHITECTURE.md`](./docs/CURRENT_PAPERWORK_ARCHITECTURE.md)**, and **Phase 8.5 (Wix Studio Translation & Autopilot Paperwork Clipboard)** in **[`ROADMAP.md`](./ROADMAP.md)**.
> 
> **Core Doctrine:** The website is the clipboard. The backend is the brain. Wix never creates DocuSeal packets or replaces Super CRM underwriting authority.

---

## Prime Directive

**"The Website is a Clipboard; The Backend is the Brain."**

We enforce a distributed, service-oriented architecture. The frontend (Wix Studio / Velo) exists to collect customer intent, authenticate members, provide camera ID scanning, auto-hydrate form fields, and launch signing sessions. All heavy lifting — scrapers, risk underwriting, case reconciliation, surety/POA assignment, and DocuSeal packet generation — runs in Super CRM (`shamrock-leads`) and Google Apps Script (GAS).

---

## The Modern Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend / UI** | Wix Studio & Velo | Premium responsive UI — Glassmorphism, animations, magic link auth, camera ID scan launchpad. |
| **Backend / Factory** | Google Apps Script (GAS) | Single entry point (`Code.js doPost()/doGet()`). 190+ files. All business logic. v464+. |
| **Arrest Brain & CRM** | `shamrock-leads` | Multi-state scraper fleet, MongoDB Atlas, Super CRM case reconciliation, staff-gated DocuSeal issuance. |
| **Voice AI** | ElevenLabs Conversational AI | "Shannon" — 24/7 after-hours phone intake agent with live call transfer. |
| **Database** | Wix CMS + Google Sheets + MongoDB Atlas | Wix CMS for portal data. Sheets for ops master. MongoDB for arrest analytics & event logging. |
| **Signing** | DocuSeal via Super CRM | Staff-issued packet workflow. Wix hosts only the secure Netlify launchpad and cannot create packets or signing links. |
| **Payments** | SwipeSimple | One-click payment links, virtual terminal, payment plan reconciliation. |
| **SMS / Voice** | Twilio | External client comms — SMS & WhatsApp (10DLC compliant). Court reminders, check-ins. |
| **Internal Ops** | Slack (12+ webhook channels) | Staff alerts, intake notifications, arrest feeds, error reporting. |
| **Messaging** | Telegram Bot API | Primary client channel — conversational intake, inline quotes, mini-apps, OCR. |
| **Mini Apps** | Netlify | 7 Telegram WebApps (Portal, Intake, Documents, Payments, Check-in, Status). |
| **Edge Functions** | Netlify Edge | Shannon init webhook proxy, county geolocation, Twilio voice routing. |
| **OCR** | Google Cloud Vision API | FL Driver License extraction (name, DOB, DL#, address). |
| **Automation** | Node-RED | 21 flow tabs, 836 nodes, 64 crons, 10 dashboard pages. Ops command center. |
| **Scrapers** | Python (DrissionPage) + Node.js (Puppeteer) | 20 active Florida county jail scrapers + multi-state expansion fleet. Dockerized on Hetzner VPS. |
| **Deployment** | `clasp` (GAS) + Wix CLI + GitHub | Versioned GAS deployments. 5 repos under `Shamrock2245`. |

---

## Operating Logic & Pipeline

```
Collect → Normalize → Store → Trigger → AI Process → Staff Gate → Sign
```

### The Intake-to-Bond Pipeline

```
Arrest Detected ──→ Scraper writes to Sheets + MongoDB + Slack
                         │
                    Lead Scored (0-100)
                         │
Client starts via ──→ Magic Link (Web) / Telegram Bot / Shannon (Phone)
                         │
                    Role Chosen: Defendant / Primary Indemnitor / Co-Indemnitor
                         │
                    Camera ID Scan: Cloud Vision OCR extracts & hydrates role-scoped fields
                         │
                    Auto-Hydrate Case Facts (charges, bail, court, jail) from Super CRM
                         │
                    Client Completes Missing Delta Fields (employment, references)
                         │
                    Super CRM saves independent staff-deferred intake record
                         │
                    Staff validates Match, BondCase, surety carrier, and POA limit in Super CRM
                         │
                    Staff issues DocuSeal packet; secure launchpad presents the active session
                         │
                    Client signs on mobile/tablet → DocuSeal submission completed
                         │
                    Signed docs auto-saved to Drive → Staff alerted on Slack → Bond Dispatched
```

---

## Security & Compliance

- **Role-Scoped Hydration**: Indemnitor ID scans never overwrite defendant data.
- **PII Encryption**: Sensitive data encrypted at rest in Wix Collections.
- **API Keys**: Never in frontend code. Managed via Wix Secrets Manager + GAS Script Properties.
- **Audit Trails**: Historical provider records remain keyed by Case ID for compatibility. Active DocuSeal issuance and completion follow the Super CRM approval workflow; business events are logged to MongoDB via `MongoLogger.gs`.
- **10DLC Compliance**: Twilio SMS follows carrier regulations. Communication preferences respected (`CommPrefsManager.js`).
- **Idempotent Writes**: All data writes check for duplicates. `Booking_Number + County` is the dedup key.

---

*Maintained by Shamrock Engineering & AI Agents*
