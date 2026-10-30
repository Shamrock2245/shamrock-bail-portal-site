/**
 * Shamrock Bail Bonds - Site Footer Component (FIXED)
 * 
 * Global footer component with navigation, contact info, and legal links.
 * Used across all pages for consistent footer experience.
 * 
 * File: public/siteFooter.js
 * 
 * FIXES:
 * - Replaced .valid checks with proper .type checks
 * - Added try-catch blocks around all .onClick() calls
 * - Prevents "onClick is not a function" errors
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixData from 'wix-data';

// Contact information
const CONTACT = {
    phone: '239-332-2245',
    phoneTel: 'tel:+12393322245',
    email: 'admin@shamrockbailbonds.biz',
    address: '1528 Broadway, Ft. Myers, FL 33901'
};

/**
 * Initialize footer on page load
 */
export function initFooter() {
    // Set up contact information
    setupContactInfo();

    // Set up navigation links
    setupFooterNav();

    // Set up social links
    setupSocialLinks();

    // Set copyright year
    setCopyrightYear();

    // Set up newsletter signup (if present)
    setupNewsletter();
}

/**
 * Set up contact information in footer
 */
function setupContactInfo() {
    // Phone
    try {
        if ($w('#footerPhone').type) {
            $w('#footerPhone').text = CONTACT.phone;
        }
    } catch (e) { }

    try {
        if ($w('#footerPhoneLink').type) {
            $w('#footerPhoneLink').link = CONTACT.phoneTel;
            $w('#footerPhoneLink').onClick(() => {
                trackEvent('Footer_Phone_Click');
            });
        }
    } catch (e) { }

    // Email
    try {
        if ($w('#footerEmail').type) {
            $w('#footerEmail').text = CONTACT.email;
        }
    } catch (e) { }

    try {
        if ($w('#footerEmailLink').type) {
            $w('#footerEmailLink').link = `mailto:${CONTACT.email}`;
            $w('#footerEmailLink').onClick(() => {
                trackEvent('Footer_Email_Click');
            });
        }
    } catch (e) { }

    // Address
    try {
        if ($w('#footerAddress').type) {
            $w('#footerAddress').text = CONTACT.address;
        }
    } catch (e) { }

    // 24/7 badge
    try {
        if ($w('#footer247Badge').type) {
            $w('#footer247Badge').text = 'Available 24/7';
        }
    } catch (e) { }
}

/**
 * Set up footer navigation links
 */
function setupFooterNav() {
    // Quick Links
    const quickLinks = [
        { selector: '#footerLinkHome', path: '/', label: 'Home' },
        { selector: '#footerLinkHowBailWorks', path: '/how-bail-works', label: 'How Bail Works' },
        { selector: '#footerLinkCounties', path: '/#counties', label: 'Counties We Serve' },
        { selector: '#footerLinkContact', path: '/contact', label: 'Contact Us' }
    ];

    quickLinks.forEach(link => {
        try {
            if ($w(link.selector).type) {
                $w(link.selector).link = link.path;
                $w(link.selector).onClick(() => {
                    trackEvent('Footer_Nav_Click', { destination: link.path });
                });
            }
        } catch (e) { }
    });

    // Resources
    const resourceLinks = [
        { selector: '#footerLinkDirectory', path: '/#counties', label: 'Florida County Directory' },
        { selector: '#footerLinkBecomeBondsman', path: '/how-to-become-a-bondsman', label: 'Become a Bondsman' },
        { selector: '#footerLinkBlog', path: '/blog', label: 'Blog' },
        { selector: '#footerLinkFAQ', path: '/how-bail-works#faq', label: 'FAQ' }
    ];

    resourceLinks.forEach(link => {
        try {
            if ($w(link.selector).type) {
                $w(link.selector).link = link.path;
                $w(link.selector).onClick(() => {
                    trackEvent('Footer_Nav_Click', { destination: link.path });
                });
            }
        } catch (e) { }
    });

    // Legal Links
    const legalLinks = [
        { selector: '#footerLinkPrivacy', path: '/privacy-policy', label: 'Privacy Policy' },
        { selector: '#footerLinkTerms', path: '/terms-and-conditions', label: 'Terms and Conditions' },
        { selector: '#footerLinkDisclaimer', path: '/disclaimer', label: 'Disclaimer' }
    ];

    legalLinks.forEach(link => {
        try {
            if ($w(link.selector).type) {
                $w(link.selector).link = link.path;
                $w(link.selector).onClick(() => {
                    trackEvent('Footer_Legal_Click', { destination: link.path });
                });
            }
        } catch (e) { }
    });

    // Popular Counties
    const popularCounties = [
        { selector: '#footerLinkLee', path: '/florida-bail-bonds/lee', label: 'Lee County' },
        { selector: '#footerLinkCollier', path: '/florida-bail-bonds/collier', label: 'Collier County' },
        { selector: '#footerLinkCharlotte', path: '/florida-bail-bonds/charlotte', label: 'Charlotte County' },
        { selector: '#footerLinkHillsborough', path: '/florida-bail-bonds/hillsborough', label: 'Hillsborough County' },
        { selector: '#footerLinkMiamiDade', path: '/florida-bail-bonds/miami-dade', label: 'Miami-Dade County' }
    ];

    popularCounties.forEach(link => {
        try {
            if ($w(link.selector).type) {
                $w(link.selector).link = link.path;
                $w(link.selector).onClick(() => {
                    trackEvent('Footer_County_Click', { county: link.label });
                });
            }
        } catch (e) { }
    });
}

/**
 * Set up social media links
 */
function setupSocialLinks() {
    const socialLinks = [
        { selector: '#footerFacebook', url: 'https://facebook.com/shamrockbailbonds', platform: 'facebook' },
        { selector: '#footerTwitter', url: 'https://twitter.com/shamrockbail', platform: 'twitter' },
        { selector: '#footerInstagram', url: 'https://instagram.com/shamrockbailbonds', platform: 'instagram' },
        { selector: '#footerLinkedIn', url: 'https://linkedin.com/company/shamrockbailbonds', platform: 'linkedin' }
    ];

    socialLinks.forEach(social => {
        try {
            if ($w(social.selector).type) {
                $w(social.selector).link = social.url;
                $w(social.selector).target = '_blank';
                $w(social.selector).onClick(() => {
                    trackEvent('Footer_Social_Click', { platform: social.platform });
                });
            }
        } catch (e) { }
    });
}

/**
 * Set copyright year dynamically
 */
function setCopyrightYear() {
    const currentYear = new Date().getFullYear();

    try {
        if ($w('#copyrightText').type) {
            $w('#copyrightText').text = `(C) ${currentYear} Shamrock Bail Bonds, LLC. All rights reserved.`;
        }
    } catch (e) { }

    // License info
    try {
        if ($w('#licenseText').type) {
            $w('#licenseText').text = 'Licensed Bail Bond Agent - State of Florida';
        }
    } catch (e) { }
}

/**
 * Set up newsletter signup form
 */
function footerEl(id) {
    try {
        return $w(id) || null;
    } catch (e) {
        return null;
    }
}

function setupNewsletter() {
    try {
        const form = footerEl('#newsletterForm');
        if (!form || !form.type) return;

        const submit = footerEl('#newsletterSubmit');
        if (submit && submit.type && typeof submit.onClick === 'function') {
            submit.onClick(async () => {
                const emailNode = footerEl('#newsletterEmail');
                const email = emailNode ? emailNode.value : '';

                if (!email || !isValidEmail(email)) {
                    const err = footerEl('#newsletterError');
                    if (err && err.type) {
                        err.text = 'Please enter a valid email address';
                        err.show();
                    }
                    return;
                }

                try {
                    const busy = footerEl('#newsletterSubmit');
                    if (busy) {
                        busy.disable();
                        busy.label = 'Subscribing...';
                    }

                    // Save to database
                    await wixData.insert('NewsletterSubscribers', {
                        email: email,
                        subscribedAt: new Date(),
                        source: 'footer'
                    });

                    // Show success
                    const formNow = footerEl('#newsletterForm');
                    if (formNow && formNow.type) formNow.hide();
                    const success = footerEl('#newsletterSuccess');
                    if (success && success.type) {
                        success.show();
                        success.text = 'Thank you for subscribing!';
                    }

                    trackEvent('Newsletter_Subscribe', { source: 'footer' });

                } catch (error) {
                    const err = footerEl('#newsletterError');
                    if (err && err.type) {
                        err.text = 'Error subscribing. Please try again.';
                        err.show();
                    }
                } finally {
                    const done = footerEl('#newsletterSubmit');
                    if (done) {
                        try { done.enable(); } catch (e) { /* optional */ }
                        try { done.label = 'Subscribe'; } catch (e) { /* optional */ }
                    }
                }
            });
        }
    } catch (e) {
        console.log('Newsletter setup skipped (elements missing)');
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Track events
 */
function trackEvent(eventName, eventData = {}) {
    try {
        wixWindow.trackEvent(eventName, eventData);
    } catch (e) {
        console.log('Event tracking failed:', eventName);
    }
}

// Export for use in masterPage.js
export { setupContactInfo, setupFooterNav };
