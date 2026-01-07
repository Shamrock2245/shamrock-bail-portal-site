# Final Deployment Instructions (v3.4.1)

## 1. Feature Branch Pushed
All changes, including the robust backend and portal fixes, are pushed to:
`feature/full-portal-wiring`

## 2. Google Apps Script Update
The file `docs/Code.gs` in your repo now contains **Version 3.4.1** of the backend.

**Critical Step:**
1.  Open your [Google Apps Script Project](https://script.google.com/).
2.  Open `Code.gs`.
3.  **Replace all content** with the content from `docs/Code.gs` in this repository.
4.  **Save** and **Deploy** > **New Deployment** > **Web App**.
5.  Copy the **New Web App URL**.

## 3. Wix Configuration
1.  Go to the Wix Dashboard > **Settings** > **Secrets Manager**.
2.  Update `GAS_WEB_APP_URL` with the new URL from step 2.

## 4. GitHub Merge
1.  Go to GitHub and open a **Pull Request** from `feature/full-portal-wiring` to `main`.
2.  Review the changes (34 files).
3.  **Merge** the Pull Request.

## What's New in v3.4.1?
-   **Retry Logic:** Backend calls now self-heal from transient network errors.
-   **Auto-Cleanup:** "Orphan" documents are automatically deleted if sending fails.
-   **Kiosk/SMS Fallback:** The system explicitly generates embedded links as a backup for SMS/Kiosk modes to prevent "Link Missing" errors.
-   **Full Scraper Integration:** All your county scrapers (`runLeeScraper`, etc.) are fully preserved and integrated.
