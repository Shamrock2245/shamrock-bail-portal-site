/**
 * HOME.c1dmp.js - Shamrock Bail Bonds Home Page
 *
 * ============================================================
 * IMPORT RULES — READ BEFORE EDITING
 * ============================================================
 * ALLOWED:   import from 'wix-*'  (compile to $ns lookups, safe)
 * FORBIDDEN: import from 'backend/*'  (creates dynamic chunk → crash)
 * FORBIDDEN: import from 'public/*'   (creates dynamic chunk → crash)
 *
 * Root cause (confirmed 2026-03-10):
 * backend/* and public/* imports inject a webpack JSONP runtime
 * INSIDE the strict-mode inner function where `this` is undefined.
 * wix-* imports compile to $ns["wix-location"] etc. in the OUTER
 * AMD factory scope — no crash.
 *
 * ============================================================
 * ELEMENT IDs — CONFIRMED FROM LIVE DOM INSPECTION 2026-03-10
 * ============================================================
 * Dropdown:         comp-mjiotw4a
 * Get Started btn:  comp-mjip0apd
 * (Find My Jail is in masterPage.js: comp-ml15h39u)
 * ============================================================
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';
import { session } from 'wix-storage';

// ---------------------------------------------------------------------------
// Inline county data -- no backend call, no dynamic chunk
// ---------------------------------------------------------------------------
const FLORIDA_COUNTIES = [
    { name: 'Alachua', slug: 'alachua' },
    { name: 'Baker', slug: 'baker' },
    { name: 'Bay', slug: 'bay' },
    { name: 'Bradford', slug: 'bradford' },
    { name: 'Brevard', slug: 'brevard' },
    { name: 'Broward', slug: 'broward' },
    { name: 'Calhoun', slug: 'calhoun' },
    { name: 'Charlotte', slug: 'charlotte' },
    { name: 'Citrus', slug: 'citrus' },
    { name: 'Clay', slug: 'clay' },
    { name: 'Collier', slug: 'collier' },
    { name: 'Columbia', slug: 'columbia' },
    { name: 'DeSoto', slug: 'desoto' },
    { name: 'Dixie', slug: 'dixie' },
    { name: 'Duval', slug: 'duval' },
    { name: 'Escambia', slug: 'escambia' },
    { name: 'Flagler', slug: 'flagler' },
    { name: 'Franklin', slug: 'franklin' },
    { name: 'Gadsden', slug: 'gadsden' },
    { name: 'Gilchrist', slug: 'gilchrist' },
    { name: 'Glades', slug: 'glades' },
    { name: 'Gulf', slug: 'gulf' },
    { name: 'Hamilton', slug: 'hamilton' },
    { name: 'Hardee', slug: 'hardee' },
    { name: 'Hendry', slug: 'hendry' },
    { name: 'Hernando', slug: 'hernando' },
    { name: 'Highlands', slug: 'highlands' },
    { name: 'Hillsborough', slug: 'hillsborough' },
    { name: 'Holmes', slug: 'holmes' },
    { name: 'Indian River', slug: 'indian-river' },
    { name: 'Jackson', slug: 'jackson' },
    { name: 'Jefferson', slug: 'jefferson' },
    { name: 'Lafayette', slug: 'lafayette' },
    { name: 'Lake', slug: 'lake' },
    { name: 'Lee', slug: 'lee' },
    { name: 'Leon', slug: 'leon' },
    { name: 'Levy', slug: 'levy' },
    { name: 'Liberty', slug: 'liberty' },
    { name: 'Madison', slug: 'madison' },
    { name: 'Manatee', slug: 'manatee' },
    { name: 'Marion', slug: 'marion' },
    { name: 'Martin', slug: 'martin' },
    { name: 'Miami-Dade', slug: 'miami-dade' },
    { name: 'Monroe', slug: 'monroe' },
    { name: 'Nassau', slug: 'nassau' },
    { name: 'Okaloosa', slug: 'okaloosa' },
    { name: 'Okeechobee', slug: 'okeechobee' },
    { name: 'Orange', slug: 'orange' },
    { name: 'Osceola', slug: 'osceola' },
    { name: 'Palm Beach', slug: 'palm-beach' },
    { name: 'Pasco', slug: 'pasco' },
    { name: 'Pinellas', slug: 'pinellas' },
    { name: 'Polk', slug: 'polk' },
    { name: 'Putnam', slug: 'putnam' },
    { name: 'Santa Rosa', slug: 'santa-rosa' },
    { name: 'Sarasota', slug: 'sarasota' },
    { name: 'Seminole', slug: 'seminole' },
    { name: 'St. Johns', slug: 'st-johns' },
    { name: 'St. Lucie', slug: 'st-lucie' },
    { name: 'Sumter', slug: 'sumter' },
    { name: 'Suwannee', slug: 'suwannee' },
    { name: 'Taylor', slug: 'taylor' },
    { name: 'Union', slug: 'union' },
    { name: 'Volusia', slug: 'volusia' },
    { name: 'Wakulla', slug: 'wakulla' },
    { name: 'Walton', slug: 'walton' },
    { name: 'Washington', slug: 'washington' }
];

// ---------------------------------------------------------------------------
// Element ID constants -- confirmed from live DOM inspection 2026-03-10
// ---------------------------------------------------------------------------
const DROPDOWN_IDS    = ['#comp-mjiotw4a', '#countySelector', '#countyDropdown'];
const GET_STARTED_IDS = ['#comp-mjip0apd', '#getStartedButton', '#getStartedBtn'];

// ---------------------------------------------------------------------------
// onReady
// ---------------------------------------------------------------------------

$w.onReady(function () {
    const isMobile = wixWindow.formFactor === 'Mobile';

    // SEO meta -- synchronous, required for correct crawling
    try { setupHomepageMeta(); } catch (e) { console.warn('[SEO] setupHomepageMeta failed:', e); }
    // Defer schema to yield to first paint
    setTimeout(() => {
        try { setupOrganizationSchema(); } catch (e) { console.warn('[SEO] setupOrganizationSchema failed:', e); }
    }, 0);

    // Above-the-fold setup
    setupHeroSection();
    setupCTAButtons();

    // Load county dropdown immediately -- data is inline, no async needed
    loadCountyDropdown();

    // Testimonials: register viewport trigger; data loads on scroll, not on page load
    setTimeout(() => { initTestimonials(); }, isMobile ? 1500 : 800);

    // Telegram Hub analytics bridge (non-blocking)
    initTelegramHubSection();
});

// ---------------------------------------------------------------------------
// Hero + CTA
// ---------------------------------------------------------------------------

function setupHeroSection() {
    try {
        const heroBtn = $w('#heroCallBtn');
        if (heroBtn && heroBtn.id) {
            heroBtn.onClick(() => { scrollToCountySelector(); });
        }
    } catch (e) { /* non-fatal */ }
}

function setupCTAButtons() {
    try {
        const spanishBtn = $w('#callNowSpanishBtn');
        if (spanishBtn && spanishBtn.id) {
            spanishBtn.onClick(() => {
                trackEvent('spanish_call_clicked', { location: 'hero_section' });
                wixLocation.to('tel:12399550301');
            });
        }
    } catch (e) { /* non-fatal */ }

    try {
        const telegramBtn = $w('#telegramBotBtn');
        if (telegramBtn && telegramBtn.id) {
            telegramBtn.onClick(() => { trackEvent('telegram_bot_clicked', { location: 'home_page' }); });
        }
    } catch (e) { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
// County Dropdown -- INLINE DATA, NO BACKEND CALL
// ---------------------------------------------------------------------------

/**
 * Resolve a Wix element by trying multiple IDs in order.
 * Returns the first element found, or null.
 */
function resolveElement(ids) {
    for (let i = 0; i < ids.length; i++) {
        try {
            const el = $w(ids[i]);
            if (el && el.uniqueId) return el;
        } catch (e) { /* try next */ }
    }
    return null;
}

/**
 * Load county dropdown using inline FLORIDA_COUNTIES data.
 * No backend import, no dynamic chunk.
 * Uses real comp- IDs confirmed from live DOM inspection 2026-03-10.
 */
function loadCountyDropdown() {
    const dropdown = resolveElement(DROPDOWN_IDS);

    if (!dropdown) {
        console.warn('[County Dropdown] Dropdown element not found. Tried: ' + DROPDOWN_IDS.join(', '));
        return;
    }

    try {
        // Populate directly from inline data -- synchronous, no async needed
        dropdown.options = FLORIDA_COUNTIES.map(function(county) {
            return { label: county.name, value: county.slug };
        });
        dropdown.placeholder = 'Select a County';

        // Wire onChange handler
        dropdown.onChange(function() { handleCountySelection(dropdown); });

        // Wire Get Started button
        const getStartedBtn = resolveElement(GET_STARTED_IDS);
        if (getStartedBtn) {
            getStartedBtn.onClick(function() { handleGetStarted(dropdown); });
        } else {
            console.warn('[County Dropdown] Get Started button not found. Tried: ' + GET_STARTED_IDS.join(', '));
        }

    } catch (error) {
        console.error('[County Dropdown] Setup error:', error);
        try { dropdown.placeholder = 'Call (239) 332-2245 for help'; } catch (e) { /* non-fatal */ }
    }
}

// ---------------------------------------------------------------------------
// County selection handlers
// ---------------------------------------------------------------------------

let _countySelectTimer = null;

function handleCountySelection(dropdownEl) {
    const dropdown = dropdownEl || resolveElement(DROPDOWN_IDS);
    if (!dropdown) return;
    const selectedCounty = dropdown.value;
    if (selectedCounty) {
        trackEvent('county_selected', { county: selectedCounty });
        clearTimeout(_countySelectTimer);
        _countySelectTimer = setTimeout(function() { navigateToCounty(selectedCounty); }, 200);
    }
}

function handleGetStarted(dropdownEl) {
    const dropdown = dropdownEl || resolveElement(DROPDOWN_IDS);
    if (!dropdown) return;
    const selectedCounty = dropdown.value;
    if (!selectedCounty) return;
    trackEvent('get_started_clicked', { county: selectedCounty });
    navigateToCounty(selectedCounty);
}

function navigateToCounty(selectedCounty) {
    if (!selectedCounty) {
        console.warn('[County Nav] navigateToCounty called with empty value -- aborting.');
        return;
    }
    const cleanSlug = String(selectedCounty)
        .toLowerCase()
        .trim()
        .replace(/-county$/i, '')
        .replace(/\s+county$/i, '')
        .replace(/\s+/g, '-');

    if (!cleanSlug) return;
    console.log('[County Nav] Navigating to /florida-bail-bonds/' + cleanSlug);
    wixLocation.to('/florida-bail-bonds/' + cleanSlug);
}

function scrollToCountySelector() {
    const el = resolveElement(DROPDOWN_IDS);
    if (el) { try { el.scrollTo(); } catch (e) { /* non-fatal */ } }
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

function initTestimonials() {
    try {
        const repeater = $w('#testimonialRepeater');
        if (!repeater || !repeater.id) return;
        repeater.onViewportEnter(function() { loadTestimonials(); });
    } catch (e) { /* non-fatal */ }
}

function loadTestimonials() {
    try {
        const repeater = $w('#testimonialRepeater');
        if (!repeater || !repeater.id) return;
        if (repeater.data && repeater.data.length > 0) return;

        repeater.data = [
            { _id: '1', name: 'Steve D.', text: 'Answered immediately and had everything moving fast. You can tell they know exactly what they\'re doing.', rating: 5 },
            { _id: '2', name: 'Brian C.', text: 'Calm, respectful, and professional when we needed it most. They handled everything.', rating: 5 },
            { _id: '3', name: 'Ana E.', text: 'They picked up late at night and never rushed us off the phone.', rating: 5 },
            { _id: '4', name: 'Rafael I.', text: 'They treated us like people, not a number. That mattered more than anything.', rating: 5 }
        ];

        repeater.onItemReady(function($item, itemData) {
            try {
                const nameTxt = $item('#testimonialName') || $item('#authorName');
                if (nameTxt && nameTxt.id) nameTxt.text = itemData.name;
            } catch (e) { /* non-fatal */ }
            try {
                const bodyTxt = $item('#testimonialText') || $item('#quoteText');
                if (bodyTxt && bodyTxt.id) bodyTxt.text = itemData.text;
            } catch (e) { /* non-fatal */ }
        });
    } catch (e) { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

function setupHomepageMeta() {
    const title = '24/7 Bail Bonds Florida | Shamrock Bail Bonds - Fort Myers Since 2012';
    const description = 'Shamrock Bail Bonds is located in Lee County, FL. We are the bail bonding agency of choice for fast, professional, discreet service. We serve all of Florida. Located steps away from the Lee County Jail and in the heartbeat of the Legal Community in Downtown Fort Myers.';
    const url = 'https://www.shamrockbailbonds.biz';

    wixSeo.setTitle(title);
    wixSeo.setLinks([{ rel: 'canonical', href: url }]);
    wixSeo.setMetaTags([
        { name: 'description', content: description },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: url + '/logo.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:site_name', content: 'Shamrock Bail Bonds, LLC' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: url + '/logo.png' },
        { name: 'keywords', content: 'bail bonds Florida, Fort Myers bail bonds, 24/7 bail bondsman, Florida jail release, Lee County bail bonds, Collier County bail bonds, Charlotte County bail bonds, bail bond payment plans, immigration bail bonds Florida, bilingual bail bonds' }
    ]);
}

function setupOrganizationSchema() {
    const schemas = [
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://www.shamrockbailbonds.biz/#organization",
            "name": "Shamrock Bail Bonds",
            "legalName": "Shamrock Bail Bonds LLC",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": "https://www.shamrockbailbonds.biz/logo.png",
            "foundingDate": "2012-03-15",
            "description": "Professional 24/7 bail bond services throughout Florida since 2012. Fast, reliable, and confidential bail bonds with bilingual support.",
            "slogan": "Fort Myers Since 2012",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "geo": { "@type": "GeoCoordinates", "latitude": "26.6406", "longitude": "-81.8723" },
            "telephone": "+1-239-332-2245",
            "contactPoint": [
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-332-2245",
                    "contactType": "Customer Service",
                    "areaServed": "FL",
                    "availableLanguage": ["English", "Spanish"],
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "00:00", "closes": "23:59"
                    }
                },
                { "@type": "ContactPoint", "telephone": "+1-239-332-5245", "contactType": "Emergency", "areaServed": "FL", "availableLanguage": ["English", "Spanish"] },
                { "@type": "ContactPoint", "telephone": "+1-239-955-0301", "contactType": "Customer Service", "areaServed": "FL", "availableLanguage": "Spanish" }
            ],
            "areaServed": { "@type": "State", "name": "Florida", "@id": "https://en.wikipedia.org/wiki/Florida" },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00", "closes": "23:59"
            },
            "priceRange": "$$",
            "paymentAccepted": "Cash, Credit Card, Debit Card",
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds",
                "https://t.me/ShamrockBail_bot"
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://www.shamrockbailbonds.biz/#localbusiness",
            "name": "Shamrock Bail Bonds",
            "image": "https://www.shamrockbailbonds.biz/logo.png",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "geo": { "@type": "GeoCoordinates", "latitude": "26.6406", "longitude": "-81.8723" },
            "url": "https://www.shamrockbailbonds.biz",
            "telephone": "+1-239-332-2245",
            "priceRange": "$$",
            "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "127", "bestRating": "5", "worstRating": "1" },
            "review": [
                {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Steve D." },
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
                    "reviewBody": "Answered immediately and had everything moving fast. You can tell they know exactly what they're doing."
                },
                {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Brian C." },
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
                    "reviewBody": "Calm, respectful, and professional when we needed it most. They handled everything."
                },
                {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Ana E." },
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
                    "reviewBody": "They picked up late at night and never rushed us off the phone."
                },
                {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Rafael I." },
                    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
                    "reviewBody": "They treated us like people, not a number. That mattered more than anything."
                }
            ],
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00", "closes": "23:59"
                }
            ],
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds",
                "https://t.me/ShamrockBail_bot"
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Bail Bonds",
            "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
            "areaServed": [{ "@type": "State", "name": "Florida" }],
            "availableChannel": {
                "@type": "ServiceChannel",
                "servicePhone": { "@type": "ContactPoint", "telephone": "+1-239-332-2245", "availableLanguage": ["English", "Spanish"] },
                "serviceUrl": "https://www.shamrockbailbonds.biz"
            },
            "hoursAvailable": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00", "closes": "23:59"
            }
        }
    ];

    // E. FAQPage Schema — AI citation magnet for bail bond queries
    schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How much does a bail bond cost in Florida?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Florida bail bonds cost 10% of the total bail amount, with a minimum of $100 per charge. For example, if bail is set at $5,000, the bond premium is $500. Shamrock Bail Bonds accepts cash, credit cards, and offers flexible payment plans. A $125 transfer fee applies for counties outside Lee and Charlotte County, waived for bonds over $25,000."
                }
            },
            {
                "@type": "Question",
                "name": "How long does it take to get out of jail after posting bail in Florida?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "After a bail bond is posted, release typically takes 4 to 12 hours depending on the county jail's processing time. Lee County Jail in Fort Myers averages 4–8 hours. Larger facilities like Hillsborough or Miami-Dade may take up to 12 hours. Shamrock Bail Bonds begins the process immediately upon contact — call (239) 332-2245 any time, 24/7."
                }
            },
            {
                "@type": "Question",
                "name": "Do bail bond companies offer payment plans?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Shamrock Bail Bonds offers flexible payment plans for qualifying clients. You can put a portion down and pay the remainder over time. Payment plans are available for bonds of all sizes. Contact us at (239) 332-2245 to discuss options — we work with your budget."
                }
            },
            {
                "@type": "Question",
                "name": "Can I bail someone out of jail online in Florida?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Shamrock Bail Bonds offers a fully digital bail bond process. You can start online at shamrockbailbonds.biz, through our Telegram bot (@ShamrockBail_bot), or by calling (239) 332-2245. All paperwork is sent to your phone via text message for digital signature — no office visit required. We serve all 67 Florida counties remotely."
                }
            },
            {
                "@type": "Question",
                "name": "What information do I need to bail someone out of jail?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To start the bail bond process, you need the defendant's full legal name, date of birth, and the county where they were arrested. Shamrock Bail Bonds will look up their booking details, charges, and bail amount instantly. You'll also need a valid ID and a method of payment (cash, credit card, or payment plan arrangement)."
                }
            }
        ]
    });

    // F. WebSite Schema with SearchAction (enables Google Sitelinks Search Box)
    schemas.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://www.shamrockbailbonds.biz/#website",
        "name": "Shamrock Bail Bonds",
        "url": "https://www.shamrockbailbonds.biz",
        "description": "24/7 bail bond services throughout Florida since 2012. Fast, professional, and confidential.",
        "publisher": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://www.shamrockbailbonds.biz/florida-bail-bonds/{search_term_string}"
            },
            "query-input": "required name=search_term_string"
        },
        "inLanguage": ["en-US", "es"]
    });

    // F. HowTo Schema (rich snippet for "how to get bail bonds in Florida")
    schemas.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Get a Bail Bond in Florida",
        "description": "Step-by-step guide to securing a bail bond in Florida with Shamrock Bail Bonds. Available 24/7 with bilingual support.",
        "totalTime": "PT30M",
        "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": "100"
        },
        "step": [
            {
                "@type": "HowToStep",
                "position": 1,
                "name": "Contact Shamrock Bail Bonds",
                "text": "Call (239) 332-2245 any time, 24/7. You can also start online via our portal, Telegram bot, or text us. We answer immediately — you'll never get a voicemail.",
                "url": "https://www.shamrockbailbonds.biz"
            },
            {
                "@type": "HowToStep",
                "position": 2,
                "name": "Provide Defendant Information",
                "text": "Tell us the defendant's full name, date of birth, and the county where they were arrested. We'll look up their booking details and charges instantly.",
                "url": "https://www.shamrockbailbonds.biz"
            },
            {
                "@type": "HowToStep",
                "position": 3,
                "name": "Review & Sign Paperwork",
                "text": "We'll prepare the bond paperwork and send it to your phone via text message. Sign everything digitally from your phone — no office visit required.",
                "url": "https://www.shamrockbailbonds.biz"
            },
            {
                "@type": "HowToStep",
                "position": 4,
                "name": "Make Payment",
                "text": "Pay the premium (typically 10% of the bail amount, minimum $100 per charge). We accept cash, credit cards, debit cards, and offer flexible payment plans.",
                "url": "https://www.shamrockbailbonds.biz"
            },
            {
                "@type": "HowToStep",
                "position": 5,
                "name": "Defendant Released",
                "text": "Once the bond is posted at the jail, the defendant is released. Release times vary by county but are typically 4-12 hours.",
                "url": "https://www.shamrockbailbonds.biz"
            }
        ]
    });

    // G. SpeakableSpecification on Organization (AI voice search targeting)
    schemas[0]["speakable"] = {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", "h2", ".hero-title", ".hero-subtitle", ".about-text"]
    };

    // H. ItemList Schema — 67 County Directory Hub (crawl signal for entire county cluster)
    schemas.push({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Florida Bail Bonds by County",
        "description": "Shamrock Bail Bonds serves all 67 Florida counties. Find your county for local bail bond information, jail details, and 24/7 service.",
        "numberOfItems": FLORIDA_COUNTIES.length,
        "itemListElement": FLORIDA_COUNTIES.map(function(county, index) {
            return {
                "@type": "ListItem",
                "position": index + 1,
                "name": county.name + " County Bail Bonds",
                "url": "https://www.shamrockbailbonds.biz/florida-bail-bonds/" + county.slug
            };
        })
    });

    wixSeo.setStructuredData(schemas).catch(function(e) { console.error('Schema error:', e); });
}

// ---------------------------------------------------------------------------
// Telegram Hub Section -- Analytics Bridge (no backend call)
// ---------------------------------------------------------------------------

function initTelegramHubSection() {
    try {
        const embed = $w('#telegramHubEmbed');
        if (embed && embed.onMessage) {
            embed.onMessage(handleTelegramHubMessage);
        }
    } catch (e) { /* #telegramHubEmbed not on page */ }
    try {
        $w('#telegramHubSection').onViewportEnter(function() {
            trackEvent('TelegramHub_SectionVisible', { section: 'telegram_hub' });
        });
    } catch (e) { /* element may not exist */ }
}

function handleTelegramHubMessage(event) {
    let data;
    try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (e) { return; }
    if (!data) return;

    if (data.type === 'shamrock_iframe_height' && data.height) {
        return;
    }

    if (data.type !== 'shamrock_analytics') return;

    const evtName = data.event || 'unknown';
    const label = data.label || '';
    const section = data.section || 'telegram_hub';

    trackEvent('TelegramHub_' + evtName, { label: label, section: section });
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

function trackEvent(eventName, eventData) {
    try {
        const payload = eventData || {};
        payload.event = eventName;
        wixWindow.trackEvent('CustomEvent', payload);
    } catch (e) { /* fail silently */ }
}
