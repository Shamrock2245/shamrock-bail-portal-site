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
import { buildPaperworkLaunchpadUrl, PAPERWORK_MODE_ID_UPLOAD } from '../src/public/portal-config.js';

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

test('id-upload mode is a paperwork query and signing leaves mode unset', () => {
    assert.equal(PAPERWORK_MODE_ID_UPLOAD, 'id-upload');

    const upload = new URL(buildPaperworkLaunchpadUrl({
        caseId: 'CASE-1',
        role: 'indemnitor',
        st: 'session-1',
        mode: PAPERWORK_MODE_ID_UPLOAD,
        source: 'wix-indemnitor'
    }));
    assert.equal(upload.searchParams.get('mode'), 'id-upload');
    assert.equal(upload.searchParams.get('case'), 'CASE-1');
    assert.equal(upload.searchParams.get('role'), 'indemnitor');
    assert.equal(upload.searchParams.get('st'), 'session-1');
    assert.equal(upload.origin, 'https://paperwork.shamrockbailbonds.biz');

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

test('indemnitor upload keeps case and role and uses id-upload', () => {
    const src = read('src/pages/Indemnitor Portal.go8lz.js');
    const upload = between(src, "'upload-collateral': () => {", "'add-cosigner'");
    assert.match(upload, /caseId: indemnitorData\?\.caseNumber/);
    assert.match(upload, /role: 'indemnitor'/);
    assert.match(upload, /mode: PAPERWORK_MODE_ID_UPLOAD/);
    assert.match(upload, /buildPaperworkLaunchpadUrl/);
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
    const sign = between(preview, 'if (hasActiveSession)', '} else {');
    assert.match(sign, /role: activeRole/);
    assert.match(sign, /caseId: canonicalCase\.caseId/);
    assert.match(sign, /signUrl: canonicalCase\.signingUrl/);
    assert.doesNotMatch(sign, /mode:/);
    assert.doesNotMatch(sign, /PAPERWORK_MODE_ID_UPLOAD/);
});

test('consent callers fail closed and leave a paperwork TODO', () => {
    const portal = read('src/pages/Portal.ak0ws.js');
    const geo = read('src/public/geolocation-client.js');
    const controller = read('src/public/lightbox-controller.js');
    const consent = between(portal, 'async function showConsentIfNeeded', 'function showConsentRequiredState');
    const blocked = between(portal, 'function showConsentRequiredState', 'function setupTelegramWidget');
    assert.match(consent, /TODO: Consent will be captured in the paperwork app/);
    assert.match(consent, /return false/);
    assert.doesNotMatch(consent, /openLightbox/);
    assert.doesNotMatch(consent, /setItem\('shamrock_sms_consent'/);
    assert.match(blocked, /TODO: Consent will be captured in the paperwork app/);
    assert.match(blocked, /\(239\) 332-2245/);
    assert.doesNotMatch(blocked, /setupLoginForm|openLightbox|button\.enable/);
    assert.match(geo, /TODO: Consent will be captured in the paperwork app/);
    assert.match(geo, /Consent not given/);
    assert.doesNotMatch(geo, /openLightbox/);
    const capture = between(geo, 'export async function captureGeolocation', 'export async function checkGeolocationPermission');
    assert.ok(capture.indexOf('Consent not given') < capture.indexOf("in navigator"));
    assert.match(controller, /TODO: Consent will be captured in the paperwork app/);
    assert.match(controller, /mode: PAPERWORK_MODE_ID_UPLOAD/);
    assert.doesNotMatch(between(controller, "key === 'signing'", 'return null;'), /PAPERWORK_MODE_ID_UPLOAD|mode:/);
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
