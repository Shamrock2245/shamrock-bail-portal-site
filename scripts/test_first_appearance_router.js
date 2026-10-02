#!/usr/bin/env node
/**
 * Guards for /first-appearance ok() shape.
 *
 * Live Wix routers config (shamrockbailbonds.biz, after PR #39 deploy):
 *   pages: { "<role-uuid>": "h4fpl" }   // thunderbolt id, not an ok() argument
 *   title: "first-appearance"            // code-sidebar page name
 *   pageUriSEO: "first-appearance-hub"
 *
 * ok('h4fpl', data, head) was deployed and the public dispatcher still
 * returned UserCodeError. The working county router calls
 * ok('Florida Counties', data) with two arguments. Match that:
 *   ok('first-appearance', data)
 * Sitemap pageName is the same page name. No HeadOptions. No self-redirect
 * back onto /first-appearance when ok() throws.
 *
 * After a Velo deploy (not Classic Publish; uiVersion stays pinned), verify:
 *   curl -sL 'https://www.shamrockbailbonds.biz/first-appearance?cb=1' | grep -o '<title>[^<]*'
 *   curl -sL 'https://www.shamrockbailbonds.biz/first-appearance/lee?cb=1' | grep -o '<title>[^<]*'
 * Titles must start with "First Appearance Hearing", not "500 |" or "404 |".
 * HTTP status is often 200 either way. Cache-bust the query so Cloudflare
 * does not replay the previous 500 HTML.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(
    path.join(ROOT, 'src/backend/first-appearance-router.js'),
    'utf8'
);
const routers = fs.readFileSync(path.join(ROOT, 'src/backend/routers.js'), 'utf8');

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

assert(src.indexOf("const HUB_PAGE = 'first-appearance'") > -1, 'page name constant must be first-appearance');
assert(src.indexOf('ok(HUB_PAGE,') > -1, 'ok() must receive the code-sidebar page name and data');
assert(src.indexOf("ok('h4fpl'") === -1, 'ok() must not receive the thunderbolt page id');
assert(src.indexOf('ok(HUB_PAGE_ID') === -1, 'ok() must not receive HUB_PAGE_ID');
assert(src.indexOf('HUB_PAGE_ID') === -1, 'do not keep an id constant that can be passed to ok()');
assert(src.indexOf('buildHead(') === -1, 'do not pass HeadOptions; page code sets the HTML title');
assert(src.indexOf('pageName: HUB_PAGE,') > -1, 'sitemap pageName must be the page name');
assert(src.indexOf('pageName: HUB_PAGE_ID') === -1, 'sitemap must not use the page id');
assert(src.indexOf('return redirect(FA_HUB_PATH)') === -1, 'catch must not self-redirect onto this prefix');
assert(src.indexOf('return notFound()') > -1, 'router catch returns notFound');

const countyCount = (src.match(/'alachua'/) || []).length;
assert(countyCount === 1, 'county slug list must stay in the router');
assert(src.indexOf("'lee'") > -1 && src.indexOf("'miami-dade'") > -1, 'canonical county slugs must remain');

assert(
    routers.indexOf("return redirect('/first-appearance')") === -1,
    'routers.js wrapper must not self-redirect onto /first-appearance'
);
assert(routers.indexOf('return notFound()') > -1, 'routers.js wrapper catch returns notFound');
assert(routers.indexOf('notFound') > -1 && routers.indexOf("from 'wix-router'") > -1, 'notFound must be imported from wix-router');

const page = fs.readFileSync(path.join(ROOT, 'src/pages/first-appearance.h4fpl.js'), 'utf8');
assert(page.indexOf("$w('HtmlComponent')") > -1, 'hub must bind HtmlComponent by type if nickname is missing');
assert(page.indexOf('first-appearance-page.nmw1v.js') === -1, 'stale county-template comment must be gone');
assert(page.indexOf('MUST ok("h4fpl")') === -1, 'page comment must not instruct ok(h4fpl)');

const http = fs.readFileSync(path.join(ROOT, 'src/backend/http-functions.js'), 'utf8');
assert(http.indexOf("'/first-appearance-hub'") === -1, 'custom sitemap must not advertise the 404 alias');

const config = fs.readFileSync(path.join(ROOT, 'wix.config.json'), 'utf8');
assert(config.indexOf('"uiVersion": "2775"') > -1, 'uiVersion pin must stay 2775');

console.log('ok');
