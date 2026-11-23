/**
 * Track 1 SEO & LLM Authority verification tests.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

// 1. robots.txt welcomes CCBot & Diffbot and keeps portal Disallows + sitemaps
const robots = read('seo/robots.txt');
const aiBlockIdx = robots.indexOf('# AI / answer engines');
const scraperBlockIdx = robots.indexOf('# Block zero-value scrapers');
assert.ok(aiBlockIdx !== -1 && scraperBlockIdx !== -1 && aiBlockIdx < scraperBlockIdx);

const aiSection = robots.slice(aiBlockIdx, scraperBlockIdx);
const scraperSection = robots.slice(scraperBlockIdx);
assert.match(aiSection, /^User-agent: CCBot$/m, 'CCBot must be allowed in AI/answer engines section');
assert.match(aiSection, /^User-agent: Diffbot$/m, 'Diffbot must be allowed in AI/answer engines section');
assert.equal(/^User-agent: CCBot$/m.test(scraperSection), false, 'CCBot must not remain blocked');
assert.equal(/^User-agent: Diffbot$/m.test(scraperSection), false, 'Diffbot must not remain blocked');
assert.match(robots, /Disallow: \/portal-defendant/);
assert.match(robots, /Sitemap: https:\/\/www\.shamrockbailbonds\.biz\/_functions\/sitemap/);

// 2. Post.q3r5w.js: named licensed Person schema + meta tags + clean sameAs
const postPage = read('src/pages/Post.q3r5w.js');
assert.match(postPage, /Brendan O'Neal/);
assert.match(postPage, /P139768/);
assert.match(postPage, /setMetaTags/);
assert.equal(postPage.includes('Shamrock Bail Bonds Editorial Board'), false, 'generic editorial board author must be replaced');

// 3. First Appearance.eo050.js: no LegalService entity confusion
const faPage = read('src/pages/First Appearance.eo050.js');
assert.equal(faPage.includes('LegalService'), false, 'First Appearance must not declare LegalService');
assert.match(faPage, /Surety Bail Bond Service/);

// 4. Unified canonical sameAs across all 10 authority surfaces
const CANONICAL_SAME_AS_URLS = [
    'https://www.facebook.com/ShamrockBail',
    'https://www.instagram.com/shamrock_bail_bonds',
    'https://www.youtube.com/@ShamrockBailBonds_FL',
    'https://www.linkedin.com/company/shamrock-bail-bonds-llc',
    'https://t.me/Shamrock_Bail_Bonds',
    'https://www.tiktok.com/@shamrockbailbonds',
    'https://www.yelp.com/biz/shamrock-bail-bonds-fort-myers',
];

const authorityFiles = [
    'src/backend/seoConfig.js',
    'src/backend/llms-txt-builder.js',
    'src/pages/About.kc2xn.js',
    'src/pages/Blog.rstm1.js',
    'src/pages/Post.q3r5w.js',
    'src/pages/Testimonials.zhezv.js',
    'src/pages/Privacy Policy.ap91k.js',
    'src/pages/Contact.rvjs8.js',
    'src/pages/First Appearance.eo050.js',
    'src/pages/Florida Counties (Item).ygoim.js',
];

for (const rel of authorityFiles) {
    const text = read(rel);
    for (const url of CANONICAL_SAME_AS_URLS) {
        assert.ok(text.includes(url), `${rel} missing canonical sameAs URL: ${url}`);
    }
    const sameAsMatch = text.match(/["']?sameAs["']?\s*:\s*\[[\s\S]*?\]/g) || [];
    for (const block of sameAsMatch) {
        assert.equal(
            block.includes('t.me/ShamrockBail_bot'),
            false,
            `${rel} sameAs block must not use t.me/ShamrockBail_bot`
        );
    }
}

// 5. seo-rich-results.jsw has no dead backend-gas import
const richResults = read('src/backend/seo-rich-results.jsw');
assert.equal(richResults.includes('backend-gas/'), false, 'seo-rich-results.jsw must not import backend-gas/');
assert.match(richResults, /backend\/seoConfig/);

console.log('SEO & LLM authority checks passed across all 10 authority files + robots + rich-results');
