# SWFL Arrest Scraper Evaluation & Automation Plan

**Date:** January 30, 2026
**Subject:** Feasibility of automating 11+ county scrapers

## 1. Executive Summary

We evaluated the `swfl-arrest-scrapers` repository found in your local environment.
*   **Total Counties Found:** 11+ (including Hendry, Charlotte, Sarasota, Pinellas, Polk, etc.)
*   **Technology:** Python + browser automation (`DrissionPage`, `Selenium`).
*   **GAS Compatibility:** ❌ **Not Compatible**. These scripts require a full browser environment (to bypass Cloudflare/Javascript challenges) and cannot run on the standard Google Apps Script runtime.
*   **Automation Solution:** ✅ **GitHub Actions**. The repository *already contains* pre-configured automation workflows for these counties.

## 2. County Status Matrix

| County | Status | Engine | Automation Ready? | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Collier** | 🟢 **Done** | GAS (Native) | ✅ Active | Ported to GAS (Code.js) |
| **Lee** | 🟢 **Done** | GAS (Native) | ✅ Active | Ported to GAS (Code.js) |
| **Hendry** | 🟢 **Working** | Python (Drission) | ✅ Via GitHub | `scrape_hendry.yml` exists |
| **DeSoto** | 🟢 **Working** | Node.js (Puppeteer)| ✅ Via GitHub | `scrape_desoto.yml` exists |
| **Charlotte** | 🔴 **Blocked** | Python (Drission) | ⚠️ CAPTCHA | Workflows exist but fail on Turnstile |
| **Sarasota** | 🔴 **Blocked** | Python (Drission) | ⚠️ CAPTCHA | Workflows exist but fail on Turnstile |
| **Pinellas** | 🟡 **Code Exists**| Python (Selenium)| 🛠 Config Needed | `pinellas_solver.py` exists |
| **Polk** | 🟡 **Code Exists**| Python (Drission) | 🛠 Config Needed | `polk_solver.py` exists |
| **Manatee** | 🟡 **Needs API** | Python (Request) | 🛠 Config Needed | Needs mobile API endpoint |

## 3. Automation Plan (Immediate Actions)

To get the "Working" counties (Hendry, DeSoto) on a schedule immediately, you do **not** need to write new code. You simply need to activate the existing GitHub Actions.

### Step 1: Configure GitHub Secrets
Go to the **Settings > Secrets and variables > Actions** tab of your `swfl-arrest-scrapers` GitHub repository and add:

1.  `GOOGLE_SERVICE_ACCOUNT_KEY`: The full JSON content of your GCP Service Account Key (the one that has edit access to your Google Sheet).
2.  `GOOGLE_SHEETS_ID`: The ID of your Master Arrests Google Sheet.
3.  `SLACK_WEBHOOK_URL` (Optional): For failure notifications.

### Step 2: Enable Workflows
1.  Go to the **Actions** tab in GitHub.
2.  Select **Scrape Hendry** and click **Enable Workflow** (if disabled).
3.  Select **Scrape DeSoto** and click **Enable Workflow**.
4.  These are currently scheduled to run **every 12 hours** (cron: `0 */12 * * *`).

### Step 3: Verify Data Flow
*   The scripts are configured to write directly to the `GOOGLE_SHEETS_ID` you provide.
*   They use `gspread` (Python) or `google-spreadsheet` (Node) to upsert rows.
*   **Note:** Ensure your Service Account email (from the JSON key) is an **Editor** on the target Google Sheet.

## 4. Recommendation for Blocked Counties

For **Charlotte** and **Sarasota**:
*   They use Revize CMS with Cloudflare Turnstile.
*   The current Python scripts (`charlotte_solver.py`) attempt to use `DrissionPage` to bypass this.
*   **Action:** Run the GitHub Action manually once to see if the latest `DrissionPage` update can bypass the current CAPTCHA difficulty. If it fails, these will require a paid solving service (e.g. 2Captcha) integrated into the Python script.

## 5. Summary
You have a powerful, pre-built automation suite waiting in `swfl-arrest-scrapers`. **Do not try to port these to GAS.** It will be a massive effort with lower reliability due to Cloudflare. Use the provided GitHub Actions.
