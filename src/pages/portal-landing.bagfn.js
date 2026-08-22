/**
 * Shamrock Bail Bonds - Portal Landing Page (Wix Studio)
 * File: portal-landing.bagfn.js
 * 
 * Flow:
 * 1. Phone or email -> Magic link / OTP via portal-auth.jsw
 * 2. Auto-detect returning vs new user
 * 3. Returning Staff/Admin -> /portal-staff (No access-code theater)
 * 4. Returning Defendant with active case -> /portal-defendant
 * 5. Returning Indemnitor with active case -> /portal-indemnitor
 * 6. New User -> Instant Role Selection (Defendant / Indemnitor / Co-indemnitor) -> /portal-start
 * 
 * Roles map:
 * - defendant -> /portal-start?role=defendant (Defendant fields + signature blocks)
 * - indemnitor -> /portal-start?role=indemnitor (Indemnitor/cosigner packet)
 * - coindemnitor -> /portal-start?role=coindemnitor (Same indemnitor packet, second-signer slots)
 * 
 * @version 3.0.0 (Wix Studio)
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';
import { local } from 'wix-storage';
import {
    sendMagicLinkSimplified,
    onMagicLinkLoginV2,
    validateCustomSession,
    onTelegramLogin
} from 'backend/portal-auth';
import { getGoogleAuthUrl } from 'backend/social-auth';
import { setSessionToken, getSessionToken, clearSessionToken } from 'public/session-manager';
import { initAIChat } from 'public/ai-concierge';

// -----------------------------------------------------------------------------
// PAGE INIT
// -----------------------------------------------------------------------------

$w.onReady(async function () {
    console.log("⚡ [Portal Landing] Initializing Studio Portal Flow...");
    updatePageSEO();

    const query = wixLocation.query || {};
    const countyParam = query.county ? `&county=${encodeURIComponent(query.county)}` : '';

    // -- Priority 1: Magic Link Token (?token=...) -----------------------------
    if (query.token && wixWindow.rendering.env === 'browser') {
        console.log("🔗 Magic link token detected in URL");
        showSpinner("Authenticating secure session...");
        await handleMagicLinkToken(query.token, countyParam);
        return;
    }

    // -- Priority 2: Session Token (?st=... or ?sessionToken=...) ---------------
    const sessionToken = query.st || query.sessionToken;
    if (sessionToken && wixWindow.rendering.env === 'browser') {
        console.log("🔑 Session token detected in URL");
        showSpinner("Verifying session...");
        await handleSessionTokenRedirect(sessionToken, countyParam);
        return;
    }

    // -- Priority 3: Existing Valid Session in Browser Storage -----------------
    const existingToken = getSessionToken();
    if (existingToken && wixWindow.rendering.env === 'browser') {
        try {
            const session = await validateCustomSession(existingToken);
            if (session && session.valid) {
                console.log(`✅ Existing session valid (Role: ${session.role || 'user'}). Redirecting...`);
                routeAuthenticatedUser(session.role, existingToken, session.isNewUser, countyParam);
                return;
            }
        } catch (e) {
            console.warn("⚠️ Existing session expired:", e.message);
        }
        clearSessionToken();
    }

    // -- Default: Show Login Surface (Enforce Consent Gate) -------------------
    const hasConsent = await showConsentIfNeeded();
    if (!hasConsent && local.getItem('shamrock_sms_consent') !== 'true') {
        showConsentRequiredState(countyParam);
        return;
    }

    setupLoginForm(countyParam);
    setupRoleSelectionCards(countyParam);
    setupTelegramWidget(countyParam);
    setupAIConcierge();
});

// -----------------------------------------------------------------------------
// AUTHENTICATION & ROUTING LOGIC
// -----------------------------------------------------------------------------

/**
 * Validates magic link token and routes user according to status
 */
async function handleMagicLinkToken(token, countyParam) {
    try {
        const result = await onMagicLinkLoginV2(token);

        if (result.ok && result.sessionToken) {
            setSessionToken(result.sessionToken);
            routeAuthenticatedUser(result.role, result.sessionToken, result.isNewUser, countyParam);
        } else {
            hideSpinner();
            showMessage(result.message || "Link expired or already used. Please request a new link.", "error");
            setupLoginForm(countyParam);
        }
    } catch (err) {
        console.error("❌ Magic link error:", err);
        hideSpinner();
        clearSessionToken();
        showMessage("System error. Call (239) 332-2245 for 24/7 dispatch.", "error");
        setupLoginForm(countyParam);
    }
}

/**
 * Validates existing session token and routes
 */
async function handleSessionTokenRedirect(token, countyParam) {
    try {
        setSessionToken(token);
        const session = await validateCustomSession(token);

        if (session && session.valid) {
            routeAuthenticatedUser(session.role, token, session.isNewUser, countyParam);
        } else {
            throw new Error("Invalid session");
        }
    } catch (err) {
        console.warn("❌ Session token rejected:", err.message);
        clearSessionToken();
        hideSpinner();
        showMessage("Session expired. Enter your email or phone below.", "error");
        setupLoginForm(countyParam);
    }
}

/**
 * Intelligent Router: Directs returning members to dashboards and new intakes to /portal-start
 */
function routeAuthenticatedUser(role, sessionToken, isNewUser, countyParam) {
    const cleanRole = (role || '').toLowerCase().trim();

    // 1. Staff / Admin -> Instant Staff Queue (No access code theater)
    if (cleanRole === 'staff' || cleanRole === 'admin' || cleanRole === 'superadmin') {
        console.log("👮 Routing to Staff Portal");
        wixLocation.to(`/portal-staff?st=${encodeURIComponent(sessionToken)}`);
        return;
    }

    // 2. Returning Defendant with Existing Case -> Defendant Dashboard
    if (cleanRole === 'defendant' && !isNewUser) {
        console.log("👤 Routing to Defendant Dashboard");
        wixLocation.to(`/portal-defendant?st=${encodeURIComponent(sessionToken)}`);
        return;
    }

    // 3. Returning Indemnitor with Existing Case -> Indemnitor Dashboard
    if ((cleanRole === 'indemnitor' || cleanRole === 'coindemnitor') && !isNewUser) {
        console.log("📋 Routing to Indemnitor Dashboard");
        wixLocation.to(`/portal-indemnitor?st=${encodeURIComponent(sessionToken)}`);
        return;
    }

    // 4. If role is explicitly known on fresh session -> Direct to /portal-start
    if (cleanRole === 'defendant' || cleanRole === 'indemnitor' || cleanRole === 'coindemnitor') {
        const dest = `/portal-start?role=${cleanRole}&st=${encodeURIComponent(sessionToken)}${countyParam}`;
        console.log(`🚀 Routing new user directly to intake launchpad: ${dest}`);
        wixLocation.to(dest);
        return;
    }

    // 5. New User / Unassigned Role -> Prompt Immediate Role Choice
    console.log("⚡ New user detected — revealing role selection modal/cards");
    hideSpinner();
    revealRolePicker(sessionToken, countyParam);
}

// -----------------------------------------------------------------------------
// ROLE SELECTION (FOR NEW INTAKES)
// -----------------------------------------------------------------------------

function setupRoleSelectionCards(countyParam) {
    // Role Buttons / Cards
    const roles = [
        { id: '#btnRoleDefendant', role: 'defendant' },
        { id: '#cardRoleDefendant', role: 'defendant' },
        { id: '#btnRoleIndemnitor', role: 'indemnitor' },
        { id: '#cardRoleIndemnitor', role: 'indemnitor' },
        { id: '#btnRoleCoIndemnitor', role: 'coindemnitor' },
        { id: '#cardRoleCoIndemnitor', role: 'coindemnitor' }
    ];

    roles.forEach(({ id, role }) => {
        try {
            const el = $w(id);
            if (el && typeof el.onClick === 'function') {
                el.onClick(() => {
                    const token = getSessionToken() || '';
                    const dest = `/portal-start?role=${role}&st=${encodeURIComponent(token)}${countyParam}`;
                    console.log(`🎯 Role selected [${role}] -> Navigating to ${dest}`);
                    wixLocation.to(dest);
                });
            }
        } catch (e) { /* non-fatal */ }
    });
}

function revealRolePicker(sessionToken, countyParam) {
    try {
        const roleBox = $w('#boxRoleSelection') || $w('#rolePickerContainer');
        const loginBox = $w('#boxLoginForm') || $w('#loginContainer');

        if (loginBox && typeof loginBox.collapse === 'function') loginBox.collapse();
        if (roleBox && typeof roleBox.expand === 'function') {
            roleBox.expand();
            roleBox.show();
        } else {
            // Fallback: Default to indemnitor launchpad if no role UI box in DOM
            wixLocation.to(`/portal-start?role=indemnitor&st=${encodeURIComponent(sessionToken)}${countyParam}`);
        }
    } catch (e) {
        wixLocation.to(`/portal-start?role=indemnitor&st=${encodeURIComponent(sessionToken)}${countyParam}`);
    }
}

// -----------------------------------------------------------------------------
// LOGIN FORM SETUP
// -----------------------------------------------------------------------------

function setupLoginForm(countyParam) {
    const input = $w('#emailPhoneInput');
    const button = $w('#getStartedBtn');

    if (!input || !button) return;

    try { input.focus(); } catch (e) { /* optional */ }

    input.onKeyPress((event) => {
        if (event.key === 'Enter') handleGetStarted(countyParam);
    });

    button.onClick(() => handleGetStarted(countyParam));

    // Social Google Auth
    try {
        const googleBtn = $w('#googleLoginBtn');
        if (googleBtn) googleBtn.onClick(() => startSocialLogin('google'));
    } catch (e) { /* optional */ }
}

async function handleGetStarted(countyParam) {
    const input = $w('#emailPhoneInput');
    const button = $w('#getStartedBtn');
    const emailOrPhone = (input.value || '').trim();

    if (!emailOrPhone) {
        showMessage("Please enter your phone number or email.", "error");
        return;
    }

    if (!isValidEmailOrPhone(emailOrPhone)) {
        showMessage("Enter a valid 10-digit phone number or email address.", "error");
        return;
    }

    button.disable();
    const originalLabel = button.label;
    button.label = "Sending Link...";
    showMessage("Sending your secure link...", "info");

    try {
        const result = await sendMagicLinkSimplified(emailOrPhone);

        if (result.success) {
            button.label = "Sent!";
            showMessage("Secure link sent! Check your text messages or email.", "success");
            try { input.value = ""; } catch (e) {}

            let countdown = 60;
            const timer = setInterval(() => {
                countdown--;
                button.label = `Resend (${countdown}s)`;
                if (countdown <= 0) {
                    clearInterval(timer);
                    button.label = originalLabel;
                    button.enable();
                }
            }, 1000);
        } else {
            showMessage(result.message || "Could not send link. Please call (239) 332-2245.", "error");
            button.label = originalLabel;
            button.enable();
        }
    } catch (err) {
        showMessage("System error. Call (239) 332-2245 for immediate release.", "error");
        button.label = originalLabel;
        button.enable();
    }
}

// -----------------------------------------------------------------------------
// HELPERS, CONSENT & SOCIAL
// -----------------------------------------------------------------------------

async function showConsentIfNeeded() {
    try {
        if (wixWindow.rendering.env !== 'browser') return true;
        if (local.getItem('shamrock_sms_consent') === 'true') return true;

        const consentResult = await wixWindow.openLightbox('ConsentLightbox');
        if (consentResult && consentResult.success) {
            local.setItem('shamrock_sms_consent', 'true');
            local.setItem('shamrock_consent_timestamp', new Date().toISOString());
            return true;
        }
        return false;
    } catch (e) {
        console.warn("⚠️ Consent lightbox handling warning:", e?.message);
        return false;
    }
}

function showConsentRequiredState(countyParam) {
    try {
        showMessage("⚠️ Electronic & SMS consent is required to access bail paperwork and portal services.", "error");
        const button = $w('#getStartedBtn') || $w('#btnLogin');
        if (button) {
            button.label = "Review & Accept Consent";
            button.onClick(async () => {
                const granted = await showConsentIfNeeded();
                if (granted || local.getItem('shamrock_sms_consent') === 'true') {
                    button.label = "Get Started →";
                    showMessage("✓ Consent recorded. You may now continue.", "success");
                    setupLoginForm(countyParam);
                    setupRoleSelectionCards(countyParam);
                    setupTelegramWidget(countyParam);
                    setupAIConcierge();
                }
            });
        }
    } catch (e) {}
}

function setupTelegramWidget(countyParam) {
    try {
        const widget = $w('#telegramHtml');
        if (!widget) return;

        widget.onMessage(async (event) => {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (!data || !data.hash) return;

                showSpinner("Verifying Telegram...");
                const result = await onTelegramLogin(data);
                if (result.ok && result.sessionToken) {
                    setSessionToken(result.sessionToken);
                    routeAuthenticatedUser(result.role, result.sessionToken, result.isNewUser, countyParam);
                } else {
                    hideSpinner();
                    showMessage("Telegram login failed. Use phone or email.", "error");
                }
            } catch (err) {
                hideSpinner();
                showMessage("Telegram authentication error.", "error");
            }
        });
    } catch (e) { /* optional */ }
}

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
        }
    } catch (e) { /* optional */ }
}

async function startSocialLogin(provider) {
    showMessage(`Connecting to ${provider}...`, "info");
    try {
        const authUrl = await getGoogleAuthUrl();
        if (authUrl) wixLocation.to(authUrl);
    } catch (e) {
        showMessage("Social login unavailable. Use phone or email.", "error");
    }
}

function showMessage(text, type) {
    try {
        const el = $w('#statusMessage');
        if (!el) return;
        el.text = text;
        try {
            el.style.color = type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#38BDF8';
        } catch (e) {}
        el.show();
    } catch (e) {}
}

function showSpinner(text) {
    try {
        const box = $w('#loadingBox') || $w('#spinnerContainer');
        if (box) {
            const label = $w('#loadingText');
            if (label && text) label.text = text;
            box.show();
        }
    } catch (e) {}
}

function hideSpinner() {
    try {
        const box = $w('#loadingBox') || $w('#spinnerContainer');
        if (box) box.hide();
    } catch (e) {}
}

function isValidEmailOrPhone(input) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[\d\s\-\(\)\+\.]{10,}$/;
    return emailPattern.test(input) || phonePattern.test(input);
}

function updatePageSEO() {
    wixSeo.setTitle("Client Portal Login | Shamrock Bail Bonds");
    wixSeo.setMetaTags([
        { name: "description", content: "Fast, secure client portal for Shamrock Bail Bonds. Start paperwork, check in, and view case status." },
        { name: "robots", content: "noindex, nofollow" }
    ]);
}
