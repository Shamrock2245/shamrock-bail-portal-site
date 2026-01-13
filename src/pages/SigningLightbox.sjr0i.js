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
    if ($w('#errorMessage').hidden === false) $w('#errorMessage').hide();
    if ($w('#loadingIndicator').hidden) $w('#loadingIndicator').show();

    // Set instructions
    if ($w('#signingInstructions')) {
        $w('#signingInstructions').text = 'Please review and sign the document below. All fields marked with * are required.';
    }

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

        // Handle iframe load (if API supported on element, otherwise just wait)
        // Some Wix iframes don't fire onLoad reliably for external sources, so we use timeout fallback
        $w('#loadingIndicator').hide();
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
    if ($w('#cancelBtn')) {
        $w('#cancelBtn').onClick(handleCancel);
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
    wixWindow.onMessage((event) => {
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

        default:
            console.log('SignNow event:', eventType, data);
    }
}

/**
 * Handle signing complete
 */
async function handleSigningComplete(data) {
    signingComplete = true;

    // Show completion message
    if ($w('#signingTitle')) $w('#signingTitle').text = 'Document Signed Successfully!';
    if ($w('#signingInstructions')) $w('#signingInstructions').text = 'Thank you. You will receive a copy via email.';

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
    showError(data.message || 'An error occurred during signing. Please try again.');
}

/**
 * Handle cancel
 */
function handleCancel() {
    wixWindow.lightbox.close({
        success: false,
        cancelled: true
    });
}

/**
 * Show error message
 */
function showError(message) {
    if ($w('#loadingIndicator')) $w('#loadingIndicator').hide();
    if ($w('#errorMessage')) {
        $w('#errorMessage').text = message;
        $w('#errorMessage').show();
    }
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
