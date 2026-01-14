# Phase 0: Element ID Audit Report

**Date**: 2026-01-13
**Status**: 🔴 VIOLATIONS FOUND
**Authority**: `ANTIGRAVITY-FOUNDATION-SPEC.md` vs `src/pages/*`

## Executive Summary
Critical mismatches exist between the Authoritative Spec and the current Codebase. The site relies on "Auto-Generated" IDs (e.g., `#comp-mjsigfv9`) and Legacy IDs (e.g., `#countySelector`) which violates the Strict ID Policy.

## Violations Table

| Page | Spec ID (Authorized) | Current Code ID (Violation) | Status |
| :--- | :--- | :--- | :--- |
| **Homepage** | `#countyDropdown` | `#countySelector` (and `#dropdown1` fallback) | 🟢 BRIDGED |
| **Dynamic County** | `#callShamrockBtn` | `#callCountiesBtn` | 🟢 BRIDGED |
| **Dynamic County** | `#callSheriffBtn` | `#sheriffWebsite` (Link text) | 🟢 BRIDGED |
| **Dynamic County** | `#callClerkBtn` | `#clerkWebsite` (Link text) | 🟢 BRIDGED |
| **Member Portal** | `#startPaperworkBtn` | `#comp-mjsigfv9` / `#comp-mjsihbjl` (Auto-IDs) | 🟢 BRIDGED |
| **Member Portal** | `#pendingDocsRepeater` | Missing / Not Implemented | 🔴 PENDING IMPL |

## Remediation Plan: "The Bridge Operation"
**Status**: executed. Code now supports both Spec IDs and Legacy IDs. Editor updates can proceed without breaking the site.

**Pattern:**
```javascript
// Priority: Spec ID -> Fallback: Legacy ID -> Error
const element = $w('#specID').length ? $w('#specID') : $w('#legacyID');
```

### Action Items
1.  **Homepage**: Update `HOME.c1dmp.js` to prioritize `#countyDropdown`.
2.  **Dynamic County**: Update Page Code to check for `#callShamrockBtn`.
3.  **Member Portal**: Update `portal-defendant.skg9y.js` to standardize `#startPaperworkBtn`.
    - Note: The portal currently has *two* start buttons (Email vs Kiosk). The Spec says "The Start Bail Paperwork button is the **only** user action".
    - **Resolution**: We will map `#startPaperworkBtn` to the primary "Sign via Email" flow, but keep the Kiosk button as a secondary optional element if present.

## Next Steps
Execute the Bridge Updates immediately to prepare the codebase for Editor updates.
