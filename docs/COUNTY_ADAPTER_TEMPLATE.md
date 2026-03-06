# County Adapter Template & Scraper Architecture

Every Florida county jail roster scraper ("The Scout") MUST implement this architectural pattern. By adhering to this strict standard, we ensure that new counties can be deployed without breaking the ingestion pipeline on Google Apps Script.

## 1. Directory Structure
County adapters should be isolated inside the `scripts/scrapers/` or `backend-gas/scrapers/` directory (depending on hosting environment).
Name the file: `[CountyName]_Scraper.js` (or `.py`).

## 2. Required Payload Output (The "Normalized Roster")
No matter how messy the county's HTML or API is, your scraper MUST normalize the data into this exact JSON array before sending it to the central Shamrock webhook (or appending to Google Sheets):

```json
[
  {
    "County": "Lee",
    "Booking_Number": "26-004321",
    "Booking_Date": "2026-03-05T14:30:00Z",
    "First_Name": "John",
    "Last_Name": "Doe",
    "DOB": "1990-05-15",
    "Race": "W",
    "Sex": "M",
    "Total_Bond": 5500,
    "Charges": [
      {
        "Description": "GRAND THEFT AUTO",
        "Statute": "812.014",
        "Bond_Amount": 5000,
        "Degree": "F3"
      },
      {
        "Description": "RESISTING W/O VIOLENCE",
        "Statute": "843.02",
        "Bond_Amount": 500,
        "Degree": "M1"
      }
    ]
  }
]
```

## 3. Mandatory Scraper Lifecycle Functions
Your adapter must implement these three logical phases:

### Phase 1: `initializeSession()`
- **Purpose**: Bypass Cloudflare, acquire cookies, or generate a valid `.ASPXAUTH` token.
- **Fail State**: If Cloudflare blocks the request, this function must return a specific `403_BLOCKED` error code so the central runner can pause for 15 minutes instead of hammering the server.

### Phase 2: `fetchRoster(sessionData)`
- **Purpose**: Get the master list of today's arrests.
- **Rules**: **Only pull arrests from the last 24-48 hours.** Do not pull the entire jail population unless absolutely required by the search form structure.

### Phase 3: `getArrestDetails(bookingUrl, sessionData)`
- **Purpose**: For Tier 2/Tier 3 counties that hide charges or bond amounts behind a click, this function navigates to the detail page.
- **Rules**: You MUST implement an arbitrary delay (e.g., `sleep(2000)`) between each call to this function to avoid aggressive rate-limiting and getting our IP banned by the Sheriff's IT team.

## 4. Data Extraction Best Practices
- **Null Safety**: If a county does not provide `Weight`, `Eye Color`, or `Statute`, map it to `null`. Do not crash the payload parser.
- **Bond Summation**: If a defendant has 3 charges ($1000, $500, $0 ROR), the scraper must accurately sum the `Total_Bond` ($1500) before transmission. "No Bond" or "Hold" states must be flagged clearly so "The Analyst" AI can disqualify the lead.

## 5. Error Handling & Slack Escalation
Do not swallow errors silently. If the DOM changes and your query selector fails to find the target element, catch the exception, dump a truncated HTML snippet to the logs, and throw a `SchemaValidationError`.
Automated runner scripts will catch this and send an alert to `#intake-alerts`: `[Scout: Sarasota] DOM Parsing Failed. Requires human intervention.`
