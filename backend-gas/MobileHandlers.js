// ============================================================================
// Shamrock Bail Bonds - Mobile & Tablet Handlers (MobileHandlers.gs)
// ============================================================================
/**
 * Specialized handlers for Mobile/Tablet views to reduce payload size
 * and optimize for touch interfaces.
 */

/**
 * Validates if the user is allowed to access Mobile views.
 * Reuses existing ACL logic from Code.js.
 */
function validateMobileAccess() {
  // Check if security function exists
  if (typeof isUserAllowed === 'function') {
    const userEmail = Session.getActiveUser().getEmail();
    return isUserAllowed(userEmail);
  }
  return true; // Fallback if security module not loaded (dev)
}

/**
 * Optimized initial data fetch for Mobile Dashboard.
 * Returns only essential data: Critical Alerts, Today's Check-ins, Recent Intakes.
 */
function getMobileInitialData() {
  if (!validateMobileAccess()) {
    throw new Error("Access Denied");
  }

  // 1. Fetch Pending Intakes (from Wix Sync or Local Cache)
  let pendingIntakes = [];
  if (typeof getWixIntakeQueue === 'function') {
    pendingIntakes = getWixIntakeQueue() || [];
  }

  // 2. Get Active Bond Count (Fast Sheet Lookup)
  const stats = getMobileQuickStats();

  // 3. Get Recent Activity (simulated from intakes for now)
  const recentActivity = pendingIntakes.slice(0, 5).map(intake => ({
    id: intake._id,
    initials: getInitials(intake.defendantName),
    name: intake.defendantName,
    status: intake.status,
    date: intake._createdDate
  }));

  return {
    user: Session.getActiveUser().getEmail(),
    timestamp: new Date().toISOString(),
    stats: {
      activeBonds: stats.activeBonds,
      pendingIntakes: pendingIntakes.length,
      checkInsDue: stats.checkInsDue,
      collections: stats.collections
    },
    recentActivity: recentActivity
  };
}

/**
 * Get quick stats from Sheets without loading everything
 */
function getMobileQuickStats() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let activeBonds = 0;

    // Count from County sheets (approximate)
    const counties = ['Lee', 'Collier', 'Hendry', 'Charlotte']; // Main ones
    for (const county of counties) {
      const sheet = ss.getSheetByName(county);
      if (sheet) {
        activeBonds += Math.max(0, sheet.getLastRow() - 1);
      }
    }

    return {
      activeBonds: activeBonds,
      pendingIntakes: 0, // Filled by getMobileInitialData
      checkInsDue: 5,  // Stub: Implement Check-in logic later
      collections: "$0" // Stub: Implement Financial logic later
    };
  } catch (e) {
    console.error("Error fetching stats:", e);
    return { activeBonds: "-", pendingIntakes: "-", checkInsDue: "-", collections: "-" };
  }
}

/**
 * Helper: Get Initials
 */
function getInitials(name) {
  if (!name) return "??";
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

/**
 * Handle Mobile specific actions
 */
function handleMobileAction(payload) {
  // Delegate to main handler or specialized logic
  try {
    if (payload.action === 'fetchMobileData') {
      return getMobileInitialData();
    }

    // Pass through to main handler if exists
    if (typeof handleAction === 'function') {
      return handleAction(payload);
    }

    return { success: false, error: "Unknown action" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}
