#!/usr/bin/env node
/**
 * GAS doPost: the Telegram Mini App actions require the GAS API key, checked BEFORE any handler
 * runs. The pages call shamrock-telegram-app /api/miniapp, which verifies Telegram initData
 * (plus the Telegram-verified phone for lookups) and forwards with GAS_API_KEY.
 *
 * Loads backend-gas/Code.js, Compliance.js and RiskMitigationActions.js in a vm with stubbed
 * Apps Script services (fake Script Properties; spy Sheets, Drive, Slack, Mongo, UrlFetch).
 * Makes no network calls and reads no real secrets.
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const gas = (f) => fs.readFileSync(path.join(here, '../backend-gas', f), 'utf8')
const KEY = 'test-gas-key-not-real'
const FAKE_PHONE = '5550100001' // 555-01xx: reserved fictional range

const MINIAPP = {
  telegram_mini_app_intake: { DefName: 'Test Person', telegramUserId: '4242' },
  telegram_mini_app_upload: { telegramUserId: '4242', docType: 'id_front', fileName: 'test.jpg', mimeType: 'image/jpeg', base64Data: 'AAAA' },
  telegram_payment_log: { referenceId: 'TEST-1', name: 'Test Person', phone: FAKE_PHONE, amount: 1 },
  telegram_payment_lookup: { phone: FAKE_PHONE },
  telegram_checkin_log: { referenceId: 'TEST-1', name: 'Test Person', phone: FAKE_PHONE },
  telegram_client_update: { referenceId: 'TEST-1', updateType: 'contact', name: 'Test Person', phone: FAKE_PHONE },
  telegram_status_lookup: { phone: FAKE_PHONE },
  telegram_document_lookup: { phone: FAKE_PHONE },
}

function harness({ gasKey = KEY } = {}) {
  const side = []
  const security = []
  const props = gasKey == null ? {} : { GAS_API_KEY: gasKey }
  const spy = (name, ret = { success: true }) => (...args) => { side.push(name); return ret }
  const sheet = new Proxy({}, {
    get: (_, k) => {
      if (k === 'getLastRow') return () => { side.push('Sheet.getLastRow'); return 0 }
      if (k === 'getRange') return () => { side.push('Sheet.getRange'); return { setFontWeight() {} } }
      return spy('Sheet.' + String(k))
    },
  })
  const ctx = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    Logger: { log() {} },
    Session: { getActiveUser: () => ({ getEmail: () => '' }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props[k] === undefined ? null : props[k]), getProperties: () => ({ ...props }) }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    Utilities: {
      newBlob: (s) => { return { getBytes: () => Array.from(Buffer.from(String(s), 'utf8')) } },
      base64Decode: () => { side.push('Utilities.base64Decode'); return [] },
    },
    ContentService: {
      MimeType: { JSON: 'json', JAVASCRIPT: 'js' },
      createTextOutput: (text) => ({ text, setMimeType() { return this } }),
    },
    NotificationService: { sendSlack: spy('NotificationService.sendSlack'), sendSms: spy('NotificationService.sendSms') },
    SpreadsheetApp: { getActiveSpreadsheet: () => { side.push('SpreadsheetApp.getActiveSpreadsheet'); return { getSheetByName: () => sheet, insertSheet: () => sheet } } },
    DriveApp: { getFolderById: () => { side.push('DriveApp.getFolderById'); return { createFile: () => ({ setDescription() {}, getId: () => 'test-file', getUrl: () => 'https://drive.test/file' }) } } },
    UrlFetchApp: { fetch: spy('UrlFetchApp.fetch') },
    MongoLogger: { logCheckIn: spy('MongoLogger.logCheckIn'), logCourtDate: spy('MongoLogger.logCourtDate'), logPayment: spy('MongoLogger.logPayment') },
    sendSlackMessage: spy('sendSlackMessage'),
    getConfig: () => ({ GOOGLE_DRIVE_FOLDER_ID: 'test-folder' }),
  }
  vm.createContext(ctx)
  for (const f of ['Compliance.js', 'RiskMitigationActions.js', 'Code.js']) vm.runInContext(gas(f), ctx, { filename: f })
  ctx.logSecurityEvent = (type, info) => security.push({ type, info })
  ctx.logAccessEvent = () => {}
  ctx.saveTelegramIntakeToQueue = spy('saveTelegramIntakeToQueue', { success: true, via: 'crm' })
  ctx.handleTelegramDocumentLookup = spy('handleTelegramDocumentLookup', { success: true, caseData: null })
  const post = (body, parameter = {}) => {
    const out = ctx.doPost({ parameter, postData: { contents: JSON.stringify(body), length: 1 } })
    return JSON.parse(out.text)
  }
  return { post, side, security }
}

let failed = 0
function check(name, fn) {
  try { fn(); console.log('ok - ' + name) } catch (e) { failed++; console.log('not ok - ' + name + '\n  ' + (e && e.message)) }
}
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'mismatch') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b)) }

for (const [action, extra] of Object.entries(MINIAPP)) {
  check(`${action}: no apiKey → Unauthorized, zero side effects`, () => {
    const h = harness()
    const r = h.post({ action, ...extra })
    eq(r.success, false, action)
    eq(r.error && r.error.code, 'UNAUTHORIZED', action)
    eq(h.side, [], `${action} must not read sheets, write Drive, post Slack or log`)
    eq(h.security.map((s) => s.type), ['UNAUTHORIZED_API_ACCESS'])
  })
  check(`${action}: wrong apiKey → Unauthorized, zero side effects`, () => {
    const h = harness()
    const r = h.post({ action, ...extra, apiKey: 'wrong-key' })
    eq(r.error && r.error.code, 'UNAUTHORIZED', action)
    eq(h.side, [])
  })
  check(`${action}: GAS_API_KEY not configured → Unauthorized even with a key`, () => {
    const h = harness({ gasKey: null })
    const r = h.post({ action, ...extra, apiKey: KEY })
    eq(r.error && r.error.code, 'UNAUTHORIZED', action)
    eq(h.side, [])
  })
  check(`${action}: correct apiKey (as /api/miniapp sends it) → route runs`, () => {
    const h = harness()
    const r = h.post({ action, ...extra, apiKey: KEY })
    if (r.error && r.error.code === 'UNAUTHORIZED') throw new Error(`${action} rejected a valid key`)
    if (h.side.length === 0) throw new Error(`${action} route did not run`)
  })
}

check('bail_school_upload (separate action on the upload route) is not gated by this change', () => {
  const h = harness()
  const r = h.post({ action: 'bail_school_upload', studentId: 'TEST', fileName: 'test.jpg', mimeType: 'image/jpeg', base64Data: 'AAAA' })
  if (r.error && r.error.code === 'UNAUTHORIZED') throw new Error('bail_school_upload should be unchanged')
})

check('every Mini App action is in GAS_KEYED_DOPOST_ACTIONS_', () => {
  const src = gas('Code.js')
  const start = src.indexOf('var GAS_KEYED_DOPOST_ACTIONS_ = {')
  if (start === -1) throw new Error('GAS_KEYED_DOPOST_ACTIONS_ not found')
  const block = src.slice(start, src.indexOf('};', start))
  const listed = [...block.matchAll(/^\s+([a-z_]+): true/gm)].map((m) => m[1])
  eq(Object.keys(MINIAPP).filter((a) => !listed.includes(a)), [])
})

if (failed) { console.log(`${failed} failed`); process.exit(1) }
console.log('all passed')
