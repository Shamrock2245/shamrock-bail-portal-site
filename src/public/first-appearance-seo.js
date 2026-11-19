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
 * Per-county switch: when Writer's content for a county is ready, add it to
 * FA_OWN_CONTENT_COUNTIES as { lastmod, heading, body }. That county then:
 *   - keeps robots "index, follow" (never noindex),
 *   - self-canonicals to https://www.shamrockbailbonds.biz/first-appearance/<slug>,
 *   - rejoins /_functions/sitemap with lastmod as its <lastmod>.
 * The router is not active on the Studio site (Wix rejected the
 * "first-appearance" prefix), so page code applies all of this. The static
 * page shows the county text only if the Studio page has a text element
 * with ID faCountyContent (and optionally faCountyHeading). If that element
 * is missing, page code falls back to the hub canonical.
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
 * Shape:
 *   '<slug>': {
 *     lastmod: 'YYYY-MM-DD',   // date this county content went live (sitemap lastmod)
 *     heading: '...',          // optional, shown in #faCountyHeading
 *     body: '...'              // required, Writer's county text for #faCountyContent
 *   }
 * Empty until Writer's county content is ready and reviewed.
 */
export const FA_OWN_CONTENT_COUNTIES = Object.freeze({});

/** Own-content entry for a slug, or null. Needs a valid lastmod and a body. */
export function getFaCountyContent(slug, ownContent = FA_OWN_CONTENT_COUNTIES) {
    const map = ownContent || {};
    if (!slug || !Object.prototype.hasOwnProperty.call(map, slug)) return null;
    const e = map[slug];
    if (!e || typeof e !== 'object') return null;
    const lastmod = String(e.lastmod || '');
    const body = String(e.body || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod) || !body) return null;
    return { lastmod, heading: String(e.heading || '').trim(), body };
}

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

export function faHasOwnContent(slug, ownContent = FA_OWN_CONTENT_COUNTIES) {
    return getFaCountyContent(slug, ownContent) !== null;
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
export function resolveFirstAppearancePath(segments, ownContent = FA_OWN_CONTENT_COUNTIES) {
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

    const own = faHasOwnContent(slug, ownContent);
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
export function firstAppearanceSitemapEntries(ownContent = FA_OWN_CONTENT_COUNTIES) {
    const entries = [{ path: FA_HUB_PATH, lastmod: FA_HUB_LASTMOD, title: 'First Appearance Hearings in Florida' }];
    FA_COUNTY_SLUGS.forEach((slug) => {
        const content = getFaCountyContent(slug, ownContent);
        if (!content) return;
        entries.push({
            path: `${FA_HUB_PATH}/${slug}`,
            lastmod: content.lastmod,
            title: `First Appearance Hearing in ${faCountyName(slug)} County, FL`
        });
    });
    return entries;
}

/**
 * SEO tags page code sets on /first-appearance/<segment> URLs.
 * Returns null for the bare hub (the Studio SEO panel owns it).
 *
 * contentShown: whether page code actually put the county's own text on
 * the page. An enabled county whose text could not be shown falls back to
 * the hub canonical so a duplicate never self-canonicals.
 */
export function buildFirstAppearanceSeo(route, contentShown) {
    if (!route || route.kind === 'hub') return null;
    const hubUrl = FA_SITE_URL + FA_HUB_PATH;
    if (route.kind === 'unknown') {
        return { canonical: hubUrl, robots: 'noindex, follow', title: '', description: '', selfCanonical: false };
    }
    const name = faCountyName(route.slug);
    const self = route.inSitemap && contentShown === true;
    const canonical = self ? FA_SITE_URL + `${FA_HUB_PATH}/${route.slug}` : hubUrl;
    return {
        canonical,
        robots: 'index, follow',
        title: `First Appearance Hearing in ${name} County, FL | Shamrock Bail Bonds`,
        description: `${name} County First Appearance schedule and court information. Shamrock Bail Bonds answers phones 24/7 at (239) 332-2245.`,
        selfCanonical: self
    };
}
