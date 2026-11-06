/**
 * Synchronous case-status labels for the portal pages.
 * Pages must import this public module. Importing these helpers from a
 * backend .jsw web module would wrap them in Promises.
 * Pay now stays off unless every signature is complete and paid is false.
 */

function cosignerDone(entry) {
    if (entry === true) return true;
    if (typeof entry === 'string') {
        const status = entry.trim().toLowerCase();
        return status === 'signed' || status === 'complete' || status === 'completed';
    }
    if (!entry || typeof entry !== 'object') return false;
    if (entry.signed === true) return true;
    const status = String(entry.status || entry.signature || '').trim().toLowerCase();
    return status === 'signed' || status === 'complete' || status === 'completed';
}

export function signaturesAreComplete(signatures) {
    if (!signatures || typeof signatures !== 'object') return false;
    if (signatures.indemnitor !== true || signatures.defendant !== true) return false;
    if (!Array.isArray(signatures.cosigners)) return false;
    return signatures.cosigners.every(cosignerDone);
}

const PAPERWORK_DONE = ['complete', 'completed', 'signed', 'active', 'done'];

export function paperworkLooksComplete(status, wixRecord) {
    if (status && status.source === 'leads') {
        const paperwork = String(status.paperwork || '').trim().toLowerCase();
        if (!paperwork || paperwork === 'not on file') return false;
        return PAPERWORK_DONE.indexOf(paperwork) !== -1;
    }
    const raw = String((wixRecord && wixRecord.paperworkStatus) || '').trim().toLowerCase();
    return raw === 'complete' || raw === 'signed' || raw === 'active';
}

export function shouldShowPayNow(status) {
    if (!status || status.paid !== false) return false;
    return signaturesAreComplete(status.signatures);
}

export function paperworkText(value) {
    if (value === true) return 'complete';
    if (value === false) return 'incomplete';
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 80);
    return '';
}

function explicitPaid(record) {
    if (!record || typeof record !== 'object') return null;
    if (record.paid === true) return true;
    if (record.paid === false) return false;
    const payment = String(record.paymentStatus || '').trim().toLowerCase();
    if (payment === 'paid' || payment === 'complete' || payment === 'completed') return true;
    if (payment === 'unpaid' || payment === 'due' || payment === 'open') return false;
    return null;
}

/**
 * Status from the dashboard record already loaded from Wix Cases.
 * Does not infer "paid" from a zero balance. Does not mark every signature
 * complete from a single role's signingStatus, so Pay now stays hidden.
 */
export function wixCaseStatusFallback(record) {
    const src = record && typeof record === 'object' ? record : {};
    const paperwork = paperworkText(src.paperworkStatus || src.paperwork) || 'Not on file';
    const signingStatus = paperworkText(src.signingStatus || src.indemnitorSigningStatus || src.defendantSigningStatus);
    return {
        source: 'wix',
        paperwork: paperwork,
        signatures: null,
        signingStatus: signingStatus,
        paid: explicitPaid(src)
    };
}

export function statusLines(status) {
    const paperwork = status && status.paperwork ? String(status.paperwork) : 'Not on file';
    let signatures = 'Not confirmed';
    if (status && status.signatures && typeof status.signatures === 'object') {
        const s = status.signatures;
        const list = Array.isArray(s.cosigners) ? s.cosigners : [];
        const done = list.filter(cosignerDone).length;
        signatures = [
            'Indemnitor ' + (s.indemnitor === true ? 'signed' : 'not signed'),
            'Defendant ' + (s.defendant === true ? 'signed' : 'not signed'),
            'Co-signers ' + done + '/' + list.length
        ].join(' · ');
    } else if (status && status.signingStatus) {
        signatures = 'On file: ' + status.signingStatus;
    }
    let paid = 'Not confirmed';
    if (status && status.paid === true) paid = 'Paid';
    else if (status && status.paid === false) paid = 'Not paid';
    return {
        paperwork: paperwork,
        signatures: signatures,
        paid: paid,
        showPayNow: shouldShowPayNow(status)
    };
}

export function dashboardStatusFields(status) {
    const lines = statusLines(status);
    return {
        paperworkLabel: lines.paperwork,
        signatureLabel: lines.signatures,
        paidLabel: lines.paid,
        showPayNow: lines.showPayNow === true
    };
}
