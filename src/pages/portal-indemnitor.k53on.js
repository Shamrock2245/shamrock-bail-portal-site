// Page: portal-indemnitor.k53on.js
// Function: Indemnitor Dashboard to view liability and defendant status

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { getUserProfile } from 'backend/portal-auth';

$w.onReady(async function () {
    $w('#welcomeText').text = "Loading Dashboard...";

    // 1. Get Indemnitor Info
    try {
        const member = await currentMember.getMember();
        if (!member) return;

        const profile = await getUserProfile(member._id);
        const name = (member.contactDetails?.firstName) || "Indemnitor";
        $w('#welcomeText').text = `Welcome, ${name}`;

        // 2. Get Associated Defendant Info
        // (Assuming 'personId' links to their defendant or we query by caseId)
        if (profile && profile.caseIds && profile.caseIds.length > 0) {
            await loadCaseDetails(profile.caseIds[0]);
        } else {
            $w('#defendantStatusText').text = "No active cases found.";
            $w('#liabilityText').text = "$0.00";
        }

    } catch (error) {
        console.error("Dashboard Error", error);
        $w('#welcomeText').text = "Welcome";
    }

    // 3. Contact Button
    $w('#contactBtn').onClick(() => {
        wixLocation.to("/contact");
    });
});

async function loadCaseDetails(caseId) {
    // fast placeholder query or real look up if "Cases" collection exists
    // For now, we simulate "Good Standing"
    $w('#defendantStatusText').text = "Good Standing";
    $w('#defendantStatusText').html = `<h4 style="color:#00AA00; text-align:center;">Good Standing</h4>`;

    $w('#liabilityText').text = "$5,000.00"; // Example placeholder
}
