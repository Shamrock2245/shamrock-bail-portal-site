/**
 * Human Paperwork Preview & Signing Launchpad Bridge (Studio Native)
 * File: public/paperwork-preview-studio.js
 * 
 * Provides a clean, human-readable summary before signature.
 * Replaces raw 14-PDF clutter with structured case review.
 * 
 * Sections Rendered:
 * 1. Who You Are (Signer Identity, DL, Phone, Email)
 * 2. Who You're Getting Out (Defendant Name, Booking #, Facility)
 * 3. Charges & Bail Breakdown (Each charge + individual bond amount + total bond)
 * 4. Estimated Premium & Fee (Computed from Florida statutory calculator)
 * 5. Case Facts (Court dates, Case numbers, Address, Employment, References)
 * 
 * Primary CTA: "This is correct — sign."
 * - If DocuSeal signing session exists: navigates to the paperwork launchpad (DocuSeal). No SigningLightbox.
 * - If no session yet: Displays calm review notice: "We're preparing your packet. You'll get a text when it's ready to sign."
 * - Dispatches Slack/staff alert via existing notification channels.
 * - DOES NOT generate the legal PDF packet inside Wix.
 * 
 * @module paperwork-preview-studio
 */

import wixLocation from 'wix-location';
import { callGasAction } from 'backend/gasIntegration';
import { calculateBondFee } from 'backend/bailCalculator';
import { validateSigningSession, requestFreshSigningLink } from 'backend/signing-session-service';
import { buildPaperworkLaunchpadUrl } from 'public/portal-config';
import { signingHandoffDecision } from 'public/signing-handoff';

/**
 * Render Human Paperwork Preview into Wix Studio UI Containers
 * @param {Object} $w - Wix selector
 * @param {Object} canonicalCase - Full canonical case object
 * @param {string} [activeRole='indemnitor'] - 'defendant' | 'indemnitor' | 'coindemnitor'
 */
export function renderPaperworkPreview($w, canonicalCase, activeRole = 'indemnitor') {
    if (!canonicalCase) return;

    const def = canonicalCase.defendant || {};
    const ind = canonicalCase.indemnitor || {};
    const coInd = canonicalCase.coIndemnitor || {};
    const signer = activeRole === 'defendant' ? def : activeRole === 'coindemnitor' ? coInd : ind;

    // 1. Who You Are
    const signerName = signer.legalName?.full || [signer.legalName?.first, signer.legalName?.last].filter(Boolean).join(' ') || 'Signer';
    const signerPhone = signer.phones?.[0] || '';
    const signerEmail = signer.emails?.[0] || '';
    const signerDl = signer.dlNumber ? `${signer.dlNumber} (${signer.dlState || 'FL'})` : 'Verified via ID Scan';
    const roleLabel = activeRole === 'defendant' ? 'Defendant' : activeRole === 'coindemnitor' ? 'Second Cosigner' : 'Primary Cosigner (Indemnitor)';

    safeSetText('#previewSignerTitle', `Signer: ${signerName} (${roleLabel})`);
    safeSetText('#previewSignerContact', `${signerPhone} • ${signerEmail}`);
    safeSetText('#previewSignerDl', `Driver License: ${signerDl}`);

    // 2. Who You're Getting Out
    const defName = def.legalName?.full || [def.legalName?.first, def.legalName?.last].filter(Boolean).join(' ') || 'Defendant';
    const jailFacility = canonicalCase.jail || `${canonicalCase.county || 'Lee'} County Jail`;
    const bookingNum = canonicalCase.bookingNumber ? `Booking #${canonicalCase.bookingNumber}` : 'In Custody';

    safeSetText('#previewDefName', defName);
    safeSetText('#previewJailFacility', `${jailFacility} (${bookingNum})`);

    // 3. Charges & Bail Breakdown
    const charges = canonicalCase.charges || [];
    const totalBondNum = Number(canonicalCase.totalBond) || 0;
    const feeCalc = calculateBondFee(totalBondNum, Math.max(charges.length, 1));
    const premiumEstimate = canonicalCase.premiumEstimate || feeCalc.premium;

    let chargesHtml = charges.map((c, i) => {
        const desc = typeof c === 'string' ? c : c.description;
        const bond = typeof c === 'string' ? 0 : Number(c.bondAmount || 0);
        return `<div style="margin-bottom:6px; display:flex; justify-content:space-between;">
            <span><strong>Charge ${i + 1}:</strong> ${desc}</span>
            <span style="color:#10B981; font-weight:600;">$${bond.toLocaleString()}</span>
        </div>`;
    }).join('');

    if (!chargesHtml) {
        chargesHtml = `<div style="color:#94A3B8;">Pending formal booking desk charges.</div>`;
    }

    try {
        const chargesBox = $w('#previewChargesList');
        if (chargesBox) {
            if (chargesBox.html) chargesBox.html = `<div style="font-size:14px; color:#E2E8F0;">${chargesHtml}</div>`;
            else chargesBox.text = charges.map(c => typeof c === 'string' ? c : `${c.description} ($${c.bondAmount})`).join('\n');
        }
    } catch (e) {}

    safeSetText('#previewTotalBond', `$${totalBondNum.toLocaleString()}`);
    safeSetText('#previewEstPremium', `$${premiumEstimate.toLocaleString()}`);

    // 4. Case Numbers & Court Dates
    const caseNumStr = canonicalCase.caseNumbers?.join(', ') || 'Pending County Docketing';
    const courtDateStr = canonicalCase.courtDates?.[0]?.date ? 
        `${canonicalCase.courtDates[0].date} at ${canonicalCase.courtDates[0].time || '09:00 AM'}` : 'First Appearance (Next Morning)';

    safeSetText('#previewCaseNumbers', `Case / Docket: ${caseNumStr}`);
    safeSetText('#previewCourtDate', `Court Date: ${courtDateStr}`);

    // 5. Addresses, Employment & References
    const addr = signer.addresses?.[0] || {};
    const addrStr = [addr.street, addr.unit, addr.city, addr.state, addr.zip].filter(Boolean).join(', ') || 'Verified on ID';
    const empStr = signer.employment?.employer ? `${signer.employment.employer} (${signer.employment.occupation || 'Employed'})` : 'Self-employed / Retired';
    const refsStr = signer.references?.map(r => `${r.name} (${r.relationship || 'Ref'}): ${r.phone}`).filter(Boolean).join(' • ') || 'Verified';

    safeSetText('#previewAddress', `Address: ${addrStr}`);
    safeSetText('#previewEmployment', `Job / Household: ${empStr}`);
    safeSetText('#previewReferences', `References: ${refsStr}`);

    // Wire Primary CTA
    setupSigningLaunchpadAction($w, canonicalCase, activeRole);

    function safeSetText(id, text) {
        try {
            const el = $w(id);
            if (el) el.text = text;
        } catch (e) {}
    }
}

/**
 * Configure "This is correct — sign." action and DocuSeal launchpad handoff
 */
function firstOf($w, ids) {
    for (let i = 0; i < ids.length; i++) {
        try {
            const node = $w(ids[i]);
            if (node) return node;
        } catch (e) { /* try the next id */ }
    }
    return null;
}

function setupSigningLaunchpadAction($w, canonicalCase, activeRole) {
    const btnSign = firstOf($w, ['#btnConfirmAndSign', '#btnPreparePaperwork']);
    if (!btnSign) return;

    let awaitingFreshLink = false;
    let recovery = null;

    btnSign.onClick(async () => {
        const casePhone = canonicalCase.defendant?.phones?.[0] || canonicalCase.indemnitor?.phones?.[0] || '';
        if (awaitingFreshLink) {
            btnSign.disable();
            btnSign.label = 'Sending a new link...';
            const result = await requestFreshSigningLink(recovery || {
                caseId: canonicalCase.caseId,
                role: activeRole,
                phone: casePhone
            });
            const sent = !!(result && result.success);
            setPreviewStatus($w, sent
                ? 'A bondsman will text a fresh signing link. You can also call (239) 332-2245.'
                : ((result && result.message) || 'Call (239) 332-2245 for a new signing link.'));
            btnSign.label = sent ? 'Link requested' : 'Send me a new link';
            if (!sent) btnSign.enable();
            return;
        }

        btnSign.disable();
        btnSign.label = "Checking Signing Session...";

        try {
            const offeredUrl = canonicalCase.signingUrl || '';
            const hasSessionId = !!(canonicalCase.packet && canonicalCase.packet.signingSessionId);
            if (!offeredUrl && !hasSessionId) {
                await callGasAction('notifyStaffPacketPending', {
                    caseId: canonicalCase.caseId,
                    role: activeRole,
                    defendantName: canonicalCase.defendant?.legalName?.full,
                    indemnitorName: canonicalCase.indemnitor?.legalName?.full,
                    totalBond: canonicalCase.totalBond,
                    county: canonicalCase.county
                });
                displayCalmReviewState($w);
                return;
            }

            const validation = await validateSigningSession({
                caseId: canonicalCase.caseId,
                role: activeRole,
                signUrl: offeredUrl
            });
            const decision = signingHandoffDecision(validation);
            if (decision.action === 'navigate') {
                // Defendants still sign on every bond: activeRole is passed through.
                wixLocation.to(buildPaperworkLaunchpadUrl({
                    signUrl: decision.signingUrl,
                    caseId: canonicalCase.caseId,
                    role: activeRole,
                    phone: decision.phone || casePhone,
                    source: 'wix-paperwork-preview'
                }));
                return;
            }

            recovery = {
                caseId: canonicalCase.caseId,
                role: activeRole,
                phone: decision.phone || casePhone
            };
            awaitingFreshLink = true;
            displaySigningRecovery($w);
            btnSign.label = 'Send me a new link';
            btnSign.enable();
        } catch (err) {
            console.warn("Launchpad handoff notification non-fatal:", err);
            displayCalmReviewState($w);
        }
    });
}

function setPreviewStatus($w, text) {
    const statusText = firstOf($w, ['#statusMessage', '#signingInstructions']);
    if (!statusText) return;
    try { statusText.text = text; } catch (e) {}
    try { if (typeof statusText.show === 'function') statusText.show(); } catch (e) {}
}

function displaySigningRecovery($w) {
    try {
        const boxWaiting = $w('#boxStaffReviewNotice') || $w('#stepBoxPrepare');
        if (boxWaiting && typeof boxWaiting.show === 'function') boxWaiting.show();
    } catch (e) {}
    setPreviewStatus($w, 'This signing link is expired or not a Shamrock signing link. Tap below and a bondsman will text a fresh link.');
}

function displayCalmReviewState($w) {
    try {
        const boxWaiting = $w('#boxStaffReviewNotice') || $w('#stepBoxPrepare');
        if (boxWaiting) boxWaiting.show();

        const statusText = $w('#statusMessage') || $w('#signingInstructions');
        if (statusText) {
            statusText.text = "We’re preparing your packet. You’ll get a text when it’s ready to sign.";
            statusText.show();
        }

        const btn = $w('#btnConfirmAndSign') || $w('#btnPreparePaperwork');
        if (btn) {
            btn.label = "Intake Submitted [Awaiting Staff Release]";
            btn.disable();
        }
    } catch (e) {}
}

export default {
    renderPaperworkPreview
};
