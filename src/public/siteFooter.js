/**
 * Shamrock Bail Bonds - Site Footer Component
 * 
 * Global footer component with navigation, contact info, and legal links.
 * Used across all pages for consistent footer experience.
 * 
 * File: public/siteFooter.js
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
    if ($w('#footerPhone').valid) {
        $w('#footerPhone').text = CONTACT.phone;
    }
    if ($w('#footerPhoneLink').valid) {
        $w('#footerPhoneLink').link = CONTACT.phoneTel;
        $w('#footerPhoneLink').onClick(() => {
            trackEvent('Footer_Phone_Click');
        });
    }

    // Email
    if ($w('#footerEmail').valid) {
        $w('#footerEmail').text = CONTACT.email;
    }
    if ($w('#footerEmailLink').valid) {
        $w('#footerEmailLink').link = `mailto:${CONTACT.email}`;
        $w('#footerEmailLink').onClick(() => {
            trackEvent('Footer_Email_Click');
        });
    }

    // Address
    if ($w('#footerAddress').valid) {
        $w('#footerAddress').text = CONTACT.address;
    }

    // 24/7 badge
    if ($w('#footer247Badge').valid) {
        $w('#footer247Badge').text = 'Available 24/7';
    }
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
        if ($w(link.selector).valid) {
            $w(link.selector).link = link.path;
            $w(link.selector).onClick(() => {
                trackEvent('Footer_Nav_Click', { destination: link.path });
            });
        }
    });

    // Resources
    const resourceLinks = [
        { selector: '#footerLinkDirectory', path: '/florida-sheriffs-clerks-directory', label: 'Sheriffs & Clerks Directory' },
        { selector: '#footerLinkBecomeBondsman', path: '/become-a-bondsman', label: 'Become a Bondsman' },
        { selector: '#footerLinkBlog', path: '/blog', label: 'Blog' },
        { selector: '#footerLinkFAQ', path: '/how-bail-works#faq', label: 'FAQ' }
    ];

    resourceLinks.forEach(link => {
        if ($w(link.selector).valid) {
            $w(link.selector).link = link.path;
            $w(link.selector).onClick(() => {
                trackEvent('Footer_Nav_Click', { destination: link.path });
            });
        }
    });

    // Legal Links
    const legalLinks = [
        { selector: '#footerLinkPrivacy', path: '/privacy-policy', label: 'Privacy Policy' },
        { selector: '#footerLinkTerms', path: '/terms-of-service', label: 'Terms of Service' },
        { selector: '#footerLinkDisclaimer', path: '/disclaimer', label: 'Disclaimer' }
    ];

    legalLinks.forEach(link => {
        if ($w(link.selector).valid) {
            $w(link.selector).link = link.path;
            $w(link.selector).onClick(() => {
                trackEvent('Footer_Legal_Click', { destination: link.path });
            });
        }
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
        if ($w(link.selector).valid) {
            $w(link.selector).link = link.path;
            $w(link.selector).onClick(() => {
                trackEvent('Footer_County_Click', { county: link.label });
            });
        }
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
        if ($w(social.selector).valid) {
            $w(social.selector).link = social.url;
            $w(social.selector).target = '_blank';
            $w(social.selector).onClick(() => {
                trackEvent('Footer_Social_Click', { platform: social.platform });
            });
        }
    });
}

/**
 * Set copyright year dynamically
 */
function setCopyrightYear() {
    const currentYear = new Date().getFullYear();

    if ($w('#copyrightText').valid) {
        $w('#copyrightText').text = `© ${currentYear} Shamrock Bail Bonds. All rights reserved.`;
    }

    // License info
    if ($w('#licenseText').valid) {
        $w('#licenseText').text = 'Licensed Bail Bond Agent - State of Florida';
    }
}

/**
 * Set up newsletter signup form
 */
function setupNewsletter() {
    if (!$w('#newsletterForm').valid) return;

    $w('#newsletterSubmit').onClick(async () => {
        const email = $w('#newsletterEmail').value;

        if (!email || !isValidEmail(email)) {
            $w('#newsletterError').text = 'Please enter a valid email address';
            $w('#newsletterError').show();
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
            $w('#newsletterForm').hide();
            $w('#newsletterSuccess').show();
            $w('#newsletterSuccess').text = 'Thank you for subscribing!';

            trackEvent('Newsletter_Subscribe', { source: 'footer' });

        } catch (error) {
            $w('#newsletterError').text = 'Error subscribing. Please try again.';
            $w('#newsletterError').show();
        } finally {
            $w('#newsletterSubmit').enable();
            $w('#newsletterSubmit').label = 'Subscribe';
        }
    });
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
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

// Export for use in masterPage.js
export { setupContactInfo, setupFooterNav };
