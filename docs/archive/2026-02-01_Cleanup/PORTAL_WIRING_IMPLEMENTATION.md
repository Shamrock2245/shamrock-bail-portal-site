# Wix Portal Ecosystem - Complete Implementation Guide

## Overview

This document describes the complete implementation of the Shamrock Bail Bonds Wix Portal, which integrates with the existing GAS Dashboard workflow to provide a seamless status monitoring and signing launchpad for defendants, indemnitors, and staff.

**Key Principle:** The Wix Portal is a **status dashboard and signing launchpad**, NOT a data collection tool. All data entry and document assembly happens in Dashboard.html (GAS).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     STAFF WORKFLOW (GAS)                         │
│                                                                  │
│  1. Bookmarklet scrapes defendant data from sheriff site        │
│  2. Dashboard.html auto-fills with scraped data                 │
│  3. Staff adds indemnitors (multiple) using "+" button          │
│  4. Staff adds charges (multiple appearance bonds)              │
│  5. System calculates premium ($100 min per charge)             │
│  6. System auto-selects payment plan if balance > $0            │
│  7. Staff selects documents via checkboxes                      │
│  8. Staff chooses signing method:                               │
│     • Email - SignNow sends email with link                     │
│     • SMS - SignNow sends text with link                        │
│     • Kiosk - In-office iPad signing                            │
│     • Print - Generate PDFs for wet signature                   │
│  9. Click "Generate & Send"                                     │
│                                                                  │
│  ↓ System automatically:                                        │
│  • Fills PDFs with data                                         │
│  • Uploads to SignNow                                           │
│  • Creates signing links                                        │
│  • Saves to Wix PendingDocuments collection                     │
│  • Sends notifications                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     WIX PORTAL (Status & Signing)                │
│                                                                  │
│  DEFENDANT PORTAL (/portal/defendant)                           │
│  • View case status                                             │
│  • View court dates                                             │
│  • Check in with selfie + GPS                                   │
│  • Sign paperwork (redirects to SignNow)                        │
│                                                                  │
│  INDEMNITOR PORTAL (/portal/indemnitor)                         │
│  • View total liability (bond amount)                           │
│  • View defendant status                                        │
│  • View payment plan (if balance > $0)                          │
│  • Make payments                                                │
│  • Sign paperwork (redirects to SignNow)                        │
│                                                                  │
│  STAFF PORTAL (/portal/staff)                                   │
│  • Monitor all active cases                                     │
│  • View paperwork status (sent/signed/completed)                │
│  • Resend paperwork if needed                                   │
│  • Trigger signing for any method                               │
│  • View statistics (pending/completed/failed)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Implemented

### Backend Files (`src/backend/`)

#### 1. `portal-auth.jsw` (EXISTING - Already Complete)
- Role management (defendant, indemnitor, staff)
- Magic link authentication
- Session management
- User profile CRUD

#### 2. `signing-methods.jsw` (NEW)
**Purpose:** Integration layer between Wix Portal and GAS Dashboard for all signing methods

**Functions:**
- `sendViaEmail(params)` - Send paperwork via email
- `sendViaSMS(params)` - Send paperwork via SMS
- `createKioskLink(params)` - Create embedded signing link for kiosk mode
- `generatePrintPDFs(params)` - Generate PDFs for print/download
- `getSigningStatus(caseId)` - Get signing status for a case
- `getPendingDocuments(memberId)` - Get pending documents for a member
- `markDocumentSigned(documentId)` - Mark document as signed
- `initiateSigningWorkflow(params)` - Main function to trigger signing from Staff Portal

**Key Integration:**
```javascript
const GAS_WEB_APP_URL = 'https://script.google.com/a/macros/shamrockbailbonds.biz/s/AKfycbzU7hz5OCAZkkdjOZdKK6t7K0whw65iMH-EOzxtSf7KkVCuLvy1X-Las8CgGdTMw8pOpg/exec';
```

### Frontend Files (`src/pages/`)

#### 3. `portal-landing.bagfn.js` (EXISTING - Already Complete)
- Gateway for role selection
- Magic link redemption
- Redirects to appropriate portal based on role

#### 4. `portal-defendant-complete.js` (NEW)
**Purpose:** Defendant dashboard with case status, check-in, and paperwork signing

**Features:**
- Display case status (bond amount, court date, charges)
- Display signing status (pending/signed/completed)
- Check-in with selfie + GPS
- Sign paperwork based on delivery method:
  - Email/SMS: Redirect to `/sign?link=...`
  - Kiosk: Open lightbox with embedded SignNow
  - Print: Download PDF

**Key Elements:**
```javascript
// Load case data
await loadCaseData(caseIds[0]);

// Load pending documents
await loadPendingDocuments();

// Handle check-in
await handleCheckIn(); // Selfie + GPS

// Handle signing
await handleSignPaperwork(method); // Redirect to SignNow
```

#### 5. `portal-indemnitor-complete.js` (NEW)
**Purpose:** Indemnitor dashboard with liability view and payment tracking

**Features:**
- Display total liability (bond amount)
- Display defendant status (good standing/missed check-in/warrant)
- Display payment plan (if balance > $0)
  - Monthly payment amount
  - Next payment due date
  - Payments made / remaining
  - Progress bar
- Sign paperwork
- Make payments

**Key Elements:**
```javascript
// Display liability
displayLiabilityInfo(currentCase);

// Display defendant status
displayDefendantStatus(defendantInfo);

// Display payment plan
displayPaymentPlan(paymentPlan);

// Handle payment
handleMakePayment(); // Redirect to /portal/payment
```

#### 6. `portal-staff-complete.js` (NEW)
**Purpose:** Staff dashboard to monitor and trigger paperwork workflow

**Features:**
- View all active cases in repeater
- Filter cases (all/pending/active/completed)
- Search cases by case number, defendant name, booking number
- View case details:
  - Bond amount, premium, balance
  - Charge count
  - Court date/time
  - Paperwork status
  - Signers status (defendant + multiple indemnitors)
- Trigger signing workflow:
  - Select method (email/SMS/kiosk/print)
  - Enter defendant email/phone
  - System automatically loads all indemnitors
  - Sends to all parties
- Resend paperwork if needed
- View statistics (pending/completed/failed)

**Key Elements:**
```javascript
// Load active cases
await loadActiveCases();

// Display in repeater
$w('#casesRepeater').data = cases;

// Trigger signing
await initiateSigningWorkflow({
    caseId,
    method,
    defendantInfo,
    indemnitorInfo, // Multiple indemnitors
    documentIds
});
```

---

## Wix Collections Required

### Existing Collections (Already in Use)
- `PortalUsers` - User profiles with role and caseIds
- `PortalSessions` - Session data
- `MagicLinks` - Passwordless authentication tokens
- `UserLocations` - Check-in history with GPS + selfie
- `GeolocationCache` - Cached geocoding results

### New Collections (Need to be Created)

#### `Cases`
```javascript
{
  _id: string,
  caseNumber: string,
  bookingNumber: string,
  defendantId: string,
  defendantName: string,
  defendantEmail: string,
  defendantPhone: string,
  bondAmount: number,
  premiumAmount: number,
  downPayment: number,
  chargeCount: number,
  courtDate: date,
  courtTime: string,
  courtLocation: string,
  county: string,
  status: string, // Active, Pending, Closed
  paperworkStatus: string, // Not Started, Sent, Partially Signed, Completed, Failed
  signingMethod: string, // email, sms, kiosk, print
  _createdDate: date,
  _updatedDate: date
}
```

#### `Defendants`
```javascript
{
  _id: string,
  fullName: string,
  firstName: string,
  lastName: string,
  dob: date,
  phone: string,
  email: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  status: string, // Good Standing, Missed Check-In, Warrant, Non-Compliant
  lastCheckIn: date,
  _createdDate: date
}
```

#### `Indemnitors`
```javascript
{
  _id: string,
  caseId: string,
  fullName: string,
  firstName: string,
  lastName: string,
  relationship: string,
  dob: date,
  phone: string,
  email: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  employer: string,
  employerPhone: string,
  _createdDate: date
}
```

#### `PaymentPlans`
```javascript
{
  _id: string,
  caseId: string,
  balance: number,
  monthlyPayment: number,
  totalPayments: number,
  paymentsMade: number,
  nextPaymentDate: date,
  status: string, // Active, Completed, Defaulted
  _createdDate: date
}
```

#### `PendingDocuments`
```javascript
{
  _id: string,
  caseId: string,
  memberId: string,
  documentId: string,
  signingLink: string,
  downloadUrl: string,
  method: string, // email, sms, kiosk, print
  status: string, // pending, signed, expired
  expiresAt: date,
  signedAt: date,
  createdAt: date
}
```

#### `SigningSessions`
```javascript
{
  _id: string,
  caseId: string,
  signNowDocumentId: string,
  method: string, // email, sms, kiosk, print
  status: string, // pending, signed, completed, declined, expired, failed
  signers: string, // JSON array of signers with status
  createdAt: date,
  completedAt: date
}
```

#### `SignatureEvents`
```javascript
{
  _id: string,
  sessionId: string,
  caseId: string,
  documentId: string,
  signerEmail: string,
  signerRole: string,
  eventType: string, // viewed, signed, declined, invite_sent
  eventTime: date
}
```

---

## GAS Integration Points

### Dashboard.html → Wix Portal Data Flow

1. **Staff fills out Dashboard.html**
   - Defendant info
   - Multiple indemnitors (via "+" button)
   - Multiple charges (one appearance bond per charge)
   - Payment info (auto-calculates premium, balance)
   - Document selection (checkboxes)
   - Signing method (email/SMS/kiosk/print)

2. **Dashboard.html calls Code.gs**
   - `saveBookingData(formData)` - Saves to Google Sheets
   - `generateAndSendDocuments(formData)` - Creates PDFs, uploads to SignNow
   - Returns: `{ documentIds, inviteIds, signingLinks }`

3. **Code.gs calls Wix API** (via `WixPortalIntegration.gs`)
   - Creates/updates `Cases` record
   - Creates `Defendants` record
   - Creates `Indemnitors` records (multiple)
   - Creates `PaymentPlans` record (if balance > 0)
   - Creates `PendingDocuments` records
   - Creates `SigningSessions` record

4. **Wix Portal displays status**
   - Defendant sees case + signing button
   - Indemnitor sees liability + signing button
   - Staff sees all cases + paperwork status

### Wix Portal → GAS Data Flow

1. **Staff triggers signing from Wix Portal**
   - Selects case
   - Chooses method (email/SMS/kiosk/print)
   - Clicks "Send Paperwork"

2. **Wix calls `signing-methods.jsw`**
   - `initiateSigningWorkflow(params)`

3. **`signing-methods.jsw` calls GAS**
   - POST to `GAS_WEB_APP_URL`
   - Action: `sendForSignature` or `createEmbeddedLink`
   - Payload: `{ caseId, method, defendantInfo, indemnitorInfo, documentIds }`

4. **GAS processes and returns**
   - Creates SignNow documents
   - Sends invites or creates links
   - Returns: `{ success, documentIds, signingLinks }`

5. **Wix updates collections**
   - Updates `Cases.paperworkStatus`
   - Creates `PendingDocuments`
   - Creates `SigningSessions`

---

## Signing Methods Implementation

### 1. Email Method
**Dashboard.html:**
```javascript
signingMethod: 'email',
defendantEmail: 'defendant@email.com',
indemnitorEmails: ['ind1@email.com', 'ind2@email.com']
```

**GAS sends:**
- SignNow email invites to all parties
- Each party receives email with signing link

**Wix Portal:**
- Defendant/Indemnitor clicks "Sign Paperwork"
- Redirects to `/sign?link=...` (embedded SignNow)

### 2. SMS Method
**Dashboard.html:**
```javascript
signingMethod: 'sms',
defendantPhone: '239-555-1234',
indemnitorPhones: ['239-555-5678', '239-555-9012']
```

**GAS sends:**
- SignNow SMS messages to all parties
- Each party receives text with signing link

**Wix Portal:**
- Same as email method

### 3. Kiosk Method
**Dashboard.html:**
```javascript
signingMethod: 'kiosk',
signerEmail: 'defendant@example.com'
```

**GAS creates:**
- Embedded signing link (1 hour expiration)
- Saves link to `PendingDocuments`

**Wix Portal:**
- Opens lightbox with embedded SignNow
- In-office signing on iPad

### 4. Print Method
**Dashboard.html:**
```javascript
signingMethod: 'download'
```

**GAS generates:**
- PDFs with all data filled
- Saves to Google Drive
- Returns download URLs

**Wix Portal:**
- Download button
- Print for wet signature

---

## Key Features Preserved from Dashboard.html

### ✅ Multiple Indemnitors
- Dashboard.html has "+" button to add unlimited indemnitors
- Each indemnitor has full profile (name, DOB, SSN, DL, address, phone, email, employer)
- GAS sends signing invites to ALL indemnitors
- Wix Portal displays all indemnitors in Staff view

### ✅ Multiple Charges (Appearance Bonds)
- Dashboard.html allows adding multiple charges
- System generates ONE appearance bond per charge
- Appearance bonds are PRINT ONLY (not sent to SignNow)
- Premium calculation: $100 minimum per charge

### ✅ Payment Plan Auto-Selection
- Dashboard.html auto-calculates: `balance = premium - downPayment`
- If `balance > 0`, payment plan checkbox is auto-selected
- Payment plan document is included in packet
- Wix Portal displays payment plan to Indemnitor

### ✅ Document Selection (Checkboxes)
- Dashboard.html has checkboxes for all documents:
  - Indemnity Agreement
  - Defendant Application
  - Promissory Note
  - Disclosure Form
  - Surety Terms
  - Master Waiver
  - SSA Release
  - Collateral Receipt
  - Payment Plan (auto-selected if balance > 0)
  - Appearance Bonds (one per charge, print only)
- Staff selects which documents to include
- Selected documents are sent to SignNow (except appearance bonds)

### ✅ All 4 Signing Methods
- Email, SMS, Kiosk, Print
- All methods supported in both Dashboard.html and Wix Portal

---

## Next Steps for Deployment

### 1. Create Wix Collections
Use Wix CMS to create all required collections with proper field types and permissions.

### 2. Update Existing Portal Pages
Replace the existing portal page code with the new complete implementations:
- `portal-defendant.skg9y.js` → Use `portal-defendant-complete.js`
- `portal-indemnitor.k53on.js` → Use `portal-indemnitor-complete.js`
- `portal-staff.qs9dx.js` → Use `portal-staff-complete.js`

### 3. Add New Backend Module
- Add `signing-methods.jsw` to `src/backend/`

### 4. Configure Wix Secrets
Add to Wix Secrets Manager:
- `GAS_WEBHOOK_URL` - The GAS Web App URL
- `GAS_API_KEY` - For authentication (if needed)

### 5. Test Workflow End-to-End
1. Staff fills out Dashboard.html
2. Selects signing method (email)
3. Generates and sends
4. Verify data appears in Wix collections
5. Defendant logs into Wix Portal
6. Sees pending paperwork
7. Clicks "Sign Paperwork"
8. Redirects to SignNow
9. Signs documents
10. Webhook updates Wix collections
11. Staff sees "Completed" status

### 6. Deploy to Production
- Publish Wix site
- Test with real case
- Monitor for errors

---

## Maintenance Notes

### Schema Alignment
All field names in Wix collections MUST match the Universal Schema (v3.0) from `swfl-arrest-scrapers` repository.

### GAS Dashboard is Source of Truth
- All data entry happens in Dashboard.html
- All document assembly happens in GAS
- All PDF generation happens in GAS
- Wix Portal is ONLY for status display and signing launchpad

### No Duplication of Logic
- Do NOT rebuild premium calculation in Wix
- Do NOT rebuild appearance bond logic in Wix
- Do NOT rebuild payment plan logic in Wix
- All business logic stays in Dashboard.html/Code.gs

---

## Support Resources

- **Wix Velo:** https://www.wix.com/velo/reference
- **SignNow API:** https://docs.signnow.com
- **Google Apps Script:** https://developers.google.com/apps-script
- **GAS Project:** https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit
- **Google Sheets:** https://docs.google.com/spreadsheets/d/121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E/edit

---

**Implementation Complete:** All portal pages and backend integration are ready for deployment.
