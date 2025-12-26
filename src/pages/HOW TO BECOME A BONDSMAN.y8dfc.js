import { submitBailSchoolInterest } from 'backend/bailSchoolInterest';

$w.onReady(() => {
    const successText = $w('#bailSchoolSuccessText');
    const errorText = $w('#bailSchoolErrorText');
    const submitBtn = $w('#bailSchoolSubmitButton');
    const emailInput = $w('#bailSchoolEmailInput');

    // Hide messages on load
    if (successText) successText.hide();
    if (errorText) errorText.hide();

    submitBtn.onClick(async () => {
        // Reset messages
        if (successText) successText.hide();
        if (errorText) errorText.hide();

        const email = (emailInput.value || '').trim();

        // Let Wix show built-in validation UI if possible
        if (!email || !validateEmail(email)) {
            emailInput.updateValidityIndication();
            if (errorText) errorText.show();
            return;
        }

        // Lock UI to prevent double-click spam
        const originalLabel = submitBtn.label;
        submitBtn.disable();
        submitBtn.label = 'Submitting...';

        try {
            await submitBailSchoolInterest(email);

            // Success UX
            emailInput.value = '';
            if (successText) successText.show();
            submitBtn.label = 'You’re on the list ✅';

            // Feedback colors
            submitBtn.style.backgroundColor = '#4CAF50';
            submitBtn.style.color = '#FFFFFF';

            // Re-enable button after a moment
            setTimeout(() => {
                submitBtn.enable();
                submitBtn.label = originalLabel;
                submitBtn.style.backgroundColor = '';
                submitBtn.style.color = '';
            }, 5000);

        } catch (err) {
            console.error('Bail school signup failed:', err);
            if (errorText) errorText.show();
            submitBtn.enable();
            submitBtn.label = 'Try again';
        }
    });
});

/**
 * Basic email regex validation
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
