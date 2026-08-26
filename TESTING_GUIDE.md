# 🧪 Testing Guide

> **Last Updated:** 2026-08-21  
> **Status:** Backend contract tests active; **Prompt 19 Studio Device QA is BLOCKED** until the Studio visual canvas layout is assembled.

---

## 1. Backend Contract & Integration Tests (Ready / Automated)

### Test A: Role-Scoped ID OCR Hydration
**Goal:** Verify Google Cloud Vision OCR parses driver's licenses and strictly isolates signer roles (indemnitor DL never overwrites defendant identity).

**Execution:**
```bash
# Run unit tests and ESLint linter
npx eslint src/backend/id-ocr-service.jsw src/public/canonical-paperwork-mapper.js
```
**Pass Criteria:**
- `processIdPhotoOcr()` returns structured identity with confidence score.
- When `signerRole === 'indemnitor'`, `canonicalCase.defendant` remains unchanged.

---

### Test B: Case Facts Hydrator & Statutory Fee Math
**Goal:** Verify auto-hydration of charges and $100 min/charge calculation under Florida Chapter 648/903.

**Pass Criteria:**
- 1 charge @ $500 bond -> Premium = $100 (statutory minimum applied).
- 1 charge @ $2,000 bond -> Premium = $200 (10% rate applied).
- 3 charges @ $500, $500, $500 -> Premium = $300 ($100 min per individual charge).

---

### Test C: Wizard Draft Persistence & Idempotency
**Goal:** Verify intake drafts save across steps without duplicate records in CMS.

**Pass Criteria:**
- `saveWizardDraft()` updates `IntakeQueue` record keyed on `caseId`.
- Successive saves on Step 1, 2, 3, 4 update the same row (`isDraft: true`).

---

### Test D: BlueBubbles Messaging & 1-Tap Recovery
**Goal:** Verify SMS/iMessage dispatches from verified line `+12399550178`.

**Pass Criteria:**
- `sendBlueBubblesMessage()` should reach Super CRM iMessage (Tailscale to office iMac). Direct `bb.shamrockbailbonds.biz` is legacy and fails on-mesh because of MagicDNS.
- `requestFreshSigningLink()` sends recovery text to the signer.

---

## 2. Studio Device QA (Prompt 19) — Currently Blocked

> [!CAUTION]
> **PROMPT 19 IS BLOCKED:** Do NOT run mobile/tablet visual tests or browser subagents until the Wix Studio visual canvas layout is assembled in a subsequent prompt.

### Queued Prompt 19 Test Matrix:
1. **Mobile Viewport (iPhone / Android 375px–430px):**
   - 1-question-per-screen flow on `/portal-start`.
   - ≥44px touch targets.
   - Sticky mobile emergency call bar (`tel:+12393322245`).
2. **Tablet Viewport (iPad 768px–1024px):**
   - 2-column layout (Left: Case summary card; Right: Wizard steps).
   - Numeric keyboards for currency/phone inputs.
3. **Lobby Kiosk Mode (`/portal-staff`):**
   - 15-second staff walk-in intake builder.
   - Client tablet handoff for finger/Apple Pencil signature.
