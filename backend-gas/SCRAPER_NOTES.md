# Scraping Architecture & Notes

> **Source of Truth**: The scripts in this folder (`backend-gas/`) are the definitive source for scraping logic.
> **Execution Environment**: Google Apps Script (Server-side).

## 1. Lee County (Gold Standard)
**File**: `ArrestScraper_LeeCounty.js`
**Target**: `sheriffleefl.org`

### Architecture
- **Type**: Single Page Application (SPA) consuming a JSON API.
- **Method**: Direct HTTP calls to the backend API endpoints.
- **Workflow**:
  1.  `fetchArrestsFromApi_`: Queries `/public-api/bookings` with date ranges.
  2.  `enrichWithChargesApi_`: Iterates through bookings and calls `/public-api/bookings/{id}/charges` for details.
  3.  `upsertStrict_`: Loads data into the "Lee" Google Sheet using `Booking_Number` as a unique key.
- **Strengths**: High reliability, structured JSON data, no HTML parsing needed.
- **Weaknesses**: Rate limiting (handled by backoff logic).

## 2. Collier County
**File**: `ArrestScraper_CollierCounty.js`
**Target**: `www2.colliersheriff.org/arrestsearch/`

### Architecture
- **Type**: ASP.NET WebForms (Classic server-side rendering).
- **Method**: HTML Parsing via `UrlFetchApp`.
- **Challenges**:
  - Uses `VIEWSTATE` and `EVENTVALIDATION` hidden fields.
  - Requires Cookie maintenance between requests (`Set-Cookie` header).
  - Data is locked in HTML tables, not JSON.
- **Workflow** (Refactored):
  1.  `GET` the search page to extract cookies and hidden input tokens.
  2.  `POST` a search request (simulating "Today's Arrests" button click).
  3.  `parseFirstHtmlTableToRows_`: Extracts text from the <table> results.
  4.  `normalizeCollierRecord_`: Maps the table columns to the standard 35-column schema.
  5.  `upsertStrict_`: Saves to "Collier" Google Sheet.

## 3. Universal Bookmarklet (AI Agent)
**File**: `dashboard.html` (frontend logic) + `AI_BookingParser.js` (backend)

### Architecture
- **Type**: Human-assisted AI Scraping.
- **Use Case**: Any county not covered by a dedicated scraper.
- **Workflow**:
  1.  User clicks bookmarklet on a sheriff's page.
  2.  Redirects to Portal with the target URL.
  3.  Portal triggers "The Clerk" (AI Agent).
  4.  Agent fetches the page (via `UrlFetchApp` or Puppeteer service if configured) and extracts arrest data.

## Best Practices & project Constraints
1.  **UrlFetchApp**: Native GAS fetcher. Respects quotas.
2.  **ETL Pattern**:
    - **Extract**: Get raw data (JSON or HTML).
    - **Transform**: Normalize into a standard object (Date objects, Title Case strings).
    - **Load**: Upsert into Google Sheet. **Never duplicate rows.**
3.  **Schema**: All scrapers must target the **35-column standard** defined in `headers_()` to ensure compatibility with `QualifiedTabRouter.js`.
