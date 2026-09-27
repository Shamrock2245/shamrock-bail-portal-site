/**
 * IntakeLedger.js — daily reporting ledger for website (and other) intakes.
 *
 * Owner decision 2026-09-27: applications land in the CRM first (MongoDB
 * intake_queue is the source of truth). AFTER a successful save, shamrock-leads
 * (dashboard/services/intake_fanout.py) calls this action with a minimal-PII
 * row. Sheets is a reporting / data-visualisation copy only — never read back
 * as the source of truth.
 *
 * Action: appendIntakeLedger   (POST, requires GAS_API_KEY like every doPost action)
 * Body:   { action, apiKey, row: {date_et, time_et, intake_id, source, form_type,
 *           submitted_by_role, defendant_name, indemnitor_name, county,
 *           booking_number, bond_amount, surety, surety_requested,
 *           contact_phone_last4, has_email, match_confidence,
 *           matched_booking_number, status} }
 * Target: Script Property INTAKE_LEDGER_SHEET_ID (optional) else CONFIG.SHEET_ID;
 *         tab "Intake Ledger" (created with headers on first use).
 * Idempotent: an intake_id already in the tab is not appended twice.
 * No SSN / DOB / DL / street address is ever sent here.
 */
var INTAKE_LEDGER_TAB = 'Intake Ledger';
var INTAKE_LEDGER_COLUMNS = [
  'date_et', 'time_et', 'intake_id', 'source', 'form_type', 'submitted_by_role',
  'defendant_name', 'indemnitor_name', 'county', 'booking_number', 'bond_amount',
  'surety', 'surety_requested', 'contact_phone_last4', 'has_email',
  'match_confidence', 'matched_booking_number', 'status', 'logged_at'
];

function getIntakeLedgerSheet_() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = (props.getProperty('INTAKE_LEDGER_SHEET_ID') || '').trim() ||
    (typeof CONFIG !== 'undefined' && CONFIG.SHEET_ID) || '';
  if (!sheetId) throw new Error('INTAKE_LEDGER_SHEET_ID / CONFIG.SHEET_ID not set');
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName(INTAKE_LEDGER_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(INTAKE_LEDGER_TAB);
    sheet.appendRow(INTAKE_LEDGER_COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendIntakeLedger_(data) {
  var row = (data && data.row) || {};
  var intakeId = String(row.intake_id || '').trim();
  if (!intakeId) return { success: false, error: 'row.intake_id required' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { success: false, error: 'ledger busy, retry' };
  try {
    var sheet = getIntakeLedgerSheet_();
    var idCol = INTAKE_LEDGER_COLUMNS.indexOf('intake_id') + 1;
    var last = sheet.getLastRow();
    if (last > 1) {
      var found = sheet.getRange(2, idCol, last - 1, 1).createTextFinder(intakeId).matchEntireCell(true).findNext();
      if (found) return { success: true, duplicate: true, row: found.getRow() };
    }
    var values = INTAKE_LEDGER_COLUMNS.map(function (key) {
      if (key === 'logged_at') return new Date();
      var v = row[key];
      if (v === null || v === undefined) return '';
      if (typeof v === 'boolean') return v ? 'yes' : 'no';
      var s = String(v);
      // Neutralise spreadsheet formula injection from user-typed names.
      if (/^[=+\-@]/.test(s)) s = "'" + s;
      return s.slice(0, 200);
    });
    sheet.appendRow(values);
    return { success: true, duplicate: false, row: sheet.getLastRow() };
  } finally {
    lock.releaseLock();
  }
}
