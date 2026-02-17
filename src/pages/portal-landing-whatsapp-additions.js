/**
 * ============================================================================
 * WhatsApp OTP Additions for portal-landing.bagfn.js
 * ============================================================================
 * 
 * INSTRUCTIONS:
 * 1. Replace the existing handleGetStarted() function with handleGetStarted_v3()
 * 2. Add the new functions at the end of the file
 * 3. Wire up the #verifyOtpBtn button in setupSimplifiedLogin()
 * ============================================================================
 */

/**
 * Handle "Get Started" button click (v3.0 - WhatsApp OTP Support)
 * Validates input and routes to appropriate auth flow:
 * - Email: Magic link
 * - Phone: WhatsApp OTP
 */
async function handleGetStarted_v3() {
    const input = $w('#emailPhoneInput');
    const button = $w('#getStartedBtn');

    // Get and validate input
    const emailOrPhone = input.value ? input.value.trim() : '';

    if (!emailOrPhone) {
        showMessage("Please enter your email or WhatsApp number", "error");
        input.focus();
        return;
    }

    // Basic validation
    if (!isValidEmailOrPhone(emailOrPhone)) {
        showMessage("Please enter a valid email or WhatsApp number", "error");
        input.focus();
        return;
    }

    // Detect if input is phone number (for WhatsApp OTP) or email (for magic link)
    const isPhone = /^[\d\s\-\+\(\)]+$/.test(emailOrPhone);

    if (isPhone) {
        // Route to WhatsApp OTP flow
        console.log("📱 Detected phone number, sending WhatsApp OTP");
        await handleWhatsAppOTPFlow(emailOrPhone);
    } else {
        // Route to email magic link flow
        console.log("📧 Detected email, sending magic link");
        await handleEmailMagicLinkFlow(emailOrPhone);
    }
}

/**
 * Handle Email Magic Link Flow (Existing logic, extracted)
 */
async function handleEmailMagicLinkFlow(email) {
    const button = $w('#getStartedBtn');

    // Show loading state
    button.disable();
    const originalLabel = button.label;
    button.label = "Sending...";
    showMessage("Sending your secure link...", "info");

    try {
        // Call backend to send magic link
        const result = await sendMagicLinkSimplified(email);

        console.log("📬 Magic link result:", result);

        if (result.success) {
            // Success! Show instructions
            button.label = "Sent! ✓";
            showMessage(
                result.isNewUser
                    ? "Welcome! Check your email or phone for your secure link."
                    : "Check your email or phone for your secure link.",
                "success"
            );

            // Clear input
            $w('#emailPhoneInput').value = "";

            // RESEND LOGIC (UX UPGRADE)
            // Disable button for 60 seconds to prevent spam, then change to "Resend Link"
            let countdown = 60;
            const timer = setInterval(() => {
                countdown--;
                if (button.label !== "Sent! ✓" && !button.label.startsWith("Resend")) {
                    if (button.enabled) { clearInterval(timer); return; }
                }

                button.label = "Resend in " + countdown + "s";

                if (countdown <= 0) {
                    clearInterval(timer);
                    button.label = "Resend Link";
                    button.enable();
                }
            }, 1000);

        } else {
            // Error
            console.error("❌ Magic link send failed:", result.message);
            showMessage(result.message || "Unable to send link. Please try again.", "error");
            button.enable();
            button.label = "Try Again";
        }

    } catch (error) {
        console.error("❌ CRITICAL ERROR sending magic link:", error);
        showMessage("System error. Please try again or call us at 239-332-2245.", "error");
        button.enable();
        button.label = originalLabel;
    }
}

/**
 * Handle WhatsApp OTP Flow (New)
 */
async function handleWhatsAppOTPFlow(phoneNumber) {
    const button = $w('#getStartedBtn');

    // Show loading state
    button.disable();
    const originalLabel = button.label;
    button.label = "Sending OTP...";
    showMessage("Sending verification code to WhatsApp...", "info");

    try {
        // Call backend to send WhatsApp OTP
        const result = await sendWhatsAppOTP(phoneNumber);

        console.log("📱 WhatsApp OTP result:", result);

        if (result.success) {
            // Success! Show OTP input
            button.label = "Code Sent! ✓";
            showMessage("Check WhatsApp for your verification code", "success");

            // Show OTP input box (if element exists)
            if ($w('#otpInputBox')) {
                $w('#otpInputBox').show();
                $w('#otpInputBox').expand();
                
                // Focus on OTP input
                if ($w('#otpInput')) {
                    $w('#otpInput').focus();
                }

                // Store phone number for validation
                if ($w('#otpInput')) {
                    $w('#otpInput').customData = { phoneNumber: phoneNumber };
                }
            }

            // Re-enable button for resend
            setTimeout(() => {
                button.enable();
                button.label = "Resend Code";
            }, 30000); // 30 seconds

        } else {
            // Error
            console.error("❌ WhatsApp OTP send failed:", result.message);
            showMessage(result.message || "Unable to send code. Please try again.", "error");
            button.enable();
            button.label = "Try Again";
        }

    } catch (error) {
        console.error("❌ CRITICAL ERROR sending WhatsApp OTP:", error);
        showMessage("System error. Please try again.", "error");
        button.enable();
        button.label = originalLabel;
    }
}

/**
 * Handle OTP Verification
 * Called when user clicks "Verify" button after entering OTP code
 */
async function handleVerifyOTP() {
    const otpInput = $w('#otpInput');
    const verifyBtn = $w('#verifyOtpBtn');
    const otpCode = otpInput.value ? otpInput.value.trim() : '';

    if (!otpCode) {
        showMessage("Please enter the verification code", "error");
        otpInput.focus();
        return;
    }

    if (otpCode.length !== 6) {
        showMessage("Code must be 6 digits", "error");
        otpInput.focus();
        return;
    }

    // Get phone number from custom data
    const phoneNumber = otpInput.customData?.phoneNumber;
    if (!phoneNumber) {
        showMessage("Session expired. Please request a new code.", "error");
        return;
    }

    console.log("🔐 Verifying OTP code...");

    // Show loading state
    verifyBtn.disable();
    const originalLabel = verifyBtn.label;
    verifyBtn.label = "Verifying...";
    showMessage("Verifying your code...", "info");

    try {
        // Call backend to validate OTP
        const result = await validateWhatsAppOTP(phoneNumber, otpCode);

        console.log("✅ OTP validation result:", result);

        if (result.valid && result.sessionToken) {
            // Success! Save session and redirect
            setSessionToken(result.sessionToken);
            showMessage("Login successful! Redirecting...", "success");
            
            // Redirect to appropriate portal
            setTimeout(() => {
                redirectToPortal(result.role);
            }, 1000);

        } else {
            // Invalid code
            console.error("❌ OTP validation failed:", result.error);
            showMessage(result.error || "Invalid code. Please try again.", "error");
            verifyBtn.enable();
            verifyBtn.label = originalLabel;
            otpInput.value = "";
            otpInput.focus();

            // Show attempts remaining if available
            if (result.attemptsRemaining !== undefined) {
                showMessage(`Invalid code. ${result.attemptsRemaining} attempts remaining.`, "error");
            }
        }

    } catch (error) {
        console.error("❌ CRITICAL ERROR verifying OTP:", error);
        showMessage("System error. Please try again.", "error");
        verifyBtn.enable();
        verifyBtn.label = originalLabel;
    }
}

/**
 * ADD TO setupSimplifiedLogin() function:
 * 
 * // Wire up OTP verification button (if exists)
 * if ($w('#verifyOtpBtn')) {
 *     $w('#verifyOtpBtn').onClick(handleVerifyOTP);
 *     console.log("✅ OTP verification button wired");
 * }
 * 
 * // Hide OTP input box by default
 * if ($w('#otpInputBox')) {
 *     $w('#otpInputBox').hide();
 *     $w('#otpInputBox').collapse();
 * }
 */
