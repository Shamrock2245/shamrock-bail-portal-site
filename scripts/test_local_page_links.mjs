/**
 * Crawlable parent/child links between county, city and jail pages.
 */
import assert from 'node:assert/strict';
import {
    FLORIDA_CITY_PAGES,
    FLORIDA_COUNTY_DIRECTORY,
    buildLocalLinksHtml,
    buildHubCityDirectoryHtml
} from '../src/public/floridaCountyDirectory.js';

const countySlugs = new Set(FLORIDA_COUNTY_DIRECTORY.map((c) => c.slug));
assert.ok(FLORIDA_CITY_PAGES.length >= 36, 'city and jail pages listed');
for (const page of FLORIDA_CITY_PAGES) {
    assert.ok(countySlugs.has(page.county), `${page.slug}: parent county exists`);
    const html = buildLocalLinksHtml(page.slug);
    assert.ok(html.includes(`href="/florida-bail-bonds/${page.county}"`), `${page.slug}: links to parent county`);
    assert.ok(!html.includes(`href="/florida-bail-bonds/${page.slug}"`), `${page.slug}: no self link`);
}
const lee = buildLocalLinksHtml('lee');
for (const slug of ['cape-coral', 'fort-myers', 'lee-county-jail', 'cape-coral-pd']) {
    assert.ok(lee.includes(`/florida-bail-bonds/${slug}"`), `lee links to ${slug}`);
}
assert.equal(buildLocalLinksHtml('baker'), '', 'county without city pages returns empty');
assert.equal(buildLocalLinksHtml('not-a-page'), '');
const hub = buildHubCityDirectoryHtml();
for (const page of FLORIDA_CITY_PAGES) {
    assert.ok(hub.includes(`/florida-bail-bonds/${page.slug}"`), `hub links ${page.slug}`);
}
assert.ok(hub.indexOf('/florida-bail-bonds/fort-myers"') < hub.indexOf('/florida-bail-bonds/tampa"'), 'SWFL first');
console.log('local page links ok');
