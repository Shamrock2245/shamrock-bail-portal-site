// Page: portal-indemnitor.k53on.js (COMPLETE)
// Function: Indemnitor Dashboard - Liability View, Defendant Status, Payment Tracking

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import { getUserProfile, getCaseIds } from 'backend/portal-auth';
import { getPendingDocuments, getSigningStatus } from 'backend/signing-methods';

let currentCase = null;
let defendantInfo = null;
let paymentPlan = null;
let pendingDocuments = [];

$w.onReady(async function () {
    $w('#loadingBox').expand();
    $w('#mainContent').collapse();

    try {
        // 1. Get Indemnitor Info
        const member = await currentMember.getMember();
        if (!member) {
            wixLocation.to('/portal');
            return;
        }

        const profile = await getUserProfile(member._id);
        const name = member.contactDetails?.firstName || "Indemnitor";
        $w('#welcomeText').text = `Welcome, ${name}`;

        // 2. Load Associated Case
        const caseIds = await getCaseIds();
        if (caseIds && caseIds.length > 0) {
            await loadCaseData(caseIds[0]);
            await loadDefendantInfo(caseIds[0]);
            await loadPaymentPlan(caseIds[0]);
        } else {
            showNoCaseMessage();
        }

        // 3. Load Pending Paperwork
        await loadPendingDocuments(member._id);

        $w('#loadingBox').collapse();
        $w('#mainContent').expand();

    } catch (error) {
        console.error("Dashboard Error:", error);
        $w('#loadingBox').text = "Error loading dashboard. Please contact us.";
    }

    // 4. Setup Event Handlers
    setupEventHandlers();
});

/**
 * Load case data
 */
async function loadCaseData(caseId) {
    try {
        const results = await wixData.query('Cases')
            .eq('_id', caseId)
            .limit(1)
            .find({ suppressAuth: true });

        if (results.items.length > 0) {
            currentCase = results.items[0];
            displayLiabilityInfo(currentCase);
        } else {
            showNoCaseMessage();
        }
    } catch (error) {
        console.error("Error loading case:", error);
        showNoCaseMessage();
    }
}

/**
 * Load defendant information
 */
async function loadDefendantInfo(caseId) {
    try {
        // Query defendant from case or separate Defendants collection
        if (currentCase && currentCase.defendantId) {
            const results = await wixData.query('Defendants')
                .eq('_id', currentCase.defendantId)
                .limit(1)
                .find({ suppressAuth: true });

            if (results.items.length > 0) {
                defendantInfo = results.items[0];
                displayDefendantStatus(defendantInfo);
            }
        }
    } catch (error) {
        console.error("Error loading defendant info:", error);
    }
}

/**
 * Load payment plan if balance > 0
 */
async function loadPaymentPlan(caseId) {
    try {
        const results = await wixData.query('PaymentPlans')
            .eq('caseId', caseId)
            .limit(1)
            .find({ suppressAuth: true });

        if (results.items.length > 0) {
            paymentPlan = results.items[0];
            displayPaymentPlan(paymentPlan);
        } else {
            // No payment plan = paid in full
            $w('#paymentPlanSection').collapse();
        }
    } catch (error) {
        console.error("Error loading payment plan:", error);
        $w('#paymentPlanSection').collapse();
    }
}

/**
 * Display liability information
 */
function displayLiabilityInfo(caseData) {
    // Total Bond Amount (Liability)
    if (caseData.bondAmount) {
        $w('#liabilityText').text = `$${formatMoney(caseData.bondAmount)}`;
        $w('#liabilityLabel').text = "Total Liability (Bond Amount)";
    }

    // Premium Information
    if (caseData.premiumAmount) {
        $w('#premiumText').text = `Premium: $${formatMoney(caseData.premiumAmount)}`;
        $w('#premiumText').expand();
    }

    // Down Payment
    if (caseData.downPayment) {
        $w('#downPaymentText').text = `Down Payment: $${formatMoney(caseData.downPayment)}`;
        $w('#downPaymentText').expand();
    }

    // Balance Due
    const balance = (caseData.premiumAmount || 0) - (caseData.downPayment || 0);
    if (balance > 0) {
        $w('#balanceText').text = `Balance Due: $${formatMoney(balance)}`;
        $w('#balanceText').style.color = '#F59E0B';
        $w('#balanceText').expand();
    } else {
        $w('#balanceText').text = 'Paid in Full ✓';
        $w('#balanceText').style.color = '#10B981';
        $w('#balanceText').expand();
    }

    // Number of Charges
    if (caseData.chargeCount) {
        $w('#chargeCountText').text = `${caseData.chargeCount} Charge${caseData.chargeCount > 1 ? 's' : ''}`;
        $w('#chargeCountText').expand();
    }
}

/**
 * Display defendant status
 */
function displayDefendantStatus(defendant) {
    // Defendant Name
    if (defendant.fullName) {
        $w('#defendantNameText').text = defendant.fullName;
    }

    // Status
    const status = defendant.status || 'Active';
    let statusColor = '';
    let statusIcon = '';

    if (status === 'Good Standing' || status === 'Active') {
        statusColor = '#10B981';
        statusIcon = '✓';
        $w('#defendantStatusText').text = `${statusIcon} ${status}`;
    } else if (status === 'Missed Check-In') {
        statusColor = '#F59E0B';
        statusIcon = '⚠';
        $w('#defendantStatusText').text = `${statusIcon} ${status}`;
    } else if (status === 'Warrant' || status === 'Non-Compliant') {
        statusColor = '#EF4444';
        statusIcon = '✕';
        $w('#defendantStatusText').text = `${statusIcon} ${status}`;
    } else {
        statusColor = '#64748B';
        $w('#defendantStatusText').text = status;
    }

    $w('#defendantStatusText').style.color = statusColor;
    $w('#defendantStatusBox').style.borderColor = statusColor;

    // Last Check-In
    if (defendant.lastCheckIn) {
        const lastCheckIn = new Date(defendant.lastCheckIn);
        $w('#lastCheckInText').text = `Last Check-In: ${lastCheckIn.toLocaleDateString()}`;
        $w('#lastCheckInText').expand();
    }

    // Next Court Date
    if (currentCase && currentCase.courtDate) {
        const courtDate = new Date(currentCase.courtDate);
        const courtTime = currentCase.courtTime || '';
        $w('#nextCourtDateText').text = `Next Court Date: ${courtDate.toLocaleDateString()} ${courtTime}`;
        $w('#nextCourtDateText').expand();
    }
}

/**
 * Display payment plan details
 */
function displayPaymentPlan(plan) {
    $w('#paymentPlanSection').expand();

    // Total Balance
    $w('#planBalanceText').text = `$${formatMoney(plan.balance)}`;

    // Monthly Payment
    if (plan.monthlyPayment) {
        $w('#monthlyPaymentText').text = `$${formatMoney(plan.monthlyPayment)}/month`;
        $w('#monthlyPaymentText').expand();
    }

    // Next Payment Due
    if (plan.nextPaymentDate) {
        const nextDate = new Date(plan.nextPaymentDate);
        $w('#nextPaymentDateText').text = `Due: ${nextDate.toLocaleDateString()}`;
        $w('#nextPaymentDateText').expand();
    }

    // Payments Made / Remaining
    if (plan.paymentsMade !== undefined && plan.totalPayments) {
        $w('#paymentsProgressText').text = `${plan.paymentsMade} of ${plan.totalPayments} payments made`;
        $w('#paymentsProgressText').expand();

        // Progress bar
        const progress = (plan.paymentsMade / plan.totalPayments) * 100;
        if ($w('#paymentProgressBar')) {
            $w('#paymentProgressBar').value = progress;
        }
    }

    // Show "Make Payment" button
    $w('#makePaymentBtn').expand();
}

/**
 * Load pending documents
 */
async function loadPendingDocuments(memberId) {
    try {
        const result = await getPendingDocuments(memberId);

        if (result.success && result.documents.length > 0) {
            pendingDocuments = result.documents;
            $w('#paperworkSection').expand();
            $w('#paperworkStatusText').text = `You have ${pendingDocuments.length} document(s) to sign`;
            $w('#signPaperworkBtn').expand();
        } else {
            $w('#paperworkSection').collapse();
        }
    } catch (error) {
        console.error("Error loading pending documents:", error);
        $w('#paperworkSection').collapse();
    }
}

/**
 * Show message when no case is found
 */
function showNoCaseMessage() {
    $w('#liabilityText').text = "$0.00";
    $w('#defendantStatusText').text = "No active case found";
    $w('#defendantStatusBox').style.backgroundColor = "#F1F3F9";
}

/**
 * Setup event handlers
 */
function setupEventHandlers() {
    // Sign Paperwork Button
    $w('#signPaperworkBtn').onClick(handleSignPaperwork);

    // Make Payment Button
    $w('#makePaymentBtn').onClick(handleMakePayment);

    // Contact Button
    $w('#contactBtn').onClick(() => {
        wixLocation.to('/contact');
    });

    // View Payment History Button
    if ($w('#viewPaymentHistoryBtn')) {
        $w('#viewPaymentHistoryBtn').onClick(() => {
            wixLocation.to('/portal/payment-history');
        });
    }
}

/**
 * Handle paperwork signing
 */
async function handleSignPaperwork() {
    if (pendingDocuments.length === 0) {
        $w('#paperworkStatusText').text = "No pending documents found";
        return;
    }

    const doc = pendingDocuments[0];
    const signingLink = doc.signingLink;

    if (signingLink) {
        // Redirect to SignNow embedded signing
        wixLocation.to(`/sign?link=${encodeURIComponent(signingLink)}`);
    } else {
        $w('#paperworkStatusText').text = "Signing link not available. Please check your email.";
    }
}

/**
 * Handle payment
 */
async function handleMakePayment() {
    if (!paymentPlan) {
        $w('#paymentStatusText').text = "No payment plan found";
        return;
    }

    // Redirect to payment page
    wixLocation.to(`/portal/payment?caseId=${currentCase._id}`);
}

/**
 * Format money with commas
 */
function formatMoney(amount) {
    return parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
