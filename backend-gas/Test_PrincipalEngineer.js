/**
 * Test_PrincipalEngineer.js
 * Shamrock Bail Bonds — Verification tests for Principal Engineer Items 1-4.
 *
 * Run from GAS Editor: Select function → Run → Check Execution Logs.
 *
 * Tests:
 *   1. IdempotencyGuard — claim-on-check dedup logic
 *   2. TheCloser — Shannon status inclusion
 *   3. ElevenLabs Tool Auth — secret verification
 *   4. Telegram Auth — secret verification
 *
 * Date: 2026-03-04
 */

// =============================================================================
// TEST 1: IdempotencyGuard
// =============================================================================

/**
 * Verifies that IdempotencyGuard correctly prevents duplicate processing.
 */
function TEST_IdempotencyGuard() {
    Logger.log('═══ TEST: IdempotencyGuard ═══');

    // Use a unique key for each test run (avoid interference from previous runs)
    var testKey = 'test_' + Date.now();

    // First call: should NOT be duplicate
    var firstCall = IdempotencyGuard.isDuplicate('test', testKey, 60);
    Logger.log('  First call isDuplicate: ' + firstCall + ' (expected: false)');
    if (firstCall !== false) {
        Logger.log('  ❌ FAIL: First call should return false');
        return;
    }

    // Second call with same key: SHOULD be duplicate
    var secondCall = IdempotencyGuard.isDuplicate('test', testKey, 60);
    Logger.log('  Second call isDuplicate: ' + secondCall + ' (expected: true)');
    if (secondCall !== true) {
        Logger.log('  ❌ FAIL: Second call should return true');
        return;
    }

    // Different key: should NOT be duplicate
    var differentKey = IdempotencyGuard.isDuplicate('test', testKey + '_different', 60);
    Logger.log('  Different key isDuplicate: ' + differentKey + ' (expected: false)');
    if (differentKey !== false) {
        Logger.log('  ❌ FAIL: Different key should return false');
        return;
    }

    // CompositeKey test
    var composite = IdempotencyGuard.compositeKey('tool', '2395550178', '123');
    Logger.log('  Composite key: "' + composite + '" (expected: "tool|2395550178|123")');
    if (composite !== 'tool|2395550178|123') {
        Logger.log('  ❌ FAIL: Composite key format wrong');
        return;
    }

    // Null/empty eventId: should allow through
    var nullResult = IdempotencyGuard.isDuplicate('test', '', 60);
    Logger.log('  Empty eventId isDuplicate: ' + nullResult + ' (expected: false)');
    if (nullResult !== false) {
        Logger.log('  ❌ FAIL: Empty eventId should allow through');
        return;
    }

    Logger.log('  ✅ PASS: IdempotencyGuard working correctly');
    Logger.log('═══ TEST COMPLETE ═══');
}

// =============================================================================
// TEST 2: TheCloser scans Shannon intakes
// =============================================================================

/**
 * Verifies that TheCloser's ABANDONED_STATUSES includes Shannon's AI intake status.
 */
function TEST_CloserScansShannonIntakes() {
    Logger.log('═══ TEST: TheCloser Shannon Intake Coverage ═══');

    var statuses = CLOSER_CONFIG.ABANDONED_STATUSES;
    Logger.log('  ABANDONED_STATUSES: ' + JSON.stringify(statuses));

    // Check 'new - ai intake' is in the list
    var hasAiIntake = statuses.indexOf('new - ai intake') !== -1;
    Logger.log('  Contains "new - ai intake": ' + hasAiIntake + ' (expected: true)');
    if (!hasAiIntake) {
        Logger.log('  ❌ FAIL: "new - ai intake" not found in ABANDONED_STATUSES');
        return;
    }

    // Check Shannon template exists
    var shannonTemplate = CLOSER_MESSAGES['shannon'];
    Logger.log('  Shannon template exists: ' + !!shannonTemplate + ' (expected: true)');
    if (!shannonTemplate) {
        Logger.log('  ❌ FAIL: Shannon drip template not found');
        return;
    }

    // Verify correct phone number
    var hasCorrectPhone = shannonTemplate.sms.indexOf('955-0178') !== -1;
    Logger.log('  Shannon SMS has correct phone: ' + hasCorrectPhone + ' (expected: true)');
    if (!hasCorrectPhone) {
        Logger.log('  ❌ FAIL: Shannon SMS template has wrong phone number');
        return;
    }

    Logger.log('  ✅ PASS: TheCloser correctly scans Shannon intakes');
    Logger.log('═══ TEST COMPLETE ═══');
}

// =============================================================================
// TEST 3: ElevenLabs Tool Auth
// =============================================================================

/**
 * Verifies that verifyElevenLabsToolSecret_ rejects unauthorized requests
 * when ELEVENLABS_TOOL_SECRET is configured.
 */
function TEST_ElevenLabsToolAuth() {
    Logger.log('═══ TEST: ElevenLabs Tool Auth ═══');

    if (typeof verifyElevenLabsToolSecret_ !== 'function') {
        Logger.log('  ❌ FAIL: verifyElevenLabsToolSecret_ function not found');
        return;
    }

    // Check if secret is configured
    var secret = PropertiesService.getScriptProperties().getProperty('ELEVENLABS_TOOL_SECRET');
    if (!secret) {
        Logger.log('  ⚠️ ELEVENLABS_TOOL_SECRET not configured — auth is in activation mode (all requests allowed)');
        Logger.log('  ℹ️ Set this property to enforce auth. Test will validate activation mode.');

        // In activation mode, any request should pass
        var activationResult = verifyElevenLabsToolSecret_({ parameter: {} });
        Logger.log('  Activation mode allows request: ' + activationResult + ' (expected: true)');
        if (activationResult !== true) {
            Logger.log('  ❌ FAIL: Activation mode should allow all requests');
            return;
        }
        Logger.log('  ✅ PASS (activation mode): Auth check correctly bypasses');
    } else {
        // Secret is set — test reject and accept
        var wrongSecret = verifyElevenLabsToolSecret_({ parameter: { secret: 'wrong-secret' } });
        Logger.log('  Wrong secret rejected: ' + !wrongSecret + ' (expected: true)');
        if (wrongSecret !== false) {
            Logger.log('  ❌ FAIL: Wrong secret should be rejected');
            return;
        }

        var correctSecret = verifyElevenLabsToolSecret_({ parameter: { secret: secret } });
        Logger.log('  Correct secret accepted: ' + correctSecret + ' (expected: true)');
        if (correctSecret !== true) {
            Logger.log('  ❌ FAIL: Correct secret should be accepted');
            return;
        }
        Logger.log('  ✅ PASS: Auth correctly rejects/accepts');
    }

    Logger.log('═══ TEST COMPLETE ═══');
}

// =============================================================================
// TEST 4: Telegram Auth
// =============================================================================

/**
 * Verifies that verifyTelegramWebhookSecret_ rejects unauthorized requests
 * when TELEGRAM_WEBHOOK_SECRET is configured.
 */
function TEST_TelegramAuth() {
    Logger.log('═══ TEST: Telegram Webhook Auth ═══');

    if (typeof verifyTelegramWebhookSecret_ !== 'function') {
        Logger.log('  ❌ FAIL: verifyTelegramWebhookSecret_ function not found');
        return;
    }

    var secret = PropertiesService.getScriptProperties().getProperty('TELEGRAM_WEBHOOK_SECRET');
    if (!secret) {
        Logger.log('  ⚠️ TELEGRAM_WEBHOOK_SECRET not configured — auth is in activation mode');
        Logger.log('  ℹ️ Set this property to enforce auth.');

        var activationResult = verifyTelegramWebhookSecret_({ parameter: {}, postData: { contents: '{}' } });
        Logger.log('  Activation mode allows request: ' + activationResult + ' (expected: true)');
        if (activationResult !== true) {
            Logger.log('  ❌ FAIL: Activation mode should allow all requests');
            return;
        }
        Logger.log('  ✅ PASS (activation mode): Correctly bypasses');
    } else {
        // Test reject
        var wrongResult = verifyTelegramWebhookSecret_({
            parameter: {},
            postData: { contents: JSON.stringify({ webhookSecret: 'wrong' }) }
        });
        Logger.log('  Wrong secret rejected: ' + !wrongResult + ' (expected: true)');
        if (wrongResult !== false) {
            Logger.log('  ❌ FAIL: Wrong secret should be rejected');
            return;
        }

        // Test accept via body
        var correctResult = verifyTelegramWebhookSecret_({
            parameter: {},
            postData: { contents: JSON.stringify({ webhookSecret: secret }) }
        });
        Logger.log('  Correct secret accepted: ' + correctResult + ' (expected: true)');
        if (correctResult !== true) {
            Logger.log('  ❌ FAIL: Correct secret should be accepted');
            return;
        }

        Logger.log('  ✅ PASS: Auth correctly rejects/accepts');
    }

    Logger.log('═══ TEST COMPLETE ═══');
}

// =============================================================================
// MASTER TEST — Run all Principal Engineer tests
// =============================================================================

function TEST_PRINCIPAL_ENGINEER_ALL() {
    Logger.log('╔═══════════════════════════════════════════════╗');
    Logger.log('║  PRINCIPAL ENGINEER — FULL TEST SUITE         ║');
    Logger.log('╚═══════════════════════════════════════════════╝');
    Logger.log('');

    TEST_IdempotencyGuard();
    Logger.log('');
    TEST_CloserScansShannonIntakes();
    Logger.log('');
    TEST_ElevenLabsToolAuth();
    Logger.log('');
    TEST_TelegramAuth();

    Logger.log('');
    Logger.log('════════════════════════════════════════════════');
    Logger.log('  All Principal Engineer tests executed.');
    Logger.log('  Review logs above for ✅/❌ results.');
    Logger.log('════════════════════════════════════════════════');
}

// =============================================================================
// ONE-TIME SETUP — Set auth secrets in Script Properties
// Run once, then delete or comment out.
// =============================================================================

function SETUP_SetAuthSecrets() {
    var props = PropertiesService.getScriptProperties();

    props.setProperty('ELEVENLABS_TOOL_SECRET', 'XpOeDHyVYjmOooI0aQYi7632gYoC6cFGKV546tuODMc');
    props.setProperty('TELEGRAM_WEBHOOK_SECRET', '10F3oEWzaUB7sLqaYOvGDJwxUx3iOO5W3oeZemB1S7I');

    Logger.log('✅ Auth secrets set in Script Properties:');
    Logger.log('  ELEVENLABS_TOOL_SECRET: ' + props.getProperty('ELEVENLABS_TOOL_SECRET').substring(0, 6) + '...');
    Logger.log('  TELEGRAM_WEBHOOK_SECRET: ' + props.getProperty('TELEGRAM_WEBHOOK_SECRET').substring(0, 6) + '...');
    Logger.log('');
    Logger.log('⚠️ IMPORTANT: These same values must also be set in:');
    Logger.log('  1. Netlify env var: ELEVENLABS_TOOL_SECRET');
    Logger.log('  2. Wix Secret: TELEGRAM_WEBHOOK_SECRET');
    Logger.log('  3. ElevenLabs tool webhook URLs: append ?secret=XpOeDHyV... to elevenlabs_tool URLs');
}
