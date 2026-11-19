/**
 * First Appearance URL rules shared by page code, the router and the custom sitemap.
 *
 * Indexing audit, 2026-11-19: all 67 /first-appearance/<county> URLs served
 * the same text as the /first-appearance hub, and any slug returned 200.
 *
 * Until a county has its own content:
 *   - /first-appearance/<county> canonicals to /first-appearance.
 *   - It is left out of every sitemap.
 * Unknown slugs are noindex with a hub canonical in page code. The router
 * (if a router prefix is registered in Studio) returns a real 404.
 *
 * Per-county switch: when Writer's content for a county is live on the page,
 * add the slug to FA_OWN_CONTENT_COUNTIES with the date that content went
 * live. That county then self-canonicals and rejoins /_functions/sitemap
 * with that date as lastmod. Do not add a county before its content shows.
 *
 * Pure module: no Wix imports, so Node tests can load it.
 */

export const FA_SITE_URL = 'https://www.shamrockbailbonds.biz';
export const FA_HUB_PATH = '/first-appearance';

/**
 * Date the hub content last changed, as YYYY-MM-DD, for sitemap lastmod.
 * Empty means lastmod is omitted. Set it only from a real content edit.
 */
export const FA_HUB_LASTMOD = '';

export const FA_COUNTY_SLUGS = Object.freeze([
    'alachua', 'baker', 'bay', 'bradford', 'brevard', 'broward', 'calhoun', 'charlotte',
    'citrus', 'clay', 'collier', 'columbia', 'desoto', 'dixie', 'duval', 'escambia',
    'flagler', 'franklin', 'gadsden', 'gilchrist', 'glades', 'gulf', 'hamilton', 'hardee',
    'hendry', 'hernando', 'highlands', 'hillsborough', 'holmes', 'indian-river', 'jackson',
    'jefferson', 'lafayette', 'lake', 'lee', 'leon', 'levy', 'liberty', 'madison',
    'manatee', 'marion', 'martin', 'miami-dade', 'monroe', 'nassau', 'okaloosa',
    'okeechobee', 'orange', 'osceola', 'palm-beach', 'pasco', 'pinellas', 'polk',
    'putnam', 'santa-rosa', 'sarasota', 'seminole', 'st-johns', 'st-lucie', 'sumter',
    'suwannee', 'taylor', 'union', 'volusia', 'wakulla', 'walton', 'washington'
]);

/**
 * Counties whose /first-appearance/<slug> page has its own content.
 * Shape: { '<slug>': 'YYYY-MM-DD' } (date the county content went live).
 * Empty until Writer's county content is on the page.
 */
export const FA_OWN_CONTENT_COUNTIES = Object.freeze({});

export function faCountyName(slug) {
    return String(slug || '')
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

/** Lowercase, trim, drop a trailing "-county" / " county". */
export function normalizeFaSlug(raw) {
    return String(raw || '')
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-county$/, '');
}

/** Match "palmbeach" or "stjohns" to the hyphenated county slug. */
function matchCompactSlug(slug) {
    const compact = slug.replace(/[^a-z]/g, '');
    return FA_COUNTY_SLUGS.find((s) => s.replace(/-/g, '') === compact) || '';
}

export function faHasOwnContent(slug) {
    return Object.prototype.hasOwnProperty.call(FA_OWN_CONTENT_COUNTIES, slug);
}

/**
 * Classify the path segments after /first-appearance.
 *
 * Returns:
 *   kind:       'hub' | 'county' | 'unknown'
 *   slug:       canonical county slug ('' for hub/unknown)
 *   rawSlug:    first segment as requested
 *   canonical:  absolute canonical URL
 *   robots:     'index, follow' | 'noindex, follow'
 *   inSitemap:  boolean
 *   redirectTo: path for a 301 when the request is a variant of a known
 *               county (case, "-county", "palmbeach"); '' otherwise
 */
export function resolveFirstAppearancePath(segments) {
    const segs = (Array.isArray(segments) ? segments : [segments])
        .map((s) => String(s == null ? '' : s).trim())
        .filter((s) => s && s !== 'first-appearance' && s !== 'first-appearance-hub');

    const hubUrl = FA_SITE_URL + FA_HUB_PATH;

    if (!segs.length) {
        return {
            kind: 'hub', slug: '', rawSlug: '', canonical: hubUrl,
            robots: 'index, follow', inSitemap: true, redirectTo: ''
        };
    }

    const rawSlug = segs[0];
    if (segs.length > 1) {
        return {
            kind: 'unknown', slug: '', rawSlug, canonical: hubUrl,
            robots: 'noindex, follow', inSitemap: false, redirectTo: ''
        };
    }

    const normalized = normalizeFaSlug(rawSlug);
    let slug = FA_COUNTY_SLUGS.indexOf(normalized) > -1 ? normalized : matchCompactSlug(normalized);

    if (!slug) {
        return {
            kind: 'unknown', slug: '', rawSlug, canonical: hubUrl,
            robots: 'noindex, follow', inSitemap: false, redirectTo: ''
        };
    }

    const own = faHasOwnContent(slug);
    const countyPath = `${FA_HUB_PATH}/${slug}`;
    return {
        kind: 'county',
        slug,
        rawSlug,
        canonical: own ? FA_SITE_URL + countyPath : hubUrl,
        robots: 'index, follow',
        inSitemap: own,
        redirectTo: rawSlug === slug ? '' : countyPath
    };
}

/**
 * Sitemap entries for First Appearance: the hub plus counties that have
 * their own content. lastmod is a real content date, never "today".
 */
export function firstAppearanceSitemapEntries() {
    const entries = [{ path: FA_HUB_PATH, lastmod: FA_HUB_LASTMOD, title: 'First Appearance Hearings in Florida' }];
    FA_COUNTY_SLUGS.forEach((slug) => {
        if (!faHasOwnContent(slug)) return;
        entries.push({
            path: `${FA_HUB_PATH}/${slug}`,
            lastmod: FA_OWN_CONTENT_COUNTIES[slug] || '',
            title: `First Appearance Hearing in ${faCountyName(slug)} County, FL`
        });
    });
    return entries;
}
