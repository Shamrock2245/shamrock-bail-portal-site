#!/usr/bin/env node
/**
 * Paperwork handoff token. Mocked fetch only. No network. No secrets.
 * Client-supplied case_id and person_id must be ignored.
 * The launch URL may carry ht and must not carry the Wix session token.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mintHandoffToken, HANDOFF_PATH } from '../src/backend/portalHandoff.js';
import { buildPaperworkLaunchpadUrl, launchPaperworkWithHandoff } from '../src/public/portal-config.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEADS_KEY = 'leads-test-key';
const GAS_KEY = 'gas-test-key';
const SESSION = 'session-token-from-wix-validation';
const SERVER_PERSON = 'server-person-1';
const SERVER_CASE = 'server-case-1';
const CLIENT_PERSON = 'client-person-ignored';
const CLIENT_CASE = 'client-case-ignored';
const HANDOFF = 'handoff-token-abc';

function jsonResponse(status, data) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(data == null ? {} : data)
    };
}

function harness(overrides) {
    const calls = [];
    const logs = [];
    const secrets = Object.assign({
        LEADS_API_KEY: LEADS_KEY,
        GAS_API_KEY: GAS_KEY
    }, overrides && overrides.secrets);
    const session = Object.assign({
        valid: true,
        personId: SERVER_PERSON,
        caseId: SERVER_CASE,
        role: 'indemnitor'
    }, overrides && overrides.session);
    const fetchImpl = async (url, options) => {
        const body = options && options.body ? JSON.parse(options.body) : null;
        calls.push({ url, options, body });
        if (overrides && typeof overrides.fetchImpl === 'function') return overrides.fetchImpl(url, options, body);
        return jsonResponse(200, { token: HANDOFF, expires_at: '2030-01-01T00:00:00Z' });
    };
    const deps = {
        fetchImpl,
        getSecret: async (name) => (secrets[name] == null ? '' : secrets[name]),
        validateSession: async () => session,
        logger: { warn: (...args) => logs.push(args.map(String).join(' ')) },
        timeoutMs: 200,
        leadsBase: 'https://dashboard.test'
    };
    return { calls, logs, deps, session };
}

function clientInput(extra) {
    return Object.assign({
        sessionToken: SESSION,
        case_id: CLIENT_CASE,
        person_id: CLIENT_PERSON,
        caseId: CLIENT_CASE,
        personId: CLIENT_PERSON,
        role: 'staff'
    }, extra || {});
}

function assertNoSecrets(blob) {
    assert.equal(blob.includes(LEADS_KEY), false, 'dashboard key leaked');
    assert.equal(blob.includes(GAS_KEY), false, 'gas key leaked');
    assert.equal(blob.includes(SESSION), false, 'session token leaked');
    assert.equal(blob.includes(HANDOFF), false, 'handoff token leaked');
    assert.equal(blob.includes(SERVER_PERSON), false, 'person id leaked');
    assert.equal(blob.includes(CLIENT_PERSON), false, 'client person leaked');
    assert.equal(blob.includes(SERVER_CASE), false, 'case id leaked');
}

test('POST handoff-token uses the session person_id, case_id, and role', async () => {
    const h = harness();
    const result = await mintHandoffToken(clientInput(), h.deps);
    assert.equal(result.ok, true);
    assert.equal(result.token, HANDOFF);
    assert.equal(result.expires_at, '2030-01-01T00:00:00Z');
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].url, 'https://dashboard.test' + HANDOFF_PATH);
    assert.equal(h.calls[0].options.method, 'POST');
    assert.equal(h.calls[0].options.headers['X-API-Key'], LEADS_KEY);
    assert.equal(h.calls[0].options.headers['X-Internal-Token'], LEADS_KEY);
    assert.deepEqual(h.calls[0].body, {
        case_id: SERVER_CASE,
        role: 'indemnitor',
        person_id: SERVER_PERSON
    });
    assert.equal(JSON.stringify(h.calls[0].body).includes(CLIENT_CASE), false);
    assert.equal(JSON.stringify(h.calls[0].body).includes(CLIENT_PERSON), false);
    assertNoSecrets(h.logs.join('\n'));
});

test('client-supplied ids are ignored when the session has no case', async () => {
    const h = harness({ session: { valid: true, personId: SERVER_PERSON, caseId: '', role: 'defendant' } });
    const result = await mintHandoffToken(clientInput(), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'session');
    assert.equal(h.calls.length, 0);
    assertNoSecrets(h.logs.join('\n'));
});

test('invalid session does not call leads and does not use client ids', async () => {
    const h = harness({ session: { valid: false, reason: 'invalid', personId: '', caseId: '' } });
    const result = await mintHandoffToken(clientInput(), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'session');
    assert.equal(h.calls.length, 0);
});

test('staff role is refused even if the client asks for indemnitor', async () => {
    const h = harness({ session: { valid: true, personId: SERVER_PERSON, caseId: SERVER_CASE, role: 'staff' } });
    const result = await mintHandoffToken(clientInput({ role: 'indemnitor' }), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'role');
    assert.equal(h.calls.length, 0);
});

test('dashboard key falls back to GAS_API_KEY only when LEADS_API_KEY is empty', async () => {
    const h = harness({ secrets: { LEADS_API_KEY: '' } });
    const result = await mintHandoffToken({ sessionToken: SESSION }, h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.calls[0].options.headers['X-API-Key'], GAS_KEY);
    assert.equal(h.calls[0].options.headers['X-Internal-Token'], GAS_KEY);
    assertNoSecrets(h.logs.join('\n'));
});

test('missing dashboard key does not call leads', async () => {
    const h = harness({ secrets: { LEADS_API_KEY: '', GAS_API_KEY: '' } });
    const result = await mintHandoffToken({ sessionToken: SESSION }, h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'auth');
    assert.equal(h.calls.length, 0);
});

test('404 and upstream errors degrade without throwing', async () => {
    for (const status of [404, 500, 401]) {
        const h = harness({ fetchImpl: () => jsonResponse(status, { error: 'nope' }) });
        const result = await mintHandoffToken({ sessionToken: SESSION }, h.deps);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'unavailable');
        assertNoSecrets(h.logs.join('\n'));
    }
});

test('timeout degrades without throwing', async () => {
    const h = harness({
        fetchImpl: () => new Promise(() => {})
    });
    h.deps.timeoutMs = 30;
    const result = await mintHandoffToken({ sessionToken: SESSION }, h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'timeout');
});

test('a token that echoes the Wix session token is rejected', async () => {
    const h = harness({ fetchImpl: () => jsonResponse(200, { token: SESSION, expires_at: '2030-01-01T00:00:00Z' }) });
    const result = await mintHandoffToken({ sessionToken: SESSION }, h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'token');
});

test('launch URL keeps role, case, and mode, appends ht, and never includes st', () => {
    const url = launchPaperworkWithHandoff({
        caseId: 'display-case',
        role: 'indemnitor',
        mode: 'resume',
        source: 'wix-indemnitor',
        sessionToken: SESSION,
        st: SESSION,
        handoff: { ok: true, token: HANDOFF }
    });
    const params = new URL(url).searchParams;
    assert.equal(params.get('role'), 'indemnitor');
    assert.equal(params.get('case'), 'display-case');
    assert.equal(params.get('mode'), 'resume');
    assert.equal(params.get('ht'), HANDOFF);
    assert.equal(params.get('st'), null);
    assert.equal(params.get('sessionToken'), null);
    assert.equal(url.includes(SESSION), false);
});

test('failed mint launches without ht and still keeps role and case', () => {
    const url = launchPaperworkWithHandoff({
        caseId: 'display-case',
        role: 'defendant',
        source: 'wix-defendant',
        sessionToken: SESSION,
        handoff: { ok: false, reason: 'unavailable' }
    });
    const params = new URL(url).searchParams;
    assert.equal(params.get('role'), 'defendant');
    assert.equal(params.get('case'), 'display-case');
    assert.equal(params.get('ht'), null);
    assert.equal(params.get('st'), null);
    assert.equal(url.includes(SESSION), false);
});

test('buildPaperworkLaunchpadUrl drops st when ht is present and keeps st otherwise', () => {
    const withHt = new URL(buildPaperworkLaunchpadUrl({
        role: 'defendant',
        caseId: 'display-case',
        mode: 'resume',
        st: SESSION,
        ht: HANDOFF
    }));
    assert.equal(withHt.searchParams.get('ht'), HANDOFF);
    assert.equal(withHt.searchParams.get('st'), null);
    assert.equal(withHt.searchParams.get('mode'), 'resume');
    const legacy = new URL(buildPaperworkLaunchpadUrl({ role: 'indemnitor', st: 'legacy-session' }));
    assert.equal(legacy.searchParams.get('st'), 'legacy-session');
    assert.equal(legacy.searchParams.get('ht'), null);
});

test('continue-paperwork pages mint ht and the role gates stay fail-closed', () => {
    const indemnitor = fs.readFileSync(path.join(root, 'src/pages/Indemnitor Portal.go8lz.js'), 'utf8');
    const defendant = fs.readFileSync(path.join(root, 'src/pages/Defendant Portal.adato.js'), 'utf8');
    const jsw = fs.readFileSync(path.join(root, 'src/backend/portal-handoff.jsw'), 'utf8');
    for (const src of [indemnitor, defendant]) {
        assert.match(src, /mintPaperworkHandoff\(sessionToken\)/);
        assert.match(src, /launchPaperworkWithHandoff\(/);
        assert.match(src, /continuePaperwork\(\)/);
    }
    assert.match(indemnitor, /role: 'indemnitor'/);
    assert.match(defendant, /role: 'defendant'/);
    assert.match(indemnitor, /if \(!validation \|\| !validation\.valid \|\| !ALLOWED_ROLES\.includes\(role\)\)/);
    assert.match(defendant, /if \(!validation \|\| !validation\.valid \|\| validation\.role !== 'defendant'\)/);
    assert.match(jsw, /typeof sessionToken !== 'string'/);
    assert.equal(jsw.includes('case_id'), false);
    assert.equal(jsw.includes('person_id'), false);
    const continueBlock = indemnitor.slice(indemnitor.indexOf('async function continuePaperwork'), indemnitor.indexOf('const ACTIONS'));
    assert.equal(continueBlock.includes('buildPaperworkLaunchpadUrl'), false);
    assert.equal(continueBlock.includes('st:'), false);
});
