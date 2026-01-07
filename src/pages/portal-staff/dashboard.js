/**
 * Staff Portal Dashboard
 * /portal-staff/dashboard
 * 
 * Operations console for staff to monitor and manage:
 * - Active cases
 * - Missing paperwork
 * - Failed payments
 * - Recent check-ins
 * - Document reviews
 * 
 * This is an ops console, not a CRM
 */

import {
  getDashboardStats,
  getActiveCases,
  getMissingPaperworkCases,
  getPaymentIssues,
  getRecentCheckIns,
  getPendingDocumentReviews,
  resendPaperwork,
  flagCase,
  addCaseNote
} from 'backend/staff-portal';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import wixWindowFrontend from 'wix-window-frontend';

let currentStaffEmail = null;
let currentView = 'overview'; // overview, active, paperwork, payments, checkins, documents

$w.onReady(async function () {
  // Check if user is logged in
  if (!wixUsers.currentUser.loggedIn) {
    wixLocation.to('/members/login');
    return;
  }

  // Get current staff email
  currentStaffEmail = await wixUsers.currentUser.getEmail();

  // Initialize dashboard
  await initializeDashboard();

  // Set up event handlers
  // Set up event handlers
  const overviewTab = $w('#overviewTab');
  if (overviewTab.length) overviewTab.onClick(() => switchView('overview'));

  const activeCasesTab = $w('#activeCasesTab');
  if (activeCasesTab.length) activeCasesTab.onClick(() => switchView('active'));

  const paperworkTab = $w('#paperworkTab');
  if (paperworkTab.length) paperworkTab.onClick(() => switchView('paperwork'));

  const paymentsTab = $w('#paymentsTab');
  if (paymentsTab.length) paymentsTab.onClick(() => switchView('payments'));

  const checkInsTab = $w('#checkInsTab');
  if (checkInsTab.length) checkInsTab.onClick(() => switchView('checkins'));

  const documentsTab = $w('#documentsTab');
  if (documentsTab.length) documentsTab.onClick(() => switchView('documents'));

  const refreshBtn = $w('#refreshBtn');
  if (refreshBtn.length) refreshBtn.onClick(refreshCurrentView);
});

/**
 * Initialize the dashboard
 */
async function initializeDashboard() {
  try {
    showLoading(true);

    // Load overview stats
    await loadOverviewStats();

    showLoading(false);

  } catch (error) {
    console.error('Error initializing dashboard:', error);
    showError('Failed to load dashboard. Please refresh the page.');
  }
}

/**
 * Load overview statistics
 */
async function loadOverviewStats() {
  try {
    const statsResult = await getDashboardStats(currentStaffEmail);

    if (!statsResult.success) {
      throw new Error(statsResult.error || 'Failed to load stats');
    }

    const stats = statsResult.stats;

    // Update stat cards
    $w('#activeCasesCount').text = stats.activeCases.toString();
    $w('#pendingPaperworkCount').text = stats.pendingPaperwork.toString();
    $w('#pendingPaymentsCount').text = stats.pendingPayments.toString();
    $w('#failedPaymentsCount').text = stats.failedPayments.toString();
    $w('#pendingDocumentsCount').text = stats.pendingDocuments.toString();
    $w('#todayCheckInsCount').text = stats.todayCheckIns.toString();

    // Highlight urgent items
    if (stats.failedPayments > 0) {
      $w('#failedPaymentsCard').style.backgroundColor = '#FEE2E2'; // Light red
    }

    if (stats.pendingPaperwork > 5) {
      $w('#pendingPaperworkCard').style.backgroundColor = '#FEF3C7'; // Light yellow
    }

  } catch (error) {
    console.error('Error loading overview stats:', error);
    throw error;
  }
}

/**
 * Switch between different views
 */
async function switchView(view) {
  currentView = view;

  // Update tab styles
  $w('#overviewTab').style.backgroundColor = view === 'overview' ? '#2563EB' : '#E5E7EB';
  $w('#activeCasesTab').style.backgroundColor = view === 'active' ? '#2563EB' : '#E5E7EB';
  $w('#paperworkTab').style.backgroundColor = view === 'paperwork' ? '#2563EB' : '#E5E7EB';
  $w('#paymentsTab').style.backgroundColor = view === 'payments' ? '#2563EB' : '#E5E7EB';
  $w('#checkInsTab').style.backgroundColor = view === 'checkins' ? '#2563EB' : '#E5E7EB';
  $w('#documentsTab').style.backgroundColor = view === 'documents' ? '#2563EB' : '#E5E7EB';

  // Hide all views
  $w('#overviewSection').collapse();
  $w('#activeCasesSection').collapse();
  $w('#paperworkSection').collapse();
  $w('#paymentsSection').collapse();
  $w('#checkInsSection').collapse();
  $w('#documentsSection').collapse();

  // Show selected view and load data
  showLoading(true);

  try {
    switch (view) {
      case 'overview':
        $w('#overviewSection').expand();
        await loadOverviewStats();
        break;
      case 'active':
        $w('#activeCasesSection').expand();
        await loadActiveCases();
        break;
      case 'paperwork':
        $w('#paperworkSection').expand();
        await loadMissingPaperwork();
        break;
      case 'payments':
        $w('#paymentsSection').expand();
        await loadPaymentIssues();
        break;
      case 'checkins':
        $w('#checkInsSection').expand();
        await loadRecentCheckIns();
        break;
      case 'documents':
        $w('#documentsSection').expand();
        await loadPendingDocuments();
        break;
    }
  } catch (error) {
    console.error(`Error loading ${view} view:`, error);
    showError(`Failed to load ${view} data`);
  }

  showLoading(false);
}

/**
 * Load active cases
 */
async function loadActiveCases() {
  const result = await getActiveCases(currentStaffEmail);

  if (!result.success) {
    showError('Failed to load active cases');
    return;
  }

  // Populate repeater with cases
  $w('#activeCasesRepeater').data = result.cases.map(c => ({
    _id: c._id,
    caseNumber: c.caseNumber || c._id.substring(0, 8),
    defendantName: c.defendantName || 'Unknown',
    county: c.county || 'N/A',
    bondAmount: `$${(c.bondAmount || 0).toFixed(2)}`,
    paperworkStatus: c.paperworkStatus || 'not-started',
    paymentStatus: c.paymentStatus || 'not-started',
    documentCount: c.documentCount || 0,
    checkInCount: c.checkInCount || 0,
    createdDate: formatDate(c._createdDate)
  }));

  // Set up repeater item handlers
  $w('#activeCasesRepeater').onItemReady(($item, itemData) => {
    $item('#viewCaseBtn').onClick(() => viewCase(itemData._id));
    $item('#flagCaseBtn').onClick(() => handleFlagCase(itemData._id));
  });
}

/**
 * Load missing paperwork cases
 */
async function loadMissingPaperwork() {
  const result = await getMissingPaperworkCases(currentStaffEmail);

  if (!result.success) {
    showError('Failed to load missing paperwork');
    return;
  }

  $w('#paperworkRepeater').data = result.cases.map(c => ({
    _id: c._id,
    caseNumber: c.caseNumber || c._id.substring(0, 8),
    defendantName: c.defendantName || 'Unknown',
    defendantEmail: c.defendantEmail || 'N/A',
    paperworkStatus: c.paperworkStatus || 'not-started',
    daysSinceSent: c.daysSinceSent ? `${c.daysSinceSent} days` : 'Not sent',
    urgency: c.urgency || 'low',
    urgencyColor: c.urgency === 'high' ? '#DC2626' : c.urgency === 'medium' ? '#F59E0B' : '#10B981'
  }));

  $w('#paperworkRepeater').onItemReady(($item, itemData) => {
    $item('#resendBtn').onClick(() => handleResendPaperwork(itemData._id));
    $item('#viewCaseBtn').onClick(() => viewCase(itemData._id));
  });
}

/**
 * Load payment issues
 */
async function loadPaymentIssues() {
  const result = await getPaymentIssues(currentStaffEmail);

  if (!result.success) {
    showError('Failed to load payment issues');
    return;
  }

  $w('#paymentsRepeater').data = result.cases.map(c => ({
    _id: c._id,
    caseNumber: c.caseNumber || c._id.substring(0, 8),
    defendantName: c.defendantName || 'Unknown',
    defendantEmail: c.defendantEmail || 'N/A',
    paymentAmount: `$${(c.paymentAmount || 0).toFixed(2)}`,
    paymentStatus: c.paymentStatus || 'unknown',
    paymentDate: formatDate(c.paymentCreatedAt),
    statusColor: c.paymentStatus === 'failed' ? '#DC2626' : '#F59E0B'
  }));

  $w('#paymentsRepeater').onItemReady(($item, itemData) => {
    $item('#contactBtn').onClick(() => contactMember(itemData.defendantEmail));
    $item('#viewCaseBtn').onClick(() => viewCase(itemData._id));
  });
}

/**
 * Load recent check-ins
 */
async function loadRecentCheckIns() {
  const result = await getRecentCheckIns(currentStaffEmail, 7);

  if (!result.success) {
    showError('Failed to load check-ins');
    return;
  }

  $w('#checkInsRepeater').data = result.checkIns.map(c => ({
    _id: c._id,
    caseNumber: c.caseNumber || 'N/A',
    defendantName: c.defendantName || 'Unknown',
    checkInDate: formatDateTime(c.checkInDate),
    checkInMethod: c.method || 'unknown',
    location: c.location || 'N/A'
  }));
}

/**
 * Load pending documents
 */
async function loadPendingDocuments() {
  const result = await getPendingDocumentReviews(currentStaffEmail);

  if (!result.success) {
    showError('Failed to load pending documents');
    return;
  }

  $w('#documentsRepeater').data = result.documents.map(d => ({
    _id: d._id,
    memberEmail: d.memberEmail || 'Unknown',
    documentType: d.documentType || 'unknown',
    fileName: d.fileName || 'N/A',
    uploadedDate: formatDateTime(d.uploadedAt),
    fileUrl: d.fileUrl
  }));

  $w('#documentsRepeater').onItemReady(($item, itemData) => {
    $item('#viewDocBtn').onClick(() => viewDocument(itemData.fileUrl));
    $item('#approveBtn').onClick(() => handleApproveDocument(itemData._id));
    $item('#rejectBtn').onClick(() => handleRejectDocument(itemData._id));
  });
}

/**
 * Handle resend paperwork
 */
async function handleResendPaperwork(caseId) {
  try {
    const result = await resendPaperwork(currentStaffEmail, caseId);

    if (result.success) {
      showSuccess('Paperwork invitation resent successfully');
      await refreshCurrentView();
    } else {
      showError(result.error || 'Failed to resend paperwork');
    }
  } catch (error) {
    console.error('Error resending paperwork:', error);
    showError('Failed to resend paperwork');
  }
}

/**
 * Handle flag case
 */
async function handleFlagCase(caseId) {
  const reason = await wixWindowFrontend.openLightbox('FlagCaseDialog', { caseId });

  if (reason) {
    try {
      const result = await flagCase(currentStaffEmail, caseId, reason);

      if (result.success) {
        showSuccess('Case flagged successfully');
        await refreshCurrentView();
      } else {
        showError(result.error || 'Failed to flag case');
      }
    } catch (error) {
      console.error('Error flagging case:', error);
      showError('Failed to flag case');
    }
  }
}

/**
 * View case details
 */
function viewCase(caseId) {
  wixLocation.to(`/portal-staff/case-details?caseId=${caseId}`);
}

/**
 * View document
 */
function viewDocument(fileUrl) {
  wixWindowFrontend.openLightbox('DocumentViewer', { fileUrl });
}

/**
 * Contact member
 */
function contactMember(email) {
  wixLocation.to(`mailto:${email}`);
}

/**
 * Refresh current view
 */
async function refreshCurrentView() {
  await switchView(currentView);
}

/**
 * Format date
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format date and time
 */
function formatDateTime(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Show loading indicator
 */
function showLoading(show) {
  if (show) {
    $w('#loadingSpinner').show();
  } else {
    $w('#loadingSpinner').hide();
  }
}

/**
 * Show error message
 */
function showError(message) {
  $w('#errorBox').show();
  $w('#errorText').text = message;

  setTimeout(() => {
    $w('#errorBox').hide();
  }, 5000);
}

/**
 * Show success message
 */
function showSuccess(message) {
  $w('#successBox').show();
  $w('#successText').text = message;

  setTimeout(() => {
    $w('#successBox').hide();
  }, 3000);
}
