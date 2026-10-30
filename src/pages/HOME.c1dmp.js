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
import wixSeoFrontend from 'wix-seo-frontend';
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

    // SEO meta & structured data -- synchronous, required for SSR crawling
    try { setupHomepageMeta(); } catch (e) { console.warn('[SEO] setupHomepageMeta failed:', e); }
    try { setupOrganizationSchema(); } catch (e) { console.warn('[SEO] setupOrganizationSchema failed:', e); }

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
    const description = '24/7 Fort Myers & Florida bail bonds. Lee County Jail bonds, payment plans, since 2012. Call (239) 332-2245.';
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
    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": "https://www.shamrockbailbonds.biz/#organization",
        "name": "Shamrock Bail Bonds",
        "url": "https://www.shamrockbailbonds.biz",
        "telephone": "+1-239-332-2245",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "1528 Broadway",
            "addressLocality": "Fort Myers",
            "addressRegion": "FL",
            "postalCode": "33901",
            "addressCountry": "US"
        },
        "areaServed": {
            "@type": "State",
            "name": "Florida"
        },
        "openingHours": "Mo-Fr 09:00-17:00",
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "09:00",
            "closes": "17:00"
        },
        "contactPoint": [
            {
                "@type": "ContactPoint",
                "telephone": "+1-239-332-2245",
                "contactType": "customer service",
                "areaServed": "FL",
                "availableLanguage": ["en", "es"],
                "hoursAvailable": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                }
            },
            {
                "@type": "ContactPoint",
                "telephone": "+1-727-295-2245",
                "contactType": "customer service",
                "areaServed": "FL",
                "availableLanguage": "es",
                "hoursAvailable": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                }
            }
        ]
    };

    const schemas = [localBusinessSchema];
    try {
        const res = wixSeoFrontend.setStructuredData(schemas);
        if (res && typeof res.catch === 'function') {
            res.catch(function (e) { console.error('Schema error:', e); });
        }
    } catch (e) {
        wixSeo.setStructuredData(schemas).catch(function (err) { console.error('Schema error:', err); });
    }
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
