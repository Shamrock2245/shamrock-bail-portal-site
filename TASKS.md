# TASKS.md

## Overview
This file defines the major build tasks for the Shamrock Bail Bonds Portal.  
Tasks are grouped by **Front End (Wix + Velo)**, **Backend API**, **Integrations**, and **Compliance/QA**.  
Each task has a status field and owner.

---

## Front End (Wix + Velo)
- [ ] Create **Members Area** with role-based routing (Defendant / Indemnitor / Staff).
- [ ] Build **onboarding wizard** (autosave, resume later).
- [ ] Create **check-in screen** with GPS + selfie capture.
- [ ] Implement **payment form** (Wix Payments / Stripe).
- [ ] Add **case status dashboard** for staff (filter by county).
- [ ] Render **downloadable PDF receipts** after signatures/payments.

---

## Backend API
- [ ] Implement `/persons` create/update (see API_SPEC.md).
- [ ] Implement `/cases` create/update.
- [ ] Implement `/documents` create/render.
- [ ] Implement `/signatures/requests` and `/signatures`.
- [ ] Implement `/payments/authorize` and `/payments/{id}:capture`.
- [ ] Implement `/checkins` create/list.
- [ ] Add **webhooks** for payment and signature events.

---

## Integrations
- [ ] Connect Wix → external API using `wix-fetch`.
- [ ] Configure Wix Payments / Stripe sandbox.
- [ ] Configure email delivery (PDF copies to staff + client).
- [ ] Enable SMS delivery for signature links.

---

## Compliance & QA
- [ ] Validate inputs against JSON Schemas (SCHEMAS.md).
- [ ] Verify PDF anchor placement (PDF_TEMPLATES.md).
- [ ] Add audit logs for all check-ins, payments, and signatures.
- [ ] Test edge cases (real estate collateral, multiple indemnitors).
- [ ] Pen test for PII leaks and auth bypass.

---

## Future Tasks
- [ ] Add **multi-language support** (Spanish, Creole).
- [ ] Add **push notifications** for check-in reminders.
- [ ] Build **reporting dashboard** (missed check-ins, outstanding payments).
