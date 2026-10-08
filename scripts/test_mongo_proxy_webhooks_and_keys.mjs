#!/usr/bin/env node
/**
 * mongo-proxy: webhook authentication (/twilio, /telegram, /wix-intake) and per-caller keys
 * (PROXY_API_KEY_GAS / PROXY_API_KEY_VELO with a transitional legacy PROXY_API_KEY).
 *
 * index.js is loaded for real with @google-cloud/functions-framework and mongodb stubbed,
 * so these tests exercise the deployed routing. No network, no Mongo, no npm install.
 *
 * Run: node --test scripts/test_mongo_proxy_webhooks_and_keys.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import Module, { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const FN_DIR = path.join(ROOT, 'cloud-functions/mongo-proxy');

const PUBLIC_URL = 'https://us-east1-swfl-arrest-scrapers.cloudfunctions.net/mongo-proxy/twilio';
const TW_TOKEN = 'test-twilio-auth-token';
const TG_SECRET = 'test_telegram_secret-123';
const GAS_KEY = 'test-gas-key';
const VELO_KEY = 'test-velo-key';
const LEGACY_KEY = 'test-legacy-key';

const BASE_ENV = {
  MONGO_URI: 'mongodb://stub',
  TWILIO_AUTH_TOKEN: TW_TOKEN,
  TWILIO_WEBHOOK_URL: PUBLIC_URL,
  TELEGRAM_WEBHOOK_SECRET: TG_SECRET,
  PROXY_API_KEY_GAS: GAS_KEY,
  PROXY_API_KEY_VELO: VELO_KEY,
  PROXY_API_KEY: LEGACY_KEY,
};
const MANAGED_ENV = [...Object.keys(BASE_ENV)];

// ── Load index.js with stubbed deps ─────────────────────────────────
const inserts = [];
let dbOpened = 0;
const fakeDb = {
  command: async () => ({ ok: 1 }),
  collection(name) {
    return {
      insertOne: async (doc) => { inserts.push({ coll: name, doc }); return { insertedId: 'id-' + inserts.length }; },
      findOne: async () => null,
      updateOne: async () => ({ matchedCount: 1, modifiedCount: 1 }),
      find() { const c = { sort: () => c, limit: () => c, toArray: async () => [] }; return c; },
    };
  },
};
let handler = null;
function loadIndex() {
  if (handler) return handler;
  const stubs = {
    '@google-cloud/functions-framework': { http: (name, fn) => { assert.equal(name, 'mongoProxy'); handler = fn; } },
    mongodb: { MongoClient: class { async connect() { dbOpened++; } db() { return fakeDb; } } },
  };
  const origLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
    return origLoad.call(this, request, parent, isMain);
  };
  try {
    require(path.join(FN_DIR, 'index.js'));
  } finally {
    Module._load = origLoad;
  }
  assert.ok(handler, 'index.js must register mongoProxy');
  return handler;
}

async function invoke({ path: p = '/', method = 'POST', headers = {}, body = {}, rawBody, env = BASE_ENV } = {}) {
  const fn = loadIndex();
  for (const k of MANAGED_ENV) delete process.env[k];
  Object.assign(process.env, env);
  inserts.length = 0;
  const res = {
    statusCode: 200, headers: {}, payload: undefined,
    set(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    status(c) { this.statusCode = c; return this; },
    send(b) { this.payload = b; return this; },
    json(b) { this.payload = b; return this; },
  };
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  await fn({ path: p, method, headers: lower, body, rawBody }, res);
  return { status: res.statusCode, body: res.payload, headers: res.headers, inserts: inserts.slice() };
}

// ── Twilio helpers ──────────────────────────────────────────────────
function sign(token, url, params) {
  let data = url;
  for (const k of Object.keys(params).sort()) data += k + params[k];
  return crypto.createHmac('sha1', token).update(Buffer.from(data, 'utf-8')).digest('base64');
}
const SMS = {
  ToCountry: 'US', SmsMessageSid: 'SM0001', NumMedia: '0', From: '+12395550100', To: '+12393322245',
  Body: 'Need bail  for my brother ', MessageSid: 'SM0001', AccountSid: 'AC0001', ApiVersion: '2010-04-01',
};
function twilioRequest(params, { url = PUBLIC_URL, token = TW_TOKEN, sig } = {}) {
  const raw = new URLSearchParams(params).toString();
  return {
    path: '/twilio',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Twilio-Signature': sig === undefined ? sign(token, url, params) : sig,
      Host: 'mongo-proxy-abc123-ue.a.run.app',
    },
    body: { ...params },
    rawBody: Buffer.from(raw),
  };
}

// ── /twilio ─────────────────────────────────────────────────────────
test('twilio: signature helper matches the Twilio docs vector', () => {
  const { twilioSignature } = require(path.join(FN_DIR, 'webhooks.js'));
  const sig = twilioSignature('12345', 'https://example.com/myapp.php?foo=1&bar=2', {
    Digits: '1234', To: '+18005551212', From: '+14158675310', Caller: '+14158675310', CallSid: 'CA1234567890ABCDE',
  });
  assert.equal(sig, 'L/OH5YylLD5NRKLltdqwSvS0BnU=');
});

test('twilio: valid signature on the PUBLIC url → 200 TwiML + one whitelisted Communications doc', async () => {
  const r = await invoke(twilioRequest(SMS));
  assert.equal(r.status, 200);
  assert.match(String(r.body), /<Response><\/Response>/);
  assert.equal(r.inserts.length, 1);
  const { coll, doc } = r.inserts[0];
  assert.equal(coll, 'Communications');
  assert.deepEqual(Object.keys(doc).sort(), ['body', 'direction', 'from', 'messageId', 'numMedia', 'platform', 'timestamp', 'to']);
  assert.equal(doc.direction, 'inbound');
  assert.equal(doc.platform, 'twilio');
  assert.equal(doc.from, '+12395550100');
  assert.equal(doc.body, 'Need bail  for my brother ', 'raw body is signed and stored untrimmed');
  assert.ok(!('rawPayload' in doc));
});

test('twilio: rejects (no write) when the signature is missing, wrong, tampered, or for another URL', async () => {
  const cases = [
    twilioRequest(SMS, { sig: '' }),
    twilioRequest(SMS, { token: 'wrong-token' }),
    twilioRequest(SMS, { url: 'https://mongo-proxy-abc123-ue.a.run.app/twilio' }), // what the function "sees"
    twilioRequest(SMS, { url: 'http://localhost:8080/twilio' }),
    (() => { const req = twilioRequest(SMS); req.rawBody = Buffer.from(new URLSearchParams({ ...SMS, Body: 'tampered' }).toString()); req.body.Body = 'tampered'; return req; })(),
  ];
  for (const req of cases) {
    const r = await invoke(req);
    assert.equal(r.status, 403, JSON.stringify(req.headers));
    assert.equal(r.inserts.length, 0);
  }
});

test('twilio: fails closed (503, no write) when TWILIO_AUTH_TOKEN or TWILIO_WEBHOOK_URL is unset', async () => {
  for (const drop of ['TWILIO_AUTH_TOKEN', 'TWILIO_WEBHOOK_URL']) {
    const env = { ...BASE_ENV };
    delete env[drop];
    const r = await invoke({ ...twilioRequest(SMS), env });
    assert.equal(r.status, 503, drop);
    assert.equal(r.inserts.length, 0);
  }
  const r = await invoke({ ...twilioRequest(SMS), env: { ...BASE_ENV, TWILIO_AUTH_TOKEN: '   ' } });
  assert.equal(r.status, 503, 'blank counts as unset');
});

test('twilio: accepts the :443 variant like twilio-node validateRequest; GET is 405', async () => {
  const withPort = PUBLIC_URL.replace('.net/', '.net:443/');
  assert.equal((await invoke(twilioRequest(SMS, { url: withPort }))).status, 200);
  assert.equal((await invoke({ ...twilioRequest(SMS), method: 'GET' })).status, 405);
});

test('twilio: falls back to the parsed body when no rawBody is available', async () => {
  const req = twilioRequest(SMS);
  delete req.rawBody;
  assert.equal((await invoke(req)).status, 200);
});

// ── /telegram ───────────────────────────────────────────────────────
const TG_UPDATE = {
  update_id: 99, message: { message_id: 7, chat: { id: 123456789 }, from: { id: 1, first_name: 'A' }, text: '/start' },
  extra: { nested: true },
};

test('telegram: correct secret token → 200 + one whitelisted Communications doc', async () => {
  const r = await invoke({ path: '/telegram', headers: { 'X-Telegram-Bot-Api-Secret-Token': TG_SECRET }, body: TG_UPDATE });
  assert.equal(r.status, 200);
  assert.equal(r.inserts.length, 1);
  const { coll, doc } = r.inserts[0];
  assert.equal(coll, 'Communications');
  assert.deepEqual(Object.keys(doc).sort(), ['body', 'direction', 'from', 'messageId', 'platform', 'timestamp', 'updateId']);
  assert.equal(doc.from, '123456789');
  assert.equal(doc.body, '/start');
  assert.equal(doc.platform, 'telegram');
});

test('telegram: missing/wrong secret → 401, unset env → 503; never writes', async () => {
  for (const headers of [{}, { 'X-Telegram-Bot-Api-Secret-Token': 'nope' }, { 'X-Telegram-Bot-Api-Secret-Token': TG_SECRET + 'x' }]) {
    const r = await invoke({ path: '/telegram', headers, body: TG_UPDATE });
    assert.equal(r.status, 401);
    assert.equal(r.inserts.length, 0);
  }
  const env = { ...BASE_ENV };
  delete env.TELEGRAM_WEBHOOK_SECRET;
  const r = await invoke({ path: '/telegram', headers: { 'X-Telegram-Bot-Api-Secret-Token': '' }, body: TG_UPDATE, env });
  assert.equal(r.status, 503);
  assert.equal(r.inserts.length, 0);
});

// ── Caller keys ─────────────────────────────────────────────────────
const GAS_CALL = { action: 'logActivity', action_name: 'x', source: 'gas' };
const VELO_CALL = { action: 'getCourse', courseId: 'C1' };

test('keys: GAS key → GAS actions only; Velo key → Velo actions only', async () => {
  const gas = (body) => invoke({ headers: { 'x-api-key': GAS_KEY }, body });
  const velo = (body) => invoke({ headers: { 'x-api-key': VELO_KEY }, body });
  assert.equal((await gas(GAS_CALL)).status, 200);
  assert.equal((await gas({ action: 'ping' })).status, 200);
  assert.equal((await gas(VELO_CALL)).status, 403);
  assert.equal((await velo(VELO_CALL)).status, 200);
  const denied = await velo(GAS_CALL);
  assert.equal(denied.status, 403);
  assert.equal(denied.inserts.length, 0);
});

test('keys: legacy PROXY_API_KEY still works for every action (transitional) and can be removed', async () => {
  assert.equal((await invoke({ headers: { 'x-api-key': LEGACY_KEY }, body: GAS_CALL })).status, 200);
  assert.equal((await invoke({ headers: { 'x-api-key': LEGACY_KEY }, body: VELO_CALL })).status, 200);
  const env = { ...BASE_ENV };
  delete env.PROXY_API_KEY;
  assert.equal((await invoke({ headers: { 'x-api-key': LEGACY_KEY }, body: GAS_CALL, env })).status, 401);
  assert.equal((await invoke({ headers: { 'x-api-key': GAS_KEY }, body: GAS_CALL, env })).status, 200);
  // Before rotation: only the legacy key is configured (today's deploy) → nothing breaks.
  const legacyOnly = { MONGO_URI: 'x', PROXY_API_KEY: LEGACY_KEY };
  assert.equal((await invoke({ headers: { 'x-api-key': LEGACY_KEY }, body: VELO_CALL, env: legacyOnly })).status, 200);
});

test('keys: fail closed — no keys 503, identical GAS/Velo keys 503, wrong key 401', async () => {
  assert.equal((await invoke({ headers: { 'x-api-key': GAS_KEY }, body: GAS_CALL, env: { MONGO_URI: 'x' } })).status, 503);
  const same = { ...BASE_ENV, PROXY_API_KEY_VELO: GAS_KEY };
  assert.equal((await invoke({ headers: { 'x-api-key': GAS_KEY }, body: GAS_CALL, env: same })).status, 503);
  assert.equal((await invoke({ headers: { 'x-api-key': 'nope' }, body: GAS_CALL })).status, 401);
  assert.equal((await invoke({ headers: {}, body: GAS_CALL })).status, 401);
});

test('keys: every named action belongs to exactly one caller scope', () => {
  const { NAMED_ACTIONS, CALLER_SCOPES } = require(path.join(FN_DIR, 'named-actions.js'));
  const owners = {};
  for (const [caller, scope] of Object.entries(CALLER_SCOPES)) for (const a of scope.actions) (owners[a] ||= []).push(caller);
  assert.deepEqual(Object.keys(owners).sort(), Object.keys(NAMED_ACTIONS).sort());
  for (const [a, o] of Object.entries(owners)) assert.equal(o.length, 1, a);
});

test('/wix-intake: Velo or legacy key only, fail-closed', async () => {
  const intake = { caseId: 'CASE-1', defendantName: 'X' };
  assert.equal((await invoke({ path: '/wix-intake', headers: { 'x-api-key': VELO_KEY }, body: intake })).status, 200);
  assert.equal((await invoke({ path: '/wix-intake', headers: { 'x-api-key': LEGACY_KEY }, body: intake })).status, 200);
  const gas = await invoke({ path: '/wix-intake', headers: { 'x-api-key': GAS_KEY }, body: intake });
  assert.equal(gas.status, 403);
  assert.equal(gas.inserts.length, 0);
  const none = await invoke({ path: '/wix-intake', headers: {}, body: intake });
  assert.equal(none.status, 401);
  assert.equal(none.inserts.length, 0);
  const unset = await invoke({ path: '/wix-intake', headers: { 'x-api-key': 'anything' }, body: intake, env: { MONGO_URI: 'x' } });
  assert.equal(unset.status, 503, 'was fail-open when PROXY_API_KEY was unset');
  assert.equal(unset.inserts.length, 0);
});

// ── Callers send their own key, server-side only ────────────────────
function loadGas(props) {
  const requests = [];
  const ctx = {
    console, Logger: { log() {} }, Utilities: { sleep() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props[k] === undefined ? null : props[k]) }) },
    UrlFetchApp: { fetch(url, opts) { requests.push({ url, opts }); return { getResponseCode: () => 200, getContentText: () => '{"ok":true}' }; } },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'backend-gas/MongoDbService.js'), 'utf8'), ctx);
  return { S: vm.runInContext('MongoDbService', ctx), requests };
}

test('GAS MongoDbService sends PROXY_API_KEY_GAS, falling back to legacy PROXY_API_KEY', () => {
  let g = loadGas({ MONGO_PROXY_URL: 'https://p.test', PROXY_API_KEY_GAS: GAS_KEY, PROXY_API_KEY: LEGACY_KEY });
  g.S.ping();
  assert.equal(g.requests[0].opts.headers['x-api-key'], GAS_KEY);
  g = loadGas({ MONGO_PROXY_URL: 'https://p.test', PROXY_API_KEY: LEGACY_KEY });
  g.S.ping();
  assert.equal(g.requests[0].opts.headers['x-api-key'], LEGACY_KEY);
  const setup = fs.readFileSync(path.join(ROOT, 'backend-gas/Manual_Setup_MongoDB.js'), 'utf8');
  assert.match(setup, /setProperty\('PROXY_API_KEY_GAS', '<SET_YOUR_PROXY_API_KEY_GAS_HERE>'\)/);
});

async function loadVeloModule(file, replacements, mocks) {
  let src = fs.readFileSync(path.join(ROOT, 'src/backend', file), 'utf8');
  for (const [from, to] of replacements) src = src.replace(from, to);
  assert.doesNotMatch(src, /^import /m, 'unexpected import in ' + file);
  globalThis.__veloMocks = mocks;
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'velo-')), file.replace(/\.jsw$/, '.mjs'));
  fs.writeFileSync(tmp, src);
  return import(pathToFileURL(tmp).href);
}

function secretsFrom(map) {
  return { getSecret: async (k) => { if (!(k in map)) throw new Error('Secret not found: ' + k); return map[k]; } };
}

test('Velo bailSchoolMongo sends PROXY_API_KEY_VELO, falling back to legacy PROXY_API_KEY', async () => {
  for (const [secrets, expected] of [
    [{ MONGO_PROXY_URL: 'https://p.test', PROXY_API_KEY_VELO: VELO_KEY, PROXY_API_KEY: LEGACY_KEY }, VELO_KEY],
    [{ MONGO_PROXY_URL: 'https://p.test', PROXY_API_KEY: LEGACY_KEY }, LEGACY_KEY],
  ]) {
    const sent = [];
    const mod = await loadVeloModule('bailSchoolMongo.jsw', [
      ["import { fetch } from 'wix-fetch';", 'const { fetch } = globalThis.__veloMocks.wixFetch;'],
      ["import wixSecretsBackend from 'wix-secrets-backend';", 'const wixSecretsBackend = globalThis.__veloMocks.secrets;'],
    ], {
      wixFetch: { fetch: async (url, init) => { sent.push(init.headers['x-api-key']); return { ok: true, json: async () => ({ _id: 'C1' }) }; } },
      secrets: secretsFrom(secrets),
    });
    await mod.getCourse('C1');
    assert.deepEqual(sent, [expected]);
    assert.equal(mod.getMongoConfig, undefined, 'key lookup is not an exported web method');
  }
});

test('Velo secretsManager.getMongoProxyApiKey (used by /wix-intake) prefers PROXY_API_KEY_VELO', async () => {
  for (const [secrets, expected] of [
    [{ PROXY_API_KEY_VELO: VELO_KEY, PROXY_API_KEY: LEGACY_KEY }, VELO_KEY],
    [{ PROXY_API_KEY: LEGACY_KEY }, LEGACY_KEY],
  ]) {
    const mod = await loadVeloModule('secretsManager.jsw', [
      ["import { getSecret } from 'wix-secrets-backend';", 'const { getSecret } = globalThis.__veloMocks.secrets;'],
    ], { secrets: secretsFrom(secrets) });
    assert.equal(await mod.getMongoProxyApiKey(), expected);
  }
  const perms = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/backend/permissions.json'), 'utf8'));
  for (const role of ['siteOwner', 'siteMember', 'anonymous']) {
    assert.equal(perms['web-methods']['secretsManager.jsw']['*'][role].invoke, false, 'secretsManager must stay backend-only');
  }
});

test('keys never leave the server: no page/public file references proxy key names; no cross-caller key', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of [...walk(path.join(ROOT, 'src/pages')), ...walk(path.join(ROOT, 'src/public'))]) {
    assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /PROXY_API_KEY/, path.relative(ROOT, f));
  }
  for (const f of walk(path.join(ROOT, 'src/backend'))) {
    assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /PROXY_API_KEY_GAS/, path.relative(ROOT, f));
  }
  for (const f of walk(path.join(ROOT, 'backend-gas')).filter((x) => x.endsWith('.js'))) {
    assert.doesNotMatch(fs.readFileSync(f, 'utf8'), /PROXY_API_KEY_VELO/, path.relative(ROOT, f));
  }
});
