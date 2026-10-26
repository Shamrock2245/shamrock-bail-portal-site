/**
 * masterPage.js - Global Site Code for Wix Studio
 * Site: Shamrock Bail Bonds (shamrockbailbonds.biz)
 * Branch: Wix studio version (branchId 12e252e4-45a8-4bcc-840b-64d4edbdcaa4)
 * 
 * Handles:
 * 1. Global header emergency dispatch actions (English, Spanish, SMS)
 * 2. Navigation routing and mobile drawer toggle
 * 3. Client login & emergency intake routing
 * 4. Dynamic footer copyright and NAP formatting
 * 5. Analytics click tracking (GA4 / GTM / Meta Pixel)
 */

import wixLocationFrontend from 'wix-location-frontend';
import wixWindowFrontend from 'wix-window-frontend';

$w.onReady(function () {
    initHeader();
    initMobileNav();
    initFooter();
    initAnalytics();
});

/**
 * Initialize Header Navigation and Emergency Dispatch
 */
function initHeader() {
    // English Emergency Call
    if ($w('#headerCallEnglish')) {
        $w('#headerCallEnglish').onClick(() => {
            trackContactEvent('call_english', 'header');
        });
    }

    // Spanish Emergency Call (727-295-2245)
    if ($w('#headerCallSpanish')) {
        $w('#headerCallSpanish').onClick(() => {
            trackContactEvent('call_spanish', 'header');
        });
    }

    // Text / SMS Line (239-955-0178)
    if ($w('#headerTextLink')) {
        $w('#headerTextLink').onClick(() => {
            trackContactEvent('sms_click', 'header');
        });
    }

    // Client Login / Member Portal
    if ($w('#headerPortalLogin')) {
        $w('#headerPortalLogin').onClick(() => {
            wixLocationFrontend.to('/portal-landing');
        });
    }

    // Emergency Start Online
    if ($w('#headerStartOnline')) {
        $w('#headerStartOnline').onClick(() => {
            wixLocationFrontend.to('/portal-landing');
        });
    }

    // Emergency Dismissible Top Banner
    if ($w('#closeBannerBtn') && $w('#emergencyBanner')) {
        $w('#closeBannerBtn').onClick(() => {
            $w('#emergencyBanner').collapse();
        });
    }
}

/**
 * Initialize Mobile Navigation Drawer
 */
function initMobileNav() {
    const menuBtn = $w('#mobileMenuBtn');
    const drawer = $w('#mobileNavDrawer');
    const closeBtn = $w('#closeNavBtn');

    if (menuBtn && drawer) {
        menuBtn.onClick(() => {
            drawer.show('fade', { duration: 250 });
        });
    }

    if (closeBtn && drawer) {
        closeBtn.onClick(() => {
            drawer.hide('fade', { duration: 200 });
        });
    }
}

/**
 * Initialize Global Footer
 */
function initFooter() {
    // Dynamic Copyright Year
    if ($w('#footerYear')) {
        $w('#footerYear').text = String(new Date().getFullYear());
    }

    // Footer Phone Tracking
    if ($w('#footerCallEnglish')) {
        $w('#footerCallEnglish').onClick(() => {
            trackContactEvent('call_english', 'footer');
        });
    }
    if ($w('#footerCallSpanish')) {
        $w('#footerCallSpanish').onClick(() => {
            trackContactEvent('call_spanish', 'footer');
        });
    }
    if ($w('#footerTextLink')) {
        $w('#footerTextLink').onClick(() => {
            trackContactEvent('sms_click', 'footer');
        });
    }
}

/**
 * Page-view and UTM capture. Wix Marketing Integrations still own the GA4 tag.
 * This function has to exist because onReady calls it on every page.
 */
function initAnalytics() {
    try {
        const query = wixLocationFrontend.query || {};
        if (wixWindowFrontend.trackEvent) {
            wixWindowFrontend.trackEvent('CustomEvent', {
                event: 'page_view',
                eventCategory: 'Site',
                eventAction: 'page_view',
                eventLabel: wixLocationFrontend.url || '/',
                utmSource: query.utm_source || '',
                utmMedium: query.utm_medium || '',
                utmCampaign: query.utm_campaign || '',
                utmTerm: query.utm_term || '',
                utmContent: query.utm_content || ''
            });
        }
    } catch (err) {
        console.warn('Analytics init suppressed:', err.message);
    }
}

/**
 * Analytics and Event Dispatch
 */
function trackContactEvent(action, location) {
    try {
        if (wixWindowFrontend.trackEvent) {
            wixWindowFrontend.trackEvent('CustomEvent', {
                event: 'contact_click',
                eventCategory: 'Lead Dispatch',
                eventAction: action,
                eventLabel: location
            });
        }
    } catch (err) {
        // Non-blocking telemetry fallback
        console.warn('Analytics tracking suppressed:', err.message);
    }
}
