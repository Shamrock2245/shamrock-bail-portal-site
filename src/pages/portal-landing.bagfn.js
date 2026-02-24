/**
 * Shamrock Bail Bonds - Portal Landing Page
 * File: portal-landing.bagfn.js
 * Last Updated: 2026-02-23
 *
 * AUTHENTICATION FLOW:
 *
 * A. MAGIC LINK (Primary — email or SMS):
 *    1. User enters email or phone → "Get Started"
 *    2. Backend sends magic link to /portal-landing?token=...
 *    3. This page intercepts the token, validates it, creates a session,
 *       then redirects to /portal-indemnitor?st=<sessionToken>
 *    NOTE: Magic links MUST land here (portal-landing), NOT on portal-indemnitor.
 *          portal-indemnitor is a Members-Area-protected page and will 404 for
 *          unauthenticated cold arrivals.
 *
 * B. SESSION TOKEN REDIRECT (Social/OAuth callbacks):
 *    URL: /portal-landing?st=<sessionToken>
 *    Validates session, redirects to role-appropriate portal.
 *
 * C. FRESH LOGIN (No token):
 *    Shows the email/phone input form.
 *
 * Required Wix Editor Elements:
 *   #emailPhoneInput  — textarea/input for email or phone
 *   #getStartedBtn    — primary CTA button
 *   #statusMessage    — text element for feedback
 *   #loadingBox       — optional loading container
 *   #otpInputBox      — optional OTP container (hidden by default)
 *   #googleLoginBtn   — optional Google login button
 *   #telegramHtml     — optional Telegram widget HTML component
 *   #boxAIChat        — optional AI concierge container
 */

import wixLocation from 'wix-location';
import {
    sendMagicLinkSimplified,
    onMagicLinkLoginV2,
    validateCustomSession,
    onTelegramLogin
} from 'backend/portal-auth';
import { getGoogleAuthUrl } from 'backend/social-auth';
import { setSessionToken, getSessionToken, clearSessionToken } from 'public/session-manager';
import { initAIChat } from 'public/ai-concierge';
import wixSeo from 'wix-seo';
import wixWindow from 'wix-window';

// ─────────────────────────────────────────────────────────────────────────────
// PAGE INIT
// ─────────────────────────────────────────────────────────────────────────────

$w.onReady(async function () {
    console.log("🚀 Portal Landing: Initializing...");

    updatePageSEO();

    const query = wixLocation.query;

    // ── Priority 1: Magic link token in URL (?token=...) ─────────────────────
    // This is the primary entry point when a user clicks the link in their email.
    // MUST be handled BEFORE anything else, and ONLY in the browser (not SSR).
    if (query.token && wixWindow.rendering.env === 'browser') {
        console.log("🔗 Magic link token detected in URL — processing...");
        showMessage("Logging you in securely...", "info");
        showLoading();
        await handleMagicLinkToken(query.token);
        return; // Stop — redirect will happen inside handleMagicLinkToken
    }

    // ── Priority 2: Session token in URL (?st=... or ?sessionToken=...) ──────
    // Used by OAuth callbacks and legacy redirects.
    const sessionToken = query.st || query.sessionToken;
    if (sessionToken && wixWindow.rendering.env === 'browser') {
        console.log("🔗 Session token detected in URL — validating...");
        showMessage("Verifying your session...", "info");
        showLoading();
        await handleSessionTokenRedirect(sessionToken);
        return;
    }

    // ── Priority 3: Existing valid session in browser storage ────────────────
    // If the user already has a session, skip the login form entirely.
    const existingToken = getSessionToken();
    if (existingToken && wixWindow.rendering.env === 'browser') {
        console.log("🔍 Existing session found — validating...");
        try {
            const session = await validateCustomSession(existingToken);
            if (session && session.valid && session.role) {
                console.log(`✅ Existing session valid (${session.role}). Redirecting...`);
                showMessage("Welcome back! Redirecting...", "success");
                redirectToPortal(session.role);
                return;
            }
        } catch (e) {
            // Session invalid or expired — fall through to login form
            console.warn("⚠️ Existing session invalid, showing login form:", e.message);
        }
        clearSessionToken();
    }

    // ── Default: Show the login form ─────────────────────────────────────────
    setupLoginForm();
    setupTelegramWidget();
    setupAIConcierge();
});

// ─────────────────────────────────────────────────────────────────────────────
// MAGIC LINK TOKEN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a magic link token from the URL and redirect to the indemnitor portal.
 * This is the ONLY correct entry point for magic link clicks.
 *
 * @param {string} token - The raw token from ?token=...
 */
async function handleMagicLinkToken(token) {
    try {
        const result = await onMagicLinkLoginV2(token);

        if (result.ok && result.sessionToken) {
            console.log("✅ Magic link valid — session created");

            // Store session in browser storage
            setSessionToken(result.sessionToken);

            // Determine target role — default everyone to indemnitor.
            // Defendants can identify themselves via the case-lookup widget
            // at the top of the indemnitor portal.
            const role = result.role || 'indemnitor';
            const targetRole = (role === 'staff' || role === 'admin') ? role : 'indemnitor';

            showMessage("Welcome! Taking you to your portal...", "success");

            // Redirect with session token in URL as belt-and-suspenders
            // (in case browser storage write hasn't flushed yet)
            redirectToPortalWithToken(targetRole, result.sessionToken);

        } else {
            // Token invalid or expired
            const reason = result.message || 'Link expired or already used.';
            console.warn("⚠️ Magic link rejected:", reason);

            hideLoading();
            showMessage(
                "This link has expired or was already used. Enter your email below to get a new one.",
                "error"
            );

            // Show the login form so they can request a new link immediately
            setupLoginForm();
            setupTelegramWidget();

            // Pre-fill the button label to "Resend Link" for clarity
            try {
                const btn = $w('#getStartedBtn');
                if (btn) btn.label = "Send New Link";
            } catch (e) { /* optional */ }
        }

    } catch (error) {
        console.error("❌ Critical error validating magic link token:", error);
        hideLoading();
        clearSessionToken();
        showMessage("System error. Please try again or call (239) 332-2245.", "error");
        setupLoginForm();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION TOKEN REDIRECT HANDLER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a session token from the URL (?st=...) and redirect to the
 * appropriate portal. Used by OAuth callbacks and legacy redirects.
 *
 * @param {string} token - The raw session token from ?st=...
 */
async function handleSessionTokenRedirect(token) {
    try {
        setSessionToken(token);
        const session = await validateCustomSession(token);

        if (session && session.valid && session.role) {
            console.log(`✅ Session valid (${session.role}). Redirecting...`);
            redirectToPortal(session.role);
        } else {
            throw new Error("Session invalid or role missing");
        }

    } catch (err) {
        console.error("❌ Session token validation failed:", err);
        clearSessionToken();
        hideLoading();
        showMessage("Login session expired. Please enter your email below.", "error");
        setupLoginForm();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN FORM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Set up the email/phone input form.
 */
function setupLoginForm() {
    console.log("🎨 Setting up login form...");

    const input = $w('#emailPhoneInput');
    const button = $w('#getStartedBtn');

    if (!input || !button) {
        console.error("❌ #emailPhoneInput or #getStartedBtn not found in Wix Editor!");
        showMessage("Configuration error. Please contact support.", "error");
        return;
    }

    // Auto-focus
    try { input.focus(); } catch (e) { /* optional */ }

    // Enter key submits
    input.onKeyPress((event) => {
        if (event.key === 'Enter') handleGetStarted();
    });

    // Button click
    button.onClick(() => handleGetStarted());

    // Collapse OTP box (not used in magic link flow)
    try {
        $w('#otpInputBox').hide();
        $w('#otpInputBox').collapse();
    } catch (e) { /* optional element */ }

    // Google login
    try {
        const googleBtn = $w('#googleLoginBtn');
        if (googleBtn) googleBtn.onClick(() => startSocialLogin('google'));
    } catch (e) { /* optional */ }

    // Facebook login — collapsed per user request
    try {
        $w('#facebookLoginBtn').collapse();
    } catch (e) { /* optional */ }

    console.log("✅ Login form ready");
}

/**
 * Handle "Get Started" button click.
 */
async function handleGetStarted() {
    const input = $w('#emailPhoneInput');
    const button = $w('#getStartedBtn');

    const emailOrPhone = (input.value || '').trim();

    if (!emailOrPhone) {
        showMessage("Please enter your email or phone number.", "error");
        try { input.focus(); } catch (e) { /* optional */ }
        return;
    }

    if (!isValidEmailOrPhone(emailOrPhone)) {
        showMessage("Please enter a valid email address or phone number.", "error");
        try { input.focus(); } catch (e) { /* optional */ }
        return;
    }

    await sendMagicLinkFlow(emailOrPhone, button);
}

/**
 * Send magic link and handle UX state.
 *
 * @param {string} emailOrPhone
 * @param {Object} button - Wix button element
 */
async function sendMagicLinkFlow(emailOrPhone, button) {
    button.disable();
    const originalLabel = button.label;
    button.label = "Sending...";
    showMessage("Sending your secure link...", "info");

    try {
        const result = await sendMagicLinkSimplified(emailOrPhone);

        if (result.success) {
            button.label = "Sent! ✓";
            showMessage(
                "Check your email or phone — your secure link is on the way. It expires in 24 hours.",
                "success"
            );
            try { $w('#emailPhoneInput').value = ""; } catch (e) { /* optional */ }

            // Countdown before allowing resend (prevents spam)
            let countdown = 60;
            const timer = setInterval(() => {
                countdown--;
                button.label = `Resend in ${countdown}s`;
                if (countdown <= 0) {
                    clearInterval(timer);
                    button.label = "Resend Link";
                    button.enable();
                }
            }, 1000);

        } else {
            console.error("❌ Magic link send failed:", result.message);
            showMessage(result.message || "Unable to send link. Please try again.", "error");
            button.label = originalLabel;
            button.enable();
        }

    } catch (error) {
        console.error("❌ Critical error sending magic link:", error);
        showMessage("System error. Please try again or call (239) 332-2245.", "error");
        button.label = originalLabel;
        button.enable();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TELEGRAM WIDGET
// ─────────────────────────────────────────────────────────────────────────────

function setupTelegramWidget() {
    try {
        const telegramHtml = $w('#telegramHtml');
        if (!telegramHtml) return;

        console.log("📱 Telegram Login Widget: attaching listener");

        telegramHtml.onMessage(async (event) => {
            try {
                const telegramData = typeof event.data === 'string'
                    ? JSON.parse(event.data)
                    : event.data;

                if (!telegramData || !telegramData.hash) return;

                showMessage("Verifying Telegram login...", "info");
                showLoading();

                const result = await onTelegramLogin(telegramData);

                if (result.ok && result.sessionToken) {
                    setSessionToken(result.sessionToken);
                    showMessage("Login successful! Redirecting...", "success");
                    setTimeout(() => redirectToPortal(result.role || 'indemnitor'), 800);
                } else {
                    hideLoading();
                    showMessage(result.message || "Telegram login failed. Please try email.", "error");
                }
            } catch (error) {
                console.error("❌ Telegram login error:", error);
                hideLoading();
                showMessage("Error verifying Telegram login. Please try email.", "error");
            }
        });
    } catch (e) {
        // Telegram widget is optional
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CONCIERGE
// ─────────────────────────────────────────────────────────────────────────────

function setupAIConcierge() {
    try {
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
            console.log("🤖 AI Concierge initialized");
        }
    } catch (e) {
        // AI concierge is optional
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL LOGIN
// ─────────────────────────────────────────────────────────────────────────────

async function startSocialLogin(provider) {
    showMessage(`Connecting to ${provider}...`, "info");
    try {
        let authUrl = "";
        if (provider === 'google') authUrl = await getGoogleAuthUrl();
        if (!authUrl) {
            showMessage(`${provider} login is not configured. Please use email.`, "error");
            return;
        }
        wixLocation.to(authUrl);
    } catch (error) {
        console.error("❌ Social login error:", error);
        showMessage(`Could not connect to ${provider}. Please use email.`, "error");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// REDIRECT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const PORTAL_MAP = {
    'defendant':   '/portal-defendant',
    'indemnitor':  '/portal-indemnitor',
    'coindemnitor':'/portal-indemnitor',
    'staff':       '/portal-staff',
    'admin':       '/portal-staff'
};

/**
 * Redirect to the role-appropriate portal (no token in URL).
 * Use only when session is already reliably stored in browser storage.
 */
function redirectToPortal(role) {
    const destination = PORTAL_MAP[role] || '/portal-indemnitor';
    console.log(`🚀 Redirecting to: ${destination}`);
    wixLocation.to(destination);
}

/**
 * Redirect to the role-appropriate portal WITH the session token in the URL.
 * Belt-and-suspenders: ensures the token reaches the portal page even if
 * browser storage hasn't flushed yet (common on mobile Safari).
 */
function redirectToPortalWithToken(role, sessionToken) {
    const destination = PORTAL_MAP[role] || '/portal-indemnitor';
    const url = `${destination}?st=${encodeURIComponent(sessionToken)}`;
    console.log(`🚀 Redirecting to: ${url}`);
    wixLocation.to(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function showMessage(text, type) {
    try {
        const el = $w('#statusMessage');
        if (!el) return;
        el.text = text;
        try {
            if (type === 'error')   el.style.color = '#FF4444';
            else if (type === 'success') el.style.color = '#00C851';
            else                    el.style.color = '#33B5E5';
        } catch (e) { /* style API optional */ }
        el.show();
    } catch (e) { /* element optional */ }
}

function showLoading() {
    try { $w('#loadingBox').show(); } catch (e) { /* optional */ }
}

function hideLoading() {
    try { $w('#loadingBox').hide(); } catch (e) { /* optional */ }
}

function isValidEmailOrPhone(input) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[\d\s\-\(\)\+\.]{10,}$/;
    return emailPattern.test(input) || phonePattern.test(input);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO
// ─────────────────────────────────────────────────────────────────────────────

function updatePageSEO() {
    const pageTitle = "Client Portal Login | Shamrock Bail Bonds";
    const pageDesc  = "Secure client portal for Shamrock Bail Bonds. Manage your bail case, check in, and view paperwork.";
    const pageUrl   = "https://www.shamrockbailbonds.biz/portal-landing";

    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { name: "description",   content: pageDesc },
        { property: "og:title",  content: pageTitle },
        { property: "og:description", content: pageDesc },
        { property: "og:url",    content: pageUrl },
        { property: "og:type",   content: "website" },
        { name: "robots",        content: "noindex, nofollow" }
    ]);
    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "Portal Login", "item": pageUrl }
            ]
        }
    ]);
}
