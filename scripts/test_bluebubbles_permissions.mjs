#!/usr/bin/env node
/**
 * Web-method permissions for iMessage and SMS sends.
 * Anonymous visitors and site members must not invoke a function that
 * sends from the office line. Backend imports are not gated by this file.
 * No network. No secrets.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
    return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exportedAsyncFunctions(src) {
    return [...src.matchAll(/export\s+async\s+function\s+([A-Za-z0-9_]+)/g)].map((m) => m[1]);
}

const perms = JSON.parse(read('src/backend/permissions.json'));
const methods = perms['web-methods'];

function fileBlock(file) {
    const block = methods[file];
    assert.ok(block, file + ' is missing from permissions.json');
    return block;
}

function assertOwnerOnly(block, label) {
    assert.equal(block.siteOwner && block.siteOwner.invoke, true, label + ' siteOwner');
    assert.equal(block.siteMember && block.siteMember.invoke, false, label + ' siteMember');
    assert.equal(block.anonymous && block.anonymous.invoke, false, label + ' anonymous');
}

function effectiveInvoke(file, fn, role) {
    const block = methods[file];
    const spec = block && (block[fn] || block['*']);
    const entry = spec || (methods['*'] && methods['*']['*']);
    return !!(entry && entry[role] && entry[role].invoke === true);
}

function walkJs(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) walkJs(full, out);
        else if (ent.name.endsWith('.js')) out.push(full);
    }
    return out;
}

test('bluebubbles send and probe are owner-only, per function', () => {
    const block = fileBlock('bluebubbles.jsw');
    assertOwnerOnly(block['*'], 'bluebubbles.jsw *');

    const names = exportedAsyncFunctions(read('src/backend/bluebubbles.jsw'));
    assert.deepEqual(names.sort(), ['probeIMessageBridge', 'sendBlueBubblesMessage']);

    for (const name of names) {
        assert.ok(block[name], 'missing per-function entry for ' + name);
        assertOwnerOnly(block[name], 'bluebubbles.jsw ' + name);
        assert.equal(effectiveInvoke('bluebubbles.jsw', name, 'anonymous'), false);
        assert.equal(effectiveInvoke('bluebubbles.jsw', name, 'siteMember'), false);
        assert.equal(effectiveInvoke('bluebubbles.jsw', name, 'siteOwner'), true);
    }

    for (const [fn, spec] of Object.entries(block)) {
        assert.equal(spec.anonymous && spec.anonymous.invoke, false, fn + ' anonymous');
        assert.equal(spec.siteMember && spec.siteMember.invoke, false, fn + ' siteMember');
    }
});

test('twilio SMS send exports are owner-only', () => {
    const block = fileBlock('twilio-client.jsw');
    assertOwnerOnly(block['*'], 'twilio-client.jsw *');

    const names = exportedAsyncFunctions(read('src/backend/twilio-client.jsw'));
    const sends = names.filter((name) => name.startsWith('send'));
    assert.ok(sends.includes('sendSms'));
    assert.ok(sends.includes('sendStealthPingSms'));

    for (const name of sends) {
        assert.ok(block[name], 'missing per-function entry for ' + name);
        assertOwnerOnly(block[name], 'twilio-client.jsw ' + name);
        assert.equal(effectiveInvoke('twilio-client.jsw', name, 'anonymous'), false);
        assert.equal(effectiveInvoke('twilio-client.jsw', name, 'siteMember'), false);
    }

    assert.equal(names.includes('checkVerificationCode'), true);
    assert.equal(effectiveInvoke('twilio-client.jsw', 'checkVerificationCode', 'anonymous'), false);
    assert.equal(effectiveInvoke('twilio-client.jsw', 'checkVerificationCode', 'siteMember'), false);
});

test('notificationService SMS send is owner-only', () => {
    const block = fileBlock('notificationService.jsw');
    assertOwnerOnly(block.sendMemberNotification, 'sendMemberNotification');
    assert.equal(effectiveInvoke('notificationService.jsw', 'sendMemberNotification', 'anonymous'), false);
    assert.equal(effectiveInvoke('notificationService.jsw', 'sendMemberNotification', 'siteMember'), false);
});

test('scheduler and retired signing SMS web methods stay closed to visitors', () => {
    for (const name of ['sendCourtDateReminders', 'sendPaymentReminders', 'sendCheckInComplianceReport']) {
        assert.equal(effectiveInvoke('scheduler.jsw', name, 'anonymous'), false, name);
        assert.equal(effectiveInvoke('scheduler.jsw', name, 'siteMember'), false, name);
    }
    for (const name of ['sendViaSMS', 'sendSigningLinkViaSms']) {
        assert.equal(effectiveInvoke('signing-methods.jsw', name, 'anonymous'), false, name);
        assert.equal(effectiveInvoke('signing-methods.jsw', name, 'siteMember'), false, name);
    }
});

test('callGasAction cannot relay an arbitrary iMessage', () => {
    const gas = read('src/backend/gasIntegration.jsw');
    const start = gas.indexOf('const ALLOWED_GAS_ACTIONS');
    const end = gas.indexOf('export async function callGasAction');
    assert.ok(start !== -1 && end > start);
    const allowlist = gas.slice(start, end);
    assert.equal(allowlist.includes('sendBlueBubblesRelay'), false);
    assert.match(read('src/backend/portal-signin-dispatch.js'), /sendBlueBubblesRelay/);
});

test('portal session minting stays off the anonymous web surface', () => {
    const block = fileBlock('portal-auth.jsw');
    assertOwnerOnly(block['*'], 'portal-auth.jsw *');
    for (const name of [
        'createCustomSession',
        'generateMagicLink',
        'lookupUserByContact',
        'getStaffDashboardData',
        'getDefendantPortalData',
        'getIndemnitorPortalData',
        'linkDefendantToCase'
    ]) {
        assert.equal(effectiveInvoke('portal-auth.jsw', name, 'anonymous'), false, name);
        assert.equal(effectiveInvoke('portal-auth.jsw', name, 'siteMember'), false, name);
    }
    for (const name of [
        'sendMagicLinkSimplified',
        'onMagicLinkLoginV2',
        'validateCustomSession',
        'onTelegramLogin',
        'getDefendantDetails',
        'getIndemnitorDetails',
        'invalidateSession'
    ]) {
        assert.equal(effectiveInvoke('portal-auth.jsw', name, 'anonymous'), true, name);
        assert.equal(effectiveInvoke('portal-auth.jsw', name, 'siteMember'), true, name);
    }
});

test('magic-link send stays on the server, and no page imports bluebubbles sends', () => {
    const auth = read('src/backend/portal-auth.jsw');
    assert.match(auth, /from 'backend\/portal-signin-dispatch'/);
    assert.match(auth, /deliverPortalSignInLink/);
    assert.doesNotMatch(auth, /backend\/bluebubbles/);
    assert.doesNotMatch(auth, /sendBlueBubblesMessage/);

    const signing = read('src/backend/signing-session-service.jsw');
    assert.match(signing, /from 'backend\/bluebubbles'/);
    assert.match(signing, /sendBlueBubblesMessage\(/);

    const dispatch = read('src/backend/portal-signin-dispatch.js');
    assert.equal(dispatch.includes('export async function dashboardSend'), true);
    assert.equal(fs.existsSync(path.join(root, 'src/backend/portal-signin-dispatch.jsw')), false);

    const roots = ['src/pages', 'src/public', 'src/lightboxes', 'src/custom-embeds'];
    const hits = [];
    for (const rel of roots) {
        for (const file of walkJs(path.join(root, rel))) {
            const text = fs.readFileSync(file, 'utf8');
            if (/backend\/bluebubbles|sendBlueBubblesMessage|probeIMessageBridge/.test(text)) {
                hits.push(path.relative(root, file));
            }
        }
    }
    assert.deepEqual(hits, []);
});
