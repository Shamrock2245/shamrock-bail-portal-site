// Page: portal-indemnitor.k53on.js (CUSTOM AUTH VERSION)
// Function: Indemnitor Dashboard with Lightbox Controller Integration
// Last Updated: 2026-01-08
//
// AUTHENTICATION: Custom session-based (NO Wix Members)
// Uses browser storage (wix-storage-frontend) session tokens validated against PortalSessions collection

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { validateCustomSession, getIndemnitorDetails, getUserConsentStatus } from 'backend/portal-auth';
import { LightboxController } from 'public/lightbox-controller';
import { getMemberDocuments } from 'backend/documentUpload';
import { createEmbeddedLink, submitIntake } from 'backend/signnow-integration';
import { reverseGeocodeToCityStateZip, geocodeAddressToCityStateZip } from 'backend/googleMaps';
import { sendAdminNotification, NOTIFICATION_TYPES } from 'backend/notificationService';
import { getSessionToken, setSessionToken, clearSessionToken } from 'public/session-manager';
import wixSeo from 'wix-seo';
import { silentPingLocation } from 'public/location-tracker';
import { getAllDocumentsForMember } from 'backend/wixApi.jsw';

let currentSession = null; // Store validated session data

$w.onReady(async function () {
    LightboxController.init($w);

    try {
        if ($w('#welcomeText').type) {
            $w('#welcomeText').text = "Loading Dashboard...";
        }
    } catch (e) { }

    try {
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

        // Setup Actions
        setupPaperworkButtons();
        setupLogoutButton();
        setupContactForm();
        setupCallButton();
        setupSubmitButton();

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

        // Load Dashboard Data
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
            if (city && !$w('#inputIndemnitorCity').value) $w('#inputIndemnitorCity').value = city;
            if (state && !$w('#inputIndemnitorState').value) $w('#inputIndemnitorState').value = state;
            if (zip && !$w('#inputIndemnitorZip').value) $w('#inputIndemnitorZip').value = zip;

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
        const data = await getIndemnitorDetails(currentSession.token);
        const name = "Indemnitor"; // TODO: Get from user profile
        currentSession.email = data?.email || ""; // Store retrieved email

        if ($w('#welcomeText').type) {
            $w('#welcomeText').text = `Welcome, ${name}`;
        }

        // Phase 2: Pre-fill Email
        if ($w('#inputIndemnitorEmail').type) {
            $w('#inputIndemnitorEmail').value = currentSession.email || "";
        }

        // --- NEW: CHECK IF PAPERWORK IS ALREADY SIGNED ---
        if (currentSession.email) {
            try {
                // Check for ANY signed document
                const docResult = await getAllDocumentsForMember(currentSession.email);
                if (docResult.success && docResult.documents && docResult.documents.length > 0) {
                    const hasSigned = docResult.documents.some(d => d.status === 'signed');

                    if (hasSigned) {
                        console.log("✅ User has signed documents. Hiding paperwork inputs.");
                        if ($w('#mainContent').type) {
                            $w('#mainContent').collapse();
                        }
                        // Optional: Show a "Thank You" or "Status" message instead?
                        // For now, just collapsing as requested.
                    } else {
                        // Ensure it's expanded if not signed (e.g. if they come back)
                        if ($w('#mainContent').type) {
                            $w('#mainContent').expand();
                        }
                    }
                }
            } catch (docErr) {
                console.warn("Could not check document status:", docErr);
            }
        }

        if (data) {
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
            } catch (e) {
                console.error('Error populating dashboard fields:', e);
            }
        }
    } catch (e) {
        console.error('Error loading dashboard data:', e);
    }
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
        console.warn('Indemnitor Portal: No logout button configured');
    }
}

function setupCallButton() {
    if ($w('#callBtn').type) {
        $w('#callBtn').onClick(() => {
            wixLocation.to('tel:2393322245');
        });
    }
}

function setupContactForm() {
    if (!$w('#inputMessageSubmitBtn').type) return;

    $w('#inputMessageSubmitBtn').onClick(async () => {
        const messageBox = $w('#inputMessageBox');
        const message = (messageBox.value || '').trim();

        if (!message) return;

        $w('#inputMessageSubmitBtn').disable();
        $w('#inputMessageSubmitBtn').label = "Sending...";

        try {
            await sendAdminNotification(NOTIFICATION_TYPES.NEW_CONTACT_INQUIRY, {
                // TODO: Retrieve actual member name/phone from session/profile data
                name: currentSession.memberName || "Indemnitor",
                phone: currentSession.memberPhone || "Unknown",
                email: currentSession.email,
                relationship: 'Indemnitor',
                jail: 'Portal Inquiry',
                notes: message
            });

            messageBox.value = "";
            $w('#inputMessageSubmitBtn').label = "Sent!";
            setTimeout(() => {
                $w('#inputMessageSubmitBtn').label = "Send";
                $w('#inputMessageSubmitBtn').enable();
            }, 3000);

        } catch (e) {
            console.error("Failed to send message:", e);
            $w('#inputMessageSubmitBtn').label = "Error";
            setTimeout(() => {
                $w('#inputMessageSubmitBtn').label = "Send";
                $w('#inputMessageSubmitBtn').enable();
            }, 3000);
        }
    });
}

/**
 * Handle "Submit Info" Button (Initial Data Collection)
 */
function setupSubmitButton() {
    if (!$w('#btnSubmitInfo').type) {
        console.warn('Submit Info button (#btnSubmitInfo) not found');
        return;
    }

    $w('#btnSubmitInfo').onClick(async () => {
        const btn = $w('#btnSubmitInfo');
        btn.disable();
        const originalLabel = btn.label;
        btn.label = "Submitting...";

        try {
            // 1. Gather Data
            const payload = {
                defendantFullName: $w('#inputDefendantName').value,
                defendantPhone: $w('#inputDefendantPhone').value,
                indemnitorFullName: $w('#inputIndemnitorName').value,
                indemnitorEmail: $w('#inputIndemnitorEmail').value,
                indemnitorPhone: $w('#inputIndemnitorPhone').value,
                // Parse Address Object if available
                indemnitorStreetAddress: $w('#inputIndemnitorAddress').value?.formatted || "",
                // Split formatted address logic could go here if needed, but keeping simple for now
                // We rely on backend/GAS to handle raw strings if needed or add parsing utility
                reference1: {
                    name: $w('#inputRef1Name').value,
                    phone: $w('#inputRef1Phone').value,
                    relation: $w('#inputRef1Relation').value // Added based on typical forms
                },
                reference2: {
                    name: $w('#inputRef2Name').value,
                    phone: $w('#inputRef2Phone').value,
                    relation: $w('#inputRef2Relation').value
                },
                status: 'Pending',
                submittedAt: new Date().toISOString()
            };

            // 2. Simple Validation
            if (!payload.defendantFullName || !payload.indemnitorFullName || !payload.indemnitorPhone) {
                throw new Error("Please fill in all required fields (Name, Phone).");
            }

            // 3. Submit to Backend
            console.log("Submitting intake payload:", payload);
            const result = await submitIntake(payload);

            if (result.success) {
                btn.label = "Submitted!";
                if ($w('#statusMessage').type) {
                    $w('#statusMessage').text = "✅ Info submitted! Starting paperwork...";
                    $w('#statusMessage').expand();
                }

                // 4. AUTO-TRIGGER SIGNING FLOW
                console.log("Auto-triggering paperwork flow...");
                await handlePaperworkStart();

                // Reset button triggering
                setTimeout(() => {
                    btn.label = originalLabel;
                    btn.enable();
                }, 1000);
            } else {
                throw new Error(result.error || "Submission failed.");
            }

        } catch (error) {
            console.error("Submit Info Failed:", error);
            btn.label = "Error - Try Again";
            if ($w('#statusMessage').type) {
                $w('#statusMessage').text = `⚠️ Error: ${error.message}`;
                $w('#statusMessage').expand();
            }
            setTimeout(() => {
                btn.label = originalLabel;
                btn.enable();
            }, 3000);
        }
    });
}

async function handleLogout() {
    console.log('Indemnitor Portal: Logging out...');
    clearSessionToken();
    wixLocation.to('/portal-landing');
}

/**
 * Main Paperwork Orchestration Flow
 */
async function handlePaperworkStart() {
    if (!currentSession) {
        console.error('No session available');
        return;
    }

    // --- FORM DATA COLLECTION & VALIDATION ---
    // Phase 1 Fields
    const defendantName = $w('#inputDefendantName').value;
    // Optional Field: Defendant Phone
    const defendantPhone = $w('#inputDefendantPhone').value;
    const indemnitorName = $w('#inputIndemnitorName').value;
    const indemnitorAddressObj = $w('#inputIndemnitorAddress').value;
    const indemnitorAddress = indemnitorAddressObj?.formatted || "";

    // Phase 2 Fields
    const indemnitorEmail = $w('#inputIndemnitorEmail').value;
    const indemnitorPhone = $w('#inputIndemnitorPhone').value;

    // References
    const ref1Name = $w('#inputRef1Name').value;
    const ref1Phone = $w('#inputRef1Phone').value;
    const ref1AddressObj = $w('#inputRef1Address').value;
    const ref1Address = ref1AddressObj?.formatted || "";

    const ref2Name = $w('#inputRef2Name').value;
    const ref2Phone = $w('#inputRef2Phone').value;
    const ref2AddressObj = $w('#inputRef2Address').value;
    const ref2Address = ref2AddressObj?.formatted || "";


    // Validation
    const missingFields = [];
    if (!defendantName) missingFields.push("Defendant Name");
    if (!indemnitorName) missingFields.push("Your Name");
    if (!indemnitorAddress) missingFields.push("Your Address");
    if (!indemnitorEmail) missingFields.push("Email");
    if (!indemnitorPhone) missingFields.push("Phone");
    if (!ref1Name || !ref1Phone || !ref1Address) missingFields.push("Reference 1 (Complete)");
    if (!ref2Name || !ref2Phone || !ref2Address) missingFields.push("Reference 2 (Complete)");

    if (missingFields.length > 0) {
        if ($w('#statusMessage').type) {
            $w('#statusMessage').text = `⚠️ Missing: ${missingFields.join(", ")}`;
            $w('#statusMessage').expand();
            // Optional: Auto-hide after a few seconds
            setTimeout(() => $w('#statusMessage').collapse(), 8000);
        }
        return; // Stop execution
    }

    // Construct Data Payload
    const formData = {
        defendantName,
        defendantPhone, // Optional
        indemnitorName,
        indemnitorAddress,
        indemnitorEmail,
        indemnitorPhone,
        reference1: {
            name: ref1Name,
            phone: ref1Phone,
            address: ref1Address
        },
        reference2: {
            name: ref2Name,
            phone: ref2Phone,
            address: ref2Address
        }
    };

    // Clear any previous error messages
    if ($w('#statusMessage').type) $w('#statusMessage').collapse();

    // Use REAL email or fallback
    const userEmail = currentSession.email || `indemnitor_${currentSession.personId}@shamrock.local`;

    // 1. ID Upload Check
    const hasUploadedId = await checkIdUploadStatus(userEmail, currentSession.token);
    if (!hasUploadedId) {
        const idResult = await LightboxController.show('idUpload', {
            memberData: { email: userEmail, name: "Indemnitor" }
        });
        if (!idResult?.success) return;
    }

    // 2. Consent Check
    const hasConsented = await checkConsentStatus(currentSession.personId);
    if (!hasConsented) {
        const consentResult = await LightboxController.show('consent');
        if (!consentResult) {
            const recheck = await checkConsentStatus(currentSession.personId);
            if (!recheck) return;
        }
    }

    // 3. Signing
    await proceedToSignNow(formData);
}

// --- Helpers ---

async function checkIdUploadStatus(memberEmail, sessionToken) {
    try {
        const result = await getMemberDocuments(memberEmail, sessionToken);
        if (!result.success) return false;
        const idDocs = result.documents.filter(doc => doc.documentType === 'government_id');
        const hasFront = idDocs.some(doc => doc.documentSide === 'front');
        const hasBack = idDocs.some(doc => doc.documentSide === 'back');
        return hasFront && hasBack;
    } catch (e) {
        return false;
    }
}

async function checkConsentStatus(personId) {
    try {
        const result = await getUserConsentStatus(personId);
        // getUserConsentStatus returns {hasConsent: boolean, ...}
        return result?.hasConsent || false;
    } catch (e) {
        console.error("Indemnitor checkConsentStatus error:", e);
        return false;
    }
}

async function proceedToSignNow(formData) {
    if (!currentSession) {
        console.error('No session available');
        return;
    }

    const caseId = currentSession.caseId || "Active_Case_Fallback";
    // Use REAL email or fallback
    const userEmail = currentSession.email || `indemnitor_${currentSession.personId}@shamrock.local`;

    // Role: Indemnitor
    const result = await createEmbeddedLink(caseId, userEmail, 'indemnitor', formData);

    if (result.success) {
        LightboxController.show('signing', {
            signingUrl: result.embeddedLink,
            documentId: result.documentId
        });
    } else {
        console.error('Failed to create SignNow link:', result.error);

        try {
            if ($w('#statusMessage').type) {
                $w('#statusMessage').text = "Error preparing documents.";
                $w('#statusMessage').expand();
            }
        } catch (e) {
            console.error('Error displaying status message:', e);
        }
    }
}

function anyHasValue(...ids) {
    return ids.some(id => ($w(id).value || '').toString().trim().length > 0);
}

function fillIfEmpty(id, value) {
    if (!$w(id).value && value) {
        $w(id).value = value;
    }
}
