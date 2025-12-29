// Page: portal-defendant.skg9y.js
// Function: Client Dashboard for Check-Ins with Selfie Requirement

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { saveUserLocation } from 'backend/location';
import { getUserProfile } from 'backend/portal-auth';

$w.onReady(async function () {
    $w('#welcomeText').text = "Loading...";

    // 1. Load User Info
    try {
        const member = await currentMember.getMember();
        if (member) {
            const profile = await getUserProfile(member._id);
            const name = (member.contactDetails?.firstName) || "Client";
            $w('#welcomeText').text = `Welcome, ${name}`;
        }
    } catch (e) {
        console.error("Profile Load Error", e);
        $w('#welcomeText').text = "Welcome";
    }

    // 2. Setup Check-In Handler
    $w('#checkInBtn').onClick(async () => {
        // Validation: Must have a file selected
        if ($w('#selfieUpload').value.length === 0) {
            $w('#statusBox').style.backgroundColor = "#FFE6E6";
            $w('#nextCourtDateText').text = "Error: Please take a selfie first.";
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

                // Visual feedback
                $w('#statusBox').style.backgroundColor = "#E6FFFA";
                if (result.address) {
                    $w('#nextCourtDateText').text = `Checked in at: ${result.address}`;
                }
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error("Check-in Error", error);
            $w('#checkInBtn').label = "Try Again";
            $w('#checkInBtn').enable();
            $w('#statusBox').style.backgroundColor = "#FFE6E6";
            $w('#nextCourtDateText').text = "Error: " + (error.message || "Please enable Location Services.");
        }
    });
});
