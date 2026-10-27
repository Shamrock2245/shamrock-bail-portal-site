/**
 * portal-landing.js - Member Portal Login & Magic Link Hub for Wix Studio
 * Page: Portal Landing (/portal-landing)
 * Branch: Wix studio version (branchId 12e252e4-45a8-4bcc-840b-64d4edbdcaa4)
 * 
 * Rules & Architecture:
 * 1. Role Selection: Indemnitor is the DEFAULT selected role.
 * 2. Co-Indemnitor: Added as an explicit role and flow, used ONLY when a bond needs one
 *    (e.g., requested via URL query ?role=coindemnitor or when additional indemnification is required).
 * 3. Defendant Invariant: Under Florida law (F.S. § 648), a DEFENDANT STILL SIGNS ON EVERY BOND.
 *    Adding a co-indemnitor provides supplemental financial backing but never replaces or waives defendant signature.
 * 4. Bail School Separation: Bail School student logins are strictly separate. Never route bail
 *    clients and students through the same login. Any student/school traffic is redirected to /bail-school.
 * 5. Identity Fail-Closed: Preserves all existing element IDs, strict contact validation,
 *    and fail-closed error handling.
 */

import wixLocationFrontend from 'wix-location-frontend';
import { sendMagicLinkSimplified } from 'backend/portal-auth.jsw';

// Strict Bail School Separation Guard
const BAIL_SCHOOL_ROUTE = '/bail-school';

$w.onReady(function () {
    const query = (wixLocationFrontend && wixLocationFrontend.query) ? wixLocationFrontend.query : {};
    const queryRole = String(query.role || '').toLowerCase().trim();

    // -------------------------------------------------------------------------
    // 0. BAIL SCHOOL SEPARATION GUARD
    // Keep Bail School login completely separate; never route bail clients & students through same login.
    // -------------------------------------------------------------------------
    const isStudentQuery = Boolean(
        query.school ||
        query.course ||
        query.student === 'true' ||
        queryRole === 'student'
    );

    if (isStudentQuery) {
        console.warn("⚠️ [Portal Landing] Bail School traffic detected. Redirecting to /bail-school...");
        if (wixLocationFrontend && typeof wixLocationFrontend.to === 'function') {
            wixLocationFrontend.to(BAIL_SCHOOL_ROUTE);
            return;
        }
    }

    // -------------------------------------------------------------------------
    // 1. ELEMENT BINDINGS (Preserve all existing IDs)
    // -------------------------------------------------------------------------
    const defendantTab = $w('#tabDefendant');
    const indemnitorTab = $w('#tabIndemnitor');
    const coIndemnitorTab = $w('#tabCoIndemnitor'); // Used only when bond needs one
    const linkCoIndemnitor = $w('#linkCoIndemnitor'); // Optional canvas helper
    const roleDesc = $w('#roleDescriptionText');
    const defendantSignNotice = $w('#textDefendantMustSignNotice');

    const inputPhone = $w('#inputLoginPhone');
    const inputEmail = $w('#inputLoginEmail');
    const submitBtn = $w('#btnSendMagicLink');
    const spinner = $w('#loginSpinner');
    const successBox = $w('#loginSuccessBox');
    const errorBox = $w('#loginErrorBox');
    const errorText = $w('#loginErrorText');

    // -------------------------------------------------------------------------
    // 2. ROLE DEFINITIONS & COPY
    // -------------------------------------------------------------------------
    const ROLE_COPY = {
        indemnitor: {
            desc: "Cosigner / Indemnitor Portal: Review paperwork, manage payment plans, and view receipts.",
            notice: "Under Florida law, the defendant still signs on every bond. Cosigning provides the financial guarantee."
        },
        defendant: {
            desc: "Defendant Portal: Check court dates, verify weekly check-in, and view bond status.",
            notice: "A defendant signature is required on every bond packet prior to jail release."
        },
        coindemnitor: {
            desc: "Co-Indemnitor Portal: Complete secondary cosigner paperwork and liability agreement for bonds requiring additional indemnification.",
            notice: "A co-indemnitor provides supplemental financial backing when required. The defendant still signs on every bond."
        }
    };

    // State variable: Default selected role is 'indemnitor'
    let currentRole = 'indemnitor';

    function setActiveRole(role) {
        currentRole = role;

        // Visual Tab State
        if (indemnitorTab && indemnitorTab.customClassList) {
            if (role === 'indemnitor') indemnitorTab.customClassList.add('active-tab');
            else indemnitorTab.customClassList.remove('active-tab');
        }
        if (defendantTab && defendantTab.customClassList) {
            if (role === 'defendant') defendantTab.customClassList.add('active-tab');
            else defendantTab.customClassList.remove('active-tab');
        }
        if (coIndemnitorTab && coIndemnitorTab.customClassList) {
            if (role === 'coindemnitor') coIndemnitorTab.customClassList.add('active-tab');
            else coIndemnitorTab.customClassList.remove('active-tab');
        }

        // Descriptive Guidance Text
        if (roleDesc && ROLE_COPY[role]) {
            roleDesc.text = ROLE_COPY[role].desc;
        }

        // Invariant: Defendant still signs on every bond
        if (defendantSignNotice && ROLE_COPY[role]) {
            defendantSignNotice.text = ROLE_COPY[role].notice;
        }
    }

    // -------------------------------------------------------------------------
    // 3. ROLE SWITCHING & CO-INDEMNITOR FLOW
    // Co-Indemnitor role is used ONLY when a bond needs one (via query or explicit trigger).
    // -------------------------------------------------------------------------
    const bondNeedsCoIndemnitor = (
        queryRole === 'coindemnitor' ||
        queryRole === 'co-indemnitor' ||
        query.coindemnitor === 'true'
    );

    if (coIndemnitorTab) {
        if (bondNeedsCoIndemnitor) {
            // Expand & reveal co-indemnitor tab only when this bond requires one
            if (typeof coIndemnitorTab.expand === 'function') coIndemnitorTab.expand();
            if (typeof coIndemnitorTab.show === 'function') coIndemnitorTab.show();
            setActiveRole('coindemnitor');
        } else {
            // Normal flow: Keep co-indemnitor collapsed by default
            if (typeof coIndemnitorTab.collapse === 'function') coIndemnitorTab.collapse();
            setActiveRole('indemnitor'); // Indemnitor is default
        }

        if (typeof coIndemnitorTab.onClick === 'function') {
            coIndemnitorTab.onClick(() => {
                setActiveRole('coindemnitor');
            });
        }
    } else {
        // Fallback if canvas has not placed #tabCoIndemnitor element
        if (bondNeedsCoIndemnitor) {
            setActiveRole('coindemnitor');
        } else {
            setActiveRole('indemnitor'); // Default
        }
    }

    // Optional text trigger: "Need a second cosigner?"
    if (linkCoIndemnitor && typeof linkCoIndemnitor.onClick === 'function') {
        linkCoIndemnitor.onClick(() => {
            if (coIndemnitorTab) {
                if (typeof coIndemnitorTab.expand === 'function') coIndemnitorTab.expand();
                if (typeof coIndemnitorTab.show === 'function') coIndemnitorTab.show();
            }
            setActiveRole('coindemnitor');
        });
    }

    // Defendant Tab click listener
    if (defendantTab && typeof defendantTab.onClick === 'function') {
        defendantTab.onClick(() => {
            setActiveRole('defendant');
        });
    }

    // Indemnitor Tab click listener
    if (indemnitorTab && typeof indemnitorTab.onClick === 'function') {
        indemnitorTab.onClick(() => {
            setActiveRole('indemnitor');
        });
    }

    // Initial default: Ensure Indemnitor is visually and logically active on initial load
    if (!bondNeedsCoIndemnitor) {
        setActiveRole('indemnitor');
    }

    // -------------------------------------------------------------------------
    // 4. SUBMIT ACTION & IDENTITY FAIL-CLOSED CHECKS
    // -------------------------------------------------------------------------
    if (submitBtn) {
        submitBtn.onClick(async () => {
            if (successBox && typeof successBox.collapse === 'function') successBox.collapse();
            if (errorBox && typeof errorBox.collapse === 'function') errorBox.collapse();

            const phone = inputPhone ? (inputPhone.value || '').trim() : '';
            const email = inputEmail ? (inputEmail.value || '').trim() : '';

            // Bail School input separation guard
            const lowerEmail = email.toLowerCase();
            if (lowerEmail.includes('@bailschool') || lowerEmail.includes('student@')) {
                showError("Bail School student logins are managed separately. Please visit /bail-school to access course materials.");
                return;
            }

            // Identity fail-closed check: Phone or email required
            if (!phone && !email) {
                showError("Please enter your mobile phone number or email address.");
                return;
            }

            submitBtn.disable();
            if (spinner && typeof spinner.show === 'function') spinner.show();

            try {
                // sendMagicLinkSimplified takes one contact string (email or phone)
                const contact = (email && email.includes('@')) ? email : phone;
                const response = await sendMagicLinkSimplified(contact);

                if (response && response.success) {
                    if (successBox && typeof successBox.expand === 'function') successBox.expand();
                    if ($w('#successDetailText')) {
                        $w('#successDetailText').text = `A secure access link has been dispatched to ${phone || email}. Please check your messages.`;
                    }
                } else {
                    const msg = response?.message || "No active case record found for that contact info. Please call (239) 332-2245.";
                    showError(msg);
                }
            } catch (err) {
                console.error("Login request error:", err);
                showError("Unable to verify access. For immediate help, call (239) 332-2245.");
            } finally {
                submitBtn.enable();
                if (spinner && typeof spinner.hide === 'function') spinner.hide();
            }
        });
    }

    function showError(msg) {
        if (errorText) errorText.text = msg;
        if (errorBox && typeof errorBox.expand === 'function') errorBox.expand();
    }
});
