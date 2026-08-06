/**
 * Router: /first-appearance[/{county-slug}]
 *
 * Only one router page is registered in the Editor: "first-appearance"
 * (code: first-appearance.h4fpl.js + #firstAppearanceEmbed Netlify UI).
 *
 * County URLs (/first-appearance/lee, etc.) must load that SAME page and pass
 * the slug so the embed can focus/search that county. Returning a missing
 * "first-appearance-page" caused blank white pages (and GSC 500 titles).
 */

import { ok } from 'wix-router';

const HUB_PAGE = 'first-appearance';
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

/** Prefer Editor-registered page name; never invent a missing second template. */
function resolveHubPageName(request) {
    const pages = Array.isArray(request && request.pages) ? request.pages : [];
    if (pages.includes(HUB_PAGE)) return HUB_PAGE;
    if (pages.length) return pages[0];
    return HUB_PAGE;
}

export function first_appearance_Router(request) {
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
