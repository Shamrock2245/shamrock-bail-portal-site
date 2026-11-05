#!/usr/bin/env node
/**
 * Retired Studio lightboxes.
 * ID upload and signing navigate to the paperwork launchpad.
 * Consent fails closed. ID document rows stay insert-only.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPaperworkLaunchpadUrl, PAPERWORK_MODE_ID_UPLOAD, COLLATERAL_DOCUMENT_TYPE } from '../src/public/portal-config.js';
import { signingHandoffDecision } from '../src/public/signing-handoff.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
    return fs.readFileSync(path.join(root, rel), 'utf8');
}

function between(src, startMark, endMark) {
    const start = src.indexOf(startMark);
    const end = src.indexOf(endMark, start + startMark.length);
    assert.ok(start !== -1 && end !== -1, startMark);
    return src.slice(start, end);
}

const CALLERS = [
    'src/pages/Indemnitor Portal.go8lz.js',
    'src/pages/Defendant Portal.adato.js',
    'src/pages/Portal.ak0ws.js',
    'src/public/paperwork-preview-studio.js',
    'src/public/geolocation-client.js',
    'src/public/lightbox-controller.js',
    'src/lightboxes/DefendantDetails.js'
];

test('collateral upload stays on the live launchpad until id-upload is merged', () => {
    assert.equal(PAPERWORK_MODE_ID_UPLOAD, 'id-upload');
    assert.equal(COLLATERAL_DOCUMENT_TYPE, 'collateral');

    const upload = new URL(buildPaperworkLaunchpadUrl({
        caseId: 'CASE-1',
        role: 'indemnitor',
        st: 'session-1',
        mode: PAPERWORK_MODE_ID_UPLOAD,
        documentType: COLLATERAL_DOCUMENT_TYPE,
        source: 'wix-indemnitor'
    }));
    assert.equal(upload.searchParams.has('mode'), false);
    assert.equal(upload.searchParams.get('documentType'), 'collateral');
    assert.equal(upload.searchParams.get('case'), 'CASE-1');
    assert.equal(upload.searchParams.get('role'), 'indemnitor');
    assert.equal(upload.searchParams.get('st'), 'session-1');
    assert.equal(upload.origin, 'https://paperwork.shamrockbailbonds.biz');

    const cosigner = new URL(buildPaperworkLaunchpadUrl({
        caseId: 'CASE-2',
        role: 'coindemnitor',
        mode: 'add-cosigner',
        source: 'wix-indemnitor'
    }));
    assert.equal(cosigner.searchParams.get('mode'), 'add-cosigner');

    const signing = new URL(buildPaperworkLaunchpadUrl({
        caseId: 'CASE-9',
        role: 'defendant',
        signUrl: 'https://sign.example/session',
        source: 'wix-paperwork-preview'
    }));
    assert.equal(signing.searchParams.has('mode'), false);
    assert.equal(signing.searchParams.get('role'), 'defendant');
    assert.equal(signing.searchParams.get('case'), 'CASE-9');
    assert.equal(signing.searchParams.get('link'), 'https://sign.example/session');
    assert.equal(signing.searchParams.has('st'), false);
});

test('callers no longer open the deleted lightboxes', () => {
    for (const rel of CALLERS) {
        const src = read(rel);
        assert.equal(src.includes("openLightbox('IdUploadLightbox'"), false, rel);
        assert.equal(src.includes('openLightbox("IdUploadLightbox"'), false, rel);
        assert.equal(src.includes("openLightbox('SigningLightbox'"), false, rel);
        assert.equal(src.includes('openLightbox("SigningLightbox"'), false, rel);
        assert.equal(src.includes("openLightbox('ConsentLightbox'"), false, rel);
        assert.equal(src.includes('openLightbox("ConsentLightbox"'), false, rel);
    }
});

test('indemnitor upload keeps case, role, and collateral documentType', () => {
    const src = read('src/pages/Indemnitor Portal.go8lz.js');
    const upload = between(src, "'upload-collateral': () => {", "'add-cosigner'");
    assert.match(upload, /caseId: indemnitorData\?\.caseNumber/);
    assert.match(upload, /role: 'indemnitor'/);
    assert.match(upload, /documentType: COLLATERAL_DOCUMENT_TYPE/);
    assert.match(upload, /buildPaperworkLaunchpadUrl/);
    assert.doesNotMatch(upload, /PAPERWORK_MODE_ID_UPLOAD|mode:/);
    assert.doesNotMatch(upload, /\bst:/);
    assert.match(src, /const ALLOWED_ROLES = \['indemnitor', 'coindemnitor'\]/);
    assert.match(src, /if \(!validation \|\| !validation\.valid \|\| !ALLOWED_ROLES\.includes\(role\)\)/);
});

test('defendants still sign on every bond through the paperwork launchpad', () => {
    const defendant = read('src/pages/Defendant Portal.adato.js');
    const portal = read('src/pages/Portal.ak0ws.js');
    const preview = read('src/public/paperwork-preview-studio.js');
    assert.match(defendant, /if \(!validation \|\| !validation\.valid \|\| validation\.role !== 'defendant'\)/);
    assert.match(defendant, /role: 'defendant', source: 'wix-defendant'/);
    assert.match(defendant, /mode: 'additional-bond'/);
    assert.match(defendant, /Defendants sign on every bond/);
    assert.match(portal, /defendant still signs on every bond/i);
    const sign = between(preview, "if (decision.action === 'navigate')", 'awaitingFreshLink = true');
    assert.match(sign, /role: activeRole/);
    assert.match(sign, /caseId: canonicalCase\.caseId/);
    assert.match(sign, /signUrl: decision\.signingUrl/);
    assert.doesNotMatch(sign, /canonicalCase\.signingUrl/);
    assert.doesNotMatch(sign, /mode:/);
});

test('signing handoff navigates only with a validated url', () => {
    const approved = signingHandoffDecision({
        valid: true,
        signingUrl: 'https://sign.shamrockbailbonds.biz/s/example'
    });
    assert.equal(approved.action, 'navigate');
    assert.equal(approved.signingUrl, 'https://sign.shamrockbailbonds.biz/s/example');

    const stale = signingHandoffDecision({ valid: false, expired: true, signingUrl: 'https://evil.example/s/example' });
    assert.equal(stale.action, 'recover');
    assert.equal(signingHandoffDecision({ valid: true, signingUrl: '  ' }).action, 'recover');
    assert.equal(signingHandoffDecision(null).action, 'recover');

    const preview = read('src/public/paperwork-preview-studio.js');
    assert.match(preview, /validateSigningSession\(/);
    assert.match(preview, /signingHandoffDecision\(/);
    assert.match(preview, /requestFreshSigningLink\(/);
    assert.match(preview, /displaySigningRecovery/);
});

test('portal consent is an explicit agree tap and paperwork still starts', () => {
    const portal = read('src/pages/Portal.ak0ws.js');
    const ready = between(portal, 'Role picker, login, Telegram, and concierge always wire.', 'AUTHENTICATION & ROUTING');
    assert.match(ready, /setupRoleSelectionCards\(countyParam\)/);
    assert.match(ready, /setupLoginForm\(countyParam\)/);
    assert.match(ready, /setupTelegramWidget\(countyParam\)/);
    assert.match(ready, /setupAIConcierge\(\)/);
    assert.match(ready, /showInlineConsentPanel\(countyParam\)/);
    assert.doesNotMatch(ready, /\n\s*return;/);

    const agree = between(portal, 'function recordSmsConsent', 'async function showConsentIfNeeded');
    assert.match(agree, /setItem\('shamrock_sms_consent', 'true'\)/);
    const send = between(portal, 'async function handleGetStarted', 'HELPERS, CONSENT');
    assert.match(send, /if \(!smsConsentGranted\(\)\)/);
    assert.doesNotMatch(send, /recordSmsConsent\(/);
    assert.match(portal, /I agree to text and email/);
    assert.match(portal, /button\.onClick\(\(\) => \{\s*if \(!smsConsentGranted\(\)\) \{\s*recordSmsConsent\(\)/);
    const panel = between(portal, 'function showInlineConsentPanel', 'function setupTelegramWidget');
    assert.doesNotMatch(panel, /openLightbox|button\.disable|recordSmsConsent\(/);

    const geo = read('src/public/geolocation-client.js');
    assert.match(geo, /TODO: Consent will be captured in the paperwork app/);
    assert.match(geo, /Consent not given/);
    assert.doesNotMatch(geo, /openLightbox/);
    const capture = between(geo, 'export async function captureGeolocation', 'export async function checkGeolocationPermission');
    assert.ok(capture.indexOf('Consent not given') < capture.indexOf("in navigator"));

    const controller = read('src/public/lightbox-controller.js');
    assert.match(controller, /TODO: Consent will be captured in the paperwork app/);
    assert.match(controller, /documentType: context\.documentType \|\| COLLATERAL_DOCUMENT_TYPE/);
    assert.doesNotMatch(controller, /PAPERWORK_MODE_ID_UPLOAD/);
    assert.doesNotMatch(between(controller, "key === 'signing'", 'return null;'), /mode:/);
});

test('ID upload inserts a new document row and does not update one', () => {
    const src = read('src/backend/documentUpload.jsw');
    const upload = between(src, 'export async function uploadIdDocument', 'export async function uploadSupportingDocument');
    assert.match(upload, /wixData\.insert\(/);
    assert.doesNotMatch(upload, /wixData\.update\(/);
    assert.doesNotMatch(upload, /wixData\.save\(/);
    assert.doesNotMatch(upload, /wixData\.bulkUpdate\(/);
    assert.doesNotMatch(upload, /wixData\.remove\(/);
});
