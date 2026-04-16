# 📊 Data Schemas

> **Last Updated:** April 16, 2026

This document defines the canonical data structures used across the Shamrock ecosystem.

---

## 1. Arrest Record — The Master 34

The primary data object used by scrapers. Every script **MUST** output these columns. Dedup key: `Booking_Number + County`.

| # | Column | Type | Required | Notes |
|---|--------|------|----------|-------|
| 1 | `Scrape_Timestamp` | ISO Date | ✅ | When the record was scraped |
| 2 | `County` | String | ✅ | Lowercase (e.g., `"lee"`) |
| 3 | `Booking_Number` | String | ✅ | **Primary Key** (with County) |
| 4 | `Person_ID` | String | | County-specific person ID |
| 5 | `Full_Name` | String | ✅ | `"LAST, FIRST MIDDLE"` |
| 6 | `First_Name` | String | ✅ | Title Case |
| 7 | `Middle_Name` | String | | Title Case |
| 8 | `Last_Name` | String | ✅ | Title Case |
| 9 | `DOB` | String | | `YYYY-MM-DD` |
| 10 | `Booking_Date` | String | ✅ | `YYYY-MM-DD` |
| 11 | `Booking_Time` | String | | `HH:MM` |
| 12 | `Status` | String | | In Custody / Released / etc. |
| 13 | `Facility` | String | | Jail name |
| 14 | `Race` | String | | Single char: W/B/H/A/O |
| 15 | `Sex` | String | | M/F |
| 16 | `Height` | String | | `5'11"` |
| 17 | `Weight` | String | | `180` |
| 18 | `Address` | String | | Street address |
| 19 | `City` | String | | |
| 20 | `State` | String | | 2-letter abbreviation |
| 21 | `ZIP` | String | | 5-digit |
| 22 | `Mugshot_URL` | String | | Direct image URL |
| 23 | `Charges` | String | | Pipe-separated: `"DUI \| DWLS"` |
| 24 | `Bond_Amount` | Number | ✅ | Total bond in dollars (numeric only) |
| 25 | `Bond_Paid` | String | | `YES` / `NO` |
| 26 | `Bond_Type` | String | | SURETY / CASH / ROR |
| 27 | `Court_Type` | String | | |
| 28 | `Case_Number` | String | | |
| 29 | `Court_Date` | String | | `YYYY-MM-DD` |
| 30 | `Court_Time` | String | | `HH:MM` |
| 31 | `Court_Location` | String | | |
| 32 | `Detail_URL` | String | | Link to booking detail page |
| 33 | `Lead_Score` | Number | | 0-100 (auto-calculated) |
| 34 | `Lead_Status` | String | | Hot / Warm / Cold / Disqualified |

---

## 2. Wix CMS Collections

### IntakeQueue (Primary Intake Collection)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `caseId` | TEXT | ✅ | Unique case identifier (e.g., `CASE-2026-001234`) |
| `defendantName` | TEXT | ✅ | Full defendant name |
| `defendantEmail` | TEXT | | Defendant email |
| `defendantPhone` | TEXT | | Defendant phone (E.164) |
| `indemnitorName` | TEXT | ✅ | Co-signer name |
| `indemnitorEmail` | TEXT | ✅ | Used for SignNow + magic link auth |
| `indemnitorPhone` | TEXT | | |
| `county` | TEXT | | Where arrest occurred |
| `arrestDate` | DATETIME | | Date/time of arrest |
| `charges` | TEXT | | Comma-separated or JSON |
| `bondAmount` | NUMBER | | Total bond amount |
| `premiumAmount` | NUMBER | | Premium charged (typically 10%) |
| `documentStatus` | TEXT | ✅ | pending → sent → signed → completed |
| `signNowDocumentId` | TEXT | | SignNow tracking ID |
| `signNowStatus` | TEXT | | pending / signed / declined |
| `gasSyncStatus` | TEXT | | pending / synced / error |
| `gasSyncTimestamp` | DATETIME | | Last sync timestamp |
| `status` | TEXT | ✅ | intake → in_progress → completed → cancelled |
| `completedTimestamp` | DATETIME | | When case was fully processed |
| `notes` | TEXT | | Additional notes |

**Permissions:** ADMIN-only for all CRUD operations.

### Other Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `FloridaCounties` | County data for router | `countyName`, `slug`, `isActive`, `bookingWebsite`, `jailAddress` |
| `ArrestLeads` | Live leads for portal | Matches Master 34 schema |
| `PortalSessions` | Magic link sessions | `sessionId`, `email`, `expiresAt`, `memberId` |
| `MagicLinks` | Auth link tracking | `token`, `email`, `caseId`, `used` |
| `PendingDocuments` | Pre-signing docs | `caseId`, `documentType`, `status` |
| `MemberDocuments` | Post-signing docs | `caseId`, `memberId`, `signedUrl` |
| `AnalyticsEvents` | System tracking | `eventType`, `memberId`, `properties`, `timestamp` |

---

## 3. Google Sheets Tabs

| Tab | Purpose | Key Columns |
|-----|---------|-------------|
| `IntakeQueue` | Intake pipeline | Mirrors Wix IntakeQueue |
| `ShannonCallLog` | Voice AI transcripts | `callId`, `timestamp`, `transcript`, `disposition` |
| `PaymentLog` | SwipeSimple payments | `caseId`, `amount`, `date`, `method` |
| `CheckInLog` | Client check-ins | `caseId`, `type`, `timestamp`, `location` |
| `Ingestion_Log` | Scraper audit trail | `county`, `count`, `timestamp`, `errors` |
| `Qualified_Arrests` | Scored leads (≥70) | Subset of Master 34 |
| `{County}_Arrests` | Per-county raw data | Full Master 34 |

---

## 4. API Response Schemas

### GAS Standard Response
```json
{
  "success": true,
  "action": "submitIntake",
  "data": { ... },
  "error": null
}
```

### Geocoding Response
```json
{
  "success": true,
  "county": "lee",
  "confidence": 0.95,
  "method": "gps"
}
```

### Lead Score Response
```json
{
  "score": 85,
  "reasoning": "Local FL resident, misdemeanor charges only, recent booking."
}
```

---

## 5. Schema Rules

1. **Never rename IntakeQueue fields** without a full migration plan.
2. **Dedup key** for arrest records is always `Booking_Number + County`.
3. **Dates** in backends use ISO 8601. Display uses `MM/DD/YYYY`.
4. **Phone numbers** use E.164 (`+1XXXXXXXXXX`) in storage, `(XXX) XXX-XXXX` in display.
5. **Bond amounts** are always numeric (no `$`, no commas).
6. **`indemnitorEmail`** is the critical key linking magic links → signing → case records.
