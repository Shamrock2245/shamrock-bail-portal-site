#!/usr/bin/env node
/**
 * GAS doPostFromClient must not run consent-writing actions
 * (updateCommPrefs / saveCommPrefs). Those go through authenticated
 * doPost only. Dashboard HTML does not call them via google.script.run.
 *
 * Loads backend-gas/Code.js in a vm with stubbed Apps Script services.
 * No network. No secrets.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const gas = (f) => fs.readFileSync(path.join(root, 'backend-gas', f), 'utf8');

function loadBridge() {
    const handled = [];
    const wixCalls = [];
    const ctx = {
        console: { log() {}, warn() {}, error() {}, info() {} },
        Logger: { log() {} },
        Session: { getActiveUser: () => ({ getEmail: () => '' }) },
        PropertiesService: {
            getScriptProperties: () => ({
                getProperty: () => null,
                getProperties: () => ({})
            })
        },
        Utilities: {
            newBlob: (s) => ({ getBytes: () => Array.from(Buffer.from(String(s), 'utf8')) }),
            formatDate: () => ''
        },
        ContentService: {
            MimeType: { JSON: 'json', JAVASCRIPT: 'js' },
            createTextOutput: (text) => ({ text, setMimeType() { return this; } })
        },
        SpreadsheetApp: {
            getActiveSpreadsheet: () => ({
                getSheetByName: () => null,
                insertSheet: () => ({ getLastRow: () => 0 })
            })
        },
        UrlFetchApp: { fetch: () => ({ getResponseCode: () => 200, getContentText: () => '{}' }) },
        MongoLogger: {
            logActivity() {},
            logCheckIn() {},
            logCourtDate() {},
            logPayment() {},
            logIntake() {}
        },
        getConfig: () => ({})
    };
    vm.createContext(ctx);
    for (const f of ['Compliance.js', 'Code.js']) {
        vm.runInContext(gas(f), ctx, { filename: f });
    }
    ctx.handleAction = (data) => {
        handled.push((data && data.action) || '');
        return { success: true, via: 'handleAction', action: data && data.action };
    };
    ctx.client_sendToWixPortal = (data) => {
        wixCalls.push('sendToWixPortal');
        return { success: true, via: 'client_sendToWixPortal' };
    };
    ctx.client_batchSaveToWixPortal = (data) => {
        wixCalls.push('batchSaveToWixPortal');
        return { success: true, via: 'client_batchSaveToWixPortal' };
    };
    ctx.handleUpdateCommPrefs = () => {
        handled.push('handleUpdateCommPrefs');
        return { success: true, via: 'handleUpdateCommPrefs' };
    };
    ctx.saveCommPrefs = () => {
        handled.push('saveCommPrefs');
        return { success: true, via: 'saveCommPrefs' };
    };
    return { ctx, handled, wixCalls };
}

test('doPostFromClient blocks updateCommPrefs and saveCommPrefs and does not call handleAction', () => {
    const { ctx, handled } = loadBridge();
    assert.deepEqual(Array.from(ctx.CLIENT_BLOCKED_CONSENT_WRITES_ || []), ['updateCommPrefs', 'saveCommPrefs']);

    const update = ctx.doPostFromClient({ action: 'updateCommPrefs', phone: '2395550100', smsOptIn: false });
    assert.equal(update.success, false);
    assert.match(String(update.error), /Unauthorized/i);
    assert.match(String(update.error), /consent updates/i);
    assert.deepEqual(handled, []);

    const save = ctx.doPostFromClient({ action: 'saveCommPrefs', phone: '2395550100', smsOptIn: false });
    assert.equal(save.success, false);
    assert.match(String(save.error), /Unauthorized/i);
    assert.deepEqual(handled, []);
});

test('doPostFromClient still dispatches other actions and the Wix portal wrappers', () => {
    const { ctx, handled, wixCalls } = loadBridge();

    const nav = ctx.doPostFromClient({ action: 'nav', target: 'queue' });
    assert.equal(nav.success, true);
    assert.equal(nav.via, 'handleAction');
    assert.deepEqual(handled, ['nav']);

    const profile = ctx.doPostFromClient({ action: 'fetchIndemnitorProfile', email: 'a@example.com' });
    assert.equal(profile.via, 'handleAction');
    assert.deepEqual(handled, ['nav', 'fetchIndemnitorProfile']);

    const send = ctx.doPostFromClient({ action: 'sendToWixPortal' });
    assert.equal(send.via, 'client_sendToWixPortal');
    const batch = ctx.doPostFromClient({ action: 'batchSaveToWixPortal' });
    assert.equal(batch.via, 'client_batchSaveToWixPortal');
    assert.deepEqual(wixCalls, ['sendToWixPortal', 'batchSaveToWixPortal']);
    assert.deepEqual(handled, ['nav', 'fetchIndemnitorProfile']);
});

test('dashboard HTML does not call consent-writing actions through google.script.run', () => {
    const dir = path.join(root, 'backend-gas');
    const htmlFiles = fs.readdirSync(dir).filter((name) => name.endsWith('.html'));
    assert.ok(htmlFiles.includes('Dashboard.html'));
    for (const name of htmlFiles) {
        const src = fs.readFileSync(path.join(dir, name), 'utf8');
        assert.equal(src.includes('updateCommPrefs'), false, name + ' mentions updateCommPrefs');
        assert.equal(src.includes('saveCommPrefs'), false, name + ' mentions saveCommPrefs');
    }
    const src = gas('Code.js');
    const start = src.indexOf('var CLIENT_BLOCKED_CONSENT_WRITES_');
    const fnStart = src.indexOf('function doPostFromClient');
    const end = src.indexOf('\nfunction ', fnStart + 1);
    assert.ok(start >= 0 && fnStart > start && end > fnStart);
    const block = src.slice(start, end);
    assert.match(block, /CLIENT_BLOCKED_CONSENT_WRITES_/);
    assert.match(block, /updateCommPrefs/);
    assert.match(block, /saveCommPrefs/);
    assert.match(block, /return handleAction\(data\)/);
});
