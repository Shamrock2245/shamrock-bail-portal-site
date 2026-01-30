/// <reference path="../types/wix-overrides.d.ts" />
// Force Sync: Dynamic Page Logic
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';
import wixData from 'wix-data';
import { generateCountyPage } from 'backend/county-generator';
// replaced public/countyUtils with optimized backend
import { getCountiesByRegion } from 'backend/counties';

// Type-safe element selector to bypass ID validation issues
// cast to any to allow any string
const Select = (selector) => /** @type {any} */($w)(selector);

$w.onReady(async function () {
    console.log("🚀 Dynamic County Page Loading... (Optimized v2)");

    // 1. EXTRACT SLUG
    const path = wixLocation.path;
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    console.log(`🔎 Frontend detected slug: "${countySlug}"`);

    if (!countySlug) {
        console.error("❌ No slug found in URL path:", path);
        return;
    }

    // --- DATASET OVERRIDE (Legacy Support) ---
    // Safely attempt to filter legacy dataset if present, but don't block execution
    Select('#dynamicDataset').onReady(() => {
        // console.log("Dataset Ready - Applying Filter...");
        Select('#dynamicDataset').setFilter(wixData.filter().eq('countySlug', countySlug))
            .catch(e => console.log("⚠️ Dataset filter failed:", e));
    });

    try {
        // Show loading state if element exists
        try { Select('#loadingIndicator').show(); } catch (e) { }

        // console.log("⏳ Calling backend generateCountyPage...");

        // 2. FETCH MAIN DATA (Critical Path)
        // We prioritize the main content. Nearby counties can load later.
        const pageResult = await generateCountyPage(countySlug.toLowerCase());

        // console.log("📥 Backend Response:", pageResult);

        const { success, data } = pageResult;

        if (!success || !data) {
            console.warn(`⚠️ County data not found for slug: ${countySlug}.`);
            return;
        }

        const county = data;
        // console.log(`✅ Loaded Data for: ${county.county_name_full}. Starting UI Update...`);

        // 3. GENERATE SEO (Meta + Schema) - Critical for SEO
        setupSEO(county);

        // 4. POPULATE UI - Critical for LCP
        populateMainUI(county);

        // 5. DEFER NON-CRITICAL (Nearby Counties)
        setTimeout(() => {
            loadNearbyCounties(county.region, countySlug);
        }, 800);

        // Hide loader / Show content
        try { Select('#loadingIndicator').hide(); } catch (e) { }
        try { Select('#countyContent').expand(); } catch (e) { }

    } catch (err) {
        console.error("❌ Critical Page Error:", err);
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
        { "property": "og:type", "content": "website" }
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
            { "@type": "ListItem", "position": 2, "name": "Bail Bonds", "item": "https://www.shamrockbailbonds.biz/bail-bonds" },
            { "@type": "ListItem", "position": 3, "name": county.county_name_full, "item": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}` }
        ]
    });

    // B. LocalBusiness (Enhanced with full address and contact details)
    schemas.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}#localbusiness`,
        "name": `Shamrock Bail Bonds - ${county.county_name} County`,
        "description": county.seo.meta_description,
        "url": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}`,
        "telephone": "+1-239-332-2245",
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

    // C. FAQPage
    if (faqs.length > 0) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
            }))
        });
    }

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

    wixSeo.setStructuredData(schemas).catch(e => { });
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
                // console.log(`✅ Set text for ${selector}`);
            }
        } catch (e) { }
    }
    if (!found) {
        // console.warn(`⚠️ Text element not found for value: "${value?.substring(0, 20)}..." in selectors: ${selectors.join(', ')}`);
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

function populateMainUI(county) {
    // Header & Hero (Support both old and new IDs from Screenshot)
    // Old: #countyName, #dynamicHeader, #heroSubtitle
    // New: #countyNameHeadline, #aboutCountyText (Maybe hero text?), #heroCallButton
    setText(['#countyName', '#countyNameHeadline', '#dynamicHeader'], county.county_name);

    // Subtitle / About Text in Hero
    setText(['#heroSubtitle', '#aboutCountyText', '#heroDescription'], county.content.hero_subheadline);

    // About Section Headers
    // Header often has IDs like: #aboutHeader, #aboutTitle, #textAboutCounty
    setText(['#aboutHeader', '#aboutTitle', '#textAboutCounty', '#aboutSectionTitle'], `About Bail Bonds in ${county.county_name} County`);
    setText(['#aboutBody', '#aboutText', '#aboutDescription'], county.content.about_county);

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
    setText(['#sheriffContactPhone', '#textSheriffPhone'], county.contact.primary_phone);

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

    // 2. Secondary/Start Button (Link to specific start page or process)
    setLink(['#heroStartButton', '#startBailBtn'], "/bail-bonds", "Start Bail Bond");

    // Jail Address (if element exists and data provided)
    try { $w('#jailAddress').collapse(); } catch (e) { }

    // POPULATE FAQs (Repeater)
    const faqRep = $w('#repeaterFAQ');
    const faqs = county.content.faq || [];
    try {
        if (faqs.length > 0) {
            faqRep.onItemReady(($item, itemData) => {
                // Set Text Content
                $item('#textQuestion').text = itemData.question;
                $item('#textAnswer').text = itemData.answer;

                // Handle Accordion Interaction (Clean Toggle)
                $item('#containerQuestion').onClick(() => {
                    const answerGroup = $item('#groupAnswer');
                    if (answerGroup.collapsed) {
                        answerGroup.expand();
                        // Optional: Rotate arrow if you have one
                        // $item('#iconArrow').style.transform = "rotate(180deg)"; 
                    } else {
                        answerGroup.collapse();
                        // $item('#iconArrow').style.transform = "rotate(0deg)";
                    }
                });
            });

            // Ensure unique IDs
            faqRep.data = faqs.map((f, i) => ({ ...f, _id: `faq-${i}-${Date.now()}` }));
            faqRep.expand();
            try { $w('#sectionFAQ').expand(); } catch (e) { }
        } else {
            faqRep.collapse();
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
        const nearby = await getCountiesByRegion(region);

        if (Array.isArray(nearby) && nearby.length > 0) {
            // Filter out current county
            const neighbors = nearby.filter(n => n.slug !== currentSlug);

            // FIX: onItemReady MUST be defined before setting .data
            nearbyRep.onItemReady(($item, itemData) => {
                try { $item('#neighborName').text = itemData.county_name || itemData.name; } catch (e) { }
                try {
                    $item('#neighborContainer').onClick(() => wixLocation.to(`/bail-bonds/${itemData.slug}`));
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
