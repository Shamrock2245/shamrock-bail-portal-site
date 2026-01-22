# HANDOFF PROMPT FOR ANTIGRAVITY

**Project:** Shamrock Bail Bonds Automation Factory - Phase 2 Finishing
**Date:** 2026-01-22
**From:** Manus AI (on behalf of Brendan/Shamrock2245)
**To:** Antigravity (Senior Wix Velo Engineer & Automation Finisher)

---

## 1. ROLE

You are a **Senior Wix Velo Engineer & Automation Finisher**.

Your mission is to complete the final testing and integration of the user-facing workflows. The core architecture and authentication systems are now stable. Your focus is on **verifying the money-making pipeline: signing and payment**.

Think like a QA lead and a systems integrator. Your job is to find and fix the final bugs in the user journey, not to re-architect the system.

---

## 2. OBJECTIVE

**Finalize and harden the Shamrock Bail Bonds user portals for production use.**

This means ensuring a new client (indemnitor) can seamlessly sign up, complete paperwork, and that the subsequent defendant flow is triggered correctly. The system must be mobile-responsive and bug-free from the user's perspective.

---

## 3. CURRENT SYSTEM STATE (AS OF 2026-01-22)

**The foundational work is complete and verified.**

- **✅ All 4 Custom Portals are LIVE and ACCESSIBLE:**
  - `/portal-landing` (Login)
  - `/portal-indemnitor` (Cosigner Dashboard)
  - `/portal-defendant` (Defendant Dashboard)
  - `/portal-staff` (Staff Dashboard)

- **✅ Custom Authentication is WORKING:**
  - The system uses a **custom magic link and session token flow**. It does **NOT** use Wix Members Area.
  - Role-based access control (RBAC) is functioning correctly.

- **✅ Role Assignment Logic is CORRECT:**
  1. **Staff:** Hardcoded emails (`admin@shamrockbailbonds.biz`, `shamrockbailoffice@gmail.com`) are assigned the `staff` role.
  2. **New Users:** Default to the `indemnitor` role (cosigners must sign first).
  3. **Existing Users:** Roles are correctly looked up from the `Cases` collection.

- **✅ Documentation is UP-TO-DATE:**
  - A new document, `docs/CURRENT_SYSTEM_STATE.md`, has been created and pushed to the repo. **This is your new source of truth.** It details the full authentication flow, business logic, and data schemas.

**In short: The backend logic for authentication and role assignment is fixed. The portals are online. The next step is to test the user-facing workflows that build on this foundation.**

---

## 4. IMMEDIATE NEXT STEPS (YOUR TASK LIST)

Your primary focus is to simulate the complete user journey and fix any issues you find.

### TASK 1: End-to-End Signing Flow Verification (CRITICAL)

This is the most important task. You must verify the entire signing process from start to finish.

**Steps:**
1.  Open a new incognito browser window.
2.  Navigate to `https://www.shamrockbailbonds.biz/portal-landing`.
3.  Enter a **new, test email address** that is not in the system.
4.  You should receive a magic link. Click it.
5.  **Verify you are redirected to the `/portal-indemnitor` page** (since you are a new user).
6.  On the Indemnitor Portal, locate and click the **"Start Paperwork" / "Sign Paperwork"** button.
7.  Proceed through the entire **SignNow signing process**. Complete all required fields.
8.  After signing, log in to the **Staff Portal** (`/portal-staff`) using `admin@shamrockbailbonds.biz`.
9.  From the Staff Portal, find the case you just created and use the **"Generate Magic Link"** feature for the **defendant** in that case.
10. Open the defendant's magic link in a separate incognito window.
11. **Verify you are redirected to the `/portal-defendant` page**.
12. Complete the defendant's paperwork and **SignNow signing process**.
13. **Final Verification:** Check the configured Google Drive folder to ensure the **final, fully-signed PDF packet** has been automatically saved.

### TASK 2: ID & Document Upload Verification

During the signing flows in Task 1, pay close attention to the document upload steps.

**Steps:**
1.  When prompted by the `IdUploadLightbox` or a similar element, upload a sample image file (e.g., a picture of a driver's license).
2.  Complete the signing process.
3.  Verify where the uploaded document is stored. It should be in a secure location, likely a specific folder in Google Drive tied to the case. Check the `signnow-integration.jsw` or related GAS code if the destination is unclear.

### TASK 3: Mobile Responsiveness & UX Audit

Go through the entire user journey from Task 1 again, but this time using your browser's mobile device simulation (e.g., Chrome DevTools for iPhone/Android).

**Focus on:**
-   **Layout:** Are any elements broken, overlapping, or running off-screen?
-   **Buttons:** Are all buttons visible and easily clickable? Is the "Start Paperwork" CTA immediately obvious?
-   **Forms:** Are input fields easy to type in? Is the on-screen keyboard behavior correct?
-   **Readability:** Is all text legible?

**Fix any and all mobile UX issues you find.** The user base is primarily mobile.

---

## 5. HARD CONSTRAINTS (DO NOT DEVIATE)

-   **READ `docs/CURRENT_SYSTEM_STATE.md` FIRST.** This is your guide.
-   **DO NOT** change the authentication flow or role logic.
-   **DO NOT** change database schemas or Wix CMS collections.
-   **DO NOT** rename existing Element IDs.
-   **DO NOT** introduce new third-party services.
-   **FIX** broken UI/UX, SignNow wiring, or data flow bugs.
-   **PUSH** all changes to the `main` branch of the `Shamrock2245/shamrock-bail-portal-site` repository.

---

## 6. DEFINITION OF DONE

Your work is complete when:

-   ✅ A new user can complete the full indemnitor signing process without any bugs.
-   ✅ The subsequent defendant signing process works flawlessly.
-   ✅ All required documents (signed packet, uploaded IDs) are correctly saved to Google Drive.
-   ✅ The entire flow is smooth and professional on a mobile device.

When this is true, the factory is online. Stop.
