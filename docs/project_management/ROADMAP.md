# OPERATIONAL ROADMAP — "Race to Live"
**Status**: ACTIVE
**Authority**: Aligned with [ANTIGRAVITY-FOUNDATION-SPEC.md](../ANTIGRAVITY-FOUNDATION-SPEC.md)

This roadmap focuses exclusively on the tasks required to reach the **Definition of Done** and **Definition of Success** for the Shamrock Bail Bonds portal.

---

## 🟥 PH0: SURVIVAL & COMPLIANCE (IMMEDIATE)
**Goal**: The site must exist, load, and follow the new laws.

- [ ] **Spec Audit**: Verify existing `masterPage.js` and `home` page code against [ELEMENT-ID-CHEATSHEET.md](../specs/ELEMENT-ID-CHEATSHEET.md).
- [ ] **SignNow Hardening**: Verify the handoff sequence (Login -> Consent -> Start) is technically mandated by the code.
- [ ] **Secret Check**: Scan all frontend code for hardcoded API keys and move to Secrets Manager if found.
- [ ] **Schema Validation**: Verify `FloridaCounties` and `CallLogs` collections match the [Foundation Spec Section 5](../ANTIGRAVITY-FOUNDATION-SPEC.md#5-cms-is-an-operational-database-not-marketing-content).

## 🟨 PH1: CORE FUNCTIONALITY (BLOCKERS)
**Goal**: The "Panicked Mobile User" flow works perfectly.

- [ ] **T1 Homepage Conversion**: Verify `#phoneNumber` is clickable and visible in <3s on mobile.
- [ ] **T2 County Routing**: Verify dropdown redirects to `/bail-bonds/{slug}`.
- [ ] **T3 Dynamic Logic**: Ensure `/bail-bonds/{slug}` loads the correct Tier content (Phone, Sheriff, Clerk).
- [ ] **T4 Mobile CTA**: Implement/Verify the Sticky Bottom CTA on mobile view.

## 🟩 PH2: CONTENT & SEO DOMINANCE
**Goal**: All 67 Counties exist and rank.

- [ ] **Data Fill**: Populate `FloridaCounties` with data for all 67 counties (names, phones, slugs).
- [ ] **Meta Automation**: Ensure Dynamic Page SEO settings pull from `FloridaCounties` (MetaTitle, Description).
- [ ] **Tier Implementation**: Hide empty fields for Tier 2/3 counties (avoid "null" text on screen).

## 🟦 PH3: ANALYTICS & LOGGING
**Goal**: We know what is happening.

- [ ] **Call Log Wiring**: Ensure `callShamrockBtn` and `#phoneNumber` clicks trigger `logCall()` backend function.
- [ ] **Source Tracking**: Verify `wix-window.referrer` is captured and stored in `CallLogs`.

## ✅ PH4: FINAL VERIFICATION
**Goal**: Green light for paid traffic.

- [ ] **Run Test Plan**: Execute every step in [TEST-PLAN.md](../specs/TEST-PLAN.md).
- [ ] **Console Sweep**: Fix all red/yellow console errors.
- [ ] **User Acceptance**: Member login -> SignNow flow audit.

---

## 🔮 POST-LAUNCH (NEXT)
- Scraper Integration (Tier 1 Counties)
- Advanced Lead Scoring
- Portal Dashboard Enhancements
