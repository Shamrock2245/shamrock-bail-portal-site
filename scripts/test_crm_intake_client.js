#!/usr/bin/env node
/**
 * Payload and HTTP-shape checks for backend-gas/CrmIntakeClient.js.
 * Uses a fake fetch. Does not call ShamrockLeads, Twilio, or Telegram.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '../backend-gas/CrmIntakeClient.js'), 'utf8');
const ctx = {
  console: console,
  Logger: { log: function () {} },
  UrlFetchApp: {
    fetch: function () {
      throw new Error('live UrlFetchApp call');
    }
  }
};
vm.createContext(ctx);
vm.runInContext(src, ctx);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const cfg = { key: 'test-gas-key', base: 'https://leads.example.test' };

const mini = ctx.crmBuildIntakePayload_('telegram_miniapp', {
  intakeId: 'TG-ABC',
  scan: {
    full_name: 'JANE Q PUBLIC',
    address: '1 LICENSE RD',
    city: 'FORT MYERS',
    state: 'FL',
    zip: '33901',
    dob: '1990-01-02',
    dl_number: 'P123',
    dl_state: 'FL'
  },
  form: {
    IndName: 'Jane Public',
    IndAddress: '99 Typed St',
    IndPhone: '(239) 555-0101',
    IndEmail: 'jane@example.com',
    DefName: 'Bob Public',
    DefBondAmount: '',
    booking_number: 'SH-2395550101-BOB',
    surety_id: 'osi',
    telegramUserId: '5551234567',
    IndPhoneAlso: ''
  }
});
assert(mini.source === 'telegram_miniapp', 'mini source');
assert(mini.IndName === 'Jane Public', 'stated name wins');
assert(mini.IndAddress === '99 Typed St', 'stated address wins');
assert(mini.IndCity === 'FORT MYERS', 'scan city kept');
assert(mini.IndDOB === '1990-01-02', 'scan dob kept');
assert(mini.IndDL === 'P123', 'scan dl kept');
assert(mini.IndPhone === '2395550101', 'phone');
assert(mini.bondAmount === undefined, 'blank bond omitted');
assert(mini.bookingNumber === undefined, 'generated booking omitted');
assert(mini.surety_id === undefined, 'surety omitted');
assert(mini.skip_match === undefined, 'skip_match omitted');

const chatPhone = ctx.crmBuildIntakePayload_('telegram', {
  form: {
    IndName: 'Amy Roe',
    IndPhone: '5551234567',
    telegramUserId: '5551234567',
    IndEmail: 'amy@example.com',
    DefName: 'Bob Roe'
  }
});
assert(chatPhone.source === 'telegram', 'bot source');
assert(chatPhone.IndPhone === undefined, 'chat id is not a phone');
assert(chatPhone.IndEmail === 'amy@example.com', 'email kept');

const shannon = ctx.crmBuildIntakePayload_('shannon_voice', {
  intakeId: 'SH-1',
  ocr: {
    indemnitor_name: 'AMY R ROE',
    indemnitor_address: '10 SCAN AVE',
    indemnitor_city: 'NAPLES',
    indemnitor_dob: '1988-04-04'
  },
  said: {
    caller_role: 'indemnitor',
    caller_name: 'Amy Roe',
    caller_phone: '2395550199',
    indemnitor_email: 'nope',
    caller_email: 'admin+shannon-def-sh1@shamrockbailbonds.biz',
    defendant_email: 'family@example.com',
    defendant_name: 'Bob Roe',
    bond_amount: '0',
    booking_number: 'conv_abc',
    county: 'Lee'
  }
});
assert(shannon.source === 'shannon_voice', 'shannon source');
assert(shannon.IndName === 'Amy Roe', 'caller name overlays OCR');
assert(shannon.IndAddress === '10 SCAN AVE', 'OCR address kept');
assert(shannon.IndDOB === '1988-04-04', 'OCR dob kept');
assert(shannon.IndEmail === 'family@example.com', 'best real email');
assert(shannon.bondAmount === undefined, 'zero bond omitted');
assert(shannon.bookingNumber === undefined, 'call id is not a booking');
assert(shannon.DefCounty === 'Lee', 'stated county');
assert(shannon.DefName === 'Bob Roe', 'defendant from the caller');

const calls = [];
function fakeFetch(url, init) {
  const body = JSON.parse(init.payload);
  calls.push({ url: url, body: body, key: init.headers['X-API-Key'] });
  if (String(url).indexOf('/api/id/scan-ocr') !== -1) {
    return {
      getResponseCode: function () { return 200; },
      getContentText: function () {
        return JSON.stringify({ success: true, extracted: { full_name: 'JANE PUBLIC', address: '1 LICENSE RD' } });
      }
    };
  }
  return {
    getResponseCode: function () { return 200; },
    getContentText: function () {
      return JSON.stringify({ success: true, intake_id: body.intakeId, source: body.source });
    }
  };
}

const scan = ctx.crmScanIdImage_('abc123', 'id.jpg', { config: cfg, fetch: fakeFetch });
assert(scan.full_name === 'JANE PUBLIC', 'scan extracted');
assert(calls[0].body.booking_number === undefined, 'scan has no booking');
assert(calls[0].body.image_b64 === 'abc123', 'scan image');
assert(calls[0].key === 'test-gas-key', 'scan key');

const submitted = ctx.crmIntakeFromTelegram_({
  source: 'telegram_mini_app',
  intakeId: 'TG-ABC',
  IndName: 'Jane Public',
  IndPhone: '2395550101',
  DefBondAmount: '$5,000',
  bookingNumber: '2026-4401'
}, { config: cfg, fetch: fakeFetch, scan: scan });
assert(submitted.ok === true, 'submit ok');
assert(calls[1].url === 'https://leads.example.test/api/intake/submit', 'submit url');
assert(calls[1].body.source === 'telegram_miniapp', 'mini alias');
assert(calls[1].body.IndAddress === '1 LICENSE RD', 'scan address used');
assert(calls[1].body.bondAmount === '5000', 'stated bond');
assert(calls[1].body.bookingNumber === '2026-4401', 'stated booking');
assert(calls[1].key === 'test-gas-key', 'submit key');

const failed = ctx.crmSubmitIntake_({ source: 'shannon_voice', IndName: 'Amy' }, {
  config: cfg,
  fetch: function () {
    return {
      getResponseCode: function () { return 503; },
      getContentText: function () { return JSON.stringify({ success: false, error: 'down' }); }
    };
  }
});
assert(failed.ok === false, 'failure is not success');
assert(failed.status === 503, 'status');

const missing = ctx.crmSubmitIntake_({ source: 'telegram' }, {
  config: { key: '', base: 'https://leads.example.test' },
  fetch: function () { throw new Error('should not fetch'); }
});
assert(missing.ok === false && missing.error === 'missing_machine_key', 'missing key');

const nested = ctx.crmBuildIntakePayload_('shannon_voice', {
  form: {
    indemnitor: { name: 'Amy Nested', email: 'amy.nested@example.com', phone: '2395550188' },
    defendant: { name: 'Bob Nested', email: 'bob.nested@example.com' }
  }
});
assert(nested.IndName === 'Amy Nested', 'nested indemnitor name');
assert(nested.IndPhone === '2395550188', 'nested indemnitor phone');
assert(nested.IndEmail === 'amy.nested@example.com', 'nested indemnitor email');
assert(nested.DefName === 'Bob Nested', 'nested defendant name');

const nestedDefEmail = ctx.crmBuildIntakePayload_('shannon_voice', {
  form: { defendant: { name: 'Bob Nested', email: 'bob.nested@example.com' } }
});
assert(nestedDefEmail.IndEmail === 'bob.nested@example.com', 'nested defendant email');

const flatWins = ctx.crmBuildIntakePayload_('shannon_voice', {
  form: {
    indemnitor_name: 'Flat Amy',
    indemnitor_email: 'flat@example.com',
    defendant_name: 'Flat Bob',
    indemnitor: { name: 'Nested Amy', email: 'nested@example.com', phone: '2395550188' },
    defendant: { name: 'Nested Bob', email: 'bob.nested@example.com' }
  }
});
assert(flatWins.IndName === 'Flat Amy', 'flat indemnitor name wins');
assert(flatWins.DefName === 'Flat Bob', 'flat defendant name wins');
assert(flatWins.IndEmail === 'flat@example.com', 'flat email wins');
assert(flatWins.IndPhone === '2395550188', 'nested phone fills a blank flat phone');

const shannonFile = fs.readFileSync(path.join(__dirname, '../backend-gas/Shannon_PaperworkTools.js'), 'utf8');
assert(shannonFile.indexOf('skip_match') === -1, 'Shannon no longer skips match');
assert(shannonFile.indexOf("source: 'elevenlabs_voice'") === -1, 'Shannon no longer tags elevenlabs_voice');
assert(shannonFile.indexOf('crmIntakeFromShannon_') !== -1, 'Shannon uses the CRM client');

const webhookFile = fs.readFileSync(path.join(__dirname, '../backend-gas/ElevenLabs_WebhookHandler.js'), 'utf8');
const createStart = webhookFile.indexOf('function toolCreateIntake');
const createEnd = webhookFile.indexOf('\nfunction ', createStart + 10);
const createBody = webhookFile.slice(createStart, createEnd);
assert(createBody.indexOf('skipIdScan: true') !== -1, 'create_intake skips the id-status lookup');
assert(createBody.indexOf('shannonLoadIdScan_') === -1, 'create_intake does not load an id scan');
assert(createBody.indexOf('id-status') === -1, 'create_intake has no id-status call');

const codeFile = fs.readFileSync(path.join(__dirname, '../backend-gas/Code.js'), 'utf8');
const miniStart = codeFile.indexOf("data.action === 'telegram_mini_app_intake'");
const miniSlice = codeFile.slice(miniStart, miniStart + 1800);
assert(miniSlice.indexOf("result.via === 'crm'") !== -1, 'mini-app Slack is gated on a CRM miss');
const slackAt = miniSlice.indexOf('sendSlackMessage');
const gateAt = miniSlice.indexOf("result.via === 'crm'");
assert(gateAt !== -1 && slackAt > gateAt, 'Slack post sits inside the CRM-miss guard');

const events = [];
const fetches = [];
const shannonCtx = {
  console: console,
  Logger: { log: function () {} },
  ContentService: {
    MimeType: { JSON: 'application/json' },
    createTextOutput: function (text) {
      return { text: text, setMimeType: function () { return this; } };
    }
  },
  PropertiesService: {
    getScriptProperties: function () {
      return { getProperty: function () { return ''; } };
    }
  },
  UrlFetchApp: {
    fetch: function (url) {
      fetches.push(String(url));
      return {
        getResponseCode: function () { return 200; },
        getContentText: function () { return '{}'; }
      };
    }
  },
  SpreadsheetApp: {
    getActiveSpreadsheet: function () {
      const rows = [['UpdatedAt', 'CaseRef', 'CallerPhone', 'CallerRole', 'DefendantName', 'IndemnitorEmail', 'Status', 'PayloadJson']];
      const sheet = {
        getDataRange: function () {
          return { getValues: function () { return rows.map(function (row) { return row.slice(); }); } };
        },
        appendRow: function (row) {
          events.push('sheet');
          rows.push(row);
        },
        getRange: function () {
          return { setValues: function () { events.push('sheet'); } };
        }
      };
      return {
        getSheetByName: function () { return sheet; },
        insertSheet: function () { return sheet; }
      };
    }
  }
};
vm.createContext(shannonCtx);
vm.runInContext(shannonFile, shannonCtx);
shannonCtx.crmIntakeFromShannon_ = function (params) {
  events.push('crm:' + (params.case_reference || ''));
  return { ok: true, status: 200 };
};
shannonCtx.toolScheduleCallback = function (params) { events.push('callback:' + params.preferred_time); };
shannonCtx.sendSlackMessage = function () { events.push('slack'); };
shannonCtx.sendShannonText_ = function () { events.push('desk'); return { success: true }; };

const saved = JSON.parse(shannonCtx.toolSavePaperworkAnswers({
  case_reference: 'SH-2395550101-BOB-ROE',
  caller_phone: '2395550101',
  defendant_name: 'Bob Roe',
  indemnitor: { email: 'amy@example.com' }
}).text);
assert(saved.status === 'saved', 'paperwork saved');
assert(events[0] === 'sheet', 'sheet write happens before the CRM call');
assert(events[1] === 'crm:SH-2395550101-BOB-ROE', 'CRM sync reuses the case reference');
assert(fetches.length === 0, 'paperwork save does not call id-status');

fetches.length = 0;
shannonCtx.shannonSyncIntakeToCrm_({ case_reference: 'SH-2395550101-BOB-ROE', caller_name: 'Amy' });
assert(fetches.some(function (url) { return url.indexOf('/api/paperwork/shannon/id-status') !== -1; }), 'id-status still runs when not skipped');
fetches.length = 0;
shannonCtx.shannonSyncIntakeToCrm_({ case_reference: 'SH-2395550101-BOB-ROE' }, { skipIdScan: true });
assert(fetches.length === 0, 'skipIdScan keeps the voice path to one CRM call');

events.length = 0;
const notified = shannonCtx.handleShannonNotifyBondsman({
  case_reference: 'SH-2395550101-BOB-ROE',
  caller_name: 'Amy Roe',
  caller_phone: '2395550101',
  defendant_name: 'Bob Roe',
  county: 'Lee',
  preferred_time: '3pm'
});
assert(notified.via === 'crm', 'notify CRM success');
assert(notified.case_reference === 'SH-2395550101-BOB-ROE', 'notify reuses the case reference');
assert(events.indexOf('callback:3pm') !== -1, 'callback still runs after CRM success');
assert(events.indexOf('desk') !== -1, 'staff desk text still runs after CRM success');
assert(events.indexOf('slack') === -1, 'Slack is skipped when CRM accepts');
assert(events.indexOf('crm:SH-2395550101-BOB-ROE') !== -1, 'notify CRM payload carries the case reference');

shannonCtx.crmIntakeFromShannon_ = function () { return { ok: false, status: 503, error: 'down' }; };
events.length = 0;
const missed = shannonCtx.handleShannonNotifyBondsman({
  caller_name: 'Amy Roe',
  caller_phone: '2395550101',
  defendant_name: 'Bob Roe',
  preferred_time: 'ASAP'
});
assert(missed.via === 'fallback', 'notify CRM miss');
assert(missed.case_reference.indexOf('SH-2395550101-BOB-ROE') === 0, 'miss path still builds the same case key');
assert(events.indexOf('callback:ASAP') !== -1, 'callback runs on a CRM miss');
assert(events.indexOf('slack') !== -1, 'Slack runs only on a CRM miss');
assert(events.indexOf('desk') !== -1, 'staff desk text runs on a CRM miss');

console.log('crm intake client checks passed');
