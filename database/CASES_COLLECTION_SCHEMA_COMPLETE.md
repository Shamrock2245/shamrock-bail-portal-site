# Cases Collection - Complete Schema for Bond Lifecycle

**Purpose:** Track active bail bonds from posting through discharge/forfeiture  
**Source:** Transitioned from IntakeQueue after paperwork finalized  
**Storage:** Wix CMS + Google Drive (documents vault)

---

## Schema Definition

### Core Case Identifiers
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | Text | Auto | Wix auto-generated ID |
| `caseId` | Text | Yes | Internal case ID (e.g., CASE-2026-001) |
| `powerNumber` | Text | Yes | Bond power number from surety |
| `caseNumber` | Text | Yes | Court case number |
| `bookingNumber` | Text | No | Jail booking number |
| `receiptNumber` | Text | No | Payment receipt number |

### Status Tracking
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | Text | Yes | `intake`, `active`, `discharged`, `forfeited`, `surrendered`, `exonerated` |
| `custodyStatus` | Text | Yes | `in_custody`, `released`, `surrendered` |
| `paperworkStatus` | Text | Yes | `pending`, `sent`, `signed`, `completed` |
| `paymentStatus` | Text | Yes | `unpaid`, `partial`, `paid`, `refunded` |

### Defendant Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `defendantId` | Reference | No | Link to Defendants collection |
| `defendantName` | Text | Yes | Full name |
| `defendantFirstName` | Text | No | First name |
| `defendantLastName` | Text | No | Last name |
| `defendantDOB` | Date | No | Date of birth |
| `defendantSSN` | Text | No | Last 4 digits only |
| `defendantDLNumber` | Text | No | Driver's license number |
| `defendantDLState` | Text | No | DL state |
| `defendantAddress` | Text | No | Street address |
| `defendantCity` | Text | No | City |
| `defendantState` | Text | No | State (default: FL) |
| `defendantZipCode` | Text | No | ZIP code |
| `defendantPhone` | Text | No | Phone number |
| `defendantEmail` | Text | No | Email address |

### Indemnitor Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `indemnitorId` | Reference | No | Link to Indemnitors collection |
| `indemnitorName` | Text | Yes | Full name |
| `indemnitorFirstName` | Text | No | First name |
| `indemnitorLastName` | Text | No | Last name |
| `indemnitorPhone` | Text | Yes | Phone number |
| `indemnitorEmail` | Text | Yes | Email address |
| `indemnitorAddress` | Text | No | Street address |
| `indemnitorCity` | Text | No | City |
| `indemnitorState` | Text | No | State |
| `indemnitorZipCode` | Text | No | ZIP code |
| `indemnitorRelationship` | Text | No | Relationship to defendant |
| `indemnitorEmployer` | Text | No | Employer name |
| `indemnitorEmployerPhone` | Text | No | Employer phone |

### Financial Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bondAmount` | Number | Yes | Total bond amount |
| `premiumAmount` | Number | Yes | Premium charged |
| `premiumRate` | Number | No | Premium rate (e.g., 10%) |
| `premiumPaid` | Number | Yes | Amount paid so far |
| `premiumBalance` | Number | Yes | Remaining balance |
| `downPayment` | Number | No | Initial down payment |
| `paymentPlanId` | Reference | No | Link to PaymentPlans collection |
| `paymentMethod` | Text | No | `cash`, `card`, `check`, `wire`, `plan` |
| `collateralRequired` | Boolean | No | Whether collateral is required |
| `collateralDescription` | RichText | No | Description of collateral |
| `collateralValue` | Number | No | Estimated value |

### Court Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `county` | Text | Yes | County (e.g., Lee, Collier) |
| `courtType` | Text | No | `circuit`, `county`, `federal` |
| `arrestDate` | DateTime | No | Date of arrest |
| `releaseDate` | DateTime | No | Date released from custody |
| `nextCourtDate` | DateTime | No | Next scheduled court appearance |
| `courtDates` | RichText | No | All court dates (JSON or formatted text) |
| `charges` | RichText | No | List of charges |
| `jailFacility` | Text | No | Jail facility name |

### Document Tracking
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signNowDocumentId` | Text | No | SignNow document ID |
| `driveFileId` | Text | No | Google Drive file ID |
| `driveFolderUrl` | URL | No | Google Drive folder URL |
| `documentsSignedDate` | DateTime | No | When all signatures completed |
| `allSignaturesComplete` | Boolean | No | Whether all signers have signed |
| `documentLinks` | RichText | No | JSON array of document links |

### Lifecycle Dates
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `intakeSubmittedAt` | DateTime | No | When IntakeQueue form submitted |
| `postedDate` | DateTime | No | When bond was posted |
| `finalizedAt` | DateTime | Yes | When case was finalized (IntakeQueue → Cases) |
| `finalizedBy` | Text | Yes | Staff email who finalized |
| `dischargedDate` | DateTime | No | When bond was discharged |
| `forfeitedDate` | DateTime | No | If bond was forfeited |
| `surrenderedDate` | DateTime | No | If defendant was surrendered |
| `exoneratedDate` | DateTime | No | If bond was exonerated |
| `closedDate` | DateTime | No | When case was closed |

### Compliance & Audit
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `intakeQueueId` | Text | No | Reference to original IntakeQueue record (for audit) |
| `isEditable` | Boolean | Yes | Lock editing after posting (default: false) |
| `editableBy` | Text | No | Who can edit (e.g., `admin`) |
| `gasSheetRow` | Number | No | GAS sync reference (row number) |
| `lastSyncedAt` | DateTime | No | Last sync with GAS |
| `notes` | RichText | No | Staff notes |
| `internalNotes` | RichText | No | Internal notes (not visible to clients) |
| `flagged` | Boolean | No | Flagged for review |
| `flagReason` | Text | No | Reason for flag |

### Communication Tracking
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lastContactDate` | DateTime | No | Last contact with defendant/indemnitor |
| `lastContactMethod` | Text | No | `email`, `sms`, `phone`, `in_person` |
| `checkInFrequency` | Text | No | Required check-in frequency |
| `missedCheckIns` | Number | No | Count of missed check-ins |
| `communicationLog` | RichText | No | JSON array of communication history |

### Risk Assessment
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `riskLevel` | Text | No | `low`, `medium`, `high` |
| `flightRisk` | Boolean | No | Whether defendant is flight risk |
| `gpsMonitoring` | Boolean | No | Whether GPS monitoring required |
| `travelRestrictions` | Text | No | Travel restrictions |

### Metadata
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_createdDate` | DateTime | Auto | Wix auto-generated |
| `_updatedDate` | DateTime | Auto | Wix auto-generated |
| `_owner` | Text | Auto | Wix auto-generated |

---

## Field Permissions

### Admin
- Full read/write access to all fields
- Can edit even when `isEditable = false`

### Staff
- Read access to all fields
- Write access only when `isEditable = true`
- Cannot edit financial fields after posting

### Defendant/Indemnitor (Portal)
- Read access to: status, court dates, payment balance, documents
- Write access to: communication log (check-ins)
- No access to: internal notes, risk assessment, financial details

---

## Indexes (for Performance)

1. `status` - Filter active/discharged cases
2. `county` - Filter by county
3. `nextCourtDate` - Sort by upcoming court dates
4. `defendantName` - Search by name
5. `caseNumber` - Search by case number
6. `powerNumber` - Search by power number
7. `finalizedAt` - Sort by date finalized

---

## Relationships

### Cases → Defendants (Many-to-One)
- Multiple cases can reference the same defendant
- `defendantId` field links to Defendants collection

### Cases → Indemnitors (Many-to-Many)
- One case can have multiple indemnitors
- One indemnitor can be on multiple cases
- Separate IndemnitorCases junction table recommended

### Cases → PaymentPlans (One-to-One)
- Each case can have one payment plan
- `paymentPlanId` field links to PaymentPlans collection

### Cases → Documents (One-to-Many)
- Each case has multiple documents
- Documents stored in Google Drive
- `driveFolderUrl` points to case folder

---

## Validation Rules

1. **Power Number** - Required before status = 'active'
2. **Case Number** - Required before status = 'active'
3. **Bond Amount** - Must be > 0
4. **Premium Amount** - Must be > 0 and <= bondAmount
5. **Premium Balance** - Must be >= 0
6. **Custody Status** - Must be 'released' before finalization
7. **Finalized By** - Must be valid staff email

---

## Lifecycle State Machine

```
intake → active → (discharged | forfeited | surrendered | exonerated) → closed
```

### State Transitions
- **intake → active**: Requires powerNumber, caseNumber, custodyStatus='released'
- **active → discharged**: Requires court discharge documentation
- **active → forfeited**: Requires forfeiture documentation
- **active → surrendered**: Requires surrender documentation
- **active → exonerated**: Requires exoneration documentation
- **any → closed**: Final state, no further transitions

---

## Integration Points

### Google Drive
- Case folder created: `/Cases/{county}/{year}/{caseNumber}/`
- All signed documents stored in case folder
- `driveFolderUrl` updated after folder creation

### SignNow
- `signNowDocumentId` stored after document creation
- Webhook updates `documentsSignedDate` and `allSignaturesComplete`

### Twilio
- SMS notifications sent for:
  - Court date reminders (48 hours before)
  - Payment reminders (7 days before due)
  - Check-in reminders

### GAS Dashboard
- Cases synced to GAS spreadsheet
- `gasSheetRow` tracks row number
- `lastSyncedAt` tracks sync timestamp

---

## Migration from IntakeQueue

When `finalizeCase()` is called:

1. Copy all IntakeQueue fields to Cases
2. Add powerNumber, caseNumber, custodyStatus
3. Set status = 'active'
4. Set finalizedAt = now
5. Set finalizedBy = staff email
6. Set isEditable = false
7. Store intakeQueueId for audit trail
8. Delete IntakeQueue record

---

## CSV Import Template

For bulk case import:

```csv
caseId,powerNumber,caseNumber,defendantName,indemnitorName,bondAmount,premiumAmount,county,status
CASE-001,PWR-12345,2026-CF-001,John Doe,Jane Smith,10000,1000,Lee,active
```

---

**Status:** SCHEMA COMPLETE - READY FOR WIX CMS IMPLEMENTATION  
**Last Updated:** 2026-02-02  
**Next Step:** Update Wix CMS Cases collection with these fields
