// Page: portal-defendant.skg9y.js (ENHANCED)
// Function: Defendant Dashboard - Case Status, Check-In, Paperwork Signing

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { saveUserLocation } from 'backend/location';
import { getUserProfile, getCaseIds } from 'backend/portal-auth';
import wixData from 'wix-data';

let currentCase = null;
let pendingDocuments = [];

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
        await loadPendingDocuments(member._id);

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
 * Load case data from Wix collection or GAS backend
 */
async function loadCaseData(caseId) {
    try {
        // Query the Cases collection (or call GAS API)
        const results = await wixData.query('Cases')
            .eq('_id', caseId)
            .limit(1)
            .find({ suppressAuth: true });

        if (results.items.length > 0) {
            currentCase = results.items[0];
            displayCaseStatus(currentCase);
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
 * Load pending documents from PendingDocuments collection
 */
async function loadPendingDocuments(memberId) {
    try {
        const results = await wixData.query('PendingDocuments')
            .eq('memberId', memberId)
            .eq('status', 'pending')
            .find({ suppressAuth: true });

        pendingDocuments = results.items;

        if (pendingDocuments.length > 0) {
            $w('#paperworkSection').expand();
            $w('#paperworkStatusText').text = `You have ${pendingDocuments.length} document(s) to sign`;
            $w('#signPaperworkBtn').expand();
        } else {
            $w('#paperworkSection').collapse();
        }
    } catch (error) {
        console.error("Error loading pending documents:", error);
        $w('#paperworkSection').collapse();
    }
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

    // Sign Paperwork Button
    $w('#signPaperworkBtn').onClick(handleSignPaperwork);

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
 * Handle paperwork signing - redirect to SignNow embedded signing
 */
async function handleSignPaperwork() {
    if (pendingDocuments.length === 0) {
        $w('#paperworkStatusText').text = "No pending documents found";
        return;
    }

    $w('#signPaperworkBtn').disable();
    $w('#signPaperworkBtn').label = "Loading...";

    try {
        // Get the first pending document's signing link
        const doc = pendingDocuments[0];
        const signingLink = doc.signingLink;

        if (!signingLink) {
            throw new Error("Signing link not found");
        }

        // Option 1: Open in new window
        // wixWindow.openLightbox('SignNowEmbedLightbox', { url: signingLink });

        // Option 2: Redirect to signing page with embedded SignNow
        wixLocation.to(`/sign?link=${encodeURIComponent(signingLink)}`);

        // Option 3: Use global SignNow embed (if configured)
        // if (typeof ShamrockSignNow !== 'undefined') {
        //     ShamrockSignNow.openSigningLink(signingLink);
        // }

    } catch (error) {
        console.error("Paperwork Error:", error);
        $w('#signPaperworkBtn').enable();
        $w('#signPaperworkBtn').label = "Sign Paperwork";
        $w('#paperworkStatusText').text = "Error loading paperwork. Please contact us.";
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
