/**
 * Shamrock Bail Bonds - Indemnitor Portal Page
 * 
 * This is the main indemnitor portal where indemnitors:
 * 1. Fill out their information and defendant information
 * 2. Submit intake form to IntakeQueue
 * 3. View bond status, paperwork, and payment information
 * 4. Communicate with Shamrock staff
 * 
 * URL: /portal-indemnitor
 * File: portal-indemnitor.k53on.js
 * 
 * REFACTORED: Uses Custom Session Auth (NO Wix Members) to fix redirect loop
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixData from 'wix-data';
import { validateCustomSession, getIndemnitorDetails } from 'backend/portal-auth';
import { submitIntakeForm } from 'backend/intakeQueue.jsw';
import { getSessionToken, setSessionToken, clearSessionToken } from 'public/session-manager';

// Page state
let currentSession = null;
let indemnitorData = null; // Replaces memberData
let currentIntake = null;
let isSubmitting = false;

$w.onReady(async function () {
    // 1. Handle Magic Link Token from URL
    const query = wixLocation.query;
    if (query.st) {
        console.log("🔗 Indemnitor Portal: Found session token in URL, storing...");
        setSessionToken(query.st);
        // Optional: clear query param to clean URL, but wixLocation doesn't support replaceState easily without reload
    }

    await initializePage();
});

/**
 * Initialize the page
 */
async function initializePage() {
    try {
        // Show loading state
        showLoading(true);

        console.log("🚀 Indemnitor Portal: Initializing...");

        // 2. Custom Authentication Check
        const sessionToken = getSessionToken();
        console.log("🔍 Session Token Present:", !!sessionToken);

        if (!sessionToken) {
            console.warn("⛔ Indemnitor Portal: No session token found. Redirecting to Landing.");
            wixLocation.to('/portal-landing');
            return;
        }

        console.log("🔍 Validating Session...");
        const session = await validateCustomSession(sessionToken);

        if (!session) {
            console.warn("⛔ Indemnitor Portal: Invalid or expired session. Redirecting to Landing.");
            console.warn("Debug: Validation returned null. Token may be expired or not in database.");
            clearSessionToken();
            wixLocation.to('/portal-landing');
            return;
        }

        // Verify Role (Optional but good for security)
        // Note: A user might be both, so we ideally just check if they are allowed here.
        // For now, if they have a valid session, let them in, but we might check session.role === 'indemnitor' if we enforce separation.
        currentSession = session;
        console.log(`✅ Indemnitor Portal: Authenticated as ${session.personId} (${session.role})`);

        // 3. Load Data from Backend
        indemnitorData = await getIndemnitorDetails(sessionToken);
        if (!indemnitorData) {
            console.error("❌ Failed to load indemnitor details");
            showError("Error loading your profile. Please contact support.");
            // fallback?
        }

        // 4. Check for existing intake
        await checkExistingIntake();

        // 5. Setup UI
        if (!currentIntake) {
            setupIntakeForm();
        } else {
            showBondDashboard();
        }

        // 6. Setup Listeners
        setupEventListeners();

        // Hide loading
        showLoading(false);

    } catch (error) {
        console.error('Page initialization error:', error);
        showError('Error loading page. Please refresh or call (239) 332-2245.');
        showLoading(false);
    }
}

/**
 * Check if indemnitor has existing intake submission
 */
async function checkExistingIntake() {
    try {
        // Use email from currentSession or indemnitorData
        const email = currentSession.email || indemnitorData?.email;
        if (!email) return;

        // Look for existing intake
        const results = await wixData.query('IntakeQueue')
            .eq('indemnitorEmail', email)
            .descending('_createdDate')
            .limit(1)
            .find();

        if (results.items.length > 0) {
            currentIntake = results.items[0];
            console.log("✅ Found existing intake:", currentIntake._id);
        }
    } catch (error) {
        console.error('Error checking existing intake:', error);
    }
}

/**
 * Setup intake form with prefilled data
 */
function setupIntakeForm() {
    if (indemnitorData) {
        // Map backend fields to UI
        safeSetValue('#indemnitorFirstName', indemnitorData.firstName);
        safeSetValue('#indemnitorLastName', indemnitorData.lastName);
        safeSetValue('#indemnitorEmail', indemnitorData.email);
        safeSetValue('#indemnitorPhone', indemnitorData.phone);

        // If we have address info from backend (future proofing), set it too
        if (indemnitorData.address) safeSetValue('#indemnitorAddress', indemnitorData.address);
        if (indemnitorData.city) safeSetValue('#indemnitorCity', indemnitorData.city);
        if (indemnitorData.state) safeSetValue('#indemnitorState', indemnitorData.state);
        if (indemnitorData.zip) safeSetValue('#indemnitorZipCode', indemnitorData.zip);
    }

    safeShow('#intakeFormSection');
    safeHide('#bondDashboardSection');
}

/**
 * Show bond dashboard with existing intake data
 */
function showBondDashboard() {
    if (!currentIntake) return;

    safeHide('#intakeFormSection');
    safeShow('#bondDashboardSection');

    // Populate defendant status from Intake or Live Data?
    // Using Intake as primary source for now, but could enhance with live lookup later
    safeSetText('#defendantNameDisplay', currentIntake.defendantName || 'Unknown');
    safeSetText('#defendantStatusDisplay', formatStatus(currentIntake.status));
    safeSetText('#lastCheckInDisplay', formatDate(currentIntake._updatedDate));
    safeSetText('#nextCourtDateDisplay', formatDate(currentIntake.nextCourtDate) || 'TBD');

    const paperworkStatus = currentIntake.documentStatus || 'pending';
    safeSetText('#paperworkStatusDisplay', formatDocumentStatus(paperworkStatus));

    if (paperworkStatus === 'sent_for_signature' && currentIntake.signNowIndemnitorLink) {
        safeShow('#signPaperworkBtn');
        $w('#signPaperworkBtn').link = currentIntake.signNowIndemnitorLink;
    } else {
        safeHide('#signPaperworkBtn');
    }

    if (currentIntake.premiumAmount) {
        safeSetText('#remainingBalanceDisplay', `$${currentIntake.premiumAmount.toFixed(2)}`);
        safeSetText('#paymentTermsDisplay', currentIntake.paymentTerms || '250.00');
        safeSetText('#paymentFrequencyDisplay', currentIntake.paymentFrequency || 'weekly');
        safeSetText('#nextPaymentDateDisplay', formatDate(currentIntake.nextPaymentDate) || 'Jan 8, 2026');
        safeShow('#makePaymentBtn');
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    safeOnClick('#submitInfoBtn', handleSubmitIntake);
    safeOnClick('#signPaperworkBtn', handleSignPaperwork);
    safeOnClick('#makePaymentBtn', handleMakePayment);
    safeOnClick('#sendMessageBtn', handleSendMessage);

    setupPhoneFormatting('#defendantPhone');
    setupPhoneFormatting('#indemnitorPhone');
    setupPhoneFormatting('#reference1Phone');
    setupPhoneFormatting('#reference2Phone');
    setupPhoneFormatting('#indemnitorEmployerPhone');
    setupPhoneFormatting('#indemnitorSupervisorPhone');

    setupZipFormatting('#indemnitorZipCode');
    setupZipFormatting('#reference1Zip');
    setupZipFormatting('#reference2Zip');
    setupZipFormatting('#indemnitorEmployerZip');

    // Logout Button (New for Custom Auth)
    safeOnClick('#logoutBtn', handleLogout);
}

/**
 * Handle Logout
 */
function handleLogout() {
    clearSessionToken();
    wixLocation.to('/portal-landing');
}

/**
 * Handle intake form submission
 */
async function handleSubmitIntake() {
    if (isSubmitting) return;

    try {
        isSubmitting = true;
        safeDisable('#submitInfoBtn');
        safeSetText('#submitInfoBtn', 'Submitting...');
        showLoading(true);

        const validation = validateIntakeForm();
        if (!validation.valid) {
            showError(validation.message);
            return;
        }

        const formData = collectIntakeFormData();

        const result = await submitIntakeForm(formData);

        if (result.success) {
            showSuccess('Your information has been submitted successfully!');
            setTimeout(() => {
                // Refresh page implies re-running onReady which will skip intake form and show dashboard if intake found
                wixLocation.to(wixLocation.url);
            }, 2000);
        } else {
            throw new Error(result.message || 'Submission failed');
        }

    } catch (error) {
        console.error('Submit error:', error);
        showError(error.message || 'Error submitting form.');
    } finally {
        isSubmitting = false;
        safeEnable('#submitInfoBtn');
        safeSetText('#submitInfoBtn', 'Submit Info');
        showLoading(false);
    }
}

/**
 * Validate intake form
 */
function validateIntakeForm() {
    const errors = [];

    if (!safeGetValue('#defendantFirstName')?.trim()) errors.push('Defendant first name is required');
    if (!safeGetValue('#defendantLastName')?.trim()) errors.push('Defendant last name is required');

    if (!safeGetValue('#indemnitorFirstName')?.trim()) errors.push('Your first name is required');
    if (!safeGetValue('#indemnitorLastName')?.trim()) errors.push('Your last name is required');
    if (!safeGetValue('#indemnitorEmail')?.trim()) errors.push('Your email is required');
    if (!safeGetValue('#indemnitorPhone')?.trim()) errors.push('Your phone number is required');
    if (!safeGetValue('#indemnitorAddress')?.trim()) errors.push('Your address is required');
    if (!safeGetValue('#indemnitorCity')?.trim()) errors.push('Your city is required');
    if (!safeGetValue('#indemnitorState')?.trim()) errors.push('Your state is required');
    if (!safeGetValue('#indemnitorZipCode')?.trim()) errors.push('Your zip code is required');

    if (errors.length > 0) {
        return {
            valid: false,
            message: `Please complete required fields:\n${errors.join('\n')}`
        };
    }

    return { valid: true };
}

/**
 * Collect all intake form data
 */
function collectIntakeFormData() {
    return {
        // Defendant Information
        defendantName: `${safeGetValue('#defendantFirstName')} ${safeGetValue('#defendantLastName')}`.trim(),
        defendantFirstName: safeGetValue('#defendantFirstName'),
        defendantLastName: safeGetValue('#defendantLastName'),
        defendantEmail: safeGetValue('#defendantEmail'),
        defendantPhone: safeGetValue('#defendantPhone'),
        defendantBookingNumber: safeGetValue('#defendantBookingNumber'),

        // Indemnitor Information
        indemnitorName: `${safeGetValue('#indemnitorFirstName')} ${safeGetValue('#indemnitorMiddleName')} ${safeGetValue('#indemnitorLastName')}`.replace(/\s+/g, ' ').trim(),
        indemnitorFirstName: safeGetValue('#indemnitorFirstName'),
        indemnitorMiddleName: safeGetValue('#indemnitorMiddleName'),
        indemnitorLastName: safeGetValue('#indemnitorLastName'),
        indemnitorEmail: safeGetValue('#indemnitorEmail'),
        indemnitorPhone: safeGetValue('#indemnitorPhone'),
        indemnitorStreetAddress: safeGetValue('#indemnitorAddress'),
        indemnitorCity: safeGetValue('#indemnitorCity'),
        indemnitorState: safeGetValue('#indemnitorState'),
        indemnitorZipCode: safeGetValue('#indemnitorZipCode'),
        residenceType: safeGetValue('#residenceType'),

        // References
        reference1Name: safeGetValue('#reference1Name'),
        reference1Phone: safeGetValue('#reference1Phone'),
        reference1Address: safeGetValue('#reference1Address'),
        reference1City: safeGetValue('#reference1City'),
        reference1State: safeGetValue('#reference1State'),
        reference1Zip: safeGetValue('#reference1Zip'),

        reference2Name: safeGetValue('#reference2Name'),
        reference2Phone: safeGetValue('#reference2Phone'),
        reference2Address: safeGetValue('#reference2Address'),
        reference2City: safeGetValue('#reference2City'),
        reference2State: safeGetValue('#reference2State'),
        reference2Zip: safeGetValue('#reference2Zip'),

        // Employment
        indemnitorEmployer: safeGetValue('#indemnitorEmployerName'),
        indemnitorEmployerCity: safeGetValue('#indemnitorEmployerCity'),
        indemnitorEmployerState: safeGetValue('#indemnitorEmployerState'),
        indemnitorEmployerZip: safeGetValue('#indemnitorEmployerZip'),
        indemnitorEmployerPhone: safeGetValue('#indemnitorEmployerPhone'),
        indemnitorSupervisorName: safeGetValue('#indemnitorSupervisorName'),
        indemnitorSupervisorPhone: safeGetValue('#indemnitorSupervisorPhone'),

        // Jail/County
        county: safeGetValue('#county'),
        jailFacility: safeGetValue('#jailFacility'),

        // Metadata - Updated to use Custom Session ID
        submittedBy: currentSession?.personId,
        submittedByEmail: currentSession?.email,
        submittedAt: new Date().toISOString()
    };
}

function handleSignPaperwork() {
    if (currentIntake?.signNowIndemnitorLink) {
        wixWindow.openLightbox('signing-lightbox', {
            signNowUrl: currentIntake.signNowIndemnitorLink
        });
    }
}

function handleMakePayment() {
    wixWindow.openLightbox('payment-lightbox', {
        caseId: currentIntake?.caseId,
        amount: currentIntake?.premiumAmount
    });
}

async function handleSendMessage() {
    const message = safeGetValue('#messageInput');

    if (!message?.trim()) {
        showError('Please enter a message');
        return;
    }

    try {
        await wixData.insert('Messages', {
            caseId: currentIntake?.caseId,
            fromEmail: currentSession?.email, // Use session email
            message: message,
            timestamp: new Date()
        });

        safeSetValue('#messageInput', '');
        showSuccess('Message sent! We\'ll respond shortly.');

    } catch (error) {
        console.error('Error sending message:', error);
        showError('Error sending message.');
    }
}

function setupPhoneFormatting(selector) {
    safeOnInput(selector, () => {
        let value = (safeGetValue(selector) || '').replace(/\D/g, '');
        if (value.length > 10) value = value.substring(0, 10);

        if (value.length >= 6) {
            value = `(${value.substring(0, 3)}) ${value.substring(3, 6)}-${value.substring(6)}`;
        } else if (value.length >= 3) {
            value = `(${value.substring(0, 3)}) ${value.substring(3)}`;
        }

        safeSetValue(selector, value);
    });
}

function setupZipFormatting(selector) {
    safeOnInput(selector, () => {
        let value = (safeGetValue(selector) || '').replace(/\D/g, '');
        if (value.length > 5) value = value.substring(0, 5);
        safeSetValue(selector, value);
    });
}

function formatStatus(status) {
    const statusMap = {
        'intake': 'Pending Review',
        'in_progress': 'In Progress',
        'ready_for_documents': 'Preparing Documents',
        'awaiting_signatures': 'Awaiting Signatures',
        'completed': 'Active Bond',
        'discharged': 'Discharged'
    };
    return statusMap[status] || 'Unknown';
}

function formatDocumentStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'sent_for_signature': 'Pending Signature(s)',
        'completed': 'Signed',
        'filed': 'Filed'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return null;
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    } catch (error) { return null; }
}

function showLoading(show) {
    if (show) safeShow('#loadingSpinner');
    else safeHide('#loadingSpinner');
}

function showError(message) {
    safeSetText('#errorMessage', message);
    safeShow('#errorMessage');
    safeHide('#successMessage');
    setTimeout(() => safeHide('#errorMessage'), 5000);
}

function showSuccess(message) {
    safeSetText('#successMessage', message);
    safeShow('#successMessage');
    safeHide('#errorMessage');
    setTimeout(() => safeHide('#successMessage'), 5000);
}

// SAFE WRAPPERS
function safeSetValue(selector, value) { try { if ($w(selector).valid) $w(selector).value = value || ''; } catch (e) { } }
function safeGetValue(selector) { try { return $w(selector).valid ? $w(selector).value : ''; } catch (e) { return ''; } }
function safeSetText(selector, text) { try { if ($w(selector).valid) $w(selector).text = text || ''; } catch (e) { } }
function safeShow(selector) { try { if ($w(selector).valid) $w(selector).show(); } catch (e) { } }
function safeHide(selector) { try { if ($w(selector).valid) $w(selector).hide(); } catch (e) { } }
function safeDisable(selector) { try { if ($w(selector).valid) $w(selector).disable(); } catch (e) { } }
function safeEnable(selector) { try { if ($w(selector).valid) $w(selector).enable(); } catch (e) { } }
function safeOnClick(selector, handler) { try { if ($w(selector).valid) $w(selector).onClick(handler); } catch (e) { } }
function safeOnInput(selector, handler) { try { if ($w(selector).valid) $w(selector).onInput(handler); } catch (e) { } }

export {
    initializePage,
    handleSubmitIntake,
    validateIntakeForm,
    collectIntakeFormData
};
