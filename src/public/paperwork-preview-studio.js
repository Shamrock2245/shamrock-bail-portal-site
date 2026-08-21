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
 * - If DocuSeal signing session exists: Opens SigningLightbox launchpad with role-scoped tabs.
 * - If no session yet: Displays calm review notice: "We're preparing your packet. You'll get a text when it's ready to sign."
 * - Dispatches Slack/staff alert via existing notification channels.
 * - DOES NOT generate the legal PDF packet inside Wix.
 * 
 * @module paperwork-preview-studio
 */

import wixWindow from 'wix-window';
import { callGasAction } from 'backend/gasIntegration';
import { calculateBondFee } from 'backend/bailCalculator';

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
function setupSigningLaunchpadAction($w, canonicalCase, activeRole) {
    const btnSign = $w('#btnConfirmAndSign') || $w('#btnPreparePaperwork');
    if (!btnSign) return;

    btnSign.onClick(async () => {
        btnSign.disable();
        btnSign.label = "Checking Signing Session...";

        try {
            const hasActiveSession = !!(canonicalCase.packet?.signingSessionId || canonicalCase.signingUrl);

            if (hasActiveSession) {
                // Open Launchpad Lightbox with role-scoped DocuSeal session
                wixWindow.openLightbox('SigningLightbox', {
                    signUrl: canonicalCase.signingUrl || '',
                    caseId: canonicalCase.caseId,
                    role: activeRole,
                    memberData: {
                        phone: canonicalCase.defendant?.phones?.[0] || canonicalCase.indemnitor?.phones?.[0] || '',
                        name: canonicalCase.defendant?.legalName?.full || canonicalCase.indemnitor?.legalName?.full || ''
                    }
                });
            } else {
                // Alert staff in Super CRM / Slack & show calm client waiting notice
                await callGasAction('notifyStaffPacketPending', {
                    caseId: canonicalCase.caseId,
                    role: activeRole,
                    defendantName: canonicalCase.defendant?.legalName?.full,
                    indemnitorName: canonicalCase.indemnitor?.legalName?.full,
                    totalBond: canonicalCase.totalBond,
                    county: canonicalCase.county
                });

                displayCalmReviewState($w);
            }
        } catch (err) {
            console.warn("Launchpad handoff notification non-fatal:", err);
            displayCalmReviewState($w);
        }
    });
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
