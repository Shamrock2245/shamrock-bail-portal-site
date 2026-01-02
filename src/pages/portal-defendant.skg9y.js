// Page: portal-defendant.skg9y.js
// Function: Client Dashboard for Check-Ins with Selfie Requirement and Case Status

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { saveUserLocation } from 'backend/location';
import { getUserProfile, getDefendantDetails } from 'backend/portal-auth';

$w.onReady(async function () {
    initUI(); // Set loading states

    try {
        const member = await currentMember.getMember();
        if (!member) return;

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
    $w('#signEmailBtn').onClick(() => wixWindow.openLightbox("SignViaEmail")); // Placeholder
    $w('#signKioskBtn').onClick(() => wixWindow.openLightbox("SignViaKiosk")); // Placeholder
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
