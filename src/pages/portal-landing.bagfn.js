/**
 * Shamrock Bail Bonds - Portal Landing Page (SIMPLIFIED v2.0)
 * Last Updated: 2026-01-14 (Fortune 50 Grade UX)
 * 
 * SIMPLIFIED AUTHENTICATION FLOW:
 * 1. User enters email/phone → Click "Get Started"
 * 2. System auto-detects if new or returning user
 * 3. Sends magic link with role embedded
 * 4. One-click login directly to correct portal
 * 
 * NO MORE:
 * - Access code manual entry
 * - Role button selection
 * - Multiple confusing steps
 * 
 * Page Elements (Must exist in Wix Editor):
 * - #emailPhoneInput: Text input for email or phone
 * - #getStartedBtn: Primary CTA button
 * - #statusMessage: Text element for success/error messages
 * - #loadingBox: Container for loading state (optional)
 */

import wixLocation from 'wix-location';
import { sendMagicLinkSimplified, onMagicLinkLoginV2, validateCustomSession } from 'backend/portal-auth';
import { setSessionToken, getSessionToken, clearSessionToken } from 'public/session-manager';

$w.onReady(async function () {
    console.log("🚀 Portal Landing v2.0: Simplified Fortune 50 Grade UX");

    // Check if user already has a valid session
    const existingSession = getSessionToken();
    if (existingSession) {
        console.log("✅ Existing session found, validating...");
        const session = await validateCustomSession(existingSession);
        if (session && session.role) {
            console.log(`✅ Valid session, auto-redirecting to ${session.role} portal`);
            redirectToPortal(session.role);
            return;
        } else {
            console.log("⚠️ Session invalid/expired, clearing...");
            clearSessionToken();
        }
    }

    // Check for magic link token in URL (returning from email/SMS)
    const query = wixLocation.query;
    if (query.token) {
        console.log("🔗 Magic link token detected, processing...");
        await handleMagicLinkLogin(query.token);
        return;
    }

    // Set up the simplified login form
    setupSimplifiedLogin();
});

/**
 * Setup the simplified login form
 * Single input + single button = Fortune 50 simplicity
 */
function setupSimplifiedLogin() {
    console.log("🎨 Setting up simplified login UI...");

    const input = $w('#emailPhoneInput');
    const button = $w('#getStartedBtn');

    // Validate elements exist
    if (!input) {
        console.error("❌ CRITICAL: #emailPhoneInput not found in Wix Editor!");
        showMessage("Configuration error. Please contact support.", "error");
        return;
    }
    if (!button) {
        console.error("❌ CRITICAL: #getStartedBtn not found in Wix Editor!");
        showMessage("Configuration error. Please contact support.", "error");
        return;
    }

    console.log("✅ UI elements found, attaching handlers");

    // Auto-focus on input for better UX
    try {
        input.focus();
    } catch (e) {
        console.warn("⚠️ Could not auto-focus input:", e);
    }

    // Allow Enter key to submit
    input.onKeyPress((event) => {
        if (event.key === 'Enter') {
            console.log("⌨️ Enter key pressed, triggering submit");
            handleGetStarted();
        }
    });

    // Handle button click
    button.onClick(async () => {
        console.log("🖱️ Get Started button clicked");
        await handleGetStarted();
    });

    console.log("✅ Simplified login ready!");
}

/**
 * Handle "Get Started" button click
 * Validates input and sends magic link
 */
async function handleGetStarted() {
    const input = $w('#emailPhoneInput');
    const button = $w('#getStartedBtn');

    // Get and validate input
    const emailOrPhone = input.value ? input.value.trim() : '';

    if (!emailOrPhone) {
        showMessage("Please enter your email or phone number", "error");
        input.focus();
        return;
    }

    // Basic validation
    if (!isValidEmailOrPhone(emailOrPhone)) {
        showMessage("Please enter a valid email or phone number", "error");
        input.focus();
        return;
    }

    console.log("📧 Sending magic link to:", emailOrPhone);

    // Show loading state
    button.disable();
    const originalLabel = button.label;
    button.label = "Sending...";
    showMessage("Sending your secure link...", "info");

    try {
        // Call backend to send magic link
        const result = await sendMagicLinkSimplified(emailOrPhone);

        console.log("📬 Magic link result:", result);

        if (result.success) {
            // Success! Show instructions
            button.label = "Sent! ✓";
            showMessage(
                result.isNewUser 
                    ? "Welcome! Check your email or phone for your secure link."
                    : "Check your email or phone for your secure link.",
                "success"
            );

            // Clear input
            input.value = "";

            // Reset button after delay
            setTimeout(() => {
                button.enable();
                button.label = originalLabel;
            }, 3000);

        } else {
            // Error
            console.error("❌ Magic link send failed:", result.message);
            showMessage(result.message || "Unable to send link. Please try again.", "error");
            button.enable();
            button.label = originalLabel;
        }

    } catch (error) {
        console.error("❌ CRITICAL ERROR sending magic link:", error);
        showMessage("System error. Please try again or call us at 239-332-2245.", "error");
        button.enable();
        button.label = originalLabel;
    }
}

/**
 * Handle magic link login from URL
 * Called when user clicks link from email/SMS
 */
async function handleMagicLinkLogin(token) {
    console.log("🔐 Processing magic link token...");

    showMessage("Logging you in...", "info");
    showLoading();

    try {
        // Validate token via existing backend function
        const result = await onMagicLinkLoginV2(token);

        console.log("🔑 Token validation result:", result);

        if (result.ok && result.sessionToken) {
            console.log("✅ Token valid! Creating session...");

            // Store session token
            setSessionToken(result.sessionToken);

            // Verify storage
            const verifyToken = getSessionToken();
            if (!verifyToken) {
                console.error("❌ CRITICAL: Token failed to save");
                showMessage("Browser storage error. Please enable cookies and try again.", "error");
                hideLoading();
                return;
            }

            console.log(`✅ Session created for ${result.role}`);

            // Show success
            const roleNames = {
                'defendant': 'Defendant',
                'indemnitor': 'Indemnitor',
                'staff': 'Staff'
            };
            const roleName = roleNames[result.role] || 'User';
            showMessage(`Welcome! Redirecting to your ${roleName} Portal...`, "success");

            // Redirect to correct portal based on role
            setTimeout(() => {
                redirectToPortal(result.role);
            }, 1500);

        } else {
            console.error("❌ Token validation failed:", result.message);
            showMessage(result.message || "Invalid or expired link. Please request a new one.", "error");
            hideLoading();

            // Remove token from URL and stay on landing page
            setTimeout(() => {
                wixLocation.to('/portal-landing');
            }, 2000);
        }

    } catch (error) {
        console.error("❌ CRITICAL ERROR validating token:", error);
        showMessage("System error. Please try again or call us at 239-332-2245.", "error");
        hideLoading();

        setTimeout(() => {
            wixLocation.to('/portal-landing');
        }, 2000);
    }
}

/**
 * Validate email or phone number format
 * Simple validation - backend will do thorough check
 */
function isValidEmailOrPhone(input) {
    // Email pattern (basic)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Phone pattern (flexible - allows various formats)
    // Matches: 2393322245, 239-332-2245, (239) 332-2245, +1-239-332-2245, etc.
    const phonePattern = /^[\d\s\-\(\)\+\.]{10,}$/;

    return emailPattern.test(input) || phonePattern.test(input);
}

/**
 * Show status message to user
 * Fortune 50 grade messaging
 */
function showMessage(text, type = "info") {
    const messageEl = $w('#statusMessage');
    
    if (!messageEl) {
        console.warn("⚠️ #statusMessage element not found");
        return;
    }

    messageEl.text = text;
    messageEl.show();

    // Style based on type (professional colors)
    try {
        if (type === "error") {
            messageEl.style.color = "#D32F2F"; // Material Red 700
        } else if (type === "success") {
            messageEl.style.color = "#388E3C"; // Material Green 700
        } else {
            messageEl.style.color = "#1976D2"; // Material Blue 700
        }
    } catch (e) {
        console.warn("⚠️ Could not style message:", e);
    }

    console.log(`💬 Message shown (${type}): ${text}`);
}

/**
 * Hide status message
 */
function hideMessage() {
    const messageEl = $w('#statusMessage');
    if (messageEl) {
        try {
            messageEl.hide();
        } catch (e) {
            console.warn("⚠️ Could not hide message:", e);
        }
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    const loadingEl = $w('#loadingBox');
    if (loadingEl) {
        try {
            loadingEl.show();
        } catch (e) {
            console.warn("⚠️ Could not show loading:", e);
        }
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    const loadingEl = $w('#loadingBox');
    if (loadingEl) {
        try {
            loadingEl.hide();
        } catch (e) {
            console.warn("⚠️ Could not hide loading:", e);
        }
    }
}

/**
 * Redirect to appropriate portal based on role
 */
function redirectToPortal(role) {
    const portalMap = {
        'defendant': '/portal-defendant',
        'indemnitor': '/portal-indemnitor',
        'coindemnitor': '/portal-indemnitor',
        'staff': '/portal-staff',
        'admin': '/portal-staff'
    };

    const destination = portalMap[role] || '/portal-defendant';
    
    console.log(`🚀 Redirecting to: ${destination}`);
    wixLocation.to(destination);
}
