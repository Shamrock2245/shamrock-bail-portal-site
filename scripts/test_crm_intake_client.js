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

const shannonFile = fs.readFileSync(path.join(__dirname, '../backend-gas/Shannon_PaperworkTools.js'), 'utf8');
assert(shannonFile.indexOf('skip_match') === -1, 'Shannon no longer skips match');
assert(shannonFile.indexOf("source: 'elevenlabs_voice'") === -1, 'Shannon no longer tags elevenlabs_voice');
assert(shannonFile.indexOf('crmIntakeFromShannon_') !== -1, 'Shannon uses the CRM client');

console.log('crm intake client checks passed');
