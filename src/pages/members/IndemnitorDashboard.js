/**
 * Shamrock Bail Bonds - Indemnitor Dashboard
 *
 * Member-only page for indemnitors/cosigners to:
 *   1. View the defendant they are indemnifying
 *   2. Sign pending documents (financial indemnity, collateral, CC auth)
 *   3. Upload government ID after signing
 *   4. View payment status
 *
 * URL: /members/indemnitor-dashboard
 *
 * Page Element IDs (set in Wix Editor):
 *   #welcomeText          — "Welcome, [Name]"
 *   #defendantInfoSection — Who they are indemnifying
 *   #defendantNameText    — Defendant full name
 *   #caseNumberText       — Case number
 *   #bondAmountText       — Bond amount
 *   #docsSection          — Documents section
 *   #docsRepeater         — Repeater: pending documents list
 *   #noDocsMessage        — "No documents pending"
 *   #idUploadSection      — ID upload section
 *   #idUploadBtn          — Upload ID button
 *   #idFileInput          — File input (UploadButton)
 *   #idUploadStatus       — Upload status text
 *   #paymentSection       — Payment status section
 *   #paymentStatusText    — Payment status
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
        showError('Unable to load your account. Please call (239) 332-2245.');
        showLoading(false);
        return;
    }

    displayWelcome();
    await loadPendingDocuments();
    setupEventListeners();
    showLoading(false);

    trackEvent('IndemnitorDashboard_View', { memberId: memberData.id });
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
        console.error('[IndemnitorDashboard] Error loading member:', error);
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
        } else {
            $w('#noDocsMessage').hide();
            $w('#docsRepeater').show();
            renderDocumentsRepeater();

            // Display defendant info from first document record
            const firstDoc = pendingDocs[0];
            if (firstDoc.caseId) {
                await loadCaseInfo(firstDoc.caseId);
            }
        }

        // Show ID upload if any doc is signed but no ID uploaded
        const needsId = pendingDocs.some(d => d.status === 'signed' && !d.idUploadUrl);
        if (needsId || pendingDocs.length === 0) {
            $w('#idUploadSection').show();
        }

    } catch (error) {
        console.error('[IndemnitorDashboard] Error loading documents:', error);
        showError('Unable to load your documents. Please refresh or call us.');
    }
}

async function loadCaseInfo(caseId) {
    try {
        const results = await wixData.query('Cases')
            .eq('_id', caseId)
            .find();

        if (results.items.length > 0) {
            const caseRecord = results.items[0];
            if ($w('#defendantNameText').valid) {
                $w('#defendantNameText').text = caseRecord.defendantName || 'Your Defendant';
            }
            if ($w('#caseNumberText').valid) {
                $w('#caseNumberText').text = caseRecord.caseNumber || '';
            }
            if ($w('#bondAmountText').valid) {
                const amount = caseRecord.bondAmount
                    ? `$${Number(caseRecord.bondAmount).toLocaleString()}`
                    : '';
                $w('#bondAmountText').text = amount;
            }
        }
    } catch (error) {
        console.error('[IndemnitorDashboard] Error loading case info:', error);
    }
}

function renderDocumentsRepeater() {
    $w('#docsRepeater').data = pendingDocs.map(doc => ({
        _id: doc._id,
        documentName: doc.documentName || doc.documentKey,
        status: formatStatus(doc.status),
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

    trackEvent('Indemnitor_Sign_Start', { docId: docRecordId });

    wixWindow.openLightbox('SigningOverlay', {
        signingUrl: signingUrl,
        docRecordId: docRecordId
    }).then((result) => {
        if (result && result.completed) {
            $w('#idUploadSection').show();
            $w('#idUploadStatus').text = 'Signing complete! Please upload your government ID below.';
            trackEvent('Indemnitor_Sign_Complete', { docId: docRecordId });
            loadPendingDocuments();
        }
    }).catch((err) => {
        console.error('[IndemnitorDashboard] Signing overlay error:', err);
    });
}

// ─────────────────────────────────────────────
// ID UPLOAD
// ─────────────────────────────────────────────

async function handleIdUpload() {
    try {
        $w('#idUploadBtn').disable();
        $w('#idUploadStatus').text = 'Uploading...';

        const uploadResults = await $w('#idFileInput').uploadFiles();

        if (!uploadResults || uploadResults.length === 0) {
            throw new Error('No file uploaded');
        }

        const fileUrl = uploadResults[0].fileUrl;

        // Attach to most recently signed doc
        const signedDoc = pendingDocs.find(d => d.status === 'signed' && !d.idUploadUrl);
        if (signedDoc) {
            await recordIdUploadById(signedDoc._id, fileUrl);
        }

        // Save to MemberDocuments
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

        trackEvent('Indemnitor_ID_Upload', { memberId: memberData.id });

    } catch (error) {
        console.error('[IndemnitorDashboard] ID upload error:', error);
        $w('#idUploadStatus').text = 'Upload failed. Please try again or call (239) 332-2245.';
        $w('#idUploadBtn').enable();
    }
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────

function setupEventListeners() {
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

    if ($w('#supportBtn').valid) {
        $w('#supportBtn').onClick(() => {
            trackEvent('Support_Click', { page: 'indemnitor_dashboard' });
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
    console.error('[IndemnitorDashboard]', message);
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

function trackEvent(name, data) {
    try {
        wixWindow.trackEvent(name, data);
    } catch (e) {
        console.error('[IndemnitorDashboard] trackEvent error:', e);
    }
}

export { loadPendingDocuments, handleIdUpload };
