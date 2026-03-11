/**
 * ==========================================================
 * Arrest Lead Router (for Lee County arrests)
 * ==========================================================
 * Purpose:
 *   - Find unrouted rows in Lee_County_Arrests
 *   - Send payloads to Slack (optional) and/or copy to a destination sheet (optional)
 *   - Mark rows as routed to avoid duplicates
 *
 * Safe by default:
 *   - If Slack webhook / destination aren’t set, the router logs only and marks rows “SKIPPED (no targets)”
 *   - Never throws on missing columns; auto-creates routing columns
 * ==========================================================
 */

var ROUTER = (function () {
  var CFG = {
    // Source sheet (where the scraper writes)
    SOURCE_SHEET_ID: '1jq1-N7sCbwSiYPLAdI2ZnxhLzym1QsOSuHPy-Gw07Qc',
    SOURCE_TAB_NAME: 'Lee_County_Arrests',

    // Optional destination (mirror routed rows)
    DEST_SHEET_ID: '',            // e.g. '1AbC....'  (leave blank to skip)
    DEST_TAB_NAME: 'Lee Bookings',

    // Optional Slack webhook (post a message per new arrest)
    SLACK_WEBHOOK_URL: '',        // e.g. 'https://hooks.slack.com/services/...'
    SLACK_CHANNEL: '',            // optional override via payload, else webhook default

    // Throttling / limits
    MAX_PER_RUN: 50,
    LOCK_MS: 30000,

    // Column names to add to the source sheet to track routing
    ROUTED_TIMESTAMP_COL: 'Routed_Timestamp',
    ROUTED_STATUS_COL: 'Routed_Status',
    ROUTED_MESSAGE_COL: 'Routed_Message',

    // Timezone for timestamps
    TIMEZONE: 'America/New_York'
  };

  // ---------- Menu ----------
  function onOpen() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('🟧 Lead Router')
      .addItem('Route new leads now', 'routeLeeArrestLeadsNow')
      .addItem('Install hourly router trigger', 'installLeadRouterHourly')
      .addItem('Disable router triggers', 'disableLeadRouterTriggers')
      .addToUi();
  }

  // ---------- Triggers ----------
  function installLeadRouterHourly() {
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (t.getHandlerFunction() === 'routeLeeArrestLeadsNow') ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger('routeLeeArrestLeadsNow').timeBased().everyHours(1).create();
    Logger.log('⏰ Installed hourly trigger for lead router.');
  }

  function disableLeadRouterTriggers() {
    var n = 0;
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (t.getHandlerFunction() === 'routeLeeArrestLeadsNow') { ScriptApp.deleteTrigger(t); n++; }
    });
    Logger.log('🛑 Removed ' + n + ' lead router trigger(s).');
  }

  // ---------- Main ----------
  function routeLeeArrestLeadsNow() {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(CFG.LOCK_MS)) { Logger.log('🚫 Router is already running.'); return; }

    try {
      var src = getOrCreateSheet_(CFG.SOURCE_SHEET_ID, CFG.SOURCE_TAB_NAME);
      var head = ensureRoutingColumns_(src); // returns header map

      var unrouted = getUnroutedRows_(src, head, CFG.MAX_PER_RUN);
      Logger.log('📦 Unrouted rows to process: ' + unrouted.length);

      if (!unrouted.length) return;

      var destSheet = null;
      if (CFG.DEST_SHEET_ID) {
        destSheet = getOrCreateSheet_(CFG.DEST_SHEET_ID, CFG.DEST_TAB_NAME);
        // Ensure destination headers match source headers (simple mirror)
        ensureHeaders_(destSheet, src.getRange(1,1,1,src.getLastColumn()).getValues()[0]);
      }

      unrouted.forEach(function (rowObj) {
        var status = 'SKIPPED';
        var msg = '';

        try {
          var payload = toLeadPayload_(rowObj.data, head);

          var sentAnywhere = false;
          if (CFG.SLACK_WEBHOOK_URL) {
            var ok = postToSlack_(payload);
            sentAnywhere = sentAnywhere || ok;
          }

          if (destSheet) {
            mirrorToDestination_(destSheet, rowObj.data);
            sentAnywhere = true;
          }

          status = sentAnywhere ? 'ROUTED' : 'SKIPPED';
          msg = sentAnywhere ? 'Delivered to ' + [
            CFG.SLACK_WEBHOOK_URL ? 'Slack' : null,
            destSheet ? 'Destination Sheet' : null
          ].filter(Boolean).join(' + ')
          : 'No targets configured';

        } catch (e) {
          status = 'ERROR';
          msg = (e && e.message) ? e.message : String(e);
        }

        // Write status back
        writeRoutingStatus_(src, head, rowObj.rowIndex, status, msg);
      });

      Logger.log('✅ Router finished.');
    } catch (e) {
      Logger.log('❌ Router fatal: ' + (e && e.stack ? e.stack : e));
    } finally {
      lock.releaseLock();
    }
  }

  // ---------- Slack ----------
  function postToSlack_(payload) {
    try {
      var text = formatSlackMessage_(payload);
      var body = {
        text: text
      };
      if (CFG.SLACK_CHANNEL) body.channel = CFG.SLACK_CHANNEL;

      var res = UrlFetchApp.fetch(CFG.SLACK_WEBHOOK_URL, {
        method: 'post',
        muteHttpExceptions: true,
        contentType: 'application/json',
        payload: JSON.stringify(body)
      });
      var code = res.getResponseCode();
      if (code >= 200 && code < 300) return true;
      Logger.log('⚠️ Slack returned ' + code + ': ' + res.getContentText());
      return false;
    } catch (e) {
      Logger.log('⚠️ Slack error: ' + e);
      return false;
    }
  }

  function formatSlackMessage_(p) {
    // Keep it compact; Slack unfurls URLs, so include Detail URL and Mugshot if present
    var lines = [];
    lines.push('*' + (p.fullName || 'Unknown Name') + '*  ·  Booking #' + (p.bookingNumber || '—'));
    if (p.charges) lines.push('• *Charges:* ' + p.charges);
    if (p.bondString) lines.push('• *Bond:* ' + p.bondString);
    if (p.courtString) lines.push('• *Court:* ' + p.courtString);
    if (p.address) lines.push('• *Address:* ' + p.address);
    if (p.detailUrl) lines.push(p.detailUrl);
    if (p.mugshotUrl) lines.push(p.mugshotUrl);
    return lines.join('\n');
  }

  // ---------- Destination mirroring ----------
  function mirrorToDestination_(destSheet, rowArr) {
    // Append the entire row as-is (header-compatible mirror)
    destSheet.getRange(destSheet.getLastRow() + 1, 1, 1, rowArr.length).setValues([rowArr]);
  }

  // ---------- Helpers: sheet + headers ----------
  function getOrCreateSheet_(sheetId, tabName) {
    var ss = SpreadsheetApp.openById(sheetId);
    var sh = ss.getSheetByName(tabName);
    if (!sh) sh = ss.insertSheet(tabName);
    return sh;
  }

  function ensureHeaders_(sheet, headers) {
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1,1,1,headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  }

  function ensureRoutingColumns_(sheet) {
    var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (v) { return (v || '').toString(); });
    var nameToIndex = {};
    header.forEach(function (h, i) { if (h) nameToIndex[h] = i + 1; });

    // Ensure our 3 routing columns exist at the end if missing
    var needed = [CFG.ROUTED_TIMESTAMP_COL, CFG.ROUTED_STATUS_COL, CFG.ROUTED_MESSAGE_COL];
    needed.forEach(function (colName) {
      if (!nameToIndex[colName]) {
        sheet.insertColumnAfter(sheet.getLastColumn());
        var col = sheet.getLastColumn();
        sheet.getRange(1, col).setValue(colName);
        nameToIndex[colName] = col;
      }
    });

    // Return map of headers -> col index
    // Also ensure we know some core column positions (best-effort)
    return nameToIndex;
  }

  function getUnroutedRows_(sheet, headMap, maxCount) {
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    var tsCol = headMap[CFG.ROUTED_TIMESTAMP_COL];
    var dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

    var out = [];
    for (var i = 0; i < dataRange.length; i++) {
      var rowIndex = i + 2;
      var routedTs = (tsCol ? dataRange[i][tsCol - 1] : '');
      if (!routedTs) {
        out.push({ rowIndex: rowIndex, data: dataRange[i] });
        if (out.length >= (maxCount || 50)) break;
      }
    }
    return out;
  }

  function writeRoutingStatus_(sheet, headMap, rowIndex, status, message) {
    var tsCol = headMap[CFG.ROUTED_TIMESTAMP_COL];
    var stCol = headMap[CFG.ROUTED_STATUS_COL];
    var msgCol = headMap[CFG.ROUTED_MESSAGE_COL];

    var tz = CFG.TIMEZONE || 'America/New_York';
    var nowStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');

    if (tsCol) sheet.getRange(rowIndex, tsCol).setValue(nowStr);
    if (stCol) sheet.getRange(rowIndex, stCol).setValue(status || '');
    if (msgCol) sheet.getRange(rowIndex, msgCol).setValue((message || '').toString().slice(0, 500));
  }

  // ---------- Payload builder ----------
  function toLeadPayload_(row, head) {
    // Build a simple name->value map from header row to the given data row
    var headerRow = getHeaderRow_();
    var obj = {};
    for (var i = 0; i < headerRow.length; i++) {
      var key = headerRow[i];
      if (key) obj[key] = row[i];
    }

    // Compose easy strings
    var bondPieces = [];
    if (obj.Bond_Type) bondPieces.push(String(obj.Bond_Type));
    if (obj.Bond_Amount) bondPieces.push('$' + String(obj.Bond_Amount));
    if (obj.Bond_Paid) bondPieces.push('Paid: ' + String(obj.Bond_Paid));
    var bondString = bondPieces.join(' · ');

    var courtPieces = [];
    if (obj.Court_Type) courtPieces.push(String(obj.Court_Type));
    if (obj.Case_Number) courtPieces.push('#' + String(obj.Case_Number));
    if (obj.Court_Date) courtPieces.push(String(obj.Court_Date));
    if (obj.Court_Time) courtPieces.push(String(obj.Court_Time));
    if (obj.Court_Location) courtPieces.push(String(obj.Court_Location));
    var courtString = courtPieces.join(' · ');

    return {
      bookingNumber: safe_(obj.Booking_Number),
      fullName: safe_(obj.Full_Name),
      firstName: safe_(obj.First_Name),
      lastName: safe_(obj.Last_Name),
      dob: safe_(obj.DOB),
      bookingDate: safe_(obj.Booking_Date),
      bookingTime: safe_(obj.Booking_Time),
      status: safe_(obj.Status),
      facility: safe_(obj.Facility),
      charges: safe_(obj.Charges),
      bondString: bondString,
      courtString: courtString,
      address: [safe_(obj.Address), safe_(obj.City), safe_(obj.State), safe_(obj.ZIP)].filter(Boolean).join(', '),
      mugshotUrl: safe_(obj.Mugshot_URL),
      detailUrl: safe_(obj.Detail_URL)
    };
  }

  function getHeaderRow_() {
    // Keep in sync with scraper headers
    return [
      'Scrape_Timestamp','Booking_Number','Person_ID','Full_Name','First_Name','Middle_Name','Last_Name','DOB',
      'Booking_Date','Booking_Time','Status','Facility','Race','Sex','Height','Weight','Address','City','State','ZIP',
      'Mugshot_URL','Charges',
      'Bond_Amount','Bond_Paid','Bond_Type',
      'Court_Type','Case_Number','Court_Date','Court_Time','Court_Location',
      'Detail_URL',
      // Router-managed columns (appended by ensureRoutingColumns_)
      // 'Routed_Timestamp','Routed_Status','Routed_Message'  // not in scraper header
    ];
  }

  function safe_(v) { return v == null ? '' : String(v).trim(); }

  // Public
  return {
    onOpen: onOpen,
    installLeadRouterHourly: installLeadRouterHourly,
    disableLeadRouterTriggers: disableLeadRouterTriggers,
    routeLeeArrestLeadsNow: routeLeeArrestLeadsNow
  };
})();

/** Menus/triggers entry points */
function routeLeeArrestLeadsNow() { return ROUTER.routeLeeArrestLeadsNow(); }
function installLeadRouterHourly() { return ROUTER.installLeadRouterHourly(); }
function disableLeadRouterTriggers() { return ROUTER.disableLeadRouterTriggers(); }
function onOpen() { return ROUTER.onOpen(); }

/**
 * ==========================================================
 * Diagnostic Tester for Lee County Arrest Scraper
 * ----------------------------------------------------------
 * Run this manually (no triggers) to see what HTML the
 * sheriff site actually returns to UrlFetchApp.
 * ==========================================================
 */
function testLeeCharges() {
  // 👇 Replace with any active booking ID from the website
  const bookingId = '1013691';  // Example from your screenshot

  const url = 'https://www.sheriffleefl.org/booking/?id=' + bookingId;
  Logger.log('Fetching detail page: ' + url);

  const res = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (AppsScript Diagnostic)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const html = res.getContentText();
  const code = res.getResponseCode();

  Logger.log('HTTP Code: ' + code);
  Logger.log('HTML Length: ' + (html ? html.length : 0));

  // Check for key fragments that tell us whether the content is server-rendered
  const markers = ['charges-content', 'card-body', 'card-title', 'MOVING TRAFFIC', 'Bond', 'Case', 'Hearing'];
  markers.forEach(function (m) {
    Logger.log('Contains "' + m + '"? → ' + (html.includes(m)));
  });

  // Show the first bit of the HTML so we can see what kind of page it is
  Logger.log('HTML Preview (first 1000 chars):\n' + html.slice(0, 1000));

  // Try to find and log the exact charges container if present
  const match = html.match(/<div[^>]+id=["']charges-content["'][^>]*>[\s\S]*?<\/div>/i);
  if (match) {
    Logger.log('✅ Found charges-content region (length: ' + match[0].length + ')');
    Logger.log('Charges-content snippet:\n' + match[0].slice(0, 1000));
  } else {
    Logger.log('⚠️ No charges-content region found in returned HTML.');
  }

  // Save a copy to Google Drive for inspection
  const file = DriveApp.createFile('LeeDetail_' + bookingId + '.html', html, MimeType.HTML);
  Logger.log('📄 Saved full HTML to Drive: ' + file.getUrl());
}

