/**
 * Shamrock Bail Bonds - How Bail Works Page
 * 
 * Educational page explaining the bail process in Florida.
 * Designed to reduce anxiety and build trust with clear, simple explanations.
 * 
 * Page Elements (Wix Editor IDs):
 * - #processTimeline: Visual timeline of bail process
 * - #stepCards: Step-by-step explanation cards
 * - #bailTypesSection: Types of bail bonds
 * - #costsSection: Cost breakdown
 * - #faqSection: Frequently asked questions
 * - #ctaSection: Call to action
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

// Phone number for CTAs
const PHONE_NUMBER = '239-332-2245';
const PHONE_TEL = 'tel:+12393322245';

$w.onReady(function () {
    initializePage();
    setupEventListeners();
    loadProcessSteps();
    loadBailTypes();
    initializeScrollAnimations();
});

/**
 * Initialize page
 */
function initializePage() {
    // Track page view
    trackEvent('PageView', { page: 'HowBailWorks' });
    
    // Set page metadata for SEO
    setPageMetadata();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // CTA Buttons
    $w('#callNowBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'call_now', page: 'how_bail_works' });
        wixLocation.to(PHONE_TEL);
    });
    
    $w('#startBailBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'start_bail', page: 'how_bail_works' });
        wixLocation.to('/members/start-bail');
    });
    
    // Interactive timeline steps
    setupTimelineInteraction();
    
    // FAQ accordion
    setupFAQAccordion();
}

/**
 * Load and display the bail process steps
 */
function loadProcessSteps() {
    const processSteps = [
        {
            number: 1,
            title: "Arrest & Booking",
            description: "When someone is arrested, they're taken to a local jail for booking. This includes fingerprinting, photographing, and entering their information into the system.",
            duration: "1-4 hours",
            icon: "arrest"
        },
        {
            number: 2,
            title: "Bail Amount Set",
            description: "A judge or bail schedule determines the bail amount based on the charges, criminal history, and flight risk. This can happen at a first appearance hearing or automatically for certain charges.",
            duration: "Varies",
            icon: "gavel"
        },
        {
            number: 3,
            title: "Contact Shamrock",
            description: "Call us at 239-332-2245 or start online. We're available 24/7 and can begin working on the release immediately. We'll explain your options and answer all questions.",
            duration: "5-15 minutes",
            icon: "phone"
        },
        {
            number: 4,
            title: "Complete Paperwork",
            description: "We'll guide you through the bail bond application. This can be done in person, over the phone, or through our secure online portal. You'll need valid ID and basic information about the defendant.",
            duration: "15-30 minutes",
            icon: "document"
        },
        {
            number: 5,
            title: "Bail Posted",
            description: "Once paperwork and payment are complete, we post the bail bond with the jail. This guarantees the defendant's appearance at all court dates.",
            duration: "30-60 minutes",
            icon: "check"
        },
        {
            number: 6,
            title: "Release",
            description: "The jail processes the release paperwork. Release times vary by facility and current workload. We'll keep you updated throughout the process.",
            duration: "2-8 hours",
            icon: "freedom"
        }
    ];
    
    // If using a repeater, populate it with step data
    if ($w('#stepsRepeater').valid) {
        $w('#stepsRepeater').data = processSteps;
        $w('#stepsRepeater').onItemReady(($item, itemData) => {
            $item('#stepNumber').text = itemData.number.toString();
            $item('#stepTitle').text = itemData.title;
            $item('#stepDescription').text = itemData.description;
            $item('#stepDuration').text = `Typical Duration: ${itemData.duration}`;
        });
    }
}

/**
 * Load bail types information
 */
function loadBailTypes() {
    const bailTypes = [
        {
            type: "Surety Bond",
            description: "The most common type. You pay a premium (typically 10% of bail) to a bail bondsman who guarantees the full bail amount.",
            pros: ["Lower upfront cost", "Available 24/7", "Professional guidance"],
            cons: ["Premium is non-refundable", "May require collateral for large bonds"]
        },
        {
            type: "Cash Bond",
            description: "Pay the full bail amount directly to the court. The money is returned (minus fees) when the case concludes.",
            pros: ["Full amount returned if defendant appears", "No third party involved"],
            cons: ["Requires full amount upfront", "Money tied up until case ends"]
        },
        {
            type: "Property Bond",
            description: "Use real estate as collateral for the bail amount. The property must have equity equal to or greater than the bail.",
            pros: ["No cash required", "Keep your property"],
            cons: ["Lengthy approval process", "Risk of losing property"]
        },
        {
            type: "Release on Own Recognizance (ROR)",
            description: "Released without paying bail, based on promise to appear. Usually for minor offenses and defendants with strong community ties.",
            pros: ["No cost", "Immediate release"],
            cons: ["Not available for all charges", "Judge must approve"]
        }
    ];
    
    // Populate bail types section if using repeater
    if ($w('#bailTypesRepeater').valid) {
        $w('#bailTypesRepeater').data = bailTypes;
        $w('#bailTypesRepeater').onItemReady(($item, itemData) => {
            $item('#typeTitle').text = itemData.type;
            $item('#typeDescription').text = itemData.description;
        });
    }
}

/**
 * Set up interactive timeline
 */
function setupTimelineInteraction() {
    // Allow clicking on timeline steps to expand details
    for (let i = 1; i <= 6; i++) {
        const stepSelector = `#step${i}`;
        if ($w(stepSelector).valid) {
            $w(stepSelector).onClick(() => {
                // Collapse all other steps
                for (let j = 1; j <= 6; j++) {
                    if (j !== i) {
                        $w(`#step${j}Details`).collapse();
                    }
                }
                // Toggle clicked step
                $w(`${stepSelector}Details`).expand();
                trackEvent('Timeline_Step_Click', { step: i });
            });
        }
    }
}

/**
 * Set up FAQ accordion functionality
 */
function setupFAQAccordion() {
    const faqs = [
        {
            question: "How much does a bail bond cost?",
            answer: "In Florida, bail bond premiums are regulated at 10% of the total bail amount. For example, if bail is set at $10,000, the premium would be $1,000. This premium is non-refundable and is the fee for our services."
        },
        {
            question: "What if I can't afford the premium?",
            answer: "We offer flexible payment plans to help make bail affordable. We can work with you to find a solution that fits your budget. Contact us to discuss your options."
        },
        {
            question: "What happens if the defendant doesn't appear in court?",
            answer: "If the defendant fails to appear, the court issues a warrant and the bail bond is forfeited. We will attempt to locate the defendant to bring them to court. Any collateral provided may be at risk."
        },
        {
            question: "Can bail be revoked?",
            answer: "Yes, bail can be revoked if the defendant violates bail conditions, commits another crime, or fails to appear in court. The defendant would then be returned to custody."
        },
        {
            question: "How long does the bail process take?",
            answer: "From initial contact to release typically takes 2-8 hours, depending on the jail's processing time. We work to expedite the process as much as possible."
        },
        {
            question: "Do you handle all types of charges?",
            answer: "We handle most criminal charges including misdemeanors and felonies. Some charges may require higher premiums or additional collateral. Contact us to discuss your specific situation."
        }
    ];
    
    // Populate FAQ repeater if available
    if ($w('#faqRepeater').valid) {
        $w('#faqRepeater').data = faqs;
        $w('#faqRepeater').onItemReady(($item, itemData, index) => {
            $item('#faqQuestion').text = itemData.question;
            $item('#faqAnswer').text = itemData.answer;
            $item('#faqAnswer').collapse();
            
            $item('#faqQuestion').onClick(() => {
                if ($item('#faqAnswer').collapsed) {
                    $item('#faqAnswer').expand();
                    $item('#faqIcon').text = '−';
                } else {
                    $item('#faqAnswer').collapse();
                    $item('#faqIcon').text = '+';
                }
                trackEvent('FAQ_Click', { question: itemData.question });
            });
        });
    }
}

/**
 * Initialize scroll-based animations
 */
function initializeScrollAnimations() {
    // Animate sections as they come into view
    const sections = ['#processSection', '#bailTypesSection', '#costsSection', '#faqSection'];
    
    sections.forEach((section) => {
        if ($w(section).valid) {
            // Initial state - hidden
            $w(section).hide();
            
            // Show when scrolled into view
            $w(section).onViewportEnter(() => {
                $w(section).show('slide', { duration: 500, direction: 'bottom' });
            });
        }
    });
}

/**
 * Set page metadata for SEO
 */
function setPageMetadata() {
    import('wix-seo').then((wixSEO) => {
        wixSEO.title = "How Bail Works in Florida | Shamrock Bail Bonds";
        wixSEO.metaTags = [
            { name: "description", content: "Learn how the bail process works in Florida. Understand bail bonds, costs, and what to expect. 24/7 bail bond services across all 67 Florida counties." },
            { name: "keywords", content: "bail bonds Florida, how bail works, bail process, Florida bail bondsman, bail bond cost" }
        ];
    });
}

/**
 * Track custom events
 */
function trackEvent(eventName, eventData) {
    import('wix-window').then((wixWindow) => {
        wixWindow.trackEvent(eventName, eventData);
    });
}

export { loadProcessSteps, loadBailTypes, setupFAQAccordion };
