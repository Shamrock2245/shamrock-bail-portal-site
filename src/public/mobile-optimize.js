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
        optimizeInputs();
        // Add other optimizations here
    }
}

/**
 * OPTIMIZATION: Prevent iOS Zoom on Focus
 * iOS zooms in if text inputs are < 16px.
 * We can't easily change CSS directly in Velo, but we can potentially strictly type or hint.
 * NOTE: Real fix for this is usually in Site Theme > Typography, setting Body Text to 16px+.
 * 
 * However, we can log a warning if we detect small fonts? 
 * Actually, we can't read computed styles easily in Velo.
 * 
 * Instead, let's use this to set attributes that help mobile.
 */
function optimizeInputs() {
    // Velo doesn't allow direct CSS manipulation of inner elements.
    // Best we can do here is specific attribute hints if supported.
    // For now, this is a placeholder for any logical mobile tweaks.

    // Example: ensuring specific inputs have correct keyboard types if not set?
    // $w('TextInput').inputType = 'tel'; // (If we could select all, but we can't generic select)

    console.log("📱 Mobile Optimizations Initialized");
}
