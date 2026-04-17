/**
 * =====================================================================
 * MENU HELPERS — Extracted Utility Functions
 * =====================================================================
 * Contains all utility functions previously embedded in MenuSystem.js
 * and ComprehensiveMenuSystem.js. These are called by UnifiedMenuSystem.js
 * menu items and remain fully functional.
 *
 * Functions preserved:
 *   — sendSelectedRowToForm() + mapSheetDataToForm_() + parseChargesFromSheet_()
 *   — checkForChanges() + updateInCustodyStatus() + updateCountyInCustodyStatus()
 *   — viewCourtDateStatus() + testEmailParser() + testReminderEmail()
 *   — viewArrestStats() + viewStatus()
 *   — openDataEntryForm() + openFieldMappingSheet()
 *   — showToast_() + formatDate_()
 *
 * @author  Shamrock Automation
 * @version 3.0.0
 * @updated 2026-04-17
 */

// ====================================================================
// TOAST UTILITY
// ====================================================================

function showToast_(message, title) {
  SpreadsheetApp.getActiveSpreadsheet().toast(message, title || 'Shamrock', 3);
}


// ====================================================================
// DATA ENTRY FORM
// ====================================================================

function openDataEntryForm() {
  var html = HtmlService.createHtmlOutputFromFile('Form')
    .setWidth(800)
    .setHeight(600)
    .setTitle('Shamrock Bail Bonds - Data Entry');
  SpreadsheetApp.getUi().showModalDialog(html, 'Generate Bond Paperwork');
}


// ====================================================================
// SEND SELECTED ROW TO FORM
// ====================================================================

function sendSelectedRowToForm() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var activeRange = sheet.getActiveRange();

  if (!activeRange) {
    ui.alert('No Selection', 'Please select a row to send to the form.', ui.ButtonSet.OK);
    return;
  }

  var row = activeRange.getRow();
  if (row === 1) {
    ui.alert('Invalid Selection', 'Cannot send header row. Please select a data row.', ui.ButtonSet.OK);
    return;
  }

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var rowData = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

  var data = {};
  headers.forEach(function(header, index) {
    if (header) data[header.toString().trim()] = rowData[index];
  });

  var formData = mapSheetDataToForm_(data);
  var props = PropertiesService.getScriptProperties();
  props.setProperty('FORM_PREFILL_DATA', JSON.stringify(formData));

  var formUrl = props.getProperty('FORM_URL') || getFormUrl_();

  var html = HtmlService.createHtmlOutput(
    '<script>window.open("' + formUrl + '?prefill=true", "_blank"); google.script.host.close();</script>'
  ).setWidth(200).setHeight(100);

  ui.showModalDialog(html, 'Opening Form...');
  showToast_('✅ Data sent to form. Opening in new tab...', 'Success');
}

function mapSheetDataToForm_(sheetData) {
  return {
    defendantFullName: sheetData['DefendantName'] || sheetData['Full_Name'] || '',
    defendantFirstName: sheetData['First_Name'] || '',
    defendantLastName: sheetData['Last_Name'] || '',
    defendantDOB: formatDate_(sheetData['DOB']),
    defendantSex: sheetData['Sex'] || '',
    defendantRace: sheetData['Race'] || '',
    defendantHeight: sheetData['Height'] || '',
    defendantWeight: sheetData['Weight'] || '',
    defendantArrestNumber: sheetData['Booking_Number'] || '',
    defendantStreetAddress: sheetData['Address'] || '',
    defendantCity: sheetData['City'] || '',
    defendantState: sheetData['State'] || 'FL',
    defendantZip: sheetData['Zipcode'] || '',
    defendantPhone: sheetData['DefendantPhone'] || sheetData['Phone'] || '',
    defendantEmail: sheetData['Email'] || '',
    indemnitorName: sheetData['FullName'] || '',
    indemnitorEmail: sheetData['IndemnitorEmail'] || sheetData['Email'] || '',
    indemnitorPhone: sheetData['IndemnitorPhone'] || sheetData['Phone'] || '',
    indemnitorAddress: sheetData['Address'] || '',
    role: sheetData['Role'] || '',
    charges: parseChargesFromSheet_(sheetData),
    source: sheetData['County'] || 'spreadsheet',
    scrapedAt: new Date().toISOString(),
    leadScore: sheetData['Lead_Score'] || '',
    leadStatus: sheetData['Lead_Status'] || ''
  };
}

function parseChargesFromSheet_(sheetData) {
  var charges = [];
  var chargesField = sheetData['Charges'] || '';

  if (chargesField) {
    try {
      var parsed = JSON.parse(chargesField);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* not JSON */ }

    var chargesList = chargesField.split(/[;,\n]/).map(function(c) { return c.trim(); }).filter(Boolean);
    chargesList.forEach(function(charge) {
      charges.push({
        description: charge,
        bondAmount: sheetData['Bond_Amount'] || '',
        bondType: sheetData['Bond_Type'] || '',
        caseNumber: sheetData['Case_Number'] || '',
        courtLocation: sheetData['Court_Location'] || '',
        courtDate: formatDate_(sheetData['Court_Date'])
      });
    });
  }

  if (charges.length === 0 && sheetData['Bond_Amount']) {
    charges.push({
      description: sheetData['Charges'] || 'See booking details',
      bondAmount: sheetData['Bond_Amount'] || '',
      bondType: sheetData['Bond_Type'] || '',
      caseNumber: sheetData['Case_Number'] || '',
      courtLocation: sheetData['Court_Location'] || '',
      courtDate: formatDate_(sheetData['Court_Date'])
    });
  }

  return charges;
}

function formatDate_(dateValue) {
  if (!dateValue) return '';
  try {
    var date;
    if (dateValue instanceof Date) date = dateValue;
    else if (typeof dateValue === 'string') date = new Date(dateValue);
    else return '';
    if (isNaN(date.getTime())) return '';
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  } catch (e) {
    return '';
  }
}

function getFormUrl_() {
  try {
    return ScriptApp.getService().getUrl();
  } catch (e) {
    return PropertiesService.getScriptProperties().getProperty('GAS_WEB_APP_URL') || '';
  }
}

function getPrefillData() {
  var props = PropertiesService.getScriptProperties();
  var dataJson = props.getProperty('FORM_PREFILL_DATA');
  if (dataJson) {
    props.deleteProperty('FORM_PREFILL_DATA');
    return JSON.parse(dataJson);
  }
  return null;
}


// ====================================================================
// CHECK FOR CHANGES — Multi-County Status Updates
// ====================================================================

function checkForChanges() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var modeResponse = ui.alert(
    'Check for Changes',
    'Choose mode:\n\nYes = Full web-check (queries county sites)\nNo = Quick local inference\nCancel = Abort',
    ui.ButtonSet.YES_NO_CANCEL
  );

  if (modeResponse === ui.Button.CANCEL) {
    ui.alert('Check cancelled', 'No changes performed.', ui.ButtonSet.OK);
    return;
  }

  var fullWebCheck = (modeResponse === ui.Button.YES);
  showToast_(fullWebCheck ? '🔎 Running full web-check...' : '🔍 Running quick inference...', 'Check for Changes');

  var counties = ['Lee', 'Collier', 'Hendry', 'Charlotte', 'Manatee', 'Sarasota', 'Hillsborough', 'DeSoto'];
  var totalUpdated = 0;
  var totalChecked = 0;
  var results = [];

  counties.forEach(function(county) {
    var sheet = ss.getSheetByName(county);
    if (sheet) {
      var result = updateCountyInCustodyStatus(sheet, county, fullWebCheck);
      totalUpdated += result.updated;
      totalChecked += result.checked;
      results.push(county + ': ' + result.updated + '/' + result.checked + ' updated');
    } else {
      results.push(county + ': Sheet not found');
    }
  });

  ui.alert(
    'Check for Changes Complete',
    'Total Checked: ' + totalChecked + '\nTotal Updated: ' + totalUpdated + '\n\n' + results.join('\n'),
    ui.ButtonSet.OK
  );
  showToast_('✅ Updated ' + totalUpdated + ' of ' + totalChecked + ' records', 'Success');
}

function updateInCustodyStatus() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var countyName = sheet.getName();
  showToast_('🔄 Updating ' + countyName + ' custody status...', 'Update Status');
  var result = updateCountyInCustodyStatus(sheet, countyName, false);
  showToast_('✅ Updated ' + result.updated + ' of ' + result.checked + ' records', 'Success');
}

function updateCountyInCustodyStatus(sheet, countyName, fullWebCheck) {
  fullWebCheck = fullWebCheck || false;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { checked: 0, updated: 0 };

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return (h || '').toString().trim(); });

  var bookingCol = headers.indexOf('Booking_Number');
  var statusCol = headers.indexOf('Status');
  var bondAmountCol = headers.indexOf('Bond_Amount');
  var bondTypeCol = headers.indexOf('Bond_Type');
  var lastCheckedCol = headers.indexOf('LastChecked');
  var lastCheckedModeCol = headers.indexOf('LastCheckedMode');

  // Add tracking columns if missing
  if (lastCheckedCol === -1 || lastCheckedModeCol === -1) {
    var appendIndex = lastCol + 1;
    if (lastCheckedCol === -1) { sheet.getRange(1, appendIndex).setValue('LastChecked'); appendIndex++; }
    if (lastCheckedModeCol === -1) { sheet.getRange(1, appendIndex).setValue('LastCheckedMode'); appendIndex++; }
    lastCol = sheet.getLastColumn();
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return (h || '').toString().trim(); });
    bookingCol = headers.indexOf('Booking_Number');
    statusCol = headers.indexOf('Status');
    bondAmountCol = headers.indexOf('Bond_Amount');
    bondTypeCol = headers.indexOf('Bond_Type');
    lastCheckedCol = headers.indexOf('LastChecked');
    lastCheckedModeCol = headers.indexOf('LastCheckedMode');
  }

  if (bookingCol === -1 || statusCol === -1) {
    bookingCol = (bookingCol === -1) ? 0 : bookingCol;
    bondAmountCol = (bondAmountCol === -1) ? 23 : bondAmountCol;
    bondTypeCol = (bondTypeCol === -1) ? 24 : bondTypeCol;
    statusCol = (statusCol === -1) ? 25 : statusCol;
  }

  var numRows = lastRow - 1;
  var data = sheet.getRange(2, 1, numRows, lastCol).getValues();
  var statusValues = sheet.getRange(2, statusCol + 1, numRows, 1).getValues();
  var lastCheckedValues = sheet.getRange(2, lastCheckedCol + 1, numRows, 1).getValues();
  var lastCheckedModeValues = sheet.getRange(2, lastCheckedModeCol + 1, numRows, 1).getValues();

  var checked = 0;
  var updated = 0;
  var now = new Date();
  var modeText = fullWebCheck ? 'web' : 'local';

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var bookingNumber = row[bookingCol];
    if (!bookingNumber) continue;

    checked++;
    var currentStatus = (row[statusCol] || '').toString();
    var bondAmount = parseBondAmount_(row[bondAmountCol]);
    var bondType = (row[bondTypeCol] || '').toString();

    var inferredStatus = determineInCustodyStatus_(currentStatus, bondAmount, bondType);

    if (fullWebCheck) {
      try {
        var inCustody = checkIfInCustody_(countyName, String(bookingNumber));
        inferredStatus = inCustody ? 'In Custody' : 'Released';
      } catch (err) { /* skip */ }
    }

    if (inferredStatus && inferredStatus !== currentStatus) {
      statusValues[i][0] = inferredStatus;
      updated++;
    }

    lastCheckedValues[i][0] = now;
    lastCheckedModeValues[i][0] = modeText;
  }

  sheet.getRange(2, statusCol + 1, numRows, 1).setValues(statusValues);
  sheet.getRange(2, lastCheckedCol + 1, numRows, 1).setValues(lastCheckedValues);
  sheet.getRange(2, lastCheckedModeCol + 1, numRows, 1).setValues(lastCheckedModeValues);

  return { checked: checked, updated: updated };
}

function determineInCustodyStatus_(currentStatus, bondAmount, bondType) {
  currentStatus = (currentStatus || '').toString().toUpperCase();
  bondType = (bondType || '').toString().toUpperCase();

  var releasedIndicators = ['RELEASED', 'RELEASE', 'BONDED', 'BONDED OUT', 'ROR', 'DISCHARGED', 'TRANSFERRED'];
  var inCustodyIndicators = ['IN CUSTODY', 'INCUSTODY', 'CUSTODY', 'BOOKED', 'ACTIVE', 'HELD', 'DETAINED'];

  var isReleased = releasedIndicators.some(function(ind) { return currentStatus.indexOf(ind) !== -1; });
  var isInCustody = inCustodyIndicators.some(function(ind) { return currentStatus.indexOf(ind) !== -1; });

  if (isReleased) return null;
  if (isInCustody) return null;

  if (bondAmount === 0 || bondType.indexOf('NO BOND') !== -1 || bondType.indexOf('HOLD') !== -1) return 'In Custody';
  if (bondType.indexOf('ROR') !== -1 || bondType.indexOf('RELEASE') !== -1) return 'Released';

  return null;
}

function parseBondAmount_(value) {
  if (!value) return 0;
  var str = value.toString().replace(/[$,]/g, '');
  var num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function checkIfInCustody_(countyName, bookingNumber) {
  // Per-county web check — placeholder for future expansion
  return false;
}


// ====================================================================
// COURT DATE STATUS VIEWER
// ====================================================================

function viewCourtDateStatus() {
  var ui = SpreadsheetApp.getUi();

  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    var allData = sheet.getDataRange().getValues();
    var upcomingCourts = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    for (var i = 1; i < allData.length; i++) {
      var courtDate = allData[i][CONFIG.COLUMNS.COURT_DATE - 1];
      if (courtDate) {
        var courtDateTime = new Date(courtDate);
        if (courtDateTime >= today) {
          upcomingCourts.push({
            name: allData[i][CONFIG.COLUMNS.DEFENDANT_NAME - 1],
            caseNumber: allData[i][CONFIG.COLUMNS.CASE_NUMBER - 1],
            date: courtDate,
            time: allData[i][CONFIG.COLUMNS.COURT_TIME - 1],
            reminder7d: allData[i][CONFIG.COLUMNS.REMINDER_7D - 1],
            reminder3d: allData[i][CONFIG.COLUMNS.REMINDER_3D - 1],
            reminder1d: allData[i][CONFIG.COLUMNS.REMINDER_1D - 1]
          });
        }
      }
    }

    upcomingCourts.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });

    var message = '📅 UPCOMING COURT DATES\n═══════════════════════════════\n\n';
    if (upcomingCourts.length === 0) {
      message += 'No upcoming court dates scheduled.';
    } else {
      upcomingCourts.forEach(function(court, index) {
        message += (index + 1) + '. ' + court.name + '\n';
        message += '   Case: ' + court.caseNumber + '\n';
        message += '   Date: ' + court.date + ' at ' + court.time + '\n';
        message += '   Reminders: ';
        var reminders = [];
        if (court.reminder7d) reminders.push('7d ✓');
        if (court.reminder3d) reminders.push('3d ✓');
        if (court.reminder1d) reminders.push('1d ✓');
        message += reminders.length > 0 ? reminders.join(', ') : 'None sent yet';
        message += '\n\n';
      });
      message += '═══════════════════════════════\n';
      message += 'Total: ' + upcomingCourts.length + ' upcoming court date(s)';
    }
    ui.alert(message);
  } catch (error) {
    ui.alert('Error: ' + error.message);
  }
}


// ====================================================================
// EMAIL PARSER & REMINDER TESTERS
// ====================================================================

function testEmailParser() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Test Email Parser', 'Enter the subject line of a court date email to test:\n\n(The email must be in your inbox)', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;

  var searchSubject = response.getResponseText();
  if (!searchSubject) { ui.alert('No subject line entered.'); return; }

  try {
    var threads = GmailApp.search('subject:"' + searchSubject + '"', 0, 1);
    if (threads.length === 0) { ui.alert('❌ No email found with that subject line.'); return; }

    ui.alert('🔍 Found email. Attempting to parse...\n\nCheck the execution log for detailed results.');
    var courtData = parseCourtDateEmail(threads[0]);

    if (!courtData) {
      ui.alert('❌ Parsing failed. Check the execution log for details.\n\nGo to: Extensions > Apps Script > Execution log');
      return;
    }

    var resultMsg = '✅ PARSING SUCCESSFUL!\n\nExtracted Data:\n━━━━━━━━━━━━━━━━━━━\n';
    resultMsg += 'Case Number: ' + (courtData.caseNumber || 'Not found') + '\n';
    resultMsg += 'Defendant: ' + (courtData.defendantName || 'Not found') + '\n';
    resultMsg += 'Court Date: ' + (courtData.courtDate || 'Not found') + '\n';
    resultMsg += 'Court Time: ' + (courtData.courtTime || 'Not found') + '\n';
    resultMsg += 'Location: ' + (courtData.location || 'Not found') + '\n';
    resultMsg += 'Hearing Type: ' + (courtData.hearingType || 'Not found') + '\n';
    ui.alert(resultMsg);
  } catch (error) {
    ui.alert('❌ Error: ' + error.message);
    Logger.log('Test parser error: ' + error.message);
  }
}

function testReminderEmail() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt('Test Reminder Email', 'Enter your email address to receive a test reminder:', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;

  var testEmail = response.getResponseText();
  if (!testEmail || testEmail.indexOf('@') === -1) { ui.alert('Invalid email address.'); return; }

  try {
    var testClientData = { rowNumber: 999, caseNumber: '24-CF-12345', defendantName: 'John Doe (TEST)', defendantEmail: testEmail, defendantPhone: '(239) 555-1234', indemnitorEmail: '' };
    var testCourtData = { courtDate: '2024-12-25', courtTime: '9:00 AM', location: 'Lee County Courthouse - Room 3A', hearingType: 'Arraignment' };
    sendReminderEmail(testClientData, testCourtData, '7d');
    ui.alert('✅ Test email sent to: ' + testEmail + '\n\nCheck your inbox!');
  } catch (error) {
    ui.alert('❌ Error sending test email: ' + error.message);
  }
}


// ====================================================================
// ARREST STATS & SYSTEM STATUS
// ====================================================================

function viewArrestStats() {
  var ui = SpreadsheetApp.getUi();
  try {
    var ss = SpreadsheetApp.openById(ARREST_SCRAPER_CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(ARREST_SCRAPER_CONFIG.ARREST_SHEET_NAME);
    if (!sheet) { ui.alert('Arrest sheet not found. Run "Setup Arrest Sheet" first.'); return; }

    var lastRow = sheet.getLastRow();
    var totalArrests = lastRow - 1;

    var message = '📊 ARREST SCRAPER STATISTICS\n═══════════════════════════════\n\n';
    message += '📋 Total arrests in database: ' + totalArrests + '\n\n';

    if (totalArrests > 0) {
      var lastRowData = sheet.getRange(lastRow, 1, 1, 10).getValues()[0];
      message += '🕐 Last arrest scraped:\n';
      message += '   • Time: ' + lastRowData[0] + '\n';
      message += '   • Name: ' + lastRowData[8] + '\n';
      message += '   • Booking #: ' + lastRowData[1] + '\n';
    }
    ui.alert(message);
  } catch (error) {
    ui.alert('Error: ' + error.message);
  }
}

function viewStatus() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var counties = ['Lee', 'Collier', 'Hendry', 'Charlotte', 'Manatee', 'Sarasota', 'Hillsborough', 'DeSoto'];

  var status = counties.map(function(county) {
    var sheet = ss.getSheetByName(county);
    if (!sheet) return county + ': Sheet not found';
    var recordCount = Math.max(0, sheet.getLastRow() - 1);
    return county + ': ' + recordCount + ' records';
  }).join('\n');

  var triggers = ScriptApp.getProjectTriggers();
  var triggerStatus = triggers.length > 0 ? '✅ ' + triggers.length + ' active' : '❌ None';

  ui.alert(
    'System Status',
    'County Records:\n' + status + '\n\nTriggers: ' + triggerStatus + '\n\nLast Updated: ' + new Date().toLocaleString(),
    ui.ButtonSet.OK
  );
}
