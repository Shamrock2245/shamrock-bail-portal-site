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

// Contact information
const CONTACT = {
    phone: '239-332-2245',
    phoneTel: 'tel:+12393322245',
    email: 'info@shamrockbailbonds.biz',
    address: '1528 Broadway, Fort Myers, FL 33901'
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
        { selector: '#footerLinkCounties', path: '/bail-bonds', label: 'Counties We Serve' },
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
        { selector: '#footerLinkDirectory', path: '/florida-sheriffs-clerks-directory', label: 'Sheriffs & Clerks Directory' },
        { selector: '#footerLinkBecomeBondsman', path: '/become-a-bondsman', label: 'Become a Bondsman' },
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
        { selector: '#footerLinkTerms', path: '/terms-of-service', label: 'Terms of Service' },
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
        { selector: '#footerLinkLee', path: '/bail-bonds/lee-county', label: 'Lee County' },
        { selector: '#footerLinkCollier', path: '/bail-bonds/collier-county', label: 'Collier County' },
        { selector: '#footerLinkCharlotte', path: '/bail-bonds/charlotte-county', label: 'Charlotte County' },
        { selector: '#footerLinkHillsborough', path: '/bail-bonds/hillsborough-county', label: 'Hillsborough County' },
        { selector: '#footerLinkMiamiDade', path: '/bail-bonds/miami-dade-county', label: 'Miami-Dade County' }
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
            $w('#copyrightText').text = `© ${currentYear} Shamrock Bail Bonds. All rights reserved.`;
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
function setupNewsletter() {
    try {
        if (!$w('#newsletterForm').type) return;

        if ($w('#newsletterSubmit').type) {
            $w('#newsletterSubmit').onClick(async () => {
                const email = $w('#newsletterEmail').value;

                if (!email || !isValidEmail(email)) {
                    if ($w('#newsletterError').type) {
                        $w('#newsletterError').text = 'Please enter a valid email address';
                        $w('#newsletterError').show();
                    }
                    return;
                }

                try {
                    $w('#newsletterSubmit').disable();
                    $w('#newsletterSubmit').label = 'Subscribing...';

                    // Save to database
                    import('wix-data').then(async (wixData) => {
                        await wixData.insert('NewsletterSubscribers', {
                            email: email,
                            subscribedAt: new Date(),
                            source: 'footer'
                        });
                    });

                    // Show success
                    if ($w('#newsletterForm').type) $w('#newsletterForm').hide();
                    if ($w('#newsletterSuccess').type) {
                        $w('#newsletterSuccess').show();
                        $w('#newsletterSuccess').text = 'Thank you for subscribing!';
                    }

                    trackEvent('Newsletter_Subscribe', { source: 'footer' });

                } catch (error) {
                    if ($w('#newsletterError').type) {
                        $w('#newsletterError').text = 'Error subscribing. Please try again.';
                        $w('#newsletterError').show();
                    }
                } finally {
                    $w('#newsletterSubmit').enable();
                    $w('#newsletterSubmit').label = 'Subscribe';
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
        import('wix-window').then((wixWindow) => {
            wixWindow.trackEvent(eventName, eventData);
        });
    } catch (e) {
        console.log('Event tracking failed:', eventName);
    }
}

// Export for use in masterPage.js
export { setupContactInfo, setupFooterNav };
