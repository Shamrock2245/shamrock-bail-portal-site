/**
 * Router: /first-appearance[/{county-slug}]
 *
 * Only one router page is registered in the Editor
 * (code: first-appearance.h4fpl.js + #firstAppearanceEmbed Netlify UI).
 *
 * Live routers config (verified 2026-10-01 on shamrockbailbonds.biz):
 *   pages: { "<role-uuid>": "h4fpl" }
 *   pageRoles title: "first-appearance"
 *   pageUriSEO: "first-appearance-hub"
 *
 * ok() must be the registered page id "h4fpl". Titles and SEO slugs
 * ("first-appearance", "First Appearance", "first-appearance-hub",
 * "First Appearance County") are not keys in that pages map. Passing them
 * makes Wix render title "500 | Shamrock Bail Bonds" and h4fpl never runs.
 *
 * County URLs (/first-appearance/lee, etc.) load that SAME page. The slug is
 * router data so the embed can focus that county.
 *
 * /first-appearance-hub is outside this prefix (pageUriSEO leftover). It 404s
 * at the platform layer. Do not sitemap it. masterPage.js client-redirects it
 * to /first-appearance after Velo deploy; a real 301 is an Editor URL redirect.
 */

import { ok, redirect, notFound } from 'wix-router';

const HUB_PAGE = 'first-appearance';
const HUB_PAGE_ID = 'h4fpl';
const SITE_ORIGIN = 'https://www.shamrockbailbonds.biz';
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

function listRouterPageNames_(request) {
    const raw = request && request.pages;
    const out = [];
    const push = (value) => {
        if (value == null || value === '') return;
        const token = String(value);
        if (token && out.indexOf(token) === -1) out.push(token);
    };
    const walk = (value) => {
        if (value == null) return;
        if (Array.isArray(value)) {
            value.forEach(walk);
            return;
        }
        if (typeof value === 'object') {
            push(value.id);
            push(value.title);
            push(value.pageName);
            push(value.name);
            push(value.pageUriSEO);
            Object.keys(value).forEach((key) => {
                const child = value[key];
                if (child && typeof child === 'object') walk(child);
                else push(child);
            });
            return;
        }
        push(value);
    };
    walk(raw);
    return out;
}

/**
 * Always the registered page id. Title / SEO-slug aliases are the same page
 * and must not be passed to ok() — that is what produced the live 500 titles.
 */
function resolveHubPageName(request) {
    const aliases = [
        HUB_PAGE,
        'First Appearance',
        'first-appearance-hub',
        'First Appearance County',
        'first-appearance-page'
    ];
    const names = listRouterPageNames_(request);
    if (names.indexOf(HUB_PAGE_ID) !== -1) return HUB_PAGE_ID;
    for (let i = 0; i < names.length; i++) {
        if (aliases.indexOf(names[i]) !== -1) return HUB_PAGE_ID;
    }
    // One unrecognized token is the Editor page id if the code id ever changes.
    if (names.length === 1) return names[0];
    return HUB_PAGE_ID;
}

function buildHead(title, description, canonicalPath) {
    const href = SITE_ORIGIN + canonicalPath;
    return {
        title: title,
        description: description,
        noIndex: false,
        metaTags: [
            { name: 'description', content: description },
            { property: 'og:title', content: title },
            { property: 'og:description', content: description },
            { property: 'og:url', content: href }
        ],
        links: [{ rel: 'canonical', href: href }]
    };
}

export function first_appearance_Router(request) {
    try {
        const rawSlug = (request.path && request.path[0]) || '';
        const countySlug = normalizeSlug(rawSlug);
        const pageName = resolveHubPageName(request);

        console.log(
            `[FA Router] path=${(request.path || []).join('/')} slug=${countySlug || '(hub)'} page=${pageName}`
        );

        // Always the hub template (embed with all 67 counties).
        // When slug is set, page code focuses that county in the embed.
        // Head is the 3rd ok() argument so the HTML title is set even if page code is slow.
        if (!countySlug) {
            const title = 'First Appearance Hearing in Florida | Live Court Schedules | Shamrock Bail Bonds';
            const description =
                'Find First Appearance schedules for every Florida county. Live streams when available; courthouse info when not. Shamrock Bail Bonds 24/7.';
            return ok(
                pageName,
                { title: title, description: description, slug: '', isHub: true },
                buildHead(title, description, FA_HUB_PATH)
            );
        }

        // Unknown slugs used to return 200 with the hub (indexable soft 404, audit 2026-09-27).
        if (COUNTY_SLUGS.indexOf(countySlug) === -1) {
            const compact = countySlug.replace(/[^a-z]/g, '');
            const match = COUNTY_SLUGS.find((s) => s.replace(/-/g, '') === compact);
            if (match) return redirect(`${FA_HUB_PATH}/${match}`, '301');
            return notFound();
        }

        const name = countySlug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        const title = `First Appearance Hearing in ${name} County, FL | Shamrock Bail Bonds`;
        const description = `${name} County First Appearance schedule, location, and live feed if available. Call Shamrock 24/7 at (239) 332-2245.`;
        return ok(
            pageName,
            { title: title, description: description, slug: countySlug, isHub: false },
            buildHead(title, description, `${FA_HUB_PATH}/${countySlug}`)
        );
    } catch (err) {
        console.error('[FA Router] Unhandled error, redirecting to hub:', err);
        // /first-appearance-hub is a stray page titled "404"; send people to the real hub
        return redirect(FA_HUB_PATH);
    }
}

export function first_appearance_SiteMap() {
    const entries = [
        {
            pageName: HUB_PAGE_ID,
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
            pageName: HUB_PAGE_ID,
            url: `/first-appearance/${slug}`,
            title: `First Appearance Hearing in ${name} County, FL | Shamrock Bail Bonds`,
            lastModified: new Date()
        });
    });

    return entries;
}
