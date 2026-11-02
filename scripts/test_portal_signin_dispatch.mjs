#!/usr/bin/env node
/**
 * Portal sign-in delivery chain. Mocked fetch only. No network. No real secrets.
 * Dashboard calls must use LEADS_API_KEY in X-API-Key.
 * gas-proxy calls must keep using GAS_API_KEY and must not receive the dashboard key.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'src/backend/portal-signin-dispatch.js'), 'utf8');

function load() {
    let code = src.replace(/^export /gm, '');
    code += '\nreturn { maskPhone, maskEmail, twilioSmsEnabled, describeSignInResult, resolveDashboardKey, deliverPortalSignInLink, probeDashboardSend, dashboardSend };';
    return new Function(code)();
}

const api = load();

const PHONE = '5555550100';
const EMAIL = 'client@example.com';
const LEADS_KEY = 'leads-test-key';
const GAS_KEY = 'gas-test-key';
const LINK = 'https://links.test/portal?token=abc';
const SLACK = 'https://hooks.example.test/services/test';
const TEXT = 'Shamrock Bail Bonds sign-in ' + LINK;

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
        GAS_API_KEY: GAS_KEY,
        PORTAL_TWILIO_SMS_ENABLED: '',
        SLACK_WEBHOOK_URL: SLACK
    }, overrides && overrides.secrets);
    let twilioCalls = 0;
    const routes = (overrides && overrides.routes) || {};
    const fetchImpl = async (url, options) => {
        const body = options && options.body ? JSON.parse(options.body) : {};
        calls.push({ url, options, body });
        if (typeof routes.all === 'function') return routes.all(url, body, options);
        if (url.indexOf('/wix/send') !== -1 && routes.wix) return routes.wix(url, body, options);
        if (url.indexOf('/shannon/send') !== -1 && routes.shannon) return routes.shannon(url, body, options);
        if (url.indexOf('/api/imessage/status') !== -1 && routes.status) return routes.status(url, body, options);
        if (url === SLACK) return jsonResponse(200, { ok: true });
        if (body.action === 'sendBlueBubblesRelay' && routes.relay) return routes.relay(url, body, options);
        if (body.action === 'sendEmail' && routes.email) return routes.email(url, body, options);
        return jsonResponse(401, { success: false, error: 'Authentication required' });
    };
    const deps = {
        fetchImpl,
        getSecret: async (name) => (secrets[name] == null ? '' : secrets[name]),
        sendTwilio: async () => {
            twilioCalls += 1;
            return { success: true };
        },
        logger: { warn: (...args) => logs.push(args.map(String).join(' ')) },
        timeoutMs: 200,
        retryDelayMs: 0,
        emailAttempts: 2,
        leadsBase: 'https://dashboard.test',
        gasProxyUrl: 'https://gas-proxy.test/api/gas-proxy'
    };
    return {
        calls,
        logs,
        deps,
        secrets,
        twilioCalls: () => twilioCalls
    };
}

function phoneInput(extra) {
    return Object.assign({
        mode: 'phone',
        phone: PHONE,
        email: '',
        text: TEXT,
        subject: 'Your Secure Portal Access - Shamrock Bail Bonds',
        htmlBody: '<p>Hello</p>'
    }, extra || {});
}

function assertNoSecrets(blob) {
    assert.equal(blob.includes(PHONE), false, 'full phone leaked');
    assert.equal(blob.includes('+1' + PHONE), false, 'e164 phone leaked');
    assert.equal(blob.includes(EMAIL), false, 'full email leaked');
    assert.equal(blob.includes(LEADS_KEY), false, 'dashboard key leaked');
    assert.equal(blob.includes(GAS_KEY), false, 'gas key leaked');
    assert.equal(blob.includes(SLACK), false, 'slack url leaked');
    assert.equal(blob.includes('links.test'), false, 'sign-in link leaked');
}

test('masks phone and email without keeping the full value', () => {
    assert.equal(api.maskPhone(PHONE), '•••-•••-0100');
    assert.equal(api.maskEmail(EMAIL), 'cl•••@example.com');
    assert.equal(api.maskPhone('5555550100').includes(PHONE), false);
    assert.equal(api.maskEmail(EMAIL).includes('client@'), false);
});

test('twilio flag defaults off', () => {
    assert.equal(api.twilioSmsEnabled(''), false);
    assert.equal(api.twilioSmsEnabled('false'), false);
    assert.equal(api.twilioSmsEnabled('no'), false);
    assert.equal(api.twilioSmsEnabled('true'), true);
    assert.equal(api.twilioSmsEnabled('1'), true);
    assert.equal(api.twilioSmsEnabled('on'), true);
});

test('dashboard X-API-Key is LEADS_API_KEY and gas-proxy is not called when wix/send accepts', async () => {
    const h = harness({
        routes: {
            wix: () => jsonResponse(200, { success: true, channel: 'imessage', messageId: 'm1' })
        }
    });
    const result = await api.deliverPortalSignInLink(phoneInput(), h.deps);
    assert.equal(result.success, true);
    assert.equal(result.channel, 'imessage');
    assert.equal(result.reason, 'sent');
    assert.match(result.message, /texted your sign-in link to •••-•••-0100/);
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].url, 'https://dashboard.test/api/imessage/wix/send');
    assert.equal(h.calls[0].options.headers['X-API-Key'], LEADS_KEY);
    assert.equal(h.calls[0].options.headers['X-Internal-Token'], LEADS_KEY);
    assert.notEqual(h.calls[0].options.headers['X-API-Key'], GAS_KEY);
    assertNoSecrets(h.logs.join('\n'));
});

test('falls back to GAS_API_KEY for the dashboard only when LEADS_API_KEY is empty', async () => {
    const h = harness({
        secrets: { LEADS_API_KEY: '' },
        routes: {
            wix: () => jsonResponse(200, { success: true, sent: true })
        }
    });
    const resolved = await api.resolveDashboardKey(h.deps.getSecret);
    assert.equal(resolved.source, 'GAS_API_KEY');
    assert.equal(resolved.key, GAS_KEY);
    const result = await api.deliverPortalSignInLink(phoneInput(), h.deps);
    assert.equal(result.success, true);
    assert.equal(h.calls[0].options.headers['X-API-Key'], GAS_KEY);
});

test('401 on wix/send is config_auth_mismatch and shannon/send is tried next', async () => {
    const h = harness({
        routes: {
            wix: () => jsonResponse(401, { success: false, error: 'Authentication required' }),
            shannon: () => jsonResponse(200, { success: true, channel: 'sms' })
        }
    });
    const result = await api.deliverPortalSignInLink(phoneInput(), h.deps);
    assert.equal(result.success, true);
    assert.equal(result.channel, 'sms');
    assert.deepEqual(h.calls.map((c) => c.url), [
        'https://dashboard.test/api/imessage/wix/send',
        'https://dashboard.test/api/imessage/shannon/send'
    ]);
    assert.match(h.logs.join('\n'), /config_auth_mismatch/);
    assertNoSecrets(h.logs.join('\n'));
});

test('dashboard auth failure uses gas relay with GAS_API_KEY, never the dashboard key', async () => {
    const h = harness({
        routes: {
            wix: () => jsonResponse(401, { success: false }),
            shannon: () => jsonResponse(401, { success: false }),
            relay: () => jsonResponse(200, { success: true, queued: true, channel: 'imessage' })
        }
    });
    const result = await api.deliverPortalSignInLink(phoneInput(), h.deps);
    assert.equal(result.success, true);
    assert.equal(result.channel, 'imessage');
    const relay = h.calls.find((c) => c.body && c.body.action === 'sendBlueBubblesRelay');
    assert.ok(relay, 'relay was not called');
    assert.equal(relay.url, 'https://gas-proxy.test/api/gas-proxy');
    assert.equal(relay.body.apiKey, GAS_KEY);
    assert.equal(relay.options.headers['X-GAS-API-Key'], GAS_KEY);
    assert.notEqual(relay.body.apiKey, LEADS_KEY);
    assert.equal(h.twilioCalls(), 0);
    assert.equal(h.calls.some((c) => c.url === SLACK), false);
});

test('twilio stays off unless the flag is on, then email on file is used', async () => {
    const h = harness({
        routes: {
            wix: () => jsonResponse(502, { success: false }),
            shannon: () => jsonResponse(502, { success: false }),
            relay: () => jsonResponse(502, { success: false }),
            email: () => jsonResponse(200, { success: true })
        }
    });
    const result = await api.deliverPortalSignInLink(phoneInput({ email: EMAIL }), h.deps);
    assert.equal(result.success, true);
    assert.equal(result.channel, 'email');
    assert.equal(result.reason, 'text_failed_emailed');
    assert.match(result.message, /couldn't text your sign-in link, so we emailed it to cl•••@example.com/);
    assert.equal(h.twilioCalls(), 0);
    assert.match(h.logs.join('\n'), /skipped_flag_off/);
    const emailCall = h.calls.find((c) => c.body && c.body.action === 'sendEmail');
    assert.equal(emailCall.body.apiKey, GAS_KEY);
    assert.equal(emailCall.body.to, EMAIL);
    assert.equal(h.calls.some((c) => c.url === SLACK), false);
    assertNoSecrets(h.logs.join('\n'));
});

test('twilio runs only when PORTAL_TWILIO_SMS_ENABLED is true and before email', async () => {
    const h = harness({
        secrets: { PORTAL_TWILIO_SMS_ENABLED: 'true' },
        routes: {
            wix: () => jsonResponse(401, {}),
            shannon: () => jsonResponse(401, {}),
            relay: () => jsonResponse(401, {})
        }
    });
    const result = await api.deliverPortalSignInLink(phoneInput({ email: EMAIL }), h.deps);
    assert.equal(result.success, true);
    assert.equal(result.channel, 'sms');
    assert.equal(h.twilioCalls(), 1);
    assert.equal(h.calls.some((c) => c.body && c.body.action === 'sendEmail'), false);
});

test('total phone failure alerts Slack with a masked contact and offers email', async () => {
    const h = harness({
        routes: {
            wix: () => jsonResponse(401, {}),
            shannon: () => jsonResponse(401, {}),
            relay: () => jsonResponse(401, {})
        }
    });
    const result = await api.deliverPortalSignInLink(phoneInput(), h.deps);
    assert.equal(result.success, false);
    assert.equal(result.reason, 'auth');
    assert.equal(result.offerEmail, true);
    assert.match(result.message, /Try email instead/);
    assert.match(result.message, /\(239\) 332-2245/);
    const slack = h.calls.find((c) => c.url === SLACK);
    assert.ok(slack, 'slack alert missing');
    assert.match(slack.body.text, /•••-•••-0100/);
    assert.equal(slack.body.text.includes(PHONE), false);
    assert.equal(slack.body.text.includes(LINK), false);
    assertNoSecrets(h.logs.join('\n'));
});

test('email path uses GAS_API_KEY, retries a fast 503, and does not call the dashboard', async () => {
    let emailHits = 0;
    const h = harness({
        routes: {
            email: () => {
                emailHits += 1;
                if (emailHits === 1) return jsonResponse(503, { success: false });
                return jsonResponse(200, { success: true });
            }
        }
    });
    const result = await api.deliverPortalSignInLink({
        mode: 'email',
        email: EMAIL,
        phone: '',
        text: TEXT,
        subject: 'Your Secure Portal Access - Shamrock Bail Bonds',
        htmlBody: '<p>Hello</p>'
    }, h.deps);
    assert.equal(result.success, true);
    assert.equal(result.channel, 'email');
    assert.match(result.message, /emailed your sign-in link to cl•••@example.com/);
    const emails = h.calls.filter((c) => c.body && c.body.action === 'sendEmail');
    assert.equal(emails.length, 2);
    assert.equal(emails[0].body.apiKey, GAS_KEY);
    assert.equal(emails[1].body.apiKey, GAS_KEY);
    assert.equal(h.calls.some((c) => String(c.url).includes('dashboard.test')), false);
    assertNoSecrets(h.logs.join('\n'));
});

test('email failure texts the phone on file and does not alert Slack', async () => {
    const h = harness({
        routes: {
            email: () => jsonResponse(500, { success: false }),
            wix: () => jsonResponse(200, { success: true, channel: 'imessage' })
        }
    });
    const result = await api.deliverPortalSignInLink({
        mode: 'email',
        email: EMAIL,
        phone: PHONE,
        text: TEXT,
        subject: 'Your Secure Portal Access - Shamrock Bail Bonds',
        htmlBody: '<p>Hello</p>'
    }, h.deps);
    assert.equal(result.success, true);
    assert.equal(result.reason, 'email_failed_texted');
    assert.match(result.message, /couldn't email your sign-in link, so we texted it to •••-•••-0100/);
    assert.equal(h.calls.some((c) => c.url === SLACK), false);
    assert.equal(h.calls[0].body.action, 'sendEmail');
    assert.equal(h.calls[0].body.apiKey, GAS_KEY);
    assert.equal(h.calls.at(-1).options.headers['X-API-Key'], LEADS_KEY);
});

test('email auth failure does not retry and offers a mobile number', async () => {
    const h = harness({
        routes: {
            email: () => jsonResponse(401, { success: false, error: 'Unauthorized' })
        }
    });
    const result = await api.deliverPortalSignInLink({
        mode: 'email',
        email: EMAIL,
        phone: '',
        text: TEXT,
        subject: 'Subject',
        htmlBody: '<p>Hi</p>'
    }, h.deps);
    assert.equal(result.success, false);
    assert.equal(result.offerPhone, true);
    assert.match(result.message, /Try a mobile number instead/);
    assert.equal(h.calls.filter((c) => c.body && c.body.action === 'sendEmail').length, 1);
    const slack = h.calls.find((c) => c.url === SLACK);
    assert.match(slack.body.text, /cl•••@example.com/);
    assert.equal(slack.body.text.includes(EMAIL), false);
});

test('a hung wix/send is unreachable and the chain continues', async () => {
    const h = harness({
        routes: {
            wix: () => new Promise(() => {}),
            shannon: () => jsonResponse(200, { success: true, queued: true })
        }
    });
    h.deps.timeoutMs = 30;
    const result = await api.deliverPortalSignInLink(phoneInput(), h.deps);
    assert.equal(result.success, true);
    assert.match(h.logs.join('\n'), /"step":"wix_send".*"reason":"unreachable"/);
});

test('invalid phone does not fetch or alert', async () => {
    const h = harness();
    const result = await api.deliverPortalSignInLink(phoneInput({ phone: '123' }), h.deps);
    assert.equal(result.success, false);
    assert.equal(result.reason, 'invalid');
    assert.equal(h.calls.length, 0);
    assert.match(result.message, /10-digit phone number or email/);
});

test('probe sends an empty body and classifies 401 as config_auth_mismatch', async () => {
    const h = harness({
        routes: {
            status: () => jsonResponse(401, { error: 'Authentication required' })
        }
    });
    const result = await api.probeDashboardSend(h.deps);
    assert.equal(result.success, false);
    assert.equal(result.reason, 'auth');
    assert.equal(result.error, 'config_auth_mismatch');
    assert.equal(result.keySource, 'LEADS_API_KEY');
    assert.equal(h.calls[0].options.headers['X-API-Key'], LEADS_KEY);
    const send = h.calls.find((c) => c.url.includes('/wix/send'));
    assert.equal(send, undefined);
    assertNoSecrets(h.logs.join('\n'));
});

test('probe empty send expects 400 and never includes a phone', async () => {
    const h = harness({
        routes: {
            status: () => jsonResponse(200, { connected: true, servers: [{ path_in_use: 'tailscale' }] }),
            wix: (_url, body) => {
                assert.deepEqual(body, {});
                return jsonResponse(400, { success: false, error: 'missing phone' });
            }
        }
    });
    const result = await api.probeDashboardSend(h.deps);
    assert.equal(result.success, true);
    assert.equal(result.sendProbeStatus, 400);
    assert.equal(result.keySource, 'LEADS_API_KEY');
    const send = h.calls.find((c) => c.url.includes('/wix/send'));
    assert.deepEqual(send.body, {});
    assert.equal(JSON.stringify(send.body).includes(PHONE), false);
});

test('page, embed, and relay keep the split-key contract and friendly copy', () => {
    const page = fs.readFileSync(path.join(root, 'src/pages/portal-landing.bagfn.js'), 'utf8');
    const auth = fs.readFileSync(path.join(root, 'src/backend/portal-auth.jsw'), 'utf8');
    const embed = fs.readFileSync(path.join(root, 'netlify-embeds/portal-login.html'), 'utf8');
    const relay = fs.readFileSync(path.join(root, 'backend-gas/ClipboardBridge.js'), 'utf8');
    const studio = fs.readFileSync(path.join(root, 'docs/studio-velo/portal-landing.js'), 'utf8');

    assert.match(page, /sendMagicLinkSimplified\(\{ phone: phone, email: email \}\)/);
    assert.match(page, /Try email instead, or call \(239\) 332-2245/);
    assert.match(page, /bondNeedsCoIndemnitor \? 'coindemnitor' : 'indemnitor'/);
    assert.match(auth, /deliverPortalSignInLink/);
    assert.match(auth, /role = 'indemnitor'/);
    assert.match(auth, /@bailschool/);
    assert.doesNotMatch(auth, /sendBlueBubblesMessage/);
    assert.match(auth, /import\('backend\/twilio-client'\)/);
    assert.doesNotMatch(auth, /from 'backend\/twilio-client'/);

    assert.match(embed, /id="tabInd" aria-selected="true"/);
    assert.match(embed, /id="tabDef" aria-selected="false"/);
    assert.match(embed, /defendant still signs on every bond/i);
    assert.match(embed, /Try email instead/);
    assert.match(embed, /id="phone"/);
    assert.match(embed, /id="email"/);
    assert.doesNotMatch(embed, /We couldn\\u2019t send the link\. Please call/);

    assert.match(studio, /sendMagicLinkSimplified\(\{ phone: phone, email: email \}\)/);
    assert.match(studio, /let\s+currentRole\s*=\s*['"]indemnitor['"]/);

    assert.match(relay, /props\.getProperty\('LEADS_API_KEY'\)/);
    assert.match(relay, /_clipboardMaskPhone_/);
    assert.match(relay, /'X-API-Key': key/);
    assert.doesNotMatch(relay, /relay failed for ' \+ to/);
});
