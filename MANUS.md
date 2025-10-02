# MANUS.md

## Context (Wix + Velo)
- Frontend is a **Wix site** using **Velo** (JavaScript).
- Use `wix-users`, `wix-members`, `wix-data`, `wix-fetch`, and browser APIs (camera, geolocation).
- All **heavy logic** (schema validation, PDF render, signature audit, payments, check-ins) is handled by an **external API** (see API_SPEC.md). Frontend calls it via HTTPS.

---

## Build Objectives
1. Role-based portals: **Defendant**, **Indemnitor/Cosigner**, and **Staff** console.  
2. Digitize all packet forms into dynamic, auto-prefilled flows with e-signatures.  
3. Collect payments (tokenized), receipts, and **Certified Check-Ins** (GPS + selfie).  
4. Generate court-ready PDFs mirroring the packet design.

---

## Must-Haves
- Validate all inputs against **JSON Schemas** (see SCHEMAS.md).  
- Documents implemented:  
  - `financial_indemnity_v1`  
  - `appearance_application_v1`  
  - `collateral_promissory_v1`  
  - `bond_info_sheet_v1`  
  - `waiver_authorization_v1`  
  - `ssa_3288_v1`  
  - `cc_authorization_v1`  
- Enforce conditionals:
  - If `collateral=real_estate` → require deed/mortgage upload  
  - If `arrested_before=true` → require offense notes  
  - SSA benefit date ranges → require both start & end  
- PDF rendering: anchor-based placement; signature stamps on labeled lines; include audit (timestamp, IP, UA).

---

## Deliverables
- Velo pages/components for each flow, with **autosave** + **resume later**.  
- Members Area routing by role.  
- API calls to `POST /persons`, `POST /cases`, `POST /documents`, `POST /signatures/requests`, `POST /payments/authorize`, `POST /checkins`.  
- Admin console (staff) with case filters (Lee, Charlotte, Collier), status chips, and packet export.

---

## UX Notes
- One-screen-at-a-time forms (wizard flow).  
- Autosave + resume for interrupted sessions.  
- Input masks (SSN, phone, ZIP).  
- USPS address normalization.  
- PDF download + email delivery after completion.

---

## Security
- TLS enforced everywhere.  
- JWT for staff; short-lived magic links for clients.  
- SSNs masked on display; never store card PAN/CVV in Wix.  
- Audit logs for signatures, payments, check-ins, and PDF generation.

---

**Purpose of this file:** Give Manus (or other AI dev tools) clear build instructions so generated code stays Wix-aware, schema-validating, and legally compliant.
