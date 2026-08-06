/**
 * Router for First Appearance County Pages.
 * Handles: /first-appearance/{county-slug}
 *
 * HUB (full UI — all 67 counties, nearest-first search):
 *   /first-appearance            → first-appearance.h4fpl.js (page name "first-appearance")
 *   /first-appearance-hub        → same static page if URL slug is set in Editor
 *
 * County pSEO:
 *   /first-appearance/lee
 *   /first-appearance/miami-dade
 *   /first-appearance/lee-county  (normalized → lee)
 *
 * IMPORTANT: ok(pageName) must match the Wix router page name exactly or
 * Wix serves title "500 | …" / blank and page code never runs.
 */

import { ok } from 'wix-router';

/** Hub page code: first-appearance.h4fpl.js */
const HUB_PAGE = 'first-appearance';
/** County pSEO shell: first-appearance-page.nmw1v.js */
const COUNTY_PAGE = 'first-appearance-page';

/** Public canonical hub path (marketing / internal links). */
export const FA_HUB_PATH = '/first-appearance';

/** Florida counties for sitemap discovery. */
const COUNTY_SLUGS = [
    'alachua', 'baker', 'bay', 'bradford', 'brevard', 'broward', 'calhoun', 'charlotte',
    'citrus', 'clay', 'collier', 'columbia', 'desoto', 'dixie', 'duval', 'escambia',
    'flagler', 'franklin', 'gadsden', 'gilchrist', 'glades', 'gulf', 'hamilton', 'hardee',
    'hendry', 'hernando', 'highlands', 'hillsborough', 'holmes', 'indian-river', 'jackson',
    'jefferson', 'lafayette', 'lake', 'lee', 'leon', 'levy', 'liberty', 'madison',
    'manatee', 'marion', 'martin', 'miami-dade', 'monroe', 'nassau', 'okaloosa',
    'okeechobee', 'orange', 'osceola', 'palm-beach', 'pasco', 'pinellas', 'polk',
    'putnam', 'santa-rosa', 'sarasota', 'seminole', 'st-johns', 'st-lucie', 'sumter',
    'suwannee', 'taylor', 'union', 'volusia', 'wakulla', 'walton', 'washington'
];

function normalizeSlug(raw) {
    return (raw || '')
        .toLowerCase()
        .trim()
        .replace(/-county$/i, '');
}

/**
 * Prefix: first-appearance
 *
 *   /first-appearance            → HUB_PAGE
 *   /first-appearance/lee        → COUNTY_PAGE
 *   /first-appearance/lee-county → COUNTY_PAGE (normalized → "lee")
 */
export function first_appearance_Router(request) {
    const rawSlug = request.path[0] || '';
    const countySlug = normalizeSlug(rawSlug);

    console.log(`[FA Router] Path: ${(request.path || []).join('/')} → slug: '${countySlug}'`);

    // ── EMPTY SLUG → HUB (full embed + SEO in h4fpl) ──
    if (!countySlug) {
        return ok(HUB_PAGE, {
            title: 'First Appearance Hearing in Florida | Live Court Schedules | Shamrock Bail Bonds',
            description:
                'Find First Appearance hearing schedules for every Florida county. Live court streams, bail information, and 24/7 bond help from Shamrock Bail Bonds.',
            slug: ''
        });
    }

    // ── COUNTY SLUG → COUNTY PAGE ──
    const countyNameDisplay = countySlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    return ok(COUNTY_PAGE, {
        title: `First Appearance Hearing in ${countyNameDisplay} County, FL | Shamrock Bail Bonds`,
        description: `First Appearance schedule, bail info, and live court access for ${countyNameDisplay} County, Florida. Get bail posted fast — call Shamrock 24/7 at (239) 332-2245.`,
        slug: countySlug
    });
}

export function first_appearance_SiteMap() {
    const entries = [
        {
            pageName: HUB_PAGE,
            url: FA_HUB_PATH,
            title: 'First Appearance Hearings in Florida | Court Schedules & Bail Help',
            lastModified: new Date()
        },
        // Alias path if static slug is configured in Editor
        {
            pageName: HUB_PAGE,
            url: '/first-appearance-hub',
            title: 'First Appearance Hearings in Florida | Court Schedules & Bail Help',
            lastModified: new Date()
        }
    ];

    COUNTY_SLUGS.forEach((slug) => {
        const name = slug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        entries.push({
            pageName: COUNTY_PAGE,
            url: `/first-appearance/${slug}`,
            title: `First Appearance Hearing in ${name} County, FL | Shamrock Bail Bonds`,
            lastModified: new Date()
        });
    });

    return entries;
}
