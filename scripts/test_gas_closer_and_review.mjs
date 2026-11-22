#!/usr/bin/env node
/**
 * Behavioral VM tests for backend-gas/TheCloser.js and backend-gas/NodeRedHandlers.js.
 * Loads both GAS files in an isolated node:vm sandbox with stubbed Apps Script APIs.
 * No network calls and no live outbound messages.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const gasDir = path.join(root, 'backend-gas');

const closerSrc = fs.readFileSync(path.join(gasDir, 'TheCloser.js'), 'utf8');
const nodeRedSrc = fs.readFileSync(path.join(gasDir, 'NodeRedHandlers.js'), 'utf8');

function makeSheet(name, initialRows, onMutation) {
  const rows = initialRows.map((r) => [...r]);
  return {
    getName: () => name,
    getLastRow: () => rows.length,
    getLastColumn: () => (rows[0] ? rows[0].length : 0),
    getDataRange: () => ({
      getValues: () => rows.map((r) => [...r]),
    }),
    getRange: () => ({
      setFontWeight: () => {},
      getValues: () => [],
    }),
    appendRow: (row) => {
      rows.push([...row]);
      onMutation('appendRow', { sheet: name, row });
    },
    _rows: rows,
  };
}

function makeSpreadsheet(sheetMap, onMutation) {
  const sheets = new Map();
  for (const [name, initialRows] of Object.entries(sheetMap)) {
    sheets.set(name, makeSheet(name, initialRows, onMutation));
  }
  return {
    getSheetByName: (name) => sheets.get(name) || null,
    insertSheet: (name) => {
      onMutation('insertSheet', { sheet: name });
      const created = makeSheet(name, [], onMutation);
      sheets.set(name, created);
      return created;
    },
    _sheets: sheets,
  };
}

function loadCloserHarness(sheetMap, { active = true } = {}) {
  const mutations = [];
  const sentSms = [];
  const sentTg = [];
  const ss = makeSpreadsheet(sheetMap, (type, detail) => mutations.push({ type, detail }));

  const ctx = {
    console,
    Date,
    Logger: { log: () => {} },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k === 'SPREADSHEET_ID' ? 'stub-sheet-id' : null),
      }),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => (active ? ss : null),
      openById: (id) => (id === 'stub-sheet-id' ? ss : null),
    },
    NotificationService: {
      sendSms: (phone, body) => {
        sentSms.push({ phone, body });
        return { success: true };
      },
    },
    TG_sendCloserFollowUp: (phone, body, intakeId) => {
      sentTg.push({ phone, body, intakeId });
      return { sent: true };
    },
  };

  vm.createContext(ctx);
  vm.runInContext(closerSrc, ctx, { filename: 'TheCloser.js' });
  return { ctx, ss, mutations, sentSms, sentTg };
}

function loadNodeRedHarness(sheetMap, { active = true, propSheetId = 'fallback-sheet-id' } = {}) {
  const mutations = [];
  const openedIds = [];
  const ss = sheetMap ? makeSpreadsheet(sheetMap, (type, detail) => mutations.push({ type, detail })) : null;

  const ctx = {
    console,
    Date,
    Logger: { log: () => {} },
    CONFIG: { SHEET_ID: 'config-sheet-id', SHEET_NAME: 'Leads' },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k === 'SPREADSHEET_ID' ? propSheetId : null),
      }),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => (active ? ss : null),
      openById: (id) => {
        openedIds.push(id);
        return ss;
      },
    },
  };

  vm.createContext(ctx);
  vm.runInContext(nodeRedSrc, ctx, { filename: 'NodeRedHandlers.js' });
  return { ctx, ss, mutations, openedIds };
}

test('CLOSER_MESSAGES use portal-landing resume URL and canonical phones', () => {
  const { ctx } = loadCloserHarness({});
  for (const key of ['1h', '24h', '72h', 'shannon']) {
    const tpl = ctx.CLOSER_MESSAGES[key];
    assert.ok(tpl, `missing template ${key}`);
    for (const channel of ['sms', 'telegram']) {
      assert.ok(
        tpl[channel].includes('https://www.shamrockbailbonds.biz/portal-landing'),
        `${key}.${channel} missing portal-landing URL`
      );
      assert.ok(tpl[channel].includes('(239) 332-2245'), `${key}.${channel} missing primary phone`);
      assert.ok(tpl[channel].includes('(239) 955-0178'), `${key}.${channel} missing SMS phone`);
    }
  }
});

test('testTheCloser / runTheCloser dryRun is side-effect free and honors opt-out variants', () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const { ctx, mutations, sentSms, sentTg } = loadCloserHarness({
    IntakeQueue: [
      ['Timestamp', 'Status', 'IndPhone', 'IndName', 'Source', 'doNotContact'],
      [twoHoursAgo, 'pending', '(239) 555-0101', 'Opt Bool', 'web', true],
      [twoHoursAgo, 'pending', '(239) 555-0102', 'Opt Yes', 'web', 'YES'],
      [twoHoursAgo, 'pending', '(239) 555-0103', 'Opt One', 'web', '1'],
      [twoHoursAgo, 'completed', '(239) 555-0104', 'Done Case', 'web', false],
      [twoHoursAgo, 'signed', '(239) 555-0105', 'Signed Case', 'web', false],
      [twoHoursAgo, 'posted', '(239) 555-0106', 'Posted Case', 'web', false],
      [twoHoursAgo, 'pending', '(239) 555-0198', 'Shannon Caller', 'Shannon AI', ''],
      [twoHoursAgo, 'incomplete', '(239) 555-0199', 'Maria Web', 'web', 'false'],
    ],
  });

  const res = ctx.testTheCloser();
  assert.equal(res.dryRun, true);
  assert.equal(res.sent, 0);
  assert.equal(sentSms.length, 0, 'dryRun must send 0 SMS');
  assert.equal(sentTg.length, 0, 'dryRun must send 0 Telegram');
  assert.equal(mutations.length, 0, 'dryRun must not insert sheets or append rows');

  assert.equal(res.candidates.length, 2);
  assert.equal(res.candidates[0].name, 'Shannon Caller');
  assert.equal(res.candidates[0].dripLevel, 'shannon');
  assert.equal(res.candidates[1].name, 'Maria Web');
  assert.equal(res.candidates[1].dripLevel, '1h');
});

test('handleGetReviewCandidates uses SPREADSHEET_ID fallback, filters DNC/FTA/dedup, and clamps limit', () => {
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  const { ctx, openedIds } = loadNodeRedHarness(
    {
      Cases: [
        ['Case_ID', 'Status', 'Defendant_Name', 'Indemnitor_Name', 'Indemnitor_Phone', 'Bond_Date', 'doNotContact', 'forfeited', 'warrant'],
        ['C-DNC', 'posted', 'Def A', 'Dnc Bool', '(239) 555-0201', tenDaysAgo, true, false, ''],
        ['C-OPT', 'posted', 'Def B', 'Dnc Yes', '(239) 555-0202', tenDaysAgo, 'yes', '', ''],
        ['C-FTA', 'posted', 'Def C', 'Forfeit Case', '(239) 555-0203', tenDaysAgo, false, '1', ''],
        ['C-WAR', 'active', 'Def D', 'Warrant Case', '(239) 555-0204', tenDaysAgo, false, false, 'YES'],
        ['C-LOG', 'posted', 'Def E', 'Already Sent', '(239) 555-0205', tenDaysAgo, false, false, false],
        ['C-NEW', 'posted', 'Def F', 'Too Recent', '(239) 555-0206', twoDaysAgo, false, false, false],
        ['C-OK1', 'posted', 'Def G', 'Good One', '(239) 555-0299', tenDaysAgo, false, false, false],
        ['C-DUP', 'completed', 'Def H', 'Same Phone Dup', '2395550299', tenDaysAgo, false, false, false],
        ['C-OK2', 'active', 'Def I', 'Good Two', '(239) 555-0298', tenDaysAgo, 'false', '0', 'no'],
      ],
      ReviewRequestLog: [
        ['Timestamp', 'Phone', 'Name', 'CaseId', 'Channel', 'Status'],
        [tenDaysAgo, '+12395550205', 'Already Sent', 'C-LOG', 'sms', 'sent'],
      ],
    },
    { active: false, propSheetId: 'fallback-sheet-id' }
  );

  const res = ctx.handleGetReviewCandidates({ limit: 500 });
  assert.equal(res.success, true);
  assert.deepEqual(openedIds, ['fallback-sheet-id']);
  assert.equal(res.count, 2);
  assert.deepEqual(
    Array.from(res.data, (d) => d.caseId),
    ['C-OK1', 'C-OK2']
  );
  assert.equal(res.data[0].phone, '+12395550299');
});

test('handleGetReviewCandidates clamps excessive limit to 100', () => {
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const rows = [['Case_ID', 'Status', 'Defendant_Name', 'Indemnitor_Name', 'Indemnitor_Phone', 'Bond_Date']];
  for (let i = 0; i < 110; i++) {
    rows.push([`C-${i}`, 'posted', `Def ${i}`, `Ind ${i}`, `239555${String(1000 + i)}`, tenDaysAgo]);
  }
  const { ctx } = loadNodeRedHarness({ Cases: rows });
  const res = ctx.handleGetReviewCandidates({ limit: 999 });
  assert.equal(res.success, true);
  assert.equal(res.count, 100);
});

test('handleGetReviewCandidates and handleLogReviewSent return structured error when no spreadsheet is configured', () => {
  const { ctx } = loadNodeRedHarness(null, { active: false, propSheetId: '' });
  // Clear CONFIG.SHEET_ID to simulate completely unconfigured environment
  ctx.CONFIG.SHEET_ID = '';

  const candidatesRes = ctx.handleGetReviewCandidates({});
  assert.equal(candidatesRes.success, false);
  assert.equal(candidatesRes.error, 'Spreadsheet not configured');

  const logRes = ctx.handleLogReviewSent({ phone: '2395550199' });
  assert.equal(logRes.success, false);
  assert.equal(logRes.error, 'Spreadsheet not configured');
});
