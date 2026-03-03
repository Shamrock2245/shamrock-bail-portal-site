/**
 * Consent Lightbox
 * Filename: lightboxes/ConsentLightbox.js
 * 
 * Modal for collecting user consent before starting bail paperwork.
 * Collects geolocation permission, terms acceptance, privacy acceptance,
 * and SMS/text message consent (required for A2P 10DLC compliance).
 * 
 * Lightbox Elements:
 * - #consentTitle: Title text
 * - #consentText: Main consent text
 * - #locationCheckbox: Geolocation consent checkbox
 * - #termsCheckbox: Terms acceptance checkbox
 * - #privacyCheckbox: Privacy policy checkbox
 * - #smsConsentCheckbox: SMS/text message consent checkbox
 * - #agreeBtn: Agree and continue button
 * - #cancelBtn: Cancel button
 * - #locationStatus: Location status indicator
 * - #errorMessage: Error message display
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

// Consent state — ALL default to false (unchecked)
let locationGranted = false;
let termsAccepted = false;
let privacyAccepted = false;
let smsConsented = false;
let userLocation = null;

$w.onReady(function () {
    initializeLightbox();
    setupEventListeners();
});

/**
 * Initialize lightbox — all checkboxes start UNCHECKED
 */
function initializeLightbox() {
    // Disable agree button until ALL consents given
    $w('#agreeBtn').disable();
    $w('#errorMessage').hide();
    $w('#locationStatus').text = 'Location not shared';

    // Force all checkboxes to unchecked state on load
    try { $w('#locationCheckbox').checked = false; } catch (e) { /* optional */ }
    try { $w('#termsCheckbox').checked = false; } catch (e) { /* optional */ }
    try { $w('#privacyCheckbox').checked = false; } catch (e) { /* optional */ }
    try { $w('#smsConsentCheckbox').checked = false; } catch (e) { /* optional */ }

    // Reset consent state
    locationGranted = false;
    termsAccepted = false;
    privacyAccepted = false;
    smsConsented = false;

    // Set consent text
    $w('#consentText').text = `
        Before we can begin your bail paperwork, we need your consent for the following:
        
        1. Location Sharing: We collect your location to verify your identity and comply with Florida bail bond regulations.
        
        2. Terms of Service: By proceeding, you agree to our terms of service and understand the bail bond process.
        
        3. Privacy Policy: Your information will be handled according to our privacy policy and only used for bail bond services.

        4. Text Messages (SMS): You agree to receive text messages from Shamrock Bail Bonds including verification codes, court reminders, and case updates. Message frequency varies. Standard message and data rates may apply. Reply STOP at any time to opt out.
        
        All information is encrypted and securely stored.
    `;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Location checkbox
    $w('#locationCheckbox').onChange((event) => {
        if (event.target.checked) {
            requestLocationPermission();
        } else {
            locationGranted = false;
            userLocation = null;
            $w('#locationStatus').text = 'Location not shared';
            updateAgreeButton();
        }
    });

    // Terms checkbox
    $w('#termsCheckbox').onChange((event) => {
        termsAccepted = event.target.checked;
        updateAgreeButton();
    });

    // Privacy checkbox
    $w('#privacyCheckbox').onChange((event) => {
        privacyAccepted = event.target.checked;
        updateAgreeButton();
    });

    // SMS Consent checkbox
    try {
        $w('#smsConsentCheckbox').onChange((event) => {
            smsConsented = event.target.checked;
            updateAgreeButton();
        });
    } catch (e) {
        // If element doesn't exist yet in Wix Editor, log it
        console.warn('⚠️ #smsConsentCheckbox not found in Editor. Add it to enable SMS consent.');
    }

    // Agree button
    $w('#agreeBtn').onClick(handleAgree);

    // Cancel button
    $w('#cancelBtn').onClick(handleCancel);

    // Terms link
    if ($w('#termsLink')) {
        $w('#termsLink').onClick(() => {
            wixWindow.openLightbox('TermsLightbox');
        });
    }

    // Privacy link
    if ($w('#privacyLink')) {
        $w('#privacyLink').onClick(() => {
            wixWindow.openLightbox('PrivacyLightbox');
        });
    }
}

/**
 * Request location permission
 */
async function requestLocationPermission() {
    try {
        $w('#locationStatus').text = 'Requesting location...';

        // Use Wix Window API which handles permissions and browser differences
        const locationData = await wixWindow.getCurrentGeolocation();

        userLocation = {
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
            accuracy: locationData.coords.accuracy,
            timestamp: locationData.timestamp || new Date().toISOString()
        };

        locationGranted = true;
        $w('#locationStatus').text = '✓ Location shared successfully';
        $w('#locationStatus').style.color = '#28A745';

        updateAgreeButton();

    } catch (error) {
        console.error('Location error:', error);
        locationGranted = false;
        $w('#locationCheckbox').checked = false;

        // Error handling for Wix Geolocation
        let errorMessage = 'Unable to get location';
        if (error.code === 0) { // UNKNOWN_ERROR
            errorMessage = 'Unknown error getting location.';
        } else if (error.code === 1) { // PERMISSION_DENIED
            errorMessage = 'Location permission denied. Please enable location access.';
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
            errorMessage = 'Location unavailable. Please try again.';
        } else if (error.code === 3) { // TIMEOUT
            errorMessage = 'Location request timed out. Please try again.';
        }

        $w('#locationStatus').text = errorMessage;
        $w('#locationStatus').style.color = '#DC3545';

        showError(errorMessage);
    }
}

/**
 * Update agree button state — requires ALL 4 consents
 */
function updateAgreeButton() {
    const allConsentsGiven = locationGranted && termsAccepted && privacyAccepted && smsConsented;

    if (allConsentsGiven) {
        $w('#agreeBtn').enable();
        $w('#agreeBtn').style.backgroundColor = '#0066CC';
    } else {
        $w('#agreeBtn').disable();
        $w('#agreeBtn').style.backgroundColor = '#6c757d';
    }
}

/**
 * Handle agree button click
 */
async function handleAgree() {
    try {
        $w('#agreeBtn').disable();
        $w('#agreeBtn').label = 'Processing...';

        // Prepare consent data with success flag for flow control
        const consentData = {
            success: true,  // Explicit success flag for parent page
            locationGranted: locationGranted,
            location: userLocation,
            termsAccepted: termsAccepted,
            privacyAccepted: privacyAccepted,
            smsConsented: smsConsented,  // SMS consent for A2P 10DLC compliance
            consentTimestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };

        // Close lightbox and return consent data
        wixWindow.lightbox.close(consentData);

    } catch (error) {
        console.error('Error processing consent:', error);
        showError('An error occurred. Please try again.');
        $w('#agreeBtn').enable();
        $w('#agreeBtn').label = 'Agree & Continue';
    }
}

/**
 * Handle cancel button click
 */
function handleCancel() {
    wixWindow.lightbox.close(null);
}

/**
 * Show error message
 */
function showError(message) {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();

    // Auto-hide after 5 seconds
    setTimeout(() => {
        $w('#errorMessage').hide();
    }, 5000);
}

export { requestLocationPermission };
