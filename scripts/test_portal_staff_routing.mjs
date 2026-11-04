#!/usr/bin/env node
/**
 * Staff magic links go to Super CRM with no session token.
 * Portal redirects stay on the live allowlist.
 * Magic-link login returns isNewUser the same way the link was minted.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPaperworkLaunchpadUrl, SUPER_CRM_URL, PAPERWORK_APP_URL } from '../src/public/portal-config.js';
import {
    magicLinkIsNewUser,
    resolveAuthenticatedDestination,
    materializePortalDestination,
    isAllowedPortalRedirect,
    PORTAL_OPEN_FAILED_MESSAGE
} from '../src/public/portal-route.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = fs.readFileSync(path.join(root, 'src/pages/Portal.ak0ws.js'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'src/backend/portal-auth.jsw'), 'utf8');

const OFFICE_MESSAGE = "We couldn't open your portal. Please call (239) 332-2245.";
const ALLOW = { crmUrl: SUPER_CRM_URL, paperworkUrl: PAPERWORK_APP_URL };

function between(src, startMark, endMark) {
    const start = src.indexOf(startMark);
    const end = src.indexOf(endMark, start + startMark.length);
    assert.ok(start !== -1 && end !== -1, startMark);
    return src.slice(start, end);
}

function urlFor(role, sessionToken, isNewUser, county) {
    const decision = resolveAuthenticatedDestination(role, sessionToken, isNewUser);
    const url = materializePortalDestination(decision, {
        crmUrl: SUPER_CRM_URL,
        county: county || '',
        buildPaperworkLaunchpadUrl
    });
    return { decision, url };
}

test('failed portal open message is the public office line', () => {
    assert.equal(PORTAL_OPEN_FAILED_MESSAGE, OFFICE_MESSAGE);
    const routeSrc = fs.readFileSync(path.join(root, 'src/public/portal-route.js'), 'utf8');
    const phones = routeSrc.match(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g) || [];
    assert.deepEqual(phones, ['(239) 332-2245']);
});

test('staff, admin, and superadmin go to Super CRM with no session token', () => {
    for (const role of ['staff', 'admin', 'superadmin', ' Staff ', 'ADMIN']) {
        const { decision, url } = urlFor(role, 'session-secret', true);
        assert.equal(decision.action, 'redirect');
        assert.equal(decision.target, 'crm');
        assert.equal(url, SUPER_CRM_URL);
        assert.equal(url.includes('session-secret'), false);
        assert.equal(url.includes('st='), false);
        assert.equal(url.includes('token'), false);
        assert.equal(isAllowedPortalRedirect(url, ALLOW), true);
    }
});

test('CRM urls that carry st or token are refused', () => {
    assert.equal(isAllowedPortalRedirect(SUPER_CRM_URL + '?st=abc', ALLOW), false);
    assert.equal(isAllowedPortalRedirect(SUPER_CRM_URL + '?token=abc', ALLOW), false);
    assert.equal(isAllowedPortalRedirect(SUPER_CRM_URL + '?sessionToken=abc', ALLOW), false);
    assert.equal(isAllowedPortalRedirect(SUPER_CRM_URL + '/queue?st=abc', ALLOW), false);
    assert.equal(isAllowedPortalRedirect('https://leads.shamrockbailbonds.biz.evil.com', ALLOW), false);
});

test('returning defendant and indemnitor stay on the live dashboards', () => {
    const defendant = urlFor('defendant', 'tok/with space', false);
    assert.equal(defendant.url, '/portal-defendant?st=' + encodeURIComponent('tok/with space'));
    assert.equal(isAllowedPortalRedirect(defendant.url, ALLOW), true);

    const indemnitor = urlFor('indemnitor', 'ind-tok', false);
    assert.equal(indemnitor.url, '/portal-indemnitor?st=' + encodeURIComponent('ind-tok'));

    const cosigner = urlFor('coindemnitor', 'co-tok', false);
    assert.equal(cosigner.url, '/portal-indemnitor?st=' + encodeURIComponent('co-tok'));
});

test('a dashboard redirect without a session token fails closed', () => {
    const { decision, url } = urlFor('defendant', '', false);
    assert.equal(decision.action, 'fail');
    assert.equal(decision.message, OFFICE_MESSAGE);
    assert.equal(url, '');
});

test('new indemnitors and defendants go to the paperwork launchpad', () => {
    const indemnitor = urlFor('indemnitor', 'new-session', true, 'Lee');
    assert.equal(indemnitor.decision.target, 'paperwork');
    const params = new URL(indemnitor.url).searchParams;
    assert.equal(params.get('role'), 'indemnitor');
    assert.equal(params.get('st'), 'new-session');
    assert.equal(params.get('county'), 'Lee');
    assert.equal(params.get('source'), 'wix-portal-landing');
    assert.equal(params.has('token'), false);
    assert.equal(isAllowedPortalRedirect(indemnitor.url, ALLOW), true);

    const defendant = urlFor('defendant', 'def-session', true);
    assert.equal(new URL(defendant.url).searchParams.get('role'), 'defendant');
});

test('unknown roles do not reload the login page', () => {
    for (const role of ['', 'wizard', 'member', null]) {
        const { decision, url } = urlFor(role, 'tok', false);
        assert.equal(decision.action, 'fail');
        assert.equal(decision.message, OFFICE_MESSAGE);
        assert.equal(url, '');
    }
    assert.equal(isAllowedPortalRedirect('/portal-landing', ALLOW), false);
    assert.equal(isAllowedPortalRedirect('/portal-landing?st=tok', ALLOW), false);
    assert.equal(isAllowedPortalRedirect('/portal-staff', ALLOW), false);
    assert.equal(isAllowedPortalRedirect('/portal-staff?st=tok', ALLOW), false);
    assert.equal(isAllowedPortalRedirect('https://evil.example/portal-defendant', ALLOW), false);
    assert.equal(isAllowedPortalRedirect('javascript:alert(1)', ALLOW), false);
    assert.equal(isAllowedPortalRedirect('//leads.shamrockbailbonds.biz', ALLOW), false);
});

test('magic-link isNewUser comes from the record or a new_ person id', () => {
    assert.equal(magicLinkIsNewUser({ isNewUser: true, personId: 'person-1' }), true);
    assert.equal(magicLinkIsNewUser({ personId: 'new_abc' }), true);
    assert.equal(magicLinkIsNewUser({ isNewUser: false, personId: 'new_abc' }), true);
    assert.equal(magicLinkIsNewUser({ isNewUser: false, personId: 'person-1' }), false);
    assert.equal(magicLinkIsNewUser({ personId: 'notnew_1' }), false);
    assert.equal(magicLinkIsNewUser({ isNewUser: 'true', personId: 'person-1' }), false);
    assert.equal(magicLinkIsNewUser(null), false);
    assert.equal(magicLinkIsNewUser(undefined), false);
});

test('portal-landing wires the allowlist and does not send staff to /portal-staff', () => {
    const routeFn = between(page, 'function routeAuthenticatedUser', 'function showPortalOpenFailed');
    const failFn = between(page, 'function showPortalOpenFailed', 'function guardedEl');
    assert.match(routeFn, /cleanRole === 'student'/);
    assert.match(routeFn, /wixLocation\.to\('\/bail-school'\)/);
    assert.match(routeFn, /isAllowedPortalRedirect/);
    assert.match(routeFn, /showPortalOpenFailed\(\)/);
    assert.doesNotMatch(routeFn, /revealRolePicker/);
    assert.doesNotMatch(routeFn, /wixLocation\.to\([^)]*portal-staff/);
    assert.doesNotMatch(routeFn, /getStaffDashboardData|getIndemnitorDetails|getDefendantDetails/);
    assert.match(page, /function guardedEl/);
    assert.match(page, /function guardedSetText/);
    assert.match(failFn, /guardedSetText\('#statusMessage', PORTAL_OPEN_FAILED_MESSAGE\)/);
    assert.match(failFn, /guardedSetText\('#loginErrorText', PORTAL_OPEN_FAILED_MESSAGE\)/);
    assert.doesNotMatch(failFn, /wixLocation/);
    assert.match(page, /crmUrl: SUPER_CRM_URL/);
    assert.equal(page.includes("wixLocation.to(`/portal-staff"), false);
});

test('onMagicLinkLoginV2 returns isNewUser and the link record stores it', () => {
    const login = between(auth, 'export async function onMagicLinkLoginV2', '// SIMPLIFIED MAGIC LINK FLOW');
    assert.equal((login.match(/isNewUser: linkIsNewUser/g) || []).length, 2);
    assert.match(login, /const linkIsNewUser = magicLinkIsNewUser\(linkData\)/);

    const generated = between(auth, 'export async function generateMagicLink', 'export async function onMagicLinkLoginV2');
    assert.match(generated, /isNewUser: magicLinkIsNewUser\(\{ isNewUser: options\.isNewUser, personId: personId \}\)/);

    const send = between(auth, 'export async function sendMagicLinkSimplified', 'async function sendMagicLinkEmail');
    assert.match(send, /isNewUser: isNewUser/);
    assert.match(send, /role = 'indemnitor'/);
    assert.match(send, /isNewUser = true/);
});

test('identity checks stay fail-closed and indemnitor stays the default role', () => {
    assert.match(auth, /Attempted to create session with invalid role/);
    assert.match(auth, /targetRole = 'indemnitor'/);
    assert.match(auth, /New user - default to indemnitor role/);
    const allowed = between(auth, 'const ALLOWED_ROLES = ', ';');
    assert.match(allowed, /'indemnitor'/);
    assert.match(allowed, /'defendant'/);
    assert.match(allowed, /'staff'/);
    assert.match(allowed, /'admin'/);
    assert.match(allowed, /'coindemnitor'/);
});
