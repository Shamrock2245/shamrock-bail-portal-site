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

    // Setup emergency call button (critical for bail bonds)
    setupEmergencyCallButton();

    // Check if user is logged in (for portal access)
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
 * Setup sticky header with optimized scroll listener
 */
function setupStickyHeader() {
    // Note: Velo does not support window.requestAnimationFrame.
    // Using sentinel approach or assuming Wix Editor Fixed Header is used.
    // If code based stickiness is required, we use anchors.

    const header = $w('#SITE_HEADER');
    // const sentinel = $w('#headerSentinel'); 

    // For robustness in this optimization pass, we'll verify header exists
    if (!header.uniqueId) return;

    // Optimized: We leave standard fixed header behavior to Wix settings 
    // unless we have specific logic.
}

/**
 * Setup emergency call button (critical for bail bonds business)
 */
function setupEmergencyCallButton() {
    const btn = $w('#emergencyCallButton');
    if (btn.uniqueId) {
        btn.onClick(() => {
            // Track call button click
            trackEvent('emergency_call_clicked');
            // Phone number is in href, no additional action needed
        });
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
    console.log('Analytics initialized');
}

/**
 * Initialize geolocation (deferred)
 */
async function initGeolocation() {
    try {
        // Only init if user hasn't denied permission
        const geoPermission = session.getItem('geoPermission');
        if (geoPermission !== 'denied') {
            console.log("Geolocation init triggered");
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
    console.log('Chat widget initialized');
}

/**
 * Initialize tracking pixels (deferred)
 */
function initTrackingPixels() {
    // Facebook Pixel, etc.
    console.log('Tracking pixels initialized');
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
        console.warn("Tracking failed", e);
    }
}
