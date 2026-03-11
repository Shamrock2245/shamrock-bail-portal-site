/**
 * ==========================================================
 * SlackWebhook.gs — Hardened, self-contained Slack utility
 * ==========================================================
 * - DOES NOT depend on global LEE
 * - Reads webhook/channel from CONFIG if available, otherwise no-ops
 * - Safe helpers to build Sheet URL without crashing
 * - Use: postSlackMessage_("text", {channel:"#alerts"})
 *        notifyArrestsInserted_(count, {sheetId, tabName, examples})
 */

// ---- Config resolution (no hard dependency on LEE) ----
function getArrestsConfig_() {
  var out = {
    sheetId: '',
    tabName: '',
    slackWebhookUrl: '',
    slackChannel: ''
  };

  try {
    // Prefer CONFIG if present
    if (typeof CONFIG !== 'undefined' && CONFIG) {
      // Arrests block
      if (CONFIG.ARRESTS) {
        if (CONFIG.ARRESTS.SHEET_ID) out.sheetId = CONFIG.ARRESTS.SHEET_ID;
        if (CONFIG.ARRESTS.TAB_NAME) out.tabName = CONFIG.ARRESTS.TAB_NAME;
        if (CONFIG.ARRESTS.ALERTS && CONFIG.ARRESTS.ALERTS.SLACK_WEBHOOK_URL) {
          out.slackWebhookUrl = CONFIG.ARRESTS.ALERTS.SLACK_WEBHOOK_URL;
        }
        if (CONFIG.ARRESTS.ALERTS && CONFIG.ARRESTS.ALERTS.SLACK_CHANNEL) {
          out.slackChannel = CONFIG.ARRESTS.ALERTS.SLACK_CHANNEL;
        }
      }
      // Global Slack fallback
      if (CONFIG.SLACK) {
        if (!out.slackWebhookUrl && CONFIG.SLACK.WEBHOOK_URL) out.slackWebhookUrl = CONFIG.SLACK.WEBHOOK_URL;
        if (!out.slackChannel && CONFIG.SLACK.DEFAULT_CHANNEL) out.slackChannel = CONFIG.SLACK.DEFAULT_CHANNEL;
      }
      // Sheet name fallback if someone stored under CONFIG.SHEET_NAME
      if (!out.tabName && CONFIG.SHEET_NAME) out.tabName = CONFIG.SHEET_NAME;
      if (!out.sheetId && CONFIG.SHEET_ID) out.sheetId = CONFIG.SHEET_ID;
    }
  } catch (_) {}

  // Last resort: look for a global LEE but do not require it
  try {
    if (!out.sheetId && typeof LEE !== 'undefined' && LEE && LEE.SHEET_ID) out.sheetId = LEE.SHEET_ID;
    if (!out.tabName && typeof LEE !== 'undefined' && LEE && LEE.TAB_NAME) out.tabName = LEE.TAB_NAME;
  } catch (_) {}

  return out;
}

// Build a direct link to Sheet tab (if IDs available)
function buildSheetUrl_(sheetId, tabName) {
  if (!sheetId) return '';
  try {
    var ss = SpreadsheetApp.openById(sheetId);
    if (!tabName) return ss.getUrl();
    var sh = ss.getSheetByName(tabName);
    if (!sh) return ss.getUrl();
    // gid stable link
    return ss.getUrl() + '#gid=' + sh.getSheetId();
  } catch (e) {
    Logger.log('SlackWebhook: buildSheetUrl_ failed: ' + e);
    return '';
  }
}

// ---- Core Slack poster (no throw; safe no-op if unconfigured) ----
function postSlackMessage_(text, opts) {
  opts = opts || {};
  var cfg = getArrestsConfig_();
  var webhook = opts.webhookUrl || cfg.slackWebhookUrl;
  var channel = opts.channel || cfg.slackChannel || ''; // channel optional for incoming webhooks

  if (!webhook) {
    Logger.log('SlackWebhook: No webhook configured; message not sent: ' + (text || ''));
    return { ok: false, reason: 'NO_WEBHOOK' };
  }

  // Basic payload for legacy Slack incoming webhook
  var payload = {
    text: String(text || '').substring(0, 39000), // safety margin
    mrkdwn: true
  };
  if (channel) payload.channel = channel;

  try {
    var res = UrlFetchApp.fetch(webhook, {
      method: 'post',
      muteHttpExceptions: true,
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
    var code = res.getResponseCode();
    if (code >= 200 && code < 300) {
      return { ok: true, code: code };
    } else {
      Logger.log('SlackWebhook: HTTP ' + code + ' body=' + res.getContentText().slice(0, 500));
      return { ok: false, code: code, body: res.getContentText() };
    }
  } catch (e) {
    Logger.log('SlackWebhook: error posting to Slack: ' + e);
    return { ok: false, error: String(e) };
  }
}

// ---- Convenience notifier used by scraper (optional) ----
function notifyArrestsInserted_(count, options) {
  options = options || {};
  var cfg = getArrestsConfig_();
  var sheetId = options.sheetId || cfg.sheetId;
  var tabName = options.tabName || cfg.tabName;

  var sheetUrl = buildSheetUrl_(sheetId, tabName);
  var examples = Array.isArray(options.examples) ? options.examples.slice(0, 3) : [];
  var lines = [];

  lines.push('*Shamrock Bail — New Lee County arrests:* ' + count);
  if (examples.length) {
    lines.push('Examples: ' + examples.map(function(r) {
      var bn = (r && r.bookingNumber) ? r.bookingNumber : '—';
      var nm = (r && r.fullName) ? r.fullName : 'Unknown';
      return '`' + bn + '` ' + nm;
    }).join(' • '));
  }
  if (sheetUrl) {
    lines.push('<' + sheetUrl + '|Open Google Sheet>');
  }

  return postSlackMessage_(lines.join('\n'));
}

// ---- (Optional) small helper for other modules to check readiness ----
function slackIsConfigured_() {
  var cfg = getArrestsConfig_();
  return !!cfg.slackWebhookUrl;
}
