/**
 * Router for Florida County Dynamic Pages.
 * Handles:
 * - /bail-bonds/{county-slug}
 * - /florida-bail-bonds/{county-slug}
 */

import { ok, notFound } from 'wix-router';

// Dynamic item routes must target the Dynamic Item page name, not the list page name.
const COUNTY_ITEM_PAGE_NAME = 'Florida Counties (Item)';

export async function bailbonds_Router(request) {
    const countySlug = request.path[0];

    console.log(`[County Router] Prefix: ${request.prefix || 'unknown'} Path: ${request.path.join('/')}`);

    if (!countySlug) {
        console.error('[County Router] Missing county slug.');
        return notFound();
    }

    return ok(COUNTY_ITEM_PAGE_NAME, {
        title: `Bail Bonds in ${countySlug}`,
        description: `Professional bail bond services in ${countySlug}, Florida`,
        slug: countySlug
    });
}
