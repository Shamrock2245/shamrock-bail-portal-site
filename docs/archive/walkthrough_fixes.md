# Walkthrough: Bug Fixes and Integration Wiring

I have completed the audit and fixed several critical issues to ensure the system components (SigningLightbox, Wix Backend, Google Apps Script) are correctly wired and functional.

## Changes Made

### 1. `src/lightboxes/SigningLightbox.js`
-   **Fixed:** Removed references to non-existent lightboxes (`ConfirmCancelLightbox`, `SigningHelpLightbox`).
-   **Fixed:** Corrected `trackEvent` usage to match Wix Velo API.
-   **Fixed:** Implemented missing SignNow iframe event handling logic.

### 2. `docs/Code.gs` (New File)
-   **Created:** A comprehensive Google Apps Script file that aggregates all necessary backend logic.
-   **Wiring:** Includes handlers for:
    -   `sendForSignature` (Email, SMS, Kiosk)
    -   `saveSignedDocument` (Webhook callback)
    -   `notifyAdmin` (Webhook callback)
    -   `logDefendantLocation` (Geolocation)
    -   `processCourtEmails` (Court Data)
-   **Action:** You must copy the content of this file into your Google Apps Script project's `Code.gs`.

### 3. `src/pages/portal-defendant.skg9y.js`
-   **Fixed:** Removed calls to non-existent lightboxes (`SignViaEmail`, `SignViaKiosk`).
-   **Implemented:** Connected the buttons to the `initiateSigningWorkflow` backend function.
-   **Wired:** Kiosk button now correctly retrieves a signing URL and opens `SigningLightbox`.

### 4. `src/pages/portal/payment.js`
-   **Fixed:** Removed call to non-existent `ConfirmCancelPayment` lightbox.
-   **Fallback:** Added a direct redirect to dashboard for cancellation.

### 5. `src/lightboxes/ConsentLightbox.js`
-   **Fixed:** Replaced `navigator.geolocation` (browser API) with `wixWindow.getCurrentGeolocation()` (Velo API) for better compatibility and error handling within Wix.

## Verification Checklist

### Google Apps Script
- [ ] Open your Google Apps Script project.
- [ ] Copy the content of `docs/Code.gs` into your `Code.gs` file.
- [ ] Deploy the script as a Web App (Execute as: Me, Access: Anyone).
- [ ] Update the `GAS_WEB_APP_URL` secret in your Wix Secrets Manager if the URL changed.

### Testing the Fixes
1.  **Defendant Portal:**
    -   Go to `/portal-defendant`.
    -   Click "Sign via Email" -> Should show "Sent!" and trigger backend.
    -   Click "Sign via Kiosk" -> Should open the Signing Lightbox with the document.
2.  **Payment Page:**
    -   Go to `/portal/payment`.
    -   Click "Cancel" -> Should redirect to Dashboard.
3.  **Consent Lightbox:**
    -   Test the location permission flow; it should now use the native Wix API.

The system is now aligned and wired together.
