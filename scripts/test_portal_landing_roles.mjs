#!/usr/bin/env node
/**
 * Test Suite: /portal-landing Velo Role Architecture, Co-Indemnitor Flow,
 * Defendant Signature Invariant, and Bail School Separation.
 *
 * Verifies:
 * 1. Indemnitor is the default selected role.
 * 2. Co-Indemnitor role is added and used ONLY when a bond needs one (conditional activation).
 * 3. Defendant still signs on every bond invariant is enforced and documented.
 * 4. Bail School logins are strictly separate and never route students/clients together.
 * 5. Existing element IDs and fail-closed identity checks are preserved.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');

const studioVeloCode = fs.readFileSync(path.join(root, 'docs/studio-velo/portal-landing.js'), 'utf8');
const srcPageCode = fs.readFileSync(path.join(root, 'src/pages/portal-landing.bagfn.js'), 'utf8');

test('portal-landing: Indemnitor is the default selected role in studio-velo', () => {
    // Check initial state variable
    assert.match(studioVeloCode, /let\s+currentRole\s*=\s*['"]indemnitor['"]/);

    // Check active tab assignment on initialization
    assert.match(studioVeloCode, /indemnitorTab\.customClassList\.add\(['"]active-tab['"]\)/);

    // Check default role copy for Indemnitor
    assert.match(studioVeloCode, /Cosigner \/ Indemnitor Portal/);
});

test('portal-landing: Indemnitor is the default selected role in src page', () => {
    // Check default active tab function sets indemnitor when no coindemnitor flag
    assert.match(srcPageCode, /bondNeedsCoIndemnitor\s*\?\s*['"]coindemnitor['"]\s*:\s*['"]indemnitor['"]/);
    assert.match(srcPageCode, /Cosigner \/ Indemnitor Portal/);
});

test('portal-landing: Co-Indemnitor role exists and is used ONLY when a bond needs one', () => {
    // Must recognize coindemnitor role
    assert.match(studioVeloCode, /coindemnitor/i);
    assert.match(srcPageCode, /coindemnitor/i);

    // Must be conditional on bond query parameter (e.g. ?role=coindemnitor or ?coindemnitor=true)
    assert.match(studioVeloCode, /queryRole\s*===\s*['"]coindemnitor['"]/);
    assert.match(studioVeloCode, /query\.coindemnitor\s*===\s*['"]true['"]/);

    // Default flow MUST collapse/hide co-indemnitor tab when NOT needed
    assert.match(studioVeloCode, /coIndemnitorTab\.collapse\(\)/);
    assert.match(srcPageCode, /coIndTab\.collapse\(\)/);

    // When bond needs one, expand/show co-indemnitor
    assert.match(studioVeloCode, /coIndemnitorTab\.expand\(\)/);
    assert.match(srcPageCode, /coIndTab\.expand\(\)/);
});

test('portal-landing: Invariant - Defendant still signs on every bond', () => {
    // Under Florida law (F.S. 648), adding co-indemnitors never waives defendant appearance or signature
    assert.match(studioVeloCode, /defendant still signs on every bond/i);
    assert.match(srcPageCode, /defendant still signs on every bond/i);

    // Verify defendant notice exists in copy
    assert.match(studioVeloCode, /notice:\s*["'][^"']*defendant still signs on every bond/i);
    assert.match(srcPageCode, /textDefendantMustSignNotice/);
});

test('portal-landing: Bail School login separation is strictly enforced', () => {
    // Both files must have a dedicated Bail School separation guard redirecting to /bail-school
    assert.match(studioVeloCode, /const\s+BAIL_SCHOOL_ROUTE\s*=\s*['"]\/bail-school['"]/);
    assert.match(studioVeloCode, /wixLocationFrontend\.to\(BAIL_SCHOOL_ROUTE\)/);

    assert.match(srcPageCode, /wixLocation\.to\(['"]\/bail-school['"]\)/);

    // Student queries must be intercepted
    assert.match(studioVeloCode, /query\.school\s*\|\|\s*query\.course\s*\|\|\s*query\.student/);
    assert.match(srcPageCode, /query\.school\s*\|\|\s*query\.course\s*\|\|\s*query\.student/);

    // Student inputs (@bailschool, student@) must be rejected
    assert.match(studioVeloCode, /@bailschool/);
    assert.match(srcPageCode, /@bailschool/);

    // Routing guard in src/pages must never route student to bail dashboards
    assert.match(srcPageCode, /cleanRole\s*===\s*['"]student['"]/);
});

test('portal-landing: Existing element IDs are preserved', () => {
    const requiredStudioElements = [
        '#tabDefendant',
        '#tabIndemnitor',
        '#tabCoIndemnitor',
        '#inputLoginPhone',
        '#inputLoginEmail',
        '#btnSendMagicLink',
        '#loginSpinner',
        '#loginSuccessBox',
        '#loginErrorBox',
        '#loginErrorText',
        '#roleDescriptionText'
    ];

    for (const elId of requiredStudioElements) {
        assert.ok(
            studioVeloCode.includes(`'${elId}'`) || studioVeloCode.includes(`"${elId}"`),
            `Missing element ${elId} in docs/studio-velo/portal-landing.js`
        );
    }

    const requiredSrcElements = [
        '#tabDefendant',
        '#tabIndemnitor',
        '#tabCoIndemnitor',
        '#emailPhoneInput',
        '#getStartedBtn',
        '#btnRoleDefendant',
        '#cardRoleDefendant',
        '#btnRoleIndemnitor',
        '#cardRoleIndemnitor',
        '#btnRoleCoIndemnitor',
        '#cardRoleCoIndemnitor',
        '#statusMessage'
    ];

    for (const elId of requiredSrcElements) {
        assert.ok(
            srcPageCode.includes(`'${elId}'`) || srcPageCode.includes(`"${elId}"`),
            `Missing element ${elId} in src/pages/portal-landing.bagfn.js`
        );
    }
});

test('portal-landing: Identity fail-closed checks remain intact', () => {
    // Empty contact check
    assert.match(studioVeloCode, /if\s*\(!phone\s*&&\s*!email\)/);
    assert.match(srcPageCode, /if\s*\(!emailOrPhone\)/);

    // Token rejection clears session and fails closed
    assert.match(srcPageCode, /clearSessionToken\(\)/);
    assert.match(srcPageCode, /Session expired/);
});
