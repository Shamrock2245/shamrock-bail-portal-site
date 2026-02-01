# Spreadsheet Schema to Automation Mapping
**Shamrock Bail Bonds - Completed Bonds Tracking**

## Spreadsheet Schema

Based on your description, the **Completed Bonds** sheet has the following columns:

| Column | Field Name | Data Type | Source | Automation Touchpoint |
|--------|------------|-----------|--------|----------------------|
| 1 | Date Bond Posted | Date | Manual/Auto | ✅ Auto-populate from GAS |
| 2 | Defendant Name | String | Scraper | ✅ Auto-populated from arrest scraper |
| 3 | Defendant Email | Email | Manual/Portal | ✅ Captured in portal, sync to sheet |
| 4 | Defendant Phone | Phone | Manual/Portal | ✅ Captured in portal, sync to sheet |
| 5 | Defendant Home Address | Address | Manual/Portal | ✅ Captured in portal, sync to sheet |
| 6 | Indemnitor Name | String | Manual | ⚠️ Manual entry in Dashboard.html |
| 7 | Indemnitor Phone | Phone | Manual | ⚠️ Manual entry in Dashboard.html |
| 8 | Indemnitor Email | Email | Manual | ⚠️ Manual entry in Dashboard.html |
| 9 | Indemnitor Address | Address | Manual | ⚠️ Manual entry in Dashboard.html |
| 10 | Agent Posted Bond | String | Manual/Auto | ✅ Auto-populate from staff login |
| 11 | Defendant Payment Plan | Boolean | Manual/Portal | ✅ Captured in portal, sync to sheet |
| 12 | Payment Plan Terms | String | Manual/Portal | ✅ Captured in portal if payment plan = yes |
| 13 | Defendant Next Court Date | Date | Scraper/Manual | ✅ Auto-populated from arrest scraper |
| 14 | Paperwork Completion | Status | Auto | ✅ Auto-update from SignNow webhook |
| 15 | Notes | Text | Manual | ⚠️ Staff can add notes manually |

---

## Automation Touchpoints by Workflow Stage

### Stage 1: Data Capture (Arrest Scraper)
**Automation**: Bookmarklet → swfl-arrest-scrapers → GAS Dashboard

**Auto-Populated Fields**:
- ✅ Defendant Name (from booking record)
- ✅ Defendant Next Court Date (from booking record)
- ✅ Mugshot URL
- ✅ Booking Number
- ✅ Charges
- ✅ Bond Amount
- ✅ Arrest Date

**Spreadsheet Update**: Row created in "Scraped Arrests" sheet

---

### Stage 2: Manual Input (Dashboard.html)
**Automation**: Staff enters Indemnitor/Reference info

**Manual Entry Fields** (ONLY manual step):
- ⚠️ Indemnitor Name
- ⚠️ Indemnitor Phone
- ⚠️ Indemnitor Email
- ⚠️ Indemnitor Address
- ⚠️ Reference Name(s)
- ⚠️ Reference Phone(s)
- ⚠️ Reference Address(es)

**Spreadsheet Update**: Row moved to "Active Cases" sheet with Indemnitor data

---

### Stage 3: Document Generation (GAS)
**Automation**: Click "Generate Packet" → 20+ page PDF created

**Auto-Populated Fields**:
- ✅ Date Bond Posted (current date/time)
- ✅ Agent Posted Bond (from staff login session)

**Spreadsheet Update**: 
- Status = "Packet Generated"
- PDF URL stored in sheet

---

### Stage 4: Wix Portal Authentication
**Automation**: Magic link sent to Defendant + Indemnitor

**Auto-Populated Fields**:
- ✅ Defendant Email (captured during portal registration)
- ✅ Defendant Phone (captured during portal registration)
- ✅ Indemnitor Email (captured during portal registration)
- ✅ Indemnitor Phone (captured during portal registration)

**Spreadsheet Update**:
- Status = "Portal Access Sent"
- Magic Link Token stored
- Access timestamp logged

---

### Stage 5: Portal Login & Data Collection
**Automation**: User logs in, completes profile

**Auto-Populated Fields**:
- ✅ Defendant Home Address (from portal profile)
- ✅ Defendant Payment Plan (from portal form)
- ✅ Payment Plan Terms (from portal form if payment plan selected)

**Spreadsheet Update**:
- Status = "Profile Complete"
- All portal-captured data synced to sheet

---

### Stage 6: Document Signing (SignNow)
**Automation**: SignNow invitation sent, signatures collected

**Auto-Populated Fields**:
- ✅ Paperwork Completion (updated via SignNow webhook)
  - "Pending" → "Defendant Signed" → "Indemnitor Signed" → "Complete"

**Spreadsheet Update**:
- Status = "Signing in Progress"
- Signature timestamps logged
- Signed PDF URL stored

---

### Stage 7: Final Processing
**Automation**: All signatures complete, documents stored

**Auto-Populated Fields**:
- ✅ Paperwork Completion = "Complete"
- ✅ Completion Date/Time

**Spreadsheet Update**:
- Row moved to "Completed Bonds" sheet
- Google Drive folder URL stored
- Final status = "Bond Posted - Complete"

---

## Automation Opportunities

### 🔥 HIGH PRIORITY - Implement Now

#### 1. **Auto-Populate Date Bond Posted**
**When**: Document generation triggered  
**How**: GAS function captures `new Date()` and writes to sheet  
**Column**: Date Bond Posted  
**Code Location**: `GAS: SignNow_Integration_Complete.gs`

#### 2. **Auto-Populate Agent Posted Bond**
**When**: Staff generates packet from Dashboard  
**How**: Capture staff email from session, write to sheet  
**Column**: Agent Posted Bond  
**Code Location**: `GAS: Dashboard.html` (session data)

#### 3. **Auto-Sync Portal Data to Sheet**
**When**: User completes portal profile  
**How**: Wix backend function writes to Google Sheets API  
**Columns**: 
- Defendant Email
- Defendant Phone
- Defendant Home Address
- Defendant Payment Plan
- Payment Plan Terms  
**Code Location**: `Wix: backend/sheets-sync.jsw` (NEW)

#### 4. **Auto-Update Paperwork Completion Status**
**When**: SignNow webhook fires  
**How**: GAS webhook handler updates sheet row  
**Column**: Paperwork Completion  
**Code Location**: `GAS: SignNow_Integration_Complete.gs` (webhook handler)

#### 5. **Auto-Populate Defendant Next Court Date**
**When**: Arrest data scraped  
**How**: Scraper extracts court date, writes to sheet  
**Column**: Defendant Next Court Date  
**Code Location**: `swfl-arrest-scrapers` (scraper logic)

---

### 📊 MEDIUM PRIORITY - Enhance Later

#### 6. **Auto-Generate Notes from Events**
**When**: Key events occur (signature, payment, etc.)  
**How**: Append timestamped notes to Notes column  
**Column**: Notes  
**Example**: "2026-01-12 14:30 - Defendant signed documents"

#### 7. **Auto-Detect Payment Plan from Portal**
**When**: User selects payment plan option  
**How**: Wix form captures checkbox, syncs to sheet  
**Columns**: 
- Defendant Payment Plan (Yes/No)
- Payment Plan Terms (if Yes)

#### 8. **Auto-Populate Indemnitor Data from Portal**
**When**: Indemnitor completes portal profile  
**How**: Wix backend syncs Indemnitor data to sheet  
**Columns**:
- Indemnitor Name
- Indemnitor Phone
- Indemnitor Email
- Indemnitor Address

---

### 🚀 FUTURE ENHANCEMENTS

#### 9. **Court Date Reminders**
**When**: 7 days before court date  
**How**: Google Calendar + Gmail MCP  
**Action**: Send automated reminder email to Defendant

#### 10. **Payment Plan Tracking**
**When**: Payment plan selected  
**How**: Create recurring calendar events for payment due dates  
**Action**: Send payment reminders via Gmail MCP

#### 11. **Completion Report Generation**
**When**: Bond marked complete  
**How**: Generate PDF report with all case details  
**Action**: Email report to staff and store in Drive

---

## Data Flow Diagram

```
Arrest Scraper (34 columns)
    ↓
Dashboard.html (+ Indemnitor/Reference)
    ↓
GAS Document Generation (+ Date, Agent)
    ↓
Wix Portal (+ Contact Info, Address, Payment Plan)
    ↓
SignNow (+ Paperwork Status)
    ↓
Google Sheets: Completed Bonds (15 columns)
```

---

## Spreadsheet Structure Recommendation

### Sheet 1: Scraped Arrests
**Purpose**: Raw arrest data from scrapers  
**Columns**: 34-column schema from swfl-arrest-scrapers  
**Status**: "New" → "In Progress"

### Sheet 2: Active Cases
**Purpose**: Cases with Indemnitor info, awaiting signatures  
**Columns**: All 15 columns  
**Status**: "Packet Generated" → "Signing in Progress"

### Sheet 3: Completed Bonds
**Purpose**: Fully signed and processed bonds  
**Columns**: All 15 columns  
**Status**: "Complete"

### Sheet 4: Payment Plans
**Purpose**: Track payment plan schedules  
**Columns**: Defendant Name, Plan Terms, Due Dates, Payment Status

---

## Integration Points

### Google Sheets API
**Used By**: 
- GAS (read/write)
- Wix backend (write portal data)
- SignNow webhook (update status)

**Authentication**: Service account or OAuth

### Wix → Google Sheets Sync
**Trigger**: Portal profile completion  
**Method**: HTTP POST to GAS Web App  
**Data**: Defendant/Indemnitor contact info, payment plan

### SignNow → Google Sheets Sync
**Trigger**: Signature completion webhook  
**Method**: GAS webhook handler  
**Data**: Paperwork completion status, signed PDF URL

---

## Automation Implementation Checklist

### Phase 1: Core Automations (Week 1)
- [ ] Auto-populate Date Bond Posted
- [ ] Auto-populate Agent Posted Bond
- [ ] Auto-update Paperwork Completion from SignNow
- [ ] Auto-populate Defendant Next Court Date from scraper

### Phase 2: Portal Integration (Week 2)
- [ ] Create Wix → Sheets sync function
- [ ] Auto-sync Defendant Email, Phone, Address
- [ ] Auto-sync Payment Plan data
- [ ] Test end-to-end data flow

### Phase 3: Enhanced Features (Week 3)
- [ ] Auto-generate event notes
- [ ] Court date reminder system
- [ ] Payment plan tracking
- [ ] Completion report generation

---

## Success Criteria

### Data Accuracy
- ✅ 100% of scraped data auto-populated correctly
- ✅ 100% of portal data synced to sheet
- ✅ 100% of SignNow status updates reflected

### Manual Entry Reduction
- ✅ Only Indemnitor/Reference info entered manually
- ✅ All other fields auto-populated
- ✅ Zero duplicate data entry

### Workflow Efficiency
- ✅ Case moves from scrape to complete in < 24 hours
- ✅ Staff spends < 5 minutes per case on data entry
- ✅ Real-time status updates visible in sheet

---

**Last Updated**: 2026-01-12  
**Source**: User spreadsheet schema description  
**Related**: SHAMROCK_COMPLETE_WORKFLOW.mmd
