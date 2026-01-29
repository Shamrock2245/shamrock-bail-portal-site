# IntakeQueue Collection Schema
**Version:** 1.0.0
**Date:** January 28, 2026

## Overview
The `IntakeQueue` collection acts as the central data store for all incoming Indemnitor applications. It bridges the gap between the frontend Portal (User Input) and the backend Google Apps Script ecosystem (Document Generation).

---

## 1. Field Definitions

### Core Identification
| Field Key | Field Type | Required | Description | Source |
| :--- | :--- | :--- | :--- | :--- |
| `caseId` | Text | ✅ | Unique Identifier (e.g., `CASE-17482-123`) | Backend Generated |
| `status` | Text | ✅ | Workflow state (e.g., `intake`, `in_progress`) | Backend Default |
| `_createdDate` | Date | ✅ | Submission Timestamp | System Auto |

### Defendant Information
| Field Key | Field Type | Required | Description | Source |
| :--- | :--- | :--- | :--- | :--- |
| `defendantName` | Text | ✅ | Full Name | Frontend Input |
| `defendantFirstName`| Text | ✅ | First Name | Frontend Input |
| `defendantLastName` | Text | ✅ | Last Name | Frontend Input |
| `defendantEmail` | Text | - | Email Address | Frontend Input |
| `defendantPhone` | Text | - | Phone Number | Frontend Input |
| `defendantBookingNumber`| Text | - | Jail Booking # | Frontend Input |

### Indemnitor Information
| Field Key | Field Type | Required | Description | Source |
| :--- | :--- | :--- | :--- | :--- |
| `indemnitorName` | Text | ✅ | Full Name | Frontend Input |
| `indemnitorEmail` | Text | ✅ | Email Address (Primary Key for User) | Frontend Input |
| `indemnitorPhone` | Text | ✅ | Mobile Phone | Frontend Input |
| `indemnitorStreetAddress`| Text | ✅ | Street Address | Frontend Input |
| `indemnitorCity` | Text | ✅ | City | Frontend Input |
| `indemnitorState` | Text | ✅ | State (FL) | Frontend Input |
| `indemnitorZipCode` | Text | ✅ | Zip Code | Frontend Input |
| `residenceType` | Text | - | Own/Rent | Frontend Input |

### Bond & Legal Details (GAS Populated)
> **Note:** These fields are NOT collected by the frontend form. They are populated by GAS after the agent scrapes the jail website.

| Field Key | Field Type | Description | Source |
| :--- | :--- | :--- | :--- |
| `bondAmount` | Number | Total Bail Amount | GAS Integration |
| `premiumAmount` | Number | Fee Amount (10%) | GAS Integration |
| `charges` | Text | List of charges | GAS Integration |
| `arrestDate` | Date | Date of Arrest | GAS Integration |
| `jailFacility` | Text | Detention Center Name | Frontend/GAS |
| `county` | Text | Jurisdiction | Frontend Input |

### Integration Status
| Field Key | Field Type | Description | Source |
| :--- | :--- | :--- | :--- |
| `gasSyncStatus` | Text | Sync state (`pending`, `synced`) | Backend Default |
| `documentStatus` | Text | Signing state (`pending`, `sent`, `signed`) | SignNow Integration |
| `signNowDocumentId`| Text | ID of generated PDF packet | SignNow Integration |
| `signNowIndemnitorLink`| Url | Signing URL for Indemnitor | SignNow Integration |

---

## 2. Permissions
*   **Collection ID:** `IntakeQueue`
*   **Read:** Site Member (Indemnitor) / Admin
*   **Create:** Site Member (Indemnitor) / Admin
*   **Update:** Admin / Backend (System)
*   **Delete:** Admin Only
