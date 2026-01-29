/**
 * uiValidator.js
 * 
 * Purpose: Frontend script to validate Critical UI elements (Sticky Footer, Call Button).
 * Usage: Import and run in masterPage.js (can be gated by a query param or dev flag).
 */

import wixWindow from 'wix-window';

/**
 * Validates the Mobile Sticky Footer visibility.
 * Logs errors to console if the footer is missing, collapsed, or potentially hidden.
 * @param {string} footerId - ID of the footer box (default: #boxStickyFooter)
 */
export function validateStickyFooter(footerId = '#boxStickyFooter') {
    // Only run on mobile
    if (wixWindow.formFactor !== 'Mobile') {
        return;
    }

    $w.onReady(() => {
        const footer = $w(footerId);

        // 1. Existence Check
        if (!footer) {
            console.error(`❌ UI Validator: Sticky Footer '${footerId}' NOT FOUND on this page.`);
            return;
        }

        // 2. Collapse State Check
        if (footer.collapsed) {
            console.error(`❌ UI Validator: Sticky Footer '${footerId}' is COLLAPSED.`);
            return;
        }

        // 3. Hidden State Check
        if (footer.hidden) {
            console.error(`❌ UI Validator: Sticky Footer '${footerId}' is HIDDEN.`);
            return;
        }

        // 4. Success Log
        console.log(`✅ UI Validator: Sticky Footer '${footerId}' is present and visible.`);
    });
}
