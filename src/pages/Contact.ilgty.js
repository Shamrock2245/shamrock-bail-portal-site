import { submitContactForm } from 'backend/contact-api';
import { getCounties } from 'public/countyUtils';

$w.onReady(async function () {
    console.log("🚀 Contact Page Loaded");

    // Initialize Event Handlers
    $w('#btnSubmit').onClick(handleSubmit);

    // Load Jails
    await loadJails();

    // Optional: Pre-fill data if query params exist (e.g. from a "Quick Contact" link)
    // const query = wixLocation.query;
    // if(query.jail) $w('#dropdownJail').value = query.jail;
});

async function loadJails() {
    try {
        const counties = await getCounties();
        const opts = counties.map(c => ({
            label: c.jailName,
            value: c.jailName
        }));

        // Sort alphabetically
        opts.sort((a, b) => a.label.localeCompare(b.label));

        $w('#dropdownJail').options = opts;
    } catch (err) {
        console.error("Failed to load jails", err);
    }
}

/**
 * Handle Submit Button Click
 */
async function handleSubmit() {
    const $btn = $w('#btnSubmit');
    const $err = $w('#textError');
    const $success = $w('#textSuccess');

    // 1. Reset State
    $btn.disable();
    $btn.label = "Submitting...";
    $err.hide();
    $success.hide();

    // 2. Collect Data
    const formData = {
        name: $w('#inputName').value,
        phone: $w('#inputPhone').value,
        email: $w('#inputEmail').value,
        relationship: $w('#dropdownRelationship').value,
        defendantName: $w('#inputDefendantName').value,
        defendantDob: $w('#datePickerDefendantDOB').value,
        jail: $w('#dropdownJail').value,
        bookingNumber: $w('#inputBookingNumber').value,
        charges: $w('#inputCharges').value,
        source: $w('#dropdownSource').value,
        notes: $w('#inputNotes').value,
        consent: $w('#checkboxConsent').checked
    };

    console.log("DEBUG: Submitting form...", formData);

    // 3. Client-Side Validation (Fast Fail)
    if (!formData.name || !formData.phone || !formData.defendantName || !formData.jail) {
        showError("Please fill in all required fields marked with *.");
        resetButton();
        return;
    }

    if (!formData.consent) {
        showError("You must consent to be contacted to proceed.");
        resetButton();
        return;
    }

    // 4. Send to Backend
    try {
        const result = await submitContactForm(formData);

        if (result.success) {
            // Success State
            $success.text = "Request submitted! We will contact you momentarily.";
            $success.show();
            $w('#btnSubmit').hide(); // Hide button to prevent double submit

            // Optional: Clear form
            // clearForm(); 
        } else {
            // Backend Error
            showError(result.error || "An error occurred. Please call us directly.");
            resetButton();
        }

    } catch (error) {
        console.error("Submission Error:", error);
        showError("Network error. Please try again or call (239) 555-BAIL.");
        resetButton();
    }
}

function showError(msg) {
    const $err = $w('#textError');
    $err.text = msg;
    $err.show();
    // Auto-hide after 5 seconds
    setTimeout(() => $err.hide(), 5000);
}

function resetButton() {
    const $btn = $w('#btnSubmit');
    $btn.label = "Submit Request →";
    $btn.enable();
}
