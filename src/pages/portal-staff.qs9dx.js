// Page: portal-staff.qs9dx.js (CUSTOM AUTH VERSION)
// Function: Staff Dashboard for Case Management (Stats, Search, Filtering)
// Last Updated: 2026-01-08
//
// AUTHENTICATION: Custom session-based (NO Wix Members)
// Uses browser localStorage session tokens validated against PortalSessions collection

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { LightboxController } from 'public/lightbox-controller';
import { validateCustomSession, generateMagicLink, getStaffDashboardData } from 'backend/portal-auth';
import { getSessionToken, clearSessionToken } from 'public/session-manager';

let allCases = []; // Store locally for fast filtering
let currentSession = null; // Store validated session data

$w.onReady(async function () {
    try {
        if ($w('#welcomeText').type) {
            $w('#welcomeText').text = "Loading Dashboard...";
        }
    } catch (e) { }

    // CUSTOM AUTH CHECK - Replace Wix Members
    const sessionToken = getSessionToken();
    if (!sessionToken) {
        console.warn("⛔ No session token found. Redirecting to Portal Landing.");
        wixLocation.to('/portal-landing');
        return;
    }

    // Validate session with backend
    const session = await validateCustomSession(sessionToken);
    if (!session || !session.role) {
        console.warn("⛔ Invalid or expired session. Redirecting to Portal Landing.");
        clearSessionToken();
        wixLocation.to('/portal-landing');
        return;
    }

    // Check role authorization (staff or admin)
    if (session.role !== 'staff' && session.role !== 'admin') {
        console.warn(`⛔ Wrong role: ${session.role}. This is the staff portal.`);
        wixLocation.to('/portal-landing');
        return;
    }

    console.log("✅ Staff authenticated:", session.personId);
    currentSession = session;

    // 1. Load Data
    try {
        const result = await getStaffDashboardData();
        const { stats, cases } = result;
        allCases = cases;

        // A. Populate Stats
        try {
            if ($w('#activeCasesCount').type) {
                $w('#activeCasesCount').text = stats.activeCases.toString();
            }
            if ($w('#pendingSignaturesCount').type) {
                $w('#pendingSignaturesCount').text = stats.pendingSignatures.toString();
            }
            if ($w('#completedTodayCount').type) {
                $w('#completedTodayCount').text = stats.completedToday.toString();
            }
            if ($w('#failedCount').type) {
                $w('#failedCount').text = stats.failedChecks.toString();
            }
            if ($w('#welcomeText').type) {
                $w('#welcomeText').text = "Welcome, Staff";
            }
        } catch (e) {
            console.error('Error populating stats:', e);
        }

        // B. Init Repeater
        setupRepeater();
        try {
            if ($w('#caseListRepeater').type) {
                $w('#caseListRepeater').data = allCases;
            }
        } catch (e) {
            console.error('Error setting repeater data:', e);
        }

    } catch (err) {
        console.error("Staff Data Error", err);
        try {
            if ($w('#welcomeText').type) {
                $w('#welcomeText').text = "Error loading data.";
            }
        } catch (e) { }
    }

    // 2. Setup Event Handlers
    initFilters();
    setupLogoutButton();

    try {
        if ($w('#searchBar').type) {
            // "onInput" is not available on all Velo inputs. Using onKeyPress + debounce is safer.
            let debounceTimer;
            if (typeof $w('#searchBar').onKeyPress === 'function') {
                $w('#searchBar').onKeyPress((event) => {
                    if (debounceTimer) clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        filterData();
                    }, 500); // 500ms debounce
                });
            } else {
                console.warn("DEBUG: #searchBar does not support onKeyPress");
            }

            // Also trigger on manual change (loss of focus / enter)
            $w('#searchBar').onChange((event) => {
                if (debounceTimer) clearTimeout(debounceTimer);
                filterData();
            });
        }
    } catch (e) {
        console.error('Error setting up search bar:', e);
    }
});

function setupRepeater() {
    try {
        if (!$w('#caseListRepeater').type) return;

        $w('#caseListRepeater').onItemReady(($item, itemData) => {
            // Map Fields
            try {
                if ($item('#caseNumberText').type) {
                    $item('#caseNumberText').text = itemData.caseNumber;
                }
                if ($item('#defendantNameText').type) {
                    $item('#defendantNameText').text = itemData.defendantName;
                }
                if ($item('#bondAmountText').type) {
                    $item('#bondAmountText').text = itemData.bondAmount;
                }
                if ($item('#caseStatusText').type) {
                    $item('#caseStatusText').text = itemData.status;
                }
                if ($item('#paperworkStatusText').type) {
                    $item('#paperworkStatusText').text = itemData.paperworkStatus;
                }
            } catch (e) {
                console.error('Error mapping repeater fields:', e);
            }

            // Actions - Details Button
            try {
                if ($item('#detailsBtn').type) {
                    $item('#detailsBtn').onClick(() => {
                        console.log("Opening Details for", itemData.defendantName);
                        LightboxController.setupDefendantDetailsLightbox(itemData);
                    });
                }
            } catch (e) {
                console.error('Error setting up details button:', e);
            }

            // Actions - Send Magic Link Button
            try {
                if ($item('#sendMagicLinkBtn').type) {
                    $item('#sendMagicLinkBtn').onClick(async () => {
                        try {
                            $item('#sendMagicLinkBtn').label = "...";

                            // Generate magic link for this defendant
                            const token = await generateMagicLink(itemData._id, "defendant");
                            console.log(`Link for ${itemData.defendantName}: https://www.shamrockbailbonds.biz/portal-landing?token=${token}`);

                            $item('#sendMagicLinkBtn').label = "Sent";
                        } catch (e) {
                            console.error('Error generating magic link:', e);
                            $item('#sendMagicLinkBtn').label = "Error";
                        }
                    });
                }
            } catch (e) {
                console.error('Error setting up magic link button:', e);
            }
        });
    } catch (e) {
        console.error('Error setting up repeater:', e);
    }
}

function initFilters() {
    // Stat Card Filters
    try {
        if ($w('#filterAllBtn').type) {
            $w('#filterAllBtn').onClick(() => setFilter("All"));
        }
    } catch (e) { }

    try {
        if ($w('#filterPendingBtn').type) {
            $w('#filterPendingBtn').onClick(() => setFilter("Pending"));
        }
    } catch (e) { }

    try {
        if ($w('#filterActiveBtn').type) {
            $w('#filterActiveBtn').onClick(() => setFilter("Active"));
        }
    } catch (e) { }

    try {
        if ($w('#filterCompletedBtn').type) {
            $w('#filterCompletedBtn').onClick(() => setFilter("Completed"));
        }
    } catch (e) { }
}

function setupLogoutButton() {
    try {
        const logoutBtn = $w('#logoutBtn');
        if (logoutBtn && typeof logoutBtn.onClick === 'function') {
            console.log('Staff Portal: Logout button found');
            logoutBtn.onClick(() => {
                console.log('Staff Portal: Logout clicked');
                handleLogout();
            });
        } else {
            console.warn('Staff Portal: Logout button (#logoutBtn) not found');
        }
    } catch (e) {
        console.warn('Staff Portal: No logout button configured');
    }
}

async function handleLogout() {
    console.log('Staff Portal: Logging out...');
    clearSessionToken();
    wixLocation.to('/portal-landing');
}

let currentFilter = "All";

function setFilter(status) {
    currentFilter = status;
    filterData();
}

function filterData() {
    try {
        const query = $w('#searchBar').type ? $w('#searchBar').value.toLowerCase() : '';

        const filtered = allCases.filter(c => {
            const matchesStatus = currentFilter === "All" || c.status.toLowerCase() === currentFilter.toLowerCase();
            const matchesSearch = c.defendantName.toLowerCase().includes(query) ||
                c.caseNumber.toLowerCase().includes(query);
            return matchesStatus && matchesSearch;
        });

        if ($w('#caseListRepeater').type) {
            $w('#caseListRepeater').data = filtered;
        }

        // Toggle "No Data" text if empty
        try {
            if ($w('#noDataText').type) {
                if (filtered.length === 0) {
                    $w('#noDataText').expand();
                } else {
                    $w('#noDataText').collapse();
                }
            }
        } catch (e) { }
    } catch (e) {
        console.error('Error filtering data:', e);
    }
}
