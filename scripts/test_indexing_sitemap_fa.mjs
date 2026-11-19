/**
 * Indexing audit 2026-11-19: custom sitemap rules and /first-appearance/<slug> SEO.
 * Run directly, or via test_sitemap_schema_copy.mjs in PR CI.
 * Set SHOW_SITEMAP_PREVIEW=1 to print the rendered XML and the slug table.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    buildSitemapEntries,
    renderSitemapXml,
    toLastmod,
    toLoc,
    SITEMAP_EXCLUDED_PATHS,
    SITEMAP_SITE_URL
} from '../src/backend/sitemap-builder.js';
import {
    FA_COUNTY_SLUGS,
    FA_OWN_CONTENT_COUNTIES,
    resolveFirstAppearancePath,
    firstAppearanceSitemapEntries
} from '../src/public/first-appearance-seo.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const TODAY = new Date().toISOString().slice(0, 10);
const HUB = 'https://www.shamrockbailbonds.biz/first-appearance';

// ── first-appearance rules ───────────────────────────────────────────────────
assert.equal(FA_COUNTY_SLUGS.length, 67);
assert.equal(new Set(FA_COUNTY_SLUGS).size, 67);
assert.deepEqual(Object.keys(FA_OWN_CONTENT_COUNTIES), [], 'no county has own content yet');

const hub = resolveFirstAppearancePath([]);
assert.equal(hub.kind, 'hub');
assert.equal(hub.canonical, HUB);
assert.equal(hub.inSitemap, true);
assert.deepEqual(resolveFirstAppearancePath(['first-appearance']), hub, 'page-code path form');

for (const slug of FA_COUNTY_SLUGS) {
    const r = resolveFirstAppearancePath(['first-appearance', slug]);
    assert.equal(r.kind, 'county', slug);
    assert.equal(r.slug, slug);
    assert.equal(r.canonical, HUB, `${slug} canonicals to hub until it has own content`);
    assert.equal(r.inSitemap, false, `${slug} not in sitemap`);
    assert.equal(r.robots, 'index, follow');
    assert.equal(r.redirectTo, '');
}

const variants = { Lee: 'lee', 'lee-county': 'lee', PalmBeach: 'palm-beach', stjohns: 'st-johns', 'Miami-Dade': 'miami-dade' };
for (const [raw, slug] of Object.entries(variants)) {
    const r = resolveFirstAppearancePath([raw]);
    assert.equal(r.kind, 'county', raw);
    assert.equal(r.slug, slug, raw);
    assert.equal(r.canonical, HUB, raw);
    assert.equal(r.redirectTo, `/first-appearance/${slug}`, `${raw} 301s in the router`);
}

for (const raw of [['nonexistent-county'], ['xyz'], ['lee', 'extra'], ['florida']]) {
    const r = resolveFirstAppearancePath(raw);
    assert.equal(r.kind, 'unknown', raw.join('/'));
    assert.equal(r.robots, 'noindex, follow', raw.join('/'));
    assert.equal(r.canonical, HUB, raw.join('/'));
    assert.equal(r.inSitemap, false);
}

// Router: unknown -> notFound(), variant -> 301, sitemap from shared list.
const router = read('src/backend/first-appearance-router.js');
assert.match(router, /if \(route\.kind === 'unknown'\) return notFound\(\);/);
assert.match(router, /if \(route\.redirectTo\) return redirect\(route\.redirectTo, '301'\);/);
assert.match(router, /firstAppearanceSitemapEntries\(\)/);
assert.equal(router.includes('lastModified: new Date()'), false, 'router sitemap must not stamp today');

// Page code applies canonical/robots on path URLs only.
const page = read('src/pages/First Appearance.eo050.js');
assert.match(page, /from 'public\/first-appearance-seo'/);
assert.match(page, /wixSeo\.setLinks\(\[\{ rel: 'canonical', href: seo\.canonical \}\]\)/);
assert.match(page, /return Promise\.all\(seoWork\);/, 'onReady returns the SEO promise (SSR)');
assert.equal(page.includes('239-955-0301') || page.includes('955-0301'), false);

// ── sitemap ──────────────────────────────────────────────────────────────────
const http = read('src/backend/http-functions.js');
const getSitemap = http.slice(http.indexOf('export async function get_sitemap'), http.indexOf('GET /_functions/getIndemnitorProfile'));
assert.equal(getSitemap.includes('new Date()'), false, 'get_sitemap must not stamp today');
assert.match(getSitemap, /buildSitemapEntries\(/);
assert.match(getSitemap, /firstAppearanceSitemapEntries\(\)/);
assert.equal(/addUrl\(`\/first-appearance\//.test(getSitemap), false, 'no per-county first-appearance URLs');

assert.equal(toLastmod(''), '');
assert.equal(toLastmod(undefined), '');
assert.equal(toLastmod('not a date'), '');
assert.equal(toLastmod(new Date('2026-10-04T15:00:00Z')), '2026-10-04');
assert.equal(toLastmod('2026-09-01'), '2026-09-01');
assert.equal(toLoc('/'), SITEMAP_SITE_URL);
assert.equal(toLoc('https://www.shamrockbailbonds.biz/'), SITEMAP_SITE_URL);

const cmsCounties = FA_COUNTY_SLUGS.map((slug, i) => ({
    slug,
    updated: new Date(Date.UTC(2026, 9, 1 + (i % 28), 12))
}));
const entries = buildSitemapEntries({
    cityLandingSlugs: ['cape-coral', 'estero', 'north-fort-myers', 'sarasota'],
    countyPages: cmsCounties,
    firstAppearance: firstAppearanceSitemapEntries(),
    blogPosts: [
        { path: '/single-post/what-a-no-bond-hold-means-in-florida-and-your-next-steps', updated: '2026-11-03T14:00:00Z' },
        { path: '/single-post/no-date-post', updated: '' }
    ]
});
const xml = renderSitemapXml(entries);
const locs = entries.map((e) => e.loc);

for (const p of SITEMAP_EXCLUDED_PATHS) {
    assert.equal(locs.includes(SITEMAP_SITE_URL + p), false, `${p} excluded`);
    assert.equal(xml.includes(`<loc>${SITEMAP_SITE_URL}${p}</loc>`), false, `${p} excluded from XML`);
}
assert.equal(locs.filter((l) => l === SITEMAP_SITE_URL).length, 1, 'one homepage entry');
assert.equal(locs.includes(SITEMAP_SITE_URL + '/'), false, 'no trailing-slash homepage');
assert.equal(locs.filter((l) => l.includes('/first-appearance/')).length, 0, 'no county first-appearance URLs');
assert.equal(locs.includes(HUB), true, 'hub stays');
assert.equal(new Set(locs).size, locs.length, 'no duplicates');
assert.equal(xml.includes(`<lastmod>${TODAY}</lastmod>`), false, 'no lastmod stamped with today');
assert.match(xml, /<loc>https:\/\/www\.shamrockbailbonds\.biz\/florida-bail-bonds\/lee<\/loc>\n    <lastmod>2026-10-/);
assert.match(xml, /florida-bail-bonds\/sarasota<\/loc>\n    <lastmod>2026-10-/, 'shared city/county URL keeps CMS date');
assert.match(xml, /no-bond-hold-means-in-florida-and-your-next-steps<\/loc>\n    <lastmod>2026-11-03<\/lastmod>/);
assert.match(xml, /no-date-post<\/loc>\n    <changefreq>/, 'missing date -> no lastmod');
assert.match(xml, /<loc>https:\/\/www\.shamrockbailbonds\.biz<\/loc>\n    <changefreq>/, 'static pages omit lastmod');

// Turning on one county puts it back in the sitemap with its own date.
const ownEntries = buildSitemapEntries({
    firstAppearance: [
        { path: '/first-appearance', lastmod: '' },
        { path: '/first-appearance/lee', lastmod: '2026-12-01' }
    ]
});
assert.ok(ownEntries.some((e) => e.loc === `${HUB}/lee` && e.lastmod === '2026-12-01'));

if (process.env.SHOW_SITEMAP_PREVIEW) {
    console.log('--- sample /_functions/sitemap XML (CMS dates mocked) ---');
    console.log(xml);
    console.log('--- /first-appearance/<slug> behaviour ---');
    console.log('path\tkind\tpage-code canonical\trobots\trouter result\tin sitemap');
    for (const raw of [[], ['lee'], ['miami-dade'], ['Lee'], ['lee-county'], ['palmbeach'], ['nonexistent-county'], ['lee', 'extra']]) {
        const r = resolveFirstAppearancePath(raw);
        const routerResult = r.kind === 'unknown' ? '404 notFound()' : r.redirectTo ? `301 -> ${r.redirectTo}` : '200 ok()';
        console.log(`/first-appearance${raw.length ? '/' + raw.join('/') : ''}\t${r.kind}\t${r.canonical}\t${r.robots}\t${routerResult}\t${r.inSitemap}`);
    }
    console.log(`entries: ${entries.length}; excluded paths: ${SITEMAP_EXCLUDED_PATHS.join(', ')}`);
}

console.log('indexing sitemap + first-appearance checks ok');
