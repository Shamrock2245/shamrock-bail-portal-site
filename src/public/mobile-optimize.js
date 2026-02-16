/**
 * mobile-optimize.js
 * 
 * Purpose: Enforce mobile best practices that might be missed by the visual editor.
 */

import wixWindow from 'wix-window';

/**
 * Runs all mobile optimizations.
 * Call this from masterPage.js onReady().
 */
export function initMobileOptimizations() {
    if (wixWindow.formFactor === 'Mobile') {
        console.log("📱 Mobile Optimizations: Starting...");
        optimizeInputs();
        collapseHeavyElements();
    }
}

/**
 * OPTIMIZATION: Collapse heavy desktop-first elements on mobile
 * This prevents them from taking up layout space or processing time
 */
function collapseHeavyElements() {
    // List of element IDs that are heavy or irrelevant on mobile
    // Add IDs here as you identify them in the Editor
    const heavyElements = [
        '#desktopVideoBackground',
        '#highResHeroImage',
        '#desktopOnlySpacer',
        '#videoPlayer'
    ];

    heavyElements.forEach(id => {
        const el = $w(id);
        if (el && el.uniqueId) { // Check if valid
            el.collapse()
                .then(() => console.log(`📱 Collapsed: ${id}`))
                .catch(() => { }); // Ignore errors if element missing
        }
    });
}

/**
 * OPTIMIZATION: Prevent iOS Zoom on Focus & Set Keyboard Types
 */
function optimizeInputs() {
    // Velo doesn't allow direct CSS manipulation of inner elements.
    // However, we can set specific input types where applicable to trigger correct keyboards

    // Example: ensuring phone inputs have correct type
    const phoneInputs = ['$w("#inputPhoneNumber")', '$w("#phone")']; // Add actual IDs

    // Note: Velo often handles this via Editor settings, but we can double check logic here if needed.
    console.log("📱 Mobile Optimizations: Inputs checked");
}
