/**
 * ============================================
 * HENDRY COUNTY ARREST SCRAPER v1.0
 * ============================================
 * Source: http://www.hendrysheriff.org/arrests_and_jail_info/arrest_and_inmate_search.php
 *
 * Hendry County Sheriff uses a PHP-based inmate search page.
 * We fetch the public arrest listing and parse the HTML table.
 *
 * Part of "The Scout" — Shamrock Bail Bonds multi-county expansion.
 * Date: 2026-03-18
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

var HENDRY_CONFIG = {
  SPREADSHEET_ID: '1jq1-N7sCbwSiYPLAdI2ZnxhLzym1QsOSuHPy-Gw07Qc', // Same master workbook
  TAB_NAME: 'Hendry_County_Arrests',
  BASE_URL: 'http://www.hendrysheriff.org/arrests_and_jail_info/arrest_and_inmate_search.php',
  COUNTY: 'Hendry',
  MIN_SCORE: 60,  // Slightly lower threshold — smaller county, fewer bookings
  MAX_AGE_DAYS: 3 // Only pull arrests from last 3 days
};

// =============================================================================
// ENTRY POINT
// =============================================================================

/**
 * Main runner — called by the daily Scout trigger and by runAllCountyScrapers().
 */
function runHendryArrestsNow() {
  var startTime = new Date();
  Logger.log('═══════════════════════════════════════');
  Logger.log('🚦 Starting Hendry County Arrest Scraper v1.0');
  Logger.log('═══════════════════════════════════════');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log('🚫 Another Hendry scrape is in progress. Skipping.');
    return { success: false, reason: 'locked' };
  }

  try {
    var sheet = _getOrCreateHendrySheet_();

    // Build dedup map from existing booking numbers
    var existingData = sheet.getDataRange().getValues();
    var existingBookings = {};
    for (var i = 1; i < existingData.length; i++) {
      var bn = existingData[i][1];
      if (bn) existingBookings[String(bn)] = true;
    }
    Logger.log('📚 Existing rows: ' + (existingData.length - 1));

    // Fetch and parse
    var arrests = _fetchHendryArrests_();
    Logger.log('✅ Parsed ' + arrests.length + ' arrest records');

    // Dedup
    var newArrests = arrests.filter(function (a) {
      return !existingBookings[String(a.Booking_Number)];
    });
    Logger.log('📥 New arrests: ' + newArrests.length);

    if (newArrests.length === 0) {
      Logger.log('ℹ️ No new Hendry arrests to add.');
    } else {
      _writeHendryArrestsToSheet_(sheet, newArrests);
      Logger.log('✅ Added ' + newArrests.length + ' new arrests');

      // Score via shared LeadScoring module
      try {
        if (typeof autoScoreNewArrests === 'function') {
          var startRow = sheet.getLastRow() - newArrests.length + 1;
          autoScoreNewArrests(startRow, sheet.getLastRow());
        }
      } catch (scoreErr) {
        Logger.log('⚠️ Scoring failed (non-fatal): ' + scoreErr.message);
      }

      // Slack alert for qualified arrests
      _notifyHendryQualifiedArrests_(newArrests);
    }

    var duration = Math.round((Date.now() - startTime.getTime()) / 1000);
    Logger.log('⏱️ Hendry scrape complete in ' + duration + 's');
    Logger.log('═══════════════════════════════════════');

    return { success: true, totalFetched: arrests.length, newArrests: newArrests.length, duration: duration };

  } catch (err) {
    Logger.log('❌ Hendry scraper fatal error: ' + err.message);
    Logger.log(err.stack || '');
    return { success: false, error: err.message };
  } finally {
    lock.releaseLock();
  }
}

// =============================================================================
// FETCH & PARSE
// =============================================================================

/**
 * Fetch the Hendry County inmate search page and parse arrest records.
 * The site uses a standard PHP form — the default GET loads recent bookings.
 */
function _fetchHendryArrests_() {
  var arrests = [];

  try {
    var response = UrlFetchApp.fetch(HENDRY_CONFIG.BASE_URL, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    var code = response.getResponseCode();
    Logger.log('📡 Hendry HTTP ' + code);

    if (code !== 200) {
      Logger.log('❌ Hendry site returned HTTP ' + code);
      return arrests;
    }

    var html = response.getContentText();
    Logger.log('📄 Hendry HTML length: ' + html.length);

    // Parse HTML table rows — Hendry uses a standard table layout
    arrests = _parseHendryHTML_(html);

  } catch (fetchErr) {
    Logger.log('❌ Hendry fetch error: ' + fetchErr.message);
  }

  return arrests;
}

/**
 * Parse the Hendry County HTML table into arrest objects.
 * Table columns: Name | Booking # | Booking Date | Charges | Bond Amount
 */
function _parseHendryHTML_(html) {
  var arrests = [];
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - HENDRY_CONFIG.MAX_AGE_DAYS);

  // Extract table rows — look for <tr> blocks containing inmate data
  var rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  var cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  var tagPattern = /<[^>]+>/g;

  var rowMatch;
  var rowCount = 0;

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    var rowHtml = rowMatch[1];
    var cells = [];
    var cellMatch;

    while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
      var cellText = cellMatch[1].replace(tagPattern, '').replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").trim();
      cells.push(cellText);
    }

    // Skip header rows and rows with too few cells
    if (cells.length < 4) continue;

    // Skip rows that look like headers
    var firstCell = cells[0].toLowerCase();
    if (firstCell === 'name' || firstCell === 'inmate' || firstCell === '#') continue;

    rowCount++;

    var arrest = _buildHendryArrestObject_(cells);
    if (!arrest) continue;

    // Age filter
    if (arrest.Booking_Date) {
      try {
        var bd = new Date(arrest.Booking_Date);
        if (!isNaN(bd.getTime()) && bd < cutoffDate) continue;
      } catch (e) { /* keep if date parse fails */ }
    }

    arrests.push(arrest);
  }

  Logger.log('📊 Hendry: parsed ' + rowCount + ' rows → ' + arrests.length + ' valid arrests');
  return arrests;
}

/**
 * Build a standardized arrest object from a row of cells.
 */
function _buildHendryArrestObject_(cells) {
  try {
    // Hendry table: Name | Booking# | Date | Charges | Bond
    var fullName = cells[0] || '';
    var bookingNum = cells[1] || '';
    var bookingDate = cells[2] || '';
    var charges = cells[3] || '';
    var bondAmount = cells[4] || '';

    if (!fullName || !bookingNum) return null;

    // Parse name (LAST, FIRST MIDDLE)
    var firstName = '', lastName = '';
    var nameParts = fullName.split(',');
    if (nameParts.length >= 2) {
      lastName = nameParts[0].trim();
      var firstMiddle = nameParts[1].trim().split(/\s+/);
      firstName = firstMiddle[0] || '';
    } else {
      lastName = fullName.trim();
    }

    // Clean bond amount
    var bondNum = parseFloat(String(bondAmount).replace(/[$,\s]/g, '')) || 0;

    return {
      County: 'Hendry',
      Booking_Number: String(bookingNum).trim(),
      Booking_Date: bookingDate.trim(),
      Full_Name: fullName.trim(),
      First_Name: firstName,
      Last_Name: lastName,
      DOB: '',
      Age: '',
      Sex: '',
      Race: '',
      Height: '',
      Weight: '',
      Hair_Color: '',
      Eye_Color: '',
      Address: '',
      City: 'LaBelle',
      State: 'FL',
      ZIP: '',
      Charges: charges.trim(),
      Case_Number: '',
      Court_Date: '',
      Bond_Amount: bondNum,
      Bond_Type: '',
      Status: 'Booked',
      Lead_Score: 0,
      Lead_Qualification: '',
      Notes: 'Source: Hendry County Sheriff'
    };
  } catch (e) {
    Logger.log('⚠️ Error building Hendry arrest object: ' + e.message);
    return null;
  }
}

// =============================================================================
// SHEET MANAGEMENT
// =============================================================================

function _getOrCreateHendrySheet_() {
  var ss = SpreadsheetApp.openById(HENDRY_CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(HENDRY_CONFIG.TAB_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(HENDRY_CONFIG.TAB_NAME);
    var headers = [
      'County', 'Booking_Number', 'Booking_Date', 'Full_Name', 'First_Name', 'Last_Name',
      'DOB', 'Age', 'Sex', 'Race', 'Height', 'Weight', 'Hair_Color', 'Eye_Color',
      'Address', 'City', 'State', 'ZIP',
      'Charges', 'Case_Number', 'Court_Date',
      'Bond_Amount', 'Bond_Type', 'Status',
      'Lead_Score', 'Lead_Qualification', 'Notes'
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    Logger.log('✅ Created Hendry_County_Arrests sheet');
  }

  return sheet;
}

function _writeHendryArrestsToSheet_(sheet, arrests) {
  var rows = arrests.map(function (a) {
    return [
      a.County, a.Booking_Number, a.Booking_Date, a.Full_Name, a.First_Name, a.Last_Name,
      a.DOB, a.Age, a.Sex, a.Race, a.Height, a.Weight, a.Hair_Color, a.Eye_Color,
      a.Address, a.City, a.State, a.ZIP,
      a.Charges, a.Case_Number, a.Court_Date,
      a.Bond_Amount, a.Bond_Type, a.Status,
      a.Lead_Score, a.Lead_Qualification, a.Notes
    ];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

function _notifyHendryQualifiedArrests_(arrests) {
  try {
    var qualified = arrests.filter(function (a) {
      return a.Lead_Score && a.Lead_Score >= HENDRY_CONFIG.MIN_SCORE;
    });
    if (qualified.length === 0) return;

    var config = typeof getConfig === 'function' ? getConfig() : {};
    var slackUrl = config.SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY || ''; // Reuse arrests channel
    if (!slackUrl || typeof sendSlackMessage !== 'function') return;

    sendSlackMessage(slackUrl,
      '🚨 *Hendry County* — ' + qualified.length + ' new qualified arrest(s) detected by The Scout.',
      null
    );
  } catch (e) {
    Logger.log('⚠️ Hendry Slack notify failed (non-fatal): ' + e.message);
  }
}

// =============================================================================
// TRIGGER SETUP
// =============================================================================

/**
 * Install a daily trigger for Hendry County scraper.
 * Called by installAllTriggers() — do not run manually unless resetting.
 */
function setupHendryTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'runHendryArrestsNow') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('runHendryArrestsNow')
    .timeBased()
    .everyHours(6)
    .create();
  Logger.log('✅ Hendry County trigger installed (every 6 hours)');
}
