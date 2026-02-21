/**
 * ============================================
 * QualifiedTabRouter.gs (Refactored V2)
 * ============================================
 * 1) Enforces strict 35-column schema on 'Shamrock_Arrests_Master'
 * 2) Parses Charges string into Charge_1, Charge_2, Charge_3
 * 3) Handles Exceptions (>3 charges or multi-case) -> 'Qualified_exceptions'
 * 4) Adds 'Dashboard_Link' for one-click portal access
 * 5) Applies Conditional Formatting for exceptions
 */

/** === CONFIG === */
var QUAL_ROUTER_CONFIG = {
  SPREADSHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',

  MASTER_TAB_NAME: 'Shamrock_Arrests_Master',
  EXCEPTION_TAB_NAME: 'Qualified_exceptions',

  // County/source tabs (specified order)
  SOURCE_TABS: [
    'Lee', 'Charlotte', 'Collier', 'Sarasota', 'Hendry', 'DeSoto', 'Manatee', 'Palm Beach',
    'Seminole', 'Orange', 'Osceola', 'Pinellas', 'Broward', 'Hillsborough'
  ],

  MIN_SCORE: 70,

  // Strict Schema as requested by User
  SCHEMA_COLUMNS: [
    'Date (of Scraping)',
    'County',
    'Booking Number',
    'Arrest Number',
    'Full Name',
    'First Name',
    'Middle Name',
    'Last Name',
    'DOB',
    'Sex',
    'Address',
    'City',
    'State',
    'Zip',
    'Charges (All)',
    'Charge_1',
    'Charge_1_Bond',
    'Charge_2',
    'Charge_2_Bond',
    'Charge_3',
    'Charge_3_Bond',
    'Bond_Amount_Total',
    'Bond_Type',
    'Arrest Date',
    'Arrest Time',
    'Custody Status',
    'Custody Place',
    'Court_Date',
    'Court_Location',
    'Case_Number',
    'Detail_URL (Booking Page)',
    'Shamrock_Lead_Score',
    'Lead_Status',
    'Dashboard_Link',
    'Action_Link', // Optional portal deep link
    'AI_Risk',
    'AI_Rationale',
    'AI_Score'
  ]
};

/**
 * Main Orchestrator
 */
function scoreAndSyncQualifiedRows() {
  var ss = SpreadsheetApp.openById(QUAL_ROUTER_CONFIG.SPREADSHEET_ID);

  // 1. Ensure Target Tabs Exist & Have Headers
  var masterSheet = getOrCreateSheet_(ss, QUAL_ROUTER_CONFIG.MASTER_TAB_NAME);
  var exceptionSheet = getOrCreateSheet_(ss, QUAL_ROUTER_CONFIG.EXCEPTION_TAB_NAME);

  // 2. Score Source Tabs (Lead_Score/Status)
  // Note: We use the existing scoring logic (LeadScoringSystem logic embedded in router or external)
  // For this refactor, we assume scoring happens on the county tab level first.
  // CALLING UNIFIED SCORER:
  QUAL_ROUTER_CONFIG.SOURCE_TABS.forEach(function (tabName) {
    var sh = ss.getSheetByName(tabName);
    if (!sh) return;
    scoreSheet_(sh);
  });

  // 3. Sync Qualified Rows
  syncQualifiedRows_(ss, masterSheet, exceptionSheet);

  // 4. Apply Formatting
  applyConditionalFormatting_(masterSheet);
  applyConditionalFormatting_(exceptionSheet);
}

/**
 * Syncs qualified rows from source tabs to Master or Exception tab
 */
function syncQualifiedRows_(ss, masterSheet, exceptionSheet) {
  var masterKeys = getExistingKeys_(masterSheet);
  var exceptionKeys = getExistingKeys_(exceptionSheet);

  var masterAppends = [];
  var exceptionAppends = [];

  var dashboardBaseUrl = '';
  try {
    dashboardBaseUrl = ScriptApp.getService().getUrl();
  } catch (e) {
    // Fallback if not running as Web App
    // Fallback: read from Script Properties (set by setupAllProperties)
    dashboardBaseUrl = PropertiesService.getScriptProperties().getProperty('GAS_WEBHOOK_URL') || '';
  }

  QUAL_ROUTER_CONFIG.SOURCE_TABS.forEach(function (tabName) {
    var sourceSheet = ss.getSheetByName(tabName);
    if (!sourceSheet) return;

    var lastRow = sourceSheet.getLastRow();
    var lastCol = sourceSheet.getLastColumn();
    if (lastRow < 2) return;

    var headers = sourceSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var colMap = buildColMap_(headers);

    // We need Lead_Score to filter
    if (!colMap.Lead_Score) return;

    var data = sourceSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var score = parseFloat(row[colMap.Lead_Score - 1]);

      // Filter: Must match MIN_SCORE
      if (isNaN(score) || score < QUAL_ROUTER_CONFIG.MIN_SCORE) continue;

      // 1. Build Normalized Record
      var record = buildNormalizedRecord_(row, colMap, tabName);

      // 2. Deduplication Key (County + BookingNumber)
      var dedupeKey = (record.County + '|' + record['Booking Number']).toLowerCase().trim();

      // Check existence
      if (masterKeys.has(dedupeKey) || exceptionKeys.has(dedupeKey)) continue;

      // 3. Exception Check
      var isException = checkIsException_(record);

      // 4. Build Output Row
      var outputRow = buildOutputRow_(record, dashboardBaseUrl);

      if (isException) {
        exceptionAppends.push(outputRow);
        exceptionKeys.add(dedupeKey);
      } else {
        masterAppends.push(outputRow);
        masterKeys.add(dedupeKey);
      }
    }
  });

  // Batch Write
  if (masterAppends.length > 0) {
    masterSheet.getRange(masterSheet.getLastRow() + 1, 1, masterAppends.length, masterAppends[0].length).setValues(masterAppends);
  }
  if (exceptionAppends.length > 0) {
    exceptionSheet.getRange(exceptionSheet.getLastRow() + 1, 1, exceptionAppends.length, exceptionAppends[0].length).setValues(exceptionAppends);
  }
}



/**
 * UTILITY: Fixes the mislabeled "Dashboard" tab that contains DeSoto data.
 * Renames "Dashboard" -> "DeSoto" and creates a new blank "Dashboard".
 */
function fixDashboardTabName() {
  var ss = SpreadsheetApp.openById(QUAL_ROUTER_CONFIG.SPREADSHEET_ID);

  var dashboardSheet = ss.getSheetByName('Dashboard');
  var desotoSheet = ss.getSheetByName('DeSoto');

  // 1. Rename existing Dashboard -> DeSoto if it has data
  if (dashboardSheet) {
    if (desotoSheet) {
      // If DeSoto already exists, we might need to merge or rename to DeSoto_Old
      Logger.log('⚠️ Both Dashboard and DeSoto tabs exist.');
      dashboardSheet.setName('DeSoto_From_Dashboard');
    } else {
      dashboardSheet.setName('DeSoto');
    }
    Logger.log('✅ Renamed "Dashboard" tab to DeSoto/DeSoto_From_Dashboard.');
  }

  // 2. Create a fresh Dashboard tab for the new constructive use
  if (!ss.getSheetByName('Dashboard')) {
    var newDash = ss.insertSheet('Dashboard');
    newDash.getRange(1, 1).setValue('Shamrock Portal Dashboard');
    Logger.log('✅ Created new empty "Dashboard" tab.');
  }
}

/**
 * UTILITY: Sets the visual headers for the Dashboard tab.
 * Use this to prep the Dashboard for constructive use.
 */
function setDashboardHeaders() {
  var ss = SpreadsheetApp.openById(QUAL_ROUTER_CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName('Dashboard');
  if (!sheet) {
    Logger.log('❌ Dashboard tab not found. Run fixDashboardTabName() first.');
    return;
  }

  // Define Dashboard Headers (Customize as needed)
  var headers = [
    'Timestamp',
    'Metric A',
    'Metric B',
    'Active Leads',
    'Conversion Rate',
    'Top County',
    'Warnings',
    'Last Updated'
  ];

  sheet.getRange(2, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');

  Logger.log('✅ Dashboard headers set.');
}

/**
 * ONE-TIME CLEANUP / FORCE RESYNC
 * Clears Master & Exception tabs (preserving headers) and re-syncs everything.
 * Run this to fix schema or duplicates.
 */
function forceFullCleanup() {
  var ss = SpreadsheetApp.openById(QUAL_ROUTER_CONFIG.SPREADSHEET_ID);

  var master = getOrCreateSheet_(ss, QUAL_ROUTER_CONFIG.MASTER_TAB_NAME);
  var except = getOrCreateSheet_(ss, QUAL_ROUTER_CONFIG.EXCEPTION_TAB_NAME);

  // Clear Data (Keep Headers)
  if (master.getLastRow() > 1) {
    master.getRange(2, 1, master.getLastRow() - 1, master.getLastColumn()).clearContent();
  }
  if (except.getLastRow() > 1) {
    except.getRange(2, 1, except.getLastRow() - 1, except.getLastColumn()).clearContent();
  }

  // Clear Formatting Rules to reset cleanly
  master.clearConditionalFormatRules();
  except.clearConditionalFormatRules();

  Logger.log('🧹 Tabs cleared. Starting full sync...');

  // Run Sync
  scoreAndSyncQualifiedRows();

  Logger.log('✅ Force Cleanup Complete.');
}

/**
 * Builds a normalized record object from a source row
 */
function buildNormalizedRecord_(row, colMap, tabName) {
  var getVal = function (name) {
    if (!colMap[name]) return '';
    return String(row[colMap[name] - 1] || '').trim();
  };

  var chargesStr = getVal('Charges');
  var parsedCharges = parseCharges_(chargesStr);

  return {
    // Scraper Metadata
    'Date (of Scraping)': getVal('Scrape_Timestamp') || new Date(),
    'County': getVal('County') || tabName,

    // Identity
    'Booking Number': getVal('Booking_Number'),
    'Arrest Number': getVal('Person_ID'),
    'Full Name': getVal('Full_Name'),
    'First Name': getVal('First_Name'),
    'Middle Name': getVal('Middle_Name'),
    'Last Name': getVal('Last_Name'),
    'DOB': getVal('DOB'),
    'Sex': getVal('Sex'),

    // Location
    'Address': getVal('Address'),
    'City': getVal('City'),
    'State': getVal('State'),
    'Zip': getVal('ZIP') || getVal('Zipcode'),

    // Legal / Charges
    'Charges (All)': chargesStr,
    'Charge_1': parsedCharges[0] || '',
    'Charge_1_Bond': '',
    'Charge_2': parsedCharges[1] || '',
    'Charge_2_Bond': '',
    'Charge_3': parsedCharges[2] || '',
    'Charge_3_Bond': '',
    'Parsed_Charge_Count': parsedCharges.length,

    'Bond_Amount_Total': getVal('Bond_Amount'),
    'Bond_Type': getVal('Bond_Type'),

    // Details
    'Arrest Date': getVal('Booking_Date'),
    'Arrest Time': formatTime_(getVal('Booking_Time')), // Force Format
    'Custody Status': getVal('Status'),
    'Custody Place': getVal('Facility'),

    'Court_Date': getVal('Court_Date'),
    'Court_Location': getVal('Court_Location'),
    'Case_Number': getVal('Case_Number'),

    'Detail_URL (Booking Page)': getVal('Detail_URL'),
    'Shamrock_Lead_Score': getVal('Lead_Score'),
    'Lead_Status': getVal('Lead_Status')
  };
}

/** 
 * Helper to force time string 
 * Prevents "1899-12-30T14:30:00.000Z" issues in sheets
 */
function formatTime_(raw) {
  if (!raw) return '';
  // If it's a date object, format it
  if (raw instanceof Date) {
    return Utilities.formatDate(raw, Session.getScriptTimeZone(), 'HH:mm');
  }
  // If it looks like a full ISO string, try to parse 
  var str = String(raw);
  if (str.includes('T') || str.includes('1899')) {
    try {
      var d = new Date(str);
      return Utilities.formatDate(d, Session.getScriptTimeZone(), 'HH:mm');
    } catch (e) { return str; }
  }
  return str;
}

/**
 * Constructs the final array for the sheet based on strict schema
 */
function buildOutputRow_(record, baseUrl) {
  return QUAL_ROUTER_CONFIG.SCHEMA_COLUMNS.map(function (col) {
    if (col === 'Dashboard_Link') {
      return buildDashboardLink_(baseUrl, record);
    }
    if (col === 'Action_Link') {
      return buildActionLink_(baseUrl, record); // Placeholder for future portal deep link
    }
    return record[col] || '';
  });
}

/**
 * Logic to determine if a record is an exception
 */
function checkIsException_(record) {
  // 1. More than 3 charges
  if (record.Parsed_Charge_Count > 3) return true;

  // 2. Multiple Cases (comma separated)
  if (record.Case_Number && record.Case_Number.includes(',')) return true;

  return false;
}

/**
 * Helper to parse pipe-separated charges
 */
function parseCharges_(chargesStr) {
  if (!chargesStr) return [];
  return chargesStr.split('|').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
}

/**
 * Generates the Dashboard Link
 */
function buildDashboardLink_(baseUrl, record) {
  if (!baseUrl) return '';
  // Encodes parameters for pre-filling the Dashboard
  var params = [
    'page=Dashboard',
    'prefill=true',
    'bookingNumber=' + encodeURIComponent(record['Booking Number']),
    'county=' + encodeURIComponent(record['County']),
    'defendantName=' + encodeURIComponent(record['Full Name'])
  ];
  return baseUrl + '?' + params.join('&');
}

/**
 * Placeholder for Portal Action Link
 */
function buildActionLink_(baseUrl, record) {
  return ''; // Can implement later
}

/** === SHEET HELPERS === */

function getOrCreateSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    // Set Headers
    sh.getRange(1, 1, 1, QUAL_ROUTER_CONFIG.SCHEMA_COLUMNS.length)
      .setValues([QUAL_ROUTER_CONFIG.SCHEMA_COLUMNS])
      .setFontWeight('bold')
      .setBackground('#EFEFEF');
    sh.setFrozenRows(1);
  } else {
    // Correct Headers if they differ? 
    // For safety, we only check first col. If user wants strict re-headering, we can force it.
    // Let's force update headers to match new Schema
    sh.getRange(1, 1, 1, QUAL_ROUTER_CONFIG.SCHEMA_COLUMNS.length)
      .setValues([QUAL_ROUTER_CONFIG.SCHEMA_COLUMNS]);
  }
  return sh;
}

function getExistingKeys_(sheet) {
  var keys = new Set();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return keys;

  // Columns constraints: County is col 2, Booking # is col 3 in new schema
  // Index 1 and 2

  var data = sheet.getRange(2, 2, lastRow - 1, 2).getValues(); // Get County & Booking Number columns

  for (var i = 0; i < data.length; i++) {
    var county = String(data[i][0]).toLowerCase().trim();
    var booking = String(data[i][1]).toLowerCase().trim();
    if (booking) keys.add(county + '|' + booking);
  }
  return keys;
}

/**
 * Header -> Index Map
 */
function buildColMap_(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (h) map[h] = i + 1;
  }
  return map;
}

/**
 * Applies Conditional Formatting for Exceptions (Yellow)
 * Rule: If Charges (All) has more than 3 pipes OR Case_Number has comma
 */
function applyConditionalFormatting_(sheet) {
  var rules = sheet.getConditionalFormatRules();
  // Clear existing rules to prevent duplicates? Or append?
  // Let's append if not exists, or replace. simpler to replace for this specific logic 
  // actually, let's just clear for now to ensure clean state as per "Refactor".
  sheet.clearConditionalFormatRules();

  var newRules = [];

  // Yellow background if Exception
  // Formula: =OR(LEN(INDIRECT("O"&ROW())) - LEN(SUBSTITUTE(INDIRECT("O"&ROW()), "|", "")) >= 3, REGEXMATCH(INDIRECT("AD"&ROW()), ","))
  // Column O is 'Charges (All)' (15th), Column AD is 'Case_Number' (30th)
  // Note: letters depend on schema index.
  // O = 15, AD = 30.

  var formula = '=OR(LEN($O2)-LEN(SUBSTITUTE($O2,"|",""))>=3, REGEXMATCH($AD2, ","))';

  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(formula)
    .setBackground('#FFF2CC') // Light Yellow
    .setRanges([sheet.getRange(2, 1, sheet.getMaxRows() - 1, sheet.getMaxColumns())])
    .build();

  newRules.push(rule);
  sheet.setConditionalFormatRules(newRules);
}


/**
 * ============================================
 * SCORING UTILS (Restored & Unified)
 * ============================================
 */

// Key Constants for Scoring
var ROUTER_SCORING_CONFIG = {
  HOT_THRESHOLD: 70,
  WARM_THRESHOLD: 40,
  PASS_THRESHOLD: 40,
  RELEASED_NEVER_QUALIFIES: true,

  // Points System
  POINTS: {
    BOND_HIGH: 40,     // $50k+
    BOND_MED: 25,      // $10k-$50k
    BOND_LOW: 10,      // $2.5k-$10k

    CUSTODY_IN: 20,
    CUSTODY_OUT: -60,

    TRAFFICKING: 30,
    DUI: 25,
    DOMESTIC: 20,
    BATTERY: 15,
    VOP: 15,
    THEFT: 10,
    BURGLARY: 15,

    CAPITAL: -200,
    FEDERAL: -200,
    IMMIGRATION: -200
  }
};

var ROUTER_LEAD_STATUS = {
  HOT: "Hot",
  WARM: "Warm",
  COLD: "Cold",
  DISQUALIFIED: "Disqualified"
};

function scoreSheet_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var colMap = buildColMap_(headers);

  // Ensure columns exist
  colMap = ensureColumn_(sheet, colMap, 'Lead_Score');
  colMap = ensureColumn_(sheet, colMap, 'Lead_Status');

  // Refresh dimensions after possible add
  lastCol = sheet.getLastColumn();
  headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  colMap = buildColMap_(headers);

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  var scoreOut = [];
  var statusOut = [];
  var changed = false;

  for (var i = 0; i < values.length; i++) {
    var record = {};
    for (var c = 0; c < headers.length; c++) {
      record[String(headers[c]).trim()] = values[i][c];
    }

    // Only re-score if missing (optional optimization) or always update?
    // Let's always update to catch status changes
    var res = scoreArrestLeadCompat_(record);
    scoreOut.push([res.score]);
    statusOut.push([res.status]);
  }

  // Write back
  if (colMap.Lead_Score && colMap.Lead_Status) {
    sheet.getRange(2, colMap.Lead_Score, scoreOut.length, 1).setValues(scoreOut);
    sheet.getRange(2, colMap.Lead_Status, statusOut.length, 1).setValues(statusOut);
  }
}

/**
 * Advanced Scoring Model
 */
function scoreArrestLeadCompat_(record) {
  var score = 0;
  var reasons = [];
  var disqualified = false;

  // 1. Inputs
  var bondAmount = parseFloat(String(record.Bond_Amount || '0').replace(/[$,]/g, '')) || 0;
  var bondType = String(record.Bond_Type || '').toLowerCase();
  var statusRaw = String(record.Status || record['Custody Status'] || '').toLowerCase();

  var chargesText = (
    String(record.Charges || '') + " " +
    String(record.Charge_1 || '') + " " +
    String(record.Charge_2 || '')
  ).toLowerCase();

  // 2. Custody
  var inCustody = statusRaw.includes('in custody') || statusRaw.includes('incustody') || statusRaw.includes('booked') || statusRaw.includes('jail');
  var released = statusRaw.includes('released') || statusRaw.includes('discharged') || statusRaw.includes('bonded');

  if (ROUTER_SCORING_CONFIG.RELEASED_NEVER_QUALIFIES && released) {
    score += ROUTER_SCORING_CONFIG.POINTS.CUSTODY_OUT;
  } else if (inCustody) {
    score += ROUTER_SCORING_CONFIG.POINTS.CUSTODY_IN;
  }

  // 3. Disqualifiers
  var DISQUALIFY_KW = ['capital', 'murder', 'homicide', 'federal', 'u.s. marshal', 'us marshal', 'ice hold', 'immigration', 'detainer'];
  for (var i = 0; i < DISQUALIFY_KW.length; i++) {
    if (chargesText.includes(DISQUALIFY_KW[i])) {
      disqualified = true;
      score += ROUTER_SCORING_CONFIG.POINTS.FEDERAL;
      break;
    }
  }

  if (bondType.includes('no bond') || bondType.includes('hold')) {
    disqualified = true;
    score -= 100;
  }

  // 4. Bond Amount (ROI)
  if (bondAmount === 0) score -= 50;
  else if (bondAmount < 2500) score -= 10;
  else if (bondAmount < 10000) score += ROUTER_SCORING_CONFIG.POINTS.BOND_LOW;
  else if (bondAmount < 50000) score += ROUTER_SCORING_CONFIG.POINTS.BOND_MED;
  else score += ROUTER_SCORING_CONFIG.POINTS.BOND_HIGH;

  // 5. Keywords
  if (chargesText.includes('trafficking')) score += ROUTER_SCORING_CONFIG.POINTS.TRAFFICKING;
  if (chargesText.includes('dui') || chargesText.includes('driving under')) score += ROUTER_SCORING_CONFIG.POINTS.DUI;
  if (chargesText.includes('domestic') || chargesText.includes('battery')) score += ROUTER_SCORING_CONFIG.POINTS.DOMESTIC;
  if (chargesText.includes('violation of probation') || chargesText.includes('vop')) score += ROUTER_SCORING_CONFIG.POINTS.VOP;

  // Final Status
  var leadStatus = ROUTER_LEAD_STATUS.COLD;
  if (disqualified || score < 0) leadStatus = ROUTER_LEAD_STATUS.DISQUALIFIED;
  else if (score >= ROUTER_SCORING_CONFIG.HOT_THRESHOLD) leadStatus = ROUTER_LEAD_STATUS.HOT;
  else if (score >= ROUTER_SCORING_CONFIG.WARM_THRESHOLD) leadStatus = ROUTER_LEAD_STATUS.WARM;

  return {
    score: score,
    status: leadStatus
  };
}

/** Ensure column exists helper */
function ensureColumn_(sheet, colMap, colName) {
  if (colMap[colName]) return colMap;
  sheet.insertColumnAfter(sheet.getLastColumn());
  sheet.getRange(1, sheet.getLastColumn()).setValue(colName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return buildColMap_(headers);
}

/**
 * Install Trigger
 */
function installQualifiedRouterTrigger_15min() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'scoreAndSyncQualifiedRows') ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger('scoreAndSyncQualifiedRows')
    .timeBased()
    .everyMinutes(15)
    .create();
}
