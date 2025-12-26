# Portal Schema Mapping

**Date:** December 26, 2025  
**Status:** Initial Draft

## 1. Introduction

This document provides the authoritative mapping between the canonical **Universal Schema (v2.1)** from the `swfl-arrest-scrapers` repository and the collections used within the Wix CMS for the Shamrock Bail Bonds portal. Its purpose is to ensure data consistency and provide a clear reference for all development and data integration tasks.

All field names in Wix CMS should follow `camelCase` convention, while the canonical schema uses `Snake_Case`.

- **Canonical Schema Source:** `swfl-arrest-scrapers/SCHEMA.md`
- **Wix Collection IDs:** `shamrock-bail-portal-site/src/backend/collectionIds.js`

---

## 2. Core Collection Mappings

### 2.1. ArrestLeads Collection

This collection is a direct, one-to-one mirror of the canonical arrest schema. It serves as the primary ingestion point for new leads from the scraping pipeline.

- **Collection ID:** `ArrestLeads` (To be created)
- **Permissions:** Admin (Full Access), Staff (Read-only)

| Wix Field Name | Wix Field Type | Canonical Schema Field | Notes |
| :--- | :--- | :--- | :--- |
| `bookingNumber` | Text | `Booking_Number` | Primary Key (Unique per County) |
| `fullName` | Text | `Full_Name` | |
| `firstName` | Text | `First_Name` | |
| `lastName` | Text | `Last_Name` | |
| `dob` | Date | `DOB` | |
| `sex` | Text | `Sex` | |
| `race` | Text | `Race` | |
| `arrestDate` | Date | `Arrest_Date` | |
| `bookingDate` | Date | `Booking_Date` | |
| `agency` | Text | `Agency` | |
| `address` | Text | `Address` | |
| `city` | Text | `City` | |
| `state` | Text | `State` | Default: "FL" |
| `zip` | Text | `ZIP` | |
| `charges` | Text | `Charges` | Pipe-separated `|` list |
| `bondAmount` | Number | `Bond_Amount` | |
| `bondType` | Text | `Bond_Type` | |
| `status` | Text | `Status` | e.g., "In Custody", "Released" |
| `courtDate` | Date | `Court_Date` | |
| `caseNumber` | Text | `Case_Number` | |
| `mugshotUrl` | URL | `Mugshot_URL` | |
| `county` | Text | `County` | County code (e.g., "LEE") |
| `detailUrl` | URL | `Detail_URL` | |
| `leadScore` | Number | `Lead_Score` | |
| `leadStatus` | Text | `Lead_Status` | e.g., "Hot", "Warm", "Cold" |

### 2.2. Cases Collection

This collection represents an active bail bond case initiated through the portal or by staff. It links a defendant, one or more indemnitors, and the associated financial obligations.

- **Collection ID:** `Import2` (Logical Name: `CASES`)
- **Permissions:** Admin (Full Access), Staff (Read/Write), Members (Read-only, scoped to their case)

| Wix Field Name | Wix Field Type | Canonical Schema Field | Notes |
| :--- | :--- | :--- | :--- |
| `caseId` | Text | `Case_Number` | Primary Key. May be the same as `bookingNumber`. |
| `defendantPersonId` | Reference (Persons) | `Person_ID` | Links to the defendant's record in the `Persons` collection. |
| `indemnitorPersonIds` | Array of References | `N/A` | Links to indemnitor records in the `Persons` collection. |
| `status` | Text | `N/A` | e.g., "Pending Paperwork", "Active", "Closed", "Forfeiture" |
| `bondAmount` | Number | `Bond_Amount` | |
| `premiumAmount` | Number | `N/A` | Calculated premium (typically 10% of `bondAmount`). |
| `county` | Text | `County` | |
| `bookingNumber` | Text | `Booking_Number` | |
| `jailName` | Text | `Facility` | |
| `initiatedAt` | Date | `N/A` | Timestamp when the case was created. |
| `closedAt` | Date | `N/A` | Timestamp when the case was closed. |

### 2.3. Persons Collection

This collection stores unique information for every individual (defendant, indemnitor) interacting with the system. It is designed to prevent data duplication.

- **Collection ID:** `Persons` (To be created)
- **Permissions:** Admin (Full Access), Staff (Read/Write), Members (Read-only, scoped to their own record)

| Wix Field Name | Wix Field Type | Canonical Schema Field | Notes |
| :--- | :--- | :--- | :--- |
| `personId` | Text | `Person_ID` | Primary Key. Generated UUID. |
| `wixMemberId` | Text | `N/A` | The ID from the Wix Members app. |
| `firstName` | Text | `First_Name` | |
| `lastName` | Text | `Last_Name` | |
| `dob` | Date | `DOB` | |
| `email` | Text | `N/A` | Primary contact email. Must be unique. |
| `phone` | Text | `N/A` | Primary contact phone. |
| `address` | Text | `Address` | |
| `city` | Text | `City` | |
| `state` | Text | `State` | |
| `zip` | Text | `ZIP` | |

### 2.4. MemberDocuments Collection

This collection tracks all documents uploaded by members through the portal.

- **Collection ID:** `Import3` (Logical Name: `MEMBER_DOCUMENTS`)
- **Permissions:** Admin (Full Access), Staff (Read/Write), Members (Create, Read-only scoped to their own docs)

| Wix Field Name | Wix Field Type | Canonical Schema Field | Notes |
| :--- | :--- | :--- | :--- |
| `memberId` | Text | `N/A` | The Wix Members app ID. Should be changed to `personId`. |
| `personId` | Reference (Persons) | `Person_ID` | **RECOMMENDED.** Links to the `Persons` collection. |
| `caseId` | Reference (Cases) | `Case_Number` | Links to the `Cases` collection. |
| `documentType` | Text | `N/A` | e.g., "Government ID", "Financial Statement", "Collateral" |
| `fileName` | Text | `N/A` | Original name of the uploaded file. |
| `fileUrl` | URL | `N/A` | URL to the file in Wix Media Manager. |
| `status` | Text | `N/A` | "Pending Review", "Verified", "Rejected" |
| `uploadDate` | Date | `N/A` | Timestamp of the upload. |

---

## 3. Supporting Collection Mappings

### 3.1. FloridaCounties Collection

- **Collection ID:** `Import1` (Logical Name: `FLORIDA_COUNTIES`)
- **Notes:** This collection is for site content and does not directly map to the arrest schema, but its `county` field should match the `County` values from the canonical schema.

### 3.2. FinancialObligations Collection

- **Collection ID:** `Import5` (Logical Name: `FINANCIAL_OBLIGATIONS`)
- **Notes:** Tracks payments, fees, and other financial responsibilities. It links to the `Cases` and `Persons` collections.

### 3.3. CheckInRecords Collection

- **Collection ID:** `Import4` (Logical Name: `CHECK_IN_RECORDS`)
- **Notes:** Stores GPS check-in data from defendants, linking to the `Cases` and `Persons` collections.

---

## 4. Action Items & Recommendations

1.  **Create Missing Collections:** The `ArrestLeads` and `Persons` collections must be created in the Wix CMS immediately.
2.  **Refactor `MemberDocuments`:** The `memberId` field in the `MemberDocuments` collection should be deprecated in favor of a `personId` reference field that links directly to the `Persons` collection. This enforces relational integrity.
3.  **Standardize on `personId`:** All collections that reference a user or member should use the `personId` from the `Persons` collection as the foreign key, not the Wix Member ID or email.
