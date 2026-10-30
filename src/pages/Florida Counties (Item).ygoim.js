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

const FAQ_COLLECTION = 'Import22';
const COUNTIES_COLLECTION = 'FloridaCounties';
const FAQ_LIMIT = 15;

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

    const rawName = String((item && item.countyName) || '')
        .trim()
        .replace(/\s+County$/i, '')
        .trim();

    const derivedName = rawName || rawSlug
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

    return {
        countySlug: rawSlug,
        countyName: derivedName,
        relatedPage: rawSlug ? `/florida-bail-bonds/${rawSlug}` : '',
        relatedCounty: derivedName ? `${derivedName} County` : ''
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
        .limit(FAQ_LIMIT)
        .find();

    const rawItems = (result && Array.isArray(result.items)) ? result.items : [];
    const seen = new Set();
    const validItems = [];

    for (let i = 0; i < rawItems.length; i++) {
        const row = rawItems[i];
        if (!isValidFaqRow(row)) continue;

        // Verify strict match to this county's relatedPage or relatedCounty
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
 * Note: Repeater child text IDs (#faqQuestion, #faqAnswer) are listed for Brendan to confirm in Studio.
 * @param {Function} $item
 * @param {{ title: string, answer: string }} itemData
 */
export function bindFaqRepeaterItem($item, itemData) {
    const questionText = String((itemData && itemData.title) || '').trim();
    const answerText = String((itemData && itemData.answer) || '').trim();

    const questionSelectors = ['#faqQuestion', '#questionText', '#faqTitle'];
    const answerSelectors = ['#faqAnswer', '#answerText', '#faqBody'];

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

    // If Studio assigned default Text IDs inside the repeater item, inspect child elements
    // so "Question", "Answer", "Heading 6", or "Add paragraph text" never remain visible.
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
 * Initialize the County FAQ section on ygoim.
 * Immediately clears Editor default repeater data and collapses until validated FAQs are ready.
 *
 * @param {Function} $wFn
 * @param {typeof wixData} [dataApi]
 * @param {typeof wixLocationFrontend} [locApi]
 * @returns {Promise<Array<{ _id: string, title: string, answer: string }>>}
 */
export async function initCountyFaqSection($wFn = $w, dataApi = wixData, locApi = wixLocationFrontend) {
    const repeater = safeSelect($wFn, '#countyFaqRepeater');
    const heading = safeSelect($wFn, '#text65');

    // Immediately clear Editor default repeater items and collapse to prevent placeholder flash or 375px layout shift
    if (repeater) {
        try { repeater.data = []; } catch (e) { /* noop */ }
        collapseNode(repeater);
    }
    collapseNode(heading);

    try {
        const countyItem = await readCurrentFloridaCountyItem($wFn, dataApi, locApi);
        if (!countyItem) {
            return [];
        }

        const faqs = await queryCountyFaqs(countyItem, dataApi);

        if (!faqs || faqs.length === 0) {
            if (repeater) {
                try { repeater.data = []; } catch (e) { /* noop */ }
                collapseNode(repeater);
            }
            collapseNode(heading);
            return [];
        }

        if (repeater) {
            try {
                if (typeof repeater.onItemReady === 'function') {
                    repeater.onItemReady(($item, itemData) => {
                        bindFaqRepeaterItem($item, itemData);
                    });
                }
                repeater.data = faqs;
            } catch (e) { /* noop */ }
            expandNode(heading);
            expandNode(repeater);
        }

        return faqs;
    } catch (err) {
        if (repeater) {
            try { repeater.data = []; } catch (e) { /* noop */ }
            collapseNode(repeater);
        }
        collapseNode(heading);
        return [];
    }
}

$w.onReady(function () {
    return initCountyFaqSection($w, wixData, wixLocationFrontend);
});
