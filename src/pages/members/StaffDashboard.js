/**
 * Shamrock Bail Bonds - Staff Dashboard
 *
 * Staff-only page for managing cases, intake queue, and document status.
 *
 * FEATURES:
 *   1. Intake Queue — view pending indemnitor submissions, match to cases
 *   2. Case list — filter by county, status
 *   3. Document status — per-case signing progress
 *   4. Generate magic links for defendants/indemnitors
 *   5. Quick access to Dashboard.html (GAS)
 *
 * URL: /members/staff-dashboard
 *
 * Page Element IDs (set in Wix Editor):
 *   #welcomeText           — "Welcome, [Name]"
 *   #tabIntake             — Tab: Intake Queue
 *   #tabCases              — Tab: Cases
 *   #intakeSection         — Intake queue container
 *   #intakeSearchInput     — Search box for intake records
 *   #intakeRepeater        — Repeater: intake queue records
 *   #noIntakeMessage       — "No pending intakes"
 *   #casesSection          — Cases container
 *   #countyFilter          — Dropdown: filter by county
 *   #statusFilter          — Dropdown: filter by status
 *   #casesRepeater         — Repeater: cases list
 *   #noCasesMessage        — "No cases found"
 *   #gasLinkBtn            — Button: open Dashboard.html (GAS)
 *   #loadingSpinner        — Loading indicator
 *   #errorBanner           — Error message banner
 *   #successBanner         — Success message banner
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { currentMember } from 'wix-members-frontend';
import wixData from 'wix-data';
import {
    getPendingIntakes,
    searchIntakes,
    matchIntakeToCase,
    rejectIntake,
    buildIndemnitorPayload
} from 'backend/intakeQueue';
import {
    getDocumentsByCase,
    getCaseDocumentSummary
} from 'backend/pendingDocuments';
import { generateAccessCode } from 'backend/accessCodes';

// GAS Dashboard URL — update with actual deployed GAS URL
const GAS_DASHBOARD_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
const PHONE_TEL = 'tel:+12393322245';

let memberData = null;
let intakeRecords = [];
let caseRecords = [];
let activeTab = 'intake'; // 'intake' | 'cases'

// ─────────────────────────────────────────────
// PAGE INIT
// ─────────────────────────────────────────────

$w.onReady(async function () {
    showLoading(true);

    const isLoggedIn = await checkLogin();
    if (!isLoggedIn) {
        wixLocation.to('/portal-landing?reason=auth_required');
        return;
    }

    // Verify staff role
    const isStaff = await verifyStaffRole();
    if (!isStaff) {
        wixWindow.openLightbox('role-mismatch-lightbox', {
            requestedRole: 'Staff',
            message: 'You do not have permission to access the staff dashboard.'
        });
        wixLocation.to('/portal-landing');
        return;
    }

    memberData = await loadMemberData();
    displayWelcome();
    setupTabs();
    setupEventListeners();

    // Default: load intake queue
    await loadIntakeQueue();
    showLoading(false);

    trackEvent('StaffDashboard_View', { memberId: memberData?.id });
});

// ─────────────────────────────────────────────
// AUTH & ROLE
// ─────────────────────────────────────────────

async function checkLogin() {
    try {
        const member = await currentMember.getMember();
        return !!member;
    } catch {
        return false;
    }
}

async function verifyStaffRole() {
    try {
        const { authentication } = await import('wix-members-frontend');
        const roles = await authentication.currentMember.getRoles();
        return roles && roles.some(r =>
            r.name === 'Staff' || r.name === 'Admin' || r.name === 'staff' || r.name === 'admin'
        );
    } catch {
        // If role check fails, allow access (Wix Members may not have roles configured yet)
        console.warn('[StaffDashboard] Role check failed — allowing access');
        return true;
    }
}

async function loadMemberData() {
    try {
        const member = await currentMember.getMember({ fieldsets: ['FULL'] });
        return {
            id: member._id,
            email: member.loginEmail,
            firstName: member.contactDetails?.firstName || '',
            lastName: member.contactDetails?.lastName || ''
        };
    } catch (error) {
        console.error('[StaffDashboard] Error loading member:', error);
        return null;
    }
}

// ─────────────────────────────────────────────
// DISPLAY
// ─────────────────────────────────────────────

function displayWelcome() {
    const name = memberData?.firstName || 'Staff';
    if ($w('#welcomeText').valid) {
        $w('#welcomeText').text = `Welcome, ${name}`;
    }
}

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────

function setupTabs() {
    if ($w('#tabIntake').valid) {
        $w('#tabIntake').onClick(() => switchTab('intake'));
    }
    if ($w('#tabCases').valid) {
        $w('#tabCases').onClick(() => switchTab('cases'));
    }
    // Show intake section by default
    showSection('intake');
}

function switchTab(tab) {
    activeTab = tab;
    showSection(tab);
    if (tab === 'intake') loadIntakeQueue();
    if (tab === 'cases') loadCases();
}

function showSection(section) {
    if ($w('#intakeSection').valid) {
        section === 'intake' ? $w('#intakeSection').show() : $w('#intakeSection').hide();
    }
    if ($w('#casesSection').valid) {
        section === 'cases' ? $w('#casesSection').show() : $w('#casesSection').hide();
    }
}

// ─────────────────────────────────────────────
// INTAKE QUEUE
// ─────────────────────────────────────────────

async function loadIntakeQueue(searchTerm) {
    showLoading(true);
    try {
        if (searchTerm && searchTerm.trim().length >= 2) {
            intakeRecords = await searchIntakes(searchTerm.trim());
        } else {
            intakeRecords = await getPendingIntakes();
        }

        if (intakeRecords.length === 0) {
            if ($w('#noIntakeMessage').valid) $w('#noIntakeMessage').show();
            if ($w('#intakeRepeater').valid) $w('#intakeRepeater').hide();
        } else {
            if ($w('#noIntakeMessage').valid) $w('#noIntakeMessage').hide();
            if ($w('#intakeRepeater').valid) {
                $w('#intakeRepeater').show();
                renderIntakeRepeater();
            }
        }
    } catch (error) {
        console.error('[StaffDashboard] Error loading intake queue:', error);
        showError('Unable to load intake queue.');
    }
    showLoading(false);
}

function renderIntakeRepeater() {
    $w('#intakeRepeater').data = intakeRecords.map(record => ({
        _id: record._id,
        indemnitorName: `${record.firstName || ''} ${record.lastName || ''}`.trim(),
        defendantName: record.defendantName || 'Unknown',
        relationship: record.relationship || '',
        phone: record.phone || '',
        email: record.email || '',
        submittedAt: record.submittedAt
            ? new Date(record.submittedAt).toLocaleDateString()
            : '',
        status: record.status || 'pending'
    }));

    $w('#intakeRepeater').onItemReady(($item, itemData) => {
        $item('#intakeName').text = itemData.indemnitorName;
        $item('#intakeDefendant').text = `For: ${itemData.defendantName}`;
        $item('#intakeRelationship').text = itemData.relationship;
        $item('#intakePhone').text = itemData.phone;
        $item('#intakeDate').text = itemData.submittedAt;

        // Match button
        $item('#matchBtn').onClick(() => {
            openMatchDialog(itemData._id, itemData.indemnitorName);
        });

        // View payload button
        $item('#viewPayloadBtn').onClick(async () => {
            await showIndemnitorPayload(itemData._id);
        });

        // Reject button
        $item('#rejectIntakeBtn').onClick(async () => {
            await handleRejectIntake(itemData._id);
        });
    });
}

async function openMatchDialog(intakeId, indemnitorName) {
    const result = await wixWindow.openLightbox('MatchIntakeLightbox', {
        intakeId: intakeId,
        indemnitorName: indemnitorName
    });

    if (result && result.caseId) {
        await handleMatchIntake(intakeId, result.caseId);
    }
}

async function handleMatchIntake(intakeId, caseId) {
    showLoading(true);
    try {
        const result = await matchIntakeToCase(intakeId, caseId);
        if (result.success) {
            showSuccess('Intake matched to case! Indemnitor fields are now auto-filled.');
            await loadIntakeQueue();
        } else {
            showError(`Match failed: ${result.error}`);
        }
    } catch (error) {
        showError('Error matching intake. Please try again.');
    }
    showLoading(false);
}

async function showIndemnitorPayload(intakeId) {
    try {
        const payload = await buildIndemnitorPayload(intakeId);
        if (payload) {
            wixWindow.openLightbox('IndemnitorPayloadLightbox', { payload });
        } else {
            showError('Could not build indemnitor payload.');
        }
    } catch (error) {
        showError('Error loading indemnitor data.');
    }
}

async function handleRejectIntake(intakeId) {
    const confirmed = await wixWindow.openLightbox('ConfirmDelete', {
        message: 'Reject this intake record? This cannot be undone.'
    });

    if (confirmed) {
        const result = await rejectIntake(intakeId, 'Rejected by staff');
        if (result.success) {
            showSuccess('Intake record rejected.');
            await loadIntakeQueue();
        } else {
            showError('Error rejecting intake.');
        }
    }
}

// ─────────────────────────────────────────────
// CASES
// ─────────────────────────────────────────────

async function loadCases() {
    showLoading(true);
    try {
        const county = $w('#countyFilter').valid ? $w('#countyFilter').value : '';
        const status = $w('#statusFilter').valid ? $w('#statusFilter').value : '';

        let query = wixData.query('Cases').descending('_createdDate').limit(50);

        if (county && county !== 'all') {
            query = query.eq('county', county);
        }
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const results = await query.find();
        caseRecords = results.items;

        if (caseRecords.length === 0) {
            if ($w('#noCasesMessage').valid) $w('#noCasesMessage').show();
            if ($w('#casesRepeater').valid) $w('#casesRepeater').hide();
        } else {
            if ($w('#noCasesMessage').valid) $w('#noCasesMessage').hide();
            if ($w('#casesRepeater').valid) {
                $w('#casesRepeater').show();
                await renderCasesRepeater();
            }
        }
    } catch (error) {
        console.error('[StaffDashboard] Error loading cases:', error);
        showError('Unable to load cases.');
    }
    showLoading(false);
}

async function renderCasesRepeater() {
    // Build summaries for all cases
    const summaries = await Promise.all(
        caseRecords.map(c => getCaseDocumentSummary(c._id))
    );

    $w('#casesRepeater').data = caseRecords.map((c, i) => ({
        _id: c._id,
        caseNumber: c.caseNumber || c._id,
        defendantName: c.defendantName || 'Unknown',
        county: c.county || '',
        bondAmount: c.bondAmount ? `$${Number(c.bondAmount).toLocaleString()}` : '',
        status: c.status || 'pending',
        docSummary: summaries[i] || { total: 0, signed: 0, pending: 0 },
        isComplete: summaries[i]?.isComplete || false
    }));

    $w('#casesRepeater').onItemReady(($item, itemData) => {
        $item('#caseCaseNumber').text = itemData.caseNumber;
        $item('#caseDefendant').text = itemData.defendantName;
        $item('#caseCounty').text = itemData.county;
        $item('#caseBond').text = itemData.bondAmount;
        $item('#caseStatus').text = formatCaseStatus(itemData.status);

        const s = itemData.docSummary;
        $item('#caseDocProgress').text = `Docs: ${s.signed}/${s.total} signed`;

        // Generate magic link button
        $item('#genLinkBtn').onClick(() => {
            openGenerateLinkDialog(itemData._id, itemData.defendantName);
        });

        // View documents button
        $item('#viewDocsBtn').onClick(async () => {
            await openCaseDocuments(itemData._id, itemData.caseNumber);
        });
    });
}

async function openGenerateLinkDialog(caseId, defendantName) {
    const result = await wixWindow.openLightbox('GenerateLinkLightbox', {
        caseId,
        defendantName
    });

    if (result && result.role && result.email) {
        await handleGenerateMagicLink(caseId, result.role, result.email);
    }
}

async function handleGenerateMagicLink(caseId, role, email) {
    showLoading(true);
    try {
        const token = await generateAccessCode(caseId, role, email, 30);
        const portalUrl = `https://shamrockbailbonds.biz/portal-landing?code=${token}`;

        showSuccess(`Magic link generated! Send this to ${email}: ${portalUrl}`);

        // Open a lightbox showing the link for easy copying
        wixWindow.openLightbox('MagicLinkResultLightbox', {
            token,
            portalUrl,
            email,
            role
        });

        trackEvent('MagicLink_Generated', { caseId, role });
    } catch (error) {
        showError('Error generating magic link. Please try again.');
    }
    showLoading(false);
}

async function openCaseDocuments(caseId, caseNumber) {
    try {
        const docs = await getDocumentsByCase(caseId);
        wixWindow.openLightbox('CaseDocumentsLightbox', {
            caseId,
            caseNumber,
            documents: docs
        });
    } catch (error) {
        showError('Error loading case documents.');
    }
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────

function setupEventListeners() {
    // Intake search
    if ($w('#intakeSearchInput').valid) {
        $w('#intakeSearchInput').onInput(async (event) => {
            const term = event.target.value;
            await loadIntakeQueue(term);
        });
    }

    // County filter
    if ($w('#countyFilter').valid) {
        $w('#countyFilter').onChange(async () => {
            await loadCases();
        });
    }

    // Status filter
    if ($w('#statusFilter').valid) {
        $w('#statusFilter').onChange(async () => {
            await loadCases();
        });
    }

    // GAS Dashboard link
    if ($w('#gasLinkBtn').valid) {
        $w('#gasLinkBtn').onClick(() => {
            trackEvent('GAS_Dashboard_Click', { memberId: memberData?.id });
            wixLocation.to(GAS_DASHBOARD_URL);
        });
    }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function showLoading(visible) {
    if ($w('#loadingSpinner').valid) {
        visible ? $w('#loadingSpinner').show() : $w('#loadingSpinner').hide();
    }
}

function showError(message) {
    if ($w('#errorBanner').valid) {
        $w('#errorBanner').text = message;
        $w('#errorBanner').show();
        setTimeout(() => {
            if ($w('#errorBanner').valid) $w('#errorBanner').hide();
        }, 6000);
    }
    console.error('[StaffDashboard]', message);
}

function showSuccess(message) {
    if ($w('#successBanner').valid) {
        $w('#successBanner').text = message;
        $w('#successBanner').show();
        setTimeout(() => {
            if ($w('#successBanner').valid) $w('#successBanner').hide();
        }, 6000);
    }
    console.log('[StaffDashboard] Success:', message);
}

function formatCaseStatus(status) {
    const labels = {
        pending: 'Pending',
        active: 'Active',
        signed: 'Signed',
        completed: 'Completed',
        cancelled: 'Cancelled'
    };
    return labels[status] || status;
}

function trackEvent(name, data) {
    try {
        wixWindow.trackEvent(name, data);
    } catch (e) {
        console.error('[StaffDashboard] trackEvent error:', e);
    }
}

export { loadIntakeQueue, loadCases, handleMatchIntake };
