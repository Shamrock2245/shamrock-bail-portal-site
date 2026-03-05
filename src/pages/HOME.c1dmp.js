/**
 * Optimized HOME.c1dmp.js for Shamrock Bail Bonds
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Lazy load county dropdown data
 * 2. Defer non-critical form validation
 * 3. Optimize image loading priority
 * 4. Minimize initial render work
 * 5. Dynamic imports for backend and Velo APIs
 */

import { session } from 'wix-storage';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';
// import { getCounties } from 'backend/counties'; // Moved to dynamic import

// State
let countiesData = null;
let countiesLoaded = false;

$w.onReady(function () {
    const isMobile = wixWindow.formFactor === 'Mobile';

    // Setup SEO meta tags (Homepage-specific)
    // HARDENED: wrapped in try/catch -- a SEO API failure must NOT crash onReady
    // or the county dropdown and all other handlers will never be registered.
    try { setupHomepageMeta(); } catch (e) { console.warn('[SEO] setupHomepageMeta failed:', e); }

    // Setup SEO structured data
    try { setupOrganizationSchema(); } catch (e) { console.warn('[SEO] setupOrganizationSchema failed:', e); }

    // Critical: Setup above-the-fold elements only
    setupHeroSection();
    setupCTAButtons();

    // Load county dropdown - use shorter delay if cached, longer if not
    const hasCachedCounties = session.getItem('counties');
    // Mobile: Wait longer to allow Hero interaction first
    const dropdownDelay = isMobile ? (hasCachedCounties ? 50 : 1000) : (hasCachedCounties ? 100 : 500);

    setTimeout(() => {
        loadCountyDropdown();
    }, dropdownDelay);

    // Defer testimonials (2s desktop, 4s mobile)
    setTimeout(() => {
        initTestimonials();
    }, isMobile ? 4000 : 2000);

    // Telegram Hub Section -- analytics bridge (non-blocking)
    initTelegramHubSection();
});

/**
 * Setup hero section
 */
function setupHeroSection() {
    // Note: Prioritize hero image loading in Wix Editor settings

    // Setup hero CTA with ID fallback support
    const heroBtn = $w('#heroGetStartedButton');
    if (heroBtn.uniqueId) {
        heroBtn.onClick(() => {
            scrollToCountySelector();
        });
    }
}

/**
 * Setup CTA buttons
 */
function setupCTAButtons() {
    // Emergency call button
    const emergencyBtn = $w('#emergencyCallButton');
    if (emergencyBtn.uniqueId) {
        emergencyBtn.onClick(() => {
            trackEvent('emergency_call_clicked', {
                location: 'hero_section'
            });
        });
    }

    // Spanish call button (Support both ID naming conventions)
    const spanishBtn = $w('#spanishCallButton').uniqueId ? $w('#spanishCallButton') : $w('#callNowSpanishBtn');
    if (spanishBtn.uniqueId) {
        spanishBtn.onClick(() => {
            trackEvent('spanish_call_clicked', {
                location: 'hero_section'
            });
            wixLocation.to("tel:12399550301");
        });
    }

    // Telegram Bot Button
    const telegramBtn = $w('#telegramBotBtn');
    if (telegramBtn.uniqueId) {
        telegramBtn.onClick(() => {
            trackEvent('telegram_bot_clicked', {
                location: 'home_page'
            });

            // If you need to set the link via code instead of the Wix Editor UI, uncomment and update the URL below:
            // wixLocation.to('https://t.me/ ShamrockBailBot');
        });
    }
}

/**
 * Load county dropdown data (deferred)
 *
 * FIX (2026-03-04): Resolve the canonical dropdown element ID once and reuse
 * it throughout this function so that onChange fires on the same element that
 * has options set. Previously the ID resolution was inconsistent -- options were
 * written to #countySelector but onChange was wired to #countyDropdown (or
 * vice-versa), so the change event never fired and the page appeared "stuck".
 */
async function loadCountyDropdown() {
    if (countiesLoaded) return;

    // -- Resolve the ONE canonical dropdown element -------------------------
    // Check #countySelector first (confirmed ID in Wix Editor screenshot).
    // Fall back to #countyDropdown for legacy support.
    // We resolve ONCE here and reuse the same reference everywhere below.
    let dropdown;
    try {
        const el = $w('#countySelector');
        dropdown = el && el.uniqueId ? el : $w('#countyDropdown');
    } catch (e) {
        try { dropdown = $w('#countyDropdown'); } catch (e2) { /* no dropdown found */ }
    }

    if (!dropdown || !dropdown.uniqueId) {
        console.warn('[County Dropdown] Neither #countySelector nor #countyDropdown found on page.');
        return;
    }

    try {
        dropdown.placeholder = 'Loading counties...';

        // Dynamic import for performance
        const { getCounties } = await import('backend/counties');

        // Check session cache first to avoid backend roundtrip
        const cachedCounties = session.getItem('counties');
        if (cachedCounties) {
            try {
                countiesData = JSON.parse(cachedCounties);
            } catch (parseErr) {
                console.warn('[County Dropdown] Cache parse failed, re-fetching.', parseErr);
                countiesData = null;
            }
        }

        if (!countiesData) {
            // Fetch from backend
            const response = await getCounties();
            if (Array.isArray(response) && response.length > 0) {
                countiesData = response;
                // Cache for session duration (TTL param is ignored by wix-storage session,
                // but kept for forward-compatibility)
                try { session.setItem('counties', JSON.stringify(countiesData)); } catch (e) { /* non-fatal */ }
            } else {
                console.warn('[County Dropdown] Invalid counties response:', response);
                countiesData = getFallbackCounties();
            }
        }

        // -- Populate dropdown options ---------------------------------------
        if (Array.isArray(countiesData) && countiesData.length > 0) {
            dropdown.options = countiesData.map(county => {
                const slug = (county.slug || '').replace(/-county$/i, '').trim();
                const displayName = county.name || county.county_name || slug;
                return {
                    label: displayName,
                    value: slug  // CRITICAL: slug is used for URL routing
                };
            });
            dropdown.placeholder = 'Select a County';

            // -- Wire onChange on the SAME element that has options ----------
            dropdown.onChange(() => handleCountySelection(dropdown));
        } else {
            dropdown.placeholder = 'Counties unavailable -- call us';
        }

        // Setup Get Started button (support both IDs)
        let getStartedBtn;
        try {
            const btn = $w('#getStartedButton');
            getStartedBtn = btn && btn.uniqueId ? btn : $w('#getStartedBtn');
        } catch (e) {
            try { getStartedBtn = $w('#getStartedBtn'); } catch (e2) { /* not found */ }
        }
        if (getStartedBtn && getStartedBtn.uniqueId) {
            getStartedBtn.onClick(() => handleGetStarted(dropdown));
        }

        countiesLoaded = true;

    } catch (error) {
        console.error('[County Dropdown] Load error:', error);
        try { dropdown.placeholder = 'Error loading -- call (239) 332-2245'; } catch (e) { /* non-fatal */ }
    }
}

/**
 * Inline fallback county list -- used only when backend call fails entirely.
 * Keeps the dropdown functional even if the CMS or backend is unreachable.
 */
function getFallbackCounties() {
    return [
        { name: 'Lee', slug: 'lee' },
        { name: 'Collier', slug: 'collier' },
        { name: 'Charlotte', slug: 'charlotte' },
        { name: 'Sarasota', slug: 'sarasota' },
        { name: 'Miami-Dade', slug: 'miami-dade' },
        { name: 'Broward', slug: 'broward' },
        { name: 'Palm Beach', slug: 'palm-beach' },
        { name: 'Hillsborough', slug: 'hillsborough' },
        { name: 'Orange', slug: 'orange' },
        { name: 'Pinellas', slug: 'pinellas' }
    ];
}

/**
 * Handle county selection.
 *
 * FIX (2026-03-04): Accept the resolved dropdown element as a parameter
 * instead of re-resolving the ID (which was the source of the stuck bug --
 * the re-resolution sometimes picked the wrong element and read an empty value).
 *
 * @param {Object} [dropdownEl] - The resolved Wix dropdown element
 */
function handleCountySelection(dropdownEl) {
    // Use passed element; fall back to ID resolution only as last resort
    let dropdown = dropdownEl;
    if (!dropdown || !dropdown.uniqueId) {
        try {
            const el = $w('#countySelector');
            dropdown = el && el.uniqueId ? el : $w('#countyDropdown');
        } catch (e) {
            try { dropdown = $w('#countyDropdown'); } catch (e2) { return; }
        }
    }

    const selectedCounty = dropdown ? dropdown.value : '';

    if (selectedCounty) {
        trackEvent('county_selected', { county: selectedCounty });
        // Auto-navigate immediately on selection -- no extra button click needed
        navigateToCounty(selectedCounty);
    }
}

/**
 * Handle Get Started button click.
 *
 * FIX (2026-03-04): Accept the resolved dropdown element as a parameter.
 *
 * @param {Object} [dropdownEl] - The resolved Wix dropdown element
 */
function handleGetStarted(dropdownEl) {
    let dropdown = dropdownEl;
    if (!dropdown || !dropdown.uniqueId) {
        try {
            const el = $w('#countySelector');
            dropdown = el && el.uniqueId ? el : $w('#countyDropdown');
        } catch (e) {
            try { dropdown = $w('#countyDropdown'); } catch (e2) { return; }
        }
    }

    const selectedCounty = dropdown ? dropdown.value : '';

    if (!selectedCounty) {
        try {
            const errorText = $w('#countyError');
            if (errorText && errorText.uniqueId) {
                errorText.text = 'Please select a county';
                errorText.show();
            }
        } catch (e) { /* element may not exist */ }
        return;
    }

    trackEvent('get_started_clicked', { county: selectedCounty });
    navigateToCounty(selectedCounty);
}

/**
 * Navigate to the selected county page.
 *
 * FIX (2026-03-04): Added guard against empty/null slug so the page can
 * never get stuck in a navigation loop. Also strips the '-county' suffix
 * that the JSON data sometimes includes, and normalises spaces to hyphens.
 *
 * @param {string} selectedCounty - The slug value from the dropdown
 */
async function navigateToCounty(selectedCounty) {
    if (!selectedCounty) {
        console.warn('[County Nav] navigateToCounty called with empty value -- aborting.');
        return;
    }

    // Normalise: lowercase, trim, strip trailing '-county' or ' county', spaces -> hyphens
    const cleanSlug = String(selectedCounty)
        .toLowerCase()
        .trim()
        .replace(/-county$/i, '')      // strip -county suffix (e.g. "lee-county" -> "lee")
        .replace(/\s+county$/i, '')    // strip " county" suffix (e.g. "lee county" -> "lee")
        .replace(/\s+/g, '-');         // spaces to hyphens

    if (!cleanSlug) {
        console.warn('[County Nav] Slug normalised to empty string -- aborting.');
        return;
    }

    console.log(`[County Nav] Navigating to /florida-bail-bonds/${cleanSlug}`);
    wixLocation.to(`/florida-bail-bonds/${cleanSlug}`);
}

/**
 * Scroll to county selector
 */
function scrollToCountySelector() {
    if ($w('#countySelector').uniqueId) {
        $w('#countySelector').scrollTo();
    } else if ($w('#countyDropdown').uniqueId) {
        $w('#countyDropdown').scrollTo();
    }
}

/**
 * Initialize testimonials (deferred)
 */
function initTestimonials() {
    const repeater = $w('#testimonialsRepeater');
    if (!repeater.uniqueId) return;

    // Use IntersectionObserver (onViewportEnter) for lazy rendering
    repeater.onViewportEnter(() => {
        loadTestimonials();
    });

    // Also trigger if it might already be in view
    loadTestimonials();
}

/**
 * Load testimonials data
 */
function loadTestimonials() {
    const repeater = $w('#testimonialsRepeater');
    if (repeater.data.length > 0) return;

    // Static content for speed - eventually fetch from CMS if needed
    const testimonials = [
        {
            _id: '1',
            name: 'Steve D.',
            text: 'Answered immediately and had everything moving fast. You can tell they know exactly what they\'re doing.',
            rating: 5
        },
        {
            _id: '2',
            name: 'Brian C.',
            text: 'Calm, respectful, and professional when we needed it most. They handled everything.',
            rating: 5
        },
        {
            _id: '3',
            name: 'Ana E.',
            text: 'They picked up late at night and never rushed us off the phone.',
            rating: 5
        },
        {
            _id: '4',
            name: 'Rafael I.',
            text: 'They treated us like people, not a number. That mattered more than anything.',
            rating: 5
        }
    ];

    repeater.data = testimonials;

    repeater.onItemReady(($item, itemData) => {
        // ID Fallbacks for robustness
        const nameTxt = $item('#testimonialName').uniqueId ? $item('#testimonialName') : $item('#authorName');
        if (nameTxt.uniqueId) nameTxt.text = itemData.name;

        const bodyTxt = $item('#testimonialText').uniqueId ? $item('#testimonialText') : $item('#quoteText');
        if (bodyTxt.uniqueId) bodyTxt.text = itemData.text;
    });
}

/**
 * Setup Homepage-specific meta tags and title
 * Targets Florida-wide bail bond keywords for maximum SERP visibility
 */
function setupHomepageMeta() {
    const title = '24/7 Bail Bonds Florida | Shamrock Bail Bonds - Fort Myers Since 2012';
    const description = 'Need bail bonds in Florida? Shamrock Bail Bonds serves all 67 counties 24/7. Fast jail release, payment plans, bilingual English & Spanish. Call (239) 332-2245 for immediate help.';
    const url = 'https://www.shamrockbailbonds.biz';

    wixSeo.setTitle(title);
    wixSeo.setMetaTags([
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: `${url}/logo.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:locale', content: 'en_US' },
        { property: 'og:site_name', content: 'Shamrock Bail Bonds, LLC' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: `${url}/logo.png` },
        { name: 'keywords', content: 'bail bonds Florida, Fort Myers bail bonds, 24/7 bail bondsman, Florida jail release, Lee County bail bonds, Collier County bail bonds, Charlotte County bail bonds, bail bond payment plans, immigration bail bonds Florida, bilingual bail bonds' }
    ]);
}

/**
 * Setup Organization Schema for SEO
 */
function setupOrganizationSchema() {
    const schemas = [
        // 1. Organization Schema
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
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": "26.6406",
                "longitude": "-81.8723"
            },
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
                        "opens": "00:00",
                        "closes": "23:59"
                    }
                },
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-332-5245",
                    "contactType": "Emergency",
                    "areaServed": "FL",
                    "availableLanguage": ["English", "Spanish"]
                },
                {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-955-0301",
                    "contactType": "Customer Service",
                    "areaServed": "FL",
                    "availableLanguage": "Spanish"
                }
            ],
            "areaServed": {
                "@type": "State",
                "name": "Florida",
                "@id": "https://en.wikipedia.org/wiki/Florida"
            },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00",
                "closes": "23:59"
            },
            "priceRange": "$$",
            "paymentAccepted": "Cash, Credit Card, Debit Card"
        },
        // 2. LocalBusiness Schema
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
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": "26.6406",
                "longitude": "-81.8723"
            },
            "url": "https://www.shamrockbailbonds.biz",
            "telephone": "+1-239-332-2245",
            "priceRange": "$$",
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "127",
                "bestRating": "5",
                "worstRating": "1"
            },
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                }
            ]
        },
        // 3. Service Schema
        {
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Bail Bonds",
            "provider": {
                "@id": "https://www.shamrockbailbonds.biz/#organization"
            },
            "areaServed": [
                {
                    "@type": "State",
                    "name": "Florida"
                }
            ],
            "availableChannel": {
                "@type": "ServiceChannel",
                "servicePhone": {
                    "@type": "ContactPoint",
                    "telephone": "+1-239-332-2245",
                    "availableLanguage": ["English", "Spanish"]
                },
                "serviceUrl": "https://www.shamrockbailbonds.biz"
            },
            "hoursAvailable": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00",
                "closes": "23:59"
            }
        }
    ];

    wixSeo.setStructuredData(schemas).catch(e => console.error('Schema error:', e));
}

// 
// TELEGRAM HUB SECTION -- Analytics Bridge
// Wires the HTML iframe embed (#telegramHubEmbed) postMessage
// events to Wix Analytics + GAS backend.
// Element IDs required in Wix Editor:
//   #telegramHubEmbed   -- HTML Component iframe (paste telegram-hub-section.html)
//   #telegramHubSection -- Section strip (for scroll viewport tracking)
// 

/**
 * Initialize Telegram Hub section analytics bridge.
 * Called from $w.onReady() -- non-blocking, all errors caught.
 */
function initTelegramHubSection() {
    // Wire HTML embed message listener
    try {
        const embed = $w('#telegramHubEmbed');
        if (embed && embed.onMessage) {
            embed.onMessage(handleTelegramHubMessage);
        }
    } catch (e) {
        console.log('[TelegramHub] #telegramHubEmbed not found -- add HTML Component to page');
    }
    // Section scroll-into-view tracking
    try {
        $w('#telegramHubSection').onViewportEnter(() => {
            trackEvent('TelegramHub_SectionVisible', { section: 'telegram_hub' });
        });
    } catch (e) { /* element may not exist yet -- add Section ID in Wix Editor */ }
}

/**
 * Handle postMessage events from the Telegram Hub iframe.
 * @param {Object} event - Wix HTML Component message event
 */
function handleTelegramHubMessage(event) {
    let data;
    try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (e) { return; }
    if (!data) return;

    // Iframe auto-height: resize the HTML Component to match its content
    if (data.type === 'shamrock_iframe_height' && data.height) {
        try {
            const embed = $w('#telegramHubEmbed');
            if (embed && embed.height !== undefined) {
                embed.height = data.height;
            }
        } catch (e) { /* element may not be present -- non-fatal */ }
        return;
    }

    if (data.type !== 'shamrock_analytics') return;

    const evtName  = data.event   || 'unknown';
    const label    = data.label   || '';
    const section  = data.section || 'telegram_hub';
    const extra    = data.extra   || {};

    // Log to Wix Analytics
    trackEvent('TelegramHub_' + evtName, { label, section });

    // Relay high-value events to GAS (non-blocking, fire-and-forget)
    const HIGH_VALUE = ['tg_cta_click', 'miniapp_click', 'bail_school_click', 'video_play', 'outbound_click'];
    if (HIGH_VALUE.includes(evtName)) {
        import('backend/gasIntegration.jsw')
            .then(({ logTelegramSectionEvent }) => {
                logTelegramSectionEvent({
                    event:     evtName,
                    label:     label,
                    extra:     JSON.stringify(extra),
                    pageUrl:   '',
                    timestamp: new Date().toISOString()
                }).catch(() => { /* non-fatal */ });
            })
            .catch(() => { /* non-fatal */ });
    }
}

/**
 * Track events (lightweight wrapper)
 */
function trackEvent(eventName, eventData = {}) {
    try {
        wixWindow.trackEvent("CustomEvent", {
            event: eventName,
            detail: eventData
        });
    } catch (e) {
        // Fail silently
    }
}