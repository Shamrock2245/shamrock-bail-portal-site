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

/**
 * Two pages live under this router:
 *  - HUB_PAGE:    the original First Appearance page (embed bridge, schedule grid)
 *  - COUNTY_PAGE: the new pSEO dynamic county template
 *
 * The page names here MUST match the page titles in Wix Editor
 * under Site Structure → Routers → first-appearance → Pages.
 */
const HUB_PAGE    = 'First Appearance';
const COUNTY_PAGE = 'First Appearance County';

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
 *
 * Routes:
 *   /first-appearance            → HUB_PAGE   (existing embed + schedule grid)
 *   /first-appearance/lee        → COUNTY_PAGE (pSEO county template)
 *   /first-appearance/lee-county → COUNTY_PAGE (normalized → "lee")
 */
export function first_appearance_Router(request) {
    const rawSlug = request.path[0] || '';
    const countySlug = normalizeSlug(rawSlug);

    console.log(`[FA Router] Path: ${request.path.join('/')} → slug: '${countySlug}'`);

    // ── EMPTY SLUG → HUB PAGE ──
    // Serves the existing First Appearance page (with Netlify embed bridge)
    if (!countySlug) {
        return ok(HUB_PAGE, {
            title: 'First Appearance Hearings in Florida | Court Schedules & Bail Help',
            description: 'Find First Appearance hearing schedules for every Florida county. Live court streams, bail information, and 24/7 bond help.',
            slug: ''
        });
    }

    // ── COUNTY SLUG → COUNTY PAGE ──
    // Serves the dynamic pSEO template with enriched county data
    const countyNameDisplay = countySlug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    return ok(COUNTY_PAGE, {
        title: `First Appearance Hearing in ${countyNameDisplay} County, FL | Shamrock Bail Bonds`,
        description: `First Appearance schedule, bail info, and live court access for ${countyNameDisplay} County, Florida. Get bail posted fast — call Shamrock 24/7.`,
        slug: countySlug
    });
}
