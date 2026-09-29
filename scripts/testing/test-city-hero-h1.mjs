/**
 * City landing H1 pattern: "{City} Bail Bonds ({County} County)".
 * County and jail headlines stay on their existing strings.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
    formatCityHeroHeadline,
    resolvePrimaryHeroH1,
    heroH1FromCmsItem,
    rewriteRichTextH1Html
} from '../../src/public/cityHeroHeadline.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const landings = JSON.parse(
    readFileSync(join(root, 'src/backend/data/florida-city-landings.json'), 'utf8')
).landings;

const fortMyers = landings.find((item) => item.slug === 'fort-myers');
assert.equal(fortMyers.type, 'city');
assert.equal(
    formatCityHeroHeadline(fortMyers.name, fortMyers.countyName),
    'Fort Myers Bail Bonds (Lee County)'
);
assert.equal(
    formatCityHeroHeadline('Fort Myers', 'Lee County'),
    'Fort Myers Bail Bonds (Lee County)'
);

const cities = landings.filter((item) => item.type === 'city');
assert.ok(cities.length > 1, 'expected more than one city landing');
for (const city of cities) {
    const h1 = formatCityHeroHeadline(city.name, city.countyName);
    assert.equal(h1, `${city.name} Bail Bonds (${city.countyName} County)`);
    assert.equal(h1.includes('24/7'), false);
    assert.equal(h1.includes('County County'), false);
}

assert.equal(
    resolvePrimaryHeroH1({
        landing_type: 'city',
        display_name: 'Fort Myers',
        county_name: 'Fort Myers',
        parent_county_name: 'Lee',
        content: { hero_headline: 'Fort Myers Bail Bonds — 24/7 Fast Release' }
    }),
    'Fort Myers Bail Bonds (Lee County)'
);

assert.equal(
    resolvePrimaryHeroH1({
        landing_type: 'city',
        display_name: 'Cape Coral',
        parent_county_name: 'Lee',
        content: { hero_headline: 'Cape Coral Bail Bonds — 24/7 Fast Release' }
    }),
    'Cape Coral Bail Bonds (Lee County)'
);

const countyH1 = 'Lee County Bail Bonds: 24/7 Help for Families';
assert.equal(
    resolvePrimaryHeroH1({
        landing_type: 'county',
        county_name: 'Lee',
        county_name_full: 'Lee County',
        parent_county_name: 'Lee',
        content: { hero_headline: countyH1 }
    }),
    countyH1
);

const jails = landings.filter((item) => item.type === 'jail');
assert.ok(jails.length > 0, 'expected jail landings');
for (const jail of jails) {
    const jailH1 = `${jail.name} Bail Bonds — 24/7 Fast Release`;
    assert.equal(
        resolvePrimaryHeroH1({
            landing_type: 'jail',
            display_name: jail.name,
            county_name: jail.name,
            parent_county_name: jail.countyName,
            content: { hero_headline: jailH1 }
        }),
        jailH1
    );
}

assert.equal(
    resolvePrimaryHeroH1({
        landing_type: 'county',
        county_name: 'Collier',
        county_name_full: 'Collier County',
        content: {}
    }),
    'Collier County Bail Bonds — 24/7 Fast Release'
);

const generator = readFileSync(join(root, 'src/backend/county-generator.jsw'), 'utf8');
assert.match(generator, /landing\.type === 'city'/);
assert.match(generator, /formatCityHeroHeadline\(displayName, countyName\)/);
assert.match(generator, /county\.h1Headline && \/bail\/i\.test\(county\.h1Headline\)/);

const landingsSource = readFileSync(join(root, 'src/backend/local-landings.js'), 'utf8');
assert.match(landingsSource, /formatCityHeroHeadline\(name, county\)/);
assert.match(landingsSource, /\$\{name\} Bail Bonds — 24\/7 Fast Release/);

const page = readFileSync(join(root, 'src/pages/Florida Counties.qx7lv.js'), 'utf8');
assert.match(page, /resolvePrimaryHeroH1\(county\)/);
assert.match(page, /applyPrimaryHeroH1\(resolvePrimaryHeroH1\(county\)\)/);
assert.match(page, /heroH1FromCmsItem\(/);
assert.match(page, /comp-mkzw2dj2/);
assert.match(page, /demoteHeadingTag\(/);

assert.equal(
    heroH1FromCmsItem({
        h1Headline: 'Fort Myers Bail Bonds (Lee County)',
        title: 'Fort Myers',
        countyName: 'Fort Myers'
    }),
    'Fort Myers Bail Bonds (Lee County)'
);
assert.equal(
    heroH1FromCmsItem({
        title: 'Fort Myers Bail Bonds (Lee County)',
        countyName: 'Fort Myers'
    }),
    'Fort Myers Bail Bonds (Lee County)'
);
assert.equal(
    heroH1FromCmsItem({ countyName: 'Fort Myers', title: 'Fort Myers' }),
    ''
);
assert.equal(
    heroH1FromCmsItem({
        h1Headline: 'Lee County Bail Bonds — 24/7 Fast Release',
        countyName: 'Lee'
    }),
    'Lee County Bail Bonds — 24/7 Fast Release'
);

const liveHero = '<h1 class="font_0 wixui-rich-text__text" style="font-size:50px;"><span style="letter-spacing:0.15em;" class="wixui-rich-text__text"><span style="font-weight:bold;" class="wixui-rich-text__text">Fort Myers</span></span></h1>';
const rewritten = rewriteRichTextH1Html(liveHero, 'Fort Myers Bail Bonds (Lee County)');
assert.match(rewritten, /<h1\b/);
assert.match(rewritten, /letter-spacing:0\.15em/);
assert.match(rewritten, />Fort Myers Bail Bonds \(Lee County\)</);
assert.equal(rewritten.includes('>Fort Myers<'), false);
assert.equal(rewriteRichTextH1Html('<p>Fort Myers</p>', 'Fort Myers Bail Bonds (Lee County)'), '');

const home = readFileSync(join(root, 'src/pages/HOME.c1dmp.js'), 'utf8');
const ownerMeta = '24/7 Fort Myers & Florida bail bonds. Fast Lee County Jail release, payment plans, licensed since 2012. Call (239) 332-2245.';
assert.equal(ownerMeta.length, 124);
assert.match(home, /const HOME_META_DESCRIPTION = '24\/7 Fort Myers & Florida bail bonds\. Fast Lee County Jail release, payment plans, licensed since 2012\. Call \(239\) 332-2245\.';/);
assert.equal(home.includes('Cape Coral, Naples, and all 67'), false);
const onReady = home.slice(home.indexOf('$w.onReady'), home.indexOf('function safeOnClick'));
assert.match(onReady, /setupHomepageMeta\(\)/);
assert.equal(/setTimeout\([\s\S]*setupHomepageMeta\(/.test(onReady), false);

console.log(`city H1 pattern ok (${cities.length} cities, ${jails.length} jails unchanged)`);
