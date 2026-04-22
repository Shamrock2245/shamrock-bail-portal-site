/**
 * =====================================================================
 * AuthHelper.js — OAuth Re-Authorization Utility
 * =====================================================================
 * Fixes: "You do not have permission to call UrlFetchApp.fetch.
 *         Required permissions: script.external_request"
 *
 * ROOT CAUSE:
 *   The appsscript.json manifest explicitly declares all OAuth scopes.
 *   When scopes are manually declared, GAS will NOT auto-prompt for
 *   consent during a normal Run — it expects you to authorize via the
 *   ScriptApp.getAuthorizationInfo() URL flow instead.
 *
 *   Additionally, the webapp is deployed with executeAs: USER_DEPLOYING,
 *   which means the deploying account's token must be fully authorized.
 *   If that token was revoked, expired, or never granted for the full
 *   scope set, all UrlFetchApp calls will silently fail.
 *
 * THE FIX — Two options, use whichever works for you:
 *
 *   OPTION A (Easiest — Direct URL):
 *     1. In the GAS editor, run: getAuthorizationUrl
 *     2. Copy the URL from the Execution Log
 *     3. Open it in your browser and click Allow
 *     4. Done — run runLeeArrestsNow()
 *
 *   OPTION B (Menu):
 *     🍀 Shamrock Automation → ⚙️ System Management
 *       → 🔐 Fix Permissions (Re-Authorize)
 *     This opens a dialog with the auth URL as a clickable link.
 *
 * @author  Shamrock Automation
 * @version 2.0.0
 * @updated 2026-04-22
 */

// =====================================================================
// OPTION A: Run this function, copy the URL from the log, open in browser
// =====================================================================

/**
 * getAuthorizationUrl
 *
 * Run this from the GAS editor. It will log the direct OAuth URL.
 * Copy that URL, open it in your browser, and click Allow.
 * After that, runLeeArrestsNow() will work immediately.
 */
function getAuthorizationUrl() {
  var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
  var status   = authInfo.getAuthorizationStatus();

  Logger.log('═══════════════════════════════════════');
  Logger.log('🔐 OAuth Authorization Helper');
  Logger.log('═══════════════════════════════════════');

  if (status === ScriptApp.AuthorizationStatus.NOT_REQUIRED) {
    Logger.log('✅ ALREADY AUTHORIZED — no action needed.');
    Logger.log('   You can run runLeeArrestsNow() right now.');
    Logger.log('═══════════════════════════════════════');

    try {
      SpreadsheetApp.getUi().alert(
        '✅ Already Authorized',
        'All permissions are already granted.\n\nYou can run the Lee County scraper now.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (_) {}
    return;
  }

  var url = authInfo.getAuthorizationUrl();
  Logger.log('🔴 STATUS: Authorization REQUIRED');
  Logger.log('');
  Logger.log('📋 STEP-BY-STEP:');
  Logger.log('   1. Copy the URL below');
  Logger.log('   2. Open it in your browser (same Google account)');
  Logger.log('   3. Click "Allow" on the permissions screen');
  Logger.log('   4. Come back here and run runLeeArrestsNow()');
  Logger.log('');
  Logger.log('🔗 AUTHORIZATION URL:');
  Logger.log(url);
  Logger.log('');
  Logger.log('═══════════════════════════════════════');

  // Try to show a UI dialog with the URL as well
  try {
    var ui = SpreadsheetApp.getUi();
    var html = HtmlService.createHtmlOutput(
      '<div style="font-family:Arial,sans-serif;padding:16px;max-width:520px">' +
      '<h3 style="color:#c0392b;margin-top:0">🔐 Authorization Required</h3>' +
      '<p>The Lee County scraper needs permission to make external HTTP requests.</p>' +
      '<p><strong>Click the link below to authorize:</strong></p>' +
      '<p><a href="' + url + '" target="_blank" ' +
      'style="display:inline-block;padding:10px 20px;background:#1a73e8;color:#fff;' +
      'text-decoration:none;border-radius:4px;font-weight:bold">🔗 Open Authorization Page</a></p>' +
      '<hr style="margin:16px 0">' +
      '<p style="font-size:12px;color:#666">Or copy this URL manually:<br>' +
      '<code style="word-break:break-all;font-size:11px">' + url + '</code></p>' +
      '<p style="font-size:12px;color:#666">After clicking Allow, close this dialog ' +
      'and run <strong>runLeeArrestsNow</strong> from the editor.</p>' +
      '</div>'
    ).setWidth(560).setHeight(320).setTitle('🔐 Authorize Shamrock Automation');
    ui.showModalDialog(html, '🔐 Authorize Shamrock Automation');
  } catch (e) {
    // No UI context — URL is in the log above
    Logger.log('(No UI context — use the URL from the log above)');
  }
}

// =====================================================================
// OPTION B: Called from the menu (⚙️ System Management)
// =====================================================================

/**
 * forceReauthorize
 *
 * Menu-friendly wrapper. Shows the auth URL in a dialog.
 * Called by menu_forceReauthorize() in UnifiedMenuSystem.js
 */
function forceReauthorize() {
  getAuthorizationUrl();
}

// =====================================================================
// STATUS CHECK
// =====================================================================

/**
 * checkAuthorizationStatus
 *
 * Quick check — logs whether all scopes are authorized.
 * @return {boolean} true if fully authorized
 */
function checkAuthorizationStatus() {
  var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
  var status   = authInfo.getAuthorizationStatus();

  Logger.log('═══════════════════════════════════════');
  Logger.log('🔐 Authorization Status Check');
  Logger.log('═══════════════════════════════════════');

  if (status === ScriptApp.AuthorizationStatus.NOT_REQUIRED) {
    Logger.log('✅ AUTHORIZED — all scopes granted');
    Logger.log('═══════════════════════════════════════');
    return true;
  }

  Logger.log('🔴 AUTHORIZATION REQUIRED');
  Logger.log('   Run getAuthorizationUrl() to get the consent link.');
  Logger.log('═══════════════════════════════════════');
  return false;
}
