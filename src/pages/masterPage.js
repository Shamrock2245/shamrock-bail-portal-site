/**
 * masterPage.js - Shamrock Bail Bonds
 *
 * ============================================================
 * IMPORT RULES — READ BEFORE EDITING
 * ============================================================
 * ALLOWED:   import from 'wix-*'  (compile to $ns lookups, safe)
 * FORBIDDEN: import from 'backend/*'  (creates dynamic chunk → crash)
 * FORBIDDEN: import from 'public/*'   (creates dynamic chunk → crash)
 *
 * Root cause (confirmed 2026-03-10):
 * backend/* and public/* imports inject a webpack JSONP runtime
 * INSIDE the strict-mode inner function where `this` is undefined.
 * wix-* imports compile to $ns["wix-location"] etc. in the OUTER
 * AMD factory scope — no crash.
 *
 * ============================================================
 * ELEMENT IDs — CONFIRMED FROM LIVE DOM INSPECTION 2026-03-10
 * ============================================================
 * Find My Jail button: comp-ml15h39u
 * (Dropdown + Get Started are in HOME.c1dmp.js)
 * ============================================================
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { session } from 'wix-storage';

// ---------------------------------------------------------------------------
// Inline county coordinates for Find My Jail geolocation
// ---------------------------------------------------------------------------

const COUNTY_COORDS = {
    "alachua": { lat: 29.67, lon: -82.35 },
    "baker": { lat: 30.33, lon: -82.29 },
    "bay": { lat: 30.26, lon: -85.63 },
    "bradford": { lat: 29.95, lon: -82.16 },
    "brevard": { lat: 28.30, lon: -80.70 },
    "broward": { lat: 26.15, lon: -80.45 },
    "calhoun": { lat: 30.41, lon: -85.20 },
    "charlotte": { lat: 26.90, lon: -81.92 },
    "citrus": { lat: 28.85, lon: -82.47 },
    "clay": { lat: 29.98, lon: -81.86 },
    "collier": { lat: 26.10, lon: -81.39 },
    "columbia": { lat: 30.22, lon: -82.63 },
    "desoto": { lat: 27.20, lon: -81.81 },
    "dixie": { lat: 29.60, lon: -83.15 },
    "duval": { lat: 30.33, lon: -81.67 },
    "escambia": { lat: 30.65, lon: -87.35 },
    "flagler": { lat: 29.47, lon: -81.30 },
    "franklin": { lat: 29.80, lon: -84.80 },
    "gadsden": { lat: 30.56, lon: -84.63 },
    "gilchrist": { lat: 29.72, lon: -82.78 },
    "glades": { lat: 26.95, lon: -81.18 },
    "gulf": { lat: 29.93, lon: -85.22 },
    "hamilton": { lat: 30.51, lon: -82.95 },
    "hardee": { lat: 27.49, lon: -81.79 },
    "hendry": { lat: 26.54, lon: -81.14 },
    "hernando": { lat: 28.56, lon: -82.46 },
    "highlands": { lat: 27.35, lon: -81.35 },
    "hillsborough": { lat: 27.91, lon: -82.35 },
    "holmes": { lat: 30.86, lon: -85.81 },
    "indian-river": { lat: 27.67, lon: -80.49 },
    "jackson": { lat: 30.79, lon: -85.22 },
    "jefferson": { lat: 30.41, lon: -83.90 },
    "lafayette": { lat: 30.07, lon: -83.18 },
    "lake": { lat: 28.75, lon: -81.72 },
    "lee": { lat: 26.58, lon: -81.85 },
    "leon": { lat: 30.46, lon: -84.27 },
    "levy": { lat: 29.27, lon: -82.61 },
    "liberty": { lat: 30.25, lon: -84.86 },
    "madison": { lat: 30.45, lon: -83.47 },
    "manatee": { lat: 27.49, lon: -82.35 },
    "marion": { lat: 29.19, lon: -82.13 },
    "martin": { lat: 27.08, lon: -80.42 },
    "miami-dade": { lat: 25.61, lon: -80.56 },
    "monroe": { lat: 25.10, lon: -81.10 },
    "nassau": { lat: 30.61, lon: -81.76 },
    "okaloosa": { lat: 30.66, lon: -86.58 },
    "okeechobee": { lat: 27.25, lon: -80.89 },
    "orange": { lat: 28.51, lon: -81.32 },
    "osceola": { lat: 28.06, lon: -81.15 },
    "palm-beach": { lat: 26.63, lon: -80.44 },
    "pasco": { lat: 28.30, lon: -82.46 },
    "pinellas": { lat: 27.90, lon: -82.74 },
    "polk": { lat: 27.96, lon: -81.87 },
    "putnam": { lat: 29.62, lon: -81.73 },
    "santa-rosa": { lat: 30.69, lon: -87.01 },
    "sarasota": { lat: 27.18, lon: -82.35 },
    "seminole": { lat: 28.72, lon: -81.21 },
    "st-johns": { lat: 29.93, lon: -81.42 },
    "st-lucie": { lat: 27.38, lon: -80.43 },
    "sumter": { lat: 28.71, lon: -82.08 },
    "suwannee": { lat: 30.19, lon: -83.00 },
    "taylor": { lat: 30.05, lon: -83.61 },
    "union": { lat: 30.04, lon: -82.37 },
    "volusia": { lat: 29.03, lon: -81.07 },
    "wakulla": { lat: 30.15, lon: -84.37 },
    "walton": { lat: 30.64, lon: -86.17 },
    "washington": { lat: 30.61, lon: -85.66 }
};

// ---------------------------------------------------------------------------
// Element ID constants -- confirmed from live DOM inspection 2026-03-10
// ---------------------------------------------------------------------------
const FIND_JAIL_IDS = ['#comp-ml15h39u', '#navFindJail', '#findMyJailBtn'];

// ---------------------------------------------------------------------------
// onReady
// ---------------------------------------------------------------------------

$w.onReady(function () {
    const isMobile = wixWindow.formFactor === 'Mobile';

    // 1. Immediate Critical Setup (Universal)
    initCriticalUI();

    // 2. Mobile-Specific Optimization Path
    if (isMobile) {
        setupMobileMenu();
        deferNonCriticalOperations(true);
    } else {
        deferNonCriticalOperations(false);
    }
});

// ---------------------------------------------------------------------------
// Critical UI
// ---------------------------------------------------------------------------

function initCriticalUI() {
    try { setupStickyHeader(); } catch (e) { /* non-fatal */ }
    setupEmergencyCallButton();
    setupFindJailButton();
    checkAuthStatus();
    setupFooterPaymentLink();
    setupMobilePaymentBtn();
    setupFooterDynamic();
}

function setupFooterPaymentLink() {
    try {
        const link = $w('#footerPaymentLink');
        if (link && link.id) {
            link.onClick(function() {
                trackEvent('payment_link_clicked', { location: 'footer' });
            });
        }
    } catch (e) { /* non-fatal */ }
}

function setupMobilePaymentBtn() {
    try {
        const link = $w('#mobileMakePaymentBtn');
        if (link && link.id) {
            link.onClick(function() {
                trackEvent('payment_link_clicked', { location: 'mobile_menu' });
            });
        }
    } catch (e) { /* non-fatal */ }
}

/**
 * Dynamic footer updates — copyright year + link corrections.
 * NOTE: siteFooter.js exists in public/ but CANNOT be imported into masterPage.js
 * (public/* imports crash Wix Velo — see header comment). These updates are
 * inlined here instead.
 */
function setupFooterDynamic() {
    // 1. Dynamic copyright year (never stale)
    try {
        const copyrightEl = $w('#copyrightText');
        if (copyrightEl && copyrightEl.id) {
            const year = new Date().getFullYear();
            copyrightEl.text = `© ${year} Shamrock Bail Bonds, LLC. All rights reserved.`;
        }
    } catch (e) { /* non-fatal */ }

    // 2. Fix footer county directory link → homepage county selector
    try {
        const countyDirLink = $w('#footerLinkCounties');
        if (countyDirLink && countyDirLink.id) {
            countyDirLink.link = '/#counties';
        }
    } catch (e) { /* non-fatal */ }

    // 3. Fix any "Florida County Directory" text links
    try {
        const dirLink = $w('#footerLinkDirectory');
        if (dirLink && dirLink.id) {
            dirLink.link = '/#counties';
        }
    } catch (e) { /* non-fatal */ }
}

function setupMobileMenu() {
    try {
        const mobileMenuBtn = $w('#mobileMenuButton');
        const mobileMenu = $w('#mobileMenu');
        if (mobileMenuBtn && mobileMenuBtn.id && mobileMenu && mobileMenu.id) {
            mobileMenuBtn.onClick(function() { mobileMenu.expand(); });
        }
    } catch (e) { /* non-fatal */ }
}

function deferNonCriticalOperations(isMobile) {
    const baseDelay = isMobile ? 1500 : 500;
    setTimeout(function() { initAnalytics(); }, baseDelay);
    setTimeout(function() { initGeolocation(); }, baseDelay + 500);
}

function setupStickyHeader() {
    // Wix native fixed header handles this -- no custom logic needed
}

function setupEmergencyCallButton() {
    try {
        const btn = $w('#emergencyCallButton');
        if (btn && btn.id) {
            btn.onClick(function() { trackEvent('emergency_call_clicked'); });
        }
    } catch (e) { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
// Find My Jail -- INLINE GEOLOCATION, NO BACKEND CALL
// ---------------------------------------------------------------------------

/**
 * Resolve a Wix element by trying multiple IDs in order.
 * Returns the first element found, or null.
 */
function resolveElement(ids) {
    for (let i = 0; i < ids.length; i++) {
        try {
            const el = $w(ids[i]);
            if (el && el.uniqueId) return el;
        } catch (e) { /* try next */ }
    }
    return null;
}

/**
 * Setup "Find My Jail" button.
 *
 * Primary: comp-ml15h39u (real DOM ID confirmed 2026-03-10)
 * Fallback: Velo nicknames #navFindJail, #findMyJailBtn
 */
function setupFindJailButton() {
    const btn = resolveElement(FIND_JAIL_IDS);

    if (!btn) {
        console.warn('[FindMyJail] Button not found. Tried: ' + FIND_JAIL_IDS.join(', '));
        return;
    }

    // Override any static Editor link so our onClick is the sole handler
    try { btn.link = ''; } catch (e) { /* read-only in some contexts */ }

    btn.onClick(function() { handleFindJailClick(btn); });
}

/**
 * Handle "Find My Jail" click.
 *
 * Uses wixWindow.getCurrentGeolocation() and inline COUNTY_COORDS table
 * to find the nearest Florida county. Falls back to /florida-bail-bonds
 * if geolocation is denied or unavailable.
 */
function handleFindJailClick(btn) {
    const originalLabel = (btn && btn.label) || 'Find My Jail';

    try { if (btn) btn.label = 'Locating...'; } catch (e) { /* non-fatal */ }

    wixWindow.getCurrentGeolocation()
        .then(function(location) {
            const lat = location.coords.latitude;
            const lon = location.coords.longitude;
            const nearestSlug = findNearestCounty(lat, lon);

            try { if (btn) btn.label = originalLabel; } catch (e) { /* non-fatal */ }

            if (nearestSlug) {
                wixLocation.to('/florida-bail-bonds/' + nearestSlug);
            } else {
                wixLocation.to('/florida-bail-bonds');
            }
        })
        .catch(function(error) {
            try { if (btn) btn.label = originalLabel; } catch (e) { /* non-fatal */ }
            const errMsg = (error && error.message) || String(error);
            console.warn('[FindMyJail] Geolocation failed:', errMsg);
            wixLocation.to('/florida-bail-bonds');
        });
}

/**
 * Find the nearest Florida county slug using Haversine distance.
 */
function findNearestCounty(lat, lon) {
    let nearestSlug = null;
    let minDist = Infinity;

    const slugs = Object.keys(COUNTY_COORDS);
    for (let i = 0; i < slugs.length; i++) {
        const slug = slugs[i];
        const coords = COUNTY_COORDS[slug];
        const dist = haversineDistance(lat, lon, coords.lat, coords.lon);
        if (dist < minDist) {
            minDist = dist;
            nearestSlug = slug;
        }
    }

    return nearestSlug;
}

/**
 * Haversine distance in km between two lat/lon points.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Auth check
// ---------------------------------------------------------------------------

function checkAuthStatus() {
    try {
        const isLoggedIn = session.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            try {
                const loginBtn = $w('#loginButton');
                if (loginBtn && loginBtn.id) loginBtn.hide();
            } catch (e) { /* non-fatal */ }
            try {
                const portalBtn = $w('#portalButton');
                if (portalBtn && portalBtn.id) portalBtn.show();
            } catch (e) { /* non-fatal */ }
        }
    } catch (error) { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
// Deferred operations
// ---------------------------------------------------------------------------

function initAnalytics() {
    // Placeholder: analytics providers wired here when needed
}

function initGeolocation() {
    // Placeholder: geolocation pre-warm wired here when needed
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

function trackEvent(eventName, eventData) {
    try {
        const payload = eventData || {};
        payload.event = eventName;
        wixWindow.trackEvent('CustomEvent', payload);
    } catch (e) {
        // Fail silently to not impact user
    }
}
