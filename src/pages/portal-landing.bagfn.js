/**
 * Shamrock Bail Bonds - Portal Landing Page
 * 
 * SIMPLIFIED VERSION: Direct redirects without Wix Members authentication
 * Uses custom three-role system (Defendant, Indemnitor, Staff)
 * 
 * This page provides access to three different portals:
 * - Defendant Portal: /portal-defendant
 * - Indemnitor Portal: /portal-indemnitor
 * - Staff Portal: /portal-staff
 * 
 * Page Elements (Wix Editor IDs):
 * - #comp-mjrvbswh: Access code input field (textarea)
 * - #comp-mjrvd6m8: Submit button for access code
 * - #comp-mjrynime: Defendant Portal button
 * - #comp-mjrynk22: Indemnitor Portal button
 * - #comp-mjryn7jm: Staff Portal button
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
    console.log("Portal Landing: Setting up portal buttons");
    
    // Defendant Portal Button
    const defendantBtn = $w('#comp-mjrynime');
    if (defendantBtn && typeof defendantBtn.onClick === 'function') {
        console.log("Portal Landing: Defendant button found");
        defendantBtn.onClick(() => {
            console.log("Portal Landing: Defendant button clicked - redirecting to /portal-defendant");
            wixLocation.to('/portal-defendant');
        });
    } else {
        console.warn("Portal Landing: Defendant button (#comp-mjrynime) not found or invalid");
    }
    
    // Indemnitor Portal Button
    const indemnitorBtn = $w('#comp-mjrynk22');
    if (indemnitorBtn && typeof indemnitorBtn.onClick === 'function') {
        console.log("Portal Landing: Indemnitor button found");
        indemnitorBtn.onClick(() => {
            console.log("Portal Landing: Indemnitor button clicked - redirecting to /portal-indemnitor");
            wixLocation.to('/portal-indemnitor');
        });
    } else {
        console.warn("Portal Landing: Indemnitor button (#comp-mjrynk22) not found or invalid");
    }
    
    // Staff Portal Button
    const staffBtn = $w('#comp-mjryn7jm');
    if (staffBtn && typeof staffBtn.onClick === 'function') {
        console.log("Portal Landing: Staff button found");
        staffBtn.onClick(() => {
            console.log("Portal Landing: Staff button clicked - redirecting to /portal-staff");
            wixLocation.to('/portal-staff');
        });
    } else {
        console.warn("Portal Landing: Staff button (#comp-mjryn7jm) not found or invalid");
    }
}

/**
 * Set up access code submission
 * Validates magic link tokens from MagicLinks collection
 */
function setupAccessCodeSubmit() {
    console.log("Portal Landing: Setting up access code submit");
    
    const submitBtn = $w('#comp-mjrvd6m8');
    const accessCodeInput = $w('#textarea_comp-mjrvbswh');
    
    if (submitBtn && typeof submitBtn.onClick === 'function') {
        console.log("Portal Landing: Submit button found");
        submitBtn.onClick(async () => {
            console.log("Portal Landing: Submit button clicked");
            
            // Get access code value
            const accessCode = accessCodeInput && accessCodeInput.value ? accessCodeInput.value.trim() : '';
            
            if (!accessCode) {
                console.warn("Portal Landing: No access code entered");
                alert("Please enter an access code");
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
                alert("An error occurred. Please try again.");
                submitBtn.enable();
                submitBtn.label = "Submit";
            }
        });
    } else {
        console.warn("Portal Landing: Submit button (#comp-mjrvd6m8) not found or invalid");
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
            alert(result.message || "Invalid or expired access link. Please contact support.");
            
            // Remove token from URL and stay on landing page
            wixLocation.to('/portal-landing');
        }
    } catch (error) {
        console.error("Portal Landing: Error validating token:", error);
        alert("Unable to verify access link. Please try again or contact support.");
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
            alert(result.message || "Invalid or expired access code. Please contact support.");
            
            // Re-enable submit button
            const submitBtn = $w('#comp-mjrvd6m8');
            if (submitBtn) {
                submitBtn.enable();
                submitBtn.label = "Submit";
            }
        }
    } catch (error) {
        console.error("Portal Landing: Error validating access code:", error);
        alert("Unable to validate access code. Please try again.");
        
        // Re-enable submit button
        const submitBtn = $w('#comp-mjrvd6m8');
        if (submitBtn) {
            submitBtn.enable();
            submitBtn.label = "Submit";
        }
    }
}

// Export for testing (optional)
export { handleMagicLinkToken, handleAccessCode };
