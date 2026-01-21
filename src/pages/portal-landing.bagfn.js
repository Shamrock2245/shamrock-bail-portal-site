/**
 * Shamrock Bail Bonds - Portal Landing Page (SIMPLIFIED v2.0)
 * Last Updated: 2026-01-21 (Session Token URL Fix)
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
import { getGoogleAuthUrl, getFacebookAuthUrl } from 'backend/social-auth';
import { setSessionToken, getSessionToken, clearSessionToken } from 'public/session-manager';
import wixSeo from 'wix-seo';

$w.onReady(async function () {
    console.log("🚀 Portal Landing v2.1: Session Token URL Fix");

    // 1. PRIORITY: Check for magic link token in URL (returning from email/SMS)
    if (query.token) {
        console.log("🔗 Magic link token detected, processing...");
        await handleMagicLinkLogin(query.token);
        return;
    }

    // 2. Check for session token passed via URL (redirect)
    if (query.st) {
        console.log("🔗 Session token in URL detected, storing...");
        const stored = setSessionToken(query.st);
        console.log("📦 Session stored:", stored);

        // Validate and redirect
        const session = await validateCustomSession(query.st);
        if (session && session.role) {
            console.log("✅ Session valid, redirecting to portal");
            redirectToPortal(session.role);
            return;
        }
    }

    // 3. Check for social login result
    if (query.sessionToken) {
        console.log("🔗 Social login session detected, validating...");
        await handleSocialSession(query.sessionToken, query.role);
        return;
    }

    // 4. LAST: Check if user already has a valid session in storage
    const existingSession = getSessionToken();
    if (existingSession) {
        console.log("✅ Existing session found, validating...");
        try {
            const session = await validateCustomSession(existingSession);
            if (session && session.role) {
                console.log("✅ Valid session, auto-redirecting to " + session.role + " portal");
                redirectToPortal(session.role);
                return;
            } else {
                console.log("⚠️ Session invalid/expired, clearing...");
                clearSessionToken();
            }
        } catch (err) {
            console.error("❌ Session validation crashed:", err);
            clearSessionToken(); // Safety clear
        }
    }

    // Set up the simplified login form
    setupSimplifiedLogin();

    updatePageSEO();
});

function updatePageSEO() {
    const pageTitle = "Client Portal Login | Shamrock Bail Bonds";
    const pageDesc = "Secure client portal for Shamrock Bail Bonds. Manage your bail case, check in, and view paperwork.";
    const pageUrl = "https://www.shamrockbailbonds.biz/portal-landing";

    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:url", "content": pageUrl },
        { "property": "og:type", "content": "website" },
        { "name": "robots", "content": "noindex" }
    ]);

    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "Portal Login", "item": pageUrl }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "AccountPage",
            "name": "Shamrock Bail Bonds Client Portal",
            "url": pageUrl
        }
    ]);
}

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

    // Setup Social Logins (Real Implementation)
    const googleBtn = $w('#googleLoginBtn');
    const fbBtn = $w('#facebookLoginBtn');

    if (googleBtn) {
        googleBtn.onClick(() => startSocialLogin('google'));
    }

    if (fbBtn) {
        fbBtn.onClick(() => startSocialLogin('facebook'));
    }

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

            // RESEND LOGIC (UX UPGRADE)
            // Disable button for 60 seconds to prevent spam, then change to "Resend Link"
            let countdown = 60;
            const timer = setInterval(() => {
                countdown--;
                if (button.label !== "Sent! ✓" && !button.label.startsWith("Resend")) {
                    if (button.enabled) { clearInterval(timer); return; }
                }

                button.label = "Resend in " + countdown + "s";

                if (countdown <= 0) {
                    clearInterval(timer);
                    button.label = "Resend Link";
                    button.enable();
                }
            }, 1000);

        } else {
            // Error
            console.error("❌ Magic link send failed:", result.message);
            showMessage(result.message || "Unable to send link. Please try again.", "error");
            button.enable();
            button.label = "Try Again";
        }

    } catch (error) {
        console.error("❌ CRITICAL ERROR sending magic link:", error);
        showMessage("System error. Please try again or call us at 239-332-2245.", "error");
        button.enable();
        button.label = "Try Again";
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
            console.log("✅ Token valid! Session token received");

            // Try to store session token in browser storage
            const stored = setSessionToken(result.sessionToken);
            console.log("📦 Session storage result:", stored);

            // Show success message
            const roleNames = {
                'defendant': 'Defendant',
                'indemnitor': 'Indemnitor',
                'staff': 'Staff'
            };
            const roleName = roleNames[result.role] || 'User';
            showMessage("Welcome! Redirecting to your " + roleName + " Portal...", "success");

            // Redirect with session token in URL as backup
            // The destination page will store it in browser storage
            setTimeout(() => {
                redirectToPortalWithToken(result.role, result.sessionToken);
            }, 1000);

        } else {
            console.error("❌ Token validation failed:", result.message);
            showMessage("Link expired or invalid. Please request a new one below.", "error");
            hideLoading();

            // Allow user to try again immediately
            const button = $w('#getStartedBtn');
            if (button) {
                button.label = "Resend Link";
                button.enable();
            }
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
 * Handle direct session token (from Social OAuth Redirect)
 */
async function handleSocialSession(sessionToken, role) {
    console.log("🔐 Processing social session...");
    showMessage("Finalizing login...", "info");
    showLoading();

    try {
        // Validate the session token
        const session = await validateCustomSession(sessionToken);

        if (session && session.role) {
            console.log("✅ Social Session Valid:", session.role);

            // Store in browser
            setSessionToken(sessionToken);

            showMessage("Welcome back! Redirecting...", "success");

            // Redirect based on role
            const targetRole = role || session.role || 'defendant';
            redirectToPortalWithToken(targetRole, sessionToken);
        } else {
            console.error("❌ Social Session Invalid");
            showMessage("Login expired. Please try again.", "error");
            hideLoading();
            setTimeout(() => wixLocation.to('/portal-landing'), 2000);
        }
    } catch (e) {
        console.error("Social Session Error:", e);
        showMessage("Login error. Please try again.", "error");
        hideLoading();
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
    const phonePattern = /^[\d\s\-\(\)\+\.]{10,}$/;

    return emailPattern.test(input) || phonePattern.test(input);
}

/**
 * Show status message to user
 */
function showMessage(text, type) {
    const msgElement = $w('#statusMessage');
    if (!msgElement) {
        console.warn("⚠️ #statusMessage element not found");
        return;
    }

    msgElement.text = text;

    // Set color based on type
    try {
        if (type === 'error') {
            msgElement.style.color = '#FF4444';
        } else if (type === 'success') {
            msgElement.style.color = '#00C851';
        } else {
            msgElement.style.color = '#33B5E5';
        }
    } catch (e) {
        // Style API might not be available
    }

    msgElement.show();
}

/**
 * Show loading indicator
 */
function showLoading() {
    try {
        const loadingBox = $w('#loadingBox');
        if (loadingBox) {
            loadingBox.show();
        }
    } catch (e) {
        // Loading box is optional
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    try {
        const loadingBox = $w('#loadingBox');
        if (loadingBox) {
            loadingBox.hide();
        }
    } catch (e) {
        // Loading box is optional
    }
}

/**
 * Redirect to appropriate portal based on role (without token)
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

    console.log("🚀 Redirecting to: " + destination);
    wixLocation.to(destination);
}

/**
 * Redirect to appropriate portal with session token in URL
 * This ensures the token is passed even if browser storage fails
 */
function redirectToPortalWithToken(role, sessionToken) {
    const portalMap = {
        'defendant': '/portal-defendant',
        'indemnitor': '/portal-indemnitor',
        'coindemnitor': '/portal-indemnitor',
        'staff': '/portal-staff',
        'admin': '/portal-staff'
    };

    const destination = portalMap[role] || '/portal-defendant';

    // Pass session token as URL parameter (st = session token)
    const urlWithToken = destination + "?st=" + encodeURIComponent(sessionToken);

    console.log("🚀 Redirecting to: " + urlWithToken);
    wixLocation.to(urlWithToken);
}

/**
 * Starts the Social Login Flow (Popup)
 * @param {'google' | 'facebook'} provider 
 */
async function startSocialLogin(provider) {
    console.log("🚀 Starting " + provider + " login flow...");
    showMessage("Connecting to " + provider + "...", "info");

    try {
        // 1. Get Auth URL from Backend (securely)
        let authUrl = "";
        if (provider === 'google') {
            authUrl = await getGoogleAuthUrl();
        } else {
            authUrl = await getFacebookAuthUrl();
        }

        if (!authUrl) {
            showMessage(provider + " login is not configured. Please use email/phone.", "error");
            return;
        }

        // 2. Redirect to OAuth Provider
        wixLocation.to(authUrl);

    } catch (error) {
        console.error("❌ Social login error:", error);
        showMessage("Could not connect to " + provider + ". Please try email/phone.", "error");
    }
}
