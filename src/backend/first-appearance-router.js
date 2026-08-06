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
 * Two pages live under this router.
 *
 * HUB (empty path) → first-appearance.h4fpl.js  — FULL hub page (embed + SEO).
 *   Wix page name / title: "first-appearance"  (page id h4fpl)
 *
 * COUNTY (/{slug}) → first-appearance-page.nmw1v.js — county pSEO shell (minimal).
 *   Wix page name / title: "first-appearance-page" (page id nmw1v)
 *
 * If ok(pageName) does not match the router page name exactly, Wix serves
 * title "500 | Shamrock Bail Bonds" and h4fpl.js NEVER runs — Google sees an error page.
 */
const HUB_PAGE = 'first-appearance'; // → first-appearance.h4fpl.js
const COUNTY_PAGE = 'first-appearance-page'; // → first-appearance-page.nmw1v.js

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

    console.log(`[FA Router] Path: ${(request.path || []).join('/')} → slug: '${countySlug}'`);

    // ── EMPTY SLUG → HUB PAGE ──
    // Serves the existing First Appearance page (with Netlify embed bridge)
    if (!countySlug) {
        return ok(HUB_PAGE, {
            title: 'First Appearance Hearings in Florida | Court Schedules & Bail Help',
            description:
                'Find First Appearance hearing schedules for every Florida county. Live court streams, bail information, and 24/7 bond help from Shamrock Bail Bonds.',
            slug: ''
        });
    }

    // ── COUNTY SLUG → COUNTY PAGE ──
    // Serves the dynamic pSEO template with enriched county data
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
 * Registered as first_appearance_SiteMap in router config.
 */
export function first_appearance_SiteMap() {
    const entries = [
        {
            pageName: HUB_PAGE,
            url: '/first-appearance',
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
