# Shamrock Bail Bonds — Handoff & App Plan
**Date:** Feb 26 2026
**Participants:** User + Manus (Antigravity session + current session)
**Repo:** https://github.com/Shamrock2245/shamrock-bail-portal-site

---

## Part 1: What Was Accomplished Today

### 1.1 SignNow Field Map — Finalized

The `getSignatureFieldDefs()` function in `backend-gas/Telegram_Documents.js` has been fully rebuilt from the ground up. The previous version contained placeholder coordinates and incorrect role assignments. The new version is based on:

- **Acrobat Pro form field extraction** from the 13 original osiforms PDFs uploaded directly from the user's machine.
- **Visual inspection** of every page of every document to confirm which fields are true signing lines vs. data-entry fields.
- **Explicit business rules** confirmed by the user during this session.

The companion verification report lives at `SIGNNOW_VERIFICATION_REPORT.md` in this repo.

#### Business Rules Locked In

| Rule | Detail |
|---|---|
| Data pre-fill | All text fields (names, addresses, dates, amounts) are pre-filled by `Dashboard.html`. The field map covers **signatures and initials only**. |
| Indemnity Agreement | Signed by **Indemnitor only**. The form label "INDEMNITOR: X ___" is the authority. |
| Defendant Application | Signed by **Defendant only** on page 2. Page 1 is data-entry. |
| SSA Release | One **full form per person**. The calling logic must instantiate a separate document for each signer (Defendant, Indemnitor, Co-Indemnitors). |
| FAQ Documents | **Both Defendant AND Indemnitor** initial all pages of **both** FAQ docs. Cross-role awareness is the goal — each party reads and acknowledges the other's responsibilities. |

#### Documents Needing Manual SignNow Tag Placement

| Document | Action |
|---|---|
| `faq-cosigners` | Flat PDF — add initials tags (Defendant + Indemnitor, both pages) |
| `faq-defendants` | Flat PDF — add initials tags (Defendant + Indemnitor, both pages) |
| `master-waiver` | Acrobat has date fields only — add signature tags on page 4 |
| `collateral-receipt` | Verify depositor signature tag position in two-section layout |

---

### 1.2 Telegram Mini App — Documents Module

The `shamrock-telegram-app` repo received a new `documents/` module today (Antigravity session). This module handles the SignNow document dispatch flow from within the Telegram bot, allowing agents to trigger paperwork packets directly from the field.

Key files added:
- `documents/app.js` — Main entry point for the documents mini app
- `documents/signnow.js` — SignNow API integration layer
- `documents/templates.js` — Template ID registry (aligned with `getSignatureFieldDefs`)

---

### 1.3 Schema Alignment

All field names, document IDs, and role labels used in `Telegram_Documents.js` are aligned with the canonical schema in `swfl-arrest-scrapers`. No new field names were invented. The `defendant_name`, `indemnitor_name`, and related keys match the arrest scraper schema exactly.

---

## Part 2: App & Flow Plan

This section documents the planned architecture for the full Shamrock Bail Bonds application ecosystem.

### 2.1 System Overview

```
PUBLIC WEBSITE (Wix Velo)
  └── Marketing pages, county SEO, blog, FAQ
  └── CTA: "Start Bail Now" → Members login

MEMBERS PORTAL (Wix Velo — Members Area)
  └── Login gate
  └── Consent & permissions screen
  └── "Start Bail Paperwork" button
  └── SignNow handoff (launchpad only — SignNow owns the signing experience)

DASHBOARD.HTML (Internal — Google Apps Script Web App)
  └── Intake queue (from Wix + Telegram)
  └── Agent review & approval
  └── Document packet dispatch (triggers SignNow via Telegram_Documents.js)
  └── Case status tracking
  └── Pre-fills all form data before SignNow invite is sent

TELEGRAM BOT (shamrock-telegram-app)
  └── Defendant mini app (intake from field)
  └── Documents mini app (trigger paperwork from field)
  └── Notifications (case status, signing reminders)

GOOGLE SHEETS / GOOGLE DOCS
  └── Case data store (source of truth for pre-fill)
  └── Arrest data from swfl-arrest-scrapers

SIGNNOW
  └── Owns the entire signing experience
  └── 12-document packet per bond
  └── Invites sent with pre-filled data
  └── Webhooks report completion back to Dashboard
```

---

### 2.2 The 12-Document Signing Packet

Every bond triggers the following documents in order. All data fields are pre-filled before the invite is sent.

| # | Document ID | Who Signs | Notes |
|---|---|---|---|
| 1 | `paperwork-header` | — | Cover page, no signatures |
| 2 | `faq-defendants` | Defendant + Indemnitor (initials, all pages) | Cross-role awareness |
| 3 | `faq-cosigners` | Defendant + Indemnitor (initials, all pages) | Cross-role awareness |
| 4 | `defendant-application` | Defendant | Page 2 only |
| 5 | `indemnity-agreement` | Indemnitor | 1 signature |
| 6 | `promissory-note` | Defendant + Indemnitor | Bottom of page |
| 7 | `disclosure-form` | Defendant + Indemnitor + Bail Agent | 6 fields across 2 sections |
| 8 | `surety-terms` | Defendant + Indemnitor (×3) | Up to 3 indemnitors |
| 9 | `master-waiver` | Bail Agent + Defendant + Indemnitor (×2) | Page 4 |
| 10 | `ssa-release` | One per person (Defendant, Indemnitor, Co-Ind.) | Separate form per signer |
| 11 | `collateral-receipt` | Indemnitor + Bail Agent (×2) | Two-section form |
| 12 | `payment-plan` | Defendant + Indemnitor | Page 4 only |

---

### 2.3 Flow: New Bond — End to End

```
1. ARREST DATA IN
   └── swfl-arrest-scrapers OR manual entry via Telegram bot
   └── Data lands in Google Sheets (canonical schema)

2. AGENT INTAKE (Dashboard.html)
   └── Agent reviews case in intake queue
   └── Verifies defendant info, indemnitor info, bond amount
   └── Approves → triggers document packet dispatch

3. DOCUMENT DISPATCH (Telegram_Documents.js via GAS)
   └── Pulls case data from Google Sheets
   └── Pre-fills all 12 documents via SignNow template fill API
   └── Creates SignNow invite for each signer role
   └── Sends invite links via SMS/email (or Telegram)

4. SIGNING (SignNow — client-facing)
   └── Defendant receives link → signs on phone or computer
   └── Indemnitor receives link → signs
   └── Bail Agent countersigns where required
   └── SSA forms: each person gets their own link

5. COMPLETION
   └── SignNow webhook fires on completion
   └── Dashboard.html updates case status
   └── Telegram bot notifies agent
   └── Signed PDFs stored in Google Drive / SignNow archive

6. WIX MEMBERS PORTAL (optional parallel path)
   └── Client can also initiate from the website
   └── Login → consent → "Start Bail Paperwork" → same SignNow flow
   └── Portal shows signing status in real time
```

---

### 2.4 Flow: Wix Members Portal

The Wix Members Portal is a **secure launchpad** only. It does not duplicate or replace any SignNow functionality.

```
PUBLIC PAGE: "Start Bail Now" CTA
  └── Redirects to Members login

MEMBERS LOGIN (Wix built-in auth)
  └── Existing member: direct to portal dashboard
  └── New member: registration → email verification → portal

PORTAL DASHBOARD
  └── Shows: case status, pending signatures, completed docs
  └── "Start Bail Paperwork" button (only visible after consent)

CONSENT GATE (before paperwork button is active)
  └── Geolocation consent
  └── Terms of service acknowledgment
  └── Identity confirmation

SIGNNOW HANDOFF
  └── Button click → backend Velo function fires
  └── Velo calls GAS endpoint to get SignNow invite URL for this member
  └── Member is redirected to SignNow (or iframe embed)
  └── SignNow owns everything from this point forward
```

---

### 2.5 Flow: Telegram Bot (Field Operations)

```
AGENT OPENS BOT
  └── Main menu: New Case | Documents | Status | Directory

NEW CASE
  └── Agent enters defendant info (or selects from arrest data)
  └── Enters indemnitor info
  └── Enters bond details
  └── Submits → goes to Dashboard intake queue

DOCUMENTS
  └── Agent selects case
  └── Chooses: Full Packet | Single Doc | SSA Only
  └── Bot triggers dispatch via Telegram_Documents.js
  └── Signing links sent to clients

STATUS
  └── Agent checks signing status per case
  └── See which docs are pending, signed, or expired

DIRECTORY
  └── Florida Sheriffs & Clerks directory
  └── Searchable by county
```

---

### 2.6 Wix Website — Public Pages Plan

| Page | URL | Purpose |
|---|---|---|
| Home | `/` | Primary conversion page. CTAs: Call Now, Start Bail Now |
| How Bail Works | `/how-bail-works` | Educational, trust-building |
| County Pages | `/counties/[county-name]` | 67 FL counties, SEO-ready |
| How to Become a Bondsman | `/become-a-bondsman` | Lead gen + Shamrock Bail School |
| Blog | `/blog` | Long-form SEO authority content |
| FL Sheriffs & Clerks Directory | `/florida-directory` | Accurate, linkable resource |
| About | `/about` | Team, office, trust signals |
| Contact | `/contact` | Phone, form, map |
| Members Portal | `/members` | Gated — login required |
| FAQ | `/faq` | Schema-marked FAQ for SEO |

---

### 2.7 Open Items & Next Steps

| Item | Owner | Priority |
|---|---|---|
| Add SignNow initials tags to `faq-cosigners` and `faq-defendants` in template editor | User | High |
| Verify `master-waiver` signature tag positions on page 4 | User | High |
| Verify `collateral-receipt` depositor signature tag | User | High |
| Test full 12-doc packet dispatch end-to-end | Dev | High |
| Build Wix Members Portal consent gate | Dev | Medium |
| Build 67 county page templates (SEO-ready) | Dev | Medium |
| Verify FL Sheriffs & Clerks directory links | Dev | Medium |
| Implement SignNow webhook handler in GAS | Dev | Medium |
| Build Telegram bot "Documents" mini app | Dev | Medium |
| Add Shamrock Bail School schedule placeholder | Dev | Low |

---

## Part 3: File Reference

| File | Location | Description |
|---|---|---|
| `Telegram_Documents.js` | `backend-gas/` | GAS backend — SignNow dispatch, field defs |
| `getSignatureFieldDefs_PRODUCTION.js` | repo root | Standalone copy of the final field defs function |
| `SIGNNOW_VERIFICATION_REPORT.md` | repo root | Full field-by-field verification report |
| `HANDOFF_AND_APP_PLAN.md` | repo root | This document |
| `shamrock_field_mappings.json` | project shared files | Canonical field mapping schema |
| `whatsapp-api-reference-for-llm.txt` | project shared files | WhatsApp API reference |
| `WHATSAPP_SETUP.md` | project shared files | WhatsApp integration setup |
| `WHATSAPP_TEMPLATES.md` | project shared files | WhatsApp message templates |
