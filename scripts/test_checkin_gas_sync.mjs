#!/usr/bin/env node
/**
 * Checks src/backend/location.jsw (portal check-in → GAS logDefendantLocation).
 *
 * GAS doPost refuses any call without a valid apiKey, so the check-in sync must
 * send GAS_API_KEY from Wix Secrets on the server. Portal users are anonymous
 * Wix visitors (custom session auth), so the UserLocations write needs suppressAuth.
 *
 * Runs location.jsw with stubbed Wix modules and a fake fetch. Makes no network
 * calls and reads no real secrets.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = fs.readFileSync(path.join(here, '../src/backend/location.jsw'), 'utf8')

function load(stubs) {
  let code = src.replace(/^\s*import\s+(.+?)\s+from\s+['"]([^'"]+)['"];?[^\n]*$/gm, (_m, what, mod) => {
    const key = JSON.stringify(mod)
    if (what.trim().startsWith('{')) return `const ${what} = __stubs[${key}];`
    return `const ${what.trim()} = __stubs[${key}].default;`
  })
  code = code.replace(/^export\s+/gm, '')
  code += '\nreturn { saveUserLocation, getLastLocation };'
  // eslint-disable-next-line no-new-func
  return new Function('__stubs', code)(stubs)
}

const GAS_URL = 'https://script.example.test/macros/s/TEST/exec'
const KEY = 'test-gas-key-not-real'

function harness({ gasKey = KEY, gasUrl = GAS_URL, session = { personId: 'P-1', email: 'p@example.test' }, gasReply = { success: true }, enforcePermissions = true } = {}) {
  const calls = { inserts: [], finds: [], fetches: [], errors: [] }
  const query = {
    eq() { return query },
    descending() { return query },
    limit() { return query },
    async find(opts) {
      calls.finds.push(opts || null)
      if (enforcePermissions && (!opts || opts.suppressAuth !== true)) throw new Error('WDE0027: permission denied (anonymous visitor)')
      return { items: [] }
    }
  }
  const stubs = {
    'wix-data': {
      default: {
        async insert(collection, item, opts) {
          calls.inserts.push({ collection, item, opts: opts || null })
          // UserLocations insert permission is SITE_MEMBER_AUTHOR; portal callers are not Wix members.
          if (enforcePermissions && (!opts || opts.suppressAuth !== true)) throw new Error('WDE0027: permission denied (anonymous visitor)')
          return { _id: 'row-1', ...item }
        },
        query() { return query }
      }
    },
    'wix-fetch': { fetch: async () => { throw new Error('unexpected wix-fetch call') } },
    'backend/secretsManager': { getGasWebAppUrl: async () => gasUrl },
    'wix-secrets-backend': {
      getSecret: async (name) => {
        if (name === 'GAS_API_KEY') return gasKey
        if (name === 'GOOGLE_MAPS_API_KEY') return ''
        throw new Error('unexpected secret ' + name)
      }
    },
    'backend/utils': {
      fetchWithRetry: async (url, options) => {
        calls.fetches.push({ url, options })
        return { ok: true, status: 200, json: async () => gasReply }
      }
    },
    'backend/portal-auth': { validateCustomSession: async () => session },
    'backend/fraud-detection': { analyzeLocationRisk: () => ({ riskLevel: 'LOW', riskFactors: [] }) }
  }
  const origError = console.error
  console.error = (...a) => { calls.errors.push(a.map(String).join(' ')) }
  const mod = load(stubs)
  return { mod, calls, restore: () => { console.error = origError } }
}

let failed = 0
async function test(name, fn) {
  try {
    await fn()
    console.log('ok   ' + name)
  } catch (e) {
    failed += 1
    console.log('FAIL ' + name + ': ' + e.message)
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg) }

await test('check-in saves to UserLocations for a custom-session (non-member) caller', async () => {
  const h = harness()
  try {
    const res = await h.mod.saveUserLocation(26.64, -81.87, 'Silent Ping', '', 'tok', {})
    assert(res.success === true, 'saveUserLocation failed: ' + res.message)
    assert(h.calls.inserts.length === 1 && h.calls.inserts[0].collection === 'UserLocations', 'no UserLocations insert')
    assert(h.calls.inserts[0].opts && h.calls.inserts[0].opts.suppressAuth === true, 'insert must use suppressAuth')
  } finally { h.restore() }
})

await test('GAS logDefendantLocation call carries GAS_API_KEY in the POST body', async () => {
  const h = harness()
  try {
    await h.mod.saveUserLocation(26.64, -81.87, 'Silent Ping', '', 'tok', {})
    assert(h.calls.fetches.length === 1, 'expected one GAS call, got ' + h.calls.fetches.length)
    const f = h.calls.fetches[0]
    assert(f.url === GAS_URL, 'GAS URL changed (key must not be put in the URL)')
    assert(f.options.method === 'POST', 'GAS call must be POST')
    const body = JSON.parse(f.options.body)
    assert(body.action === 'logDefendantLocation', 'wrong action')
    assert(body.apiKey === KEY, 'apiKey missing from GAS body')
    assert(body.data && body.data.memberId === 'P-1', 'check-in data missing')
  } finally { h.restore() }
})

await test('apiKey is sent even when the Wix write is allowed (isolates the GAS auth gap)', async () => {
  const h = harness({ enforcePermissions: false })
  try {
    await h.mod.saveUserLocation(26.64, -81.87, '', '', 'tok', {})
    assert(h.calls.fetches.length === 1, 'expected one GAS call')
    const body = JSON.parse(h.calls.fetches[0].options.body)
    assert(body.apiKey === KEY, 'GAS call has no apiKey, so GAS doPost answers Unauthorized: Invalid API Key')
  } finally { h.restore() }
})

await test('API key is never returned to the browser', async () => {
  const h = harness()
  try {
    const res = await h.mod.saveUserLocation(26.64, -81.87, '', '', 'tok', {})
    assert(!JSON.stringify(res).includes(KEY), 'response leaks the GAS key')
  } finally { h.restore() }
})

await test('no keyless GAS call when GAS_API_KEY is missing; check-in still saved', async () => {
  const h = harness({ gasKey: '' })
  try {
    const res = await h.mod.saveUserLocation(26.64, -81.87, '', '', 'tok', {})
    assert(res.success === true, 'check-in should still succeed in Wix')
    assert(h.calls.fetches.length === 0, 'must not call GAS without a key')
    assert(h.calls.errors.some(e => e.includes('GAS_API_KEY missing')), 'missing-key error not logged')
  } finally { h.restore() }
})

await test('GAS refusal (HTTP 200, success:false) is logged', async () => {
  const h = harness({ gasReply: { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized: Invalid API Key' } } })
  try {
    await h.mod.saveUserLocation(26.64, -81.87, '', '', 'tok', {})
    assert(h.calls.errors.some(e => e.includes('GAS refused check-in sync') && e.includes('Invalid API Key')), 'refusal not logged')
  } finally { h.restore() }
})

await test('invalid session writes nothing and calls nothing', async () => {
  const h = harness({ session: null })
  try {
    const res = await h.mod.saveUserLocation(26.64, -81.87, '', '', 'tok', {})
    assert(res.success === false, 'should reject invalid session')
    assert(h.calls.inserts.length === 0 && h.calls.fetches.length === 0, 'wrote or called GAS without a session')
  } finally { h.restore() }
})

await test('exported getLastLocation keeps normal permissions (no suppressAuth)', async () => {
  const h = harness()
  try {
    await h.mod.getLastLocation('someone-else')
    const last = h.calls.finds[h.calls.finds.length - 1]
    assert(!(last && last.suppressAuth), 'exported getLastLocation must not bypass permissions')
  } finally { h.restore() }
})

if (failed) {
  console.error(failed + ' check-in sync test(s) failed')
  process.exit(1)
}
console.log('check-in sync tests passed')
