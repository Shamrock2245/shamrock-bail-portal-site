# SignNow Template Verification Report

**Generated:** Feb 26 2026
**Source:** Acrobat Pro form fields extracted from uploaded osiforms PDFs, visually verified, and corrected with user-provided business rules.
**Coordinate system:** Top-left origin, points (72 DPI) — matches SignNow API.

## Key Business Rules Applied

- **Data Pre-fill:** All data-entry fields (names, addresses, etc.) are pre-filled by the `Dashboard.html` automation. This field map is for **signatures and initials only**.
- **Indemnity Agreement:** Signed by the **Indemnitor ONLY**.
- **Defendant Application:** Signed by the **Defendant ONLY**.
- **SSA Release Form:** One full, separate SSA-3288 form is generated and signed by **each person** involved in the bond (Defendant, Indemnitor, Co-Indemnitors).
- **FAQ Documents:** To ensure cross-role awareness, **both the Defendant and the Indemnitor** must initial **all pages** of **both** the `faq-cosigners` and `faq-defendants` documents.

## Summary of Documents & Actions

| Document ID | SignNow Template ID | PDF File | Pages | Sig Fields | Needs Tags | Status |
|---|---|---|---|---|---|---|
| `paperwork-header` | `6bf07c9b…` | shamrock-paperwork-header.pdf | 1 | 0 | No | ✅ File present |
| `faq-cosigners` | `37725f40…` | ShamrockBailBonds-FAQCosigners.pdf | 2 | 4 | ⚠️ Yes | ✅ File present |
| `faq-defendants` | `41ea80f5…` | ShamrockBailBonds-FAQDefe..pdf | 2 | 4 | ⚠️ Yes | ✅ File present |
| `indemnity-agreement` | `2c165253…` | IndemnityAgreementFINAL.pdf | 1 | 1 | No | ✅ File present |
| `defendant-application` | `5ca8b3a3…` | AppforAppearanceBondFINAL.pdf | 2 | 1 | No | ✅ File present |
| `promissory-note` | `e01eb884…` | PromissorySide2FINAL.pdf | 1 | 2 | No | ✅ File present |
| `disclosure-form` | `08f56f26…` | DisclosureFINAL.pdf | 1 | 6 | No | ✅ File present |
| `surety-terms` | `4cd02a2d…` | SuretyTermsandConditionsInformationsheetFINAL.pdf | 1 | 4 | No | ✅ File present |
| `master-waiver` | `cc7e8c7b…` | shamrock-master-waiver.pdf | 4 | 4 | ⚠️ Yes | ✅ File present |
| `ssa-release` | `3aac5dd7…` | shamrock-ssa-release.pdf | 1 | 1 | No | ✅ File present |
| `collateral-receipt` | `903275f4…` | osi-premium-collateral-template.pdf | 1 | 3 | ⚠️ Yes | ✅ File present |
| `payment-plan` | `ea13db9e…` | shamrock-premium-finance-notice.pdf | 4 | 2 | No | ✅ File present |

## Re-Upload & Tagging Action List

The following documents require manual adjustments in the SignNow template editor before they can be used in the automated workflow.

| Document | Action Required | Reason |
|---|---|---|
| `faq-cosigners` | Add initials tags (Defendant + Indemnitor, both pages) | This is a flat PDF with no embedded Acrobat fields. Positions are estimated. |
| `faq-defendants` | Add initials tags (Defendant + Indemnitor, both pages) | This is a flat PDF with no embedded Acrobat fields. Positions are estimated. |
| `master-waiver` | Verify/add signature tags on page 4 | The embedded Acrobat fields are for the dates only; the signature lines need tags. |
| `collateral-receipt` | Verify depositor signature tag position | This is a complex, two-section form; confirm the tag placement for the "Depositor's Signature". |

## Extra File (Not in Signing Packet)

| File | Description | Action |
|---|---|---|
| `AppearanceBondblank.pdf` | Appearance Bond — an agent-filled data form with 26 text fields and no signer fields. | No SignNow template is needed for this file as it is handled manually by the agent. |

## Detailed Field Definitions

This section provides the exact coordinates and roles for every signature and initials field.

### `paperwork-header`

> Cover page only. No signatures. Names are pre-filled by SignNow invite data.

No signature fields.

### `faq-cosigners`

> FLAT PDF. Both Defendant AND Indemnitor initial every page (business rule: cross-role awareness). Add SignNow initials tags manually.

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | initials | Defendant | 0 | 50 | 748 | 60 | 22 |
| 2 | initials | Indemnitor | 0 | 490 | 748 | 60 | 22 |
| 3 | initials | Defendant | 1 | 50 | 748 | 60 | 22 |
| 4 | initials | Indemnitor | 1 | 490 | 748 | 60 | 22 |

### `faq-defendants`

> FLAT PDF. Both Defendant AND Indemnitor initial every page (business rule: cross-role awareness). Add SignNow initials tags manually.

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | initials | Defendant | 0 | 50 | 748 | 60 | 22 |
| 2 | initials | Indemnitor | 0 | 490 | 748 | 60 | 22 |
| 3 | initials | Defendant | 1 | 50 | 748 | 60 | 22 |
| 4 | initials | Indemnitor | 1 | 490 | 748 | 60 | 22 |

### `indemnity-agreement`

> RULE: Indemnitor signs. 1 signature only. All other fields are data-entry (pre-filled by Dashboard.html).

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | signature | Indemnitor | 0 | 315 | 935 | 249 | 27 |

### `defendant-application`

> RULE: Defendant signs. 1 signature on page 2. Page 1 is data-entry (pre-filled).

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | signature | Defendant | 1 | 39 | 752 | 247 | 29 |

### `promissory-note`

> Defendant + Indemnitor sign at bottom. All other fields are data-entry.

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | signature | Defendant | 0 | 33 | 888 | 235 | 32 |
| 2 | signature | Indemnitor | 0 | 342 | 888 | 234 | 32 |

### `disclosure-form`

> 6 signature fields across 2 sections. Co-Indemnitor slots map to Indemnitor role in SignNow.

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | signature | Indemnitor | 0 | 82 | 575 | 213 | 24 |
| 2 | signature | Indemnitor | 0 | 324 | 575 | 232 | 24 |
| 3 | signature | Defendant | 0 | 82 | 844 | 213 | 24 |
| 4 | signature | Indemnitor | 0 | 324 | 844 | 232 | 24 |
| 5 | signature | Indemnitor | 0 | 83 | 889 | 213 | 24 |
| 6 | signature | Bail Agent | 0 | 324 | 889 | 232 | 24 |

### `surety-terms`

> Defendant + 3 Indemnitor slots. Third/fourth slots for co-indemnitors.

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | signature | Defendant | 0 | 29 | 820 | 266 | 22 |
| 2 | signature | Indemnitor | 0 | 333 | 820 | 247 | 22 |
| 3 | signature | Indemnitor | 0 | 29 | 897 | 266 | 22 |
| 4 | signature | Indemnitor | 0 | 333 | 897 | 247 | 22 |

### `master-waiver`

> 4 pages. Signing on page 4 (index 3). Bail Agent = Surety Representative slot.

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | signature | Bail Agent | 3 | 28 | 453 | 290 | 27 |
| 2 | signature | Defendant | 3 | 28 | 482 | 290 | 27 |
| 3 | signature | Indemnitor | 3 | 28 | 510 | 290 | 27 |
| 4 | signature | Indemnitor | 3 | 28 | 537 | 290 | 27 |

### `ssa-release`

> RULE: One full form per person. The calling logic must generate a separate document for each signer (Defendant, Indemnitor, etc.). This definition is for one instance.

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | signature | Defendant | 0 | 205 | 618 | 249 | 30 |

### `collateral-receipt`

> Two sections: Collateral Receipt (depositor/indemnitor sig) + Premium Receipt (agent sig ×2).

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | signature | Indemnitor | 0 | 350 | 580 | 220 | 25 |
| 2 | signature | Bail Agent | 0 | 75 | 793 | 221 | 20 |
| 3 | signature | Bail Agent | 0 | 393 | 945 | 184 | 23 |

### `payment-plan`

> 4 pages. Defendant + Indemnitor sign on final page only.

| # | Type | Role | Page | x | y | Width | Height |
|---|---|---|---|---|---|---|---|
| 1 | signature | Defendant | 3 | 185 | 99 | 168 | 27 |
| 2 | signature | Indemnitor | 3 | 191 | 127 | 162 | 27 |
