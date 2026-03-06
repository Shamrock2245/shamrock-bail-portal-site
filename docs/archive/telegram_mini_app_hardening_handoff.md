# 🍀 Shamrock Telegram Mini App — Hardening Handoff

> **Prepared by**: Antigravity (AI Agent)
> **For**: Manus (AI Agent)
> **Repo**: `shamrock-telegram-app` (GitHub Pages deployment)
> **Date**: 2026-02-27

---

## Executive Summary

A full code audit of all 6 Telegram mini apps + the hub page revealed **12 issues** that degrade user experience, especially on mobile inside Telegram. The three highest-impact problems are:

1. **ID Upload cannot be skipped** — the `required` attribute on the front-of-ID file input blocks form advancement on Step 4 of intake.
2. **Location capture is slow / fails on desktop** — `enableHighAccuracy: true` with a 10-second timeout causes long waits or outright failure on desktops and Telegram desktop clients.
3. **Fire-and-forget submissions** — most apps use `mode: 'no-cors'` and `setTimeout` to show "success" *regardless* of whether the backend received the data.

---

## File Inventory

| Mini App | Entry Point | JS Logic | Lines |
|----------|-------------|----------|-------|
| **Hub** | `index.html` | (inline) | 224 |
| **Intake** | `intake/index.html` | `intake/app.js` | 706 |
| **Documents** | `documents/index.html` | `documents/app.js` | 470 |
| **Defendant** | `defendant/index.html` | `defendant/app.js` | 526 |
| **Payment** | `payment/index.html` | `payment/app.js` | 572 |
| **Status** | `status/index.html` | `status/app.js` | 303 |
| **Updates** | `updates/index.html` | `updates/app.js` | 388 |
| **Shared** | — | `shared/brand.js` | 70 |
| **Shared CSS** | — | `shared/theme.css` | 215 |

---

## P0 — Blocking UX Issues (Must Fix)

### 1. ID Upload Cannot Be Skipped

**File**: `intake/index.html` line 254
**Current**: `<input type="file" id="idFront" ... required>`
**Problem**: The `required` attribute prevents proceeding past Step 4 without uploading an ID photo. Many users don't have their ID ready or are submitting on behalf of someone else.

**File**: `intake/app.js` — `validateStep()` function
**Problem**: Step 4 validation checks `required` fields including `idFront`. There's no skip/bypass path.

**Fix**:
1. Remove `required` from `idFront` input in `intake/index.html` line 254.
2. Add a "Skip — I'll provide later" link/button below the file upload on Step 4.
3. In `intake/app.js`, update the `validateStep()` function for step 4 to NOT require `idFront`.
4. When data is submitted, include a flag: `idProvided: !!idFrontFile` so the backend knows to follow up.
5. Update the review step (Step 5) to show "ID: Not provided — we'll request later" when skipped.

---

### 2. Location Capture Slow/Fails on Desktop

**Files affected** (same pattern in 3 apps):
- `intake/app.js` — `captureLocation()` function (~line 580-620)
- `defendant/app.js` — `browserGPS()` line 382-386
- `payment/app.js` — `handleLocationCapture()` line 254-270

**Current behavior**:
```javascript
navigator.geolocation.getCurrentPosition(
  successCallback,
  errorCallback,
  { enableHighAccuracy: true, timeout: 10000 }
);
```

**Problem**: 
- `enableHighAccuracy: true` forces GPS hardware which doesn't exist on desktops.
- Desktop clients wait the full 10 seconds, then error out.
- Telegram Desktop doesn't support `LocationManager`, so it always falls back to browser geolocation.
- No retry mechanism — user sees "Location denied" and is stuck.

**Fix — Implement Tiered Location Strategy**:
```javascript
async function captureLocation() {
  const btn = document.getElementById('locationBtn');
  btn.innerHTML = '<span class="spinner"></span> Getting location…';
  btn.disabled = true;

  // TIER 1: Telegram LocationManager (fastest in mobile Telegram)
  if (window.Telegram?.WebApp?.LocationManager) {
    try {
      const loc = await new Promise((resolve, reject) => {
        window.Telegram.WebApp.LocationManager.getLocation((result) => {
          result ? resolve(result) : reject(new Error('TG location denied'));
        });
      });
      setLocation(loc.latitude, loc.longitude, 'telegram');
      return;
    } catch (e) { /* fall through */ }
  }

  // TIER 2: Fast coarse location (IP-based, works on desktop)
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,  // ← Use network/IP, not GPS
        timeout: 5000,              // ← 5s instead of 10s
        maximumAge: 300000          // ← Accept 5-minute-old cache
      });
    });
    setLocation(pos.coords.latitude, pos.coords.longitude, 'coarse');
    return;
  } catch (e) { /* fall through */ }

  // TIER 3: High-accuracy GPS (mobile only, takes longer)
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      });
    });
    setLocation(pos.coords.latitude, pos.coords.longitude, 'gps');
    return;
  } catch (e) { /* fall through */ }

  // TIER 4: Manual fallback — ask user to type city/zip
  showManualLocationFallback();
}
```

Also add a MANUAL FALLBACK for when all geolocation fails:
```html
<div id="manualLocationFallback" class="hidden">
  <p>📍 We couldn't detect your location automatically.</p>
  <input type="text" id="manualCity" placeholder="City, State (e.g. Fort Myers, FL)">
  <button onclick="useManualLocation()">Use This Location</button>
</div>
```

> [!IMPORTANT]
> This tiered approach should be extracted into `shared/brand.js` as a reusable utility so all 3 apps use the same logic.

---

### 3. `no-cors` + `setTimeout` = Fake Success

**Files affected**:
- `intake/app.js` — `submitForm()` uses `mode: 'no-cors'` then `tg.sendData()` immediately
- `payment/app.js` — `handleLookup()` line 170, `submitCheckin()` line 294, `handlePayNow()` line 417
- `updates/app.js` — `submitUpdate()` line 205

**Current behavior**:
```javascript
fetch(GAS_ENDPOINT, { method: 'POST', ..., mode: 'no-cors' });
// ^ This returns an opaque response — you can't read status or body
setTimeout(() => { showSuccessScreen(); }, 800);
// ^ Success shown regardless of whether fetch actually worked
```

**Problem**: 
- `no-cors` mode makes the response **opaque** — `response.ok` is `false`, `response.json()` throws.
- The `setTimeout` fires success no matter what.
- If the user has no internet, or GAS returns an error, the user sees "Success!" anyway.
- Data is silently lost.

**Fix — Use `Content-Type: text/plain` workaround**:

GAS `doPost()` redirects on 302, which causes CORS issues with `application/json`. The **working pattern** is already used in `status/app.js` line 137-142:

```javascript
const resp = await fetch(GAS_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },  // ← Avoids CORS preflight
  body: JSON.stringify(payload),
  redirect: 'follow'
});

if (resp.ok) {
  const result = await resp.json();
  if (result.success) {
    showSuccessScreen();
  } else {
    showErrorScreen(result.error || 'Submission failed');
  }
} else {
  showErrorScreen('Server error — please try again');
}
```

> [!CAUTION]
> `status/app.js` is the ONLY app that does this correctly. All other apps must be migrated to this pattern.

---

## P1 — Reliability Issues (Should Fix)

### 4. Intake: `tg.sendData()` May Close App Before Uploads Finish

**File**: `intake/app.js` — `submitForm()` function

**Problem**: `tg.sendData()` immediately **closes the mini app** and sends data to the bot's `web_app_data` handler. If file uploads (ID front/back) are still in-flight as background `fetch()` calls, they are terminated when the WebView closes.

**Fix**: 
1. `await` all file upload promises before calling `tg.sendData()`.
2. Show a "Uploading files…" state with a progress indicator.
3. Only after all uploads complete (or are confirmed skipped), call `tg.sendData()`.

```javascript
// WRONG (current):
submitToGAS();  // fire-and-forget
uploadFiles();  // fire-and-forget
tg.sendData(payload);  // CLOSES APP — uploads may still be running

// RIGHT:
const [submitResult, uploadResult] = await Promise.allSettled([
  submitToGAS(),
  uploadFiles()
]);
// Now safe to close:
tg.sendData(payload);
```

---

### 5. Duplicate `formatPhone()` Definitions

**Files**: `shared/brand.js` line 48, PLUS duplicated in:
- `intake/app.js`
- `defendant/app.js` line 511-515
- `documents/app.js` line 464-468

**Problem**: Three apps redefine `formatPhone()` locally, shadowing the shared version. If the shared version is updated (e.g., to support international numbers), the local copies won't change.

**Fix**: Remove local `formatPhone()` definitions from `intake/app.js`, `defendant/app.js`, and `documents/app.js`. They already import `brand.js`.

---

### 6. Payment App: Check-in Selfie Upload Never Confirmed

**File**: `payment/app.js` — `submitCheckin()` lines 316-334

**Problem**: The selfie upload is fire-and-forget with `mode: 'no-cors'`:
```javascript
fetch(GAS_ENDPOINT, { ..., mode: 'no-cors' });
```
If the upload fails silently, the check-in is recorded without the selfie — which defeats the compliance purpose of a selfie check-in.

**Fix**: Use the `Content-Type: text/plain` pattern (see P0 #3) and show an error if the selfie upload fails.

---

### 7. Defendant Portal: Missing `brand.js` Import in Some HTML

**File**: `defendant/index.html`

**Verify**: Ensure `<script src="../shared/brand.js"></script>` is loaded BEFORE `<script src="app.js"></script>`. The `defendant/app.js` calls `initTheme()` and `initTelegram()` which are defined in `brand.js`. If `brand.js` is not loaded first, the app crashes silently.

**Same check needed for**: `documents/index.html`.

---

### 8. Status App: `buildPendingLookupData()` Hides Errors

**File**: `status/app.js` lines 160-163

**Problem**: When GAS returns a non-OK response or throws an error, the catch block silently falls through to `buildPendingLookupData()` which shows "Your lookup has been submitted to our staff." This is misleading — the lookup wasn't submitted; it failed.

**Fix**: Distinguish between "GAS returned no case" vs "GAS unreachable":
```javascript
if (!caseData && gasReachable) {
  caseData = buildNotFoundData(name, phone);  // No case exists
} else if (!caseData && !gasReachable) {
  caseData = buildOfflineData(name, phone);   // Network error
}
```

---

## P2 — Polish and UX Improvements

### 9. No Loading Skeleton / Shimmer States

All apps show raw "Loading..." text or empty cards. Replace with skeleton shimmer animations to look premium.

---

### 10. No Input Debouncing on Phone Formatting

**Files**: `payment/app.js`, `status/app.js`, `updates/app.js`

The `formatPhone()` is called on every `input` event. On slow devices, this can cause lag. Add a simple debounce or use `requestAnimationFrame`.

---

### 11. No Session Persistence

If a user fills 3 of 5 steps in intake and accidentally closes the app, ALL progress is lost. None of the mini apps use `sessionStorage` or `localStorage` to persist partial form data.

**Recommendation**: Save form state to `sessionStorage` on each step change, and restore on page load.

---

### 12. Consent Checkbox Not Obvious on Mobile

**File**: `intake/index.html` lines 303-313

The consent checkbox `.checkmark` is a custom styled element. On some Android WebViews in Telegram, custom checkboxes can be difficult to tap. Ensure the tap target is at least 44x44px and visually distinct.

---

## Summary Checklist for Manus

| # | Priority | Issue | App(s) | Est. Effort |
|---|----------|-------|--------|-------------|
| 1 | **P0** | ID upload can't be skipped | intake | 30 min |
| 2 | **P0** | Location slow/fails on desktop | intake, defendant, payment | 1 hr |
| 3 | **P0** | `no-cors` fake success | intake, payment, updates | 1.5 hr |
| 4 | **P1** | `tg.sendData()` before uploads finish | intake | 30 min |
| 5 | **P1** | Duplicate `formatPhone()` | intake, defendant, documents | 15 min |
| 6 | **P1** | Selfie upload not confirmed | payment | 30 min |
| 7 | **P1** | Missing `brand.js` import order check | defendant, documents | 15 min |
| 8 | **P1** | Status hides network errors | status | 30 min |
| 9 | P2 | No skeleton loading states | all | 1 hr |
| 10 | P2 | No phone input debouncing | payment, status, updates | 15 min |
| 11 | P2 | No session persistence | intake | 1 hr |
| 12 | P2 | Consent checkbox tap target | intake | 15 min |

**Total estimated effort**: ~7-8 hours

---

## Context Files for Reference

- `shared/brand.js` — Shared Telegram SDK init, theme, helpers
- `shared/theme.css` — Design tokens, dark/light themes
- Backend GAS endpoint: `AKfycby5N-lHvM2XzKnX38KSqekq0ENWMLYqYM2bYxuZcRRAQcBhP3RvBaF0CbQa9gKK73QI4w`
- The `Content-Type: text/plain` CORS workaround is proven to work in `status/app.js`

---

> **Instructions for Manus**: Start with P0 items 1-3 as they directly affect whether users can complete the intake flow successfully. Item #2 (location) should be extracted into a shared utility in `brand.js` and reused across all 3 apps. Item #3 (no-cors fix) should follow the `status/app.js` pattern already in the codebase.
