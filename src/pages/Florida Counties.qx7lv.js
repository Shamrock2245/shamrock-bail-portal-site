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
    // Meta Tags
    wixSeo.setTitle(county.seo.meta_title);
    wixSeo.setMetaTags([
        { "name": "description", "content": county.seo.meta_description },
        { "name": "keywords", "content": county.seo.keywords.join(", ") },
        { "property": "og:title", "content": county.seo.meta_title },
        { "property": "og:description", "content": county.seo.meta_description },
        { "property": "og:url", "content": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}` },
        { "property": "og:type", "content": "website" },
        { "property": "og:image", "content": "https://www.shamrockbailbonds.biz/logo.png" },
        { "property": "og:locale", "content": "en_US" },
        { "name": "twitter:card", "content": "summary_large_image" },
        { "name": "twitter:title", "content": county.seo.meta_title },
        { "name": "twitter:description", "content": county.seo.meta_description },
        { "name": "twitter:image", "content": "https://www.shamrockbailbonds.biz/logo.png" }
    ]);

    // Structured Data (JSON-LD)
    const faqs = county.content.faq || [];
    const schemas = [];

    // A. Breadcrumbs
    schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
            { "@type": "ListItem", "position": 2, "name": "Florida Bail Bonds", "item": "https://www.shamrockbailbonds.biz/florida-bail-bonds" },
            { "@type": "ListItem", "position": 3, "name": county.county_name_full, "item": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}` }
        ]
    });

    // B. LocalBusiness (Enhanced with full address and contact details)
    schemas.push({
        "@context": "https://schema.org",
        "@type": ["LocalBusiness", "ProfessionalService"],
        "additionalType": "https://schema.org/ProfessionalService",
        "@id": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}#localbusiness`,
        "name": `Shamrock Bail Bonds - ${county.county_name} County`,
        "description": county.seo.meta_description,
        "url": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}`,
        "telephone": "+1-239-332-2245",
        "image": "https://www.shamrockbailbonds.biz/logo.png",
        "sameAs": [
            "https://www.facebook.com/ShamrockBail",
            "https://www.instagram.com/shamrock_bail_bonds"
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
                "areaServed": "FL",
                "availableLanguage": ["English", "Spanish"]
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
        "areaServed": [
            {
                "@type": "AdministrativeArea",
                "name": `${county.county_name} County, Florida`
            },
            {
                "@type": "State",
                "name": "Florida"
            }
        ],
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        },
        "priceRange": "$$",
        "paymentAccepted": "Cash, Credit Card, Debit Card"
    });

    // C. FAQPage -- Deferred to populateMainUI() where CMS FAQs are loaded
    //    with proper county name replacements. Schema is set there.

    // D. Service Schema (County-Specific Bail Bonds Service)
    schemas.push({
        "@context": "https://schema.org",
        "@type": "Service",
        "serviceType": "Bail Bonds",
        "name": `Bail Bonds in ${county.county_name} County, Florida`,
        "description": `24/7 professional bail bond services in ${county.county_name} County. Fast, confidential, and reliable bail bonds with bilingual support.`,
        "provider": {
            "@type": "Organization",
            "name": "Shamrock Bail Bonds",
            "telephone": "+1-239-332-2245",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            }
        },
        "areaServed": {
            "@type": "AdministrativeArea",
            "name": `${county.county_name} County, Florida`
        },
        "availableChannel": {
            "@type": "ServiceChannel",
            "servicePhone": {
                "@type": "ContactPoint",
                "telephone": "+1-239-332-2245",
                "availableLanguage": ["English", "Spanish"]
            },
            "serviceUrl": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}`
        },
        "hoursAvailable": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        },
        "offers": {
            "@type": "Offer",
            "availability": "https://schema.org/InStock",
            "availabilityStarts": "2012-01-01",
            "priceRange": "$$"
        }
    });

    // Store schemas on county object; FAQPage will be added after CMS FAQs load in populateMainUI
    county._seoSchemas = schemas;
    // Note: setStructuredData is called ONCE in populateMainUI after FAQs are loaded
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
    setText(['#whyChooseHeader', '#whyChooseTitle'], `Why Choose Us in ${county.county_name}`);
    setText(['#whyChooseBody', '#whyChooseText'], county.content.why_choose_us);

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

    // Inject final structured data (base schemas + FAQPage) in a single call
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

async function loadNearbyCounties(region, currentSlug) {
    const nearbyRep = Select('#nearbyCountiesRepeater');
    if (!nearbyRep || nearbyRep.length === 0) return; // Don't fetch if no repeater

    // Default region if missing
    if (!region) region = "Southwest";

    try {
        // Dynamic Import for performance (lazy load)
        const { getCountiesByRegion } = await import('backend/counties');
        const nearby = await getCountiesByRegion(region);

        if (Array.isArray(nearby) && nearby.length > 0) {
            // Filter out current county
            const neighbors = nearby.filter(n => n.slug !== currentSlug);

            // FIX: onItemReady MUST be defined before setting .data
            nearbyRep.onItemReady(($item, itemData) => {
                try { $item('#neighborName').text = itemData.county_name || itemData.name; } catch (e) { }
                try {
                    $item('#neighborContainer').onClick(() => wixLocation.to(`/florida-bail-bonds/${itemData.slug}`));
                } catch (e) { }
            });

            // Ensure unique IDs
            nearbyRep.data = neighbors.map((n, i) => ({
                ...n,
                _id: n._id || `neighbor-${i}-${Date.now()}`
            }));
            nearbyRep.expand();
        }
    } catch (e) {
        console.warn("Error loading nearby counties", e);
    }
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
