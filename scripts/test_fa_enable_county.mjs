/**
 * First Appearance per-county switch, end to end through the real page code.
 *
 * The "first-appearance" router is not active on the Studio site, so the
 * static page's code (src/pages/First Appearance.eo050.js) is what sets SEO.
 * This loads that file with stubbed Wix modules and an own-content map, runs
 * its $w.onReady handler for a URL, waits for the promise onReady returns
 * (what Wix SSR waits for), and records the wix-seo calls.
 *
 * Cases: lee OFF vs lee ON (element present), lee ON with no Studio element,
 * unknown slug, bare hub. Also checks /_functions/sitemap entries for ON/OFF.
 * SHOW_FA_ENABLE_OUTPUT=1 prints a table.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSitemapEntries, renderSitemapXml } from '../src/backend/sitemap-builder.js';
import { firstAppearanceSitemapEntries } from '../src/public/first-appearance-seo.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pageSrc = readFileSync(join(root, 'src/pages/First Appearance.eo050.js'), 'utf8');
const seoModule = pathToFileURL(join(root, 'src/public/first-appearance-seo.js')).href;
const tmp = mkdtempSync(join(tmpdir(), 'fa-enable-'));
const HUB = 'https://www.shamrockbailbonds.biz/first-appearance';

const LEE_ON = {
    lee: {
        lastmod: '2026-12-01',
        heading: 'Lee County First Appearance',
        body: 'Lee County bookings are at the Downtown jail, 2115 Dr. MLK Jr. Blvd, Fort Myers. (Writer test text.)'
    }
};

let variant = 0;
async function loadPage(ownContent) {
    variant += 1;
    // Wrapper for public/first-appearance-seo that binds the test own-content map.
    const wrapper = join(tmp, `fa-seo-${variant}.mjs`);
    writeFileSync(wrapper, `import * as real from ${JSON.stringify(seoModule)};
const OWN = ${JSON.stringify(ownContent)};
export const resolveFirstAppearancePath = (s) => real.resolveFirstAppearancePath(s, OWN);
export const getFaCountyContent = (slug) => real.getFaCountyContent(slug, OWN);
export const buildFirstAppearanceSeo = real.buildFirstAppearanceSeo;
`);
    let src = pageSrc
        .replace("import wixSeo from 'wix-seo';", 'const wixSeo = globalThis.__fa.wixSeo;')
        .replace("import wixWindow from 'wix-window';", 'const wixWindow = globalThis.__fa.wixWindow;')
        .replace("import wixLocation from 'wix-location';", 'const wixLocation = globalThis.__fa.wixLocation;')
        .replace("import { buildPaperworkLaunchpadUrl } from 'public/portal-config';", 'const buildPaperworkLaunchpadUrl = () => "";')
        .replace("from 'public/first-appearance-seo';", `from ${JSON.stringify(pathToFileURL(wrapper).href)};`)
        .replace(/import \{\s*getFirstAppearanceSchedules,\s*trackFirstAppearanceAction,\s*trackFirstAppearancePageView\s*\} from 'backend\/first-appearance-api';/,
            'const { getFirstAppearanceSchedules, trackFirstAppearanceAction, trackFirstAppearancePageView } = globalThis.__fa.api;');
    assert.equal(/^import .* from '(wix-|backend\/|public\/portal)/m.test(src), false, 'all Wix imports stubbed');
    const file = join(tmp, `page-${variant}.mjs`);
    writeFileSync(file, src);
    return file;
}

async function runPage(ownContent, path, { hasContentElement = true } = {}) {
    const calls = { links: null, metaTags: null, title: null, structured: 0 };
    const elements = {};
    const handlers = [];
    const mkText = (id) => (elements[id] = elements[id] || { id, text: '', expanded: false, expand() { this.expanded = true; } });
    globalThis.$w = (sel) => {
        if (sel === '#faCountyContent' || sel === '#faCountyHeading') {
            if (!hasContentElement) throw new Error(`no element ${sel}`);
            return mkText(sel.slice(1));
        }
        throw new Error(`no element ${sel}`);
    };
    globalThis.$w.onReady = (fn) => { handlers.push(fn); };
    globalThis.__fa = {
        wixSeo: {
            setLinks: async (l) => { calls.links = l; },
            setMetaTags: async (t) => { calls.metaTags = t; },
            setTitle: async (t) => { calls.title = t; },
            setStructuredData: async () => { calls.structured += 1; }
        },
        wixWindow: { rendering: { env: 'backend' } },
        wixLocation: { path, query: {} },
        api: {
            getFirstAppearanceSchedules: async () => ({ success: false, counties: [] }),
            trackFirstAppearanceAction: async () => {},
            trackFirstAppearancePageView: async () => {}
        }
    };
    const log = console.log, warn = console.warn;
    if (!process.env.FA_DEBUG) { console.log = () => {}; console.warn = () => {}; }
    try {
        await import(pathToFileURL(await loadPage(ownContent)).href);
        assert.ok(handlers.length >= 1, 'page registers $w.onReady');
        // Wix runs every onReady handler and waits for each returned promise.
        const rets = handlers.map((fn) => fn());
        assert.ok(rets[0] && typeof rets[0].then === 'function', 'SEO onReady returns a promise for SSR');
        await Promise.all(rets);
    } finally {
        console.log = log; console.warn = warn;
    }
    const robots = (calls.metaTags || []).find((t) => t.name === 'robots');
    return {
        canonical: calls.links ? calls.links[0].href : '(Studio panel default)',
        robots: robots ? robots.content : '(not set)',
        title: calls.title || '(Studio panel)',
        content: elements.faCountyContent ? elements.faCountyContent.text : '',
        structured: calls.structured
    };
}

const rows = [];
const off = await runPage({}, ['first-appearance', 'lee']);
rows.push(['lee OFF', off]);
assert.equal(off.canonical, HUB);
assert.equal(off.robots, 'index, follow');
assert.equal(off.content, '');

const on = await runPage(LEE_ON, ['first-appearance', 'lee']);
rows.push(['lee ON (#faCountyContent on page)', on]);
assert.equal(on.canonical, `${HUB}/lee`, 'enabled county self-canonicals');
assert.equal(on.robots, 'index, follow', 'enabled county has no noindex');
assert.match(on.content, /Downtown jail, 2115 Dr\. MLK Jr\. Blvd/);
assert.equal(on.structured, 1, 'JSON-LD call awaited in the same promise');

const onNoEl = await runPage(LEE_ON, ['first-appearance', 'lee'], { hasContentElement: false });
rows.push(['lee ON, no #faCountyContent in Studio', onNoEl]);
assert.equal(onNoEl.canonical, HUB, 'no element -> no self-canonical on duplicate text');
assert.equal(onNoEl.robots, 'index, follow');

const onOther = await runPage(LEE_ON, ['first-appearance', 'polk']);
rows.push(['polk while only lee ON', onOther]);
assert.equal(onOther.canonical, HUB);

const unknown = await runPage(LEE_ON, ['first-appearance', 'nonexistent-county']);
rows.push(['unknown slug', unknown]);
assert.equal(unknown.robots, 'noindex, follow');
assert.equal(unknown.canonical, HUB);

const hub = await runPage(LEE_ON, ['first-appearance']);
rows.push(['bare hub', hub]);
assert.equal(hub.canonical, '(Studio panel default)', 'hub tags untouched');
assert.equal(hub.robots, '(not set)');

// Sitemap ON vs OFF
const smOff = renderSitemapXml(buildSitemapEntries({ firstAppearance: firstAppearanceSitemapEntries({}) }));
const smOn = renderSitemapXml(buildSitemapEntries({ firstAppearance: firstAppearanceSitemapEntries(LEE_ON) }));
assert.equal(smOff.includes(`${HUB}/lee<`), false);
assert.match(smOn, /<loc>https:\/\/www\.shamrockbailbonds\.biz\/first-appearance\/lee<\/loc>\n    <lastmod>2026-12-01<\/lastmod>/);
// An entry without body or with a bad date never turns on.
assert.equal(firstAppearanceSitemapEntries({ lee: { lastmod: '2026-12-01', body: '' } }).length, 1);
assert.equal(firstAppearanceSitemapEntries({ lee: { lastmod: 'soon', body: 'x' } }).length, 1);

if (process.env.SHOW_FA_ENABLE_OUTPUT) {
    console.log('case | canonical | robots | title | county text on page');
    for (const [name, r] of rows) {
        console.log(`${name} | ${r.canonical} | ${r.robots} | ${r.title} | ${r.content ? 'yes' : 'no'}`);
    }
    const pick = (xml) => (xml.match(/<url>\n    <loc>[^<]*first-appearance[^<]*<\/loc>[\s\S]*?<\/url>/g) || []).join('\n');
    console.log('--- /_functions/sitemap first-appearance entries, lee OFF ---\n' + pick(smOff));
    console.log('--- /_functions/sitemap first-appearance entries, lee ON ---\n' + pick(smOn));
}
console.log('first-appearance enable-county checks ok');
