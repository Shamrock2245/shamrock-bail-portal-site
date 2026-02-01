# TEST PLAN — Shamrock Bail Bonds Website

> [!CAUTION]
> **STRICT COMPLIANCE REQUIRED**
> This document defines the **ONLY** acceptable test outcomes.
> If a test fails, the feature is **NOT** complete.
> **DO NOT SHIP** until all critical path tests pass.

## 🧪 TEST ENVIRONMENTS
Test across the following configurations to ensure broad compatibility.

| Platform | Browsers | Modes |
| :--- | :--- | :--- |
| **Desktop** | Chrome, Safari, Edge | Normal + Incognito |
| **Mobile** | iOS Safari, Android Chrome | Normal + Incognito |

---

## 🚫 CRITICAL PATH TESTS (BLOCKERS)

### T1 — Homepage Conversion
**Goal:** Immediate connection.
- [ ] Load homepage.
- [ ] Verify phone number is visible within the initial viewport (above the fold).
- [ ] Click the phone number.
- [ ] **PASS**: System triggers `tel:` protocol and logs a `CallLogs` entry.

### T2 — County Selector Flow
**Goal:** Accurate routing.
- [ ] Select a county from the main dropdown (e.g., "Lee").
- [ ] Click "Get Started".
- [ ] **PASS**: User is redirected to `/bail-bonds/lee` (slug matches selection).

### T3 — Dynamic County Page
**Goal:** Localized relevance.
- [ ] Navigate directly to a URL (e.g., `/bail-bonds/collier`).
- [ ] Verify correct county data loads (Name, Sheriff, Clerk, Map).
- [ ] Click "Call Sheriff" and "Call Clerk" buttons.
- [ ] **PASS**: Links work and internal analytics log the county-specific interactions.

### T4 — Mobile Sticky CTA
**Goal:** Persistent access.
- [ ] Open site on a mobile device.
- [ ] Scroll down the page.
- [ ] Verify "Call Now" sticky bar remains visible.
- [ ] Tap the button once.
- [ ] **PASS**: Single tap triggers the call (no double-tap or hover state issues).

### T5 — Member Portal → SignNow
**Goal:** Legal workflow integrity.
- [ ] Log in as a member.
- [ ] Navigate to the "Start Bail" page.
- [ ] Verify "Consent" checkbox is unchecked and button is disabled.
- [ ] Check "Consent".
- [ ] Click "Start Bail Paperwork".
- [ ] **PASS**: User is redirected to the SignNow signing session successfully.

---

## 🛡 DATA INTEGRITY TESTS

### D1 — CMS Field Validation
- [ ] All required fields exist in the live collection.
- [ ] No renamed or broken field keys.
- [ ] Slugs are strictly lowercase (e.g., `sarasota` not `Sarasota`).

### D2 — Analytics Logging
- [ ] `page_view` fires on load.
- [ ] `phone_clicked` fires on call.
- [ ] `bail_started` fires on SignNow handoff.
- [ ] **PASS**: No duplicate events for a single user action.

---

## 🔍 SEO TESTS

### S1 — Meta Tags
- [ ] Every page has a unique Title and Meta Description.
- [ ] Dynamic county pages have county-specific Titles (e.g., "Bail Bonds in Lee County").
- [ ] **PASS**: No "Title" or "Description" placeholders visible in source.

---

## 🛑 FAILURE POLICY
If **ANY** test above fails:
1.  The feature is **INCOMPLETE**.
2.  **STOP** optimization or new feature work.
3.  **FIX** the failure immediately.
4.  **RE-TEST** until Pass.

---

## ✅ SIGN-OFF REQUIREMENT
All tests must **PASS** before:
-   SEO tuning efforts.
-   Paid traffic campaigns.
-   County expansion beyond the pilot group.
