#!/usr/bin/env node
/**
 * GAS doPost ?source=caller_context returns caller name, defendant name and court date by
 * phone. It must require GAS_API_KEY (?apiKey=) and fail closed when the Script Property is
 * unset. Loads the real Code.js, Compliance.js, SOC2_WebhookHandler.js and the caller-context
 * handler in a vm with stubbed Apps Script services (fake Script Properties and a fake
 * IntakeQueue row). No network, no real secrets or phone numbers (555-01xx).
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const gas = (f) => fs.readFileSync(path.join(here, '../backend-gas', f), 'utf8')
const KEY = 'test-gas-key-not-real'
const PHONE = '5550100001'

function harness({ gasKey = KEY } = {}) {
  const side = []
  const security = []
  const props = { SPREADSHEET_ID: 'test-sheet' }
  if (gasKey != null) props.GAS_API_KEY = gasKey
  const sheet = {
    getDataRange: () => { side.push('Sheet.getDataRange'); return { getValues: () => [
      ['IndemnitorPhone', 'IndemnitorName', 'DefendantName', 'CourtDate'],
      [PHONE, 'Test Indemnitor', 'Test Defendant', '2026-12-01'],
    ] } },
    getLastRow: () => 2,
  }
  const ctx = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    Logger: { log() {} },
    Session: { getActiveUser: () => ({ getEmail: () => '' }), getScriptTimeZone: () => 'America/New_York' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props[k] === undefined ? null : props[k]), getProperties: () => ({ ...props }) }) },
    CacheService: { getScriptCache: () => ({ get: () => { side.push('Cache.get'); return null }, put: () => {} }) },
    Utilities: { formatDate: () => '2026-10-08', newBlob: (s) => ({ getBytes: () => Array.from(Buffer.from(String(s), 'utf8')) }) },
    ContentService: { MimeType: { JSON: 'json', TEXT: 'text', JAVASCRIPT: 'js' }, createTextOutput: (text) => ({ text, setMimeType() { return this } }) },
    SpreadsheetApp: {
      openById: () => { side.push('SpreadsheetApp.openById'); return { getSheetByName: () => sheet } },
      getActiveSpreadsheet: () => { side.push('SpreadsheetApp.getActive'); return { getSheetByName: () => sheet } },
    },
    UrlFetchApp: { fetch: () => { side.push('UrlFetchApp.fetch'); return { getResponseCode: () => 200, getContentText: () => '{}' } } },
  }
  vm.createContext(ctx)
  for (const f of ['Compliance.js', 'ElevenLabs_WebhookHandler.js', 'SOC2_WebhookHandler.js', 'Code.js']) vm.runInContext(gas(f), ctx, { filename: f })
  ctx.logSecurityEvent = (type, info) => security.push({ type, info })
  ctx.logAccessEvent = () => {}
  const post = (parameter) => {
    const out = ctx.doPost({ parameter, postData: { contents: '{}', length: 2 } })
    return JSON.parse(out.text)
  }
  return { post, side, security }
}

let failed = 0
function check(name, fn) {
  try { fn(); console.log('ok - ' + name) } catch (e) { failed++; console.log('not ok - ' + name + '\n  ' + (e && e.message)) }
}
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'mismatch') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b)) }

check('caller_context with no key → Unauthorized, sheet never read', () => {
  const h = harness()
  const r = h.post({ source: 'caller_context', phone: PHONE })
  eq(r.success, false); eq(r.message, 'Unauthorized')
  eq(h.side, [], 'no cache or sheet access')
  eq(h.security.length, 1)
})
check('caller_context with wrong key → Unauthorized, sheet never read', () => {
  const h = harness()
  const r = h.post({ source: 'caller_context', phone: PHONE, apiKey: 'wrong-key' })
  eq(r.message, 'Unauthorized'); eq(h.side, [])
})
check('caller_context with ?secret= (ElevenLabs tool secret style) is not accepted', () => {
  const h = harness()
  const r = h.post({ source: 'caller_context', phone: PHONE, secret: KEY })
  eq(r.message, 'Unauthorized'); eq(h.side, [])
})
check('GAS_API_KEY unset → Unauthorized even if a key is sent', () => {
  const h = harness({ gasKey: null })
  const r = h.post({ source: 'caller_context', phone: PHONE, apiKey: KEY })
  eq(r.message, 'Unauthorized'); eq(h.side, [])
})
check('correct key → handler runs and returns the caller context', () => {
  const h = harness()
  const r = h.post({ source: 'caller_context', phone: PHONE, apiKey: KEY })
  if (r.message === 'Unauthorized') throw new Error('valid key rejected')
  if (!h.side.includes('SpreadsheetApp.openById')) throw new Error('handler did not read the sheet: ' + JSON.stringify(h.side))
})
if (failed) { console.log(`${failed} failed`); process.exit(1) }
console.log('all passed')
