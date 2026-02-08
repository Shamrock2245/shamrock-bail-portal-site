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

export async function bailbonds_Router(request) {
    const countySlug = request.path[0]; // e.g., "lee-county"

    console.log(`[County Router] Routing to county: ${countySlug}`);

    // Return OK to render the page
    // The page code (Florida Counties.qx7lv.js) will handle the slug
    return ok('Florida Counties', {
        title: `Bail Bonds in ${countySlug}`,
        description: `Professional bail bond services in ${countySlug}, Florida`
    });
}
