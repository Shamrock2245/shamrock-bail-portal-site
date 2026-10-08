#!/usr/bin/env node
/**
 * GAS doPost: action post_slack_message must require the GAS API key.
 *
 * Loads backend-gas/Code.js, Compliance.js and RiskMitigationActions.js in a vm with stubbed
 * Apps Script services (fake Script Properties, a spy NotificationService) and calls doPost.
 * Makes no network calls and reads no real secrets.
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const gas = (f) => fs.readFileSync(path.join(here, '../backend-gas', f), 'utf8')
const KEY = 'test-gas-key-not-real'

function harness({ gasKey = KEY } = {}) {
  const slack = []
  const security = []
  const props = gasKey == null ? {} : { GAS_API_KEY: gasKey }
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
    NotificationService: { sendSlack: (channel, text) => { slack.push({ channel, text }); return { success: true } } },
  }
  vm.createContext(ctx)
  for (const f of ['Compliance.js', 'RiskMitigationActions.js', 'Code.js']) vm.runInContext(gas(f), ctx, { filename: f })
  // Spy on security logging (defined in another GAS file in production).
  ctx.logSecurityEvent = (type, info) => security.push({ type, info })
  ctx.logAccessEvent = () => {}
  const post = (body, parameter = {}) => {
    const out = ctx.doPost({ parameter, postData: { contents: JSON.stringify(body), length: 1 } })
    return JSON.parse(out.text)
  }
  return { post, slack, security }
}

let failed = 0
function check(name, fn) {
  try { fn(); console.log('ok - ' + name) } catch (e) { failed++; console.log('not ok - ' + name + '\n  ' + (e && e.message)) }
}
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || 'mismatch') + ': ' + JSON.stringify(a) + ' !== ' + JSON.stringify(b)) }

const MSG = { action: 'post_slack_message', channel: '#alerts', message: 'hello' }

check('no apiKey → Unauthorized, nothing posted', () => {
  const h = harness()
  const r = h.post(MSG)
  eq(r.success, false)
  eq(r.error && r.error.code, 'UNAUTHORIZED')
  eq(h.slack, [], 'Slack must not be called')
  eq(h.security.map((s) => s.type), ['UNAUTHORIZED_API_ACCESS'])
})

check('wrong apiKey → Unauthorized, nothing posted', () => {
  const h = harness()
  const r = h.post({ ...MSG, apiKey: 'wrong-key' })
  eq(r.error && r.error.code, 'UNAUTHORIZED')
  eq(h.slack, [])
})

check('GAS_API_KEY not configured → Unauthorized even with a key', () => {
  const h = harness({ gasKey: null })
  const r = h.post({ ...MSG, apiKey: KEY })
  eq(r.error && r.error.code, 'UNAUTHORIZED')
  eq(h.slack, [])
})

check('correct apiKey in body → posted', () => {
  const h = harness()
  const r = h.post({ ...MSG, apiKey: KEY })
  eq(r, { success: true, channel: '#alerts' })
  eq(h.slack, [{ channel: '#alerts', text: 'hello' }])
})

check('correct ?apiKey= query parameter → posted (same merge as other routes)', () => {
  const h = harness()
  const r = h.post(MSG, { apiKey: KEY })
  eq(r.success, true)
  eq(h.slack.length, 1)
})

if (failed) { console.log(`${failed} failed`); process.exit(1) }
console.log('all passed')
