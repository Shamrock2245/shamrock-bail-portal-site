# Wix Portal Deployment Checklist

## ✅ Code Complete (Pushed to GitHub)

All portal code has been implemented and pushed to the repository:
- ✅ `src/backend/signing-methods.jsw` - Integration layer for all signing methods
- ✅ `src/pages/portal-defendant-complete.js` - Defendant portal with check-in and signing
- ✅ `src/pages/portal-indemnitor-complete.js` - Indemnitor portal with liability and payments
- ✅ `src/pages/portal-staff-complete.js` - Staff portal for monitoring and triggering workflows
- ✅ `docs/PORTAL_WIRING_IMPLEMENTATION.md` - Complete documentation

---

## 🔧 Wix Configuration Steps

### Step 1: Create Wix CMS Collections

Create the following collections in Wix CMS (Content Manager):

#### `Cases`
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| caseNumber | Text | Yes | Unique case identifier |
| bookingNumber | Text | No | Sheriff booking number |
| defendantId | Text | Yes | Reference to Defendants |
| defendantName | Text | Yes | Full name |
| defendantEmail | Text | No | Contact email |
| defendantPhone | Text | No | Contact phone |
| bondAmount | Number | Yes | Total bond amount |
| premiumAmount | Number | No | 10% premium |
| downPayment | Number | No | Down payment made |
| chargeCount | Number | No | Number of charges |
| courtDate | Date | No | Next court date |
| courtTime | Text | No | Court time |
| courtLocation | Text | No | Court address |
| county | Text | No | Florida county |
| status | Text | Yes | Active/Pending/Closed |
| paperworkStatus | Text | Yes | Not Started/Sent/Completed |
| signingMethod | Text | No | email/sms/kiosk/print |

#### `Defendants`
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| fullName | Text | Yes | Full name |
| firstName | Text | Yes | First name |
| lastName | Text | Yes | Last name |
| dob | Date | No | Date of birth |
| phone | Text | No | Phone number |
| email | Text | No | Email address |
| address | Text | No | Street address |
| city | Text | No | City |
| state | Text | No | State (FL) |
| zip | Text | No | ZIP code |
| status | Text | Yes | Good Standing/Missed Check-In/Warrant |
| lastCheckIn | Date | No | Last check-in date |

#### `Indemnitors`
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| caseId | Text | Yes | Reference to Cases |
| fullName | Text | Yes | Full name |
| firstName | Text | Yes | First name |
| lastName | Text | Yes | Last name |
| relationship | Text | No | Spouse/Parent/Friend/etc |
| dob | Date | No | Date of birth |
| phone | Text | No | Phone number |
| email | Text | No | Email address |
| address | Text | No | Street address |
| city | Text | No | City |
| state | Text | No | State |
| zip | Text | No | ZIP code |
| employer | Text | No | Employer name |
| employerPhone | Text | No | Employer phone |

#### `PaymentPlans`
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| caseId | Text | Yes | Reference to Cases |
| balance | Number | Yes | Remaining balance |
| monthlyPayment | Number | No | Monthly payment amount |
| totalPayments | Number | No | Total number of payments |
| paymentsMade | Number | No | Payments completed |
| nextPaymentDate | Date | No | Next payment due |
| status | Text | Yes | Active/Completed/Defaulted |

#### `PendingDocuments`
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| caseId | Text | Yes | Reference to Cases |
| memberId | Text | Yes | Wix member ID |
| documentId | Text | Yes | SignNow document ID |
| signingLink | Text | No | Embedded signing URL |
| downloadUrl | Text | No | PDF download URL |
| method | Text | Yes | email/sms/kiosk/print |
| status | Text | Yes | pending/signed/expired |
| expiresAt | Date | No | Link expiration |
| signedAt | Date | No | Signature timestamp |
| createdAt | Date | Yes | Creation timestamp |

#### `SigningSessions`
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| caseId | Text | Yes | Reference to Cases |
| signNowDocumentId | Text | Yes | SignNow document ID |
| method | Text | Yes | email/sms/kiosk/print |
| status | Text | Yes | pending/signed/completed/declined |
| signers | Text | No | JSON array of signers |
| createdAt | Date | Yes | Session start |
| completedAt | Date | No | Session completion |

#### `SignatureEvents`
| Field Name | Type | Required | Notes |
|------------|------|----------|-------|
| sessionId | Text | No | Reference to SigningSessions |
| caseId | Text | Yes | Reference to Cases |
| documentId | Text | Yes | SignNow document ID |
| signerEmail | Text | No | Signer email |
| signerRole | Text | No | Defendant/Indemnitor |
| eventType | Text | Yes | viewed/signed/declined/invite_sent |
| eventTime | Date | Yes | Event timestamp |

---

### Step 2: Update Portal Page Code

In Wix Editor, replace the code for each portal page:

1. **Defendant Portal** (`portal-defendant.skg9y`)
   - Copy code from `src/pages/portal-defendant-complete.js`
   - Paste into Wix Code panel

2. **Indemnitor Portal** (`portal-indemnitor.k53on`)
   - Copy code from `src/pages/portal-indemnitor-complete.js`
   - Paste into Wix Code panel

3. **Staff Portal** (`portal-staff.qs9dx`)
   - Copy code from `src/pages/portal-staff-complete.js`
   - Paste into Wix Code panel

---

### Step 3: Add Backend Module

1. In Wix Editor, go to **Backend** section
2. Create new file: `signing-methods.jsw`
3. Copy code from `src/backend/signing-methods.jsw`
4. Paste into Wix Code panel

---

### Step 4: Configure Wix Secrets (Optional)

If you want to secure the GAS URL:

1. Go to **Wix Secrets Manager**
2. Add secret: `GAS_WEBHOOK_URL`
3. Value: `https://script.google.com/a/macros/shamrockbailbonds.biz/s/AKfycbzU7hz5OCAZkkdjOZdKK6t7K0whw65iMH-EOzxtSf7KkVCuLvy1X-Las8CgGdTMw8pOpg/exec`

Then update `signing-methods.jsw`:
```javascript
import { getSecret } from 'wix-secrets-backend';
const GAS_WEB_APP_URL = await getSecret('GAS_WEBHOOK_URL');
```

---

### Step 5: Design Portal Pages (UI Elements)

Each portal page needs UI elements. Here are the required element IDs:

#### Defendant Portal Elements
- `#loadingBox` - Loading indicator
- `#mainContent` - Main content container
- `#welcomeText` - Welcome message
- `#caseNumberText` - Case number display
- `#bondAmountText` - Bond amount display
- `#nextCourtDateText` - Court date display
- `#caseStatusText` - Case status display
- `#caseStatusBox` - Status container
- `#signingStatusText` - Signing status display
- `#paperworkSection` - Paperwork section container
- `#paperworkStatusText` - Paperwork status text
- `#paperworkInstructions` - Signing instructions
- `#signEmailBtn` - Sign via email button
- `#signKioskBtn` - Sign via kiosk button
- `#downloadPrintBtn` - Download/print button
- `#checkInBtn` - Check-in button
- `#selfieUpload` - Selfie upload widget
- `#updateNotesInput` - Check-in notes input
- `#checkInStatusText` - Check-in status text
- `#statusBox` - Status message box
- `#contactBtn` - Contact button

#### Indemnitor Portal Elements
- `#loadingBox` - Loading indicator
- `#mainContent` - Main content container
- `#welcomeText` - Welcome message
- `#liabilityText` - Total liability amount
- `#liabilityLabel` - Liability label
- `#premiumText` - Premium amount
- `#downPaymentText` - Down payment amount
- `#balanceText` - Balance due
- `#chargeCountText` - Number of charges
- `#defendantNameText` - Defendant name
- `#defendantStatusText` - Defendant status
- `#defendantStatusBox` - Status container
- `#lastCheckInText` - Last check-in date
- `#nextCourtDateText` - Next court date
- `#paymentPlanSection` - Payment plan section
- `#planBalanceText` - Plan balance
- `#monthlyPaymentText` - Monthly payment
- `#nextPaymentDateText` - Next payment date
- `#paymentsProgressText` - Payments progress
- `#paymentProgressBar` - Progress bar
- `#makePaymentBtn` - Make payment button
- `#paperworkSection` - Paperwork section
- `#paperworkStatusText` - Paperwork status
- `#signPaperworkBtn` - Sign paperwork button
- `#contactBtn` - Contact button

#### Staff Portal Elements
- `#loadingBox` - Loading indicator
- `#mainContent` - Main content container
- `#welcomeText` - Welcome message
- `#activeCasesCount` - Active cases count
- `#pendingSignaturesCount` - Pending signatures count
- `#completedTodayCount` - Completed today count
- `#failedCount` - Failed count
- `#filterAllBtn` - Filter all button
- `#filterPendingBtn` - Filter pending button
- `#filterActiveBtn` - Filter active button
- `#filterCompletedBtn` - Filter completed button
- `#searchInput` - Search input
- `#refreshBtn` - Refresh button
- `#casesList` - Cases list container
- `#noCasesMessage` - No cases message
- `#casesRepeater` - Cases repeater
- `#caseDetailsBox` - Case details container
- `#detailCaseNumber` - Detail case number
- `#detailDefendantName` - Detail defendant name
- `#detailBondAmount` - Detail bond amount
- `#detailPremium` - Detail premium
- `#detailBalance` - Detail balance
- `#detailChargeCount` - Detail charge count
- `#detailCourtDate` - Detail court date
- `#detailCourtTime` - Detail court time
- `#paperworkStatusText` - Paperwork status
- `#paperworkMethodText` - Paperwork method
- `#signersStatusBox` - Signers status
- `#indemnitorsListBox` - Indemnitors list
- `#resendPaperworkBtn` - Resend paperwork button
- `#closeCaseDetailsBtn` - Close details button
- `#sendPaperworkModal` - Send paperwork modal
- `#modalCaseNumber` - Modal case number
- `#modalDefendantName` - Modal defendant name
- `#signingMethodDropdown` - Signing method dropdown
- `#defendantEmailInput` - Defendant email input
- `#defendantPhoneInput` - Defendant phone input
- `#emailInputsBox` - Email inputs container
- `#phoneInputsBox` - Phone inputs container
- `#sendPaperworkBtn` - Send paperwork button
- `#cancelSendBtn` - Cancel button
- `#successMessageBox` - Success message container
- `#successMessageText` - Success message text
- `#errorMessageBox` - Error message container
- `#errorMessageText` - Error message text

**Repeater Item Elements** (inside `#casesRepeater`):
- `#caseNumberText`
- `#defendantNameText`
- `#bondAmountText`
- `#caseStatusText`
- `#createdDateText`
- `#paperworkStatusText`
- `#signingMethodText`
- `#viewDetailsBtn`
- `#sendPaperworkBtn`

---

### Step 6: Test Workflow

1. **Create Test Case in GAS**
   - Open Dashboard.html
   - Fill out defendant info
   - Add 1-2 indemnitors
   - Add 1-2 charges
   - Select signing method: Email
   - Click "Generate & Send"

2. **Verify Wix Collections**
   - Check `Cases` collection for new record
   - Check `Defendants` collection
   - Check `Indemnitors` collection
   - Check `PendingDocuments` collection

3. **Test Defendant Portal**
   - Log in as defendant
   - Verify case status displays
   - Click "Sign Paperwork"
   - Verify redirect to SignNow

4. **Test Indemnitor Portal**
   - Log in as indemnitor
   - Verify liability displays
   - Verify defendant status displays
   - Click "Sign Paperwork"

5. **Test Staff Portal**
   - Log in as staff
   - Verify case appears in list
   - Click "View Details"
   - Click "Send Paperwork"
   - Select method and send

---

## 🚀 Production Deployment

1. **Publish Wix Site**
   - Click "Publish" in Wix Editor
   - Verify all pages are live

2. **Test with Real Case**
   - Use a real defendant/indemnitor
   - Complete full workflow
   - Monitor for errors

3. **Monitor Collections**
   - Check data is saving correctly
   - Verify signing status updates

4. **Enable Notifications**
   - Configure email notifications for staff
   - Configure SMS notifications for defendants

---

## 📊 Success Metrics

- ✅ Defendant can view case status
- ✅ Defendant can check in with selfie + GPS
- ✅ Defendant can sign paperwork via email/SMS/kiosk/print
- ✅ Indemnitor can view liability and defendant status
- ✅ Indemnitor can view payment plan
- ✅ Indemnitor can sign paperwork
- ✅ Staff can view all active cases
- ✅ Staff can trigger signing for any method
- ✅ Staff can monitor paperwork status
- ✅ All signing methods work (email/SMS/kiosk/print)
- ✅ Multiple indemnitors supported
- ✅ Multiple charges supported
- ✅ Payment plan auto-selected when balance > $0

---

## 🔗 Resources

- **GitHub Repo:** https://github.com/Shamrock2245/shamrock-bail-portal-site
- **GAS Project:** https://script.google.com/u/0/home/projects/12BRRdYuyVJpQODJq2-OpUhQdZ9YLt4bbAFWmOUyJPWM_EcazKTiu3dYo/edit
- **Google Sheets:** https://docs.google.com/spreadsheets/d/121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E/edit
- **Implementation Guide:** `docs/PORTAL_WIRING_IMPLEMENTATION.md`
- **Wix Velo Docs:** https://www.wix.com/velo/reference
- **SignNow API:** https://docs.signnow.com

---

**Status:** Code complete and pushed to GitHub. Ready for Wix configuration and deployment.
