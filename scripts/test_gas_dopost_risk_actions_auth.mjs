#!/usr/bin/env node
/**
 * GAS doPost: actions that send messages or return client PII must require the GAS API key,
 * checked BEFORE any handler runs. Browser mini-app actions stay reachable (they cannot hold
 * the key; they need Telegram initData verification first).
 *
 * Loads backend-gas/Code.js, Compliance.js and RiskMitigationActions.js in a vm with stubbed
 * Apps Script services (fake Script Properties, spy SMS/Slack/Telegram/Spreadsheet/UrlFetch).
 * Makes no network calls and reads no real secrets.
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const gas = (f) => fs.readFileSync(path.join(here, '../backend-gas', f), 'utf8')
const KEY = 'test-gas-key-not-real'
const FAKE_PHONE = '+15550100000' // 555-01xx: reserved fictional range

const KEYED = {
  post_slack_message: { channel: '#alerts', message: 'test' },
  get_upcoming_court_dates: { hoursAhead: 48 },
  send_court_reminders: { reminders: [{ phone: FAKE_PHONE, name: 'Test Person', message: 'test' }] },
  get_daily_stats: {},
  get_unacknowledged_reminders: { hoursUntilCourt: 24 },
  escalate_to_cosigner: { escalations: [{ cosignerPhone: FAKE_PHONE, cosignerSMS: 'test', slackMessage: 'test' }] },
  get_forfeiture_cases: {},
  get_recent_client_messages: { hoursSince: 4 },
  flag_high_stress_case: { flagged: [{ caseNumber: 'TEST-1' }] },
  schedule_court_date: { chatId: '1', name: 'Test Person', courtDate: '2026-10-09', caseNumber: 'TEST-1' },
  send_signing_link: { chatId: '1', caseNumber: 'TEST-1', docType: 'test', signerName: 'Test Person' },
  telegram_get_signing_url: { caseNumber: 'TEST-1' },
  telegram_document_status: { caseNumber: 'TEST-1' },
  get_packet_manifest: { caseNumber: 'TEST-1' },
  twilio_check_in: { fromNumber: FAKE_PHONE, body: 'test' },
}

// Handler each keyed action reaches once authorized (stubbed so nothing real runs).
const HANDLER = {
  post_slack_message: 'handlePostSlackMessage',
  get_upcoming_court_dates: 'handleGetUpcomingCourtDates',
  send_court_reminders: 'handleSendCourtReminders',
  get_daily_stats: 'handleGetDailyStats',
  get_unacknowledged_reminders: 'handleGetUnacknowledgedReminders',
  escalate_to_cosigner: 'handleEscalateToCosigner',
  get_forfeiture_cases: 'handleGetForfeitureCases',
  get_recent_client_messages: 'handleGetRecentClientMessages',
  flag_high_stress_case: 'handleFlagHighStressCase',
  schedule_court_date: 'TG_scheduleCourtDateSequence',
  send_signing_link: 'TG_sendSigningDeepLink',
  telegram_get_signing_url: 'handleTelegramGetSigningUrl',
  telegram_document_status: 'handleTelegramDocumentStatus',
  get_packet_manifest: 'handleGetPacketManifest',
  twilio_check_in: 'handleClientCheckInReply',
}

function harness({ gasKey = KEY, stubHandlers = false } = {}) {
  const side = [] // every outbound/side-effecting call
  const handled = []
  const security = []
  const props = gasKey == null ? {} : { GAS_API_KEY: gasKey }
  const spy = (name) => (...args) => { side.push(name); return { success: true } }
  const sheet = new Proxy({}, { get: (_, k) => (k === 'getLastRow' ? () => 0 : spy('Sheet.' + String(k))) })
  const ctx = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    Logger: { log() {} },
    Session: { getActiveUser: () => ({ getEmail: () => '' }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props[k] === undefined ? null : props[k]), getProperties: () => ({ ...props }) }) },
    Utilities: { newBlob: (s) => ({ getBytes: () => Array.from(Buffer.from(String(s), 'utf8')) }) },
    ContentService: {
      MimeType: { JSON: 'json', JAVASCRIPT: 'js' },
      createTextOutput: (text) => ({ text, setMimeType() { return this } }),
    },
    NotificationService: { sendSlack: spy('NotificationService.sendSlack'), sendSms: spy('NotificationService.sendSms') },
    SpreadsheetApp: { getActiveSpreadsheet: () => { side.push('SpreadsheetApp.getActiveSpreadsheet'); return { getSheetByName: () => sheet, insertSheet: () => sheet } } },
    UrlFetchApp: { fetch: spy('UrlFetchApp.fetch') },
    MongoLogger: { logCheckIn: spy('MongoLogger.logCheckIn'), logCourtDate: spy('MongoLogger.logCourtDate'), logPayment: spy('MongoLogger.logPayment') },
    sendSlackMessage: spy('sendSlackMessage'),
    getConfig: () => ({}),
  }
  vm.createContext(ctx)
  for (const f of ['Compliance.js', 'RiskMitigationActions.js', 'Code.js']) vm.runInContext(gas(f), ctx, { filename: f })
  ctx.logSecurityEvent = (type, info) => security.push({ type, info })
  ctx.logAccessEvent = () => {}
  // Handlers defined in other GAS files (Telegram_Notifications.js, ClientCheckInSystem.js) or
  // missing: always spy them. RiskMitigationActions handlers: spy only when asked.
  for (const [action, fn] of Object.entries(HANDLER)) {
    if (stubHandlers || typeof ctx[fn] !== 'function') ctx[fn] = (...args) => { handled.push(action); side.push(fn); return { success: true, stub: fn } }
  }
  ctx.saveTelegramIntakeToQueue = (...args) => { handled.push('telegram_mini_app_intake'); return { success: true, via: 'crm' } }
  const post = (body, parameter = {}) => {
    const out = ctx.doPost({ parameter, postData: { contents: JSON.stringify(body), length: 1 } })
    return JSON.parse(out.text)
  }
  return { post, side, handled, security }
}

let failed = 0
function check(name, fn) {
  try { fn(); console.log('ok - ' + name) } catch (e) { failed++; console.log('not ok - ' + name + '\n  ' + (e && e.message)) }
}
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'mismatch') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b)) }

for (const [action, extra] of Object.entries(KEYED)) {
  check(`${action}: no apiKey → Unauthorized, zero side effects`, () => {
    const h = harness()
    const r = h.post({ action, ...extra })
    eq(r.success, false, action)
    eq(r.error && r.error.code, 'UNAUTHORIZED', action)
    eq(h.side, [], `${action} must not text, post, fetch or touch sheets`)
    eq(h.handled, [], `${action} handler must not run`)
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
  check(`${action}: correct apiKey (body or ?apiKey=) → handler runs`, () => {
    for (const viaQuery of [false, true]) {
      const h = harness({ stubHandlers: true })
      const body = viaQuery ? { action, ...extra } : { action, ...extra, apiKey: KEY }
      const r = h.post(body, viaQuery ? { apiKey: KEY } : {})
      if (r.error && r.error.code === 'UNAUTHORIZED') throw new Error(`${action} rejected a valid key (viaQuery=${viaQuery})`)
      eq(h.handled, [action], `${action} handler should run once`)
    }
  })
}

check('real handler path: send_court_reminders with the key texts through NotificationService (spy)', () => {
  const h = harness()
  const r = h.post({ action: 'send_court_reminders', apiKey: KEY, reminders: [{ phone: FAKE_PHONE, name: 'Test Person', message: 'test' }] })
  eq(r.success, true)
  if (!h.side.includes('NotificationService.sendSms')) throw new Error('expected the SMS spy to be called once authorized: ' + JSON.stringify(h.side))
})

check('browser mini-app action telegram_mini_app_intake still works without a key (not gated yet)', () => {
  const h = harness()
  const r = h.post({ action: 'telegram_mini_app_intake', DefName: 'Test Person' })
  if (r.error && r.error.code === 'UNAUTHORIZED') throw new Error('mini-app intake must not be gated in this change')
  eq(h.handled, ['telegram_mini_app_intake'])
})

check('keyed list in Code.js matches this test (no silent additions or removals)', () => {
  const src = gas('Code.js')
  const block = src.slice(src.indexOf('var GAS_KEYED_DOPOST_ACTIONS_ = {'), src.indexOf('};', src.indexOf('var GAS_KEYED_DOPOST_ACTIONS_ = {')))
  const listed = [...block.matchAll(/^\s+([a-z_]+): true/gm)].map((m) => m[1]).sort()
  eq(listed, Object.keys(KEYED).sort())
})

if (failed) { console.log(`${failed} failed`); process.exit(1) }
console.log('all passed')
