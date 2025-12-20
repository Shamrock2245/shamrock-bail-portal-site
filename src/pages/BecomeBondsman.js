/**
 * Shamrock Bail Bonds - How to Become a Bondsman Page
 * 
 * Educational page about becoming a licensed bail bondsman in Florida.
 * Includes information about requirements, training, and future Shamrock Bail School.
 * 
 * URL: /become-a-bondsman
 * 
 * Page Elements (Wix Editor IDs):
 * - #heroSection: Page hero
 * - #requirementsSection: Florida licensing requirements
 * - #processSection: Step-by-step process
 * - #trainingSection: Training and education info
 * - #schoolSection: Shamrock Bail School (coming soon)
 * - #faqSection: FAQ
 * - #ctaSection: Contact CTA
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

$w.onReady(function () {
    initializePage();
    setupEventListeners();
    loadContent();
});

/**
 * Initialize page
 */
function initializePage() {
    // Track page view
    trackEvent('PageView', { page: 'BecomeBondsman' });
    
    // Set SEO
    setPageSEO();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // CTA buttons
    $w('#contactBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'contact', page: 'become_bondsman' });
        wixLocation.to('tel:+12393322245');
    });
    
    $w('#emailBtn').onClick(() => {
        trackEvent('CTA_Click', { button: 'email', page: 'become_bondsman' });
        wixLocation.to('mailto:info@shamrockbailbonds.biz?subject=Bail Bondsman Career Inquiry');
    });
    
    // School notification signup
    $w('#notifyMeBtn').onClick(() => {
        trackEvent('School_Notify_Click', { page: 'become_bondsman' });
        wixWindow.openLightbox('SchoolNotification');
    });
    
    // FAQ accordion
    setupFAQAccordion();
    
    // External links
    $w('#dfsPLink').onClick(() => {
        trackEvent('External_Link', { destination: 'dfsp', page: 'become_bondsman' });
    });
}

/**
 * Load page content
 */
function loadContent() {
    loadRequirements();
    loadProcess();
    loadTrainingInfo();
    loadSchoolInfo();
    loadFAQ();
}

/**
 * Load Florida licensing requirements
 */
function loadRequirements() {
    const requirements = [
        {
            title: "Age Requirement",
            description: "Must be at least 18 years old",
            icon: "user"
        },
        {
            title: "Citizenship",
            description: "Must be a U.S. citizen or legal resident alien",
            icon: "flag"
        },
        {
            title: "Education",
            description: "High school diploma or equivalent (GED)",
            icon: "graduation"
        },
        {
            title: "Background Check",
            description: "Must pass a criminal background check. Certain felonies and crimes of moral turpitude may disqualify applicants.",
            icon: "shield"
        },
        {
            title: "Pre-Licensing Course",
            description: "Complete a 120-hour bail bond agent course from an approved provider",
            icon: "book"
        },
        {
            title: "State Examination",
            description: "Pass the Florida bail bond agent licensing examination",
            icon: "check"
        },
        {
            title: "Surety Company Appointment",
            description: "Obtain appointment from a licensed surety insurance company",
            icon: "handshake"
        },
        {
            title: "Application & Fees",
            description: "Submit application to the Florida Department of Financial Services with required fees",
            icon: "document"
        }
    ];
    
    if ($w('#requirementsRepeater').valid) {
        $w('#requirementsRepeater').data = requirements.map((req, index) => ({
            ...req,
            _id: `req-${index}`
        }));
        
        $w('#requirementsRepeater').onItemReady(($item, itemData) => {
            $item('#reqTitle').text = itemData.title;
            $item('#reqDescription').text = itemData.description;
        });
    }
}

/**
 * Load step-by-step process
 */
function loadProcess() {
    const steps = [
        {
            number: 1,
            title: "Research the Career",
            description: "Understand what bail bondsmen do, the risks involved, and the earning potential. Speak with working bondsmen if possible.",
            duration: "1-2 weeks"
        },
        {
            number: 2,
            title: "Verify Eligibility",
            description: "Ensure you meet all basic requirements including age, citizenship, education, and background check criteria.",
            duration: "1 week"
        },
        {
            number: 3,
            title: "Complete Pre-Licensing Course",
            description: "Enroll in and complete a 120-hour bail bond agent course from a Florida-approved provider. Courses cover bail bond law, procedures, and ethics.",
            duration: "2-4 weeks"
        },
        {
            number: 4,
            title: "Pass the State Exam",
            description: "Schedule and pass the Florida bail bond agent licensing examination administered by PSI Services.",
            duration: "1-2 weeks"
        },
        {
            number: 5,
            title: "Get Appointed by a Surety",
            description: "Contact surety insurance companies to obtain an appointment. This allows you to write bonds backed by their company.",
            duration: "2-4 weeks"
        },
        {
            number: 6,
            title: "Submit License Application",
            description: "Apply to the Florida Department of Financial Services with all required documentation and fees.",
            duration: "4-6 weeks"
        },
        {
            number: 7,
            title: "Start Your Career",
            description: "Once licensed, you can begin working as a bail bond agent. Consider working with an established agency to gain experience.",
            duration: "Ongoing"
        }
    ];
    
    if ($w('#processRepeater').valid) {
        $w('#processRepeater').data = steps.map((step, index) => ({
            ...step,
            _id: `step-${index}`
        }));
        
        $w('#processRepeater').onItemReady(($item, itemData) => {
            $item('#stepNumber').text = itemData.number.toString();
            $item('#stepTitle').text = itemData.title;
            $item('#stepDescription').text = itemData.description;
            $item('#stepDuration').text = `Typical Duration: ${itemData.duration}`;
        });
    }
}

/**
 * Load training information
 */
function loadTrainingInfo() {
    const trainingContent = `
        <h3>120-Hour Pre-Licensing Course</h3>
        <p>Florida requires all bail bond agent applicants to complete a 120-hour pre-licensing course from an approved provider. The course covers:</p>
        
        <ul>
            <li><strong>Florida Bail Bond Law</strong> - Statutes, regulations, and legal requirements</li>
            <li><strong>Criminal Justice System</strong> - Courts, procedures, and the role of bail</li>
            <li><strong>Bond Writing Procedures</strong> - How to properly execute bail bonds</li>
            <li><strong>Collateral and Indemnity</strong> - Securing bonds and managing risk</li>
            <li><strong>Ethics and Professional Conduct</strong> - Industry standards and best practices</li>
            <li><strong>Fugitive Recovery</strong> - Legal aspects of apprehending bail jumpers</li>
        </ul>
        
        <h4>Course Formats</h4>
        <p>Pre-licensing courses are available in several formats:</p>
        <ul>
            <li><strong>In-Person Classes</strong> - Traditional classroom instruction</li>
            <li><strong>Online Courses</strong> - Self-paced online learning</li>
            <li><strong>Hybrid Programs</strong> - Combination of online and in-person</li>
        </ul>
        
        <h4>Approved Providers</h4>
        <p>The Florida Department of Financial Services maintains a list of approved course providers. Make sure any course you take is on the approved list.</p>
    `;
    
    if ($w('#trainingContent').valid) {
        $w('#trainingContent').html = trainingContent;
    }
}

/**
 * Load Shamrock Bail School information
 */
function loadSchoolInfo() {
    const schoolContent = `
        <div class="school-announcement">
            <h3>🍀 Shamrock Bail School - Coming Soon!</h3>
            <p>We're excited to announce that Shamrock Bail Bonds will be launching our own bail bond training school!</p>
            
            <h4>What to Expect</h4>
            <ul>
                <li>Comprehensive 120-hour pre-licensing course</li>
                <li>Taught by experienced, licensed bail bond professionals</li>
                <li>Real-world case studies and practical training</li>
                <li>Exam preparation and study materials</li>
                <li>Job placement assistance upon completion</li>
                <li>Flexible scheduling options</li>
            </ul>
            
            <h4>Stay Tuned</h4>
            <p>We're currently finalizing our curriculum and scheduling. Sign up below to be notified when enrollment opens!</p>
        </div>
    `;
    
    if ($w('#schoolContent').valid) {
        $w('#schoolContent').html = schoolContent;
    }
    
    // Show "Coming Soon" badge
    if ($w('#comingSoonBadge').valid) {
        $w('#comingSoonBadge').show();
    }
}

/**
 * Load FAQ content
 */
function loadFAQ() {
    const faqs = [
        {
            question: "How much do bail bondsmen make in Florida?",
            answer: "Income varies widely based on experience, location, and business volume. Entry-level agents may earn $30,000-$50,000 annually, while experienced agents with established client bases can earn $75,000-$150,000 or more. Many successful bondsmen own their own agencies."
        },
        {
            question: "How long does it take to become a licensed bail bondsman?",
            answer: "The entire process typically takes 3-6 months from start to finish. This includes completing the 120-hour course (2-4 weeks), passing the exam, obtaining a surety appointment, and processing your license application."
        },
        {
            question: "Can I become a bail bondsman with a criminal record?",
            answer: "It depends on the nature and timing of the offense. Certain felonies and crimes of moral turpitude may disqualify you. The Florida Department of Financial Services reviews each application individually. Minor offenses from many years ago may not be disqualifying."
        },
        {
            question: "Do I need to work for a bail bond company, or can I start my own?",
            answer: "New licensees typically start working for an established agency to gain experience. Starting your own agency requires additional capital, surety relationships, and business knowledge. Most successful agency owners worked for others for several years first."
        },
        {
            question: "Is the bail bond business dangerous?",
            answer: "There are inherent risks, particularly when dealing with fugitive recovery. However, proper training, good judgment, and following legal procedures significantly reduce risks. Many bondsmen never encounter dangerous situations."
        },
        {
            question: "What's the difference between a bail bondsman and a bounty hunter?",
            answer: "A bail bondsman (bail bond agent) writes bail bonds and guarantees defendants' court appearances. A bounty hunter (fugitive recovery agent) locates and apprehends defendants who have skipped bail. In Florida, bail bondsmen can perform their own fugitive recovery or hire specialists."
        },
        {
            question: "How much does it cost to become a bail bondsman?",
            answer: "Total costs typically range from $1,500-$3,000, including: pre-licensing course ($500-$1,000), exam fees ($50-$100), license application fees ($300-$500), and fingerprinting/background check ($50-$100). Additional costs may include errors & omissions insurance."
        }
    ];
    
    if ($w('#faqRepeater').valid) {
        $w('#faqRepeater').data = faqs.map((faq, index) => ({
            ...faq,
            _id: `faq-${index}`
        }));
        
        $w('#faqRepeater').onItemReady(($item, itemData, index) => {
            $item('#faqQuestion').text = itemData.question;
            $item('#faqAnswer').text = itemData.answer;
            $item('#faqAnswer').collapse();
            $item('#faqIcon').text = '+';
            
            $item('#faqHeader').onClick(() => {
                if ($item('#faqAnswer').collapsed) {
                    $item('#faqAnswer').expand();
                    $item('#faqIcon').text = '−';
                } else {
                    $item('#faqAnswer').collapse();
                    $item('#faqIcon').text = '+';
                }
                trackEvent('FAQ_Click', { question: itemData.question, page: 'become_bondsman' });
            });
        });
    }
}

/**
 * Set up FAQ accordion
 */
function setupFAQAccordion() {
    // Handled in loadFAQ
}

/**
 * Set page SEO
 */
function setPageSEO() {
    import('wix-seo').then((wixSEO) => {
        wixSEO.title = "How to Become a Bail Bondsman in Florida | Shamrock Bail Bonds";
        
        wixSEO.metaTags = [
            {
                name: "description",
                content: "Learn how to become a licensed bail bondsman in Florida. Complete guide to requirements, training, licensing, and career opportunities. Shamrock Bail School coming soon!"
            },
            {
                name: "keywords",
                content: "become bail bondsman Florida, bail bond agent license, bail bond training, Florida bail bond school, bail bondsman requirements"
            }
        ];
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

export { loadRequirements, loadProcess, loadFAQ };
