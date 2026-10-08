#!/usr/bin/env node
/**
 * Tests for the mongo-proxy named actions (cloud-functions/mongo-proxy/named-actions.js)
 * and every in-repo caller: GAS MongoDbService/MongoLogger/AI_HistoricalOCR and the
 * Velo backend/bailSchoolMongo.jsw. No network, no Mongo: fake db + fake fetch.
 *
 * Run: node --test scripts/test_mongo_proxy_named_actions.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const NA_PATH = path.join(ROOT, 'cloud-functions/mongo-proxy/named-actions.js');
const KEY = 'test-proxy-key';
const T0 = Date.UTC(2026, 9, 8, 12, 0, 0);

function loadNamedActions() {
  assert.ok(fs.existsSync(NA_PATH), 'cloud-functions/mongo-proxy/named-actions.js must exist');
  return require(NA_PATH);
}

// ── Fake Mongo db ──────────────────────────────────────────────────
function fakeDb(seed = {}) {
  const calls = [];
  const dbNames = [];
  const db = {
    calls,
    dbNames,
    command: async (c) => { calls.push({ op: 'command', c }); return { ok: 1 }; },
    collection(name) {
      return {
        insertOne: async (doc) => { calls.push({ op: 'insertOne', coll: name, doc }); return { insertedId: 'id-' + calls.length }; },
        findOne: async (filter) => { calls.push({ op: 'findOne', coll: name, filter }); return (seed[name] || [])[0] || null; },
        updateOne: async (filter, update, opts) => { calls.push({ op: 'updateOne', coll: name, filter, update, opts }); return { matchedCount: 1, modifiedCount: 1 }; },
        find(filter) {
          const rec = { op: 'find', coll: name, filter };
          calls.push(rec);
          const cur = {
            sort(s) { rec.sort = s; return cur; },
            limit(l) { rec.limit = l; return cur; },
            toArray: async () => seed[name] || [],
          };
          return cur;
        },
      };
    },
  };
  return db;
}

async function call(body, { db = fakeDb(), key = KEY, apiKey = KEY, method = 'POST' } = {}) {
  const { handleNamedAction } = loadNamedActions();
  const out = await handleNamedAction(
    { method, headers: { 'x-api-key': key }, body },
    { apiKey, clock: () => T0, getDb: async (name) => { db.dbNames.push(name); return db; } }
  );
  return { out, db };
}

// ── Function: generic handler removed ──────────────────────────────
test('generic actions are gone (410) and never touch the db', async () => {
  for (const action of ['findOne', 'find', 'insertOne', 'insertMany', 'updateOne', 'updateMany',
    'deleteOne', 'deleteMany', 'aggregate', 'countDocuments']) {
    const { out, db } = await call({ action, database: 'admin', collection: 'system.users', filter: {} });
    assert.equal(out.status, 410, action);
    assert.equal(db.calls.length, 0);
    assert.equal(db.dbNames.length, 0);
  }
});

test('auth: missing server key 503, wrong key 401, GET 405, unknown action 404, no action 400', async () => {
  assert.equal((await call({ action: 'ping' }, { apiKey: '' })).out.status, 503);
  assert.equal((await call({ action: 'ping' }, { key: 'nope' })).out.status, 401);
  assert.equal((await call({ action: 'ping' }, { method: 'GET' })).out.status, 405);
  assert.equal((await call({ action: 'dropDatabase' })).out.status, 404);
  assert.equal((await call({ action: '__proto__' })).out.status, 404);
  assert.equal((await call({})).out.status, 400);
});

test('named actions hardcode db + collection and ignore body database/collection/tenant', async () => {
  const { out, db } = await call({
    action: 'logCheckIn', database: 'admin', dataSource: 'Other', db: 'x', collection: 'Users', tenant: 'evil',
    source: 'web', caseId: 'C-1', latitude: '26.6', longitude: -81.8,
  });
  assert.equal(out.status, 200);
  assert.deepEqual(db.dbNames, ['ShamrockBailDB']);
  assert.equal(db.calls[0].coll, 'CheckIns');
  const doc = db.calls[0].doc;
  assert.equal(doc.latitude, 26.6);
  assert.equal(doc.longitude, -81.8);
  for (const k of ['database', 'dataSource', 'db', 'collection', 'tenant', 'action']) assert.ok(!(k in doc), k);
  assert.equal(doc.createdAt, new Date(T0).toISOString());
});

test('log actions store only whitelisted, scalar, capped fields', async () => {
  const { LOG_ACTIONS } = loadNamedActions();
  const expected = {
    logActivity: 'ActivityLog', logIntake: 'Intakes', logSignNowEvent: 'SignNowEvents', logPayment: 'Payments',
    logCourtDate: 'CourtDates', logCheckIn: 'CheckIns', logCommunication: 'Communications',
    logLeadScore: 'LeadScoring', insertHistoricalBond: 'HistoricalBonds',
  };
  assert.deepEqual(Object.fromEntries(Object.entries(LOG_ACTIONS).map(([k, v]) => [k, v.collection])), expected);
  const { db } = await call({
    action: 'logIntake', caseId: 'C-2', defendantName: { $gt: '' }, county: 'Lee',
    charges: ['DUI', 'BATTERY'], bondAmount: 2500, rawPayload: { ssn: '123' }, $where: 'x', isAdmin: true,
    status: 'x'.repeat(2000),
  });
  const doc = db.calls[0].doc;
  assert.deepEqual(Object.keys(doc).sort(), ['bondAmount', 'caseId', 'charges', 'county', 'createdAt', 'status']);
  assert.equal(doc.charges, 'DUI, BATTERY');
  assert.equal(doc.status.length, 500);
  const comm = (await call({ action: 'logCommunication', direction: 'inbound', body: 'hi' })).db.calls[0].doc;
  assert.equal(comm.direction, 'outbound');
});

test('filters accept plain strings only (no operator injection)', async () => {
  for (const body of [
    { action: 'getStudentEnrollment', studentId: { $ne: null }, courseId: 'c' },
    { action: 'listStudentAuditLogs', studentId: { $gt: '' } },
    { action: 'getCourse', courseId: ['a'] },
    { action: 'listCourseLessons' },
    { action: 'markLessonComplete', studentId: 's', courseId: 'c', lessonId: { $set: 1 } },
    { action: 'logStudentAction', studentId: 's', lessonId: 'l', studentAction: 'drop; x' },
  ]) {
    const { out, db } = await call(body);
    assert.equal(out.status, 400, JSON.stringify(body));
    assert.equal(db.calls.length, 0);
    assert.equal(db.dbNames.length, 0, 'validated before opening the connection');
  }
});

test('bail school named actions keep the old query shapes', async () => {
  let r = await call({ action: 'listCourseLessons', courseId: 'C1', collection: 'Users', filter: { all: 1 } });
  assert.deepEqual(r.db.calls[0], { op: 'find', coll: 'CourseLessons', filter: { courseId: 'C1' }, sort: { order: 1 }, limit: 100 });
  r = await call({ action: 'listStudentAuditLogs', studentId: 's@x' });
  assert.deepEqual(r.db.calls[0], { op: 'find', coll: 'AuditLogs', filter: { studentId: 's@x' }, sort: { timestamp: -1 }, limit: 500 });
  r = await call({ action: 'listStudentEnrollments', studentId: 's@x' });
  assert.equal(r.db.calls[0].limit, 10);
  r = await call({ action: 'getStudentEnrollment', studentId: 's', courseId: 'c' });
  assert.deepEqual(r.db.calls[0], { op: 'findOne', coll: 'StudentEnrollments', filter: { studentId: 's', courseId: 'c' } });
  r = await call({ action: 'getCourse', courseId: '120-HR' });
  assert.deepEqual(r.db.calls[0], { op: 'findOne', coll: 'Courses', filter: { _id: '120-HR' } });
  r = await call({ action: 'markLessonComplete', studentId: 's', courseId: 'c', lessonId: 'L1', update: { $set: { admin: true } } });
  assert.deepEqual(r.db.calls[0].update, { $addToSet: { completedLessons: 'L1' }, $set: { lastActive: new Date(T0).toISOString(), progress: 100 } });
  assert.deepEqual(r.db.calls[0].opts, { upsert: false });
  r = await call({ action: 'logStudentAction', studentId: 's', lessonId: 'L1', studentAction: 'PASSED_QUIZ', score: 90, extra: { x: 1 } });
  assert.deepEqual(Object.keys(r.db.calls[0].doc).sort(), ['action', 'ipAddress', 'lessonId', 'score', 'studentId', 'timestamp']);
  r = await call({ action: 'ping' });
  assert.deepEqual(r.out.body, { ok: true });
});

// ── GAS callers ─────────────────────────────────────────────────────
function loadGas() {
  const requests = [];
  const ctx = {
    console,
    Logger: { log() {} },
    Utilities: { sleep() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => ({ MONGO_PROXY_URL: 'https://proxy.test/mongo-proxy', PROXY_API_KEY: KEY })[k] || null }) },
    UrlFetchApp: {
      fetch(url, opts) {
        requests.push({ url, opts, body: JSON.parse(opts.payload) });
        return { getResponseCode: () => 200, getContentText: () => '{"insertedId":"x"}' };
      },
    },
  };
  vm.createContext(ctx);
  for (const f of ['MongoDbService.js', 'MongoLogger.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'backend-gas', f), 'utf8'), ctx, { filename: f });
  }
  return { ctx, requests };
}

test('GAS MongoLogger sends named actions only (no database/collection/rawPayload)', () => {
  const { ctx, requests } = loadGas();
  const L = vm.runInContext('MongoLogger', ctx);
  L.logActivity('logDefendantLocation', 'gas');
  L.logIntake({ caseId: 'C', defendantName: 'D' }, 'web');
  L.logSignNow('packet_sent', { caseId: 'C' });
  L.logPayment({ caseId: 'C', amount: 10 });
  L.logCourtDate({ caseId: 'C' }, 'scheduled');
  L.logCheckIn({ latitude: 26.6, longitude: -81.8, memberEmail: 'a@b' }, 'web');
  L.logComm({ to: '+1', body: 'hi' }, 'sms');
  L.logLeadScore({ name: 'X', score: 7 }, 'TheAnalyst');
  assert.deepEqual(requests.map((r) => r.body.action), [
    'logActivity', 'logIntake', 'logSignNowEvent', 'logPayment', 'logCourtDate', 'logCheckIn', 'logCommunication', 'logLeadScore',
  ]);
  for (const r of requests) {
    assert.equal(r.url, 'https://proxy.test/mongo-proxy');
    assert.equal(r.opts.headers['x-api-key'], KEY);
    for (const k of ['database', 'collection', 'dataSource', 'rawPayload']) assert.ok(!(k in r.body), k + ' in ' + r.body.action);
  }
});

test('GAS insertHistoricalBond + ping use named actions; generic methods are gone', () => {
  const { ctx, requests } = loadGas();
  const S = vm.runInContext('MongoDbService', ctx);
  for (const m of ['findOne', 'find', 'insertOne', 'updateOne', 'updateMany', 'deleteOne']) assert.equal(S[m], undefined, m);
  S.insertHistoricalBond({ FirstName: 'A', LastName: 'B' });
  S.ping();
  assert.deepEqual(requests.map((r) => r.body.action), ['insertHistoricalBond', 'ping']);
  const ocr = fs.readFileSync(path.join(ROOT, 'backend-gas/AI_HistoricalOCR.js'), 'utf8');
  assert.match(ocr, /MongoDbService\.insertHistoricalBond\(parsedData\)/);
});

test('no GAS file calls a removed generic MongoDbService method', () => {
  const dir = path.join(ROOT, 'backend-gas');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.doesNotMatch(src, /MongoDbService\.(findOne|find|insertOne|insertMany|updateOne|updateMany|deleteOne|deleteMany|aggregate|countDocuments)\(/, f);
  }
});

test('portal check-in end-to-end: GAS logDefendantLocation log → proxy → CheckIns', async () => {
  const { ctx, requests } = loadGas();
  // Shape sent by src/backend/location.jsw (action logDefendantLocation → MongoLogger.logCheckIn(data.data, 'web')).
  vm.runInContext('MongoLogger', ctx).logCheckIn({
    memberId: 'm1', memberEmail: 'd@x.test', phoneNumber: '+12395550100', latitude: 26.64, longitude: -81.87,
    address: '1 Main St', timestamp: new Date(T0).toISOString(), userAgent: 'Portal',
  }, 'web');
  assert.equal(requests.length, 1);
  const { out, db } = await call(requests[0].body);
  assert.equal(out.status, 200);
  assert.equal(db.calls[0].coll, 'CheckIns');
  assert.equal(db.calls[0].doc.source, 'web');
  assert.equal(db.calls[0].doc.latitude, 26.64);
});

// ── Velo caller ─────────────────────────────────────────────────────
async function loadVelo(fetchImpl) {
  let src = fs.readFileSync(path.join(ROOT, 'src/backend/bailSchoolMongo.jsw'), 'utf8');
  src = src
    .replace("import { fetch } from 'wix-fetch';", 'const { fetch } = globalThis.__veloMocks.wixFetch;')
    .replace("import wixSecretsBackend from 'wix-secrets-backend';", 'const wixSecretsBackend = globalThis.__veloMocks.secrets;');
  assert.doesNotMatch(src, /^import /m, 'unexpected import in bailSchoolMongo.jsw');
  globalThis.__veloMocks = {
    wixFetch: { fetch: fetchImpl },
    secrets: { getSecret: async (k) => ({ MONGO_PROXY_URL: 'https://proxy.test/mongo-proxy', PROXY_API_KEY: KEY, GAS_WEBHOOK_URL: '' })[k] },
  };
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'velo-')), 'bailSchoolMongo.mjs');
  fs.writeFileSync(tmp, src);
  return import(pathToFileURL(tmp).href);
}

test('Velo bailSchoolMongo uses named actions end-to-end and never sends database/collection', async () => {
  const db = fakeDb({ CourseLessons: [{ _id: 'L1' }], StudentEnrollments: [{ studentId: 's' }], AuditLogs: [], Courses: [{ _id: 'C1' }] });
  const sent = [];
  const mod = await loadVelo(async (url, init) => {
    const body = JSON.parse(init.body);
    sent.push(body);
    const { out } = await call(body, { db, key: init.headers['x-api-key'] });
    return { ok: out.status === 200, status: out.status, json: async () => out.body, text: async () => JSON.stringify(out.body) };
  });
  assert.deepEqual(await mod.getCourse('C1'), { _id: 'C1' });
  assert.deepEqual(await mod.getCourseLessons('C1'), [{ _id: 'L1' }]);
  assert.deepEqual(await mod.getStudentEnrollment('s', 'C1'), { studentId: 's' });
  assert.deepEqual(await mod.getStudentEnrollments('s'), [{ studentId: 's' }]);
  await mod.logStudentAction('s', 'L1', 'VIDEO_PROGRESS', 'Unknown', { time: 12.5, junk: { $x: 1 } });
  assert.deepEqual(await mod.getStudentAuditLogs('s'), []);
  const quiz = await mod.saveQuizResult('s', 'C1', 'L1', ['0'], [{ correctAnswerIndex: 0 }]);
  assert.equal(quiz.passed, true);
  assert.deepEqual(sent.map((b) => b.action), [
    'getCourse', 'listCourseLessons', 'getStudentEnrollment', 'listStudentEnrollments',
    'logStudentAction', 'listStudentAuditLogs', 'logStudentAction', 'markLessonComplete',
  ]);
  for (const b of sent) for (const k of ['database', 'collection', 'dataSource']) assert.ok(!(k in b), k);
  const audit = db.calls.find((c) => c.op === 'insertOne' && c.doc.action === 'VIDEO_PROGRESS');
  assert.equal(audit.coll, 'AuditLogs');
  assert.equal(audit.doc.time, 12.5);
  assert.ok(!('junk' in audit.doc));
  assert.deepEqual(new Set(db.dbNames), new Set(['ShamrockBailDB']));
});

test('no Velo/GAS source still builds a generic proxy body', () => {
  const files = [
    ...fs.readdirSync(path.join(ROOT, 'src/backend')).map((f) => path.join(ROOT, 'src/backend', f)),
    ...fs.readdirSync(path.join(ROOT, 'backend-gas')).filter((f) => f.endsWith('.js')).map((f) => path.join(ROOT, 'backend-gas', f)),
  ].filter((f) => fs.statSync(f).isFile());
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    if (!/MONGO_PROXY_URL|getMongoProxyUrl/.test(src)) continue;
    assert.doesNotMatch(src, /database:\s*['"A-Z_]/, path.relative(ROOT, f));
    assert.doesNotMatch(src, /callMongoProxy\(\s*'(find|findOne|insertOne|updateOne)'/, path.relative(ROOT, f));
  }
});
