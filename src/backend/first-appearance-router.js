/**
 * Router for First Appearance County Pages.
 * Handles: /first-appearance/{county-slug}
 *
 * Pattern: Mirrors bail-bonds-router.js but for First Appearance landing pages.
 * Each county page gets its own SEO-rich page with:
 *  - County-specific First Appearance schedule (time, location, access type)
 *  - Courthouse info, judges, livestream/Zoom links
 *  - Localized FAQs, internal links to /florida-bail-bonds/{county}
 *  - BreadcrumbList, FAQPage, LegalService, Event schemas
 *
 * URL Examples:
 *  /first-appearance/lee-county    → slug: "lee"
 *  /first-appearance/lee           → slug: "lee"
 *  /first-appearance/collier       → slug: "collier"
 *  /first-appearance/miami-dade    → slug: "miami-dade"
 */

import { ok, notFound } from 'wix-router';

const DYNAMIC_PAGE_NAME = 'First Appearance County';

/**
 * Normalise the raw URL slug.
 * Strips trailing "-county", lowercases, and trims.
 * Matches the bail-bonds-router.js convention so slugs are consistent across
 * both /florida-bail-bonds/{slug} and /first-appearance/{slug}.
 */
function normalizeSlug(raw) {
    return (raw || '')
        .toLowerCase()
        .trim()
        .replace(/-county$/i, '');
}

/**
 * Main router export.
 * Wix looks for a function named `{prefix}_Router` matching the URL prefix
 * registered in the Wix Editor's Router settings.
 *
 * Prefix: first-appearance
 * Example: /first-appearance/lee-county  → path = ["lee-county"]
 */
export function first_appearance_Router(request) {
    const rawSlug = request.path[0] || '';
    const countySlug = normalizeSlug(rawSlug);

    console.log(`[FA Router] Path: ${request.path.join('/')} → slug: '${countySlug}'`);

    // No slug → hub page handles itself (static /first-appearance)
    if (!countySlug) {
        return ok(DYNAMIC_PAGE_NAME, {
            title: 'First Appearance Hearings in Florida',
            description: 'Find First Appearance hearing schedules for every Florida county. Live court streams, bail information, and 24/7 bond help.',
            slug: ''
        });
    }

    // Format a display-friendly county name from the slug
    const countyNameDisplay = countySlug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    return ok(DYNAMIC_PAGE_NAME, {
        title: `First Appearance Hearing in ${countyNameDisplay} County, FL | Shamrock Bail Bonds`,
        description: `First Appearance schedule, bail info, and live court access for ${countyNameDisplay} County, Florida. Get bail posted fast — call Shamrock 24/7.`,
        slug: countySlug
    });
}
