#!/usr/bin/env node
/**
 * Portal payment link. Mocked fetch and session lookup only.
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

function loadPayment(mode) {
    let code = fs.readFileSync(path.join(root, 'src/backend/portal-payment.js'), 'utf8').replace(/^export /gm, '');
    const needle = "const PAYMENT_FALLBACK_MODE = 'call_only';";
    if (!code.includes(needle)) throw new Error('PAYMENT_FALLBACK_MODE assignment missing');
    if (mode && mode !== 'call_only') {
        code = code.replace(needle, "const PAYMENT_FALLBACK_MODE = '" + mode + "';");
    }
    code += '\nreturn { LEADS_BASE, PAYMENT_LINK_PATH, PAYMENT_TIMEOUT_MS, PREMIUM_DUE_LABEL, UNAVAILABLE_NOTE, PAYMENT_FALLBACK_MODE, canonicalPaymentUrl, readAmountCents, sessionTokenFromInput, getPaymentLinkForSession };';
    return new Function(code)();
}

const api = loadPayment('call_only');
const dispatch = load('src/backend/portal-signin-dispatch.js', ['resolveDashboardKey']);

const LEADS_KEY = 'leads-test-key';
const GAS_KEY = 'gas-test-key';
const TOKEN = 'session-test-token';
const CASE_ID = 'case-from-session';
const PERSON_ID = 'person-from-session';
const ALLOWED = 'https://swipesimple.com/links/lnk_test_allowlisted';
const CLIENT_CASE = 'client-supplied-case';
const CLIENT_PERSON = 'client-supplied-person';

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
        personId: PERSON_ID,
        caseId: CASE_ID,
        role: 'indemnitor',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    }, extra || {});
}

function harness(overrides) {
    const calls = [];
    const logs = [];
    const validated = [];
    const loaded = [];
    const secrets = Object.assign({
        LEADS_API_KEY: LEADS_KEY,
        GAS_API_KEY: GAS_KEY
    }, overrides && overrides.secrets);
    const routes = (overrides && overrides.routes) || {};
    const fetchImpl = async (url, options) => {
        calls.push({ url: url, options: options });
        if (routes.hang) return routes.hang(url, options);
        if (routes.payment) return routes.payment(url, options);
        return jsonResponse(404, { ok: false });
    };
    const deps = {
        fetchImpl: fetchImpl,
        getSecret: async (name) => (secrets[name] == null ? '' : secrets[name]),
        resolveDashboardKey: dispatch.resolveDashboardKey,
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
            return null;
        },
        logger: { warn: (...args) => logs.push(args.map(String).join(' ')) },
        timeoutMs: overrides && overrides.timeoutMs ? overrides.timeoutMs : 200,
        leadsBase: overrides && Object.prototype.hasOwnProperty.call(overrides, 'leadsBase')
            ? overrides.leadsBase
            : 'https://leads.test'
    };
    if (overrides && overrides.deps) Object.assign(deps, overrides.deps);
    return { calls: calls, logs: logs, validated: validated, loaded: loaded, deps: deps };
}

function assertNoSecretLeak(blob) {
    assert.equal(blob.includes(LEADS_KEY), false, 'dashboard key leaked');
    assert.equal(blob.includes(GAS_KEY), false, 'gas key leaked');
    assert.equal(blob.includes(TOKEN), false, 'session token leaked');
}

test('fallback mode is call_only and the pay path does not use the website link', () => {
    const src = fs.readFileSync(path.join(root, 'src/backend/portal-payment.js'), 'utf8');
    const config = fs.readFileSync(path.join(root, 'src/public/portal-config.js'), 'utf8');
    const master = fs.readFileSync(path.join(root, 'src/pages/masterPage.js'), 'utf8');
    const bond = config.match(/export const BOND_PAYMENT_LINK = '([^']+)'/);
    assert.ok(bond, 'BOND_PAYMENT_LINK missing');
    assert.match(master, /BOND_PAYMENT_LINK/);
    const assignments = src.match(/PAYMENT_FALLBACK_MODE\s*=\s*'/g) || [];
    assert.equal(assignments.length, 1);
    assert.equal((src.match(/fetchImpl\(/g) || []).length, 1);
    assert.equal(api.PAYMENT_FALLBACK_MODE, 'call_only');
    assert.equal(api.PREMIUM_DUE_LABEL, 'Premium due');
    assert.equal(src.includes(bond[1]), false);
    assert.equal(src.includes('BOND_PAYMENT_LINK'), false);
    assert.equal(/estimate/i.test(src), false);
    assert.equal(src.includes('sendSms'), false);
    assert.equal(src.includes('twilio'), false);
    assert.equal(api.LEADS_BASE, 'https://leads.shamrockbailbonds.biz');
    assert.equal(api.PAYMENT_LINK_PATH, '/api/portal/payment-link');
    assert.equal(api.PAYMENT_TIMEOUT_MS <= 5000, true);
});

test('payment urls are https on swipesimple or shamrock hosts only', () => {
    assert.equal(api.canonicalPaymentUrl(ALLOWED), ALLOWED);
    assert.equal(
        api.canonicalPaymentUrl('https://pay.swipesimple.com/i/abc'),
        'https://pay.swipesimple.com/i/abc'
    );
    assert.equal(
        api.canonicalPaymentUrl('https://www.shamrockbailbonds.biz/pay'),
        'https://www.shamrockbailbonds.biz/pay'
    );
    assert.equal(
        api.canonicalPaymentUrl('https://leads.shamrockbailbonds.biz/pay/1'),
        'https://leads.shamrockbailbonds.biz/pay/1'
    );
    assert.equal(
        api.canonicalPaymentUrl('https://swipesimple.com./links/lnk_x'),
        'https://swipesimple.com/links/lnk_x'
    );
    const rejected = [
        '',
        'http://swipesimple.com/links/lnk_x',
        'https://user:pass@swipesimple.com/links/lnk_x',
        'https://swipesimple.com:8443/links/lnk_x',
        'https://notswipesimple.com/links/lnk_x',
        'https://swipesimple.com.evil.test/links/lnk_x',
        'https://evil.example/pay',
        'javascript:alert(1)',
        'https://169.254.169.254/latest',
        'https://swipesimple.com/links/lnk_x\nSet-Cookie: a'
    ];
    for (const url of rejected) assert.equal(api.canonicalPaymentUrl(url), '', url);
});

test('amount cents are accepted only as a safe integer from leads', () => {
    assert.equal(api.readAmountCents(15000), 15000);
    assert.equal(api.readAmountCents(0), 0);
    assert.equal(api.readAmountCents(-1), null);
    assert.equal(api.readAmountCents(10.5), null);
    assert.equal(api.readAmountCents('15000'), null);
});

test('valid session returns the leads payment link for that session', async () => {
    const h = harness({
        session: session({ role: 'defendant' }),
        routes: {
            payment: () => jsonResponse(200, {
                ok: true,
                url: ALLOWED,
                amount_cents: 15000,
                source: 'invoice'
            })
        }
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.ok, true);
    assert.equal(result.url, ALLOWED);
    assert.equal(result.amount_cents, 15000);
    assert.equal(result.amount_label, 'Premium due');
    assert.equal(result.source, 'invoice');
    assert.equal(result.message, '');
    assert.equal(h.validated.length, 1);
    assert.equal(h.validated[0], TOKEN);
    assert.equal(h.calls.length, 1);
    const url = new URL(h.calls[0].url);
    assert.equal(url.origin, 'https://leads.test');
    assert.equal(url.pathname, '/api/portal/payment-link');
    assert.equal(url.searchParams.get('case_id'), CASE_ID);
    assert.equal(url.searchParams.get('person_id'), PERSON_ID);
    assert.equal(h.calls[0].options.method, 'GET');
    assert.equal(h.calls[0].options.headers['X-API-Key'], LEADS_KEY);
    assert.equal(h.calls[0].options.headers['X-Internal-Token'], LEADS_KEY);
    assert.equal(h.calls[0].options.body, undefined);
    assert.equal(h.loaded.length, 0);
    assertNoSecretLeak(h.logs.join('\n') + JSON.stringify(result));
});

test('invalid session fails closed with no url and no leads call', async () => {
    const h = harness({
        session: { valid: false, reason: 'invalid', personId: PERSON_ID, caseId: CASE_ID, role: 'defendant' }
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.url, '');
    assert.equal(result.amount_cents, null);
    assert.equal(result.source, '');
    assert.equal(result.reason, 'invalid');
    assert.equal(result.message, api.UNAVAILABLE_NOTE);
    assert.equal(h.calls.length, 0);
    assert.equal(h.loaded.length, 0);
});

test('expired session fails closed with no url and no leads call', async () => {
    const expired = harness({
        session: { valid: false, reason: 'expired', personId: PERSON_ID, caseId: CASE_ID, role: 'indemnitor' }
    });
    const past = harness({
        session: session({ expiresAt: '2020-01-01T00:00:00.000Z' })
    });
    const thrown = harness({
        validate: () => { throw new Error('cms down'); }
    });
    for (const h of [expired, past, thrown]) {
        const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
        assert.equal(result.ok, false);
        assert.equal(result.url, '');
        assert.equal(result.amount_cents, null);
        assert.equal(h.calls.length, 0);
        assertNoSecretLeak(h.logs.join('\n'));
    }
    assert.equal((await api.getPaymentLinkForSession(TOKEN, expired.deps)).reason, 'expired');
    assert.equal((await api.getPaymentLinkForSession(TOKEN, past.deps)).reason, 'expired');
});

test('leads success accepts an allowlisted https url and a safe cent amount', async () => {
    const h = harness({
        session: session({ role: 'coindemnitor' }),
        routes: {
            payment: () => jsonResponse(200, {
                ok: true,
                url: 'https://pay.swipesimple.com/i/abc',
                amount_cents: 10.5,
                source: 'auto',
                customer: 'do-not-echo'
            })
        }
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.ok, true);
    assert.equal(result.url, 'https://pay.swipesimple.com/i/abc');
    assert.equal(result.source, 'auto');
    assert.equal(result.amount_cents, null);
    assert.equal(result.amount_label, '');
    assert.equal(Object.prototype.hasOwnProperty.call(result, 'customer'), false);
    assert.equal(JSON.stringify(result).includes('do-not-echo'), false);
});

function assertCallOnly(result) {
    assert.equal(result.ok, false);
    assert.equal(result.url, '');
    assert.equal(result.amount_cents, null);
    assert.equal(result.amount_label, '');
    assert.equal(result.source, '');
    assert.equal(result.reason, 'call_only');
    assert.equal(result.message, 'Payment link unavailable right now. Please call (239) 332-2245.');
    assert.equal(JSON.stringify(result).includes('estimate'), false);
    assert.equal(JSON.stringify(result).includes('lnk_b6bf996f4c57bb340a150e297e769abd'), false);
}

test('an off-allowlist leads url returns no url', async () => {
    const badUrls = [
        'https://evil.example/pay',
        'http://swipesimple.com/links/lnk_x',
        'https://swipesimple.com.evil.test/pay',
        'https://user:pass@swipesimple.com/links/lnk_x'
    ];
    for (const bad of badUrls) {
        const h = harness({
            routes: {
                payment: () => jsonResponse(200, {
                    ok: true,
                    url: bad,
                    amount_cents: 99999,
                    source: 'invoice'
                })
            },
            loadCase: () => ({ premiumAmount: 250, bondAmount: 10000 })
        });
        const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
        assertCallOnly(result);
        assert.equal(JSON.stringify(result).includes('99999'), false, bad);
        assert.equal(h.loaded.length, 0, bad);
    }
});

test('a leads timeout returns no url', async () => {
    const h = harness({
        timeoutMs: 30,
        routes: { hang: () => new Promise(() => {}) },
        loadCase: () => ({ totalPremium: '80.00', premiumAmount: 80 })
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assertCallOnly(result);
    assert.match(h.logs.join('\n'), /timeout/);
    assert.equal(h.loaded.length, 0);
    assertNoSecretLeak(h.logs.join('\n'));
});

test('a 409 or any non-ok leads response returns no url and no case premium', async () => {
    const conflict = harness({
        routes: {
            payment: () => jsonResponse(409, {
                ok: false,
                code: 'premium_unconfirmed',
                url: ALLOWED,
                amount_cents: 1
            })
        },
        loadCase: () => ({ premiumAmount: 250, bondAmount: 10000 })
    });
    const result = await api.getPaymentLinkForSession(TOKEN, conflict.deps);
    assertCallOnly(result);
    assert.equal(JSON.stringify(result).includes('premium_unconfirmed'), false);
    assert.match(conflict.logs.join('\n'), /http_409/);
    assert.equal(conflict.loaded.length, 0);
});

test('an unknown fallback mode fails closed with no url', async () => {
    const unknown = loadPayment('not-a-mode');
    const h = harness({
        routes: { payment: () => jsonResponse(404, { ok: false }) },
        loadCase: () => ({ premiumAmount: 10 })
    });
    const result = await unknown.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.url, '');
    assert.equal(result.reason, 'bad_fallback_mode');
    assert.equal(result.message, api.UNAVAILABLE_NOTE);
    assert.equal(h.loaded.length, 0);
});

test('leads errors and a missing key fall back without inventing a premium', async () => {
    const missing = harness({
        secrets: { LEADS_API_KEY: '', GAS_API_KEY: '' },
        loadCase: () => ({ bondAmount: 10000, balanceDue: 400 })
    });
    const http = harness({
        routes: { payment: () => jsonResponse(404, { ok: false, url: ALLOWED }) },
        loadCase: () => ({ bondAmount: 10000 })
    });
    const thrown = harness({
        routes: { payment: () => { throw new Error('socket hang up'); } },
        loadCase: () => null
    });
    const badContract = harness({
        routes: {
            payment: () => jsonResponse(200, { ok: true, url: ALLOWED, amount_cents: 100, source: 'fallback' })
        }
    });
    for (const h of [missing, http, thrown, badContract]) {
        const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
        assertCallOnly(result);
        assert.equal(h.loaded.length, 0);
        assertNoSecretLeak(JSON.stringify(result) + h.logs.join('\n'));
    }
    assert.equal(missing.calls.length, 0);
});

test('no session returns no url and does not call leads', async () => {
    for (const input of ['', '   ', null, undefined, {}, { caseId: CLIENT_CASE, personId: CLIENT_PERSON }]) {
        const h = harness();
        const result = await api.getPaymentLinkForSession(input, h.deps);
        assert.equal(result.ok, false);
        assert.equal(result.url, '');
        assert.equal(result.amount_cents, null);
        assert.equal(result.source, '');
        assert.equal(result.reason, 'no_session');
        assert.equal(h.calls.length, 0);
        assert.equal(h.validated.length, 0);
        assert.equal(h.loaded.length, 0);
    }
});

test('an indemnitor session with the case id only on personId still uses the session', async () => {
    const h = harness({
        session: session({ caseId: '', personId: 'indemnitor_' + CASE_ID, role: 'indemnitor' }),
        routes: {
            payment: () => jsonResponse(200, { ok: true, url: ALLOWED, amount_cents: 100, source: 'invoice' })
        }
    });
    const result = await api.getPaymentLinkForSession({
        sessionToken: TOKEN,
        caseId: CLIENT_CASE,
        personId: 'indemnitor_' + CLIENT_CASE
    }, h.deps);
    assert.equal(result.ok, true);
    const url = new URL(h.calls[0].url);
    assert.equal(url.searchParams.get('case_id'), CASE_ID);
    assert.equal(url.searchParams.get('person_id'), 'indemnitor_' + CASE_ID);
    assert.equal(JSON.stringify(h.calls).includes(CLIENT_CASE), false);
});

test('client-supplied case and person ids are ignored', async () => {
    const h = harness({
        session: session({ role: 'indemnitor' }),
        routes: {
            payment: () => jsonResponse(200, {
                ok: true,
                url: 'https://shamrockbailbonds.biz/pay/session',
                amount_cents: 5000,
                source: 'invoice'
            })
        }
    });
    h.deps.caseId = CLIENT_CASE;
    h.deps.personId = CLIENT_PERSON;
    h.deps.case_id = CLIENT_CASE;
    h.deps.person_id = CLIENT_PERSON;
    const result = await api.getPaymentLinkForSession({
        sessionToken: TOKEN,
        caseId: CLIENT_CASE,
        case_id: CLIENT_CASE,
        personId: CLIENT_PERSON,
        person_id: CLIENT_PERSON,
        role: 'admin'
    }, h.deps, CLIENT_CASE, CLIENT_PERSON);
    assert.equal(result.ok, true);
    assert.equal(result.source, 'invoice');
    assert.deepEqual(h.validated, [TOKEN]);
    const url = new URL(h.calls[0].url);
    assert.equal(url.searchParams.get('case_id'), CASE_ID);
    assert.equal(url.searchParams.get('person_id'), PERSON_ID);
    const blob = JSON.stringify(h.calls) + JSON.stringify(result);
    assert.equal(blob.includes(CLIENT_CASE), false);
    assert.equal(blob.includes(CLIENT_PERSON), false);
    assert.equal(api.sessionTokenFromInput({
        sessionToken: TOKEN,
        caseId: CLIENT_CASE,
        personId: CLIENT_PERSON
    }), TOKEN);
});

test('a session without a person, case, or paying role fails closed', async () => {
    const cases = [
        session({ personId: '' }),
        session({ caseId: '' }),
        session({ role: 'admin' }),
        session({ role: 'staff' }),
        session({ personId: 'bad id' })
    ];
    for (const row of cases) {
        const h = harness({ session: row });
        const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
        assert.equal(result.ok, false);
        assert.equal(result.url, '');
        assert.equal(h.calls.length, 0);
    }
});

test('a leads base outside shamrock or the test double is not called', async () => {
    const h = harness({
        leadsBase: 'https://evil.example',
        loadCase: () => ({ premiumAmount: 10 })
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(h.calls.length, 0);
    assertCallOnly(result);
    assert.equal(h.loaded.length, 0);
    assertNoSecretLeak(h.logs.join('\n'));
});

test('dashboard key falls back to GAS_API_KEY only when LEADS_API_KEY is empty', async () => {
    const h = harness({
        secrets: { LEADS_API_KEY: '' },
        routes: {
            payment: () => jsonResponse(200, { ok: true, url: ALLOWED, amount_cents: 100, source: 'invoice' })
        }
    });
    const result = await api.getPaymentLinkForSession(TOKEN, h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.calls[0].options.headers['X-API-Key'], GAS_KEY);
    assert.equal(h.calls[0].options.headers['X-Internal-Token'], GAS_KEY);
});

test('payment module does not invent amounts or read swipesimple switches', () => {
    const src = fs.readFileSync(path.join(root, 'src/backend/portal-payment.js'), 'utf8');
    assert.equal(src.includes('enablePayments'), false);
    assert.equal(src.includes('SWIPESIMPLE'), false);
    assert.equal(src.includes('bondAmount'), false);
    assert.equal(src.includes('* 0.10'), false);
    assert.equal(src.includes('727'), false);
    assert.equal(src.includes('955'), false);
    assert.match(src, /person_id/);
    assert.match(src, /case_id/);
    assert.equal(api.UNAVAILABLE_NOTE, 'Payment link unavailable right now. Please call (239) 332-2245.');
    assert.equal(api.PREMIUM_DUE_LABEL, 'Premium due');
});

test('web module derives the session itself and members may call it', () => {
    const jsw = fs.readFileSync(path.join(root, 'src/backend/portal-payment.jsw'), 'utf8');
    const fn = jsw.slice(jsw.indexOf('export async function getPaymentLinkForSession'));
    assert.match(fn, /export async function getPaymentLinkForSession\(input\)/);
    assert.equal(fn.includes('caseId'), false);
    assert.equal(fn.includes('personId'), false);
    assert.equal(fn.includes('case_id'), false);
    assert.equal(fn.includes('person_id'), false);
    assert.match(jsw, /validateCustomSession/);
    assert.match(jsw, /resolveDashboardKey/);
    assert.equal(jsw.includes('leadsBase'), false);
    assert.equal(jsw.includes('PAYMENT_FALLBACK_MODE'), false);
    assert.equal(jsw.includes('fallbackMode'), false);

    const perms = JSON.parse(fs.readFileSync(path.join(root, 'src/backend/permissions.json'), 'utf8'));
    const block = perms['web-methods']['portal-payment.jsw'];
    for (const name of ['*', 'getPaymentLinkForSession']) {
        assert.equal(block[name].anonymous.invoke, true, name + ' anonymous');
        assert.equal(block[name].siteMember.invoke, true, name + ' siteMember');
        assert.equal(block[name].siteOwner.invoke, true, name + ' siteOwner');
    }
});

test('both portal pages open the server url and keep the existing role gates', () => {
    const pages = {
        indemnitor: fs.readFileSync(path.join(root, 'src/pages/Indemnitor Portal.go8lz.js'), 'utf8'),
        defendant: fs.readFileSync(path.join(root, 'src/pages/Defendant Portal.adato.js'), 'utf8')
    };
    assert.match(pages.indemnitor, /ALLOWED_ROLES = \['indemnitor', 'coindemnitor'\]/);
    assert.match(pages.defendant, /validation\.role !== 'defendant'/);
    for (const src of Object.values(pages)) {
        const pay = src.slice(src.indexOf('async function startPayment'), src.indexOf('const ACTIONS'));
        assert.match(pay, /getPaymentLinkForSession\(sessionToken\)/);
        assert.equal(pay.includes('caseId'), false);
        assert.equal(pay.includes('personId'), false);
        assert.equal(pay.includes('case_id'), false);
        assert.equal(pay.includes('person_id'), false);
        assert.match(pay, /wixLocation\.to\(url\)/);
        assert.match(pay, /premiumDueText\(result && result\.amount_cents\)/);
        assert.match(src, /'pay': \(\) => startPayment\(\)/);
        assert.match(src, /const PREMIUM_DUE_LABEL = 'Premium due'/);
        assert.match(src, /Payment link unavailable right now\. Please call \(239\) 332-2245\./);
        assert.equal(/estimate/i.test(src), false, 'estimate wording');
        assert.equal(pay.includes('sendSms'), false);
        assert.equal(pay.includes('BOND_PAYMENT_LINK'), false);
        assert.equal(src.includes('Payments are on hold'), false);
        assert.equal(src.includes('payments on hold'), false);
        assert.match(src, /from 'backend\/portal-payment'/);
    }
    assert.match(pages.indemnitor, /safeOnClick\('#btnPayInstallment', ACTIONS\['pay'\]\)/);
    assert.match(pages.indemnitor, /safeOnClick\('#makePaymentBtn', ACTIONS\['pay'\]\)/);
    assert.match(pages.defendant, /safeOnClick\('#btnMakePayment', ACTIONS\['pay'\]\)/);

    for (const rel of ['netlify-embeds/indemnitor-dashboard.html', 'netlify-embeds/defendant-dashboard.html']) {
        const html = fs.readFileSync(path.join(root, rel), 'utf8');
        assert.match(html, /id="pay-note"/);
        assert.match(html, /shamrock-dash-pay/);
        assert.match(html, /Premium due/);
        assert.match(html, /Payment link unavailable right now\. Please call \(239\) 332-2245\./);
        assert.equal(/estimate/i.test(html), false, rel);
        assert.equal(html.includes('premium-est'), false, rel);
        assert.equal(html.includes('totalPremium'), false, rel);
    }
});
