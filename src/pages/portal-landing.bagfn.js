/**
 * Shamrock Bail Bonds - Portal Landing Page (v3.0 - WhatsApp OTP)
 * Last Updated: 2026-02-17 (WhatsApp OTP Integration)
 * 
 * DUAL AUTHENTICATION FLOW:
 * 
 * A. EMAIL MAGIC LINK (Existing):
 * 1. User enters email → Click "Get Started"
 * 2. Receives magic link via email
 * 3. One-click login to portal
 * 
 * B. WHATSAPP OTP (New):
 * 1. User enters WhatsApp number → Click "Get Started"
 * 2. Receives OTP code via WhatsApp
 * 3. Enters OTP code → Logs in to portal
 * 
 * Page Elements (Must exist in Wix Editor):
 * - #emailPhoneInput: Text input for email or WhatsApp number
 * - #getStartedBtn: Primary CTA button
 * - #whatsappLoginBtn: WhatsApp login button (optional)
 * - #otpInputBox: Container for OTP input (hidden by default)
 * - #otpInput: Text input for OTP code
 * - #verifyOtpBtn: Button to verify OTP
 * - #statusMessage: Text element for success/error messages
 * - #loadingBox: Container for loading state (optional)
 */

import wixLocation from 'wix-location';
import { sendMagicLinkSimplified, onMagicLinkLoginV2, validateCustomSession, onTelegramLogin } from 'backend/portal-auth';
import { getGoogleAuthUrl, getFacebookAuthUrl } from 'backend/social-auth';
import { setSessionToken, getSessionToken, clearSessionToken } from 'public/session-manager';
import { initAIChat } from 'public/ai-concierge';
import wixSeo from 'wix-seo';
import wixWindow from 'wix-window';
import { authentication } from 'wix-members-frontend'; // For persistent sessions

// State object to hold temporary validation data
const state = {
    phoneNumberForOtp: null
};

$w.onReady(async function () {
    console.log("🚀 Portal Landing v4.0: Telegram Login Widget Integration");
    const query = wixLocation.query;

    // 1. PRIORITY: Check for magic link token in URL (returning from email/SMS)
    // ONLY run on client-side to prevent SSR from consuming the token
    if (query.token && wixWindow.rendering.env === 'browser') {
        console.log("🔗 Magic link token detected, processing...");
        await handleMagicLinkLogin(query.token);
        return;
    }

    // 2. Unified Token Handling (Social Login & Redirects)
    // Accept 'st' (preferred) or 'sessionToken' (legacy/social)
    const token = query.st || query.sessionToken;

    if (token) {
        console.log("🔗 Token detected in URL:", { token: token.substring(0, 10) + "..." });

        // Save immediately
        setSessionToken(token);

        try {
            console.log("🔍 Validating session...");
            const session = await validateCustomSession(token);

            console.log("📄 Validation Result:", session);

            if (session && session.role) {
                console.log(`✅ Session Validified. Role: ${session.role}. Redirecting...`);
                redirectToPortal(session.role);
                return;
            } else {
                throw new Error("Session invalid or role missing");
            }

        } catch (err) {
            console.error("❌ Login Failed during validation:", err);

            // Clear bad state
            clearSessionToken();

            // Show user visual feedback
            showMessage("Login session expired. Please try again.", "error");

            // Strip bad params from URL without reload (if possible) or just stop
            // We don't want to infinite loop, so we stop here.
            // wixLocation.to("/portal-landing"); // Optional: clean URL
        }
    }

    // Set up the simplified login form
    setupSimplifiedLogin();

    // Initialize AI Concierge (Safely)
    if ($w('#boxAIChat').valid && $w('#repChatMessages').valid) {
        initAIChat({
            chatBox: $w('#boxAIChat'),
            repeater: $w('#repChatMessages'),
            inputMap: {
                input: $w('#inputAIMessage'),
                sendBtn: $w('#btnAISend'),
                minimizeBtn: $w('#btnAIMinimize'),
                openBtn: $w('#btnAIOpen')
            }
        });
        console.log("🤖 AI Concierge Initialized");
    } else {
        console.log("🤖 AI Concierge elements not found (Editor setup required)");
    }

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
            "url": pageUrl,
            "mainEntity": {
                "@type": "LocalBusiness",
                "name": "Shamrock Bail Bonds, LLC",
                "telephone": "+12393322245",
                "image": "https://www.shamrockbailbonds.biz/logo.png"
            }
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

    // Hide OTP input box by default (not needed with Telegram widget, but keeping reference to collapse it)
    if ($w('#otpInputBox')) {
        $w('#otpInputBox').hide();
        $w('#otpInputBox').collapse();
    }

    // Setup Telegram Widget
    setupTelegramWidget();

    // Setup Social Logins (Real Implementation)
    const googleBtn = $w('#googleLoginBtn');
    const fbBtn = $w('#facebookLoginBtn');

    if (googleBtn) {
        googleBtn.onClick(() => startSocialLogin('google'));
    }

    if (fbBtn) {
        // fbBtn.onClick(() => startSocialLogin('facebook'));
        fbBtn.collapse(); // User requested removal from frontend
    }

    console.log("✅ Simplified login ready!");
}

/**
 * Handle "Get Started" button click (v3.0)
 * Validates input and routes to appropriate auth flow:
 * - Email/Phone: Magic link
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

    // Route to email/sms magic link flow
    console.log("📧 Sending magic link");
    await handleEmailMagicLinkFlow(emailOrPhone);
}

/**
 * Handle Email/SMS Magic Link Flow
 */
async function handleEmailMagicLinkFlow(emailOrPhone) {
    const button = $w('#getStartedBtn');

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
            $w('#emailPhoneInput').value = "";

            // RESEND LOGIC (UX UPGRADE)
            // Disable button for 60 seconds to prevent spam, then change to "Resend Link"
            let countdown = 60;
            const timer = setInterval(() => {
                countdown--;
                // Stop timer if state changed unexpectedly
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
        button.label = originalLabel;
    }
}

/**
 * Setup Telegram Login Widget listener
 * Called from onReady to listen for messages from the HTML component
 */
function setupTelegramWidget() {
    const telegramHtml = $w('#telegramHtml');
    if (!telegramHtml) {
        console.log("No Telegram HTML component found on page.");
        return;
    }

    console.log("📱 Hooking up Telegram Login Widget listener");
    telegramHtml.onMessage(async (event) => {
        try {
            console.log("📩 Received message from Telegram HTML component:", event.data);
            const telegramData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

            if (telegramData && telegramData.hash) {
                showMessage("Verifying Telegram Login...", "info");
                showLoading();

                // Call backend using imported function directly
                const result = await onTelegramLogin(telegramData);

                if (result.ok && result.sessionToken) {
                    // Success! Save session and redirect
                    setSessionToken(result.sessionToken);
                    showMessage("Login successful! Redirecting...", "success");

                    setTimeout(() => {
                        redirectToPortal(result.role || 'indemnitor');
                    }, 1000);
                } else {
                    console.error("❌ Telegram validation failed:", result.message);
                    showMessage(result.message || "Invalid Telegram login. Please try again.", "error");
                    hideLoading();
                }
            }
        } catch (error) {
            console.error("❌ Error processing Telegram login event:", error);
            showMessage("Error verifying Telegram login. Please try again.", "error");
            hideLoading();
        }
    });
}

/**
 * Handle magic link login from URL
 * Called when user clicks link from email/SMS
 * Uses custom session tokens only (no Wix member sessions)
 * Defaults all users to indemnitor role (defendants use case lookup)
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

            // Store custom session token in browser
            const stored = setSessionToken(result.sessionToken);
            console.log("📦 Custom session stored:", stored);

            // ✅ SIMPLIFIED: Default everyone to indemnitor
            // Defendants can use case lookup at top of portal
            const targetRole = 'indemnitor';
            console.log("✅ Defaulting to indemnitor role (defendants use case lookup)");

            showMessage("Welcome! Redirecting to your portal...", "success");

            // Small delay to show success message
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Redirect to indemnitor portal
            redirectToPortalWithToken(targetRole, result.sessionToken);

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

        // Clear any partial session
        clearSessionToken();

        setTimeout(() => {
            wixLocation.to('/portal-landing');
        }, 2000);
    }
}

// handleSocialSession removed - unified logic in onReady

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

    const destination = portalMap[role] || '/portal-indemnitor';

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

    const destination = portalMap[role] || '/portal-indemnitor';

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
