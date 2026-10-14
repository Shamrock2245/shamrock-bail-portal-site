/**
 * Collection landing copy must not render "Fast Release".
 * Fixture titles are the FloridaCounties rows embedded on the live homepage
 * (warmup data, 2026-10-13) whose title or h1Headline still say Fast Release.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderLandingCopy, sanitizeFastReleaseText, sanitizeLandingItem } from '../../src/public/sanitizeLandingCopy.js';
import { resolvePrimaryHeroH1 } from '../../src/public/cityHeroHeadline.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const LIVE_HOME_ITEMS = [
  {
    "slug": "bonita-springs",
    "title": "Bonita Springs Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Bonita Springs Bail Bonds (Lee County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "bradenton",
    "title": "Bradenton Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Bradenton Bail Bonds (Manatee County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "cape-coral",
    "title": "Cape Coral Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Cape Coral Bail Bonds (Lee County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "cape-coral-pd",
    "title": "Cape Coral Police Department Holding Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Cape Coral Police Department Holding Bail Bonds — 24/7 Fast Release",
    "seoTitle": "",
    "landing_type": "jail"
  },
  {
    "slug": "charlotte-county-jail",
    "title": "Charlotte County Jail Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Charlotte County Jail Bail Bonds — 24/7 Fast Release",
    "seoTitle": "",
    "landing_type": "jail"
  },
  {
    "slug": "clearwater",
    "title": "Clearwater Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Clearwater Bail Bonds (Pinellas County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "clewiston",
    "title": "Clewiston Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Clewiston Bail Bonds (Hendry County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "collier-county-jail",
    "title": "Collier County Jail Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Collier County Jail Bail Bonds — 24/7 Fast Release",
    "seoTitle": "",
    "landing_type": "jail"
  },
  {
    "slug": "daytona-beach",
    "title": "Daytona Beach Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Daytona Beach Bail Bonds (Volusia County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "englewood",
    "title": "Englewood Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Englewood Bail Bonds (Charlotte County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "estero",
    "title": "Estero Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Estero Bail Bonds (Lee County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "fort-lauderdale",
    "title": "Fort Lauderdale Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Fort Lauderdale Bail Bonds (Broward County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "fort-myers",
    "title": "Fort Myers Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Fort Myers Bail Bonds (Lee County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "fort-myers-beach",
    "title": "Fort Myers Beach Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Fort Myers Beach Bail Bonds (Lee County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "gainesville",
    "title": "Gainesville Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Gainesville Bail Bonds (Alachua County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "immokalee",
    "title": "Immokalee Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Immokalee Bail Bonds (Collier County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "jacksonville",
    "title": "Jacksonville Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Jacksonville Bail Bonds (Duval County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "labelle",
    "title": "LaBelle Bail Bonds — 24/7 Fast Release",
    "h1Headline": "LaBelle Bail Bonds (Hendry County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "lakeland",
    "title": "Lakeland Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Lakeland Bail Bonds (Polk County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "lee-county-jail",
    "title": "Lee County Jail Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Lee County Jail Bail Bonds — 24/7 Fast Release",
    "seoTitle": "",
    "landing_type": "jail"
  },
  {
    "slug": "lehigh-acres",
    "title": "Lehigh Acres Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Lehigh Acres Bail Bonds (Lee County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "marco-island",
    "title": "Marco Island Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Marco Island Bail Bonds (Collier County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "miami",
    "title": "Miami Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Miami Bail Bonds (Miami-Dade County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "naples",
    "title": "Naples Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Naples Bail Bonds (Collier County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "north-fort-myers",
    "title": "North Fort Myers Bail Bonds — 24/7 Fast Release",
    "h1Headline": "North Fort Myers Bail Bonds (Lee County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "north-port",
    "title": "North Port Bail Bonds — 24/7 Fast Release",
    "h1Headline": "North Port Bail Bonds (Sarasota County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "orlando",
    "title": "Orlando Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Orlando Bail Bonds (Orange County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "pensacola",
    "title": "Pensacola Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Pensacola Bail Bonds (Escambia County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "port-charlotte",
    "title": "Port Charlotte Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Port Charlotte Bail Bonds (Charlotte County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "punta-gorda",
    "title": "Punta Gorda Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Punta Gorda Bail Bonds (Charlotte County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "sanibel",
    "title": "Sanibel Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Sanibel Bail Bonds (Lee County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "sarasota",
    "title": "Sarasota Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Sarasota County Bail Bonds: 24/7 Help for Families",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "st-petersburg",
    "title": "St. Petersburg Bail Bonds — 24/7 Fast Release",
    "h1Headline": "St. Petersburg Bail Bonds (Pinellas County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "tallahassee",
    "title": "Tallahassee Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Tallahassee Bail Bonds (Leon County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "tampa",
    "title": "Tampa Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Tampa Bail Bonds (Hillsborough County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "venice",
    "title": "Venice Bail Bonds — 24/7 Fast Release",
    "h1Headline": "Venice Bail Bonds (Sarasota County)",
    "seoTitle": "",
    "landing_type": "city"
  },
  {
    "slug": "west-palm-beach",
    "title": "West Palm Beach Bail Bonds — 24/7 Fast Release",
    "h1Headline": "West Palm Beach Bail Bonds (Palm Beach County)",
    "seoTitle": "",
    "landing_type": "city"
  }
];

function rendered(item) {
    const copy = renderLandingCopy(item);
    const h1 = resolvePrimaryHeroH1({
        landing_type: item.landing_type,
        display_name: item.h1Headline ? item.h1Headline.split(' Bail Bonds')[0] : item.slug,
        county_name: item.slug,
        parent_county_name: 'Lee',
        county_name_full: item.slug,
        content: { hero_headline: item.h1Headline }
    });
    return [copy.title, copy.h1Headline, copy.seoTitle, h1].join('\n');
}

assert.equal(
    sanitizeFastReleaseText('Naples Bail Bonds — 24/7 Fast Release'),
    'Naples Bail Bonds — 24/7 Bail Help'
);
assert.equal(
    sanitizeFastReleaseText('Lee County Jail Bail Bonds — 24/7 Fast Release'),
    'Lee County Jail Bail Bonds — 24/7 Bail Help'
);
assert.equal(
    sanitizeFastReleaseText('Lee County Bail Bonds - 24/7 Fast Release | Fort Myers | Shamrock'),
    'Lee County Bail Bonds - 24/7 Bail Help | Fort Myers | Shamrock'
);
assert.equal(
    sanitizeFastReleaseText('Ask about our Fast Release desk today'),
    'Ask about our desk today'
);
assert.equal(
    sanitizeFastReleaseText('St. Lucie County Bail Bonds: 24/7 Help for Families'),
    'St. Lucie County Bail Bonds: 24/7 Help for Families'
);
assert.equal(sanitizeFastReleaseText('24/7 Bail Help'), '24/7 Bail Help');
assert.equal(sanitizeFastReleaseText(null), null);

const other = sanitizeLandingItem({
    title: 'Promo Fast Release night',
    h1Headline: 'Keep this',
    seoTitle: 'seo Fast Release',
    serviceAreaCopy: 'body Fast Release stays until CMS cleanup'
});
assert.equal(other.title, 'Promo night');
assert.equal(other.h1Headline, 'Keep this');
assert.equal(other.seoTitle, 'seo');
assert.equal(other.serviceAreaCopy, 'body Fast Release stays until CMS cleanup');

assert.equal(LIVE_HOME_ITEMS.length, 37);
for (const item of LIVE_HOME_ITEMS) {
    const out = rendered(item);
    assert.equal(out.includes('Fast Release'), false, item.slug + ' still renders Fast Release: ' + out);
    if (item.title.endsWith('24/7 Fast Release')) {
        assert.equal(renderLandingCopy(item).title, item.title.replace('24/7 Fast Release', '24/7 Bail Help'));
    }
}

const dataHook = readFileSync(join(root, 'src/backend/data.js'), 'utf8');
assert.match(dataHook, /export function FloridaCounties_afterQuery/);
assert.match(dataHook, /export function FloridaCounties_afterGet/);
assert.match(dataHook, /sanitizeLandingItem/);

const generator = readFileSync(join(root, 'src/backend/county-generator.jsw'), 'utf8');
assert.match(generator, /sanitizeFastReleaseText\(/);

for (const rel of [
    'src/public/cityHeroHeadline.js',
    'src/backend/cronJobs.jsw',
    'src/backend/local-landings.js',
    'src/backend/data/county-template.json'
]) {
    const text = readFileSync(join(root, rel), 'utf8');
    assert.equal(text.includes('24/7 Fast Release'), false, rel + ' still hardcodes 24/7 Fast Release');
}

console.log('landing copy ok (' + LIVE_HOME_ITEMS.length + ' homepage rows render without Fast Release)');
