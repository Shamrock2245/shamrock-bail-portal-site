/**
 * Shamrock Bail Bonds - Indemnitor Portal Page
 * 
 * This is the main indemnitor portal where indemnitors:
 * 1. Fill out their information via the embedded Wizard Form (#indemnitorWizard)
 * 2. Submit intake form to IntakeQueue (handled by wizard → GAS direct)
 * 3. View bond status, paperwork, and payment information
 * 4. Communicate with Shamrock staff
 * 
 * URL: /portal-indemnitor
 * File: portal-indemnitor.k53on.js
 * 
 * REFACTORED: March 2026 — Replaced native Wix form with embedded HTML wizard.
 * All form collection, validation, input masking, and submission now happen
 * inside the wizard Custom Element. This page code handles:
 *   - Session authentication (magic link flow)
 *   - Wizard ↔ Page postMessage bridge
 *   - Bond Dashboard for returning users
 *   - Choice Screen (Resume vs New)
 *   - Messaging, payments, paperwork buttons
 *   - Defendant link feature
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixData from 'wix-data';
import { validateCustomSession, getIndemnitorDetails, linkDefendantToCase } from 'backend/portal-auth';
import { callGasAction } from 'backend/gasIntegration';
import { sendInAppNotification } from 'backend/notificationService';
import wixSeo from 'wix-seo';
import wixAnimations from 'wix-animations';
import { getSessionToken, setSessionToken, clearSessionToken } from 'public/session-manager';

// Page state
let currentSession = null;
let indemnitorData = null;
let currentIntake = null;
let eventListenersReady = false;

$w.onReady(async function () {
    // SEO: Prevent Indexing (Protected Page)
    wixSeo.setMetaTags([{ "name": "robots", "content": "noindex, nofollow" }]);

    console.log(" Indemnitor Portal: Page Code Loaded");

    // 1. Handle Magic Link Token from URL
    // SAFETY NET: Magic links should land on /portal-landing first.
    // If a raw ?token= somehow arrives here, redirect to portal-landing.
    const query = wixLocation.query;
    if (query.token && wixWindow.rendering.env === 'browser') {
        console.log(" Indemnitor Portal: Raw magic link token detected -- bouncing to portal-landing...");
        wixLocation.to(`/portal-landing?token=${encodeURIComponent(query.token)}`);
        return;
    } else if (query.st && wixWindow.rendering.env === 'browser') {
        console.log(" Indemnitor Portal: Found session token in URL, storing...");
        await setSessionToken(query.st);
        wixLocation.queryParams.remove(['st']);
    }

    await initializePage();

    // 2. Setup Listeners AFTER page initialization
    setupEventListeners();
});

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

async function initializePage() {
    try {
        showLoading(true);
        console.log(" Indemnitor Portal: Initializing...");

        // Custom Authentication Check
        const sessionToken = getSessionToken();
        console.log(" Session Token Present:", !!sessionToken);

        if (!sessionToken) {
            console.warn(" Indemnitor Portal: No session token found. Redirecting to Landing.");
            wixLocation.to('/portal-landing?auth_error=1');
            return;
        }

        console.log(" Validating Session...");
        let session = null;
        try {
            const validationResult = await validateCustomSession(sessionToken);

            if (validationResult && validationResult.valid) {
                session = validationResult;
            } else if (validationResult && validationResult.reason === 'error') {
                console.error("[!] Session validation failed due to network/DB error:", validationResult.message);
                showError("Connection Error. Please check your internet and refresh.");
                showLoading(false);
                return;
            } else {
                console.warn(" Indemnitor session invalid/expired. Redirecting.", validationResult);
                clearSessionToken();
                wixLocation.to('/portal-landing?auth_error=1');
                return;
            }
        } catch (err) {
            console.error("[X] Critical error during session validation:", err);
            showError("System Error. Please refresh.");
            showLoading(false);
            return;
        }

        currentSession = session;
        console.log(`[OK] Indemnitor Portal: Authenticated as ${session.personId} (${session.role})`);

        // Load Data from Backend
        indemnitorData = await getIndemnitorDetails(sessionToken);
        if (!indemnitorData) {
            console.error("[X] Failed to load indemnitor details");
            showError("Error loading your profile. Please contact support.");
        }

        // Check for existing intake
        await checkExistingIntake();

        // Setup UI based on state
        if (!currentIntake) {
            console.log(" No existing intake found. Showing wizard.");
            showWizard();
        } else {
            console.log(" Existing intake found. Checking for Choice UI...");
            try {
                const boxChoice = $w('#boxChoice');
                if (boxChoice && boxChoice.id) {
                    setupChoiceScreen();
                } else {
                    throw new Error('not found');
                }
            } catch (_) {
                console.log("[!] #boxChoice not found. Defaulting to Dashboard.");
                showBondDashboard();
            }
        }

        showLoading(false);

    } catch (error) {
        console.error('Page initialization error:', error);
        showError('Error loading page. Please refresh or call (239) 332-2245.');
        showLoading(false);
    }
}

// ============================================================================
// WIZARD IFRAME BRIDGE
// ============================================================================

/**
 * Show the wizard Custom Element and send prefill data
 */
function showWizard() {
    safeShow('#indemnitorWizard');
    safeHide('#bondDashboardSection');

    // Send session context to wizard for auto-prefill
    sendContextToWizard();
}

/**
 * Send indemnitor session data to the wizard iframe for prefill
 */
function sendContextToWizard() {
    if (!indemnitorData) return;

    // Small delay to let iframe load
    setTimeout(() => {
        try {
            /** @type {any} */ ($w('#indemnitorWizard')).postMessage({
                type: 'prefill',
                data: {
                    firstName: indemnitorData.firstName || '',
                    lastName: indemnitorData.lastName || '',
                    email: indemnitorData.email || '',
                    phone: indemnitorData.phone || '',
                    address: indemnitorData.address || '',
                    city: indemnitorData.city || '',
                    state: indemnitorData.state || '',
                    zip: indemnitorData.zip || '',
                    sessionToken: getSessionToken()
                }
            });
            console.log("[OK] Sent prefill data to wizard");
        } catch (e) {
            console.warn("[!] Could not send prefill to wizard:", e.message);
        }
    }, 1500);
}

/**
 * Setup listener for messages FROM the wizard iframe
 */
function setupWizardListener() {
    try {
        /** @type {any} */ ($w('#indemnitorWizard')).onMessage((event) => {
            const msg = event.data;
            if (!msg || !msg.type) return;

            console.log(" Wizard message received:", msg.type);

            switch (msg.type) {
                case 'shamrock-form-submitted':
                    console.log('[OK] Wizard form submitted successfully');
                    handleWizardSubmission(msg.data);
                    break;

                case 'shamrock-form-error':
                    console.error('[X] Wizard submission error:', msg.error);
                    showError('Form submission error. Please try again or call (239) 332-2245.');
                    break;

                case 'wizard-ready':
                    console.log('[OK] Wizard iframe ready, sending prefill...');
                    sendContextToWizard();
                    break;

                default:
                    break;
            }
        });
        console.log("[OK] Wizard message listener attached");
    } catch (e) {
        console.warn("[!] Could not attach wizard listener:", e.message);
    }
}

/**
 * Handle successful form submission from the wizard
 */
function handleWizardSubmission(data) {
    // Show success state
    safeHide('#indemnitorWizard');
    safeShow('#groupSuccess');

    const caseId = data?.caseId || 'Pending';
    const successMsg = ` Success! Your Case ID is: ${caseId}\n\n` +
        `Stand by. Our AI agent is reviewing your file and will email you the completed SignNow documents to review and sign shortly.\n\n` +
        ` Next Steps:\n` +
        `If you know the premium due, please feel free to pay your defendant's bond securely using our payment page.\n\n` +
        `Redirecting to our secure payment portal...`;

    safeSetText('#textSuccessMessage', successMsg);
    wixWindow.scrollTo(0, 0);

    setTimeout(() => {
        console.log(" Redirecting to payments page ->");
        wixLocation.to('/payments');
    }, 10000);
}

// ============================================================================
// EXISTING INTAKE CHECK
// ============================================================================

async function checkExistingIntake() {
    try {
        const email = currentSession.email || indemnitorData?.email;
        if (!email) return;

        const results = await wixData.query('IntakeQueue')
            .eq('indemnitorEmail', email)
            .descending('_createdDate')
            .limit(1)
            .find();

        if (results.items.length > 0) {
            currentIntake = results.items[0];
            console.log("[OK] Found existing intake:", currentIntake._id);
        }
    } catch (error) {
        console.error('Error checking existing intake:', error);
    }
}

// ============================================================================
// BOND DASHBOARD (Returning Users)
// ============================================================================

function showBondDashboard() {
    if (!currentIntake) return;

    safeHide('#indemnitorWizard');
    safeHide('#groupDefendantLink');
    safeShow('#bondDashboardSection');

    // Populate defendant status
    safeSetText('#defendantNameDisplay', currentIntake.defendantName || 'Unknown');
    safeSetText('#defendantStatusDisplay', formatStatus(currentIntake.status));
    safeSetText('#lastCheckInDisplay', formatDate(currentIntake._updatedDate));
    safeSetText('#nextCourtDateDisplay', formatDate(currentIntake.nextCourtDate) || 'TBD');

    const paperworkStatus = currentIntake.documentStatus || 'pending';
    safeSetText('#paperworkStatusDisplay', formatDocumentStatus(paperworkStatus));

    // Financial Liability Section
    const liability = currentIntake.totalLiability || 0;
    const premium = currentIntake.totalPremium || 0;
    const downPayment = currentIntake.downPayment || 0;
    const chargesCount = currentIntake.chargesCount || 0;

    safeSetText('#textTotalLiability', formatCurrency(liability));
    safeSetText('#textTotalPremium', formatCurrency(premium));
    safeSetText('#textDownPayment', formatCurrency(downPayment));
    safeSetText('#textChargesCount', chargesCount.toString());

    const balanceDue = currentIntake.balanceDue !== undefined ? currentIntake.balanceDue : currentIntake.premiumAmount;

    if (balanceDue !== undefined) {
        safeSetText('#remainingBalanceDisplay', formatCurrency(balanceDue));
        safeSetText('#paymentTermsDisplay', currentIntake.paymentTerms || 'TBD');
        safeSetText('#paymentFrequencyDisplay', currentIntake.paymentFrequency || 'Contact Office');
        safeSetText('#nextPaymentDateDisplay', formatDate(currentIntake.nextPaymentDate) || 'TBD');
        safeShow('#makePaymentBtn');
    }

    if (paperworkStatus === 'sent_for_signature' && currentIntake.signNowIndemnitorLink) {
        safeShow('#signPaperworkBtn');
    } else {
        safeHide('#signPaperworkBtn');
    }
}

// ============================================================================
// CHOICE SCREEN (Resume vs New)
// ============================================================================

function setupChoiceScreen() {
    safeHide('#indemnitorWizard');
    safeHide('#bondDashboardSection');
    safeShow('#boxChoice');

    const firstName = indemnitorData?.firstName || 'Back';
    safeSetText('#textWelcomeChoice', `Welcome ${firstName}`);

    const defName = currentIntake.defendantName || 'Unknown Defendant';
    safeSetText('#textExistingInfo', `You have an active bond started for ${defName}.`);

    animateChoiceScreen();
}

function animateChoiceScreen() {
    try {
        const box = $w('#boxChoice');
        const content = [$w('#textWelcomeChoice'), $w('#textExistingInfo'), $w('#btnResumeBond'), $w('#btnStartNewBond')];

        const timeline = wixAnimations.timeline();

        timeline.add(box, { "scale": 0.95, "opacity": 0, "duration": 0 })
            .add(content, { "y": 10, "opacity": 0, "duration": 0 });

        timeline.add(box, {
            "scale": 1, "opacity": 1, "duration": 500, "easing": "easeOutBack"
        }).add(content, {
            "y": 0, "opacity": 1, "duration": 400, "easing": "easeOutQuad"
        }, 100);

        timeline.play();
    } catch (e) {
        console.warn("Animation error:", e);
    }
}

function handleStartNewBond() {
    console.log(" Starting New Bond...");
    currentIntake = null;
    safeHide('#boxChoice');
    showWizard();
}

function handleResumeBond() {
    console.log(" Resuming Existing Bond...");
    safeHide('#boxChoice');
    showBondDashboard();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    if (eventListenersReady) return;
    eventListenersReady = true;

    // Wizard iframe bridge
    setupWizardListener();

    // Dashboard buttons
    safeOnClick('#signPaperworkBtn', handleSignPaperwork);
    safeOnClick('#makePaymentBtn', handleMakePayment);
    safeOnClick('#sendMessageBtn', handleSendMessage);

    // Logout
    safeOnClick('#logoutBtn', handleLogout);

    // Communication Preferences
    safeOnClick('#btnCommPrefs', () => {
        wixLocation.to('/communication-preferences');
    });

    // Choice Screen Buttons
    safeOnClick('#btnResumeBond', handleResumeBond);
    safeOnClick('#btnStartNewBond', handleStartNewBond);

    // Defendant Link Feature
    setupDefendantLink();
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

function handleLogout() {
    clearSessionToken();
    wixLocation.to('/portal-landing');
}

function handleSignPaperwork() {
    if (currentIntake?.signNowIndemnitorLink) {
        wixLocation.to(currentIntake.signNowIndemnitorLink);
    }
}

function handleMakePayment() {
    wixLocation.to('/payments');
}

async function handleSendMessage() {
    const message = safeGetValue('#messageInput');
    if (!message?.trim()) {
        showError('Please enter a message');
        return;
    }

    try {
        safeDisable('#sendMessageBtn');

        const caseId = currentSession?.caseId || indemnitorData?.caseId || null;
        const senderName = (
            (indemnitorData?.indemnitorFirstName || indemnitorData?.firstName || '') + ' ' +
            (indemnitorData?.indemnitorLastName || indemnitorData?.lastName || '')
        ).trim() || currentSession?.name || 'Indemnitor';

        // Notify GAS -- logs to Sheets + triggers Slack alert to staff
        await callGasAction('portalClientMessage', {
            caseId: caseId,
            senderName: senderName,
            senderEmail: currentSession?.email || '',
            message: message.trim(),
            source: 'indemnitor_portal',
            timestamp: new Date().toISOString()
        });

        // Store in-app notification for staff dashboard
        if (caseId) {
            await sendInAppNotification(
                'staff',
                `Message from ${senderName}`,
                message.trim(),
                'client_message',
                `/portal-staff?caseId=${caseId}`
            );
        }

        // Clear input and confirm
        if (/** @type {any} */ ($w('#messageInput')).type === '$w.TextInput') {
            /** @type {any} */ ($w('#messageInput')).value = '';
        }
        showSuccess('Message sent! Our team will respond shortly.');

    } catch (e) {
        console.error('Message Error', e);
        showError('Could not send message. Please call us at (239) 332-2245.');
    } finally {
        safeEnable('#sendMessageBtn');
    }
}

// ============================================================================
// DEFENDANT LINKING FEATURE
// ============================================================================

function setupDefendantLink() {
    // Auto-collapse if user interacts with wizard (they're an indemnitor, not defendant)
    // The wizard handles form interaction, so we just collapse on page load if wizard is active
    // Manual collapse handled by the "Find My Paperwork" button below

    safeOnClick('#btnSubmitLink', async () => {
        const caseNum = safeGetValue('#inputLinkCaseNumber')?.trim();
        const indemName = safeGetValue('#inputLinkIndemnitorName')?.trim();

        if (!caseNum && !indemName) {
            showError("Please enter either a Case Number OR Indemnitor's Last Name.");
            return;
        }

        safeSetText('#btnSubmitLink', 'Searching...');
        safeDisable('#btnSubmitLink');

        try {
            const result = await linkDefendantToCase(caseNum, indemName);

            if (result.success && result.sessionToken) {
                showSuccess(result.message);
                await setSessionToken(result.sessionToken);
                wixLocation.to(`/portal-defendant?st=${encodeURIComponent(result.sessionToken)}&autoPaperwork=1`);
            } else {
                showError(result.message || 'Could not find case. Check details.');
                safeSetText('#btnSubmitLink', 'Find My Paperwork');
                safeEnable('#btnSubmitLink');
            }
        } catch (e) {
            console.error(e);
            showError("System Error.");
            safeEnable('#btnSubmitLink');
        }
    });
}

// ============================================================================
// UTILITIES
// ============================================================================

function safeGetValue(selector) {
    try {
        const el = $w(selector);
        if (!el) return null;
        if (el.type === '$w.TextInput' || el.type === '$w.TextBox') return el.value;
        if (el.type === '$w.Dropdown') return el.value;
        if (el.type === '$w.AddressInput') return el.value ? el.value.formatted : '';
        if (el.value !== undefined) return el.value;
        return null;
    } catch (e) {
        return null;
    }
}

function safeSetText(selector, text) {
    try { $w(selector).text = text || ''; } catch (e) { }
}

function safeShow(selector) {
    try { $w(selector).expand().then(() => $w(selector).show()); } catch (e) { }
}

function safeHide(selector) {
    try { $w(selector).hide().then(() => $w(selector).collapse()); } catch (e) { }
}

function safeEnable(selector) {
    try { $w(selector).enable(); } catch (e) { }
}

function safeDisable(selector) {
    try { $w(selector).disable(); } catch (e) { }
}

function safeOnClick(selector, handler) {
    try { $w(selector).onClick(handler); } catch (e) { }
}

function showLoading(show) {
    if (show) safeShow('#loadingIndicator');
    else safeHide('#loadingIndicator');
}

function showError(msg) {
    safeSetText('#errorMessage', msg);
    safeShow('#errorGroup');
    setTimeout(() => safeHide('#errorGroup'), 5000);
}

function showSuccess(msg) {
    try {
        if (/** @type {any} */ ($w('#textSuccessMessage')).id) /** @type {any} */ ($w('#textSuccessMessage')).text = msg;
        safeShow('#groupSuccess');
        safeHide('#errorGroup');
        setTimeout(() => safeHide('#groupSuccess'), 5000);
    } catch (e) {
        safeSetText('#successMessage', msg);
        safeShow('#successMessage');
        safeHide('#errorMessage');
        setTimeout(() => safeHide('#successMessage'), 5000);
    }
}

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending Review',
        'ready_for_documents': 'Preparing Documents',
        'awaiting_signatures': 'Awaiting Signatures',
        'completed': 'Active Bond',
        'discharged': 'Discharged'
    };
    return statusMap[status] || (status ? status.replace(/_/g, ' ').toUpperCase() : 'Unknown');
}

function formatDocumentStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'sent_for_signature': 'Pending Signature(s)',
        'completed': 'Signed',
        'filed': 'Filed'
    };
    return statusMap[status] || (status ? status.replace(/_/g, ' ').toUpperCase() : 'Pending');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    } catch (e) { return ''; }
}
