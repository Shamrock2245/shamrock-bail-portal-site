# Data Schemas - Shamrock Bail Suite

This document defines the data structures used across the scraper pipeline, the Google Sheets master database, and the Wix CMS.

## 1. Arrest Record (The Master 34)
The primary data object used by scrapers.

| Column | Name | Type | Key/Note |
| :--- | :--- | :--- | :--- |
| 1 | Scrape_Timestamp | ISO Date | When the record was pulled |
| 2 | County | String | Lee, Collier, etc. |
| 3 | Booking_Number | String | **Primary Key** |
| 4 | Person_ID | String | Internal jail ID for the person |
| 5 | Full_Name | String | |
| ... | ... | ... | ... |
| 23 | Charges | String | Pipe separated: `Charge 1 | Charge 2` |
| 24 | Bond_Amount | Number | Pure numeric, no commas/symbols |
| 33 | Lead_Score | Number | Calculated 0-100 |
| 34 | Lead_Status | Enum | Hot, Warm, Cold, Disqualified |

## 2. Wix Data Collections
The frontend uses the following synced structures:

### `FloridaCounties`
- `countySlug`: Primary Key (e.g., `lee`)
- `primaryPhone`: E.164 format
- `active`: Boolean toggle for page visibility
- `centroid`: {lat, lng} for geocoding

### `UserLocations`
- `sessionId`: Tracking UUID
- `county`: Detected county via geocoding
- `timestamp`: Capturing location events

## 3. API Response Schemas

### Geocoding Response
```json
{
  "success": true,
  "county": "lee",
  "confidence": 0.95,
  "method": "gps"
}
```

### Routing Response
```json
{
  "success": true,
  "number": "+12393322245",
  "display": "(239) 332-2245",
  "source": "county_match"
}
```

> [!TIP]
> Use the `SCHEMA.md` as the source of truth for all `wixData.query` and `wixData.insert` operations.
