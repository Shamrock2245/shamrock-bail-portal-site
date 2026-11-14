#!/usr/bin/env node
/**
 * GAS CommPrefsGate: saveCommPrefs / updateCommPrefs must not record
 * omitted channel flags as true. Loads backend-gas/CommPrefsGate.js in a
 * vm with a stubbed SpreadsheetApp sheet. No network. No secrets.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = fs.readFileSync(path.join(root, 'backend-gas/CommPrefsGate.js'), 'utf8');
const HEADER = ['Phone', 'FirstName', 'LastName', 'Email', 'SmsOptIn', 'WhatsAppOptIn', 'TelegramOptIn', 'EmailOptIn', 'UpdatedAt'];
const PHONE = '2395550100';

function makeSheet(initialRows) {
    const rows = (initialRows || [HEADER]).map((row) => row.slice());
    const sheet = {
        getLastRow: () => rows.length,
        getRange: (r, c, nR, nC) => ({
            getValues: () => {
                const out = [];
                for (let i = 0; i < (nR || 1); i++) {
                    const row = rows[r - 1 + i] || [];
                    out.push(row.slice(c - 1, c - 1 + (nC || row.length)));
                }
                return out;
            },
            setValues: (vals) => {
                vals.forEach((val, i) => {
                    const idx = r - 1 + i;
                    if (!rows[idx]) rows[idx] = [];
                    val.forEach((v, j) => {
                        rows[idx][c - 1 + j] = v;
                    });
                });
            },
            setFontWeight: () => {}
        }),
        getDataRange: () => ({
            getValues: () => rows.map((row) => row.slice())
        }),
        appendRow: (row) => {
            rows.push(row.slice());
        },
        setFrozenRows: () => {},
        _rows: rows
    };
    return sheet;
}

function loadGate(sheet, options) {
    const lockOpts = (options && options.lock) || {};
    const acquired = { value: false, released: 0, tryMs: null };
    const active = {
        getSheetByName: (name) => (name === 'CommPrefs' ? sheet : null),
        insertSheet: (name) => {
            if (!sheet) sheet = makeSheet();
            active.getSheetByName = () => sheet;
            return sheet;
        }
    };
    const ctx = {
        console,
        Logger: { log() {} },
        SpreadsheetApp: {
            getActiveSpreadsheet: () => active
        },
        LockService: {
            getScriptLock: () => ({
                tryLock: (ms) => {
                    acquired.tryMs = ms;
                    if (lockOpts.tryLock === false) return false;
                    acquired.value = true;
                    return true;
                },
                waitLock: (ms) => {
                    acquired.tryMs = ms;
                    if (lockOpts.tryLock === false) throw new Error('Could not obtain lock');
                    acquired.value = true;
                },
                releaseLock: () => {
                    acquired.released += 1;
                }
            })
        }
    };
    vm.createContext(ctx);
    vm.runInContext(SOURCE, ctx, { filename: 'CommPrefsGate.js' });
    return {
        saveCommPrefs: (...args) => ctx.saveCommPrefs(...args),
        handleUpdateCommPrefs: (...args) => ctx.handleUpdateCommPrefs(...args),
        checkCommPrefsAllowed: (...args) => ctx.checkCommPrefsAllowed(...args),
        getCommPrefsForPhone_: (...args) => ctx.getCommPrefsForPhone_(...args),
        sheet: () => sheet || active.getSheetByName('CommPrefs'),
        dataRow: () => {
            const s = sheet || active.getSheetByName('CommPrefs');
            return s && s._rows[1];
        },
        lock: acquired
    };
}

test('a new CommPrefs row writes omitted channels as blank, never TRUE', () => {
    const gate = loadGate(makeSheet());
    const result = gate.handleUpdateCommPrefs({
        phone: PHONE,
        firstName: 'Jane',
        lastName: 'Doe',
        smsOptIn: false
    });
    assert.equal(result.success, true);
    assert.equal(result.action, 'created');
    const row = gate.dataRow();
    assert.equal(row[0], PHONE);
    assert.equal(row[4], false);
    assert.equal(row[5], '');
    assert.equal(row[6], '');
    assert.equal(row[7], '');
    assert.notEqual(row[5], true);
    assert.notEqual(row[6], true);
    assert.notEqual(row[7], true);

    const prefs = gate.getCommPrefsForPhone_(PHONE);
    assert.equal(prefs.smsOptIn, false);
    assert.equal(prefs.whatsAppOptIn, null);
    assert.equal(prefs.telegramOptIn, null);
    assert.equal(prefs.emailOptIn, null);
});

test('an existing CommPrefs row keeps stored values for omitted flags', () => {
    const sheet = makeSheet([
        HEADER,
        [PHONE, 'Jane', 'Doe', 'jane@example.com', true, true, '', false, '2026-11-01T00:00:00.000Z']
    ]);
    const gate = loadGate(sheet);
    const result = gate.saveCommPrefs({
        phone: '(239) 555-0100',
        smsOptIn: false
    });
    assert.equal(result.success, true);
    assert.equal(result.action, 'updated');
    const row = gate.dataRow();
    assert.equal(row[4], false);
    assert.equal(row[5], true);
    assert.equal(row[6], '');
    assert.equal(row[7], false);
});

test('only an explicit true is recorded as affirmative consent', () => {
    const gate = loadGate(makeSheet());
    gate.saveCommPrefs({
        phone: PHONE,
        smsOptIn: true,
        whatsappOptIn: false
    });
    const row = gate.dataRow();
    assert.equal(row[4], true);
    assert.equal(row[5], false);
    assert.equal(row[6], '');
    assert.equal(row[7], '');

    const again = loadGate(makeSheet([HEADER, row.slice()]));
    again.saveCommPrefs({
        phone: PHONE,
        emailOptIn: true
    });
    const updated = again.dataRow();
    assert.equal(updated[4], true);
    assert.equal(updated[5], false);
    assert.equal(updated[6], '');
    assert.equal(updated[7], true);
});

test('checkCommPrefsAllowed still fail-opens on a missing row or blank flag', () => {
    const empty = loadGate(makeSheet());
    assert.equal(empty.checkCommPrefsAllowed(PHONE, 'sms'), true);
    assert.equal(empty.checkCommPrefsAllowed(PHONE, 'whatsapp'), true);

    const withBlanks = loadGate(makeSheet());
    withBlanks.saveCommPrefs({ phone: PHONE, smsOptIn: false });
    assert.equal(withBlanks.checkCommPrefsAllowed(PHONE, 'sms'), false);
    assert.equal(withBlanks.checkCommPrefsAllowed(PHONE, 'whatsapp'), true);
    assert.equal(withBlanks.checkCommPrefsAllowed(PHONE, 'telegram'), true);
    assert.equal(withBlanks.checkCommPrefsAllowed(PHONE, 'email'), true);
});

test('saveCommPrefs waits up to 10s for a script lock and releases it', () => {
    const gate = loadGate(makeSheet());
    const result = gate.saveCommPrefs({
        phone: PHONE,
        smsOptIn: false
    });
    assert.equal(result.success, true);
    assert.equal(gate.lock.tryMs, 10000);
    assert.equal(gate.lock.value, true);
    assert.equal(gate.lock.released, 1);
    assert.equal(gate.dataRow()[4], false);
});

test('saveCommPrefs fails closed and does not write if the script lock cannot be acquired', () => {
    const sheet = makeSheet([
        HEADER,
        [PHONE, 'Jane', 'Doe', '', true, true, true, true, '2026-11-01T00:00:00.000Z']
    ]);
    const gate = loadGate(sheet, { lock: { tryLock: false } });
    const result = gate.saveCommPrefs({
        phone: PHONE,
        smsOptIn: false
    });
    assert.equal(result.success, false);
    assert.match(result.message, /try again or call \(239\) 332-2245/i);
    assert.equal(gate.lock.released, 0);
    const row = gate.dataRow();
    assert.equal(row[4], true);
    assert.equal(row[5], true);
    assert.equal(sheet._rows.length, 2);
});
