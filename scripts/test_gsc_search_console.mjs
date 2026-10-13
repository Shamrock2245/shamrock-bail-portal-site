/**
 * Search Console fixes:
 * - /bail-bonds/{county} 301 map for all 67 Florida counties
 * - dashboard-only aliases that are not router prefixes
 * - unique local facts for the eight crawled-not-indexed counties
 * - crawlable /florida-bail-bonds/{slug} anchors on the home list and county hub
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    DASHBOARD_URL_REDIRECTS,
    FLORIDA_COUNTY_SLUGS,
    floridaCountyCanonicalPath
} from '../src/backend/seo-redirects.js';
import {
    FLORIDA_COUNTY_DIRECTORY,
    buildFloridaCountyDirectoryHtml
} from '../src/public/floridaCountyDirectory.js';
import { register } from 'node:module';

register('./testing/json-module-hook.mjs', import.meta.url);

const { applyIndexedCountyLocal, listIndexedCountySlugs } = await import('../src/backend/gsc-county-local.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const THIN = ['martin', 'levy', 'nassau', 'orange', 'franklin', 'escambia', 'okeechobee', 'bradford'];
const SPEED = /fast release|within (an )?hour|within minutes|in minutes|same day/i;

assert.equal(FLORIDA_COUNTY_SLUGS.length, 67);
assert.equal(new Set(FLORIDA_COUNTY_SLUGS).size, 67);

for (const slug of FLORIDA_COUNTY_SLUGS) {
    assert.equal(floridaCountyCanonicalPath(slug), '/florida-bail-bonds/' + slug);
    assert.equal(floridaCountyCanonicalPath(slug.toUpperCase()), '/florida-bail-bonds/' + slug);
    assert.equal(floridaCountyCanonicalPath(slug + '-county'), '/florida-bail-bonds/' + slug);
}

assert.equal(floridaCountyCanonicalPath('ga'), '');
assert.equal(floridaCountyCanonicalPath('texas'), '');
assert.equal(floridaCountyCanonicalPath('florida'), '');
assert.equal(floridaCountyCanonicalPath(''), '');

assert.deepEqual(DASHBOARD_URL_REDIRECTS, [
    { from: '/terms-of-service', to: '/terms-and-conditions', status: 301 },
    { from: '/first-appearance-hub', to: '/first-appearance', status: 301 }
]);

const router = readFileSync(join(root, 'src/backend/multi-state-router.js'), 'utf8');
assert.match(router, /floridaCountyCanonicalPath\(raw\)/);
assert.match(router, /return redirect\(countyTarget, '301'\)/);
const stateBeforeCounty = router.indexOf('if (stateMatch)');
const countyRedirect = router.indexOf('floridaCountyCanonicalPath(raw)');
assert.ok(stateBeforeCounty > -1 && stateBeforeCounty < countyRedirect, 'state routes stay ahead of the county 301');

const facts = JSON.parse(readFileSync(join(root, 'src/backend/data/gsc-county-local.json'), 'utf8'));
assert.deepEqual(listIndexedCountySlugs().sort(), THIN.slice().sort());

const paragraphs = [];
for (const slug of THIN) {
    const row = facts.counties[slug];
    assert.ok(row, slug + ' missing');
    assert.match(row.jailName, /\w/);
    assert.match(row.jailAddress, /\d/);
    assert.match(row.courthouseName, /\w/);
    assert.match(row.courthouseAddress, /\d/);
    assert.match(row.clerkName, /clerk/i);
    assert.ok(row.cities.length >= 3 && row.cities.length <= 5, slug + ' city count');
    assert.equal(new Set(row.cities).size, row.cities.length);
    assert.ok(row.paragraph.length > 120, slug + ' paragraph');
    assert.equal(paragraphs.includes(row.paragraph), false, slug + ' paragraph is not unique');
    paragraphs.push(row.paragraph);
    assert.match(row.paragraph, new RegExp(row.jailName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.ok(row.paragraph.includes(row.cities[0]), slug + ' paragraph names a city');
    assert.equal(SPEED.test(row.paragraph), false, slug + ' promises a release time');
    assert.ok(Array.isArray(row.sources) && row.sources.length >= 2, slug + ' sources');
    for (const url of row.sources) assert.match(url, /^https:\/\//);

    const page = applyIndexedCountyLocal({
        landing_type: 'county',
        county_slug: slug,
        county_name: slug,
        parent_county_name: slug,
        jail: { name: 'TBD', address: '' },
        facts: {},
        clerk: { display_name: '' },
        cities: [],
        content: { about_county: 'Shared template sentence.', about_html: '<p>Shared template sentence.</p>', service_areas: '' },
        seo: { meta_description: 'Same description for every county.' }
    });
    assert.equal(page.jail.name, row.jailName);
    assert.equal(page.jail.address, row.jailAddress);
    assert.equal(page.facts.courthouse_name, row.courthouseName);
    assert.equal(page.facts.courthouse_address, row.courthouseAddress);
    assert.deepEqual(page.facts.major_cities, row.cities);
    assert.equal(page.clerk.display_name, row.clerkName);
    assert.ok(page.content.about_county.includes(row.paragraph), slug + ' about text includes the local paragraph');
    assert.match(page.content.about_html, /<p>/);
    assert.ok(page.content.service_areas.includes(row.cities[row.cities.length - 1]), slug + ' service area lists a city');
    assert.ok(page.seo.meta_description.includes(row.jailAddress.split(',')[0]), slug + ' meta names the jail street');
}

const cityPage = applyIndexedCountyLocal({
    landing_type: 'city',
    county_slug: 'orlando',
    content: { about_county: 'leave me' }
});
assert.equal(cityPage.content.about_county, 'leave me');

const directoryHtml = buildFloridaCountyDirectoryHtml();
assert.equal(FLORIDA_COUNTY_DIRECTORY.length, 67);
for (const slug of THIN) {
    assert.match(directoryHtml, new RegExp('href="/florida-bail-bonds/' + slug + '"'));
}
assert.equal((directoryHtml.match(/href="\/florida-bail-bonds\//g) || []).length, 67);

const home = readFileSync(join(root, 'src/pages/HOME.c1dmp.js'), 'utf8');
const homeList = home.slice(home.indexOf('const FLORIDA_COUNTIES = ['), home.indexOf('];', home.indexOf('const FLORIDA_COUNTIES = [')));
const homeSlugs = [...homeList.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]);
assert.deepEqual(homeSlugs, FLORIDA_COUNTY_DIRECTORY.map((c) => c.slug));
assert.match(home, /<a href="\/florida-bail-bonds\/' \+ county\.slug \+ '">/);
assert.match(home, /renderCrawlableCountyLinks\(\)/);
assert.match(home, /#countyDropdown/);

const hub = readFileSync(join(root, 'src/pages/Florida Bail Bonds.liggp.js'), 'utf8');
assert.match(hub, /buildFloridaCountyDirectoryHtml/);

const countyPage = readFileSync(join(root, 'src/pages/Florida Counties.qx7lv.js'), 'utf8');
assert.match(countyPage, /aboutHtmlWithDirectory/);
assert.match(countyPage, /buildFloridaCountyDirectoryHtml/);

const generator = readFileSync(join(root, 'src/backend/county-generator.jsw'), 'utf8');
assert.match(generator, /return applyIndexedCountyLocal\(page\)/);

console.log('gsc search console checks ok');
