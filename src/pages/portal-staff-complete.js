// Page: portal-staff.qs9dx.js (COMPLETE)
// Function: Staff Dashboard - Monitor Paperwork Workflow, Trigger Signing Methods

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { getUserProfile, isStaff } from 'backend/portal-auth';
import { initiateSigningWorkflow, getSigningStatus } from 'backend/signing-methods';

let activeCases = [];
let selectedCase = null;

$w.onReady(async function () {
    $w('#loadingBox').expand();
    $w('#mainContent').collapse();

    try {
        // 1. Verify Staff Access
        const member = await currentMember.getMember();
        if (!member) {
            wixLocation.to('/portal');
            return;
        }

        const staffAccess = await isStaff();
        if (!staffAccess) {
            wixLocation.to('/portal');
            return;
        }

        const profile = await getUserProfile(member._id);
        const name = member.contactDetails?.firstName || "Staff";
        $w('#welcomeText').text = `Staff Dashboard - ${name}`;

        // 2. Load Active Cases
        await loadActiveCases();

        // 3. Load Statistics
        await loadStatistics();

        $w('#loadingBox').collapse();
        $w('#mainContent').expand();

    } catch (error) {
        console.error("Staff Portal Error:", error);
        $w('#loadingBox').text = "Error loading dashboard. Please contact support.";
    }

    // 4. Setup Event Handlers
    setupEventHandlers();
});

/**
 * Load all active cases
 */
async function loadActiveCases() {
    try {
        const results = await wixData.query('Cases')
            .ne('status', 'Closed')
            .ne('status', 'Completed')
            .descending('_createdDate')
            .limit(50)
            .find({ suppressAuth: true });

        activeCases = results.items;
        displayCasesList(activeCases);

        // Update count
        $w('#activeCasesCount').text = activeCases.length.toString();

    } catch (error) {
        console.error("Error loading active cases:", error);
        $w('#casesList').text = "Error loading cases";
    }
}

/**
 * Display cases in repeater
 */
function displayCasesList(cases) {
    if (cases.length === 0) {
        $w('#casesList').collapse();
        $w('#noCasesMessage').expand();
        return;
    }

    $w('#noCasesMessage').collapse();
    $w('#casesList').expand();

    // Configure repeater
    $w('#casesRepeater').data = cases.map(c => ({
        _id: c._id,
        caseNumber: c.caseNumber || 'N/A',
        defendantName: c.defendantName || 'Unknown',
        bondAmount: formatMoney(c.bondAmount || 0),
        status: c.status || 'Pending',
        createdDate: new Date(c._createdDate).toLocaleDateString(),
        paperworkStatus: c.paperworkStatus || 'Not Started',
        signingMethod: c.signingMethod || '-'
    }));

    $w('#casesRepeater').onItemReady(($item, itemData) => {
        $item('#caseNumberText').text = itemData.caseNumber;
        $item('#defendantNameText').text = itemData.defendantName;
        $item('#bondAmountText').text = `$${itemData.bondAmount}`;
        $item('#caseStatusText').text = itemData.status;
        $item('#createdDateText').text = itemData.createdDate;
        $item('#paperworkStatusText').text = itemData.paperworkStatus;
        $item('#signingMethodText').text = itemData.signingMethod;

        // Color code paperwork status
        const statusColors = {
            'Not Started': '#64748B',
            'Sent': '#F59E0B',
            'Partially Signed': '#3B82F6',
            'Completed': '#10B981',
            'Failed': '#EF4444'
        };
        $item('#paperworkStatusText').style.color = statusColors[itemData.paperworkStatus] || '#64748B';

        // View Details Button
        $item('#viewDetailsBtn').onClick(() => {
            viewCaseDetails(itemData._id);
        });

        // Send Paperwork Button
        $item('#sendPaperworkBtn').onClick(() => {
            openSendPaperworkModal(itemData._id);
        });
    });
}

/**
 * Load dashboard statistics
 */
async function loadStatistics() {
    try {
        // Pending Signatures
        const pendingResults = await wixData.query('SigningSessions')
            .eq('status', 'pending')
            .count({ suppressAuth: true });
        $w('#pendingSignaturesCount').text = pendingResults.toString();

        // Completed Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedResults = await wixData.query('SigningSessions')
            .eq('status', 'completed')
            .ge('completedAt', today)
            .count({ suppressAuth: true });
        $w('#completedTodayCount').text = completedResults.toString();

        // Failed/Declined
        const failedResults = await wixData.query('SigningSessions')
            .hasSome('status', ['declined', 'expired', 'failed'])
            .count({ suppressAuth: true });
        $w('#failedCount').text = failedResults.toString();

    } catch (error) {
        console.error("Error loading statistics:", error);
    }
}

/**
 * View case details
 */
async function viewCaseDetails(caseId) {
    try {
        const results = await wixData.query('Cases')
            .eq('_id', caseId)
            .limit(1)
            .find({ suppressAuth: true });

        if (results.items.length > 0) {
            selectedCase = results.items[0];
            displayCaseDetails(selectedCase);
            $w('#caseDetailsBox').expand();
            $w('#caseDetailsBox').scrollTo();
        }
    } catch (error) {
        console.error("Error loading case details:", error);
    }
}

/**
 * Display case details
 */
function displayCaseDetails(caseData) {
    // Case Header
    $w('#detailCaseNumber').text = `Case: ${caseData.caseNumber}`;
    $w('#detailDefendantName').text = caseData.defendantName;

    // Case Info
    $w('#detailBondAmount').text = `$${formatMoney(caseData.bondAmount)}`;
    $w('#detailPremium').text = `$${formatMoney(caseData.premiumAmount || 0)}`;
    $w('#detailBalance').text = `$${formatMoney((caseData.premiumAmount || 0) - (caseData.downPayment || 0))}`;
    $w('#detailChargeCount').text = `${caseData.chargeCount || 0} charge(s)`;

    // Court Info
    if (caseData.courtDate) {
        const courtDate = new Date(caseData.courtDate);
        $w('#detailCourtDate').text = courtDate.toLocaleDateString();
    }
    if (caseData.courtTime) {
        $w('#detailCourtTime').text = caseData.courtTime;
    }

    // Paperwork Status
    displayPaperworkStatus(caseData);

    // Load Indemnitors
    loadIndemnitors(caseData._id);
}

/**
 * Display paperwork status
 */
async function displayPaperworkStatus(caseData) {
    const signingStatus = await getSigningStatus(caseData._id);

    if (signingStatus.success) {
        const { status, method, session } = signingStatus;

        $w('#paperworkStatusText').text = `Status: ${status.toUpperCase()}`;
        $w('#paperworkMethodText').text = `Method: ${method.toUpperCase()}`;

        // Show resend button if pending
        if (status === 'pending') {
            $w('#resendPaperworkBtn').expand();
        } else {
            $w('#resendPaperworkBtn').collapse();
        }

        // Show signers status
        if (session.signers) {
            displaySignersStatus(JSON.parse(session.signers));
        }
    } else {
        $w('#paperworkStatusText').text = "Status: NOT SENT";
        $w('#paperworkMethodText').text = "Method: -";
    }
}

/**
 * Display signers status
 */
function displaySignersStatus(signers) {
    const signersHtml = signers.map(s => {
        const icon = s.status === 'signed' ? '✓' : '○';
        const color = s.status === 'signed' ? '#10B981' : '#F59E0B';
        return `<div style="color: ${color};">${icon} ${s.role}: ${s.email}</div>`;
    }).join('');

    $w('#signersStatusBox').html = signersHtml;
    $w('#signersStatusBox').expand();
}

/**
 * Load indemnitors for case
 */
async function loadIndemnitors(caseId) {
    try {
        const results = await wixData.query('Indemnitors')
            .eq('caseId', caseId)
            .find({ suppressAuth: true });

        if (results.items.length > 0) {
            const indemnitorsHtml = results.items.map((ind, idx) => 
                `<div><strong>Indemnitor ${idx + 1}:</strong> ${ind.fullName} (${ind.email})</div>`
            ).join('');
            $w('#indemnitorsListBox').html = indemnitorsHtml;
            $w('#indemnitorsListBox').expand();
        }
    } catch (error) {
        console.error("Error loading indemnitors:", error);
    }
}

/**
 * Open send paperwork modal
 */
function openSendPaperworkModal(caseId) {
    selectedCase = activeCases.find(c => c._id === caseId);
    
    if (!selectedCase) return;

    // Show modal
    $w('#sendPaperworkModal').expand();
    $w('#modalCaseNumber').text = `Case: ${selectedCase.caseNumber}`;
    $w('#modalDefendantName').text = selectedCase.defendantName;

    // Reset form
    $w('#signingMethodDropdown').value = 'email';
    $w('#defendantEmailInput').value = selectedCase.defendantEmail || '';
    $w('#defendantPhoneInput').value = selectedCase.defendantPhone || '';
}

/**
 * Setup event handlers
 */
function setupEventHandlers() {
    // Filter Buttons
    $w('#filterAllBtn').onClick(() => filterCases('all'));
    $w('#filterPendingBtn').onClick(() => filterCases('pending'));
    $w('#filterActiveBtn').onClick(() => filterCases('active'));
    $w('#filterCompletedBtn').onClick(() => filterCases('completed'));

    // Search
    $w('#searchInput').onInput(() => searchCases());

    // Refresh Button
    $w('#refreshBtn').onClick(async () => {
        $w('#refreshBtn').disable();
        await loadActiveCases();
        await loadStatistics();
        $w('#refreshBtn').enable();
    });

    // Send Paperwork Modal
    $w('#sendPaperworkBtn').onClick(handleSendPaperwork);
    $w('#cancelSendBtn').onClick(() => {
        $w('#sendPaperworkModal').collapse();
    });

    // Signing Method Dropdown
    $w('#signingMethodDropdown').onChange(() => {
        const method = $w('#signingMethodDropdown').value;
        toggleSigningInputs(method);
    });

    // Resend Paperwork
    $w('#resendPaperworkBtn').onClick(() => {
        if (selectedCase) {
            openSendPaperworkModal(selectedCase._id);
        }
    });

    // Close Case Details
    $w('#closeCaseDetailsBtn').onClick(() => {
        $w('#caseDetailsBox').collapse();
    });
}

/**
 * Filter cases by status
 */
function filterCases(filter) {
    let filtered = activeCases;

    switch (filter) {
        case 'pending':
            filtered = activeCases.filter(c => c.paperworkStatus === 'Not Started' || c.paperworkStatus === 'Sent');
            break;
        case 'active':
            filtered = activeCases.filter(c => c.status === 'Active');
            break;
        case 'completed':
            filtered = activeCases.filter(c => c.paperworkStatus === 'Completed');
            break;
    }

    displayCasesList(filtered);
}

/**
 * Search cases
 */
function searchCases() {
    const query = $w('#searchInput').value.toLowerCase();
    
    if (!query) {
        displayCasesList(activeCases);
        return;
    }

    const filtered = activeCases.filter(c => 
        (c.caseNumber || '').toLowerCase().includes(query) ||
        (c.defendantName || '').toLowerCase().includes(query) ||
        (c.bookingNumber || '').toLowerCase().includes(query)
    );

    displayCasesList(filtered);
}

/**
 * Toggle signing inputs based on method
 */
function toggleSigningInputs(method) {
    switch (method) {
        case 'email':
            $w('#emailInputsBox').expand();
            $w('#phoneInputsBox').collapse();
            break;
        case 'sms':
            $w('#emailInputsBox').collapse();
            $w('#phoneInputsBox').expand();
            break;
        case 'kiosk':
        case 'print':
            $w('#emailInputsBox').collapse();
            $w('#phoneInputsBox').collapse();
            break;
    }
}

/**
 * Handle send paperwork
 */
async function handleSendPaperwork() {
    if (!selectedCase) return;

    $w('#sendPaperworkBtn').disable();
    $w('#sendPaperworkBtn').label = "Sending...";

    try {
        const method = $w('#signingMethodDropdown').value;
        const defendantEmail = $w('#defendantEmailInput').value;
        const defendantPhone = $w('#defendantPhoneInput').value;

        // Get indemnitors
        const indemnitorResults = await wixData.query('Indemnitors')
            .eq('caseId', selectedCase._id)
            .find({ suppressAuth: true });

        const indemnitorInfo = indemnitorResults.items.map(ind => ({
            email: ind.email,
            phone: ind.phone
        }));

        // Call backend to initiate signing
        const result = await initiateSigningWorkflow({
            caseId: selectedCase._id,
            method,
            defendantInfo: {
                email: defendantEmail,
                phone: defendantPhone
            },
            indemnitorInfo,
            documentIds: [] // Will use default document set
        });

        if (result.success) {
            $w('#sendPaperworkBtn').label = "Sent ✓";
            $w('#sendPaperworkModal').collapse();
            
            // Refresh cases
            await loadActiveCases();
            
            // Show success message
            showSuccessMessage(`Paperwork sent via ${method.toUpperCase()}`);
        } else {
            throw new Error(result.error || 'Failed to send paperwork');
        }

    } catch (error) {
        console.error("Error sending paperwork:", error);
        $w('#sendPaperworkBtn').label = "Try Again";
        showErrorMessage(error.message);
    } finally {
        $w('#sendPaperworkBtn').enable();
    }
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    $w('#successMessageText').text = message;
    $w('#successMessageBox').expand();
    setTimeout(() => {
        $w('#successMessageBox').collapse();
    }, 3000);
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    $w('#errorMessageText').text = message;
    $w('#errorMessageBox').expand();
    setTimeout(() => {
        $w('#errorMessageBox').collapse();
    }, 5000);
}

/**
 * Format money
 */
function formatMoney(amount) {
    return parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
