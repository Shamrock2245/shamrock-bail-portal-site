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

import { ok, notFound } from 'wix-router';

const COUNTY_ITEM_PAGE_NAME = 'Florida Counties (Item)';

export async function routeCountyPage(request) {
    const countySlug = request.path[0]; // e.g., "lee-county"

    console.log(`[County Router] Request Path: ${request.path.join('/')}`);
    console.log(`[County Router] Routing slug '${countySlug}' to page '${COUNTY_ITEM_PAGE_NAME}'`);

    if (!countySlug) {
        console.error('[County Router] Missing county slug.');
        return notFound();
    }

    // Return OK to render the dynamic item page.
    // IMPORTANT: For dynamic item URLs, the router target must be the item page name in Wix.
    return ok(COUNTY_ITEM_PAGE_NAME, {
        title: `Bail Bonds in ${countySlug}`,
        description: `Professional bail bond services in ${countySlug}, Florida`,
        slug: countySlug // Pass slug in data just in case
    });
}

export async function bailbonds_Router(request) {
    return routeCountyPage(request);
}
