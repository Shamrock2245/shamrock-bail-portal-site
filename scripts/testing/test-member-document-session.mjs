/**
 * getMemberDocuments must key off the session email, never a browser email.
 * Detail reads require session.valid. linkDefendantToCase mints a session and
 * does not require one that already exists.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    memberDocumentAccess,
    portalDetailsSessionOk,
    resolveDocumentSessionToken
} from '../../src/backend/portalSessionGuards.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const portalAuth = readFileSync(join(root, 'src/backend/portal-auth.jsw'), 'utf8');
const documentUpload = readFileSync(join(root, 'src/backend/documentUpload.jsw'), 'utf8');

function sliceFn(source, name) {
    const start = source.indexOf(`export async function ${name}`);
    assert.notEqual(start, -1, name);
    const next = source.indexOf('\nexport async function ', start + 10);
    return source.slice(start, next === -1 ? undefined : next);
}

const browserEmail = 'someone-else@example.com';
const sessionEmail = 'member@example.com';

assert.equal(
    resolveDocumentSessionToken(
        { memberEmail: browserEmail, sessionToken: 'tok-1' },
        undefined
    ),
    'tok-1'
);
assert.equal(resolveDocumentSessionToken(browserEmail, 'tok-2'), 'tok-2');
assert.equal(resolveDocumentSessionToken('tok-3'), 'tok-3');
assert.equal(resolveDocumentSessionToken({ memberEmail: browserEmail }), '');

const invalid = memberDocumentAccess({ valid: false, email: sessionEmail });
assert.equal(invalid.ok, false);

const noEmail = memberDocumentAccess({ valid: true, email: '  ' });
assert.equal(noEmail.ok, true);
assert.equal(noEmail.email, '');

const allowed = memberDocumentAccess({ valid: true, email: `  ${sessionEmail}  ` });
assert.equal(allowed.ok, true);
assert.equal(allowed.email, sessionEmail);
assert.equal(allowed.email === browserEmail, false);

assert.equal(portalDetailsSessionOk({ valid: false, personId: 'p1' }), false);
assert.equal(portalDetailsSessionOk({ valid: true, personId: '' }), false);
assert.equal(portalDetailsSessionOk({ valid: true, personId: 'p1' }), true);
assert.equal(portalDetailsSessionOk(null), false);

const linkFn = sliceFn(portalAuth, 'linkDefendantToCase');
assert.equal(linkFn.includes('session.valid'), false);
assert.equal(linkFn.includes('validateCustomSession'), false);

const defendantFn = sliceFn(portalAuth, 'getDefendantDetails');
const indemnitorFn = sliceFn(portalAuth, 'getIndemnitorDetails');
assert.equal(defendantFn.includes('portalDetailsSessionOk(session)'), true);
assert.equal(indemnitorFn.includes('portalDetailsSessionOk(session)'), true);

const docsFn = sliceFn(documentUpload, 'getMemberDocuments');
assert.equal(docsFn.includes('memberDocumentAccess'), true);
assert.equal(docsFn.includes('resolveDocumentSessionToken'), true);
assert.equal(docsFn.includes(".eq('memberEmail', memberEmail)"), false);
assert.equal(docsFn.includes(".eq('memberEmail', arg1)"), false);

console.log('member document session checks ok');
