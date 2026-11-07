#!/usr/bin/env node
/**
 * Co-signer self-invite. Mocked fetch only. No network. No secrets.
 * Client-supplied case and person ids are ignored. The portal does not text.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requestCosignerInvite, INVITE_PATH, validateCosignerFields, normalizeNamePunctuation } from '../src/backend/portalCosignerInvite.js';
import { invitePresentation, shareData, canShare, COSIGNER_FAIL } from '../src/public/cosigner-invite-ui.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEADS_KEY = 'leads-test-key';
const GAS_KEY = 'gas-test-key';
const SESSION = 'session-token-from-wix-validation';
const WIX_CASE = 'wix-case-record';
const CANONICAL_CASE = 'CASE-2026-0821-X9A2';
const SIGNERS = {
    indemnitor: 'signer-indemnitor-1',
    coindemnitor: 'signer-coindemnitor-1'
};
const CLIENT_PERSON = 'client-person-ignored';
const CLIENT_CASE = 'client-case-ignored';
const CLIENT_INVITER = 'client-inviter-ignored';
const INVITE = 'https://dashboard.test/invite/example-token';
const NAME = 'Alex Example';
const EMAIL = 'invitee@example.com';
const PHONE_DISPLAY = '(239) 332-2245';
const PHONE_DIGITS = '2393322245';

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
        return jsonResponse(200, { ok: true, invite_url: INVITE });
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
                co_indemnitor_id: SIGNERS.coindemnitor
            };
        },
        logger: { warn: (...args) => logs.push(args.map(String).join(' ')) },
        timeoutMs: 200,
        leadsBase: 'https://dashboard.test'
    };
    return { calls, logs, deps };
}

function clientInput(extra) {
    return Object.assign({
        sessionToken: SESSION,
        case_id: CLIENT_CASE,
        person_id: CLIENT_PERSON,
        inviter_person_id: CLIENT_INVITER,
        caseId: CLIENT_CASE,
        personId: CLIENT_PERSON
    }, extra || {});
}

function assertNoSecrets(blob) {
    for (const secret of [LEADS_KEY, GAS_KEY, SESSION, 'indemnitor_' + WIX_CASE, WIX_CASE, CANONICAL_CASE, SIGNERS.indemnitor, CLIENT_PERSON, CLIENT_INVITER, CLIENT_CASE, INVITE, NAME, EMAIL, PHONE_DIGITS]) {
        assert.equal(blob.includes(secret), false, 'leaked ' + secret);
    }
}

test('invite posts the bond case id and signer id, not the Wix session ids', async () => {
    const h = harness();
    const result = await requestCosignerInvite(clientInput({
        cosigner_name: NAME,
        cosigner_phone: PHONE_DISPLAY,
        cosigner_email: EMAIL
    }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(result.invite_url, INVITE);
    assert.equal(h.calls.length, 1);
    assert.equal(h.calls[0].url, 'https://dashboard.test' + INVITE_PATH);
    assert.equal(h.calls[0].options.method, 'POST');
    assert.equal(h.calls[0].options.headers['X-API-Key'], LEADS_KEY);
    assert.equal(h.calls[0].options.headers['X-Internal-Token'], LEADS_KEY);
    assert.deepEqual(h.calls[0].body, {
        case_id: CANONICAL_CASE,
        person_id: SIGNERS.indemnitor,
        inviter_person_id: SIGNERS.indemnitor,
        cosigner_name: NAME,
        cosigner_phone: PHONE_DIGITS,
        cosigner_email: EMAIL
    });
    const posted = JSON.stringify(h.calls[0].body);
    assert.equal(posted.includes(CLIENT_CASE), false);
    assert.equal(posted.includes(CLIENT_PERSON), false);
    assert.equal(posted.includes(CLIENT_INVITER), false);
    assert.equal(posted.includes(WIX_CASE), false);
    assert.equal(posted.includes('indemnitor_' + WIX_CASE), false);
    assert.equal(Object.prototype.hasOwnProperty.call(h.calls[0].body, 'role'), false);
    assert.equal(h.calls.some((c) => /imessage|twilio|sms/i.test(c.url)), false);
    assertNoSecrets(h.logs.join('\n'));
});

test('optional contact fields are omitted when blank, and client ids are still ignored', async () => {
    const h = harness({ session: { role: 'coindemnitor' } });
    const result = await requestCosignerInvite(clientInput({
        cosigner_name: '   ',
        cosigner_phone: '',
        cosigner_email: ''
    }), h.deps);
    assert.equal(result.ok, true);
    assert.deepEqual(h.calls[0].body, {
        case_id: CANONICAL_CASE,
        person_id: SIGNERS.coindemnitor,
        inviter_person_id: SIGNERS.coindemnitor
    });
});

test('client-supplied ids are ignored when the session has no case', async () => {
    const h = harness({ session: { valid: true, personId: 'indemnitor_' + WIX_CASE, caseId: '', role: 'indemnitor' } });
    const result = await requestCosignerInvite(clientInput(), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'session');
    assert.equal(h.calls.length, 0);
});

test('defendant and staff sessions cannot invite', async () => {
    for (const role of ['defendant', 'staff']) {
        const h = harness({ session: { role: role } });
        const result = await requestCosignerInvite(clientInput({ role: 'indemnitor' }), h.deps);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'role');
        assert.equal(h.calls.length, 0);
    }
});

test('invalid contact fields do not call leads and are not logged', async () => {
    const samples = [
        { cosigner_phone: '12345' },
        { cosigner_email: 'not-an-email' },
        { cosigner_name: 'A'.repeat(81) },
        { cosigner_name: 'Bad\nName' }
    ];
    for (const extra of samples) {
        const h = harness();
        const result = await requestCosignerInvite(clientInput(extra), h.deps);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'invalid');
        assert.equal(h.calls.length, 0);
        assertNoSecrets(h.logs.join('\n'));
    }
    assert.equal(validateCosignerFields({ cosigner_phone: PHONE_DISPLAY }).fields.cosigner_phone, PHONE_DIGITS);
});

test('a missing invite route is not_found and other failures stay unavailable', async () => {
    const missing = harness({ fetchImpl: () => jsonResponse(404, { ok: false }) });
    const notFound = await requestCosignerInvite(clientInput(), missing.deps);
    assert.equal(notFound.ok, false);
    assert.equal(notFound.reason, 'not_found');
    assert.equal(notFound.invite_url, undefined);
    for (const status of [500, 401]) {
        const h = harness({ fetchImpl: () => jsonResponse(status, { ok: false }) });
        const result = await requestCosignerInvite(clientInput(), h.deps);
        assert.equal(result.ok, false);
        assert.equal(result.reason, 'unavailable');
    }
    const hung = harness({ fetchImpl: () => new Promise(() => {}) });
    hung.deps.timeoutMs = 30;
    const timed = await requestCosignerInvite(clientInput(), hung.deps);
    assert.equal(timed.ok, false);
    assert.equal(timed.reason, 'timeout');
    const stalledBody = harness({
        fetchImpl: () => Promise.resolve({
            ok: true,
            status: 200,
            text: () => new Promise(() => {})
        })
    });
    stalledBody.deps.timeoutMs = 40;
    const stalled = await requestCosignerInvite(clientInput(), stalledBody.deps);
    assert.equal(stalled.ok, false);
    assert.equal(stalled.reason, 'timeout');
});

test('missing canonical ids do not call leads and are not a route 404', async () => {
    const missing = harness({
        caseRow: { _id: WIX_CASE, caseId: CANONICAL_CASE }
    });
    const result = await requestCosignerInvite(clientInput({
        case_id: CANONICAL_CASE,
        person_id: SIGNERS.indemnitor,
        role: 'indemnitor'
    }), missing.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'identity');
    assert.notEqual(result.reason, 'not_found');
    assert.equal(missing.calls.length, 0);
    const synthetic = harness({
        caseRow: { _id: WIX_CASE, caseId: CANONICAL_CASE, indemnitor_id: 'indemnitor_' + WIX_CASE }
    });
    const syntheticResult = await requestCosignerInvite(clientInput(), synthetic.deps);
    assert.equal(syntheticResult.ok, false);
    assert.equal(syntheticResult.reason, 'identity');
    assert.equal(synthetic.calls.length, 0);
});

test('non-https invite URLs are refused', async () => {
    const h = harness({ fetchImpl: () => jsonResponse(200, { ok: true, invite_url: 'http://dashboard.test/invite' }) });
    const result = await requestCosignerInvite(clientInput(), h.deps);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'unavailable');
});

test('GAS_API_KEY is used only when LEADS_API_KEY is empty', async () => {
    const h = harness({ secrets: { LEADS_API_KEY: '' } });
    const result = await requestCosignerInvite(clientInput(), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.calls[0].options.headers['X-API-Key'], GAS_KEY);
    assert.equal(h.calls[0].options.headers['X-Internal-Token'], GAS_KEY);
    assertNoSecrets(h.logs.join('\n'));
});

test('presentation offers copy and share data and the failure line is the office number', () => {
    const ready = invitePresentation({ ok: true, invite_url: INVITE });
    assert.equal(ready.ok, true);
    assert.equal(ready.inviteUrl, INVITE);
    assert.deepEqual(shareData(ready.inviteUrl), { title: 'Shamrock Bail Bonds co-signer link', url: INVITE });
    assert.equal(Object.keys(shareData(ready.inviteUrl)).includes('text'), false);
    const failed = invitePresentation({ ok: false, reason: 'unavailable' });
    assert.equal(failed.ok, false);
    assert.equal(failed.message, COSIGNER_FAIL);
    assert.match(failed.message, /\(239\) 332-2245/);
    assert.equal(canShare({ share: function () {} }), true);
    assert.equal(canShare({}), false);
});

test('smart apostrophes and hyphens in names are folded and unsafe names stay rejected', async () => {
    const curly = 'O\u2019Connor';
    const enDash = 'Anne\u2013Marie';
    const folded = validateCosignerFields({ cosigner_name: curly + ' ' + enDash });
    assert.equal(folded.ok, true);
    assert.equal(folded.fields.cosigner_name, "O'Connor Anne-Marie");
    assert.equal(normalizeNamePunctuation(curly), "O'Connor");
    const h = harness();
    const result = await requestCosignerInvite(clientInput({ cosigner_name: curly }), h.deps);
    assert.equal(result.ok, true);
    assert.equal(h.calls[0].body.cosigner_name, "O'Connor");
    assert.equal(JSON.stringify(h.calls[0].body).includes('\u2019'), false);
    const rejected = [
        'O\u2019<script>',
        'Name\u201cQuoted',
        '\u2019Connor',
        'Bad\nName',
        'A'.repeat(81)
    ];
    for (const cosigner_name of rejected) {
        const bad = validateCosignerFields({ cosigner_name: cosigner_name });
        assert.equal(bad.ok, false, cosigner_name);
    }
});

test('the indemnitor page invites instead of texting, and the role gate stays fail-closed', () => {
    const page = fs.readFileSync(path.join(root, 'src/pages/Indemnitor Portal.go8lz.js'), 'utf8');
    const jsw = fs.readFileSync(path.join(root, 'src/backend/portal-cosigner-invite.jsw'), 'utf8');
    const embed = fs.readFileSync(path.join(root, 'netlify-embeds/indemnitor-dashboard.html'), 'utf8');
    assert.match(page, /if \(!validation \|\| !validation\.valid \|\| !ALLOWED_ROLES\.includes\(role\)\)/);
    assert.match(page, /createCosignerInvite\(sessionToken, readCosignerFields\(msg\)\)/);
    assert.match(page, /safeSetText\('#textDocumentsList'/);
    assert.match(page, /safeSetText\('#textPaymentStatus'/);
    assert.equal(page.includes('#boxCosignerInvite'), false);
    assert.equal(page.includes('#btnCopyCosignerInvite'), false);
    const inviteFn = page.slice(page.indexOf('async function inviteCosigner'), page.indexOf('const ACTIONS'));
    assert.equal(/twilio|imessage|OFFICE_SMS|sms:/i.test(inviteFn), false);
    assert.match(inviteFn, /result\.reason === 'not_found'/);
    assert.match(inviteFn, /buildPaperworkLaunchpadUrl\(\{/);
    assert.match(inviteFn, /role: 'coindemnitor'/);
    assert.match(inviteFn, /mode: 'add-cosigner'/);
    assert.equal(inviteFn.includes('st:'), false);
    assert.equal(inviteFn.includes('case_id'), false);
    assert.equal(inviteFn.includes('person_id'), false);
    assert.equal(jsw.includes('case_id'), false);
    assert.equal(jsw.includes('person_id'), false);
    assert.match(jsw, /loadCase: loadPortalCase/);
    assert.match(jsw, /typeof sessionToken !== 'string'/);
    const launch = inviteFn.slice(inviteFn.indexOf("reason === 'not_found'"), inviteFn.indexOf('invitePresentation'));
    assert.equal(launch.includes('identity'), false);
    const block = embed.slice(embed.indexOf('id="invite-out"'), embed.indexOf('id="invite-url"') + 400);
    assert.equal(/sms:|twilio/i.test(block), false);
    assert.match(embed, /navigator\.share/);
    assert.match(embed, /textContent/);
    const script = embed.slice(embed.indexOf('<script>') + 8, embed.lastIndexOf('</script>'));
    new Function(script);
});
