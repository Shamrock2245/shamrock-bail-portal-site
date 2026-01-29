# Shamrock Bail Bonds - GAS Project Definitive Guide

This document serves as the master reference for the Google Apps Script (GAS) backend and the associated Google Sheets workbook.

## 1. Google Sheets Workbook Overview

| Tab Name | Purpose | Logic Source | Status/Notes |
| :--- | :--- | :--- | :--- |
| **Posted Bonds** | Historical bond records. | **Manual Entry** | Maintained manually by staff. |
| **Dashboard** | Visual overview for the portal. | `QualifiedTabRouter.js` (Future) | **Actively being fixed.** Currently blank/misused. Will be populated by new logic. |
| **Shamrock_Arrests_Master** | The "Qualified" leads master list. | `QualifiedTabRouter.js` | **Automated.** Populated by `scoreAndSyncQualifiedRows`. Enforces strict 35-col schema. |
| **Qualified_exceptions** | Leads requiring manual review (>3 charges, multi-case). | `QualifiedTabRouter.js` | **Automated.** Catch-all for complex records that break the strict master schema. |
| **IntakeQueue** | Incoming indemnitor/defendant forms from Wix. | `Code.js` -> `handleIntakeSubmission` | **Automated.** Receives payloads from Wix Portal. |
| **Bookings** | Database of known bookings/cases. | `Code.js` -> `saveBookingData` | **Automated.** Serves as the "source of truth" for recent cases and contact lookups. |
| **Discharges** | Log of bond discharges parsed from emails. | `CourtEmailProcessor.js` | **Automated** (but brittle). Parses emails/PDFs. Needs improvement for data extraction. |
| **Forfeitures** | Log of bond forfeitures parsed from emails. | `CourtEmailProcessor.js` | **Automated.** Tracks bond forfeiture notices. |
| **Upcoming Court Dates**| Log of court dates found in emails. | `CourtEmailProcessor.js` | **Automated.** Calendar events are also created from this data. |
| **[County Tabs]** | Raw data scraped from county websites. | `ArrestScraper_[County].js` | **Automated.** Source data for the router. (Lee, Collier, etc.) |
| **Manual_Bookings** | Legacy or Manual logging. | `Code.js` (legacy) | Unclear if currently active. Automation might still trigger it. |
| **Logs** | System operation logs. | `SecurityLogger.js` / `Code.js` | General purpose logging. |
| **DeSoto_From_Dashboard**| Backup of old Dashboard data. | `QualifiedTabRouter.js` | Archive created during remediation. |

---

## 2. Deep Dive: Key Tabs & Logic

### A. Shamrock_Arrests_Master (The "Qualified" List)
*   **Logic:** `QualifiedTabRouter.js` → `scoreAndSyncQualifiedRows()`
*   **Process:**
    1.  Scans every County Tab (Lee, Collier, etc.).
    2.  Filters by `Lead_Score >= 70` (Hot Leads).
    3.  **Deduplicates** based on `County + Booking Number`.
    4.  **Normalizes** data into a strict 35-column schema.
    5.  **Splits Charges** into `Charge_1`...`Charge_3` columns.
    6.  **Exceptions:** If a lead has >3 charges or comma-separated Case Numbers, it routes to `Qualified_exceptions` instead.

### B. IntakeQueue
*   **Logic:** `Code.js` -> `handleIntakeSubmission(payload)`
*   **Issue:** `References` column showing `[]`.
*   **Cause:** The payload sent from the Wix Portal (`portal-indemnitor`) likely has an empty `references` array.
*   **Fix:** Ensure the frontend sends the references data structure correctly. The backend just stores what it receives.

### C. Discharges
*   **Logic:** `CourtEmailProcessor.js` → `processDischargeEmail(message)`
*   **Issue:** Missing names and details.
*   **Details:** The script attempts to parse PDF attachments using OCR (or text extraction).
    *   *Weakness:* Formatting changes in court emails/PDFs break the regex matchers.
    *   *Status:* Needs a "Robust PDF Parsing" project to improve accuracy.

### D. Qualified_Schema_Queue / Qualified_exceptions
*   **Observation:** You mentioned "Qualified_Schema_Queue".
*   **Status:** A tab named exactly `Qualified_Schema_Queue` is not currently targeted by the scripts. It is likely the user-friendly name for `Qualified_exceptions` or a legacy manual tab.
*   **Config:** The router writes to `Qualified_exceptions`.

---

## 3. Automation Scripts Map

| Script File | Responsibility |
| :--- | :--- |
| `Code.js` | **Core Backend.** Handles Web App `doPost`/`doGet`, SignNow, Intake, and Wix integration. |
| `QualifiedTabRouter.js` | **Routing Engine.** Moves data from County Sheets -> Master/Exception tabs. |
| `CourtEmailProcessor.js`| **Email Bot.** Reads Gmail -> Updates Calendar & Discharges/Forfeitures Sheets. |
| `ArrestScraper_*.js` | **Scrapers.** Fetch data from county sites -> County Sheets. |
| `LeadScoringSystem.js` | **Deprecated.** Logic moved to Router. Safe to ignore/archive. |

## 4. Next Steps
1.  **Fix Dashboard Headers:** Run `setDashboardHeaders()` in GAS (added to `QualifiedTabRouter.js`).
2.  **Verify Intake References:** We will inspect the Wix frontend payload to ensure references are sent.
3.  **Improve Discharges:** Future task to upgrade PDF parsing logic.
