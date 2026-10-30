/**
 * Unit & integration verification for T2: County FAQ repeater on ygoim
 * (`src/pages/Florida Counties (Item).ygoim.js`).
 *
 * Verifies:
 * 1. Reads current FloridaCounties item from dataset.
 * 2. Queries Import22 where isActive = true and (relatedPage = "/florida-bail-bonds/" + countySlug OR relatedCounty = countyName + " County"), sort sortOrder asc, limit 15.
 * 3. Preview of /florida-bail-bonds/miami-dade and /florida-bail-bonds/hillsborough shows only that county's FAQs.
 * 4. County with 0 FAQs collapses #countyFaqRepeater (comp-mvseipzo) and #text65 (comp-mvsebxpk).
 * 5. Editor default items ("Question", "Answer", "Heading 6", "Add paragraph text") never render.
 */

import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Mock global $w before importing the Velo page file
let registeredOnReady = null;
globalThis.$w = Object.assign(
    function () { return null; },
    {
        onReady(fn) {
            registeredOnReady = fn;
        }
    }
);

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === 'wix-data' || specifier === 'wix-location-frontend') {
            return {
                url: `data:text/javascript,export default {};`,
                shortCircuit: true
            };
        }
        return nextResolve(specifier, context);
    }
});

const ygoimModule = await import('../../src/pages/Florida Counties (Item).ygoim.js');
const {
    buildCountyFaqFilterTargets,
    isValidFaqRow,
    queryCountyFaqs,
    bindFaqRepeaterItem,
    initCountyFaqSection
} = ygoimModule;

assert.equal(typeof registeredOnReady, 'function', '$w.onReady must be registered by ygoim page');

// Mock Import22 dataset rows
const MOCK_IMPORT22_ROWS = [
    {
        _id: 'md-2',
        title: 'Where is First Appearance held in Miami-Dade County?',
        answer: 'Under Fla. R. Crim. P. 3.130, First Appearance is held within 24 hours of arrest at the Richard E. Gerstein Justice Building in Miami.',
        isActive: true,
        sortOrder: 2,
        relatedCounty: 'Miami-Dade County',
        relatedPage: '/florida-bail-bonds/miami-dade'
    },
    {
        _id: 'md-1',
        title: 'How much is a bail bond in Miami-Dade County?',
        answer: 'Florida regulates bail bond premiums at 10% of the bond amount, with a $100 minimum per charge.',
        isActive: true,
        sortOrder: 1,
        relatedCounty: 'Miami-Dade County',
        relatedPage: ''
    },
    {
        _id: 'md-inactive',
        title: 'Inactive Miami-Dade question?',
        answer: 'Should never appear.',
        isActive: false,
        sortOrder: 0,
        relatedCounty: 'Miami-Dade County',
        relatedPage: '/florida-bail-bonds/miami-dade'
    },
    {
        _id: 'md-placeholder',
        title: 'Question',
        answer: 'Add paragraph text',
        isActive: true,
        sortOrder: 3,
        relatedCounty: 'Miami-Dade County',
        relatedPage: '/florida-bail-bonds/miami-dade'
    },
    {
        _id: 'hb-1',
        title: 'Where is the Hillsborough County jail located?',
        answer: 'Hillsborough County bookings take place at the Orient Road Jail, 1201 Orient Rd, Tampa, FL 33619.',
        isActive: true,
        sortOrder: 1,
        relatedCounty: '',
        relatedPage: '/florida-bail-bonds/hillsborough'
    },
    {
        _id: 'hb-2',
        title: 'How do I contact Shamrock Bail Bonds for a Hillsborough County arrest?',
        answer: 'Call 239-332-2245 (24/7), Español 727-295-2245, or text 239-955-0178.',
        isActive: true,
        sortOrder: 2,
        relatedCounty: 'Hillsborough County',
        relatedPage: '/florida-bail-bonds/hillsborough'
    }
];

function createMockWixData(rows) {
    class MockQuery {
        constructor(collection, filters = []) {
            this.collection = collection;
            this.filters = filters;
            this.orBranches = [];
            this.sortField = null;
            this.limitCount = 50;
        }
        eq(field, value) {
            this.filters.push({ field, value });
            return this;
        }
        or(otherQuery) {
            this.orBranches.push(otherQuery);
            return this;
        }
        ascending(field) {
            this.sortField = field;
            return this;
        }
        limit(n) {
            this.limitCount = n;
            return this;
        }
        matchesBranch(row, branch) {
            return branch.filters.every((f) => row[f.field] === f.value);
        }
        async find() {
            const branches = [this, ...this.orBranches];
            let matched = rows.filter((row) => branches.some((b) => this.matchesBranch(row, b)));
            if (this.sortField) {
                matched = matched.slice().sort((a, b) => (a[this.sortField] ?? 999) - (b[this.sortField] ?? 999));
            }
            return { items: matched.slice(0, this.limitCount) };
        }
    }
    return {
        query(collection) {
            assert.equal(collection, 'Import22', 'Must query Import22 collection');
            return new MockQuery(collection);
        }
    };
}

function createMockPageEnv(countyItem) {
    const renderedItems = [];
    let itemReadyCallback = null;

    const repeater = {
        id: 'countyFaqRepeater',
        type: '$w.Repeater',
        collapsed: false,
        // Simulate Wix Editor default items initially present
        _data: [
            { _id: 'default-1', title: 'Question', answer: 'Answer' },
            { _id: 'default-2', title: 'Heading 6', answer: 'Add paragraph text' }
        ],
        collapse() { this.collapsed = true; },
        expand() { this.collapsed = false; },
        show() { this.collapsed = false; },
        onItemReady(cb) { itemReadyCallback = cb; },
        get data() { return this._data; },
        set data(items) {
            this._data = items;
            renderedItems.length = 0;
            if (Array.isArray(items) && itemReadyCallback) {
                for (const itemData of items) {
                    const qNode = { id: 'faqQuestion', type: '$w.Text', text: 'Heading 6', collapsed: false };
                    const aNode = { id: 'faqAnswer', type: '$w.Text', text: 'Add paragraph text', collapsed: false };
                    const extraPlaceholder = { id: 'text99', type: '$w.Text', text: 'Question', collapsed: false, collapse() { this.collapsed = true; } };
                    const $item = (sel) => {
                        if (sel === '#faqQuestion') return qNode;
                        if (sel === '#faqAnswer') return aNode;
                        if (sel === 'Text') return [qNode, aNode, extraPlaceholder];
                        return null;
                    };
                    itemReadyCallback($item, itemData);
                    renderedItems.push({ qNode, aNode, extraPlaceholder });
                }
            }
        }
    };

    const heading = {
        id: 'text65',
        type: '$w.Text',
        text: 'Questions families ask',
        collapsed: false,
        collapse() { this.collapsed = true; },
        expand() { this.collapsed = false; },
        show() { this.collapsed = false; }
    };

    const dataset = {
        id: 'dynamicDataset',
        type: 'dataset',
        onReady(cb) { cb(); },
        getCurrentItem() { return countyItem; }
    };

    const $wMock = (selector) => {
        if (selector === '#countyFaqRepeater') return repeater;
        if (selector === '#text65') return heading;
        if (selector === '#dynamicDataset') return dataset;
        return null;
    };

    return { $wMock, repeater, heading, renderedItems };
}

// 1. Test Miami-Dade (/florida-bail-bonds/miami-dade)
{
    const miamiEnv = createMockPageEnv({
        countyName: 'Miami-Dade',
        countySlug: 'miami-dade'
    });
    const faqs = await initCountyFaqSection(
        miamiEnv.$wMock,
        createMockWixData(MOCK_IMPORT22_ROWS),
        { path: ['florida-bail-bonds', 'miami-dade'] }
    );
    assert.equal(faqs.length, 2, 'Miami-Dade should return exactly its 2 active non-placeholder FAQs');
    assert.equal(faqs[0]._id, 'md-1', 'Miami-Dade FAQs must be sorted by sortOrder asc');
    assert.equal(faqs[1]._id, 'md-2');
    assert.equal(miamiEnv.repeater.collapsed, false, '#countyFaqRepeater must be expanded for Miami-Dade');
    assert.equal(miamiEnv.heading.collapsed, false, '#text65 must be expanded for Miami-Dade');
    assert.equal(miamiEnv.renderedItems.length, 2);
    for (const r of miamiEnv.renderedItems) {
        assert.ok(!/^(question|answer|heading\s*\d*|add paragraph text\.?)$/i.test(r.qNode.text));
        assert.ok(!/^(question|answer|heading\s*\d*|add paragraph text\.?)$/i.test(r.aNode.text));
        assert.equal(r.extraPlaceholder.text, '', 'Editor placeholder text must be scrubbed');
    }
}

// 2. Test Hillsborough (/florida-bail-bonds/hillsborough)
{
    const hillsEnv = createMockPageEnv({
        countyName: 'Hillsborough County', // handles trailing " County" without doubling
        countySlug: 'hillsborough'
    });
    const targets = buildCountyFaqFilterTargets({
        countyName: 'Hillsborough County',
        countySlug: 'hillsborough'
    });
    assert.equal(targets.relatedCounty, 'Hillsborough County');
    assert.equal(targets.relatedPage, '/florida-bail-bonds/hillsborough');

    const faqs = await initCountyFaqSection(
        hillsEnv.$wMock,
        createMockWixData(MOCK_IMPORT22_ROWS),
        { path: ['florida-bail-bonds', 'hillsborough'] }
    );
    assert.equal(faqs.length, 2, 'Hillsborough should return only Hillsborough FAQs');
    assert.equal(faqs[0]._id, 'hb-1');
    assert.equal(faqs[1]._id, 'hb-2');
    assert.equal(hillsEnv.repeater.collapsed, false);
    assert.equal(hillsEnv.heading.collapsed, false);
}

// 3. Test county with 0 FAQs (e.g. Liberty County)
{
    const zeroEnv = createMockPageEnv({
        countyName: 'Liberty',
        countySlug: 'liberty'
    });
    const faqs = await initCountyFaqSection(
        zeroEnv.$wMock,
        createMockWixData(MOCK_IMPORT22_ROWS),
        { path: ['florida-bail-bonds', 'liberty'] }
    );
    assert.equal(faqs.length, 0, 'Liberty County should return 0 FAQs');
    assert.equal(zeroEnv.repeater.data.length, 0, 'Editor default items must be cleared on 0-FAQ county');
    assert.equal(zeroEnv.repeater.collapsed, true, '#countyFaqRepeater must be collapsed when 0 items');
    assert.equal(zeroEnv.heading.collapsed, true, '#text65 must be collapsed when 0 items');
    assert.equal(zeroEnv.renderedItems.length, 0, 'No repeater items rendered when 0 FAQs');
}

console.log('T2 county FAQ repeater tests passed (miami-dade, hillsborough, 0-FAQ collapse, placeholder guard)');
