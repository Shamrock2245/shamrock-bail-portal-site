/**
 * ============================================================================
 * Test_Suite.gs
 * ============================================================================
 * Manual verification triggers for the "Hardening & Expansion" phase.
 * Run these functions from the GAS Editor to verify system health.
 */

function TEST_1_SendTestSMS() {
    const props = PropertiesService.getScriptProperties();
    const testPhone = props.getProperty('TWILIO_TEST_PHONE'); // Optional: Set this or hardcode below

    // prompt for phone if not set? No, GAS cannot prompt in editor.
    // We will log instructions.

    if (!testPhone) {
        Logger.log("⚠️ Please set a script property 'TWILIO_TEST_PHONE' to your cell number to run this test.");
        return;
    }

    Logger.log(`📱 Sending Test SMS to ${testPhone}...`);
    const result = NotificationService.sendSms(testPhone, "✅ Shamrock GAS Backend: Test Message confirmed.");
    Logger.log(result);
}

function TEST_2_SendTestSlack() {
    Logger.log("💬 Sending Test Slack Alert...");
    const blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "✅ System Connection Test",
                "emoji": true
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "This is a test message from the new `NotificationService`. If you see this, Slack integration is healthy."
            }
        }
    ];

    const result = NotificationService.notifySlack('SLACK_WEBHOOK_GENERAL', { blocks: blocks });
    Logger.log(result);
}

function TEST_3_SimulateCriticalFailure() {
    // This validates the "Strike System" in Telemetry.gs
    Logger.log("🚨 Simulating 3 consecutive failures to trigger Critical Alert...");

    Telemetry.registerSuccess('TestModule'); // Reset first

    Telemetry.error('TestModule', 'Simulated Failure 1', true);
    Telemetry.error('TestModule', 'Simulated Failure 2', true);
    Telemetry.error('TestModule', 'Simulated Failure 3', true); // Should trigger Slack

    Logger.log("Check Slack for 'CRITICAL FAILURE' alert.");
}

function TEST_4_ValidateConfig() {
    Logger.log("🔍 Testing Config Validation...");

    // 1. Good Url
    const goodRes = isValidSlackWebhook_('https://hooks.slack.com/services/T123/B456/789');
    Logger.log(`Good URL Valid? ${goodRes} (Expected: true)`);

    // 2. Bad Url
    const badRes = isValidSlackWebhook_('https://google.com');
    Logger.log(`Bad URL Valid? ${badRes} (Expected: false)`);

    // 3. Good Phone
    const goodPhone = isValidPhone_('+12395550100');
    Logger.log(`Good Phone Valid? ${goodPhone} (Expected: true)`);

    // 4. Bad Phone
    const badPhone = isValidPhone_('invalid-phone');
    Logger.log(`Bad Phone Valid? ${badPhone} (Expected: false)`);
}

/**
 * MASTER TEST FUNCTION
 * Runs all non-destructive tests to verify system harmony.
 */
function TEST_ALL_SYSTEM_HARMONY() {
    Logger.log("🎹 Starting System Harmony Test...");
    TEST_2_SendTestSlack();
    TEST_4_ValidateConfig();
    Logger.log("✅ System Harmony Test Complete. (SMS/Critical Failure skipped to avoid spam/noise)");
}

function TEST_5_VerifyAILogic() {
    Logger.log("🧠 Testing AI Analyst Logic...");
    const testLead = {
        name: "Test Defendant",
        charges: "Grand Theft Auto",
        bond: "5000",
        residency: "Local",
        employment: "Unemployed",
        history: "First Offense",
        ties: "Family"
    };

    try {
        if (typeof AI_analyzeFlightRisk !== 'function') {
            throw new Error("AI_analyzeFlightRisk function not found!");
        }

        const result = AI_analyzeFlightRisk(testLead);
        Logger.log("AI Result: " + JSON.stringify(result));

        if (!result.riskLevel || !result.score) {
            throw new Error("Invalid AI Result structure");
        }
        Logger.log("✅ AI Logic Verification Passed!");
    } catch (e) {
        Logger.log("❌ AI Logic Verification Failed: " + e.message);
    }
}
