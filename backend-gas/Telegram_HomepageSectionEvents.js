/**
 * ═══════════════════════════════════════════════════════════════
 * GAS_TelegramSectionEvents.js
 * Shamrock Bail Bonds — Google Apps Script Backend
 *
 * PURPOSE:
 *   Receives analytics events from the Telegram Hub homepage
 *   section (via Wix backend gasIntegration.jsw) and:
 *     1. Appends a row to the "TelegramSectionEvents" Google Sheet
 *     2. Sends a Slack alert for high-value conversion events
 *        (bot opens, bail school clicks, outbound links)
 *
 * PLACEMENT:
 *   Add to your existing GAS project (shamrock-bail-portal-site/
 *   backend-gas/). Wire into Code.js doPost router under action
 *   'logTelegramSectionEvent'.
 *
 * SHEET:
 *   Name: "TelegramSectionEvents"
 *   Headers: Timestamp | Event | Label | Extra | PageUrl | Source
 * ═══════════════════════════════════════════════════════════════
 */

var TELEGRAM_SECTION_CONFIG = {
  SHEET_NAME:   'TelegramSectionEvents',
  SHEET_HEADERS: ['Timestamp', 'Event', 'Label', 'Extra', 'PageUrl', 'Source'],

  // Events that warrant a Slack ping (high conversion intent)
  SLACK_EVENTS: ['tg_cta_click', 'bail_school_click', 'miniapp_click', 'outbound_click'],

  // Slack channel for homepage conversion events
  SLACK_CHANNEL_PROP: 'SLACK_WEBHOOK_INTAKE'
};

/**
 * Log a Telegram section analytics event.
 * Called from Code.js doPost router:
 *   case 'logTelegramSectionEvent': return logTelegramSectionEvent_(data);
 *
 * @param {Object} data - { event, label, extra, pageUrl, timestamp }
 * @returns {Object} { success: boolean }
 */
function logTelegramSectionEvent_(data) {
  try {
    var config  = getConfig();
    var ss      = SpreadsheetApp.openById(config.SPREADSHEET_ID);
    var sheet   = _getOrCreateSheet_(ss, TELEGRAM_SECTION_CONFIG.SHEET_NAME, TELEGRAM_SECTION_CONFIG.SHEET_HEADERS);
    var now     = new Date();
    var tsStr   = data.timestamp || now.toISOString();

    // Append row — always use flat values (no nested objects)
    sheet.appendRow([
      tsStr,
      data.event  || '',
      data.label  || '',
      data.extra  || '{}',
      data.pageUrl || '',
      'homepage_telegram_hub'
    ]);

    // Slack alert for high-value events
    if (TELEGRAM_SECTION_CONFIG.SLACK_EVENTS.indexOf(data.event) !== -1) {
      _sendTelegramSectionSlack_(data, config);
    }

    return { success: true };

  } catch (err) {
    Logger.log('[TelegramSectionEvents] Error: ' + err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get or create the tracking sheet with headers.
 * @private
 */
function _getOrCreateSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
         .setBackground('#1B3A5F')
         .setFontColor('#FFFFFF')
         .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Send a Slack notification for high-value homepage events.
 * @private
 */
function _sendTelegramSectionSlack_(data, config) {
  try {
    var webhookUrl = config.SLACK_WEBHOOK_INTAKE || config.SLACK_WEBHOOK_SHAMROCK;
    if (!webhookUrl) return;

    var emoji = {
      'tg_cta_click':      '🤖',
      'bail_school_click': '🎓',
      'miniapp_click':     '📱',
      'outbound_click':    '🔗',
      'video_play':        '▶️'
    }[data.event] || '📊';

    var label = data.label ? ' → `' + data.label + '`' : '';

    var payload = {
      text: emoji + ' *Homepage Telegram Section* — `' + data.event + '`' + label,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: emoji + ' *Homepage Telegram Hub Interaction*\n' +
                  '*Event:* `' + (data.event || 'unknown') + '`\n' +
                  '*Label:* `' + (data.label || '—') + '`\n' +
                  '*Time:* ' + (data.timestamp || new Date().toISOString())
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'Source: shamrockbailbonds.biz homepage | Section: Telegram Hub'
            }
          ]
        }
      ]
    };

    UrlFetchApp.fetch(webhookUrl, {
      method:      'post',
      contentType: 'application/json',
      payload:     JSON.stringify(payload),
      muteHttpExceptions: true
    });

  } catch (err) {
    Logger.log('[TelegramSectionEvents] Slack error: ' + err.message);
    // Non-fatal — never throw
  }
}

/**
 * ── WIRE INTO Code.js doPost ROUTER ──
 *
 * Inside your doPost(e) switch/if block in Code.js, add:
 *
 *   if (action === 'logTelegramSectionEvent') {
 *     return ContentService
 *       .createTextOutput(JSON.stringify(logTelegramSectionEvent_(data)))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 */
