// masterPage.js
// Global code that runs on every page

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { authentication } from 'wix-members';
import { silentPingLocation } from 'public/location-tracker';
import { initializePhoneInjection } from 'public/phone-injector';
import { initHeader } from 'public/siteHeader';
import { initFooter } from 'public/siteFooter';

$w.onReady(function () {
    // 1. Initialize Site Components (Public Modules)
    initHeader();
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

    if (mobileCTA.valid) {
        if (formFactor === "Mobile") {
            mobileCTA.expand();
        } else {
            mobileCTA.collapse();
        }
    }
}
