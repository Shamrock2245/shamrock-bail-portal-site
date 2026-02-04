# Shamrock Bail Bonds - Complete Gap Analysis & Fix Plan

**Date:** February 2, 2026  
**Repository:** Shamrock2245/shamrock-bail-portal-site  
**Status:** CRITICAL GAPS IDENTIFIED - READY TO FIX

---

## Complete System Workflow (As Architected)

### Phase 1: Data Collection

```
┌─────────────────────────────────────────────────────────────┐
│ DEFENDANT DATA (Arrest Information)                         │
├─────────────────────────────────────────────────────────────┤
│ Source: swfl-arrest-scrapers bookmarklet OR AI agents       │
│ ↓                                                            │
│ GAS parsing logic                                            │
│ ↓                                                            │
│ Dashboard.html "Defendant" tab (34-column schema)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ INDEMNITOR DATA (Cosigner Information)                      │
├─────────────────────────────────────────────────────────────┤
│ Source: Wix public site intake form                         │
│ ↓                                                            │
│ IntakeQueue CMS collection (Wix)                             │
│ ↓                                                            │
│ GAS queries via Wix Data API                                 │
│ ↓                                                            │
│ Dashboard.html "Intake Queue" section                        │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Data Convergence & Packet Generation

```
┌─────────────────────────────────────────────────────────────┐
│ DASHBOARD CONVERGENCE POINT                                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Staff views IntakeQueue in Dashboard                     │
│ 2. Staff clicks "Load" to match indemnitor with defendant   │
│ 3. ALL fields auto-fill (NO RE-ENTRY)                       │
│    - Defendant info                                          │
│    - Indemnitor info                                         │
│    - References (2)                                          │
│    - Employer info                                           │
│    - Case details                                            │
│ 4. Staff clicks "Generate Packet"                           │
│ 5. System pulls PDF templates from Google Drive             │
│ 6. System fills each field using PDF_Mappings.js            │
│ 7. System merges into 20+ page packet                       │
│ 8. System calls generateAndSendWithWixPortal()              │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Signing & Payment

```
┌─────────────────────────────────────────────────────────────┐
│ SIGNNOW EMBEDDED SIGNING                                     │
├─────────────────────────────────────────────────────────────┤
│ 1. SignNow document created from packet                     │
│ 2. Embedded signing link generated                          │
│ 3. Email/SMS sent to indemnitor with:                       │
│    - Signing link                                            │
│    - Payment link (SwipeSimple)                              │
│ 4. Indemnitor signs on mobile (one tap)                     │
│ 5. SignNow webhook captures completion                      │
│ 6. Signed PDF stored to Google Drive                        │
└─────────────────────────────────────────────────────────────┘
```

### Phase 4: Case Finalization

```
┌─────────────────────────────────────────────────────────────┐
│ STAFF PORTAL - FINALIZE PAPERWORK                           │
├─────────────────────────────────────────────────────────────┤
│ 1. Staff verifies signatures complete                       │
│ 2. Staff verifies payment received                          │
│ 3. Staff verifies defendant custody status                  │
│ 4. Staff enters Power Number & Case Number                  │
│ 5. Staff clicks "Finalize Paperwork" button                 │
│ 6. System transitions:                                       │
│    - IntakeQueue record → Cases collection                  │
│    - Status: "intake" → "active"                            │
│    - IntakeQueue record deleted                             │
│    - Case now in active management                          │
└─────────────────────────────────────────────────────────────┘
```

### Phase 5: Active Case Management

```
┌─────────────────────────────────────────────────────────────┐
│ CASES COLLECTION (Wix CMS) - Full Lifecycle                 │
├─────────────────────────────────────────────────────────────┤
│ - Court dates & appearances                                  │
│ - Payment tracking & installments                            │
│ - Check-ins & GPS monitoring                                 │
│ - Status updates (active/discharged/forfeited)               │
│ - Communication logs                                         │
│ - Document references                                        │
│                                                              │
│ GOOGLE DRIVE - Permanent Vault                              │
│ - All signed documents                                       │
│ - ID uploads                                                 │
│ - Court documents                                            │
│ - Payment receipts                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## CRITICAL GAPS IDENTIFIED

### 🔴 GAP #1: Dashboard calls wrong IntakeQueue function
**File:** `/backend-gas/Dashboard.html` line 6612  
**Severity:** CRITICAL  
**Impact:** Dashboard doesn't see Wix IntakeQueue submissions

**Current (BROKEN):**
```javascript
google.script.run
    .withSuccessHandler(Queue.render)
    .getPendingIntakes(); // ← Reads from SHEET, not Wix
```

**Fix:**
```javascript
google.script.run
    .withSuccessHandler(Queue.render)
    .getWixIntakeQueue(); // ← Queries Wix CMS via API
```

**Action:** Change function call in Dashboard.html

---

### 🔴 GAP #2: Field name mismatch (Wix → Dashboard)
**Files:** `/backend-gas/WixPortalIntegration.js`, `/backend-gas/Dashboard.html`  
**Severity:** CRITICAL  
**Impact:** Data doesn't render in Dashboard table

**Wix IntakeQueue Schema:**
```javascript
{
  caseId: "CASE-123",
  defendantName: "John Doe",
  defendantEmail: "john@example.com",
  indemnitorName: "Jane Smith",
  indemnitorEmail: "jane@example.com",
  indemnitorPhone: "239-555-5678",
  reference1Name: "Bob Jones",
  // ... 30+ fields
}
```

**Dashboard Expects:**
```javascript
{
  IntakeID: "...",
  DefendantName: "...",  // ← Capital D
  FullName: "...",       // ← indemnitor name
  Email: "...",          // ← indemnitor email
  Phone: "...",          // ← indemnitor phone
  Role: "indemnitor",
  Status: "pending"
}
```

**Fix:** Transform data in `getWixIntakeQueue()`:
```javascript
function getWixIntakeQueue() {
  // ... query Wix API ...
  
  // Transform to Dashboard schema
  return result.dataItems.map(item => ({
    IntakeID: item.caseId,
    DefendantName: item.defendantName,
    FullName: item.indemnitorName,
    Email: item.indemnitorEmail,
    Phone: item.indemnitorPhone,
    Role: 'indemnitor',
    Status: item.status || 'pending',
    Timestamp: item._createdDate,
    
    // Keep original fields for Queue.load()
    _original: item
  }));
}
```

**Action:** Update `getWixIntakeQueue()` in WixPortalIntegration.js

---

### 🔴 GAP #3: Queue.load() incomplete field mapping
**File:** `/backend-gas/Dashboard.html` lines 6652-6710  
**Severity:** CRITICAL  
**Impact:** Auto-fill doesn't work, staff must re-type

**Current (INCOMPLETE):**
```javascript
Queue.load: function (item) {
    // Only populates defendant name (naive split)
    const parts = (item.DefendantName || '').split(' ');
    UI.setValue('defendant-first-name', parts[0]);
    // ... incomplete ...
}
```

**Required Mapping (ALL FIELDS):**

Based on Dashboard form field IDs found:
- `defendant-first-name`, `defendant-last-name`, `defendant-middle-name`
- `defendant-dob`, `defendant-ssn`, `defendant-dl-number`
- `defendant-street-address`, `defendant-city`, `defendant-state`, `defendant-zipcode`
- `defendant-phone`, `defendant-email`, `defendant-booking-number`
- `defendant-county`, `defendant-arrest-date`, `defendant-jail-facility`

Indemnitor fields are DYNAMIC (multiple indemnitors):
- `indemnitor-${count}-first`, `indemnitor-${count}-last`, `indemnitor-${count}-middle`
- `indemnitor-${count}-dob`, `indemnitor-${count}-ssn`, `indemnitor-${count}-dl`
- `indemnitor-${count}-address`, `indemnitor-${count}-city`, `indemnitor-${count}-zip`
- `indemnitor-${count}-phone`, `indemnitor-${count}-email`
- `indemnitor-${count}-employer`, `indemnitor-${count}-employer-phone`
- `indemnitor-${count}-supervisor`, `indemnitor-${count}-supervisor-phone`
- `indemnitor-${count}-ref1-name`, `indemnitor-${count}-ref1-phone`, `indemnitor-${count}-ref1-address`
- `indemnitor-${count}-ref2-name`, `indemnitor-${count}-ref2-phone`, `indemnitor-${count}-ref2-address`

**Fix:** Complete `Queue.load()` function with full field mapping

**Action:** Rewrite Queue.load() to populate ALL fields from IntakeQueue data

---

### 🔴 GAP #4: "Finalize Paperwork" button missing in Staff Portal
**File:** `/src/pages/portal-staff.qs9dx.js`  
**Severity:** HIGH  
**Impact:** No way to transition IntakeQueue → Cases

**Current:** No button or function exists

**Required:**
1. Add "Finalize Paperwork" button to Staff Portal UI
2. Create handler function that:
   - Shows modal to enter Power Number & Case Number
   - Validates custody status
   - Calls `finalizeCase()` from defendant-matching.jsw
   - Transitions IntakeQueue → Cases
   - Deletes IntakeQueue record
   - Updates UI

**Action:** Add button and wire to finalizeCase() backend function

---

### 🔴 GAP #5: Cases collection schema incomplete
**File:** `/database/wix-collections-schema.json`  
**Severity:** HIGH  
**Impact:** Cases collection can't track full bond lifecycle

**Current Schema (LIMITED):**
```javascript
{
  "id": "Cases",
  "fields": [
    "caseNumber",
    "bookingNumber",
    "defendantName",
    "indemnitorName",
    "bondAmount",
    "status",
    // ... basic fields only
  ]
}
```

**Required Schema (FULL LIFECYCLE):**

**Core Case Info:**
- powerNumber (text) - Bond power number
- caseNumber (text) - Court case number
- bookingNumber (text) - Jail booking number
- receiptNumber (text) - Payment receipt
- status (text) - active/discharged/forfeited/surrendered
- custodyStatus (text) - in_custody/released

**Defendant Info:**
- defendantId (reference) → Defendants collection
- defendantName (text)
- defendantDOB (date)
- defendantSSN (text)
- defendantAddress (text)
- defendantPhone (text)
- defendantEmail (text)

**Indemnitor Info:**
- indemnitorId (reference) → Indemnitors collection
- indemnitorName (text)
- indemnitorPhone (text)
- indemnitorEmail (text)
- indemnitorAddress (text)

**Financial:**
- bondAmount (number)
- premiumAmount (number)
- premiumPaid (number)
- premiumBalance (number)
- paymentPlanId (reference) → PaymentPlans
- paymentStatus (text) - paid/partial/unpaid

**Court Info:**
- county (text)
- courtType (text) - circuit/county
- arrestDate (datetime)
- releaseDate (datetime)
- nextCourtDate (datetime)
- charges (richText)

**Document Tracking:**
- signNowDocumentId (text)
- driveFileId (text)
- driveFolderUrl (url)
- documentsSignedDate (datetime)
- allSignaturesComplete (boolean)

**Lifecycle Tracking:**
- postedDate (datetime) - When bond was posted
- dischargedDate (datetime) - When bond was discharged
- forfeitedDate (datetime) - If bond was forfeited
- surrenderedDate (datetime) - If defendant was surrendered
- finalizedAt (datetime) - When case was finalized
- finalizedBy (text) - Staff email who finalized

**Metadata:**
- intakeQueueId (text) - Reference to original IntakeQueue record (for audit)
- isEditable (boolean) - Lock after posting
- gasSheetRow (number) - GAS sync reference
- lastSyncedAt (datetime)
- notes (richText)

**Action:** Expand Cases collection schema in Wix CMS

---

### 🔴 GAP #6: WIX_API_KEY not documented or verified
**File:** `/backend-gas/WixPortalIntegration.js`  
**Severity:** HIGH  
**Impact:** GAS cannot query Wix without valid API key

**Current:** Code assumes key exists, no verification

**Required:**
1. Document WIX_API_KEY setup in CONFIGURATION_GUIDE.md
2. Add setup function: `setWixApiKey(apiKey)`
3. Add verification function: `testWixConnection()`
4. Add to SystemHealthCheck.js

**Action:** Create setup documentation and verification functions

---

### 🟡 GAP #7: IntakeQueue schema not in wix-collections-schema.json
**File:** `/database/wix-collections-schema.json`  
**Severity:** MEDIUM  
**Impact:** Documentation gap, no type safety

**Action:** Add IntakeQueue schema to JSON file (already documented in INTAKE_QUEUE_SCHEMA.md)

---

### 🟡 GAP #8: PDF_Mappings.js incomplete
**File:** `/backend-gas/PDF_Mappings.js`  
**Severity:** MEDIUM  
**Impact:** PDF may have blank fields

**Current Mappings:** ~15 fields mapped

**Required:** Map all IntakeQueue fields:
- All defendant fields (20+)
- All indemnitor fields (15+)
- Reference 1 & 2 fields (8+)
- Employer fields (6+)
- Case fields (10+)

**Action:** Expand PDF_TAG_DEFINITIONS to cover all fields

---

## FIX SEQUENCE (Priority Order)

### Phase 1: Critical Data Flow (MUST FIX FIRST)
1. ✅ **GAP #1** - Fix Dashboard.html to call `getWixIntakeQueue()`
2. ✅ **GAP #2** - Add field transformation in `getWixIntakeQueue()`
3. ✅ **GAP #3** - Complete `Queue.load()` field mapping
4. ✅ **GAP #6** - Document and verify WIX_API_KEY

### Phase 2: Case Finalization (HIGH PRIORITY)
5. ✅ **GAP #4** - Add "Finalize Paperwork" button to Staff Portal
6. ✅ **GAP #5** - Expand Cases collection schema

### Phase 3: PDF Generation (MEDIUM PRIORITY)
7. ✅ **GAP #8** - Expand PDF_Mappings.js

### Phase 4: Documentation (LOW PRIORITY)
8. ✅ **GAP #7** - Add IntakeQueue to schema JSON

---

## TESTING CHECKLIST

### End-to-End Flow Test
- [ ] Indemnitor submits form on Wix site
- [ ] Record appears in IntakeQueue CMS
- [ ] GAS Dashboard shows record in Intake Queue section
- [ ] Staff clicks "Load" button
- [ ] ALL fields auto-fill (defendant + indemnitor + references)
- [ ] Staff clicks "Generate Packet"
- [ ] PDF templates pulled from Drive
- [ ] All fields filled correctly
- [ ] Packet sent to SignNow
- [ ] Indemnitor receives email/SMS with signing link + payment link
- [ ] Indemnitor signs on mobile
- [ ] Webhook captures completion
- [ ] Signed PDF stored to Drive
- [ ] Staff clicks "Finalize Paperwork"
- [ ] Power/Case numbers entered
- [ ] IntakeQueue → Cases transition complete
- [ ] IntakeQueue record deleted
- [ ] Case appears in Staff Portal active cases

---

## FILES TO MODIFY

### GAS Backend
1. `/backend-gas/Dashboard.html` - Fix Queue.fetch() and Queue.load()
2. `/backend-gas/WixPortalIntegration.js` - Add field transformation
3. `/backend-gas/PDF_Mappings.js` - Expand field mappings
4. `/backend-gas/CONFIGURATION_GUIDE.md` - Document WIX_API_KEY setup

### Wix Backend
5. `/src/backend/defendant-matching.jsw` - Already has finalizeCase() ✅
6. `/src/pages/portal-staff.qs9dx.js` - Add "Finalize Paperwork" button

### Database
7. `/database/wix-collections-schema.json` - Add IntakeQueue and expand Cases

### Wix CMS (via Dashboard)
8. Cases collection - Add lifecycle fields

---

## NEXT IMMEDIATE ACTIONS

1. **Fix GAP #1** - Change Dashboard.html line 6612
2. **Fix GAP #2** - Transform data in getWixIntakeQueue()
3. **Test** - Verify IntakeQueue appears in Dashboard
4. **Fix GAP #3** - Complete Queue.load() mapping
5. **Test** - Verify auto-fill works
6. **Fix GAP #4** - Add Finalize button to Staff Portal
7. **Fix GAP #5** - Expand Cases schema
8. **Test** - End-to-end flow

---

**Status:** GAPS DOCUMENTED - READY TO FIX  
**Estimated Time:** 2-3 hours for critical gaps  
**Last Updated:** 2026-02-02
