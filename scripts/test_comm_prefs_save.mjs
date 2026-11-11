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
    CONFLICT_ERROR,
    DEFAULT_LINK_TTL_SECONDS,
    emailsEqual,
    gasFoundMarker,
    getCommunicationPreferences,
    hashPhoneRef,
    interpretGasCommPrefsResult,
    LOAD_ERROR,
    MINT_AMBIGUOUS_CONTACT_ERROR,
    MINT_MISMATCH_ERROR,
    MINT_UNRESOLVED_CONTACT_ERROR,
    NO_CHANNEL_CHOICE_ERROR,
    maskEmail,
    mergeConsentBaseline,
    mintCommPrefsLinkToken,
    phoneDigits,
    phonesEqual,
    saveCommunicationPreferences,
    signCommPrefsPayload,
    storedGasPrefsFromResult,
    UNSAFE_OMIT_ERROR,
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

function unknownFlags() {
    return { smsOptIn: null, whatsappOptIn: null, telegramOptIn: null, emailOptIn: null };
}

function flagSnapshot(src) {
    return {
        smsOptIn: src && src.smsOptIn === true ? true : (src && src.smsOptIn === false ? false : null),
        whatsappOptIn: src && src.whatsappOptIn === true ? true : (src && src.whatsappOptIn === false ? false : null),
        telegramOptIn: src && src.telegramOptIn === true ? true : (src && src.telegramOptIn === false ? false : null),
        emailOptIn: src && src.emailOptIn === true ? true : (src && src.emailOptIn === false ? false : null)
    };
}

function withBaseline(form, baseline) {
    return Object.assign({}, form, { baseline: baseline || unknownFlags() });
}

function assertOpaqueToken(token, expected) {
    const payload = verifyCommPrefsPayload(token, TEST_SECRET);
    assert.ok(payload);
    const raw = Buffer.from(token.split('.')[0], 'base64url').toString('utf8');
    assert.equal(payload.phone, undefined);
    assert.equal(payload.email, undefined);
    assert.equal(raw.includes('2395550100'), false);
    assert.equal(raw.includes('(239) 555-0100'), false);
    assert.doesNotMatch(raw, /@example\.com/);
    assert.equal(typeof payload.ph, 'string');
    assert.ok(payload.ph.length > 0);
    assert.equal(typeof payload.pr, 'string');
    assert.ok(payload.pr.length > 0);
    if (expected) {
        if (Object.prototype.hasOwnProperty.call(expected, 'contactId')) {
            assert.equal(payload.contactId, expected.contactId);
        }
        if (Object.prototype.hasOwnProperty.call(expected, 'personId')) {
            assert.equal(payload.personId, expected.personId);
        }
        if (expected.channels) assert.deepEqual(payload.channels, expected.channels);
        if (expected.exp) assert.equal(payload.exp, expected.exp);
        if (expected.typ) assert.equal(payload.typ, expected.typ);
        if (expected.phoneDigits) {
            assert.equal(payload.ph, hashPhoneRef(expected.phoneDigits, TEST_SECRET));
        }
    }
    return payload;
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
        queryUsersByContact: async ({ personId, contactId, phone, email }) => {
            if (personId) {
                const byId = store.find((row) => row.personId === personId);
                if (byId) return byId;
            }
            if (contactId) {
                const byContact = store.find((row) =>
                    row.contactId === contactId || row.wixContactId === contactId
                );
                if (byContact) return byContact;
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
        getGasPrefs: async (phone) => {
            if (overrides && typeof overrides.getGasPrefs === 'function') {
                return overrides.getGasPrefs(phone);
            }
            if (overrides && Object.prototype.hasOwnProperty.call(overrides, 'gasPrefs')) {
                return overrides.gasPrefs;
            }
            return { ok: true, prefs: null };
        },
        listUsersByPhone: async (phone) => {
            if (overrides && typeof overrides.listUsersByPhone === 'function') {
                return overrides.listUsersByPhone(phone);
            }
            return store.filter((row) => phonesEqual(row.phone, phone));
        },
        now: () => FIXED_NOW
    };
    return { store, gasCalls, writes, deps };
}

async function mintLink(deps, extra) {
    return mintCommPrefsLinkToken(Object.assign({
        phone: '2395550100',
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
    const result = await saveCommunicationPreferences(withBaseline(allOff()), h.deps);
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
    const result = await saveCommunicationPreferences(withBaseline(baseForm({
        personId: 'attacker-id',
        phone: '(305) 555-9999',
        email: 'attacker@example.com'
    })), h.deps);
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
    const result = await saveCommunicationPreferences(withBaseline(baseForm({
        sessionToken: '',
        phone: '3055559999'
    })), h.deps);
    assert.equal(result.ok, true);
    assert.equal(phoneDigits(h.gasCalls[0].phone), '2395550100');
});

test('GAS failure does not persist and does not report success', async () => {
    const h = harness({ gasResult: { success: false, error: 'GAS returned 500' } });
    const result = await saveCommunicationPreferences(withBaseline(allOff()), h.deps);
    assert.equal(result.ok, false);
    assert.match(result.error, /consent gate/);
    assert.equal(result.lastUpdated, undefined);
    assert.equal(h.gasCalls.length, 1);
    assert.equal(h.writes.updates.length, 0);
    assert.equal(h.writes.inserts.length, 0);
});

test('GAS throw or missing success does not persist', async () => {
    const thrown = harness({ gasThrows: true });
    const r1 = await saveCommunicationPreferences(withBaseline(allOff()), thrown.deps);
    assert.equal(r1.ok, false);
    assert.equal(thrown.writes.inserts.length, 0);

    const empty = harness({ gasResult: undefined });
    const r2 = await saveCommunicationPreferences(withBaseline(allOff()), empty.deps);
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
    const payload = assertOpaqueToken(minted.token, {
        typ: 'commprefs',
        contactId: undefined,
        personId: undefined,
        channels: ['sms'],
        exp: Math.floor(FIXED_NOW.getTime() / 1000) + 3600,
        phoneDigits: '2395550100'
    });
    assert.equal(payload.typ, 'commprefs');
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
    const minted = await mintLink(h.deps, { channels: 'all', personId: 'person-session-1', contactId: '' });
    const loaded = await getCommunicationPreferences({ sessionToken: '', linkToken: minted.token }, h.deps);
    const result = await saveCommunicationPreferences(withBaseline(allOff({
        sessionToken: '',
        linkToken: minted.token,
        phone: '3055559999'
    }), flagSnapshot(loaded.data)), h.deps);
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
    const minted = await mintLink(h.deps, { channels: ['sms'], personId: 'person-session-1', contactId: '' });
    const loadedFlags = { smsOptIn: true, whatsappOptIn: true, telegramOptIn: true, emailOptIn: true };
    const form = baseForm({
        sessionToken: '',
        linkToken: minted.token,
        smsOptIn: false
    });
    delete form.whatsappOptIn;
    delete form.telegramOptIn;
    delete form.emailOptIn;
    const result = await saveCommunicationPreferences(withBaseline(form, loadedFlags), h.deps);
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
    const minted = await mintLink(other.deps, { phone: '3055551111' });
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
    const minted = await mintLink(h.deps, { phone: '3055551111' });
    const result = await saveCommunicationPreferences(allOff({
        linkToken: minted.token
    }), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'auth_required');
    assert.equal(h.gasCalls.length, 0);
});

test('a scoped save fails closed when the GAS consent read fails', async () => {
    const h = harness({
        session: { valid: false },
        gasPrefs: { ok: false, error: 'GAS returned 500' }
    });
    const minted = await mintLink(h.deps, { channels: ['sms'] });
    const result = await saveCommunicationPreferences(baseForm({
        sessionToken: '',
        linkToken: minted.token,
        smsOptIn: false,
        whatsappOptIn: true,
        telegramOptIn: true,
        emailOptIn: true
    }), h.deps);
    assert.equal(result.ok, false);
    assert.match(result.error, /consent from the gate/i);
    assert.equal(h.gasCalls.length, 0);
    assert.equal(h.writes.inserts.length, 0);
    assert.equal(h.writes.updates.length, 0);
});

test('when no CMS row exists, a GAS consent read is preserved for out-of-scope channels', async () => {
    const h = harness({ session: { valid: false } });
    h.deps.getGasPrefs = async (phone) => {
        assert.equal(phoneDigits(phone), '2395550100');
        return {
            found: true,
            smsOptIn: true,
            whatsAppOptIn: false,
            telegramOptIn: true,
            emailOptIn: false
        };
    };
    const minted = await mintLink(h.deps, { channels: ['sms'] });
    const loadedFlags = { smsOptIn: true, whatsappOptIn: false, telegramOptIn: true, emailOptIn: false };
    const form = baseForm({
        sessionToken: '',
        linkToken: minted.token,
        smsOptIn: false
    });
    delete form.whatsappOptIn;
    delete form.telegramOptIn;
    delete form.emailOptIn;
    const result = await saveCommunicationPreferences(withBaseline(form, loadedFlags), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(h.gasCalls[0].whatsappOptIn, false);
    assert.equal(h.gasCalls[0].telegramOptIn, true);
    assert.equal(h.gasCalls[0].emailOptIn, false);
});

test('legacy CMS rows treat missing flags as unknown and use the GAS value', async () => {
    const h = harness({
        session: { valid: false },
        existing: { _id: 'u1', personId: 'person-session-1', phone: '2395550100', firstName: 'Jane', lastName: 'Doe' }
    });
    h.deps.getGasPrefs = async () => ({
        ok: true,
        found: true,
        prefs: { smsOptIn: true, whatsAppOptIn: false, telegramOptIn: true, emailOptIn: false }
    });
    const minted = await mintLink(h.deps, { channels: ['sms'], personId: 'person-session-1', contactId: '' });
    const loaded = await getCommunicationPreferences({ sessionToken: '', linkToken: minted.token }, h.deps);
    assert.equal(loaded.data.smsOptIn, true);
    assert.equal(loaded.data.whatsappOptIn, false);
    assert.equal(loaded.data.telegramOptIn, true);
    assert.equal(loaded.data.emailOptIn, false);
    assert.deepEqual(loaded.data.channels, ['sms']);

    const form = baseForm({
        sessionToken: '',
        linkToken: minted.token,
        smsOptIn: false
    });
    delete form.whatsappOptIn;
    delete form.telegramOptIn;
    delete form.emailOptIn;
    const result = await saveCommunicationPreferences(withBaseline(form, flagSnapshot(loaded.data)), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(h.gasCalls[0].whatsappOptIn, false);
    assert.equal(h.gasCalls[0].telegramOptIn, true);
    assert.equal(h.gasCalls[0].emailOptIn, false);
});

test('out-of-scope channel changes are rejected instead of silently dropped', async () => {
    const h = harness({
        session: { valid: false },
        gasPrefs: {
            ok: true,
            found: true,
            prefs: { smsOptIn: true, whatsappOptIn: true, telegramOptIn: true, emailOptIn: true }
        }
    });
    const minted = await mintLink(h.deps, { channels: ['sms'] });
    const result = await saveCommunicationPreferences(withBaseline(allOff({
        sessionToken: '',
        linkToken: minted.token
    }), { smsOptIn: true, whatsappOptIn: true, telegramOptIn: true, emailOptIn: true }), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'scope_mismatch');
    assert.match(result.error, /only change the communication channel/i);
    assert.equal(h.gasCalls.length, 0);
    assert.equal(h.writes.inserts.length, 0);
});

test('get without a CMS row or GAS read returns unknown channels, not opted in', async () => {
    const h = harness();
    const loaded = await getCommunicationPreferences({ sessionToken: 'session-token' }, h.deps);
    assert.equal(loaded.ok, true);
    assert.equal(loaded.data.phone, '2395550100');
    assert.equal(loaded.data.smsOptIn, null);
    assert.equal(loaded.data.whatsappOptIn, null);
    assert.equal(loaded.data.telegramOptIn, null);
    assert.equal(loaded.data.emailOptIn, null);
    assert.deepEqual(loaded.data.channels, ['sms', 'whatsapp', 'telegram', 'email']);
});

test('get without a CMS row uses a GAS consent read when one is available', async () => {
    const h = harness();
    h.deps.getGasPrefs = async () => ({
        found: true,
        smsOptIn: false,
        whatsAppOptIn: false,
        telegramOptIn: true,
        emailOptIn: false
    });
    const loaded = await getCommunicationPreferences({ sessionToken: 'session-token' }, h.deps);
    assert.equal(loaded.ok, true);
    assert.equal(loaded.data.smsOptIn, false);
    assert.equal(loaded.data.whatsappOptIn, false);
    assert.equal(loaded.data.telegramOptIn, true);
    assert.equal(loaded.data.emailOptIn, false);
});

test('an all-channel save still works when the GAS read returns no stored flags', async () => {
    const h = harness();
    const result = await saveCommunicationPreferences(withBaseline(allOff()), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(h.gasCalls[0].whatsappOptIn, false);
    assert.equal(h.gasCalls[0].telegramOptIn, false);
    assert.equal(h.gasCalls[0].emailOptIn, false);
});

test('stored GAS prefs are trusted only when found is true', () => {
    const missing = storedGasPrefsFromResult({
        ok: true,
        prefs: { smsOptIn: true, whatsAppOptIn: true, telegramOptIn: true, emailOptIn: true }
    });
    assert.equal(missing.smsOptIn, null);
    assert.equal(missing.whatsappOptIn, null);
    assert.equal(missing.telegramOptIn, null);
    assert.equal(missing.emailOptIn, null);

    const legacyFailOpen = storedGasPrefsFromResult({
        smsOptIn: true,
        whatsAppOptIn: true,
        telegramOptIn: true,
        emailOptIn: true
    });
    assert.equal(legacyFailOpen.smsOptIn, null);
    assert.equal(legacyFailOpen.emailOptIn, null);

    const notFound = storedGasPrefsFromResult({
        ok: true,
        found: false,
        prefs: { smsOptIn: true, whatsAppOptIn: true, telegramOptIn: true, emailOptIn: true }
    });
    assert.equal(notFound.smsOptIn, null);
    assert.equal(notFound.whatsappOptIn, null);

    const stored = storedGasPrefsFromResult({
        ok: true,
        found: true,
        prefs: { smsOptIn: false, whatsAppOptIn: true, telegramOptIn: false, emailOptIn: true }
    });
    assert.equal(stored.smsOptIn, false);
    assert.equal(stored.whatsappOptIn, true);
    assert.equal(stored.telegramOptIn, false);
    assert.equal(stored.emailOptIn, true);
});

test('a GAS read without found is treated as unknown, not opted in', async () => {
    const h = harness();
    h.deps.getGasPrefs = async () => ({
        ok: true,
        prefs: { smsOptIn: true, whatsAppOptIn: true, telegramOptIn: true, emailOptIn: true }
    });
    const loaded = await getCommunicationPreferences({ sessionToken: 'session-token' }, h.deps);
    assert.equal(loaded.ok, true);
    assert.equal(loaded.data.smsOptIn, null);
    assert.equal(loaded.data.whatsappOptIn, null);
    assert.equal(loaded.data.telegramOptIn, null);
    assert.equal(loaded.data.emailOptIn, null);
});

test('a single-channel link can opt out with no existing row', async () => {
    const h = harness({
        session: { valid: false },
        gasPrefs: {
            ok: true,
            found: false,
            preservesOmitted: true,
            prefs: { smsOptIn: true, whatsAppOptIn: true, telegramOptIn: true, emailOptIn: true }
        }
    });
    const minted = await mintLink(h.deps, { channels: ['sms'] });
    const form = baseForm({
        sessionToken: '',
        linkToken: minted.token,
        smsOptIn: false
    });
    delete form.whatsappOptIn;
    delete form.telegramOptIn;
    delete form.emailOptIn;
    const result = await saveCommunicationPreferences(withBaseline(form), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(Object.prototype.hasOwnProperty.call(h.gasCalls[0], 'whatsappOptIn'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(h.gasCalls[0], 'telegramOptIn'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(h.gasCalls[0], 'emailOptIn'), false);
    // Phone-only link (no verified id): update GAS, do not insert CMS.
    assert.equal(h.writes.inserts.length, 0);
    assert.equal(h.writes.updates.length, 0);

    // Out-of-scope falses from a legacy form are ignored when the baseline is unknown.
    const dirty = harness({
        session: { valid: false },
        gasPrefs: { ok: true, found: false, preservesOmitted: true, prefs: null }
    });
    const mintedDirty = await mintLink(dirty.deps, { channels: ['sms'] });
    const dirtyResult = await saveCommunicationPreferences(withBaseline(baseForm({
        sessionToken: '',
        linkToken: mintedDirty.token,
        smsOptIn: false,
        whatsappOptIn: false,
        telegramOptIn: false,
        emailOptIn: false
    })), dirty.deps);
    assert.equal(dirtyResult.ok, true);
    assert.equal(dirty.gasCalls[0].smsOptIn, false);
    assert.equal(Object.prototype.hasOwnProperty.call(dirty.gasCalls[0], 'whatsappOptIn'), false);
    assert.equal(dirty.writes.inserts.length, 0);
    assert.equal(dirty.writes.updates.length, 0);
});

test('mint requires a resolvable phone and does not issue a token without one', async () => {
    const empty = harness({ session: { valid: false } });
    const noPhone = await mintCommPrefsLinkToken({
        email: 'lead@example.com',
        channels: 'all'
    }, empty.deps);
    assert.equal(noPhone.ok, false);
    assert.match(noPhone.error, /resolvable phone/i);
    assert.equal(noPhone.token, undefined);

    const withRow = harness({
        session: { valid: false },
        existing: { personId: 'person-row-1', phone: '(239) 555-0100', email: 'lead@example.com' }
    });
    const minted = await mintCommPrefsLinkToken({
        personId: 'person-row-1',
        email: 'lead@example.com',
        channels: ['sms']
    }, withRow.deps);
    assert.equal(minted.ok, true);
    assert.ok(minted.token);
    assertOpaqueToken(minted.token, {
        contactId: undefined,
        personId: 'person-row-1',
        phoneDigits: '2395550100'
    });
});

test('mint by contactId queries contact-id fields and does not treat them as personId', async () => {
    const byContact = harness({
        session: { valid: false },
        existing: {
            personId: 'person-row-1',
            contactId: 'wix-contact-abc',
            phone: '(239) 555-0100'
        }
    });
    const minted = await mintCommPrefsLinkToken({
        contactId: 'wix-contact-abc',
        channels: ['sms']
    }, byContact.deps);
    assert.equal(minted.ok, true);
    assert.ok(minted.token);
    const payload = assertOpaqueToken(minted.token, {
        contactId: 'wix-contact-abc',
        personId: 'person-row-1',
        phoneDigits: '2395550100'
    });

    const byWixField = harness({
        session: { valid: false },
        existing: {
            personId: 'person-row-2',
            wixContactId: 'wix-contact-def',
            phone: '(239) 555-0100'
        }
    });
    const mintedWix = await mintCommPrefsLinkToken({
        contactId: 'wix-contact-def',
        channels: ['sms']
    }, byWixField.deps);
    assert.equal(mintedWix.ok, true);
    const payloadWix = assertOpaqueToken(mintedWix.token, {
        contactId: 'wix-contact-def',
        personId: 'person-row-2',
        phoneDigits: '2395550100'
    });

    // A portal personId that happens to equal the requested contactId is not a match.
    const personOnly = harness({
        session: { valid: false },
        existing: { personId: 'wix-contact-abc', phone: '(239) 555-0100' }
    });
    const missed = await mintCommPrefsLinkToken({
        contactId: 'wix-contact-abc',
        channels: ['sms']
    }, personOnly.deps);
    assert.equal(missed.ok, false);
    assert.equal(missed.error, MINT_UNRESOLVED_CONTACT_ERROR);
    assert.equal(missed.code, 'unresolved_contact');
    assert.equal(missed.token, undefined);

    const byPersonId = harness({
        session: { valid: false },
        existing: { personId: 'person-row-1', phone: '(239) 555-0100' }
    });
    const mintedPerson = await mintCommPrefsLinkToken({
        personId: 'person-row-1',
        channels: ['sms']
    }, byPersonId.deps);
    assert.equal(mintedPerson.ok, true);
    const payloadPerson = assertOpaqueToken(mintedPerson.token, {
        personId: 'person-row-1',
        contactId: undefined,
        phoneDigits: '2395550100'
    });
});

test('signed link tokens keep contactId and personId in separate namespaces', async () => {
    const both = harness({
        session: { valid: false },
        existing: {
            personId: 'person-row-1',
            contactId: 'wix-contact-abc',
            phone: '2395550100'
        }
    });
    const mintedBoth = await mintCommPrefsLinkToken({
        contactId: 'wix-contact-abc',
        personId: 'person-row-1',
        phone: '2395550100',
        channels: ['sms']
    }, both.deps);
    assert.equal(mintedBoth.ok, true);
    const payloadBoth = assertOpaqueToken(mintedBoth.token, {
        contactId: 'wix-contact-abc',
        personId: 'person-row-1',
        phoneDigits: '2395550100'
    });

    // A row whose personId equals the requested contactId is not a match,
    // even when a phone is supplied. Mint fails rather than signing the
    // unverified contactId.
    const conflict = harness({
        session: { valid: false },
        existing: { _id: 'u1', personId: 'wix-contact-abc', phone: '3055551111', smsOptIn: true },
        gasPrefs: { ok: true, found: false, preservesOmitted: true, prefs: null }
    });
    const minted = await mintCommPrefsLinkToken({
        contactId: 'wix-contact-abc',
        phone: '2395550100',
        channels: ['sms']
    }, conflict.deps);
    assert.equal(minted.ok, false);
    assert.equal(minted.error, MINT_UNRESOLVED_CONTACT_ERROR);
    assert.equal(minted.code, 'unresolved_contact');
    assert.equal(minted.token, undefined);
    assert.equal(payloadBoth.contactId, 'wix-contact-abc');
    assert.equal(payloadBoth.personId, 'person-row-1');
});

test('a client-entered email is saved only when the server has no email', async () => {
    const withEmail = harness();
    const ignored = await saveCommunicationPreferences(withBaseline(allOff({ email: 'other@example.com' })), withEmail.deps);
    assert.equal(ignored.ok, true);
    assert.equal(withEmail.gasCalls[0].email, 'jane@example.com');
    assert.equal(withEmail.writes.inserts[0].email, 'jane@example.com');

    const noEmail = harness({
        session: { valid: true, personId: 'person-session-1', phone: '2395550100', email: '' }
    });
    const saved = await saveCommunicationPreferences(withBaseline(allOff({ email: 'new@example.com' })), noEmail.deps);
    assert.equal(saved.ok, true);
    assert.equal(noEmail.gasCalls[0].email, 'new@example.com');
    assert.equal(noEmail.writes.inserts[0].email, 'new@example.com');
    assert.equal(saved.email, maskEmail('new@example.com'));
    assert.equal(saved.email, 'ne•••@example.com');
    assert.equal(saved.emailLocked, true);
    assert.equal(String(saved.email).includes('new@'), false);

    assert.equal(ignored.email, maskEmail('jane@example.com'));
    assert.equal(ignored.emailLocked, true);
});

test('mint fails when a supplied contactId or personId cannot be verified', async () => {
    const h = harness({
        session: { valid: false },
        existing: { _id: 'u1', personId: 'person-row-1', phone: '2395550100' }
    });
    const missing = await mintCommPrefsLinkToken({
        personId: 'person-missing',
        phone: '2395550100',
        channels: ['sms']
    }, h.deps);
    assert.equal(missing.ok, false);
    assert.equal(missing.error, MINT_UNRESOLVED_CONTACT_ERROR);
    assert.equal(missing.code, 'unresolved_contact');
    assert.equal(missing.token, undefined);

    const lookupFails = harness({
        session: { valid: false },
        existing: { personId: 'person-row-1', phone: '2395550100' }
    });
    lookupFails.deps.queryUsersByContact = async () => {
        throw new Error('CMS timeout');
    };
    const failed = await mintCommPrefsLinkToken({
        personId: 'person-row-1',
        phone: '2395550100',
        channels: ['sms']
    }, lookupFails.deps);
    assert.equal(failed.ok, false);
    assert.equal(failed.error, MINT_UNRESOLVED_CONTACT_ERROR);
    assert.equal(failed.code, 'unresolved_contact');
    assert.equal(failed.token, undefined);

    // One supplied id unresolved, the other resolved: still fail, do not
    // sign the unverified id.
    const partial = harness({
        session: { valid: false },
        existing: { personId: 'person-row-1', contactId: 'contact-row-1', phone: '2395550100' }
    });
    const half = await mintCommPrefsLinkToken({
        personId: 'person-row-1',
        contactId: 'contact-missing',
        phone: '2395550100',
        channels: ['sms']
    }, partial.deps);
    assert.equal(half.ok, false);
    assert.equal(half.error, MINT_UNRESOLVED_CONTACT_ERROR);
    assert.equal(half.token, undefined);
});

test('redeem rejects a phone hash that does not match the resolved row', async () => {
    const h = harness({
        session: { valid: false },
        existing: {
            _id: 'u1',
            personId: 'person-row-1',
            contactId: 'wix-contact-abc',
            phone: '2395550100',
            firstName: 'Jane',
            email: 'jane@example.com'
        }
    });
    const exp = Math.floor(FIXED_NOW.getTime() / 1000) + 3600;
    const mismatched = signCommPrefsPayload({
        typ: 'commprefs',
        contactId: 'wix-contact-abc',
        personId: 'person-row-1',
        ph: hashPhoneRef('3055551111', TEST_SECRET),
        channels: ['sms'],
        exp
    }, TEST_SECRET);
    const loaded = await getCommunicationPreferences({
        sessionToken: '',
        linkToken: mismatched
    }, h.deps);
    assert.equal(loaded.ok, false);
    assert.equal(loaded.code, 'auth_required');
    assert.equal(loaded.data, undefined);

    const saved = await saveCommunicationPreferences(withBaseline(allOff({
        sessionToken: '',
        linkToken: mismatched
    })), h.deps);
    assert.equal(saved.ok, false);
    assert.equal(saved.code, 'auth_required');
    assert.equal(h.gasCalls.length, 0);
    assert.equal(h.writes.updates.length, 0);

    const minted = await mintCommPrefsLinkToken({
        personId: 'person-row-1',
        contactId: 'wix-contact-abc',
        phone: '2395550100',
        channels: ['sms']
    }, h.deps);
    assert.equal(minted.ok, true);
    const okLoaded = await getCommunicationPreferences({
        sessionToken: '',
        linkToken: minted.token
    }, h.deps);
    assert.equal(okLoaded.ok, true);
    assert.equal(okLoaded.data.firstName, 'Jane');
    assert.equal(phoneDigits(okLoaded.data.phone), '2395550100');
});



test('mint rejects a supplied phone that does not belong to the referenced contact', async () => {
    const byPerson = harness({
        session: { valid: false },
        existing: { personId: 'person-row-1', phone: '(239) 555-0100' }
    });
    const mismatch = await mintCommPrefsLinkToken({
        personId: 'person-row-1',
        phone: '3055551111',
        channels: ['sms']
    }, byPerson.deps);
    assert.equal(mismatch.ok, false);
    assert.equal(mismatch.error, MINT_MISMATCH_ERROR);
    assert.equal(mismatch.token, undefined);

    const byContact = harness({
        session: { valid: false },
        existing: { contactId: 'wix-contact-abc', phone: '(239) 555-0100' }
    });
    const mismatchContact = await mintCommPrefsLinkToken({
        contactId: 'wix-contact-abc',
        phone: '3055551111',
        channels: ['sms']
    }, byContact.deps);
    assert.equal(mismatchContact.ok, false);
    assert.equal(mismatchContact.error, MINT_MISMATCH_ERROR);

    const phoneOwnedByOther = harness({
        session: { valid: false },
        existing: { _id: 'u1', personId: 'person-row-1', phone: '(239) 555-0100', firstName: 'Other' }
    });
    // person-other does not resolve, so mint fails closed. A supplied
    // phone must not sign the unverified id or bind person-row-1.
    const unresolved = await mintCommPrefsLinkToken({
        personId: 'person-other',
        phone: '2395550100',
        channels: ['sms']
    }, phoneOwnedByOther.deps);
    assert.equal(unresolved.ok, false);
    assert.equal(unresolved.error, MINT_UNRESOLVED_CONTACT_ERROR);
    assert.equal(unresolved.code, 'unresolved_contact');
    assert.equal(unresolved.token, undefined);

    const matching = await mintCommPrefsLinkToken({
        personId: 'person-row-1',
        phone: '2395550100',
        channels: ['sms']
    }, byPerson.deps);
    assert.equal(matching.ok, true);
    assertOpaqueToken(matching.token, {
        personId: 'person-row-1',
        phoneDigits: '2395550100'
    });
});

test('when GAS has no row, CMS flags are not shown and CMS opt-outs are written on the next save', async () => {
    const h = harness({
        existing: {
            _id: 'u1',
            personId: 'person-session-1',
            phone: '2395550100',
            smsOptIn: false,
            emailOptIn: true
        },
        gasPrefs: { ok: true, found: false, preservesOmitted: true, prefs: null }
    });
    const loaded = await getCommunicationPreferences({ sessionToken: 'session-token' }, h.deps);
    assert.equal(loaded.ok, true);
    assert.equal(loaded.data.smsOptIn, null);
    assert.equal(loaded.data.whatsappOptIn, null);
    assert.equal(loaded.data.telegramOptIn, null);
    assert.equal(loaded.data.emailOptIn, null);

    const merged = mergeConsentBaseline(null, h.store[0], false);
    assert.equal(merged.smsOptIn, null);
    assert.equal(merged.emailOptIn, null);

    // Change a different channel. The CMS-only SMS opt-out is carried as
    // an explicit false; a CMS-only opt-in is not carried or displayed.
    const form = baseForm({
        telegramOptIn: true
    });
    delete form.smsOptIn;
    delete form.whatsappOptIn;
    delete form.emailOptIn;
    const result = await saveCommunicationPreferences(withBaseline(form, flagSnapshot(loaded.data)), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls[0].telegramOptIn, true);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(Object.prototype.hasOwnProperty.call(h.gasCalls[0], 'emailOptIn'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(h.gasCalls[0], 'whatsappOptIn'), false);
    assert.equal(result.prefs.smsOptIn, false);
    assert.equal(result.prefs.telegramOptIn, true);
    assert.equal(result.prefs.emailOptIn, null);
    assert.equal(h.writes.updates[0].smsOptIn, false);
});

test('legacy GAS reads without found still use explicit CMS flags', async () => {
    const h = harness({
        existing: {
            _id: 'u1',
            personId: 'person-session-1',
            phone: '2395550100',
            smsOptIn: false
        }
    });
    const loaded = await getCommunicationPreferences({ sessionToken: 'session-token' }, h.deps);
    assert.equal(loaded.ok, true);
    assert.equal(loaded.data.smsOptIn, false);
    assert.equal(loaded.data.emailOptIn, null);
    const merged = mergeConsentBaseline(null, h.store[0]);
    assert.equal(merged.smsOptIn, false);
});

test('mint rejects personId and contactId that resolve to different Portal Users, even with a shared phone', async () => {
    const h = harness({
        session: { valid: false },
        existing: {
            _id: 'u1',
            personId: 'person-a',
            contactId: 'contact-a',
            phone: '2395550100'
        }
    });
    h.store.push({
        _id: 'u2',
        personId: 'person-b',
        contactId: 'contact-b',
        phone: '2395550100'
    });
    const mismatch = await mintCommPrefsLinkToken({
        personId: 'person-a',
        contactId: 'contact-b',
        channels: ['sms']
    }, h.deps);
    assert.equal(mismatch.ok, false);
    assert.equal(mismatch.error, MINT_MISMATCH_ERROR);
    assert.equal(mismatch.token, undefined);

    const same = await mintCommPrefsLinkToken({
        personId: 'person-a',
        contactId: 'contact-a',
        channels: ['sms']
    }, h.deps);
    assert.equal(same.ok, true);
    assertOpaqueToken(same.token, {
        personId: 'person-a',
        contactId: 'contact-a',
        phoneDigits: '2395550100'
    });
});

test('a phone-only mint rejects an ambiguous shared phone and binds a unique or missing row', async () => {
    const shared = harness({
        session: { valid: false },
        existing: {
            _id: 'u1',
            personId: 'person-a',
            contactId: 'contact-a',
            phone: '2395550100',
            firstName: 'Ada',
            lastName: 'A',
            email: 'ada@example.com'
        }
    });
    shared.store.push({
        _id: 'u2',
        personId: 'person-b',
        contactId: 'contact-b',
        phone: '2395550100',
        firstName: 'Bea',
        lastName: 'B',
        email: 'bea@example.com'
    });
    const ambiguous = await mintCommPrefsLinkToken({
        phone: '2395550100',
        channels: ['sms']
    }, shared.deps);
    assert.equal(ambiguous.ok, false);
    assert.equal(ambiguous.error, MINT_AMBIGUOUS_CONTACT_ERROR);
    assert.equal(ambiguous.code, 'ambiguous_contact');
    assert.equal(ambiguous.token, undefined);

    const unique = harness({
        session: { valid: false },
        existing: {
            _id: 'u1',
            personId: 'person-a',
            contactId: 'contact-a',
            phone: '2395550100',
            firstName: 'Ada',
            email: 'ada@example.com'
        }
    });
    const mintedUnique = await mintCommPrefsLinkToken({
        phone: '2395550100',
        channels: ['sms']
    }, unique.deps);
    assert.equal(mintedUnique.ok, true);
    assertOpaqueToken(mintedUnique.token, {
        personId: 'person-a',
        contactId: 'contact-a',
        phoneDigits: '2395550100'
    });

    const none = harness({
        session: { valid: false },
        gasPrefs: { ok: true, found: false, preservesOmitted: true, prefs: null }
    });
    const mintedNone = await mintCommPrefsLinkToken({
        phone: '2395550100',
        channels: ['sms']
    }, none.deps);
    assert.equal(mintedNone.ok, true);
    const payload = assertOpaqueToken(mintedNone.token, {
        personId: undefined,
        contactId: undefined,
        phoneDigits: '2395550100'
    });
    assert.equal(payload.personId, undefined);
    assert.equal(payload.contactId, undefined);

    const loaded = await getCommunicationPreferences({
        sessionToken: '',
        linkToken: mintedNone.token
    }, none.deps);
    assert.equal(loaded.ok, true);
    assert.equal(loaded.data.phone, '2395550100');
    assert.equal(loaded.data.firstName, '');
    assert.equal(loaded.data.lastName, '');
    assert.equal(loaded.data.email, '');
    assert.equal(loaded.data.caseNumber, '');
    assert.equal(loaded.data.smsOptIn, null);

    // A later household CMS row must not be bound or written.
    none.store.push({
        _id: 'u-late',
        personId: 'person-late',
        firstName: 'Late',
        lastName: 'Row',
        email: 'late@example.com',
        caseNumber: '240009999',
        phone: '2395550100',
        smsOptIn: true
    });
    const loadedLate = await getCommunicationPreferences({
        sessionToken: '',
        linkToken: mintedNone.token
    }, none.deps);
    assert.equal(loadedLate.data.firstName, '');
    assert.equal(loadedLate.data.email, '');
    assert.equal(loadedLate.data.smsOptIn, null);

    const form = baseForm({
        sessionToken: '',
        linkToken: mintedNone.token,
        smsOptIn: false
    });
    delete form.whatsappOptIn;
    delete form.telegramOptIn;
    delete form.emailOptIn;
    const saved = await saveCommunicationPreferences(withBaseline(form, flagSnapshot(loaded.data)), none.deps);
    assert.equal(saved.ok, true);
    assert.equal(none.gasCalls[0].smsOptIn, false);
    assert.equal(none.writes.inserts.length, 0);
    assert.equal(none.writes.updates.length, 0);
    assert.equal(none.store[0].smsOptIn, true);
    assert.equal(none.store[0].personId, 'person-late');
});

test('minting with a contact id does not use a first-match phone query', async () => {
    const h = harness({
        session: { valid: false },
        existing: {
            _id: 'u-other',
            personId: 'person-other',
            contactId: 'contact-other',
            phone: '2395550100',
            firstName: 'Other',
            email: 'other@example.com'
        }
    });
    h.store.push({
        _id: 'u-intended',
        personId: 'person-intended',
        contactId: 'contact-intended',
        phone: '2395550100',
        firstName: 'Intended',
        email: 'intended@example.com'
    });
    // queryUsersByContact by phone would return u-other (first). The
    // identifier path must still bind the intended row.
    const minted = await mintCommPrefsLinkToken({
        personId: 'person-intended',
        phone: '2395550100',
        channels: ['sms']
    }, h.deps);
    assert.equal(minted.ok, true);
    assertOpaqueToken(minted.token, {
        personId: 'person-intended',
        contactId: 'contact-intended',
        phoneDigits: '2395550100'
    });

    const byContact = await mintCommPrefsLinkToken({
        contactId: 'contact-intended',
        phone: '(239) 555-0100',
        channels: ['sms']
    }, h.deps);
    assert.equal(byContact.ok, true);
    assertOpaqueToken(byContact.token, {
        personId: 'person-intended',
        contactId: 'contact-intended',
        phoneDigits: '2395550100'
    });
});

test('a scoped save with unknown channels is blocked until GAS preserves omitted flags', async () => {
    const h = harness({
        session: { valid: false },
        gasPrefs: { ok: true, found: false, prefs: null }
    });
    const minted = await mintLink(h.deps, { channels: ['sms'] });
    const form = baseForm({
        sessionToken: '',
        linkToken: minted.token,
        smsOptIn: false
    });
    delete form.whatsappOptIn;
    delete form.telegramOptIn;
    delete form.emailOptIn;
    const result = await saveCommunicationPreferences(withBaseline(form), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'unsafe_omit');
    assert.equal(result.error, UNSAFE_OMIT_ERROR);
    assert.match(result.error, /\(239\) 332-2245/);
    assert.equal(h.gasCalls.length, 0);
    assert.equal(h.writes.inserts.length, 0);
});

test('when GAS advertises preservesOmitted, a scoped save omits unchanged channels', async () => {
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
        },
        gasPrefs: {
            ok: true,
            found: true,
            preservesOmitted: true,
            prefs: { smsOptIn: true, whatsappOptIn: true, telegramOptIn: true, emailOptIn: true }
        }
    });
    const minted = await mintLink(h.deps, { channels: ['sms'], personId: 'person-session-1', contactId: '' });
    const form = baseForm({
        sessionToken: '',
        linkToken: minted.token,
        smsOptIn: false
    });
    delete form.whatsappOptIn;
    delete form.telegramOptIn;
    delete form.emailOptIn;
    const result = await saveCommunicationPreferences(withBaseline(form, {
        smsOptIn: true, whatsappOptIn: true, telegramOptIn: true, emailOptIn: true
    }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(Object.prototype.hasOwnProperty.call(h.gasCalls[0], 'whatsappOptIn'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(h.gasCalls[0], 'telegramOptIn'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(h.gasCalls[0], 'emailOptIn'), false);
    assert.equal(result.prefs.smsOptIn, false);
    assert.equal(result.prefs.whatsappOptIn, true);
    assert.equal(result.prefs.telegramOptIn, true);
    assert.equal(result.prefs.emailOptIn, true);
});

test('get fails closed when the GAS consent read fails', async () => {
    const h = harness({
        existing: {
            personId: 'person-session-1',
            phone: '2395550100',
            smsOptIn: true,
            whatsappOptIn: true,
            telegramOptIn: true,
            emailOptIn: true
        },
        gasPrefs: { ok: false, error: 'GAS returned 500' }
    });
    const loaded = await getCommunicationPreferences({ sessionToken: 'session-token' }, h.deps);
    assert.equal(loaded.ok, false);
    assert.equal(loaded.code, 'load_failed');
    assert.equal(loaded.error, LOAD_ERROR);
    assert.match(loaded.error, /couldn't load your preferences/i);
    assert.match(loaded.error, /\(239\) 332-2245/);
    assert.equal(loaded.data, undefined);
});

test('save returns a conflict when the fresh GAS read differs from the loaded baseline', async () => {
    let reads = 0;
    const h = harness();
    h.deps.getGasPrefs = async () => {
        reads += 1;
        if (reads === 1) {
            return {
                ok: true,
                found: true,
                prefs: { smsOptIn: true, whatsappOptIn: true, telegramOptIn: true, emailOptIn: true }
            };
        }
        return {
            ok: true,
            found: true,
            prefs: { smsOptIn: false, whatsappOptIn: true, telegramOptIn: true, emailOptIn: true }
        };
    };
    const loaded = await getCommunicationPreferences({ sessionToken: 'session-token' }, h.deps);
    assert.equal(loaded.ok, true);
    assert.equal(loaded.data.smsOptIn, true);
    const result = await saveCommunicationPreferences(withBaseline(baseForm({
        smsOptIn: false
    }), flagSnapshot(loaded.data)), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'conflict');
    assert.equal(result.error, CONFLICT_ERROR);
    assert.match(result.error, /reload/i);
    assert.equal(h.gasCalls.length, 0);
    assert.equal(h.writes.inserts.length, 0);
    assert.equal(h.writes.updates.length, 0);
});

test('post_commPrefsLink is an internal GAS_API_KEY mint path and does not send messages', () => {
    const http = fs.readFileSync(path.join(root, 'src/backend/http-functions.js'), 'utf8');
    assert.match(http, /export async function post_commPrefsLink/);
    assert.match(http, /POST \/_functions\/commPrefsLink/);
    assert.doesNotMatch(http, /POST \/_functions\/post_commPrefsLink/);
    assert.match(http, /mintCommunicationPreferencesLink/);
    const fn = http.slice(http.indexOf('export async function post_commPrefsLink'));
    assert.match(fn, /requireAuth\(request, body && body\.apiKey\)/);
    assert.match(http, /authenticateGasRequest/);
    assert.doesNotMatch(fn, /twilio|sendSms|sendMagicLink|MailApp|fetch\(/i);
    assert.doesNotMatch(fn, /TELEGRAM_BOT_TOKEN|TWILIO_/);
    const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
    assert.match(changelog, /POST \/_functions\/commPrefsLink/);
    assert.doesNotMatch(changelog, /POST \/_functions\/post_commPrefsLink/);
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
    assert.match(page, /data\.smsOptIn === true \? true/);
    assert.match(page, /channels:\s*Array\.isArray\(data\.channels\)/);
    assert.match(page, /phoneLocked:\s*Boolean\(data\.phone\)/);
    assert.match(page, /emailLocked:\s*Boolean\(data\.email\)/);
    assert.match(page, /loadedEmail = result\.email/);
    assert.match(page, /successData\.emailLocked = result\.emailLocked === true/);
    assert.match(page, /delete payload\.phone/);
    assert.match(page, /if \(loadedEmail\) delete payload\.email/);
    assert.match(page, /type: 'loadError'/);
    assert.match(page, /couldn't load your preferences/);
    assert.match(page, /\(239\) 332-2245/);
    assert.match(page, /onlyChangedFlags/);
    assert.match(page, /payload\.baseline = loadedBaseline/);
    assert.match(page, /mergeExplicitFlags/);
    assert.match(page, /showLoadError/);
    assert.equal(page.includes('data.smsOptIn !== false'), false);
    assert.equal(page.includes('hasSession || hasLink'), false);
    assert.equal(page.includes('the form still works for anonymous users'), false);
});

test('gasFoundMarker keeps a missing found marker undefined', () => {
    assert.equal(gasFoundMarker({ ok: true, found: true }), true);
    assert.equal(gasFoundMarker({ ok: true, found: false }), false);
    assert.equal(gasFoundMarker({ ok: true, prefs: null }), undefined);
    assert.equal(gasFoundMarker({ found: 'yes' }), undefined);
    assert.equal(gasFoundMarker(null), undefined);
});

test('a one-toggle save on legacy GAS resends known baseline flags', async () => {
    const h = harness({
        existing: {
            _id: 'u1',
            personId: 'person-session-1',
            phone: '2395550100',
            smsOptIn: true,
            whatsappOptIn: true,
            telegramOptIn: true,
            emailOptIn: true
        },
        gasPrefs: { ok: true, prefs: null }
    });
    const form = baseForm({ smsOptIn: false });
    delete form.whatsappOptIn;
    delete form.telegramOptIn;
    delete form.emailOptIn;
    const result = await saveCommunicationPreferences(withBaseline(form, {
        smsOptIn: true, whatsappOptIn: true, telegramOptIn: true, emailOptIn: true
    }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.gasCalls.length, 1);
    assert.equal(h.gasCalls[0].smsOptIn, false);
    assert.equal(h.gasCalls[0].whatsappOptIn, true);
    assert.equal(h.gasCalls[0].telegramOptIn, true);
    assert.equal(h.gasCalls[0].emailOptIn, true);
});

test('a one-toggle save on legacy GAS is blocked when other channels are unknown', async () => {
    const h = harness({
        gasPrefs: { ok: true, prefs: null }
    });
    const form = baseForm({ smsOptIn: false });
    delete form.whatsappOptIn;
    delete form.telegramOptIn;
    delete form.emailOptIn;
    const result = await saveCommunicationPreferences(withBaseline(form), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'unsafe_omit');
    assert.equal(result.error, UNSAFE_OMIT_ERROR);
    assert.equal(h.gasCalls.length, 0);
    assert.equal(h.writes.inserts.length, 0);
});

test('a save with no explicit channel choice is rejected and does not write GAS', async () => {
    const h = harness({
        existing: {
            _id: 'u1',
            personId: 'person-session-1',
            phone: '2395550100',
            firstName: 'Jane',
            lastName: 'Doe'
        }
    });
    const form = baseForm();
    delete form.smsOptIn;
    delete form.whatsappOptIn;
    delete form.telegramOptIn;
    delete form.emailOptIn;
    const result = await saveCommunicationPreferences(withBaseline(form), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.error, NO_CHANNEL_CHOICE_ERROR);
    assert.equal(result.code, 'no_channel_choice');
    assert.equal(h.gasCalls.length, 0);
    assert.equal(h.writes.updates.length, 0);
    assert.equal(h.writes.inserts.length, 0);
});

test('HTML copies stay identical and surface the signed-link message', () => {
    const a = fs.readFileSync(path.join(root, 'netlify-embeds/communication-preferences.html'), 'utf8');
    const b = fs.readFileSync(path.join(root, 'src/custom-embeds/communication-preferences-embed.html'), 'utf8');
    assert.equal(a, b);
    assert.match(a, /id="authNotice"/);
    assert.match(a, /authRequired/);
    assert.match(a, /linkTokenFromUrl/);
    assert.match(a, /isAllowedOrigin/);
    assert.match(a, /ALLOWED_PARENT_ORIGINS/);
    assert.match(a, /'https:\/\/www\.shamrockbailbonds\.biz'/);
    assert.match(a, /'https:\/\/shamrockbailbonds\.biz'/);
    assert.match(a, /'https:\/\/www-shamrockbailbonds-biz\.filesusr\.com'/);
    assert.match(a, /'https:\/\/shamrockbailbonds-biz\.filesusr\.com'/);
    assert.match(a, /'https:\/\/shamrock2245\.wixsite\.com'/);
    assert.match(a, /'https:\/\/shamrock2245-wixsite-com\.filesusr\.com'/);
    assert.match(a, /'https:\/\/editor\.wix\.com'/);
    assert.doesNotMatch(a, /wixsite\\\.com\|wix\\\.com\|filesusr\\\.com/);
    assert.doesNotMatch(a, /\*\.wixsite/);
    assert.match(a, /id="loadNotice"/);
    assert.match(a, /case 'loadError':/);
    assert.match(a, /setFormLocked\(true\)/);
    assert.match(a, /couldn't load your preferences/);
    assert.match(a, /if \(toggle\.indeterminate \|\| loaded === current\) return/);
    assert.match(a, /baseline:/);
    assert.match(a, /not-set-note/);
    assert.match(a, /Not set/);
    assert.match(a, /toggle\.indeterminate = unknown && inScope/);
    assert.match(a, /consent-card\.unset/);
    assert.match(a, /toggle\.checked = knownOn/);
    assert.match(a, /consent-card\.locked/);
    assert.match(a, /scope-note/);
    assert.match(a, /This link can only change the channel it was sent for/);
    assert.match(a, /toggle\.disabled = formLocked \|\| !inScope/);
    assert.match(a, /if \(!toggle \|\| toggle\.disabled \|\| !inScope\) return/);
    assert.match(a, /data\[key\] = current/);
    assert.match(a, /hasExplicitChannelChoice/);
    assert.match(a, /updateSaveEnabled/);
    assert.match(a, /Choose at least one option before saving/);
    assert.match(a, /btn\.disabled = formLocked \|\| !hasExplicitChannelChoice\(getFormData\(\)\)/);
    assert.match(a, /let formScope = ALL_CHANNELS\.slice\(\)/);
    assert.match(a, /phoneInput\.readOnly = true/);
    assert.match(a, /To change this number, call \(239\) 332-2245/);
    assert.match(a, /id="phoneNote"/);
    assert.match(a, /lockedPhone \|\| document\.getElementById\('phone'\)\.value\.trim\(\)/);
    assert.match(a, /•••-•••-/);
    assert.match(a, /emailInput\.readOnly = true/);
    assert.match(a, /id="emailNote"/);
    assert.match(a, /To change this email, call \(239\) 332-2245/);
    assert.match(a, /lockedEmail \|\| document\.getElementById\('email'\)\.value\.trim\(\)/);
    assert.match(a, /•••@/);
    assert.equal(a.includes("toggle.checked = data[key] !== false"), false);
    assert.equal(a.includes('id="toggleSms" checked'), false);
    assert.equal(a.includes('id="toggleWhatsapp" checked'), false);
    assert.equal(a.includes('id="toggleEmail" checked'), false);
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
    assert.match(jsw, /if \(prefs\[key\] === true \|\| prefs\[key\] === false\) gasBody\[key\] = prefs\[key\] === true/);
    assert.match(jsw, /interpretGasCommPrefsResult/);
    assert.match(jsw, /getGasWebAppUrl/);
    assert.match(jsw, /COMM_PREFS_LINK_SECRET/);
    assert.match(jsw, /mintCommunicationPreferencesLink/);
    assert.match(jsw, /getCommPrefsFromGas/);
    assert.match(jsw, /action:\s*'getCommPreferences'/);
    assert.match(jsw, /getGasPrefs:\s*getCommPrefsFromGas/);
    assert.match(jsw, /gasFoundMarker\(/);
    assert.doesNotMatch(jsw, /const found = !!\(body && body\.found === true\)/);
    assert.match(jsw, /body\.preservesOmitted === true/);
    assert.match(jsw, /queryUsersByContact:\s*async \(\{ personId, contactId, phone, email \}\)/);
    assert.match(jsw, /listUsersByPhone:\s*listUsersByPhone/);
    assert.match(jsw, /async function listUsersByPhone/);
    assert.match(jsw, /\.eq\(contactFields\[i\], contactId\)/);
    assert.match(jsw, /'contactId', 'wixContactId'/);
    assert.doesNotMatch(jsw, /smsOptIn:\s*prefs\.smsOptIn !== false/);

    const httpMint = fs.readFileSync(path.join(root, 'src/backend/http-functions.js'), 'utf8');
    const mintFn = httpMint.slice(httpMint.indexOf('export async function post_commPrefsLink'));
    assert.match(mintFn, /contactId:\s*\(body && body\.contactId\) \|\| ''/);
    assert.match(mintFn, /personId:\s*\(body && body\.personId\) \|\| ''/);
    assert.doesNotMatch(mintFn, /body\.contactId \|\| body\.personId/);

    const gasHandler = fs.readFileSync(path.join(root, 'backend-gas/NodeRedHandlers_RepeatOffender.js'), 'utf8');
    const start = gasHandler.indexOf('function handleGetCommPreferences');
    assert.ok(start >= 0);
    const end = gasHandler.indexOf('\nfunction ', start + 1);
    const fn = end === -1 ? gasHandler.slice(start) : gasHandler.slice(start, end);
    assert.match(fn, /found:\s*true/);
    assert.match(fn, /found:\s*false/);
    assert.match(fn, /preservesOmitted:\s*true/);
    assert.match(fn, /getCommPrefsForPhone_/);
    assert.match(fn, /smsOptIn:\s*null/);
    assert.doesNotMatch(fn, /checkCommPrefsAllowed\(/);

    const gate = fs.readFileSync(path.join(root, 'backend-gas/CommPrefsGate.js'), 'utf8');
    assert.match(gate, /if \(!prefs\) return true; \/\/ No record = default opt-in/);
    assert.match(gate, /LockService\.getScriptLock\(\)/);
    assert.match(gate, /tryLock\(10000\)/);
    assert.match(gate, /lock\.releaseLock\(\)/);
});
