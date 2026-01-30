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

    // B. LocalBusiness
    schemas.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `Shamrock Bail Bonds - ${county.county_name}`,
        "description": county.seo.meta_description,
        "url": `https://www.shamrockbailbonds.biz${county.seo.canonical_url}`,
        "telephone": county.contact.primary_phone,
        "image": "https://www.shamrockbailbonds.biz/logo.png",
        "areaServed": {
            "@type": "AdministrativeArea",
            "name": `${county.county_name} County, Florida`
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        }
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
    setText(['#aboutHeader', '#aboutTitle'], `About Bail Bonds in ${county.county_name} County`);
    setText(['#aboutBody', '#aboutText', '#aboutDescription'], county.content.about_county);

    // Why Choose Us
    setText(['#whyChooseHeader', '#whyChooseTitle'], `Why Choose Us in ${county.county_name}`);
    setText(['#whyChooseBody', '#whyChooseText'], county.content.why_choose_us);

    // Contact Info (Jail/Clerk)
    setText(['#sheriffPhone', '#jailPhone'], county.jail.booking_phone);
    setText(['#jailName', '#jailTitle'], county.jail.name);
    setText(['#clerkPhone', '#clerkContact'], county.clerk.phone);

    // Links / Buttons (Sheriff/Clerk)
    setLink(['#callSheriffBtn', '#btnCallJail'], county.jail.booking_phone ? `tel:${county.jail.booking_phone.replace(/[^0-9]/g, '')}` : null, "Call Jail");
    setLink(['#sheriffWebsite', '#btnJailWeb'], county.jail.booking_url, "Jail Website");

    setLink(['#callClerkBtn', '#btnCallClerk'], county.clerk.phone ? `tel:${county.clerk.phone.replace(/[^0-9]/g, '')}` : null, "Call Clerk");
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

                // Handle Accordion Interaction
                $item('#containerQuestion').onClick(() => {
                    const answerGroup = $item('#groupAnswer');
                    if (answerGroup.collapsed) {
                        answerGroup.expand();
                    } else {
                        answerGroup.collapse();
                    }
                });
            });

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
