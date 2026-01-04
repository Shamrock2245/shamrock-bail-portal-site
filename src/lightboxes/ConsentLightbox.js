/**
 * Consent Lightbox
 * Filename: lightboxes/ConsentLightbox.js
 * 
 * Modal for collecting user consent before starting bail paperwork.
 * Collects geolocation permission and terms acceptance.
 * 
 * Lightbox Elements:
 * - #consentTitle: Title text
 * - #consentText: Main consent text
 * - #locationCheckbox: Geolocation consent checkbox
 * - #termsCheckbox: Terms acceptance checkbox
 * - #privacyCheckbox: Privacy policy checkbox
 * - #agreeBtn: Agree and continue button
 * - #cancelBtn: Cancel button
 * - #locationStatus: Location status indicator
 * - #errorMessage: Error message display
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

// Consent state
let locationGranted = false;
let termsAccepted = false;
let privacyAccepted = false;
let userLocation = null;

$w.onReady(function () {
    initializeLightbox();
    setupEventListeners();
});

/**
 * Initialize lightbox
 */
function initializeLightbox() {
    // Set initial states
    $w('#agreeBtn').disable();
    $w('#errorMessage').hide();
    $w('#locationStatus').text = 'Location not shared';

    // Set consent text
    $w('#consentText').text = `
        Before we can begin your bail paperwork, we need your consent for the following:
        
        1. Location Sharing: We collect your location to verify your identity and comply with Florida bail bond regulations.
        
        2. Terms of Service: By proceeding, you agree to our terms of service and understand the bail bond process.
        
        3. Privacy Policy: Your information will be handled according to our privacy policy and only used for bail bond services.
        
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
 * Update agree button state
 */
function updateAgreeButton() {
    const allConsentsGiven = locationGranted && termsAccepted && privacyAccepted;

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

        // Prepare consent data
        const consentData = {
            locationGranted: locationGranted,
            location: userLocation,
            termsAccepted: termsAccepted,
            privacyAccepted: privacyAccepted,
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
