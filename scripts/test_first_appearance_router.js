#!/usr/bin/env node
/**
 * Guards for /first-appearance router page-name resolution.
 * Live Wix model maps the router page as h4fpl (title first-appearance).
 * ok("first-appearance") with an empty/object pages payload produces GSC "500 |" titles.
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
    HUB_PAGE_ID: 'h4fpl',
    HUB_PAGE_CANDIDATES: ['h4fpl', 'first-appearance', 'First Appearance', 'first-appearance-hub']
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
assert(src.indexOf('first-appearance-page') === -1, 'retired first-appearance-page template must stay gone');

assert(
    ctx.resolveHubPageName({ pages: { 'dd6a7207-8621-460c-aaad-3abfff7d9668': 'h4fpl' } }) === 'h4fpl',
    'object pages map must resolve h4fpl'
);
assert(ctx.resolveHubPageName({}) === 'h4fpl', 'empty request must not ok(first-appearance)');
assert(ctx.resolveHubPageName({ pages: ['first-appearance'] }) === 'first-appearance', 'array title still wins when present');
assert(ctx.resolveHubPageName({ pages: ['h4fpl'] }) === 'h4fpl', 'array id must resolve');
assert(
    ctx.resolveHubPageName({ pages: { abc: { id: 'h4fpl', title: 'first-appearance' } } }) === 'h4fpl',
    'nested page object must use id'
);

const page = fs.readFileSync(path.join(ROOT, 'src/pages/first-appearance.h4fpl.js'), 'utf8');
assert(page.indexOf('$w(\'HtmlComponent\')') > -1, 'hub must bind HtmlComponent by type if nickname is missing');
assert(page.indexOf('first-appearance-page.nmw1v.js') === -1, 'stale county-template comment must be gone');

console.log('ok');
