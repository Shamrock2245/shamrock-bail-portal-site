/// <reference path="../types/wix-overrides.d.ts" />
// Force Sync: Dynamic Page Logic
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';
import wixData from 'wix-data';
import { generateCountyPage } from 'backend/county-generator';
import { buildPaperworkLaunchpadUrl } from 'public/portal-config';
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

    let generatedCounty = null;
    Select('#dynamicDataset').onReady(() => {
        Select('#dynamicDataset').setFilter(wixData.filter().eq('countySlug', countySlug))
            .then(() => {
                if (generatedCounty) {
                    setRichText(
                        ['#aboutBody', '#aboutText', '#aboutDescription', '#aboutContent', '#textAboutBody'],
                        generatedCounty.content.about_county,
                        generatedCounty.content.about_html
                    );
                }
            })
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
        generatedCounty = county;

        // 3. GENERATE SEO (Meta + Schema) - Critical for SEO
        setupSEO(county);

        // 4. POPULATE UI + inject final schema (including FAQs)
        await populateMainUI(county, countySlug);

        // 5. DEFER NON-CRITICAL (Nearby Counties)
        const isMobile = wixWindow.formFactor === 'Mobile';
        setTimeout(() => {
            loadNearbyCounties(county.region, countySlug, (county.links && county.links.neighbor_counties) || []);
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
    const cn = county.parent_county_name || county.county_name;
    const displayName = county.display_name || county.county_name_full || `${cn} County`;
    const cnLower = String(cn).toLowerCase();
    const isPlaceLanding = county.landing_type === 'city' || county.landing_type === 'jail';
    const canonUrl = `https://www.shamrockbailbonds.biz${county.seo.canonical_url}`;

    // ─── EXPANDED KEYWORDS (long-tail for AI search + voice) ───
    const expandedKeywords = [
        ...(county.seo.keywords || []),
        `bail bonds near me ${cnLower} county`,
        `bail bondsman near me ${cnLower} county`,
        `how to bail someone out of jail in ${cnLower} county florida`,
        `${cnLower} county jail inmate search`,
        `24 hour bail bondsman ${cnLower} county fl`,
        `${cnLower} county arrest records`,
        `cheap bail bonds ${cnLower} county`,
        `bail bond payment plan ${cnLower} county`,
        `${cnLower} county florida bail schedule`,
        `emergency bail bonds ${cnLower} county`,
        `bail bonds in ${cnLower} county florida`,
        `fast jail release ${cnLower} county`,
        `#${cnLower.replace(/\s+/g, '')}countybailbonds`,
        `#bailnearme`,
        `#floridabailbonds`,
        `#bailbondsman`
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
    // Exactly one LocalBusiness + one BreadcrumbList here; one FAQPage is added in
    // populateMainUI() from the FAQs actually rendered on the page. No HowTo, no
    // Service/Organization/Place duplicates, no rating or review markup.
    const schemas = [
        buildBreadcrumbSchema(county, { cn, displayName, isPlaceLanding, canonUrl }),
        buildLocalBusinessSchema(county, cn)
    ];

    // Store schemas; FAQPage will be appended in populateMainUI
    county._seoSchemas = schemas;
}

const SITE_URL = 'https://www.shamrockbailbonds.biz';

function buildBreadcrumbSchema(county, { cn, displayName, isPlaceLanding, canonUrl }) {
    const items = [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
        { "@type": "ListItem", "position": 2, "name": "Florida Bail Bonds", "item": `${SITE_URL}/florida-bail-bonds` }
    ];
    const hub = county.links && county.links.county_hub;
    if (isPlaceLanding && hub && hub.url) {
        items.push({ "@type": "ListItem", "position": 3, "name": hub.name, "item": `${SITE_URL}${hub.url}` });
        items.push({ "@type": "ListItem", "position": 4, "name": `${displayName} Bail Bonds`, "item": canonUrl });
    } else {
        items.push({ "@type": "ListItem", "position": 3, "name": `${cn} County`, "item": canonUrl });
    }
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items
    };
}

/**
 * Single LocalBusiness block. Address is always the Fort Myers office (never a
 * jail or courthouse); only areaServed changes per county.
 */
function buildLocalBusinessSchema(county, cn) {
    const facts = county.facts || {};
    const cities = (facts.major_cities && facts.major_cities.length ? facts.major_cities : (county.cities || []))
        .filter(Boolean)
        .slice(0, 2);
    return {
        "@context": "https://schema.org",
        "@type": ["LocalBusiness", "ProfessionalService"],
        "@id": `${SITE_URL}/#business`,
        "name": "Shamrock Bail Bonds",
        "url": `${SITE_URL}/`,
        "telephone": "+1-239-332-2245",
        "image": `${SITE_URL}/logo.png`,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "The Colquitt Building, 1528 Broadway",
            "addressLocality": "Fort Myers",
            "addressRegion": "FL",
            "postalCode": "33901",
            "addressCountry": "US"
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        },
        "areaServed": [
            { "@type": "AdministrativeArea", "name": `${cn} County, Florida` },
            ...cities.map((city) => ({ "@type": "City", "name": `${city}, FL` }))
        ]
    };
}

/** Collapse an element (and optional label elements) when there is nothing real to show. */
function setTextOrCollapse(selectors, value, labelSelectors = []) {
    const text = cleanDisplay(value);
    const all = [...selectors, ...labelSelectors];
    if (!text) {
        all.forEach((id) => { try { $w(id).collapse(); } catch (e) { /* element not on this page */ } });
        return false;
    }
    setText(selectors, text);
    labelSelectors.forEach((id) => { try { $w(id).expand(); } catch (e) { /* optional */ } });
    return true;
}

/** Empty, null and "TBD…" values are never rendered. */
function cleanDisplay(value) {
    if (value === null || value === undefined) return '';
    const text = String(value).trim();
    if (!text || /^tbd\b/i.test(text)) return '';
    return text;
}

function escapeHtmlText(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Render a list of internal links into the first matching Text element (via .html). */
function setLinkList(selectors, links, intro) {
    const list = (links || []).filter((l) => l && l.url && l.name);
    for (const selector of selectors) {
        try {
            const el = $w(selector);
            if (!el || el.type !== '$w.Text') continue;
            if (list.length === 0) { el.collapse(); continue; }
            const anchors = list.map((l) => `<a href="${escapeHtmlText(l.url)}">${escapeHtmlText(l.name)}</a>`).join(', ');
            el.html = `<p>${intro ? `${escapeHtmlText(intro)} ` : ''}${anchors}</p>`;
            el.expand();
        } catch (e) { /* element not on this page */ }
    }
}

/**
 * Verified facts block. Only sets elements that already exist on the page; any
 * row without a verified value is collapsed.
 */
function populateFactsBlock(county) {
    const facts = county.facts || {};
    const courthouse = [cleanDisplay(facts.courthouse_name), cleanDisplay(facts.courthouse_address)].filter(Boolean).join(', ');
    const cities = (facts.major_cities || []).filter(Boolean).join(', ');
    const rows = [
        { ids: ['#factCountySeat', '#factsCountySeat'], value: facts.county_seat, label: 'County seat' },
        { ids: ['#factCircuit', '#factsCircuit'], value: facts.circuit, label: 'Court circuit' },
        { ids: ['#factJailName', '#factsJailName'], value: facts.jail_name, label: 'Jail' },
        { ids: ['#factJailAddress', '#factsJailAddress'], value: facts.jail_address, label: 'Jail address' },
        { ids: ['#factCourthouse', '#factsCourthouse'], value: courthouse, label: 'Main courthouse' },
        { ids: ['#factFirstAppearance', '#factsFirstAppearance'], value: facts.first_appearance_note, label: 'First appearance' },
        { ids: ['#factMajorCities', '#factsMajorCities'], value: cities, label: 'Major cities' }
    ];
    let shown = 0;
    rows.forEach((row) => {
        const text = cleanDisplay(row.value);
        if (setTextOrCollapse(row.ids, text ? `${row.label}: ${text}` : '')) shown++;
    });
    if (facts.inmate_search_url) {
        setLink(['#factInmateSearchBtn', '#findSomeoneInJailBtn', '#btnFindInJail'], facts.inmate_search_url, 'Find someone in jail');
        shown++;
    } else {
        setLink(['#factInmateSearchBtn', '#findSomeoneInJailBtn', '#btnFindInJail'], '', '');
    }
    setTextOrCollapse(['#factsLastVerified', '#textFactsLastVerified'],
        facts.last_verified ? `Last verified: ${facts.last_verified}` : '');
    ['#factsBox', '#factsSection', '#boxFacts'].forEach((id) => {
        try { if (shown > 0) $w(id).expand(); else $w(id).collapse(); } catch (e) { /* optional container */ }
    });
}

/** County hub, city pages and jail page links from CMS references. */
function populateReferenceLinks(county) {
    const links = county.links || {};
    const hub = links.county_hub;
    if (hub && hub.url) {
        setLink(['#countyHubBtn', '#btnCountyGuide', '#countyGuideLink'], hub.url, `See the full ${hub.name} guide`);
        try { $w('#countyHubBtn').target = '_self'; } catch (e) { /* optional */ }
    } else {
        setLink(['#countyHubBtn', '#btnCountyGuide', '#countyGuideLink'], '', '');
    }
    setLinkList(['#cityPagesText', '#textCityPages', '#communitiesLinks'], links.city_pages,
        `Bail help in ${county.parent_county_name || county.county_name} County communities:`);
    if (links.jail_page && links.jail_page.url) {
        setLink(['#jailPageBtn', '#btnJailPage', '#jailPageLink'], links.jail_page.url, `${links.jail_page.name} bail bonds`);
        try { $w('#jailPageBtn').target = '_self'; } catch (e) { /* optional */ }
    } else {
        setLink(['#jailPageBtn', '#btnJailPage', '#jailPageLink'], '', '');
    }
}

// --- HELPER UI FUNCTIONS ---
function setRichText(selectorOrArray, plain, html) {
    const selectors = Array.isArray(selectorOrArray) ? selectorOrArray : [selectorOrArray];
    for (const selector of selectors) {
        try {
            const el = $w(selector);
            if (!el) continue;
            if (html && typeof el.html === 'string') {
                el.html = html;
                el.expand();
                return true;
            }
            if (el.type === '$w.Text') {
                el.text = plain || '';
                el.expand();
                return true;
            }
        } catch (e) { /* try next */ }
    }
    return false;
}

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
    const heroH1 = (county.content && county.content.hero_headline)
        || `${county.county_name_full || county.county_name} Bail Bonds — 24/7 Fast Release`;
    setText(['#countyName', '#countyNameHeadline', '#dynamicHeader'], heroH1);

    // Subtitle / About Text in Hero
    setText(['#heroSubtitle', '#aboutCountyText', '#heroDescription'], county.content.hero_subheadline);

    // About Section Headers — never "Cape Coral County"
    const aboutTitle = county.landing_type === 'city' || county.landing_type === 'jail'
        ? `About Bail Bonds in ${county.display_name || county.county_name}`
        : `About Bail Bonds in ${county.parent_county_name || county.county_name} County, Florida`;
    setText(['#aboutHeader', '#aboutTitle', '#textAboutCounty', '#aboutSectionTitle', '#textAboutTitle'], aboutTitle);
    setRichText(
        ['#aboutBody', '#aboutText', '#aboutDescription', '#aboutContent', '#textAboutBody'],
        county.content.about_county,
        county.content.about_html
    );

    // Why Choose Us
    setText(['#whyChooseHeader', '#whyChooseTitle'], `Why Choose Us in ${county.county_name} County`);
    setText(['#whyChooseBody', '#whyChooseText'], county.content.why_choose_us);

    // Service Areas (new — includes city names)
    setText(['#serviceAreasText', '#textServiceAreas', '#serviceAreas'], county.content.service_areas);

    // County Seat & Judicial Circuit (verified CMS values first, JSON enrichment as fallback)
    const factsData = county.facts || {};
    const seat = cleanDisplay(factsData.county_seat) || cleanDisplay(county.county_seat);
    setTextOrCollapse(['#countySeatText', '#textCountySeat'], seat ? `County Seat: ${seat}` : '');
    const circuitText = cleanDisplay(county.judicial_circuit_label);
    setTextOrCollapse(['#judicialCircuitText', '#textCircuit'], circuitText ? `${circuitText} of Florida` : '');

    // Verified facts block + CMS reference links (only elements that exist on the page)
    populateFactsBlock(county);
    populateReferenceLinks(county);
    if (county.resources && county.resources.court_records_url) {
        setLink(['#courtRecordsBtn', '#btnCourtRecords'],
            county.resources.court_records_url,
            `${county.county_name} County Court Records`);
    }

    // Contact Info (Jail/Clerk) — rows with no real value are collapsed, never shown as placeholders
    // Jail Name & Phone
    setTextOrCollapse(['#jailName', '#jailTitle', '#textJailName'], county.jail.name, ['#jailNameLabel']);
    setTextOrCollapse(['#sheriffPhone', '#jailPhone', '#textJailPhone'], county.jail.booking_phone, ['#jailPhoneLabel']);
    setTextOrCollapse(['#jailAddress', '#textJailAddress', '#jailLocation'], county.jail.address, ['#jailAddressLabel']);

    // Clerk Name & Phone: CMS clerkName only (no "Clerk of Court" placeholder)
    setTextOrCollapse(['#clerkName', '#clerkTitle', '#textClerkName'], county.clerk.display_name, ['#clerkNameLabel']);
    setTextOrCollapse(['#clerkPhone', '#clerkContact', '#textClerkPhone'], county.clerk.phone, ['#clerkPhoneLabel']);

    // Sheriff Name & Phone: CMS sheriffName only (no "Sheriff's Office" placeholder)
    setTextOrCollapse(['#sheriffName', '#sheriffTitle', '#textSheriffName'], county.sheriff.display_name, ['#sheriffNameLabel']);
    // Reuse booking phone or specific sheriff phone if available
    setTextOrCollapse(['#sheriffContactPhone', '#textSheriffPhone'], county.jail.booking_phone, ['#sheriffPhoneLabel']);

    // Links / Buttons (Sheriff/Clerk)
    setLink(['#callSheriffBtn', '#btnCallJail'], county.jail.booking_url, "Jail / Sheriff Website");
    setLink(['#sheriffWebsite', '#btnJailWeb'], county.jail.booking_url, "Jail / Sheriff Website");

    setLink(['#callClerkBtn', '#btnCallClerk'], county.clerk.website, "Clerk of Court");
    // ─── 3-LAYER WIRE: Locate + Get Someone Out + First Appearance (County Prefilled) ───
    const activeCountySlug = county.slug || county.countySlug || currentSlug;
    const isSwflCore = ['lee', 'collier', 'charlotte', 'hendry', 'glades'].indexOf(activeCountySlug) !== -1;

    // 1. Hero Primary Call Button — voice line, not the iMessage text line
    const primaryPhoneLink = 'tel:+12393322245';
    setLink(['#heroCallButton', '#callShamrockBtn', '#callCountiesBtn', '#btnEmergencyCall'], primaryPhoneLink, county.content.hero_cta_primary || "Call (239) 332-2245");

    // 2. Get Someone Out / Start Online Release (Prefilled County)
    const getOutUrl = buildPaperworkLaunchpadUrl({
        county: activeCountySlug,
        source: 'wix-county'
    });
    setLink(
        ['#heroStartButton', '#startBailBtn', '#getSomeoneOutBtn', '#btnGetOut', '#startOnlineBtn', '#btnGetSomeoneOut'],
        getOutUrl,
        "Get Someone Out"
    );

    // 3. Locate / Inmate Lookup: official county inmate search when verified, else prefilled /locate
    const officialSearch = county.resources && county.resources.inmate_search_url;
    const locateUrl = officialSearch || `/locate?county=${encodeURIComponent(activeCountySlug)}`;
    setLink(
        ['#inmateSearchBtn', '#btnInmateSearch', '#searchInmatesBtn', '#locateInmateBtn', '#btnLocate'],
        locateUrl,
        officialSearch ? 'Find someone in jail' : `Locate ${county.county_name} Inmate`
    );

    // 4. First Appearance Court Calendar (County Prefilled)
    setLink(
        ['#firstAppearanceBtn', '#faScheduleBtn', '#btnFirstAppearance', '#viewCourtScheduleBtn'],
        `/first-appearance/${encodeURIComponent(activeCountySlug)}`,
        `View ${county.county_name} Court Times`
    );

    // 5. Layer A — SWFL Core Flagship Badge
    if (isSwflCore) {
        setText(['#flagshipBadge', '#swflCoreCallout', '#localDispatchNotice'],
            `⭐ SWFL Flagship Hub: 24/7 Rapid Mobile Dispatch from 1528 Broadway, Fort Myers (<20 min ETA to ${county.jail.name || 'Jail Desk'})`);
    }

    // POPULATE FAQs (Repeater) - Now pulls from CMS Faqs collection
    // Safe element getter — prevents crashes from accessing non-existent Wix elements
    const safeGet = (scopedSelector, id) => {
        try {
            const el = scopedSelector(id);
            if (!el) return null;
            if (el.valid === false) return null;
            return el;
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

        // 3. Fallback: Generic (non-county-specific) FAQs from Import22.
        //    Only untagged items, so Lee-specific answers are never rewritten for other counties.
        if (cmsItems.length === 0) {
            try {
                const result = await wixData.query('Import22')
                    .eq('isActive', true)
                    .isEmpty('relatedCounty')
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
            const faqKey = (q) => String(q || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
            const existingQuestions = new Set(faqs.map(f => faqKey(f.question)));
            for (const ef of embeddedFaqs) {
                const key = faqKey(ef.question);
                if (key && !existingQuestions.has(key)) {
                    existingQuestions.add(key);
                    faqs.push({ _id: `embed-${faqs.length}-${Date.now()}`, question: ef.question, answer: ef.answer });
                }
            }
        }

        console.log(`[FAQ] Loaded ${faqs.length} FAQs for ${countyFull} (${cmsItems.length} CMS + merged embedded)`);
    } catch (err) {
        console.error('[X] Error loading FAQs:', err);
        faqs = (county.content && county.content.faq) || [];
    }

    // Inject final structured data in a single call: LocalBusiness + BreadcrumbList
    // (from setupSEO) + one FAQPage that mirrors the FAQs rendered in the repeater.
    try {
        const baseSchemas = county._seoSchemas || [];
        const visibleFaqs = faqRep ? faqs.filter(f => f && f.question && f.answer) : [];
        const finalSchemas = [...baseSchemas];
        if (visibleFaqs.length > 0) {
            finalSchemas.push({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": visibleFaqs.map(f => ({
                    "@type": "Question",
                    "name": f.question,
                    "acceptedAnswer": { "@type": "Answer", "text": f.answer }
                }))
            });
        }
        wixSeo.setStructuredData(finalSchemas).catch(e => { console.warn('setStructuredData failed:', e); });
    } catch (seoErr) {
        console.warn('Structured data injection failed:', seoErr);
    }

    // --- INTERNAL LINKING STRATEGY ---
    // Populate cross-links to core site pages + Florida Directory hub
    populateInternalLinks(county, currentSlug);

    try {
        if (faqs.length > 0 && faqRep) {
            faqRep.data = []; // Clear first to force redraw

            faqRep.onItemReady(($item, itemData) => {
                const question = itemData.question || itemData.title || 'Question';
                const answer = itemData.answer || itemData.a || '';

                const qIds = ['#textQuestion', '#faqQuestion', '#question', '#title', '#text1'];
                const aIds = ['#textAnswer', '#faqAnswer', '#answer', '#text2', '#collapsibleText1', '#paragraph1'];
                let qText = null;
                let aText = null;
                qIds.forEach((id) => { if (!qText) qText = safeGet($item, id); });
                aIds.forEach((id) => { if (!aText) aText = safeGet($item, id); });

                if (!aText) {
                    try {
                        const ct = $item('CollapsibleText');
                        if (ct && ct.valid !== false) aText = ct;
                    } catch (e) { /* no collapsible in item */ }
                }

                if (qText && typeof qText.text !== 'undefined') qText.text = question;

                if (aText && typeof aText.text !== 'undefined') {
                    try {
                        if (typeof aText.expandText === 'function') aText.expandText();
                    } catch (e) { /* not collapsible */ }
                    aText.text = answer;
                    try { if (aText.expand) aText.expand(); } catch (e) { /* already shown */ }
                }

                const answerGroup = safeGet($item, '#groupAnswer') || safeGet($item, '#boxAnswer') || safeGet($item, '#answerBox');
                if (answerGroup && typeof answerGroup.expand === 'function') {
                    answerGroup.expand();
                }

                const toggle = () => {
                    if (!answerGroup || typeof answerGroup.expand !== 'function') return;
                    if (answerGroup.collapsed) answerGroup.expand();
                    else answerGroup.collapse();
                };
                ['#containerQuestion', '#textQuestion', '#iconArrow', '#vectorImage1', '#btnToggle'].forEach((id) => {
                    const el = safeGet($item, id);
                    if (el && typeof el.onClick === 'function') el.onClick(toggle);
                });
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
    const countyName = county.parent_county_name || county.county_name || 'Florida';
    const slug = String(county.parent_county_name || currentSlug || county.county_slug || '')
        .toLowerCase()
        .replace(/-county$/i, '')
        .replace(/\s+/g, '-');

    // Cross-link to Florida Directory hub page (critical for crawlability)
    setLinkElement(['#directoryLinkBtn', '#floridaDirectoryBtn', '#btnAllCounties'], '/florida-bail-bonds');
    setTextElement(['#directoryLink', '#floridaDirectoryLink'], 'View All 67 Florida Counties');

    // First Appearance — county page + statewide hub (pre-focused on this county)
    setLinkElement(
        ['#firstAppearanceLink', '#btnFirstAppearance', '#faCountyLink', '#firstAppearanceBtn'],
        slug ? `/first-appearance/${slug}` : '/first-appearance'
    );
    setLinkElement(
        ['#firstAppearanceHubLink', '#btnFaHub'],
        slug ? `/first-appearance?county=${encodeURIComponent(slug)}` : '/first-appearance'
    );
    setTextElement(
        ['#firstAppearanceLinkText', '#faLinkLabel'],
        `First Appearance in ${countyName} County`
    );

    // If FA schedule data was attached by the generator, surface it
    if (county.first_appearance) {
        const fa = county.first_appearance;
        setTextElement(['#faScheduleText', '#firstAppearanceSchedule'], fa.schedule || fa.time || '');
        setTextElement(['#faLocationText', '#firstAppearanceLocation'], fa.location || '');
        setTextElement(['#faNotesText', '#firstAppearanceNotes'], fa.notes || '');
        if (fa.liveUrl) {
            setLinkElement(['#faLiveBtn', '#firstAppearanceLiveBtn', '#watchFaBtn'], fa.liveUrl);
        }
    }

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

async function loadNearbyCounties(region, currentSlug, cmsNeighbors = []) {
    const nearbyRep = Select('#nearbyCountiesRepeater');
    if (!nearbyRep || nearbyRep.length === 0) return;

    // Preferred: adjacent counties from the CMS neighborCounties reference (Census adjacency)
    if (Array.isArray(cmsNeighbors) && cmsNeighbors.length > 0) {
        try {
            nearbyRep.onItemReady(($item, itemData) => {
                try { $item('#neighborName').text = itemData.name; } catch (e) { }
                try {
                    $item('#neighborContainer').onClick(() => wixLocation.to(itemData.url));
                } catch (e) { }
            });
            nearbyRep.data = cmsNeighbors.map((n, i) => ({ ...n, _id: `neighbor-${n.slug || i}` }));
            nearbyRep.expand();
            return;
        } catch (e) {
            console.warn('CMS neighbor counties failed, falling back to geo proximity', e);
        }
    }

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
