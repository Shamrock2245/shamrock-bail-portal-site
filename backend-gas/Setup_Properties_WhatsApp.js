/**
 * ============================================================================
 * Setup_Properties_WhatsApp.js
 * Shamrock Bail Bonds — Google Apps Script
 * ============================================================================
 *
 * QUICK SETUP GUIDE (do this once, then you are done):
 *
 * STEP 1 — Get your credentials from Meta
 *   a. Go to https://developers.facebook.com/apps → your Shamrock app
 *   b. WhatsApp > API Setup → copy "Phone number ID" (16-digit number)
 *   c. WhatsApp > API Setup → generate a temporary token (or create a
 *      System User with permanent token in Business Settings > System Users)
 *   d. App Settings > Basic → copy "App Secret"
 *   e. Business Settings → copy "Business Account ID" (also called WABA ID)
 *
 * STEP 2 — Fill in the values below
 *
 * STEP 3 — Run RUN_SetupWhatsAppProperties() in this file
 *
 * STEP 4 — Run testWhatsAppConnection() to verify
 *
 * STEP 5 — Register the Wix webhook in Meta:
 *   Callback URL:  https://www.shamrockbailbonds.biz/_functions/webhookWhatsApp
 *   Verify Token:  (same value as WHATSAPP_WEBHOOK_VERIFY_TOKEN below)
 *   Subscribe to:  messages, message_status_updates
 *
 * STEP 6 — Add the same secrets to Wix Secrets Manager:
 *   WHATSAPP_ACCESS_TOKEN
 *   WHATSAPP_PHONE_NUMBER_ID
 *   WHATSAPP_APP_SECRET
 *   WHATSAPP_WEBHOOK_VERIFY_TOKEN
 *
 * STEP 7 — Create the 5 message templates in WhatsApp Manager
 *   (see TEMPLATE CREATION GUIDE at the bottom of this file)
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// FILL IN YOUR VALUES HERE
// ─────────────────────────────────────────────────────────────────────────────

const WA_SETUP_VALUES = {
    // From Meta App Dashboard > WhatsApp > API Setup
    WHATSAPP_PHONE_NUMBER_ID:       '',   // e.g. '945804478623321'
    WHATSAPP_ACCESS_TOKEN:          '',   // Permanent System User token
    WHATSAPP_BUSINESS_ACCOUNT_ID:   '3050872911967629', // Your WABA ID (confirmed)
    WHATSAPP_APP_SECRET:            '',   // App Secret from App Settings > Basic

    // Choose any random string — must match what you enter in Meta webhook config
    WHATSAPP_WEBHOOK_VERIFY_TOKEN:  'shamrock_webhook_verify_2026',

    // Template names — MUST match exactly what you create in WhatsApp Manager
    WHATSAPP_AUTH_TEMPLATE_NAME:         'shamrock_otp_login',       // Authentication OTP
    WHATSAPP_COURT_TEMPLATE_NAME:        'court_date_reminder',      // Court date reminder
    WHATSAPP_DOCUMENT_TEMPLATE_NAME:     'document_signature_request', // SignNow signing link
    WHATSAPP_PAYMENT_TEMPLATE_NAME:      'payment_request',          // Payment link
    WHATSAPP_FOLLOWUP_TEMPLATE_NAME:     'general_followup',         // Stealth ping / check-in

    // Business info
    SHAMROCK_OFFICE_PHONE:          '(239) 332-2245',
    SHAMROCK_CELL_PHONE:            '(239) 955-0178',   // Confirmed WhatsApp number
    SHAMROCK_WA_NUMBER:             '+12399550178',     // E.164 format for API calls
    PAYMENT_LINK:                   'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd'
};

// ─────────────────────────────────────────────────────────────────────────────
// RUN THIS FUNCTION to apply the values above to Script Properties
// ─────────────────────────────────────────────────────────────────────────────

function RUN_SetupWhatsAppProperties() {
    const props = PropertiesService.getScriptProperties();
    let set = 0;
    let skipped = 0;

    for (const [key, value] of Object.entries(WA_SETUP_VALUES)) {
        if (value && value.trim && value.trim() !== '') {
            props.setProperty(key, value);
            console.log('Set: ' + key);
            set++;
        } else {
            console.warn('Skipped (empty): ' + key);
            skipped++;
        }
    }

    console.log('\n✅ WhatsApp properties setup complete.');
    console.log('   Set: ' + set + ' | Skipped (empty): ' + skipped);
    console.log('\nNext steps:');
    console.log('  1. Run testWhatsAppConnection() to verify API access');
    console.log('  2. Run testWhatsAppOTP() to test OTP send to +12399550178');
    console.log('  3. Register webhook in Meta: https://www.shamrockbailbonds.biz/_functions/webhookWhatsApp');
    console.log('  4. Add same secrets to Wix Secrets Manager');
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT — check what is currently set
// ─────────────────────────────────────────────────────────────────────────────

function AUDIT_WhatsAppProperties() {
    const props = PropertiesService.getScriptProperties();
    const keys = [
        'WHATSAPP_PHONE_NUMBER_ID',
        'WHATSAPP_ACCESS_TOKEN',
        'WHATSAPP_BUSINESS_ACCOUNT_ID',
        'WHATSAPP_APP_SECRET',
        'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
        'WHATSAPP_AUTH_TEMPLATE_NAME',
        'WHATSAPP_COURT_TEMPLATE_NAME',
        'WHATSAPP_DOCUMENT_TEMPLATE_NAME',
        'WHATSAPP_PAYMENT_TEMPLATE_NAME',
        'WHATSAPP_FOLLOWUP_TEMPLATE_NAME',
        'SHAMROCK_OFFICE_PHONE',
        'SHAMROCK_CELL_PHONE',
        'SHAMROCK_WA_NUMBER',
        'PAYMENT_LINK'
    ];

    console.log('\n=== WhatsApp Property Audit ===');
    let allSet = true;
    for (const key of keys) {
        const val = props.getProperty(key);
        if (val) {
            const display = (key.includes('TOKEN') || key.includes('SECRET'))
                ? val.substring(0, 8) + '...' + val.substring(val.length - 4)
                : val;
            console.log('✅ ' + key + ': ' + display);
        } else {
            console.warn('❌ ' + key + ': NOT SET');
            allSet = false;
        }
    }
    console.log('\n' + (allSet
        ? '✅ All WhatsApp properties configured!'
        : '⚠️  Some properties are missing — fill in WA_SETUP_VALUES and run RUN_SetupWhatsAppProperties()'));
    return allSet;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Test WhatsApp Cloud API connectivity.
 * Run this after setting up properties.
 */
function testWhatsAppConnection() {
    const client = new WhatsAppCloudAPI();

    if (!client.isConfigured()) {
        console.error('❌ WhatsApp Cloud API not configured! Run RUN_SetupWhatsAppProperties() first.');
        return { success: false, error: 'Not configured' };
    }

    console.log('✅ WhatsApp Cloud API is configured');
    console.log('   Phone Number ID:', client.phoneNumberId);
    console.log('   Business Account ID:', client.businessAccountId);

    const testPhone = '+12399550178'; // Shamrock business cell — confirmed WhatsApp number
    const result = client.sendText(testPhone,
        '✅ WhatsApp Cloud API test — Shamrock Bail Bonds system is connected and working! ' +
        new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    );

    console.log('Test message result:', JSON.stringify(result));
    return result;
}

/**
 * Test OTP send to the business cell.
 */
function testWhatsAppOTP() {
    const testPhone = '+12399550178'; // Shamrock business cell
    console.log('Sending test OTP to ' + testPhone + '...');
    const result = WA_sendOTP(testPhone);
    console.log('OTP result:', JSON.stringify(result));
    return result;
}

/**
 * Test the full inbound message handler.
 */
function testWhatsAppInbound() {
    const testData = {
        from:      '12399550178',
        name:      'Test User',
        messageId: 'test_' + Date.now(),
        type:      'text',
        body:      'HERE',
        timestamp: String(Math.floor(Date.now() / 1000))
    };
    console.log('Testing inbound handler with:', JSON.stringify(testData));
    const result = handleWhatsAppInbound(testData);
    console.log('Result:', JSON.stringify(result));
    return result;
}

/**
 * Test a court date reminder.
 */
function testCourtDateReminder() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const caseData = {
        defendantPhone:  '+12399550178',
        defendantName:   'Test Defendant',
        indemnitorPhone: '',
        indemnitorName:  '',
        courtDate:       tomorrow.toLocaleDateString('en-US'),
        courtTime:       '9:00 AM',
        courtroom:       'Lee County Courthouse, Room 4A',
        caseNumber:      'TEST-2026-001'
    };

    console.log('Sending 1-day court reminder to ' + caseData.defendantPhone + '...');
    const result = WA_notifyCourtDateReminder(caseData, 1);
    console.log('Result:', JSON.stringify(result));
    return result;
}

/**
 * Test document signature request template.
 */
function testDocumentSignatureRequest() {
    const result = WA_notifyDocumentReadyObj({
        memberPhone:  '+12399550178',
        memberName:   'Test Indemnitor',
        signingLink:  'https://app.signnow.com/webapp/document/test123'
    });
    console.log('Document signature result:', JSON.stringify(result));
    return result;
}

/**
 * Test payment request template.
 */
function testPaymentRequest() {
    const result = WA_notifyPaymentOverdueObj({
        indemnitorPhone: '+12399550178',
        indemnitorName:  'Test Indemnitor',
        amountDue:       '250.00',
        dueDate:         'March 1, 2026'
    });
    console.log('Payment request result:', JSON.stringify(result));
    return result;
}

/**
 * Test ElevenLabs audio send.
 */
function testElevenLabsAudio() {
    // Replace with a real ElevenLabs audio URL to test
    const testAudioUrl = 'https://api.elevenlabs.io/v1/text-to-speech/test/stream';
    const result = WA_sendVoiceNote('+12399550178', testAudioUrl, 'Test voice note from Shamrock AI');
    console.log('Audio send result:', JSON.stringify(result));
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE CREATION GUIDE
// ─────────────────────────────────────────────────────────────────────────────
/*
 * Create these 5 templates in WhatsApp Manager > Message Templates.
 * Go to: https://business.facebook.com/latest/whatsapp_manager/message_templates
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE 1: shamrock_otp_login  (Authentication)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Category: Authentication
 *   Name: shamrock_otp_login
 *   Language: English (US)
 *   Body: {{1}} is your Shamrock Bail Bonds verification code.
 *   Footer: This code expires in 10 minutes.
 *   Button: Copy Code (OTP type — Meta auto-generates)
 *   → Do NOT fill in "Package name" or "App signature hash" — leave blank
 *   → Select "Copy code" button type (NOT "One-tap autofill")
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE 2: court_date_reminder  (Utility)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Category: Utility
 *   Name: court_date_reminder
 *   Language: English (US)
 *   Header: Court Date Reminder
 *   Body: Hello {{1}}, this is a reminder for your court date on {{2}} at {{3}}.
 *         Location: {{4}}. Case #: {{5}}. Failure to appear may result in a warrant.
 *   Footer: Shamrock Bail Bonds • (239) 332-2245
 *   Buttons:
 *     - Call Phone Number: "Call Office" → +12393322245
 *     - Quick Reply: "I will be there"
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE 3: document_signature_request  (Utility)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Category: Utility
 *   Name: document_signature_request
 *   Language: English (US)
 *   Body: Hello {{1}}, your bail documents are ready for signature.
 *         Please sign them immediately here: {{2}}
 *   Footer: Shamrock Bail Bonds
 *   Button:
 *     - Visit Website: "Sign Documents" → Dynamic URL ({{1}})
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE 4: payment_request  (Utility)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Category: Utility
 *   Name: payment_request
 *   Language: English (US)
 *   Body: Hello {{1}}, this is a notice regarding your payment of {{2}}.
 *         Status: {{3}}. Please pay securely here: {{4}}
 *   Footer: Shamrock Bail Bonds
 *   Button:
 *     - Visit Website: "Pay Now" → Dynamic URL ({{1}})
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TEMPLATE 5: general_followup  (Utility)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Category: Utility
 *   Name: general_followup
 *   Language: English (US)
 *   Body: Hello {{1}}, please confirm you received this message regarding
 *         your bond status. Reference: {{2}}
 *   Buttons:
 *     - Quick Reply: "Confirm Receipt"
 *     - Quick Reply: "Call Me"
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTE: While templates are pending approval (usually 1-2 hours), the system
 * automatically falls back to plain text messages for any open conversations.
 * ─────────────────────────────────────────────────────────────────────────────
 */
