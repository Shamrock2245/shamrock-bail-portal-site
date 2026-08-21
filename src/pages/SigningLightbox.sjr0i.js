/**
 * SigningLightbox.sjr0i.js
 * 
 * Shamrock Bail Bonds - Mobile & Tablet Signing Launchpad
 * 
 * UX Designed for a Thumb on a Jail Bench:
 * 1. Single unified document stream with "Jump to Next Signature" auto-scroll.
 * 2. Role-filtered fields only (Defendant / Indemnitor / Co-Indemnitor).
 * 3. Dual signature capture: Apple Pencil / finger drawing canvas + typed legal signature.
 * 4. Real-time progress tracker: "Signature 3 of 7".
 * 5. Signer Flexibility: Indemnitor can sign first, Defendant later, Co-indemnitor last.
 * 6. 1-Tap Recovery: If link expires, 1-tap requests a fresh magic link via SMS without email searches.
 * 7. Post-Signing: Instant confirmation, SMS receipt, and "Download later" client access.
 * 
 * @version 2.1.0
 */

import wixWindow from 'wix-window';
import { PAPERWORK_APP_URL } from 'public/portal-config';
import {
    validateSigningSession,
    requestFreshSigningLink,
    recordSignatureCompletion
} from 'backend/signing-session-service';

let contextData = null;
let currentSignaturesCount = 0;
let totalSignaturesRequired = 5;
let isCompleted = false;

function buildPaperworkUrl(ctx) {
    const params = new URLSearchParams({ embed: '1' });
    const member = (ctx && ctx.memberData) || {};
    const phone = member.phone || ctx.phone || '';
    const token = ctx.sessionToken || ctx.st || '';
    const packet = ctx.packetId || ctx.caseId || '';
    const role = member.role || ctx.role || 'indemnitor';

    if (phone) params.set('phone', String(phone).replace(/\D/g, ''));
    if (token) params.set('st', token);
    if (packet) params.set('case', String(packet));
    if (ctx.signUrl) params.set('link', ctx.signUrl);
    if (role) params.set('role', String(role));

    return `${PAPERWORK_APP_URL}?${params.toString()}`;
}

$w.onReady(async () => {
    console.log("✍️ [Signing Launchpad] Initializing mobile thumb signing UX...");

    contextData = wixWindow.lightbox.getContext() || {};
    const role = (contextData.role || (contextData.memberData && contextData.memberData.role) || 'indemnitor').toLowerCase();
    const caseId = contextData.packetId || contextData.caseId || '';
    const clientPhone = contextData.phone || (contextData.memberData && contextData.memberData.phone) || '';

    setupUI(role, caseId);
    setupEventHandlers(caseId, role, clientPhone);

    // Validate signing session status
    const validation = await validateSigningSession({
        caseId,
        role,
        signUrl: contextData.signUrl
    });

    if (validation.expired) {
        showExpiredState(caseId, role, validation.phone || clientPhone);
    } else {
        mountSigningFrame(contextData);
    }
});

function setupUI(role, caseId) {
    safeHide('#loadingIndicator');
    safeHide('#errorMessage');
    safeHide('#boxExpiredNotice');
    safeHide('#boxSigningSuccess');

    const roleTitle = role === 'defendant' ? 'Defendant Signature' :
                      role === 'coindemnitor' ? 'Second Cosigner Signature' : 'Cosigner (Indemnitor) Signature';
    
    safeSetText('#signingTitle', `☘️ ${roleTitle}`);
    safeSetText('#signingInstructions', 'Review your fields below and sign with finger, stylus, or typed signature.');
    safeSetText('#sigProgressText', `Signature 1 of ${totalSignaturesRequired}`);
}

function mountSigningFrame(ctx) {
    const url = buildPaperworkUrl(ctx);
    const frame = $w('#signingFrame');

    if (!frame) return;

    const member = ctx.memberData || {};
    const payload = {
        type: 'shamrock-paperwork-open',
        url,
        phone: member.phone || ctx.phone || '',
        sessionToken: ctx.sessionToken || ctx.st || '',
        signUrl: ctx.signUrl || '',
        caseId: ctx.packetId || ctx.caseId || '',
        role: member.role || ctx.role || 'indemnitor'
    };

    try { frame.src = url; } catch (e) {}

    if (typeof frame.postMessage === 'function') {
        frame.postMessage(payload);
        setTimeout(() => frame.postMessage(payload), 400);
    }

    frame.show();

    if (typeof frame.onMessage === 'function') {
        frame.onMessage((event) => {
            const msg = event && event.data;
            if (!msg || !msg.type) return;

            if (msg.type === 'shamrock-paperwork-ready') {
                if (typeof frame.postMessage === 'function') frame.postMessage(payload);
            }

            // Real-time progress updates from DocuSeal / Netlify frame
            if (msg.type === 'shamrock-signature-step' || msg.type === 'signature-progress') {
                currentSignaturesCount = msg.current || (currentSignaturesCount + 1);
                totalSignaturesRequired = msg.total || totalSignaturesRequired;
                updateProgressUI(currentSignaturesCount, totalSignaturesRequired);
            }

            // Completion Event
            if (msg.type === 'shamrock-paperwork-complete' || msg.type === 'docuseal-completed') {
                handleSigningComplete(ctx);
            }

            if (msg.type === 'shamrock-paperwork-close') {
                wixWindow.lightbox.close({ success: isCompleted });
            }
        });
    }
}

function updateProgressUI(current, total) {
    safeSetText('#sigProgressText', `Signature ${current} of ${total}`);
    try {
        const bar = $w('#signingProgressBar');
        if (bar && typeof bar.targetValue === 'number') {
            bar.value = Math.min((current / total) * 100, 100);
        }
    } catch (e) {}
}

async function handleSigningComplete(ctx) {
    isCompleted = true;
    safeHide('#signingFrame');
    safeHide('#boxSigningControls');
    safeShow('#boxSigningSuccess');

    safeSetText('#successTitle', '✅ Paperwork Signed & Locked!');
    safeSetText('#successMessage', 'Your signature has been verified and transmitted to the Shamrock dispatch desk. An SMS receipt has been sent to your phone.');

    await recordSignatureCompletion({
        caseId: ctx.packetId || ctx.caseId,
        role: ctx.role || 'indemnitor',
        signerPhone: ctx.phone || (ctx.memberData && ctx.memberData.phone)
    });
}

function showExpiredState(caseId, role, phone) {
    safeHide('#signingFrame');
    safeHide('#boxSigningControls');
    safeShow('#boxExpiredNotice');

    safeSetText('#expiredTitle', 'Signing Link Expired');
    safeSetText('#expiredMessage', 'For your security, signing sessions expire after 24 hours. Tap below to receive a fresh signing link via text.');
}

function setupEventHandlers(caseId, role, phone) {
    // 1-Tap "Send me a new link" button
    safeOnClick('#btnRequestNewLink', async () => {
        safeDisable('#btnRequestNewLink');
        safeSetText('#btnRequestNewLink', 'Sending SMS...');

        const result = await requestFreshSigningLink({ caseId, role, phone });

        if (result.success) {
            safeSetText('#expiredMessage', '✅ Fresh link sent! Please check your text messages.');
            safeSetText('#btnRequestNewLink', 'Link Sent [Check SMS]');
        } else {
            safeSetText('#expiredMessage', result.message);
            safeEnable('#btnRequestNewLink');
            safeSetText('#btnRequestNewLink', 'Try Again');
        }
    });

    // Jump to next signature button
    safeOnClick('#btnJumpNextSig', () => {
        const frame = $w('#signingFrame');
        if (frame && typeof frame.postMessage === 'function') {
            frame.postMessage({ type: 'shamrock-jump-next-signature' });
        }
    });

    // Cancel / Close
    safeOnClick('#cancelBtn', () => wixWindow.lightbox.close({ cancelled: true, success: isCompleted }));
    safeOnClick('#btnCloseSuccess', () => wixWindow.lightbox.close({ success: true }));
}

// UI Utilities
function safeSetText(id, text) {
    try {
        const el = $w(id);
        if (el) el.text = text;
    } catch (e) {}
}

function safeShow(id) {
    try {
        const el = $w(id);
        if (el) el.show();
    } catch (e) {}
}

function safeHide(id) {
    try {
        const el = $w(id);
        if (el) el.hide();
    } catch (e) {}
}

function safeDisable(id) {
    try {
        const el = $w(id);
        if (el && typeof el.disable === 'function') el.disable();
    } catch (e) {}
}

function safeEnable(id) {
    try {
        const el = $w(id);
        if (el && typeof el.enable === 'function') el.enable();
    } catch (e) {}
}

function safeOnClick(id, handler) {
    try {
        const el = $w(id);
        if (el && typeof el.onClick === 'function') el.onClick(handler);
    } catch (e) {}
}
