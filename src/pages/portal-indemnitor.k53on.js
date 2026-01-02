// Page: portal-indemnitor.k53on.js
// Function: Indemnitor Dashboard to view liability and defendant status

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { getUserProfile, getIndemnitorDetails } from 'backend/portal-auth';

$w.onReady(async function () {
    $w('#welcomeText').text = "Loading Dashboard...";

    try {
        const member = await currentMember.getMember();
        if (!member) return;

        // Fetch Comprehensive Data
        const data = await getIndemnitorDetails(member._id);

        // 1. Welcome & Header
        const name = (member.contactDetails?.firstName) || "Indemnitor";
        $w('#welcomeText').text = `Welcome, ${name}`;

        if (data) {
            // 2. Financials (Top Blue & Cards)
            $w('#liabilityText').text = data.totalLiability || "$0.00";
            $w('#totalPremiumText').text = data.totalPremium || "$0.00";
            $w('#downPaymentText').text = data.downPayment || "$0.00";
            $w('#balanceDueText').text = data.balanceDue || "$0.00";
            $w('#chargesCountText').text = data.chargesCount || "0";

            // 3. Defendant Status (Bottom)
            $w('#defendantNameText').text = data.defendantName || "N/A";
            $w('#defendantStatusText').text = data.defendantStatus || "Unknown";
            $w('#lastCheckInText').text = data.lastCheckIn || "Never";
            $w('#nextCourtDateText').text = data.nextCourtDate || "TBD";
        }

    } catch (error) {
        console.error("Dashboard Error", error);
        $w('#welcomeText').text = "Welcome";
    }

    // 4. Contact Button
    $w('#contactBtn').onClick(() => {
        wixLocation.to("/contact");
    });
});
