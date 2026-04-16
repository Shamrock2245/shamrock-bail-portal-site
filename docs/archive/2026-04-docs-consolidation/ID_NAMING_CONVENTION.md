# Velo Element ID Naming Convention

**Purpose**: To ensure strict alignment between the Wix Editor UI elements and the Velo backend code/schemas.

## 1. Core Rule: `[type][Function/Field]`

All Element IDs must follow the camelCase pattern:
`prefix` + `Description`

### Common Prefixes

| Element Type | Prefix | Example |
| :--- | :--- | :--- |
| **Buttons** | `btn` | `#btnSubmit`, `#btnCancel`, `#btnUploadSelfie` |
| **Input Fields** | `input` | `#inputEmail`, `#inputCaseNumber`, `#inputDob` |
| **Text Output** | `text` | `#textWelcome`, `#textErrorMessage`, `#textStatus` |
| **Containers** | `box` | `#boxLogin`, `#boxCheckInForm` |
| **Repeaters** | `rpt` | `#rptCases`, `#rptDocuments` |
| **Images** | `img` | `#imgProfile`, `#imgLogo` |
| **Dropdowns** | `dropdown` | `#dropdownCounty`, `#dropdownReason` |
| **Date Pickers** | `date` | `#dateCourtAppearance` |

## 2. Schema Mapping

If an element maps directly to a field in a Wix Collection (e.g., `Persons`), the ID **SHOULD** contain the exact field name from the schema.

**Schema**: `Persons`
- Field: `firstName` -> ID: `#inputFirstName`
- Field: `caseNumber` -> ID: `#textCaseNumber` (if reading) or `#inputCaseNumber` (if writing)

## 3. Dynamic Pages

Elements connected to a dataset should still follow this convention to allow for easy code reference if the dataset connection fails or needs to be overridden.

## 4. State Elements

Elements used for UI state (loading, errors) should be descriptive.

- `#boxLoadingState`
- `#textGlobalError`
- `#groupSuccessMessage` (if using Groups)

---

## Migration Checklist

When refactoring a page:
1.  Open the Page Code panel.
2.  Note the "Red" (error) underlines where code references an ID that doesn't exist.
3.  Click the element in the Visual Editor.
4.  Rename the ID in the "Properties & Events" panel to match the Code.
