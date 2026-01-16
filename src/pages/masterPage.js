// masterPage.js
// Updated: Force Sync
// Global code that runs on every page

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';

import { getOrSetSessionId } from 'public/session-manager';
import { silentPingLocation } from 'public/location-tracker';
import { initializePhoneInjection } from 'public/phone-injector';
import { initHeader } from 'public/siteHeader';
import { initFooter } from 'public/siteFooter';
import { processBookingSheet } from 'public/bookingSheetHandler';

const safeRun = (name, fn) => {
    try {
        const result = fn();
        if (result instanceof Promise) {
            result.catch(e => console.error(`⚠️ [Resiliency] ${name} (Async) failed:`, e));
        }
    } catch (e) {
        console.error(`⚠️ [Resiliency] ${name} failed:`, e);
    }
};

$w.onReady(function () {
    // 0. ID TRUTH (Must run first)
    safeRun("Session", getOrSetSessionId);

    // 1. Initialize Site Components (Public Modules)
    safeRun("Header", () => initHeader($w));
    safeRun("Footer", initFooter);

    // 2. Handle Responsive View (Crucial for UI)
    safeRun("Responsive", checkMobileView);

    // 3. Proactive tracking
    safeRun("LocationPing", silentPingLocation);

    // 4. Global Phone Injection
    safeRun("PhoneInjector", initializePhoneInjection);

    // 5. GLOBAL SEO SAFETY NET
    safeRun("GlobalSEO", runGlobalSEO);
});

function runGlobalSEO() {
    try {
        // A. Auto-Alt Text for all images
        const images = $w('Image');
        images.forEach(img => {
            if (!img.alt || img.alt === "" || img.alt === "Image") {
                img.alt = "Shamrock Bail Bonds - 24/7 Bail Bonds Services in Fort Myers, Naples & Southwest Florida";
                // console.log("🔧 Auto-Fixed Alt Text for:", img.id);
            }
        });

        // B. Safety Check for Page Title (If missing, default it)
        // Note: wix-seo runs earlier usually, but this is a final UI check if strictly needed.
    } catch (e) {
        // Ignore errors if selectors fail
    }
}

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
