// Page: portal-defendant.skg9y.js
// Function: Client Dashboard for Check-Ins with Selfie Requirement and Case Status

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { saveUserLocation } from 'backend/location';
import { getUserProfile, getDefendantDetails } from 'backend/portal-auth';
import { initiateSigningWorkflow } from 'backend/signing-methods';

$w.onReady(async function () {
    initUI(); // Set loading states

    try {
        const member = await currentMember.getMember();
        if (!member) {
            console.warn("⛔ Unauthorized Access. Redirecting to Portal Landing.");
            wixLocation.to('/portal');
            return;
        }

        // Fetch Comprehensive Data
        const data = await getDefendantDetails(member._id);
        const name = (member.contactDetails?.firstName) || "Client";

        // --- I. TOP SECTION: Case Details ---
        $w('#welcomeText').text = `Welcome, ${name}`;
        if (data) {
            $w('#caseNumberText').text = data.caseNumber || "Pending";
            $w('#bondAmountText').text = data.bondAmount || "$0.00";
            $w('#nextCourtDateValueText').text = data.nextCourtDate || "TBD";
            $w('#caseStatusText').text = data.caseStatus || "Active";

            // --- II. MIDDLE SECTION: Paperwork ---
            $w('#paperworkStatusText').text = data.paperworkStatus || "Pending";
            $w('#signingStatusText').text = data.signingStatus || "Incomplete";
        }

    } catch (e) {
        console.error("Dashboard Load Error", e);
        $w('#welcomeText').text = "Welcome";
    }

    setupEventHandlers();
});

function initUI() {
    $w('#welcomeText').text = "Loading...";
    $w('#checkInStatusText').collapse(); // Hide status initially
}

function setupEventHandlers() {
    // --- II. Paperwork Buttons ---
    // --- II. Paperwork Buttons ---
    $w('#signEmailBtn').onClick(async () => {
        $w('#signEmailBtn').label = "Sending...";
        try {
            const member = await currentMember.getMember();
            // Assuming we have a way to get case ID - for now getting from defendant details if possible or context
            // In dashboard, we might need to know WHICH case. 
            // Simplified: Use defendant's current active case or passed ID.
            if (!member) throw new Error("Not logged in");

            const result = await initiateSigningWorkflow({
                caseId: "ACTIVE_CASE", // This needs to be resolved to actual ID in backend or fetched
                method: 'email',
                defendantInfo: { email: member.loginEmail },
                documentIds: [] // Let backend decide or hardcode
            });

            $w('#signEmailBtn').label = "Sent!";
            $w('#signingStatusText').text = "Check your email to sign.";
            $w('#signingStatusText').expand();
        } catch (e) {
            console.error("Email Sign Error", e);
            $w('#signEmailBtn').label = "Retry";
        }
    });

    $w('#signKioskBtn').onClick(async () => {
        $w('#signKioskBtn').label = "Opening...";
        try {
            const member = await currentMember.getMember();
            const result = await initiateSigningWorkflow({
                caseId: "ACTIVE_CASE",
                method: 'kiosk',
                defendantInfo: { email: member.loginEmail, role: 'Defendant' },
                documentIds: []
            });

            if (result.success && result.links && result.links[0]) {
                wixWindow.openLightbox("SigningLightbox", {
                    signingUrl: result.links[0],
                    documentId: result.documentId || 'doc_unknown'
                });
                $w('#signKioskBtn').label = "Resume Signing";
            } else {
                throw new Error("Could not generate signing link");
            }
        } catch (e) {
            console.error("Kiosk Sign Error", e);
            $w('#signKioskBtn').label = "Retry";
        }
    }); // Implement Kiosk Mode via SingingLightbox
    $w('#downloadPrintBtn').onClick(() => console.log("Download clicked"));

    // --- III. Check-In Handler ---
    $w('#checkInBtn').onClick(async () => {
        // Validation: Must have a file selected
        if ($w('#selfieUpload').value.length === 0) {
            updateCheckInStatus("Error: Please take a selfie first.", "error");
            return;
        }

        $w('#checkInBtn').disable();
        $w('#checkInBtn').label = "Uploading...";
        $w('#statusBox').style.backgroundColor = "#FFFFFF";

        try {
            // A. Upload Selfie
            const uploadFiles = await $w('#selfieUpload').startUpload();
            const selfieUrl = uploadFiles.url;

            $w('#checkInBtn').label = "Acquiring Location...";

            // B. Get GPS
            const locationObj = await wixWindow.getCurrentGeolocation();
            const lat = locationObj.coords.latitude;
            const lng = locationObj.coords.longitude;
            const notes = $w('#updateNotesInput').value;

            $w('#checkInBtn').label = "Verifying...";

            // C. Submit to Backend
            const result = await saveUserLocation(lat, lng, notes, selfieUrl);

            if (result.success) {
                $w('#checkInBtn').label = "Check In Complete";
                $w('#checkInBtn').enable();
                $w('#updateNotesInput').value = "";
                updateCheckInStatus(`Checked in at: ${result.address}`, "success");
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error("Check-in Error", error);
            $w('#checkInBtn').label = "Try Again";
            $w('#checkInBtn').enable();
            updateCheckInStatus("Error: " + (error.message || "Please enable Location Services."), "error");
        }
    });
}

function updateCheckInStatus(msg, type) {
    const color = type === "success" ? "#E6FFFA" : "#FFE6E6";
    $w('#statusBox').style.backgroundColor = color;
    $w('#checkInStatusText').text = msg;
    $w('#checkInStatusText').expand();
}
