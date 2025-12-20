/**
 * Shamrock Bail Bonds - Contact Page
 * 
 * Contact information and form for general inquiries.
 * Includes office locations, hours, and multiple contact methods.
 * 
 * URL: /contact
 * 
 * Page Elements (Wix Editor IDs):
 * - #contactForm: Contact form
 * - #officeInfo: Office location and hours
 * - #mapSection: Google Map embed
 * - #emergencyCTA: Emergency bail CTA
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixData from 'wix-data';

// Contact information
const CONTACT_INFO = {
    phone: '239-332-2245',
    phoneTel: 'tel:+12393322245',
    email: 'info@shamrockbailbonds.biz',
    address: {
        street: '2245 Main Street',
        city: 'Fort Myers',
        state: 'FL',
        zip: '33901'
    },
    hours: {
        emergency: '24/7 Emergency Service',
        office: 'Office Hours: Mon-Fri 9AM-5PM'
    },
    social: {
        facebook: 'https://facebook.com/shamrockbailbonds',
        twitter: 'https://twitter.com/shamrockbail',
        instagram: 'https://instagram.com/shamrockbailbonds'
    }
};

$w.onReady(function () {
    initializePage();
    setupEventListeners();
    displayContactInfo();
    checkUrlParams();
});

/**
 * Initialize page
 */
function initializePage() {
    // Track page view
    trackEvent('PageView', { page: 'Contact' });
    
    // Set SEO
    setPageSEO();
    
    // Initialize form
    resetForm();
}

/**
 * Check URL parameters for pre-filled data
 */
function checkUrlParams() {
    const params = wixLocation.query;
    
    // Check for reason parameter (from fallback redirects)
    if (params.reason) {
        $w('#reasonDropdown').value = params.reason;
        
        if (params.reason === 'bail-paperwork') {
            $w('#urgentBanner').show();
            $w('#urgentBanner').text = 'Having trouble with online paperwork? Call us now for immediate assistance!';
        }
    }
    
    // Pre-fill from source
    if (params.source) {
        $w('#sourceField').value = params.source;
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Form submission
    $w('#contactForm').onSubmit(async (event) => {
        event.preventDefault();
        await submitForm();
    });
    
    $w('#submitBtn').onClick(async () => {
        await submitForm();
    });
    
    // Phone CTA
    $w('#callNowBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'call_now', page: 'contact' });
        wixLocation.to(CONTACT_INFO.phoneTel);
    });
    
    // Email link
    $w('#emailLink').onClick(() => {
        trackEvent('Contact_Email_Click', { page: 'contact' });
        wixLocation.to(`mailto:${CONTACT_INFO.email}`);
    });
    
    // Emergency bail CTA
    $w('#emergencyBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'emergency_bail', page: 'contact' });
        wixLocation.to('/members/start-bail');
    });
    
    // Form field validation
    setupFormValidation();
    
    // Social links
    setupSocialLinks();
}

/**
 * Display contact information
 */
function displayContactInfo() {
    // Phone
    $w('#phoneNumber').text = CONTACT_INFO.phone;
    $w('#phoneLink').link = CONTACT_INFO.phoneTel;
    
    // Email
    $w('#emailAddress').text = CONTACT_INFO.email;
    $w('#emailLink').link = `mailto:${CONTACT_INFO.email}`;
    
    // Address
    const fullAddress = `${CONTACT_INFO.address.street}, ${CONTACT_INFO.address.city}, ${CONTACT_INFO.address.state} ${CONTACT_INFO.address.zip}`;
    $w('#officeAddress').text = fullAddress;
    
    // Hours
    $w('#emergencyHours').text = CONTACT_INFO.hours.emergency;
    $w('#officeHours').text = CONTACT_INFO.hours.office;
}

/**
 * Set up form validation
 */
function setupFormValidation() {
    // Name validation
    $w('#nameInput').onBlur(() => {
        validateName();
    });
    
    // Email validation
    $w('#emailInput').onBlur(() => {
        validateEmail();
    });
    
    // Phone validation
    $w('#phoneInput').onBlur(() => {
        validatePhone();
    });
    
    // Message validation
    $w('#messageInput').onBlur(() => {
        validateMessage();
    });
}

/**
 * Validate name field
 */
function validateName() {
    const name = $w('#nameInput').value.trim();
    if (!name) {
        $w('#nameError').text = 'Please enter your name';
        $w('#nameError').show();
        return false;
    }
    $w('#nameError').hide();
    return true;
}

/**
 * Validate email field
 */
function validateEmail() {
    const email = $w('#emailInput').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        $w('#emailError').text = 'Please enter your email';
        $w('#emailError').show();
        return false;
    }
    
    if (!emailRegex.test(email)) {
        $w('#emailError').text = 'Please enter a valid email address';
        $w('#emailError').show();
        return false;
    }
    
    $w('#emailError').hide();
    return true;
}

/**
 * Validate phone field
 */
function validatePhone() {
    const phone = $w('#phoneInput').value.trim();
    const phoneRegex = /^[\d\s\-\(\)\.+]+$/;
    
    if (!phone) {
        $w('#phoneError').text = 'Please enter your phone number';
        $w('#phoneError').show();
        return false;
    }
    
    if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 10) {
        $w('#phoneError').text = 'Please enter a valid phone number';
        $w('#phoneError').show();
        return false;
    }
    
    $w('#phoneError').hide();
    return true;
}

/**
 * Validate message field
 */
function validateMessage() {
    const message = $w('#messageInput').value.trim();
    
    if (!message) {
        $w('#messageError').text = 'Please enter your message';
        $w('#messageError').show();
        return false;
    }
    
    if (message.length < 10) {
        $w('#messageError').text = 'Please provide more details';
        $w('#messageError').show();
        return false;
    }
    
    $w('#messageError').hide();
    return true;
}

/**
 * Validate entire form
 */
function validateForm() {
    const nameValid = validateName();
    const emailValid = validateEmail();
    const phoneValid = validatePhone();
    const messageValid = validateMessage();
    
    return nameValid && emailValid && phoneValid && messageValid;
}

/**
 * Submit contact form
 */
async function submitForm() {
    // Validate form
    if (!validateForm()) {
        $w('#formError').text = 'Please correct the errors above';
        $w('#formError').show();
        return;
    }
    
    try {
        // Show loading state
        $w('#submitBtn').disable();
        $w('#submitBtn').label = 'Sending...';
        $w('#formError').hide();
        
        // Collect form data
        const formData = {
            name: $w('#nameInput').value.trim(),
            email: $w('#emailInput').value.trim(),
            phone: $w('#phoneInput').value.trim(),
            reason: $w('#reasonDropdown').value || 'general',
            message: $w('#messageInput').value.trim(),
            source: $w('#sourceField').value || 'contact_page',
            submittedAt: new Date(),
            status: 'new'
        };
        
        // Save to database
        await wixData.insert('ContactSubmissions', formData);
        
        // Track submission
        trackEvent('Contact_Form_Submit', {
            reason: formData.reason,
            source: formData.source
        });
        
        // Show success message
        $w('#contactForm').hide();
        $w('#successMessage').show();
        $w('#successMessage').text = 'Thank you for your message! We\'ll get back to you as soon as possible.';
        
        // For urgent matters, show call prompt
        if (formData.reason === 'bail-paperwork' || formData.reason === 'urgent') {
            $w('#urgentFollowUp').show();
            $w('#urgentFollowUp').text = 'For immediate assistance, please call us at ' + CONTACT_INFO.phone;
        }
        
    } catch (error) {
        console.error('Error submitting form:', error);
        $w('#formError').text = 'There was an error sending your message. Please try again or call us directly.';
        $w('#formError').show();
        
        trackEvent('Contact_Form_Error', { error: error.message });
    } finally {
        $w('#submitBtn').enable();
        $w('#submitBtn').label = 'Send Message';
    }
}

/**
 * Reset form to initial state
 */
function resetForm() {
    $w('#nameInput').value = '';
    $w('#emailInput').value = '';
    $w('#phoneInput').value = '';
    $w('#reasonDropdown').value = 'general';
    $w('#messageInput').value = '';
    $w('#sourceField').value = '';
    
    // Hide all error messages
    $w('#nameError').hide();
    $w('#emailError').hide();
    $w('#phoneError').hide();
    $w('#messageError').hide();
    $w('#formError').hide();
    
    // Set up reason dropdown options
    $w('#reasonDropdown').options = [
        { value: 'general', label: 'General Inquiry' },
        { value: 'bail-question', label: 'Question About Bail' },
        { value: 'bail-paperwork', label: 'Bail Paperwork Help' },
        { value: 'payment', label: 'Payment Question' },
        { value: 'bondsman-career', label: 'Becoming a Bondsman' },
        { value: 'partnership', label: 'Business Partnership' },
        { value: 'other', label: 'Other' }
    ];
}

/**
 * Set up social media links
 */
function setupSocialLinks() {
    if ($w('#facebookLink').valid) {
        $w('#facebookLink').link = CONTACT_INFO.social.facebook;
        $w('#facebookLink').target = '_blank';
    }
    
    if ($w('#twitterLink').valid) {
        $w('#twitterLink').link = CONTACT_INFO.social.twitter;
        $w('#twitterLink').target = '_blank';
    }
    
    if ($w('#instagramLink').valid) {
        $w('#instagramLink').link = CONTACT_INFO.social.instagram;
        $w('#instagramLink').target = '_blank';
    }
}

/**
 * Set page SEO
 */
function setPageSEO() {
    import('wix-seo').then((wixSEO) => {
        wixSEO.title = 'Contact Shamrock Bail Bonds | 24/7 Bail Bond Service';
        
        wixSEO.metaTags = [
            {
                name: "description",
                content: `Contact Shamrock Bail Bonds for 24/7 bail bond services across Florida. Call ${CONTACT_INFO.phone} for immediate assistance or use our contact form.`
            },
            {
                name: "keywords",
                content: "contact bail bondsman, Florida bail bonds phone, bail bond help, emergency bail contact"
            }
        ];
        
        // Local business structured data
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Shamrock Bail Bonds",
            "telephone": CONTACT_INFO.phone,
            "email": CONTACT_INFO.email,
            "address": {
                "@type": "PostalAddress",
                "streetAddress": CONTACT_INFO.address.street,
                "addressLocality": CONTACT_INFO.address.city,
                "addressRegion": CONTACT_INFO.address.state,
                "postalCode": CONTACT_INFO.address.zip,
                "addressCountry": "US"
            },
            "openingHours": "Mo-Su 00:00-24:00",
            "priceRange": "$$"
        };
        
        wixSEO.structuredData = [structuredData];
    });
}

/**
 * Track events
 */
function trackEvent(eventName, eventData) {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

export { submitForm, validateForm, resetForm };
