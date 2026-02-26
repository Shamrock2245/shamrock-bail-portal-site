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
 * Setup "Find My Jail" button (Automatic redirection to nearest county)
 */
function setupFindJailButton() {
    const btn = $w('#navFindJail');
    if (btn.uniqueId) {
        // FORCE UI STATE: Override Editor settings
        btn.label = "Find My Jail";
        // Remove any static link set in Editor so our onClick works exclusive
        btn.link = "";

        btn.onClick(() => {
            handleFindJailClick(btn);
        });
    }
}

async function handleFindJailClick(btn) {
    let originalLabel = btn.label;
    try {
        btn.label = "Locating...";
        btn.disable();

        // 1. Get Location
        const location = await wixWindow.getCurrentGeolocation();
        const { latitude, longitude } = location.coords;

        // 2. Find Nearest County
        // Dynamic Import for performance
        const { getNearestCounties } = await import('backend/counties');
        const nearest = await getNearestCounties(latitude, longitude, 1);

        if (nearest && nearest.length > 0) {
            // FIX: Use correctly routed /bail-bonds/ prefix (Now registered in routers.js)
            const targetSlug = nearest[0].slug;

            // 3. Redirect
            wixLocation.to(`/florida-bail-bonds/${targetSlug}`);
        } else {
            // Fallback
            wixLocation.to('/');
        }

    } catch (error) {
        console.warn("Geolocation failed or denied:", error);
        // Fallback to general list if location denied
        wixLocation.to('/');
    } finally {
        // Reset label
        btn.label = originalLabel || "Find My Jail";
        btn.enable();
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
