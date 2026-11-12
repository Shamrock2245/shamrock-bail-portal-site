/**
 * Session-bound case loading and sign-in role resolution.
 * A shared caseId must not open another person's row. A chosen tab does not
 * mint a co-indemnitor, and it does not relabel the primary indemnitor.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    boundDocumentIds,
    detailIdentity,
    phoneLookupVariants,
    portalDetailRoleOk,
    resolveSignInRole,
    sessionOwnsCaseRecord
} from '../src/backend/portalSessionGuards.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const auth = fs.readFileSync(path.join(root, 'src/backend/portal-auth.jsw'), 'utf8');
const page = fs.readFileSync(path.join(root, 'src/pages/Portal.ak0ws.js'), 'utf8');

function session(extra) {
    return Object.assign({
        valid: true,
        personId: 'person-1',
        role: 'defendant',
        caseId: 'case-row-1',
        email: 'ada@example.com',
        phone: '2395550100'
    }, extra);
}

test('phone lookup uses exact numbers only', () => {
    assert.deepEqual(phoneLookupVariants(''), []);
    assert.deepEqual(phoneLookupVariants('555-0100'), []);
    assert.deepEqual(phoneLookupVariants('23955501001'), []);
    const variants = phoneLookupVariants('(239) 555-0100');
    assert.deepEqual(variants, [
        '2395550100',
        '12395550100',
        '+12395550100',
        '(239) 555-0100',
        '239-555-0100'
    ]);
    assert.equal(variants.some((value) => value.length < 10), false);
    assert.doesNotMatch(auth, /\.contains\(field/);
});

test('bound document ids ignore business keys, new users, and the other role prefix', () => {
    assert.deepEqual(boundDocumentIds(session({
        personId: 'new_token',
        caseId: 'CASE-2026-0001'
    })), []);
    assert.deepEqual(boundDocumentIds(session({
        role: 'indemnitor',
        personId: 'indemnitor_row-9',
        caseId: 'CASE-2026-0001'
    })), ['row-9']);
    assert.deepEqual(boundDocumentIds(session({
        role: 'coindemnitor',
        personId: 'coindemnitor_row-9',
        caseId: 'INTAKE-row-9'
    })), ['row-9']);
    assert.deepEqual(boundDocumentIds(session({
        role: 'defendant',
        personId: 'indemnitor_row-9',
        caseId: ''
    })), []);
    assert.deepEqual(boundDocumentIds(session({
        role: 'defendant',
        personId: 'row-9',
        caseId: 'row-9'
    })), ['row-9']);
});

test('a shared caseId does not open another person, and a primary key the session was minted with does', () => {
    const defendant = session({
        personId: 'row-def',
        caseId: 'CASE-SHARED',
        email: 'ada@example.com',
        phone: '2395550100'
    });
    const otherIntake = {
        _id: 'intake-other',
        caseId: 'CASE-SHARED',
        defendantEmail: 'other@example.com',
        defendantPhone: '2395550199',
        indemnitorEmail: 'ada@example.com'
    };
    assert.equal(sessionOwnsCaseRecord(defendant, otherIntake), false);

    const ownIntake = {
        _id: 'intake-own',
        caseId: 'CASE-SHARED',
        defendantEmail: 'ada@example.com'
    };
    assert.equal(sessionOwnsCaseRecord(defendant, ownIntake), true);

    const minted = session({ personId: 'row-def', caseId: 'row-def', email: '', phone: '' });
    assert.equal(sessionOwnsCaseRecord(minted, { _id: 'row-def', caseId: 'CASE-OTHER' }), true);
    assert.equal(sessionOwnsCaseRecord(minted, { _id: 'row-other', caseId: 'row-def' }), false);
});

test('co-indemnitor contact does not match the primary indemnitor on a shared case id', () => {
    const co = session({
        role: 'coindemnitor',
        personId: 'coindemnitor_row-2',
        caseId: 'CASE-SHARED',
        email: 'second@example.com',
        phone: ''
    });
    assert.equal(sessionOwnsCaseRecord(co, {
        _id: 'other-row',
        caseId: 'CASE-SHARED',
        indemnitorEmail: 'second@example.com'
    }), false);
    assert.equal(sessionOwnsCaseRecord(co, {
        _id: 'other-row',
        caseId: 'CASE-SHARED',
        indemnitor2Email: 'second@example.com'
    }), true);
    assert.equal(sessionOwnsCaseRecord(co, { _id: 'row-2', indemnitorEmail: 'primary@example.com' }), true);
});

test('sign-in role follows the row on file, not a requested co-indemnitor label', () => {
    assert.equal(resolveSignInRole('coindemnitor', {}), 'indemnitor');
    assert.equal(resolveSignInRole('defendant', {}), 'defendant');
    assert.equal(resolveSignInRole('indemnitor', {}), 'indemnitor');
    assert.equal(resolveSignInRole('coindemnitor', { indemnitor: true }), 'indemnitor');
    assert.equal(resolveSignInRole('coindemnitor', { coindemnitor: true }), 'coindemnitor');
    assert.equal(resolveSignInRole('indemnitor', { coindemnitor: true }), 'coindemnitor');
    assert.equal(resolveSignInRole('defendant', { defendant: true, indemnitor: true }), 'defendant');
    assert.equal(resolveSignInRole('indemnitor', { defendant: true, indemnitor: true }), 'indemnitor');
    assert.equal(resolveSignInRole('defendant', { indemnitor: true }), 'indemnitor');
    assert.equal(resolveSignInRole('', { defendant: true }), 'defendant');
});

test('detail identity stays on the signed-in person', () => {
    const record = {
        defendantName: 'Ada Defendant',
        defendantEmail: 'ada@example.com',
        indemnitorName: 'Pat Primary',
        indemnitorEmail: 'pat@example.com',
        indemnitorPhone: '2395550111',
        coindemnitorName: 'Sam Second',
        indemnitor2Email: 'sam@example.com'
    };
    const co = detailIdentity(session({
        role: 'coindemnitor',
        email: 'sam@example.com',
        phone: '2395550122',
        name: 'Sam Second'
    }), record);
    assert.equal(co.firstName, 'Sam');
    assert.equal(co.email, 'sam@example.com');
    assert.equal(co.email === record.indemnitorEmail, false);
    assert.equal(co.phone, '2395550122');

    const indemnitor = detailIdentity(session({
        role: 'indemnitor',
        email: 'pat@example.com'
    }), record);
    assert.equal(indemnitor.email, 'pat@example.com');
    assert.equal(detailIdentity(session({ role: 'staff' }), record).email, '');
});

test('detail reads are role gated', () => {
    const defendant = session({ role: 'defendant' });
    const indemnitor = session({ role: 'indemnitor' });
    const co = session({ role: 'coindemnitor' });
    assert.equal(portalDetailRoleOk(defendant, 'defendant'), true);
    assert.equal(portalDetailRoleOk(defendant, 'indemnitor'), false);
    assert.equal(portalDetailRoleOk(indemnitor, 'indemnitor'), true);
    assert.equal(portalDetailRoleOk(co, 'indemnitor'), true);
    assert.equal(portalDetailRoleOk(co, 'defendant'), false);
    assert.equal(portalDetailRoleOk(session({ valid: false }), 'defendant'), false);
    assert.match(auth, /portalDetailRoleOk\(session, 'defendant'\)/);
    assert.match(auth, /portalDetailRoleOk\(session, 'indemnitor'\)/);
    assert.match(auth, /sessionOwnsCaseRecord\(session/);
    assert.doesNotMatch(auth, /replace\(\/\^INTAKE-\//);
    assert.match(auth, /if \(role !== 'defendant'\) role = 'indemnitor'/);
    assert.doesNotMatch(auth, /parsed\.role === 'coindemnitor'/);
    assert.match(auth, /targetName\.length < 3/);
    assert.doesNotMatch(auth, /Please enter a Case Number OR/);
});

test('studio tabs select the sign-in role and do not navigate away', () => {
    assert.match(page, /if \(!launchPaperwork\) return/);
    assert.match(page, /signInTabs\.forEach\(\(\{ id, role \}\) => bindRoleControl\(id, role, false\)\)/);
    assert.match(page, /paperworkLaunchers\.forEach\(\(\{ id, role \}\) => bindRoleControl\(id, role, true\)\)/);
    assert.match(page, /paintSignInRole\('coindemnitor'\)/);
    const sends = page.match(/role: currentSignInRole\(\)/g) || [];
    assert.equal(sends.length >= 2, true);
});
