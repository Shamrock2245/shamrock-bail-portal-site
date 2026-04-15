/// <reference path="../types/wix-overrides.d.ts" />
// Force Sync: Dynamic Page Logic
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';
import wixData from 'wix-data';
import { generateCountyPage } from 'backend/county-generator';
// replaced public/countyUtils with optimized backend
// import { getCountiesByRegion } from 'backend/counties'; // Moved to dynamic import

// Type-safe element selector to bypass ID validation issues
// cast to any to allow any string
const Select = (selector) => /** @type {any} */($w)(selector);

$w.onReady(async function () {
    console.log(" Dynamic County Page Loading... (Optimized v2)");

    // 1. EXTRACT SLUG
    const path = wixLocation.path;
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    console.log(` Frontend detected slug: "${countySlug}"`);

    if (!countySlug) {
        console.error("[X] No slug found in URL path:", path);
        return;
    }

    // --- DATASET OVERRIDE (Legacy Support) ---
    // Safely attempt to filter legacy dataset if present, but don't block execution
    Select('#dynamicDataset').onReady(() => {
        // console.log("Dataset Ready - Applying Filter...");
        Select('#dynamicDataset').setFilter(wixData.filter().eq('countySlug', countySlug))
            .catch(e => console.log("[!] Dataset filter failed:", e));
    });

    try {
        // Show loading state if element exists
        try { Select('#loadingIndicator').show(); } catch (e) { }

        // 2. FETCH MAIN DATA (Critical Path)
        const pageResult = await generateCountyPage(countySlug.toLowerCase());

        const { success, data } = pageResult;

        if (!success || !data) {
            console.warn(`[!] County data not found for slug: ${countySlug}.`);
            try { Select('#loadingIndicator').hide(); } catch (e) { }
            try {
                Select('#countyName').text = "County Not Found";
                Select('#countyName').expand();
                Select('#heroSubtitle').text = "We serve all of Florida, but this specific page is unavailable. Call us now for immediate help.";
                Select('#heroSubtitle').expand();
                Select('#heroCallButton').expand();
                Select('#countyContent').collapse();
            } catch (e) { }
            return;
        }

        const county = data;

        // 3. GENERATE SEO (Meta + Schema) - Critical for SEO
        setupSEO(county);

        // 4. POPULATE UI + inject final schema (including FAQs)
        await populateMainUI(county, countySlug);

        // 5. DEFER NON-CRITICAL (Nearby Counties)
        const isMobile = wixWindow.formFactor === 'Mobile';
        setTimeout(() => {
            loadNearbyCounties(county.region, countySlug);
        }, isMobile ? 3000 : 500);

        // Hide loader / Show content
        try { Select('#loadingIndicator').hide(); } catch (e) { }
        try { Select('#countyContent').expand(); } catch (e) { }

    } catch (err) {
        console.error("CRITICAL ERROR in Florida Counties Page:", err);
        $w('#countyName').text = "Bail Bonds in Florida";
        try { Select('#loadingIndicator').hide(); } catch (e) { }
    }
});

function setupSEO(county) {
    const cn = county.county_name;
    const cnLower = cn.toLowerCase();
    const canonUrl = `https://www.shamrockbailbonds.biz${county.seo.canonical_url}`;

    // ─── EXPANDED KEYWORDS (long-tail for AI search + voice) ───
    const expandedKeywords = [
        ...(county.seo.keywords || []),
        `bail bonds near me ${cnLower} county`,
        `how to bail someone out of jail in ${cnLower} county florida`,
        `${cnLower} county jail inmate search`,
        `24 hour bail bondsman ${cnLower} county fl`,
        `${cnLower} county arrest records`,
        `cheap bail bonds ${cnLower} county`,
        `bail bond payment plan ${cnLower} county`,
        `${cnLower} county florida bail schedule`,
        `emergency bail bonds ${cnLower} county`,
        `bail bonds in ${cnLower} county florida`
    ];

    // ─── META TAGS ───
    wixSeo.setTitle(county.seo.meta_title);
    wixSeo.setMetaTags([
        { "name": "description", "content": county.seo.meta_description },
        { "name": "keywords", "content": expandedKeywords.join(", ") },
        { "property": "og:title", "content": county.seo.meta_title },
        { "property": "og:description", "content": county.seo.meta_description },
        { "property": "og:url", "content": canonUrl },
        { "property": "og:type", "content": "website" },
        { "property": "og:image", "content": "https://www.shamrockbailbonds.biz/logo.png" },
        { "property": "og:locale", "content": "en_US" },
        { "property": "og:site_name", "content": "Shamrock Bail Bonds" },
        { "name": "twitter:card", "content": "summary_large_image" },
        { "name": "twitter:title", "content": county.seo.meta_title },
        { "name": "twitter:description", "content": county.seo.meta_description },
        { "name": "twitter:image", "content": "https://www.shamrockbailbonds.biz/logo.png" },
        { "name": "geo.region", "content": "US-FL" },
        { "name": "geo.placename", "content": `${cn} County, Florida` },
        { "name": "robots", "content": "index, follow, max-snippet:-1, max-image-preview:large" }
    ]);

    // Set canonical URL
    try { wixSeo.setLinks([{ "rel": "canonical", "href": canonUrl }]); } catch (e) { }

    // ─── STRUCTURED DATA (JSON-LD) ───
    const schemas = [];

    // A. Breadcrumbs — 3-level deep for strong hierarchy signal
    schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
            { "@type": "ListItem", "position": 2, "name": "Florida Bail Bonds", "item": "https://www.shamrockbailbonds.biz/florida-bail-bonds" },
            { "@type": "ListItem", "position": 3, "name": `${cn} County Bail Bonds`, "item": canonUrl }
        ]
    });

    // B. LocalBusiness — Enhanced with aggregateRating, speakable, GeoCircle, and offerCatalog
    schemas.push({
        "@context": "https://schema.org",
        "@type": ["LocalBusiness", "ProfessionalService"],
        "additionalType": "https://schema.org/ProfessionalService",
        "@id": `${canonUrl}#localbusiness`,
        "name": `Shamrock Bail Bonds - ${cn} County`,
        "description": county.seo.meta_description,
        "url": canonUrl,
        "telephone": "+1-239-332-2245",
        "image": "https://www.shamrockbailbonds.biz/logo.png",
        "logo": "https://www.shamrockbailbonds.biz/logo.png",
        "foundingDate": "2012-03-15",
        "sameAs": [
            "https://www.facebook.com/ShamrockBail",
            "https://www.instagram.com/shamrock_bail_bonds",
            "https://t.me/ShamrockBail_bot",
            "https://www.google.com/maps/place/Shamrock+Bail+Bonds",
            "https://www.shamrockbailbonds.biz"
        ],
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
        "contactPoint": [
            {
                "@type": "ContactPoint",
                "telephone": "+1-239-332-2245",
                "contactType": "Customer Service",
                "areaServed": "US-FL",
                "availableLanguage": ["English", "Spanish"],
                "hoursAvailable": { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "00:00", "closes": "23:59" }
            },
            {
                "@type": "ContactPoint",
                "telephone": "+1-239-332-5245",
                "contactType": "Emergency",
                "areaServed": "US-FL",
                "availableLanguage": ["English", "Spanish"]
            },
            {
                "@type": "ContactPoint",
                "telephone": "+1-239-955-0301",
                "contactType": "Customer Service",
                "areaServed": "US-FL",
                "availableLanguage": "Spanish"
            }
        ],
        "areaServed": [
            {
                "@type": "AdministrativeArea",
                "name": `${cn} County, Florida`
            },
            {
                "@type": "State",
                "name": "Florida"
            },
            {
                "@type": "GeoCircle",
                "geoMidpoint": { "@type": "GeoCoordinates", "latitude": "26.6406", "longitude": "-81.8723" },
                "geoRadius": "250 mi"
            },
            // Add specific cities as served areas for local SEO
            ...((county.cities || []).slice(0, 4).map(city => ({
                "@type": "City",
                "name": `${city}, Florida`
            })))
        ],
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        },
        "priceRange": "$$",
        "paymentAccepted": "Cash, Credit Card, Debit Card, Payment Plans",
        "currenciesAccepted": "USD",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "127",
            "bestRating": "5",
            "worstRating": "1"
        },
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": `Bail Bond Services in ${cn} County`,
            "itemListElement": [
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": `${cn} County Misdemeanor Bail Bonds` } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": `${cn} County Felony Bail Bonds` } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": `${cn} County DUI Bail Bonds` } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": `${cn} County Domestic Violence Bail Bonds` } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": `${cn} County Warrant Surrender Assistance` } },
                { "@type": "Offer", "itemOffered": { "@type": "Service", "name": `${cn} County Immigration Bail Bonds` } }
            ]
        },
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", "h2", ".hero-subtitle", ".about-section"]
        }
    });

    // C. FAQPage — Deferred to populateMainUI() where CMS FAQs are loaded

    // D. Service Schema (County-Specific, with full details)
    schemas.push({
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${canonUrl}#service`,
        "serviceType": "Bail Bonds",
        "name": `Bail Bonds in ${cn} County, Florida`,
        "description": `24/7 professional bail bond services in ${cn} County. Fast, confidential, and reliable bail bonds with bilingual support. Licensed by the State of Florida.`,
        "provider": {
            "@type": "Organization",
            "name": "Shamrock Bail Bonds",
            "telephone": "+1-239-332-2245",
            "url": "https://www.shamrockbailbonds.biz",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            }
        },
        "areaServed": [
            { "@type": "AdministrativeArea", "name": `${cn} County, Florida` },
            { "@type": "State", "name": "Florida" }
        ],
        "availableChannel": [
            {
                "@type": "ServiceChannel",
                "name": "Phone",
                "servicePhone": { "@type": "ContactPoint", "telephone": "+1-239-332-2245", "availableLanguage": ["English", "Spanish"] },
                "serviceUrl": canonUrl
            },
            {
                "@type": "ServiceChannel",
                "name": "Online Portal",
                "serviceUrl": "https://www.shamrockbailbonds.biz/portal-landing"
            },
            {
                "@type": "ServiceChannel",
                "name": "Telegram Bot",
                "serviceUrl": "https://t.me/ShamrockBail_bot"
            }
        ],
        "hoursAvailable": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        },
        "offers": {
            "@type": "Offer",
            "availability": "https://schema.org/InStock",
            "priceCurrency": "USD",
            "description": "Florida statutory rate: 10% of bail amount (minimum $100 per charge)"
        },
        "termsOfService": "https://www.shamrockbailbonds.biz/terms-of-service"
    });

    // E. Organization Schema — Statewide authority signal
    schemas.push({
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": "https://www.shamrockbailbonds.biz/#organization",
        "name": "Shamrock Bail Bonds",
        "url": "https://www.shamrockbailbonds.biz",
        "logo": "https://www.shamrockbailbonds.biz/logo.png",
        "telephone": "+1-239-332-2245",
        "foundingDate": "2012-03-15",
        "areaServed": { "@type": "State", "name": "Florida" },
        "sameAs": [
            "https://www.facebook.com/ShamrockBail",
            "https://www.instagram.com/shamrock_bail_bonds",
            "https://t.me/ShamrockBail_bot"
        ],
        "knowsAbout": [
            "Bail Bonds", "Florida Criminal Justice", "Jail Release Process",
            "Surety Bonds", "Warrant Surrender", "Court Appearances"
        ]
    });

    // F. HowTo Schema — Targets "how to bail someone out of {county} county jail" searches
    const howToSteps = county.content && county.content.how_it_works_steps;
    if (howToSteps && howToSteps.length > 0) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": `How to Bail Someone Out of ${cn} County Jail`,
            "description": `Step-by-step guide to posting bail in ${cn} County, Florida. Shamrock Bail Bonds is available 24/7 to help.`,
            "totalTime": "PT4H",
            "estimatedCost": {
                "@type": "MonetaryAmount",
                "currency": "USD",
                "value": "100"
            },
            "step": howToSteps.map((step, i) => ({
                "@type": "HowToStep",
                "position": i + 1,
                "name": step.name,
                "text": step.text
            })),
            "tool": [
                { "@type": "HowToTool", "name": "Phone" },
                { "@type": "HowToTool", "name": "Valid ID" },
                { "@type": "HowToTool", "name": "Payment method (cash, credit card, or payment plan)" }
            ]
        });
    }

    // Store schemas; FAQPage will be appended in populateMainUI
    county._seoSchemas = schemas;
}

// --- HELPER UI FUNCTIONS ---
function setText(selectorOrArray, value) {
    const selectors = Array.isArray(selectorOrArray) ? selectorOrArray : [selectorOrArray];
    let found = false;
    for (const selector of selectors) {
        try {
            const el = $w(selector);
            if (el && el.type === '$w.Text') {
                el.text = value || "";
                el.expand();
                found = true;
                // console.log(`[OK] Set text for ${selector}`);
            }
        } catch (e) { }
    }
    if (!found) {
        // console.warn(`[!] Text element not found for value: "${value?.substring(0, 20)}..." in selectors: ${selectors.join(', ')}`);
    }
}

function setLink(selectorOrArray, url, label) {
    const selectors = Array.isArray(selectorOrArray) ? selectorOrArray : [selectorOrArray];
    for (const selector of selectors) {
        try {
            const el = $w(selector);
            if (url) {
                if (el.type === '$w.Button') {
                    el.label = label || el.label;
                    el.link = url;
                    el.target = "_blank";
                } else if (el.type === '$w.Text') {
                    // If it's text, we can't link it easily without HTML, skip
                    el.text = label || el.text;
                }
                el.expand();
            } else {
                el.collapse();
            }
        } catch (e) { }
    }
}

async function populateMainUI(county, currentSlug) {
    // Header & Hero (Support both old and new IDs from Screenshot)
    // Old: #countyName, #dynamicHeader, #heroSubtitle
    // New: #countyNameHeadline, #aboutCountyText (Maybe hero text?), #heroCallButton
    setText(['#countyName', '#countyNameHeadline', '#dynamicHeader'], county.county_name);

    // Subtitle / About Text in Hero
    setText(['#heroSubtitle', '#aboutCountyText', '#heroDescription'], county.content.hero_subheadline);

    // About Section Headers
    // Header often has IDs like: #aboutHeader, #aboutTitle, #textAboutCounty
    setText(['#aboutHeader', '#aboutTitle', '#textAboutCounty', '#aboutSectionTitle', '#textAboutTitle'], `About Bail Bonds in ${county.county_name} County, Florida`);
    setText(['#aboutBody', '#aboutText', '#aboutDescription', '#aboutContent', '#textAboutBody'], county.content.about_county);

    // Why Choose Us
    setText(['#whyChooseHeader', '#whyChooseTitle'], `Why Choose Us in ${county.county_name} County`);
    setText(['#whyChooseBody', '#whyChooseText'], county.content.why_choose_us);

    // Service Areas (new — includes city names)
    setText(['#serviceAreasText', '#textServiceAreas', '#serviceAreas'], county.content.service_areas);

    // County Seat & Judicial Circuit (new enriched data)
    if (county.county_seat) {
        setText(['#countySeatText', '#textCountySeat'], `County Seat: ${county.county_seat}`);
    }
    if (county.judicial_circuit_number) {
        setText(['#judicialCircuitText', '#textCircuit'], `${county.judicial_circuit_number} Judicial Circuit of Florida`);
    }

    // Inmate Search CTA (new — prominent resource link)
    if (county.resources && county.resources.inmate_search_url) {
        setLink(['#inmateSearchBtn', '#btnInmateSearch', '#searchInmatesBtn'],
            county.resources.inmate_search_url,
            `Search ${county.county_name} County Inmates`);
    }
    if (county.resources && county.resources.court_records_url) {
        setLink(['#courtRecordsBtn', '#btnCourtRecords'],
            county.resources.court_records_url,
            `${county.county_name} County Court Records`);
    }

    // Contact Info (Jail/Clerk)
    // Jail Name & Phone
    setText(['#jailName', '#jailTitle', '#textJailName'], county.jail.name);
    setText(['#sheriffPhone', '#jailPhone', '#textJailPhone'], county.jail.booking_phone);

    // Clerk Name & Phone (Added Clerk Name mapping)
    setText(['#clerkName', '#clerkTitle', '#textClerkName'], "Clerk of Court"); // Fixed Label or data if available
    setText(['#clerkPhone', '#clerkContact', '#textClerkPhone'], county.clerk.phone);

    // Sheriff Name & Phone (Added Sheriff Name mapping)
    setText(['#sheriffName', '#sheriffTitle', '#textSheriffName'], "Sheriff's Office");
    // Reuse booking phone or specific sheriff phone if available
    setText(['#sheriffContactPhone', '#textSheriffPhone'], county.jail.booking_phone);

    // Links / Buttons (Sheriff/Clerk)
    setLink(['#callSheriffBtn', '#btnCallJail'], county.jail.booking_url, "Jail / Sheriff Website");
    setLink(['#sheriffWebsite', '#btnJailWeb'], county.jail.booking_url, "Jail / Sheriff Website");

    setLink(['#callClerkBtn', '#btnCallClerk'], county.clerk.website, "Clerk of Court");
    setLink(['#clerkWebsite', '#btnClerkWeb'], county.clerk.website, "Clerk Website");

    // Primary Call Button (Sticky or Hero)
    // Screenshot 1 shows: #heroCallButton, #heroStartButton
    const primaryPhoneLink = `tel:${county.contact.primary_phone_display.replace(/[^0-9]/g, '')}`;

    // 1. Hero Call Button
    setLink(['#heroCallButton', '#callShamrockBtn', '#callCountiesBtn'], primaryPhoneLink, county.content.hero_cta_primary || "Call Now");

    // 2. Secondary/Start Button (Link to portal landing page with county context)
    setLink(['#heroStartButton', '#startBailBtn'], `/portal-landing?county=${county.slug || county.countySlug || currentSlug}`, "Start Bail Bond");

    // Jail Address (if element exists and data provided)
    try { $w('#jailAddress').collapse(); } catch (e) { }

    // POPULATE FAQs (Repeater) - Now pulls from CMS Faqs collection
    // Safe element getter — prevents crashes from accessing non-existent Wix elements
    const safeGet = (scopedSelector, id) => {
        try {
            const el = scopedSelector(id);
            return (el && el.uniqueId) ? el : null;
        } catch (e) {
            return null;
        }
    };

    const faqRep = safeGet($w, '#repeaterFAQ') || safeGet($w, '#listRepeater') || safeGet($w, '#faqRepeater');

    let faqs = [];
    const countyName = county.name || county.countyName || county.county_name || "Unknown County";
    const countyShort = countyName.replace(/ County$/i, '').trim();
    const countyFull = countyShort + ' County';

    try {
        let cmsItems = [];

        // 1. Try Import22 collection — county-specific FAQs
        try {
            const result = await wixData.query('Import22')
                .eq('isActive', true)
                .hasSome('relatedCounty', [countyFull, countyShort, countyName])
                .ascending('sortOrder')
                .limit(15)
                .find();
            if (result && result.items.length > 0) {
                cmsItems = result.items;
            }
        } catch (e) {
            console.warn('[FAQ] Import22 query failed:', e.message);
        }

        // 2. Fallback: Try Faqs collection
        if (cmsItems.length === 0) {
            try {
                const result = await wixData.query('Faqs')
                    .hasSome('relatedCounty', [countyFull, countyShort, countyName])
                    .limit(15)
                    .find();
                if (result && result.items.length > 0) {
                    cmsItems = result.items;
                }
            } catch (e2) { /* no-op */ }
        }

        // 3. Fallback: Generic (non-county-specific) FAQs from Import22
        if (cmsItems.length === 0) {
            try {
                const result = await wixData.query('Import22')
                    .eq('isActive', true)
                    .ascending('sortOrder')
                    .limit(10)
                    .find();
                if (result && result.items.length > 0) {
                    cmsItems = result.items;
                }
            } catch (e3) { /* no-op */ }
        }

        // Transform CMS items → FAQ format, replacing "Lee County" with current county
        if (cmsItems.length > 0) {
            faqs = cmsItems.map(item => {
                let question = item.title || item.question || '';
                let answer = item.answer || '';
                question = question.replace(/Lee County/gi, countyFull);
                answer = answer.replace(/Lee County/gi, countyFull);
                return { _id: item._id, question, answer };
            });
        }

        // 4. MERGE with embedded FAQs from county-generator to guarantee content
        const embeddedFaqs = (county.content && county.content.faq) || [];
        if (embeddedFaqs.length > 0) {
            // Only add embedded FAQs that don't duplicate existing CMS questions
            const existingQuestions = new Set(faqs.map(f => f.question.toLowerCase().trim()));
            for (const ef of embeddedFaqs) {
                if (!existingQuestions.has(ef.question.toLowerCase().trim())) {
                    faqs.push({ _id: `embed-${faqs.length}-${Date.now()}`, question: ef.question, answer: ef.answer });
                }
            }
        }

        console.log(`[FAQ] Loaded ${faqs.length} FAQs for ${countyFull} (${cmsItems.length} CMS + merged embedded)`);
    } catch (err) {
        console.error('[X] Error loading FAQs:', err);
        faqs = (county.content && county.content.faq) || [];
    }

    // Inject final structured data (base schemas + FAQPage + ItemList for internal links) in a single call
    if (faqs.length > 0) {
        try {
            const baseSchemas = county._seoSchemas || [];
            const faqSchema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqs.map(f => ({
                    "@type": "Question",
                    "name": f.question,
                    "acceptedAnswer": { "@type": "Answer", "text": f.answer }
                })),
                "speakable": {
                    "@type": "SpeakableSpecification",
                    "cssSelector": [".faq-question", ".faq-answer", "h1", "h2"]
                }
            };
            // Single consolidated call — replaces the early call in setupSEO
            wixSeo.setStructuredData([...baseSchemas, faqSchema]).catch(e => { });
        } catch (seoErr) {
            console.warn('FAQPage schema injection failed:', seoErr);
        }
    }

    // --- INTERNAL LINKING STRATEGY ---
    // Populate cross-links to core site pages + Florida Directory hub
    populateInternalLinks(county, currentSlug);

    try {
        if (faqs.length > 0 && faqRep) {
            faqRep.data = []; // Clear first to force redraw

            faqRep.onItemReady(($item, itemData) => {
                const question = itemData.question || itemData.title || 'Question';
                const answer = itemData.answer || itemData.a || 'Answer';

                // ========================================
                // EXACT Wix Editor IDs (from Layers panel)
                // ========================================
                const qText = safeGet($item, '#textQuestion');
                const aText = safeGet($item, '#textAnswer');
                const answerGroup = safeGet($item, '#groupAnswer');
                const toggleTrigger = safeGet($item, '#containerQuestion');
                const arrow = safeGet($item, '#iconArrow');

                // Set question text
                if (qText) {
                    qText.text = question;
                }

                // Set answer text (handle CollapsibleText if present)
                if (aText) {
                    try {
                        if (typeof aText.collapseText === 'function') {
                            aText.expandText();
                        }
                    } catch (e) { /* not a collapsible text */ }
                    aText.text = answer;
                }

                // Initialize state: answer collapsed, arrow pointing down
                if (answerGroup) {
                    answerGroup.collapse();
                }

                // Click handler — toggle FAQ answer visibility
                if (toggleTrigger && answerGroup) {
                    toggleTrigger.onClick(() => {
                        if (answerGroup.collapsed) {
                            answerGroup.expand();
                        } else {
                            answerGroup.collapse();
                        }
                    });
                }
            });

            // Set data with guaranteed unique IDs
            faqRep.data = faqs.map((f, i) => ({ ...f, _id: f._id || `faq-${i}-${Date.now()}` }));

            faqRep.expand();
            // Expand FAQ section container (try known IDs from Editor)
            try { $w('#section2').expand(); } catch (e) { }
            try { $w('#sectionFAQ').expand(); } catch (e) { }
            try { $w('#faqSection').expand(); } catch (e) { }
        } else {
            if (faqRep) faqRep.collapse();
            try { $w('#sectionFAQ').collapse(); } catch (e) { }
        }
    } catch (e) {
        console.warn("FAQ Repeater Error:", e);
    }
}

/**
 * ─── INTERNAL LINKING STRATEGY ─────────────────────────────────────────
 * Creates cross-links to core site pages from every county page.
 * This hub-and-spoke architecture helps Google discover all 67 county
 * pages through the /florida-bail-bonds/ directory hub.
 *
 * Link targets (resilient — silently skip if element IDs don't exist):
 *   - Florida Directory hub (/florida-bail-bonds/)
 *   - How Bail Works (/how-bail-works)
 *   - About Us (/about)
 *   - Contact (/contact)
 *   - Testimonials (/testimonials)
 *   - Blog (/blog)
 * ───────────────────────────────────────────────────────────────────────
 */
function populateInternalLinks(county, currentSlug) {
    const countyName = county.county_name || 'Florida';

    // Cross-link to Florida Directory hub page (critical for crawlability)
    setLinkElement(['#directoryLinkBtn', '#floridaDirectoryBtn', '#btnAllCounties'], '/florida-bail-bonds');
    setTextElement(['#directoryLink', '#floridaDirectoryLink'], 'View All 67 Florida Counties');

    // Cross-link to How Bail Works
    setLinkElement(['#howBailWorksLink', '#btnHowBailWorks'], '/how-bail-works');

    // Cross-link to About page
    setLinkElement(['#aboutUsLink', '#btnAboutUs'], '/about');

    // Cross-link to Contact page
    setLinkElement(['#contactLink', '#btnContact'], '/contact');

    // Cross-link to Testimonials
    setLinkElement(['#testimonialsLink', '#btnTestimonials'], '/testimonials');

    // Cross-link to Blog
    setLinkElement(['#blogLink', '#btnBlog'], '/blog');

    console.log(`[Internal Links] Cross-links populated for ${countyName} County`);
}

/**
 * Resilient link setter — tries multiple element IDs, silently skips if none exist.
 * This is safe because not all county page variants have all link elements.
 */
function setLinkElement(ids, href) {
    for (const id of ids) {
        try {
            const el = $w(id);
            if (el && el.id) {
                el.link = href;
            }
        } catch (e) { /* element doesn't exist in this page variant — skip */ }
    }
}

/**
 * Resilient text setter — tries multiple element IDs, silently skips if none exist.
 */
function setTextElement(ids, text) {
    for (const id of ids) {
        try {
            const el = $w(id);
            if (el && el.id) {
                el.text = text;
            }
        } catch (e) { /* element doesn't exist — skip */ }
    }
}

async function loadNearbyCounties(region, currentSlug) {
    const nearbyRep = Select('#nearbyCountiesRepeater');
    if (!nearbyRep || nearbyRep.length === 0) return;

    try {
        // Dynamic import for code-splitting performance
        const { getNearestCounties, getCountiesByRegion } = await import('backend/counties');

        // STRATEGY: Use geo-proximity for cross-region internal linking
        // This creates a denser link mesh across all 67 county pages
        let neighbors = [];

        // 1. Try geo-proximity first (uses Haversine distance from counties.jsw)
        //    Get coordinates for current county from the masterPage coords table
        const countyCoords = getCountyCoordsInline(currentSlug);
        if (countyCoords) {
            try {
                const nearest = await getNearestCounties(countyCoords.lat, countyCoords.lon, 12);
                if (Array.isArray(nearest) && nearest.length > 0) {
                    neighbors = nearest.filter(n => n.slug !== currentSlug).slice(0, 8);
                }
            } catch (geoErr) {
                console.warn('[NearbyCounties] Geo-proximity failed, falling back to region:', geoErr.message);
            }
        }

        // 2. Fallback: same-region counties
        if (neighbors.length < 3) {
            const regionCounties = await getCountiesByRegion(region || 'Southwest');
            if (Array.isArray(regionCounties)) {
                const existingSlugs = new Set(neighbors.map(n => n.slug));
                for (const rc of regionCounties) {
                    if (rc.slug !== currentSlug && !existingSlugs.has(rc.slug) && neighbors.length < 8) {
                        neighbors.push(rc);
                    }
                }
            }
        }

        if (neighbors.length > 0) {
            // onItemReady MUST be defined before setting .data
            nearbyRep.onItemReady(($item, itemData) => {
                const displayName = (itemData.county_name || itemData.name || '').replace(/ County$/i, '') + ' County';
                try { $item('#neighborName').text = displayName; } catch (e) { }
                try {
                    $item('#neighborContainer').onClick(() => wixLocation.to(`/florida-bail-bonds/${itemData.slug}`));
                } catch (e) { }
            });

            nearbyRep.data = neighbors.map((n, i) => ({
                ...n,
                _id: n._id || `neighbor-${i}-${Date.now()}`
            }));
            nearbyRep.expand();
        }
    } catch (e) {
        console.warn('Error loading nearby counties', e);
    }
}

/**
 * Inline county coordinates lookup (avoids backend round-trip)
 * Mirrors the COUNTY_COORDINATES table from counties.jsw
 */
function getCountyCoordsInline(slug) {
    const coords = {
        "alachua": { lat: 29.67, lon: -82.35 }, "baker": { lat: 30.33, lon: -82.29 },
        "bay": { lat: 30.26, lon: -85.63 }, "bradford": { lat: 29.95, lon: -82.16 },
        "brevard": { lat: 28.30, lon: -80.70 }, "broward": { lat: 26.15, lon: -80.45 },
        "calhoun": { lat: 30.41, lon: -85.20 }, "charlotte": { lat: 26.90, lon: -81.92 },
        "citrus": { lat: 28.85, lon: -82.47 }, "clay": { lat: 29.98, lon: -81.86 },
        "collier": { lat: 26.10, lon: -81.39 }, "columbia": { lat: 30.22, lon: -82.63 },
        "desoto": { lat: 27.20, lon: -81.81 }, "dixie": { lat: 29.60, lon: -83.15 },
        "duval": { lat: 30.33, lon: -81.67 }, "escambia": { lat: 30.65, lon: -87.35 },
        "flagler": { lat: 29.47, lon: -81.30 }, "franklin": { lat: 29.80, lon: -84.80 },
        "gadsden": { lat: 30.56, lon: -84.63 }, "gilchrist": { lat: 29.72, lon: -82.78 },
        "glades": { lat: 26.95, lon: -81.18 }, "gulf": { lat: 29.93, lon: -85.22 },
        "hamilton": { lat: 30.51, lon: -82.95 }, "hardee": { lat: 27.49, lon: -81.79 },
        "hendry": { lat: 26.54, lon: -81.14 }, "hernando": { lat: 28.56, lon: -82.46 },
        "highlands": { lat: 27.35, lon: -81.35 }, "hillsborough": { lat: 27.91, lon: -82.35 },
        "holmes": { lat: 30.86, lon: -85.81 }, "indian-river": { lat: 27.67, lon: -80.49 },
        "jackson": { lat: 30.79, lon: -85.22 }, "jefferson": { lat: 30.41, lon: -83.90 },
        "lafayette": { lat: 30.07, lon: -83.18 }, "lake": { lat: 28.75, lon: -81.72 },
        "lee": { lat: 26.58, lon: -81.85 }, "leon": { lat: 30.46, lon: -84.27 },
        "levy": { lat: 29.27, lon: -82.61 }, "liberty": { lat: 30.25, lon: -84.86 },
        "madison": { lat: 30.45, lon: -83.47 }, "manatee": { lat: 27.49, lon: -82.35 },
        "marion": { lat: 29.19, lon: -82.13 }, "martin": { lat: 27.08, lon: -80.42 },
        "miami-dade": { lat: 25.61, lon: -80.56 }, "monroe": { lat: 25.10, lon: -81.10 },
        "nassau": { lat: 30.61, lon: -81.76 }, "okaloosa": { lat: 30.66, lon: -86.58 },
        "okeechobee": { lat: 27.25, lon: -80.89 }, "orange": { lat: 28.51, lon: -81.32 },
        "osceola": { lat: 28.06, lon: -81.15 }, "palm-beach": { lat: 26.63, lon: -80.44 },
        "pasco": { lat: 28.30, lon: -82.46 }, "pinellas": { lat: 27.90, lon: -82.74 },
        "polk": { lat: 27.96, lon: -81.87 }, "putnam": { lat: 29.62, lon: -81.73 },
        "st-johns": { lat: 29.93, lon: -81.42 }, "st-lucie": { lat: 27.38, lon: -80.43 },
        "santa-rosa": { lat: 30.71, lon: -87.03 }, "sarasota": { lat: 27.18, lon: -82.34 },
        "seminole": { lat: 28.71, lon: -81.23 }, "sumter": { lat: 28.70, lon: -82.08 },
        "suwannee": { lat: 30.20, lon: -82.96 }, "taylor": { lat: 30.03, lon: -83.62 },
        "union": { lat: 30.05, lon: -82.37 }, "volusia": { lat: 29.07, lon: -81.15 },
        "wakulla": { lat: 30.15, lon: -84.38 }, "walton": { lat: 30.63, lon: -86.17 },
        "washington": { lat: 30.61, lon: -85.67 }
    };
    return coords[slug] || null;
}

async function debugCMS() {
    console.log(" STARTING CMS DIAGNOSTIC CHECK (County Page)...");
    const collectionsToCheck = ['Import22', 'Faqs', 'FloridaCounties'];

    for (const colId of collectionsToCheck) {
        try {
            const count = await wixData.query(colId).limit(1).count();
            console.log(` Collection '${colId}': Found ${count} items.`);
        } catch (e) {
            console.warn(`[X] Collection '${colId}': Query failed. Error: ${e.message}`);
        }
    }
}
