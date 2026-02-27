/**
 * Shamrock Bail Bonds - Defendant Dashboard
 *
 * Member-only page for defendants to:
 *   1. View their case status
 *   2. Sign pending documents (embedded SignNow)
 *   3. Upload government ID after signing
 *   4. Perform certified check-ins (GPS + selfie)
 *
 * URL: /members/defendant-dashboard
 *
 * Page Element IDs (set in Wix Editor):
 *   #welcomeText          — "Welcome, [Name]"
 *   #caseStatusBadge      — Status chip (Pending / Active / Complete)
 *   #caseInfoSection      — Case details container
 *   #caseNumber           — Case number text
 *   #chargesText          — Charges description
 *   #bondAmount           — Bond amount
 *   #courtName            — Court name
 *   #docsSection          — Documents section container
 *   #docsRepeater         — Repeater: pending documents list
 *   #noDocsMessage        — "No documents pending" text
 *   #signNowOverlay       — Lightbox/overlay for embedded signing
 *   #idUploadSection      — ID upload section (shown after signing)
 *   #idUploadBtn          — Upload ID button
 *   #idFileInput          — File input (UploadButton element)
 *   #idUploadStatus       — Upload status text
 *   #checkInSection       — Check-in section
 *   #checkInBtn           — Start check-in button
 *   #lastCheckInText      — Last check-in timestamp
 *   #supportBtn           — Call support button
 *   #loadingSpinner       — Loading indicator
 *   #errorBanner          — Error message banner
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { currentMember } from 'wix-members-frontend';
import wixData from 'wix-data';
import { getPendingDocumentsByEmail, recordIdUploadById } from 'backend/pendingDocuments';

const PHONE_TEL = 'tel:+12393322245';

let memberData = null;
let pendingDocs = [];

// ─────────────────────────────────────────────
// PAGE INIT
// ─────────────────────────────────────────────

$w.onReady(async function () {
    showLoading(true);

    const isLoggedIn = await checkLogin();
    if (!isLoggedIn) {
        wixLocation.to('/portal-landing?reason=auth_required');
        return;
    }

    memberData = await loadMemberData();
    if (!memberData) {
        showError('Unable to load your account. Please try again or call (239) 332-2245.');
        showLoading(false);
        return;
    }

    displayWelcome();
    await loadPendingDocuments();
    setupEventListeners();
    showLoading(false);

    trackEvent('DefendantDashboard_View', { memberId: memberData.id });
});

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

async function checkLogin() {
    try {
        const member = await currentMember.getMember();
        return !!member;
    } catch {
        return false;
    }
}

async function loadMemberData() {
    try {
        const member = await currentMember.getMember({ fieldsets: ['FULL'] });
        return {
            id: member._id,
            email: member.loginEmail,
            firstName: member.contactDetails?.firstName || '',
            lastName: member.contactDetails?.lastName || '',
            phone: member.contactDetails?.phones?.[0] || ''
        };
    } catch (error) {
        console.error('[DefendantDashboard] Error loading member:', error);
        return null;
    }
}

// ─────────────────────────────────────────────
// DISPLAY
// ─────────────────────────────────────────────

function displayWelcome() {
    const name = memberData.firstName || 'there';
    $w('#welcomeText').text = `Welcome, ${name}`;
}

async function loadPendingDocuments() {
    try {
        pendingDocs = await getPendingDocumentsByEmail(memberData.email);

        if (pendingDocs.length === 0) {
            $w('#noDocsMessage').show();
            $w('#docsRepeater').hide();
            $w('#idUploadSection').show(); // Show ID upload even if no docs pending
        } else {
            $w('#noDocsMessage').hide();
            $w('#docsRepeater').show();
            renderDocumentsRepeater();
        }

        // Show ID upload section if any doc is signed but no ID uploaded yet
        const needsId = pendingDocs.some(d => d.status === 'signed' && !d.idUploadUrl);
        if (needsId) {
            $w('#idUploadSection').show();
        }

    } catch (error) {
        console.error('[DefendantDashboard] Error loading documents:', error);
        showError('Unable to load your documents. Please refresh or call us.');
    }
}

function renderDocumentsRepeater() {
    $w('#docsRepeater').data = pendingDocs.map(doc => ({
        _id: doc._id,
        documentName: doc.documentName || doc.documentKey,
        status: formatStatus(doc.status),
        statusColor: getStatusColor(doc.status),
        sentAt: doc.sentAt ? new Date(doc.sentAt).toLocaleDateString() : '',
        canSign: doc.status === 'pending' || doc.status === 'viewed',
        signingUrl: doc.signingUrl || ''
    }));

    $w('#docsRepeater').onItemReady(($item, itemData) => {
        $item('#docName').text = itemData.documentName;
        $item('#docStatus').text = itemData.status;
        $item('#docDate').text = itemData.sentAt;

        if (itemData.canSign) {
            $item('#signBtn').enable();
            $item('#signBtn').label = 'Sign Now →';
            $item('#signBtn').onClick(() => {
                openSigningOverlay(itemData.signingUrl, itemData._id);
            });
        } else {
            $item('#signBtn').disable();
            $item('#signBtn').label = itemData.status === 'signed' ? 'Signed ✓' : 'Unavailable';
        }
    });
}

// ─────────────────────────────────────────────
// SIGNING
// ─────────────────────────────────────────────

function openSigningOverlay(signingUrl, docRecordId) {
    if (!signingUrl) {
        showError('Signing link not available. Please call (239) 332-2245.');
        return;
    }

    trackEvent('Defendant_Sign_Start', { docId: docRecordId });

    // Open SignNow embedded signing in a lightbox
    wixWindow.openLightbox('SigningOverlay', {
        signingUrl: signingUrl,
        docRecordId: docRecordId
    }).then((result) => {
        if (result && result.completed) {
            // Signing complete — show ID upload section
            $w('#idUploadSection').show();
            $w('#idUploadStatus').text = 'Signing complete! Please upload your government ID below.';
            trackEvent('Defendant_Sign_Complete', { docId: docRecordId });
            // Refresh document list
            loadPendingDocuments();
        }
    }).catch((err) => {
        console.error('[DefendantDashboard] Signing overlay error:', err);
    });
}

// ─────────────────────────────────────────────
// ID UPLOAD
// ─────────────────────────────────────────────

async function handleIdUpload() {
    try {
        $w('#idUploadBtn').disable();
        $w('#idUploadStatus').text = 'Uploading...';

        // Use Wix UploadButton to upload the file
        const uploadResults = await $w('#idFileInput').uploadFiles();

        if (!uploadResults || uploadResults.length === 0) {
            throw new Error('No file uploaded');
        }

        const fileUrl = uploadResults[0].fileUrl;

        // Find the most recently signed document to attach the ID to
        const signedDoc = pendingDocs.find(d => d.status === 'signed' && !d.idUploadUrl);

        if (signedDoc) {
            await recordIdUploadById(signedDoc._id, fileUrl);
        }

        // Also save to MemberDocuments for the account page
        await wixData.insert('MemberDocuments', {
            memberId: memberData.id,
            type: 'government_id',
            fileName: 'Government ID',
            fileUrl: fileUrl,
            verified: false,
            uploadDate: new Date()
        });

        $w('#idUploadStatus').text = 'ID uploaded successfully! ✓';
        $w('#idUploadBtn').label = 'Uploaded ✓';

        trackEvent('Defendant_ID_Upload', { memberId: memberData.id });

    } catch (error) {
        console.error('[DefendantDashboard] ID upload error:', error);
        $w('#idUploadStatus').text = 'Upload failed. Please try again or call (239) 332-2245.';
        $w('#idUploadBtn').enable();
    }
}

// ─────────────────────────────────────────────
// CHECK-IN
// ─────────────────────────────────────────────

async function startCheckIn() {
    trackEvent('CheckIn_Start', { memberId: memberData.id });

    wixWindow.openLightbox('CheckInOverlay', {
        memberId: memberData.id,
        memberEmail: memberData.email
    }).then((result) => {
        if (result && result.completed) {
            $w('#lastCheckInText').text = `Last check-in: ${new Date().toLocaleString()}`;
            trackEvent('CheckIn_Complete', { memberId: memberData.id });
        }
    });
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────

function setupEventListeners() {
    // ID upload
    if ($w('#idUploadBtn').valid) {
        $w('#idUploadBtn').onClick(() => {
            $w('#idFileInput').click();
        });
    }

    if ($w('#idFileInput').valid) {
        $w('#idFileInput').onChange(async () => {
            await handleIdUpload();
        });
    }

    // Check-in
    if ($w('#checkInBtn').valid) {
        $w('#checkInBtn').onClick(async () => {
            await startCheckIn();
        });
    }

    // Support
    if ($w('#supportBtn').valid) {
        $w('#supportBtn').onClick(() => {
            trackEvent('Support_Click', { page: 'defendant_dashboard' });
            wixLocation.to(PHONE_TEL);
        });
    }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function showLoading(visible) {
    if ($w('#loadingSpinner').valid) {
        visible ? $w('#loadingSpinner').show() : $w('#loadingSpinner').hide();
    }
}

function showError(message) {
    if ($w('#errorBanner').valid) {
        $w('#errorBanner').text = message;
        $w('#errorBanner').show();
    }
    console.error('[DefendantDashboard]', message);
}

function formatStatus(status) {
    const labels = {
        pending: 'Awaiting Signature',
        viewed: 'Opened — Please Sign',
        signed: 'Signed ✓',
        expired: 'Expired',
        error: 'Error'
    };
    return labels[status] || status;
}

function getStatusColor(status) {
    const colors = {
        pending: '#FDB913',
        viewed: '#0066CC',
        signed: '#00B894',
        expired: '#ADB5BD',
        error: '#E74C3C'
    };
    return colors[status] || '#ADB5BD';
}

function trackEvent(name, data) {
    try {
        wixWindow.trackEvent(name, data);
    } catch (e) {
        console.error('[DefendantDashboard] trackEvent error:', e);
    }
}

export { loadPendingDocuments, handleIdUpload };
