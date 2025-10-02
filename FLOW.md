# FLOW.md

## Overview
This file documents the user flows (Defendant, Indemnitor/Cosignor, Staff).  
Each flow is expressed as step-by-step screens and actions.  
The purpose is to guide development, QA, and AI agents (Manus, Copilot) on the "happy path" and key edge cases.

---

## Defendant Flow

### Entry
1. Defendant receives **magic link** by email/SMS.
2. Click → redirected to **Defendant Portal** (Wix Members Area, role = defendant).

### Steps
- **Step 1: Identity Verification**
  - Enter DOB + last 4 SSN (cross-check with prefilled data).
- **Step 2: Application Form**
  - Pre-filled with staff data (case #, charges).
  - Defendant adds missing fields: DOB, address, employer, identifiers.
  - Autosave + resume enabled.
- **Step 3: Waivers**
  - Waiver of rights, SSA release, personal information release.
  - E-signature required.
- **Step 4: Payment (Optional)**
  - If partial fee assigned to defendant → pay via card.
  - Generate PDF receipt.
- **Step 5: Certified Check-In**
  - Camera prompt for selfie.
  - GPS location captured with consent waiver.
  - Confirmation screen with "Certified" status.

### Exit
- Defendant receives signed PDF packet + payment receipt (if applicable).
- Staff notified via dashboard + webhook.

---

## Indemnitor / Cosignor Flow

### Entry
1. Indemnitor receives **magic link** by email/SMS.
2. Click → redirected to **Indemnitor Portal** (role = indemnitor).

### Steps
- **Step 1: Identity Verification**
  - Enter DOB + last 4 SSN (or phone/email validation).
- **Step 2: Financial Statement & Indemnity**
  - Assets/liabilities section.
  - Employer, income, housing, references.
- **Step 3: Collateral / Promissory Note**
  - Select collateral type (vehicle, real estate, cash).
  - Conditional upload (e.g., deed for real estate).
- **Step 4: Credit Card Authorization**
  - Authorize fee/charge (if applicable).
  - Secure payment tokenization.
- **Step 5: Signatures**
  - Indemnity, promissory note, waiver lines.
  - Audit metadata appended.

### Exit
- Indemnitor receives PDF copies + receipts.
- Staff console updated with indemnitor compliance status.

---

## Staff Flow

### Entry
1. Staff logs into **Staff Console** with credentials (JWT secured).
2. Redirect to **Dashboard**.

### Screens
- **Dashboard**
  - Case list by county (Lee, Charlotte, Collier).
  - Filters: status (draft, pending, signed, completed).
- **Case Creation**
  - Enter defendant details, bond amount, case #, charges.
  - Add indemnitors.
  - Prefill documents before sending.
- **Case View**
  - See progress: % complete (Defendant, Indemnitor).
  - View signatures, payments, check-ins.
  - Export packet as PDF.
- **Notifications**
  - Alerts for missed check-ins, unsigned docs, failed payments.
- **Settings**
  - Manage staff users, county assignments, webhook endpoints.

---

## Flow Diagram (Textual)

**Defendant:**  
Magic link → Identity Verify → Application → Waivers → [Optional Payment] → Check-In → Signed PDFs → Exit

**Indemnitor:**  
Magic link → Identity Verify → Financials → Collateral → Card Auth → Signatures → PDFs/Receipts → Exit

**Staff:**  
Login → Dashboard → Case Create → Assign Indemnitors/Defendant → Monitor Status → Export Packet

---

## Edge Cases
- Defendant refuses GPS → cannot complete check-in (flag in staff dashboard).  
- Indemnitor fails payment → allow retry; case stays "pending."  
- Multiple indemnitors → all must complete before case is "signed."  
- Real estate collateral missing deed upload → block submission.  

---

## Notes for AI Agents
- Always enforce SCHEMAS.md before submission.  
- Call API endpoints exactly as in API_SPEC.md.  
- Place signatures at anchors in PDF_TEMPLATES.md.  
- Respect TASKS.md ordering for build priorities.  
