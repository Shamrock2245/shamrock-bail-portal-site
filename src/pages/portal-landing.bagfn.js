/**
 * Shamrock Bail Bonds - Portal Landing Page
 * 
 * This page provides access to three different portals:
 * - Defendant Portal: For defendants to view case status and sign paperwork
 * - Indemnitor Portal: For indemnitors to manage payments and track status
 * - Staff Portal: For staff to manage paperwork and signatures
 * 
 * Page Elements (Wix Editor IDs):
 * - #comp-mjrvbswh: Access code input field
 * - #comp-mjrvd6m8: Submit button for access code
 * - #comp-mjrynime: Defendant Portal button (index 24)
 * - #comp-mjrynk22: Indemnitor Portal button (index 26)
 * - #comp-mjryn7jm: Staff Portal button (index 28)
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { authentication } from 'wix-members-frontend';

// Portal configuration
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

$w.onReady(function () {
    initializePortalButtons();
    initializeAccessCodeForm();
    checkExistingSession();
});

/**
 * Initialize all three portal access buttons
 */
function initializePortalButtons() {
    // Defendant Portal Button
    $w(PORTAL_CONFIG.defendant.buttonId).onClick(() => {
        handlePortalAccess('defendant');
    });

    // Indemnitor Portal Button
    $w(PORTAL_CONFIG.indemnitor.buttonId).onClick(() => {
        handlePortalAccess('indemnitor');
    });

    // Staff Portal Button
    $w(PORTAL_CONFIG.staff.buttonId).onClick(() => {
        handlePortalAccess('staff');
    });
}

/**
 * Handle portal access - check if user is logged in, if not prompt for login
 * @param {string} portalType - Type of portal (defendant, indemnitor, staff)
 */
async function handlePortalAccess(portalType) {
    const config = PORTAL_CONFIG[portalType];

    try {
        // Check if user is already logged in
        const isLoggedIn = authentication.loggedIn();

        if (isLoggedIn) {
            // User is logged in - verify role and redirect
            const member = await authentication.currentMember.getMember();

            // Check if user has the correct role
            const roles = await authentication.currentMember.getRoles();

            if (roles && roles.some(role => role.name === config.memberRole)) {
                // User has correct role - redirect to portal
                trackEvent('Portal_Access', {
                    portal: portalType,
                    method: 'existing_session'
                });
                wixLocation.to(config.redirectUrl);
            } else {
                // User logged in but wrong role
                wixWindow.openLightbox('role-mismatch-lightbox', {
                    requestedRole: config.memberRole,
                    currentRoles: roles.map(r => r.name).join(', ')
                });
            }
        } else {
            // User not logged in - prompt for authentication
            promptLogin(portalType, config);
        }
    } catch (error) {
        console.error('Error handling portal access:', error);
        // If error checking session, assume not logged in and prompt
        promptLogin(portalType, config);
    }
}

/**
 * Prompt user to log in or request magic link
 * @param {string} portalType - Type of portal
 * @param {object} config - Portal configuration
 */
function promptLogin(portalType, config) {
    // Store the intended destination
    wixWindow.sessionStorage.setItem('portal_redirect', config.redirectUrl);
    wixWindow.sessionStorage.setItem('portal_type', portalType);

    trackEvent('Portal_Login_Prompt', { portal: portalType });

    // Open login lightbox or redirect to login page
    // Option 1: Use Wix Members login prompt
    authentication.promptLogin({
        mode: 'login',
        modal: true
    })
        .then(() => {
            // After successful login, redirect to portal
            wixLocation.to(config.redirectUrl);
        })
        .catch((error) => {
            if (error.message !== 'User closed the dialog') {
                console.error('Login error:', error);
            }
        });

    // Option 2: Redirect to custom magic link page
    // wixLocation.to(`/request-access?portal=${portalType}`);
}

/**
 * Initialize access code form submission
 */
function initializeAccessCodeForm() {
    const accessCodeInput = $w('#comp-mjrvbswh');
    const submitButton = $w('#comp-mjrvd6m8');

    if (accessCodeInput && submitButton) {
        submitButton.onClick(async () => {
            const accessCode = accessCodeInput.value;

            if (!accessCode || accessCode.trim() === '') {
                // Show error - no access code entered
                wixWindow.openLightbox('error-lightbox', {
                    message: 'Please enter your access code'
                });
                return;
            }

            // Validate access code and redirect
            await validateAccessCode(accessCode.trim());
        });

        // Allow Enter key to submit
        accessCodeInput.onKeyPress((event) => {
            if (event.key === 'Enter') {
                submitButton.click();
            }
        });
    }
}

/**
 * Validate access code and redirect to appropriate portal
 * @param {string} accessCode - The access code entered by user
 */
async function validateAccessCode(accessCode) {
    try {
        // Call backend function to validate access code
        const { validateCode } = await import('backend/accessCodes');

        const result = await validateCode(accessCode);

        if (result.valid) {
            trackEvent('Access_Code_Valid', {
                portal: result.portalType,
                caseId: result.caseId
            });

            // Store case information in session
            wixWindow.sessionStorage.setItem('case_id', result.caseId);
            wixWindow.sessionStorage.setItem('access_code', accessCode);

            // Redirect to appropriate portal
            const redirectUrl = result.redirectUrl || '/members/start-bail';
            wixLocation.to(redirectUrl);
        } else {
            // Invalid access code
            trackEvent('Access_Code_Invalid', { code: accessCode });

            wixWindow.openLightbox('error-lightbox', {
                message: 'Invalid access code. Please check your code and try again, or call (239) 332-2245 for assistance.'
            });
        }
    } catch (error) {
        console.error('Error validating access code:', error);

        wixWindow.openLightbox('error-lightbox', {
            message: 'Unable to validate access code. Please try again or call (239) 332-2245.'
        });
    }
}

/**
 * Check if user has an existing session and redirect if appropriate
 */
async function checkExistingSession() {
    try {
        const isLoggedIn = authentication.loggedIn();

        if (isLoggedIn) {
            // Check if there's a pending redirect
            const pendingRedirect = wixWindow.sessionStorage.getItem('portal_redirect');

            if (pendingRedirect) {
                // Clear the pending redirect
                wixWindow.sessionStorage.removeItem('portal_redirect');
                wixWindow.sessionStorage.removeItem('portal_type');

                // Redirect to the intended portal
                wixLocation.to(pendingRedirect);
            }
        }
    } catch (error) {
        console.error('Error checking existing session:', error);
    }
}

/**
 * Track custom events
 * @param {string} eventName - Name of the event
 * @param {object} eventData - Additional event data
 */
function trackEvent(eventName, eventData) {
    try {
        wixWindow.trackEvent(eventName, eventData);
    } catch (error) {
        console.error('Error tracking event:', error);
    }
}

/**
 * Export functions for testing
 */
export {
    initializePortalButtons,
    handlePortalAccess,
    validateAccessCode,
    checkExistingSession
};
