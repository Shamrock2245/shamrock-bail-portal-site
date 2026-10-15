/**
 * Public URL redirects for Search Console.
 *
 * /bail-bonds/{florida-county} is a Velo router prefix, so the multi-state
 * router can answer an exact published slug with a real 301. /bail-bonds/{slug}-county
 * 404s before that code runs. /terms-of-service and /first-appearance-hub are
 * ordinary Wix pages, outside every router prefix. Those URLs belong in the
 * Wix dashboard URL Redirect Manager (see DASHBOARD_URL_REDIRECTS).
 */

export const FLORIDA_COUNTY_SLUGS = [
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
 * Pages the Velo router never receives.
 * /bail-bonds/lee 301s in the router. /bail-bonds/lee-county 404s at the
 * Wix platform before that code runs (same for any segment that is not an
 * exact published slug). A 301 for these has to be saved in the Wix Editor:
 * Settings → SEO → URL Redirect Manager.
 */
export function countySuffixRedirects() {
    return FLORIDA_COUNTY_SLUGS.map((slug) => ({
        from: '/bail-bonds/' + slug + '-county',
        to: floridaCountyCanonicalPath(slug),
        status: 301
    }));
}

export const DASHBOARD_URL_REDIRECTS = [
    { from: '/terms-of-service', to: '/terms-and-conditions', status: 301 },
    { from: '/first-appearance-hub', to: '/first-appearance', status: 301 }
].concat(countySuffixRedirects());

export function normalizeCountySlug(raw) {
    return String(raw || '')
        .toLowerCase()
        .trim()
        .replace(/-county$/i, '')
        .replace(/\s+/g, '-');
}

/**
 * Canonical path for a Florida county alias, or '' when the segment is not
 * one of the 67 counties (state codes such as ga/tx stay on the multi-state router).
 * @param {string} raw
 * @returns {string}
 */
export function floridaCountyCanonicalPath(raw) {
    const slug = normalizeCountySlug(raw);
    if (!slug || FLORIDA_COUNTY_SLUGS.indexOf(slug) === -1) return '';
    return '/florida-bail-bonds/' + slug;
}
