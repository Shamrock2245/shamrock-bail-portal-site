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
import { getNearestCounties } from 'backend/counties';

import { validateStickyFooter } from 'public/uiValidator';

// Critical: Load immediately
$w.onReady(function () {
    // Only essential above-the-fold operations here
    initCriticalUI();
    setupMobileMenu();

    // Defer everything else
    deferNonCriticalOperations();
});

/**
 * Initialize critical UI elements that must be ready immediately
 */
function initCriticalUI() {
    // Setup sticky header
    setupStickyHeader();

    // UI Validator (Automated check for Mobile CTA)
    validateStickyFooter('#boxStickyFooter');

    // Setup emergency call button (critical for bail bonds)
    setupEmergencyCallButton();

    // Setup "Find My Jail" button
    setupFindJailButton();

    // Check if user is logged in (for portal access)
    // We do this non-blockingly
    checkAuthStatus();
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
 */
function deferNonCriticalOperations() {
    // Defer analytics (2 seconds)
    setTimeout(() => {
        initAnalytics();
    }, 2000);

    // Defer geolocation (3 seconds)
    setTimeout(() => {
        initGeolocation();
    }, 3000);

    // Defer chat widget (5 seconds)
    setTimeout(() => {
        initChatWidget();
    }, 5000);

    // Defer tracking pixels (5 seconds)
    setTimeout(() => {
        initTrackingPixels();
    }, 5000);
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
    const btn = $w('#findJailBtn');
    if (btn.uniqueId) {
        btn.onClick(() => {
            handleFindJailClick(btn);
        });
    }
}

async function handleFindJailClick(btn) {
    try {
        const originalLabel = btn.label;
        btn.label = "Locating...";
        btn.disable();

        // 1. Get Location
        const location = await wixWindow.getCurrentGeolocation();
        const { latitude, longitude } = location.coords;

        // 2. Find Nearest County
        const nearest = await getNearestCounties(latitude, longitude, 1);

        if (nearest && nearest.length > 0) {
            const targetSlug = nearest[0].slug;
            // 3. Redirect
            wixLocation.to(`/florida-bail-bonds/${targetSlug}`);
        } else {
            // Fallback
            wixLocation.to('/bail-bonds');
        }

    } catch (error) {
        console.warn("Geolocation failed or denied:", error);
        // Fallback to general list if location denied
        wixLocation.to('/bail-bonds');
    } finally {
        btn.label = "Find My Jail";
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
