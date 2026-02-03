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
import { validateCustomSession, getIndemnitorDetails, linkDefendantToCase } from 'backend/portal-auth';
import { submitIntakeForm } from 'backend/intakeQueue.jsw';
import wixSeo from 'wix-seo';
import { getSessionToken, setSessionToken, clearSessionToken } from 'public/session-manager';

// Page state
let currentSession = null;
let indemnitorData = null; // Replaces memberData
let currentIntake = null;
let isSubmitting = false;
let submitHandlerAttached = false;
let eventListenersReady = false;

$w.onReady(async function () {
    // SEO: Prevent Indexing (Protected Page)
    wixSeo.setMetaTags([{ "name": "robots", "content": "noindex, nofollow" }]);

    console.log("🚀 Indemnitor Portal: Page Code Loaded");

    // 0.5 Populate counties on page load (safe to do early)
    await loadCounties();

    // 1. Handle Magic Link Token from URL
    const query = wixLocation.query;
    if (query.st) {
        console.log("🔗 Indemnitor Portal: Found session token in URL, storing...");
        // Wait for storage to ensure it's set before initialization reads it
        await setSessionToken(query.st);
    }

    await initializePage();

    // 2. Setup Listeners AFTER page initialization (when all containers are rendered)
    setupEventListeners();
});

/**
 * Initialize the page
 */
async function initializePage() {
    try {
        // Show loading state
        showLoading(true);

        console.log("🚀 Indemnitor Portal: Initializing...");

        // 2. Custom Authentication Check (ROBUST)
        const sessionToken = getSessionToken();
        console.log("🔍 Session Token Present:", !!sessionToken);

        if (!sessionToken) {
            console.warn("⛔ Indemnitor Portal: No session token found. Redirecting to Landing.");
            wixLocation.to('/portal-landing?auth_error=1');
            return;
        }

        console.log("🔍 Validating Session...");
        let session = null;
        try {
            const validationResult = await validateCustomSession(sessionToken);

            if (validationResult && validationResult.valid) {
                session = validationResult;
            } else if (validationResult && validationResult.reason === 'error') {
                // DATABASE/NETWORK ERROR - DO NOT LOGOUT
                console.error("⚠️ Session validation failed due to network/DB error:", validationResult.message);
                showError("Connection Error. Please check your internet and refresh.");
                showLoading(false);
                return; // Stop loading but don't logout
            } else {
                // DEFINITELY INVALID or EXPIRED
                console.warn("⛔ Indemnitor session invalid/expired. Redirecting.", validationResult);
                clearSessionToken();
                wixLocation.to('/portal-landing?auth_error=1');
                return;
            }
        } catch (err) {
            console.error("❌ Critical error during session validation:", err);
            showError("System Error. Please refresh.");
            showLoading(false);
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

        // Hide loading
        showLoading(false);

    } catch (error) {
        console.error('Page initialization error:', error);
        showError('Error loading page. Please refresh or call (239) 332-2245.');
        showLoading(false);
    }
}

/**
 * Load counties for dropdown
 */
async function loadCounties() {
    try {
        const results = await wixData.query('FloridaCounties')
            .eq('active', true)
            .ascending('countyName')
            .limit(100) // Ensure all 67 counties are loaded
            .find();

        const countyOptions = results.items.map(item => ({
            label: item.countyName,
            value: item.countyName // Using name as value to match backend expectation
        }));

        safeSetOptions('#county', countyOptions);
        safeSetPlaceholder('#county', 'Select County');
    } catch (error) {
        console.error('Error loading counties:', error);

        // Audit Fix: User Feedback & Fallback
        const fallbackCounties = [
            { label: "Lee", value: "Lee" },
            { label: "Collier", value: "Collier" },
            { label: "Charlotte", value: "Charlotte" },
            { label: "Hendry", value: "Hendry" },
            { label: "Glades", value: "Glades" }
        ];
        safeSetOptions('#county', fallbackCounties);
        safeSetPlaceholder('#county', 'Select County (Offline Mode)');
        showError("Network warning: Using offline county list.");
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

    safeShow('#mainContent');
    safeHide('#bondDashboardSection');
}

/**
 * Show bond dashboard with existing intake data
 */
function showBondDashboard() {
    if (!currentIntake) return;

    safeHide('#mainContent');
    safeHide('#groupDefendantLink'); // Also hide the defendant link prompt
    safeShow('#bondDashboardSection');
    safeShow('#bondDashboardSection');

    // Populate defendant status from Intake or Live Data
    safeSetText('#defendantNameDisplay', currentIntake.defendantName || 'Unknown');
    safeSetText('#defendantStatusDisplay', formatStatus(currentIntake.status));
    safeSetText('#lastCheckInDisplay', formatDate(currentIntake._updatedDate));
    safeSetText('#nextCourtDateDisplay', formatDate(currentIntake.nextCourtDate) || 'TBD');

    const paperworkStatus = currentIntake.documentStatus || 'pending';
    safeSetText('#paperworkStatusDisplay', formatDocumentStatus(paperworkStatus));

    // --- Financial Liability Section (Expanded) ---
    // Populate with real data or defaults
    const liability = currentIntake.totalLiability || 0;
    const premium = currentIntake.totalPremium || 0;
    const downPayment = currentIntake.downPayment || 0;
    const chargesCount = currentIntake.chargesCount || 0;

    safeSetText('#textTotalLiability', formatCurrency(liability));
    safeSetText('#textTotalPremium', formatCurrency(premium));
    safeSetText('#textDownPayment', formatCurrency(downPayment));
    safeSetText('#textChargesCount', chargesCount.toString());

    // Check specific specific logic for Balance Due vs. Premium Amount
    // If we have specific balance due, use it, otherwise fallback to premiumAmount (legacy field)
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

/**
 * Format currency
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '$0';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    if (eventListenersReady) return;
    eventListenersReady = true;

    console.log("🔧 setupEventListeners: Starting...");
    
    // DIAGNOSTIC: List all buttons on page
    try {
        const allButtons = $w('Button');
        console.log("📋 All buttons found on page:", allButtons.map(btn => `${btn.id} (${btn.label || btn.text || 'no label'})` ));
    } catch (e) {
        console.warn("Could not enumerate buttons:", e);
    }
    
    // CRITICAL: Attach submit handler once the intake button is actually rendered
    attachSubmitHandler();

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

    // Setup Defendant Link Feature (New)
    setupDefendantLink();
}

function attachSubmitHandler(attempt = 0) {
    if (submitHandlerAttached) return;

    const maxAttempts = 20;
    const delayMs = 250;

    console.log(`🔍 Checking for #btnSubmitInfo... (attempt ${attempt + 1}/${maxAttempts})`);
    if (!safeIsValid('#btnSubmitInfo')) {
        if (attempt + 1 >= maxAttempts) {
            console.error("❌ CRITICAL ERROR: '#btnSubmitInfo' not found on page. Check Element ID in Editor!");
            console.error("   Expected ID: btnSubmitInfo");
            console.error("   Check Wix Editor → Properties Panel → Element ID");
            showError("Development Error: Submit button ID mismatch. Please check console.");
            return;
        }

        setTimeout(() => attachSubmitHandler(attempt + 1), delayMs);
        return;
    }

    console.log("✅ Found #btnSubmitInfo, attaching handler...");
    safeOnClick('#btnSubmitInfo', handleSubmitIntake);
    submitHandlerAttached = true;
    console.log("✅ Submit button handler attached to #btnSubmitInfo");

    // DIAGNOSTIC: Verify handler was attached
    try {
        const btn = $w('#btnSubmitInfo');
        console.log("   Button properties:", {
            id: btn.id,
            label: btn.label,
            enabled: btn.enabled,
            visible: btn.visible,
            collapsed: btn.collapsed
        });
    } catch (e) {
        console.error("   Could not read button properties:", e);
    }
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
    console.log("💆 handleSubmitIntake: Button clicked!");
    console.log("   isSubmitting:", isSubmitting);
    
    if (isSubmitting) {
        console.warn("⚠️ Already submitting, ignoring click");
        return;
    }

    try {
        console.log("🚀 Starting submission process...");
        isSubmitting = true;
        safeDisable('#btnSubmitInfo');
        safeSetText('#btnSubmitInfo', 'Submitting...');
        showLoading(true);

        const validation = validateIntakeForm();
        if (!validation.valid) {
            showError(validation.message);
            return;
        }

        const formData = collectIntakeFormData();

        const result = await submitIntakeForm(formData);

        if (result.success) {
            console.log('✅ Submission successful:', result);
            showLoading(false);

            // DEBUG: Show IDs to user to verify persistence
            // wixWindow.openLightbox('Success', { message: `Case ID: ${result.caseId}` });

            // Collapse the entire form group and show success
            if ($w('#intakeFormGroup').valid) $w('#intakeFormGroup').collapse();
            else if ($w('#groupStep3').valid) $w('#groupStep3').collapse(); // Fallback

            $w('#groupSuccess').expand();

            // Show Case ID in success message
            $w('#textSuccessMessage').text = `Success! Your Case ID is: ${result.caseId}\n\nStand by. Our AI Agent is reviewing your file and will text you in a moment.`;
            console.warn(`CONFIRMATION: Case ID ${result.caseId} created.`);

            wixWindow.scrollTo(0, 0);

            setTimeout(() => {
                wixLocation.to(wixLocation.url);
            }, 5000); // Increased delay to let them see the ID
        } else {
            throw new Error(result.message || 'Submission failed');
        }

    } catch (error) {
        console.error('Submit error:', error);
        showError(error.message || 'Error submitting form.');
    } finally {
        isSubmitting = false;
        safeEnable('#btnSubmitInfo');
        safeSetText('#btnSubmitInfo', 'Submit Info');
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
    if (!safeGetValue('#county')?.trim()) errors.push('County is required');

    // Consent Check
    if ($w('#checkboxConsent').valid && !$w('#checkboxConsent').checked) {
        errors.push('You must agree to the Terms & Conditions.');
    }

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
            signingUrl: currentIntake.signNowIndemnitorLink,
            documentId: currentIntake.signNowDocumentId,
            sessionId: currentSession.sessionToken
        });
    }
}

function handleMakePayment() {
    // Redirect to SwipeSimple Payment Link
    wixLocation.to('https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd');
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
function safeSetOptions(selector, options) { try { if ($w(selector).valid) $w(selector).options = options || []; } catch (e) { } }
function safeSetPlaceholder(selector, text) { try { if ($w(selector).valid) $w(selector).placeholder = text || ''; } catch (e) { } }
function safeIsValid(selector) { try { return $w(selector).valid; } catch (e) { return false; } }
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

// ============================================================================
// DEFENDANT LINKING FEATURE (New Request)
// ============================================================================

/**
 * Setup "Are you the Defendant?" Link Logic
 *
 * ⚠️ UI CONFIGURATION REQUIRED ⚠️
 * You MUST rename your elements in the Wix Editor Layers Panel to match these IDs:
 *
 * 1. The Container Box   => #groupDefendantLink  (Was: group22)
 * 2. Case Number Input   => #inputLinkCaseNumber (Was: input1)
 * 3. Last Name Input     => #inputLinkIndemnitorName (Was: input2)
 * 4. Finding Button      => #btnSubmitLink       (Was: button14)
 *
 * SETTINGS:
 * - Ensure #groupDefendantLink is **NOT** "Collapsed on Load" (Visible by default).
 * - This box will automatically disappear when they start typing in the main form.
 */
function setupDefendantLink() {
    // 1. Auto-Collapse Logic (When user commits to being an Indemnitor)
    // If they start typing in the main form, hide the "Defendant?" question.
    const triggerFields = ['#indemnitorFirstName', '#indemnitorLastName', '#indemnitorPhone'];

    triggerFields.forEach(selector => {
        safeOnInput(selector, () => {
            // Check availability to prevent errors
            if ($w('#groupDefendantLink').valid && !$w('#groupDefendantLink').collapsed) {
                console.log("🙈 Hiding Defendant Link (User is Indemnitor)");
                $w('#groupDefendantLink').collapse();
            }
        });
    });

    // 2. Submit Logic (If they ARE the Defendant)
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
                // Redirect to Defendant Portal with new token
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
