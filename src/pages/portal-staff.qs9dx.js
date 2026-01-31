// Page: portal-staff.qs9dx.js (CUSTOM AUTH VERSION)
// Function: Staff Dashboard for Case Management (Stats, Search, Filtering)
// Last Updated: 2026-01-08
//
// AUTHENTICATION: Custom session-based (NO Wix Members)
// Uses browser storage (wix-storage-frontend) session tokens validated against PortalSessions collection

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { LightboxController } from 'public/lightbox-controller';
import { validateCustomSession, generateMagicLink, getStaffDashboardData } from 'backend/portal-auth';
import { getSessionToken, setSessionToken, clearSessionToken } from 'public/session-manager';
import wixSeo from 'wix-seo';

let allCases = []; // Store locally for fast filtering
let currentSession = null; // Store validated session data
let lastStats = null; // Cache stats for status restoration

$w.onReady(async function () {
    try {
        if ($w('#welcomeText').type) {
            $w('#welcomeText').text = "Loading Dashboard...";
        }
    } catch (e) { }

    // Check for session token in URL (passed from magic link redirect)
    const query = wixLocation.query;
    if (query.st) {
        console.log("🔗 Session token in URL, storing...");
        setSessionToken(query.st);
    }

    // CUSTOM AUTH CHECK - Replace Wix Members
    const sessionToken = query.st || getSessionToken();
    if (!sessionToken) {
        console.warn("⛔ No session token found. Redirecting to Portal Landing.");
        wixLocation.to('/portal-landing');
        return;
    }

    // Validate session with backend
    // ROBUSTNESS FIX: Handle database connection errors gracefully
    let session = null;
    try {
        const validationResult = await validateCustomSession(sessionToken);

        // Handle new response structure { valid: boolean, reason: string }
        // Or fallback to old structure (object = valid, null = invalid)

        if (validationResult && validationResult.valid) {
            session = validationResult;
        } else if (validationResult && validationResult.reason === 'error') {
            // DATABASE/NETWORK ERROR - DO NOT LOGOUT
            console.error("⚠️ Session validation failed due to network/DB error:", validationResult.message);
            $w('#welcomeText').text = "Connection Error. Retrying...";
            // Optional: Add a retry button or auto-retry logic here? 
            // For now, let's STOP execution but NOT redirect, allowing user to refresh.
            return;
        } else {
            // DEFINITELY INVALID or EXPIRED
            console.warn("⛔ Invalid or expired session. Redirecting.", validationResult);
            clearSessionToken();
            wixLocation.to('/portal-landing');
            return;
        }

    } catch (err) {
        console.error("❌ Critical error during session validation:", err);
        // Do not aggressively logout on unhandled errors
        $w('#welcomeText').text = "System Error. Please refresh.";
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

        const { stats, cases, systemLogs } = result;
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

            // C. Update Actionable Insights
            lastStats = stats;
            // Attach logs to stats object for the helper
            if (systemLogs) stats.systemLogs = systemLogs;

            updateActionableInsights(stats);

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
    setupMagicLinkGenerator(); // Setup "Open Dashboard" button

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
            if (typeof $w('#searchBar').onChange === 'function') {
                $w('#searchBar').onChange((event) => {
                    if (debounceTimer) clearTimeout(debounceTimer);
                    filterData();
                });
            }
        }
    } catch (e) {
        console.error('Error setting up search bar:', e);
    }


    updatePageSEO();
});

function updatePageSEO() {
    const pageTitle = "Staff Dashboard | Shamrock Bail Bonds";
    // STRICT No index for staff portals
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "robots", "content": "noindex, nofollow" },
        { "name": "googlebot", "content": "noindex" }
    ]);

    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": "Staff Dashboard",
            "mainEntity": {
                "@type": "Person",
                "name": "Staff Member",
                "jobTitle": "Bail Agent"
            }
        }
    ]);
}

function setupRepeater() {
    try {
        const repeater = $w('#caseListRepeater');
        if (!repeater) {
            console.error("CRITICAL: #caseListRepeater NOT FOUND on page");
            return;
        }

        console.log("Setup Repeater: #caseListRepeater found. Attaching onItemReady...");

        repeater.onItemReady(($item, itemData) => {
            console.log(`Repeater Item Ready: ${itemData._id} - ${itemData.defendantName}`);

            // Map Fields
            try {
                if ($item('#caseNumberText')) {
                    $item('#caseNumberText').text = itemData.caseNumber;
                } else { console.warn("Missing element: #caseNumberText"); }

                if ($item('#defendantNameText')) {
                    $item('#defendantNameText').text = itemData.defendantName;
                } else { console.warn("Missing element: #defendantNameText"); }

                if ($item('#bondAmountText')) {
                    $item('#bondAmountText').text = itemData.bondAmount;
                } else { console.warn("Missing element: #bondAmountText"); }

                if ($item('#caseStatusText')) {
                    $item('#caseStatusText').text = itemData.status;
                } else { console.warn("Missing element: #caseStatusText"); }

                if ($item('#paperworkStatusText')) {
                    $item('#paperworkStatusText').text = itemData.paperworkStatus;
                } else { console.warn("Missing element: #paperworkStatusText"); }

            } catch (e) {
                console.error('Error mapping repeater fields:', e);
            }

            // Actions - Details Button
            try {
                const detailsBtn = $item('#detailsBtn');
                if (detailsBtn) {
                    detailsBtn.onClick(() => {
                        console.log("Opening Details for", itemData.defendantName);
                        LightboxController.setupDefendantDetailsLightbox(itemData);
                    });
                } else { console.warn("Missing element: #detailsBtn"); }
            } catch (e) {
                console.error('Error setting up details button:', e);
            }

            // Actions - Send Magic Link Button
            try {
                const magicBtn = $item('#sendMagicLinkBtn');
                if (magicBtn) {
                    magicBtn.onClick(async () => {
                        try {
                            // Using the new helper function from the bottom of the file
                            // generateMagicLinkForUser comes from local scope or export
                            // We need to make sure we call the right function.
                            // The Remote file has `generateMagicLinkForUser` logic.

                            magicBtn.label = "...";

                            // Check if generateMagicLinkForUser is available or import it?
                            // In the Remote file, generateMagicLinkForUser is defined at the bottom.
                            // But we are inside $w.onReady scope mostly? No, setupRepeater is top-level function.
                            // generateMagicLinkForUser is exported. Ideally we can just call it if it's in scope.
                            // However, let's keep the logic simple here:

                            const token = await generateMagicLink(itemData._id, "defendant");
                            console.log(`Link: https://www.shamrockbailbonds.biz/portal-landing?token=${token}`);
                            magicBtn.label = "Sent";

                        } catch (e) {
                            console.error('Error generating magic link:', e);
                            magicBtn.label = "Error";
                        }
                    });
                }
            } catch (e) {
                console.error('Error setting up magic link button:', e);
            }

            // Actions - Stealth Poke Button (New!)
            try {
                const pokeBtn = $item('#btnStealthPoke');
                if (pokeBtn) {
                    pokeBtn.onClick(async () => {
                        console.log("Stealth Poke clicked for", itemData.defendantName);
                        triggerStealthPoke(itemData);
                    });
                }
            } catch (e) {
                // Ignore if button not exists
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


// ==================== MAGIC LINK GENERATION ====================

/**
 * Setup dashboard button (formerly magic link generator)
 * Now opens the Google Apps Script Dashboard
 */
function setupMagicLinkGenerator() {
    try {
        // robust check: prioritize user's requested ID 'btnOpenDashboard', fallback to original
        const dashboardBtn = $w('#btnOpenDashboard').uniqueId ? $w('#btnOpenDashboard') : $w('#btnGenerateMagicLink');

        if (dashboardBtn && typeof dashboardBtn.onClick === 'function') {
            console.log('Staff Portal: Dashboard button found');
            dashboardBtn.label = "Open Dashboard"; // Update label to reflect action

            dashboardBtn.onClick(async () => {
                try {
                    dashboardBtn.disable();
                    dashboardBtn.label = "Loading...";

                    // distinct import to avoid conflict with local function names
                    const { getDashboardUrl } = await import('backend/gasIntegration');
                    const result = await getDashboardUrl();

                    if (result.success && result.url) {
                        console.log("Opening dashboard:", result.url);
                        wixLocation.to(result.url);
                    } else {
                        console.error("Failed to get dashboard URL:", result.error);
                        showStaffMessage("Error loading dashboard URL", "error");
                    }
                } catch (err) {
                    console.error("Error opening dashboard:", err);
                    showStaffMessage("Error opening dashboard", "error");
                } finally {
                    dashboardBtn.label = "Open Dashboard";
                    dashboardBtn.enable();
                }
            });
        }
    } catch (e) {
        console.warn('Staff Portal: No dashboard button configured');
    }
}

/**
 * Open lightbox for generating magic links
 * This lightbox should have fields for email, personId, role, caseId, name
 */
async function openMagicLinkLightbox() {
    try {
        const result = await LightboxController.show('magicLinkGenerator', {
            staffSession: currentSession
        });

        if (result && result.success) {
            showStaffMessage(`Magic link sent successfully to ${result.email}`, 'success');
        }
    } catch (e) {
        console.error('Error opening magic link lightbox:', e);
        showStaffMessage('Error generating magic link', 'error');
    }
}

/**
 * Generate magic link directly from staff portal
 * Can be called from repeater row actions
 * 
 * @param {Object} userData - User data (email, personId, role, caseId, name)
 */
async function generateMagicLinkForUser(userData) {
    const { email, personId, role, caseId, personName } = userData;

    if (!email || !personId || !role) {
        showStaffMessage('Missing required fields for magic link generation', 'error');
        return;
    }

    try {
        // Import the magic link manager
        const { generateAndSendMagicLink } = await import('backend/magic-link-manager');

        // Show loading state
        showStaffMessage('Generating and sending magic link...', 'info');

        // Generate and send
        const result = await generateAndSendMagicLink({
            email: email,
            personId: personId,
            role: role,
            caseId: caseId,
            personName: personName
        });

        if (result.success) {
            showStaffMessage(`Magic link sent to ${email}`, 'success');
            console.log('Magic link token:', result.token);
        } else {
            showStaffMessage(`Failed: ${result.error}`, 'error');
        }

    } catch (error) {
        console.error('Error generating magic link:', error);
        showStaffMessage('Error generating magic link', 'error');
    }
}

/**
 * Generate magic link without sending email
 * Displays the access code for staff to share via phone/text
 * 
 * @param {Object} userData - User data (personId, role, caseId)
 */
async function generateAccessCodeOnly(userData) {
    const { personId, role, caseId } = userData;

    if (!personId || !role) {
        showStaffMessage('Missing required fields', 'error');
        return;
    }

    try {
        const { generateMagicLinkOnly } = await import('backend/magic-link-manager');

        const result = await generateMagicLinkOnly({
            personId: personId,
            role: role,
            caseId: caseId
        });

        if (result.success) {
            // Show access code in a lightbox or message
            showAccessCodeDisplay(result.token, result.url);
        } else {
            showStaffMessage(`Failed: ${result.error}`, 'error');
        }

    } catch (error) {
        console.error('Error generating access code:', error);
        showStaffMessage('Error generating access code', 'error');
    }
}

/**
 * Display access code to staff
 * Can be shown in a lightbox or message box
 */
function showAccessCodeDisplay(token, url) {
    try {
        // Try to show in a dedicated element
        const codeDisplay = $w('#accessCodeDisplay');
        const urlDisplay = $w('#accessCodeUrl');

        if (codeDisplay && codeDisplay.type) {
            codeDisplay.text = `Access Code: ${token}`;
            codeDisplay.show();
        }

        if (urlDisplay && urlDisplay.type) {
            urlDisplay.text = url;
            urlDisplay.show();
        }

        // Also log to console for easy copying
        console.log('=== ACCESS CODE GENERATED ===');
        console.log('Code:', token);
        console.log('URL:', url);
        console.log('============================');

        showStaffMessage('Access code generated! Check console for details.', 'success');

    } catch (e) {
        console.error('Error displaying access code:', e);
        // Fallback: just show in console
        console.log('Access Code:', token);
        console.log('URL:', url);
        showStaffMessage(`Access code: ${token}`, 'success');
    }
}

/**
 * Trigger Stealth SMS Poke
 * Sends a generic "Status Check" SMS that captures location on click.
 */
async function triggerStealthPoke(userData) {
    const { _id, defendantName, defendantPhone } = userData;

    if (!defendantPhone) {
        showStaffMessage("No phone number for defendant", "error");
        return;
    }

    try {
        showStaffMessage("Sending Stealth Poke... 🥷", "info");

        // Import backend function dynamically
        const { sendStealthPingSms } = await import('backend/twilio-client');

        const result = await sendStealthPingSms(_id, defendantPhone);

        if (result.success) {
            showStaffMessage("Poke Sent! 📍 Wait for ping...", "success");
        } else {
            showStaffMessage("Poke Failed: " + result.message, "error");
        }
    } catch (e) {
        console.error("Stealth Poke Error:", e);
        showStaffMessage("System Error Sending Poke", "error");
    }
}



/**
 * Updates the repurposed "Status" fields with actionable intelligence
 */
function updateActionableInsights(stats) {
    if (!stats) return;

    // Elements
    const msgEl = $w('#staffMessage');
    const codeEl = $w('#accessCodeDisplay'); // Repurposing as "Alert Detail"
    const urlEl = $w('#accessCodeUrl');      // Repurposing as "Timestamp/Sync"

    if (!msgEl || !codeEl || !urlEl) return;

    // Default Good State
    let statusTitle = "🟢 System Active";
    let statusDetail = "All systems operational.";
    let statusColor = "#28a745"; // Green

    // 1. Check Failures (Critical)
    if (stats.failedChecks > 0) {
        statusTitle = "🔴 Action Required";
        statusDetail = `${stats.failedChecks} Failed Background Check(s)`;
        statusColor = "#dc3545"; // Red
    }
    // 2. Check Pending High Load (Warning)
    else if (stats.pendingSignatures > 5) {
        statusTitle = "🟠 High Load";
        statusDetail = `${stats.pendingSignatures} Signatures Pending`;
        statusColor = "#ffc107"; // Amber
    }



    // 3. Info/Logs (Normal State)
    else {
        // Line 2: First Log (Lee)
        if (stats.systemLogs && stats.systemLogs[0]) {
            statusDetail = stats.systemLogs[0];
        }

        // Line 3: Second Log (Collier) or Timestamp
        if (stats.systemLogs && stats.systemLogs[1]) {
            urlEl.text = stats.systemLogs[1];
        } else {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            urlEl.text = `Synced: ${time}`;
        }
        urlEl.show();
    }

    // Apply
    msgEl.text = statusTitle;
    msgEl.style.color = statusColor;
    msgEl.show();

    codeEl.text = statusDetail;
    codeEl.show();
}

/**
 * Modified helper to handle transient messages vs persistent status
 */
function showStaffMessage(message, type = 'info') {
    const msgEl = $w('#staffMessage');
    const codeEl = $w('#accessCodeDisplay');
    const urlEl = $w('#accessCodeUrl');

    if (!msgEl) return;

    // Override for temporary message
    msgEl.text = message;

    // Hide details during message (cleaner look)
    if (codeEl) codeEl.collapse();
    if (urlEl) urlEl.collapse();

    if (type === 'success') msgEl.style.color = '#28a745';
    else if (type === 'error') msgEl.style.color = '#dc3545';
    else msgEl.style.color = '#17a2b8';

    msgEl.show();

    // Auto-restore Dashboard Status after 4s
    setTimeout(() => {
        if (lastStats) {
            updateActionableInsights(lastStats);
            if (codeEl) codeEl.expand();
            if (urlEl) urlEl.expand();
        } else {
            msgEl.hide();
        }
    }, 4000);
}

// Export for use in other parts of the staff portal
export { generateMagicLinkForUser, generateAccessCodeOnly, setupMagicLinkGenerator };
