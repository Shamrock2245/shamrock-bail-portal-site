---
name: PDF Template Manager
description: Standardized mapping of JSON fields to PDF coordinates for SignNow.
version: 1.0.0
---

# Skill: PDF Template Manager

Use this skill to maintain the mapping between `IntakeQueue` data and the Legal PDF Templates.

## 1. The Mapping Logic
When generating a PDF via GAS, we map `IntakeQueue` keys to "Tags" in the SignNow template.

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
