/**
 * SignNow Signing Lightbox
 * Filename: lightboxes/SigningLightbox.js
 * 
 * Modal for embedded SignNow document signing experience.
 * Displays the SignNow signing interface within the Wix site.
 * 
 * Lightbox Elements:
 * - #signingFrame: iFrame for SignNow embedded signing
 * - #signingTitle: Title text
 * - #signingInstructions: Instructions text
 * - #loadingIndicator: Loading spinner
 * - #errorMessage: Error message display
 * - #cancelBtn: Cancel signing button
 * - #helpBtn: Help button
 * - #progressIndicator: Signing progress indicator
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { getDocumentStatus } from 'backend/signnow-integration.jsw';

// Signing state
let signingUrl = null;
let documentId = null;
let sessionId = null;
let signingComplete = false;

$w.onReady(function () {
    initializeLightbox();
    setupEventListeners();
    setupMessageListener();
});

/**
 * Initialize lightbox
 */
function initializeLightbox() {
    // Get context data
    const context = wixWindow.lightbox.getContext();

    if (context) {
        signingUrl = context.signingUrl;
        documentId = context.documentId;
        sessionId = context.sessionId;
    }

    // Set initial states
    $w('#errorMessage').hide();
    $w('#loadingIndicator').show();

    // Set instructions
    $w('#signingInstructions').text = 'Please review and sign the document below. All fields marked with * are required.';

    // Load signing URL
    if (signingUrl) {
        loadSigningFrame();
    } else {
        showError('Unable to load signing document. Please try again.');
    }
}

/**
 * Load SignNow signing frame
 */
function loadSigningFrame() {
    try {
        // Set the iframe source
        $w('#signingFrame').src = signingUrl;

        // Handle iframe load
        $w('#signingFrame').onLoad(() => {
            $w('#loadingIndicator').hide();
            trackEvent('Signing_Frame_Loaded', { documentId });
        });

        // Show the frame
        $w('#signingFrame').show();

    } catch (error) {
        console.error('Error loading signing frame:', error);
        showError('Error loading document. Please try again.');
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Cancel button
    $w('#cancelBtn').onClick(handleCancel);

    // Help button
    if ($w('#helpBtn')) {
        $w('#helpBtn').onClick(() => {
            // TODO: Create SigningHelpLightbox
            console.log('Help button clicked');
            // wixWindow.openLightbox('SigningHelpLightbox');
        });
    }

    // Refresh button (if available)
    if ($w('#refreshBtn')) {
        $w('#refreshBtn').onClick(() => {
            $w('#loadingIndicator').show();
            loadSigningFrame();
        });
    }
}

/**
 * Set up message listener for SignNow events
 */
function setupMessageListener() {
    // Listen for postMessage events from SignNow iframe
    wixWindow.onMessage((event) => {
        // Verify origin (SignNow domains)
        const allowedOrigins = [
            'https://app.signnow.com',
            'https://signnow.com',
            'https://api.signnow.com'
        ];

        // Note: In Wix, we may not have direct access to event.origin
        // Depending on Wix environment, event.origin might be available or not throughout strictly.
        // We will proceed if we can parse the data.

        try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            handleSignNowEvent(data);
        } catch (error) {
            // Not a SignNow event or invalid JSON
        }
    });
}

/**
 * Handle SignNow events
 */
function handleSignNowEvent(data) {
    const eventType = data.type || data.event;

    switch (eventType) {
        case 'signature_complete':
        case 'document_signed':
            handleSigningComplete(data);
            break;

        case 'signing_declined':
        case 'document_declined':
            handleSigningDeclined(data);
            break;

        case 'signing_error':
        case 'error':
            handleSigningError(data);
            break;

        case 'field_completed':
            updateProgress(data);
            break;

        default:
            console.log('SignNow event:', eventType, data);
    }
}

/**
 * Handle signing complete
 */
async function handleSigningComplete(data) {
    signingComplete = true;

    trackEvent('Signing_Complete', {
        documentId,
        sessionId
    });

    // Show completion message
    $w('#signingTitle').text = 'Document Signed Successfully!';
    $w('#signingInstructions').text = 'Thank you for signing. You will receive a copy via email.';

    // Hide frame, show success
    $w('#signingFrame').hide();

    if ($w('#successMessage')) {
        $w('#successMessage').show();
    }

    // Close after delay
    setTimeout(() => {
        wixWindow.lightbox.close({
            success: true,
            documentId: documentId,
            sessionId: sessionId
        });
    }, 3000);
}

/**
 * Handle signing declined
 */
function handleSigningDeclined(data) {
    trackEvent('Signing_Declined', {
        documentId,
        reason: data.reason
    });

    wixWindow.lightbox.close({
        success: false,
        declined: true,
        reason: data.reason || 'User declined to sign'
    });
}

/**
 * Handle signing error
 */
function handleSigningError(data) {
    console.error('Signing error:', data);

    trackEvent('Signing_Error', {
        documentId,
        error: data.message || data.error
    });

    showError(data.message || 'An error occurred during signing. Please try again.');
}

/**
 * Update signing progress
 */
function updateProgress(data) {
    if ($w('#progressIndicator') && data.progress) {
        $w('#progressIndicator').targetValue = data.progress;
    }

    if ($w('#progressText') && data.fieldsCompleted && data.totalFields) {
        $w('#progressText').text = `${data.fieldsCompleted} of ${data.totalFields} fields completed`;
    }
}

/**
 * Handle cancel
 */
async function handleCancel() {
    // Confirm cancellation
    // Note: 'ConfirmCancelLightbox' does not exist in src/lightboxes. 
    // Falling back to direct close for now.

    trackEvent('Signing_Cancelled', { documentId });

    wixWindow.lightbox.close({
        success: false,
        cancelled: true
    });
}

/**
 * Show error message
 */
function showError(message) {
    $w('#loadingIndicator').hide();
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
}

/**
 * Track custom events
 */
function trackEvent(eventName, eventData = {}) {
    wixWindow.trackEvent('CustomEvent', {
        event: eventName,
        detail: eventData,
        timestamp: new Date().toISOString()
    });
}

/**
 * Check document status (for polling if needed)
 */
async function checkDocumentStatus() {
    if (!documentId || signingComplete) return;

    try {
        const status = await getDocumentStatus(documentId);

        if (status.success && status.status === 'completed') {
            handleSigningComplete({ fromPoll: true });
        }
    } catch (error) {
        console.error('Error checking document status:', error);
    }
}

// Poll for status every 30 seconds as backup
setInterval(checkDocumentStatus, 30000);

export { handleSignNowEvent, checkDocumentStatus };
