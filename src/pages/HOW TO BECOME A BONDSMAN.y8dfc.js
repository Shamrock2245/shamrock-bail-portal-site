import wixCrm from 'wix-crm';
import { trackEvent } from 'backend/analytics';

$w.onReady(function () {
    const submitBtn = $w('#bailSchoolSubmitButton');
    const emailInput = $w('#bailSchoolEmailInput');

    submitBtn.onClick(async () => {
        const email = emailInput.value;

        // 1. Robust Validation
        if (!email || !validateEmail(email)) {
            emailInput.updateValidityIndication();
            return;
        }

        // 2. Loading State (Prevent double clicks)
        const originalLabel = submitBtn.label;
        submitBtn.disable();
        submitBtn.label = 'Sending...';

        try {
            // 3. Create/Update Contact
            await wixCrm.contacts.appendOrCreateContact({
                emails: [email],
                labels: ['Bail School Interest']
            });

            // 4. Analytics Tracking
            await trackEvent('bail_school_signup', {
                email,
                page: 'How to Become a Bondsman'
            });

            // 5. Success Feedback
            emailInput.value = '';
            submitBtn.label = 'You’re on the list ✅';
            submitBtn.style.backgroundColor = '#4CAF50'; // Green success color
            submitBtn.style.color = '#FFFFFF';

            // Optional: Re-enable after 5 seconds
            setTimeout(() => {
                submitBtn.label = originalLabel;
                submitBtn.enable();
                submitBtn.style.backgroundColor = '';
                submitBtn.style.color = '';
            }, 5000);

        } catch (error) {
            console.error('Bail School Signup Error:', error);
            submitBtn.label = 'Try again';
            submitBtn.enable();
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
