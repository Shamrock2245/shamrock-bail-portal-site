/**
 * Shamrock Bail Bonds - Home Page
 * 
 * This is the main landing page for Shamrock Bail Bonds.
 * Mobile-first, conversion-focused design with clear CTAs.
 * 
 * Page Elements (Wix Editor IDs):
 * - #heroSection: Main hero section
 * - #callNowBtn: Primary CTA - Call Now
 * - #startBailBtn: Secondary CTA - Start Bail Now
 * - #trustBar: Trust indicators section
 * - #howItWorksSection: Process explanation
 * - #countySelector: County dropdown/search
 * - #testimonialSection: Customer testimonials
 * - #faqSection: FAQ accordion
 * - #ctaSection: Final call to action
 * - #stickyMobileCTA: Mobile sticky footer CTA
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSite from 'wix-site';

// Phone number for all CTAs
const PHONE_NUMBER = '239-332-2245';
const PHONE_TEL = 'tel:+12393322245';

$w.onReady(function () {
    initializePage();
    setupEventListeners();
    handleMobileView();
    trackPageView();
});

/**
 * Initialize page elements and data
 */
function initializePage() {
    // Set up hero section animations
    animateHeroSection();
    
    // Load trust indicators
    loadTrustIndicators();
    
    // Initialize FAQ accordion
    initializeFAQ();
    
    // Check if user is logged in for personalization
    checkUserStatus();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Primary CTA - Call Now
    $w('#callNowBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'call_now', location: 'hero' });
        wixLocation.to(PHONE_TEL);
    });
    
    // Secondary CTA - Start Bail Now
    $w('#startBailBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'start_bail', location: 'hero' });
        wixLocation.to('/members/start-bail');
    });
    
    // Mobile Sticky CTA - Call
    $w('#mobileCallBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'call_now', location: 'sticky_mobile' });
        wixLocation.to(PHONE_TEL);
    });
    
    // Mobile Sticky CTA - Start Bail
    $w('#mobileStartBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'start_bail', location: 'sticky_mobile' });
        wixLocation.to('/members/start-bail');
    });
    
    // County selector
    if ($w('#countySelector').valid) {
        $w('#countySelector').onChange((event) => {
            const selectedCounty = event.target.value;
            if (selectedCounty) {
                trackEvent('County_Selected', { county: selectedCounty });
                wixLocation.to(`/bail-bonds/${selectedCounty.toLowerCase().replace(/\s+/g, '-')}-county`);
            }
        });
    }
    
    // How It Works - Learn More buttons
    $w('#learnMoreBtn').onClick(() => {
        trackEvent('Navigation', { destination: 'how_bail_works' });
        wixLocation.to('/how-bail-works');
    });
    
    // Final CTA Section
    $w('#finalCallBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'call_now', location: 'final_cta' });
        wixLocation.to(PHONE_TEL);
    });
    
    $w('#finalStartBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'start_bail', location: 'final_cta' });
        wixLocation.to('/members/start-bail');
    });
}

/**
 * Handle mobile-specific view adjustments
 */
function handleMobileView() {
    wixWindow.getBoundingRect()
        .then((windowSize) => {
            const isMobile = windowSize.window.width < 768;
            
            if (isMobile) {
                // Show mobile sticky CTA
                $w('#stickyMobileCTA').show();
                
                // Adjust hero text for mobile
                $w('#heroTitle').text = "Need Bail? We're Here 24/7";
                
                // Simplify navigation for mobile
                $w('#desktopNav').hide();
                $w('#mobileMenuBtn').show();
            } else {
                // Hide mobile sticky CTA on desktop
                $w('#stickyMobileCTA').hide();
                
                // Full hero text for desktop
                $w('#heroTitle').text = "Fast, Professional Bail Bonds Across Florida";
                
                // Show desktop navigation
                $w('#desktopNav').show();
                $w('#mobileMenuBtn').hide();
            }
        });
}

/**
 * Animate hero section elements on load
 */
function animateHeroSection() {
    // Fade in hero content with staggered timing
    const heroElements = ['#heroTitle', '#heroSubtitle', '#heroCTAContainer'];
    
    heroElements.forEach((selector, index) => {
        setTimeout(() => {
            $w(selector).show('fade', { duration: 500 });
        }, index * 200);
    });
}

/**
 * Load and display trust indicators
 */
function loadTrustIndicators() {
    const trustData = [
        { icon: 'shield', text: 'Licensed & Insured' },
        { icon: 'clock', text: '24/7 Availability' },
        { icon: 'check', text: 'All 67 Florida Counties' },
        { icon: 'star', text: '30+ Years Experience' },
        { icon: 'lock', text: 'Confidential Service' }
    ];
    
    // Trust indicators are typically set up in the editor
    // This function can be used for dynamic updates if needed
}

/**
 * Initialize FAQ accordion functionality
 */
function initializeFAQ() {
    const faqItems = [
        {
            question: "How quickly can you post bail?",
            answer: "In most cases, we can have your loved one released within 2-4 hours after paperwork is completed. Our 24/7 availability means we start working on your case immediately."
        },
        {
            question: "What do I need to post bail?",
            answer: "You'll need a valid government-issued ID, information about the person in custody (full name, date of birth, booking number if available), and the ability to pay the bail bond premium (typically 10% of the total bail amount)."
        },
        {
            question: "Do you offer payment plans?",
            answer: "Yes! We understand that bail can be an unexpected expense. We offer flexible payment plans to help make bail affordable. Contact us to discuss your options."
        },
        {
            question: "What happens after bail is posted?",
            answer: "Once bail is posted, the jail will process the release paperwork. Release times vary by facility but typically range from 2-8 hours. We'll keep you informed throughout the process."
        },
        {
            question: "Can I start the bail process online?",
            answer: "Absolutely! You can start the bail paperwork process online through our secure portal. This can significantly speed up the release process. Click 'Start Bail Now' to begin."
        }
    ];
    
    // FAQ items are typically set up as a repeater in Wix
    // This data can be used to populate a dynamic FAQ section
}

/**
 * Check user login status for personalization
 */
function checkUserStatus() {
    import('wix-members').then((wixMembers) => {
        wixMembers.currentMember.getMember()
            .then((member) => {
                if (member) {
                    // User is logged in - personalize experience
                    $w('#startBailBtn').label = 'Continue Your Case';
                    $w('#welcomeText').text = `Welcome back, ${member.contactDetails.firstName || 'there'}!`;
                    $w('#welcomeText').show();
                }
            })
            .catch((error) => {
                // User not logged in - default experience
                console.log('User not logged in');
            });
    });
}

/**
 * Track page view for analytics
 */
function trackPageView() {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent('PageView', {
            page: 'Home',
            url: wixLocation.url
        });
    });
}

/**
 * Track custom events
 * @param {string} eventName - Name of the event
 * @param {object} eventData - Additional event data
 */
function trackEvent(eventName, eventData) {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

/**
 * Export functions for testing
 */
export { initializePage, setupEventListeners, handleMobileView };
