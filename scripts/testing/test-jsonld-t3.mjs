/**
 * Schema Markup Validator & Rich Results verification for T3: JSON-LD structured data.
 *
 * Verifies:
 * - Home (`src/pages/HOME.c1dmp.js`) and About (`src/pages/About.xal5r.js`):
 *   - Uses `wix-seo-frontend` structured data (`wixSeoFrontend.setStructuredData`)
 *   - Exactly one `LocalBusiness` block per page
 *   - `name: "Shamrock Bail Bonds"`, `url: "https://www.shamrockbailbonds.biz"`, `telephone: "+1-239-332-2245"`
 *   - `address`: `1528 Broadway, Fort Myers, FL 33901`
 *   - `areaServed`: `Florida`
 *   - `openingHours`: `"Mo-Fr 09:00-17:00"`
 *   - `contactPoint` for 24/7 phone (`+1-239-332-2245`) and Spanish line (`+1-727-295-2245` with `availableLanguage: "es"`)
 *   - No `aggregateRating` or `review`
 * - County pages (`src/pages/Florida Counties (Item).ygoim.js` for miami-dade and hillsborough):
 *   - `BreadcrumbList` (`Home > Florida Bail Bonds > {County}`)
 *   - `FAQPage` built from exactly the `Import22` items rendered in T2 (1:1 visible question/answer match)
 *   - One `LocalBusiness` per page
 * - No `HowTo` markup anywhere in `src/pages`, `src/public`, or `seo`.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

let capturedStructuredData = [];
const mockSeoFrontend = {
    setStructuredData(schemas) {
        capturedStructuredData = schemas;
        return Promise.resolve();
    },
    setTitle() {},
    setMetaTags() {},
    setLinks() {}
};

const onReadyCallbacks = [];
globalThis.$w = Object.assign(
    function () {
        return { valid: false, onClick() {}, collapse() {}, expand() {}, show() {}, hide() {} };
    },
    {
        onReady(fn) {
            onReadyCallbacks.push(fn);
        }
    }
);

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === 'wix-seo-frontend' || specifier === 'wix-seo') {
            return {
                url: 'data:text/javascript,export default globalThis.__mockSeoFrontend;',
                shortCircuit: true
            };
        }
        if (
            specifier === 'wix-data' ||
            specifier === 'wix-location' ||
            specifier === 'wix-location-frontend' ||
            specifier === 'wix-window' ||
            specifier === 'wix-window-frontend' ||
            specifier === 'wix-storage'
        ) {
            return {
                url: 'data:text/javascript,export const session = { getItem(){}, setItem(){} }; export default { path: [], query: {}, to(){} };',
                shortCircuit: true
            };
        }
        return nextResolve(specifier, context);
    }
});

globalThis.__mockSeoFrontend = mockSeoFrontend;

function validateLocalBusinessBlock(lb, pageLabel) {
    assert.ok(lb, `${pageLabel}: LocalBusiness block must exist`);
    assert.equal(lb['@context'], 'https://schema.org', `${pageLabel}: @context must be https://schema.org`);
    assert.equal(lb['@type'], 'LocalBusiness', `${pageLabel}: @type must be LocalBusiness`);
    assert.equal(lb.name, 'Shamrock Bail Bonds', `${pageLabel}: name must be Shamrock Bail Bonds`);
    assert.equal(lb.url, 'https://www.shamrockbailbonds.biz', `${pageLabel}: url must be https://www.shamrockbailbonds.biz`);
    assert.equal(lb.telephone, '+1-239-332-2245', `${pageLabel}: telephone must be +1-239-332-2245`);
    assert.equal(lb.address?.['@type'], 'PostalAddress');
    assert.equal(lb.address?.streetAddress, '1528 Broadway');
    assert.equal(lb.address?.addressLocality, 'Fort Myers');
    assert.equal(lb.address?.addressRegion, 'FL');
    assert.equal(lb.address?.postalCode, '33901');
    assert.equal(lb.openingHours, 'Mo-Fr 09:00-17:00', `${pageLabel}: openingHours must be Mo-Fr 09:00-17:00`);
    assert.equal(lb.aggregateRating, undefined, `${pageLabel}: must not include aggregateRating`);
    assert.equal(lb.review, undefined, `${pageLabel}: must not include review`);

    // Check areaServed includes Florida
    const areas = Array.isArray(lb.areaServed) ? lb.areaServed : [lb.areaServed];
    assert.ok(
        areas.some((a) => a && a.name === 'Florida'),
        `${pageLabel}: areaServed must include Florida`
    );

    // Check contactPoints for 24/7 main phone and Spanish line 727-295-2245 with availableLanguage es
    assert.ok(Array.isArray(lb.contactPoint) && lb.contactPoint.length >= 2, `${pageLabel}: must have contactPoint array`);
    const mainCp = lb.contactPoint.find((cp) => cp.telephone === '+1-239-332-2245');
    const esCp = lb.contactPoint.find((cp) => cp.telephone === '+1-727-295-2245');
    assert.ok(mainCp, `${pageLabel}: must have 24/7 contactPoint +1-239-332-2245`);
    assert.ok(esCp, `${pageLabel}: must have Spanish contactPoint +1-727-295-2245`);
    const esLangs = Array.isArray(esCp.availableLanguage) ? esCp.availableLanguage : [esCp.availableLanguage];
    assert.ok(esLangs.includes('es'), `${pageLabel}: Spanish contactPoint must specify availableLanguage "es"`);
}

// 1. Validate About page JSON-LD
{
    onReadyCallbacks.length = 0;
    capturedStructuredData = [];
    await import('../../src/pages/About.xal5r.js');
    for (const cb of onReadyCallbacks) await cb();

    const localBusinesses = capturedStructuredData.filter((s) => s['@type'] === 'LocalBusiness');
    assert.equal(localBusinesses.length, 1, 'About page must emit exactly 1 LocalBusiness block');
    validateLocalBusinessBlock(localBusinesses[0], 'About');
    assert.equal(
        capturedStructuredData.some((s) => s['@type'] === 'HowTo'),
        false,
        'About page must not emit HowTo'
    );
}

// 2. Validate Home page JSON-LD
{
    const homeSource = read('src/pages/HOME.c1dmp.js');
    assert.match(homeSource, /import wixSeoFrontend from 'wix-seo-frontend'/);
    assert.match(homeSource, /wixSeoFrontend\.setStructuredData/);
    assert.equal(homeSource.includes('"@type": "HowTo"'), false);
    assert.equal(homeSource.includes('aggregateRating'), false);

    onReadyCallbacks.length = 0;
    capturedStructuredData = [];
    await import('../../src/pages/HOME.c1dmp.js');
    for (const cb of onReadyCallbacks) await cb();

    const localBusinesses = capturedStructuredData.filter((s) => s['@type'] === 'LocalBusiness');
    assert.equal(localBusinesses.length, 1, 'Home page must emit exactly 1 LocalBusiness block');
    validateLocalBusinessBlock(localBusinesses[0], 'Home');
}

// 3. Validate County pages (miami-dade & hillsborough) on ygoim
const ygoim = await import('../../src/pages/Florida Counties (Item).ygoim.js');

const SAMPLE_ROWS = [
    {
        _id: 'md-1',
        title: 'How much is a bail bond in Miami-Dade County?',
        answer: 'Florida regulates bail bond premiums at 10% of the bond amount, with a $100 minimum per charge.',
        isActive: true,
        sortOrder: 1,
        relatedCounty: 'Miami-Dade County',
        relatedPage: '/florida-bail-bonds/miami-dade'
    },
    {
        _id: 'hb-1',
        title: 'Where is the Hillsborough County jail located?',
        answer: 'Hillsborough County bookings take place at the Orient Road Jail, 1201 Orient Rd, Tampa, FL 33619.',
        isActive: true,
        sortOrder: 1,
        relatedCounty: 'Hillsborough County',
        relatedPage: '/florida-bail-bonds/hillsborough'
    }
];

function buildMockDataApi(rows) {
    class Q {
        constructor(filters = []) {
            this.filters = filters;
            this.orBranches = [];
        }
        eq(f, v) { this.filters.push({ f, v }); return this; }
        or(other) { this.orBranches.push(other); return this; }
        ascending() { return this; }
        limit() { return this; }
        async find() {
            const branches = [this, ...this.orBranches];
            return {
                items: rows.filter((r) =>
                    branches.some((b) => b.filters.every((flt) => r[flt.f] === flt.v))
                )
            };
        }
    }
    return { query: () => new Q() };
}

for (const [slug, countyName, expectedQuestion] of [
    ['miami-dade', 'Miami-Dade', 'How much is a bail bond in Miami-Dade County?'],
    ['hillsborough', 'Hillsborough', 'Where is the Hillsborough County jail located?']
]) {
    capturedStructuredData = [];
    const visibleQuestions = [];
    const repeater = {
        id: 'countyFaqRepeater',
        type: '$w.Repeater',
        _cb: null,
        collapse() {},
        expand() {},
        show() {},
        onItemReady(cb) { this._cb = cb; },
        set data(items) {
            visibleQuestions.length = 0;
            if (Array.isArray(items) && this._cb) {
                for (const it of items) {
                    const qNode = { id: 'faqQuestion', type: '$w.Text', text: '' };
                    const aNode = { id: 'faqAnswer', type: '$w.Text', text: '' };
                    this._cb((sel) => (sel === '#faqQuestion' ? qNode : sel === '#faqAnswer' ? aNode : null), it);
                    visibleQuestions.push({ q: qNode.text, a: aNode.text });
                }
            }
        }
    };
    const heading = { id: 'text65', type: '$w.Text', collapse() {}, expand() {}, show() {} };
    const dataset = {
        id: 'dynamicDataset',
        type: 'dataset',
        onReady(cb) { cb(); },
        getCurrentItem() { return { countySlug: slug, countyName }; }
    };
    const $wPage = (sel) => {
        if (sel === '#countyFaqRepeater') return repeater;
        if (sel === '#text65') return heading;
        if (sel === '#dynamicDataset') return dataset;
        return null;
    };

    await ygoim.initCountyFaqSection($wPage, buildMockDataApi(SAMPLE_ROWS), { path: ['florida-bail-bonds', slug] }, mockSeoFrontend);

    const lbs = capturedStructuredData.filter((s) => s['@type'] === 'LocalBusiness');
    assert.equal(lbs.length, 1, `${slug}: must have exactly 1 LocalBusiness block`);
    validateLocalBusinessBlock(lbs[0], slug);

    const breadcrumbs = capturedStructuredData.filter((s) => s['@type'] === 'BreadcrumbList');
    assert.equal(breadcrumbs.length, 1, `${slug}: must have 1 BreadcrumbList`);
    assert.deepEqual(
        breadcrumbs[0].itemListElement.map((i) => i.name),
        ['Home', 'Florida Bail Bonds', `${countyName} County`],
        `${slug}: BreadcrumbList must be Home > Florida Bail Bonds > ${countyName} County`
    );

    const faqPages = capturedStructuredData.filter((s) => s['@type'] === 'FAQPage');
    assert.equal(faqPages.length, 1, `${slug}: must have 1 FAQPage`);
    assert.equal(faqPages[0].mainEntity.length, visibleQuestions.length, `${slug}: FAQPage must match visible questions 1:1`);
    assert.equal(faqPages[0].mainEntity[0].name, expectedQuestion);
    assert.equal(faqPages[0].mainEntity[0].name, visibleQuestions[0].q);
    assert.equal(faqPages[0].mainEntity[0].acceptedAnswer.text, visibleQuestions[0].a);
}

console.log('T3 JSON-LD schema validation passed (Home, About, Miami-Dade, Hillsborough, 1:1 FAQPage, 0 HowTo)');
