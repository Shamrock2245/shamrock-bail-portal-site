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
        getLastColumn: () => rows.reduce((max, row) => Math.max(max, row.length), 0),
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
            if (!sheet) sheet = makeSheet([]); // a real insertSheet is empty
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
        saveCommPrefs: (...args) => ctx.saveCommPrefs_(...args),
        handleUpdateCommPrefs: (...args) => ctx.handleUpdateCommPrefs_(...args),
        ctx,
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

test('consent writers are private (trailing underscore) so google.script.run cannot call them', () => {
    const gate = loadGate(makeSheet());
    assert.equal(typeof gate.ctx.saveCommPrefs_, 'function');
    assert.equal(typeof gate.ctx.handleUpdateCommPrefs_, 'function');
    assert.equal(typeof gate.ctx.saveCommPrefs, 'undefined');
    assert.equal(typeof gate.ctx.handleUpdateCommPrefs, 'undefined');
    assert.doesNotMatch(SOURCE, /function\s+(saveCommPrefs|handleUpdateCommPrefs)\s*\(/);
});

test('expected values are compared under the lock: mismatch is a conflict and writes nothing', () => {
    const stored = [PHONE, 'A', 'B', '', false, '', '', '', 'then'];
    const gate = loadGate(makeSheet([HEADER, stored.slice()]));
    // Another tab already opted out of SMS; this save still expects unknown.
    const res = gate.saveCommPrefs({ phone: PHONE, smsOptIn: true, expected: { smsOptIn: null } });
    assert.equal(res.success, false);
    assert.equal(res.conflict, true);
    assert.equal(res.code, 'conflict');
    assert.deepEqual(Array.from(gate.dataRow()), stored);
    assert.equal(gate.lock.released, 1);

    const ok = gate.saveCommPrefs({ phone: PHONE, smsOptIn: true, expected: { smsOptIn: false } });
    assert.equal(ok.success, true);
    assert.equal(gate.dataRow()[4], true);
});

test('expected on a missing row must be all unknown; whatsAppOptIn alias is honored', () => {
    const empty = loadGate(makeSheet());
    const res = empty.saveCommPrefs({ phone: PHONE, smsOptIn: false, expected: { smsOptIn: true } });
    assert.equal(res.conflict, true);
    assert.equal(empty.sheet()._rows.length, 1);

    const fresh = loadGate(makeSheet());
    const ok = fresh.saveCommPrefs({ phone: PHONE, smsOptIn: false, expected: { smsOptIn: null, whatsappOptIn: null } });
    assert.equal(ok.success, true);
    assert.equal(fresh.dataRow()[4], false);

    const row = [PHONE, '', '', '', '', true, '', '', 'then'];
    const alias = loadGate(makeSheet([HEADER, row.slice()]));
    const conflict = alias.saveCommPrefs({ phone: PHONE, whatsappOptIn: false, expected: { whatsAppOptIn: false } });
    assert.equal(conflict.conflict, true);
});

test('saves without expected keep last-writer-wins behavior', () => {
    const gate = loadGate(makeSheet([HEADER, [PHONE, '', '', '', false, '', '', '', 'then']]));
    const res = gate.saveCommPrefs({ phone: PHONE, smsOptIn: true });
    assert.equal(res.success, true);
    assert.equal(gate.dataRow()[4], true);
});

// ── Phone-call consent (CallOptIn, columns J/K) ─────────────────────────────

const CALL_HEADER = HEADER.concat(['CallOptIn', 'CallOptInUpdatedAt']);

test('a new sheet is created with CallOptIn / CallOptInUpdatedAt in J/K', () => {
    const gate = loadGate(null);
    const result = gate.saveCommPrefs({ phone: PHONE, callOptIn: true });
    assert.equal(result.success, true);
    assert.deepEqual(JSON.parse(JSON.stringify(gate.sheet()._rows[0])), CALL_HEADER);
    const row = gate.dataRow();
    assert.equal(row[9], true);
    assert.match(String(row[10]), /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(row[4], '');
});

test('call writes J and its timestamp K; omitted call keeps or blanks them, never TRUE', () => {
    const gate = loadGate(makeSheet([CALL_HEADER]));
    gate.saveCommPrefs({ phone: PHONE, smsOptIn: true });
    let row = gate.dataRow();
    assert.equal(row[9], '');
    assert.equal(row[10], '');

    const stored = [PHONE, 'Jane', 'Doe', '', true, '', '', '', '2026-11-01T00:00:00.000Z', false, '2026-11-01T00:00:00.000Z'];
    const upd = loadGate(makeSheet([CALL_HEADER, stored]));
    upd.saveCommPrefs({ phone: PHONE, emailOptIn: true });
    row = upd.dataRow();
    assert.equal(row[7], true);
    assert.equal(row[9], false);
    assert.equal(row[10], '2026-11-01T00:00:00.000Z');

    upd.saveCommPrefs({ phone: PHONE, callOptIn: true });
    row = upd.dataRow();
    assert.equal(row[9], true);
    assert.notEqual(row[10], '2026-11-01T00:00:00.000Z');
    assert.equal(row[7], true);
});

test('a call write is refused, not dropped, while the sheet lacks the call columns', () => {
    const stored = [PHONE, 'Jane', 'Doe', '', true, '', '', '', '2026-11-01T00:00:00.000Z'];
    const gate = loadGate(makeSheet([HEADER, stored]));
    const result = gate.saveCommPrefs({ phone: PHONE, smsOptIn: false, callOptIn: true });
    assert.equal(result.success, false);
    assert.equal(result.code, 'call_column_missing');
    assert.deepEqual(gate.dataRow(), stored);
    const viaExpected = gate.saveCommPrefs({ phone: PHONE, smsOptIn: false, expected: { callOptIn: null } });
    assert.equal(viaExpected.code, 'call_column_missing');
    // Non-call saves on the old 9-column sheet still work and touch only A..I.
    const ok = gate.saveCommPrefs({ phone: PHONE, smsOptIn: false });
    assert.equal(ok.success, true);
    assert.equal(gate.dataRow()[4], false);
    assert.equal(gate.dataRow().length, 9);
    assert.equal(gate.getCommPrefsForPhone_(PHONE).callOptIn, null);
});

test('callOptIn expected is compared under the lock', () => {
    const stored = [PHONE, '', '', '', '', '', '', '', '2026-11-01T00:00:00.000Z', false, '2026-11-01T00:00:00.000Z'];
    const gate = loadGate(makeSheet([CALL_HEADER, stored]));
    const conflict = gate.saveCommPrefs({ phone: PHONE, callOptIn: true, expected: { callOptIn: null } });
    assert.equal(conflict.conflict, true);
    assert.equal(gate.dataRow()[9], false);
    const ok = gate.saveCommPrefs({ phone: PHONE, callOptIn: true, expected: { callOptIn: false } });
    assert.equal(ok.success, true);
    assert.equal(gate.dataRow()[9], true);
    const fresh = loadGate(makeSheet([CALL_HEADER]));
    assert.equal(fresh.saveCommPrefs({ phone: PHONE, callOptIn: true, expected: { callOptIn: false } }).conflict, true);
});

test('checkCommPrefsAllowed: calls need an explicit TRUE; no row, blank or missing column is not set', () => {
    const empty = loadGate(makeSheet([CALL_HEADER]));
    assert.equal(empty.checkCommPrefsAllowed(PHONE, 'call'), false);
    assert.equal(empty.checkCommPrefsAllowed('', 'call'), false);
    assert.equal(empty.checkCommPrefsAllowed(PHONE, 'sms'), true);

    const blank = loadGate(makeSheet([CALL_HEADER, [PHONE, '', '', '', true, '', '', '', 'x', '', '']]));
    assert.equal(blank.checkCommPrefsAllowed(PHONE, 'call'), false);
    assert.equal(blank.getCommPrefsForPhone_(PHONE).callOptIn, null);
    const no = loadGate(makeSheet([CALL_HEADER, [PHONE, '', '', '', true, '', '', '', 'x', false, 'x']]));
    assert.equal(no.checkCommPrefsAllowed(PHONE, 'call'), false);
    const yes = loadGate(makeSheet([CALL_HEADER, [PHONE, '', '', '', true, '', '', '', 'x', true, 'x']]));
    assert.equal(yes.checkCommPrefsAllowed(PHONE, ' Call '), true);
    const oldSheet = loadGate(makeSheet([HEADER, [PHONE, '', '', '', true, '', '', '', 'x']]));
    assert.equal(oldSheet.checkCommPrefsAllowed(PHONE, 'call'), false);
    assert.equal(oldSheet.checkCommPrefsAllowed(PHONE, 'sms'), true);
});

test('handleGetCommPreferences_ returns callOptIn (null when not set) and supportsCall', () => {
    const handlers = fs.readFileSync(path.join(root, 'backend-gas/NodeRedHandlers_RepeatOffender.js'), 'utf8');
    const run = (rows) => {
        const gate = loadGate(makeSheet(rows));
        vm.runInContext(handlers, gate.ctx, { filename: 'NodeRedHandlers_RepeatOffender.js' });
        return gate.ctx.handleGetCommPreferences_({ phone: PHONE });
    };
    const none = run([CALL_HEADER]);
    assert.equal(none.found, false);
    assert.equal(none.supportsCall, true);
    assert.equal(none.prefs.callOptIn, null);
    const blank = run([CALL_HEADER, [PHONE, '', '', '', true, '', '', '', 'x', '', '']]);
    assert.equal(blank.found, true);
    assert.equal(blank.prefs.callOptIn, null);
    assert.equal(blank.prefs.smsOptIn, true);
    const yes = run([CALL_HEADER, [PHONE, '', '', '', true, '', '', '', 'x', true, 'x']]);
    assert.equal(yes.prefs.callOptIn, true);
    const oldSheet = run([HEADER, [PHONE, '', '', '', true, '', '', '', 'x']]);
    assert.equal(oldSheet.prefs.callOptIn, null);
});
