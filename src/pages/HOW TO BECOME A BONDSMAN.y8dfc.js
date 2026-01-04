import { submitBailSchoolInterest } from 'backend/bailSchoolInterest.jsw';

$w.onReady(function () {
    // 1. Setup the Top Form
    setupForm(
        '#bailSchoolEmailInput',
        '#bailSchoolSubmitBtn',
        '#bailSchoolSuccessMsg',
        '#bailSchoolErrorText'
    );

    // 2. Setup the Bottom Form
    setupForm(
        '#bailSchoolEmailInputBottom',
        '#bailSchoolSubmitBtnBottom',
        '#bailSchoolSuccessMsgBottom',
        '#bailSchoolErrorTextBottom'
    );
});

/**
 * Reusable function to wire up any bail interest form with separate success/error messages
 * @param {string} inputId - ID of the email input
 * @param {string} buttonId - ID of the submit button
 * @param {string} successId - ID of the success message text (hidden by default)
 * @param {string} errorId - ID of the error message text (hidden by default)
 */
function setupForm(inputId, buttonId, successId, errorId) {
    const $input = $w(inputId);
    const $btn = $w(buttonId);
    const $success = $w(successId);
    const $error = $w(errorId);

    // Check if critical elements exist
    if (!$input.valid || !$btn.valid) {
        // console.warn(`Form elements missing: ${inputId} or ${buttonId}`);
        return;
    }

    $btn.onClick(async () => {
        const email = $input.value;

        // Reset messages
        if ($success.valid) $success.hide();
        if ($error.valid) $error.hide();

        // 1. Basic Client-Side Validation
        if (!email || !email.includes('@')) {
            if ($error.valid) {
                $error.text = "Please enter a valid email address.";
                $error.show();
            }
            return;
        }

        // 2. UI Loading State
        $btn.disable();
        const originalLabel = $btn.label;
        $btn.label = "Submitting...";

        try {
            // 3. Backend Call
            await submitBailSchoolInterest(email);

            // 4. Success State
            $btn.label = "Success!";
            if ($success.valid) {
                $success.text = "Thanks! We'll keep you updated.";
                $success.show();
            }
            // Optional: Clear input
            $input.value = "";

        } catch (error) {
            console.error("Bail School Submission Error:", error);

            // 5. Error State
            $btn.label = "Try Again";
            $btn.enable(); // Re-enable so they can retry

            if ($error.valid) {
                // Show a friendly message to the user
                $error.text = "Something went wrong. Please try again.";
                $error.show();
            }
        }
    });
}
