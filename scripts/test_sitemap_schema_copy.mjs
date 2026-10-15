/**
 * Sitemap index children, public hours markup, and Lee County copy.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { softenLeeCountyCopy, softenLeeCountyPage } from '../src/public/sanitizeLandingCopy.js';

const require = createRequire(import.meta.url);
const { generateSitemapIndex, SITEMAP_INDEX_CHILDREN } = require('../seo/sitemap-generator.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

assert.deepEqual(SITEMAP_INDEX_CHILDREN.slice(0, 2), [
    'blog-posts-sitemap.xml',
    'blog-categories-sitemap.xml'
]);
const indexXml = generateSitemapIndex();
assert.match(indexXml, /<sitemapindex /);
assert.match(indexXml, /blog-posts-sitemap\.xml/);
assert.match(indexXml, /blog-categories-sitemap\.xml/);

const robots = read('seo/robots.txt');
assert.match(robots, /Sitemap: https:\/\/www\.shamrockbailbonds\.biz\/blog-posts-sitemap\.xml/);
assert.match(robots, /Sitemap: https:\/\/www\.shamrockbailbonds\.biz\/blog-categories-sitemap\.xml/);

const home = read('src/pages/HOME.c1dmp.js');
const county = read('src/pages/Florida Counties.qx7lv.js');
const hub = read('src/pages/Florida Bail Bonds.liggp.js');
const banned = '239-955-0301';

for (const [name, source] of [['home', home], ['county', county], ['hub', hub]]) {
    assert.equal(source.includes(banned), false, name + ' must not publish 239-955-0301');
    assert.match(source, /\+1-239-332-2245/);
    assert.match(source, /\+1-727-295-2245/);
    assert.match(source, /"Monday", "Tuesday", "Wednesday", "Thursday", "Friday"|'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'/);
    assert.match(source, /09:00/);
    assert.match(source, /17:00/);
}

assert.match(hub, /@type': 'LocalBusiness'|\"@type\": \"LocalBusiness\"/);
assert.match(hub, /1528 Broadway/);
assert.match(hub, /Fort Myers/);
assert.equal(hub.includes('comp-mumy2zct') || hub.includes('HUB_COUNTY_DIRECTORY_ELEMENT_ID'), true);

assert.equal(
    softenLeeCountyCopy('We provide fast, confidential bail bond services'),
    'We provide confidential, 24/7 bail bond services'
);
assert.equal(softenLeeCountyCopy('professional, confidential'), 'professional, confidential');

const lee = softenLeeCountyPage({
    county_slug: 'lee',
    content: { faq: [{ answer: 'We provide fast, confidential bail bond services' }] }
});
assert.equal(lee.content.faq[0].answer, 'We provide confidential, 24/7 bail bond services');
const collier = softenLeeCountyPage({
    county_slug: 'collier',
    content: { faq: [{ answer: 'We provide fast, confidential bail bond services' }] }
});
assert.match(collier.content.faq[0].answer, /fast, confidential/);

const generator = read('src/backend/county-generator.jsw');
assert.match(generator, /name === 'Lee' \? 'confidential, 24\/7'/);
assert.equal(county.includes('fast jail release'), false);

console.log('sitemap schema copy checks ok');
