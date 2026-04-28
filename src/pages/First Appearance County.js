/**
 * Shamrock Bail Bonds — First Appearance County (Dynamic pSEO Page)
 * URL: /first-appearance/{county-slug}
 *
 * ARCHITECTURE:
 *   Programmatic SEO page that generates unique, content-rich county landing
 *   pages for "first appearance hearing + county" queries. Each page receives
 *   enriched data from generateFirstAppearanceCountyPage() which merges
 *   schedule data, courthouse details, local FAQs, and service-area info.
 *
 *   Pattern mirrors: Florida Counties.qx7lv.js
 *   Router: backend/first-appearance-router.js
 *   Backend: backend/first-appearance-api.jsw → generateFirstAppearanceCountyPage()
 *
 * ELEMENT IDS (set in Wix Editor — see note below):
 *   #faCountyName          — Text (H1)
 *   #faHeroSubtitle        — Text
 *   #faScheduleText        — Text (hearing time/schedule)
 *   #faLocationText        — Text (courthouse address)
 *   #faAccessButton        — Button (live stream / Zoom / directions)
 *   #faCallButton          — Button (tel: link)
 *   #faAboutSection        — Text (rich about paragraph)
 *   #faWhatToExpect        — Text (what to expect paragraph)
 *   #faBailInfo            — Text (bail cost info)
 *   #faServiceAreas        — Text (cities served)
 *   #faFaqRepeater         — Repeater ($w.Repeater)
 *   #faFaqQuestion         — Text (inside repeater)
 *   #faFaqAnswer           — Text (inside repeater)
 *   #faCrossLinkCounty     — Button (link to /florida-bail-bonds/{county})
 *   #faCrossLinkHub        — Button (link to /first-appearance)
 *   #faCrossLinkPortal     — Button (link to /portal-landing)
 *   #faLoadingIndicator    — Container (loading state)
 *   #faCountyContent       — Container (main content area)
 *   #faCtaPhone            — Text (phone number display)
 *
 * SEO STACK:
 *   - Title, description, OG, Twitter meta tags
 *   - BreadcrumbList (Home → First Appearance → {County})
 *   - LegalService (county-specific)
 *   - FAQPage schema (8 unique Q&As per county)
 *   - SpeakableSpecification (AI voice search)
 *   - Event schema (recurring First Appearance hearing)
 *   - Robots: index, follow
 *   - Canonical URL
 *
 * NOTE: This page must be connected to the 'first-appearance' prefix router
 * in the Wix Editor (Site Structure → Routers → Add Router).
 * The dynamic page name MUST match: "First Appearance County"
 */

import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import wixWindow from 'wix-window';
import { generateFirstAppearanceCountyPage } from 'backend/first-appearance-api';

// Type-safe element selector to bypass Velo strict ID checks
const Select = (selector) => /** @type {any} */($w)(selector);

const SITE_BASE = 'https://www.shamrockbailbonds.biz';
const ORG_ID = `${SITE_BASE}/#organization`;
const PHONE = '(239) 332-2245';
const PHONE_TEL = 'tel:+12393322245';

// ═══════════════════════════════════════════════════════════════════════════
// PAGE LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════

$w.onReady(async function () {
    console.log('🏛️ First Appearance County Page Loading...');

    // 1. EXTRACT SLUG from router
    const path = wixLocation.path;
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    console.log(`🏛️ County slug: "${countySlug}"`);

    if (!countySlug) {
        console.error('[FA County] No slug found in path:', path);
        showErrorState('County Not Found');
        return;
    }

    try {
        // Show loading
        safeShow('#faLoadingIndicator');

        // 2. FETCH ENRICHED DATA
        const result = await generateFirstAppearanceCountyPage(countySlug.toLowerCase());

        if (!result.success || !result.data) {
            console.warn(`[FA County] Data not found for: ${countySlug}`);
            showErrorState('County Not Found');
            return;
        }

        const county = result.data;

        // 3. SEO — inject immediately (before DOM paint)
        setupSEO(county);

        // 4. POPULATE UI
        populateUI(county);

        // 5. WIRE INTERACTIONS
        wireInteractions(county);

        // 6. HIDE LOADING, SHOW CONTENT
        safeHide('#faLoadingIndicator');
        safeExpand('#faCountyContent');

        console.log(`✅ First Appearance page loaded: ${county.county_name} County`);

    } catch (err) {
        console.error('❌ CRITICAL ERROR in First Appearance County Page:', err);
        showErrorState('Something went wrong');
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// SEO — FULL STRUCTURED DATA STACK
// ═══════════════════════════════════════════════════════════════════════════

function setupSEO(county) {
    const cn = county.county_name;
    const cnFull = county.county_name_full;
    const canonUrl = `${SITE_BASE}${county.seo.canonical_url}`;

    // ─── META TAGS ───
    wixSeo.setTitle(county.seo.meta_title);
    wixSeo.setMetaTags([
        { "name": "description", "content": county.seo.meta_description },
        { "name": "keywords", "content": (county.seo.keywords || []).join(', ') },
        { "property": "og:title", "content": county.seo.meta_title },
        { "property": "og:description", "content": county.seo.meta_description },
        { "property": "og:url", "content": canonUrl },
        { "property": "og:type", "content": "website" },
        { "property": "og:image", "content": `${SITE_BASE}/logo.png` },
        { "property": "og:locale", "content": "en_US" },
        { "property": "og:site_name", "content": "Shamrock Bail Bonds" },
        { "name": "twitter:card", "content": "summary_large_image" },
        { "name": "twitter:title", "content": county.seo.meta_title },
        { "name": "twitter:description", "content": county.seo.meta_description },
        { "name": "twitter:image", "content": `${SITE_BASE}/logo.png` },
        { "name": "geo.region", "content": "US-FL" },
        { "name": "geo.placename", "content": `${cnFull}, Florida` },
        { "name": "robots", "content": "index, follow, max-snippet:-1, max-image-preview:large" }
    ]);

    // Canonical
    try { wixSeo.setLinks([{ "rel": "canonical", "href": canonUrl }]); } catch (e) { }

    // ─── STRUCTURED DATA ───
    const schemas = [];

    // A. BreadcrumbList: Home → First Appearance → County
    schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_BASE + "/" },
            { "@type": "ListItem", "position": 2, "name": "First Appearance Hearings", "item": SITE_BASE + "/first-appearance" },
            { "@type": "ListItem", "position": 3, "name": `${cnFull} First Appearance`, "item": canonUrl }
        ]
    });

    // B. LegalService — County-specific
    schemas.push({
        "@context": "https://schema.org",
        "@type": "LegalService",
        "@id": `${canonUrl}#legalservice`,
        "name": `Shamrock Bail Bonds — ${cnFull}`,
        "description": county.seo.meta_description,
        "url": canonUrl,
        "telephone": PHONE,
        "priceRange": "$$",
        "image": `${SITE_BASE}/logo.png`,
        "parentOrganization": { "@id": ORG_ID },
        "areaServed": {
            "@type": "AdministrativeArea",
            "name": `${cnFull}, Florida`
        },
        "serviceType": ["Bail Bonds", "First Appearance Hearing Assistance"],
        "availableChannel": {
            "@type": "ServiceChannel",
            "servicePhone": {
                "@type": "ContactPoint",
                "telephone": PHONE,
                "contactType": "customer service",
                "availableLanguage": ["English", "Spanish"],
                "hoursAvailable": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                }
            }
        },
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", ".fa-about-section", ".fa-schedule-text"]
        }
    });

    // C. FAQPage — 8 unique Q&As per county
    if (county.content.faq && county.content.faq.length > 0) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": county.content.faq.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        });
    }

    // D. Event — Recurring First Appearance Hearing
    if (county.schedule && county.schedule.time && county.schedule.time !== 'Contact courthouse for schedule') {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": `First Appearance Hearing — ${cnFull}`,
            "description": `Daily First Appearance hearing for defendants arrested in ${cnFull}, Florida. ${county.schedule.time}`,
            "eventSchedule": {
                "@type": "Schedule",
                "repeatFrequency": "P1D",
                "scheduleTimezone": "America/New_York"
            },
            "location": county.schedule.liveUrl ? {
                "@type": "VirtualLocation",
                "url": county.schedule.liveUrl
            } : {
                "@type": "Place",
                "name": county.schedule.location,
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": county.county_seat || cn,
                    "addressRegion": "FL",
                    "addressCountry": "US"
                }
            },
            "eventAttendanceMode": county.schedule.accessType === 'livestream' || county.schedule.accessType === 'zoom'
                ? "https://schema.org/OnlineEventAttendanceMode"
                : "https://schema.org/OfflineEventAttendanceMode",
            "organizer": { "@id": ORG_ID }
        });
    }

    // E. WebPage with speakable
    schemas.push({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${canonUrl}#webpage`,
        "name": county.seo.meta_title,
        "url": canonUrl,
        "description": county.seo.meta_description,
        "isPartOf": { "@id": `${SITE_BASE}/#website` },
        "about": { "@id": `${canonUrl}#legalservice` },
        "breadcrumb": { "@id": `${canonUrl}#breadcrumb` },
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", ".fa-about-section"]
        },
        "inLanguage": "en-US"
    });

    // Inject all schemas
    setTimeout(() => {
        try {
            wixSeo.setStructuredData(schemas);
            console.log(`✅ SEO: ${schemas.length} schemas injected for ${cnFull}`);
        } catch (e) {
            console.error('❌ Schema injection error:', e);
        }
    }, 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// UI POPULATION
// ═══════════════════════════════════════════════════════════════════════════

function populateUI(county) {
    const cn = county.county_name;
    const cnFull = county.county_name_full;

    // Hero Section
    safeSetText('#faCountyName', county.content.hero_headline);
    safeSetText('#faHeroSubtitle', county.content.hero_subheadline);

    // Schedule Section
    safeSetText('#faScheduleText', county.schedule.time);
    safeSetText('#faLocationText', county.schedule.location);

    // Access Button (live stream, zoom, or directions)
    try {
        const btn = Select('#faAccessButton');
        if (county.schedule.accessType === 'livestream' || county.schedule.accessType === 'zoom') {
            btn.label = county.schedule.accessType === 'zoom' ? '📹 Join Zoom Hearing' : '📺 Watch Live Stream';
            btn.link = county.schedule.liveUrl;
            btn.target = '_blank';
            safeExpand('#faAccessButton');
        } else if (county.schedule.liveUrl) {
            btn.label = '🏛️ Court Directory';
            btn.link = county.schedule.liveUrl;
            btn.target = '_blank';
            safeExpand('#faAccessButton');
        } else {
            safeCollapse('#faAccessButton');
        }
    } catch (e) { }

    // Phone CTA
    try {
        const callBtn = Select('#faCallButton');
        callBtn.label = `📞 Call Now: ${PHONE}`;
        callBtn.link = PHONE_TEL;
    } catch (e) { }

    safeSetText('#faCtaPhone', PHONE);

    // Content Sections
    safeSetText('#faAboutSection', county.content.about);
    safeSetText('#faWhatToExpect', county.content.what_to_expect);
    safeSetText('#faBailInfo', county.content.bail_info);
    safeSetText('#faServiceAreas', county.content.service_areas);

    // FAQ Repeater
    try {
        const faqs = county.content.faq || [];
        const repeater = Select('#faFaqRepeater');
        repeater.data = faqs.map((faq, i) => ({
            _id: `faq-${i}`,
            question: faq.question,
            answer: faq.answer
        }));
        repeater.onItemReady(($item, itemData) => {
            $item('#faFaqQuestion').text = itemData.question;
            $item('#faFaqAnswer').text = itemData.answer;
        });
    } catch (e) {
        console.log('[FA County] FAQ repeater not found or error:', e.message);
    }

    // Cross-links
    safeSetLink('#faCrossLinkCounty', county.links.county_bail_page, `${cnFull} Bail Bonds`);
    safeSetLink('#faCrossLinkHub', county.links.hub_page, 'All First Appearance Schedules');
    safeSetLink('#faCrossLinkPortal', county.links.portal, 'Start Bail Process Online');
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERACTIONS & TRACKING
// ═══════════════════════════════════════════════════════════════════════════

function wireInteractions(county) {
    // Track CTA clicks
    safeOnClick('#faCallButton', () => {
        trackFACountyEvent('cta_call', county.county_slug);
    });

    safeOnClick('#faAccessButton', () => {
        trackFACountyEvent('cta_livestream', county.county_slug);
    });

    safeOnClick('#faCrossLinkCounty', () => {
        trackFACountyEvent('crosslink_county', county.county_slug);
    });

    safeOnClick('#faCrossLinkHub', () => {
        trackFACountyEvent('crosslink_hub', county.county_slug);
    });

    safeOnClick('#faCrossLinkPortal', () => {
        trackFACountyEvent('crosslink_portal', county.county_slug);
    });
}

function trackFACountyEvent(action, countySlug) {
    try {
        // Fire GA4 event if available
        if (typeof wixWindow !== 'undefined') {
            wixWindow.trackEvent('CustomEvent', {
                event: 'first_appearance_county',
                action: action,
                county: countySlug
            });
        }
        console.log(`📊 FA County Event: ${action} (${countySlug})`);
    } catch (e) {
        console.log('[FA County] Track error:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR STATE
// ═══════════════════════════════════════════════════════════════════════════

function showErrorState(message) {
    safeHide('#faLoadingIndicator');
    safeSetText('#faCountyName', message);
    safeSetText('#faHeroSubtitle', 'We serve all of Florida. Call us 24/7 for immediate bail bond help.');
    safeCollapse('#faCountyContent');

    try {
        const callBtn = Select('#faCallButton');
        callBtn.label = `📞 Call Now: ${PHONE}`;
        callBtn.link = PHONE_TEL;
        safeExpand('#faCallButton');
    } catch (e) { }
}

// ═══════════════════════════════════════════════════════════════════════════
// SAFE WRAPPERS (prevent crash on missing elements)
// ═══════════════════════════════════════════════════════════════════════════

function safeSetText(id, text) {
    try { Select(id).text = text || ''; } catch (e) { }
}

function safeSetLink(id, url, label) {
    try {
        const el = Select(id);
        el.link = url;
        if (label) el.label = label;
    } catch (e) { }
}

function safeShow(id) {
    try { Select(id).show(); } catch (e) { }
}

function safeHide(id) {
    try { Select(id).hide(); } catch (e) { }
}

function safeExpand(id) {
    try { Select(id).expand(); } catch (e) { }
}

function safeCollapse(id) {
    try { Select(id).collapse(); } catch (e) { }
}

function safeOnClick(id, handler) {
    try { Select(id).onClick(handler); } catch (e) { }
}
