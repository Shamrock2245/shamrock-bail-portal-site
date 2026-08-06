/**
 * Router for First Appearance County Pages.
 * Handles: /first-appearance/{county-slug}
 *
 * Canonical HUB (full UI, all 67 counties, nearest-first search):
 *   /first-appearance-hub  → static page first-appearance.h4fpl.js
 *
 * County pSEO:
 *   /first-appearance/lee
 *   /first-appearance/miami-dade
 *   /first-appearance/lee-county  (normalized → lee)
 *
 * Bare /first-appearance redirects to the hub so there is one public URL.
 */

import { ok, redirect } from 'wix-router';

/**
 * HUB is a static page (not under this router):
 *   Wix page: first-appearance.h4fpl.js @ URL /first-appearance-hub
 *
 * COUNTY (/{slug}) → first-appearance-page.nmw1v.js
 *   Wix page name / title: "first-appearance-page" (page id nmw1v)
 *
 * If ok(pageName) does not match the router page name exactly, Wix serves
 * title "500 | Shamrock Bail Bonds" and the page code never runs.
 */
const COUNTY_PAGE = 'first-appearance-page'; // → first-appearance-page.nmw1v.js
const HUB_PATH = '/first-appearance-hub';

/** Florida counties for sitemap discovery (slug form used site-wide). */
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

/**
 * Normalise the raw URL slug.
 * Strips trailing "-county", lowercases, and trims.
 */
function normalizeSlug(raw) {
    return (raw || '')
        .toLowerCase()
        .trim()
        .replace(/-county$/i, '');
}

/**
 * Main router export.
 * Prefix: first-appearance
 *
 * Routes:
 *   /first-appearance            → redirect → /first-appearance-hub
 *   /first-appearance/lee        → COUNTY_PAGE
 *   /first-appearance/lee-county → COUNTY_PAGE (normalized → "lee")
 */
export function first_appearance_Router(request) {
    const rawSlug = request.path[0] || '';
    const countySlug = normalizeSlug(rawSlug);

    console.log(`[FA Router] Path: ${(request.path || []).join('/')} → slug: '${countySlug}'`);

    // ── EMPTY SLUG → CANONICAL HUB ──
    if (!countySlug) {
        // Preserve query string (e.g. ?county=lee)
        const qs = request.query
            ? '?' +
              Object.keys(request.query)
                  .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(request.query[k]))
                  .join('&')
            : '';
        return redirect(HUB_PATH + qs);
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

/**
 * Sitemap entries for Google via Wix router sitemap API.
 */
export function first_appearance_SiteMap() {
    const entries = [
        {
            // Hub is a static page; include for discovery under this prefix too
            pageName: COUNTY_PAGE,
            url: HUB_PATH,
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
