/**
 * ============================================================================
 * Setup_Properties_WhatsApp.js
 * ============================================================================
 * WhatsApp Cloud API Configuration Update
 * 
 * INSTRUCTIONS:
 * 1. Add these properties to the MASTER_CONFIG object in Setup_Properties.js
 * 2. Fill in the actual values from Meta Developer Dashboard
 * 3. Run RUN_UpdateAllProperties() to apply
 * 
 * SETUP STEPS:
 * 1. Go to https://developers.facebook.com/apps
 * 2. Create app with "WhatsApp Business" use case (or use existing)
 * 3. Add WhatsApp product to app
 * 4. Get Phone Number ID from WhatsApp > API Setup
 * 5. Generate System User permanent access token
 * 6. Create authentication template named "shamrock_otp"
 * ============================================================================
 */

// ADD TO MASTER_CONFIG IN Setup_Properties.js:

const WHATSAPP_CONFIG = {
    // [WHATSAPP CLOUD API] - Direct Meta Integration (No Twilio)
    "WHATSAPP_ACCESS_TOKEN": "", // System User permanent access token
    "WHATSAPP_PHONE_NUMBER_ID": "", // From WhatsApp > API Setup
    "WHATSAPP_BUSINESS_ACCOUNT_ID": "", // From Business Settings
    "WHATSAPP_APP_SECRET": "", // For webhook verification
    "WHATSAPP_VERIFY_TOKEN": "", // Custom token for webhook verification (create your own)
    "WHATSAPP_AUTH_TEMPLATE_NAME": "shamrock_otp", // Authentication template name
};

/**
 * EXAMPLE FILLED CONFIG:
 * 
 * "WHATSAPP_ACCESS_TOKEN": "EAABsbCS1iHgBO7ZC9wZBfkKZCqZBZB...",
 * "WHATSAPP_PHONE_NUMBER_ID": "123456789012345",
 * "WHATSAPP_BUSINESS_ACCOUNT_ID": "987654321098765",
 * "WHATSAPP_APP_SECRET": "abc123def456...",
 * "WHATSAPP_VERIFY_TOKEN": "shamrock_webhook_2026",
 * "WHATSAPP_AUTH_TEMPLATE_NAME": "shamrock_otp",
 */

/**
 * AUTHENTICATION TEMPLATE CREATION:
 * 
 * 1. Go to Meta Business Manager > WhatsApp Manager
 * 2. Navigate to Message Templates
 * 3. Click "Create Template"
 * 4. Select "Authentication" category
 * 5. Name: shamrock_otp
 * 6. Language: English (US)
 * 7. Template content (auto-filled by Meta):
 *    Body: "*{{1}}* is your verification code. For your security, do not share this code."
 *    Footer: "This code expires in 10 minutes."
 *    Button: "Copy code" (OTP type)
 * 8. Submit for approval (usually approved in 1-2 hours)
 */

/**
 * WEBHOOK CONFIGURATION:
 * 
 * 1. In Meta App Dashboard > WhatsApp > Configuration
 * 2. Webhook URL: {GAS_WEB_APP_URL}?source=whatsapp
 * 3. Verify Token: Use the value you set in WHATSAPP_VERIFY_TOKEN
 * 4. Subscribe to: messages, message_status
 * 5. Save and verify
 */

/**
 * TESTING:
 * 
 * 1. Run AUDIT_CurrentProperties() to verify all properties are set
 * 2. Test WhatsApp API connection:
 *    - Run testWhatsAppConnection() (see below)
 * 3. Test OTP send:
 *    - Run testWhatsAppOTP() with your phone number
 */

function testWhatsAppConnection() {
    const client = new WhatsAppCloudAPI();
    
    if (!client.isConfigured()) {
        console.error("❌ WhatsApp Cloud API not configured!");
        return;
    }
    
    console.log("✅ WhatsApp Cloud API is configured");
    console.log("Phone Number ID:", client.phoneNumberId);
    console.log("Business Account ID:", client.businessAccountId);
    
    // Test sending a simple text message to yourself
    const testPhone = "+12399550178"; // Replace with your test number
    const result = client.sendText(testPhone, "🎉 WhatsApp Cloud API is working! This is a test message from Shamrock Bail Bonds.");
    
    console.log("Test message result:", result);
    return result;
}

function testWhatsAppOTP() {
    const testPhone = "+12399550178"; // Replace with your test number
    const result = WA_sendOTP(testPhone);
    
    console.log("OTP send result:", result);
    return result;
}
