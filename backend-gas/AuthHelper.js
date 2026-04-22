/**
 * =====================================================================
 * AuthHelper.js — OAuth Re-Authorization Utility
 * =====================================================================
 * Provides a one-click way to force the Google Apps Script OAuth
 * consent screen to appear when UrlFetchApp.fetch throws:
 *   "You do not have permission to call UrlFetchApp.fetch.
 *    Required permissions: https://www.googleapis.com/auth/script.external_request"
 *
 * ROOT CAUSE:
 *   GAS only shows the OAuth popup when a function is run MANUALLY
 *   from the editor (not via a trigger). If the script was deployed
 *   before the external_request scope was needed, or if the token was
 *   revoked, the popup will not appear on its own. Running
 *   forceReauthorize() manually from the editor forces GAS to detect
 *   the missing scope and display the consent dialog.
 *
 * HOW TO USE:
 *   1. Open the Google Apps Script editor (Extensions > Apps Script)
 *   2. In the function dropdown at the top, select "forceReauthorize"
 *   3. Click ▶ Run
 *   4. A popup will appear asking you to review permissions — click
 *      "Review Permissions", choose your @shamrockbailbonds.biz account,
 *      then click "Allow"
 *   5. After authorization succeeds, run runLeeArrestsNow() normally
 *
 * ALTERNATIVELY: Use the menu item added to ⚙️ System Management.
 *
 * @author  Shamrock Automation
 * @version 1.0.0
 * @updated 2026-04-22
 */

/**
 * forceReauthorize
 *
 * Run this function MANUALLY from the GAS editor to trigger the OAuth
 * consent popup and grant all required scopes, including
 * script.external_request (needed for UrlFetchApp.fetch).
 *
 * This function is intentionally simple — it just touches each
 * restricted service so GAS knows to request the scopes.
 */
function forceReauthorize() {
  Logger.log('═══════════════════════════════════════');
  Logger.log('🔐 Starting forced re-authorization check');
  Logger.log('═══════════════════════════════════════');

  var passed = 0;
  var failed = 0;

  // 1. UrlFetchApp — the scope that is currently broken
  try {
    var resp = UrlFetchApp.fetch('https://www.sheriffleefl.org/public-api/bookings?limit=1&offset=0', {
      method: 'get',
      muteHttpExceptions: true
    });
    Logger.log('✅ UrlFetchApp.fetch — OK (HTTP ' + resp.getResponseCode() + ')');
    passed++;
  } catch (e) {
    Logger.log('❌ UrlFetchApp.fetch — FAILED: ' + e.message);
    failed++;
  }

  // 2. SpreadsheetApp — needed for sheet writes
  try {
    var ss = SpreadsheetApp.openById('121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E');
    Logger.log('✅ SpreadsheetApp — OK (opened: ' + ss.getName() + ')');
    passed++;
  } catch (e) {
    Logger.log('❌ SpreadsheetApp — FAILED: ' + e.message);
    failed++;
  }

  // 3. Session / user identity
  try {
    var email = Session.getActiveUser().getEmail();
    Logger.log('✅ Session — OK (user: ' + (email || 'unknown') + ')');
    passed++;
  } catch (e) {
    Logger.log('❌ Session — FAILED: ' + e.message);
    failed++;
  }

  // 4. ScriptApp — needed for triggers
  try {
    var triggers = ScriptApp.getProjectTriggers();
    Logger.log('✅ ScriptApp — OK (' + triggers.length + ' trigger(s) active)');
    passed++;
  } catch (e) {
    Logger.log('❌ ScriptApp — FAILED: ' + e.message);
    failed++;
  }

  Logger.log('═══════════════════════════════════════');
  Logger.log('🔐 Auth check complete: ' + passed + ' passed, ' + failed + ' failed');
  if (failed === 0) {
    Logger.log('✅ All permissions granted. You can now run runLeeArrestsNow().');
  } else {
    Logger.log('⚠️ Some permissions are still missing. Re-run this function and');
    Logger.log('   follow the "Review Permissions" popup to grant access.');
  }
  Logger.log('═══════════════════════════════════════');

  // Show a UI alert if running from a spreadsheet context
  try {
    var ui = SpreadsheetApp.getUi();
    if (failed === 0) {
      ui.alert('✅ Authorization Complete', 'All permissions are granted.\nYou can now run the Lee County scraper normally.', ui.ButtonSet.OK);
    } else {
      ui.alert('⚠️ Authorization Incomplete', failed + ' permission(s) still missing.\nCheck the Execution Log for details, then re-run this function.', ui.ButtonSet.OK);
    }
  } catch (_) {
    // No UI context (e.g., running from trigger) — log only
  }
}

/**
 * checkAuthorizationStatus
 *
 * Returns a quick status of whether the script has all required
 * OAuth scopes. Logs the result and returns a boolean.
 *
 * @return {boolean} true if all required scopes are authorized
 */
function checkAuthorizationStatus() {
  var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
  var status = authInfo.getAuthorizationStatus();

  if (status === ScriptApp.AuthorizationStatus.REQUIRED) {
    Logger.log('🔴 Authorization REQUIRED — run forceReauthorize() to fix');
    var url = authInfo.getAuthorizationUrl();
    Logger.log('🔗 Authorization URL: ' + url);
    return false;
  } else if (status === ScriptApp.AuthorizationStatus.NOT_REQUIRED) {
    Logger.log('✅ Authorization NOT REQUIRED — all scopes already granted');
    return true;
  } else {
    Logger.log('⚠️ Authorization status UNKNOWN — status code: ' + status);
    return false;
  }
}
