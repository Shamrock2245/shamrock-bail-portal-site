/**
 * HOME.c1dmp.js - Shamrock Bail Bonds Home Page
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';
import { session } from 'wix-storage';
// @ts-ignore -- prefetchPageResources: Wix SDK, speeds up next-page navigation
import { site as wixSite } from '@wix/site-site';

// ---------------------------------------------------------------------------
// Inline county data -- no backend call, no dynamic chunk, no crash
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
    // Mobile: defer registration slightly to let above-fold render first
    setTimeout(() => { initTestimonials(); }, isMobile ? 1500 : 800);

    // Telegram Hub analytics bridge (non-blocking)
    initTelegramHubSection();

    // Prefetch high-likelihood next pages after first paint
    // This is totally non-blocking; Wix fetches resources in the background
    setTimeout(() => {
        try {
            wixSite.prefetchPageResources({
                pages: ['/portal-landing', '/florida-bail-bonds/lee']
            }).catch(() => { }); // errors are non-fatal
        } catch (e) { /* non-fatal */ }
    }, isMobile ? 3000 : 1500);
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
 * Load county dropdown using inline FLORIDA_COUNTIES data.
 * No backend import, no dynamic chunk, no webpack crash.
 */
function loadCountyDropdown() {
    let dropdown = null;
    try {
        dropdown = $w('#countySelector');
    } catch (e) { /* element not found */ }

    if (!dropdown || !dropdown.id) {
        console.warn('[County Dropdown] #countySelector not found on page.');
        return;
    }

    try {
        // Populate directly from inline data -- synchronous, no async needed
        dropdown.options = FLORIDA_COUNTIES.map(county => ({
            label: county.name,
            value: county.slug
        }));
        dropdown.placeholder = 'Select a County';

        // Wire onChange handler
        dropdown.onChange(() => { handleCountySelection(dropdown); });

        // Prefetch: fire prefetchPageResources when user focuses the dropdown
        // This means the county page is already loading BEFORE they finish selecting
        try {
            if (typeof dropdown.onFocus === 'function') {
                dropdown.onFocus(() => {
                    // Prefetch top counties — user intent signal
                    wixSite.prefetchPageResources({
                        pages: [
                            '/florida-bail-bonds/lee',
                            '/florida-bail-bonds/collier',
                            '/florida-bail-bonds/charlotte'
                        ]
                    }).catch(() => { });
                });
            }
        } catch (e) { /* onFocus may not be supported on all dropdown types */ }

        // Wire Get Started button
        let getStartedBtn = null;
        try {
            getStartedBtn = $w('#getStartedBtn');
        } catch (e) { /* non-fatal */ }

        if (getStartedBtn && getStartedBtn.id) {
            getStartedBtn.onClick(() => { handleGetStarted(dropdown); });
        }

    } catch (error) {
        console.error('[County Dropdown] Setup error:', error);
        try { dropdown.placeholder = 'Call (239) 332-2245 for help'; } catch (e) { /* non-fatal */ }
    }
}

// ---------------------------------------------------------------------------
// County selection handlers
// ---------------------------------------------------------------------------

// Debounce timer for county selection (prevents accidental mobile double-taps)
let _countySelectTimer = null;

function handleCountySelection(dropdownEl) {
    let dropdown = dropdownEl;
    if (!dropdown || !dropdown.id) {
        try {
            dropdown = $w('#countySelector');
        } catch (e) { return; }
    }
    const selectedCounty = dropdown ? dropdown.value : '';
    if (selectedCounty) {
        trackEvent('county_selected', { county: selectedCounty });
        // Prefetch the specific county page on selection (before 200ms fires)
        try {
            wixSite.prefetchPageResources({
                pages: ['/florida-bail-bonds/' + selectedCounty]
            }).catch(() => { });
        } catch (e) { /* non-fatal */ }
        // 200ms debounce: prevents accidental mobile touch from triggering immediate navigation
        clearTimeout(_countySelectTimer);
        _countySelectTimer = setTimeout(() => { navigateToCounty(selectedCounty); }, 200);
    }
}

function handleGetStarted(dropdownEl) {
    let dropdown = dropdownEl;
    if (!dropdown || !dropdown.id) {
        try {
            dropdown = $w('#countySelector');
        } catch (e) { return; }
    }
    const selectedCounty = dropdown ? dropdown.value : '';
    if (!selectedCounty) {
        return;
    }
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
    wixLocation.to('/florida-bail-bonds/' + cleanSlug);
}

function scrollToCountySelector() {
    try {
        const el = $w('#countySelector');
        if (el && el.id) { el.scrollTo(); }
    } catch (e) { /* non-fatal */ }
}

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

function initTestimonials() {
    try {
        const repeater = $w('#testimonialRepeater');
        if (!repeater || !repeater.id) return;
        // Only load on viewport enter -- avoids fetching off-screen data on page load
        repeater.onViewportEnter(() => { loadTestimonials(); });
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

        repeater.onItemReady(($item, itemData) => {
            try {
                const nameTxt = ($item(`${'#testimonialName'}`).id) ? $item(`${'#testimonialName'}`) : $item(`${'#authorName'}`);
                if (nameTxt && nameTxt.id) nameTxt.text = itemData.name;
            } catch (e) { /* non-fatal */ }
            try {
                const bodyTxt = ($item(`${'#testimonialText'}`).id) ? $item(`${'#testimonialText'}`) : $item(`${'#quoteText'}`);
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
    wixSeo.setMetaTags([
        { name: 'description', content: description },
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
            "foundingDate": "2012",
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
            "paymentAccepted": "Cash, Credit Card, Debit Card"
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
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00", "closes": "23:59"
                }
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

    wixSeo.setStructuredData(schemas).catch(e => console.error('Schema error:', e));
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
        $w('#telegramHubSection').onViewportEnter(() => {
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
        // Dynamic height resizing is not supported for HtmlComponent in Velo directly.
        // We catch the message but take no action to avoid TS compiler errors.
        return;
    }

    if (data.type !== 'shamrock_analytics') return;

    const evtName = data.event || 'unknown';
    const label = data.label || '';
    const section = data.section || 'telegram_hub';

    trackEvent('TelegramHub_' + evtName, { label, section });
    // Note: backend relay removed -- backend imports cause dynamic chunk crash.
    // High-value events are tracked via wixWindow.trackEvent above.
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
