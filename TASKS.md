# 📋 Project Tasks & Roadmap

> **Mission:** Build the "Uber of Bail Bonds" for Florida. High-speed, AI-powered, and fully compliant.

---

## ✅ Phase 1: Foundation & Security (Complete)
- [x] **Monorepo Migration:** Unified Wix Velo + GAS backend.
- [x] **Security Audit:** PII Redaction, Secret Manager Integration (`GAS_WEB_APP_URL`).
- [x] **Compliance:** SOC II logging patterns implemented.
- [x] **Handoff:** `FINAL_DEPLOYMENT_HANDOFF.md` created.

## ✅ Phase 2: Core Portals (Complete)
- [x] **Indemnitor Portal:** Financial Indemnity Form + SignNow Lightbox.
- [x] **Defendant Portal:** Appearance Application + GPS Check-in.
- [x] **Magic Links:** Secure, session-based auth (No passwords).
- [x] **PDF Engine:** Automated layout mapping for precise court forms.

## ✅ Phase 3: AI Concierge & RAG (Complete)
- [x] **Gemini 1.5 Integration:** Wired `RAGService.js` to Google AI.
- [x] **Knowledge Base:** Expanded to 12+ Counties (Lee, Collier, Manatee, etc.).
- [x] **SMS Agent:** "Headless" concierge that monitors leads and texts intelligently.
- [x] **Config:** Secure API Key rotation (`SAFE_updateGeminiKey`).

---
## ✅ Phase 3.5: Maintenance & Payment Features (Complete)
- [x] **GAS Project Guide:** Definitive documentation (`GAS_Project_Guide.md`).
- [x] **Backend Fixes:** `IntakeQueue` reference logic & Tab Routing cleanup.
- [x] **Universal Payment Link:** Integrated SwipeSimple into Portals, SMS, and Email workflows.
- [x] **Dashboard:** Repaired tab structure and added headers.
- [x] **Liability Display:** Fixed hardcoded $50k placeholder; made dynamic.

---

## 🚧 Phase 4: System Verification (Current Focus)
*Ref: [TESTING_GUIDE.md](./TESTING_GUIDE.md)*

- [ ] **Test 1: Happy Path** (Lee County / High Urgency)
    - [ ] Submit Intake -> Receive AI SMS -> Click SignNow Link.
- [ ] **Test 2: Northern Expansion** (Manatee/Pinellas)
    - [ ] Verify AI knows the specific jail locations/rules.
- [ ] **Test 3: Education Flow**
    - [ ] Verify Bail School certificate generation.

---

## 🧹 Technical Debt & Compliance (Consolidated)
- [x] **Audit Element IDs**: Check `masterPage.js` and `Home` against canonical IDs.
- [x] **Schema Verify**: Check `FloridaCounties` against Foundation Spec.
- [x] **SignNow Wiring**: Confirm "Start Bail" button ONLY activates after Consent + Login.
- [x] **Mobile Sticky CTA**: Verify `#stickyMobileCTA` behavior (Updated ID to canonical).
- [x] **Error Boundaries**: Add UI for "County Not Found".

---

## 🔮 Phase 5: "Bail School" & Scale
- [ ] **Landing Page:** Design high-converting registration page (`/bail-school`).
- [ ] **Video Integration:** Embed verified educational content.
- [ ] **Certificate:** Auto-issue PDF upon completion.
