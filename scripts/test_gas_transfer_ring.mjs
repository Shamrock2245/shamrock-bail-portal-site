#!/usr/bin/env node
/**
 * Shannon live-person transfer names four ring lines. Spoken office stays
 * 239-332-2245. The handler still POSTs the existing Netlify
 * twilio-transfer-office URL and does not build Dial TwiML.
 * Loads ElevenLabs_WebhookHandler.js in a vm. No network. Fake tool secret.
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const gasDir = path.join(root, 'backend-gas')
const RING = ['239-332-2245', '239-955-0301', '239-955-0178', '239-955-0314']
const LABEL = '239-332-2245, 239-955-0301, 239-955-0178, and 239-955-0314'
const OLD_TWO = '239-332-2245 and 239-955-0301'
const TRANSFER_URL = 'https://shamrock-telegram.netlify.app/api/twilio-transfer-office'
const FAKE_SECRET = 'test-tool-secret-not-real'
const CALLER = '5550100199'

const agentSrc = fs.readFileSync(path.join(gasDir, 'ElevenLabs_AfterHoursAgent.js'), 'utf8')
const webhookSrc = fs.readFileSync(path.join(gasDir, 'ElevenLabs_WebhookHandler.js'), 'utf8')

let failed = 0
function check(name, fn) {
  try {
    fn()
    console.log('ok - ' + name)
  } catch (e) {
    failed++
    console.log('not ok - ' + name + '\n  ' + (e && e.message))
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed')
}

function promptText() {
  const match = agentSrc.match(/systemPrompt:\s*\[(.*?)\]\.join\('\\n'\)/s)
  assert(match, 'systemPrompt block missing')
  const lines = [...match[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) => JSON.parse('"' + m[1] + '"'))
  return lines.join('\n')
}

function harness({ secret = FAKE_SECRET, fetchImpl } = {}) {
  const fetches = []
  const slack = []
  const desk = []
  const ctx = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    Logger: { log() {} },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (k === 'ELEVENLABS_TOOL_SECRET' ? secret : null),
      }),
    },
    UrlFetchApp: {
      fetch: (url, opts) => {
        fetches.push({ url, opts })
        if (fetchImpl) return fetchImpl(url, opts)
        return {
          getResponseCode: () => 200,
          getContentText: () => JSON.stringify({ success: true }),
        }
      },
    },
    ContentService: {
      MimeType: { JSON: 'json', TEXT: 'text' },
      createTextOutput: (text) => ({ text, setMimeType() { return this } }),
    },
    getConfig: () => ({ SLACK_WEBHOOK_SHAMROCK: 'https://hooks.slack.test/fake' }),
    sendSlackMessage: (channel, message) => { slack.push({ channel, message }) },
    notifyShannonStaffDesk_: (message, phone) => { desk.push({ message, phone }) },
  }
  vm.createContext(ctx)
  vm.runInContext(webhookSrc, ctx, { filename: 'ElevenLabs_WebhookHandler.js' })
  return { ctx, fetches, slack, desk }
}

check('backend-gas no longer hardcodes the two-number transfer list', () => {
  const hits = []
  for (const name of fs.readdirSync(gasDir)) {
    if (!name.endsWith('.js')) continue
    const text = fs.readFileSync(path.join(gasDir, name), 'utf8')
    if (text.includes(OLD_TWO)) hits.push(name)
  }
  assert(hits.length === 0, 'still has two-number list: ' + hits.join(', '))
})

check('prompt names all four ring lines and still speaks only the office number', () => {
  const prompt = promptText()
  for (const n of RING) assert(prompt.includes(n), 'prompt missing ' + n)
  assert(prompt.includes(LABEL), 'prompt missing full ring label')
  assert(prompt.includes('which rings ' + LABEL + ' together'), 'environment ring sentence')
  assert(prompt.includes('connect this live call to ' + LABEL + ' at the same time'), 'tool ring sentence')
  assert(prompt.includes('First pickup wins.'), 'first pickup wins')
  assert(prompt.includes('First staff member to pick up wins.'), 'first staff pickup')
  assert(prompt.includes('Say 239-332-2245.'), 'spoken office')
  assert(prompt.includes('Never say 727-295-2245'), 'never speak 727')
  assert(prompt.includes('Never tell them to call 727-295-2245'), 'never give 727')
  assert(!prompt.includes(OLD_TWO), 'prompt still has two-number list')
  assert(!prompt.includes('727-295-2245 and'), '727 must not be a ring target')
})

check('transfer tool dials twilio-transfer-office and names the four-line ring', () => {
  const h = harness()
  const out = h.ctx.toolTransferToBondsman({
    caller_phone: CALLER,
    reason: 'Caller asked for a person',
    call_sid: 'CA_test_not_real',
  })
  const body = JSON.parse(out.text)
  assert(h.ctx.SHANNON_TRANSFER_RING_LABEL === LABEL, 'ring label constant')
  assert(h.fetches.length === 1, 'one transfer POST')
  assert(h.fetches[0].url === TRANSFER_URL, 'transfer URL changed: ' + h.fetches[0].url)
  const payload = JSON.parse(h.fetches[0].opts.payload)
  assert(payload.call_sid === 'CA_test_not_real', 'call_sid')
  assert(payload.caller_phone === CALLER, 'caller_phone')
  assert(payload.reason === 'shannon_transfer', 'reason')
  assert(webhookSrc.includes("var url = '" + TRANSFER_URL + "'"), 'URL literal')
  assert(h.slack.length === 1, 'slack alert')
  assert(h.slack[0].message.includes('Ringing: ' + LABEL), 'slack ring label')
  for (const n of RING) assert(h.slack[0].message.includes(n), 'slack missing ' + n)
  assert(!h.slack[0].message.includes('727'), 'slack must not name 727')
  assert(h.desk.length === 1, 'desk text')
  assert(h.desk[0].message.includes('Ringing ' + LABEL), 'desk ring label')
  assert(h.desk[0].phone === CALLER, 'desk skip phone')
  assert(body.status === 'connecting', 'status')
  assert(body.message.includes('239-332-2245'), 'spoken office')
  assert(!body.message.includes('955-'), 'spoken reply stays the office number')
  assert(!body.message.includes('727'), 'spoken reply never 727')
})

check('failed live redirect still speaks 239-332-2245 and still names the ring', () => {
  const h = harness({
    fetchImpl: () => ({
      getResponseCode: () => 500,
      getContentText: () => JSON.stringify({ success: false }),
    }),
  })
  const out = h.ctx.toolTransferToBondsman({ caller_phone: CALLER, call_sid: 'CA_test_fail' })
  const body = JSON.parse(out.text)
  assert(h.fetches[0].url === TRANSFER_URL, 'failure path URL')
  assert(body.status === 'transfer_requested', 'fallback status')
  assert(body.message.includes('239-332-2245'), 'fallback office number')
  assert(!body.message.includes('955-'), 'fallback does not recite the ring')
  assert(h.slack[0].message.includes(LABEL), 'slack still names the ring')
  assert(h.desk[0].message.includes(LABEL), 'desk still names the ring')
})

check('missing tool secret does not invent a Dial and still alerts the ring', () => {
  const h = harness({ secret: '' })
  const out = h.ctx.toolTransferToBondsman({ caller_phone: CALLER, call_sid: 'CA_test_nosecret' })
  const body = JSON.parse(out.text)
  assert(h.fetches.length === 0, 'no fetch without the tool secret')
  assert(body.status === 'transfer_requested', 'fallback when Dial cannot start')
  assert(body.message.includes('239-332-2245'), 'office number')
  assert(h.desk[0].message.includes(LABEL), 'desk ring')
})

if (failed) {
  console.log(failed + ' failed')
  process.exit(1)
}
console.log('ok')
