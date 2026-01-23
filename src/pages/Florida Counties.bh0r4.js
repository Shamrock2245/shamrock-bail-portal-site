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

function populateMainUI(county) {
    // Header & Hero
    setText('#countyName', county.county_name);
    setText('#dynamicHeader', `Bail Bonds in ${county.county_name} County`);
    setText('#heroSubtitle', county.content.hero_subheadline);

    // Contact Info
    setText('#sheriffPhone', county.jail.booking_phone);
    setText('#jailName', county.jail.name);
    setText('#clerkPhone', county.clerk.phone);

    // Links / Buttons
    setLink('#callSheriffBtn', county.jail.booking_url, "Jail / Sheriff Website");
    setLink('#sheriffWebsite', county.jail.booking_url, "Jail / Sheriff Website");

    setLink('#callClerkBtn', county.clerk.website, "Clerk of Court");
    setLink('#clerkWebsite', county.clerk.website, "Clerk of Court");

    // Content Sections
    setText('#aboutHeader', `About Bail Bonds in ${county.county_name} County`);
    setText('#aboutBody', county.content.about_county);
    setText('#whyChooseHeader', `Why Choose Us in ${county.county_name}`);
    setText('#whyChooseBody', county.content.why_choose_us);

    // Sticky/Main Call Buttons
    let callBtn = $w('#callShamrockBtn');

    // Try binding primary button
    try {
        callBtn.label = county.content.hero_cta_primary || "Call Now";
        callBtn.onClick(() => wixLocation.to(`tel:${county.contact.primary_phone_display.replace(/[^0-9]/g, '')}`));
        callBtn.expand();
    } catch (e) {
        // Try fallback button
        try {
            const fallbackBtn = Select('#callCountiesBtn');
            fallbackBtn.label = county.content.hero_cta_primary || "Call Now";
            fallbackBtn.onClick(() => wixLocation.to(`tel:${county.contact.primary_phone_display.replace(/[^0-9]/g, '')}`));
            fallbackBtn.expand();
        } catch (e2) { }
    }

    // Jail Address (if element exists and data provided)
    try { $w('#jailAddress').collapse(); } catch (e) { }

    // POPULATE FAQs (Repeater)
    const faqRep = $w('#faqRepeater');
    const faqs = county.content.faq || [];
    try {
        if (faqs.length > 0) {
            faqRep.data = faqs.map((f, i) => ({ ...f, _id: `faq-${i}` }));
            faqRep.onItemReady(($item, itemData) => {
                $item('#faqQuestion').text = itemData.question;
                $item('#faqAnswer').text = itemData.answer;
            });
            faqRep.expand();
        } else {
            faqRep.collapse();
        }
    } catch (e) { }
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

            nearbyRep.data = neighbors;
            nearbyRep.onItemReady(($item, itemData) => {
                try { $item('#neighborName').text = itemData.county_name || itemData.name; } catch (e) { }
                try {
                    $item('#neighborContainer').onClick(() => wixLocation.to(`/bail-bonds/${itemData.slug}`));
                } catch (e) { }
            });
            nearbyRep.expand();
        }
    } catch (e) {
        console.warn("Error loading nearby counties", e);
    }
}

// --- HELPER UI FUNCTIONS ---
function setText(selector, value) {
    try {
        $w(selector).text = value || "";
    } catch (e) { }
}

function setLink(selector, url, label) {
    const el = $w(selector);
    if (url) {
        try {
            if (el.type === '$w.Button') {
                el.label = label || el.label;
                el.link = url;
                el.target = "_blank";
            } else {
                el.text = label || el.text;
            }
            el.expand();
        } catch (e) { }
    } else {
        try { el.collapse(); } catch (e) { }
    }
}