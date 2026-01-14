# Import Collections Strategy

**Date:** December 26, 2025  
**Status:** Documented - No Changes Required

## Overview

Wix CMS automatically assigns collection IDs in the format `Import1`, `Import2`, `Import3`, etc. when collections are created. **These IDs cannot be renamed** through the Wix interface, as they are system-generated identifiers.

The screenshot provided confirms that the collection ID field is locked and displays: "You cannot modify the collection ID after the collection has been created."

## Current Import Collection Mapping

Based on the `collectionIds.js` centralized mapping and codebase analysis, the following Import collections are in use:

| Collection ID | Logical Name | Purpose |
|---------------|--------------|---------|
| `Import1` | FloridaCounties | County data for all 67 Florida counties |
| `Import2` | Cases | Bail bond cases |
| `Import3` | MemberDocuments | Uploaded IDs and documents |
| `Import4` | CheckInRecords | GPS check-in records |
| `Import5` | FinancialObligations | Indemnitor financial tracking |
| `Import6` | BailStartLogs | Audit logs for bail paperwork initiation |
| `Import10` | FAQ | Frequently asked questions |

## Strategy: Keep Import IDs, Use Abstraction Layer

Since Wix collection IDs cannot be changed, the correct approach is to **maintain the Import naming in Wix** while using **human-readable constants in code**. This strategy is already implemented via the `collectionIds.js` module.

### Benefits of This Approach

1. **Code Readability:** Developers reference `COLLECTIONS.MEMBER_DOCUMENTS` instead of `'Import3'`
2. **Maintainability:** If collection IDs ever change, only one file needs updating
3. **Documentation:** The mapping serves as living documentation of what each Import collection represents
4. **No Breaking Changes:** Existing data and collection structures remain intact

### Implementation Pattern

**✅ CORRECT - Use Constants:**
```javascript
import { COLLECTIONS } from 'backend/collectionIds';

const results = await wixData.query(COLLECTIONS.MEMBER_DOCUMENTS)
  .eq('memberEmail', email)
  .find();
```

**❌ INCORRECT - Hardcode Import IDs:**
```javascript
const results = await wixData.query('Import3')
  .eq('memberEmail', email)
  .find();
```

## Codebase Audit Results

### Files Already Using Constants (✅ Good)
- None found - this is the issue we need to fix

### Files Using Hardcoded Import IDs (❌ Needs Refactoring)
- `src/backend/counties.js` - Uses `'Import1'` directly (6 instances)
- `src/backend/county-generator.jsw` - Uses `'Import1'` directly (2 instances)
- `src/backend/documentUpload.jsw` - Uses `'Import3'` directly (6 instances)
- `src/backend/wixApi.jsw` - Defines constant but doesn't use COLLECTIONS
- `src/pages/members/Account.js` - Uses `'Import3'` directly (2 instances)
- `src/pages/portal-defendant-enhanced.js` - Uses Import IDs directly (5 instances)
- `src/pages/portal-indemnitor-enhanced.js` - Uses Import IDs directly (4 instances)
- `src/public/countyUtils.js` - Uses `'Import1'` directly (3 instances)

## Action Plan

### Phase 1: Refactor All Hardcoded References
Replace all hardcoded `'Import#'` strings with imports from `COLLECTIONS`:

1. Add import statement: `import { COLLECTIONS } from 'backend/collectionIds';`
2. Replace `'Import1'` with `COLLECTIONS.FLORIDA_COUNTIES`
3. Replace `'Import2'` with `COLLECTIONS.CASES`
4. Replace `'Import3'` with `COLLECTIONS.MEMBER_DOCUMENTS`
5. Replace `'Import4'` with `COLLECTIONS.CHECK_IN_RECORDS`
6. Replace `'Import5'` with `COLLECTIONS.FINANCIAL_OBLIGATIONS`
7. Replace `'Import6'` with `COLLECTIONS.BAIL_START_LOGS`

### Phase 2: Update Documentation
- Update all documentation to reference logical names (e.g., "MemberDocuments collection (Import3)")
- Ensure schema mapping documents use logical names as primary reference
- Add note that Import IDs are Wix-assigned and cannot be changed

### Phase 3: Establish Code Standards
- Add to code review checklist: "No hardcoded Import IDs"
- Update CONTRIBUTING.md with collection reference guidelines
- Consider adding ESLint rule to detect hardcoded Import strings

## Conclusion

**DO NOT attempt to delete and recreate Import collections.** This would result in:
- Loss of all existing data
- Breaking changes to production site
- Potential data migration issues
- No actual benefit (new collections would still be named Import#)

Instead, embrace the abstraction layer pattern already established in `collectionIds.js` and systematically refactor all hardcoded references to use the centralized constants. This maintains data integrity while achieving code clarity.
