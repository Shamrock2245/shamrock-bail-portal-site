/**
 * =====================================================================
 * TRIGGER SETUP — Shamrock Automation Trigger Management
 * =====================================================================
 * Data-driven trigger registry for the 8 core automation triggers.
 * Supports: install all, remove all, granular per-module control.
 *
 * @author  Shamrock Automation
 * @version 3.0.0
 * @updated 2026-04-17
 */

// ====================================================================
// TRIGGER REGISTRY — Single source of truth for all core triggers
// ====================================================================

var TRIGGER_REGISTRY = [
  { id: 1, name: 'Lee County Scraper',    fn: 'runLeeArrestsNow',               type: 'hours',   interval: 1,  desc: 'Scrapes Lee County jail roster' },
  { id: 2, name: 'The Scout (Multi)',      fn: 'runAllCountyScrapers',           type: 'hours',   interval: 6,  desc: 'Charlotte, Collier, Hendry, Sarasota' },
  { id: 3, name: 'The Closer',            fn: 'runTheCloser',                   type: 'minutes', interval: 30, desc: 'Abandoned intake drip campaign' },
  { id: 4, name: 'Court Email Processor',  fn: 'processCourtDateEmails',         type: 'minutes', interval: 15, desc: 'Parses court date notification emails' },
  { id: 5, name: 'TG Court Reminders',    fn: 'TG_processCourtDateReminders',   type: 'minutes', interval: 30, desc: 'Sends Telegram court date reminders' },
  { id: 6, name: 'TG Weekly Payments',    fn: 'TG_processWeeklyPaymentProgress', type: 'weekly',  day: 'MONDAY', hour: 10, desc: 'Monday payment progress via Telegram' },
  { id: 7, name: 'Social Auto-Posting',   fn: 'runAutoPostingEngine',           type: 'minutes', interval: 5,  desc: 'Social media auto-posting engine' },
  { id: 8, name: 'Daily Slack Summary',   fn: 'sendDailySummaryToSlack',        type: 'daily',   hour: 17,     desc: 'End-of-day ops summary to Slack' }
];


/**
 * Install All Triggers
 *
 * Run this function to set up all 8 core automation triggers.
 * Safe to re-run — existing triggers are removed first.
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
  var total = TRIGGER_REGISTRY.length;

  TRIGGER_REGISTRY.forEach(function(reg) {
    try {
      createTriggerFromRegistry_(reg);
      Logger.log('✅ [' + reg.id + '/' + total + '] ' + reg.fn + ' — ' + formatSchedule_(reg));
      installed++;
    } catch (e) {
      Logger.log('❌ [' + reg.id + '/' + total + '] ' + reg.fn + ' FAILED: ' + e.message);
      errors.push(reg.fn + ': ' + e.message);
    }
  });

  // Summary
  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════╗');
  Logger.log('║  ✅ TRIGGER INSTALLATION COMPLETE          ║');
  Logger.log('║  Installed: ' + installed + '/' + total + '                           ║');
  Logger.log('║  Errors: ' + errors.length + '                              ║');
  Logger.log('╚═══════════════════════════════════════════╝');

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


// ====================================================================
// REGISTRY HELPER FUNCTIONS
// ====================================================================

/**
 * Create a trigger from a registry entry.
 * @param {Object} reg - A TRIGGER_REGISTRY entry with type, fn, interval, etc.
 */
function createTriggerFromRegistry_(reg) {
  var builder = ScriptApp.newTrigger(reg.fn).timeBased();

  switch (reg.type) {
    case 'minutes':
      builder.everyMinutes(reg.interval);
      break;
    case 'hours':
      builder.everyHours(reg.interval);
      break;
    case 'daily':
      builder.atHour(reg.hour).everyDays(1);
      break;
    case 'weekly':
      var dayMap = {
        'MONDAY': ScriptApp.WeekDay.MONDAY,
        'TUESDAY': ScriptApp.WeekDay.TUESDAY,
        'WEDNESDAY': ScriptApp.WeekDay.WEDNESDAY,
        'THURSDAY': ScriptApp.WeekDay.THURSDAY,
        'FRIDAY': ScriptApp.WeekDay.FRIDAY,
        'SATURDAY': ScriptApp.WeekDay.SATURDAY,
        'SUNDAY': ScriptApp.WeekDay.SUNDAY
      };
      builder.onWeekDay(dayMap[reg.day]).atHour(reg.hour);
      break;
    default:
      throw new Error('Unknown trigger type: ' + reg.type);
  }

  builder.create();
}

/**
 * Format a human-readable schedule string from a registry entry.
 */
function formatSchedule_(reg) {
  switch (reg.type) {
    case 'minutes': return 'every ' + reg.interval + ' min';
    case 'hours':   return 'every ' + reg.interval + ' hour(s)';
    case 'daily':   return 'daily at ' + reg.hour + ':00';
    case 'weekly':  return reg.day + ' at ' + reg.hour + ':00';
    default:        return reg.type;
  }
}

/**
 * Remove a single trigger by handler function name.
 * @param {string} handlerFunction - The function name to remove triggers for.
 * @return {number} Number of triggers removed.
 */
function removeSingleTrigger(handlerFunction) {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;

  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === handlerFunction) {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  Logger.log('🗑️ Removed ' + removed + ' trigger(s) for: ' + handlerFunction);
  return removed;
}

/**
 * Install a single trigger by its registry name or function name.
 * Removes any existing trigger for that function first.
 * @param {string} nameOrFn - Registry name or function name.
 */
function installSingleTrigger(nameOrFn) {
  var entry = null;

  TRIGGER_REGISTRY.forEach(function(reg) {
    if (reg.name === nameOrFn || reg.fn === nameOrFn) {
      entry = reg;
    }
  });

  if (!entry) {
    Logger.log('❌ Trigger not found in registry: ' + nameOrFn);
    return false;
  }

  // Remove existing first
  removeSingleTrigger(entry.fn);

  // Install
  createTriggerFromRegistry_(entry);
  Logger.log('✅ Installed trigger: ' + entry.name + ' (' + formatSchedule_(entry) + ')');
  return true;
}

/**
 * Get the current trigger status as a structured object (for dashboards).
 */
function getTriggerStatus() {
  var triggers = ScriptApp.getProjectTriggers();
  var activeFns = {};
  triggers.forEach(function(t) {
    activeFns[t.getHandlerFunction()] = true;
  });

  return TRIGGER_REGISTRY.map(function(reg) {
    return {
      id: reg.id,
      name: reg.name,
      fn: reg.fn,
      schedule: formatSchedule_(reg),
      active: !!activeFns[reg.fn]
    };
  });
}
