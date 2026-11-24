// Guards the "Nearby Florida counties" box (#box45 / comp-mvsikr70) on the
// county item page and the class-based WCAG AA green button fills that
// replace PR #121's #comp- rules (Wix rewrites #comp- selectors in global.css).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyAaButtonFill, AA_BUTTONS, AA_FILL_CLASS, AA_SOLID_CLASS } from '../src/public/aaButtonFill.js';
import { FLORIDA_CITY_PAGES } from '../src/public/floridaCountyDirectory.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const src = read('src/pages/Florida Counties (Item).ygoim.js');
const css = read('src/styles/global.css');
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

test('global.css has no #comp- selectors left (they never apply)', () => {
    assert.doesNotMatch(noComments(css), /#comp-/);
});

test('global.css: class-based AA fills', () => {
    assert.match(css, /\.btn-green-aa \{[^}]*--bg: 0, 122, 81 !important;[^}]*--bgh: 0, 102, 68 !important;/);
    assert.match(css, /\.btn-green-aa-solid \{[^}]*background-color: #007A51 !important;/);
    assert.match(css, /\.btn-green-aa-solid:hover \{[^}]*background-color: #006644 !important;/);
});

test('global.css: nearby box shown full width, links readable', () => {
    assert.match(css, /\.county-nearby-box \{[^}]*--l_display: initial !important;[^}]*width: 100% !important;/);
    assert.match(css, /\.county-nearby-links a \{[^}]*font-size: clamp\(16px/);
});

test('applyAaButtonFill adds the classes and skips missing ids', () => {
    const added = {};
    const $w = (sel) => {
        if (sel === '#missing') throw new Error('no element');
        return { customClassList: { add: (c) => { added[sel] = c; } } };
    };
    assert.equal(applyAaButtonFill($w, { fill: ['#button5', '#missing'], solid: ['#startBondButton'] }), 2);
    assert.deepEqual(added, { '#button5': AA_FILL_CLASS, '#startBondButton': AA_SOLID_CLASS });
    assert.equal(applyAaButtonFill(null, AA_BUTTONS.home), 0);
});

test('each page wires its AA buttons (Studio nicknames, ids unchanged)', () => {
    const pages = {
        'src/pages/Home.c1dmp.js': 'home',
        'src/pages/Contact.rvjs8.js': 'contact',
        'src/pages/How Bail Works.sc4i4.js': 'howBailWorks',
        'src/pages/Bail School.i7eev.js': 'bailSchool',
        'src/pages/Florida Counties (Item).ygoim.js': 'countyItem'
    };
    for (const [file, key] of Object.entries(pages)) {
        const s = read(file);
        assert.match(s, /import \{ applyAaButtonFill, AA_BUTTONS \} from 'public\/aaButtonFill';/, file);
        assert.match(s, new RegExp(`applyAaButtonFill\\(\\$w, AA_BUTTONS\\.${key}\\)`), file);
    }
    assert.deepEqual(AA_BUTTONS.home, { fill: ['#button2'], solid: ['#startBondButton'] });
    assert.deepEqual(AA_BUTTONS.countyItem.fill, ['#startOnlineBtn']);
});

test('page code shows #box45 with classes when it has links', () => {
    assert.match(src, /safeSelect\(\$wFn, '#box45'\)/);
    assert.match(src, /addCustomClass\(nearbyBox, 'county-nearby-box'\)/);
    assert.match(src, /addCustomClass\(linksText, 'county-nearby-links'\)/);
    assert.match(src, /expandNode\(nearbyBox\)/);
});

test('city/jail pages use the parent county and its neighbors', async () => {
    const m = src.match(/export async function buildParentCountyNeighborLinksHtml[\s\S]*?\n}\n/);
    assert.ok(m);
    const neighbors = async (item) => (item.countySlug === 'hillsborough'
        ? '<ul><li><a href="/florida-bail-bonds/pasco">Pasco County bail bonds</a></li></ul>' : '');
    const fn = new Function('FLORIDA_CITY_PAGES', 'COUNTIES_COLLECTION', 'buildNeighborLinksHtml', 'wixData',
        `${m[0].replace('export ', '')}\nreturn buildParentCountyNeighborLinksHtml;`)(FLORIDA_CITY_PAGES, 'FloridaCounties', neighbors, null);
    const dataApi = {
        query: () => {
            const q = { slug: '' };
            const chain = {
                eq: (f, v) => { q.slug = v; return chain; },
                limit: () => chain,
                find: async () => ({ items: q.slug === 'hillsborough' ? [{ _id: 'h', countySlug: 'hillsborough', countyName: 'Hillsborough' }] : [] })
            };
            return chain;
        }
    };
    assert.equal(await fn('tampa', dataApi),
        '<ul><li><a href="/florida-bail-bonds/hillsborough">Hillsborough County bail bonds</a></li><li><a href="/florida-bail-bonds/pasco">Pasco County bail bonds</a></li></ul>');
    assert.equal(await fn('lee', dataApi), '');
    assert.equal(await fn('tampa', null), '');
});
