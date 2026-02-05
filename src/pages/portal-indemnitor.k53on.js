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
 * 
 * FIX: Moved attachSubmitHandler() to be called AFTER setupIntakeForm() to ensure
 * the button is in the DOM and visible before trying to attach the handler.
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
let activeSubmitBtnId = '#btnSubmitForm'; // Default, will be auto-detected

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
            // FIX: Attach submit handler AFTER setupIntakeForm() completes
            // This ensures #mainContent is shown and the button is in the DOM
            setTimeout(() => attachSubmitHandler(), 100);
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
        currency: 'USD'
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
        console.log("📋 All buttons found on page:", allButtons.map(btn => `${btn.id} (${btn.label || btn.text || 'no label'})`));
    } catch (e) {
        console.warn("Could not enumerate buttons:", e);
    }

    // NOTE: attachSubmitHandler() is now called from setupIntakeForm() with a delay
    // This ensures the button is in the DOM before we try to attach the handler

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
    const delayMs = 500; // Increased delay for stability

    // AGGRESSIVE ID DISCOVERY
    const candidateIds = ['#btnSubmitPortal', '#btnSubmitInfo', '#btnSubmitForm', '#button1', '#submitBtn'];

    // Find the first valid one
    for (const id of candidateIds) {
        // Just Try To Bind Everything (Brute Force)
        try {
            $w(id).onClick(handleSubmitIntake);
            if ($w(id).valid) {
                activeSubmitBtnId = id;
                console.log(`✅ Bound to ${id} (valid=true)`);
                break; // Found the Winner
            } else {
                console.log(`⚠️ Bound to ${id} (valid=false) - trying anyway`);
            }
        } catch (e) {
            // Ignore
        }
    }

    if (!activeSubmitBtnId) {
        if (attempt + 1 >= maxAttempts) {
            console.error(`❌ CRITICAL UI ERROR: No VALID submit button found. Checked: ${candidateIds.join(', ')}`);
            // Don't show confusing error to user if the brute force binding worked silently
            // Just warn in console.
            return;
        }

        setTimeout(() => attachSubmitHandler(attempt + 1), delayMs);
        return;
    }

    // Force enable and show
    try {
        const btn = $w(activeSubmitBtnId);
        if (btn.collapsed) btn.expand();
        if (btn.hidden) btn.show();
        if (typeof btn.enable === 'function') {
            if (!btn.enabled) btn.enable();
        }
    } catch (e) {
        console.warn(`⚠️ Could not modify button visibility: ${e.message}`);
    }

    submitHandlerAttached = true;
    console.log(`✅ Submit handler fully attached to ${activeSubmitBtnId}`);
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
        safeDisable(activeSubmitBtnId);
        safeSetText(activeSubmitBtnId, 'Submitting...');
        showLoading(true);

        const validation = validateIntakeForm();
        if (!validation.valid) {
            console.warn("⚠️ Validation failed:", validation.message);
            showError(validation.message);
            isSubmitting = false; // Re-enable immediately
            safeEnable(activeSubmitBtnId);
            safeSetText(activeSubmitBtnId, 'Submit Info');
            showLoading(false);
            return;
        }

        const formData = collectIntakeFormData();
        console.log("📦 Payload prepared:", JSON.stringify(formData, null, 2));

        const result = await submitIntakeForm(formData);
        console.log("📡 Backend response:", result);

        if (result.success) {
            console.log('✅ Submission successful:', result);
            showLoading(false);

            // Use safe wrappers to prevent "is not a function" errors
            safeHide('#intakeFormGroup');
            safeHide('#groupStep3');
            safeShow('#groupSuccess');

            safeSetText('#textSuccessMessage', `Success! Your Case ID is: ${result.caseId}\n\nStand by. Our AI Agent is reviewing your file and will text you in a moment.`);

            wixWindow.scrollTo(0, 0);

            setTimeout(() => {
                const redirectUrl = wixLocation.url; // Reload same page to trigger dashboard view
                console.log("🔄 Reloading page ->", redirectUrl);
                wixLocation.to(redirectUrl);
            }, 5000);
        } else {
            throw new Error(result.message || 'Submission failed');
        }

    } catch (error) {
        console.error('❌ Submit error stack:', error.stack);
        showError(error.message || 'Error submitting form.');
    } finally {
        isSubmitting = false;
        if (activeSubmitBtnId && $w(activeSubmitBtnId).valid) {
            safeEnable(activeSubmitBtnId);
            safeSetText(activeSubmitBtnId, 'Submit Info');
        }
        showLoading(false);
    }
}

/**
 * EXPORTED HANDLERS (Fallback for Editor Wiring)
 * If dynamic attachment fails, user can wire 'onClick' in editor.
 */
export function btnSubmitPortal_click(event) {
    if (!activeSubmitBtnId) activeSubmitBtnId = '#btnSubmitPortal';
    handleSubmitIntake();
}

export function btnSubmitInfo_click(event) {
    if (!activeSubmitBtnId) activeSubmitBtnId = '#btnSubmitInfo';
    handleSubmitIntake();
}

/**
 * FIELD MAPPING CONFIGURATION
 * Maps logical data points to lists of potential UI Element IDs.
 * The system will check each ID in order until it finds a value.
 */
const FIELD_MAP = {
    // Defendant
    // User Provided: inputDefendantName, inputDefendantPhone, inputDefendantEmail
    defendantFirst: ['#inputDefendantFirstName', '#defendantFirstName', '#defFirstName', '#firstName', '#input1'],
    defendantLast: ['#inputDefendantLastName', '#defendantLastName', '#defLastName', '#lastName', '#input2'],
    defendantFull: ['#inputDefendantName', '#defendantName', '#defName', '#defendantFullName', '#inputName'],
    defendantPhone: ['#inputDefendantPhone', '#defendantPhone', '#defPhone', '#inputPhoneIndemnitor', '#input3'],
    defendantEmail: ['#inputDefendantEmail', '#defendantEmail', '#defEmail', '#inputEmailIndemnitor', '#input4'],

    // Indemnitor
    // User Provided: inputIndemnitorName, inputIndemnitorEmail
    indemnitorFirst: ['#inputIndemnitorFirstName', '#indemnitorFirstName', '#indemFirstName', '#firstName1', '#input5'],
    indemnitorLast: ['#inputIndemnitorLastName', '#indemnitorLastName', '#indemLastName', '#lastName1', '#input6'],
    indemnitorFull: ['#inputIndemnitorName', '#indemnitorName', '#indemName', '#indemnitorFullName'],
    indemnitorEmail: ['#inputIndemnitorEmail', '#indemnitorEmail', '#indemEmail', '#email1'],
    indemnitorPhone: ['#inputIndemnitorPhone', '#indemnitorPhone', '#indemPhone', '#phone1'],

    // Address (Special Handling for AddressInputs)
    indemnitorAddress: ['#inputIndemnitorAddress', '#indemnitorAddress', '#indemnitorStreetAddress', '#addressInput1', '#address1'],
    indemnitorCity: ['#inputIndemnitorCity', '#indemnitorCity', '#indemCity', '#city1', '#inputCity'],
    indemnitorState: ['#inputIndemnitorState', '#indemnitorState', '#indemState', '#state1', '#inputState'],
    indemnitorZip: ['#inputIndemnitorZip', '#inputIndemnitorZipCode', '#indemnitorZipCode', '#indemnitorZip', '#indemZip', '#zip1'],
    residenceType: ['#inputIndemnitorResidenceType', '#residenceType'],

    // County
    county: ['#county', '#countyDropdown', '#dropdownCounty', '#dropdown1'],

    // Emp / Refs (Adding generic fallbacks just in case)
    employerName: ['#inputIndemnitorEmployerName', '#indemnitorEmployerName'],
    employerAddress: ['#inputIndemnitorEmployerAddress', '#indemnitorEmployerAddress'],
    employerCity: ['#inputIndemnitorEmployerCity', '#indemnitorEmployerCity'],
    employerState: ['#inputIndemnitorEmployerState', '#indemnitorEmployerState'],
    employerZip: ['#inputIndemnitorEmployerZip', '#indemnitorEmployerZip'],
    employerPhone: ['#inputIndemnitorEmployerPhone', '#indemnitorEmployerPhone'],
    supervisorName: ['#inputIndemnitorSupervisorName', '#indemnitorSupervisorName'],
    supervisorPhone: ['#inputIndemnitorSupervisorPhone', '#indemnitorSupervisorPhone'],

    ref1Name: ['#inputRef1Name', '#reference1Name', '#ref1Name'],
    ref1Phone: ['#inputRef1Phone', '#reference1Phone', '#ref1Phone'],
    ref1Address: ['#inputRef1Address', '#reference1Address', '#ref1Address'],
    ref1City: ['#inputRef1City', '#reference1City'],
    ref1State: ['#inputRef1State', '#reference1State'],
    ref1Zip: ['#inputRef1Zip', '#reference1Zip', '#ref1Zip'],

    ref2Name: ['#inputRef2Name', '#reference2Name', '#ref2Name'],
    ref2Phone: ['#inputRef2Phone', '#reference2Phone', '#ref2Phone'],
    ref2Address: ['#inputRef2Address', '#reference2Address', '#ref2Address'],
    ref2City: ['#inputRef2City', '#reference2City'],
    ref2State: ['#inputRef2State', '#reference2State'],
    ref2Zip: ['#inputRef2Zip', '#reference2Zip', '#ref2Zip'],

    consent: ['#checkboxConsent', '#consentCheckbox', '#checkbox1']
};

/**
 * Resolver Helper
 * Checks array of element IDs and returns the first non-empty value found.
 */
function resolveFieldValue(fieldKey) {
    const candidates = FIELD_MAP[fieldKey] || [];
    for (const selector of candidates) {
        const val = safeGetValue(selector);
        if (val && typeof val === 'string' && val.trim().length > 0) {
            return { value: val, source: selector }; // Return value and where we found it
        }
        if (val && typeof val !== 'string') { // Checkbox or object
            return { value: val, source: selector };
        }
    }
    return { value: null, source: null };
}

/**
 * Debugging Tool
 * Logs what the form "sees" to help identify ID mismatches.
 */
function debugFormState() {
    console.log("🕵️‍♂️ STARTING FORM DIAGNOSTIC 🕵️‍♂️");
    const report = {};
    Object.keys(FIELD_MAP).forEach(key => {
        const res = resolveFieldValue(key);
        report[key] = res.source ? `✅ Found in ${res.source} ("${String(res.value).substring(0, 15)}...")` : `❌ NOT FOUND (Checked: ${FIELD_MAP[key].join(', ')})`;
    });
    console.log(JSON.stringify(report, null, 2));
    console.log("🕵️‍♂️ END DIAGNOSTIC 🕵️‍♂️");
}

/**
 * Validation intake form
 * 2026 UPDATE: Uses FIELD_MAP Resolution
 */
function validateIntakeForm() {
    debugFormState(); // Run diagnostic on every attempt

    const errors = [];

    // Defendant Name
    const defFirst = resolveFieldValue('defendantFirst').value;
    const defLast = resolveFieldValue('defendantLast').value;
    const defFull = resolveFieldValue('defendantFull').value;

    if ((!defFirst || !defLast) && !defFull) {
        errors.push('Defendant Name is required');
    }

    // Indemnitor Name
    const indemFirst = resolveFieldValue('indemnitorFirst').value;
    const indemLast = resolveFieldValue('indemnitorLast').value;
    const indemFull = resolveFieldValue('indemnitorFull').value;

    if ((!indemFirst || !indemLast) && !indemFull) {
        errors.push('Your Name is required');
    }

    if (!resolveFieldValue('indemnitorEmail').value) errors.push('Your email is required');
    if (!resolveFieldValue('indemnitorPhone').value) errors.push('Your phone number is required');

    if (!resolveFieldValue('indemnitorAddress').value) errors.push('Your address is required');
    if (!resolveFieldValue('indemnitorCity').value) errors.push('Your city is required');
    if (!resolveFieldValue('indemnitorState').value) errors.push('Your state is required');
    if (!resolveFieldValue('indemnitorZip').value) errors.push('Your zip code is required');

    if (!resolveFieldValue('county').value) errors.push('County is required');

    // Consent
    const consent = resolveFieldValue('consent');
    if (consent.source && !consent.value) { // Use .value (checked state)
        errors.push('You must agree to the Terms & Conditions.');
    } else if (!consent.source && $w('#checkboxConsent').valid && !$w('#checkboxConsent').checked) {
        // Fallback explicit check
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
 * 2026 UPDATE: Uses FIELD_MAP Resolution
 */
function collectIntakeFormData() {
    // Parser
    const parseName = (full, first, last) => {
        if (first && last) return { first, last, full: `${first} ${last}`.trim() };
        if (full) {
            const parts = full.trim().split(' ');
            const pFirst = parts[0];
            const pLast = parts.slice(1).join(' ') || '';
            return { first: pFirst, last: pLast, full: full.trim() };
        }
        return { first: '', last: '', full: '' };
    };

    // Resolve Values
    const def = parseName(
        resolveFieldValue('defendantFull').value,
        resolveFieldValue('defendantFirst').value,
        resolveFieldValue('defendantLast').value
    );

    const indem = parseName(
        resolveFieldValue('indemnitorFull').value,
        resolveFieldValue('indemnitorFirst').value,
        resolveFieldValue('indemnitorLast').value
    );

    return {
        // Defendant Information
        defendantName: def.full,
        defendantFirstName: def.first,
        defendantLastName: def.last,
        defendantEmail: resolveFieldValue('defendantEmail').value,
        defendantPhone: resolveFieldValue('defendantPhone').value,
        defendantBookingNumber: safeGetValue('#defendantBookingNumber'), // Optional

        // Indemnitor Information
        indemnitorName: indem.full,
        indemnitorFirstName: indem.first,
        indemnitorMiddleName: safeGetValue('#indemnitorMiddleName') || '',
        indemnitorLastName: indem.last,
        indemnitorEmail: resolveFieldValue('indemnitorEmail').value,
        indemnitorPhone: resolveFieldValue('indemnitorPhone').value,

        indemnitorStreetAddress: resolveFieldValue('indemnitorAddress').value,
        indemnitorCity: resolveFieldValue('indemnitorCity').value,
        indemnitorState: resolveFieldValue('indemnitorState').value,
        indemnitorZipCode: resolveFieldValue('indemnitorZip').value,
        residenceType: safeGetValue('#residenceType'),

        // References
        reference1Name: resolveFieldValue('ref1Name').value,
        reference1Phone: resolveFieldValue('ref1Phone').value,
        reference1Address: resolveFieldValue('ref1Address').value,
        reference1City: resolveFieldValue('ref1City').value,
        reference1State: resolveFieldValue('ref1State').value,
        reference1Zip: resolveFieldValue('ref1Zip').value,

        reference2Name: resolveFieldValue('ref2Name').value,
        reference2Phone: resolveFieldValue('ref2Phone').value,
        reference2Address: resolveFieldValue('ref2Address').value,
        reference2City: resolveFieldValue('ref2City').value,
        reference2State: resolveFieldValue('ref2State').value,
        reference2Zip: resolveFieldValue('ref2Zip').value,

        // Employment
        indemnitorEmployerName: resolveFieldValue('employerName').value,
        indemnitorEmployerAddress: resolveFieldValue('employerAddress').value,
        indemnitorEmployerCity: resolveFieldValue('employerCity').value,
        indemnitorEmployerState: resolveFieldValue('employerState').value,
        indemnitorEmployerZip: resolveFieldValue('employerZip').value,
        indemnitorEmployerPhone: resolveFieldValue('employerPhone').value,
        indemnitorSupervisorName: resolveFieldValue('supervisorName').value,
        indemnitorSupervisorPhone: resolveFieldValue('supervisorPhone').value,

        // County
        county: resolveFieldValue('county').value,

        // Session
        sessionToken: getSessionToken()
    };
}

/**
 * Handle sign paperwork button
 */
function handleSignPaperwork() {
    if (currentIntake?.signNowIndemnitorLink) {
        wixWindow.openLightbox('SignNowLightbox', {
            url: currentIntake.signNowIndemnitorLink
        });
    }
}

/**
 * Handle make payment button
 */
function handleMakePayment() {
    wixLocation.to('/payments');
}

/**
 * Handle send message button
 */
async function handleSendMessage() {
    const message = safeGetValue('#messageInput');
    if (!message?.trim()) {
        showError('Please enter a message');
        return;
    }

    try {
        safeDisable('#sendMessageBtn');
        // TODO: Implement message sending
        // await sendMessage(message); 
        showError('Message feature coming soon'); // Placeholder

        // Clear logic
        if ($w('#messageInput').type === '$w.TextInput') {
            $w('#messageInput').value = '';
        }
    } catch (e) {
        console.error("Message Error", e);
    } finally {
        safeEnable('#sendMessageBtn');
    }
}

/**
 * Setup Defendant Link Feature
 * - Shows "Link Defendant" button/section if status is 'Need Info' or similar
 */
// [Deleted duplicate setupDefendantLink placeholder]

// --- UTILITIES ---

// --- UTILITIES ---

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

function safeSetValue(selector, value) {
    try {
        const el = $w(selector);
        if (!el) return;
        if (value === undefined || value === null) value = '';

        if (el.type === '$w.TextInput' || el.type === '$w.TextBox') el.value = value;
        else if (el.type === '$w.Dropdown') el.value = value;
        else if (el.type === '$w.Text') el.text = value;
        else if (el.value !== undefined) el.value = value;
    } catch (e) { }
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

function safeSetPlaceholder(selector, text) {
    try { $w(selector).placeholder = text; } catch (e) { }
}

function safeSetOptions(selector, options) {
    try { $w(selector).options = options; } catch (e) { }
}

function safeOnClick(selector, handler) {
    try { $w(selector).onClick(handler); } catch (e) { }
}

function safeOnInput(selector, handler) {
    try { $w(selector).onInput(handler); } catch (e) { }
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
    // Try both UI patterns (Group vs Message)
    // Try both UI patterns (Group vs Message)
    try {
        if ($w('#textSuccessMessage').valid) $w('#textSuccessMessage').text = msg;
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

/**
 * Setup phone number formatting
 */
function setupPhoneFormatting(selector) {
    safeOnInput(selector, () => {
        const value = safeGetValue(selector);
        if (!value) return;

        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
            if (formatted !== value) {
                safeSetValue(selector, formatted);
            }
        }
    });
}

/**
 * Setup zip code formatting
 */
function setupZipFormatting(selector) {
    safeOnInput(selector, () => {
        const value = safeGetValue(selector);
        if (!value) return;

        const cleaned = value.replace(/\D/g, '').substring(0, 5);
        if (cleaned !== value) {
            safeSetValue(selector, cleaned);
        }
    });
}


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
                safeCollapse('#groupDefendantLink');
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

function safeCollapse(selector) { try { if ($w(selector).valid) $w(selector).collapse(); } catch (e) { } }
