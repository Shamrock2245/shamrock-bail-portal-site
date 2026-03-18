/**
 * ============================================
 * TRIGGER SETUP - Install Automation Triggers
 * ============================================
 * This file contains functions to set up the automated triggers.
 * 
 * YOU ONLY RUN THESE FUNCTIONS ONCE during initial setup.
 */

/**
 * Install All Triggers
 *
 * Run this function ONCE to set up all automation triggers.
 * It is safe to re-run — existing triggers are removed first.
 *
 * HOW TO RUN:
 * 1. Click on this function name in the function dropdown
 * 2. Click the "Run" button (▶️ play icon)
 * 3. You'll be asked to authorize - click "Review Permissions" and allow
 *
 * TRIGGER INVENTORY (8 total):
 *   [1] runLeeArrestsNow              — every 1 hour
 *   [2] runAllCountyScrapers (Scout)  — every 6 hours (Charlotte/Collier/Hendry/Sarasota)
 *   [3] runTheCloser                  — every 30 minutes (abandoned intake drip)
 *   [4] processCourtDateEmails        — every 15 minutes
 *   [5] TG_processCourtDateReminders  — every 30 minutes
 *   [6] TG_processWeeklyPaymentProgress — Mondays at 10 AM ET
 *   [7] runAutoPostingEngine          — every 5 minutes (SocialPublisher)
 *   [8] sendDailySummaryToSlack       — daily at 5 PM ET
 */
function installAllTriggers() {

  // Remove all existing triggers first to prevent duplicates
  removeAllTriggers();

  Logger.log('╔═══════════════════════════════════════════╗');
  Logger.log('║  🔧 INSTALLING ALL SHAMROCK TRIGGERS       ║');
  Logger.log('╚═══════════════════════════════════════════╝');
  Logger.log('');

  var installed = 0;
  var errors = [];

  // [1] Lee County Arrest Scraper — every 1 hour
  try {
    ScriptApp.newTrigger('runLeeArrestsNow')
      .timeBased()
      .everyHours(1)
      .create();
    Logger.log('✅ [1/8] runLeeArrestsNow — every 1 hour');
    installed++;
  } catch (e) {
    Logger.log('❌ [1/8] runLeeArrestsNow FAILED: ' + e.message);
    errors.push('runLeeArrestsNow: ' + e.message);
  }

  // [2] The Scout — Charlotte, Collier, Hendry, Sarasota every 6 hours
  try {
    ScriptApp.newTrigger('runAllCountyScrapers')
      .timeBased()
      .everyHours(6)
      .create();
    Logger.log('✅ [2/8] runAllCountyScrapers (The Scout) — every 6 hours');
    Logger.log('         Covers: Charlotte, Collier, Hendry, Sarasota');
    installed++;
  } catch (e) {
    Logger.log('❌ [2/8] runAllCountyScrapers FAILED: ' + e.message);
    errors.push('runAllCountyScrapers: ' + e.message);
  }

  // [3] The Closer — abandoned intake drip campaign, every 30 minutes
  try {
    ScriptApp.newTrigger('runTheCloser')
      .timeBased()
      .everyMinutes(30)
      .create();
    Logger.log('✅ [3/8] runTheCloser (The Closer) — every 30 minutes');
    installed++;
  } catch (e) {
    Logger.log('❌ [3/8] runTheCloser FAILED: ' + e.message);
    errors.push('runTheCloser: ' + e.message);
  }

  // [4] Court Date Email Processor — every 15 minutes
  try {
    ScriptApp.newTrigger('processCourtDateEmails')
      .timeBased()
      .everyMinutes(15)
      .create();
    Logger.log('✅ [4/8] processCourtDateEmails — every 15 minutes');
    installed++;
  } catch (e) {
    Logger.log('❌ [4/8] processCourtDateEmails FAILED: ' + e.message);
    errors.push('processCourtDateEmails: ' + e.message);
  }

  // [5] Telegram Court Date Reminders — every 30 minutes
  try {
    ScriptApp.newTrigger('TG_processCourtDateReminders')
      .timeBased()
      .everyMinutes(30)
      .create();
    Logger.log('✅ [5/8] TG_processCourtDateReminders — every 30 minutes');
    installed++;
  } catch (e) {
    Logger.log('❌ [5/8] TG_processCourtDateReminders FAILED: ' + e.message);
    errors.push('TG_processCourtDateReminders: ' + e.message);
  }

  // [6] Weekly Payment Progress (Telegram) — Mondays at 10 AM ET
  try {
    ScriptApp.newTrigger('TG_processWeeklyPaymentProgress')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(10)
      .create();
    Logger.log('✅ [6/8] TG_processWeeklyPaymentProgress — Mondays at 10 AM ET');
    installed++;
  } catch (e) {
    Logger.log('❌ [6/8] TG_processWeeklyPaymentProgress FAILED: ' + e.message);
    errors.push('TG_processWeeklyPaymentProgress: ' + e.message);
  }

  // [7] Social Media Auto-Posting Engine — every 5 minutes
  try {
    ScriptApp.newTrigger('runAutoPostingEngine')
      .timeBased()
      .everyMinutes(5)
      .create();
    Logger.log('✅ [7/8] runAutoPostingEngine (SocialPublisher) — every 5 minutes');
    installed++;
  } catch (e) {
    Logger.log('❌ [7/8] runAutoPostingEngine FAILED: ' + e.message);
    errors.push('runAutoPostingEngine: ' + e.message);
  }

  // [8] Daily Slack Summary — 5 PM ET
  try {
    ScriptApp.newTrigger('sendDailySummaryToSlack')
      .timeBased()
      .atHour(17)
      .everyDays(1)
      .create();
    Logger.log('✅ [8/8] sendDailySummaryToSlack — daily at 5 PM ET');
    installed++;
  } catch (e) {
    Logger.log('❌ [8/8] sendDailySummaryToSlack FAILED: ' + e.message);
    errors.push('sendDailySummaryToSlack: ' + e.message);
  }

  // Summary
  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════╗');
  Logger.log('║  ✅ TRIGGER INSTALLATION COMPLETE          ║');
  Logger.log('║  Installed: ' + installed + '/8                           ║');
  Logger.log('║  Errors: ' + errors.length + '                              ║');
  Logger.log('╚═══════════════════════════════════════════╝');
  Logger.log('');
  Logger.log('The system will now:');
  Logger.log('  • Scrape Lee County arrests every hour');
  Logger.log('  • Scrape Charlotte, Collier, Hendry, Sarasota every 6 hours (The Scout)');
  Logger.log('  • Follow up on abandoned intakes every 30 minutes (The Closer)');
  Logger.log('  • Process court date emails every 15 minutes');
  Logger.log('  • Send Telegram court reminders every 30 minutes');
  Logger.log('  • Send weekly payment progress every Monday at 10 AM');
  Logger.log('  • Auto-post to social media every 5 minutes');
  Logger.log('  • Send daily Slack summary at 5 PM');

  if (errors.length > 0) {
    Logger.log('');
    Logger.log('⚠️ Errors encountered:');
    errors.forEach(function (e) { Logger.log('   • ' + e); });
  }

  return { installed: installed, errors: errors };
}

/**
 * Remove All Triggers
 * 
 * Run this function if you need to stop the automation or start fresh.
 * 
 * HOW TO RUN:
 * 1. Click on this function name in the function dropdown
 * 2. Click the "Run" button (▶️ play icon)
 */
function removeAllTriggers() {
  
  var triggers = ScriptApp.getProjectTriggers();
  
  Logger.log('🗑️ Removing ' + triggers.length + ' existing trigger(s)...');
  
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  
  Logger.log('✅ All triggers removed');
}

/**
 * List All Triggers
 * 
 * Run this to see what triggers are currently installed.
 * 
 * HOW TO RUN:
 * 1. Click on this function name in the function dropdown
 * 2. Click the "Run" button (▶️ play icon)
 * 3. Check the "Execution log" to see the list
 */
function listAllTriggers() {
  
  var triggers = ScriptApp.getProjectTriggers();
  
  Logger.log('📋 Currently installed triggers:');
  Logger.log('');
  
  if (triggers.length === 0) {
    Logger.log('  (No triggers installed)');
    return;
  }
  
  triggers.forEach(function(trigger, index) {
    Logger.log('  ' + (index + 1) + '. Function: ' + trigger.getHandlerFunction());
    Logger.log('     Type: ' + trigger.getEventType());
    Logger.log('     ID: ' + trigger.getUniqueId());
    Logger.log('');
  });
}
