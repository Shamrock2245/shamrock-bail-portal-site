#!/usr/bin/env node
/**
 * Guards for /first-appearance router page-name resolution.
 *
 * Live Wix routers config (shamrockbailbonds.biz, 2026-10-01):
 *   pages: { "<role-uuid>": "h4fpl" }
 *   title: "first-appearance"
 *   pageUriSEO: "first-appearance-hub"
 *
 * ok("first-appearance") / ok("First Appearance") does not match that map
 * and the document title becomes "500 | Shamrock Bail Bonds".
 * Every alias must resolve to the page id h4fpl.
 *
 * After a Velo deploy (not Classic Publish; uiVersion stays pinned), verify:
 *   curl -sL https://www.shamrockbailbonds.biz/first-appearance | grep -o '<title>[^<]*'
 *   curl -sL https://www.shamrockbailbonds.biz/first-appearance/lee | grep -o '<title>[^<]*'
 * Titles must not be "500 |" or "404 |". HTTP status is often 200 either way.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(
    path.join(ROOT, 'src/backend/first-appearance-router.js'),
    'utf8'
);

function extractNamedFunction(name) {
    const start = src.indexOf('function ' + name + '(');
    if (start < 0) throw new Error('Missing function ' + name);
    let i = src.indexOf('{', start);
    let depth = 0;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') {
            depth--;
            if (depth === 0) return src.slice(start, i + 1);
        }
    }
    throw new Error('Unclosed function ' + name);
}

const ctx = {
    HUB_PAGE: 'first-appearance',
    HUB_PAGE_ID: 'h4fpl'
};
vm.createContext(ctx);
vm.runInContext(
    extractNamedFunction('listRouterPageNames_') + '\n' +
    extractNamedFunction('resolveHubPageName'),
    ctx
);

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

assert(src.indexOf('HUB_PAGE_ID = \'h4fpl\'') > -1, 'router must default to live page id h4fpl');
assert(src.indexOf('first-appearance-page') > -1, 'alias list must still recognize the retired template name');
assert(src.indexOf('ok(COUNTY_PAGE') === -1 && src.indexOf('ok(\'first-appearance\'') === -1, 'router must not hard-code a title into ok()');
assert(src.indexOf('pageName: HUB_PAGE_ID') > -1, 'sitemap pageName must be the page id');
assert(src.indexOf('pageName: HUB_PAGE,') === -1, 'sitemap must not use the title as pageName');
assert(src.indexOf('buildHead(') > -1, 'ok() must pass head options so the HTML title is set');

const livePages = { pages: { 'dd6a7207-8621-460c-aaad-3abfff7d9668': 'h4fpl' } };
assert(ctx.resolveHubPageName(livePages) === 'h4fpl', 'object pages map must resolve h4fpl');
assert(ctx.resolveHubPageName({}) === 'h4fpl', 'empty request must ok(h4fpl)');
assert(ctx.resolveHubPageName({ pages: ['first-appearance'] }) === 'h4fpl', 'title array must not be passed to ok()');
assert(ctx.resolveHubPageName({ pages: ['First Appearance'] }) === 'h4fpl', 'legacy title must map to h4fpl');
assert(ctx.resolveHubPageName({ pages: ['first-appearance-hub'] }) === 'h4fpl', 'SEO slug must map to h4fpl');
assert(ctx.resolveHubPageName({ pages: ['First Appearance County'] }) === 'h4fpl', 'retired county page name must map to h4fpl');
assert(ctx.resolveHubPageName({ pages: ['h4fpl'] }) === 'h4fpl', 'array id must resolve');
assert(
    ctx.resolveHubPageName({
        pages: {
            abc: { id: 'h4fpl', title: 'first-appearance', pageUriSEO: 'first-appearance-hub' }
        }
    }) === 'h4fpl',
    'nested page role must use id'
);
assert(
    ctx.resolveHubPageName({ pages: { abc: { title: 'first-appearance' } } }) === 'h4fpl',
    'title-only role must still ok(h4fpl)'
);
assert(
    ctx.resolveHubPageName({ pages: ['editor-page-id'] }) === 'editor-page-id',
    'a single unknown id is kept if the Editor page id changes'
);

const page = fs.readFileSync(path.join(ROOT, 'src/pages/first-appearance.h4fpl.js'), 'utf8');
assert(page.indexOf('$w(\'HtmlComponent\')') > -1, 'hub must bind HtmlComponent by type if nickname is missing');
assert(page.indexOf('first-appearance-page.nmw1v.js') === -1, 'stale county-template comment must be gone');

const http = fs.readFileSync(path.join(ROOT, 'src/backend/http-functions.js'), 'utf8');
assert(http.indexOf("'/first-appearance-hub'") === -1, 'custom sitemap must not advertise the 404 alias');

console.log('ok');
