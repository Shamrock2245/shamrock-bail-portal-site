/**
 * Shamrock Bail Bonds - Portal Landing Page
 * Last Verified: 2026-01-07 (Stable IDs Applied)
 * 
 * SIMPLIFIED VERSION: Direct redirects without Wix Members authentication
 * Uses custom three-role system (Defendant, Indemnitor, Staff)
 * 
 * Page Elements (Stable IDs):
 * - #inputAccessCode: Access code input field
 * - #btnSubmitCode: Submit button for access code
 * - #btnDefendant: Defendant Portal button
 * - #btnIndemnitor: Indemnitor Portal button
 * - #btnStaff: Staff Portal button
 */

import wixLocation from 'wix-location';
import { onMagicLinkLogin } from 'backend/portal-auth';

$w.onReady(async function () {
    console.log("Portal Landing: Page loaded");

    // Check for magic link token in URL
    const query = wixLocation.query;
    if (query.token) {
        console.log("Portal Landing: Token detected in URL:", query.token);
        await handleMagicLinkToken(query.token);
        return;
    }

    // Set up button click handlers
    setupPortalButtons();
    setupAccessCodeSubmit();
});

/**
 * Set up the three portal buttons for direct navigation
 * NO Wix Members authentication - just direct redirects
 */
function setupPortalButtons() {
    console.log("Portal Landing: Setting up portal buttons...");

    const buttons = [
        { id: '#btnDefendant', name: 'Defendant Portal', url: '/portal-defendant' },
        { id: '#btnIndemnitor', name: 'Indemnitor Portal', url: '/portal-indemnitor' },
        { id: '#btnStaff', name: 'Staff Portal', url: '/portal-staff' }
    ];

    buttons.forEach(btn => {
        const element = $w(btn.id);

        // Diagnostic Logging
        if (element.length === 0) {
            console.error(`Portal Landing: Element ${btn.id} (${btn.name}) NOT FOUND. Please rename element in Editor to ${btn.id}`);
        } else {
            console.log(`Portal Landing: Element ${btn.id} found. Type: ${element.type}`);

            if (typeof element.onClick === 'function') {
                element.onClick(() => {
                    console.log(`Portal Landing: ${btn.name} clicked. Redirecting to ${btn.url}`);
                    wixLocation.to(btn.url);
                });
                console.log(`Portal Landing: onClick handler attached to ${btn.id}`);
            } else {
                console.error(`Portal Landing: Element ${btn.id} exists but does NOT support .onClick(). It might be a purely visual element.`);
            }
        }
    });
}

/**
 * Set up access code submission
 * Validates magic link tokens from MagicLinks collection
 */
function setupAccessCodeSubmit() {
    console.log("Portal Landing: Setting up access code submit");

    const submitBtn = $w('#btnSubmitCode');
    const accessCodeInput = $w('#inputAccessCode');

    if (submitBtn.length === 0) {
        console.error("Portal Landing: #btnSubmitCode NOT FOUND. Please rename Submit button.");
    }

    if (accessCodeInput.length === 0) {
        console.error("Portal Landing: #inputAccessCode NOT FOUND. Please rename Input field.");
    }

    if (submitBtn.length > 0 && typeof submitBtn.onClick === 'function') {
        console.log("Portal Landing: Submit button found");
        submitBtn.onClick(async () => {
            console.log("Portal Landing: Submit button clicked");

            // Get access code value
            const accessCode = accessCodeInput && accessCodeInput.value ? accessCodeInput.value.trim() : '';

            if (!accessCode) {
                console.warn("Portal Landing: No access code entered");
                // Using wix-window alert if available, or just console warn + valid UI feedback ideally
                console.log("Alert: Please enter an access code");
                return;
            }

            console.log("Portal Landing: Validating access code:", accessCode);

            // Disable button during validation
            submitBtn.disable();
            submitBtn.label = "Validating...";

            try {
                await handleAccessCode(accessCode);
            } catch (error) {
                console.error("Portal Landing: Error handling access code:", error);
                submitBtn.enable();
                submitBtn.label = "Submit";
            }
        });
    }
}

/**
 * Handle magic link token from URL
 * Called when user clicks magic link: portal-landing?token=ABC123
 */
async function handleMagicLinkToken(token) {
    console.log("Portal Landing: Handling magic link token");

    try {
        // Validate token via backend
        const result = await onMagicLinkLogin(token);

        console.log("Portal Landing: Magic link result:", result);

        if (result.ok) {
            console.log("Portal Landing: Token valid, redirecting to:", result.goto);

            // Redirect to appropriate portal
            wixLocation.to(result.goto);
        } else {
            console.error("Portal Landing: Token validation failed:", result.message);
            // Remove token from URL and stay on landing page
            wixLocation.to('/portal-landing');
        }
    } catch (error) {
        console.error("Portal Landing: Error validating token:", error);
        wixLocation.to('/portal-landing');
    }
}

/**
 * Handle access code submission
 * User manually enters access code from text/email
 */
async function handleAccessCode(accessCode) {
    console.log("Portal Landing: Validating access code");

    try {
        // Validate via backend (same as magic link)
        const result = await onMagicLinkLogin(accessCode);

        console.log("Portal Landing: Access code result:", result);

        if (result.ok) {
            console.log("Portal Landing: Access code valid, redirecting to:", result.goto);

            // Redirect to appropriate portal
            wixLocation.to(result.goto);
        } else {
            console.error("Portal Landing: Access code validation failed:", result.message);

            // Re-enable submit button
            const submitBtn = $w('#btnSubmitCode');
            if (submitBtn.length > 0) {
                submitBtn.enable();
                submitBtn.label = "Submit";
            }
        }
    } catch (error) {
        console.error("Portal Landing: Error validating access code:", error);

        // Re-enable submit button
        const submitBtn = $w('#btnSubmitCode');
        if (submitBtn.length > 0) {
            submitBtn.enable();
            submitBtn.label = "Submit";
        }
    }
}

// Export for testing
export { handleMagicLinkToken, handleAccessCode };
