/**
 * ============================================
 * QualifiedTabRouter.gs (Upgraded)
 * ============================================
 * 1) Scores leads in county tabs (adds Lead_Score / Lead_Status if missing)
 * 2) Copies qualifying ENTIRE ROWS into "Qualified" (same behavior as before)
 * 3) ALSO writes qualifying leads into a schema-ordered fallback queue tab:
 *      "Qualified_Schema_Queue"
 *    so failed SignNow document generation can be re-sent later without losing work.
 */

/** === CONFIG === */
var QUAL_ROUTER_CONFIG = {
  SPREADSHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',

  QUALIFIED_TAB_NAME: 'Qualified',
  QUEUE_TAB_NAME: 'Qualified_Schema_Queue',

  // County/source tabs (specified order)
  SOURCE_TABS: [
    'Lee', 'Charlotte', 'Collier', 'Sarasota', 'Hendry', 'DeSoto', 'Manatee', 'Palm Beach',
    'Seminole', 'Orange', 'Osceola', 'Pinellas', 'Broward', 'Hillsborough'
  ],

  MIN_SCORE: 70,

  /**
   * Canonical schema columns in the exact order your PDF/normalizers expect.
   * Best-effort default based on your normalize.js record shape.
   *
   * IMPORTANT:
   * - Adjust once to match config/schema.json column order exactly.
   * - Do not rename these once your pipeline depends on them.
   */
  SCHEMA_COLUMNS: [
    'Booking_Number',
    'Full_Name',
    'First_Name',
    'Last_Name',
    'DOB',
    'Sex',
    'Race',
    'Arrest_Date',
    'Arrest_Time',
    'Booking_Date',
    'Booking_Time',
    'Agency',
    'Address',
    'City',
    'State',
    'Zipcode',
    'Charges',
    'Charge_1',
    'Charge_1_Statute',
    'Charge_1_Bond',
    'Charge_2',
    'Charge_2_Statute',
    'Charge_2_Bond',
    'Bond_Amount',
    'Bond_Paid',
    'Court_Date',
    'Case_Number',
    'Mugshot_URL',
    'Source_URL',
    'County',
    'Ingested_At_ISO',
    'Lead_Score',
    'Lead_Status',
    'extra_fields_json'
  ],

  // Operational columns appended to the queue tab (do not map from source)
  QUEUE_META_COLUMNS: [
    'router_dedupe_key',
    'router_source_tab',
    'router_synced_at',
    'signnow_status',            // PENDING | SENT | FAILED
    'signnow_last_attempt_at',
    'signnow_attempt_count',
    'signnow_error',
    'signnow_document_id'
  ]
};

/**
 * One-click orchestrator:
 * 1) Scores rows in each source tab
 * 2) Syncs qualifying rows into "Qualified"
 * 3) Writes qualifying rows into schema-ordered queue "Qualified_Schema_Queue"
 */
function scoreAndSyncQualifiedRows() {
  var ss = SpreadsheetApp.openById(QUAL_ROUTER_CONFIG.SPREADSHEET_ID);

  // 1) Score each source sheet
  QUAL_ROUTER_CONFIG.SOURCE_TABS.forEach(function (tabName) {
    var sh = ss.getSheetByName(tabName);
    if (!sh) return;
    scoreSheet_(sh);
  });

  // 2) Sync qualified full rows
  syncQualifiedRows_();

  // 3) Sync qualified into schema queue
  syncQualifiedSchemaQueue_();
}

/**
 * Scores all data rows on a sheet.
 * If Lead_Score / Lead_Status columns are missing, they are added.
 */
function scoreSheet_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var colMap = buildColMap_(headers);

  colMap = ensureColumn_(sheet, colMap, 'Lead_Score');
  colMap = ensureColumn_(sheet, colMap, 'Lead_Status');

  // Refresh dimensions after adding columns
  lastCol = sheet.getLastColumn();
  headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  colMap = buildColMap_(headers);

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  var scoreOut = [];
  var statusOut = [];

  for (var i = 0; i < values.length; i++) {
    var record = {};
    for (var c = 0; c < headers.length; c++) {
      record[String(headers[c]).trim()] = values[i][c];
    }

    var res = scoreArrestLeadCompat_(record);
    scoreOut.push([res.score]);
    statusOut.push([res.status]);
  }

  sheet.getRange(2, colMap.Lead_Score, scoreOut.length, 1).setValues(scoreOut);
  sheet.getRange(2, colMap.Lead_Status, statusOut.length, 1).setValues(statusOut);
}

/**
 * Syncs qualified rows from county tabs into "Qualified" tab, copying the ENTIRE row exactly as-is.
 * (Same behavior you already had.)
 */
function syncQualifiedRows_() {
  var ss = SpreadsheetApp.openById(QUAL_ROUTER_CONFIG.SPREADSHEET_ID);
  var qualifiedSheet = getOrCreateQualifiedSheet_(ss);

  var existingKeys = getExistingQualifiedKeys_(qualifiedSheet);

  var appendRows = [];
  var now = new Date();

  QUAL_ROUTER_CONFIG.SOURCE_TABS.forEach(function (tabName) {
    var sh = ss.getSheetByName(tabName);
    if (!sh) return;

    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if (lastRow < 2) return;

    var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    var colMap = buildColMap_(headers);

    if (!colMap.Lead_Score) return;

    var data = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

    for (var r = 0; r < data.length; r++) {
      var row = data[r];
      var score = parseFloat(row[colMap.Lead_Score - 1]);
      if (isNaN(score) || score < QUAL_ROUTER_CONFIG.MIN_SCORE) continue;

      var key = buildDedupeKey_(headers, colMap, row, tabName);
      if (existingKeys.has(key)) continue;

      appendRows.push([now, tabName].concat(row));
      existingKeys.add(key);
    }
  });

  if (appendRows.length === 0) return;

  qualifiedSheet
    .getRange(qualifiedSheet.getLastRow() + 1, 1, appendRows.length, appendRows[0].length)
    .setValues(appendRows);
}

/**
 * NEW:
 * Writes qualified leads into a schema-ordered queue tab so document generation can be retried later.
 */
function syncQualifiedSchemaQueue_() {
  var ss = SpreadsheetApp.openById(QUAL_ROUTER_CONFIG.SPREADSHEET_ID);
  var queueSheet = getOrCreateQueueSheet_(ss);

  var queueHeaders = queueSheet.getRange(1, 1, 1, queueSheet.getLastColumn()).getValues()[0];
  var queueColMap = buildColMap_(queueHeaders);

  var existingQueueKeys = getExistingQueueKeys_(queueSheet, queueColMap);

  var now = new Date();
  var append = [];

  QUAL_ROUTER_CONFIG.SOURCE_TABS.forEach(function (tabName) {
    var sh = ss.getSheetByName(tabName);
    if (!sh) return;

    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    if (lastRow < 2) return;

    var srcHeaders = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    var srcColMap = buildColMap_(srcHeaders);

    if (!srcColMap.Lead_Score) return;

    var data = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

    for (var r = 0; r < data.length; r++) {
      var row = data[r];
      var score = parseFloat(row[srcColMap.Lead_Score - 1]);
      if (isNaN(score) || score < QUAL_ROUTER_CONFIG.MIN_SCORE) continue;

      var dedupeKey = buildDedupeKey_(srcHeaders, srcColMap, row, tabName);
      if (existingQueueKeys.has(dedupeKey)) continue;

      // Build a normalized object from the source row (header -> value)
      var srcObj = {};
      for (var c = 0; c < srcHeaders.length; c++) {
        var h = String(srcHeaders[c] || '').trim();
        if (!h) continue;
        srcObj[h] = row[c];
      }

      // Build schema row in correct order
      var schemaRow = buildSchemaRow_(srcObj, tabName);

      // Append meta
      var meta = {
        router_dedupe_key: dedupeKey,
        router_source_tab: tabName,
        router_synced_at: now,
        signnow_status: 'PENDING',
        signnow_last_attempt_at: '',
        signnow_attempt_count: 0,
        signnow_error: '',
        signnow_document_id: ''
      };

      var fullRow = [];
      // Fill schema columns
      QUAL_ROUTER_CONFIG.SCHEMA_COLUMNS.forEach(function (colName) {
        fullRow.push(schemaRow[colName] || '');
      });
      // Fill meta columns
      QUAL_ROUTER_CONFIG.QUEUE_META_COLUMNS.forEach(function (metaCol) {
        fullRow.push(meta[metaCol] !== undefined ? meta[metaCol] : '');
      });

      append.push(fullRow);
      existingQueueKeys.add(dedupeKey);
    }
  });

  if (append.length === 0) return;

  queueSheet
    .getRange(queueSheet.getLastRow() + 1, 1, append.length, append[0].length)
    .setValues(append);
}

/** === Helpers: Sheet creation === */

function getOrCreateQualifiedSheet_(ss) {
  var sh = ss.getSheetByName(QUAL_ROUTER_CONFIG.QUALIFIED_TAB_NAME);
  if (sh) return sh;

  sh = ss.insertSheet(QUAL_ROUTER_CONFIG.QUALIFIED_TAB_NAME);

  // Copy headers from first available source tab
  var sourceHeaders = null;
  for (var i = 0; i < QUAL_ROUTER_CONFIG.SOURCE_TABS.length; i++) {
    var s = ss.getSheetByName(QUAL_ROUTER_CONFIG.SOURCE_TABS[i]);
    if (s && s.getLastColumn() > 0) {
      sourceHeaders = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
      break;
    }
  }

  var headers = ['Sync_Timestamp', 'Source_Tab'].concat(sourceHeaders || []);
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  return sh;
}

function getOrCreateQueueSheet_(ss) {
  var sh = ss.getSheetByName(QUAL_ROUTER_CONFIG.QUEUE_TAB_NAME);
  if (sh) return sh;

  sh = ss.insertSheet(QUAL_ROUTER_CONFIG.QUEUE_TAB_NAME);

  var headers = QUAL_ROUTER_CONFIG.SCHEMA_COLUMNS.concat(QUAL_ROUTER_CONFIG.QUEUE_META_COLUMNS);
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  // Helpful: protect the header row from edits
  try {
    var p = sh.getRange(1, 1, 1, headers.length).protect();
    p.setDescription('Protect queue headers');
    p.setWarningOnly(true);
  } catch (e) { }

  return sh;
}

/** === Helpers: Existing dedupe keys === */

function getExistingQualifiedKeys_(qualifiedSheet) {
  var lastRow = qualifiedSheet.getLastRow();
  var lastCol = qualifiedSheet.getLastColumn();
  var keys = new Set();
  if (lastRow < 2) return keys;

  var headers = qualifiedSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var sourceHeaders = headers.slice(2);
  var colMap = buildColMap_(sourceHeaders);

  var data = qualifiedSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i].slice(2);
    var sourceTab = data[i][1];
    var key = buildDedupeKey_(sourceHeaders, colMap, row, sourceTab);
    keys.add(key);
  }
  return keys;
}

function getExistingQueueKeys_(queueSheet, queueColMap) {
  var keys = new Set();
  var lastRow = queueSheet.getLastRow();
  if (lastRow < 2) return keys;

  var keyCol = queueColMap.router_dedupe_key;
  if (!keyCol) return keys;

  var vals = queueSheet.getRange(2, keyCol, lastRow - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    var k = String(vals[i][0] || '').trim();
    if (k) keys.add(k);
  }
  return keys;
}

/** === Helpers: Mapping / schema row build === */

/**
 * Build schema object from a source object.
 * - Copies known canonical fields if present
 * - Creates default values for a few required fields
 * - Collects unknown extras into extra_fields_json
 */
function buildSchemaRow_(srcObj, sourceTab) {
  var out = {};
  var extras = {};

  // copy direct if present
  QUAL_ROUTER_CONFIG.SCHEMA_COLUMNS.forEach(function (col) {
    if (col === 'extra_fields_json') return;
    if (srcObj[col] !== undefined && srcObj[col] !== null && String(srcObj[col]).trim() !== '') {
      out[col] = srcObj[col];
    }
  });

  // Provide sane defaults if not present
  if (!out.County) out.County = (srcObj.County || sourceTab || '');
  if (!out.State) out.State = (srcObj.State || 'FL');
  if (!out.Ingested_At_ISO) out.Ingested_At_ISO = new Date().toISOString();

  // Ensure Lead_Score/Lead_Status propagate into schema queue
  if (!out.Lead_Score && srcObj.Lead_Score !== undefined) out.Lead_Score = srcObj.Lead_Score;
  if (!out.Lead_Status && srcObj.Lead_Status !== undefined) out.Lead_Status = srcObj.Lead_Status;

  // Anything not in schema becomes extra_fields_json
  var schemaSet = {};
  QUAL_ROUTER_CONFIG.SCHEMA_COLUMNS.forEach(function (c) { schemaSet[c] = true; });

  Object.keys(srcObj).forEach(function (k) {
    if (!schemaSet[k]) {
      var v = srcObj[k];
      if (v !== null && v !== '' && v !== undefined) extras[k] = v;
    }
  });

  out.extra_fields_json = Object.keys(extras).length ? JSON.stringify(extras) : '';

  return out;
}

/** Build a stable dedupe key: County + Booking_Number if present; else Booking_Number; else fallback */
function buildDedupeKey_(headers, colMap, row, sourceTab) {
  var county = '';
  var booking = '';

  if (colMap.County) county = String(row[colMap.County - 1] || '').trim();
  if (colMap.Booking_Number) booking = String(row[colMap.Booking_Number - 1] || '').trim();

  if (booking) return (county || 'NA') + '|' + booking;

  return String(sourceTab || 'NA') + '|' + String(row.join('¦')).substring(0, 200);
}

/** Header -> 1-based index map */
function buildColMap_(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    if (h !== null && h !== '') map[String(h).trim()] = i + 1;
  }
  return map;
}

/** Ensure a column exists; create at end if missing; return refreshed colMap */
function ensureColumn_(sheet, colMap, colName) {
  if (colMap[colName]) return colMap;
  sheet.insertColumnAfter(sheet.getLastColumn());
  sheet.getRange(1, sheet.getLastColumn()).setValue(colName);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return buildColMap_(headers);
}

/**
 * ============================================
 * UNIFIED SCORING ENGINE (Ported & Optimized)
 * ============================================
 */

// Key Constants
const SCORING_CONFIG = {
  HOT_THRESHOLD: 70,
  WARM_THRESHOLD: 40,
  PASS_THRESHOLD: 40, // Warm or Hot routes to qualified
  RELEASED_NEVER_QUALIFIES: true, // Hard rule

  // "AI" Prompts / Weights (Tuned for ROI)
  POINTS: {
    BOND_HIGH: 40,     // $50k+
    BOND_MED: 25,      // $10k-$50k
    BOND_LOW: 10,      // $2.5k-$10k

    CUSTODY_IN: 20,
    CUSTODY_OUT: -60,

    // Charge Keywords
    TRAFFICKING: 30,   // $$$
    DUI: 25,           // Urgent
    DOMESTIC: 20,      // Urgent
    BATTERY: 15,
    VOP: 15,           // No bond usually, but good to track
    THEFT: 10,
    BURGLARY: 15,

    // Disqualifiers
    CAPITAL: -200,     // Murder etc
    FEDERAL: -200,
    IMMIGRATION: -200
  }
};

// LEAD_STATUS is already declared in LeadScoringSystem.js
// const LEAD_STATUS = {
//   HOT: "Hot",
//   WARM: "Warm",
//   COLD: "Cold",
//   DISQUALIFIED: "Disqualified"
// };

/**
 * Advanced Scoring Model (The "AI" Brain)
 * Returns: { score:number, status:string, qualified:boolean, reasons:string[] }
 */
function scoreArrestLeadCompat_(record) {
  let score = 0;
  var reasons = [];
  var disqualified = false;

  // 1. Parse Inputs
  var bondAmount = parseFloat(String(record.Bond_Amount || '0').replace(/[$,]/g, '')) || 0;
  var bondType = String(record.Bond_Type || '').toLowerCase();
  var statusRaw = String(record.Status || '').toLowerCase();

  // Combine all charge text for broad keyword matching
  var chargesText = (
    String(record.Charges || '') + " " +
    String(record.Charge_1 || '') + " " +
    String(record.Charge_2 || '')
  ).toLowerCase();

  // 2. Custody Status Analysis
  var inCustody = statusRaw.includes('in custody') || statusRaw.includes('incustody') || statusRaw.includes('booked') || statusRaw.includes('jail');
  var released = statusRaw.includes('released') || statusRaw.includes('discharged') || statusRaw.includes('bonded');

  if (SCORING_CONFIG.RELEASED_NEVER_QUALIFIES && released) {
    // We still score it for analytics, but it won't route
    reasons.push("Hard Rule: Released");
    score += SCORING_CONFIG.POINTS.CUSTODY_OUT;
  } else if (inCustody) {
    score += SCORING_CONFIG.POINTS.CUSTODY_IN;
    reasons.push("In Custody");
  }

  // 3. Disqualifiers (Fail Fast)
  const DISQUALIFY_KW = ['capital', 'murder', 'homicide', 'federal', 'u.s. marshal', 'us marshal', 'ice hold', 'immigration', 'detainer'];
  for (var i = 0; i < DISQUALIFY_KW.length; i++) {
    if (chargesText.includes(DISQUALIFY_KW[i])) {
      disqualified = true;
      score += SCORING_CONFIG.POINTS.FEDERAL;
      reasons.push("Disqualified: " + DISQUALIFY_KW[i]);
      break;
    }
  }

  if (bondType.includes('no bond') || bondType.includes('hold')) {
    disqualified = true;
    score -= 100;
    reasons.push("No Bond/Hold");
  }

  // 4. Bond Amount Logic (ROI Potential)
  if (bondAmount === 0) {
    score -= 50;
  } else if (bondAmount < 2500) {
    score -= 10; // Small bonds often not worth paperwork time unless simple
  } else if (bondAmount < 10000) {
    score += SCORING_CONFIG.POINTS.BOND_LOW;
  } else if (bondAmount < 50000) {
    score += SCORING_CONFIG.POINTS.BOND_MED;
  } else {
    score += SCORING_CONFIG.POINTS.BOND_HIGH;
  }

  // 5. Charge "Prompt" Matching (Charge Value)
  // We look for high-value keywords
  if (chargesText.includes('trafficking')) { score += SCORING_CONFIG.POINTS.TRAFFICKING; reasons.push("Trafficking"); }
  if (chargesText.includes('dui') || chargesText.includes('driving under')) { score += SCORING_CONFIG.POINTS.DUI; reasons.push("DUI"); }
  if (chargesText.includes('domestic') || chargesText.includes('battery')) { score += SCORING_CONFIG.POINTS.DOMESTIC; reasons.push("Domestic/Battery"); }
  if (chargesText.includes('violation of probation') || chargesText.includes('vop')) { score += SCORING_CONFIG.POINTS.VOP; reasons.push("VOP"); }

  // 6. Data Completeness
  if (record.Full_Name && record.Booking_Number && record.Charges) {
    score += 10;
  } else {
    score -= 20;
    reasons.push("Missing Data");
  }

  // 7. Final Classification
  var leadStatus = LEAD_STATUS.COLD;
  if (disqualified || score < 0) leadStatus = LEAD_STATUS.DISQUALIFIED;
  else if (score >= SCORING_CONFIG.HOT_THRESHOLD) leadStatus = LEAD_STATUS.HOT;
  else if (score >= SCORING_CONFIG.WARM_THRESHOLD) leadStatus = LEAD_STATUS.WARM;

  // Qualification Check
  var qualified = (score >= SCORING_CONFIG.PASS_THRESHOLD) && !disqualified && !(SCORING_CONFIG.RELEASED_NEVER_QUALIFIES && released);

  return {
    score: score,
    status: leadStatus,
    qualified: qualified,
    reasons: reasons
  };
}

/**
 * Trigger installer (unchanged)
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
