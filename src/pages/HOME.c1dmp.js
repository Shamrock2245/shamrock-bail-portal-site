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

/** Canonical destinations — keep labels and URLs honest. */
const DEST = {
    phone: 'tel:+12393322245',
    phoneSpanish: 'tel:+12399550301',
    /** Open bot INSIDE Telegram (Mini Apps launch from the bot menu, not the public web). */
    telegramBot: 'https://t.me/ShamrockBail_bot',
    telegramStart: function (payload) {
        const p = String(payload || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 64);
        return p ? 'https://t.me/ShamrockBail_bot?start=' + encodeURIComponent(p) : DEST.telegramBot;
    },
    bailSchool: '/bail-school',
    bailSchoolSchedule: 'https://school.shamrockbailbonds.biz/schedule#calendar',
    bailSchoolRegister: 'https://school.shamrockbailbonds.biz/schedule#register',
    becomeBondsman: '/how-to-become-a-bondsman',
    howBailWorks: '/how-bail-works',
    /** Canonical FA hub (all 67 counties, nearest-first search). */
    firstAppearance: '/first-appearance',
    firstAppearanceCounty: function (slug) {
        const s = String(slug || '')
            .toLowerCase()
            .trim()
            .replace(/-county$/i, '')
            .replace(/\s+/g, '-');
        return s ? '/first-appearance/' + s : '/first-appearance';
    },
    contact: '/contact',
    portal: '/portal-landing',
    blog: '/blog'
};

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
    setupBailSchoolButtons();

    // Load county dropdown immediately -- data is inline, no async needed
    loadCountyDropdown();

    // Testimonials: register viewport trigger; data loads on scroll, not on page load
    setTimeout(() => { initTestimonials(); }, isMobile ? 1500 : 800);

    // Telegram Hub analytics + height + Mini-App deep-link policy
    initTelegramHubSection();
});

// ---------------------------------------------------------------------------
// Safe helpers
// ---------------------------------------------------------------------------

function safeOnClick(selector, handler) {
    try {
        const el = $w(selector);
        if (!el || typeof el.onClick !== 'function') return false;
        el.onClick(function () {
            try { handler(el); } catch (err) {
                console.error('[Home] click failed for ' + selector, err);
            }
        });
        return true;
    } catch (e) {
        return false;
    }
}

function goTo(url, eventName, eventData) {
    if (eventName) trackEvent(eventName, eventData || {});
    if (!url) return;
    wixLocation.to(url);
}

// ---------------------------------------------------------------------------
// Hero + CTA
// ---------------------------------------------------------------------------

function setupHeroSection() {
    // Hero primary CTA: start county selection (conversion funnel)
    if (!safeOnClick('#heroCallBtn', function () {
        trackEvent('hero_cta_clicked', { location: 'hero', action: 'scroll_to_county' });
        scrollToCountySelector();
    })) { /* optional */ }

    // Explicit phone CTAs (IDs that mean "call")
    ['#callNowBtn', '#heroPhoneBtn', '#headerCallBtn', '#stickyCallBtn', '#phoneCtaBtn'].forEach(function (id) {
        safeOnClick(id, function () {
            goTo(DEST.phone, 'phone_click', { location: 'home', selector: id });
        });
    });
}

function setupCTAButtons() {
    // Spanish line
    safeOnClick('#callNowSpanishBtn', function () {
        goTo(DEST.phoneSpanish, 'spanish_call_clicked', { location: 'hero_section' });
    });

    // Telegram bot — MUST open Telegram (Mini Apps live only inside the bot)
    safeOnClick('#telegramBotBtn', function () {
        goTo(DEST.telegramBot, 'telegram_bot_clicked', { location: 'home_page' });
    });
    safeOnClick('#openTelegramBtn', function () {
        goTo(DEST.telegramBot, 'telegram_bot_clicked', { location: 'home_page' });
    });
    safeOnClick('#telegramCtaBtn', function () {
        goTo(DEST.telegramBot, 'telegram_bot_clicked', { location: 'home_page' });
    });

    // Other common homepage CTAs
    safeOnClick('#startOnlineBtn', function () {
        goTo(DEST.portal, 'start_online_clicked', { location: 'home' });
    });
    safeOnClick('#howBailWorksBtn', function () {
        goTo(DEST.howBailWorks, 'how_bail_works_clicked', { location: 'home' });
    });
    safeOnClick('#firstAppearanceBtn', function () {
        goTo(DEST.firstAppearance, 'first_appearance_clicked', { location: 'home' });
    });
    safeOnClick('#contactUsBtn', function () {
        goTo(DEST.contact, 'contact_clicked', { location: 'home' });
    });
    safeOnClick('#blogBtn', function () {
        goTo(DEST.blog, 'blog_clicked', { location: 'home' });
    });
}

/**
 * Bail School CTAs on the homepage + any local registration control.
 * Footer #bailSchoolRegistrationBtn is also wired in masterPage.js (global).
 */
function setupBailSchoolButtons() {
    // Explicit registration / schedule CTAs → live LMS schedule (upcoming cohorts + enroll)
    const scheduleIds = [
        '#bailSchoolRegistrationBtn',
        '#bailSchoolScheduleBtn',
        '#bailSchoolRegisterBtn',
        '#viewBailSchoolScheduleBtn'
    ];
    scheduleIds.forEach(function (id) {
        safeOnClick(id, function () {
            goTo(DEST.bailSchoolRegister, 'bail_school_registration_clicked', {
                location: 'home',
                selector: id,
                destination: DEST.bailSchoolRegister
            });
        });
    });

    // Marketing / hub page
    ['#bailSchoolBtn', '#goToBailSchoolBtn', '#navBailSchool'].forEach(function (id) {
        safeOnClick(id, function () {
            goTo(DEST.bailSchool, 'bail_school_clicked', { location: 'home', selector: id });
        });
    });

    safeOnClick('#becomeBondsmanBtn', function () {
        goTo(DEST.becomeBondsman, 'become_bondsman_clicked', { location: 'home' });
    });
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
        const swflSlugs = ['lee', 'collier', 'charlotte', 'hendry', 'glades'];
        const swflDisplayMap = {
            lee: '⭐ Lee County (HQ — Fort Myers / Cape Coral)',
            collier: '⭐ Collier County (Naples / Immokalee)',
            charlotte: '⭐ Charlotte County (Punta Gorda / Port Charlotte)',
            hendry: '⭐ Hendry County (LaBelle / Clewiston)',
            glades: '⭐ Glades County (Moore Haven)'
        };

        const swflOptions = swflSlugs.map(function(slug) {
            return { label: swflDisplayMap[slug], value: slug };
        });

        const otherOptions = FLORIDA_COUNTIES
            .filter(function(c) { return swflSlugs.indexOf(c.slug) === -1; })
            .map(function(county) {
                return { label: county.name + ' County', value: county.slug };
            });

        // Combine SWFL Priority First + All 67 FL Counties
        dropdown.options = swflOptions.concat(otherOptions);
        dropdown.placeholder = 'Select Your County (Lee, Collier, Charlotte...)';

        // Wire onChange handler
        dropdown.onChange(function() { handleCountySelection(dropdown); });

        // Wire Get Started / Get Them Out button
        const getStartedBtn = resolveElement(GET_STARTED_IDS);
        if (getStartedBtn) {
            try { getStartedBtn.label = 'Get Them Out'; } catch (e) {}
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

    // Primary destination: that county’s bail bonds page (all 67 slugs).
    // FA hub deep-link is available from the county page + /first-appearance/{slug}.
    const dest = '/florida-bail-bonds/' + cleanSlug;
    console.log('[County Nav] Navigating to', dest);
    try {
        session.setItem('last_county_slug', cleanSlug);
    } catch (e) {
        /* non-fatal */
    }
    wixLocation.to(dest);
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
    const title = 'Fort Myers Bail Bonds | Cape Coral & Lee County | Shamrock';
    const description = '24/7 bail bonds in Fort Myers, Cape Coral, Naples, and all 67 Florida counties. Fast Lee County Jail release, payment plans, licensed since 2012. Call (239) 332-2245.';
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
        { name: 'keywords', content: 'Fort Myers bail bonds, Cape Coral bail bonds, Lee County bail bonds, Naples bail bonds, Punta Gorda bail bonds, Lehigh Acres bail bonds, 24/7 bail bondsman, Lee County Jail, bail bonds near me, Florida jail release, bail bond payment plans' }
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
                { "@type": "ContactPoint", "telephone": "+1-239-955-0301", "contactType": "Customer Service", "areaServed": "FL", "availableLanguage": "Spanish" },
                { "@type": "ContactPoint", "telephone": "+1-727-295-2245", "contactType": "Customer Service", "areaServed": ["Tampa Bay Area", "St. Petersburg", "FL"], "availableLanguage": ["English", "Spanish"], "description": "After-Hours & AI Agent Line" }
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
                "https://www.youtube.com/@ShamrockBailBonds_FL",
                "https://www.tiktok.com/@shamrockbailbonds",
                "https://www.yelp.com/biz/shamrock-bail-bonds-fort-myers",
                "https://t.me/Shamrock_Bail_Bonds"
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Bail Bonds",
            "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
            "areaServed": [
                { "@type": "State", "name": "Florida" },
                { "@type": "City", "name": "Fort Myers, Florida" },
                { "@type": "City", "name": "Cape Coral, Florida" },
                { "@type": "City", "name": "Naples, Florida" },
                { "@type": "City", "name": "Punta Gorda, Florida" },
                { "@type": "AdministrativeArea", "name": "Lee County, Florida" },
                { "@type": "AdministrativeArea", "name": "Collier County, Florida" },
                { "@type": "AdministrativeArea", "name": "Charlotte County, Florida" }
            ],
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

    const LOCAL_CITIES = [
        { name: 'Cape Coral', slug: 'cape-coral' },
        { name: 'Fort Myers', slug: 'fort-myers' },
        { name: 'Lehigh Acres', slug: 'lehigh-acres' },
        { name: 'Bonita Springs', slug: 'bonita-springs' },
        { name: 'Estero', slug: 'estero' },
        { name: 'Naples', slug: 'naples' },
        { name: 'Punta Gorda', slug: 'punta-gorda' },
        { name: 'Port Charlotte', slug: 'port-charlotte' },
        { name: 'Lee County Jail', slug: 'lee-county-jail' }
    ];
    schemas.push({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Southwest Florida Bail Bonds by City",
        "description": "City and jail landing pages for Shamrock Bail Bonds in Southwest Florida.",
        "numberOfItems": LOCAL_CITIES.length,
        "itemListElement": LOCAL_CITIES.map(function(city, index) {
            return {
                "@type": "ListItem",
                "position": index + 1,
                "name": city.name + " Bail Bonds",
                "url": "https://www.shamrockbailbonds.biz/florida-bail-bonds/" + city.slug
            };
        })
    });

    wixSeo.setStructuredData(schemas).catch(function(e) { console.error('Schema error:', e); });
}

// ---------------------------------------------------------------------------
// Telegram Hub Section — analytics + iframe height + Telegram-only Mini Apps
// ---------------------------------------------------------------------------
// Mini Apps must open INSIDE Telegram (via t.me deep links). Public browsers
// never open shamrock-telegram.netlify.app directly from this hub.
// ---------------------------------------------------------------------------

function initTelegramHubSection() {
    try {
        const embed = $w('#telegramHubEmbed');
        if (embed && embed.onMessage) {
            embed.onMessage(handleTelegramHubMessage);
        }
        // Ensure embed points at the hub HTML (if URL mode is used)
        try {
            if (embed && typeof embed.src === 'string') {
                // Leave editor-configured src if already set; only log
                console.log('[TelegramHub] embed ready');
            }
        } catch (e) { /* non-fatal */ }
    } catch (e) { /* #telegramHubEmbed not on page */ }

    try {
        $w('#telegramHubSection').onViewportEnter(function () {
            trackEvent('TelegramHub_SectionVisible', { section: 'telegram_hub' });
        });
    } catch (e) { /* element may not exist */ }
}

function handleTelegramHubMessage(event) {
    let data;
    try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (e) {
        return;
    }
    if (!data || !data.type) return;

    // Auto-resize HtmlComponent to content height
    if (
        (data.type === 'shamrock_iframe_height' || data.type === 'setHeight' || data.type === 'RESIZE') &&
        data.height
    ) {
        const h = Number(data.height);
        if (h && isFinite(h)) {
            try {
                const embed = $w('#telegramHubEmbed');
                if (embed) {
                    embed.style.height = Math.min(Math.max(Math.ceil(h), 400), 12000) + 'px';
                }
            } catch (e) { /* non-fatal */ }
        }
        return;
    }

    // Embed requests open Mini App — always via Telegram deep link (never bare Netlify URL)
    if (data.type === 'open_telegram_miniapp' || data.type === 'OPEN_TELEGRAM_MINIAPP') {
        const app = String(data.app || data.label || 'hub').toLowerCase();
        const startMap = {
            hub: 'miniapps',
            miniapps: 'miniapps',
            intake: 'intake',
            documents: 'documents',
            docs: 'documents',
            payment: 'payment',
            payments: 'payment',
            status: 'status',
            checkin: 'updates',
            updates: 'updates',
            defendant: 'defendant'
        };
        const start = startMap[app] || 'miniapps';
        goTo(DEST.telegramStart(start), 'TelegramHub_open_miniapp', { app: start });
        return;
    }

    if (data.type === 'open_telegram_bot' || data.type === 'OPEN_TELEGRAM_BOT') {
        goTo(DEST.telegramBot, 'TelegramHub_open_bot', {});
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
