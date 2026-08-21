---
name: PDF Template Manager
description: Standardized mapping of JSON fields to PDF coordinates for SignNow.
version: 1.0.0
---

# Skill: PDF Template Manager

> **Notice (2026-08-21):** SignNow direct PDF generation is retired. All active signing packets use DocuSeal issued in Super CRM (`shamrock-leads`). The canonical field mappings for surety templates (OSI, Accredited, Bankers) are managed in `src/public/canonical-paperwork-mapper.js`. This document preserves legacy tag references for historical audit.

Use this skill to understand the historical mapping between `IntakeQueue` data and Legal PDF Templates.

**Standard Naming Convention:**
*   **Tag format:** `{{FieldName}}`
*   **Case:** CamelCase
*   **Prefix:** None (keep it simple)

## 2. Indemnitor Agreement Map
| IntakeQueue Field | SignNow Tag | PDF Location | Notes |
| :--- | :--- | :--- | :--- |
| `indemnitorName` | `{{IndemnitorName}}` | Page 1, Top | Full Name |
| `indemnitorAddress` | `{{IndemnitorAddr}}` | Page 1, Block 2 | Full Address |
| `defendantName` | `{{DefendantName}}` | Page 1, Header | Reference |
| `bondAmount` | `{{TotalBond}}` | Page 2, Financials | Currency |
| `premiumAmount` | `{{PremiumDue}}` | Page 2, Financials | Currency |

## 3. Promissory Note Map
| IntakeQueue Field | SignNow Tag | PDF Location | Notes |
| :--- | :--- | :--- | :--- |
| `indemnitorName` | `{{BorrowerName}}` | P1, Line 1 | |
| `bondAmount` | `{{PrincipalAmount}}` | P1, Top Right | |
| `paymentTerms` | `{{InstallmentPlan}}` | P1, Body | Text description of plan |

## 4. Workflow for Updates
When the user asks to "Add a new field to the contract":
1.  **Check:** Does the field exist in `IntakeQueue`?
2.  **Edit:** Update `PDF_TEMPLATES.md` (implied artifact) with the new tag.
3.  **Code:** Update the GAS `createDocument()` function to include the new key-value pair in the payload.
