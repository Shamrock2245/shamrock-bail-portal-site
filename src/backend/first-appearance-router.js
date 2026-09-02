/**
 * Router: /first-appearance[/{county-slug}]
 *
 * Only one router page is registered in the Editor: "first-appearance"
 * (code: first-appearance.h4fpl.js + #firstAppearanceEmbed Netlify UI).
 *
 * County URLs (/first-appearance/lee, etc.) must load that SAME page and pass
 * the slug so the embed can focus/search that county. ok() must use the
 * registered page id (h4fpl); a missing name produces GSC 500 titles.
 */

import { ok, redirect } from 'wix-router';

// Live router pages map is { "<uuid>": "h4fpl" } with title "first-appearance".
// ok("first-appearance") 500s when request.pages is empty/object-shaped.
const HUB_PAGE = 'first-appearance';
const HUB_PAGE_ID = 'h4fpl';
const HUB_PAGE_CANDIDATES = [HUB_PAGE_ID, HUB_PAGE, 'First Appearance', 'first-appearance-hub'];
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
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw.map(String).filter(Boolean);
    }
    if (typeof raw === 'object') {
        return Object.keys(raw).map((key) => {
            const value = raw[key];
            if (value && typeof value === 'object') {
                return String(value.id || value.title || value.pageName || '');
            }
            return String(value || '');
        }).filter(Boolean);
    }
    return [String(raw)];
}

/** Prefer the Editor-registered router page; live id is h4fpl. */
function resolveHubPageName(request) {
    const names = listRouterPageNames_(request);
    for (let i = 0; i < HUB_PAGE_CANDIDATES.length; i++) {
        if (names.indexOf(HUB_PAGE_CANDIDATES[i]) !== -1) {
            return HUB_PAGE_CANDIDATES[i];
        }
    }
    if (names.length) return names[0];
    return HUB_PAGE_ID;
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
        if (!countySlug) {
            return ok(pageName, {
                title: 'First Appearance Hearing in Florida | Live Court Schedules | Shamrock Bail Bonds',
                description:
                    'Find First Appearance schedules for every Florida county. Live streams when available; courthouse info when not. Shamrock Bail Bonds 24/7.',
                slug: '',
                isHub: true
            });
        }

        const name = countySlug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        return ok(pageName, {
            title: `First Appearance Hearing in ${name} County, FL | Shamrock Bail Bonds`,
            description: `${name} County First Appearance schedule, location, and live feed if available. Call Shamrock 24/7 at (239) 332-2245.`,
            slug: countySlug,
            isHub: false
        });
    } catch (err) {
        console.error('[FA Router] Unhandled error, redirecting to hub:', err);
        return redirect('/first-appearance-hub');
    }
}

export function first_appearance_SiteMap() {
    const entries = [
        {
            pageName: HUB_PAGE,
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
            pageName: HUB_PAGE,
            url: `/first-appearance/${slug}`,
            title: `First Appearance Hearing in ${name} County, FL | Shamrock Bail Bonds`,
            lastModified: new Date()
        });
    });

    return entries;
}
