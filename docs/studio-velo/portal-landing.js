/**
 * portal-landing.js - Member Portal Login & Magic Link Hub for Wix Studio
 * Page: Portal Landing (/portal-landing)
 * Branch: Wix studio version (branchId 12e252e4-45a8-4bcc-840b-64d4edbdcaa4)
 * 
 * Handles:
 * 1. Role selection (Defendant vs Indemnitor/Cosigner)
 * 2. Passwordless Magic Link and SMS OTP access dispatch
 * 3. Client dashboard routing to /portal-defendant or /portal-indemnitor
 * 4. Error states and immediate bondsman telephone support
 */

import wixLocationFrontend from 'wix-location-frontend';
import { sendMagicLinkSimplified } from 'backend/portal-auth.jsw';

$w.onReady(function () {
    let currentRole = 'indemnitor'; // default

    const defendantTab = $w('#tabDefendant');
    const indemnitorTab = $w('#tabIndemnitor');
    const inputPhone = $w('#inputLoginPhone');
    const inputEmail = $w('#inputLoginEmail');
    const submitBtn = $w('#btnSendMagicLink');
    const spinner = $w('#loginSpinner');
    const successBox = $w('#loginSuccessBox');
    const errorBox = $w('#loginErrorBox');
    const errorText = $w('#loginErrorText');

    // Role Tab Switching
    if (defendantTab && indemnitorTab) {
        defendantTab.onClick(() => {
            currentRole = 'defendant';
            defendantTab.customClassList.add('active-tab');
            indemnitorTab.customClassList.remove('active-tab');
            if ($w('#roleDescriptionText')) {
                $w('#roleDescriptionText').text = "Defendant Portal: Check court dates, verify weekly check-in, and view bond status.";
            }
        });

        indemnitorTab.onClick(() => {
            currentRole = 'indemnitor';
            indemnitorTab.customClassList.add('active-tab');
            defendantTab.customClassList.remove('active-tab');
            if ($w('#roleDescriptionText')) {
                $w('#roleDescriptionText').text = "Cosigner / Indemnitor Portal: Review paperwork, manage payment plans, and view receipts.";
            }
        });
    }

    // Submit Action
    if (submitBtn) {
        submitBtn.onClick(async () => {
            if (successBox) successBox.collapse();
            if (errorBox) errorBox.collapse();

            const phone = inputPhone ? inputPhone.value?.trim() : '';
            const email = inputEmail ? inputEmail.value?.trim() : '';

            if (!phone && !email) {
                showError("Please enter your mobile phone number or email address.");
                return;
            }

            submitBtn.disable();
            if (spinner) spinner.show();

            try {
                // sendMagicLinkSimplified takes one email or phone string.
                // It looks up an existing case role, or creates an indemnitor
                // login for a new contact. It does not accept a role object.
                const contact = (email && email.includes('@')) ? email : phone;
                const response = await sendMagicLinkSimplified(contact);

                if (response && response.success) {
                    if (successBox) successBox.expand();
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
                if (spinner) spinner.hide();
            }
        });
    }

    function showError(msg) {
        if (errorText) errorText.text = msg;
        if (errorBox) errorBox.expand();
    }
});
