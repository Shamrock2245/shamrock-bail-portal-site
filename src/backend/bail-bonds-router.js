/**
 * Router for Florida County Dynamic Pages
 * 
 * This router handles URLs like:
 * /bail-bonds/lee-county
 * /bail-bonds/collier-county
 * etc.
 * 
 * It routes them to the "Florida Counties" dynamic page.
 */

import { ok } from 'wix-router';

const COUNTY_PAGE_NAME = 'Florida Counties';

export async function routeCountyPage(request) {
    const countySlug = request.path[0]; // e.g., "lee-county"

    console.log(`[County Router] Request Path: ${request.path.join('/')}`);
    console.log(`[County Router] Routing slug '${countySlug}' to page '${COUNTY_PAGE_NAME}'`);

    // Return OK to render the page
    // The page code (Florida Counties.qx7lv.js) will handle the slug
    // Ensure this matches the page's internal name in Wix (derived from page file name).
    return ok(COUNTY_PAGE_NAME, {
        title: `Bail Bonds in ${countySlug}`,
        description: `Professional bail bond services in ${countySlug}, Florida`,
        slug: countySlug // Pass slug in data just in case
    });
}

export async function bailbonds_Router(request) {
    return routeCountyPage(request);
}
