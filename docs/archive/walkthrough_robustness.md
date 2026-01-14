# Walkthrough: Robustness Improvements

To improve the resilience of the Shamrock Bail Portal, I have implemented exponential backoff retry logic for critical backend integration calls.

## Changes Made

### 1. `src/backend/utils.jsw` (New File)
-   **Added:** `fetchWithRetry` function that wraps `wix-fetch`.
-   **Logic:** Retries failed requests (network errors, 5xx server errors, 429 rate limits) up to 3 times with exponential backoff. 4xx client errors are not retried.

### 2. `src/backend/location.jsw`
-   **Updated:**
    -   Reverse geocoding calls to Google Maps API now use `fetchWithRetry`.
    -   Logging location data to Google Apps Script now uses `fetchWithRetry`.
-   **Benefit:** Transient network glitches or rate limits will be handled gracefully without crashing the user's check-in flow.

### 3. `src/backend/signing-methods.jsw`
-   **Updated:**
    -   Calls to the Google Apps Script backend (`callGasBackend`) now use `fetchWithRetry`.
-   **Benefit:** Initiating text/email signing workflows is more reliable.

## Verification

1.  **Deployment:** Deploy the site to apply the backend changes.
2.  **Location Test:**
    -   Use the Defendant Portal "Check In" button.
    -   (Optional) If you can simulate a network flake, observe the console for "Retrying..." logs.
3.  **Signing Test:**
    -   Use the "Sign via Email" button.
    -   Ensure the process completes successfully even with minor network latency.

The system is now more resilient to external API failures.
