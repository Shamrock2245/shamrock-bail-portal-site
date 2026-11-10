#!/usr/bin/env node
/**
 * Portal invoice link. Mocked fetch and session lookup only.
 * No network. No secrets. No customer charges, names, or phone numbers.
 * The only phone string under test is the public office line (239) 332-2245.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function load(rel, names) {
    let code = fs.readFileSync(path.join(root, rel), 'utf8').replace(/^export /gm, '');
    code += '\nreturn { ' + names.join(', ') + ' };';
    return new Function(code)();
}

const api = load('src/backend/portalPayment.js', [
    'LEADS_BASE',
    'PAYMENT_FALLBACK_MODE',
    'MACHINE_KEY_SECRET',
    'MACHINE_KEY_FINDING',
    'PREMIUM_DUE_LABEL',
    'CALL_NOTE',
    'PREPARED_NOTE',
    'EXPIRED_NOTE',
    'PAID_NOTE',
    'INVOICE_RETRY_MAX',
    'canonicalPaymentUrl',
    'readAmountCents',
    'memberIsCaseIndemnitor',
    'sessionTokenFromInput',
    'decidePayClick',
    'getPaymentLinkForSession'
]);

const GAS_KEY = 'gas-test-key';
const LEADS_KEY = 'leads-test-key';
const TOKEN = 'session-test-token';
const CASE_ID = 'case-from-session';
const PORTAL_TOKEN = 'indemnitorTokenValue1234';
const BOOKING = 'BK-SESSION-1';
const CLIENT_BOOKING = 'BK-CLIENT-NO';
const INVOICE_URL = 'https://swipesimple.com/invoices/inv_test_1';
const STATIC_URL = 'https://swipesimple.com/links/lnk_test_static';

function jsonResponse(status, data) {
    return {
        ok: status >= 200 && status < 300,
        status: status,
        text: async () => JSON.stringify(data == null ? {} : data)
    };
}

function session(extra) {
    return Object.assign({
        valid: true,
        personId: 'indemnitor_' + CASE_ID,
        caseId: CASE_ID,
        role: 'indemnitor',
        email: 'payer@example.com',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    }, extra || {});
}

function caseRow(extra) {
    return Object.assign({
        _id: CASE_ID,
        bookingNumber: BOOKING,
        indemnitorEmail: 'payer@example.com'
    }, extra || {});
}

function harness(overrides) {
    const calls = [];
    const logs = [];
    const validated = [];
    const loaded = [];
    const sleeps = [];
    const secrets = Object.assign({
        GAS_API_KEY: GAS_KEY,
        LEADS_API_KEY: LEADS_KEY
    }, overrides && overrides.secrets);
    const routes = (overrides && overrides.routes) || {};
    const fetchImpl = async (url, options) => {
        const body = options && options.body ? JSON.parse(options.body) : null;
        calls.push({ url: url, options: options, body: body });
        if (url.indexOf('/api/portal/tokens/') !== -1) {
            if (routes.tokens) return routes.tokens(url, options, body);
            return jsonResponse(200, { tokens: [{ token: PORTAL_TOKEN, role: 'indemnitor', url: 'https://leads.test/c/' + PORTAL_TOKEN }], count: 1 });
        }
        if (url.indexOf('/api/portal/generate') !== -1) {
            if (routes.generate) return routes.generate(url, options, body);
            return jsonResponse(201, { success: true, token: PORTAL_TOKEN, url: 'https://leads.test/c/' + PORTAL_TOKEN, role: 'indemnitor' });
        }
        if (url.indexOf('/invoice-link') !== -1) {
            if (routes.invoice) return routes.invoice(url, options, body);
            return jsonResponse(200, { ok: true, payment_url: INVOICE_URL, amount_cents: 50000, booking_number: BOOKING });
        }
        return jsonResponse(404, { ok: false, error: 'not_found' });
    };
    const deps = {
        fetchImpl: fetchImpl,
        getSecret: async (name) => {
            calls.push({ secret: name });
            return secrets[name] == null ? '' : secrets[name];
        },
        validateSession: async (token) => {
            validated.push(token);
            if (overrides && overrides.validate) return overrides.validate(token);
            return overrides && Object.prototype.hasOwnProperty.call(overrides, 'session')
                ? overrides.session
                : session();
        },
        loadCase: async (caseId) => {
            loaded.push(caseId);
            if (overrides && overrides.loadCase) return overrides.loadCase(caseId);
            return caseRow();
        },
        sleep: async (ms) => { sleeps.push(ms); },
        logger: { warn: (...args) => logs.push(args.map(String).join(' ')) },
        timeoutMs: overrides && overrides.timeoutMs ? overrides.timeoutMs : 200,
        leadsBase: 'https://leads.test'
    };
    return { calls: calls, logs: logs, validated: validated, loaded: loaded, sleeps: sleeps, deps: deps };
}

function httpCalls(h) {
    return h.calls.filter((call) => call.url);
}

function invoiceCalls(h) {
    return httpCalls(h).filter((call) => call.url.indexOf('/invoice-link') !== -1);
}

function assertNoSecrets(blob) {
    assert.equal(blob.includes(PORTAL_TOKEN), false, 'portal token leaked');
    assert.equal(blob.includes(GAS_KEY), false, 'machine key leaked');
    assert.equal(blob.includes(LEADS_KEY), false, 'dashboard key leaked');
    assert.equal(blob.includes(TOKEN), false, 'session token leaked');
}

function assertClientShape(result) {
    const keys = Object.keys(result).sort();
    if (result.state === 'ok') {
        assert.deepEqual(keys, ['amount_cents', 'payment_url', 'state']);
    } else {
        assert.deepEqual(keys, ['state']);
    }
}

test('machine key finding: LEADS_API_KEY is not accepted and the pay path is call_only', () => {
    const src = fs.readFileSync(path.join(root, 'src/backend/portalPayment.js'), 'utf8');
    assert.equal(api.PAYMENT_FALLBACK_MODE, 'call_only');
    assert.equal(api.MACHINE_KEY_SECRET, 'GAS_API_KEY');
    assert.match(api.MACHINE_KEY_FINDING, /LEADS_API_KEY is not accepted/);
    assert.match(api.MACHINE_KEY_FINDING, /GET \/api\/portal\/tokens/);
    assert.equal(src.includes('/api/portal/payment-link'), false);
    assert.equal(src.includes('BOND_PAYMENT_LINK'), false);
    assert.equal(src.includes('lnk_b6bf996f4c57bb340a150e297e769abd'), false);
    assert.equal(src.includes('send_copy: true'), false);
    assert.equal(src.includes('sendSms'), false);
    assert.equal((src.match(/fetchImpl\(/g) || []).length, 1);
    const bond = fs.readFileSync(path.join(root, 'src/public/portal-config.js'), 'utf8');
    assert.match(bond, /export const BOND_PAYMENT_LINK = '/);
    assert.match(fs.readFileSync(path.join(root, 'src/pages/masterPage.js'), 'utf8'), /BOND_PAYMENT_LINK/);
});

test('invoice urls reject static links and off-allowlist hosts', () => {
    assert.equal(api.canonicalPaymentUrl(INVOICE_URL), INVOICE_URL);
    assert.equal(api.canonicalPaymentUrl(STATIC_URL), '');
    assert.equal(api.canonicalPaymentUrl('https://evil.example/invoices/1'), '');
    assert.equal(api.canonicalPaymentUrl('http://swipesimple.com/invoices/1'), '');
    assert.equal(api.readAmountCents(50000), 50000);
    assert.equal(api.readAmountCents(0), null);
    assert.equal(api.readAmountCents('50000'), null);
});

test('only the session indemnitor on this case may pay', () => {
    const row = caseRow();
    assert.equal(api.memberIsCaseIndemnitor(session(), row, CASE_ID), true);
    assert.equal(api.memberIsCaseIndemnitor(session({ role: 'defendant', personId: CASE_ID }), row, CASE_ID), false);
    assert.equal(api.memberIsCaseIndemnitor(session({ personId: 'other-person', email: 'nope@example.com' }), row, CASE_ID), false);
    assert.equal(api.memberIsCaseIndemnitor(session({
        role: 'coindemnitor',
        personId: 'coindemnitor_' + CASE_ID
    }), row, CASE_ID), true);
});

test('a valid indemnitor reuses the active token and posts invoice-link', async () => {
    const h = harness();
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.state, 'ok');
    assert.equal(result.payment_url, INVOICE_URL);
    assert.equal(result.amount_cents, 50000);
    assertClientShape(result);
    const http = httpCalls(h);
    assert.equal(http.length, 2);
    assert.equal(http[0].url, 'https://leads.test/api/portal/tokens/' + BOOKING);
    assert.equal(http[0].options.method, 'GET');
    assert.equal(http[0].options.headers['X-API-Key'], GAS_KEY);
    assert.notEqual(http[0].options.headers['X-API-Key'], LEADS_KEY);
    assert.equal(http[1].options.method, 'POST');
    assert.equal(http[1].url, 'https://leads.test/api/portal/' + PORTAL_TOKEN + '/invoice-link');
    assert.deepEqual(http[1].body, { send_copy: false, channel: 'imessage' });
    assert.equal(http[1].options.headers['X-API-Key'], undefined);
    assert.equal(Object.prototype.hasOwnProperty.call(http[1].body, 'amount'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(http[1].body, 'amount_cents'), false);
    assert.equal(h.loaded[0], CASE_ID);
    assertNoSecrets(h.logs.join('\n') + JSON.stringify(result));
});

test('client booking and role are ignored', async () => {
    const h = harness({
        routes: {
            tokens: () => jsonResponse(200, { tokens: [], count: 0 })
        }
    });
    const result = await api.getPaymentLinkForSession({
        sessionToken: TOKEN,
        booking_number: CLIENT_BOOKING,
        bookingNumber: CLIENT_BOOKING,
        role: 'defendant',
        caseId: 'client-case',
        personId: 'client-person'
    }, h.deps);
    assert.equal(result.state, 'ok');
    assert.deepEqual(h.validated, [TOKEN]);
    assert.deepEqual(h.loaded, [CASE_ID]);
    const generate = httpCalls(h).find((call) => call.url.indexOf('/generate') !== -1);
    assert.ok(generate);
    assert.deepEqual(generate.body, { booking_number: BOOKING, role: 'indemnitor' });
    const blob = JSON.stringify(httpCalls(h)) + JSON.stringify(result);
    assert.equal(blob.includes(CLIENT_BOOKING), false);
    assertNoSecrets(h.logs.join('\n') + JSON.stringify(result));
});

test('a defendant session hides pay and does not call leads', async () => {
    const h = harness({
        session: session({ role: 'defendant', personId: CASE_ID })
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.state, 'role_not_indemnitor');
    assertClientShape(result);
    assert.equal(httpCalls(h).length, 0);
    assert.equal(h.loaded.length, 0);
});

test('an indemnitor who is not on this case hides pay', async () => {
    const h = harness({
        session: session({ personId: 'other-person', email: 'nope@example.com', phone: '' })
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.state, 'role_not_indemnitor');
    assert.equal(httpCalls(h).length, 0);
});

test('a missing machine key falls back to call_only and does not call leads', async () => {
    const h = harness({ secrets: { GAS_API_KEY: '' } });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.state, 'call_only');
    assertClientShape(result);
    assert.equal(httpCalls(h).length, 0);
    assert.match(h.logs.join('\n'), /machine_key_missing/);
    assertNoSecrets(h.logs.join('\n'));
});

test('staff_auth_required does not retry with the dashboard key', async () => {
    const h = harness({
        routes: {
            tokens: () => jsonResponse(401, { error: 'staff_auth_required' })
        }
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.state, 'call_only');
    assert.equal(httpCalls(h).length, 1);
    assert.equal(httpCalls(h)[0].options.headers['X-API-Key'], GAS_KEY);
    assert.match(h.logs.join('\n'), /machine_key_rejected/);
    assertNoSecrets(h.logs.join('\n') + JSON.stringify(result));
});

test('202 in_progress is retried and then returns the invoice', async () => {
    let n = 0;
    const h = harness({
        routes: {
            invoice: () => {
                n += 1;
                if (n < 3) return jsonResponse(202, { ok: false, error: 'in_progress', retry_after_seconds: 3 });
                return jsonResponse(200, { ok: true, payment_url: INVOICE_URL, amount_cents: 25000 });
            }
        }
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.state, 'ok');
    assert.equal(result.amount_cents, 25000);
    assert.equal(invoiceCalls(h).length, 3);
    assert.deepEqual(h.sleeps, [3000, 3000]);
    assertNoSecrets(h.logs.join('\n') + JSON.stringify(result));
});

test('202 after the retry cap is preparing with no link', async () => {
    const h = harness({
        routes: {
            invoice: () => jsonResponse(202, { ok: false, error: 'in_progress', retry_after_seconds: 3 })
        }
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.state, 'preparing');
    assertClientShape(result);
    assert.equal(invoiceCalls(h).length, 4);
    assert.equal(h.sleeps.length, 3);
    assertNoSecrets(JSON.stringify(result) + h.logs.join('\n'));
});

test('invoice statuses map without retrying 4xx', async () => {
    const cases = [
        { status: 401, body: { ok: false, error: 'token_invalid_or_expired' }, state: 'expired' },
        { status: 403, body: { ok: false, error: 'role_not_indemnitor' }, state: 'role_not_indemnitor' },
        { status: 409, body: { ok: false, error: 'already_paid' }, state: 'already_paid' },
        { status: 409, body: { ok: false, error: 'premium_unconfirmed' }, state: 'call_only' },
        { status: 409, body: { ok: false, error: 'premium_estimate_unconfirmed' }, state: 'call_only' },
        { status: 404, body: { ok: false, error: 'bond_not_found' }, state: 'call_only' },
        { status: 429, body: { ok: false, error: 'rate_limited' }, state: 'rate_limited' },
        { status: 503, body: { ok: false, error: 'invoicing_unavailable' }, state: 'call_only' },
        { status: 500, body: { ok: false, error: 'server' }, state: 'call_only' }
    ];
    for (const item of cases) {
        const h = harness({
            routes: { invoice: () => jsonResponse(item.status, item.body) }
        });
        const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
        assert.equal(result.state, item.state, String(item.status) + ' ' + item.body.error);
        assertClientShape(result);
        assert.equal(invoiceCalls(h).length, 1, item.body.error);
        assert.equal(h.sleeps.length, 0, item.body.error);
        assertNoSecrets(JSON.stringify(result) + h.logs.join('\n'));
    }
});

test('a stalled response body times out to call_only', { timeout: 1000 }, async () => {
    const h = harness({
        timeoutMs: 40,
        routes: {
            tokens: () => ({
                ok: true,
                status: 200,
                text: () => new Promise(function () {})
            })
        }
    });
    const started = Date.now();
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.state, 'call_only');
    assertClientShape(result);
    assert.match(h.logs.join('\n'), /timeout/);
    assert.equal(Date.now() - started < 500, true);
    assertNoSecrets(h.logs.join('\n') + JSON.stringify(result));
});

test('call_only stays on the page until Pay now is acknowledged', () => {
    const fallback = api.decidePayClick({
        state: 'call_only',
        payment_url: INVOICE_URL,
        acknowledged: true
    });
    assert.equal(fallback.navigate, false);
    assert.equal(fallback.url, '');
    assert.equal(fallback.note, 'Please call (239) 332-2245.');
    assert.equal(fallback.note.toLowerCase().includes('estimate'), false);

    const first = api.decidePayClick({
        state: 'ok',
        payment_url: INVOICE_URL,
        acknowledged: false
    });
    assert.equal(first.navigate, false);
    assert.equal(first.label, 'Pay now');
    assert.equal(first.note, 'Premium due');

    const second = api.decidePayClick({
        state: 'ok',
        payment_url: INVOICE_URL,
        acknowledged: true
    });
    assert.equal(second.navigate, true);
    assert.equal(second.url, INVOICE_URL);
    assert.equal(second.note, 'Premium due');
});

test('a network error and a static payment url fall back to call_only', async () => {
    const thrown = harness({
        routes: { invoice: () => { throw new Error('socket ' + PORTAL_TOKEN); } }
    });
    const badUrl = harness({
        routes: {
            invoice: () => jsonResponse(200, { ok: true, payment_url: STATIC_URL, amount_cents: 100 })
        }
    });
    const leaked = harness({
        routes: {
            invoice: () => jsonResponse(200, {
                ok: true,
                payment_url: 'https://swipesimple.com/invoices/' + PORTAL_TOKEN,
                amount_cents: 100
            })
        }
    });
    for (const h of [thrown, badUrl, leaked]) {
        const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
        assert.equal(result.state, 'call_only');
        assertClientShape(result);
        assertNoSecrets(JSON.stringify(result) + h.logs.join('\n'));
    }
});

test('no session and an invalid session return call_only with no leads call', async () => {
    const missing = harness();
    const none = await api.getPaymentLinkForSession('', missing.deps);
    assert.equal(none.state, 'call_only');
    assert.equal(httpCalls(missing).length, 0);
    assert.equal(missing.validated.length, 0);

    const expired = harness({
        session: { valid: false, reason: 'expired', personId: 'indemnitor_' + CASE_ID, caseId: CASE_ID, role: 'indemnitor' }
    });
    const result = await api.getPaymentLinkForSession(TOKEN, expired.deps);
    assert.equal(result.state, 'call_only');
    assert.equal(httpCalls(expired).length, 0);
    assertNoSecrets(expired.logs.join('\n') + JSON.stringify(result));
});

test('web module does not take booking or role from the client', () => {
    const jsw = fs.readFileSync(path.join(root, 'src/backend/portal-payment.jsw'), 'utf8');
    const fn = jsw.slice(jsw.lastIndexOf('export async function getPaymentLinkForSession'));
    assert.match(fn, /export async function getPaymentLinkForSession\(input\)/);
    assert.equal(fn.includes('booking'), false);
    assert.equal(fn.includes('caseId'), false);
    assert.equal(fn.includes('personId'), false);
    assert.equal(fn.includes('LEADS_API_KEY'), false);
    assert.equal(jsw.includes('/api/portal/payment-link'), false);
    assert.match(jsw, /validateCustomSession/);
    assert.equal(fn.includes('send_copy'), false);
    assert.equal(jsw.includes('send_copy: true'), false);
    assert.equal(fs.existsSync(path.join(root, 'src/backend/portal-payment.js')), false);
});

test('both portal pages follow the invoice states and never text a pay link', () => {
    const pages = {
        indemnitor: fs.readFileSync(path.join(root, 'src/pages/Indemnitor Portal.go8lz.js'), 'utf8'),
        defendant: fs.readFileSync(path.join(root, 'src/pages/Defendant Portal.adato.js'), 'utf8')
    };
    assert.match(pages.indemnitor, /ALLOWED_ROLES = \['indemnitor', 'coindemnitor'\]/);
    assert.match(pages.defendant, /validation\.role !== 'defendant'/);
    assert.equal(pages.defendant.includes('getPaymentLinkForSession'), false);
    assert.match(pages.defendant, /payViewForSkippedLookup\(live\)/);
    const defendantLoad = pages.defendant.slice(pages.defendant.indexOf('const live = await resolveLiveStatus'), pages.defendant.indexOf('} catch (err)'));
    assert.equal(defendantLoad.includes('startPayment'), false);
    const pay = pages.indemnitor.slice(pages.indemnitor.indexOf('async function startPayment'), pages.indemnitor.indexOf('const ACTIONS'));
    assert.match(pay, /getPaymentLinkForSession\(sessionToken\)/);
    assert.match(pay, /decidePayClick\(\{ state: 'ok', payment_url: readyPayUrl, acknowledged: true \}\)/);
    assert.equal((pay.match(/wixLocation\.to\(/g) || []).length, 1);
    assert.match(pay, /if \(open\.navigate && open\.url\) wixLocation\.to\(open\.url\)/);
    assert.equal(pay.includes('booking'), false);
    assert.equal(pay.includes('sendSms'), false);
    assert.equal(pay.includes('BOND_PAYMENT_LINK'), false);
    assert.match(pages.indemnitor, /Please call \(239\) 332-2245\./);
    assert.match(pages.indemnitor, /Your link is being prepared, please try again in a moment/);
    assert.match(pages.indemnitor, /Your payment link expired\. Please call \(239\) 332-2245\./);
    assert.match(pages.indemnitor, /role_not_indemnitor/);
    assert.match(pages.indemnitor, /already_paid/);
    assert.match(pages.indemnitor, /Pay now/);
    assert.equal(/estimate/i.test(pages.indemnitor), false);
    assert.equal(/estimate/i.test(pages.defendant), false);
    for (const rel of ['netlify-embeds/indemnitor-dashboard.html', 'netlify-embeds/defendant-dashboard.html']) {
        const html = fs.readFileSync(path.join(root, rel), 'utf8');
        assert.match(html, /Premium due/);
        assert.match(html, /Please call \(239\) 332-2245\./);
        assert.match(html, /Your link is being prepared, please try again in a moment/);
        assert.equal(/estimate/i.test(html), false, rel);
        assert.equal(html.includes('lnk_'), false, rel);
    }
});
