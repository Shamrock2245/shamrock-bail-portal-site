/**
 * ============================================
 * SARASOTA COUNTY ARREST SCRAPER v1.0
 * ============================================
 * Source: https://www.sarasotasheriff.org/arrest-reports/index.php
 *
 * Sarasota County Sheriff publishes a daily arrest report page.
 * The page renders an HTML table of recent bookings.
 *
 * Part of "The Scout" — Shamrock Bail Bonds multi-county expansion.
 * Date: 2026-03-18
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

var SARASOTA_CONFIG = {
  SPREADSHEET_ID: '1jq1-N7sCbwSiYPLAdI2ZnxhLzym1QsOSuHPy-Gw07Qc', // Same master workbook
  TAB_NAME: 'Sarasota_County_Arrests',
  BASE_URL: 'https://www.sarasotasheriff.org/arrest-reports/index.php',
  COUNTY: 'Sarasota',
  MIN_SCORE: 65,
  MAX_AGE_DAYS: 2
};

// =============================================================================
// ENTRY POINT
// =============================================================================

/**
 * Main runner — called by the daily Scout trigger and by runAllCountyScrapers().
 */
function runSarasotaArrestsNow() {
  var startTime = new Date();
  Logger.log('═══════════════════════════════════════');
  Logger.log('🚦 Starting Sarasota County Arrest Scraper v1.0');
  Logger.log('═══════════════════════════════════════');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log('🚫 Another Sarasota scrape is in progress. Skipping.');
    return { success: false, reason: 'locked' };
  }

  try {
    var sheet = _getOrCreateSarasotaSheet_();

    // Build dedup map
    var existingData = sheet.getDataRange().getValues();
    var existingBookings = {};
    for (var i = 1; i < existingData.length; i++) {
      var bn = existingData[i][1];
      if (bn) existingBookings[String(bn)] = true;
    }
    Logger.log('📚 Existing rows: ' + (existingData.length - 1));

    var arrests = _fetchSarasotaArrests_();
    Logger.log('✅ Parsed ' + arrests.length + ' arrest records');

    var newArrests = arrests.filter(function (a) {
      return !existingBookings[String(a.Booking_Number)];
    });
    Logger.log('📥 New arrests: ' + newArrests.length);

    if (newArrests.length === 0) {
      Logger.log('ℹ️ No new Sarasota arrests to add.');
    } else {
      _writeSarasotaArrestsToSheet_(sheet, newArrests);
      Logger.log('✅ Added ' + newArrests.length + ' new arrests');

      try {
        if (typeof autoScoreNewArrests === 'function') {
          var startRow = sheet.getLastRow() - newArrests.length + 1;
          autoScoreNewArrests(startRow, sheet.getLastRow());
        }
      } catch (scoreErr) {
        Logger.log('⚠️ Scoring failed (non-fatal): ' + scoreErr.message);
      }

      _notifySarasotaQualifiedArrests_(newArrests);
    }

    var duration = Math.round((Date.now() - startTime.getTime()) / 1000);
    Logger.log('⏱️ Sarasota scrape complete in ' + duration + 's');
    Logger.log('═══════════════════════════════════════');

    return { success: true, totalFetched: arrests.length, newArrests: newArrests.length, duration: duration };

  } catch (err) {
    Logger.log('❌ Sarasota scraper fatal error: ' + err.message);
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
 * Fetch the Sarasota County arrest report page and parse records.
 * The Sarasota Sheriff site uses a PHP page with an HTML table of recent bookings.
 */
function _fetchSarasotaArrests_() {
  var arrests = [];

  try {
    var response = UrlFetchApp.fetch(SARASOTA_CONFIG.BASE_URL, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    var code = response.getResponseCode();
    Logger.log('📡 Sarasota HTTP ' + code);

    if (code !== 200) {
      Logger.log('❌ Sarasota site returned HTTP ' + code);
      return arrests;
    }

    var html = response.getContentText();
    Logger.log('📄 Sarasota HTML length: ' + html.length);

    arrests = _parseSarasotaHTML_(html);

  } catch (fetchErr) {
    Logger.log('❌ Sarasota fetch error: ' + fetchErr.message);
  }

  return arrests;
}

/**
 * Parse the Sarasota County HTML arrest table.
 * Sarasota uses a table with columns: Name | DOB | Booking Date | Charges | Bond
 */
function _parseSarasotaHTML_(html) {
  var arrests = [];
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - SARASOTA_CONFIG.MAX_AGE_DAYS);

  var rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  var cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  var tagPattern = /<[^>]+>/g;
  var rowCount = 0;

  while (true) {
    var rowMatch = rowPattern.exec(html);
    if (!rowMatch) break;

    var rowHtml = rowMatch[1];
    var cells = [];
    var cellMatch;
    cellPattern.lastIndex = 0;

    while (true) {
      cellMatch = cellPattern.exec(rowHtml);
      if (!cellMatch) break;
      var cellText = cellMatch[1].replace(tagPattern, '')
        .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
      cells.push(cellText);
    }

    if (cells.length < 4) continue;

    var firstCell = cells[0].toLowerCase();
    if (firstCell === 'name' || firstCell === 'last name' || firstCell === 'inmate name') continue;
    if (!cells[0] || cells[0].length < 3) continue;

    rowCount++;
    var arrest = _buildSarasotaArrestObject_(cells, rowCount);
    if (!arrest) continue;

    if (arrest.Booking_Date) {
      try {
        var bd = new Date(arrest.Booking_Date);
        if (!isNaN(bd.getTime()) && bd < cutoffDate) continue;
      } catch (e) { /* keep */ }
    }

    arrests.push(arrest);
  }

  Logger.log('📊 Sarasota: parsed ' + rowCount + ' rows → ' + arrests.length + ' valid arrests');
  return arrests;
}

/**
 * Build a standardized arrest object from Sarasota table cells.
 */
function _buildSarasotaArrestObject_(cells, rowIndex) {
  try {
    var fullName = cells[0] || '';
    var dob = cells[1] || '';
    var bookingDate = cells[2] || '';
    var charges = cells[3] || '';
    var bondAmount = cells[4] || '';

    if (!fullName || fullName.length < 3) return null;

    // Generate a booking number from name + date (Sarasota doesn't always show booking #)
    var bookingNum = 'SAR-' + fullName.replace(/[^A-Z0-9]/gi, '').substring(0, 8).toUpperCase()
      + '-' + (bookingDate || '').replace(/[^0-9]/g, '').substring(0, 8);
    if (!bookingNum || bookingNum === 'SAR--') bookingNum = 'SAR-ROW-' + rowIndex;

    // Parse name
    var firstName = '', lastName = '';
    var nameParts = fullName.split(',');
    if (nameParts.length >= 2) {
      lastName = nameParts[0].trim();
      var firstMiddle = nameParts[1].trim().split(/\s+/);
      firstName = firstMiddle[0] || '';
    } else {
      var words = fullName.trim().split(/\s+/);
      lastName = words[words.length - 1] || '';
      firstName = words[0] || '';
    }

    var bondNum = parseFloat(String(bondAmount).replace(/[$,\s]/g, '')) || 0;

    return {
      County: 'Sarasota',
      Booking_Number: bookingNum,
      Booking_Date: bookingDate.trim(),
      Full_Name: fullName.trim(),
      First_Name: firstName,
      Last_Name: lastName,
      DOB: dob.trim(),
      Age: '',
      Sex: '',
      Race: '',
      Height: '',
      Weight: '',
      Hair_Color: '',
      Eye_Color: '',
      Address: '',
      City: 'Sarasota',
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
      Notes: 'Source: Sarasota County Sheriff'
    };
  } catch (e) {
    Logger.log('⚠️ Error building Sarasota arrest object: ' + e.message);
    return null;
  }
}

// =============================================================================
// SHEET MANAGEMENT
// =============================================================================

function _getOrCreateSarasotaSheet_() {
  var ss = SpreadsheetApp.openById(SARASOTA_CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SARASOTA_CONFIG.TAB_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SARASOTA_CONFIG.TAB_NAME);
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
    Logger.log('✅ Created Sarasota_County_Arrests sheet');
  }

  return sheet;
}

function _writeSarasotaArrestsToSheet_(sheet, arrests) {
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

function _notifySarasotaQualifiedArrests_(arrests) {
  try {
    var qualified = arrests.filter(function (a) {
      return a.Lead_Score && a.Lead_Score >= SARASOTA_CONFIG.MIN_SCORE;
    });
    if (qualified.length === 0) return;

    var config = typeof getConfig === 'function' ? getConfig() : {};
    var slackUrl = config.SLACK_WEBHOOK_NEW_ARRESTS_LEE_COUNTY || '';
    if (!slackUrl || typeof sendSlackMessage !== 'function') return;

    sendSlackMessage(slackUrl,
      '🚨 *Sarasota County* — ' + qualified.length + ' new qualified arrest(s) detected by The Scout.',
      null
    );
  } catch (e) {
    Logger.log('⚠️ Sarasota Slack notify failed (non-fatal): ' + e.message);
  }
}

// =============================================================================
// TRIGGER SETUP
// =============================================================================

/**
 * Install a daily trigger for Sarasota County scraper.
 * Called by installAllTriggers() — do not run manually unless resetting.
 */
function setupSarasotaTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'runSarasotaArrestsNow') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('runSarasotaArrestsNow')
    .timeBased()
    .everyHours(6)
    .create();
  Logger.log('✅ Sarasota County trigger installed (every 6 hours)');
}
