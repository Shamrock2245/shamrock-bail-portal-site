# File Consolidation Plan

**Date:** December 26, 2025  
**Status:** Recommended Actions

## Overview

The codebase contains several duplicate files that serve similar or overlapping purposes. This document outlines a plan to consolidate these files to improve maintainability and reduce confusion.

---

## 1. SignNow Integration Files

### Current State

There are **two** SignNow integration backend files with different approaches:

| File | Approach | Status |
| :--- | :--- | :--- |
| `src/backend/signNowIntegration.jsw` | Direct SignNow API integration | Older, less complete |
| `src/backend/signnow-integration.jsw` | Google Apps Script (GAS) proxy pattern | Newer, more complete |

### Analysis

The `signnow-integration.jsw` file uses a **centralized GAS backend** as the single source of truth for SignNow logic. This is the superior approach because:

1. **Centralization:** All SignNow logic lives in one place (GAS), making it easier to maintain and debug
2. **Workflow Protection:** Aligns with the project requirement to "not interfere with workflows outside the Wix site"
3. **Flexibility:** Changes to SignNow workflows can be made in GAS without redeploying Wix code

### Recommendation

**✅ Keep:** `src/backend/signnow-integration.jsw` (GAS proxy pattern)  
**❌ Archive:** `src/backend/signNowIntegration.jsw` (direct API)

### Action Steps

1. Review all imports of `signNowIntegration.jsw` in the codebase
2. Update imports to use `signnow-integration.jsw` instead
3. Rename `signNowIntegration.jsw` to `signNowIntegration.jsw.DEPRECATED`
4. Add a comment at the top of the deprecated file explaining why it was replaced

---

## 2. Portal Page Files

### Current State

There are **two versions** of the defendant and indemnitor portal pages:

| File | Status | Notes |
| :--- | :--- | :--- |
| `src/pages/portal-defendant.u2pt1.js` | Basic version | Wix-generated ID |
| `src/pages/portal-defendant-enhanced.js` | Enhanced version | More complete, better UX |
| `src/pages/portal-indemnitor.dnlol.js` | Basic version | Wix-generated ID |
| `src/pages/portal-indemnitor-enhanced.js` | Enhanced version | More complete, better UX |

### Analysis

The "enhanced" versions have:
- More comprehensive error handling
- Better user feedback (loading states, success/error messages)
- More complete feature implementation
- Better code organization and documentation

### Recommendation

**✅ Keep:** Enhanced versions (`portal-defendant-enhanced.js`, `portal-indemnitor-enhanced.js`)  
**⚠️ Evaluate:** Basic versions (may be attached to live pages in Wix)

### Action Steps

1. **DO NOT DELETE** the basic versions immediately, as they may be attached to live Wix pages
2. In the Wix Editor, check which page code is attached to the `/portal-defendant` and `/portal-indemnitor` URLs
3. If basic versions are attached, carefully migrate the page attachment to the enhanced versions
4. After confirming enhanced versions are live, rename basic versions to `.DEPRECATED`

---

## 3. Webhook Files

### Current State

| File | Purpose |
| :--- | :--- |
| `src/backend/signnow-webhooks.jsw` | Backend module (`.jsw`) |
| `src/backend/signnow-webhooks.web.js` | Web module (`.web.js`) |

### Analysis

These files serve **different purposes**:
- `.jsw` files are backend modules that can be called from frontend code
- `.web.js` files are web modules that expose HTTP endpoints

Both may be needed depending on how SignNow webhooks are configured.

### Recommendation

**✅ Keep Both** (likely serve different purposes)

### Action Steps

1. Review the SignNow webhook configuration to determine which file is actually receiving webhook calls
2. Document the purpose of each file clearly in their header comments
3. If one is unused, rename it to `.DEPRECATED`

---

## 4. Summary of Actions

### Immediate Actions (Safe)

1. ✅ Update all imports from `signNowIntegration.jsw` to `signnow-integration.jsw`
2. ✅ Rename `signNowIntegration.jsw` to `signNowIntegration.jsw.DEPRECATED`
3. ✅ Add deprecation notices to all deprecated files

### Deferred Actions (Requires Wix Editor Access)

1. ⚠️ Check which page code is attached to live portal pages in Wix Editor
2. ⚠️ Migrate page attachments from basic to enhanced versions if needed
3. ⚠️ Rename basic portal page files to `.DEPRECATED` after confirming enhanced versions are live

### Documentation Actions

1. ✅ Update `BACKEND_ARCHITECTURE.md` to reflect the GAS proxy pattern as the standard
2. ✅ Document the enhanced portal pages as the canonical implementations
3. ✅ Create a "Deprecated Files" section in the main README

---

## 5. Deprecation Pattern

When deprecating a file, follow this pattern:

1. Rename the file with a `.DEPRECATED` suffix
2. Add a header comment explaining why it was deprecated and what replaced it
3. Update all documentation to reference the new file
4. After 30 days with no issues, the deprecated file can be safely deleted

Example header comment:

```javascript
/**
 * ⚠️ DEPRECATED - DO NOT USE
 * 
 * This file has been replaced by: src/backend/signnow-integration.jsw
 * 
 * Reason: Migrated to centralized GAS backend pattern for better
 * workflow protection and maintainability.
 * 
 * Deprecated on: December 26, 2025
 * Safe to delete after: January 26, 2026
 */
```
