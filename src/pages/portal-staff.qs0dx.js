// Page: portal-staff.qs0dx.js
// Function: Admin Dashboard to manage users and generate links

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { generateMagicLink } from 'backend/portal-auth';

$w.onReady(async function () {
    // 1. Initial Load
    await loadDefendants();

    // 2. Refresh Link
    $w('#refreshBtn').onClick(() => loadDefendants());
});

async function loadDefendants() {
    $w('#loadingText').expand();
    $w('#defendantsRepeater').collapse();

    try {
        const results = await wixData.query("PortalUsers")
            .eq("role", "defendant")
            .descending("_updatedDate")
            .limit(50)
            .find();

        $w('#defendantsRepeater').data = results.items;

        $w('#defendantsRepeater').onItemReady(($item, itemData) => {
            $item('#nameText').text = itemData.personId || "Unknown Defendant";
            $item('#roleText').text = itemData.role || "No Role";

            $item('#generateLinkBtn').onClick(async () => {
                $item('#generateLinkBtn').disable();
                $item('#generateLinkBtn').label = "...";

                try {
                    const caseId = itemData.caseIds && itemData.caseIds.length > 0 ? itemData.caseIds[0] : null;
                    const token = await generateMagicLink(itemData.personId, itemData.role, caseId);

                    const link = `https://www.shamrockbailbonds.biz/portal?token=${token}`;

                    console.log("Magic Link Generated:", link);

                    $item('#linkOutput').text = "Link Logged to Console";
                    $item('#linkOutput').expand();
                    $item('#generateLinkBtn').label = "Sent";
                } catch (err) {
                    console.error("Gen Link Error:", err);
                    $item('#generateLinkBtn').label = "Error";
                }
            });
        });

        $w('#loadingText').collapse();
        $w('#defendantsRepeater').expand();
        $w('#noDataText').collapse();

        if (results.items.length === 0) {
            $w('#noDataText').expand();
        }

    } catch (error) {
        console.error("Load Error:", error);
        $w('#loadingText').text = "Error loading data. Check console.";
        $w('#loadingText').expand();
    }
}
