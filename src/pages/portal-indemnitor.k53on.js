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
 * MOBILE-OPTIMIZED: All interactions designed for touch and small screens
 * SPEED-OPTIMIZED: Minimal API calls, efficient data loading
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { currentMember } from 'wix-members-frontend';
import wixData from 'wix-data';
import { submitIntakeForm } from 'backend/intakeQueue.jsw';

// Page state
let memberData = null;
let currentIntake = null;
let isSubmitting = false;

$w.onReady(async function () {
    await initializePage();
});

/**
 * Initialize the page
 */
async function initializePage() {
    try {
        // Show loading state
        showLoading(true);
        
        // Check authentication
        const isLoggedIn = await checkMemberLogin();
        if (!isLoggedIn) {
            wixLocation.to('/portal-landing');
            return;
        }
        
        // Load member data
        memberData = await loadMemberData();
        
        // Check if member has existing intake
        await checkExistingIntake();
        
        // Setup form
        if (!currentIntake) {
            setupIntakeForm();
        } else {
            showBondDashboard();
        }
        
        // Setup event listeners
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
 * Check if member is logged in
 */
async function checkMemberLogin() {
    try {
        const member = await currentMember.getMember();
        return !!member;
    } catch (error) {
        return false;
    }
}

/**
 * Load member data
 */
async function loadMemberData() {
    try {
        const member = await currentMember.getMember({ fieldsets: ['FULL'] });
        
        return {
            id: member._id,
            email: member.loginEmail,
            firstName: member.contactDetails?.firstName || '',
            lastName: member.contactDetails?.lastName || '',
            phone: member.contactDetails?.phones?.[0] || ''
        };
    } catch (error) {
        console.error('Error loading member data:', error);
        return null;
    }
}

/**
 * Check if member has existing intake submission
 */
async function checkExistingIntake() {
    try {
        if (!memberData?.email) return;
        
        const results = await wixData.query('IntakeQueue')
            .eq('indemnitorEmail', memberData.email)
            .descending('_createdDate')
            .limit(1)
            .find();
        
        if (results.items.length > 0) {
            currentIntake = results.items[0];
        }
    } catch (error) {
        console.error('Error checking existing intake:', error);
    }
}

/**
 * Setup intake form with prefilled data
 */
function setupIntakeForm() {
    // Prefill indemnitor information from member profile
    if (memberData) {
        safeSetValue('#indemnitorFirstName', memberData.firstName);
        safeSetValue('#indemnitorLastName', memberData.lastName);
        safeSetValue('#indemnitorEmail', memberData.email);
        safeSetValue('#indemnitorPhone', memberData.phone);
    }
    
    // Show form, hide dashboard
    safeShow('#intakeFormSection');
    safeHide('#bondDashboardSection');
}

/**
 * Show bond dashboard with existing intake data
 */
function showBondDashboard() {
    if (!currentIntake) return;
    
    // Hide form, show dashboard
    safeHide('#intakeFormSection');
    safeShow('#bondDashboardSection');
    
    // Populate defendant status
    safeSetText('#defendantNameDisplay', currentIntake.defendantName || 'Unknown');
    safeSetText('#defendantStatusDisplay', formatStatus(currentIntake.status));
    safeSetText('#lastCheckInDisplay', formatDate(currentIntake._updatedDate));
    safeSetText('#nextCourtDateDisplay', formatDate(currentIntake.nextCourtDate) || 'TBD');
    
    // Populate paperwork status
    const paperworkStatus = currentIntake.documentStatus || 'pending';
    safeSetText('#paperworkStatusDisplay', formatDocumentStatus(paperworkStatus));
    
    // Show/hide sign button
    if (paperworkStatus === 'sent_for_signature' && currentIntake.signNowIndemnitorLink) {
        safeShow('#signPaperworkBtn');
        $w('#signPaperworkBtn').link = currentIntake.signNowIndemnitorLink;
    } else {
        safeHide('#signPaperworkBtn');
    }
    
    // Populate payment plan
    if (currentIntake.premiumAmount) {
        safeSetText('#remainingBalanceDisplay', `$${currentIntake.premiumAmount.toFixed(2)}`);
        safeSetText('#paymentTermsDisplay', currentIntake.paymentTerms || '250.00');
        safeSetText('#paymentFrequencyDisplay', currentIntake.paymentFrequency || 'weekly');
        safeSetText('#nextPaymentDateDisplay', formatDate(currentIntake.nextPaymentDate) || 'Jan 8, 2026');
        
        // Show payment button
        safeShow('#makePaymentBtn');
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Submit Info button
    safeOnClick('#submitInfoBtn', handleSubmitIntake);
    
    // Sign Paperwork button
    safeOnClick('#signPaperworkBtn', handleSignPaperwork);
    
    // Make Payment button
    safeOnClick('#makePaymentBtn', handleMakePayment);
    
    // Send message button
    safeOnClick('#sendMessageBtn', handleSendMessage);
    
    // Phone number formatting
    setupPhoneFormatting('#defendantPhone');
    setupPhoneFormatting('#indemnitorPhone');
    setupPhoneFormatting('#reference1Phone');
    setupPhoneFormatting('#reference2Phone');
    setupPhoneFormatting('#indemnitorEmployerPhone');
    setupPhoneFormatting('#indemnitorSupervisorPhone');
    
    // Zip code formatting
    setupZipFormatting('#indemnitorZipCode');
    setupZipFormatting('#reference1Zip');
    setupZipFormatting('#reference2Zip');
    setupZipFormatting('#indemnitorEmployerZip');
}

/**
 * Handle intake form submission
 */
async function handleSubmitIntake() {
    if (isSubmitting) return;
    
    try {
        isSubmitting = true;
        
        // Disable button and show loading
        safeDisable('#submitInfoBtn');
        safeSetText('#submitInfoBtn', 'Submitting...');
        showLoading(true);
        
        // Validate form
        const validation = validateIntakeForm();
        if (!validation.valid) {
            showError(validation.message);
            return;
        }
        
        // Collect form data
        const formData = collectIntakeFormData();
        
        // Submit to backend
        const result = await submitIntakeForm(formData);
        
        if (result.success) {
            // Success - show confirmation
            showSuccess('Your information has been submitted successfully! Our team will review and contact you shortly.');
            
            // Wait 2 seconds then reload to show dashboard
            setTimeout(() => {
                wixLocation.to('/portal-indemnitor');
            }, 2000);
        } else {
            throw new Error(result.message || 'Submission failed');
        }
        
    } catch (error) {
        console.error('Submit error:', error);
        showError(error.message || 'Error submitting form. Please call (239) 332-2245.');
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
    
    // Defendant name (required)
    if (!safeGetValue('#defendantFirstName')?.trim()) {
        errors.push('Defendant first name is required');
    }
    if (!safeGetValue('#defendantLastName')?.trim()) {
        errors.push('Defendant last name is required');
    }
    
    // Indemnitor information (required)
    if (!safeGetValue('#indemnitorFirstName')?.trim()) {
        errors.push('Your first name is required');
    }
    if (!safeGetValue('#indemnitorLastName')?.trim()) {
        errors.push('Your last name is required');
    }
    if (!safeGetValue('#indemnitorEmail')?.trim()) {
        errors.push('Your email is required');
    }
    if (!safeGetValue('#indemnitorPhone')?.trim()) {
        errors.push('Your phone number is required');
    }
    if (!safeGetValue('#indemnitorAddress')?.trim()) {
        errors.push('Your address is required');
    }
    if (!safeGetValue('#indemnitorCity')?.trim()) {
        errors.push('Your city is required');
    }
    if (!safeGetValue('#indemnitorState')?.trim()) {
        errors.push('Your state is required');
    }
    if (!safeGetValue('#indemnitorZipCode')?.trim()) {
        errors.push('Your zip code is required');
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
        
        // Reference 1
        reference1Name: safeGetValue('#reference1Name'),
        reference1Phone: safeGetValue('#reference1Phone'),
        reference1Address: safeGetValue('#reference1Address'),
        reference1City: safeGetValue('#reference1City'),
        reference1State: safeGetValue('#reference1State'),
        reference1Zip: safeGetValue('#reference1Zip'),
        
        // Reference 2
        reference2Name: safeGetValue('#reference2Name'),
        reference2Phone: safeGetValue('#reference2Phone'),
        reference2Address: safeGetValue('#reference2Address'),
        reference2City: safeGetValue('#reference2City'),
        reference2State: safeGetValue('#reference2State'),
        reference2Zip: safeGetValue('#reference2Zip'),
        
        // Indemnitor Employment
        indemnitorEmployer: safeGetValue('#indemnitorEmployerName'),
        indemnitorEmployerCity: safeGetValue('#indemnitorEmployerCity'),
        indemnitorEmployerState: safeGetValue('#indemnitorEmployerState'),
        indemnitorEmployerZip: safeGetValue('#indemnitorEmployerZip'),
        indemnitorEmployerPhone: safeGetValue('#indemnitorEmployerPhone'),
        indemnitorSupervisorName: safeGetValue('#indemnitorSupervisorName'),
        indemnitorSupervisorPhone: safeGetValue('#indemnitorSupervisorPhone'),
        
        // Jail/County Information
        county: safeGetValue('#county'),
        jailFacility: safeGetValue('#jailFacility'),
        
        // Metadata
        submittedBy: memberData?.id,
        submittedByEmail: memberData?.email,
        submittedAt: new Date().toISOString()
    };
}

/**
 * Handle sign paperwork button
 */
function handleSignPaperwork() {
    if (currentIntake?.signNowIndemnitorLink) {
        wixWindow.openLightbox('signing-lightbox', {
            signNowUrl: currentIntake.signNowIndemnitorLink
        });
    }
}

/**
 * Handle make payment button
 */
function handleMakePayment() {
    // Open payment lightbox or redirect to payment page
    wixWindow.openLightbox('payment-lightbox', {
        caseId: currentIntake?.caseId,
        amount: currentIntake?.premiumAmount
    });
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
        // Save message to collection or send email
        await wixData.insert('Messages', {
            caseId: currentIntake?.caseId,
            fromEmail: memberData?.email,
            message: message,
            timestamp: new Date()
        });
        
        // Clear input
        safeSetValue('#messageInput', '');
        
        showSuccess('Message sent! We\'ll respond shortly.');
        
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Error sending message. Please call (239) 332-2245.');
    }
}

/**
 * Setup phone number formatting
 */
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

/**
 * Setup zip code formatting
 */
function setupZipFormatting(selector) {
    safeOnInput(selector, () => {
        let value = (safeGetValue(selector) || '').replace(/\D/g, '');
        if (value.length > 5) value = value.substring(0, 5);
        safeSetValue(selector, value);
    });
}

/**
 * Format status for display
 */
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

/**
 * Format document status for display
 */
function formatDocumentStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'sent_for_signature': 'Pending Signature(s)',
        'completed': 'Signed',
        'filed': 'Filed'
    };
    return statusMap[status] || status;
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return null;
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        return null;
    }
}

/**
 * Show loading indicator
 */
function showLoading(show) {
    if (show) {
        safeShow('#loadingSpinner');
    } else {
        safeHide('#loadingSpinner');
    }
}

/**
 * Show error message
 */
function showError(message) {
    safeSetText('#errorMessage', message);
    safeShow('#errorMessage');
    safeHide('#successMessage');
    
    // Auto-hide after 5 seconds
    setTimeout(() => safeHide('#errorMessage'), 5000);
}

/**
 * Show success message
 */
function showSuccess(message) {
    safeSetText('#successMessage', message);
    safeShow('#successMessage');
    safeHide('#errorMessage');
    
    // Auto-hide after 5 seconds
    setTimeout(() => safeHide('#successMessage'), 5000);
}

// ============================================================================
// SAFE WRAPPERS - Prevent errors if elements don't exist
// ============================================================================

function safeSetValue(selector, value) {
    try {
        if ($w(selector).valid) {
            $w(selector).value = value || '';
        }
    } catch (e) {
        console.warn(`Element ${selector} not found or not accessible`);
    }
}

function safeGetValue(selector) {
    try {
        return $w(selector).valid ? $w(selector).value : '';
    } catch (e) {
        return '';
    }
}

function safeSetText(selector, text) {
    try {
        if ($w(selector).valid) {
            $w(selector).text = text || '';
        }
    } catch (e) {
        console.warn(`Element ${selector} not found`);
    }
}

function safeShow(selector) {
    try {
        if ($w(selector).valid) {
            $w(selector).show();
        }
    } catch (e) {
        console.warn(`Element ${selector} not found`);
    }
}

function safeHide(selector) {
    try {
        if ($w(selector).valid) {
            $w(selector).hide();
        }
    } catch (e) {
        console.warn(`Element ${selector} not found`);
    }
}

function safeDisable(selector) {
    try {
        if ($w(selector).valid) {
            $w(selector).disable();
        }
    } catch (e) {
        console.warn(`Element ${selector} not found`);
    }
}

function safeEnable(selector) {
    try {
        if ($w(selector).valid) {
            $w(selector).enable();
        }
    } catch (e) {
        console.warn(`Element ${selector} not found`);
    }
}

function safeOnClick(selector, handler) {
    try {
        if ($w(selector).valid) {
            $w(selector).onClick(handler);
        }
    } catch (e) {
        console.warn(`Element ${selector} not found`);
    }
}

function safeOnInput(selector, handler) {
    try {
        if ($w(selector).valid) {
            $w(selector).onInput(handler);
        }
    } catch (e) {
        console.warn(`Element ${selector} not found`);
    }
}

// Export for testing
export {
    initializePage,
    handleSubmitIntake,
    validateIntakeForm,
    collectIntakeFormData
};
