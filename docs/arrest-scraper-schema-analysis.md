# Arrest Scraper Schema Analysis

## Overview
The arrest scraper system uses a **34-column unified schema** that is the single source of truth for all arrest data, field mapping, and downstream automation.

## 34-Column Master Schema

The schema defines the following columns in exact order:

1. Scrape_Timestamp
2. County
3. Booking_Number
4. Person_ID
5. Full_Name
6. First_Name
7. Middle_Name
8. Last_Name
9. DOB
10. Booking_Date
11. Booking_Time
12. Status
13. Facility
14. Race
15. Sex
16. Height
17. Weight
18. Address
19. City
20. State
21. ZIP
22. Mugshot_URL
23. Charges
24. Bond_Amount
25. Bond_Paid
26. Bond_Type
27. Court_Type
28. Case_Number
29. Court_Date
30. Court_Time
31. Court_Location
32. Detail_URL
33. Lead_Score
34. Lead_Status

## Critical Fields for Wix Integration

### Identity Fields
- **Full_Name, First_Name, Middle_Name, Last_Name**: Must match exactly for SignNow pre-fill
- **DOB**: Date of birth (format varies by county)
- **Person_ID**: Unique identifier per person (may differ from Booking_Number)

### Booking Information
- **Booking_Number**: Primary identifier for arrest record
- **Booking_Date, Booking_Time**: When person was booked into jail
- **County**: Must align with Wix county slug system
- **Facility**: Jail facility name

### Location Data
- **Address, City, State, ZIP**: Defendant's address (critical for geolocation)

### Charges & Bond
- **Charges**: Text description of all charges (may be comma-separated)
- **Bond_Amount**: Total bond amount (numeric, may include $ or commas)
- **Bond_Paid**: Whether bond has been paid
- **Bond_Type**: Type of bond (ROR, Cash, Surety, etc.)

### Court Information
- **Case_Number**: Court case number
- **Court_Date, Court_Time**: Next court appearance
- **Court_Location**: Courthouse location
- **Court_Type**: Type of court (Circuit, County, etc.)

### Lead Management
- **Lead_Score**: 0-100 algorithmic score
- **Lead_Status**: HOT (≥70), WARM (≥40), COLD (<40)

### Media & Links
- **Mugshot_URL**: Link to booking photo
- **Detail_URL**: Link to original arrest record

## Lead Scoring Algorithm

### Scoring Rules (0-100 scale)
**Bond Amount Points:**
- ≥ $5,000: +40 points
- ≥ $2,000: +30 points
- ≥ $1,000: +20 points
- ≥ $500: +10 points

**Serious Charges (+20 points if charges contain):**
- DUI, Battery, Assault, Felony, Drug, Theft, Domestic, Violence

**Recency Points:**
- Within 1 day: +30 points
- Within 3 days: +20 points
- Within 7 days: +10 points

### Lead Status Categories
- **HOT (≥70)**: Immediate Slack alert, priority follow-up
- **WARM (≥40)**: Priority follow-up
- **COLD (<40)**: Standard archival

## Integration Requirements for Wix

### Data Alignment
1. **Field Names**: Wix forms and member portal must use the exact field names from the schema
2. **County Mapping**: County field must match Wix county slug (lowercase, no spaces)
3. **Date Formats**: Standardize on ISO 8601 or consistent format
4. **Bond Amount**: Strip $ and commas, store as number

### Workflow Protection
- **DO NOT** modify or intercept the scraper → Google Sheets → SignNow workflow
- Wix can READ from this data but should not be the primary data store
- SignNow integration must use the schema field names for pre-fill

### Data Flow
```
Arrest Scrapers → Google Sheets (Master) → Apps Script → SignNow
                                         ↓
                                    Wix Portal (Read-Only View)
```

### Recommended Wix Collections Alignment

**ArrestRecords** (Read-only mirror from Google Sheets)
- Map all 34 columns to Wix collection fields
- Use external sync (Apps Script webhook → Wix HTTP function)
- DO NOT allow direct edits from Wix

**LeadManagement** (Wix-specific tracking)
- Reference ArrestRecords by Booking_Number
- Track Wix-specific actions (member viewed, called, etc.)
- DO NOT duplicate arrest data

## Key Takeaways

1. **Schema is Sacred**: The 34-column schema is the single source of truth
2. **Field Name Consistency**: Use exact field names across all systems
3. **Read-Only in Wix**: Wix should consume this data, not be the primary source
4. **Lead Score Integration**: Use Lead_Score and Lead_Status for routing and prioritization
5. **County Alignment**: Ensure County field matches Wix county slugs exactly
