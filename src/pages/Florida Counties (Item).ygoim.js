/// <reference path="../types/wix-overrides.d.ts" />
/**
 * Wix Studio Dynamic Item Page: "Florida Counties (Item)" (page ID: ygoim)
 * URL pattern: /florida-bail-bonds/{countySlug}
 *
 * Confirmed Studio Element IDs:
 * - #countyFaqRepeater (comp-mvseipzo) — FAQ repeater
 * - #text65 (comp-mvsebxpk) — FAQ section heading ("Questions families ask")
 *
 * Element IDs for Brendan to confirm in Studio:
 * - Dynamic dataset ID: #dynamicDataset (or #countyDataset)
 * - Repeater child text IDs inside #countyFaqRepeater: #faqQuestion (title) and #faqAnswer (answer)
 */

import wixData from 'wix-data';
import wixLocationFrontend from 'wix-location-frontend';
import wixSeoFrontend from 'wix-seo-frontend';
import { generateCountyPage } from 'backend/county-generator';
import { resolvePrimaryHeroH1 } from 'public/cityHeroHeadline';
import { buildFloridaCountyDirectoryHtml } from 'public/floridaCountyDirectory';
import { applyLeeDowntownBooking, softenLeeCountyPage } from 'public/sanitizeLandingCopy';

// Hero and about candidates from the classic county template. Studio Layers
// does not have these ids. Each lookup is guarded, so a missing element is a no-op.
const HERO_TEXT_IDS = ['#countyName', '#countyNameHeadline', '#dynamicHeader'];
const HERO_SUB_IDS = ['#heroSubtitle', '#aboutCountyText', '#heroDescription'];
const ABOUT_TITLE_IDS = ['#aboutHeader', '#aboutTitle', '#textAboutCounty', '#aboutSectionTitle', '#textAboutTitle'];
const ABOUT_HTML_IDS = ['#aboutBody', '#aboutText', '#aboutDescription', '#aboutContent', '#textAboutBody'];

const SITE_URL = 'https://www.shamrockbailbonds.biz';
const FAQ_COLLECTION = 'Import22';
const COUNTIES_COLLECTION = 'FloridaCounties';
const FAQ_LIMIT = 15;
// Wix applies limit() before placeholders are dropped. Load the platform
// maximum, then keep the first FAQ_LIMIT valid rows.
const FAQ_CANDIDATE_LIMIT = 1000;
const HUB_URL = `${SITE_URL}/florida-bail-bonds-1`;

const EDITOR_PLACEHOLDER_RE = /^(question|answer|heading\s*\d*|add paragraph text\.?)$/i;

/**
 * Safe element lookup; returns null when the selector does not exist on the page.
 * @param {Function} scope $w or $item selector function
 * @param {string} selector
 */
function safeSelect(scope, selector) {
    try {
        const node = scope(selector);
        if (!node || (typeof node.id !== 'string' && typeof node.type !== 'string')) {
            return null;
        }
        return node;
    } catch (e) {
        return null;
    }
}

/**
 * Collapse an element safely without throwing if absent.
 * @param {any} node
 */
function collapseNode(node) {
    if (!node) return;
    try {
        if (typeof node.collapse === 'function') node.collapse();
    } catch (e) { /* noop */ }
}

/**
 * Expand and show an element safely.
 * @param {any} node
 */
function expandNode(node) {
    if (!node) return;
    try {
        if (typeof node.expand === 'function') node.expand();
        if (typeof node.show === 'function') node.show();
    } catch (e) { /* noop */ }
}

/**
 * Human label for the page itself (breadcrumb / areaServed).
 * "Cape Coral Bail Bonds (Lee County)" -> "Cape Coral"; "Lee County Jail" -> "Lee County Jail"; "Lee" -> "Lee County".
 * @param {string} fullName
 * @param {string} derivedName
 */
function buildPageLabel(fullName, derivedName) {
    const name = String(fullName || '').trim();
    if (/\(/.test(name)) {
        return name.replace(/\s*\(.*$/, '').replace(/\s+Bail Bonds$/i, '').trim() || name;
    }
    if (/\b(jail|police|department|holding|detention|correction)/i.test(name)) return name;
    if (!derivedName) return '';
    return /\s+County$/i.test(derivedName) ? derivedName : `${derivedName} County`;
}

/**
 * Normalize countySlug and countyName from a FloridaCounties item.
 * Ensures countyName base does not duplicate "County" when appending " County".
 * @param {object} item
 * @param {string} [fallbackSlug]
 * @returns {{ countySlug: string, countyName: string, relatedPage: string, relatedCounty: string }}
 */
export function buildCountyFaqFilterTargets(item, fallbackSlug = '') {
    const rawSlug = String((item && item.countySlug) || fallbackSlug || '')
        .trim()
        .replace(/^\/+|\/+$/g, '')
        .split('/')
        .pop()
        .toLowerCase();

    const fullName = String((item && item.countyName) || '').trim();
    // City items store e.g. "Cape Coral Bail Bonds (Lee County)"; jail items e.g. "Lee County Jail".
    // Use the parent county for FAQ matching so these never produce "... County County".
    const parenCounty = fullName.match(/\(([^()]+?)\s+County\)\s*$/i);
    const leadingCounty = fullName.match(/^(.+?)\s+County\b.+$/i);
    const rawName = (parenCounty ? parenCounty[1] : (leadingCounty ? leadingCounty[1] : fullName))
        .trim()
        .replace(/\s+County$/i, '')
        .trim();
    const isCountyName = !!rawName && !/\b(bail bonds|police|department|holding|jail)\b/i.test(rawName);

    const derivedName = rawName || rawSlug
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

    return {
        countySlug: rawSlug,
        countyName: derivedName,
        relatedPage: rawSlug ? `/florida-bail-bonds/${rawSlug}` : '',
        relatedCounty: (derivedName && (isCountyName || !fullName)) ? `${derivedName} County` : '',
        pageLabel: buildPageLabel(fullName, derivedName)
    };
}

/**
 * Check whether an FAQ item has real question & answer text (and not Editor placeholders).
 * @param {object} row
 * @returns {boolean}
 */
export function isValidFaqRow(row) {
    if (!row || typeof row !== 'object') return false;
    if (row.isActive !== true) return false;
    const title = String(row.title || '').trim();
    const answer = String(row.answer || '').trim();
    if (!title || !answer) return false;
    if (EDITOR_PLACEHOLDER_RE.test(title) || EDITOR_PLACEHOLDER_RE.test(answer)) return false;
    return true;
}

/**
 * Query Import22 (Faqs) for active FAQs matching the current county:
 *   isActive = true AND (relatedPage = "/florida-bail-bonds/" + countySlug OR relatedCounty = countyName + " County")
 * Sorted by sortOrder asc, limit 15.
 *
 * @param {{ countySlug: string, countyName: string }} countyItem
 * @param {typeof wixData} [dataApi]
 * @returns {Promise<Array<{ _id: string, title: string, answer: string, sortOrder?: number, relatedCounty?: string, relatedPage?: string }>>}
 */
export async function queryCountyFaqs(countyItem, dataApi = wixData) {
    const targets = buildCountyFaqFilterTargets(countyItem);
    if (!targets.relatedPage && !targets.relatedCounty) {
        return [];
    }

    let combinedQuery = null;

    if (targets.relatedPage) {
        combinedQuery = dataApi
            .query(FAQ_COLLECTION)
            .eq('isActive', true)
            .eq('relatedPage', targets.relatedPage);
    }

    if (targets.relatedCounty) {
        const countyBranch = dataApi
            .query(FAQ_COLLECTION)
            .eq('isActive', true)
            .eq('relatedCounty', targets.relatedCounty);
        combinedQuery = combinedQuery ? combinedQuery.or(countyBranch) : countyBranch;
    }

    if (!combinedQuery) return [];

    const result = await combinedQuery
        .ascending('sortOrder')
        .limit(FAQ_CANDIDATE_LIMIT)
        .find();

    const rawItems = (result && Array.isArray(result.items)) ? result.items : [];
    const seen = new Set();
    const validItems = [];

    for (let i = 0; i < rawItems.length; i++) {
        const row = rawItems[i];
        if (!isValidFaqRow(row)) continue;

        const rowPage = String(row.relatedPage || '').trim().toLowerCase();
        const rowCounty = String(row.relatedCounty || '').trim().toLowerCase();
        const matchesPage = targets.relatedPage && rowPage === targets.relatedPage.toLowerCase();
        const matchesCounty = targets.relatedCounty && rowCounty === targets.relatedCounty.toLowerCase();
        if (!matchesPage && !matchesCounty) continue;

        const title = String(row.title).trim();
        const answer = String(row.answer).trim();
        const dedupKey = `${row._id || ''}::${title.toLowerCase()}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        validItems.push({
            _id: String(row._id || `faq-${i + 1}`),
            title,
            answer,
            sortOrder: typeof row.sortOrder === 'number' ? row.sortOrder : i + 1,
            relatedCounty: row.relatedCounty || targets.relatedCounty,
            relatedPage: row.relatedPage || targets.relatedPage
        });

        if (validItems.length >= FAQ_LIMIT) break;
    }

    return validItems;
}

/**
 * Bind a single repeater item's question (title) and answer text, and scrub any Editor placeholder text.
 * @param {Function} $item
 * @param {{ title: string, answer: string }} itemData
 */
export function bindFaqRepeaterItem($item, itemData) {
    const questionText = String((itemData && itemData.title) || '').trim();
    const answerText = String((itemData && itemData.answer) || '').trim();

    // FAQ repeater children. #leeAnswerQuestion / #leeAnswerText are a different
    // block on the page, so #questionText / #answerText are not remapped to them.
    const questionSelectors = ['#faqQuestion', '#faqTitle'];
    const answerSelectors = ['#faqAnswer', '#faqBody'];

    let questionBound = false;
    for (let i = 0; i < questionSelectors.length; i++) {
        const qNode = safeSelect($item, questionSelectors[i]);
        if (qNode) {
            try {
                qNode.text = questionText;
                questionBound = true;
            } catch (e) { /* noop */ }
        }
    }

    let answerBound = false;
    for (let i = 0; i < answerSelectors.length; i++) {
        const aNode = safeSelect($item, answerSelectors[i]);
        if (aNode) {
            try {
                aNode.text = answerText;
                answerBound = true;
            } catch (e) { /* noop */ }
        }
    }

    try {
        const allTextNodes = $item('Text');
        if (Array.isArray(allTextNodes) && allTextNodes.length > 0) {
            if (!questionBound && allTextNodes[0]) {
                allTextNodes[0].text = questionText;
                questionBound = true;
            }
            if (!answerBound && allTextNodes.length > 1 && allTextNodes[1]) {
                allTextNodes[1].text = answerText;
                answerBound = true;
            }
            for (let i = 0; i < allTextNodes.length; i++) {
                const current = String(allTextNodes[i].text || '').trim();
                if (EDITOR_PLACEHOLDER_RE.test(current)) {
                    allTextNodes[i].text = '';
                    collapseNode(allTextNodes[i]);
                }
            }
        }
    } catch (e) { /* $item('Text') not supported in stub */ }
}

/**
 * Build the single LocalBusiness JSON-LD block for a county page.
 * @param {object} countyItem
 */
export function buildCountyLocalBusinessSchema(countyItem) {
    const targets = buildCountyFaqFilterTargets(countyItem);
    const countyLabel = targets.relatedCounty || '';
    const areaServed = [{ '@type': 'State', name: 'Florida' }];
    if (countyLabel) {
        areaServed.push({ '@type': 'AdministrativeArea', name: `${countyLabel}, Florida` });
    }
    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#organization`,
        name: 'Shamrock Bail Bonds',
        url: SITE_URL,
        telephone: '+1-239-332-2245',
        address: {
            '@type': 'PostalAddress',
            streetAddress: '1528 Broadway',
            addressLocality: 'Fort Myers',
            addressRegion: 'FL',
            postalCode: '33901',
            addressCountry: 'US'
        },
        areaServed,
        openingHours: 'Mo-Fr 09:00-17:00',
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '17:00'
        },
        contactPoint: [
            {
                '@type': 'ContactPoint',
                telephone: '+1-239-332-2245',
                contactType: 'customer service',
                areaServed: 'FL',
                availableLanguage: ['en', 'es'],
                hoursAvailable: {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    opens: '00:00',
                    closes: '23:59'
                }
            },
            {
                '@type': 'ContactPoint',
                telephone: '+1-727-295-2245',
                contactType: 'customer service',
                areaServed: 'FL',
                availableLanguage: 'es',
                hoursAvailable: {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    opens: '00:00',
                    closes: '23:59'
                }
            }
        ]
    };
}

/**
 * Build BreadcrumbList JSON-LD (Home > Florida Bail Bonds > {County}).
 * @param {object} countyItem
 */
export function buildCountyBreadcrumbSchema(countyItem) {
    const targets = buildCountyFaqFilterTargets(countyItem);
    const countyLabel = targets.pageLabel || targets.relatedCounty || targets.countyName || 'Florida Bail Bonds';
    // The hub lives at /florida-bail-bonds-1 (/florida-bail-bonds is a 301 to it).
    const pageUrl = targets.relatedPage ? `${SITE_URL}${targets.relatedPage}` : HUB_URL;
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${SITE_URL}/`
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Florida Bail Bonds',
                item: HUB_URL
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: countyLabel,
                item: pageUrl
            }
        ]
    };
}

/**
 * Build FAQPage JSON-LD from the exact Import22 items rendered in T2.
 * Returns null if 0 items are rendered so an empty mainEntity is never emitted.
 * @param {Array<{ title: string, answer: string }>} renderedFaqs
 */
export function buildCountyFaqPageSchema(renderedFaqs) {
    const list = Array.isArray(renderedFaqs)
        ? renderedFaqs.filter((item) => item && String(item.title || '').trim() && String(item.answer || '').trim())
        : [];
    if (list.length === 0) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: list.map((faq) => ({
            '@type': 'Question',
            name: String(faq.title).trim(),
            acceptedAnswer: {
                '@type': 'Answer',
                text: String(faq.answer).trim()
            }
        }))
    };
}

/**
 * Apply structured data for the county page using wix-seo-frontend.
 * Emits one LocalBusiness, one BreadcrumbList (Home > Florida Bail Bonds > {County}),
 * and (when >0 FAQs are rendered) one FAQPage matching visible FAQ items 1:1.
 *
 * @param {object} countyItem
 * @param {Array<{ title: string, answer: string }>} renderedFaqs
 * @param {typeof wixSeoFrontend} [seoApi]
 */
export async function applyCountyPageStructuredData(countyItem, renderedFaqs, seoApi = wixSeoFrontend) {
    const schemas = [
        buildCountyLocalBusinessSchema(countyItem),
        buildCountyBreadcrumbSchema(countyItem)
    ];
    const faqSchema = buildCountyFaqPageSchema(renderedFaqs);
    if (faqSchema) {
        schemas.push(faqSchema);
    }
    if (seoApi && typeof seoApi.setStructuredData === 'function') {
        try {
            await seoApi.setStructuredData(schemas);
        } catch (e) {
            console.error('[SEO] county structured data failed', e);
        }
    }
    return schemas;
}

/**
 * Read the current FloridaCounties item from the page dataset, falling back to URL slug query.
 * @param {Function} $wFn
 * @param {typeof wixData} [dataApi]
 * @param {typeof wixLocationFrontend} [locApi]
 * @returns {Promise<object|null>}
 */
export async function readCurrentFloridaCountyItem($wFn, dataApi = wixData, locApi = wixLocationFrontend) {
    const datasetSelectors = ['#dynamicDataset', '#countyDataset'];
    for (let i = 0; i < datasetSelectors.length; i++) {
        const dataset = safeSelect($wFn, datasetSelectors[i]);
        if (dataset && typeof dataset.getCurrentItem === 'function') {
            await new Promise((resolve) => {
                let settled = false;
                const done = () => {
                    if (settled) return;
                    settled = true;
                    resolve();
                };
                setTimeout(done, 3000);
                try {
                    if (typeof dataset.onReady === 'function') {
                        dataset.onReady(done);
                    } else {
                        done();
                    }
                } catch (e) {
                    done();
                }
            });
            try {
                const item = dataset.getCurrentItem();
                if (item && (item.countySlug || item.countyName)) {
                    return item;
                }
            } catch (e) { /* fallback to query */ }
        }
    }

    const pathSegments = (locApi && Array.isArray(locApi.path)) ? locApi.path : [];
    const slug = pathSegments.length > 0 ? String(pathSegments[pathSegments.length - 1] || '').trim().toLowerCase() : '';
    if (!slug) return null;

    try {
        const res = await dataApi
            .query(COUNTIES_COLLECTION)
            .eq('countySlug', slug)
            .limit(1)
            .find();
        if (res && Array.isArray(res.items) && res.items.length > 0) {
            return res.items[0];
        }
    } catch (e) { /* return minimal slug item */ }

    return { countySlug: slug };
}

/**
 * Initialize the County FAQ section and JSON-LD structured data on ygoim.
 * Immediately clears Editor default repeater data and collapses until validated FAQs are ready.
 *
 * @param {Function} $wFn
 * @param {typeof wixData} [dataApi]
 * @param {typeof wixLocationFrontend} [locApi]
 * @param {typeof wixSeoFrontend} [seoApi]
 * @returns {Promise<Array<{ _id: string, title: string, answer: string }>>}
 */
export async function initCountyFaqSection($wFn = $w, dataApi = wixData, locApi = wixLocationFrontend, seoApi = wixSeoFrontend) {
    const repeater = safeSelect($wFn, '#countyFaqRepeater');
    const heading = safeSelect($wFn, '#text65');

    // Immediately clear Editor default repeater items and collapse to prevent placeholder flash or 375px layout shift
    if (repeater) {
        try { repeater.data = []; } catch (e) { /* noop */ }
        collapseNode(repeater);
    }
    collapseNode(heading);

    let countyItemForSeo = null;
    try {
        const countyItem = await readCurrentFloridaCountyItem($wFn, dataApi, locApi);
        if (!countyItem) {
            return [];
        }
        countyItemForSeo = countyItem;

        const faqs = await queryCountyFaqs(countyItem, dataApi);

        if (!faqs || faqs.length === 0) {
            if (repeater) {
                try { repeater.data = []; } catch (e) { /* noop */ }
                collapseNode(repeater);
            }
            collapseNode(heading);
            await applyCountyPageStructuredData(countyItem, [], seoApi);
            return [];
        }

        let rendered = false;
        if (repeater) {
            try {
                if (typeof repeater.onItemReady === 'function') {
                    repeater.onItemReady(($item, itemData) => {
                        bindFaqRepeaterItem($item, itemData);
                    });
                }
                repeater.data = faqs;
                rendered = true;
            } catch (e) { /* noop */ }
            if (rendered) {
                expandNode(heading);
                expandNode(repeater);
            } else {
                collapseNode(repeater);
                collapseNode(heading);
            }
        }

        // FAQPage must mirror what is visible: only emit it when the repeater actually rendered the FAQs.
        await applyCountyPageStructuredData(countyItem, rendered ? faqs : [], seoApi);
        return rendered ? faqs : [];
    } catch (err) {
        if (repeater) {
            try { repeater.data = []; } catch (e) { /* noop */ }
            collapseNode(repeater);
        }
        collapseNode(heading);
        if (countyItemForSeo) {
            try { await applyCountyPageStructuredData(countyItemForSeo, [], seoApi); } catch (e) { /* noop */ }
        }
        return [];
    }
}

/** Remove a leading heading from CMS about HTML so the title element stays the only one. */
function stripLeadingHeading(html) {
    if (!html || typeof html !== 'string') return html;
    return html.replace(/^\s*<h[12]\b[^>]*>[\s\S]*?<\/h[12]>\s*/i, '');
}

function setText(selectorOrArray, value) {
    const selectors = Array.isArray(selectorOrArray) ? selectorOrArray : [selectorOrArray];
    for (let i = 0; i < selectors.length; i++) {
        const el = safeSelect($w, selectors[i]);
        if (!el) continue;
        try {
            if ('text' in el) {
                el.text = value || '';
                if (typeof el.expand === 'function') el.expand();
            }
        } catch (e) { /* missing element */ }
    }
}

function setRichText(selectorOrArray, plain, html) {
    const selectors = Array.isArray(selectorOrArray) ? selectorOrArray : [selectorOrArray];
    for (let i = 0; i < selectors.length; i++) {
        const el = safeSelect($w, selectors[i]);
        if (!el) continue;
        try {
            if (html && typeof el.html === 'string') {
                el.html = html;
                if (typeof el.expand === 'function') el.expand();
                return true;
            }
            if ('text' in el) {
                el.text = plain || '';
                if (typeof el.expand === 'function') el.expand();
                return true;
            }
        } catch (e) { /* try the next candidate */ }
    }
    return false;
}

/** Demote an Editor H1 inside rich text so the hero stays the only H1. */
function demoteHeadingTag(selectorOrArray, fromTag, toTag) {
    const selectors = Array.isArray(selectorOrArray) ? selectorOrArray : [selectorOrArray];
    const openFrom = new RegExp('<' + fromTag + '\\b', 'gi');
    const closeFrom = new RegExp('</' + fromTag + '>', 'gi');
    for (let i = 0; i < selectors.length; i++) {
        const el = safeSelect($w, selectors[i]);
        if (!el || typeof el.html !== 'string' || !el.html) continue;
        try {
            if (!openFrom.test(el.html)) continue;
            openFrom.lastIndex = 0;
            el.html = el.html.replace(openFrom, '<' + toTag).replace(closeFrom, '</' + toTag + '>');
        } catch (e) { /* missing element */ }
    }
}

/** About copy plus one crawlable anchor for each of the 67 counties. */
function aboutHtmlWithDirectory(html, county) {
    const body = applyLeeDowntownBooking(html, county);
    let directory = '';
    try { directory = buildFloridaCountyDirectoryHtml(); } catch (e) { return body; }
    if (!directory || body.indexOf('/florida-bail-bonds/bradford') !== -1) return body;
    return body + directory;
}

/**
 * Dataset refresh can restore a CMS-bound H1. Re-apply the hero when the
 * dataset exists. #dynamicDataset and #countyDataset are not confirmed on
 * the Layers panel, so a missing dataset is a no-op.
 */
function reapplyHeroAfterDataset(generatedCounty) {
    const datasetSelectors = ['#dynamicDataset', '#countyDataset'];
    for (let i = 0; i < datasetSelectors.length; i++) {
        const dataset = safeSelect($w, datasetSelectors[i]);
        if (!dataset || typeof dataset.onReady !== 'function') continue;
        try {
            dataset.onReady(function () {
                setText(HERO_TEXT_IDS, resolvePrimaryHeroH1(generatedCounty));
            });
        } catch (e) { /* dataset not on this canvas */ }
    }
}

async function paintCountyHeroAndAbout() {
    const path = (wixLocationFrontend && Array.isArray(wixLocationFrontend.path))
        ? wixLocationFrontend.path
        : [];
    const countySlug = path.length > 0 ? String(path[path.length - 1] || '').trim() : '';
    if (!countySlug) return;

    let generatedCounty = null;
    try {
        const pageResult = await generateCountyPage(countySlug.toLowerCase());
        const data = pageResult && pageResult.data;
        if (!pageResult || !pageResult.success || !data) return;
        const county = softenLeeCountyPage(data);
        generatedCounty = county;
        const content = county.content || {};
        setText(HERO_TEXT_IDS, resolvePrimaryHeroH1(county));
        setText(HERO_SUB_IDS, applyLeeDowntownBooking(content.hero_subheadline, county));
        const aboutTitle = county.landing_type === 'city' || county.landing_type === 'jail'
            ? `About Bail Bonds in ${county.display_name || county.county_name}`
            : `About Bail Bonds in ${county.parent_county_name || county.county_name} County, Florida`;
        setText(ABOUT_TITLE_IDS, aboutTitle);
        demoteHeadingTag(ABOUT_TITLE_IDS, 'h1', 'h2');
        const aboutHtmlBody = stripLeadingHeading(content.about_html);
        setRichText(
            ABOUT_HTML_IDS,
            applyLeeDowntownBooking(content.about_county, county),
            aboutHtmlWithDirectory(aboutHtmlBody || content.about_html, county)
        );
        reapplyHeroAfterDataset(generatedCounty);
    } catch (e) {
        console.warn('[County] hero and about failed', e);
    }
}

$w.onReady(function () {
    const faq = initCountyFaqSection($w, wixData, wixLocationFrontend, wixSeoFrontend);
    const hero = paintCountyHeroAndAbout();
    return Promise.all([faq, hero]);
});
