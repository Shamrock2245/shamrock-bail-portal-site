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
import wixLocationFrontend from 'wix-location-frontend';
import wixWindowFrontend from 'wix-window-frontend';

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
    phoneSpanish: 'tel:+17272952245',
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

    // Load county dropdown immediately -- data is inline, no async needed.
    // All 67 counties stay in this dropdown. Do not paint an equal-weight
    // anchor list here; that flattens SWFL homepage priority. Crawlable
    // anchors live on the Florida county hub and county pages.
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
        let county = '';
        try { county = session.getItem('last_county_slug') || ''; } catch (e) {}
        const q = county ? ('?county=' + encodeURIComponent(county)) : '';
        goTo(DEST.portal + q, 'start_online_clicked', { location: 'home', county: county || null });
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
        dropdown.placeholder = 'Select your county to get started';

        // Wire onChange handler
        dropdown.onChange(function() { handleCountySelection(dropdown); });

        // One primary CTA: county → county page (then Get Someone Out / Call).
        // Keep label action-oriented; Editor heading can stay "Select Your County…".
        const getStartedBtn = resolveElement(GET_STARTED_IDS);
        if (getStartedBtn) {
            try { getStartedBtn.label = 'Get Them Out'; } catch (e) {}
            getStartedBtn.onClick(function() { handleGetStarted(dropdown); });
        } else {
            console.warn('[County Dropdown] Get Started button not found. Tried: ' + GET_STARTED_IDS.join(', '));
        }

        // Secondary bond-start control (if present on canvas) → portal role picker
        const startBond = resolveElement(['#startBondButton', '#startBondBtn', '#btnStartBond']);
        if (startBond && typeof startBond.onClick === 'function') {
            try { startBond.label = 'Start online'; } catch (e) {}
            startBond.onClick(function () {
                const selected = dropdown.value || '';
                const q = selected ? ('?county=' + encodeURIComponent(selected)) : '';
                goTo(DEST.portal + q, 'start_bond_clicked', { location: 'home', county: selected || null });
            });
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
    const description = '24/7 Fort Myers & Florida bail bonds. Lee County Jail bonds, payment plans, licensed since 2012. Call (239) 332-2245.';
    const url = 'https://www.shamrockbailbonds.biz';

    wixSeo.setTitle(title);
    wixSeo.setLinks([{ rel: 'canonical', href: url }]);
    wixSeo.setMetaTags([
        { name: 'msvalidate.01', content: '784C373B3B1BCC116419BA40DA6FB208' },
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
        { name: 'keywords', content: 'Fort Myers bail bonds, Cape Coral bail bonds, Lee County bail bonds, Naples bail bonds, Punta Gorda bail bonds, Lehigh Acres bail bonds, Nebbia packet bail bonds, warrant walk through, high dollar bail bonds, 24/7 bail bondsman, Lee County Jail, bail bonds near me, Florida jail release, transfer bail bonds, bail bond payment plans' }
    ]);
}

function setupOrganizationSchema() {
    const BAIL_OFFER_CATALOG = {
        "@type": "OfferCatalog",
        "name": "Comprehensive Florida Bail Bond Services",
        "description": "Licensed 24/7 bail bond solutions across Southwest Florida and all 67 Florida counties pursuant to Florida Statutes Chapters 648 and 903. High-dollar bail underwriting, Nebbia packet preparation, jail release help, paperless mobile intake, and flexible financing.",
        "itemListElement": [
            {
                "@type": "Offer",
                "name": "Nebbia Packet Preparation & Source of Funds Defense",
                "description": "Comprehensive preparation of Florida Nebbia packets for high-dollar bonds and drug trafficking charges. Full financial tracing, tax records, bank statement auditing, source-of-funds affidavits, and defense attorney coordination to satisfy state prosecutors and get judge approval without delay.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "Included with bond underwriting",
                    "priceCurrency": "USD",
                    "description": "Expert financial affidavit preparation and attorney coordination pursuant to Florida Statute § 903.046 and Fla. R. Crim. P. 3.131."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Nebbia Packet Preparation & Source of Funds Defense",
                    "serviceType": "Nebbia Hearing Assistance",
                    "description": "Professional compilation of legitimate source-of-funds documentation, financial audits, and court filing coordination to lift court-ordered Nebbia holds.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "High-Value & Capital Felony Bail Underwriting",
                "description": "Specialized underwriting and collateral solutions for bonds exceeding $50,000, $100,000, and $500,000+. Direct corporate surety access, real estate lien processing, and executive confidentiality.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "10% of bond amount (Statutory rate per FL Stat. § 648.24)",
                    "priceCurrency": "USD",
                    "description": "Florida statutory 10% premium with customized high-value collateral and payment options for qualifying indemnitors."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "High-Value & Capital Felony Bail Underwriting",
                    "serviceType": "High-Value Bail Bonds",
                    "description": "Large-scale bail underwriting and corporate surety issuance for major felony indictments across Southwest Florida and statewide.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "State Surety Appearance Bail Bonds",
                "description": "Standard 10% statutory surety bail bonds for misdemeanor and felony cases in all 67 Florida county and circuit courts. Jail release help with full statutory compliance pursuant to Florida Statute § 648.24.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "10% of bond amount ($100 minimum per charge pursuant to Florida Statute § 648.24)",
                    "priceCurrency": "USD",
                    "description": "Florida statutory rate: 10% premium with $100 minimum per charge. Flexible payment plans and collateral options available."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "State Surety Appearance Bail Bonds",
                    "serviceType": "Surety Bail Bonds",
                    "description": "Standard appearance surety bail bonds for misdemeanor and felony cases in all 67 Florida county and circuit courts. 24/7 court appearance bond posting.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Felony Bail Bonds",
                "description": "24/7 emergency bail bond posting for 1st, 2nd, and 3rd-degree felony arrests throughout Florida, including burglary, grand theft, drug offenses, and violent charges. Large bond underwriting and jail dispatch.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "10% of bond amount ($100 minimum per charge)",
                    "priceCurrency": "USD",
                    "description": "Statutory 10% premium with flexible financing options for qualifying indemnitors."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Felony Bail Bonds",
                    "serviceType": "Felony Bail Bonds",
                    "description": "Emergency bail bond underwriting for felony arrests across Southwest Florida and statewide. 24/7 jail liaison and high-value bond execution.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Misdemeanor Bail Bonds",
                "description": "Jail release help for 1st and 2nd-degree misdemeanor charges including petty theft, disorderly conduct, simple battery, trespassing, and municipal ordinance violations.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "10% of bond amount ($100 minimum per charge)",
                    "priceCurrency": "USD",
                    "description": "Statutory 10% premium ($100 minimum) pursuant to Florida Statute § 648.24."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Misdemeanor Bail Bonds",
                    "serviceType": "Misdemeanor Bail Bonds",
                    "description": "Booking clearance and bail bond posting for misdemeanor charges throughout Lee, Collier, Charlotte, and all Florida counties.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "DUI & BUI Bail Bonds",
                "description": "Specialized bail bond processing for Driving Under the Influence (DUI) and Boating Under the Influence (BUI) arrests. Direct coordination with jail booking staff throughout Florida's mandatory 8-hour statutory sobriety hold and release upon clearance.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "10% of bond amount ($100 minimum per charge)",
                    "priceCurrency": "USD",
                    "description": "Florida statutory 10% premium with payment plans available."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "DUI & BUI Bail Bonds",
                    "serviceType": "DUI Bail Bonds",
                    "description": "Specialized DUI bail bond processing, 8-hour statutory hold monitoring, vehicle impound information assistance, and release coordination.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Domestic Violence Bail Bonds & Hearing Coordination",
                "description": "First Appearance hearing monitoring and bond posting for domestic violence charges, no-contact order verification, and release coordination in full compliance with Florida court requirements.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "10% of bond amount ($100 minimum per charge)",
                    "priceCurrency": "USD",
                    "description": "Florida statutory 10% premium. Payment plans available upon judge setting bond."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Domestic Violence Bail Bonds",
                    "serviceType": "Domestic Violence Bail Bonds",
                    "description": "Dedicated first appearance court representation and bond execution for domestic battery, injunction violations, and familial disputes.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Warrant Walk-Through Service",
                "description": "Clear active arrest warrants, bench warrants, and failure to appear (FTA) summons with pre-arranged bail bonding. Enables defendants to process and be released without holding cell confinement.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "10% of warrant bond amount ($100 minimum per charge)",
                    "priceCurrency": "USD",
                    "description": "Statutory 10% rate with advance warrant verification at the clerk of court and sheriff's office."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Warrant Walk-Through Service",
                    "serviceType": "Warrant Walk-Through Service",
                    "description": "Pre-scheduled warrant clearance and self-surrender bond execution at Lee County Jail, Collier County Jail, Charlotte County Jail, and Florida facilities.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Transfer Bail Bonds (Statewide & Nationwide)",
                "description": "Post bail locally at our Fort Myers office for defendants arrested and detained in any other Florida county jail or out-of-state facility. Electronic bond transfer without traveling.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "10% of bond amount plus standard statutory transfer fee",
                    "priceCurrency": "USD",
                    "description": "10% statutory bond premium. A $100 transfer fee applies and may be waived at our discretion (counties outside Lee and Charlotte)."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Transfer Bail Bonds",
                    "serviceType": "Transfer Bail Bonds",
                    "description": "Statewide and nationwide transfer bail bonding allowing local family members to post bail in Southwest Florida for loved ones detained anywhere in Florida or across the United States.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "Country", "name": "United States" }
                }
            },
            {
                "@type": "Offer",
                "name": "Federal Court Appearance Bonds (Middle & Southern Districts)",
                "description": "Specialized corporate surety appearance bail bonds for defendants facing federal charges or indictments in the U.S. District Court for the Middle and Southern Districts of Florida.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "15% statutory federal bond premium",
                    "priceCurrency": "USD",
                    "description": "Federal bail bond statutory rate of 15% with corporate surety authorization and collateral review."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Federal Bail Bonds",
                    "serviceType": "Federal Bail Bonds",
                    "description": "Authorized corporate surety bail bonding for federal indictments and appearances in U.S. District Courts.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Traffic Criminal & DWLSR Bail Bonds",
                "description": "Bail bonds for criminal traffic charges including Driving While License Suspended or Revoked (DWLSR), reckless driving, DUI with property damage, and fleeing/eluding law enforcement.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "10% of bond amount ($100 minimum per charge)",
                    "priceCurrency": "USD",
                    "description": "Florida statutory 10% rate ($100 minimum per charge pursuant to FL Stat. § 648.24)."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Traffic & License Suspension Bail Bonds",
                    "serviceType": "Traffic Bail Bonds",
                    "description": "Bonding for criminal traffic offenses and FTA traffic summonses across Southwest Florida county jails.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Online & Mobile Digital Bail Bonds (100% Paperless)",
                "description": "100% paperless bail process from any smartphone, tablet, or computer. Complete driver's license ID scanning, secure DocuSeal electronic signatures, and digital payment without leaving your home or visiting an office.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "No digital processing fee (10% state statutory premium only)",
                    "priceCurrency": "USD",
                    "description": "Free digital paperwork processing; standard Florida 10% statutory bail premium applies."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Online & Mobile Bail Bonds",
                    "serviceType": "Digital Bail Bonds",
                    "description": "Zero-contact digital bail bond platform featuring mobile ID verification, electronic indemnity agreements, and remote posting.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Bail Bond Payment Plans & Zero-Interest Financing",
                "description": "Low down payment options and affordable zero-interest payment arrangements for qualifying co-signers, fully compliant with Florida Department of Financial Services regulations.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "Flexible down payments with structured installment plans",
                    "priceCurrency": "USD",
                    "description": "Low down payment options available based on credit, employment, and collateral. 0% financing interest."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Bail Bond Payment Plans",
                    "serviceType": "Bail Bond Financing",
                    "description": "Customizable payment plans and flexible financing for Florida bail bonds, allowing families to secure release without paying the full premium upfront.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Immigration Detention & ICE Custody Bonds",
                "description": "Bilingual coordination, immigration attorney collaboration, and surety bond processing support for non-citizens held on immigration detainers or ICE custody throughout Florida detention centers.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "15% statutory premium for immigration bonds",
                    "priceCurrency": "USD",
                    "description": "Statutory 15% rate for immigration bonds with nationwide delivery coordination."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Immigration Detention Bonds",
                    "serviceType": "Immigration Bail Bonds",
                    "description": "Bilingual coordination and surety bonding for immigration holds and federal detention facilities across Florida.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "Country", "name": "United States" }
                }
            },
            {
                "@type": "Offer",
                "name": "24/7 Mobile Agent Jail Dispatch & Court Filings",
                "description": "24-hour physical and electronic bond delivery to Lee County Jail, CoreCivic, Collier County Jail, Charlotte County Jail, Hendry County Jail, and all Florida correctional facilities.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "Included with 10% statutory bond premium",
                    "priceCurrency": "USD",
                    "description": "24/7 emergency dispatch included at no extra charge. Available nights, weekends, and holidays."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "24/7 Emergency Jail Dispatch",
                    "serviceType": "Emergency Bail Dispatch",
                    "description": "Physical and electronic bail dispatch to county detention facilities across Southwest Florida and statewide.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": [
                        { "@type": "AdministrativeArea", "name": "Lee County, Florida" },
                        { "@type": "AdministrativeArea", "name": "Collier County, Florida" },
                        { "@type": "AdministrativeArea", "name": "Charlotte County, Florida" },
                        { "@type": "AdministrativeArea", "name": "Hendry County, Florida" },
                        { "@type": "AdministrativeArea", "name": "DeSoto County, Florida" },
                        { "@type": "AdministrativeArea", "name": "Sarasota County, Florida" },
                        { "@type": "AdministrativeArea", "name": "Manatee County, Florida" }
                    ]
                }
            },
            {
                "@type": "Offer",
                "name": "Lee County Jail (Ortiz Ave) Release Dispatch",
                "description": "24/7 direct bail bond delivery to the Lee County Main Jail (2501 Ortiz Ave, Fort Myers, FL 33905) and downtown CoreCivic facility.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "Statutory 10% rate ($100 minimum per charge)",
                    "priceCurrency": "USD",
                    "description": "Statutory 10% state premium per FL Stat. § 648.24. Direct Ortiz Avenue jail dispatch included at no extra charge."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Lee County Jail Ortiz Ave Dispatch",
                    "serviceType": "Jail Release Service",
                    "description": "24/7 jail release dispatch to Lee County Main Jail at 2501 Ortiz Ave, Fort Myers.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "AdministrativeArea", "name": "Lee County, Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Free 24/7 Inmate Search & Booking Information Consultation",
                "description": "Around-the-clock arrest verification and inmate status lookup for Lee County Jail (Ortiz Ave), CoreCivic, Collier County Jail, Charlotte County Jail, and all 67 Florida counties. Free charge details and bond amount information.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "Free confidential consultation",
                    "priceCurrency": "USD",
                    "description": "Free inmate lookup and bail status advisory service."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Inmate Lookup & Bail Consultation",
                    "serviceType": "Inmate Search Service",
                    "description": "24/7 confidential inmate lookup, charge analysis, and bond amount verification across Florida jail facilities.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Confidential Florida Warrant Check & Verification",
                "description": "Discrete verification of active bench warrants, capiases, failure to appear (FTA) summonses, and probation violation warrants across county sheriff's offices and Florida clerk of court portals.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "Free confidential warrant check",
                    "priceCurrency": "USD",
                    "description": "Complimentary warrant verification and self-surrender pre-qualification."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Warrant Search & Verification",
                    "serviceType": "Warrant Check Service",
                    "description": "Confidential arrest warrant and capias lookup with bail arrangement to avoid surprise arrests.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Long-Distance & Out-of-State Bail Processing (100% Remote)",
                "description": "Full long-distance bonding for out-of-town indemnitors and families. Complete paperwork, credit card payment, and identity verification by phone, email, or mobile link without traveling to Fort Myers.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "No long-distance surcharge (standard 10% statutory rate)",
                    "priceCurrency": "USD",
                    "description": "Standard Florida statutory 10% bail premium ($100 minimum). Zero fees for phone/digital long-distance processing."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Long-Distance Bail Processing",
                    "serviceType": "Remote Bail Bonds",
                    "description": "Remote paperwork and credit card bail processing for family members living in other Florida cities or out of state.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "Country", "name": "United States" }
                }
            },
            {
                "@type": "Offer",
                "name": "Bond Reinstatement & Forfeiture Resolution Assistance (Consent of Surety)",
                "description": "Execution of Consent of Surety affidavits and court filing guidance to reinstate forfeited bonds following missed court appearances, preventing re-arrest and resolving clerk estreatures.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "Included with active bond management",
                    "priceCurrency": "USD",
                    "description": "Consent of Surety affidavit preparation and defense counsel coordination."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Bond Reinstatement Assistance",
                    "serviceType": "Bond Forfeiture Relief",
                    "description": "Consent of Surety documentation and attorney collaboration to cure bond estreatures and set aside warrants after missed court dates.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Cash Bail Assistance & Court Deposit Guidance",
                "description": "Advisory guidance and operational assistance for families choosing between posting full cash bail directly with the clerk of court versus utilizing a licensed surety bond agent.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "Free consultation & advisory",
                    "priceCurrency": "USD",
                    "description": "Advisory support explaining cash bail release times, court refund timelines, and surety comparisons."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Cash Bail Guidance",
                    "serviceType": "Cash Bail Consultation",
                    "description": "Guidance on court cash deposits, clerk refund procedures, and cash-to-surety bond transitions.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            },
            {
                "@type": "Offer",
                "name": "Servicio de Fianzas en Español 24/7 (Bilingual Bail Bonds)",
                "description": "Atención en español las 24 horas del día por agentes de fianzas licenciados. Trámite completo de fianzas, orientación legal del proceso de detención y planes de pago accesibles en el suroeste de Florida.",
                "priceSpecification": {
                    "@type": "PriceSpecification",
                    "price": "Tarifa reglamentaria estatal del 10% (mínimo de $100 por cargo)",
                    "priceCurrency": "USD",
                    "description": "Tarifa reglamentaria del estado de Florida del 10% según el Estatuto 648. Planes de pago disponibles."
                },
                "itemOffered": {
                    "@type": "Service",
                    "name": "Servicio de Fianzas en Español",
                    "serviceType": "Fianzas en Español",
                    "description": "Agentes bilingües dedicados para tramitar fianzas y asistencia 24/7 para la comunidad hispana en Florida.",
                    "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
                    "areaServed": { "@type": "State", "name": "Florida" }
                }
            }
        ]
    };

    const schemas = [
        {
            "@context": "https://schema.org",
            "@type": ["Organization", "LocalBusiness", "LegalService"],
            "@id": "https://www.shamrockbailbonds.biz/#organization",
            "name": "Shamrock Bail Bonds",
            "legalName": "Shamrock Bail Bonds LLC",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": "https://www.shamrockbailbonds.biz/logo.png",
            "foundingDate": "2012",
            "description": "Professional 24/7 bail bond services throughout Florida since 2012. Specializing in high-dollar bail underwriting, Nebbia packets, felony and misdemeanor release, transfer bonds, and flexible payment plans.",
            "slogan": "Fort Myers Since 2012 — Simple. Secure. Everywhere.",
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
                { "@type": "ContactPoint", "telephone": "+1-239-955-0178", "contactType": "Text messages (SMS/iMessage only, no voice calls)", "contactOption": "HearingImpairedSupported", "areaServed": "FL", "availableLanguage": ["English", "Spanish"], "description": "24/7 SMS & iMessage Support" },
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-727-295-2245",
                    "contactType": "Customer Service (Spanish line)",
                    "areaServed": "FL",
                    "availableLanguage": ["Spanish"],
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "00:00", "closes": "23:59"
                    }
                }
            ],
            "areaServed": { "@type": "State", "name": "Florida", "@id": "https://en.wikipedia.org/wiki/Florida" },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:00", "closes": "17:00"
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
            ],
            "hasOfferCatalog": BAIL_OFFER_CATALOG
        },
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "@id": "https://www.shamrockbailbonds.biz/#service",
            "name": "Comprehensive Florida Bail Bond Services",
            "serviceType": "Bail Bond Services",
            "provider": { "@id": "https://www.shamrockbailbonds.biz/#organization" },
            "description": "Licensed 24/7 bail bond agency serving Southwest Florida (Lee, Collier, Charlotte, Hendry, DeSoto, Sarasota, Manatee) and all 67 Florida counties. 24/7 release help, 10% statutory rates pursuant to FL Stat. § 648, Nebbia packet support, paperless mobile intake, and flexible payment plans.",
            "areaServed": [
                { "@type": "State", "name": "Florida", "@id": "https://en.wikipedia.org/wiki/Florida" },
                { "@type": "AdministrativeArea", "name": "Lee County, Florida" },
                { "@type": "AdministrativeArea", "name": "Collier County, Florida" },
                { "@type": "AdministrativeArea", "name": "Charlotte County, Florida" },
                { "@type": "AdministrativeArea", "name": "Hendry County, Florida" },
                { "@type": "AdministrativeArea", "name": "DeSoto County, Florida" },
                { "@type": "AdministrativeArea", "name": "Sarasota County, Florida" },
                { "@type": "AdministrativeArea", "name": "Manatee County, Florida" },
                { "@type": "City", "name": "Fort Myers, Florida" },
                { "@type": "City", "name": "Cape Coral, Florida" },
                { "@type": "City", "name": "Naples, Florida" },
                { "@type": "City", "name": "Punta Gorda, Florida" },
                { "@type": "City", "name": "Lehigh Acres, Florida" },
                { "@type": "City", "name": "Bonita Springs, Florida" },
                { "@type": "City", "name": "Port Charlotte, Florida" }
            ],
            "availableChannel": {
                "@type": "ServiceChannel",
                "servicePhone": {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-332-2245",
                    "contactType": "Emergency Bail Dispatch",
                    "availableLanguage": ["English", "Spanish"],
                    "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "00:00", "closes": "23:59"
                    }
                },
                "serviceSms": { "@type": "ContactPoint", "telephone": "+1-239-955-0178", "contactType": "24/7 SMS & iMessage Support" },
                "serviceUrl": "https://www.shamrockbailbonds.biz"
            },
            "hasOfferCatalog": BAIL_OFFER_CATALOG
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

    // I. FAQPage Schema — Captures high-intent local crisis and competitor search queries
    schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "name": "Fort Myers & Florida Bail Bonds Frequently Asked Questions",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How long does release take at the Lee County Jail on Ortiz Ave?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Release timing at the Lee County Main Jail (2501 Ortiz Ave, Fort Myers) depends on the jail's processing after bail is posted, including intake volume and shift changes. Shamrock Bail Bonds is available 24/7 to help you post the bond once paperwork is complete."
                }
            },
            {
                "@type": "Question",
                "name": "What is a Nebbia hold and does Shamrock Bail Bonds handle Nebbia packets?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Under Florida Statute § 903.046 and Fla. R. Crim. P. 3.131, a Nebbia hold requires proof that funds used for bail originate from legitimate sources. Shamrock Bail Bonds specializes in preparing complete Nebbia source-of-funds packets—including bank statement audits, income verification, tax documents, and financial affidavits—and coordinates directly with defense counsel to lift the hold without delay."
                }
            },
            {
                "@type": "Question",
                "name": "Can I clear an active arrest warrant or bench warrant without spending time in a jail cell?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Through Shamrock's Warrant Walk-Through service, our licensed bondsman coordinates a pre-arranged self-surrender with the Lee County Sheriff's Office or clerk of court. You complete booking and processing and walk right out with your bail bond pre-posted, avoiding general holding cell confinement."
                }
            },
            {
                "@type": "Question",
                "name": "How much does a bail bond cost in Florida?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Under Florida Statute § 648.24, state appearance bail bond rates are strictly regulated at 10% of the total bail amount, with a statutory minimum of $100 per charge. Federal and immigration bonds are 15%. Shamrock Bail Bonds offers flexible zero-interest payment plans and low down payment options for qualifying indemnitors."
                }
            },
            {
                "@type": "Question",
                "name": "Can I post bail for someone in Fort Myers if I live in another city or out of state?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Shamrock Bail Bonds provides 100% digital, long-distance bail processing. Out-of-town family members can verify identity, sign all paperwork electronically via DocuSeal, and submit payments online from any smartphone or computer without traveling to Fort Myers. We also handle transfer bonds across all 67 Florida counties and nationwide."
                }
            },
            {
                "@type": "Question",
                "name": "¿Ofrece Shamrock Bail Bonds servicio de fianzas en español las 24 horas?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sí. Ofrecemos asistencia completa en español las 24 horas del día, los 7 días de la semana. Contamos con una línea directa de atención en español al (727) 295-2245 o a nuestra línea principal al (239) 332-2245 para ayudar a las familias durante todo el proceso de fianza con agentes hispanohablantes licenciados."
                }
            },
            {
                "@type": "Question",
                "name": "What happens if a court date was missed accidentally?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "If a defendant misses court accidentally, Shamrock Bail Bonds can assist by executing a Consent of Surety affidavit for defense counsel to file a motion to reinstate the bond, resolving the estreature and helping prevent immediate re-arrest whenever possible."
                }
            },
            {
                "@type": "Question",
                "name": "Can Shamrock Bail Bonds post bail in other Florida counties or out of state?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. We execute transfer bail bonds across all 67 Florida counties—including Collier, Charlotte, Hendry, Miami-Dade, Hillsborough, Orange, and Pinellas—as well as nationwide. You can complete all arrangements locally at our Fort Myers headquarters or completely online from your mobile phone."
                }
            }
        ]
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

// =============================================================================
// WIX STUDIO LAYER (Oct 2026) — source: Studio cutover ready/velo/home.js
// Element IDs from the Studio design. Every lookup is guarded (a missing ID skips
// that feature), so this is inert on the current live layout and the code above
// keeps running unchanged. Scoped in an IIFE so helper names never collide.
// Copy rules: no release-time/speed claims; Spanish line (727) 295-2245;
// "Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7".
// =============================================================================
(function studioLayer() {
    /**
     * home.js — Home page (/)
     * Paste in Wix Studio: Home page > Code panel > page code.
     *
     * 1. Hero CTAs: call (English / Spanish), text, Start Online.
     * 2. 67-county selector → /florida-bail-bonds/{county}.
     * 3. Florida premium calculator: 10% of the bond, $100 minimum per charge.
     * 4. Analytics.
     * The home FAQ uses the native Wix FAQ app, so no FAQ code here.
     * Every element lookup is guarded: a missing ID skips that feature instead of breaking the page.
     */


    const PHONE_MAIN = 'tel:+12393322245';
    const PHONE_SPANISH = 'tel:+17272952245';
    const SMS_TEXT = 'sms:+12399550178';

    const FLORIDA_COUNTIES = [
        { label: "Lee County (Fort Myers / Cape Coral)", value: "lee" },
        { label: "Collier County (Naples / Immokalee)", value: "collier" },
        { label: "Charlotte County (Punta Gorda / Port Charlotte)", value: "charlotte" },
        { label: "Sarasota County (Sarasota / Venice)", value: "sarasota" },
        { label: "Hendry County (LaBelle / Clewiston)", value: "hendry" },
        { label: "Glades County (Moore Haven)", value: "glades" },
        { label: "DeSoto County (Arcadia)", value: "desoto" },
        { label: "Alachua County (Gainesville)", value: "alachua" },
        { label: "Baker County (Macclenny)", value: "baker" },
        { label: "Bay County (Panama City)", value: "bay" },
        { label: "Bradford County (Starke)", value: "bradford" },
        { label: "Brevard County (Titusville / Melbourne)", value: "brevard" },
        { label: "Broward County (Fort Lauderdale)", value: "broward" },
        { label: "Calhoun County (Blountstown)", value: "calhoun" },
        { label: "Citrus County (Inverness)", value: "citrus" },
        { label: "Clay County (Green Cove Springs)", value: "clay" },
        { label: "Columbia County (Lake City)", value: "columbia" },
        { label: "Dixie County (Cross City)", value: "dixie" },
        { label: "Duval County (Jacksonville)", value: "duval" },
        { label: "Escambia County (Pensacola)", value: "escambia" },
        { label: "Flagler County (Bunnell / Palm Coast)", value: "flagler" },
        { label: "Franklin County (Apalachicola)", value: "franklin" },
        { label: "Gadsden County (Quincy)", value: "gadsden" },
        { label: "Gilchrist County (Trenton)", value: "gilchrist" },
        { label: "Gulf County (Port St. Joe)", value: "gulf" },
        { label: "Hamilton County (Jasper)", value: "hamilton" },
        { label: "Hardee County (Wauchula)", value: "hardee" },
        { label: "Hernando County (Brooksville)", value: "hernando" },
        { label: "Highlands County (Sebring)", value: "highlands" },
        { label: "Hillsborough County (Tampa)", value: "hillsborough" },
        { label: "Holmes County (Bonifay)", value: "holmes" },
        { label: "Indian River County (Vero Beach)", value: "indian-river" },
        { label: "Jackson County (Marianna)", value: "jackson" },
        { label: "Jefferson County (Monticello)", value: "jefferson" },
        { label: "Lafayette County (Mayo)", value: "lafayette" },
        { label: "Lake County (Tavares)", value: "lake" },
        { label: "Leon County (Tallahassee)", value: "leon" },
        { label: "Levy County (Bronson)", value: "levy" },
        { label: "Liberty County (Bristol)", value: "liberty" },
        { label: "Madison County (Madison)", value: "madison" },
        { label: "Manatee County (Bradenton)", value: "manatee" },
        { label: "Marion County (Ocala)", value: "marion" },
        { label: "Martin County (Stuart)", value: "martin" },
        { label: "Miami-Dade County (Miami)", value: "miami-dade" },
        { label: "Monroe County (Key West)", value: "monroe" },
        { label: "Nassau County (Fernandina Beach)", value: "nassau" },
        { label: "Okaloosa County (Crestview)", value: "okaloosa" },
        { label: "Okeechobee County (Okeechobee)", value: "okeechobee" },
        { label: "Orange County (Orlando)", value: "orange" },
        { label: "Osceola County (Kissimmee)", value: "osceola" },
        { label: "Palm Beach County (West Palm Beach)", value: "palm-beach" },
        { label: "Pasco County (Dade City / New Port Richey)", value: "pasco" },
        { label: "Pinellas County (Clearwater)", value: "pinellas" },
        { label: "Polk County (Bartow / Lakeland)", value: "polk" },
        { label: "Putnam County (Palatka)", value: "putnam" },
        { label: "Santa Rosa County (Milton)", value: "santa-rosa" },
        { label: "Seminole County (Sanford)", value: "seminole" },
        { label: "St. Johns County (St. Augustine)", value: "st-johns" },
        { label: "St. Lucie County (Fort Pierce)", value: "st-lucie" },
        { label: "Sumter County (Bushnell)", value: "sumter" },
        { label: "Suwannee County (Live Oak)", value: "suwannee" },
        { label: "Taylor County (Perry)", value: "taylor" },
        { label: "Union County (Lake Butler)", value: "union" },
        { label: "Volusia County (DeLand / Daytona)", value: "volusia" },
        { label: "Wakulla County (Crawfordville)", value: "wakulla" },
        { label: "Walton County (DeFuniak Springs)", value: "walton" },
        { label: "Washington County (Chipley)", value: "washington" }
    ];

    $w.onReady(function () {
        initHeroActions();
        initCountySelector();
        initBailCalculator();
    });

    // ─── Safe element helpers ($w throws on a missing ID; `if ($w('#x'))` does not protect) ──
    function el(id) {
        try {
            const node = $w(id);
            if (!node || (typeof node.id !== 'string' && typeof node.type !== 'string')) return null;
            return node;
        } catch (e) {
            return null;
        }
    }
    function itemEl($item, id) {
        try {
            const node = $item(id);
            if (!node || (typeof node.id !== 'string' && typeof node.type !== 'string')) return null;
            return node;
        } catch (e) {
            return null;
        }
    }
    function on(id, event, handler) {
        const node = typeof id === 'string' ? el(id) : id;
        if (!node) return null;
        try { node[event](handler); } catch (e) { /* element has no such event */ }
        return node;
    }
    function setText(node, value) {
        if (!node) return;
        try { node.text = String(value == null ? '' : value); } catch (e) { /* not a text element */ }
    }
    function setLink(node, url, target) {
        if (!node || !url) return false;
        try {
            node.link = url;
            node.target = target || '_self';
            return true;
        } catch (e) {
            return false;
        }
    }
    function valueOf(id) {
        const node = el(id);
        if (!node) return '';
        try { return typeof node.value === 'string' ? node.value.trim() : (node.value || ''); } catch (e) { return ''; }
    }
    function call(node, method) {
        if (!node) return;
        try { node[method](); } catch (e) { /* noop */ }
    }

    function initHeroActions() {
        on('#heroStartOnline', 'onClick', () => {
            trackEvent('start_online_click', 'hero');
            wixLocationFrontend.to('/portal-landing');
        });

        const callEnglish = el('#heroCallEnglish');
        setLink(callEnglish, PHONE_MAIN, '_self');
        on(callEnglish, 'onClick', () => trackEvent('call_english', 'hero'));

        const callSpanish = el('#heroCallSpanish');
        setLink(callSpanish, PHONE_SPANISH, '_self');
        on(callSpanish, 'onClick', () => trackEvent('call_spanish', 'hero'));

        const textSms = el('#heroTextSMS');
        setLink(textSms, SMS_TEXT, '_self');
        on(textSms, 'onClick', () => trackEvent('sms_click', 'hero'));
    }

    function initCountySelector() {
        const dropdown = el('#countyDropdown');
        if (!dropdown) return;
        // Options + onChange for #countyDropdown are set by loadCountyDropdown() above
        // (DROPDOWN_IDS), so this layer only wires the Studio "Go" button.
        on('#countyGoBtn', 'onClick', () => {
            if (dropdown.value) navigateToCounty(dropdown.value);
        });
    }

    function navigateToCounty(slug) {
        trackEvent('county_navigate', slug);
        wixLocationFrontend.to(`/florida-bail-bonds/${slug}`);
    }

    function initBailCalculator() {
        const input = el('#calcBailInput');
        const chargesInput = el('#calcChargesInput'); // optional: number of charges
        const resultBox = el('#calcResultBox');
        const premiumText = el('#calcPremiumAmount');
        const noteText = el('#calcStatutoryNote');
        if (!input || !premiumText) return;

        const calculate = () => {
            const bond = parseFloat(String(input.value || '').replace(/[^0-9.]/g, '')) || 0;
            if (bond <= 0) {
                call(resultBox, 'collapse');
                return;
            }
            let charges = 1;
            if (chargesInput) {
                charges = Math.max(1, parseInt(String(chargesInput.value || '1').replace(/[^0-9]/g, ''), 10) || 1);
            }
            // Florida premium: 10% of the bond, with a $100 minimum per charge.
            const premium = Math.max(100 * charges, bond * 0.10);
            setText(premiumText, `$${premium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            setText(noteText, 'Florida sets the premium at 10% of the bond, with a $100 minimum per charge. This is an estimate; we confirm the exact premium before you sign.');
            call(resultBox, 'expand');
            trackEvent('calculator_used', `amount_${bond}`);
        };

        on('#calcSubmitBtn', 'onClick', calculate);
        on(input, 'onKeyPress', (event) => { if (event && event.key === 'Enter') calculate(); });
    }

    function trackEvent(action, label) {
        try {
            if (wixWindowFrontend.trackEvent) {
                wixWindowFrontend.trackEvent('CustomEvent', {
                    event: 'home_interaction',
                    eventCategory: 'User Engagement',
                    eventAction: action,
                    eventLabel: label
                });
            }
        } catch (e) {
            console.warn('Analytics suppressed:', e.message);
        }
    }
})();
