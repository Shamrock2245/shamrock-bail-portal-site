/**
 * DefendantDetails.js — staff case lightbox
 *
 * Displays defendant information and launchpad actions for a staff-issued
 * DocuSeal session. Wix never creates packets or signing URLs.
 */
import wixWindow from 'wix-window';
import { validateSigningSession } from 'backend/signing-session-service';
import { sendSigningLinkViaSms } from 'backend/signing-methods';
import { SUPER_CRM_URL } from 'public/portal-config';

const ISSUE_IN_CRM = 'Issue the DocuSeal packet in Super CRM first. Wix only opens a staff-issued signing session.';

function setStatus(message) {
    $w('#signingStatusText').text = message;
    $w('#signingStatusText').expand();
}

function caseKey(data) {
    return data.caseId || data._id || '';
}

async function resolveIssuedSession(data) {
    return validateSigningSession({
        caseId: caseKey(data),
        role: 'indemnitor',
        signUrl: data.signingUrl || data.signUrl || ''
    });
}

function openIssuedLaunchpad(data, session) {
    wixWindow.openLightbox('SigningLightbox', {
        signUrl: session.signingUrl,
        caseId: caseKey(data),
        packetId: caseKey(data),
        defendantName: data.defendantName,
        caseNumber: data.caseNumber,
        phone: session.phone || data.indemnitorPhone || data.phone || '',
        role: 'indemnitor'
    });
}

$w.onReady(function () {
    const data = wixWindow.lightbox.getContext();
    if (!data) return;

    $w('#detailsNameText').text = data.defendantName || 'No Name';
    $w('#detailsCaseNumberText').text = data.caseNumber || 'No Case';
    $w('#detailsBondText').text = data.bondAmount || '$0.00';
    $w('#detailsStatusText').text = data.status || 'Unknown';
    $w('#closeBtn').onClick(() => wixWindow.lightbox.close());

    const phone = data.indemnitorPhone || data.defendantPhone || data.phone || '';

    $w('#sendEmailBtn').onClick(async () => {
        $w('#sendEmailBtn').label = 'Checking';
        setStatus('Looking up staff-issued DocuSeal session…');
        try {
            const session = await resolveIssuedSession(data);
            if (!session.valid || !session.signingUrl) {
                throw new Error(ISSUE_IN_CRM);
            }
            openIssuedLaunchpad(data, session);
            $w('#sendEmailBtn').label = 'Open launchpad';
            setStatus('Opened the staff-issued signing launchpad. Packets are created in Super CRM: ' + SUPER_CRM_URL);
        } catch (e) {
            $w('#sendEmailBtn').label = 'Issue in Super CRM';
            setStatus(e.message || ISSUE_IN_CRM);
        }
    });

    $w('#sendSmsBtn').onClick(async () => {
        $w('#sendSmsBtn').label = 'Checking';
        setStatus('Looking up staff-issued DocuSeal session…');
        try {
            const session = await resolveIssuedSession(data);
            if (!session.valid || !session.signingUrl) {
                throw new Error(ISSUE_IN_CRM);
            }
            const dest = session.phone || phone;
            if (!dest) {
                throw new Error('No phone on file. Add a number in Super CRM, then retry.');
            }
            const result = await sendSigningLinkViaSms(dest, session.signingUrl, 'indemnitor');
            if (!result.success) {
                throw new Error(result.error || 'SMS delivery failed');
            }
            $w('#sendSmsBtn').label = 'Sent';
            setStatus('Staff-issued DocuSeal link texted.');
        } catch (e) {
            $w('#sendSmsBtn').label = 'Retry';
            setStatus(e.message || ISSUE_IN_CRM);
        }
    });

    $w('#openKioskBtn').onClick(async () => {
        $w('#openKioskBtn').label = 'Checking';
        setStatus('Looking up staff-issued DocuSeal session…');
        try {
            const session = await resolveIssuedSession(data);
            if (!session.valid || !session.signingUrl) {
                throw new Error(ISSUE_IN_CRM);
            }
            openIssuedLaunchpad(data, session);
            $w('#openKioskBtn').label = 'Open kiosk';
            setStatus('Kiosk launchpad opened for the staff-issued session.');
        } catch (e) {
            $w('#openKioskBtn').label = 'Issue in Super CRM';
            setStatus(e.message || ISSUE_IN_CRM);
        }
    });
});
