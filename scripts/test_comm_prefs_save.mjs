#!/usr/bin/env node
/**
 * Communication preferences save/load. Mocked deps only. No network. No secrets.
 * All-channels-off must persist as explicit false. GAS must succeed before
 * any CMS write or a success result. Client-supplied personId is ignored.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    validateCommPrefsInput,
    interpretGasCommPrefsResult,
    saveCommunicationPreferences,
    getCommunicationPreferences
} from '../src/backend/commPrefs.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXED_NOW = new Date('2026-11-11T13:00:00.000Z');

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
        : { valid: true, personId: 'person-session-1' };
    const gasResult = overrides && Object.prototype.hasOwnProperty.call(overrides, 'gasResult')
        ? overrides.gasResult
        : { success: true, result: { success: true, message: 'Preferences updated.' } };
    if (overrides && overrides.existing) store.push(overrides.existing);

    const deps = {
        validateSession: async (token) => {
            if (overrides && typeof overrides.validateSession === 'function') {
                return overrides.validateSession(token);
            }
            return session;
        },
        queryUsers: async (personId) => store.find((row) => row.personId === personId) || null,
        updateUser: async (record) => {
            writes.updates.push(record);
            const idx = store.findIndex((row) => row._id === record._id || row.personId === record.personId);
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

test('all-off save awaits GAS with explicit false flags, then persists', async () => {
    const h = harness({
        existing: { _id: 'u1', personId: 'person-session-1', firstName: 'Old' }
    });
    const result = await saveCommunicationPreferences(allOff(), h.deps);
    assert.equal(result.ok, true);
    assert.equal(result.lastUpdated, '2026-11-11T13:00:00.000Z');
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

test('client-supplied personId is ignored; session personId is used', async () => {
    const h = harness();
    const result = await saveCommunicationPreferences(baseForm({ personId: 'attacker-id' }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.writes.inserts.length, 1);
    assert.equal(h.writes.inserts[0].personId, 'person-session-1');
    assert.equal(h.writes.inserts[0].personId === 'attacker-id', false);
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

test('anonymous save inserts a new row and cannot pick a personId', async () => {
    const h = harness({ session: { valid: false } });
    const result = await saveCommunicationPreferences(baseForm({ sessionToken: '', personId: 'spoof' }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.writes.inserts.length, 1);
    assert.equal(h.writes.inserts[0].personId, '');
    assert.equal(h.writes.updates.length, 0);
});

test('getCommunicationPreferences only returns the session user', async () => {
    const h = harness({
        existing: {
            personId: 'person-session-1',
            firstName: 'Jane',
            lastName: 'Doe',
            phone: '2395550100',
            smsOptIn: false,
            whatsappOptIn: false,
            telegramOptIn: false,
            emailOptIn: false,
            prefsUpdatedAt: '2026-11-11T13:00:00.000Z'
        }
    });
    const loaded = await getCommunicationPreferences({ sessionToken: 'session-token' }, h.deps);
    assert.equal(loaded.ok, true);
    assert.equal(loaded.data.smsOptIn, false);
    assert.equal(loaded.data.firstName, 'Jane');

    const anon = await getCommunicationPreferences({ sessionToken: '' }, h.deps);
    assert.equal(anon.ok, true);
    assert.equal(anon.data, null);
});

test('page code does not write CMS or fire-and-forget the GAS helper', () => {
    const page = fs.readFileSync(path.join(root, 'src/pages/Communication Preferences.zc3fn.js'), 'utf8');
    assert.equal(page.includes('wix-data'), false);
    assert.equal(page.includes('suppressAuth'), false);
    assert.equal(page.includes('syncCommPrefsToGas'), false);
    assert.match(page, /saveCommunicationPreferences/);
    assert.match(page, /getCommunicationPreferences/);
    assert.match(page, /result\.ok !== true/);
});

test('syncCommPrefsToGas is not client-invokable; save and get are', () => {
    const perms = JSON.parse(fs.readFileSync(path.join(root, 'src/backend/permissions.json'), 'utf8'));
    const block = perms['web-methods']['comm-prefs-sync.jsw'];
    assert.ok(block);
    for (const role of ['siteOwner', 'siteMember', 'anonymous']) {
        assert.equal(block.syncCommPrefsToGas[role].invoke, false, 'sync ' + role);
        assert.equal(block.saveCommunicationPreferences[role].invoke, true, 'save ' + role);
        assert.equal(block.getCommunicationPreferences[role].invoke, true, 'get ' + role);
        assert.equal(block['*'][role].invoke, false, 'default ' + role);
    }

    const jsw = fs.readFileSync(path.join(root, 'src/backend/comm-prefs-sync.jsw'), 'utf8');
    assert.match(jsw, /smsOptIn:\s*prefs\.smsOptIn === true/);
    assert.match(jsw, /interpretGasCommPrefsResult/);
    assert.match(jsw, /getGasWebAppUrl/);
    assert.doesNotMatch(jsw, /smsOptIn:\s*prefs\.smsOptIn !== false/);
});
