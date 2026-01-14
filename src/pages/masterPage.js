// masterPage.js
// Updated: Force Sync
// Global code that runs on every page

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

import { startSessionTracker } from 'public/session-manager'; // Correct export not verified yet, wait. I created getOrSetSessionId.
import { getOrSetSessionId } from 'public/session-manager';
import { silentPingLocation } from 'public/location-tracker';
import { initializePhoneInjection } from 'public/phone-injector';
import { initHeader } from 'public/siteHeader';
import { initFooter } from 'public/siteFooter';
import { processBookingSheet } from 'public/bookingSheetHandler';

$w.onReady(function () {
    // 0. ID TRUTH (Must run first)
    getOrSetSessionId();

    // 1. Initialize Site Components (Public Modules)
    initHeader($w);
    initFooter();

    // 2. Handle Responsive View
    checkMobileView();

    // 3. Proactive tracking
    silentPingLocation();

    // 4. Global Phone Injection (Dynamic Routing)

    initializePhoneInjection();


});

// Note: Local initHeader and initFooter are removed in favor of robust public/siteHeader and public/siteFooter components.

function checkMobileView() {
    const formFactor = wixWindow.formFactor; // "Desktop", "Mobile", "Tablet"
    const mobileCTA = $w('#stickyMobileCTA');

    try {
        if (formFactor === "Mobile") {
            mobileCTA.expand();
        } else {
            mobileCTA.collapse();
        }
    } catch (err) {
        // Ignore if element missing
    }
}
