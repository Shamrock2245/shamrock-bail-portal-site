/**
 * =====================================================================
 * SHEET STYLER — Professional County Sheet Formatting
 * =====================================================================
 * Applies consistent Shamrock branding to all county arrest data tabs.
 * 
 * Features:
 *   — Frozen Row 1 headers with dark green background + white text
 *   — Alternating row banding (white / light green)
 *   — Conditional formatting: In Custody (red), Released (green), Bonded (blue)
 *   — Number formatting for Bond_Amount ($#,##0.00)
 *   — Date formatting for Booking_Date, Court_Date
 *   — Column width optimization
 * 
 * @author  Shamrock Automation
 * @version 3.0.0
 * @updated 2026-04-17
 */

// ====================================================================
// BRAND COLORS
// ====================================================================

var BRAND = {
  DARK_GREEN:    '#1B5E20',
  MED_GREEN:     '#2E7D32',
  LIGHT_GREEN:   '#E8F5E9',
  ACCENT_GREEN:  '#4CAF50',
  WHITE:         '#FFFFFF',
  LIGHT_GRAY:    '#F5F5F5',
  
  // Conditional formatting
  RED_BG:        '#FFCDD2',   // In Custody
  RED_TEXT:       '#B71C1C',
  GREEN_BG:      '#C8E6C9',   // Released
  GREEN_TEXT:     '#1B5E20',
  BLUE_BG:       '#BBDEFB',   // Bonded
  BLUE_TEXT:      '#0D47A1',
  YELLOW_BG:     '#FFF9C4',   // Pending
  YELLOW_TEXT:    '#F57F17'
};


// ====================================================================
// STYLE ALL COUNTY SHEETS
// ====================================================================

function styleAllCountySheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var counties = ['Lee', 'Collier', 'Hendry', 'Charlotte', 'Manatee', 'Sarasota', 'Hillsborough', 'DeSoto'];
  var styled = 0;
  var skipped = 0;

  showToast_('🎨 Styling all county sheets...', 'Sheet Styler');

  counties.forEach(function(county) {
    var sheet = ss.getSheetByName(county);
    if (sheet && sheet.getLastRow() > 0) {
      try {
        styleCountySheet_(sheet);
        styled++;
        showToast_('🎨 Styled: ' + county + ' (' + styled + '/' + counties.length + ')', 'Sheet Styler');
      } catch (e) {
        Logger.log('⚠️ Error styling ' + county + ': ' + e.message);
        skipped++;
      }
    } else {
      skipped++;
    }
  });

  // Also style special sheets
  var specialSheets = ['Qualified_Arrests', 'IntakeQueue'];
  specialSheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 0) {
      try {
        styleCountySheet_(sheet);
        styled++;
      } catch (e) {
        Logger.log('⚠️ Error styling ' + name + ': ' + e.message);
      }
    }
  });

  showToast_('✅ Styled ' + styled + ' sheets (' + skipped + ' skipped)', 'Sheet Styler');
  SpreadsheetApp.getUi().alert(
    '🎨 Sheet Styling Complete',
    'Styled: ' + styled + ' sheets\nSkipped: ' + skipped + ' (not found or empty)\n\n' +
    'Applied:\n• Branded headers (dark green + white text)\n• Frozen header row\n• Alternating row colors\n• Custody status highlighting\n• Bond amount formatting\n• Column auto-sizing',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}


// ====================================================================
// CORE SHEET STYLER
// ====================================================================

function styleCountySheet_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // ── 1. Freeze header row ──
  sheet.setFrozenRows(1);

  // ── 2. Style header row ──
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange
    .setBackground(BRAND.DARK_GREEN)
    .setFontColor(BRAND.WHITE)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setRowHeight(1, 36);

  // ── 3. Alternating row banding ──
  // Remove existing bandings first
  var bandings = sheet.getBandings();
  bandings.forEach(function(b) { b.remove(); });

  if (lastRow > 1) {
    var dataRange = sheet.getRange(1, 1, lastRow, lastCol);
    dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREEN, true, false);
  }

  // ── 4. Data formatting ──
  if (lastRow > 1) {
    var dataRows = sheet.getRange(2, 1, lastRow - 1, lastCol);
    dataRows
      .setFontSize(10)
      .setVerticalAlignment('middle');
  }

  // ── 5. Column-specific formatting ──
  applyColumnFormatting_(sheet, headers, lastRow);

  // ── 6. Conditional formatting for Status column ──
  applyStatusConditionalFormatting_(sheet, headers, lastRow);

  // ── 7. Auto-resize key columns ──
  autoResizeKeyColumns_(sheet, headers, lastCol);

  Logger.log('✅ Styled sheet: ' + sheet.getName() + ' (' + lastRow + ' rows, ' + lastCol + ' cols)');
}


// ====================================================================
// COLUMN-SPECIFIC FORMATTING
// ====================================================================

function applyColumnFormatting_(sheet, headers, lastRow) {
  if (lastRow < 2) return;

  headers.forEach(function(header, idx) {
    var col = idx + 1;
    var h = (header || '').toString().trim();

    // Bond Amount → Currency
    if (h === 'Bond_Amount' || h === 'BondAmount') {
      sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('$#,##0.00');
    }

    // Date columns → Date format
    if (h === 'Booking_Date' || h === 'Court_Date' || h === 'DOB' || h === 'Scraped_At' || h === 'LastChecked') {
      sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('yyyy-mm-dd');
    }

    // Time columns
    if (h === 'Booking_Time' || h === 'Court_Time') {
      sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('hh:mm AM/PM');
    }

    // Lead Score → Number
    if (h === 'Lead_Score') {
      sheet.getRange(2, col, lastRow - 1, 1).setNumberFormat('0');
    }
  });
}


// ====================================================================
// CONDITIONAL FORMATTING FOR STATUS
// ====================================================================

function applyStatusConditionalFormatting_(sheet, headers, lastRow) {
  if (lastRow < 2) return;

  var statusIdx = -1;
  headers.forEach(function(h, idx) {
    var header = (h || '').toString().trim();
    if (header === 'Status' || header === 'Current_Status' || header === 'currentStatus') {
      statusIdx = idx;
    }
  });

  if (statusIdx === -1) return;

  var col = statusIdx + 1;
  var range = sheet.getRange(2, col, lastRow - 1, 1);

  // Clear existing conditional format rules for this range
  var rules = sheet.getConditionalFormatRules();
  var newRules = rules.filter(function(rule) {
    var ruleRanges = rule.getRanges();
    return !ruleRanges.some(function(r) {
      return r.getColumn() === col && r.getRow() >= 2;
    });
  });

  // In Custody → Red
  newRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('In Custody')
      .setBackground(BRAND.RED_BG)
      .setFontColor(BRAND.RED_TEXT)
      .setBold(true)
      .setRanges([range])
      .build()
  );

  // Released → Green
  newRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('Released')
      .setBackground(BRAND.GREEN_BG)
      .setFontColor(BRAND.GREEN_TEXT)
      .setBold(true)
      .setRanges([range])
      .build()
  );

  // Bonded → Blue
  newRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('Bonded')
      .setBackground(BRAND.BLUE_BG)
      .setFontColor(BRAND.BLUE_TEXT)
      .setBold(true)
      .setRanges([range])
      .build()
  );

  // Pending → Yellow
  newRules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextContains('Pending')
      .setBackground(BRAND.YELLOW_BG)
      .setFontColor(BRAND.YELLOW_TEXT)
      .setBold(true)
      .setRanges([range])
      .build()
  );

  sheet.setConditionalFormatRules(newRules);
}


// ====================================================================
// AUTO-RESIZE COLUMNS
// ====================================================================

function autoResizeKeyColumns_(sheet, headers, lastCol) {
  // Define preferred widths for known columns
  var widths = {
    'Scraped_At': 120,
    'County': 90,
    'Booking_Number': 120,
    'Full_Name': 180,
    'First_Name': 110,
    'Last_Name': 110,
    'Middle_Name': 90,
    'DOB': 100,
    'Booking_Date': 100,
    'Booking_Time': 90,
    'Status': 100,
    'Current_Status': 100,
    'currentStatus': 100,
    'Sex': 50,
    'Race': 50,
    'Height': 60,
    'Weight': 60,
    'Address': 180,
    'City': 100,
    'State': 50,
    'Zipcode': 70,
    'Charges': 300,
    'Bond_Amount': 110,
    'Bond_Paid': 80,
    'Bond_Type': 100,
    'Court_Type': 100,
    'Case_Number': 120,
    'Court_Date': 100,
    'Court_Time': 90,
    'Court_Location': 180,
    'Lead_Score': 80,
    'Lead_Status': 100,
    'Mugshot_URL': 120,
    'Detail_URL': 120
  };

  headers.forEach(function(header, idx) {
    var h = (header || '').toString().trim();
    if (widths[h]) {
      sheet.setColumnWidth(idx + 1, widths[h]);
    }
  });
}
