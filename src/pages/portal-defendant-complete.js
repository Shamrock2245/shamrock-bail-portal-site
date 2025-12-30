// Page: portal-defendant.skg9y.js (COMPLETE WITH ALL SIGNING METHODS)
// Function: Defendant Dashboard - Case Status, Check-In, Multi-Method Paperwork Signing

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { saveUserLocation } from 'backend/location';
import { getUserProfile, getCaseIds } from 'backend/portal-auth';
import { getPendingDocuments, getSigningStatus } from 'backend/signing-methods';
import wixData from 'wix-data';

let currentCase = null;
let pendingDocuments = [];
let currentMemberId = null;

$w.onReady(async function () {
    $w('#loadingBox').expand();
    $w('#mainContent').collapse();
    
    try {
        // 1. Load User Profile
        const member = await currentMember.getMember();
        if (!member) {
            wixLocation.to('/portal');
            return;
        }

        currentMemberId = member._id;
        const profile = await getUserProfile(member._id);
        const name = member.contactDetails?.firstName || "Client";
        $w('#welcomeText').text = `Welcome, ${name}`;

        // 2. Load Case Data
        const caseIds = await getCaseIds();
        if (caseIds && caseIds.length > 0) {
            await loadCaseData(caseIds[0]);
        } else {
            showNoCaseMessage();
        }

        // 3. Load Pending Paperwork
        await loadPendingDocuments();

        $w('#loadingBox').collapse();
        $w('#mainContent').expand();

    } catch (error) {
        console.error("Portal Load Error:", error);
        $w('#loadingBox').text = "Error loading dashboard. Please contact us.";
    }

    // 4. Setup Event Handlers
    setupEventHandlers();
});

/**
 * Load case data from Cases collection
 */
async function loadCaseData(caseId) {
    try {
        const results = await wixData.query('Cases')
            .eq('_id', caseId)
            .limit(1)
            .find({ suppressAuth: true });

        if (results.items.length > 0) {
            currentCase = results.items[0];
            displayCaseStatus(currentCase);
            
            // Load signing status
            const signingStatus = await getSigningStatus(caseId);
            if (signingStatus.success) {
                displaySigningStatus(signingStatus);
            }
        } else {
            showNoCaseMessage();
        }
    } catch (error) {
        console.error("Error loading case:", error);
        showNoCaseMessage();
    }
}

/**
 * Display case status information
 */
function displayCaseStatus(caseData) {
    // Case Number
    if (caseData.caseNumber) {
        $w('#caseNumberText').text = `Case: ${caseData.caseNumber}`;
        $w('#caseNumberText').expand();
    }

    // Bond Amount
    if (caseData.bondAmount) {
        $w('#bondAmountText').text = `Bond: $${formatMoney(caseData.bondAmount)}`;
        $w('#bondAmountText').expand();
    }

    // Court Date
    if (caseData.courtDate) {
        const courtDate = new Date(caseData.courtDate);
        const courtTime = caseData.courtTime || '';
        $w('#nextCourtDateText').text = `Next Court Date: ${courtDate.toLocaleDateString()} ${courtTime}`;
        $w('#nextCourtDateText').expand();
    }

    // Status
    const status = caseData.status || 'Active';
    $w('#caseStatusText').text = `Status: ${status}`;
    
    // Color code based on status
    if (status === 'Active' || status === 'Good Standing') {
        $w('#caseStatusBox').style.backgroundColor = '#E6FFFA';
        $w('#caseStatusText').style.color = '#00AA00';
    } else if (status === 'Pending') {
        $w('#caseStatusBox').style.backgroundColor = '#FFF9E6';
        $w('#caseStatusText').style.color = '#F59E0B';
    } else {
        $w('#caseStatusBox').style.backgroundColor = '#FFE6E6';
        $w('#caseStatusText').style.color = '#EF4444';
    }
}

/**
 * Display signing status
 */
function displaySigningStatus(signingStatus) {
    const { status, method } = signingStatus;
    
    let statusText = '';
    let statusColor = '';

    switch (status) {
        case 'pending':
            statusText = `📝 Paperwork sent via ${method.toUpperCase()} - awaiting signature`;
            statusColor = '#F59E0B';
            break;
        case 'signed':
            statusText = '✓ Paperwork signed - processing complete';
            statusColor = '#10B981';
            break;
        case 'completed':
            statusText = '✓ All paperwork completed and filed';
            statusColor = '#10B981';
            break;
        default:
            statusText = 'No signing session found';
            statusColor = '#64748B';
    }

    $w('#signingStatusText').text = statusText;
    $w('#signingStatusText').style.color = statusColor;
    $w('#signingStatusText').expand();
}

/**
 * Load pending documents
 */
async function loadPendingDocuments() {
    try {
        const result = await getPendingDocuments(currentMemberId);

        if (result.success && result.documents.length > 0) {
            pendingDocuments = result.documents;
            $w('#paperworkSection').expand();
            $w('#paperworkStatusText').text = `You have ${pendingDocuments.length} document(s) to sign`;
            
            // Show appropriate signing buttons based on method
            displaySigningOptions(pendingDocuments[0]);
        } else {
            $w('#paperworkSection').collapse();
        }
    } catch (error) {
        console.error("Error loading pending documents:", error);
        $w('#paperworkSection').collapse();
    }
}

/**
 * Display signing options based on delivery method
 */
function displaySigningOptions(document) {
    const method = document.method || 'email';

    // Hide all buttons first
    $w('#signEmailBtn').collapse();
    $w('#signKioskBtn').collapse();
    $w('#downloadPrintBtn').collapse();

    switch (method) {
        case 'email':
            $w('#paperworkInstructions').text = 'Check your email for the signing link, or click below to sign now.';
            $w('#signEmailBtn').expand();
            break;

        case 'sms':
            $w('#paperworkInstructions').text = 'Check your text messages for the signing link, or click below to sign now.';
            $w('#signEmailBtn').expand(); // Same button, different label
            $w('#signEmailBtn').label = 'Sign Now (SMS Link)';
            break;

        case 'kiosk':
            $w('#paperworkInstructions').text = 'Your paperwork is ready for in-office signing.';
            $w('#signKioskBtn').expand();
            break;

        case 'print':
            $w('#paperworkInstructions').text = 'Download and print your paperwork for wet signature.';
            $w('#downloadPrintBtn').expand();
            break;

        default:
            $w('#paperworkInstructions').text = 'Contact us to complete your paperwork.';
    }

    $w('#paperworkInstructions').expand();
}

/**
 * Show message when no case is found
 */
function showNoCaseMessage() {
    $w('#caseStatusText').text = "No active case found";
    $w('#caseStatusBox').style.backgroundColor = "#F1F3F9";
    $w('#nextCourtDateText').text = "Contact us to start your bail process";
    $w('#nextCourtDateText').expand();
}

/**
 * Setup all event handlers
 */
function setupEventHandlers() {
    // Check-In Button
    $w('#checkInBtn').onClick(handleCheckIn);

    // Sign Paperwork Buttons
    $w('#signEmailBtn').onClick(() => handleSignPaperwork('email'));
    $w('#signKioskBtn').onClick(() => handleSignPaperwork('kiosk'));
    $w('#downloadPrintBtn').onClick(() => handleSignPaperwork('print'));

    // Contact Button
    $w('#contactBtn').onClick(() => {
        wixLocation.to('/contact');
    });
}

/**
 * Handle check-in with selfie and GPS
 */
async function handleCheckIn() {
    // Validation: Must have a selfie uploaded
    if ($w('#selfieUpload').value.length === 0) {
        $w('#statusBox').style.backgroundColor = "#FFE6E6";
        $w('#checkInStatusText').text = "Error: Please take a selfie first.";
        $w('#checkInStatusText').expand();
        return;
    }

    $w('#checkInBtn').disable();
    $w('#checkInBtn').label = "Uploading...";
    $w('#statusBox').style.backgroundColor = "#FFFFFF";

    try {
        // A. Upload Selfie
        const uploadFiles = await $w('#selfieUpload').startUpload();
        const selfieUrl = uploadFiles[0].url;

        $w('#checkInBtn').label = "Acquiring Location...";

        // B. Get GPS
        const locationObj = await wixWindow.getCurrentGeolocation();
        const lat = locationObj.coords.latitude;
        const lng = locationObj.coords.longitude;
        const notes = $w('#updateNotesInput').value || '';

        $w('#checkInBtn').label = "Verifying...";

        // C. Submit to Backend
        const result = await saveUserLocation(lat, lng, notes, selfieUrl);

        if (result.success) {
            $w('#checkInBtn').label = "Check In Complete ✓";
            $w('#checkInBtn').enable();
            $w('#updateNotesInput').value = "";

            // Visual feedback
            $w('#statusBox').style.backgroundColor = "#E6FFFA";
            $w('#checkInStatusText').text = result.address 
                ? `Checked in at: ${result.address}` 
                : "Check-in successful!";
            $w('#checkInStatusText').expand();

            // Reset selfie upload
            $w('#selfieUpload').reset();
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error("Check-in Error:", error);
        $w('#checkInBtn').label = "Try Again";
        $w('#checkInBtn').enable();
        $w('#statusBox').style.backgroundColor = "#FFE6E6";
        $w('#checkInStatusText').text = "Error: " + (error.message || "Please enable Location Services.");
        $w('#checkInStatusText').expand();
    }
}

/**
 * Handle paperwork signing based on method
 */
async function handleSignPaperwork(method) {
    if (pendingDocuments.length === 0) {
        $w('#paperworkStatusText').text = "No pending documents found";
        return;
    }

    const doc = pendingDocuments[0];
    const signingLink = doc.signingLink;

    switch (method) {
        case 'email':
        case 'sms':
            // Redirect to SignNow embedded signing page
            if (signingLink) {
                wixLocation.to(`/sign?link=${encodeURIComponent(signingLink)}`);
            } else {
                $w('#paperworkStatusText').text = "Signing link not available. Please check your email/SMS.";
            }
            break;

        case 'kiosk':
            // Open kiosk signing in lightbox or full screen
            if (signingLink) {
                wixWindow.openLightbox('SignNowKioskLightbox', { url: signingLink });
            } else {
                $w('#paperworkStatusText').text = "Kiosk link not available. Please contact staff.";
            }
            break;

        case 'print':
            // Download PDF
            if (doc.downloadUrl) {
                wixWindow.openLightbox('DownloadPDFLightbox', { url: doc.downloadUrl });
            } else {
                $w('#paperworkStatusText').text = "Download not available. Please contact staff.";
            }
            break;
    }
}

/**
 * Format money with commas
 */
function formatMoney(amount) {
    return parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
