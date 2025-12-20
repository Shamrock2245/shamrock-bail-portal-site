/**
 * FAQ Page
 * Filename: pages/FAQ.js
 * 
 * Comprehensive FAQ page with bail bonds questions and answers.
 * Includes schema markup for SEO and accordion functionality.
 * 
 * Page Elements:
 * - #faqTitle: Page title
 * - #faqSubtitle: Page subtitle
 * - #faqRepeater: Repeater for FAQ items
 * - #searchInput: FAQ search input
 * - #categoryFilter: Category filter dropdown
 * - #ctaSection: Call-to-action section
 * - #callButton: Call now button
 * - #startBailButton: Start bail online button
 */

import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';

// FAQ Data
const faqData = [
    // General Bail Questions
    {
        id: 'what-is-bail',
        category: 'general',
        question: 'What is bail?',
        answer: 'Bail is a financial arrangement that allows a person accused of a crime to be released from jail while awaiting trial. It serves as a guarantee that the defendant will appear for all scheduled court dates. The bail amount is set by a judge based on factors like the severity of the charges, flight risk, and criminal history.'
    },
    {
        id: 'what-is-bail-bond',
        category: 'general',
        question: 'What is a bail bond?',
        answer: 'A bail bond is a surety bond provided by a licensed bail bondsman that guarantees the full bail amount to the court. Instead of paying the entire bail amount, you pay a non-refundable premium (typically 10% in Florida) to the bail bondsman, who then posts the bond for the defendant\'s release.'
    },
    {
        id: 'how-much-does-bail-cost',
        category: 'cost',
        question: 'How much does a bail bond cost in Florida?',
        answer: 'In Florida, bail bond premiums are regulated by the state and typically cost 10% of the total bail amount. For example, if bail is set at $10,000, the bail bond premium would be $1,000. This premium is non-refundable and is the fee for the bail bondsman\'s services. Additional fees may apply for certain services.'
    },
    {
        id: 'what-is-collateral',
        category: 'cost',
        question: 'What is collateral and when is it required?',
        answer: 'Collateral is property or assets pledged to secure a bail bond. It may be required for larger bail amounts or higher-risk cases. Common forms of collateral include real estate, vehicles, jewelry, or other valuable assets. Collateral is returned once the case is resolved and all court obligations are met.'
    },
    {
        id: 'payment-plans',
        category: 'cost',
        question: 'Do you offer payment plans?',
        answer: 'Yes, Shamrock Bail Bonds offers flexible payment plans to help make bail affordable. We understand that unexpected arrests can strain finances, so we work with you to create a payment arrangement that fits your budget. Contact us to discuss your options.'
    },
    // Process Questions
    {
        id: 'how-long-release',
        category: 'process',
        question: 'How long does it take to get released on bail?',
        answer: 'Release times vary by facility and circumstances. Once the bail bond paperwork is completed and the bond is posted, release typically takes 2-8 hours depending on the jail\'s processing time, current inmate population, and time of day. We work to expedite the process as much as possible.'
    },
    {
        id: 'what-information-needed',
        category: 'process',
        question: 'What information do I need to bail someone out?',
        answer: 'To post bail, you\'ll need: the defendant\'s full legal name, date of birth, booking number (if available), the jail location, the charges, and the bail amount. You\'ll also need a valid government-issued ID and payment for the premium. Our agents can help you gather this information.'
    },
    {
        id: 'can-bail-out-of-state',
        category: 'process',
        question: 'Can I bail someone out from another state?',
        answer: 'Yes, you can arrange bail from anywhere. Our online bail process allows you to complete paperwork electronically using SignNow. You can sign documents, upload your ID, and make payments remotely. We handle everything to get your loved one released quickly.'
    },
    {
        id: 'what-happens-after-bail',
        category: 'process',
        question: 'What happens after bail is posted?',
        answer: 'After bail is posted, the defendant is released from custody and must comply with all bail conditions. This includes appearing at all scheduled court dates, avoiding new arrests, and following any specific conditions set by the court (like travel restrictions or no-contact orders). The indemnitor (co-signer) is responsible for ensuring the defendant\'s compliance.'
    },
    // Responsibility Questions
    {
        id: 'indemnitor-responsibility',
        category: 'responsibility',
        question: 'What are my responsibilities as an indemnitor (co-signer)?',
        answer: 'As an indemnitor, you guarantee that the defendant will appear for all court dates. If the defendant fails to appear, you may be responsible for the full bail amount plus any recovery costs. You should maintain contact with the defendant, ensure they attend court, and notify us immediately if you cannot locate them.'
    },
    {
        id: 'what-if-miss-court',
        category: 'responsibility',
        question: 'What happens if the defendant misses a court date?',
        answer: 'If a defendant misses a court date, a warrant is issued for their arrest and the bail bond may be forfeited. Contact us immediately if a court date is missed - we may be able to help get the warrant recalled if the defendant surrenders quickly. Missing court has serious consequences for both the defendant and the indemnitor.'
    },
    {
        id: 'can-cancel-bond',
        category: 'responsibility',
        question: 'Can I cancel a bail bond?',
        answer: 'An indemnitor can request to be removed from a bail bond under certain circumstances. This typically requires surrendering the defendant back to custody. Contact us to discuss your situation - we can explain your options and the process involved.'
    },
    // Florida-Specific Questions
    {
        id: 'florida-bail-laws',
        category: 'florida',
        question: 'What are Florida\'s bail bond laws?',
        answer: 'Florida bail bonds are regulated by the Florida Department of Financial Services. Bail bond premiums are set at 10% of the bail amount. All bail agents must be licensed. Florida has specific rules about collateral, payment plans, and bond conditions. Shamrock Bail Bonds is fully licensed and compliant with all Florida regulations.'
    },
    {
        id: 'which-counties-serve',
        category: 'florida',
        question: 'Which Florida counties do you serve?',
        answer: 'Shamrock Bail Bonds serves all 67 Florida counties. We have strong relationships with jails and courts throughout the state, allowing us to post bonds quickly anywhere in Florida. Whether you\'re in Lee County, Miami-Dade, or the Panhandle, we can help.'
    },
    {
        id: 'felony-vs-misdemeanor',
        category: 'florida',
        question: 'Is there a difference between felony and misdemeanor bail?',
        answer: 'Yes, felony charges typically have higher bail amounts than misdemeanors due to the severity of the charges. Some serious felonies may have no bail or very high bail amounts. The bail bond premium percentage (10%) remains the same regardless of the charge type.'
    },
    // Practical Questions
    {
        id: 'available-24-7',
        category: 'practical',
        question: 'Are you available 24/7?',
        answer: 'Yes, Shamrock Bail Bonds is available 24 hours a day, 7 days a week, 365 days a year. Arrests don\'t follow business hours, and neither do we. Call us anytime at 239-332-2245 or start the bail process online.'
    },
    {
        id: 'accept-credit-cards',
        category: 'practical',
        question: 'What payment methods do you accept?',
        answer: 'We accept cash, credit cards (Visa, MasterCard, American Express, Discover), debit cards, and money orders. We also offer payment plans for those who qualify. Our goal is to make bail as accessible as possible.'
    },
    {
        id: 'confidential',
        category: 'practical',
        question: 'Is my information kept confidential?',
        answer: 'Yes, all information you provide is kept strictly confidential. We understand the sensitive nature of bail situations and maintain the highest standards of privacy. Your personal and financial information is protected and never shared without your consent.'
    },
    {
        id: 'get-premium-back',
        category: 'practical',
        question: 'Do I get the bail bond premium back?',
        answer: 'No, the bail bond premium is non-refundable. It is the fee for the bail bondsman\'s service of posting the bond and assuming the risk. This is true regardless of the case outcome. However, any collateral posted is returned once the case is resolved and all obligations are met.'
    }
];

// Category labels
const categories = {
    all: 'All Questions',
    general: 'General Bail Questions',
    cost: 'Costs & Payments',
    process: 'The Bail Process',
    responsibility: 'Responsibilities',
    florida: 'Florida-Specific',
    practical: 'Practical Questions'
};

$w.onReady(function () {
    initializePage();
    setupSEO();
    setupEventListeners();
    renderFAQs(faqData);
});

/**
 * Initialize page
 */
function initializePage() {
    // Set page content
    $w('#faqTitle').text = 'Frequently Asked Questions';
    $w('#faqSubtitle').text = 'Get answers to common questions about bail bonds in Florida';
    
    // Populate category filter
    const categoryOptions = Object.entries(categories).map(([value, label]) => ({
        value,
        label
    }));
    $w('#categoryFilter').options = categoryOptions;
    $w('#categoryFilter').value = 'all';
}

/**
 * Set up SEO with FAQ schema
 */
function setupSEO() {
    // Set page meta
    wixSeo.setTitle('Bail Bonds FAQ | Shamrock Bail Bonds | Florida');
    wixSeo.setMetaDescription('Get answers to frequently asked questions about bail bonds in Florida. Learn about costs, the bail process, your responsibilities, and more.');
    
    // Create FAQ schema markup
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqData.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
    
    // Add structured data
    wixSeo.setStructuredData([faqSchema]);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Search input
    $w('#searchInput').onInput((event) => {
        const searchTerm = event.target.value.toLowerCase();
        filterFAQs(searchTerm, $w('#categoryFilter').value);
    });
    
    // Category filter
    $w('#categoryFilter').onChange((event) => {
        const category = event.target.value;
        filterFAQs($w('#searchInput').value.toLowerCase(), category);
    });
    
    // CTA buttons
    $w('#callButton').onClick(() => {
        wixLocation.to('tel:+12393322245');
    });
    
    $w('#startBailButton').onClick(() => {
        wixLocation.to('/members/start-bail');
    });
    
    // FAQ item click (accordion)
    $w('#faqRepeater').onItemReady(($item, itemData) => {
        $item('#faqQuestion').text = itemData.question;
        $item('#faqAnswer').text = itemData.answer;
        $item('#faqAnswer').collapse();
        
        $item('#faqQuestionContainer').onClick(() => {
            if ($item('#faqAnswer').collapsed) {
                $item('#faqAnswer').expand();
                $item('#expandIcon').text = '−';
            } else {
                $item('#faqAnswer').collapse();
                $item('#expandIcon').text = '+';
            }
        });
    });
}

/**
 * Render FAQs in repeater
 */
function renderFAQs(faqs) {
    $w('#faqRepeater').data = faqs;
    
    // Update count
    if ($w('#faqCount')) {
        $w('#faqCount').text = `${faqs.length} questions`;
    }
}

/**
 * Filter FAQs by search term and category
 */
function filterFAQs(searchTerm, category) {
    let filtered = faqData;
    
    // Filter by category
    if (category && category !== 'all') {
        filtered = filtered.filter(faq => faq.category === category);
    }
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(faq => 
            faq.question.toLowerCase().includes(searchTerm) ||
            faq.answer.toLowerCase().includes(searchTerm)
        );
    }
    
    renderFAQs(filtered);
    
    // Show no results message if needed
    if (filtered.length === 0) {
        if ($w('#noResultsMessage')) {
            $w('#noResultsMessage').show();
        }
    } else {
        if ($w('#noResultsMessage')) {
            $w('#noResultsMessage').hide();
        }
    }
}

/**
 * Expand all FAQs
 */
export function expandAll() {
    $w('#faqRepeater').forEachItem(($item) => {
        $item('#faqAnswer').expand();
        $item('#expandIcon').text = '−';
    });
}

/**
 * Collapse all FAQs
 */
export function collapseAll() {
    $w('#faqRepeater').forEachItem(($item) => {
        $item('#faqAnswer').collapse();
        $item('#expandIcon').text = '+';
    });
}

export { faqData, categories };
