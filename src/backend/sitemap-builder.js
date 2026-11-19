/**
 * Pure builder for GET /_functions/sitemap (see http-functions.js get_sitemap).
 *
 * Indexing audit 2026-11-19 rules:
 *   - Never list robots-blocked, redirecting, deleted or utility URLs.
 *   - One homepage entry, no trailing slash (matches the live canonical).
 *   - /first-appearance/<county> only once that county has its own content
 *     (public/first-appearance-seo.js FA_OWN_CONTENT_COUNTIES).
 *   - lastmod is a real content date (CMS _updatedDate, blog
 *     lastPublishedDate) or it is left out. Never the request date.
 *
 * No Wix imports, so Node tests can call it directly.
 */

export const SITEMAP_SITE_URL = 'https://www.shamrockbailbonds.biz';

/** Paths that must never appear in the custom sitemap. */
export const SITEMAP_EXCLUDED_PATHS = Object.freeze([
    // Disallowed in robots.txt
    '/portal-landing',
    '/portal-defendant',
    '/portal-indemnitor',
    '/portal-staff',
    '/communication-preferences',
    '/data-deletion',
    // Deleted blog categories (404 in the 2026-11-19 audit)
    '/blog/categories/family-cosigner-guides',
    '/blog/categories/fort-myers-local',
    // 301 to /bail-school#become-a-bondsman
    '/how-to-become-a-bondsman',
    // Platform 404 alias of /first-appearance
    '/first-appearance-hub'
]);

export const SITEMAP_STATIC_PAGES = Object.freeze([
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/how-bail-works', priority: '0.9', changefreq: 'monthly' },
    { url: '/bail-school', priority: '0.9', changefreq: 'weekly' },
    { url: '/contact', priority: '0.8', changefreq: 'monthly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/blog', priority: '0.8', changefreq: 'daily' },
    { url: '/testimonials', priority: '0.6', changefreq: 'monthly' },
    { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms-and-conditions', priority: '0.3', changefreq: 'yearly' }
]);

/** YYYY-MM-DD from a Date, ISO string or epoch ms; '' when missing or invalid. */
export function toLastmod(value) {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

/** Absolute URL; the homepage is always SITE_URL with no trailing slash. */
export function toLoc(path) {
    const raw = String(path || '');
    if (/^https?:\/\//i.test(raw)) {
        return raw.replace(/^(https?:\/\/[^/]+)\/$/, '$1');
    }
    const p = raw.startsWith('/') ? raw : `/${raw}`;
    if (p === '/' || p === '') return SITEMAP_SITE_URL;
    return `${SITEMAP_SITE_URL}${p.replace(/\/+$/, '')}`;
}

export function isExcludedLoc(loc) {
    const path = loc.replace(SITEMAP_SITE_URL, '').split(/[?#]/)[0].toLowerCase() || '/';
    return SITEMAP_EXCLUDED_PATHS.indexOf(path) > -1;
}

function escapeXml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * @param {object} input
 * @param {string[]} input.cityLandingSlugs
 * @param {{slug: string, updated?: any}[]} input.countyPages  canonical /florida-bail-bonds county slugs
 * @param {{path: string, lastmod?: string}[]} input.firstAppearance  from firstAppearanceSitemapEntries()
 * @param {{path: string, updated?: any}[]} input.blogPosts
 * @returns {{loc: string, lastmod: string, changefreq: string, priority: string}[]}
 */
export function buildSitemapEntries(input) {
    const opts = input || {};
    const urls = [];
    const seen = new Set();

    function add(path, priority, changefreq, lastmod) {
        const loc = toLoc(path);
        if (seen.has(loc) || isExcludedLoc(loc)) return;
        seen.add(loc);
        urls.push({
            loc,
            lastmod: toLastmod(lastmod),
            changefreq: changefreq || 'monthly',
            priority: priority || '0.5'
        });
    }

    SITEMAP_STATIC_PAGES.forEach((p) => add(p.url, p.priority, p.changefreq, ''));

    (opts.firstAppearance || []).forEach((e, i) => {
        add(e.path, i === 0 ? '0.9' : '0.7', i === 0 ? 'weekly' : 'monthly', e.lastmod);
    });

    // Counties first so a shared URL (e.g. /florida-bail-bonds/sarasota) keeps its CMS date.
    (opts.countyPages || []).forEach((c) => {
        if (!c || !c.slug) return;
        add(`/florida-bail-bonds/${encodeURIComponent(c.slug)}`, '0.85', 'weekly', c.updated);
    });

    (opts.cityLandingSlugs || []).forEach((slug) => {
        add(`/florida-bail-bonds/${slug}`, '0.9', 'weekly', '');
    });

    (opts.blogPosts || []).forEach((b) => {
        if (!b || !b.path) return;
        add(b.path, '0.65', 'weekly', b.updated);
    });

    return urls;
}

export function renderSitemapXml(entries) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    (entries || []).forEach((u) => {
        xml += `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n`;
        if (u.lastmod) xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
    });
    xml += '</urlset>';
    return xml;
}
