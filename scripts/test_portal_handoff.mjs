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
import { buildPaperworkLaunchpadUrl, launchPaperworkWithHandoff, handoffUrlRole } from '../src/public/portal-config.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEADS_KEY = 'leads-test-key';
const GAS_KEY = 'gas-test-key';
const SESSION = 'session-token-from-wix-validation';
const WIX_CASE = 'wix-case-record';
const CANONICAL_CASE = 'CASE-2026-0821-X9A2';
const SIGNERS = {
    indemnitor: 'signer-indemnitor-1',
    defendant: 'signer-defendant-1',
    coindemnitor: 'signer-coindemnitor-1'
};
const CLIENT_PERSON = 'client-person-ignored';
const CLIENT_CASE = 'client-case-ignored';
const HANDOFF = 'v1.eyJhdWQiOiJwYXBlcndvcmsifQ.c2lnbmF0dXJl';
const EXPIRES = '2030-01-01T00:00:00Z';

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
        personId: 'indemnitor_' + WIX_CASE,
        caseId: WIX_CASE,
        role: 'indemnitor'
    }, overrides && overrides.session);
    const fetchImpl = async (url, options) => {
        const body = options && options.body ? JSON.parse(options.body) : null;
        calls.push({ url, options, body });
        if (overrides && typeof overrides.fetchImpl === 'function') return overrides.fetchImpl(url, options, body);
        return jsonResponse(200, { token: HANDOFF, expires_at: EXPIRES });
    };
    const deps = {
        fetchImpl,
        getSecret: async (name) => (secrets[name] == null ? '' : secrets[name]),
        validateSession: async () => session,
        loadCase: async () => {
            if (overrides && Object.prototype.hasOwnProperty.call(overrides, 'caseRow')) return overrides.caseRow;
            if (!session.caseId) return null;
            return {
                _id: session.caseId,
                caseId: CANONICAL_CASE,
                indemnitor_id: SIGNERS.indemnitor,
                defendant_id: SIGNERS.defendant,
                co_indemnitor_id: SIGNERS.coindemnitor
            };
        },
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
    assert.equal(blob.includes('indemnitor_' + WIX_CASE), false, 'wix person id leaked');
    assert.equal(blob.includes(WIX_CASE), false, 'wix case id leaked');
    assert.equal(blob.includes(CANONICAL_CASE), false, 'bond case id leaked');
    assert.equal(blob.includes(SIGNERS.indemnitor), false, 'signer id leaked');
    assert.equal(blob.includes(CLIENT_PERSON), false, 'client person leaked');
}

test('POST handoff-token uses the bond case id and signer id, not the Wix session ids', async () => {
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
        case_id: CANONICAL_CASE,
        role: 'indemnitor',
        person_id: SIGNERS.indemnitor
    });
    assert.deepEqual(Object.keys(h.calls[0].body).sort(), ['case_id', 'person_id', 'role']);
    const posted = JSON.stringify(h.calls[0].body);
    assert.equal(posted.includes(CLIENT_CASE), false);
    assert.equal(posted.includes(CLIENT_PERSON), false);
    assert.equal(posted.includes(WIX_CASE), false);
    assert.equal(posted.includes('indemnitor_' + WIX_CASE), false);
    assertNoSecrets(h.logs.join('\n'));
});

test('client-supplied ids are ignored when the session has no case', async () => {
    const h = harness({ session: { valid: true, personId: SIGNERS.defendant, caseId: '', role: 'defendant' } });
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
    const h = harness({ session: { valid: true, personId: 'indemnitor_' + WIX_CASE, caseId: WIX_CASE, role: 'staff' } });
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

test('a stalled response body is covered by the timeout', async () => {
    const h = harness({
        fetchImpl: () => Promise.resolve({
            ok: true,
            status: 200,
            text: () => new Promise(() => {})
        })
    });
    h.deps.timeoutMs = 40;
    const result = await mintHandoffToken({ sessionToken: SESSION }, h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'timeout');
});

test('URL role stays inside the session allowlist', () => {
    assert.equal(handoffUrlRole('coindemnitor'), 'coindemnitor');
    assert.equal(handoffUrlRole('co-indemnitor'), 'coindemnitor');
    assert.equal(handoffUrlRole('defendant'), 'defendant');
    assert.equal(handoffUrlRole('staff'), '');
    const url = launchPaperworkWithHandoff({
        role: 'staff',
        caseId: WIX_CASE,
        handoff: { ok: false }
    });
    assert.equal(new URL(url).searchParams.get('role'), null);
});

test('a token that echoes the Wix session token is rejected', async () => {
    const h = harness({ fetchImpl: () => jsonResponse(200, { token: SESSION, expires_at: '2030-01-01T00:00:00Z' }) });
    const result = await mintHandoffToken({ sessionToken: SESSION }, h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'token');
});

test('URL role and case match the handoff-token body, not caller overrides', async () => {
    const h = harness({
        session: { valid: true, personId: 'coindemnitor_' + WIX_CASE, caseId: WIX_CASE, role: 'coindemnitor' }
    });
    const minted = await mintHandoffToken(clientInput({ role: 'indemnitor', case_id: 'display-case-number' }), h.deps);
    assert.equal(minted.ok, true);
    assert.equal(minted.role, h.calls[0].body.role);
    assert.equal(minted.case_id, h.calls[0].body.case_id);
    const url = launchPaperworkWithHandoff({
        caseId: 'display-case-number',
        role: 'indemnitor',
        mode: 'resume',
        source: 'wix-indemnitor',
        link: 'https://sign.example.test/s/packet',
        sessionToken: SESSION,
        st: SESSION,
        handoff: minted
    });
    const params = new URL(url).searchParams;
    assert.equal(params.get('ht'), HANDOFF);
    assert.equal(params.get('role'), h.calls[0].body.role);
    assert.equal(params.get('case'), h.calls[0].body.case_id);
    assert.equal(params.get('role'), 'coindemnitor');
    assert.equal(params.get('case'), CANONICAL_CASE);
    assert.equal(h.calls[0].body.person_id, SIGNERS.coindemnitor);
    assert.equal(url.includes(WIX_CASE), false);
    assert.equal(url.includes('coindemnitor_' + WIX_CASE), false);
    assert.equal(params.get('mode'), null);
    assert.equal(params.get('st'), null);
    assert.equal(params.get('source'), null);
    assert.equal(params.get('link'), null);
    assert.deepEqual([...params.keys()].sort(), ['case', 'ht', 'role']);
    assert.equal(url.includes('display-case-number'), false);
    assert.equal(url.includes(CLIENT_CASE), false);
    assert.equal(url.includes(SESSION), false);
});

test('a non-contract token or expiry is not minted, so the URL stays on the PIN path', async () => {
    const opaque = harness({
        fetchImpl: () => jsonResponse(200, { token: 'handoff-token-abc', expires_at: EXPIRES })
    });
    const opaqueResult = await mintHandoffToken({ sessionToken: SESSION }, opaque.deps);
    assert.equal(opaqueResult.ok, false);
    assert.equal(opaqueResult.reason, 'token');
    const badExpiry = harness({
        fetchImpl: () => jsonResponse(200, { token: HANDOFF, expires_at: 'tomorrow' })
    });
    const expiryResult = await mintHandoffToken({ sessionToken: SESSION }, badExpiry.deps);
    assert.equal(expiryResult.ok, false);
    const url = launchPaperworkWithHandoff({
        caseId: WIX_CASE,
        role: 'defendant',
        source: 'wix-defendant',
        handoff: opaqueResult
    });
    const params = new URL(url).searchParams;
    assert.equal(params.get('ht'), null);
    assert.equal(params.get('role'), 'defendant');
    assert.equal(params.get('case'), WIX_CASE);
    assert.equal(params.get('link'), null);
});

test('a token without session role and case claims is not put on the URL', () => {
    const url = launchPaperworkWithHandoff({
        caseId: 'display-case',
        role: 'indemnitor',
        mode: 'resume',
        sessionToken: SESSION,
        handoff: { ok: true, token: HANDOFF }
    });
    const params = new URL(url).searchParams;
    assert.equal(params.get('ht'), null);
    assert.equal(params.get('role'), 'indemnitor');
    assert.equal(params.get('case'), 'display-case');
    assert.equal(params.get('mode'), null);
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

test('defendant and coindemnitor rows post that role signer id only', async () => {
    for (const role of ['defendant', 'coindemnitor']) {
        const h = harness({
            session: { valid: true, personId: role + '_' + WIX_CASE, caseId: WIX_CASE, role: role }
        });
        const result = await mintHandoffToken(clientInput({
            case_id: CANONICAL_CASE,
            person_id: SIGNERS[role],
            role: role
        }), h.deps);
        assert.equal(result.ok, true);
        assert.deepEqual(h.calls[0].body, {
            case_id: CANONICAL_CASE,
            role: role,
            person_id: SIGNERS[role]
        });
    }
});

test('an intake session whose case id is already the bond id still uses the row signer', async () => {
    const h = harness({
        session: { valid: true, personId: 'intake-wix-id', caseId: CANONICAL_CASE, role: 'defendant' },
        caseRow: {
            _id: WIX_CASE,
            caseId: CANONICAL_CASE,
            defendant_id: SIGNERS.defendant
        }
    });
    const result = await mintHandoffToken(clientInput({ person_id: 'intake-wix-id', case_id: CANONICAL_CASE }), h.deps);
    assert.equal(result.ok, true);
    assert.deepEqual(h.calls[0].body, {
        case_id: CANONICAL_CASE,
        role: 'defendant',
        person_id: SIGNERS.defendant
    });
    assert.equal(JSON.stringify(h.calls[0].body).includes('intake-wix-id'), false);
});

test('missing or synthetic signer ids do not post the Wix session and ignore client ids', async () => {
    const missing = harness({
        caseRow: { _id: WIX_CASE, caseId: CANONICAL_CASE }
    });
    const missingResult = await mintHandoffToken(clientInput({
        case_id: CANONICAL_CASE,
        person_id: SIGNERS.indemnitor
    }), missing.deps);
    assert.equal(missingResult.ok, false);
    assert.equal(missingResult.reason, 'identity');
    assert.equal(missing.calls.length, 0);

    const synthetic = harness({
        caseRow: { _id: WIX_CASE, caseId: CANONICAL_CASE, indemnitor_id: 'indemnitor_' + WIX_CASE }
    });
    const syntheticResult = await mintHandoffToken(clientInput(), synthetic.deps);
    assert.equal(syntheticResult.ok, false);
    assert.equal(synthetic.calls.length, 0);

    const sameAsWix = harness({
        caseRow: { _id: WIX_CASE, caseId: WIX_CASE, indemnitor_id: SIGNERS.indemnitor }
    });
    const sameResult = await mintHandoffToken(clientInput(), sameAsWix.deps);
    assert.equal(sameResult.ok, false);
    assert.equal(sameAsWix.calls.length, 0);
});

test('a case row for a different record is not used', async () => {
    const h = harness({
        caseRow: { _id: 'other-wix-id', caseId: 'OTHER-CASE', indemnitor_id: SIGNERS.indemnitor }
    });
    const result = await mintHandoffToken(clientInput({ case_id: 'OTHER-CASE', person_id: SIGNERS.indemnitor }), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'identity');
    assert.equal(h.calls.length, 0);
});

test('a loadCase failure does not call leads', async () => {
    const h = harness();
    h.deps.loadCase = async () => { throw new Error('cms down'); };
    const result = await mintHandoffToken(clientInput(), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'identity');
    assert.equal(h.calls.length, 0);
    assertNoSecrets(h.logs.join('\n'));
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
    assert.match(indemnitor, /handoffUrlRole\(currentSession && currentSession.role\)/);
    assert.match(defendant, /handoffUrlRole\(currentSession && currentSession.role\)/);
    assert.match(indemnitor, /caseId: currentSession && currentSession.caseId/);
    assert.match(defendant, /caseId: currentSession && currentSession.caseId/);
    assert.match(indemnitor, /if \(!validation \|\| !validation\.valid \|\| !ALLOWED_ROLES\.includes\(role\)\)/);
    assert.match(defendant, /if \(!validation \|\| !validation\.valid \|\| validation\.role !== 'defendant'\)/);
    assert.match(jsw, /typeof sessionToken !== 'string'/);
    assert.match(jsw, /loadCase: loadPortalCase/);
    assert.equal(jsw.includes('case_id'), false);
    assert.equal(jsw.includes('person_id'), false);
    const continueBlock = indemnitor.slice(indemnitor.indexOf('async function continuePaperwork'), indemnitor.indexOf('const ACTIONS'));
    const defendantBlock = defendant.slice(defendant.indexOf('async function continuePaperwork'), defendant.indexOf('const ACTIONS'));
    for (const block of [continueBlock, defendantBlock]) {
        assert.equal(block.includes('buildPaperworkLaunchpadUrl'), false);
        assert.equal(block.includes('caseNumber'), false);
        assert.equal(block.includes('st:'), false);
        assert.equal(block.includes("role: 'indemnitor'"), false);
        assert.equal(block.includes("role: 'defendant'"), false);
    }
});
