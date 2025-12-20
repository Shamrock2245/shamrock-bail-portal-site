/**
 * Shamrock Bail Bonds - Start Bail Paperwork Page (Members Area)
 * 
 * This is the secure entry point for starting the bail paperwork process.
 * Users must be logged in and provide consent before being handed off to SignNow.
 * 
 * CRITICAL: This page is the gateway to SignNow. It does NOT replace or duplicate
 * SignNow functionality - it only prepares the user and collects required consents.
 * 
 * URL: /members/start-bail
 * 
 * Page Elements (Wix Editor IDs):
 * - #consentSection: Consent and permissions collection
 * - #geolocationConsent: Geolocation permission checkbox
 * - #termsConsent: Terms of service checkbox
 * - #communicationConsent: Communication preferences
 * - #startPaperworkBtn: Button to launch SignNow
 * - #progressIndicator: Visual progress indicator
 * - #helpSection: Help and contact information
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixMembers from 'wix-members';
import { currentMember } from 'wix-members-frontend';
import { getSignNowUrl } from 'backend/signNowIntegration.jsw';

// Phone number for support
const PHONE_NUMBER = '239-332-2245';
const PHONE_TEL = 'tel:+12393322245';

let memberData = null;
let consents = {
    geolocation: false,
    terms: false,
    communication: false
};
let geolocationData = null;

$w.onReady(async function () {
    await initializePage();
});

/**
 * Initialize the page
 */
async function initializePage() {
    // Check if user is logged in
    const isLoggedIn = await checkMemberLogin();
    
    if (!isLoggedIn) {
        // Redirect to login with return URL
        wixLocation.to('/members/login?returnUrl=/members/start-bail');
        return;
    }
    
    // Load member data
    memberData = await loadMemberData();
    
    // Set up the page
    setupConsentForm();
    setupEventListeners();
    displayMemberInfo();
    
    // Track page view
    trackEvent('PageView', { 
        page: 'StartBail', 
        memberId: memberData?.id 
    });
}

/**
 * Check if member is logged in
 */
async function checkMemberLogin() {
    try {
        const member = await currentMember.getMember();
        return !!member;
    } catch (error) {
        console.log('User not logged in');
        return false;
    }
}

/**
 * Load member data
 */
async function loadMemberData() {
    try {
        const member = await currentMember.getMember({
            fieldsets: ['FULL']
        });
        
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
 * Display member information
 */
function displayMemberInfo() {
    if (memberData) {
        $w('#welcomeText').text = `Welcome, ${memberData.firstName || 'there'}!`;
        
        // Pre-fill any visible form fields
        if ($w('#memberEmail').valid) {
            $w('#memberEmail').value = memberData.email;
        }
        if ($w('#memberPhone').valid && memberData.phone) {
            $w('#memberPhone').value = memberData.phone;
        }
    }
}

/**
 * Set up consent form
 */
function setupConsentForm() {
    // Initialize checkboxes as unchecked
    $w('#geolocationConsent').checked = false;
    $w('#termsConsent').checked = false;
    $w('#communicationConsent').checked = false;
    
    // Disable start button initially
    $w('#startPaperworkBtn').disable();
    
    // Show consent requirements
    updateConsentStatus();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Geolocation consent
    $w('#geolocationConsent').onChange((event) => {
        consents.geolocation = event.target.checked;
        if (event.target.checked) {
            requestGeolocation();
        }
        updateConsentStatus();
    });
    
    // Terms consent
    $w('#termsConsent').onChange((event) => {
        consents.terms = event.target.checked;
        updateConsentStatus();
    });
    
    // Communication consent
    $w('#communicationConsent').onChange((event) => {
        consents.communication = event.target.checked;
        updateConsentStatus();
    });
    
    // Terms link
    $w('#termsLink').onClick(() => {
        wixWindow.openLightbox('TermsOfService');
    });
    
    // Privacy link
    $w('#privacyLink').onClick(() => {
        wixLocation.to('/privacy-policy');
    });
    
    // Start Paperwork button
    $w('#startPaperworkBtn').onClick(async () => {
        await startBailPaperwork();
    });
    
    // Help/Support button
    $w('#needHelpBtn').onClick(() => {
        trackEvent('Help_Click', { page: 'start_bail' });
        wixLocation.to(PHONE_TEL);
    });
    
    // Chat support (if available)
    if ($w('#chatSupportBtn').valid) {
        $w('#chatSupportBtn').onClick(() => {
            trackEvent('Chat_Click', { page: 'start_bail' });
            // Open chat widget
        });
    }
}

/**
 * Request geolocation permission
 */
async function requestGeolocation() {
    try {
        $w('#geolocationStatus').text = 'Requesting location...';
        $w('#geolocationStatus').show();
        
        const position = await new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            } else {
                reject(new Error('Geolocation not supported'));
            }
        });
        
        geolocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
        };
        
        $w('#geolocationStatus').text = 'Location captured ✓';
        trackEvent('Geolocation_Success', { 
            accuracy: position.coords.accuracy 
        });
        
    } catch (error) {
        console.error('Geolocation error:', error);
        $w('#geolocationStatus').text = 'Location unavailable - you can continue without it';
        
        // Still allow proceeding without geolocation
        geolocationData = {
            error: error.message,
            timestamp: new Date().toISOString()
        };
        
        trackEvent('Geolocation_Error', { error: error.message });
    }
}

/**
 * Update consent status and button state
 */
function updateConsentStatus() {
    // Check if all required consents are given
    const allConsentsGiven = consents.geolocation && consents.terms;
    
    // Update progress indicator
    let completedSteps = 0;
    if (consents.geolocation) completedSteps++;
    if (consents.terms) completedSteps++;
    if (consents.communication) completedSteps++;
    
    $w('#progressText').text = `${completedSteps}/2 required consents`;
    
    // Update progress bar if available
    if ($w('#progressBar').valid) {
        $w('#progressBar').value = (completedSteps / 2) * 100;
    }
    
    // Enable/disable start button
    if (allConsentsGiven) {
        $w('#startPaperworkBtn').enable();
        $w('#startPaperworkBtn').label = 'Start Bail Paperwork →';
    } else {
        $w('#startPaperworkBtn').disable();
        $w('#startPaperworkBtn').label = 'Complete Required Consents';
    }
    
    // Update individual consent indicators
    updateConsentIndicator('#geolocationIndicator', consents.geolocation);
    updateConsentIndicator('#termsIndicator', consents.terms);
}

/**
 * Update individual consent indicator
 */
function updateConsentIndicator(selector, isComplete) {
    if ($w(selector).valid) {
        $w(selector).text = isComplete ? '✓' : '○';
        $w(selector).style.color = isComplete ? '#00B894' : '#ADB5BD';
    }
}

/**
 * Start the bail paperwork process - hand off to SignNow
 */
async function startBailPaperwork() {
    try {
        // Show loading state
        $w('#startPaperworkBtn').disable();
        $w('#startPaperworkBtn').label = 'Preparing paperwork...';
        $w('#loadingIndicator').show();
        
        // Collect all data for SignNow
        const bailData = {
            member: memberData,
            consents: {
                ...consents,
                timestamp: new Date().toISOString()
            },
            geolocation: geolocationData,
            source: 'wix_portal',
            userAgent: navigator.userAgent
        };
        
        // Track the handoff
        trackEvent('SignNow_Handoff_Start', {
            memberId: memberData?.id,
            hasGeolocation: !!geolocationData?.latitude
        });
        
        // Get SignNow URL from backend
        const signNowUrl = await getSignNowUrl(bailData);
        
        if (signNowUrl) {
            // Log the handoff
            await logBailStart(bailData);
            
            // Redirect to SignNow
            trackEvent('SignNow_Redirect', { url: signNowUrl });
            wixLocation.to(signNowUrl);
        } else {
            throw new Error('Failed to get SignNow URL');
        }
        
    } catch (error) {
        console.error('Error starting bail paperwork:', error);
        
        // Show error message
        $w('#errorMessage').text = 'There was an error starting the paperwork. Please try again or call us for assistance.';
        $w('#errorMessage').show();
        
        // Reset button
        $w('#startPaperworkBtn').enable();
        $w('#startPaperworkBtn').label = 'Try Again';
        $w('#loadingIndicator').hide();
        
        trackEvent('SignNow_Handoff_Error', { error: error.message });
    }
}

/**
 * Log bail start for records
 */
async function logBailStart(bailData) {
    try {
        // This would typically save to a Wix Data collection
        import('wix-data').then(async (wixData) => {
            await wixData.insert('BailStartLogs', {
                memberId: bailData.member?.id,
                memberEmail: bailData.member?.email,
                consents: JSON.stringify(bailData.consents),
                geolocation: JSON.stringify(bailData.geolocation),
                timestamp: new Date(),
                status: 'initiated'
            });
        });
    } catch (error) {
        console.error('Error logging bail start:', error);
        // Don't block the process for logging errors
    }
}

/**
 * Track custom events
 */
function trackEvent(eventName, eventData) {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

// Export for testing
export { 
    initializePage, 
    checkMemberLogin, 
    updateConsentStatus,
    startBailPaperwork 
};
