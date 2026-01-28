# IntakeQueue Collection Schema

## Summary
(Paste schema details here)
# IntakeQueue Collection Schema

**Collection Name:** `IntakeQueue`  
**Display Name:** Intake Queue  
**Purpose:** Bridge between completed indemnitor paperwork, defendant records, and Google Apps Script (GAS) synchronization

**Created:** January 28, 2026  
**Status:** ✅ Active

---

## Overview

The **IntakeQueue** collection serves as the central data hub for tracking bail bond cases from initial intake through completed paperwork. It links defendants with their indemnitors, tracks document signing status via SignNow, and manages synchronization with the Google Apps Script (GAS) backend system.

---

## Field Schema

### System Fields (Auto-managed by Wix)

| Field Key | Display Name | Type | Required | Description |
|-----------|--------------|------|----------|-------------|
| `_id` | ID | TEXT | Yes | Unique identifier for each record |
| `_createdDate` | Created Date | DATETIME | Yes | Timestamp when record was created |
| `_updatedDate` | Updated Date | DATETIME | Yes | Timestamp when record was last updated |
| `_owner` | Owner | TEXT | Yes | Owner/creator of the record |

### Case Information

| Field Key | Display Name | Type | Required | Description |
|-----------|--------------|------|----------|-------------|
| `caseId` | Case ID | TEXT | Yes | Unique identifier for the bail bond case |
| `county` | County | TEXT | No | County where arrest occurred (e.g., "Lee County") |
| `arrestDate` | Arrest Date | DATETIME | No | Date and time of arrest |
| `charges` | Charges | TEXT | No | Criminal charges (comma-separated or JSON) |
| `bondAmount` | Bond Amount | NUMBER | No | Total bond amount set by court |
| `premiumAmount` | Premium Amount | NUMBER | No | Premium charged (typically 10% of bond) |

### Defendant Information

| Field Key | Display Name | Type | Required | Description |
|-----------|--------------|------|----------|-------------|
| `defendantName` | Defendant Name | TEXT | Yes | Full name of the defendant |
| `defendantEmail` | Defendant Email | TEXT | No | Defendant's email address |
| `defendantPhone` | Defendant Phone | TEXT | No | Defendant's phone number |

### Indemnitor Information

| Field Key | Display Name | Type | Required | Description |
|-----------|--------------|------|----------|-------------|
| `indemnitorName` | Indemnitor Name | TEXT | Yes | Full name of the indemnitor (co-signer) |
| `indemnitorEmail` | Indemnitor Email | TEXT | Yes | Indemnitor's email (used for SignNow) |
| `indemnitorPhone` | Indemnitor Phone | TEXT | No | Indemnitor's phone number |

### Document & Signing Status

| Field Key | Display Name | Type | Required | Description |
|-----------|--------------|------|----------|-------------|
| `documentStatus` | Document Status | TEXT | Yes | Current document status (e.g., "pending", "sent", "signed", "completed") |
| `signNowDocumentId` | SignNow Document ID | TEXT | No | SignNow document ID for tracking |
| `signNowStatus` | SignNow Status | TEXT | No | SignNow-specific status (e.g., "pending", "signed", "declined") |

### GAS Synchronization

| Field Key | Display Name | Type | Required | Description |
|-----------|--------------|------|----------|-------------|
| `gasSyncStatus` | GAS Sync Status | TEXT | No | Sync status with Google Apps Script (e.g., "pending", "synced", "error") |
| `gasSyncTimestamp` | GAS Sync Timestamp | DATETIME | No | Last successful sync timestamp |

### Workflow Tracking

| Field Key | Display Name | Type | Required | Description |
|-----------|--------------|------|----------|-------------|
| `status` | Status | TEXT | Yes | Overall case status (e.g., "intake", "in_progress", "completed", "cancelled") |
| `completedTimestamp` | Completed Timestamp | DATETIME | No | Timestamp when case was fully completed |
| `notes` | Notes | TEXT | No | Additional notes or comments |

---

## Permissions

| Operation | Permission Level |
|-----------|------------------|
| Insert | ADMIN |
| Update | ADMIN |
| Remove | ADMIN |
| Read | ADMIN |

---

## Usage Examples

### Creating a New Intake Record

```javascript
import wixData from 'wix-data';

const newIntake = {
  caseId: "CASE-2026-001234",
  defendantName: "John Doe",
  defendantEmail: "john.doe@example.com",
  defendantPhone: "239-555-1234",
  indemnitorName: "Jane Smith",
  indemnitorEmail: "jane.smith@example.com",
  indemnitorPhone: "239-555-5678",
  county: "Lee County",
  arrestDate: new Date("2026-01-27T14:30:00"),
  charges: "DUI, Reckless Driving",
  bondAmount: 5000,
  premiumAmount: 500,
  documentStatus: "pending",
  status: "intake",
  gasSyncStatus: "pending"
};

wixData.insert("IntakeQueue", newIntake)
  .then((result) => {
    console.log("Intake record created:", result._id);
  })
  .catch((error) => {
    console.error("Error creating intake:", error);
  });
```

### Querying by Case ID

```javascript
import wixData from 'wix-data';

wixData.query("IntakeQueue")
  .eq("caseId", "CASE-2026-001234")
  .find()
  .then((results) => {
    if (results.items.length > 0) {
      const intake = results.items[0];
      console.log("Found intake:", intake);
    }
  });
```

### Updating SignNow Status

```javascript
import wixData from 'wix-data';

wixData.query("IntakeQueue")
  .eq("caseId", "CASE-2026-001234")
  .find()
  .then((results) => {
    if (results.items.length > 0) {
      const intake = results.items[0];
      return wixData.update("IntakeQueue", {
        ...intake,
        signNowStatus: "signed",
        documentStatus: "completed",
        status: "completed",
        completedTimestamp: new Date()
      });
    }
  })
  .then(() => {
    console.log("Intake updated successfully");
  });
```

### Syncing with GAS

```javascript
import wixData from 'wix-data';

wixData.query("IntakeQueue")
  .eq("gasSyncStatus", "pending")
  .find()
  .then((results) => {
    results.items.forEach(async (intake) => {
      // Send to GAS endpoint
      const syncResult = await sendToGAS(intake);
      
      if (syncResult.success) {
        await wixData.update("IntakeQueue", {
          ...intake,
          gasSyncStatus: "synced",
          gasSyncTimestamp: new Date()
        });
      }
    });
  });
```

---

## Workflow States

### Status Field Values

| Status | Description |
|--------|-------------|
| `intake` | Initial record created, awaiting document preparation |
| `documents_prepared` | Documents generated and ready for signing |
| `sent_to_signer` | SignNow link sent to indemnitor |
| `partially_signed` | Some but not all signatures collected |
| `fully_signed` | All signatures collected |
| `completed` | Case fully processed and synced |
| `cancelled` | Case cancelled or abandoned |
| `error` | Error state requiring manual intervention |

### Document Status Values

| Document Status | Description |
|-----------------|-------------|
| `pending` | Documents not yet prepared |
| `generated` | Documents generated in GAS |
| `sent` | Sent to SignNow |
| `viewed` | Recipient viewed documents |
| `signed` | Documents signed |
| `completed` | Fully executed and stored |
| `declined` | Recipient declined to sign |

### GAS Sync Status Values

| Sync Status | Description |
|-------------|-------------|
| `pending` | Awaiting sync to GAS |
| `syncing` | Sync in progress |
| `synced` | Successfully synced |
| `error` | Sync failed (check logs) |

---

## Integration Points

### 1. Google Apps Script (GAS)
- **Dashboard.html** creates initial intake records
- GAS generates documents and populates arrest data
- Webhook updates sync status after document generation

### 2. SignNow
- Document IDs stored in `signNowDocumentId`
- Webhook updates `signNowStatus` on signing events
- Completion triggers status change to "completed"

### 3. Wix Portal
- Member dashboard queries by `indemnitorEmail` or `defendantEmail`
- Portal displays status and allows document access
- ID upload triggers final completion workflow

---

## Notes

- **Many-to-Many Relationship:** An indemnitor can have multiple cases; a person can be both defendant and indemnitor in different cases
- **Email as Key:** `indemnitorEmail` is critical for linking magic link authentication to cases
- **Required Fields:** Minimum required fields are `caseId`, `defendantName`, `indemnitorName`, `indemnitorEmail`, `documentStatus`, and `status`
- **Extensibility:** Additional fields can be added as needed without breaking existing functionality

---

## Maintenance

### Adding New Fields

To add new fields to the collection, use the Wix Data API:

```javascript
// Example: Add a new field via API
// Use Wix Dashboard > CMS > IntakeQueue > Manage Fields
// Or use the Data Collections API programmatically
```

### Backup and Export

Regular backups should be performed via:
1. Wix Dashboard export (CSV)
2. Automated backup to Google Drive
3. Database snapshots before major changes

---

**Last Updated:** January 28, 2026  
**Maintained By:** Shamrock Bail Bonds Development Team
