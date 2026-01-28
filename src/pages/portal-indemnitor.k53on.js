// portal-indemnitor.k53on.js
// Function: Indemnitor Dashboard with Multi-Case Support
// Last Updated: 2026-01-27
//
// AUTHENTICATION: Custom session-based (NO Wix Members)
// Uses browser storage (wix-storage-frontend) session tokens validated against PortalSessions collection
//
// MULTI-CASE SUPPORT: An indemnitor can sign for multiple defendants across different cases

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import {
    validateCustomSession,
    getIndemnitorDetails,
    getUserConsentStatus,
    getIndemnitorLinkedCases,
    getIndemnitorPendingPaperwork
} from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { submitIntake } from 'backend/signnow-integration';
import { initiateSigningWorkflow } from 'backend/signing-methods';
import { reverseGeocodeToCityStateZip, geocodeAddressToCityStateZip } from 'backend/googleMaps';
import { sendAdminNotification, NOTIFICATION_TYPES } from 'backend/notificationService';
import { getSessionToken, setSessionToken, clearSessionToken } from 'public/session-manager';
import wixSeo from 'wix-seo';
import { silentPingLocation } from 'public/location-tracker';
import { getAllDocumentsForMember } from 'backend/wixApi.jsw';

let currentSession = null; // Store validated session data
let linkedCases = []; // Store all cases where user is indemnitor
let selectedCaseId = null; // Currently selected case for paperwork

$w.onReady(async function () {
    LightboxController.init($w);

    try {
        if ($w('#welcomeText').type) {
            $w('#welcomeText').text = "Loading Dashboard...";
        }
    } catch (e) { }

    // Initialize Success Message State
    try {
        if ($w('#txtSubmissionSuccess').type) $w('#txtSubmissionSuccess').collapse();
    } catch (e) { }

    try {
        // Check for session token in URL (passed from magic link redirect)
        const query = wixLocation.query;
        if (query.st) {
            console.log("🔗 Session token in URL, storing...");
            setSessionToken(query.st);
        }

        // Check for case selection in URL
        if (query.caseId) {
            selectedCaseId = query.caseId;
            console.log("📋 Case ID in URL:", selectedCaseId);
        }

        // CUSTOM AUTH CHECK - Replace Wix Members
        const sessionToken = query.st || getSessionToken();
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

        // Check role authorization (indemnitor or coindemnitor)
        if (session.role !== 'indemnitor' && session.role !== 'coindemnitor') {
            console.warn(`⛔ Wrong role: ${session.role}. This is the indemnitor portal.`);
            wixLocation.to('/portal-landing');
            return;
        }

        console.log("✅ Indemnitor authenticated:", session.personId);
        currentSession = session;
        currentSession.token = sessionToken;

        // Setup Actions
        setupPaperworkButtons();
        setupLogoutButton();
        setupContactForm();
        setupCallButton();
        setupPayButton(); // [NEW] SwipeSimple Integration
        setupSubmitButton();
        setupCaseSelector();

        // INITIATE ROBUST TRACKING
        console.log("📍 Initiating background location tracker for indemnitor...");
        silentPingLocation();

        try {
            if ($w('#contactBtn').type) {
                $w('#contactBtn').onClick(() => wixLocation.to("/contact"));
            }
        } catch (e) {
            console.error('Error setting up contact button:', e);
        }

        // Load Dashboard Data (including all linked cases)
        await loadDashboardData();

    } catch (error) {
        console.error("Dashboard Error", error);
        try {
            if ($w('#welcomeText').type) {
                $w('#welcomeText').text = "Error loading dashboard";
            }
        } catch (e) { }
    }


    // --- GOOGLE MAPS AUTOFILL ---
    if (!anyHasValue('#inputIndemnitorCity', '#inputIndemnitorState', '#inputIndemnitorZip')) {
        try {
            // Prompts the user for permission if needed
            const geo = await wixWindow.getCurrentGeolocation();
            const lat = geo.coords.latitude;
            const lng = geo.coords.longitude;

            const { city, state, zip } = await reverseGeocodeToCityStateZip(lat, lng);

            // Set values ONLY if we got them
            if (city && !$w('#inputIndemnitorCity').value) {
                $w('#inputIndemnitorCity').value = city;
                $w('#inputIndemnitorCity').resetValidityIndication();
            }
            if (state && !$w('#inputIndemnitorState').value) {
                $w('#inputIndemnitorState').value = state;
                $w('#inputIndemnitorState').resetValidityIndication();
            }
            if (zip && !$w('#inputIndemnitorZip').value) {
                $w('#inputIndemnitorZip').value = zip;
                $w('#inputIndemnitorZip').resetValidityIndication();
            }

        } catch (e) {
            // Silent fail: user can still type manually
            console.log('Geo autofill skipped:', e?.message || e);
        }
    }

    // --- ADDRESS CHANGE AUTOFILL ---
    $w('#inputIndemnitorAddress').onChange(async () => {
        try {
            const address = ($w('#inputIndemnitorAddress').value || '').trim();
            if (!address) return;

            // Don't overwrite if user already filled ANY of these
            const alreadyFilled =
                $w('#inputIndemnitorCity').value ||
                $w('#inputIndemnitorState').value ||
                $w('#inputIndemnitorZip').value;

            if (alreadyFilled) return;

            const { city, state, zip } = await geocodeAddressToCityStateZip(address);

            fillIfEmpty('#inputIndemnitorCity', city);
            fillIfEmpty('#inputIndemnitorState', state);
            fillIfEmpty('#inputIndemnitorZip', zip);

        } catch (e) {
            console.log('Address-based autofill skipped:', e?.message || e);
        }
    });

    updatePageSEO();
});

function updatePageSEO() {
    const pageTitle = "Indemnitor Dashboard | Shamrock Bail Bonds";
    // No index for private dashboards
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "robots", "content": "noindex, nofollow" }
    ]);

    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": "Indemnitor Dashboard",
            "mainEntity": {
                "@type": "Person",
                "name": "Indemnitor"
            }
        }
    ]);
}

async function loadDashboardData() {
    if (!currentSession) {
        console.error('No session available');
        return;
    }

    try {
        // Get all linked cases for this indemnitor
        const casesResult = await getIndemnitorLinkedCases(currentSession.token);
        if (casesResult.success && casesResult.cases.length > 0) {
            linkedCases = casesResult.cases;
            console.log(`📋 Found ${linkedCases.length} linked case(s) for indemnitor`);

            // Populate case selector if multiple cases
            await populateCaseSelector();

            // If no case selected, default to first case
            if (!selectedCaseId && linkedCases.length > 0) {
                selectedCaseId = linkedCases[0].caseId;
            }
        } else {
            linkedCases = [];
            console.log("📋 No linked cases found for indemnitor");
        }

        // Get details for the selected case (or first case)
        const data = await getIndemnitorDetails(currentSession.token);
        const name = data?.firstName || "Cosigner";
        currentSession.email = currentSession.email || data?.email || "";

        if ($w('#welcomeText').type) {
            $w('#welcomeText').text = `Welcome, ${name}`;
        }

        // Show case count if multiple cases
        if (linkedCases.length > 1) {
            try {
                if ($w('#caseCountText').type) {
                    $w('#caseCountText').text = `You have ${linkedCases.length} active cases`;
                    $w('#caseCountText').expand();
                }
            } catch (e) { }
        }

        // Pre-fill Email
        if ($w('#inputIndemnitorEmail').type) {
            $w('#inputIndemnitorEmail').value = currentSession.email || "";
        }

        // Check if paperwork is already signed for selected case
        if (currentSession.email && selectedCaseId) {
            try {
                const docResult = await getAllDocumentsForMember(currentSession.email);
                if (docResult.success && docResult.documents && docResult.documents.length > 0) {
                    // Check if signed for the SELECTED case
                    const hasSigned = docResult.documents.some(d =>
                        d.status === 'signed' && d.caseId === selectedCaseId
                    );

                    if (hasSigned) {
                        console.log("✅ User has signed documents for this case.");
                        showSignedStatus();
                    } else {
                        showPaperworkForm();
                    }
                } else {
                    showPaperworkForm();
                }
            } catch (docErr) {
                console.warn("Could not check document status:", docErr);
                showPaperworkForm();
            }
        } else {
            showPaperworkForm();
        }

        // Populate dashboard fields with selected case data
        if (data) {
            populateDashboardFields(data);
        }

        // Load pending paperwork across all cases
        await loadPendingPaperwork();

    } catch (e) {
        console.error('Error loading dashboard data:', e);
    }
}

function showSignedStatus() {
    try {
        if ($w('#mainContent').type) {
            $w('#mainContent').collapse();
        }
        if ($w('#signedStatusSection').type) {
            $w('#signedStatusSection').expand();
        }
        if ($w('#txtSignedStatus').type) {
            $w('#txtSignedStatus').text = "✅ Paperwork signed for this case. Thank you!";
        }
    } catch (e) {
        console.log('Could not show signed status:', e);
    }
}

function showPaperworkForm() {
    try {
        if ($w('#mainContent').type) {
            $w('#mainContent').expand();
        }
        if ($w('#signedStatusSection').type) {
            $w('#signedStatusSection').collapse();
        }
    } catch (e) {
        console.log('Could not show paperwork form:', e);
    }
}

function populateDashboardFields(data) {
    try {
        if ($w('#liabilityText').type) {
            $w('#liabilityText').text = data.totalLiability || "$0.00";
        }
        if ($w('#totalPremiumText').type) {
            $w('#totalPremiumText').text = data.totalPremium || "$0.00";
        }
        if ($w('#downPaymentText').type) {
            $w('#downPaymentText').text = data.downPayment || "$0.00";
        }
        if ($w('#balanceDueText').type) {
            $w('#balanceDueText').text = data.balanceDue || "$0.00";
        }
        if ($w('#chargesCountText').type) {
            $w('#chargesCountText').text = data.chargesCount || "0";
        }
        if ($w('#defendantNameText').type) {
            $w('#defendantNameText').text = data.defendantName || "N/A";
        }
        if ($w('#defendantStatusText').type) {
            $w('#defendantStatusText').text = data.defendantStatus || "Unknown";
        }
        if ($w('#lastCheckInText').type) {
            $w('#lastCheckInText').text = data.lastCheckIn || "Never";
        }
        if ($w('#nextCourtDateText').type) {
            $w('#nextCourtDateText').text = data.nextCourtDate || "TBD";
        }
        if ($w('#caseNumberText').type) {
            $w('#caseNumberText').text = data.caseNumber || "Pending";
        }
        if ($w('#countyText').type) {
            $w('#countyText').text = data.county || "N/A";
        }
    } catch (e) {
        console.error('Error populating dashboard fields:', e);
    }
}

async function populateCaseSelector() {
    try {
        // Check if case selector dropdown exists
        if (!$w('#caseSelector').type) {
            console.log('No case selector dropdown found');
            return;
        }

        if (linkedCases.length <= 1) {
            // Hide selector if only one case
            $w('#caseSelector').collapse();
            return;
        }

        // Build dropdown options
        const options = linkedCases.map(c => ({
            label: `${c.defendantName} - ${c.caseNumber} (${c.signingStatus})`,
            value: c.caseId
        }));

        $w('#caseSelector').options = options;
        $w('#caseSelector').value = selectedCaseId || linkedCases[0].caseId;
        $w('#caseSelector').expand();

    } catch (e) {
        console.log('Could not populate case selector:', e);
    }
}

function setupCaseSelector() {
    try {
        if ($w('#caseSelector').type) {
            $w('#caseSelector').onChange(async (event) => {
                selectedCaseId = event.target.value;
                console.log('📋 Case selected:', selectedCaseId);

                // Reload dashboard for selected case
                await loadSelectedCaseData();
            });
        }
    } catch (e) {
        console.log('Could not setup case selector:', e);
    }
}

async function loadSelectedCaseData() {
    if (!selectedCaseId || linkedCases.length === 0) return;

    const selectedCase = linkedCases.find(c => c.caseId === selectedCaseId);
    if (!selectedCase) return;

    // Update dashboard fields with selected case data
    try {
        if ($w('#defendantNameText').type) {
            $w('#defendantNameText').text = selectedCase.defendantName || "N/A";
        }
        if ($w('#defendantStatusText').type) {
            $w('#defendantStatusText').text = selectedCase.defendantStatus || "Unknown";
        }
        if ($w('#caseNumberText').type) {
            $w('#caseNumberText').text = selectedCase.caseNumber || "Pending";
        }
        if ($w('#countyText').type) {
            $w('#countyText').text = selectedCase.county || "N/A";
        }
        if ($w('#liabilityText').type) {
            $w('#liabilityText').text = selectedCase.bondAmount || "$0.00";
        }
        if ($w('#nextCourtDateText').type) {
            $w('#nextCourtDateText').text = selectedCase.nextCourtDate || "TBD";
        }

        // Check signing status for this case
        if (selectedCase.signingStatus === 'Complete' || selectedCase.signingStatus === 'Signed') {
            showSignedStatus();
        } else {
            showPaperworkForm();
        }

    } catch (e) {
        console.error('Error loading selected case data:', e);
    }
}

async function loadPendingPaperwork() {
    try {
        const pendingResult = await getIndemnitorPendingPaperwork(currentSession.token);
        if (pendingResult.success && pendingResult.pendingDocuments.length > 0) {
            console.log(`📄 Found ${pendingResult.totalPending} pending document(s)`);

            // Show pending paperwork section
            try {
                if ($w('#pendingPaperworkSection').type) {
                    $w('#pendingPaperworkSection').expand();
                }
                if ($w('#pendingCountText').type) {
                    $w('#pendingCountText').text = `${pendingResult.totalPending} document(s) awaiting signature`;
                }
            } catch (e) { }

            // Populate pending documents repeater if exists
            try {
                if ($w('#pendingDocsRepeater').type) {
                    $w('#pendingDocsRepeater').data = pendingResult.pendingDocuments;
                    $w('#pendingDocsRepeater').onItemReady(($item, itemData) => {
                        $item('#docDefendantName').text = itemData.defendantName;
                        $item('#docCaseNumber').text = itemData.caseNumber;
                        $item('#docName').text = itemData.documentName;
                        $item('#docStatus').text = itemData.status;

                        $item('#signDocBtn').onClick(() => {
                            openSigningForDocument(itemData);
                        });
                    });
                }
            } catch (e) {
                console.log('Could not populate pending docs repeater:', e);
            }
        } else {
            // Hide pending paperwork section
            try {
                if ($w('#pendingPaperworkSection').type) {
                    $w('#pendingPaperworkSection').collapse();
                }
            } catch (e) { }
        }
    } catch (e) {
        console.error('Error loading pending paperwork:', e);
    }
}

async function openSigningForDocument(docInfo) {
    if (!docInfo.signingLink) {
        console.error('No signing link available for document');
        return;
    }

    LightboxController.show('signing', {
        signingUrl: docInfo.signingLink,
        documentId: docInfo.documentId,
        caseId: docInfo.caseId
    });
}

function setupPaperworkButtons() {
    // Primary Button
    try {
        if ($w('#startFinancialPaperworkBtn').type) {
            $w('#startFinancialPaperworkBtn').onClick(() => handlePaperworkStart());
        }
    } catch (e) {
        console.error('Error setting up startFinancialPaperworkBtn:', e);
    }

    // Alias Button
    try {
        if ($w('#startPaperworkBtn').type) {
            $w('#startPaperworkBtn').onClick(() => handlePaperworkStart());
        }
    } catch (e) {
        console.error('Error setting up startPaperworkBtn:', e);
    }
}

function setupLogoutButton() {
    try {
        const logoutBtn = $w('#logoutBtn');
        if (logoutBtn && typeof logoutBtn.onClick === 'function') {
            console.log('Indemnitor Portal: Logout button found');
            logoutBtn.onClick(() => {
                console.log('Indemnitor Portal: Logout clicked');
                handleLogout();
            });
        } else {
            console.warn('Indemnitor Portal: Logout button (#logoutBtn) not found');
        }
    } catch (e) {
        console.error('Error setting up logout button:', e);
    }
}

function handleLogout() {
    clearSessionToken();
    wixLocation.to('/portal-landing');
}

function setupContactForm() {
    try {
        if ($w('#contactForm').type) {
            $w('#contactForm').onSubmit(async (event) => {
                event.preventDefault();
                // Handle contact form submission
                console.log('Contact form submitted');
            });
        }
    } catch (e) {
        console.log('Contact form not found or error:', e);
    }
}

function setupCallButton() {
    try {
        if ($w('#callBtn').type) {
            $w('#callBtn').onClick(() => {
                wixWindow.openLightbox('CallLightbox');
            });
        }
    } catch (e) {
        console.log('Call button not found or error:', e);
    }
}

function setupSubmitButton() {
    try {
        if ($w('#submitBtn').type) {
            $w('#submitBtn').onClick(() => handleFormSubmit());
        }
    } catch (e) {
        console.log('Submit button not found or error:', e);
    }
}

function setupPayButton() {
    try {
        if ($w('#payBondBtn').type) {
            $w('#payBondBtn').onClick(() => {
                console.log('💸 Opening Payment Link...');
                wixLocation.to('https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd');
            });
        }
    } catch (e) {
        console.log('Pay button not found:', e);
    }
}

async function handlePaperworkStart() {
    console.log('📝 Starting paperwork process...');

    // Validate required fields
    const requiredFields = [
        '#inputIndemnitorName',
        '#inputIndemnitorEmail',
        '#inputIndemnitorPhone'
    ];

    let isValid = true;
    for (const fieldId of requiredFields) {
        try {
            if ($w(fieldId).type && !$w(fieldId).value) {
                $w(fieldId).updateValidityIndication();
                isValid = false;
            }
        } catch (e) { }
    }

    if (!isValid) {
        try {
            if ($w('#statusMessage').type) {
                $w('#statusMessage').text = "Please fill in all required fields.";
                $w('#statusMessage').expand();
            }
        } catch (e) { }
        return;
    }

    // Collect form data
    const formData = collectFormData();

    // Use selected case ID or fallback
    const caseId = selectedCaseId || currentSession.caseId || "Active_Case_Fallback";
    const userEmail = currentSession.email || formData.indemnitorEmail;

    try {
        if ($w('#statusMessage').type) {
            $w('#statusMessage').text = "Preparing documents...";
            $w('#statusMessage').expand();
        }
    } catch (e) { }

    // Create embedded signing link using ROBUST workflow
    // This handles validation, Gas fallback, and logging automatically.

    // We pass form data as 'indemnitorInfo' (even though it's one person, the structure might expect an array or specific object in future updates, 
    // but looking at initiateSigningWorkflow signature: { caseId, method, defendantInfo, indemnitorInfo, documentIds })

    // NOTE: initiateSigningWorkflow's kiosk mode currently takes 'signerEmail' and 'signerRole'.
    // If we want to support full Indemnitor data injection, we need to pass that indemnitor info.
    // The current initiateSigningWorkflow logic for 'kiosk' implies a single signer. 
    // Let's call it with the logic required:

    try {
        const result = await initiateSigningWorkflow({
            caseId: caseId,
            method: 'kiosk',
            defendantInfo: {}, // Not signing as defendant
            // We pass the indemnitor's email as the primary signer for this kiosk session
            customSigner: {
                email: userEmail,
                role: 'indemnitor',
                formData: formData // Pass the full form data for document generation
            },
            indemnitorInfo: [formData], // Keeping this for consistency if backend uses it
            documentIds: []
        });

        if (result.success && result.links && result.links.length > 0) {
            LightboxController.show('signing', {
                signingUrl: result.links[0],
                documentId: result.documentId,
                caseId: caseId
            });

            try {
                if ($w('#statusMessage').type) {
                    $w('#statusMessage').collapse();
                }
            } catch (e) { }
        } else {
            throw new Error(result.error || "No link returned");
        }
    } catch (e) {
        console.error('Failed to create SignNow link:', e);
        try {
            if ($w('#statusMessage').type) {
                $w('#statusMessage').text = "Error preparing documents. System may be busy.";
                $w('#statusMessage').expand();
            }
        } catch (err) { }
    }
}

function collectFormData() {
    const getValue = (id) => {
        try {
            return $w(id).value || '';
        } catch (e) {
            return '';
        }
    };

    return {
        // Indemnitor Info
        indemnitorName: getValue('#inputIndemnitorName'),
        indemnitorEmail: getValue('#inputIndemnitorEmail'),
        indemnitorPhone: getValue('#inputIndemnitorPhone'),
        indemnitorAddress: getValue('#inputIndemnitorAddress'),
        indemnitorCity: getValue('#inputIndemnitorCity'),
        indemnitorState: getValue('#inputIndemnitorState'),
        indemnitorZip: getValue('#inputIndemnitorZip'),

        // Employer Info
        indemnitorEmployerName: getValue('#inputEmployerName'),
        indemnitorEmployerPhone: getValue('#inputEmployerPhone'),
        indemnitorEmployerCity: getValue('#inputEmployerCity'),
        indemnitorEmployerState: getValue('#inputEmployerState'),
        indemnitorEmployerZip: getValue('#inputEmployerZip'),

        // Supervisor Info
        indemnitorSupervisorName: getValue('#inputSupervisorName'),
        indemnitorSupervisorPhone: getValue('#inputSupervisorPhone'),

        // Reference 1
        reference1: {
            name: getValue('#inputRef1Name'),
            phone: getValue('#inputRef1Phone'),
            address: getValue('#inputRef1Address')
        },

        // Reference 2
        reference2: {
            name: getValue('#inputRef2Name'),
            phone: getValue('#inputRef2Phone'),
            address: getValue('#inputRef2Address')
        },

        // Case context
        caseId: selectedCaseId || currentSession.caseId,
        defendantName: linkedCases.find(c => c.caseId === selectedCaseId)?.defendantName || ''
    };
}

async function handleFormSubmit() {
    console.log('📝 Form submit triggered');
    await handlePaperworkStart();
}

function anyHasValue(...ids) {
    return ids.some(id => {
        try {
            return ($w(id).value || '').toString().trim().length > 0;
        } catch (e) {
            return false;
        }
    });
}

function fillIfEmpty(id, value) {
    try {
        if (!$w(id).value && value) {
            $w(id).value = value;
            $w(id).resetValidityIndication();
        }
    } catch (e) { }
}
