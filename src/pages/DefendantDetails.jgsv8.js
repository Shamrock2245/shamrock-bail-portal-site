/**
 * DefendantDetails.jgsv8.js
 *
 * Staff case lightbox. Wix is the clipboard: it may display and deliver a
 * staff-issued DocuSeal session. It must not mint packets or signing URLs.
 */
import wixWindow from 'wix-window';
import wixData from 'wix-data';
import { validateSigningSession } from 'backend/signing-session-service';
import { sendSigningLinkViaSms } from 'backend/signing-methods';
import { SUPER_CRM_URL } from 'public/portal-config';

const ISSUE_IN_CRM = 'Issue the DocuSeal packet in Super CRM first. Wix only opens a staff-issued signing session.';

function grab(id) {
    try {
        return $w(id) || null;
    } catch (e) {
        return null;
    }
}

function setText(id, value) {
    const node = grab(id);
    if (!node) return;
    try { node.text = value; } catch (e) { /* not a text element */ }
}

function setLabel(id, value) {
    const node = grab(id);
    if (!node) return;
    try { node.label = value; } catch (e) { /* not a button */ }
}

function setStatus(message) {
    const node = grab('#signingStatusText');
    if (!node) return;
    try { node.text = message; } catch (e) { /* not a text element */ }
    try { node.expand(); } catch (e) { /* expand is optional */ }
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

    setText('#detailsNameText', data.defendantName || 'No Name');
    setText('#detailsCaseNumberText', data.caseNumber || 'No Case');
    setText('#detailsBondText', data.bondAmount || '$0.00');
    setText('#detailsStatusText', data.status || 'Unknown');

    const closeBtn = grab('#closeBtn');
    if (closeBtn && typeof closeBtn.onClick === 'function') closeBtn.onClick(() => wixWindow.lightbox.close());

    const approveBtn = grab('#approveBtn');
    const emailBtn = grab('#sendEmailBtn');
    const smsBtn = grab('#sendSmsBtn');
    const kioskBtn = grab('#openKioskBtn');
    const actionButtons = [emailBtn, smsBtn, kioskBtn].filter(Boolean);

    const currentStatus = (data.paperworkStatus || data.status || 'Pending');
    const isApproved = currentStatus.toLowerCase() === 'approved';

    if (!isApproved) {
        actionButtons.forEach((btn) => {
            btn.disable();
            btn.label = 'Approve First';
        });
    }

    if (approveBtn) {
        if (isApproved) {
            approveBtn.label = 'Approved';
            approveBtn.disable();
        } else {
            approveBtn.onClick(async () => {
                approveBtn.label = 'Saving';
                approveBtn.disable();
                try {
                    if (data._id) {
                        const collection = data.collectionName || 'Cases';
                        await wixData.update(collection, { ...data, status: 'Approved', paperworkStatus: 'Approved' });
                    }
                    setText('#detailsStatusText', 'Approved');
                    approveBtn.label = 'Approved';
                    actionButtons.forEach((btn) => {
                        btn.enable();
                        if (btn.id.includes('Email')) btn.label = 'Open launchpad';
                        if (btn.id.includes('Sms')) btn.label = 'Text signing link';
                        if (btn.id.includes('Kiosk')) btn.label = 'Open kiosk';
                    });
                    setStatus('Bond approved in Wix. Issue the DocuSeal packet in Super CRM, then use these buttons to open or text the staff-issued link.');
                } catch (e) {
                    console.error('Approval Failed', e);
                    approveBtn.label = 'Retry Approval';
                    approveBtn.enable();
                }
            });
        }
    } else if (!isApproved) {
        console.warn('Approve Button #approveBtn missing, but case is not approved. Actions are disabled.');
    }

    if (emailBtn && typeof emailBtn.onClick === 'function') {
        emailBtn.onClick(async () => {
            setLabel('#sendEmailBtn', 'Checking');
            setStatus('Looking up staff-issued DocuSeal session…');
            try {
                const session = await resolveIssuedSession(data);
                if (!session.valid || !session.signingUrl) {
                    throw new Error(ISSUE_IN_CRM);
                }
                openIssuedLaunchpad(data, session);
                setLabel('#sendEmailBtn', 'Open launchpad');
                setStatus('Opened the staff-issued signing launchpad. Packets are created in Super CRM: ' + SUPER_CRM_URL);
            } catch (e) {
                setLabel('#sendEmailBtn', 'Issue in Super CRM');
                setStatus(e.message || ISSUE_IN_CRM);
            }
        });
    }

    if (smsBtn && typeof smsBtn.onClick === 'function') {
        smsBtn.onClick(async () => {
            setLabel('#sendSmsBtn', 'Checking');
            setStatus('Looking up staff-issued DocuSeal session…');
            try {
                const session = await resolveIssuedSession(data);
                if (!session.valid || !session.signingUrl) {
                    throw new Error(ISSUE_IN_CRM);
                }
                const contactInfo = await getLatestContactInfo(data);
                const phone = session.phone || contactInfo.phone;
                if (!phone) {
                    throw new Error('No phone on file. Add a number in Super CRM, then retry.');
                }
                const result = await sendSigningLinkViaSms(phone, session.signingUrl, 'indemnitor');
                if (!result.success) {
                    throw new Error(result.error || 'SMS delivery failed');
                }
                setLabel('#sendSmsBtn', 'Sent');
                setStatus('Staff-issued DocuSeal link texted.');
            } catch (e) {
                setLabel('#sendSmsBtn', 'Retry');
                setStatus(e.message || ISSUE_IN_CRM);
            }
        });
    }

    if (kioskBtn && typeof kioskBtn.onClick === 'function') {
        kioskBtn.onClick(async () => {
            setLabel('#openKioskBtn', 'Checking');
            setStatus('Looking up staff-issued DocuSeal session…');
            try {
                const session = await resolveIssuedSession(data);
                if (!session.valid || !session.signingUrl) {
                    throw new Error(ISSUE_IN_CRM);
                }
                openIssuedLaunchpad(data, session);
                setLabel('#openKioskBtn', 'Open kiosk');
                setStatus('Kiosk launchpad opened for the staff-issued session.');
            } catch (e) {
                setLabel('#openKioskBtn', 'Issue in Super CRM');
                setStatus(e.message || ISSUE_IN_CRM);
            }
        });
    }
});

async function getLatestContactInfo(itemData) {
    if (itemData.email && itemData.phone) {
        return { email: itemData.email, phone: itemData.phone };
    }

    const info = {
        email: itemData.email || itemData.defendantEmail || itemData.indemnitorEmail || '',
        phone: itemData.phone || itemData.defendantPhone || itemData.indemnitorPhone || ''
    };

    if (info.email && info.phone) return info;

    if (itemData._id) {
        try {
            const caseRes = await wixData.query('Cases').eq('_id', itemData._id).find();
            if (caseRes.items.length > 0) {
                const c = caseRes.items[0];
                if (!info.email) info.email = c.email || c.defendantEmail || c.indemnitorEmail;
                if (!info.phone) info.phone = c.phone || c.defendantPhone || c.indemnitorPhone;
            }
        } catch (e) {
            console.warn('Case query failed', e);
        }
    }

    if (info.email && info.phone) return info;

    if (itemData._id) {
        try {
            let intakeQ = wixData.query('IntakeQueue').eq('_id', itemData._id);
            if (itemData.caseNumber) {
                intakeQ = intakeQ.or(wixData.query('IntakeQueue').eq('caseId', itemData.caseNumber));
            }
            const intakeRes = await intakeQ.find();
            if (intakeRes.items.length > 0) {
                const i = intakeRes.items[0];
                if (!info.email) info.email = i.defendantEmail || i.indemnitorEmail;
                if (!info.phone) info.phone = i.defendantPhone || i.indemnitorPhone;
            }
        } catch (e) {
            console.warn('Intake query failed', e);
        }
    }

    return info;
}
