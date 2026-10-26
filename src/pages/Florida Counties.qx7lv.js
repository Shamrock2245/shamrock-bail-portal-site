/// <reference path="../types/wix-overrides.d.ts" />
// Force Sync: Dynamic Page Logic
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';
import wixData from 'wix-data';
import { generateCountyPage } from 'backend/county-generator';
import { buildPaperworkLaunchpadUrl } from 'public/portal-config';
import { resolvePrimaryHeroH1 } from 'public/cityHeroHeadline';
import { buildFloridaCountyDirectoryHtml, COUNTY_DIRECTORY_ELEMENT_IDS } from 'public/floridaCountyDirectory';
import wixSeoFrontend from 'wix-seo-frontend';
import wixWindowFrontend from 'wix-window-frontend';
import wixLocationFrontend from 'wix-location-frontend';
// replaced public/countyUtils with optimized backend
// import { getCountiesByRegion } from 'backend/counties'; // Moved to dynamic import

// Type-safe element selector to bypass ID validation issues
// cast to any to allow any string
const Select = (selector) => /** @type {any} */($w)(selector);

// Studio layout marker: the Studio county template uses #countyDataset (live layout uses #dynamicDataset).
// On the Studio layout the Studio layer (bottom of file) owns SEO, JSON-LD and #startOnlineBtn.
function isStudioCountyLayout() {
    try {
        const node = $w('#countyDataset');
        return !!(node && (typeof node.id === 'string' || typeof node.type === 'string'));
    } catch (e) {
        return false;
    }
}

$w.onReady(async function () {
    console.log(" Dynamic County Page Loading... (Optimized v2)");

    // 1. EXTRACT SLUG
    const path = wixLocation.path;
    const countySlug = path.length > 0 ? path[path.length - 1] : null;

    console.log(` Frontend detected slug: "${countySlug}"`);

    if (!countySlug) {
        // Bare /florida-bail-bonds hub: still expose all 67 county anchors.
        paintCountyDirectory();
        console.error("[X] No slug found in URL path:", path);
        return;
    }

    let generatedCounty = null;
    try { Select('#dynamicDataset').onReady(() => {
        Select('#dynamicDataset').setFilter(wixData.filter().eq('countySlug', countySlug))
            .then(() => {
                if (generatedCounty) {
                    // Dataset refresh can restore a CMS-bound H1. Re-apply the hero after it.
                    setText(
                        ['#countyName', '#countyNameHeadline', '#dynamicHeader'],
                        resolvePrimaryHeroH1(generatedCounty)
                    );
                    setRichText(
                        ['#aboutBody', '#aboutText', '#aboutDescription', '#aboutContent', '#textAboutBody'],
                        generatedCounty.content.about_county,
                        aboutHtmlWithDirectory(generatedCounty.content.about_html)
                    );
                }
            })
            .catch(e => console.log("[!] Dataset filter failed:", e));
    }); } catch (e) { /* no #dynamicDataset on this layout */ }

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
                Select('#heroSubtitle').text = "We serve all of Florida, but this specific page is unavailable. Call (239) 332-2245. Phones are answered 24/7.";
                Select('#heroSubtitle').expand();
                Select('#heroCallButton').expand();
                Select('#countyContent').collapse();
            } catch (e) { }
            return;
        }

        const county = data;
        generatedCounty = county;

        // 3. GENERATE SEO (Meta + Schema) - Critical for SEO
        if (!isStudioCountyLayout()) setupSEO(county); // Studio layout sets its own SEO below

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
            ];
    // Position 2 used to be /florida-bail-bonds, which returns 404 live (audit 2026-09-27).
    // Re-add it only after a real county directory page exists at that URL.
    const hub = county.links && county.links.county_hub;
    if (isPlaceLanding && hub && hub.url) {
        items.push({ "@type": "ListItem", "position": 2, "name": hub.name, "item": `${SITE_URL}${hub.url}` });
        items.push({ "@type": "ListItem", "position": 3, "name": `${displayName} Bail Bonds`, "item": canonUrl });
    } else {
        items.push({ "@type": "ListItem", "position": 2, "name": `${cn} County`, "item": canonUrl });
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


/** Demote/promote heading tags inside Rich Text .html without changing visible copy.
 * Thunderbolt leaves el.valid undefined, so a .valid gate always skips the element.
 * Gate only on a non-empty html string.
 */
function demoteHeadingTag(selectorOrArray, fromTag, toTag) {
    const selectors = Array.isArray(selectorOrArray) ? selectorOrArray : [selectorOrArray];
    const openFrom = new RegExp('<' + fromTag + '\\b', 'gi');
    const closeFrom = new RegExp('</' + fromTag + '>', 'gi');
    for (const selector of selectors) {
        try {
            const el = $w(selector);
            if (!el || typeof el.html !== 'string' || !el.html) continue;
            if (!openFrom.test(el.html)) continue;
            openFrom.lastIndex = 0;
            el.html = el.html.replace(openFrom, '<' + toTag).replace(closeFrom, '</' + toTag + '>');
            console.log('[SEO] Demoted H1→H2 on', selector);
        } catch (e) { /* try next */ }
    }
}

/** Remove a leading <h1>/<h2>…</h1/h2> from CMS about_html to avoid duplicate titles. */
function stripLeadingHeading(html) {
    if (!html || typeof html !== 'string') return html;
    return html.replace(/^\s*<h[12]\b[^>]*>[\s\S]*?<\/h[12]>\s*/i, '');
}

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
                    // tel:/sms:/on-site links open in the same tab; only external sites open a new tab
                    el.target = /^https?:\/\//i.test(url) && !/shamrockbailbonds\.biz/i.test(url) ? "_blank" : "_self";
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
    // City landings: "{City} Bail Bonds ({County} County)". County/jail headlines stay as generated.
    setText(['#countyName', '#countyNameHeadline', '#dynamicHeader'], resolvePrimaryHeroH1(county));

    // Subtitle / About Text in Hero
    setText(['#heroSubtitle', '#aboutCountyText', '#heroDescription'], county.content.hero_subheadline);

    // About Section Headers — never "Cape Coral County"
    const aboutTitle = county.landing_type === 'city' || county.landing_type === 'jail'
        ? `About Bail Bonds in ${county.display_name || county.county_name}`
        : `About Bail Bonds in ${county.parent_county_name || county.county_name} County, Florida`;
    setText(['#aboutHeader', '#aboutTitle', '#textAboutCounty', '#aboutSectionTitle', '#textAboutTitle'], aboutTitle);
    // Bing SEO: About section title is an Editor H1; demote to H2 (keep hero as sole H1).
    demoteHeadingTag(
        ['#aboutHeader', '#aboutTitle', '#textAboutCounty', '#aboutSectionTitle', '#textAboutTitle'],
        'h1',
        'h2'
    );
    // about_html already includes an <h2> of the same title — use body paragraphs only
    // to avoid a duplicate heading next to the dedicated title element.
    const aboutHtmlBody = stripLeadingHeading(county.content.about_html);
    setRichText(
        ['#aboutBody', '#aboutText', '#aboutDescription', '#aboutContent', '#textAboutBody'],
        county.content.about_county,
        aboutHtmlWithDirectory(aboutHtmlBody || county.content.about_html)
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
    setTextOrCollapse(['#sheriffContactPhone', '#textSheriffPhone'], county.sheriff.phone || county.jail.booking_phone, ['#sheriffPhoneLabel']);

    // Links / Buttons (Sheriff/Clerk)
    setLink(['#callSheriffBtn', '#btnCallJail'], county.jail.booking_url, "Jail / Sheriff Website");
    setLink(['#sheriffWebsite', '#btnJailWeb'], county.jail.booking_url, "Jail / Sheriff Website");

    setLink(['#callClerkBtn', '#btnCallClerk'], county.clerk.website, "Clerk of Court");

    // Live Editor buttons (audit 2026-09-27): these rendered with no link at all
    const jailSearchUrl = (county.resources && county.resources.inmate_search_url) || county.jail.booking_url || '';
    setLink(['#btnJailLink'], jailSearchUrl, 'Inmate Search');
    setLink(['#btnClerkLink'], county.clerk.records_url || county.clerk.website || '', 'Records Search');
    setLink(['#btnSheriffLink'], county.sheriff.website || '', "Sheriff's Website");
    // ─── 3-LAYER WIRE: Locate + Get Someone Out + First Appearance (County Prefilled) ───
    const activeCountySlug = county.slug || county.countySlug || currentSlug;
    const isSwflCore = ['lee', 'collier', 'charlotte', 'hendry', 'glades'].indexOf(activeCountySlug) !== -1;

    // 1. Hero Primary Call Button — voice line, not the iMessage text line
    const primaryPhoneLink = 'tel:+12393322245';
    setLink(['#heroCallButton', '#callShamrockBtn', '#callCountiesBtn', '#btnEmergencyCall', '#ctaCallOfficeBtn'], primaryPhoneLink, county.content.hero_cta_primary || "Call (239) 332-2245");
    // Owner's three primary CTAs: office call, automated line, text. Wired only if the Editor elements exist.
    setLink(['#ctaCallAutoBtn', '#heroAutoLineButton'], 'tel:+17272952245', 'Automated line: (727) 295-2245');
    setLink(['#ctaTextBtn', '#heroTextButton'], 'sms:+12399550178', 'Text (239) 955-0178');

    // 2. Get Someone Out / Start Online Release (Prefilled County)
    const getOutUrl = buildPaperworkLaunchpadUrl({
        county: activeCountySlug,
        source: 'wix-county'
    });
    setLink(
        ['#heroStartButton', '#startBailBtn', '#getSomeoneOutBtn', '#btnGetOut', '#startOnlineBtn', '#btnGetSomeoneOut']
            .filter((id) => !(id === '#startOnlineBtn' && isStudioCountyLayout())),
        getOutUrl,
        "Get Someone Out"
    );

    // 3. Locate / Inmate Lookup: official county inmate search when verified, else prefilled /locate
    const officialSearch = county.resources && county.resources.inmate_search_url;
    // /locate returns 404 live (audit 2026-09-27): hide the button when there's no official search URL
    const locateUrl = officialSearch || '';
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
            `⭐ SWFL Flagship Hub: 24/7 bail service from 1528 Broadway, Fort Myers, serving all of Southwest Florida.`);
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
        if (!isStudioCountyLayout()) wixSeo.setStructuredData(finalSchemas).catch(e => { console.warn('setStructuredData failed:', e); });
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
    // /florida-bail-bonds returns 404 live (audit 2026-09-27); no directory link until that page exists
    setLinkElement(['#directoryLinkBtn', '#floridaDirectoryBtn', '#btnAllCounties'], '');
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

    paintCountyDirectory();
    console.log(`[Internal Links] Cross-links populated for ${countyName} County`);
}

/** About copy plus one crawlable anchor for each of the 67 counties. */
function aboutHtmlWithDirectory(html) {
    const body = html || '';
    let directory = '';
    try { directory = buildFloridaCountyDirectoryHtml(); } catch (e) { return body; }
    if (!directory || body.indexOf('/florida-bail-bonds/bradford') !== -1) return body;
    return body + directory;
}

/** All 67 county anchors, including the eight thin pages Google had not indexed. */
function paintCountyDirectory() {
    let html = '';
    try { html = buildFloridaCountyDirectoryHtml(); } catch (e) { return; }
    if (!html) return;
    COUNTY_DIRECTORY_ELEMENT_IDS.forEach(function (id) {
        try {
            const el = $w(id);
            if (!el || typeof el.html !== 'string') return;
            el.html = html;
            if (typeof el.expand === 'function') el.expand();
        } catch (e) { /* element not on this page */ }
    });
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
                if (href) {
                    el.link = href;
                } else if (typeof el.collapse === 'function') {
                    el.collapse(); // never leave a button pointing nowhere
                }
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

// =============================================================================
// WIX STUDIO LAYER (Oct 2026) — source: Studio cutover ready/velo/county-page.js
// Element IDs from the Studio design. Every lookup is guarded (a missing ID skips
// that feature), so this is inert on the current live layout and the code above
// keeps running unchanged. Scoped in an IIFE so helper names never collide.
// Copy rules: no release-time/speed claims; Spanish line (727) 295-2245;
// "Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7".
// =============================================================================
(function studioLayer() {
    /**
     * county-page.js — Dynamic item page "Florida Counties (Item)"
     * URL pattern: /florida-bail-bonds/{County Slug}   Dataset: #countyDataset (FloridaCounties)
     * Paste in Wix Studio: open the dynamic item page > Code panel > page code.
     *
     * What it does (every lookup guarded, a missing element just skips that part):
     *  1. SEO title / meta description / og tags. CMS values are used only when they pass the
     *     copy rules (no speed claims, title ≤60 ending "| Shamrock Bail Bonds", description 140–160).
     *     Otherwise a compliant fallback is generated.
     *  2. Long-form content rendered as real text (server-side, so it is in the HTML):
     *     About paragraph, 20 county FAQs, the 67-county link list, and on Lee / Fort Myers
     *     the 12-answer Lee band.
     *  3. JSON-LD: BreadcrumbList + Service (provider = #organization) + FAQPage built from the
     *     same visible Q&As.
     *  4. Inmate search / jail phone / clerk buttons and bondsman CTAs.
     */


    const SITE = 'https://www.shamrockbailbonds.biz';
    const ORG_ID = `${SITE}/#organization`;
    const TITLE_SUFFIX = '| Shamrock Bail Bonds';
    const PHONE_MAIN = 'tel:+12393322245';
    const PHONE_SPANISH = 'tel:+17272952245';
    const SMS_TEXT = 'sms:+12399550178';
    const HOURS_LINE = 'Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7';
    const TRANSFER_FEE_LINE = 'A $100 transfer fee applies and may be waived at our discretion.';

    const FEDERAL_BOND_LINE = 'Federal bonds carry a 15% premium.';

    // Lee County jail facilities (confirmed by Brendan; matches the LCSO Corrections page).
    const LEE_MAIN_JAIL = 'Lee County Jail (Main Jail), 2115 Dr. Martin Luther King Jr. Blvd, Fort Myers, FL 33901';
    const LEE_MAIN_JAIL_PHONE = '(239) 477-1700';
    const LEE_CORE = 'Lee County Core / CPU Facility, 2501 Ortiz Ave, Fort Myers, FL 33905';
    const LEE_CORE_PHONE = '(239) 477-1500';
    const LEE_JAIL_ADDRESS_LINE = 'Main Jail: 2115 Dr. Martin Luther King Jr. Blvd, Fort Myers, FL 33901 · Core / CPU Facility: 2501 Ortiz Ave, Fort Myers, FL 33905';
    const LEE_JAIL_PHONE_LINE = `Main Jail ${LEE_MAIN_JAIL_PHONE} · Core / CPU Facility ${LEE_CORE_PHONE}`;

    // Pages that show the 12-answer Lee band.
    const LEE_BAND_SLUGS = ['lee', 'fort-myers'];

    // Copy rules applied to CMS text before it is shown.
    const BANNED_COPY = /\b(fast|faster|fastest|quick|quickly|quicker|minutes?|asap|speedy|rapid)\b|as quickly as possible|as soon as possible|within (several|a few) hours|jail release|\b4\s*[-–]\s*8\b|955-?0301|staff portal|lobby tablet|kiosk|\$?15k|\$15,000/i;

    const LEE_ANSWERS = [
        {
            "q": "How do bail bonds work in Lee County?",
            "a": "In Lee County, a judge sets bond at booking or at First Appearance. Instead of paying the full amount, a family can hire a licensed bail agent. You pay a premium of 10% of the bond, with a $100 minimum per charge, and sign an indemnity agreement. The agent then posts the bond with the Lee County Sheriff's Office."
        },
        {
            "q": "Where can I get bail bond services in Lee County?",
            "a": "Shamrock Bail Bonds is at 1528 Broadway in downtown Fort Myers, FL 33901, in the Colquitt Building. Call (239) 332-2245 at any hour, or (727) 295-2245 for Spanish. Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7. You can also sign the paperwork online, so you do not have to come to the office."
        },
        {
            "q": "How do I reach a bail bondsman in Fort Myers right now?",
            "a": "Call Shamrock Bail Bonds at (239) 332-2245. Phones are answered 24/7, including nights, weekends, and holidays. For Spanish, call (727) 295-2245. If you cannot talk, text (239) 955-0178. Have the person's full name, date of birth, and the jail or county ready if you know them. If you don't, call anyway and we will look up the booking."
        },
        {
            "q": "How long does release take after bail is posted in Fort Myers?",
            "a": "The jail sets the release timing, not the bondsman. After a bond is posted, the Lee County Sheriff's Office completes its own release processing. Timing depends on booking volume, holds, and court orders. Shamrock does not promise a release time. What we control is our part: we answer 24/7 and post the bond once paperwork and premium are in place."
        },
        {
            "q": "How do I choose a bail bond company in Southwest Florida?",
            "a": "Check four things. Look up the agent's license on the Florida Department of Financial Services licensee search. Confirm the premium follows Florida's 10% rule, with a $100 minimum per charge. Ask which surety backs the bond. Make sure someone answers at night and in Spanish. Shamrock is licensed, writes through OSI and Palmetto, and answers 24/7 in English and Spanish."
        },
        {
            "q": "How much does a bail bond cost in Lee County?",
            "a": "Florida sets the bail bond premium at 10% of the bond amount, with a $100 minimum per charge. Every licensed agent uses the same rate, and the judge sets the bond amount. The premium is the fee for the bond and is not refunded when the case ends. If collateral is required, we explain it before you sign."
        },
        {
            "q": "Where is the Lee County Jail?",
            "a": "Lee County arrests are booked by the Lee County Sheriff's Office. The Main Jail is at 2115 Dr. Martin Luther King Jr. Blvd, Fort Myers, FL 33901, phone (239) 477-1700. The Core / CPU Facility is at 2501 Ortiz Ave, Fort Myers, FL 33905, phone (239) 477-1500. Confirm a booking on the Sheriff's online inmate search, or call Shamrock at (239) 332-2245 and we will check the booking and bond amount for you."
        },
        {
            "q": "What is First Appearance in Lee County?",
            "a": "First Appearance is the first hearing after an arrest. Under Florida Rule of Criminal Procedure 3.130, it is held within 24 hours of arrest. In Lee County, a judge usually sets or reviews bond there. Lee County holds First Appearance every day, including weekends and holidays. Once the judge sets a bond, Shamrock can post it."
        },
        {
            "q": "Can I bail someone out of a Lee County jail if I live out of state?",
            "a": "Yes. You do not need to be in Florida to help. Shamrock handles the paperwork by phone and electronic signature, so the indemnitor (cosigner) can sign from anywhere, and the premium can be paid remotely. Call (239) 332-2245 with the defendant's name and we will confirm the booking and bond with the Lee County Sheriff's Office."
        },
        {
            "q": "¿Hablan español?",
            "a": "Sí. Llame a nuestra línea en español al (727) 295-2245, disponible las 24 horas, los 7 días de la semana. Le explicamos la fianza, la prima del 10% (mínimo $100 por cargo) y los documentos. Puede firmar en línea o visitar nuestra oficina en 1528 Broadway, Fort Myers, FL 33901, de lunes a viernes, de 9 a 5."
        },
        {
            "q": "What happens if the defendant misses court in Lee County?",
            "a": "If the defendant misses a court date, the judge can issue a warrant and the bond can be forfeited. The indemnitor who signed the agreement may then owe the full bond amount. Call Shamrock at (239) 332-2245 as soon as a date is missed. The sooner we know, the more options the defendant and the family have."
        },
        {
            "q": "Who owns Shamrock Bail Bonds?",
            "a": "Shamrock Bail Bonds, LLC is owner-operated by Brendan O'Neal and has served Florida families from downtown Fort Myers since 2012. Lee County is our home county, and we write bonds in all 67 Florida counties through our surety partners, OSI and Palmetto. Reach us at (239) 332-2245, or (727) 295-2245 for Spanish."
        }
    ];

    const COUNTY_LINKS = [
        { name: "Alachua County", slug: "alachua" },
        { name: "Baker County", slug: "baker" },
        { name: "Bay County", slug: "bay" },
        { name: "Bradford County", slug: "bradford" },
        { name: "Brevard County", slug: "brevard" },
        { name: "Broward County", slug: "broward" },
        { name: "Calhoun County", slug: "calhoun" },
        { name: "Charlotte County", slug: "charlotte" },
        { name: "Citrus County", slug: "citrus" },
        { name: "Clay County", slug: "clay" },
        { name: "Collier County", slug: "collier" },
        { name: "Columbia County", slug: "columbia" },
        { name: "DeSoto County", slug: "desoto" },
        { name: "Dixie County", slug: "dixie" },
        { name: "Duval County", slug: "duval" },
        { name: "Escambia County", slug: "escambia" },
        { name: "Flagler County", slug: "flagler" },
        { name: "Franklin County", slug: "franklin" },
        { name: "Gadsden County", slug: "gadsden" },
        { name: "Gilchrist County", slug: "gilchrist" },
        { name: "Glades County", slug: "glades" },
        { name: "Gulf County", slug: "gulf" },
        { name: "Hamilton County", slug: "hamilton" },
        { name: "Hardee County", slug: "hardee" },
        { name: "Hendry County", slug: "hendry" },
        { name: "Hernando County", slug: "hernando" },
        { name: "Highlands County", slug: "highlands" },
        { name: "Hillsborough County", slug: "hillsborough" },
        { name: "Holmes County", slug: "holmes" },
        { name: "Indian River County", slug: "indian-river" },
        { name: "Jackson County", slug: "jackson" },
        { name: "Jefferson County", slug: "jefferson" },
        { name: "Lafayette County", slug: "lafayette" },
        { name: "Lake County", slug: "lake" },
        { name: "Lee County", slug: "lee" },
        { name: "Leon County", slug: "leon" },
        { name: "Levy County", slug: "levy" },
        { name: "Liberty County", slug: "liberty" },
        { name: "Madison County", slug: "madison" },
        { name: "Manatee County", slug: "manatee" },
        { name: "Marion County", slug: "marion" },
        { name: "Martin County", slug: "martin" },
        { name: "Miami-Dade County", slug: "miami-dade" },
        { name: "Monroe County", slug: "monroe" },
        { name: "Nassau County", slug: "nassau" },
        { name: "Okaloosa County", slug: "okaloosa" },
        { name: "Okeechobee County", slug: "okeechobee" },
        { name: "Orange County", slug: "orange" },
        { name: "Osceola County", slug: "osceola" },
        { name: "Palm Beach County", slug: "palm-beach" },
        { name: "Pasco County", slug: "pasco" },
        { name: "Pinellas County", slug: "pinellas" },
        { name: "Polk County", slug: "polk" },
        { name: "Putnam County", slug: "putnam" },
        { name: "Santa Rosa County", slug: "santa-rosa" },
        { name: "Sarasota County", slug: "sarasota" },
        { name: "Seminole County", slug: "seminole" },
        { name: "St. Johns County", slug: "st-johns" },
        { name: "St. Lucie County", slug: "st-lucie" },
        { name: "Sumter County", slug: "sumter" },
        { name: "Suwannee County", slug: "suwannee" },
        { name: "Taylor County", slug: "taylor" },
        { name: "Union County", slug: "union" },
        { name: "Volusia County", slug: "volusia" },
        { name: "Wakulla County", slug: "wakulla" },
        { name: "Walton County", slug: "walton" },
        { name: "Washington County", slug: "washington" }
    ];

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
    function setText(node, value) {
        if (!node) return;
        try { node.text = String(value || ''); } catch (e) { /* not a text element */ }
    }
    function setHtml(node, value) {
        if (!node) return;
        try { node.html = value; } catch (e) { setText(node, value.replace(/<[^>]+>/g, '')); }
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
    function onClick(node, handler) {
        if (!node) return;
        try { node.onClick(handler); } catch (e) { /* element has no click event */ }
    }
    function showOrCollapse(node, visible) {
        if (!node) return;
        try {
            if (visible) { node.expand(); node.show(); } else { node.collapse(); }
        } catch (e) { /* noop */ }
    }

    // ─── Page entry ──────────────────────────────────────────────────────────────
    $w.onReady(function () {
        // Studio layout only (marker: #countyDataset). The live layout keeps the code above.
        if (!isStudioCountyLayout()) return undefined;
        const dataset = el('#countyDataset');
        if (!dataset) return undefined;
        // Returning a promise makes Wix wait, so the text below is in the server-rendered HTML.
        return new Promise((resolve) => {
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                try {
                    const item = dataset.getCurrentItem();
                    if (item) renderCountyPage(item);
                } catch (err) {
                    console.error('County page render failed:', err);
                }
                resolve();
            };
            setTimeout(finish, 5000); // never hold the page if the dataset does not report ready
            try { dataset.onReady(finish); } catch (e) { finish(); }
        });
    });

    function renderCountyPage(item) {
        const ctx = buildContext(item);
        const faqs = buildFaqs(ctx);
        const showLeeBand = LEE_BAND_SLUGS.indexOf(ctx.slug) !== -1;
        const leeAnswers = showLeeBand ? LEE_ANSWERS.map((qa) => ({ q: qa.q, a: qa.a })) : [];

        renderHeadline(ctx);
        renderJailCard(ctx);
        renderAbout(ctx);
        renderLeeBand(leeAnswers);
        renderFaqs(faqs);
        renderCountyLinks(ctx);
        bindCountyActions(ctx);
        applyCountySEO(ctx, leeAnswers.concat(faqs));
    }

    // ─── Context from the CMS record ─────────────────────────────────────────────
    function clean(value) {
        return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
    }
    function firstText(record, keys) {
        for (let i = 0; i < keys.length; i++) {
            const value = clean(record[keys[i]]);
            if (value) return value;
        }
        return '';
    }
    function isCompliant(text) {
        return !!text && !BANNED_COPY.test(text);
    }
    // CMS SEO text for Lee items is relabeled (see labelLeeFacilities) before the length rules run.
    function isCompliantSeo(ctx, text) {
        return isCompliant(text);
    }

    function buildContext(item) {
        const rawName = clean(item.countyName) || clean(item.title) || 'Florida';
        let kind = 'county';
        let place;
        let countyBase;

        const city = rawName.match(/^(.+?) Bail Bonds \((.+?) County\)$/i);
        if (city) {
            kind = 'city';
            place = city[1];
            countyBase = city[2];
        } else if (/(County Jail|Holding|Detention|Correctional)/i.test(rawName)) {
            kind = 'facility';
            place = rawName;
            countyBase = '';
            const sources = [clean(item.sheriffName), clean(item.jailName), rawName, clean(item.seoTitle)];
            for (let i = 0; i < sources.length && !countyBase; i++) {
                const m = sources[i].match(/^([A-Z][A-Za-z.\- ]*?) County\b/);
                if (m) countyBase = m[1].trim();
            }
        } else {
            countyBase = rawName.replace(/\s+County$/i, '');
            place = `${countyBase} County`;
        }

        const county = countyBase ? `${countyBase} County` : 'this county';
        const slug = clean(item.countySlug) || clean(item['link-florida-counties-h1Headline']).split('/').pop() || '';
        const isLee = /^lee$/i.test(countyBase);

        return {
            item,
            kind,
            place,
            county,
            countyBase,
            slug,
            isLee,
            url: `${SITE}/florida-bail-bonds/${slug}`,
            circuit: clean(item.circuit) || 'the local judicial circuit',
            jailName: (isLee && (/\d/.test(clean(item.jailName)) || !/^Lee County/i.test(clean(item.jailName)))) ? 'Lee County Jail' : (clean(item.jailName) || `${county} Jail`),
            jailCardName: isLee ? 'Lee County Jail (Main Jail and Core / CPU Facility)' : (clean(item.jailName) || `${county} Jail`),
            jailPhone: clean(item.jailPhone) || clean(item.bookingPhoneNumber),
            jailPhoneLine: isLee ? LEE_JAIL_PHONE_LINE : (clean(item.jailPhone) || clean(item.bookingPhoneNumber)),
            jailAddress: isLee ? LEE_JAIL_ADDRESS_LINE : clean(item.jailAddress),
            cities: clean(item.majorCities),
            inmateUrl: firstText(item, ['bookingWebsiteLink', 'jailBookingUrl', 'inmateSearchUrl', 'sheriffWebsite']),
            clerkUrl: firstText(item, ['countyClerkWebsitelink', 'clerkWebsite', 'recordsSearchLink']),
            clerkName: clean(item.clerkName),
            courthouse: clean(item.courthouseName),
            serviceAreaCopy: labelLeeFacilities(clean(item.serviceAreaCopy), isLee),
            seoDescription: labelLeeFacilities(clean(item.seoDescription) || clean(item.metaDescription), isLee)
        };
    }

    // Lee CMS text calls 2501 Ortiz Ave the "Lee County Jail" or "main jail". 2501 Ortiz is the
    // Core / CPU Facility; the Main Jail is 2115 Dr. Martin Luther King Jr. Blvd. Label both correctly.
    function labelLeeFacilities(text, isLee) {
        if (!text || !isLee) return text;
        const ORTIZ = '(?:2501 Ortiz Ave(?:nue)?\\.?)(?:,? Fort Myers)?(?:,? FL)?(?: 33905)?';
        const MLK = '2115 (?:Dr\\.? )?Martin Luther King,? Jr\\.? Blvd\\.?(?:,? Fort Myers)?(?:,? FL)?(?: 33901)?';
        return text
            // "Lee County (Main) Jail (2501 Ortiz ...)" / "Lee County Jail, 2501 Ortiz ..."
            .replace(new RegExp('(?:the )?Lee County (?:Main )?Jail,? \\(?' + ORTIZ + '\\)?', 'gi'), 'the Lee County Core / CPU Facility (2501 Ortiz Ave, Fort Myers, FL 33905)')
            .replace(/(?:the )?Lee County (?:Main )?Jail on Ortiz Avenue/gi, 'the Lee County Core / CPU Facility on Ortiz Avenue')
            .replace(/(?:the )?main jail \(?(?:at |on )?2501 Ortiz Ave(?:nue)?\.?\)?/gi, 'the Core / CPU Facility (2501 Ortiz Ave)')
            // full ZIPs on bare addresses
            .replace(new RegExp(MLK, 'gi'), '2115 Dr. Martin Luther King Jr. Blvd, Fort Myers, FL 33901')
            .replace(/\bCore \(2501 Ortiz Ave(?:,? Fort Myers)?(?:,? FL)?(?: 33905)?\)/gi, 'Core / CPU Facility (2501 Ortiz Ave, Fort Myers, FL 33905)')
            .replace(/\bDowntown Jail \(/g, 'Main Jail (')
            .replace(/\bthe the\b/gi, 'the')
            .replace(/typically held at (the Lee County Core \/ CPU Facility \(2501 Ortiz Ave, Fort Myers, FL 33905\)) and then booked at the Lee County Core \/ CPU Facility \(2501 Ortiz Ave, Fort Myers, FL 33905\)/gi, 'typically booked at $1');
    }

    function isRealStreet(text) {
        return /^\d+\s+\S+/.test(text || '') || /\d+ [A-Za-z]/.test(text || '');
    }

    // ─── Visible content ─────────────────────────────────────────────────────────
    function renderHeadline(ctx) {
        const h1 = el('#countyH1');
        if (!h1) return;
        const cmsH1 = clean(ctx.item.h1Headline);
        setText(h1, isCompliantSeo(ctx, cmsH1) ? cmsH1 : `${ctx.place} Bail Bonds: 24/7 Help for Families`);
    }

    function renderJailCard(ctx) {
        setText(el('#jailNameText'), ctx.jailCardName);
        const phone = el('#jailPhoneText');
        if (phone) {
            if (ctx.jailPhoneLine) setText(phone, ctx.jailPhoneLine); else showOrCollapse(phone, false);
        }
        const address = el('#jailAddressText');
        if (address) {
            const show = ctx.isLee || isRealStreet(ctx.jailAddress);
            if (show) setText(address, ctx.jailAddress); else showOrCollapse(address, false);
        }
    }

    function aboutText(ctx) {
        const parts = [];
        if (isCompliant(ctx.serviceAreaCopy)) {
            parts.push(ctx.serviceAreaCopy);
        } else {
            parts.push(`Shamrock Bail Bonds posts surety bonds for people held in ${ctx.county}, Florida. Florida sets the premium at 10% of the bond, with a $100 minimum per charge. Call (239) 332-2245 and we will confirm the booking, explain the paperwork, and send it to your phone.`);
        }
        if (ctx.isLee) {
            if (!/2115 Dr|2501 Ortiz/.test(parts.join(' '))) parts.push(`Lee County arrests are booked by the Lee County Sheriff's Office. The Main Jail is at 2115 Dr. Martin Luther King Jr. Blvd, Fort Myers, FL 33901 (phone ${LEE_MAIN_JAIL_PHONE}). The Core / CPU Facility is at 2501 Ortiz Ave, Fort Myers, FL 33905 (phone ${LEE_CORE_PHONE}).`);
        } else if (ctx.jailAddress && isRealStreet(ctx.jailAddress) && isCompliant(ctx.jailAddress)) {
            parts.push(`${ctx.jailName}: ${ctx.jailAddress}.`);
        }
        parts.push(`Shamrock posts surety bonds for ${ctx.county} arrests, and phones are answered 24/7. Call (239) 332-2245 with the person's full name, or (727) 295-2245 for Spanish.`);
        if (ctx.cities) parts.push(`We cover ${ctx.county} communities including ${ctx.cities}.`);
        if (parts.join(' ').indexOf('1528 Broadway') === -1) parts.push('Our office is at 1528 Broadway, Fort Myers, FL 33901.');
        parts.push(`${HOURS_LINE}.`);
        return parts.join(' ');
    }

    function renderAbout(ctx) {
        setText(el('#countyAboutText'), aboutText(ctx));
    }

    function renderLeeBand(answers) {
        const section = el('#leeAnswersSection');
        const repeater = el('#leeAnswersRepeater');
        if (!answers.length) {
            showOrCollapse(section, false);
            return;
        }
        showOrCollapse(section, true);
        if (!repeater) return;
        try {
            repeater.onItemReady(($item, data) => {
                setText(itemEl($item, '#leeAnswerQuestion'), data.q);
                setText(itemEl($item, '#leeAnswerText'), data.a);
            });
            repeater.data = answers.map((qa, i) => ({ _id: `lee-answer-${i + 1}`, q: qa.q, a: qa.a }));
        } catch (e) {
            console.warn('Lee answers repeater skipped:', e.message);
        }
    }

    function renderFaqs(faqs) {
        const repeater = el('#countyFaqRepeater');
        if (!repeater) return;
        try {
            repeater.onItemReady(($item, data) => {
                setText(itemEl($item, '#faqQuestion'), data.q);
                setText(itemEl($item, '#faqAnswer'), data.a);
            });
            repeater.data = faqs.map((qa) => ({ _id: qa.id, q: qa.q, a: qa.a }));
        } catch (e) {
            console.warn('County FAQ repeater skipped:', e.message);
        }
    }

    function renderCountyLinks(ctx) {
        const target = el('#countyLinksText');
        if (!target) return;
        const links = COUNTY_LINKS
            .filter((c) => c.slug !== ctx.slug)
            .map((c) => `<a href="/florida-bail-bonds/${c.slug}">${c.name} bail bonds</a>`);
        setHtml(target, `<p>${links.join(' · ')}</p>`);
    }

    // ─── FAQ set (compliant rewrite of the live 19-question set, plus transfer bonds) ──
    function buildFaqs(ctx) {
        const C = ctx.county;
        const P = ctx.place;
        const circuit = ctx.circuit;
        const areas = ctx.cities ? `including ${ctx.cities}` : 'including every city and town in the county';
        const list = [
            { id: 'where-find', q: `Where can I find bail bonds in ${P}?`,
              a: `Shamrock Bail Bonds is a licensed Florida bail bond agency at 1528 Broadway, Fort Myers, FL 33901. We post bonds for people held in ${C} (${circuit}) and in every other Florida county. Call (239) 332-2245, or (727) 295-2245 for Spanish. ${HOURS_LINE}.` },
            { id: 'open-247', q: `Who offers 24/7 bail bond help in ${P}?`,
              a: `Shamrock Bail Bonds answers its phones 24/7, including nights, weekends, and holidays. Call (239) 332-2245, call (727) 295-2245 for Spanish, or text (239) 955-0178 if you cannot talk. ${HOURS_LINE}.` },
            { id: 'process', q: `How does the bail bond process work in ${C}?`,
              a: `After booking, a judge in ${circuit} sets or reviews the bond, often at First Appearance. You can pay the full bond to the court, or hire a licensed bail agent. With an agent, you pay the premium set by Florida law and sign an indemnity agreement, and the agent posts the bond with the jail.` },
            { id: 'after-posting', q: `What happens after the bond is posted in ${C}?`,
              a: `The jail controls release after a bond is posted. The jail completes its own release processing, and holds, warrants, or court orders can affect it. Shamrock does not promise a release time. Our part is to answer 24/7 and post the bond once the paperwork and premium are in place.` },
            { id: 'cost', q: `How much does a bail bond cost in ${C}?`,
              a: `Florida sets the premium at 10% of the bond amount, with a $100 minimum per charge. Every licensed agent uses the same rate, and the judge sets the bond amount. The premium is the fee for the bond and is not refunded when the case ends.` },
            { id: 'ten-percent', q: `What is 10% of a $5,000 bond in ${C}?`,
              a: `Ten percent of a $5,000 bond is $500. If the bond is split across several charges, each charge carries at least the $100 minimum. We confirm the exact premium with you before you sign.` },
            { id: 'full-amount', q: `Do I have to pay the full bail amount in ${C}?`,
              a: `Only if you post a cash bond directly with the court or the jail. With a surety bond, you pay the premium and sign the indemnity agreement, and the surety company behind the bond is responsible to the court for the full amount.` },
            { id: 'cash-vs-surety', q: `What is the difference between a cash bond and a surety bond in ${C}?`,
              a: `A cash bond means paying 100% of the bond to the court yourself. A surety bond means paying the 10% premium to a licensed bail agent, who posts the full bond through a surety company. Shamrock writes surety bonds through OSI and Palmetto.` },
            { id: 'credit-card', q: `Can I pay for a ${C} bail bond with a credit card?`,
              a: `Yes. We accept credit cards and other payment options, subject to approval and the terms of the bond. Ask about a payment plan when you call (239) 332-2245.` },
            { id: 'refund', q: 'Is the bail bond premium refundable in Florida?',
              a: 'No. The premium is earned when the bond is posted and is not refunded, whatever happens in the case. Collateral is different: it is returned once the surety releases it after the bond is discharged.' },
            { id: 'missed-court', q: `What happens if someone misses court in ${C}?`,
              a: `A missed court date can lead to a warrant and a bond forfeiture, and the indemnitor may owe the full bond amount. Call Shamrock at (239) 332-2245 right away if a date is missed, so we can talk through the options with the family.` },
            { id: 'first-appearance', q: `What is a First Appearance hearing in ${C}?`,
              a: `First Appearance is the first hearing after an arrest. Florida Rule of Criminal Procedure 3.130 requires it within 24 hours of arrest. A judge in ${circuit} reviews the charges and sets or reviews bond and release conditions.` },
            { id: 'watch-first-appearance', q: `Can I watch First Appearance in ${C}?`,
              a: `Some Florida counties stream First Appearance online, and others hold it in person only. Search for ${ctx.countyBase || 'your county'} on our First Appearance page at shamrockbailbonds.biz/first-appearance, or call (239) 332-2245 and we will help you find the courtroom or stream.` },
            { id: 'collateral-required', q: `Is collateral required for bail bonds in ${C}?`,
              a: 'Not always. Collateral depends on the bond amount, the charges, and what the surety requires. If collateral is needed, we tell you exactly what it is before you agree to anything.' },
            { id: 'collateral-types', q: `What types of collateral are accepted in ${C}?`,
              a: 'Depending on the bond, collateral can include real estate, vehicles, or other assets. You get a written receipt for any collateral you pledge, and we explain how and when it is returned.' },
            { id: 'nebbia', q: `What is a Nebbia hearing in ${C}?`,
              a: `A judge may order a Nebbia hearing, usually on larger bonds, to confirm that the money and collateral for the bond come from a legitimate source. If ${circuit} orders one, we help the family gather the paperwork the court asks for.` },
            { id: 'areas', q: `What areas of ${C} do you serve?`,
              a: `We serve all of ${C}, ${areas}. We also post bonds in all 67 Florida counties, and families can sign the paperwork online from anywhere.` },
            { id: 'bail-amount', q: `How is the bail amount set in ${C}?`,
              a: `A judge sets the bail amount based on the charges, prior record, and ties to the community. You can check the official inmate search for ${C}, or call (239) 332-2245 and we will look up the booking and bond amount with you.` },
            { id: 'warrant', q: `Can you help with an active warrant in ${C}?`,
              a: 'Yes. We can help arrange a surrender and bond with the court so the person does not wait to be picked up. Call (239) 332-2245 to talk it over confidentially.' },
            { id: 'transfer', q: `Can you post a bond if the person is held outside ${C}?`,
              a: `Yes. We post bonds in all 67 Florida counties and can arrange a transfer bond when the arrest and the warrant are in different counties. ${TRANSFER_FEE_LINE} ${FEDERAL_BOND_LINE}` }
        ];
        // On the Lee band pages, skip the questions the 12 Lee answers already cover.
        if (LEE_BAND_SLUGS.indexOf(ctx.slug) !== -1) {
            const covered = ['where-find', 'open-247', 'process', 'after-posting', 'cost', 'missed-court', 'first-appearance'];
            return list.filter((qa) => covered.indexOf(qa.id) === -1);
        }
        return list;
    }

    // ─── SEO ─────────────────────────────────────────────────────────────────────
    function pickTitle(ctx) {
        const cms = clean(ctx.item.seoTitle);
        if (isCompliantSeo(ctx, cms) && cms.length <= 60 && cms.endsWith(TITLE_SUFFIX)) return cms;
        const candidates = [
            `${ctx.place} Bail Bonds ${TITLE_SUFFIX}`,
            `${ctx.place} ${TITLE_SUFFIX}`,
            `${ctx.county} Bail Bonds ${TITLE_SUFFIX}`
        ];
        for (let i = 0; i < candidates.length; i++) {
            if (candidates[i].length <= 60) return candidates[i];
        }
        return `Florida Bail Bonds ${TITLE_SUFFIX}`;
    }

    function pickDescription(ctx) {
        const cms = ctx.seoDescription;
        if (isCompliantSeo(ctx, cms) && cms.length >= 140 && cms.length <= 160) return cms;
        const P = ctx.place;
        const candidates = [
            `Bail bonds in ${P}, FL from a licensed Fort Myers agency. 10% premium, $100 minimum per charge. Call 239-332-2245 or text 239-955-0178, 24/7.`,
            `Need bail in ${P}, FL? Licensed bail bonds from Shamrock in Fort Myers. 10% premium, $100 minimum per charge. Call 239-332-2245 or text 239-955-0178, 24/7.`,
            `Bail bonds in ${P}, Florida from a licensed, owner-operated Fort Myers agency. 10% premium, $100 minimum per charge. Call 239-332-2245 or text 239-955-0178.`,
            `${P} bail bonds from Shamrock. Florida premium: 10%, $100 minimum per charge. Phones answered 24/7: call 239-332-2245 or text 239-955-0178.`
        ];
        let best = candidates[0];
        for (let i = 0; i < candidates.length; i++) {
            const len = candidates[i].length;
            if (len >= 140 && len <= 160) return candidates[i];
            if (len <= 160 && Math.abs(len - 150) < Math.abs(best.length - 150)) best = candidates[i];
        }
        return best.length <= 160 ? best : best.slice(0, 157).replace(/\s+\S*$/, '') + '...';
    }

    function applyCountySEO(ctx, qas) {
        const title = pickTitle(ctx);
        const description = pickDescription(ctx);
        try {
            wixSeoFrontend.setTitle(title);
            wixSeoFrontend.setMetaTags([
                { name: 'description', content: description },
                { property: 'og:title', content: title },
                { property: 'og:description', content: description },
                { property: 'og:type', content: 'website' },
                { property: 'og:url', content: ctx.url }
            ]);
        } catch (e) {
            console.warn('SEO tags skipped:', e.message);
        }

        const breadcrumb = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
                { '@type': 'ListItem', position: 2, name: 'Florida Bail Bonds', item: `${SITE}/florida-bail-bonds-1` },
                { '@type': 'ListItem', position: 3, name: `${ctx.place} Bail Bonds`, item: ctx.url }
            ]
        };
        const service = {
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': `${ctx.url}#service`,
            name: `${ctx.place} Bail Bonds`,
            serviceType: 'Bail bond (surety bond)',
            provider: { '@id': ORG_ID },
            areaServed: ctx.kind === 'city'
                ? { '@type': 'City', name: `${ctx.place}, Florida`, containedInPlace: { '@type': 'AdministrativeArea', name: `${ctx.county}, Florida` } }
                : { '@type': 'AdministrativeArea', name: `${ctx.county}, Florida` },
            description: `Surety bail bonds for people held in ${ctx.county}. Premium set by Florida law at 10% of the bond, $100 minimum per charge. ${HOURS_LINE}.`,
            offers: { '@type': 'Offer', description: 'Florida statutory premium: 10% of the bond amount, $100 minimum per charge' }
        };
        const faqPage = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': `${ctx.url}#faq`,
            about: { '@id': ORG_ID },
            mainEntity: qas.map((qa) => ({
                '@type': 'Question',
                name: qa.q,
                acceptedAnswer: { '@type': 'Answer', text: qa.a }
            }))
        };
        try {
            wixSeoFrontend.setStructuredData([breadcrumb, service, faqPage]);
        } catch (e) {
            console.warn('Structured data skipped:', e.message);
        }
    }

    // ─── Buttons ─────────────────────────────────────────────────────────────────
    function bindCountyActions(ctx) {
        const label = ctx.slug || 'unknown';

        const inmateBtn = el('#inmateLookupBtn');
        if (inmateBtn) {
            if (/^https?:\/\//i.test(ctx.inmateUrl)) {
                setLink(inmateBtn, ctx.inmateUrl, '_blank');
            } else {
                setLink(inmateBtn, PHONE_MAIN, '_self'); // no lookup on file: call us and we check the booking
            }
            onClick(inmateBtn, () => trackEvent('jail_inmate_lookup', label));
        }

        const jailBtn = el('#callJailFacilityBtn');
        if (jailBtn) {
            const digits = (ctx.jailPhone || '').replace(/[^0-9]/g, '').replace(/^1(?=\d{10}$)/, '');
            if (digits.length === 10) {
                setLink(jailBtn, `tel:+1${digits}`, '_self');
                onClick(jailBtn, () => trackEvent('call_jail_facility', label));
            } else {
                showOrCollapse(jailBtn, false);
            }
        }

        const clerkBtn = el('#clerkWebsiteBtn');
        if (clerkBtn) {
            if (/^https?:\/\//i.test(ctx.clerkUrl)) {
                setLink(clerkBtn, ctx.clerkUrl, '_blank');
                onClick(clerkBtn, () => trackEvent('clerk_website_click', label));
            } else {
                showOrCollapse(clerkBtn, false);
            }
        }

        const callBtn = el('#bondsmanCallBtn');
        setLink(callBtn, PHONE_MAIN, '_self');
        onClick(callBtn, () => trackEvent('call_english', `county_${label}`));

        const spanishBtn = el('#spanishCallBtn');
        setLink(spanishBtn, PHONE_SPANISH, '_self');
        onClick(spanishBtn, () => trackEvent('call_spanish', `county_${label}`));

        const smsBtn = el('#smsBondsmanBtn');
        setLink(smsBtn, SMS_TEXT, '_self');
        onClick(smsBtn, () => trackEvent('sms_click', `county_${label}`));

        onClick(el('#startOnlineBtn'), () => {
            trackEvent('start_online_click', `county_${label}`);
            wixLocationFrontend.to('/portal-landing');
        });
    }

    function trackEvent(action, label) {
        try {
            if (wixWindowFrontend.trackEvent) {
                wixWindowFrontend.trackEvent('CustomEvent', {
                    event: 'county_page_interaction',
                    eventCategory: 'County Lead Engagement',
                    eventAction: action,
                    eventLabel: label
                });
            }
        } catch (e) {
            console.warn('Analytics suppressed:', e.message);
        }
    }
})();
