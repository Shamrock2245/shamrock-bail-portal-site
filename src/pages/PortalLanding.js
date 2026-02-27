/**
 * Shamrock Bail Bonds - Portal Landing Page
 *
 * Entry point for all three portals:
 *   - Defendant Portal  → /members/defendant-dashboard
 *   - Indemnitor Portal → /members/indemnitor-dashboard
 *   - Staff Portal      → /members/staff-dashboard
 *
 * MAGIC LINK AUTO-LOGIN:
 *   If the URL contains ?code=XYZ, the code is validated automatically on page load.
 *   On success, the user is logged in (or prompted to register) and redirected to
 *   the correct portal based on the code's role.
 *
 *   URL format: /portal-landing?code=XXXXXXXX
 *   URL format: /portal-landing?code=XXXXXXXX&reason=auth_required
 *
 * MANUAL ACCESS CODE:
 *   Staff can also type an 8-char code into the access code input and submit.
 *
 * Page Element IDs (set in Wix Editor):
 *   #comp-mjrvbswh      — Access code input field
 *   #comp-mjrvd6m8      — Submit button for access code
 *   #comp-mjrynime      — Defendant Portal button
 *   #comp-mjrynk22      — Indemnitor Portal button
 *   #comp-mjryn7jm      — Staff Portal button
 *   #autoLoginBanner    — "Verifying your link..." banner (optional)
 *   #errorBanner        — Error message banner (optional)
 *   #reasonBanner       — Auth-required / session-expired banner (optional)
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { authentication } from 'wix-members-frontend';

// ─────────────────────────────────────────────
// PORTAL CONFIGURATION
// ─────────────────────────────────────────────

const PORTAL_CONFIG = {
    defendant: {
        buttonId: '#comp-mjrynime',
        memberRole: 'Defendant',
        redirectUrl: '/members/defendant-dashboard',
        loginPrompt: 'Defendant Portal Login'
    },
    indemnitor: {
        buttonId: '#comp-mjrynk22',
        memberRole: 'Indemnitor',
        redirectUrl: '/members/indemnitor-dashboard',
        loginPrompt: 'Indemnitor Portal Login'
    },
    staff: {
        buttonId: '#comp-mjryn7jm',
        memberRole: 'Staff',
        redirectUrl: '/members/staff-dashboard',
        loginPrompt: 'Staff Portal Login'
    }
};

// Reason banners shown when redirected here with ?reason=
const REASON_MESSAGES = {
    auth_required: 'Please log in to access your portal.',
    session_expired: 'Your session has expired. Please log in again.',
    link_expired: 'Your signing link has expired. Please call (239) 332-2245.',
    access_denied: 'You do not have permission to access that page.'
};

// ─────────────────────────────────────────────
// PAGE INIT
// ─────────────────────────────────────────────

$w.onReady(async function () {
    const query = wixLocation.query;

    // 1. Show reason banner if redirected here with a reason param
    handleReasonParam(query.reason);

    // 2. Check for magic link code in URL — auto-validate on load
    if (query.code) {
        await handleMagicLinkAutoLogin(query.code);
        return; // Don't set up manual buttons if auto-login is in progress
    }

    // 3. Normal page load — set up buttons and check existing session
    initializePortalButtons();
    initializeAccessCodeForm();
    await checkExistingSession();
});

// ─────────────────────────────────────────────
// MAGIC LINK AUTO-LOGIN
// ─────────────────────────────────────────────

/**
 * Auto-validate a magic link code from the URL query parameter.
 * On success: store case info in session, redirect to correct portal.
 * On failure: show error, fall back to manual access code form.
 *
 * @param {string} code - The magic link code from ?code=
 */
async function handleMagicLinkAutoLogin(code) {
    showAutoLoginBanner(true);

    try {
        const { validateCode } = await import('backend/accessCodes');
        const result = await validateCode(code.trim().toUpperCase());

        if (!result.valid) {
            showAutoLoginBanner(false);
            showError(
                result.reason === 'expired'
                    ? 'This link has expired. Please call (239) 332-2245 for a new one.'
                    : 'This link is invalid. Please check your message or call (239) 332-2245.'
            );
            // Fall back to manual form
            initializePortalButtons();
            initializeAccessCodeForm();
            return;
        }

        // Store case context in session storage
        wixWindow.sessionStorage.setItem('case_id', result.caseId || '');
        wixWindow.sessionStorage.setItem('access_code', code.trim().toUpperCase());
        wixWindow.sessionStorage.setItem('portal_type', result.portalType || '');
        if (result.signerEmail) {
            wixWindow.sessionStorage.setItem('signer_email', result.signerEmail);
        }

        trackEvent('MagicLink_AutoLogin_Success', {
            portal: result.portalType,
            caseId: result.caseId
        });

        // Determine redirect URL from result or config
        const portalType = result.portalType || 'defendant';
        const redirectUrl = result.redirectUrl
            || PORTAL_CONFIG[portalType]?.redirectUrl
            || '/members/defendant-dashboard';

        // Check if user is already logged in
        const isLoggedIn = authentication.loggedIn();

        if (isLoggedIn) {
            // Already logged in — go straight to portal
            showAutoLoginBanner(false);
            wixLocation.to(redirectUrl);
        } else {
            // Not logged in — prompt login/register, then redirect
            showAutoLoginBanner(false);
            wixWindow.sessionStorage.setItem('portal_redirect', redirectUrl);

            authentication.promptLogin({ mode: 'login', modal: true })
                .then(() => {
                    wixLocation.to(redirectUrl);
                })
                .catch((err) => {
                    if (err.message !== 'User closed the dialog') {
                        console.error('[PortalLanding] Login prompt error:', err);
                    }
                    // User closed dialog — show manual form
                    initializePortalButtons();
                    initializeAccessCodeForm();
                });
        }

    } catch (error) {
        console.error('[PortalLanding] Magic link auto-login error:', error);
        showAutoLoginBanner(false);
        showError('Unable to verify your link. Please try again or call (239) 332-2245.');
        initializePortalButtons();
        initializeAccessCodeForm();
    }
}

// ─────────────────────────────────────────────
// PORTAL BUTTONS
// ─────────────────────────────────────────────

/**
 * Initialize all three portal access buttons.
 */
function initializePortalButtons() {
    Object.entries(PORTAL_CONFIG).forEach(([portalType, config]) => {
        try {
            $w(config.buttonId).onClick(() => {
                handlePortalAccess(portalType);
            });
        } catch (e) {
            console.warn(`[PortalLanding] Button ${config.buttonId} not found:`, e.message);
        }
    });
}

/**
 * Handle portal button click — check login, verify role, redirect.
 * @param {string} portalType - 'defendant' | 'indemnitor' | 'staff'
 */
async function handlePortalAccess(portalType) {
    const config = PORTAL_CONFIG[portalType];

    try {
        const isLoggedIn = authentication.loggedIn();

        if (isLoggedIn) {
            // Verify role
            let roles = [];
            try {
                roles = await authentication.currentMember.getRoles();
            } catch {
                // Role check unavailable — allow access
            }

            const hasRole = roles.length === 0
                || roles.some(r =>
                    r.name === config.memberRole
                    || r.name === 'Admin'
                    || r.name === 'admin'
                );

            if (hasRole) {
                trackEvent('Portal_Access', { portal: portalType, method: 'existing_session' });
                wixLocation.to(config.redirectUrl);
            } else {
                wixWindow.openLightbox('role-mismatch-lightbox', {
                    requestedRole: config.memberRole,
                    currentRoles: roles.map(r => r.name).join(', ')
                });
            }
        } else {
            promptLogin(portalType, config);
        }
    } catch (error) {
        console.error('[PortalLanding] Portal access error:', error);
        promptLogin(portalType, config);
    }
}

/**
 * Prompt user to log in, then redirect to portal.
 * @param {string} portalType
 * @param {object} config
 */
function promptLogin(portalType, config) {
    wixWindow.sessionStorage.setItem('portal_redirect', config.redirectUrl);
    wixWindow.sessionStorage.setItem('portal_type', portalType);

    trackEvent('Portal_Login_Prompt', { portal: portalType });

    authentication.promptLogin({ mode: 'login', modal: true })
        .then(() => {
            wixLocation.to(config.redirectUrl);
        })
        .catch((error) => {
            if (error.message !== 'User closed the dialog') {
                console.error('[PortalLanding] Login error:', error);
            }
        });
}

// ─────────────────────────────────────────────
// MANUAL ACCESS CODE FORM
// ─────────────────────────────────────────────

/**
 * Initialize the manual access code input form.
 */
function initializeAccessCodeForm() {
    const accessCodeInput = $w('#comp-mjrvbswh');
    const submitButton = $w('#comp-mjrvd6m8');

    try {
        submitButton.onClick(async () => {
            const code = accessCodeInput.value;
            if (!code || code.trim() === '') {
                showError('Please enter your access code.');
                return;
            }
            await validateAccessCode(code.trim().toUpperCase());
        });

        accessCodeInput.onKeyPress((event) => {
            if (event.key === 'Enter') {
                submitButton.onClick();
            }
        });
    } catch (e) {
        console.warn('[PortalLanding] Access code form elements not found:', e.message);
    }
}

/**
 * Validate a manually entered access code.
 * @param {string} accessCode
 */
async function validateAccessCode(accessCode) {
    try {
        const { validateCode } = await import('backend/accessCodes');
        const result = await validateCode(accessCode);

        if (result.valid) {
            trackEvent('Access_Code_Valid', {
                portal: result.portalType,
                caseId: result.caseId
            });

            wixWindow.sessionStorage.setItem('case_id', result.caseId || '');
            wixWindow.sessionStorage.setItem('access_code', accessCode);
            wixWindow.sessionStorage.setItem('portal_type', result.portalType || '');

            const portalType = result.portalType || 'defendant';
            const redirectUrl = result.redirectUrl
                || PORTAL_CONFIG[portalType]?.redirectUrl
                || '/members/defendant-dashboard';

            wixLocation.to(redirectUrl);
        } else {
            trackEvent('Access_Code_Invalid', { code: accessCode });
            showError(
                result.reason === 'expired'
                    ? 'This access code has expired. Please call (239) 332-2245 for a new one.'
                    : 'Invalid access code. Please check your code and try again, or call (239) 332-2245.'
            );
        }
    } catch (error) {
        console.error('[PortalLanding] Error validating access code:', error);
        showError('Unable to validate access code. Please try again or call (239) 332-2245.');
    }
}

// ─────────────────────────────────────────────
// SESSION CHECK
// ─────────────────────────────────────────────

/**
 * If user is already logged in and there's a pending redirect, complete it.
 */
async function checkExistingSession() {
    try {
        const isLoggedIn = authentication.loggedIn();

        if (isLoggedIn) {
            const pendingRedirect = wixWindow.sessionStorage.getItem('portal_redirect');
            if (pendingRedirect) {
                wixWindow.sessionStorage.removeItem('portal_redirect');
                wixWindow.sessionStorage.removeItem('portal_type');
                wixLocation.to(pendingRedirect);
            }
        }
    } catch (error) {
        console.error('[PortalLanding] Error checking existing session:', error);
    }
}

// ─────────────────────────────────────────────
// REASON BANNER
// ─────────────────────────────────────────────

/**
 * Show a contextual message when redirected here with a ?reason= param.
 * @param {string} reason
 */
function handleReasonParam(reason) {
    if (!reason) return;

    const message = REASON_MESSAGES[reason];
    if (!message) return;

    try {
        if ($w('#reasonBanner').valid) {
            $w('#reasonBanner').text = message;
            $w('#reasonBanner').show();
        }
    } catch (e) {
        // Element not present — silently ignore
    }
}

// ─────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────

function showAutoLoginBanner(visible) {
    try {
        if ($w('#autoLoginBanner').valid) {
            visible
                ? $w('#autoLoginBanner').show()
                : $w('#autoLoginBanner').hide();
        }
    } catch (e) {
        // Element not present
    }
}

function showError(message) {
    try {
        if ($w('#errorBanner').valid) {
            $w('#errorBanner').text = message;
            $w('#errorBanner').show();
        } else {
            wixWindow.openLightbox('error-lightbox', { message });
        }
    } catch (e) {
        console.error('[PortalLanding] Error banner not available:', e.message);
    }
}

function trackEvent(eventName, eventData) {
    try {
        wixWindow.trackEvent(eventName, eventData);
    } catch (error) {
        console.error('[PortalLanding] trackEvent error:', error);
    }
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

export {
    initializePortalButtons,
    handlePortalAccess,
    validateAccessCode,
    checkExistingSession,
    handleMagicLinkAutoLogin
};
