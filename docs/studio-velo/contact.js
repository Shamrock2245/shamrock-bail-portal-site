/**
 * contact.js - Contact Us Page Code for Wix Studio
 * Page: Contact Us (/contact)
 * Branch: Wix studio version (branchId 12e252e4-45a8-4bcc-840b-64d4edbdcaa4)
 * 
 * Handles:
 * 1. Immediate 24/7 direct dispatch links (English, Spanish, SMS)
 * 2. Emergency contact & intake form submission to backend/leadsIntake.jsw (CRM sync)
 * 3. Form validation, spinner loading states, and success/error handling
 * 4. Conversion telemetry tracking
 */

import wixWindowFrontend from 'wix-window-frontend';
import { submitWebsiteLead } from 'backend/leadsIntake.jsw';

$w.onReady(function () {
    initContactForm();
    initDirectCallLinks();
});

/**
 * Initializes Emergency Contact & Inmate Inquiry Form
 */
function initContactForm() {
    const submitBtn = $w('#submitContactBtn');
    const spinner = $w('#submitSpinner');
    const successBox = $w('#successBox');
    const errorBox = $w('#errorBox');
    const errorText = $w('#errorMsgText');

    if (!submitBtn) return;

    submitBtn.onClick(async () => {
        // Clear previous state
        if (successBox) successBox.collapse();
        if (errorBox) errorBox.collapse();

        const name = $w('#inputName') ? $w('#inputName').value?.trim() : '';
        const phone = $w('#inputPhone') ? $w('#inputPhone').value?.trim() : '';
        const email = $w('#inputEmail') ? $w('#inputEmail').value?.trim() : '';
        const county = $w('#dropdownCounty') ? $w('#dropdownCounty').value : 'Lee';
        const inmateName = $w('#inputInmateName') ? $w('#inputInmateName').value?.trim() : '';
        const message = $w('#inputMessage') ? $w('#inputMessage').value?.trim() : '';

        // Validation: Name and Phone are required for crisis dispatch
        if (!name) {
            showError("Please enter your name so we know who to speak with.");
            if ($w('#inputName')) $w('#inputName').focus();
            return;
        }

        const phoneDigits = phone.replace(/[^0-9]/g, '');
        if (phoneDigits.length < 10) {
            showError("Please enter a valid 10-digit callback phone number.");
            if ($w('#inputPhone')) $w('#inputPhone').focus();
            return;
        }

        // Show loading spinner & disable button
        submitBtn.disable();
        if (spinner) spinner.show();

        try {
            const payload = {
                callerName: name,
                callerPhone: phone,
                callerEmail: email,
                county: county || 'Lee',
                defendantName: inmateName,
                notes: message,
                leadSource: 'wix-studio-contact-page',
                submittedAt: new Date().toISOString()
            };

            const result = await submitWebsiteLead(payload);

            if (result && result.success) {
                if (successBox) successBox.expand();
                resetFormFields();
                trackEvent('contact_form_submitted', county);
            } else {
                const failReason = result?.message || "Could not transmit inquiry. Please call (239) 332-2245 directly.";
                showError(failReason);
            }
        } catch (err) {
            console.error("Submission failed:", err);
            showError("Connection error. For immediate assistance, please call our 24/7 dispatch line at (239) 332-2245.");
        } finally {
            submitBtn.enable();
            if (spinner) spinner.hide();
        }
    });

    function showError(msg) {
        if (errorText) errorText.text = msg;
        if (errorBox) errorBox.expand();
    }

    function resetFormFields() {
        if ($w('#inputName')) $w('#inputName').value = '';
        if ($w('#inputPhone')) $w('#inputPhone').value = '';
        if ($w('#inputEmail')) $w('#inputEmail').value = '';
        if ($w('#inputInmateName')) $w('#inputInmateName').value = '';
        if ($w('#inputMessage')) $w('#inputMessage').value = '';
    }
}

/**
 * Initializes Direct Phone & SMS Links
 */
function initDirectCallLinks() {
    if ($w('#contactCallEnglish')) {
        $w('#contactCallEnglish').onClick(() => {
            trackEvent('call_english', 'contact_page');
        });
    }

    if ($w('#contactCallSpanish')) {
        $w('#contactCallSpanish').onClick(() => {
            trackEvent('call_spanish', 'contact_page');
        });
    }

    if ($w('#contactTextSMS')) {
        $w('#contactTextSMS').onClick(() => {
            trackEvent('sms_click', 'contact_page');
        });
    }
}

function trackEvent(action, label) {
    try {
        if (wixWindowFrontend.trackEvent) {
            wixWindowFrontend.trackEvent('CustomEvent', {
                event: 'contact_page_action',
                eventCategory: 'Lead Dispatch',
                eventAction: action,
                eventLabel: label
            });
        }
    } catch (e) {
        console.warn('Analytics suppressed:', e.message);
    }
}
