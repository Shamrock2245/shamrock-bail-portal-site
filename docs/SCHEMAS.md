# Data Schemas - Shamrock Bail Suite

This document defines the data structures used across the scraper pipeline, the Google Sheets master database, and the Wix CMS.

## 1. Arrest Record (The Master 34)
The primary data object used by scrapers. Every script MUST output these columns.

1.  **Scrape_Timestamp**: ISO Date
2.  **County**: String (e.g., "lee")
3.  **Booking_Number**: String (**Primary Key**)
4.  **Person_ID**: String
5.  **Full_Name**: String
6.  **First_Name**: String
7.  **Middle_Name**: String
8.  **Last_Name**: String
9.  **DOB**: String
10. **Booking_Date**: String (YYYY-MM-DD)
11. **Booking_Time**: String
12. **Status**: String
13. **Facility**: String
14. **Race**: String
15. **Sex**: String
16. **Height**: String
17. **Weight**: String
18. **Address**: String
19. **City**: String
20. **State**: String
21. **ZIP**: String
22. **Mugshot_URL**: String
23. **Charges**: String (Pipe separated)
24. **Bond_Amount**: Number (Numeric only)
25. **Bond_Paid**: String (YES/NO)
26. **Bond_Type**: String
27. **Court_Type**: String
28. **Case_Number**: String
29. **Court_Date**: String
30. **Court_Time**: String
31. **Court_Location**: String
32. **Detail_URL**: String
33. **Lead_Score**: Number (0-100)
34. **Lead_Status**: String (Hot/Warm/Cold/Disqualified)

## 2. Key Wix Data Collections
| Collection | Purpose | Fields |
| :--- | :--- | :--- |
| `ArrestLeads` | Live leads for portal | Matches Master 34 |
| `FloridaCounties` | County data & URLs | `countyName`, `slug`, `isActive`, `bookingWebsite`, `clerkWebsite`, `recordsSearch`, `sheriffAddress`, `jailAddress`, `clerkAddress`, `countyInfoAddress`, `bookingPhone`, `jailUrl` |
| `BailSchoolSignups` | Marketing leads | `email`, `contactId`, `signupDate`, `source` |
| `AnalyticsEvents` | System tracking | `eventType`, `memberId`, `properties`, `timestamp` |

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
