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
 * 
 * HOW TO RUN:
 * 1. Click on this function name in the function dropdown
 * 2. Click the "Run" button (▶️ play icon)
 * 3. You'll be asked to authorize - click "Review Permissions" and allow
 */
function installAllTriggers() {
  
  // First, remove any existing triggers to avoid duplicates
  removeAllTriggers();
  
  Logger.log('🔧 Installing triggers...');
  
  // Create trigger for business hours (every 15 minutes)
  ScriptApp.newTrigger('processCourtDateEmails')
    .timeBased()
    .everyMinutes(15)
    .create();
  
  Logger.log('✅ Created trigger: processCourtDateEmails (every 15 minutes)');
  
  // Optional: Create daily summary trigger (runs at 5 PM)
  ScriptApp.newTrigger('sendDailySummaryToSlack')
    .timeBased()
    .atHour(17) // 5 PM
    .everyDays(1)
    .create();
  
  Logger.log('✅ Created trigger: sendDailySummaryToSlack (daily at 5 PM)');
  
  Logger.log('');
  Logger.log('🎉 All triggers installed successfully!');
  Logger.log('');
  Logger.log('The system will now:');
  Logger.log('  • Check for court date emails every 15 minutes');
  Logger.log('  • Only process during business hours or hourly after hours');
  Logger.log('  • Send daily summaries at 5 PM');
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
