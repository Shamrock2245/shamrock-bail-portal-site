/**
 * ============================================
 * THE SCOUT — Multi-County Arrest Scraper Runner
 * ============================================
 * Shamrock Bail Bonds — Phase 7 Growth Engine
 *
 * Unified runner for all county arrest scrapers.
 * Runs all active counties in sequence, logs results,
 * and sends a Slack summary.
 *
 * Active Counties:
 *   ✅ Lee County        — runLeeArrestsNow()      (hourly)
 *   ✅ Charlotte County  — runCharlotteCountyScrape() (every 6h)
 *   ✅ Collier County    — runCollierArrestsNow()  (every 6h)
 *   ✅ Hendry County     — runHendryArrestsNow()   (every 6h)
 *   ✅ Sarasota County   — runSarasotaArrestsNow() (every 6h)
 *
 * Trigger: runAllCountyScrapers() → every 6 hours via installAllTriggers()
 * Lee County runs separately on its own 1-hour trigger (highest volume).
 *
 * Date: 2026-03-18
 */

// =============================================================================
// UNIFIED RUNNER
// =============================================================================

/**
 * Run all county scrapers in sequence.
 * Lee County is excluded here — it has its own 1-hour trigger.
 * This runner handles Charlotte, Collier, Hendry, and Sarasota.
 */
function runAllCountyScrapers() {
  Logger.log('╔═══════════════════════════════════════════╗');
  Logger.log('║  🔍 THE SCOUT — Multi-County Scraper Run  ║');
  Logger.log('╚═══════════════════════════════════════════╝');

  var startTime = new Date();
  var results = {};
  var totalNew = 0;
  var errors = [];

  // ── Charlotte County ──────────────────────────────────────────────────────
  try {
    Logger.log('');
    Logger.log('▶ Charlotte County...');
    if (typeof runCharlotteCountyScrape === 'function') {
      runCharlotteCountyScrape();
      results.charlotte = { success: true };
      Logger.log('✅ Charlotte complete');
    } else {
      Logger.log('⚠️ runCharlotteCountyScrape not found');
      results.charlotte = { success: false, reason: 'function_missing' };
    }
  } catch (e) {
    Logger.log('❌ Charlotte error: ' + e.message);
    results.charlotte = { success: false, error: e.message };
    errors.push('Charlotte: ' + e.message);
  }

  // ── Collier County ────────────────────────────────────────────────────────
  try {
    Logger.log('');
    Logger.log('▶ Collier County...');
    if (typeof runCollierArrestsNow === 'function') {
      var collierResult = runCollierArrestsNow();
      results.collier = collierResult || { success: true };
      totalNew += (collierResult && collierResult.newArrests) ? collierResult.newArrests : 0;
      Logger.log('✅ Collier complete — ' + ((collierResult && collierResult.newArrests) || 0) + ' new');
    } else {
      Logger.log('⚠️ runCollierArrestsNow not found');
      results.collier = { success: false, reason: 'function_missing' };
    }
  } catch (e) {
    Logger.log('❌ Collier error: ' + e.message);
    results.collier = { success: false, error: e.message };
    errors.push('Collier: ' + e.message);
  }

  // ── Hendry County ─────────────────────────────────────────────────────────
  try {
    Logger.log('');
    Logger.log('▶ Hendry County...');
    if (typeof runHendryArrestsNow === 'function') {
      var hendryResult = runHendryArrestsNow();
      results.hendry = hendryResult || { success: true };
      totalNew += (hendryResult && hendryResult.newArrests) ? hendryResult.newArrests : 0;
      Logger.log('✅ Hendry complete — ' + ((hendryResult && hendryResult.newArrests) || 0) + ' new');
    } else {
      Logger.log('⚠️ runHendryArrestsNow not found');
      results.hendry = { success: false, reason: 'function_missing' };
    }
  } catch (e) {
    Logger.log('❌ Hendry error: ' + e.message);
    results.hendry = { success: false, error: e.message };
    errors.push('Hendry: ' + e.message);
  }

  // ── Sarasota County ───────────────────────────────────────────────────────
  try {
    Logger.log('');
    Logger.log('▶ Sarasota County...');
    if (typeof runSarasotaArrestsNow === 'function') {
      var sarasotaResult = runSarasotaArrestsNow();
      results.sarasota = sarasotaResult || { success: true };
      totalNew += (sarasotaResult && sarasotaResult.newArrests) ? sarasotaResult.newArrests : 0;
      Logger.log('✅ Sarasota complete — ' + ((sarasotaResult && sarasotaResult.newArrests) || 0) + ' new');
    } else {
      Logger.log('⚠️ runSarasotaArrestsNow not found');
      results.sarasota = { success: false, reason: 'function_missing' };
    }
  } catch (e) {
    Logger.log('❌ Sarasota error: ' + e.message);
    results.sarasota = { success: false, error: e.message };
    errors.push('Sarasota: ' + e.message);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  var duration = Math.round((Date.now() - startTime.getTime()) / 1000);
  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════╗');
  Logger.log('║  🔍 THE SCOUT — Run Complete               ║');
  Logger.log('║  Total new arrests: ' + totalNew + '                     ');
  Logger.log('║  Duration: ' + duration + 's                            ');
  Logger.log('║  Errors: ' + errors.length + '                              ');
  Logger.log('╚═══════════════════════════════════════════╝');

  // Slack summary
  try {
    var config = typeof getConfig === 'function' ? getConfig() : {};
    var slackUrl = config.SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY || config.SLACK_WEBHOOK_SHAMROCK || '';
    if (slackUrl && typeof sendSlackMessage === 'function') {
      var summary = '🔍 *The Scout* — Multi-county scrape complete\n' +
        '• Charlotte: ' + (results.charlotte && results.charlotte.success ? '✅' : '❌') + '\n' +
        '• Collier: ' + (results.collier && results.collier.success ? '✅ (' + ((results.collier.newArrests) || 0) + ' new)' : '❌') + '\n' +
        '• Hendry: ' + (results.hendry && results.hendry.success ? '✅ (' + ((results.hendry.newArrests) || 0) + ' new)' : '❌') + '\n' +
        '• Sarasota: ' + (results.sarasota && results.sarasota.success ? '✅ (' + ((results.sarasota.newArrests) || 0) + ' new)' : '❌') + '\n' +
        (errors.length > 0 ? '⚠️ Errors: ' + errors.join(', ') : '');
      sendSlackMessage(slackUrl, summary, null);
    }
  } catch (slackErr) {
    Logger.log('⚠️ Scout Slack summary failed (non-fatal): ' + slackErr.message);
  }

  return { success: true, totalNew: totalNew, duration: duration, results: results, errors: errors };
}

// =============================================================================
// TRIGGER SETUP
// =============================================================================

/**
 * Install the Scout trigger — runs all non-Lee county scrapers every 6 hours.
 * Called by installAllTriggers().
 */
function setupScoutTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'runAllCountyScrapers') {
      ScriptApp.deleteTrigger(t);
      Logger.log('🗑️ Removed existing Scout trigger');
    }
  });

  ScriptApp.newTrigger('runAllCountyScrapers')
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log('✅ The Scout trigger installed (every 6 hours)');
  Logger.log('   Covers: Charlotte, Collier, Hendry, Sarasota');
  Logger.log('   Lee County runs separately on its own 1-hour trigger');
}

/**
 * Manual test runner — run all counties once right now.
 */
function testTheScout() {
  Logger.log('🧪 TEST RUN — The Scout');
  return runAllCountyScrapers();
}
