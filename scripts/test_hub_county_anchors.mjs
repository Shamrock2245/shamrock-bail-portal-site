/**
 * Florida Bail Bonds hub: 67 crawlable county anchors, SWFL first,
 * written onto the existing body rich text.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    FLORIDA_COUNTY_DIRECTORY,
    HUB_COUNTY_DIRECTORY_ELEMENT_ID,
    SWFL_HUB_SLUGS,
    appendHubCountyDirectory,
    buildFloridaCountyDirectoryHtml,
    buildHubCountyDirectoryHtml
} from '../src/public/floridaCountyDirectory.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function slugsIn(html) {
    return [...html.matchAll(/href="\/florida-bail-bonds\/([^"]+)"/g)].map((match) => match[1]);
}

assert.equal(HUB_COUNTY_DIRECTORY_ELEMENT_ID, '#comp-mumy2zct');
assert.deepEqual(SWFL_HUB_SLUGS, ['lee', 'collier', 'charlotte', 'hendry', 'glades']);

const alphabetical = slugsIn(buildFloridaCountyDirectoryHtml());
assert.equal(alphabetical[0], 'alachua');
assert.equal(alphabetical.length, 67);

const hubHtml = buildHubCountyDirectoryHtml();
const hubSlugs = slugsIn(hubHtml);
assert.equal(hubSlugs.length, 67);
assert.equal(new Set(hubSlugs).size, 67);
assert.deepEqual(hubSlugs.slice(0, 5), SWFL_HUB_SLUGS);
assert.equal(hubSlugs[5], 'alachua');
assert.deepEqual(new Set(hubSlugs), new Set(FLORIDA_COUNTY_DIRECTORY.map((county) => county.slug)));
assert.match(hubHtml, /<nav aria-label="Florida county bail bonds">/);

const existing = '<p>SWFL County &amp; Jail Directory</p>'
    + '<p><a href="https://www.shamrockbailbonds.biz/florida-bail-bonds/lee">Lee</a></p>'
    + '<p><a href="https://www.shamrockbailbonds.biz/florida-bail-bonds/collier-county-jail">Collier County Jail</a></p>';
const combined = appendHubCountyDirectory(existing, hubHtml);
assert.ok(combined.startsWith(existing));
assert.ok(combined.endsWith(hubHtml));
assert.ok(combined.indexOf('collier-county-jail') !== -1);
assert.deepEqual(slugsIn(combined).slice(0, 5), SWFL_HUB_SLUGS);
assert.equal(slugsIn(combined).length, 67);
assert.equal(appendHubCountyDirectory(combined, hubHtml), combined);
assert.equal(appendHubCountyDirectory('', hubHtml), hubHtml);

const hub = readFileSync(join(root, 'src/pages/Florida Bail Bonds.liggp.js'), 'utf8');
assert.match(hub, /buildHubCountyDirectoryHtml/);
assert.match(hub, /appendHubCountyDirectory/);
assert.match(hub, /HUB_COUNTY_DIRECTORY_ELEMENT_ID/);
assert.match(hub, /\$w\('Text'\)/);
assert.equal(hub.includes('countyLinkList'), false);
assert.equal(hub.includes('comp-mumy042s'), false);

console.log('hub county anchors ok');
