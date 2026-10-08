#!/usr/bin/env node
/**
 * GAS doPost telegram_payment_log / telegram_checkin_log Slack text must show a
 * masked name (first + last initial) and masked phone (last 4), never the full
 * client-typed values. Loads Code.js + Compliance.js in a vm with stubbed Apps
 * Script services. No network; mock Slack; fake 555-01xx fixtures.
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const gas = (f) => fs.readFileSync(path.join(here, '../backend-gas', f), 'utf8')
const KEY = 'test-gas-key-not-real'
const FULL_NAME = 'Jane Marie Doe'
const FULL_PHONE = '5550100001'

function harness() {
  const slack = []
  const side = []
  const props = { GAS_API_KEY: KEY }
  const sheet = new Proxy({}, {
    get: (_, k) => {
      if (k === 'getLastRow') return () => 0
      if (k === 'getRange') return () => ({ setFontWeight() {} })
      if (k === 'appendRow') return (...args) => { side.push(['appendRow', args[0]]); }
      return () => {}
    },
  })
  const ctx = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    Logger: { log() {} },
    Session: { getActiveUser: () => ({ getEmail: () => '' }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props[k] === undefined ? null : props[k]), getProperties: () => ({ ...props }) }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    Utilities: { newBlob: (s) => ({ getBytes: () => Array.from(Buffer.from(String(s), 'utf8')) }) },
    ContentService: { MimeType: { JSON: 'json', JAVASCRIPT: 'js' }, createTextOutput: (text) => ({ text, setMimeType() { return this } }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, insertSheet: () => sheet }) },
    MongoLogger: { logPayment: () => {}, logCheckIn: () => {} },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => 200, getContentText: () => '{}' }) },
    getConfig: () => ({ SLACK_WEBHOOK_INTAKE: 'https://hooks.slack.test/fake' }),
  }
  vm.createContext(ctx)
  for (const f of ['Compliance.js', 'Code.js']) vm.runInContext(gas(f), ctx, { filename: f })
  ctx.logSecurityEvent = () => {}
  ctx.logAccessEvent = () => {}
  // Code.js defines sendSlackMessage; replace it after load so no real Slack call can happen.
  ctx.sendSlackMessage = (channel, message) => { slack.push({ channel, message }) }
  const post = (body) => {
    const out = ctx.doPost({ parameter: {}, postData: { contents: JSON.stringify(body), length: 1 } })
    return JSON.parse(out.text)
  }
  return { post, slack, side, ctx }
}

let failed = 0
function check(name, fn) {
  try { fn(); console.log('ok - ' + name) } catch (e) { failed++; console.log('not ok - ' + name + '\n  ' + (e && e.message)) }
}
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'mismatch') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b)) }

check('slackMaskName_: first name + last initial', () => {
  const { ctx } = harness()
  eq(ctx.slackMaskName_('Jane Marie Doe'), 'Jane D.')
  eq(ctx.slackMaskName_('Jane'), 'Jane')
  eq(ctx.slackMaskName_(''), 'Unknown')
  eq(ctx.slackMaskName_(null), 'Unknown')
})

check('slackMaskPhone_: last 4 digits only', () => {
  const { ctx } = harness()
  eq(ctx.slackMaskPhone_('5550100001'), '…0001')
  eq(ctx.slackMaskPhone_('+1 (555) 010-0001'), '…0001')
  eq(ctx.slackMaskPhone_('12'), 'N/A')
  eq(ctx.slackMaskPhone_(''), 'N/A')
})

check('telegram_payment_log Slack text is masked (no full name or phone)', () => {
  const h = harness()
  const r = h.post({
    action: 'telegram_payment_log',
    apiKey: KEY,
    referenceId: 'TEST-1',
    name: FULL_NAME,
    phone: FULL_PHONE,
    amount: 100,
    paymentType: 'premium',
  })
  eq(r.success, true)
  eq(h.slack.length, 1)
  const msg = h.slack[0].message
  if (msg.includes(FULL_NAME)) throw new Error('full name in Slack: ' + msg)
  if (msg.includes(FULL_PHONE)) throw new Error('full phone in Slack: ' + msg)
  if (msg.includes('555010')) throw new Error('phone prefix in Slack: ' + msg)
  if (!msg.includes('Jane D.')) throw new Error('expected Jane D.: ' + msg)
  if (!msg.includes('…0001') && !msg.includes('\u2026' + '0001')) throw new Error('expected last4: ' + msg)
})

check('telegram_checkin_log Slack text is masked (no full name or phone)', () => {
  const h = harness()
  const r = h.post({
    action: 'telegram_checkin_log',
    apiKey: KEY,
    referenceId: 'TEST-2',
    name: FULL_NAME,
    phone: FULL_PHONE,
    hasSelfie: true,
    latitude: 26.6,
    longitude: -81.8,
  })
  eq(r.success, true)
  eq(h.slack.length, 1)
  const msg = h.slack[0].message
  if (msg.includes(FULL_NAME)) throw new Error('full name in Slack: ' + msg)
  if (msg.includes(FULL_PHONE)) throw new Error('full phone in Slack: ' + msg)
  if (!msg.includes('Jane D.')) throw new Error('expected Jane D.: ' + msg)
  if (!msg.includes('…0001') && !msg.includes('\u2026' + '0001')) throw new Error('expected last4: ' + msg)
})

check('sheet rows still store the full values (masking is Slack-only)', () => {
  const h = harness()
  h.post({ action: 'telegram_payment_log', apiKey: KEY, referenceId: 'TEST-3', name: FULL_NAME, phone: FULL_PHONE, amount: 1 })
  const row = h.side.find((s) => s[0] === 'appendRow')
  if (!row) throw new Error('no sheet write')
  if (!row[1].includes(FULL_NAME) || !row[1].includes(FULL_PHONE)) throw new Error('sheet should keep full values: ' + JSON.stringify(row[1]))
})

if (failed) { console.log(`${failed} failed`); process.exit(1) }
console.log('all passed')
