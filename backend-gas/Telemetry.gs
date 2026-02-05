/**
 * ============================================================================
 * Telemetry.gs
 * ============================================================================
 * Standardized logging and critical alert system.
 * 
 * Features:
 * - Logs to Stackdriver (console) by default.
 * - Escalates "CRITICAL" errors to Slack via NotificationService.
 * - Tracks "Consecutive Failures" for key operations (Strikes).
 */

var Telemetry = (function() {

  // --- PRIVATE CONFIG ---
  const MAX_STRIKES = 3;
  
  function getStrikeCount_(operation) {
    const props = PropertiesService.getScriptProperties();
    return parseInt(props.getProperty(`STRIKES_${operation}`) || '0');
  }

  function setStrikeCount_(operation, count) {
    PropertiesService.getScriptProperties().setProperty(`STRIKES_${operation}`, count.toString());
  }

  return {
    
    /**
     * Log an info message.
     */
    log: function(component, message, data) {
      console.log(`[${component}] ${message} ${data ? JSON.stringify(data) : ''}`);
    },

    /**
     * Log a warning.
     */
    warn: function(component, message) {
      console.warn(`[${component}] ${message}`);
    },

    /**
     * Log an error and optionally escalate.
     * @param {string} component - Component name (e.g. 'LeeScraper')
     * @param {string} message - Error description
     * @param {boolean} isStrike - If true, increments failure count.
     */
    error: function(component, message, isStrike = false) {
      console.error(`[${component}] ERROR: ${message}`);

      if (isStrike && typeof NotificationService !== 'undefined') {
        // LOCKING: Prevent race conditions on strike counts
        const lock = LockService.getScriptLock();
        try {
          if (lock.tryLock(3000)) { // Wait up to 3 seconds
            const currentStrikes = getStrikeCount_(component) + 1;
            setStrikeCount_(component, currentStrikes);
            
            console.warn(`[${component}] Strike ${currentStrikes}/${MAX_STRIKES}`);
    
            if (currentStrikes >= MAX_STRIKES) {
              // ESCALATE!
              NotificationService.notifySlack('SLACK_WEBHOOK_GENERAL', 
                `🚨 *CRITICAL FAILURE: ${component}*\n` +
                `Has failed ${currentStrikes} times consecutively.\n` +
                `Last Error: ${message}`
              );
            }
          } else {
             console.warn(`[${component}] Could not acquire lock to update strikes.`);
          }
        } catch (e) {
          console.error(`[${component}] Critical Error in Telemetry: ${e.message}`);
        } finally {
          lock.releaseLock();
        }
      }
    },

    /**
     * Register a success to reset strikes.
     */
    registerSuccess: function(component) {
      const current = getStrikeCount_(component);
      if (current > 0) {
        setStrikeCount_(component, 0);
        console.log(`[${component}] Strikes reset to 0.`);
      }
    }
  };
})();
