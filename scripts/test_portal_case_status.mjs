#!/usr/bin/env node
/**
 * Live case status and Pay now. Mocked fetch only. No network. No secrets.
 * Client-supplied case_id and person_id are ignored. Consent fails closed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    fetchPortalCaseStatus,
    STATUS_PATH,
    wixCaseStatusFallback,
    dashboardStatusFields,
    shouldShowPayNow,
    paperworkLooksComplete,
} from '../src/backend/portalCaseStatus.js';
import { payViewFromResult, dashPayFields, payViewForSkippedLookup, PAY_PREPARING, PAY_EXPIRED, PAY_CALL } from '../src/public/portal-pay-view.js';
import {
    dashboardStatusFields as pageStatusFields,
    paperworkLooksComplete as pagePaperworkComplete,
    shouldShowPayNow as pageShouldShowPayNow,
} from '../src/public/portal-case-status-view.js';
import { geolocationWithoutLightbox, showConsentIfNeededResult, consentRecordFromAffirmative, hasStoredSmsConsent } from '../src/public/consent-gate.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEADS_KEY = 'leads-test-key';
const GAS_KEY = 'gas-test-key';
const SESSION = 'session-token-from-wix-validation';
const SERVER_PERSON = 'server-person-1';
const SERVER_CASE = 'server-case-1';
const CLIENT_PERSON = 'client-person-ignored';
const CLIENT_CASE = 'client-case-ignored';

const READY = {
    paperwork: 'complete',
    signatures: { indemnitor: true, defendant: true, cosigners: [] },
    paid: false
};

function jsonResponse(status, data) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(data == null ? {} : data)
    };
}

function harness(overrides) {
    const calls = [];
    const logs = [];
    const secrets = Object.assign({
        LEADS_API_KEY: LEADS_KEY,
        GAS_API_KEY: GAS_KEY
    }, overrides && overrides.secrets);
    const session = Object.assign({
        valid: true,
        personId: SERVER_PERSON,
        caseId: SERVER_CASE,
        role: 'defendant'
    }, overrides && overrides.session);
    const fetchImpl = async (url, options) => {
        calls.push({ url, options });
        if (overrides && typeof overrides.fetchImpl === 'function') return overrides.fetchImpl(url, options);
        return jsonResponse(200, READY);
    };
    const deps = {
        fetchImpl,
        getSecret: async (name) => (secrets[name] == null ? '' : secrets[name]),
        validateSession: async () => session,
        logger: { warn: (...args) => logs.push(args.map(String).join(' ')) },
        timeoutMs: 200,
        leadsBase: 'https://dashboard.test'
    };
    return { calls, logs, deps };
}

function clientInput() {
    return {
        sessionToken: SESSION,
        case_id: CLIENT_CASE,
        person_id: CLIENT_PERSON,
        caseId: CLIENT_CASE,
        personId: CLIENT_PERSON
    };
}

function assertNoSecrets(blob) {
    for (const secret of [LEADS_KEY, GAS_KEY, SESSION, SERVER_PERSON, CLIENT_PERSON, SERVER_CASE, CLIENT_CASE]) {
        assert.equal(blob.includes(secret), false, 'leaked ' + secret);
    }
}

test('GET case-status uses session case_id and person_id only', async () => {
    const h = harness();
    const result = await fetchPortalCaseStatus(clientInput(), h.deps);
    assert.equal(result.ok, true);
    assert.equal(result.status.source, 'leads');
    assert.equal(result.status.paid, false);
    assert.equal(shouldShowPayNow(result.status), true);
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].options.method, 'GET');
    assert.equal(h.calls[0].options.headers['X-API-Key'], LEADS_KEY);
    assert.equal(h.calls[0].options.headers['X-Internal-Token'], LEADS_KEY);
    const url = new URL(h.calls[0].url);
    assert.equal(url.pathname, STATUS_PATH);
    assert.equal(url.searchParams.get('case_id'), SERVER_CASE);
    assert.equal(url.searchParams.get('person_id'), SERVER_PERSON);
    assert.deepEqual([...url.searchParams.keys()].sort(), ['case_id', 'person_id']);
    assert.equal(url.search.includes(CLIENT_CASE), false);
    assert.equal(url.search.includes(CLIENT_PERSON), false);
    assert.equal(h.calls[0].options.body, undefined);
    assertNoSecrets(h.logs.join('\n'));
});

test('client-supplied ids are ignored when the session has no case', async () => {
    const h = harness({ session: { valid: true, personId: SERVER_PERSON, caseId: '', role: 'indemnitor' } });
    const result = await fetchPortalCaseStatus(clientInput(), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'session');
    assert.equal(h.calls.length, 0);
});

test('staff sessions are refused', async () => {
    const h = harness({ session: { role: 'staff' } });
    const result = await fetchPortalCaseStatus(clientInput(), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'role');
    assert.equal(h.calls.length, 0);
});

test('404, bad payloads, and timeouts degrade without throwing', async () => {
    for (const status of [404, 500, 401]) {
        const h = harness({ fetchImpl: () => jsonResponse(status, { error: 'nope' }) });
        const result = await fetchPortalCaseStatus(clientInput(), h.deps);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'unavailable');
        assertNoSecrets(h.logs.join('\n'));
    }
    const bad = harness({ fetchImpl: () => jsonResponse(200, { paperwork: 'complete' }) });
    const malformed = await fetchPortalCaseStatus(clientInput(), bad.deps);
    assert.equal(malformed.ok, false);
    const hung = harness({ fetchImpl: () => new Promise(() => {}) });
    hung.deps.timeoutMs = 30;
    const timed = await fetchPortalCaseStatus(clientInput(), hung.deps);
    assert.equal(timed.ok, false);
    assert.equal(timed.reason, 'timeout');
});

test('GAS_API_KEY is used only when LEADS_API_KEY is empty', async () => {
    const h = harness({ secrets: { LEADS_API_KEY: '' } });
    const result = await fetchPortalCaseStatus({ sessionToken: SESSION }, h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.calls[0].options.headers['X-API-Key'], GAS_KEY);
    assert.equal(h.calls[0].options.headers['X-Internal-Token'], GAS_KEY);
});

test('Pay now requires every signature and paid === false', () => {
    assert.equal(shouldShowPayNow(READY), true);
    assert.equal(shouldShowPayNow({ ...READY, paid: true }), false);
    assert.equal(shouldShowPayNow({ ...READY, paid: null }), false);
    assert.equal(shouldShowPayNow({
        paperwork: 'complete',
        signatures: { indemnitor: true, defendant: true, cosigners: [{ signed: false }] },
        paid: false
    }), false);
    assert.equal(shouldShowPayNow({
        paperwork: 'complete',
        signatures: { indemnitor: true, defendant: false, cosigners: [] },
        paid: false
    }), false);
    const fields = dashboardStatusFields({
        source: 'leads',
        paperwork: 'complete',
        signatures: { indemnitor: true, defendant: true, cosigners: ['signed'] },
        paid: false
    });
    assert.equal(fields.showPayNow, true);
    assert.match(fields.signatureLabel, /Co-signers 1\/1/);
    assert.equal(fields.paidLabel, 'Not paid');
});

test('pay panel renders the payment result states and ignores the old url/source shape', () => {
    const session = 'session-token-value';
    const ok = payViewFromResult({
        state: 'ok',
        payment_url: 'https://pay.example.test/invoice/1',
        amount_cents: 15050,
        url: 'https://swipesimple.com/links/lnk_static',
        source: 'auto'
    }, session);
    assert.equal(ok.state, 'ok');
    assert.equal(ok.premiumDueLabel, '$150.50');
    assert.equal(ok.premiumDueText, 'Premium due: $150.50');
    assert.equal(ok.showPayNow, true);
    assert.equal(ok.openUrl, 'https://pay.example.test/invoice/1');
    const posted = dashPayFields(ok);
    assert.equal(posted.premiumDueLabel, '$150.50');
    assert.equal(posted.showPayNow, true);
    assert.equal(Object.prototype.hasOwnProperty.call(posted, 'openUrl'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(posted, 'payment_url'), false);
    assert.equal(JSON.stringify(posted).includes(session), false);
    assert.equal(JSON.stringify(posted).includes('pay.example.test'), false);

    const preparing = payViewFromResult({ state: 'preparing', payment_url: 'https://pay.example.test/invoice/1' });
    assert.equal(preparing.message, PAY_PREPARING);
    assert.equal(preparing.showPayCall, true);
    assert.equal(preparing.showPayNow, false);
    assert.equal(preparing.openUrl, '');

    const hidden = dashPayFields(payViewFromResult({ state: 'hidden' }));
    assert.equal(hidden.showPayNow, false);
    assert.equal(hidden.showPayCall, false);
    assert.equal(hidden.payState, 'hidden');

    const paid = payViewFromResult({ state: 'paid', amount_cents: 100 });
    assert.equal(paid.showPaidBadge, true);
    assert.equal(paid.showPayNow, false);
    assert.equal(paid.premiumDueLabel, '');

    const expired = payViewFromResult({ state: 'expired' });
    assert.equal(expired.message, PAY_EXPIRED);
    assert.equal(expired.showPayCall, true);
    assert.equal(expired.openUrl, '');

    const call = payViewFromResult({ state: 'call' });
    assert.equal(call.message, PAY_CALL);
    assert.match(call.message, /\(239\) 332-2245/);

    const oldShape = payViewFromResult({
        ok: true,
        url: 'https://pay.example.test/invoice/1',
        source: 'invoice',
        amount_cents: 100
    });
    assert.equal(oldShape.state, 'call');
    assert.equal(oldShape.openUrl, '');

    const staticLink = payViewFromResult({
        state: 'ok',
        payment_url: 'https://swipesimple.com/links/lnk_static',
        amount_cents: 100
    });
    assert.equal(staticLink.state, 'call');
    assert.equal(staticLink.openUrl, '');

    const leaked = payViewFromResult({
        state: 'ok',
        payment_url: 'https://pay.example.test/invoice/' + session,
        amount_cents: 100
    }, session);
    assert.equal(leaked.state, 'call');
    assert.equal(leaked.openUrl, '');
});

test('Wix Cases fallback does not invent paid or Pay now from a zero balance', () => {
    const fallback = wixCaseStatusFallback({
        paperworkStatus: 'Pending',
        signingStatus: 'Incomplete',
        balanceDue: 0
    });
    assert.equal(fallback.source, 'wix');
    assert.equal(fallback.paid, null);
    assert.equal(fallback.signatures, null);
    assert.equal(dashboardStatusFields(fallback).showPayNow, false);
    assert.equal(dashboardStatusFields(fallback).paidLabel, 'Not confirmed');
    assert.equal(paperworkLooksComplete(fallback, { paperworkStatus: 'signed' }), true);
    assert.equal(paperworkLooksComplete({ source: 'leads', paperwork: 'incomplete' }, { paperworkStatus: 'signed' }), false);
});

test('skipping invoice lookup keeps Paid and does not ask for payment', () => {
    const paid = payViewForSkippedLookup({
        source: 'leads',
        paperwork: 'complete',
        signatures: { indemnitor: true, defendant: true, cosigners: [] },
        paid: true
    });
    assert.equal(paid instanceof Promise, false);
    assert.equal(paid.state, 'paid');
    assert.equal(paid.showPaidBadge, true);
    assert.equal(paid.showPayNow, false);
    assert.equal(paid.showPayCall, false);
    assert.equal(paid.openUrl, '');
    assert.equal(paid.message, 'Paid');
    const posted = dashPayFields(paid);
    assert.equal(posted.showPaidBadge, true);
    assert.equal(posted.showPayNow, false);
    assert.equal(posted.showPayCall, false);
    assert.equal(JSON.stringify(posted).includes('payment_url'), false);
    const incomplete = payViewForSkippedLookup({
        paperwork: 'incomplete',
        signatures: { indemnitor: true, defendant: false, cosigners: [] },
        paid: false
    });
    assert.equal(incomplete.state, 'hidden');
    assert.equal(incomplete.showPayNow, false);
    assert.equal(incomplete.showPayCall, false);
    assert.equal(incomplete.showPaidBadge, false);
    assert.equal(incomplete.openUrl, '');
    assert.equal(pageShouldShowPayNow({ paid: true, signatures: { indemnitor: true, defendant: true, cosigners: [] } }), false);
});

test('page status helpers return plain objects and booleans, not promises', () => {
    const paid = {
        source: 'leads',
        paperwork: 'complete',
        signatures: { indemnitor: true, defendant: true, cosigners: [] },
        paid: true
    };
    const fields = pageStatusFields(paid);
    const complete = pagePaperworkComplete(paid, null);
    const show = pageShouldShowPayNow(paid);
    assert.equal(fields instanceof Promise, false);
    assert.equal(typeof fields.then, 'undefined');
    assert.equal(fields.paidLabel, 'Paid');
    assert.equal(fields.showPayNow, false);
    assert.equal(typeof complete, 'boolean');
    assert.equal(complete, true);
    assert.equal(complete instanceof Promise, false);
    assert.equal(typeof show, 'boolean');
    assert.equal(show, false);
    const jsw = fs.readFileSync(path.join(root, 'src/backend/portal-case-status.jsw'), 'utf8');
    assert.match(jsw, /export async function getPortalCaseStatus/);
    assert.equal(/export function /.test(jsw), false);
    assert.equal(/export \{/.test(jsw), false);
    assert.equal(jsw.includes('dashboardStatusFields'), false);
    assert.equal(jsw.includes('paperworkLooksComplete'), false);
});

test('dashboards post pay through the existing handler and consent fails closed', () => {
    const defendant = fs.readFileSync(path.join(root, 'src/pages/Defendant Portal.adato.js'), 'utf8');
    const indemnitor = fs.readFileSync(path.join(root, 'src/pages/Indemnitor Portal.go8lz.js'), 'utf8');
    const portal = fs.readFileSync(path.join(root, 'src/pages/Portal.ak0ws.js'), 'utf8');
    const geo = fs.readFileSync(path.join(root, 'src/public/geolocation-client.js'), 'utf8');
    const jsw = fs.readFileSync(path.join(root, 'src/backend/portal-case-status.jsw'), 'utf8');
    for (const src of [defendant, indemnitor]) {
        assert.match(src, /getPaymentLinkForSession\(sessionToken\)/);
        assert.equal(src.split('getPaymentLinkForSession(').length, 2);
        assert.equal(src.includes('/api/portal/payment-link'), false);
        assert.equal(src.includes('/invoice-link'), false);
        assert.match(src, /from 'backend\/portal-case-status'/);
        assert.match(src, /from 'public\/portal-case-status-view'/);
        assert.equal(/dashboardStatusFields[\s\S]{0,80}backend\/portal-case-status/.test(src), false);
        assert.match(src, /getPortalCaseStatus\(token\)/);
        assert.match(src, /wixCaseStatusFallback\(record\)/);
        assert.match(src, /fields\.showPayNow === true && payFields\.showPayNow === true/);
        assert.match(src, /shouldShowPayNow\(currentLive\)/);
        assert.match(src, /shouldShowPayNow\(live\)/);
        assert.match(src, /payViewForSkippedLookup\(live\)/);
        const payFn = src.slice(src.indexOf('async function startPayment'), src.indexOf('const ACTIONS'));
        const gate = payFn.indexOf('if (!shouldShowPayNow(currentLive)) return;');
        const fetchAt = payFn.indexOf('getPaymentLinkForSession');
        assert.ok(gate >= 0 && fetchAt > gate);
        assert.equal(src.includes('#btnPayNow'), false);
        assert.equal(src.includes('#boxPayNow'), false);
        assert.match(payFn, /decidePayClick\(\{ state: 'ok', payment_url: readyPayUrl, acknowledged: true \}\)/);
        assert.equal(/swipesimple|BOND_PAYMENT|sms:|twilio/i.test(payFn), false);
        assert.equal(/est\. at 10%|premiumEstimated/.test(src), false);
    }
    for (const file of ['defendant-dashboard.html', 'indemnitor-dashboard.html']) {
        const html = fs.readFileSync(path.join(root, 'netlify-embeds', file), 'utf8');
        assert.equal(/swipesimple|BOND_PAYMENT|10% rate|premium-est|est\. at 10%/i.test(html), false);
        assert.match(html, /Premium due/);
        assert.match(html, /Your link is being prepared/);
        assert.match(html, /data-action="pay"/);
        assert.match(html, /data-action="call"/);
        assert.equal(html.includes('payment_url'), false);
        assert.equal(/<a[^>]+data-action="pay"/i.test(html), false);
    }
    assert.match(defendant, /validation\.role !== 'defendant'/);
    assert.match(indemnitor, /!ALLOWED_ROLES\.includes\(role\)/);
    assert.equal(portal.includes("openLightbox('ConsentLightbox')"), false);
    assert.equal(geo.includes('openLightbox'), false);
    assert.match(geo, /error: 'Consent not given'/);
    const loginSetup = portal.slice(portal.indexOf('function setupLoginForm'), portal.indexOf('async function handleGetStarted'));
    assert.equal(loginSetup.slice(loginSetup.indexOf('{')).includes('setupLoginForm('), false);
    assert.match(loginSetup, /recordSmsConsent\(\)/);
    assert.match(loginSetup, /handleGetStarted\(countyParam\)/);
    assert.match(portal, /setupRoleSelectionCards\(countyParam\)/);
    assert.equal(portal.includes('showConsentRequiredState'), false);
    assert.equal(jsw.includes('dashboardStatusFields'), false);
    assert.equal(jsw.includes('paperworkLooksComplete'), false);
    assert.equal(jsw.includes('case_id'), false);
    assert.equal(jsw.includes('person_id'), false);
    assert.equal(showConsentIfNeededResult({ browser: true }), false);
    assert.equal(showConsentIfNeededResult({ browser: true, storedConsent: 'true' }), true);
    assert.equal(showConsentIfNeededResult({ browser: false }), true);
    assert.equal(showConsentIfNeededResult(null), true);
    assert.equal(hasStoredSmsConsent('true'), true);
    assert.equal(hasStoredSmsConsent(''), false);
    assert.equal(consentRecordFromAffirmative(false), null);
    assert.equal(consentRecordFromAffirmative(true).value, 'true');
    const blocked = geolocationWithoutLightbox(null);
    assert.equal(blocked.proceed, false);
    assert.equal(blocked.result.success, false);
    assert.equal(blocked.result.error, 'Consent not given');
    assert.equal(geolocationWithoutLightbox('true').proceed, true);
    for (const file of ['defendant-dashboard.html', 'indemnitor-dashboard.html']) {
        const html = fs.readFileSync(path.join(root, 'netlify-embeds', file), 'utf8');
        assert.match(html, /id="pay-now-banner"/);
        assert.match(html, /data-action="pay"/);
        assert.match(html, />Pay now</);
        const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
        new Function(script);
    }
});
