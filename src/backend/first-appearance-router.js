/**
 * Router: /first-appearance[/{county-slug}]
 *
 * One router page is registered (code: first-appearance.h4fpl.js).
 * Live routers config (verified 2026-10-02 on shamrockbailbonds.biz, after
 * the PR #39 deploy, gridAppId a32b044a-5ff2-41ae-82d1-794f38cbf5f8):
 *   pages: { "<role-uuid>": "h4fpl" }   // thunderbolt internal id
 *   pageRoles title: "first-appearance"  // code-sidebar page name
 *   pageUriSEO: "first-appearance-hub"
 *
 * wix-router ok(pageName, routerReturnedData) takes the code-sidebar page
 * name, the same string bail-bonds-router passes ('Florida Counties').
 * The public pages map value "h4fpl" is not that argument.
 *
 * PR #39 deployed ok with the thunderbolt id plus HeadOptions. The public dispatcher still
 * returns UserCodeError ("Unable to handle the request") in ~2s — not a
 * 14s execution timeout, and the page id did not drift. Page code never
 * runs. Drop the page id and the third HeadOptions argument. Page code
 * sets the HTML title with wixSeo.setTitle once the page loads.
 *
 * County URLs (/first-appearance/lee, etc.) load that SAME page. The slug
 * is router data so the embed can focus that county.
 *
 * /first-appearance-hub is outside this prefix (pageUriSEO leftover). It
 * 404s at the platform layer. Do not sitemap it. masterPage.js can
 * client-redirect after JS; a real 301 is an Editor URL redirect.
 */

import { ok, redirect, notFound } from 'wix-router';

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

export function first_appearance_Router(request) {
    try {
        const rawSlug = (request.path && request.path[0]) || '';
        const countySlug = normalizeSlug(rawSlug);

        console.log(
            `[FA Router] path=${(request.path || []).join('/')} slug=${countySlug || '(hub)'} page=${HUB_PAGE}`
        );

        // Always the hub template (embed with all 67 counties).
        // When slug is set, page code focuses that county in the embed.
        // Two arguments only — same shape as bail-bonds-router ok().
        if (!countySlug) {
            const title = 'First Appearance Hearing in Florida | Live Court Schedules | Shamrock Bail Bonds';
            const description =
                'Find First Appearance schedules for every Florida county. Live streams when available; courthouse info when not. Shamrock Bail Bonds 24/7.';
            return ok(HUB_PAGE, {
                title: title,
                description: description,
                slug: '',
                isHub: true
            });
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
        return ok(HUB_PAGE, {
            title: title,
            description: description,
            slug: countySlug,
            isHub: false
        });
    } catch (err) {
        console.error('[FA Router] Unhandled error:', err);
        // A redirect back to /first-appearance re-enters this router. If ok()
        // threw, that loop becomes a generic UserCodeError. Stop here.
        return notFound();
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
