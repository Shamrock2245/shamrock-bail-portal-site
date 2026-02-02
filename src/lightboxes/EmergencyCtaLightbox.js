/**
 * Emergency CTA Lightbox
 * Filename: lightboxes/EmergencyCtaLightbox.js
 * 
 * Modal for emergency bail assistance with quick call and start options.
 * Displays when user shows intent to leave or after time on page.
 * 
 * Lightbox Elements:
 * - #ctaTitle: Title text
 * - #ctaMessage: Main message
 * - #callNowBtn: Call now button
 * - #startOnlineBtn: Start online button
 * - #countySelect: County selection dropdown
 * - #closeBtn: Close button
 * - #trustBadges: Trust indicators section
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

// Phone number
const PHONE_NUMBER = '239-332-2245';
const PHONE_TEL = 'tel:+12393322245';

$w.onReady(function () {
    initializeLightbox();
    setupEventListeners();
    trackLightboxView();
});

/**
 * Initialize lightbox
 */
function initializeLightbox() {
    // Set content
    $w('#ctaTitle').text = 'Need Help Right Now?';
    
    $w('#ctaMessage').text = `
        We understand this is a stressful time. Our bail bond agents are available 24/7 to help you or your loved one.
        
        Call us now or start the bail process online - we'll guide you every step of the way.
    `;
    
    // Set button labels
    $w('#callNowBtn').label = `📞 Call Now: ${PHONE_NUMBER}`;
    $w('#startOnlineBtn').label = '🚀 Start Bail Online';
    
    // Populate county dropdown
    populateCountyDropdown();
    
    // Set trust badges
    setTrustBadges();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Call now button
    $w('#callNowBtn').onClick(() => {
        trackEvent('Emergency_CTA_Call_Click');
        wixLocation.to(PHONE_TEL);
    });
    
    // Start online button
    $w('#startOnlineBtn').onClick(() => {
        trackEvent('Emergency_CTA_Start_Click');
        const selectedCounty = $w('#countySelect')?.value;
        
        if (selectedCounty && selectedCounty !== 'select') {
            wixLocation.to(`/portal-landing?county=${selectedCounty}`);
        } else {
            wixLocation.to('/portal-landing');
        }
        
        wixWindow.lightbox.close();
    });
    
    // County select change
    if ($w('#countySelect')) {
        $w('#countySelect').onChange(() => {
            const county = $w('#countySelect').value;
            if (county && county !== 'select') {
                trackEvent('Emergency_CTA_County_Select', { county });
            }
        });
    }
    
    // Close button
    $w('#closeBtn').onClick(() => {
        trackEvent('Emergency_CTA_Close');
        wixWindow.lightbox.close();
    });
    
    // Chat button (if available)
    if ($w('#chatBtn')) {
        $w('#chatBtn').onClick(() => {
            trackEvent('Emergency_CTA_Chat_Click');
            // Open chat widget
            if (typeof $w('#wixChat') !== 'undefined') {
                $w('#wixChat').maximize();
            }
            wixWindow.lightbox.close();
        });
    }
}

/**
 * Populate county dropdown with Florida counties
 */
function populateCountyDropdown() {
    if (!$w('#countySelect')) return;
    
    const counties = [
        { value: 'select', label: 'Select Your County' },
        { value: 'lee', label: 'Lee County' },
        { value: 'collier', label: 'Collier County' },
        { value: 'charlotte', label: 'Charlotte County' },
        { value: 'hendry', label: 'Hendry County' },
        { value: 'glades', label: 'Glades County' },
        { value: 'miami-dade', label: 'Miami-Dade County' },
        { value: 'broward', label: 'Broward County' },
        { value: 'palm-beach', label: 'Palm Beach County' },
        { value: 'hillsborough', label: 'Hillsborough County' },
        { value: 'orange', label: 'Orange County' },
        { value: 'duval', label: 'Duval County' },
        { value: 'other', label: 'Other Florida County' }
    ];
    
    $w('#countySelect').options = counties;
    $w('#countySelect').value = 'select';
}

/**
 * Set trust badges content
 */
function setTrustBadges() {
    if (!$w('#trustBadges')) return;
    
    // This would typically be set via repeater or multiple elements
    // For now, we'll set the text
    if ($w('#badge1')) $w('#badge1').text = '✓ Licensed & Insured';
    if ($w('#badge2')) $w('#badge2').text = '✓ 24/7 Availability';
    if ($w('#badge3')) $w('#badge3').text = '✓ All Florida Counties';
    if ($w('#badge4')) $w('#badge4').text = '✓ Fast Release';
}

/**
 * Track lightbox view
 */
function trackLightboxView() {
    wixWindow.trackEvent('Emergency_CTA_View', {
        page: wixLocation.path.join('/'),
        timestamp: new Date().toISOString()
    });
}

/**
 * Track custom events
 */
function trackEvent(eventName, eventData = {}) {
    wixWindow.trackEvent(eventName, {
        ...eventData,
        timestamp: new Date().toISOString()
    });
}

export { populateCountyDropdown };
