/**
 * run_activations.js
 * Shamrock Bail Bonds — GAS Activation Runner
 *
 * One-click function to execute all activation/verification functions
 * from the Manus handoff. Run this once in the GAS editor to:
 *   1. Verify the historical bond index loads
 *   2. Fire a test repeat-offender alert
 *   3. Install the daily 6 AM safety-net trigger
 *   4. Test the Telegram bot connection
 *   5. Discover the Google Business Profile location ID
 *
 * Date: 2026-02-25
 */

// =============================================================================
// MASTER RUNNER
// =============================================================================

/**
 * Run all 5 activation functions in sequence.
 * Open the GAS Execution Log to see results.
 */
function runAllActivations() {
    const results = {};

    Logger.log('═══════════════════════════════════════════');
    Logger.log('🍀 SHAMROCK ACTIVATION RUNNER — Starting');
    Logger.log('═══════════════════════════════════════════');
    Logger.log('');

    // 1. Historical Bond Index
    Logger.log('▶ Step 1/5: testHistoricalBondIndex()');
    try {
        if (typeof testHistoricalBondIndex === 'function') {
            results.bondIndex = testHistoricalBondIndex();
            Logger.log('✅ Bond index loaded successfully');
            Logger.log('   Result: ' + JSON.stringify(results.bondIndex));
        } else {
            results.bondIndex = { error: 'Function not found' };
            Logger.log('⚠️ testHistoricalBondIndex not found — is HistoricalBondMonitor.js deployed?');
        }
    } catch (e) {
        results.bondIndex = { error: e.message };
        Logger.log('❌ Bond index test failed: ' + e.message);
    }
    Logger.log('');

    // 2. Test Repeat Offender Alert
    Logger.log('▶ Step 2/5: testRepeatOffenderAlert()');
    try {
        if (typeof testRepeatOffenderAlert === 'function') {
            results.alertTest = testRepeatOffenderAlert();
            Logger.log('✅ Test alert fired successfully');
            Logger.log('   Result: ' + JSON.stringify(results.alertTest));
        } else {
            results.alertTest = { error: 'Function not found' };
            Logger.log('⚠️ testRepeatOffenderAlert not found — is HistoricalBondMonitor.js deployed?');
        }
    } catch (e) {
        results.alertTest = { error: e.message };
        Logger.log('❌ Alert test failed: ' + e.message);
    }
    Logger.log('');

    // 3. Setup Daily Trigger
    Logger.log('▶ Step 3/5: setupRepeatOffenderTrigger()');
    try {
        if (typeof setupRepeatOffenderTrigger === 'function') {
            results.trigger = setupRepeatOffenderTrigger();
            Logger.log('✅ Daily trigger installed (6 AM ET)');
            Logger.log('   Result: ' + JSON.stringify(results.trigger));
        } else {
            results.trigger = { error: 'Function not found' };
            Logger.log('⚠️ setupRepeatOffenderTrigger not found');
        }
    } catch (e) {
        results.trigger = { error: e.message };
        Logger.log('❌ Trigger setup failed: ' + e.message);
    }
    Logger.log('');

    // 4. Test Telegram Connection
    Logger.log('▶ Step 4/5: testTelegramConnection()');
    try {
        if (typeof testTelegramConnection === 'function') {
            results.telegram = testTelegramConnection();
            Logger.log('✅ Telegram connection verified');
            Logger.log('   Result: ' + JSON.stringify(results.telegram));
        } else {
            results.telegram = { error: 'Function not found' };
            Logger.log('⚠️ testTelegramConnection not found — is Telegram_API.js deployed?');
        }
    } catch (e) {
        results.telegram = { error: e.message };
        Logger.log('❌ Telegram test failed: ' + e.message);
    }
    Logger.log('');

    // 5. Discover GBP Location
    Logger.log('▶ Step 5/5: discoverGBPLocation()');
    try {
        if (typeof discoverGBPLocation === 'function') {
            results.gbp = discoverGBPLocation();
            Logger.log('✅ GBP location discovery complete');
            Logger.log('   Result: ' + JSON.stringify(results.gbp));
        } else {
            results.gbp = { error: 'Function not found' };
            Logger.log('⚠️ discoverGBPLocation not found — is ScriptProperties_Temp.js deployed?');
        }
    } catch (e) {
        results.gbp = { error: e.message };
        Logger.log('❌ GBP discovery failed: ' + e.message);
    }

    Logger.log('');
    Logger.log('═══════════════════════════════════════════');
    Logger.log('🍀 ACTIVATION RUNNER — Complete');
    Logger.log('═══════════════════════════════════════════');
    Logger.log('');
    Logger.log('Full Results:');
    Logger.log(JSON.stringify(results, null, 2));

    return results;
}
