# FIXES TO IMPLEMENT

## Priority: CRITICAL (Will Cause Crashes)

### 1. Florida Counties Dynamic Page - Missing startBailBtn Declaration
**File**: `src/pages/Florida Counties.bh0r4.js`
**Line**: 133
**Issue**: `startBailBtn` is used but never declared
**Fix**: Add element selection before usage

---

## Priority: HIGH (Missing Data in UI)

### 2. Backend Counties.jsw - Missing countySeat Field
**File**: `src/backend/counties.jsw`
**Line**: ~40 (in mapping)
**Issue**: `countySeat` field not mapped from CMS collection
**Impact**: Locate page description shows "Serving undefined & Surrounding Areas"
**Fix**: Add `countySeat: item.countySeat || ""` to mapping

### 3. Backend Counties.jsw - Missing jailAddress Field
**File**: `src/backend/counties.jsw`
**Line**: ~40 (in mapping)
**Issue**: `jailAddress` field not mapped from CMS collection
**Impact**: Florida Counties page always collapses jail address section
**Fix**: Add `jailAddress: item.jailAddress || ""` to mapping

---

## Priority: MEDIUM (Defensive Coding Improvements)

### 4. HOME.c1dmp.js - handleStartProcess() Missing Fallback Selectors
**File**: `src/pages/HOME.c1dmp.js`
**Line**: 247
**Issue**: Only checks `#countyDropdown`, doesn't use fallback selectors like `initCountyDropdown()` does
**Impact**: Could fail if dropdown has different ID
**Fix**: Add fallback selector logic (same as lines 71-78)

### 5. Locate .kyk1r.js - Missing Null Check for itemData.name
**File**: `src/pages/Locate .kyk1r.js`
**Line**: 34
**Issue**: If `itemData.name` is null/undefined, creates "undefined County"
**Fix**: Add fallback: `const countyName = (itemData.name || itemData.countyName || "Unknown") + " County";`

---

## Priority: OPTIONAL (Nice to Have)

### 6. Locate .kyk1r.js - No Fallback Data
**File**: `src/pages/Locate .kyk1r.js`
**Line**: 19-25
**Issue**: If `getCounties()` fails, page is blank with no feedback
**Fix**: Add hardcoded fallback county data (like HOME page has)

### 7. Florida Counties - No User Feedback on County Not Found
**File**: `src/pages/Florida Counties.bh0r4.js`
**Line**: 45
**Issue**: Silent return with no user feedback if county not found
**Fix**: Display error message to user before returning

---

## IMPLEMENTATION ORDER

1. Fix #1 (Critical - Florida Counties startBailBtn)
2. Fix #2 (High - countySeat mapping)
3. Fix #3 (High - jailAddress mapping)
4. Fix #4 (Medium - HOME handleStartProcess fallback)
5. Fix #5 (Medium - Locate null check)
6. Fix #6 (Optional - Locate fallback data)
7. Fix #7 (Optional - Florida Counties error message)
