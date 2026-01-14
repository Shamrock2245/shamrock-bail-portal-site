# Walkthrough: Robustness Improvements (Version 3.0)

To ensure "first try" success and minimize manual intervention, I have implemented extensive contingencies in the GAS backend (`Code.gs`).

## Key Contingencies Added

### 1. Auto-Clean Orphan Documents
-   **If Sending Fails:** If the document uploads successfully but the invitation or link creation fails, the system now **automatically deletes the document** from SignNow. This prevents "orphan" documents from cluttering your account and confusing the workflow.

### 2. Internal Retry Logic (`retryOp`)
-   **Exponential Backoff:** All critical SignNow API calls (Upload, Invite, Create Link, Download, Status) and Google Sheets operations are wrapped in a retry mechanism.
-   **Behavior:** If a call fails (e.g., transient network error, rate limit), it waits 1s, then 2s, then 4s before trying again. It gives up only after 3 failed attempts.

### 3. Smart Link Generation
-   **Pre-Invite Check:** Before creating an embedded link (Kiosk mode), the system attempts to send an invite first. If the invite already exists (often the case with re-tries), it catches the error and proceeds, preventing "Invite Missing" blockers.

## Updated Files

### `docs/Code.gs` (Version 3.0)
-   Contains the full `retryOp` implementation.
-   Contains `signNowDeleteDocument` for cleanup.
-   Updated `handleSendForSignature` with try-catch-cleanup block.

## Action Required

1.  **Open Google Apps Script Project.**
2.  **Paste** the entire content of `docs/Code.gs` (Version 3.0) into your project's code editor.
3.  **Save** and **Deploy** as Web App.

The system is now hardened against transient failures and data inconsistency.
