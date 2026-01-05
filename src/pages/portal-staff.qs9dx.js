// Page: portal-staff.qs9dx.js
// Function: Staff Dashboard for Case Management (Stats, Search, Filtering)

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { LightboxController } from 'public/lightbox-controller';
import { generateMagicLink, getStaffDashboardData } from 'backend/portal-auth';

let allCases = []; // Store locally for fast filtering

$w.onReady(async function () {
    $w('#welcomeText').text = "Loading Dashboard...";

    // 0. Security Check
    import('wix-members').then(async (wm) => {
        const member = await wm.currentMember.getMember();
        if (!member) {
            console.warn("⛔ Staff Access Denied. Redirecting...");
            wixLocation.to('/portal');
        }
    });

    // 1. Load Data
    try {
        const result = await getStaffDashboardData();
        const { stats, cases } = result;
        allCases = cases;

        // A. Populate Stats
        $w('#activeCasesCount').text = stats.activeCases.toString();
        $w('#pendingSignaturesCount').text = stats.pendingSignatures.toString();
        $w('#completedTodayCount').text = stats.completedToday.toString();
        $w('#failedCount').text = stats.failedChecks.toString();

        $w('#welcomeText').text = "Welcome, Staff";

        // B. Init Repeater
        setupRepeater();
        $w('#caseListRepeater').data = allCases;

    } catch (err) {
        console.error("Staff Data Error", err);
        $w('#welcomeText').text = "Error loading data.";
    }

    // 2. Setup Event Handlers
    initFilters();
    $w('#searchBar').onInput((event) => filterData());
});

function setupRepeater() {
    $w('#caseListRepeater').onItemReady(($item, itemData) => {
        // Map Fields
        $item('#caseNumberText').text = itemData.caseNumber;
        $item('#defendantNameText').text = itemData.defendantName;
        $item('#bondAmountText').text = itemData.bondAmount;
        $item('#caseStatusText').text = itemData.status;
        $item('#paperworkStatusText').text = itemData.paperworkStatus;

        // Actions
        $item('#detailsBtn').onClick(() => {
            console.log("Opening Details for", itemData.defendantName);
            LightboxController.setupDefendantDetailsLightbox(itemData);
        });

        $item('#sendMagicLinkBtn').onClick(async () => {
            $item('#sendMagicLinkBtn').label = "...";
            try {
                // Generate magic link for this defendant
                // assuming itemData matches personId or generic ID for now
                const token = await generateMagicLink(itemData._id, "defendant");
                console.log(`Link for ${itemData.defendantName}: https://www.shamrockbailbonds.biz/portal?token=${token}`);
                $item('#sendMagicLinkBtn').label = "Sent";
            } catch (e) {
                $item('#sendMagicLinkBtn').label = "Error";
            }
        });
    });
}

function initFilters() {
    // Stat Card Filters
    $w('#filterAllBtn').onClick(() => setFilter("All"));
    $w('#filterPendingBtn').onClick(() => setFilter("Pending"));
    $w('#filterActiveBtn').onClick(() => setFilter("Active"));
    $w('#filterCompletedBtn').onClick(() => setFilter("Completed"));
}

let currentFilter = "All";

function setFilter(status) {
    currentFilter = status;
    filterData();
}

function filterData() {
    const query = $w('#searchBar').value.toLowerCase();

    const filtered = allCases.filter(c => {
        const matchesStatus = currentFilter === "All" || c.status.toLowerCase() === currentFilter.toLowerCase();
        const matchesSearch = c.defendantName.toLowerCase().includes(query) ||
            c.caseNumber.toLowerCase().includes(query);
        return matchesStatus && matchesSearch;
    });

    $w('#caseListRepeater').data = filtered;

    // Toggle "No Data" text if empty
    if (filtered.length === 0) $w('#noDataText').expand();
    else $w('#noDataText').collapse();
}
