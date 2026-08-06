/**
 * Router for First Appearance County Pages.
 * Handles: /first-appearance/{county-slug}
 *
 * HUB (full UI — all 67 counties, nearest-first search):
 *   /first-appearance            → first-appearance.h4fpl.js
 *
 * County pSEO:
 *   /first-appearance/lee
 *   /first-appearance/miami-dade
 *   /first-appearance/lee-county  (normalized → lee)
 *
 * CRITICAL (Wix):
 *   ok(pageName) MUST match a page that is **added to this router** in the Editor
 *   (Site Pages → First-appearance Pages). If the name is wrong or the page is
 *   missing from the router, Wix serves title **"500 | Shamrock Bail Bonds"**
 *   and Google Search Console rejects indexing (soft error / live-test fail).
 *
 * Editor must have:
 *   1) Page code first-appearance.h4fpl.js     → router page name "first-appearance"
 *   2) Page code first-appearance-page.nmw1v.js → router page name "first-appearance-page"
 *      (Add page to router if only one page shows under the router.)
 */

import { ok } from 'wix-router';

/** Preferred names — must match Editor router page names exactly. */
const HUB_PAGE_PREFERRED = 'first-appearance';
const COUNTY_PAGE_PREFERRED = 'first-appearance-page';

/** Public canonical hub path. */
export const FA_HUB_PATH = '/first-appearance';

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
 * Resolve ok() page names from the pages actually attached to this router.
 * Prevents hard 500 when Editor names differ slightly or a second page is missing.
 *
 * @param {Object} request - Wix router request (has .pages array of names)
 * @returns {{ hub: string, county: string, pages: string[] }}
 */
function resolveRouterPages(request) {
    const pages = Array.isArray(request && request.pages) ? request.pages.slice() : [];

    let hub = pages.includes(HUB_PAGE_PREFERRED)
        ? HUB_PAGE_PREFERRED
        : pages.find((p) => /first.?appearance/i.test(p) && !/page/i.test(p)) || pages[0] || HUB_PAGE_PREFERRED;

    let county = pages.includes(COUNTY_PAGE_PREFERRED)
        ? COUNTY_PAGE_PREFERRED
        : pages.find((p) => p !== hub && /first.?appearance/i.test(p)) ||
          pages.find((p) => p !== hub) ||
          hub; // last resort: same template as hub (better than 500)

    return { hub, county, pages };
}

/**
 * Prefix: first-appearance
 *
 *   /first-appearance            → hub page (h4fpl embed + nearest-first UX)
 *   /first-appearance/lee        → county page
 *   /first-appearance/lee-county → county page (normalized → "lee")
 */
export function first_appearance_Router(request) {
    const rawSlug = (request.path && request.path[0]) || '';
    const countySlug = normalizeSlug(rawSlug);
    const { hub, county, pages } = resolveRouterPages(request);

    console.log(
        `[FA Router] path='${(request.path || []).join('/')}' slug='${countySlug}' ` +
            `routerPages=${JSON.stringify(pages)} → hub='${hub}' county='${county}'`
    );

    // ── EMPTY SLUG → HUB ──
    if (!countySlug) {
        return ok(hub, {
            title: 'First Appearance Hearing in Florida | Live Court Schedules | Shamrock Bail Bonds',
            description:
                'Find First Appearance hearing schedules for every Florida county. Nearest counties first when location is allowed. Live court streams, bail help 24/7 from Shamrock Bail Bonds.',
            slug: '',
            isHub: true
        });
    }

    // ── COUNTY SLUG → COUNTY PAGE ──
    const countyNameDisplay = countySlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    return ok(county, {
        title: `First Appearance Hearing in ${countyNameDisplay} County, FL | Shamrock Bail Bonds`,
        description: `First Appearance schedule, bail info, and live court access for ${countyNameDisplay} County, Florida. Get bail posted fast — call Shamrock 24/7 at (239) 332-2245.`,
        slug: countySlug,
        isHub: false
    });
}

export function first_appearance_SiteMap() {
    const entries = [
        {
            pageName: HUB_PAGE_PREFERRED,
            url: FA_HUB_PATH,
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
            pageName: COUNTY_PAGE_PREFERRED,
            url: `/first-appearance/${slug}`,
            title: `First Appearance Hearing in ${name} County, FL | Shamrock Bail Bonds`,
            lastModified: new Date()
        });
    });

    return entries;
}
