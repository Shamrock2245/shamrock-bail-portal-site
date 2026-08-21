# ANTIGRAVITY FOUNDATION SPEC
## Shamrock Bail Bonds — Wix Studio & Velo Platform

Version: 2.0  
Status: CANONICAL  
Last Updated: 2026-08-21  
Audience: AI Agents (Antigravity), Senior Developers, System Architects  

---

## 0. ABSOLUTE AUTHORITY STATEMENT

This document is the **canonical platform specification** for this repository.

If any instruction in legacy notes, archived drafts, or external discussions conflicts with this document, **THIS DOCUMENT AND [`CURRENT_PAPERWORK_ARCHITECTURE.md`](CURRENT_PAPERWORK_ARCHITECTURE.md) OVERRIDE ALL OTHERS**.

Agents must treat this file as:
- the system contract
- the schema authority
- the workflow boundary
- the definition of success

---

## 1. SYSTEM INTENT & EXPANSION IA

This system exists to:

1. Generate **urgent, high-intent bail bond leads** with instant call/text response.
2. Maintain **SWFL Local Dominance**: Flagship Fort Myers HQ (`1528 Broadway, Fort Myers, FL 33901` · `239-332-2245`), prioritizing Lee, Collier, Charlotte, Hendry, and Glades counties.
3. Scale across **Statewide Florida**: All 67 counties via dynamic programmatic pages (`/florida-bail-bonds/:slug`) and First Appearance court calendars (`/first-appearance/:county`).
4. Support **11+ Multi-State Expansion**: Dynamic routing for non-FL states (`/bail-bonds/:state/:county`) integrated with `shamrock-leads` multi-state ops, without genericizing the homepage.
5. Provide a zero-friction **Mobile/Tablet-First Paperwork Clipboard**: Role selection, camera ID scan, Cloud Vision OCR auto-hydration, and staff-approved DocuSeal signing launchpad.

This is **not** a generic brochure. It is a **high-conversion legal operational platform**.

---

## 2. HARD SYSTEM BOUNDARIES (NON-NEGOTIABLE)

### 2.1 Clipboard vs. Brain Doctrine
- **Wix Studio / Velo (`src/`) is the Clipboard:** Captures intent, authenticates members (`portal-auth.jsw`), hosts `/portal-start` intake, auto-hydrates OCR data into canonical schemas, and opens `SigningLightbox`.
- **Super CRM (`shamrock-leads`) & GAS is the Brain:** Case matching, arrest scrapers, risk scoring, surety carrier selection, POA assignment, and staff-gated DocuSeal submission creation.
- **Strict Prohibition:** Wix code is strictly forbidden from creating DocuSeal submissions or requesting signing URLs directly from the provider.
- **Retired Providers:** SignNow execution is permanently retired (Live @464). Historical records remain read-only.

### 2.2 Security Rules
- **NO API keys in frontend code**
- **Secrets Manager only** (accessed via `src/backend/secretsManager.jsw` or GAS Script Properties)
- Backend logic goes in `.jsw` and `.js` files only
- Never store unnecessary PII in public datasets
- Keep stable GAS `/exec` URL deployment intact (`clasp deploy -i <ID>`)

---

## 3. OPERATIONAL FLOW & MENTAL MODEL

### 3.1 Anonymous Visitor
Landing (SWFL Hero) → County / Jail Detection → Instant Call / Text CTA → Call Logged → Bondsman Dispatched

### 3.2 Informed Visitor
Landing → County Page / First Appearance Calendar → Learn → Call or Start Online Intake

### 3.3 Client Paperwork Flow (Mobile & Tablet First)
1. **Auth:** Magic Link / Phone OTP (`portal-auth.jsw`).
2. **Role Selection:** Defendant | Primary Indemnitor | Co-Indemnitor.
3. **Camera ID Scan:** Cloud Vision OCR extracts personal facts into role-correct fields (Cosigner ID never overwrites defendant).
4. **Auto-Hydrate Case Facts:** Charges, bond amount, court date, jail prefilled from Super CRM when known.
5. **Delta Fields Only:** Client fills only missing employment/reference data.
6. **Canonical Schema:** Maps to standardized Person/Case model (`canonical-paperwork-mapper.js`).
7. **Staff Reconciliation & DocuSeal Issuance:** Staff verifies bond in Super CRM and generates DocuSeal packet.
8. **1-Tap Signing:** Client signs inside `SigningLightbox` on phone or tablet.

---

## 4. CMS & SCHEMA GOVERNANCE

CMS collections are **live operational datasets**. Schema drift is considered a breaking change.

### Canonical Collections:
- `FloridaCounties`: Master 67-county dataset for dynamic pages and SEO.
- `Cases`, `Defendants`, `Indemnitors`: Canonical party and case records.
- `PortalUsers`, `PortalSessions`, `Magiclinks`: Authentication and session security.
- `PendingDocuments`, `SigningSessions`: Document and signing status trackers.
- `CallLogs`, `AnalyticsEvents`, `UserLocations`: Conversion attribution and geo-logging.

---

## 5. ELEMENT ID GOVERNANCE

Element IDs are **API contracts**.
- Case-sensitive.
- Never renamed after deployment.
- Documented in `docs/ELEMENT-ID-CHEATSHEET.md`.

---

## 6. DEFINITION OF SUCCESS

This system is successful when:
- A panicked mobile user can call within 3 seconds.
- A client in crisis can scan an ID on an iPhone and reach a plain-language signing pad without retyping fields.
- Staff can reconcile bonds, select carriers, and issue DocuSeal packets seamlessly in Super CRM.
- County and multi-state pages scale without manual rework or homepage regression.

---

## END OF ANTIGRAVITY FOUNDATION SPEC
