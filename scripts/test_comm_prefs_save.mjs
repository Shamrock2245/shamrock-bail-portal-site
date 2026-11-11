#!/usr/bin/env node
/**
 * Communication preferences save/load and signed-link auth.
 * Mocked deps only. No network. No secrets.
 *
 * Consent changes require a validated session/member whose server-derived
 * contact is used, or a personal HMAC-signed link. Anonymous callers with
 * neither must not write CMS or call GAS. All-channels-off remains valid.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    AUTH_REQUIRED_ERROR,
    COMM_PREFS_LINK_SECRET_NAME,
    DEFAULT_LINK_TTL_SECONDS,
    emailsEqual,
    getCommunicationPreferences,
    interpretGasCommPrefsResult,
    mintCommPrefsLinkToken,
    phoneDigits,
    phonesEqual,
    saveCommunicationPreferences,
    signCommPrefsPayload,
    validateCommPrefsInput,
    verifyCommPrefsPayload
} from '../src/backend/commPrefs.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXED_NOW = new Date('2026-11-11T16:00:00.000Z');
const TEST_SECRET = 'test-comm-prefs-link-secret-not-used-in-prod';

function baseForm(extra) {
    return Object.assign({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '(239) 555-0100',
        email: 'jane@example.com',
        caseNumber: '240001234',
        smsOptIn: true,
        whatsappOptIn: true,
        telegramOptIn: false,
        emailOptIn: true,
        personId: 'client-person-ignored',
        sessionToken: 'session-token'
    }, extra || {});
}

function allOff(extra) {
    return baseForm(Object.assign({
        smsOptIn: false,
        whatsappOptIn: false,
        telegramOptIn: false,
        emailOptIn: false
    }, extra || {}));
}

function harness(overrides) {
    const store = [];
    const gasCalls = [];
    const writes = { updates: [], inserts: [] };
    const session = overrides && Object.prototype.hasOwnProperty.call(overrides, 'session')
        ? overrides.session
        : { valid: true, personId: 'person-session-1', phone: '2395550100', email: 'jane@example.com' };
    const gasResult = overrides && Object.prototype.hasOwnProperty.call(overrides, 'gasResult')
        ? overrides.gasResult
        : { success: true, result: { success: true, message: 'Preferences updated.' } };
    const secret = overrides && Object.prototype.hasOwnProperty.call(overrides, 'secret')
        ? overrides.secret
        : TEST_SECRET;
    if (overrides && overrides.existing) store.push(overrides.existing);

    const deps = {
        validateSession: async (token) => {
            if (overrides && typeof overrides.validateSession === 'function') {
                return overrides.validateSession(token);
            }
            return session;
        },
        getCurrentMember: async () => (overrides && Object.prototype.hasOwnProperty.call(overrides, 'member')
            ? overrides.member
            : null),
        getLinkSecret: async () => secret,
        queryUsersByContact: async ({ personId, phone, email }) => {
            if (personId) {
                const byId = store.find((row) => row.personId === personId);
                if (byId) return byId;
            }
            if (email) {
                const byEmail = store.find((row) => emailsEqual(row.email, email));
                if (byEmail) return byEmail;
            }
            if (phone) {
                const byPhone = store.find((row) => phonesEqual(row.phone, phone));
                if (byPhone) return byPhone;
            }
            return null;
        },
        updateUser: async (record) => {
            writes.updates.push(record);
            const idx = store.findIndex((row) => row._id === record._id || (record.personId && row.personId === record.personId));
            if (idx >= 0) store[idx] = record;
            return record;
        },
        insertUser: async (record) => {
            const saved = Object.assign({ _id: 'new-' + (store.length + 1) }, record);
            writes.inserts.push(saved);
            store.push(saved);
            return saved;
        },
        syncToGas: async (prefs) => {
            gasCalls.push(prefs);
            if (overrides && overrides.gasThrows) throw new Error('network down');
            return typeof gasResult === 'function' ? gasResult(prefs) : gasResult;
        },
        now: () => FIXED_NOW
    };
    return { store, gasCalls, writes, deps };
}

async function mintLink(deps, extra) {
    return mintCommPrefsLinkToken(Object.assign({
        phone: '2395550100',
        contactId: 'person-session-1',
        channels: 'all'
    }, extra || {}), deps);
}

test('validate requires first name, last name, and a 10-digit phone', () => {
    assert.equal(validateCommPrefsInput({}).ok, false);
    assert.match(validateCommPrefsInput({ firstName: 'A', lastName: '', phone: '2395550100' }).error, /last name/i);
    assert.match(validateCommPrefsInput({ firstName: 'A', lastName: 'B', phone: '' }).error, /phone/i);
    assert.match(validateCommPrefsInput({ firstName: 'A', lastName: 'B', phone: '555-123' }).error, /valid phone/i);
    const ok = validateCommPrefsInput(baseForm());
    assert.equal(ok.ok, true);
    assert.equal(ok.prefs.phone, '(239) 555-0100');
});

test('validate accepts all-channels-off as explicit false opt-outs', () => {
    const ok = validateCommPrefsInput(allOff());
    assert.equal(ok.ok, true);
    assert.equal(ok.prefs.smsOptIn, false);
    assert.equal(ok.prefs.whatsappOptIn, false);
    assert.equal(ok.prefs.telegramOptIn, false);
    assert.equal(ok.prefs.emailOptIn, false);
});

test('validate coerces non-boolean channel flags to explicit false', () => {
    const ok = validateCommPrefsInput(baseForm({
        smsOptIn: 'yes',
        whatsappOptIn: 1,
        telegramOptIn: null,
        emailOptIn: undefined
    }));
    assert.equal(ok.ok, true);
    assert.equal(ok.prefs.smsOptIn, false);
    assert.equal(ok.prefs.whatsappOptIn, false);
    assert.equal(ok.prefs.telegramOptIn, false);
    assert.equal(ok.prefs.emailOptIn, false);
});

test('interpretGasCommPrefsResult requires HTTP OK and body.success === true', () => {
    assert.equal(interpretGasCommPrefsResult({ ok: false, status: 401 }, { success: true }).success, false);
    assert.equal(interpretGasCommPrefsResult({ ok: true, status: 200 }, { success: false, message: 'Invalid API Key' }).success, false);
    assert.match(interpretGasCommPrefsResult({ ok: true, status: 200 }, { success: false, message: 'Invalid API Key' }).error, /Invalid API Key/);
    assert.equal(interpretGasCommPrefsResult({ ok: true, status: 200 }, null).success, false);
    const ok = interpretGasCommPrefsResult({ ok: true, status: 200 }, { success: true, message: 'Preferences updated.' });
    assert.equal(ok.success, true);
    assert.equal(ok.result.message, 'Preferences updated.');
});

test('anonymous callers with no session and no link cannot save or load', async () => {
    const h = harness({ session: { valid: false } });
    const saved = await saveCommunicationPreferences(allOff({ sessionToken: '', personId: 'spoof' }), h.deps);
    assert.equal(saved.ok, false);
    assert.equal(saved.code, 'auth_required');
    assert.equal(saved.error, AUTH_REQUIRED_ERROR);
    assert.equal(h.gasCalls.length, 0);
    assert.equal(h.writes.updates.length, 0);
    assert.equal(h.writes.inserts.length, 0);

    const loaded = await getCommunicationPreferences({ sessionToken: '', personId: 'spoof', phone: '2395550100' }, h.deps);
    assert.equal(loaded.ok, false);
    assert.equal(loaded.code, 'auth_required');
    assert.equal(loaded.data, undefined);
});

test('all-off save awaits GAS with explicit false flags, then persists', async () => {
    const h = harness({
        existing: { _id: 'u1', personId: 'person-session-1', firstName: 'Old', phone: '2395550100', email: 'jane@example.com' }
    });
    const result = await saveCommunicationPreferences(allOff(), h.deps);
    assert.equal(result.ok, true);
    assert.equal(result.lastUpdated, '2026-11-11T16:00:00.000Z');
    assert.deepEqual(result.prefs, {
        smsOptIn: false,
        whatsappOptIn: false,
        telegramOptIn: false,
        emailOptIn: false
    });
    assert.equal(h.gasCalls.length, 1);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(h.gasCalls[0].whatsappOptIn, false);
    assert.equal(h.gasCalls[0].telegramOptIn, false);
    assert.equal(h.gasCalls[0].emailOptIn, false);
    assert.equal(h.writes.updates.length, 1);
    assert.equal(h.writes.inserts.length, 0);
    assert.equal(h.writes.updates[0].smsOptIn, false);
    assert.equal(h.writes.updates[0].personId, 'person-session-1');
});

test('client-supplied personId and phone are ignored; session contact is used', async () => {
    const h = harness();
    const result = await saveCommunicationPreferences(baseForm({
        personId: 'attacker-id',
        phone: '(305) 555-9999',
        email: 'attacker@example.com'
    }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls.length, 1);
    assert.equal(phoneDigits(h.gasCalls[0].phone), '2395550100');
    assert.equal(h.gasCalls[0].email, 'jane@example.com');
    assert.equal(h.writes.inserts.length, 1);
    assert.equal(h.writes.inserts[0].personId, 'person-session-1');
    assert.equal(h.writes.inserts[0].personId === 'attacker-id', false);
    assert.equal(phoneDigits(h.writes.inserts[0].phone), '2395550100');
});

test('Wix member contact is derived server-side without a portal session', async () => {
    const h = harness({
        session: { valid: false },
        member: {
            loginEmail: 'member@example.com',
            contactId: 'contact-9',
            contactDetails: { phones: [{ number: '2395550100' }], firstName: 'Jane', lastName: 'Doe' }
        }
    });
    const result = await saveCommunicationPreferences(baseForm({
        sessionToken: '',
        phone: '3055559999'
    }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(phoneDigits(h.gasCalls[0].phone), '2395550100');
});

test('GAS failure does not persist and does not report success', async () => {
    const h = harness({ gasResult: { success: false, error: 'GAS returned 500' } });
    const result = await saveCommunicationPreferences(allOff(), h.deps);
    assert.equal(result.ok, false);
    assert.match(result.error, /consent gate/);
    assert.equal(result.lastUpdated, undefined);
    assert.equal(h.gasCalls.length, 1);
    assert.equal(h.writes.updates.length, 0);
    assert.equal(h.writes.inserts.length, 0);
});

test('GAS throw or missing success does not persist', async () => {
    const thrown = harness({ gasThrows: true });
    const r1 = await saveCommunicationPreferences(allOff(), thrown.deps);
    assert.equal(r1.ok, false);
    assert.equal(thrown.writes.inserts.length, 0);

    const empty = harness({ gasResult: undefined });
    const r2 = await saveCommunicationPreferences(allOff(), empty.deps);
    assert.equal(r2.ok, false);
    assert.equal(empty.writes.inserts.length, 0);
});

test('mint and verify a personal link with expiry and channel scope', async () => {
    const h = harness();
    const minted = await mintLink(h.deps, { channels: ['sms'], expiresInSeconds: 3600 });
    assert.equal(minted.ok, true);
    assert.ok(minted.token);
    assert.equal(minted.expiresAt, '2026-11-11T17:00:00.000Z');
    assert.deepEqual(minted.channels, ['sms']);
    const payload = verifyCommPrefsPayload(minted.token, TEST_SECRET);
    assert.equal(payload.typ, 'commprefs');
    assert.equal(payload.phone, '2395550100');
    assert.equal(payload.contactId, 'person-session-1');
    assert.deepEqual(payload.channels, ['sms']);
    assert.equal(payload.exp, Math.floor(FIXED_NOW.getTime() / 1000) + 3600);
});

test('mint fails closed when the signing secret is missing', async () => {
    const h = harness({ secret: '' });
    const minted = await mintLink(h.deps);
    assert.equal(minted.ok, false);
    assert.match(minted.error, /not configured/);
    assert.equal(DEFAULT_LINK_TTL_SECONDS, 7 * 24 * 60 * 60);
    assert.equal(COMM_PREFS_LINK_SECRET_NAME, 'COMM_PREFS_LINK_SECRET');
});

test('a valid signed link can save; spoofed phone is ignored', async () => {
    const h = harness({
        session: { valid: false },
        existing: { _id: 'u1', personId: 'person-session-1', phone: '2395550100', smsOptIn: true, emailOptIn: true }
    });
    const minted = await mintLink(h.deps, { channels: 'all' });
    const result = await saveCommunicationPreferences(allOff({
        sessionToken: '',
        linkToken: minted.token,
        phone: '3055559999'
    }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(phoneDigits(h.gasCalls[0].phone), '2395550100');
    assert.equal(h.writes.updates.length, 1);
    assert.equal(h.writes.updates[0].smsOptIn, false);
});

test('expired or tampered signed links cannot change consent', async () => {
    const h = harness({ session: { valid: false } });
    const expired = await mintLink(h.deps, { expiresInSeconds: 1 });
    const later = harness({
        session: { valid: false },
        now: () => new Date('2026-12-01T00:00:00.000Z')
    });
    later.deps.now = () => new Date('2026-12-01T00:00:00.000Z');
    const r1 = await saveCommunicationPreferences(allOff({
        sessionToken: '',
        linkToken: expired.token
    }), later.deps);
    assert.equal(r1.ok, false);
    assert.equal(r1.code, 'auth_required');
    assert.equal(later.gasCalls.length, 0);

    const minted = await mintLink(h.deps);
    const tampered = minted.token.slice(0, -2) + 'ab';
    const r2 = await saveCommunicationPreferences(allOff({
        sessionToken: '',
        linkToken: tampered
    }), h.deps);
    assert.equal(r2.ok, false);
    assert.equal(r2.code, 'auth_required');
    assert.equal(h.gasCalls.length, 0);

    const otherSecret = signCommPrefsPayload({
        typ: 'commprefs',
        phone: '2395550100',
        channels: ['sms', 'whatsapp', 'telegram', 'email'],
        exp: Math.floor(FIXED_NOW.getTime() / 1000) + 3600
    }, 'wrong-secret');
    const r3 = await saveCommunicationPreferences(allOff({
        sessionToken: '',
        linkToken: otherSecret
    }), h.deps);
    assert.equal(r3.ok, false);
    assert.equal(h.gasCalls.length, 0);
});

test('a channel-scoped link only changes channels in scope', async () => {
    const h = harness({
        session: { valid: false },
        existing: {
            _id: 'u1',
            personId: 'person-session-1',
            phone: '2395550100',
            smsOptIn: true,
            whatsappOptIn: true,
            telegramOptIn: true,
            emailOptIn: true
        }
    });
    const minted = await mintLink(h.deps, { channels: ['sms'] });
    const result = await saveCommunicationPreferences(allOff({
        sessionToken: '',
        linkToken: minted.token
    }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(h.gasCalls[0].whatsappOptIn, true);
    assert.equal(h.gasCalls[0].telegramOptIn, true);
    assert.equal(h.gasCalls[0].emailOptIn, true);
});

test('getCommunicationPreferences only returns the authenticated contact', async () => {
    const h = harness({
        existing: {
            personId: 'person-session-1',
            firstName: 'Jane',
            lastName: 'Doe',
            phone: '2395550100',
            email: 'jane@example.com',
            smsOptIn: false,
            whatsappOptIn: false,
            telegramOptIn: false,
            emailOptIn: false,
            prefsUpdatedAt: '2026-11-11T16:00:00.000Z'
        }
    });
    const loaded = await getCommunicationPreferences({ sessionToken: 'session-token' }, h.deps);
    assert.equal(loaded.ok, true);
    assert.equal(loaded.data.smsOptIn, false);
    assert.equal(loaded.data.firstName, 'Jane');

    const other = harness({
        session: { valid: false },
        existing: h.store[0]
    });
    const minted = await mintLink(other.deps, { phone: '3055551111', contactId: 'someone-else' });
    const viaWrongLink = await getCommunicationPreferences({
        sessionToken: '',
        linkToken: minted.token,
        phone: '2395550100'
    }, other.deps);
    assert.equal(viaWrongLink.ok, true);
    // The link is for 3055551111 / someone-else, so Jane's row must not leak.
    assert.notEqual(viaWrongLink.data && viaWrongLink.data.phone, '2395550100');
    assert.notEqual(viaWrongLink.data && viaWrongLink.data.firstName, 'Jane');
});

test('conflicting session and link identities are rejected', async () => {
    const h = harness();
    const minted = await mintLink(h.deps, { phone: '3055551111', contactId: 'other-person' });
    const result = await saveCommunicationPreferences(allOff({
        linkToken: minted.token
    }), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'auth_required');
    assert.equal(h.gasCalls.length, 0);
});

test('a scoped link with no CMS row does not opt in out-of-scope channels', async () => {
    const h = harness({ session: { valid: false } });
    const minted = await mintLink(h.deps, { channels: ['sms'] });
    const result = await saveCommunicationPreferences(allOff({
        sessionToken: '',
        linkToken: minted.token,
        firstName: 'Jane',
        lastName: 'Doe'
    }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls.length, 1);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(h.gasCalls[0].whatsappOptIn, false);
    assert.equal(h.gasCalls[0].telegramOptIn, false);
    assert.equal(h.gasCalls[0].emailOptIn, false);
    assert.equal(h.writes.inserts.length, 1);
    assert.equal(h.writes.inserts[0].whatsappOptIn, false);
});

test('when no CMS row exists, a GAS consent read is preserved for out-of-scope channels', async () => {
    const h = harness({ session: { valid: false } });
    h.deps.getGasPrefs = async (phone) => {
        assert.equal(phoneDigits(phone), '2395550100');
        return {
            smsOptIn: true,
            whatsAppOptIn: false,
            telegramOptIn: true,
            emailOptIn: false
        };
    };
    const minted = await mintLink(h.deps, { channels: ['sms'] });
    const result = await saveCommunicationPreferences(allOff({
        sessionToken: '',
        linkToken: minted.token
    }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(h.gasCalls[0].whatsappOptIn, false);
    assert.equal(h.gasCalls[0].telegramOptIn, true);
    assert.equal(h.gasCalls[0].emailOptIn, false);
});

test('post_commPrefsLink is an internal GAS_API_KEY mint path and does not send messages', () => {
    const http = fs.readFileSync(path.join(root, 'src/backend/http-functions.js'), 'utf8');
    assert.match(http, /export async function post_commPrefsLink/);
    assert.match(http, /mintCommunicationPreferencesLink/);
    const fn = http.slice(http.indexOf('export async function post_commPrefsLink'));
    assert.match(fn, /requireAuth\(request, body && body\.apiKey\)/);
    assert.match(http, /authenticateGasRequest/);
    assert.doesNotMatch(fn, /twilio|sendSms|sendMagicLink|MailApp|fetch\(/i);
    assert.doesNotMatch(fn, /TELEGRAM_BOT_TOKEN|TWILIO_/);
});

test('page code does not write CMS or fire-and-forget the GAS helper', () => {
    const page = fs.readFileSync(path.join(root, 'src/pages/Communication Preferences.zc3fn.js'), 'utf8');
    assert.equal(page.includes('wix-data'), false);
    assert.equal(page.includes('suppressAuth'), false);
    assert.equal(page.includes('syncCommPrefsToGas'), false);
    assert.match(page, /saveCommunicationPreferences/);
    assert.match(page, /getCommunicationPreferences/);
    assert.match(page, /result\.ok !== true/);
    assert.match(page, /authRequired/);
    assert.match(page, /linkTokenFromQuery/);
    assert.match(page, /personal link from your text message or sign in/);
    assert.match(page, /currentMember/);
    assert.match(page, /await loadAndPushPreferences\(\)/);
    assert.equal(page.includes('hasSession || hasLink'), false);
    assert.equal(page.includes('the form still works for anonymous users'), false);
});

test('HTML copies stay identical and surface the signed-link message', () => {
    const a = fs.readFileSync(path.join(root, 'netlify-embeds/communication-preferences.html'), 'utf8');
    const b = fs.readFileSync(path.join(root, 'src/custom-embeds/communication-preferences-embed.html'), 'utf8');
    assert.equal(a, b);
    assert.match(a, /id="authNotice"/);
    assert.match(a, /authRequired/);
    assert.match(a, /linkTokenFromUrl/);
    assert.match(a, /ALLOWED_PARENT_ORIGIN|isAllowedOrigin/);
    assert.equal(a.includes("postMessage(message, '*')"), false);
});

test('sync and mint are not client-invokable; save and get are', () => {
    const perms = JSON.parse(fs.readFileSync(path.join(root, 'src/backend/permissions.json'), 'utf8'));
    const block = perms['web-methods']['comm-prefs-sync.jsw'];
    assert.ok(block);
    for (const role of ['siteOwner', 'siteMember', 'anonymous']) {
        assert.equal(block.syncCommPrefsToGas[role].invoke, false, 'sync ' + role);
        assert.equal(block.mintCommunicationPreferencesLink[role].invoke, false, 'mint ' + role);
        assert.equal(block.saveCommunicationPreferences[role].invoke, true, 'save ' + role);
        assert.equal(block.getCommunicationPreferences[role].invoke, true, 'get ' + role);
        assert.equal(block['*'][role].invoke, false, 'default ' + role);
    }

    const jsw = fs.readFileSync(path.join(root, 'src/backend/comm-prefs-sync.jsw'), 'utf8');
    assert.match(jsw, /smsOptIn:\s*prefs\.smsOptIn === true/);
    assert.match(jsw, /interpretGasCommPrefsResult/);
    assert.match(jsw, /getGasWebAppUrl/);
    assert.match(jsw, /COMM_PREFS_LINK_SECRET/);
    assert.match(jsw, /mintCommunicationPreferencesLink/);
    assert.doesNotMatch(jsw, /smsOptIn:\s*prefs\.smsOptIn !== false/);
});
