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
 * is router data so the embed can focus that county. Until a county has its
 * own content it canonicals to /first-appearance (see first-appearance-seo).
 *
 * /first-appearance-hub is outside this prefix (pageUriSEO leftover). It
 * 404s at the platform layer. Do not sitemap it. masterPage.js can
 * client-redirect after JS; a real 301 is an Editor URL redirect.
 */

import { ok, redirect, notFound } from 'wix-router';
import {
    FA_HUB_PATH as SHARED_HUB_PATH,
    faCountyName,
    resolveFirstAppearancePath,
    firstAppearanceSitemapEntries
} from 'public/first-appearance-seo';

const HUB_PAGE = 'first-appearance';
export const FA_HUB_PATH = SHARED_HUB_PATH;

/*
 * County list and own-content switch live in public/first-appearance-seo.js
 * so page code, this router and /_functions/sitemap agree.
 *
 * Indexing audit 2026-11-19: on the Studio site /first-appearance is a
 * static page (eo050), not a router page, so Wix serves it for any trailing
 * path with a 200. Wix rejected a "first-appearance" router prefix
 * (2026-11-19) because it conflicts with that static page, so this router is
 * NOT active. Page code applies canonical/robots and the per-county switch.
 * Kept in sync for the day the page moves under a router.
 */

export function first_appearance_Router(request) {
    try {
        const segments = request.path || [];
        const route = resolveFirstAppearancePath(segments);

        console.log(
            `[FA Router] path=${segments.join('/')} kind=${route.kind} slug=${route.slug || '(none)'} page=${HUB_PAGE}`
        );

        // Two arguments only — same shape as bail-bonds-router ok().
        if (route.kind === 'hub') {
            const title = 'First Appearance Hearing in Florida | Live Court Schedules | Shamrock Bail Bonds';
            const description =
                'Find First Appearance schedules for every Florida county. Live streams when available; courthouse info when not. Shamrock Bail Bonds 24/7.';
            return ok(HUB_PAGE, {
                title: title,
                description: description,
                slug: '',
                isHub: true,
                canonical: route.canonical,
                robots: route.robots
            });
        }

        // Unknown slugs used to return 200 with the hub (indexable soft 404, audits 2026-09-27 and 2026-11-19).
        if (route.kind === 'unknown') return notFound();

        // Case, "-county" and compact variants of a known county.
        if (route.redirectTo) return redirect(route.redirectTo, '301');

        const name = faCountyName(route.slug);
        const title = `First Appearance Hearing in ${name} County, FL | Shamrock Bail Bonds`;
        const description = `${name} County First Appearance schedule, location, and live feed if available. Call Shamrock 24/7 at (239) 332-2245.`;
        return ok(HUB_PAGE, {
            title: title,
            description: description,
            slug: route.slug,
            isHub: false,
            canonical: route.canonical,
            robots: route.robots
        });
    } catch (err) {
        console.error('[FA Router] Unhandled error:', err);
        // A redirect back to /first-appearance re-enters this router. If ok()
        // threw, that loop becomes a generic UserCodeError. Stop here.
        return notFound();
    }
}

/**
 * Router sitemap: the hub plus counties with their own content only.
 * lastModified is a real content date or omitted, never "now".
 */
export function first_appearance_SiteMap() {
    return firstAppearanceSitemapEntries().map((e) => {
        const entry = { pageName: HUB_PAGE, url: e.path, title: e.title };
        if (e.lastmod) entry.lastModified = new Date(`${e.lastmod}T00:00:00Z`);
        return entry;
    });
}
