/**
 * Shamrock Bail Bonds - Master Page
 * 
 * Global code that runs on every page.
 * Handles header, footer, sticky CTAs, and global functionality.
 * 
 * File: pages/masterPage.js
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { initHeader } from 'public/siteHeader.js';
import { initFooter } from 'public/siteFooter.js';

// Phone number for CTAs
const PHONE_TEL = 'tel:+12393322245';

$w.onReady(function () {
    // Initialize global components
    initHeader();
    initFooter();
    
    // Set up mobile sticky CTA
    setupMobileStickyCTA();
    
    // Set up scroll behavior
    setupScrollBehavior();
    
    // Initialize analytics
    initAnalytics();
    
    // Check for URL parameters
    handleUrlParameters();
    
    // Set up global error handling
    setupErrorHandling();
});

/**
 * Set up mobile sticky CTA bar
 */
function setupMobileStickyCTA() {
    wixWindow.getBoundingRect()
        .then((windowSize) => {
            const isMobile = windowSize.window.width < 768;
            
            if (isMobile) {
                // Show sticky CTA on mobile
                $w('#stickyMobileCTA').show();
                
                // Call button
                $w('#stickyCallBtn').onClick(() => {
                    trackEvent('Sticky_CTA_Click', { button: 'call' });
                    wixLocation.to(PHONE_TEL);
                });
                
                // Start Bail button
                $w('#stickyStartBtn').onClick(() => {
                    trackEvent('Sticky_CTA_Click', { button: 'start_bail' });
                    wixLocation.to('/members/start-bail');
                });
            } else {
                // Hide on desktop
                $w('#stickyMobileCTA').hide();
            }
        });
}

/**
 * Set up scroll-based behaviors
 */
function setupScrollBehavior() {
    // Header shadow on scroll
    let lastScrollTop = 0;
    
    // Note: Wix doesn't have a direct scroll event on $w
    // This would typically be handled with custom code or Wix animations
    
    // Back to top button
    if ($w('#backToTopBtn').valid) {
        $w('#backToTopBtn').hide();
        
        // Show after scrolling down
        // This would need to be implemented with viewport detection
        
        $w('#backToTopBtn').onClick(() => {
            $w('#header').scrollTo();
            trackEvent('Back_To_Top_Click');
        });
    }
}

/**
 * Initialize analytics tracking
 */
function initAnalytics() {
    // Track page load
    const pageData = {
        path: wixLocation.path.join('/'),
        url: wixLocation.url,
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString()
    };
    
    trackEvent('Page_Load', pageData);
    
    // Track time on page
    const startTime = Date.now();
    
    // Note: Wix doesn't have a beforeunload equivalent
    // Time tracking would need to be done differently
}

/**
 * Handle URL parameters
 */
function handleUrlParameters() {
    const params = wixLocation.query;
    
    // UTM tracking
    if (params.utm_source || params.utm_medium || params.utm_campaign) {
        const utmData = {
            source: params.utm_source || '',
            medium: params.utm_medium || '',
            campaign: params.utm_campaign || '',
            term: params.utm_term || '',
            content: params.utm_content || ''
        };
        
        // Store in session for attribution
        import('wix-storage').then((wixStorage) => {
            wixStorage.session.setItem('utm_data', JSON.stringify(utmData));
        });
        
        trackEvent('UTM_Visit', utmData);
    }
    
    // Referral tracking
    if (params.ref) {
        trackEvent('Referral_Visit', { referrer: params.ref });
    }
    
    // Show specific content based on params
    if (params.county) {
        // Highlight county in navigation or show county-specific messaging
    }
}

/**
 * Set up global error handling
 */
function setupErrorHandling() {
    // Note: Wix has limited global error handling
    // Errors should be handled at the page/function level
}

/**
 * Track custom events
 */
function trackEvent(eventName, eventData = {}) {
    // Add global context to all events
    const enrichedData = {
        ...eventData,
        page: wixLocation.path.join('/'),
        timestamp: new Date().toISOString()
    };
    
    wixWindow.trackEvent(eventName, enrichedData);
    
    // Also log to console in development
    console.log(`[Analytics] ${eventName}:`, enrichedData);
}

/**
 * Global utility: Format phone number
 */
export function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}

/**
 * Global utility: Validate email
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Global utility: Get current member ID
 */
export async function getCurrentMemberId() {
    try {
        const { currentMember } = await import('wix-members-frontend');
        const member = await currentMember.getMember();
        return member?._id || null;
    } catch (error) {
        return null;
    }
}

/**
 * Global utility: Show toast notification
 */
export function showToast(message, type = 'info') {
    // This would typically use a custom lightbox or notification component
    if ($w('#toastNotification').valid) {
        $w('#toastMessage').text = message;
        $w('#toastNotification').show('fade', { duration: 300 });
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            $w('#toastNotification').hide('fade', { duration: 300 });
        }, 3000);
    }
}

/**
 * Global utility: Scroll to element
 */
export function scrollToElement(selector) {
    if ($w(selector).valid) {
        $w(selector).scrollTo();
    }
}

// Export utilities for use in other pages
export { trackEvent };
