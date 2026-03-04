/**
 * Router for Florida County Dynamic Pages.
 * Handles:
 * - /bail-bonds/{county-slug}
 * - /florida-bail-bonds/{county-slug}
 */

import { ok, notFound } from 'wix-router';

const COUNTY_PAGE_NAME = 'Florida Counties';

export async function routeCountyPage(request) {
    const rawSlug = request.path[0] || ''; // e.g., "lee" or "lee-county"

    // HARDENED (2026-03-04): Normalise slug at the router level so the county
    // page always receives a clean slug regardless of what the URL contains.
    const countySlug = rawSlug.toLowerCase().trim().replace(/-county$/i, '');

    console.log(`[County Router] Request Path: ${request.path.join('/')}`);
    console.log(`[County Router] Raw slug: '${rawSlug}' -> Normalised: '${countySlug}'`);

    if (!countySlug) {
        // No slug -- let the page handle it gracefully
        return ok(COUNTY_PAGE_NAME, {
            title: 'Florida Bail Bonds',
            description: 'Professional bail bond services throughout Florida',
            slug: ''
        });
    }

    // Return OK to render the page.
    // The page code (Florida Counties.qx7lv.js) reads wixLocation.path to get the slug.
    return ok(COUNTY_PAGE_NAME, {
        title: `Bail Bonds in ${countySlug} County, Florida`,
        description: `Professional 24/7 bail bond services in ${countySlug} County, Florida. Call Shamrock Bail Bonds now.`,
        slug: countySlug
    });
}

export async function bailbonds_Router(request) {
    return routeCountyPage(request);
}
