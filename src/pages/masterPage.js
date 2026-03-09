/**
 * masterPage.js - Shamrock Bail Bonds
 */

// Type-bypass helper for dynamic element IDs not recognized by Wix TS checker
const $d = (/** @type {string} */ id) => /** @type {any} */($w)(id);

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { session } from 'wix-storage';
// @ts-ignore -- prefetchPageResources: speeds up portal navigation for all site visitors
import { site as wixSite } from '@wix/site-site';

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
// onReady
// ---------------------------------------------------------------------------

$w.onReady(function () {
    // 1. Immediate Critical Setup (Universal)
    initCriticalUI();

    // 2. Mobile-Specific Optimization Path
    if (wixWindow.formFactor === 'Mobile') {
        setupMobileMenu();
        deferNonCriticalOperations(true);
    } else {
        deferNonCriticalOperations(false);
    }

    // 3. Prefetch portal-landing globally (primary CTA target for all pages)
    // Delays until after initial paint to not compete with critical resources
    const isMobile = wixWindow.formFactor === 'Mobile';
    setTimeout(() => {
        try {
            wixSite.prefetchPageResources({ pages: ['/portal-landing'] }).catch(() => { });
        } catch (e) { /* non-fatal */ }
    }, isMobile ? 4000 : 2000);
});

// ---------------------------------------------------------------------------
// Critical UI
// ---------------------------------------------------------------------------

function initCriticalUI() {
    // Setup sticky header
    try { setupStickyHeader(); } catch (e) { /* non-fatal */ }

    // Setup emergency call button (critical for bail bonds)
    setupEmergencyCallButton();

    // Setup "Find My Jail" button
    setupFindJailButton();

    // Check auth status
    checkAuthStatus();

    // Footer Payment Link Tracking
    setupFooterPaymentLink();
    setupMobilePaymentBtn();
}

function setupFooterPaymentLink() {
    try {
        const link = $w('#footerPaymentLink');
        if (link && link.id) {
            link.onClick(() => {
                trackEvent('payment_link_clicked', { location: 'footer' });
            });
        }
    } catch (e) { /* non-fatal */ }
}

function setupMobilePaymentBtn() {
    try {
        const link = $d('#mobileMakePaymentBtn');
        if (link && link.id) {
            link.onClick(() => {
                trackEvent('payment_link_clicked', { location: 'mobile_menu' });
            });
        }
    } catch (e) { /* non-fatal */ }
}

function setupMobileMenu() {
    try {
        const mobileMenuBtn = $d('#mobileMenuButton');
        const mobileMenu = $d('#mobileMenu');
        if (mobileMenuBtn && mobileMenuBtn.id && mobileMenu && mobileMenu.id) {
            mobileMenuBtn.onClick(() => { mobileMenu.expand(); });
        }
    } catch (e) { /* non-fatal */ }
}

function deferNonCriticalOperations(isMobile) {
    // Reduced delays: mobile 1500ms (was 3000ms), desktop 500ms (was 1000ms)
    const baseDelay = isMobile ? 1500 : 500;
    setTimeout(() => { initAnalytics(); }, baseDelay);
    setTimeout(() => { initGeolocation(); }, baseDelay + 500);
}

function setupStickyHeader() {
    // Wix native fixed header handles this -- no custom logic needed
}

function setupEmergencyCallButton() {
    try {
        const btn = $d('#emergencyCallButton');
        if (btn && btn.id) {
            btn.onClick(() => { trackEvent('emergency_call_clicked'); });
        }
    } catch (e) { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
// Find My Jail -- INLINE GEOLOCATION, NO BACKEND CALL
// ---------------------------------------------------------------------------

/**
 * Setup "Find My Jail" button.
 *
 * Uses inline county coordinate table to find the nearest county.
 * No backend import, no dynamic chunk, no webpack crash.
 *
 * Supports both #navFindJail and #findMyJailBtn element IDs.
 */
function setupFindJailButton() {
    let btn = null;

    try {
        const el = $w('#navFindJail');
        btn = (el && el.id) ? el : null;
    } catch (e) { /* try fallback */ }

    if (!btn) {
        try {
            const el = $d('#findMyJailBtn');
            btn = (el && el.id) ? el : null;
        } catch (e) { /* not found */ }
    }

    if (!btn) return; // Button not on this page -- non-fatal

    // Override any static Editor link so our onClick is the sole handler
    try { btn.link = ''; } catch (e) { /* read-only in some contexts */ }

    btn.onClick(() => { handleFindJailClick(btn); });
}

/**
 * Handle "Find My Jail" click.
 *
 * Uses wixWindow.getCurrentGeolocation() and inline COUNTY_COORDS table
 * to find the nearest Florida county. Falls back to /florida-bail-bonds
 * if geolocation is denied or unavailable.
 */
async function handleFindJailClick(btn) {
    const originalLabel = (btn && btn.label) || 'Find My Jail';

    // Update label optimistically; do NOT disable -- disabling causes stuck state
    // when Wix navigation interrupts the finally block.
    try { if (btn) btn.label = 'Locating...'; } catch (e) { /* non-fatal */ }

    try {
        // 1. Request geolocation
        const location = await wixWindow.getCurrentGeolocation();
        const { latitude, longitude } = location.coords;

        // 2. Find nearest county using inline coordinate table
        const nearestSlug = findNearestCounty(latitude, longitude);

        // 3. Reset label BEFORE navigation so the button is never stuck
        try { if (btn) btn.label = originalLabel; } catch (e) { /* non-fatal */ }

        if (nearestSlug) {
            wixLocation.to('/florida-bail-bonds/' + nearestSlug);
        } else {
            wixLocation.to('/florida-bail-bonds');
        }

    } catch (error) {
        // Geolocation denied, timed out, or unavailable -- always reset label first
        try { if (btn) btn.label = originalLabel; } catch (e) { /* non-fatal */ }

        const errMsg = (error && error.message) || String(error);
        console.warn('[FindMyJail] Geolocation failed:', errMsg);

        // Navigate to county list so user can pick manually
        wixLocation.to('/florida-bail-bonds');
    }
}

/**
 * Find the nearest Florida county slug using Haversine distance.
 * Pure inline calculation -- no backend call needed.
 *
 * @param {number} lat - User latitude
 * @param {number} lon - User longitude
 * @returns {string|null} County slug or null
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
    const R = 6371; // Earth radius in km
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

async function checkAuthStatus() {
    try {
        const isLoggedIn = session.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            try {
                const loginBtn = $d('#loginButton');
                if (loginBtn && loginBtn.id) loginBtn.hide();
            } catch (e) { /* non-fatal */ }
            try {
                const portalBtn = $d('#portalButton');
                if (portalBtn && portalBtn.id) portalBtn.show();
            } catch (e) { /* non-fatal */ }
        }
    } catch (error) { /* non-fatal: auth elements may not exist on all pages */ }
}

// ---------------------------------------------------------------------------
// Deferred operations
// ---------------------------------------------------------------------------

function initAnalytics() {
    // Placeholder: analytics providers (e.g. GA4 events) wired here when needed
}

async function initGeolocation() {
    // Placeholder: geolocation pre-warm (e.g. permission priming) wired here when needed
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
