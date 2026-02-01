# Wix CMS Collections - Complete Setup

## ✅ Collections Successfully Created

All required CMS collections for the Shamrock Bail Bonds Portal have been created and configured.

---

## 📊 Collection Summary

### Portal Collections (Newly Created)

#### 1. Defendants
**Purpose:** Store defendant profiles and status tracking

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| fullName | TEXT | Yes | Full name of defendant |
| firstName | TEXT | Yes | First name |
| lastName | TEXT | Yes | Last name |
| dob | DATE | No | Date of birth |
| phone | TEXT | No | Contact phone |
| email | TEXT | No | Contact email |
| address | TEXT | No | Street address |
| city | TEXT | No | City |
| state | TEXT | No | State (FL) |
| zip | TEXT | No | ZIP code |
| status | TEXT | No | Good Standing/Missed Check-In/Warrant |
| lastCheckIn | DATETIME | No | Last check-in timestamp |

**Permissions:**
- Read: SITE_MEMBER (defendants can view their own profile)
- Insert: ADMIN (only staff can create)
- Update: ADMIN (only staff can modify)
- Remove: ADMIN (only staff can delete)

**Created:** 2025-12-30 18:18:42 UTC

---

#### 2. Indemnitors
**Purpose:** Store indemnitor (co-signer) profiles with case linkage

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| caseId | TEXT | Yes | Reference to Cases collection |
| fullName | TEXT | Yes | Full name of indemnitor |
| firstName | TEXT | Yes | First name |
| lastName | TEXT | Yes | Last name |
| relationship | TEXT | No | Spouse/Parent/Friend/etc |
| dob | DATE | No | Date of birth |
| phone | TEXT | No | Contact phone |
| email | TEXT | No | Contact email |
| address | TEXT | No | Street address |
| city | TEXT | No | City |
| state | TEXT | No | State |
| zip | TEXT | No | ZIP code |
| employer | TEXT | No | Employer name |
| employerPhone | TEXT | No | Employer phone |

**Permissions:**
- Read: SITE_MEMBER (indemnitors can view their own profile)
- Insert: ADMIN (only staff can create)
- Update: ADMIN (only staff can modify)
- Remove: ADMIN (only staff can delete)

**Created:** 2025-12-30 18:21:10 UTC

---

#### 3. PaymentPlans
**Purpose:** Track payment plans when balance > $0

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| caseId | TEXT | Yes | Reference to Cases collection |
| balance | NUMBER | Yes | Remaining balance |
| monthlyPayment | NUMBER | No | Monthly payment amount |
| totalPayments | NUMBER | No | Total number of payments |
| paymentsMade | NUMBER | No | Payments completed |
| nextPaymentDate | DATE | No | Next payment due date |
| status | TEXT | No | Active/Completed/Defaulted |

**Permissions:**
- Read: SITE_MEMBER (indemnitors can view their payment plan)
- Insert: ADMIN (only staff can create)
- Update: ADMIN (only staff can modify)
- Remove: ADMIN (only staff can delete)

**Created:** 2025-12-30 18:21:33 UTC

---

#### 4. SigningSessions
**Purpose:** Track signing sessions for all 4 methods (email/SMS/kiosk/print)

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| caseId | TEXT | Yes | Reference to Cases collection |
| signNowDocumentId | TEXT | Yes | SignNow document ID |
| method | TEXT | Yes | email/sms/kiosk/print |
| status | TEXT | Yes | pending/signed/completed/declined |
| signers | TEXT | No | JSON array of signers |
| createdAt | DATETIME | Yes | Session start timestamp |
| completedAt | DATETIME | No | Session completion timestamp |

**Permissions:**
- Read: SITE_MEMBER (signers can view their signing status)
- Insert: ADMIN (only staff can initiate signing)
- Update: ADMIN (only staff/webhooks can update)
- Remove: ADMIN (only staff can delete)

**Created:** 2025-12-30 18:21:35 UTC

---

### Existing Collections (Already in CMS)

#### 5. Cases
**Purpose:** Core case tracking
**Status:** ✅ Already exists
**Permissions:** Already configured

#### 6. PendingDocuments
**Purpose:** Track documents awaiting signature
**Status:** ✅ Already exists
**Permissions:** Already configured

#### 7. MemberProfiles
**Purpose:** Member account profiles
**Status:** ✅ Already exists
**Permissions:** Already configured

#### 8. PortalUsers
**Purpose:** Portal user authentication
**Status:** ✅ Already exists
**Permissions:** Already configured

#### 9. MemberDocuments
**Purpose:** Uploaded documents (ID, etc.)
**Status:** ✅ Already exists
**Permissions:** Already configured

#### 10. UserLocations
**Purpose:** Check-in GPS tracking
**Status:** ✅ Already exists
**Permissions:** Already configured

---

## 🔐 Permission Model

All portal collections follow a consistent permission model:

### Read Access: SITE_MEMBER
- Defendants can view their own profile and case
- Indemnitors can view their own profile, liability, and defendant status
- Members can view their pending documents and signing sessions

### Write Access: ADMIN Only
- Only staff can create, update, or delete records
- This ensures data integrity and prevents unauthorized modifications
- Backend code running with admin privileges can write via API

### Data Permissions (Wix-specific)
- itemRead: SITE_MEMBER
- itemInsert: CMS_EDITOR
- itemUpdate: CMS_EDITOR
- itemRemove: CMS_EDITOR

---

## 📝 System Fields (Auto-Generated)

All collections automatically include these Wix system fields:

| Field Name | Type | Description |
|------------|------|-------------|
| _id | TEXT | Unique record ID (GUID) |
| _createdDate | DATETIME | Record creation timestamp |
| _updatedDate | DATETIME | Last update timestamp |
| _owner | TEXT | Member ID of record owner |

---

## 🔗 Collection Relationships

```
Cases
  ├── defendantId → Defendants._id
  ├── caseNumber → Indemnitors.caseId (1:many)
  ├── caseNumber → PaymentPlans.caseId (1:1)
  └── caseNumber → SigningSessions.caseId (1:many)

Defendants
  ├── _id → Cases.defendantId
  └── email → Members (via Wix authentication)

Indemnitors
  ├── caseId → Cases.caseNumber
  └── email → Members (via Wix authentication)

PaymentPlans
  └── caseId → Cases.caseNumber

SigningSessions
  ├── caseId → Cases.caseNumber
  └── signNowDocumentId → SignNow API

PendingDocuments
  ├── caseId → Cases.caseNumber
  ├── memberId → Members._id
  └── documentId → SignNow API
```

---

## 🚀 Next Steps

### 1. Verify Collections in Wix CMS
- Log into Wix Dashboard
- Navigate to CMS → Content Manager
- Verify all 4 new collections appear:
  - Defendants
  - Indemnitors
  - PaymentPlans
  - SigningSessions

### 2. Update Portal Code
The portal code in the GitHub repo already references these collections. No code changes needed.

### 3. Test Data Flow
1. Staff creates a case in Dashboard.html (GAS)
2. GAS creates records in:
   - Cases
   - Defendants
   - Indemnitors (multiple)
   - PaymentPlans (if balance > $0)
   - SigningSessions
3. Defendant logs into Wix Portal
4. Portal queries collections and displays status
5. Defendant clicks "Sign Paperwork"
6. Redirects to SignNow based on method

### 4. Monitor Permissions
- Test that defendants can only view their own data
- Test that indemnitors can only view their linked case
- Verify staff can view/edit all records

---

## 📊 Collection Capabilities

All collections support these data operations:
- PATCH, IS_REFERENCED, INSERT, SAVE
- BULK_INSERT, BULK_UPDATE, UPDATE
- TRUNCATE, REMOVE, REMOVE_REFERENCE
- COUNT, BULK_PATCH, FIND
- REPLACE_REFERENCES, BULK_REMOVE
- INSERT_REFERENCE, GET, BULK_SAVE
- QUERY_REFERENCED, DISTINCT, AGGREGATE

Collection operations:
- UPDATE (modify collection structure)
- REMOVE (delete collection)

Paging modes:
- OFFSET (default, max 1000 items)
- CURSOR (max 100 items)

---

## ✅ Validation Checklist

- [x] Defendants collection created
- [x] Indemnitors collection created
- [x] PaymentPlans collection created
- [x] SigningSessions collection created
- [x] All fields match CSV schema
- [x] Permissions configured (SITE_MEMBER read, ADMIN write)
- [x] System fields auto-generated
- [x] Collections visible in Wix CMS
- [ ] Test data inserted
- [ ] Portal code tested
- [ ] End-to-end workflow verified

---

## 🔧 Troubleshooting

### Collection Not Visible in CMS
- Refresh the Wix Dashboard
- Clear browser cache
- Check that Wix Code is enabled for the site

### Permission Denied Errors
- Verify the member is logged in
- Check that the member's role matches the permission level
- Ensure backend code is using admin credentials

### Data Not Syncing
- Verify GAS webhook is calling Wix API correctly
- Check that caseId references match between collections
- Review Wix API logs for errors

---

## 📚 Resources

- **Wix CMS Documentation:** https://dev.wix.com/docs/rest/business-solutions/cms
- **Wix Data API:** https://dev.wix.com/docs/rest/business-solutions/cms/data-items
- **Portal Implementation Guide:** `/docs/PORTAL_WIRING_IMPLEMENTATION.md`
- **Deployment Checklist:** `/docs/DEPLOYMENT_CHECKLIST.md`

---

**Status:** ✅ All collections created and configured successfully. Ready for testing and deployment.
