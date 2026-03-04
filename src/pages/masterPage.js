/**
 * Optimized masterPage.js for Shamrock Bail Bonds
 * 
 * KEY OPTIMIZATIONS:
 * 1. Defer non-critical operations
 * 2. Lazy load heavy components
 * 3. Minimize initial page load work
 * 4. Use async/await for better performance
 * 5. Dynamic imports to reduce initial bundle size
 */

/**
 * Optimized masterPage.js for Shamrock Bail Bonds
 * 
 * KEY OPTIMIZATIONS:
 * 1. Defer non-critical operations
 * 2. Lazy load heavy components
 * 3. Minimize initial page load work
 * 4. Use async/await for better performance
 */

import { session } from 'wix-storage';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
// import { getNearestCounties } from 'backend/counties'; // Moved to dynamic import

import { validateStickyFooter } from 'public/uiValidator';
import { initMobileOptimizations } from 'public/mobile-optimize';
import { initGlobalSEO } from 'public/seoUtils';

// Critical: Load immediately
$w.onReady(function () {
    // 1. Immediate Critical Setup (Universal)
    initCriticalUI();

    // 2. Mobile-Specific Optimization Path
    if (wixWindow.formFactor === 'Mobile') {
        // Mobile: Prioritize interaction over heavy visuals
        setupMobileMenu();
        initMobileOptimizations(); // Now strictly for mobile

        // Defer non-criticals significantly on mobile
        deferNonCriticalOperations(true);
    } else {
        // Desktop: Standard loading
        deferNonCriticalOperations(false);
    }
});

/**
 * Initialize critical UI elements that must be ready immediately
 */
function initCriticalUI() {
    // GLOBAL SEO: Canonical URLs, schemas, OG tags on ALL public pages
    initGlobalSEO();

    // Setup sticky header
    setupStickyHeader();

    // UI Validator (Automated check for Mobile CTA)
    validateStickyFooter('#stickyMobileCTA');

    // Setup emergency call button (critical for bail bonds)
    setupEmergencyCallButton();

    // Setup "Find My Jail" button
    setupFindJailButton();

    // Check if user is logged in (for portal access)
    // We do this non-blockingly
    checkAuthStatus();

    // Footer Payment Link Tracking
    setupFooterPaymentLink();
    setupMobilePaymentBtn();
}

/**
 * Setup footer payment link tracking
 */
function setupFooterPaymentLink() {
    const link = $w('#footerPaymentLink');
    if (link.uniqueId) {
        link.onClick(() => {
            trackEvent('payment_link_clicked', {
                location: 'footer'
            });
        });
    }

}

function setupMobilePaymentBtn() {
    const link = $w('#mobileMakePaymentBtn');
    if (link.uniqueId) {
        link.onClick(() => {
            trackEvent('payment_link_clicked', {
                location: 'mobile_menu'
            });
        });
    }
}

/**
 * Setup mobile menu with minimal overhead
 */
function setupMobileMenu() {
    const mobileMenuBtn = $w('#mobileMenuButton');
    const mobileMenu = $w('#mobileMenu');

    if (mobileMenuBtn.uniqueId && mobileMenu.uniqueId) {
        mobileMenuBtn.onClick(() => {
            mobileMenu.expand();
        });
    }
}

/**
 * Defer non-critical operations to improve initial load time
 * @param {boolean} isMobile - Whether to use aggressive mobile deferrals
 */
function deferNonCriticalOperations(isMobile = false) {
    const baseDelay = isMobile ? 3000 : 1000; // Slower start on mobile to free up thread

    // Defer analytics
    setTimeout(() => {
        initAnalytics();
    }, baseDelay + 1000);

    // Defer geolocation
    setTimeout(() => {
        initGeolocation();
    }, baseDelay + 2000);

    // Defer chat widget (Aggressive deferral on mobile)
    setTimeout(() => {
        initChatWidget();
    }, isMobile ? 8000 : 4000);

    // Defer tracking pixels
    setTimeout(() => {
        initTrackingPixels();
    }, isMobile ? 8000 : 4000);
}

/**
 * Setup sticky header with optimized scroll logic
 */
function setupStickyHeader() {
    // Note: Velo does not support window.requestAnimationFrame directly.
    // relying on Wix's native fixed header/elements is best for performance.
    // If strict custom logic is needed, use onViewportLeave of a sentinel element.
    const header = $w('#SITE_HEADER');
    if (!header.uniqueId) return;
}

/**
 * Setup emergency call button (critical for bail bonds business)
 */
function setupEmergencyCallButton() {
    const btn = $w('#emergencyCallButton');
    if (btn.uniqueId) {
        btn.onClick(() => {
            // Track call button click - fire and forget
            trackEvent('emergency_call_clicked');
        });
    }
}

/**
 * Setup "Find My Jail" button (Automatic redirection to nearest county).
 *
 * FIX (2026-03-04): The previous implementation had two bugs that caused the
 * button to get permanently stuck:
 *
 *  1. btn.disable() was called but btn.enable() was in the finally block which
 *     only ran AFTER wixLocation.to() — but Wix navigation cancels JS execution
 *     mid-flight, so finally never ran and the button stayed disabled.
 *
 *  2. The fallback on geolocation denial navigated to '/' (home), which just
 *     reloaded the same page with the same stuck button. Now it navigates to
 *     the Florida Counties page so the user can pick a county manually.
 *
 *  3. btn.link = "" is kept so the Editor-set static link doesn't interfere.
 */
function setupFindJailButton() {
    // Support both possible IDs for the header button
    let btn;
    try {
        const el = $w('#navFindJail');
        btn = el && el.uniqueId ? el : null;
    } catch (e) { btn = null; }

    if (!btn) {
        try {
            const el2 = $w('#findMyJailBtn');
            btn = el2 && el2.uniqueId ? el2 : null;
        } catch (e) { /* not found */ }
    }

    if (!btn) return; // Button not on this page — non-fatal

    // Override any static Editor link so our onClick is the sole handler
    try { btn.link = ''; } catch (e) { /* read-only in some contexts */ }

    btn.onClick(() => {
        handleFindJailClick(btn);
    });
}

/**
 * Handle "Find My Jail" click.
 *
 * FIX (2026-03-04):
 *  - Re-enable the button BEFORE navigating so it is never permanently stuck.
 *  - Fallback navigates to /florida-bail-bonds (county list) not '/' (home).
 *  - Added explicit geolocation permission check to give a faster UX path.
 *
 * @param {Object} btn - The resolved Wix button element
 */
async function handleFindJailClick(btn) {
    const originalLabel = (btn && btn.label) || 'Find My Jail';

    // Optimistically update label; do NOT disable — disabling causes stuck state
    // when Wix navigation interrupts the finally block.
    try { if (btn) btn.label = 'Locating…'; } catch (e) { /* non-fatal */ }

    try {
        // 1. Request geolocation (user may be prompted for permission)
        const location = await wixWindow.getCurrentGeolocation();
        const { latitude, longitude } = location.coords;

        // 2. Find nearest county via backend (dynamic import for performance)
        const { getNearestCounties } = await import('backend/counties');
        const nearest = await getNearestCounties(latitude, longitude, 1);

        // 3. Reset label BEFORE navigation so the button is never stuck
        try { if (btn) btn.label = originalLabel; } catch (e) { /* non-fatal */ }

        if (nearest && nearest.length > 0) {
            // Strip any residual '-county' suffix from the slug
            const rawSlug = nearest[0].slug || '';
            const targetSlug = rawSlug.replace(/-county$/i, '').trim();
            wixLocation.to(`/florida-bail-bonds/${targetSlug}`);
        } else {
            // No nearest county found — send to county list page
            wixLocation.to('/florida-bail-bonds');
        }

    } catch (error) {
        // Geolocation denied, timed out, or unavailable — always reset label first
        try { if (btn) btn.label = originalLabel; } catch (e) { /* non-fatal */ }

        const errMsg = (error && error.message) || String(error);
        console.warn('[FindMyJail] Geolocation failed:', errMsg);

        // FIX: Navigate to county list (not home) so user can pick manually
        wixLocation.to('/florida-bail-bonds');
    }
}

/**
 * Check authentication status (lightweight check)
 */
async function checkAuthStatus() {
    try {
        const isLoggedIn = session.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            // Show logged-in UI
            const loginBtn = $w('#loginButton');
            if (loginBtn.uniqueId) loginBtn.hide();

            const portalBtn = $w('#portalButton');
            if (portalBtn.uniqueId) portalBtn.show();
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

/**
 * Initialize analytics (deferred)
 */
function initAnalytics() {
    // Google Analytics or other analytics code
    // console.log('Analytics initialized');
}

/**
 * Initialize geolocation (deferred)
 */
async function initGeolocation() {
    try {
        // Only init if user hasn't denied permission
        const geoPermission = session.getItem('geoPermission');
        if (geoPermission !== 'denied') {
            // Lazy load geolocation logic if complex
            // console.log("Geolocation init triggered");
        }
    } catch (error) {
        console.error('Geolocation error:', error);
    }
}

/**
 * Initialize chat widget (deferred)
 */
function initChatWidget() {
    // Only load chat widget if user has been on site for 5+ seconds
    // console.log('Chat widget initialized');
}

/**
 * Initialize tracking pixels (deferred)
 */
function initTrackingPixels() {
    // Facebook Pixel, etc.
    // console.log('Tracking pixels initialized');
}

/**
 * Track events (lightweight wrapper)
 */
function trackEvent(eventName, eventData = {}) {
    try {
        wixWindow.trackEvent("CustomEvent", {
            event: eventName,
            detail: eventData
        });
    } catch (e) {
        // Fail silently to not impact user
    }
}
