/**
 * Shamrock Bail Bonds - Portal Landing Page
 * Last Updated: 2026-01-08 (Custom Session Auth Implemented)
 * 
 * CUSTOM AUTHENTICATION SYSTEM (No Wix Members)
 * Uses custom three-role system (Defendant, Indemnitor, Staff)
 * Session tokens stored in browser storage (wix-storage-frontend)
 * 
 * Page Elements (Stable IDs):
 * - #inputAccessCode: Access code input field
 * - #btnSubmitCode: Submit button for access code
 * - #btnDefendant: Defendant Portal button
 * - #btnIndemnitor: Indemnitor Portal button
 * - #btnStaff: Staff Portal button
 * - #errorMessage: Error message text element (optional)
 */

import wixLocation from 'wix-location';
import { onMagicLinkLoginV2, validateCustomSession } from 'backend/portal-auth';
import { setSessionToken, getSessionToken, clearSessionToken } from 'public/session-manager';

$w.onReady(async function () {
    console.log("Portal Landing: Page loaded");

    // Check if user already has a valid session
    const existingSession = getSessionToken();
    if (existingSession) {
        console.log("Portal Landing: Existing session found, validating...");
        const session = await validateCustomSession(existingSession);
        if (session && session.role) {
            console.log("Portal Landing: Valid session, redirecting to portal:", session.role);
            redirectToPortal(session.role);
            return;
        } else {
            console.log("Portal Landing: Session invalid or expired, clearing...");
            clearSessionToken();
        }
    }

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
 * Set up the three portal buttons
 * These now require a valid session before allowing access
 */
function setupPortalButtons() {
    console.log("Portal Landing: Setting up portal buttons...");

    const buttons = [
        { id: '#btnDefendant', name: 'Defendant Portal', role: 'defendant' },
        { id: '#btnIndemnitor', name: 'Indemnitor Portal', role: 'indemnitor' },
        { id: '#btnStaff', name: 'Staff Portal', role: 'staff' }
    ];

    buttons.forEach(btn => {
        const element = $w(btn.id);

        if (!element) {
            console.error(`Portal Landing: Element ${btn.id} (${btn.name}) is null/undefined`);
        } else {
            console.log(`Portal Landing: Element ${btn.id} check...`);

            if (typeof element.onClick === 'function') {
                element.onClick(async () => {
                    console.log(`Portal Landing: ${btn.name} clicked`);

                    // Check if user has a valid session
                    const sessionToken = getSessionToken();
                    if (!sessionToken) {
                        showError("Please enter your access code first to log in.");
                        return;
                    }

                    // Validate session
                    const session = await validateCustomSession(sessionToken);
                    if (!session || !session.role) {
                        showError("Your session has expired. Please enter your access code again.");
                        clearSessionToken();
                        return;
                    }

                    // Check if role matches
                    if (session.role !== btn.role) {
                        showError(`You are logged in as ${session.role}. Please use the correct portal button.`);
                        return;
                    }

                    // Redirect to appropriate portal
                    console.log(`Portal Landing: Redirecting to ${btn.role} portal`);
                    redirectToPortal(btn.role);
                });
                console.log(`Portal Landing: onClick handler attached to ${btn.id}`);
            } else {
                console.error(`Portal Landing: Element ${btn.id} does NOT support .onClick()`);
            }
        }
    });
}

/**
 * Set up access code submission
 * Validates magic link tokens and creates session
 */
function setupAccessCodeSubmit() {
    console.log("Portal Landing: Setting up access code submit");

    const submitBtn = $w('#btnSubmitCode');
    const accessCodeInput = $w('#inputAccessCode');

    // Robust check: don't rely on .length which may be undefined
    const submitValid = submitBtn && typeof submitBtn.onClick === 'function';
    const inputValid = accessCodeInput && typeof accessCodeInput.value !== 'undefined'; // value prop exists

    if (!submitValid) {
        console.error("Portal Landing: #btnSubmitCode NOT FOUND or invalid (no onClick)");
    }

    if (!inputValid) {
        console.error("Portal Landing: #inputAccessCode NOT FOUND or invalid (no value prop)");
    }

    if (submitValid) {
        console.log("Portal Landing: Submit button found");
        submitBtn.onClick(async () => {
            console.log("🖱️ CLIENT CLICKED SUBMIT BUTTON - HANDLER FIRED");
            showLoading();

            // Get access code value
            const accessCode = accessCodeInput && accessCodeInput.value ? accessCodeInput.value.trim() : '';

            if (!accessCode) {
                console.warn("Portal Landing: No access code entered");
                showError("Please enter an access code");
                return;
            }

            console.log("Portal Landing: Validating access code:", accessCode);

            // Disable button during validation
            submitBtn.disable();
            submitBtn.label = "Validating...";
            hideError();

            try {
                console.log("Portal Landing: Calling handleAccessCode...");
                await handleAccessCode(accessCode);
            } catch (error) {
                console.error("Portal Landing: CRITICAL ERROR in submit handler:", error);
                showError("System error. Please try again or contact support.");
            } finally {
                // ALWAYS re-enable button if it wasn't handled inside
                if (submitBtn.label === "Validating...") {
                    submitBtn.enable();
                    submitBtn.label = "Submit";
                }
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
        // Validate token and create session via backend
        const result = await onMagicLinkLoginV2(token);

        console.log("Portal Landing: Magic link result:", result);

        if (result.ok && result.sessionToken) {
            console.log("Portal Landing: Token valid, storing session");

            // Store session token in browser
            setSessionToken(result.sessionToken);

            // Show success message briefly
            showSuccess("Login successful! Redirecting...");

            // Redirect to appropriate portal after brief delay
            setTimeout(() => {
                console.log("Portal Landing: Redirecting to:", result.goto);
                wixLocation.to(result.goto);
            }, 1000);
        } else {
            console.error("Portal Landing: Token validation failed:", result.message);
            showError(result.message || "Invalid or expired access code");

            // Remove token from URL and stay on landing page
            wixLocation.to('/portal-landing');
        }
    } catch (error) {
        console.error("Portal Landing: Error validating token:", error);
        showError("An error occurred. Please try again.");
        wixLocation.to('/portal-landing');
    }
}

/**
 * Handle access code submission
 * User manually enters access code from text/email
 */
async function handleAccessCode(accessCode) {
    console.log("Portal Landing: Validating access code");

    const submitBtn = $w('#btnSubmitCode');

    try {
        // Validate via backend (same as magic link)
        const result = await onMagicLinkLoginV2(accessCode);

        console.log("Portal Landing: Access code result:", result);

        if (result.ok && result.sessionToken) {
            console.log("Portal Landing: Access code valid, storing session");

            // Store session token in browser
            setSessionToken(result.sessionToken);

            // Update UI
            submitBtn.label = "Success!";
            showSuccess(`Welcome! Click your portal button to continue.`);

            // Clear input
            const accessCodeInput = $w('#inputAccessCode');
            if (accessCodeInput && accessCodeInput.value) {
                accessCodeInput.value = "";
            }

            // Re-enable button
            setTimeout(() => {
                submitBtn.enable();
                submitBtn.label = "Submit";
            }, 2000);

        } else {
            console.error("Portal Landing: Access code validation failed:", result.message);
            showError(result.message || "Invalid or expired access code");

            // Re-enable submit button
            submitBtn.enable();
            submitBtn.label = "Submit";
        }
    } catch (error) {
        console.error("Portal Landing: Error validating access code:", error);
        showError("An error occurred. Please try again.");

        // Button re-enabled in finally block of caller
    }
}

/**
 * Redirect to appropriate portal based on role
 */
function redirectToPortal(role) {
    const paths = {
        'defendant': '/portal-defendant',
        'indemnitor': '/portal-indemnitor',
        'coindemnitor': '/portal-indemnitor',
        'staff': '/portal-staff',
        'admin': '/portal-staff'
    };

    const path = paths[role] || '/portal-landing';
    console.log(`Portal Landing: Redirecting to ${path}`);
    wixLocation.to(path);
}

/**
 * Show error message to user
 */
function showError(message) {
    console.log("Portal Landing: Showing error:", message);

    // Try to use dedicated error message element
    try {
        const errorElement = $w('#errorMessage');
        if (errorElement) {
            errorElement.text = message;
            errorElement.show();
            return;
        }
    } catch (e) {
        console.warn("Portal Landing: #errorMessage element not found");
    }

    // Fallback: log to console
    console.error("ERROR:", message);
}

/**
 * Show success message to user
 */
function showSuccess(message) {
    console.log("Portal Landing: Showing success:", message);

    // Try to use dedicated success message element
    try {
        const successElement = $w('#successMessage');
        if (successElement) {
            successElement.text = message;
            successElement.show();
            return;
        }
    } catch (e) {
        console.warn("Portal Landing: #successMessage element not found");
    }

    // Fallback: hide error and log
    hideError();
    console.log("SUCCESS:", message);
}

/**
 * Hide error message
 */
function hideError() {
    try {
        const errorElement = $w('#errorMessage');
        if (errorElement) {
            errorElement.hide();
        }
    } catch (e) {
        // Element doesn't exist, that's fine
    }
}

/**
 * Show loading state on submit button
 */
function showLoading() {
    try {
        const submitBtn = $w('#btnSubmitCode');
        if (submitBtn && typeof submitBtn.disable === 'function') {
            submitBtn.disable();
            submitBtn.label = 'Processing...';
        }
    } catch (e) {
        console.warn('Portal Landing: Could not show loading state:', e);
    }
}

/**
 * Hide loading state on submit button
 */
function hideLoading() {
    try {
        const submitBtn = $w('#btnSubmitCode');
        if (submitBtn && typeof submitBtn.enable === 'function') {
            submitBtn.enable();
            submitBtn.label = 'Submit';
        }
    } catch (e) {
        console.warn('Portal Landing: Could not hide loading state:', e);
    }
}

// Export for testing
export { handleMagicLinkToken, handleAccessCode };

/**
 * Show loading state on submit button
 */
function showLoading() {
    const submitBtn = $w('#btnSubmitCode');
    if (submitBtn) {
        submitBtn.disable();
        submitBtn.label = "Processing...";
    }
}

/**
 * Hide loading state on submit button
 */
function hideLoading() {
    const submitBtn = $w('#btnSubmitCode');
    if (submitBtn) {
        submitBtn.enable();
        submitBtn.label = "Submit";
    }
}
