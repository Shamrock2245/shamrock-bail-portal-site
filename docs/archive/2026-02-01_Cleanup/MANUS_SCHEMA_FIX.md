# 🟢 Manus Guide: Fixing Wix CMS Schemas

**Objective:** The "Portal Sessions" and "IntakeQueue" collections have undefined fields (yellow triangles) in the Live CMS. This blocks backend code from querying or saving data.

**Action Required:** "Define" the following fields in the Wix CMS Dashboard for each collection.

---

## 1. Collection: `Portal Sessions`
*Go to CMS -> Portal Sessions -> Manage Fields*

| Field Key (Internal) | Display Name (Optional) | Field Type |
| :--- | :--- | :--- |
| `sessionToken` | Session Token | **Text** |
| `personId` | Person ID | **Text** |
| `role` | Role | **Text** |
| `caseId` | Case ID | **Text** |
| `email` | Email | **Text** |
| `phone` | Phone | **Text** |
| `name` | Name | **Text** |
| `isActive` | Is Active | **Boolean** |
| `lastActivity` | Last Activity | **Date and Time** |
| `expiresAt` | Expires At | **Date and Time** |
| `createdAt` | Created At | **Date and Time** |

---

## 2. Collection: `IntakeQueue`
*Go to CMS -> IntakeQueue -> Manage Fields*

| Field Key (Internal) | Display Name (Optional) | Field Type |
| :--- | :--- | :--- |
| `caseId` | Case ID | **Text** |
| `defendantName` | Defendant Name | **Text** |
| `defendantEmail` | Defendant Email | **Text** |
| `defendantPhone` | Defendant Phone | **Text** |
| `indemnitorName` | Indemnitor Name | **Text** |
| `indemnitorEmail` | Indemnitor Email | **Text** |
| `indemnitorPhone` | Indemnitor Phone | **Text** |
| `status` | Status | **Text** |
| `documentStatus` | Document Status | **Text** |
| `gasSyncStatus` | GAS Sync Status | **Text** |
| `reference1Name` | Reference 1 Name | **Text** |
| `reference1Phone` | Reference 1 Phone | **Text** |
| `reference2Name` | Reference 2 Name | **Text** |
| `reference2Phone` | Reference 2 Phone | **Text** |

---

## 3. Final Step
*   **Publish the Site:** Schema updates often require a publish to take effect for the live backend code.
