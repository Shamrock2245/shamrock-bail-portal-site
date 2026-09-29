/**
 * City landing H1 pattern: "{City} Bail Bonds ({County} County)".
 * County and jail headlines stay on their existing strings.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { formatCityHeroHeadline, resolvePrimaryHeroH1 } from '../../src/public/cityHeroHeadline.js';

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
assert.match(page, /resolvePrimaryHeroH1\(generatedCounty\)/);
assert.match(page, /demoteHeadingTag\(/);

console.log(`city H1 pattern ok (${cities.length} cities, ${jails.length} jails unchanged)`);
