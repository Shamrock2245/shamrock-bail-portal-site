/**
 * Shamrock Bail Bonds - Portal Landing Page (Wix Studio)
 * File: portal-landing.bagfn.js
 * 
 * Flow:
 * 1. Role-first Who are you? (family/helper vs person in jail) -> paperwork launchpad
 * 2. Secondary: phone/email magic link for returning clients (portal-auth.jsw)
 * 3. Returning Staff/Admin -> /portal-staff
 * 4. Returning Defendant with active case -> /portal-defendant
 * 5. Returning Indemnitor with active case -> /portal-indemnitor
 * 6. New authenticated user without role -> role picker then launchpad
 * 
 * Roles map:
 * - defendant -> paperwork launchpad?role=defendant
 * - indemnitor -> paperwork launchpad?role=indemnitor
 * - coindemnitor -> paperwork launchpad?role=coindemnitor
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
import { buildPaperworkLaunchpadUrl } from 'public/portal-config';

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

    // Role-first for first-time bond seekers; login is secondary ("returning").
    setupRoleSelectionCards(countyParam);
    prioritizeRolePicker(countyParam);
    setupLoginForm(countyParam);
    softenLoginChrome();
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
 * Intelligent Router: Directs returning members to dashboards and new intakes to the paperwork launchpad
 */
function routeAuthenticatedUser(role, sessionToken, isNewUser, countyParam) {
    const cleanRole = (role || '').toLowerCase().trim();
    const county = String(countyParam || '').replace(/^&?county=/i, '');

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

    // 4. If role is explicitly known on fresh session -> paperwork launchpad
    if (cleanRole === 'defendant' || cleanRole === 'indemnitor' || cleanRole === 'coindemnitor') {
        const dest = buildPaperworkLaunchpadUrl({
            role: cleanRole,
            st: sessionToken,
            county,
            source: 'wix-portal-landing'
        });
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

/** Plain-language role labels — avoid "indemnitor" jargon on first paint. */
const ROLE_LABELS = {
    defendant: "I'm the person in jail",
    indemnitor: "I'm family / helping someone out",
    coindemnitor: "I'm a second cosigner"
};

function setupRoleSelectionCards(countyParam) {
    // Family/cosigner first (most common emergency caller), then defendant, then 2nd cosigner.
    const roles = [
        { id: '#btnRoleIndemnitor', role: 'indemnitor' },
        { id: '#cardRoleIndemnitor', role: 'indemnitor' },
        { id: '#btnRoleDefendant', role: 'defendant' },
        { id: '#cardRoleDefendant', role: 'defendant' },
        { id: '#btnRoleCoIndemnitor', role: 'coindemnitor' },
        { id: '#cardRoleCoIndemnitor', role: 'coindemnitor' }
    ];

    roles.forEach(({ id, role }) => {
        try {
            const el = $w(id);
            if (!el) return;
            try {
                if (typeof el.label === 'string' || el.label === '') {
                    el.label = ROLE_LABELS[role] || el.label;
                }
            } catch (e) { /* text/button variance */ }
            try {
                if (typeof el.text === 'string') {
                    el.text = ROLE_LABELS[role] || el.text;
                }
            } catch (e) { /* non-fatal */ }
            if (typeof el.onClick === 'function') {
                el.onClick(() => {
                    const token = getSessionToken() || '';
                    const dest = buildPaperworkLaunchpadUrl({
                        role,
                        st: token,
                        county: String(countyParam || '').replace(/^&?county=/i, ''),
                        source: 'wix-portal-landing'
                    });
                    console.log(`🎯 Role selected [${role}] -> Navigating to ${dest}`);
                    wixLocation.to(dest);
                });
            }
        } catch (e) { /* non-fatal */ }
    });
}

/**
 * First-time seekers see Who are you? before magic-link login.
 * Returning clients still get the phone/email link form below.
 */
function prioritizeRolePicker(countyParam) {
    try {
        const roleBox = $w('#boxRoleSelection') || $w('#rolePickerContainer');
        if (roleBox) {
            try { if (typeof roleBox.expand === 'function') roleBox.expand(); } catch (e) {}
            try { if (typeof roleBox.show === 'function') roleBox.show(); } catch (e) {}
        }
        const headingIds = ['#textRoleHeading', '#rolePickerTitle', '#portalHeroTitle', '#textPortalTitle'];
        headingIds.forEach(function (id) {
            try {
                const el = $w(id);
                if (el && typeof el.text === 'string') {
                    el.text = 'Who are you? Pick one to start — no password needed.';
                }
            } catch (e) { /* optional */ }
        });
        const subIds = ['#textRoleSubhead', '#rolePickerSubtitle', '#portalHeroSubtitle'];
        subIds.forEach(function (id) {
            try {
                const el = $w(id);
                if (el && typeof el.text === 'string') {
                    el.text = 'Most people helping a loved one tap Family. Already have a case? Send yourself a link below.';
                }
            } catch (e) { /* optional */ }
        });
    } catch (e) { /* non-fatal */ }
}

function softenLoginChrome() {
    try {
        const loginHeadingIds = ['#textLoginHeading', '#loginTitle', '#textLoginTitle'];
        loginHeadingIds.forEach(function (id) {
            try {
                const el = $w(id);
                if (el && typeof el.text === 'string') {
                    el.text = 'Already started? Get your secure link';
                }
            } catch (e) {}
        });
        const btn = $w('#getStartedBtn') || $w('#btnLogin');
        if (btn) {
            try { btn.label = 'Send my link'; } catch (e) {}
        }
    } catch (e) { /* non-fatal */ }
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
            wixLocation.to(buildPaperworkLaunchpadUrl({
                role: 'indemnitor',
                st: sessionToken,
                county: String(countyParam || '').replace(/^&?county=/i, ''),
                source: 'wix-portal-landing'
            }));
        }
    } catch (e) {
        wixLocation.to(buildPaperworkLaunchpadUrl({
            role: 'indemnitor',
            st: sessionToken,
            county: String(countyParam || '').replace(/^&?county=/i, ''),
            source: 'wix-portal-landing'
        }));
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
        showMessage("System error. Call (239) 332-2245. Phones are answered 24/7.", "error");
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
        showMessage("Please accept text/email consent so we can send your secure link.", "error");
        const button = $w('#getStartedBtn') || $w('#btnLogin');
        if (button) {
            button.label = "Review & Accept Consent";
            button.onClick(async () => {
                const granted = await showConsentIfNeeded();
                if (granted || local.getItem('shamrock_sms_consent') === 'true') {
                    button.label = "Send my link";
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
    wixSeo.setTitle("Start Bail Paperwork | Shamrock Bail Bonds");
    wixSeo.setMetaTags([
        { name: "description", content: "Start bail paperwork online. Choose family/helper or person in jail — no password. Shamrock Bail Bonds, Fort Myers." },
        { name: "robots", content: "noindex, nofollow" }
    ]);
}

// =============================================================================
// WIX STUDIO LAYER (Oct 2026) — source: Studio cutover ready/velo/portal-landing.js
// Element IDs from the Studio design. Every lookup is guarded (a missing ID skips
// that feature), so this is inert on the current live layout and the code above
// keeps running unchanged. Scoped in an IIFE so helper names never collide.
// Copy rules: no release-time/speed claims; Spanish line (727) 295-2245;
// "Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7".
// =============================================================================
(function studioLayer() {
    /**
     * portal-landing.js — Portal sign-in (/portal-landing)
     * Paste in Wix Studio: Portal Landing page > Code panel > page code.
     *
     * Same backend behavior as before: one email or phone string goes to the portal
     * sign-in function in backend/portal-auth.jsw, which sends the secure sign-in link.
     * Changes: every lookup guarded; spinner hidden on load; help button links to the phone.
     */


    const PHONE_MAIN = 'tel:+12393322245';

    // ─── Safe element helpers ($w throws on a missing ID; `if ($w('#x'))` does not protect) ──
    function el(id) {
        try {
            const node = $w(id);
            if (!node || (typeof node.id !== 'string' && typeof node.type !== 'string')) return null;
            return node;
        } catch (e) {
            return null;
        }
    }
    function itemEl($item, id) {
        try {
            const node = $item(id);
            if (!node || (typeof node.id !== 'string' && typeof node.type !== 'string')) return null;
            return node;
        } catch (e) {
            return null;
        }
    }
    function on(id, event, handler) {
        const node = typeof id === 'string' ? el(id) : id;
        if (!node) return null;
        try { node[event](handler); } catch (e) { /* element has no such event */ }
        return node;
    }
    function setText(node, value) {
        if (!node) return;
        try { node.text = String(value == null ? '' : value); } catch (e) { /* not a text element */ }
    }
    function setLink(node, url, target) {
        if (!node || !url) return false;
        try {
            node.link = url;
            node.target = target || '_self';
            return true;
        } catch (e) {
            return false;
        }
    }
    function valueOf(id) {
        const node = el(id);
        if (!node) return '';
        try { return typeof node.value === 'string' ? node.value.trim() : (node.value || ''); } catch (e) { return ''; }
    }
    function call(node, method) {
        if (!node) return;
        try { node[method](); } catch (e) { /* noop */ }
    }

    $w.onReady(function () {
        const defendantTab = el('#tabDefendant');
        const indemnitorTab = el('#tabIndemnitor');
        const submitBtn = el('#btnSendMagicLink');
        const spinner = el('#loginSpinner');
        const successBox = el('#loginSuccessBox');
        const errorBox = el('#loginErrorBox');
        const errorText = el('#loginErrorText');
        call(spinner, 'hide');

        setLink(el('#portalCallBtn'), PHONE_MAIN, '_self'); // optional "Need help? Call" button

        function setActive(active, inactive, description) {
            try { active.customClassList.add('active-tab'); } catch (e) { /* noop */ }
            try { inactive.customClassList.remove('active-tab'); } catch (e) { /* noop */ }
            setText(el('#roleDescriptionText'), description);
        }

        if (defendantTab && indemnitorTab) {
            on(defendantTab, 'onClick', () => setActive(defendantTab, indemnitorTab,
                'Defendant portal: check court dates, complete your check-in, and view bond status.'));
            on(indemnitorTab, 'onClick', () => setActive(indemnitorTab, defendantTab,
                'Cosigner / indemnitor portal: review paperwork, manage payment plans, and view receipts.'));
        }

        function showError(msg) {
            setText(errorText, msg);
            call(errorBox, 'expand');
        }

        if (!submitBtn) return;
        submitBtn.onClick(async () => {
            call(successBox, 'collapse');
            call(errorBox, 'collapse');

            const phone = valueOf('#inputLoginPhone');
            const email = valueOf('#inputLoginEmail');
            if (!phone && !email) {
                showError('Please enter your mobile phone number or email address.');
                return;
            }

            call(submitBtn, 'disable');
            call(spinner, 'show');
            try {
                // The backend takes one email or phone string (not a role object).
                const contact = (email && email.includes('@')) ? email : phone;
                const response = await sendMagicLinkSimplified(contact);
                if (response && response.success) {
                    call(successBox, 'expand');
                    setText(el('#successDetailText'), `We sent a secure sign-in link to ${phone || email}. Please check your messages.`);
                } else {
                    showError((response && response.message) || 'We could not find an active case for that contact. Please call (239) 332-2245.');
                }
            } catch (err) {
                console.error('Login request error:', err);
                showError('We could not verify access. Please call (239) 332-2245.');
            } finally {
                call(submitBtn, 'enable');
                call(spinner, 'hide');
            }
        });
    });
})();
