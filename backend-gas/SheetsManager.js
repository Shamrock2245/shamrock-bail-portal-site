/**
 * ============================================
 * SheetsManager.gs - Functions for interacting with Google Sheets
 * ============================================
 */

/**
 * --------------------------------------------
 * Functions Specific to 'shamrock-leads-leecounty' Sheet
 * --------------------------------------------
 */

/**
 * Extract Client Data
 * * Pulls all relevant client information from a sheet row for communication.
 * Relies on the CONFIG object for column mappings.
 * * @param {Array} row - Single row of data from sheet
 * @param {Number} rowNumber - The row number in the sheet
 * @return {Object} Client data object
 */
function extractClientData(row, rowNumber) {
  
  // Collect all indemnitor emails (combine both indemnitor columns)
  var indemnitorEmails = [];
  
  var indem1Email = row[CONFIG.COLUMNS.INDEMNITOR_1_EMAIL - 1];
  if (indem1Email && String(indem1Email).trim()) {
    indemnitorEmails.push(String(indem1Email).trim());
  }
  
  var indem2Email = row[CONFIG.COLUMNS.INDEMNITOR_2_EMAIL - 1];
  if (indem2Email && String(indem2Email).trim()) {
    indemnitorEmails.push(String(indem2Email).trim());
  }
  
  return {
    rowNumber: rowNumber,
    caseNumber: row[CONFIG.COLUMNS.CASE_NUMBER - 1],
    defendantName: row[CONFIG.COLUMNS.DEFENDANT_NAME - 1],
    defendantEmail: row[CONFIG.COLUMNS.DEFENDANT_EMAIL - 1],
    defendantPhone: row[CONFIG.COLUMNS.DEFENDANT_PHONE - 1],
    
    // Combined indemnitor emails as comma-separated string
    indemnitorEmail: indemnitorEmails.join(', '),
    
    // Additional fields for calendar event details
    bondAmount: row[CONFIG.COLUMNS.BOND_AMOUNT - 1],
    agentName: row[CONFIG.COLUMNS.AGENT_NAME - 1] 
    // Add more fields here as needed for reminders/calendar, using CONFIG.COLUMNS
  };
}


/**
 * --------------------------------------------
 * Generic Sheet Helper Functions (Often used by Scrapers)
 * --------------------------------------------
 */

/**
 * Gets a sheet by name, or creates it with a header row if it doesn't exist.
 * Assumes getArrestsHeader_() defines the header.
 */
function getOrCreateSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(getArrestsHeader_()); // Assumes Arrests header
    sh.setFrozenRows(1);
  } else if (sh.getLastRow() === 0) { // Handle empty existing sheet
     sh.appendRow(getArrestsHeader_());
     sh.setFrozenRows(1);
  }
  return sh;
}

/**
 * Defines the header row specifically for the Arrests sheet.
 */
function getArrestsHeader_() {
  return [
    'BookingNumber','PersonID','FullName','First','Middle','Last','DOB',
    'BookingDate','BookingTime','Status','Facility','Race','Sex','Height','Weight',
    'Address','City','State','ZIP','MugshotURL','Charges','DetailURL','CreatedAt'
  ];
}

/**
 * Reads a specific column and returns a Map of existing keys (for deduplication).
 */
function getExistingKeys_(sheet, keyColIndex) {
  const last = sheet.getLastRow();
  const set = new Map(); // Using Map for potential future use (storing row number)
  if (last < 2) return set;
  const vals = sheet.getRange(2, keyColIndex, last - 1, 1).getValues();
  vals.forEach(r => { 
    const v = (r[0] || '').toString().trim(); 
    if (v) set.set(v, true); // Store key -> true
  });
  return set;
}

/**
 * Updates existing rows or inserts new rows based on a unique key field.
 * Assumes the key field is the first column in the `items` objects and corresponds
 * to the `keyField` in the `header`.
 */
function upsertRowsByKey_(sheet, items, keyField, header) {
  const keyIndex = header.indexOf(keyField);
  if (keyIndex < 0) {
     Logger.log("Error in upsertRowsByKey_: keyField '" + keyField + "' not found in header.");
     return;
  }
  const keyCol = keyIndex + 1; // 1-based index
  
  const last = sheet.getLastRow();
  const existingMap = new Map(); // key -> row number
  if (last >= 2) {
    const keys = sheet.getRange(2, keyCol, last - 1, 1).getValues();
    keys.forEach((r, i) => {
      const k = (r[0] || '').toString().trim();
      if (k) existingMap.set(k, i + 2); // Map key to its row number
    });
  }

  const rows = items.map(item => toRowFromItem_(item, header)); // Pass header for correct order
  const updates = [];
  const appends = [];

  rows.forEach(row => {
    const k = (row[keyIndex] || '').toString().trim(); // Get the key value from the row
    const existingRow = existingMap.get(k);
    if (existingRow) {
      updates.push({ row: existingRow, values: row });
    } else {
      appends.push(row);
    }
  });

  // Batch updates - applying row by row (less efficient but safer for sparse updates)
  updates.forEach(u => {
    sheet.getRange(u.row, 1, 1, header.length).setValues([u.values]);
  });
  
  // Batch appends
  if (appends.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, appends.length, header.length).setValues(appends);
  }
}

/**
 * Converts an internal item object (like from the scraper) into a sheet row array,
 * matching the order specified by the header.
 */
function toRowFromItem_(r, header) {
  // Map the object `r` properties to the header order
  return header.map(colName => {
    switch(colName) {
      case 'BookingNumber': return orBlank(r.bookingNumber);
      case 'PersonID': return orBlank(r.personId);
      case 'FullName': return orBlank(r.fullName);
      case 'First': return orBlank(r.firstName);
      case 'Middle': return orBlank(r.middleName);
      case 'Last': return orBlank(r.lastName);
      case 'DOB': return orBlank(r.dob);
      case 'BookingDate': return orBlank(r.bookingDate);
      case 'BookingTime': return orBlank(r.bookingTime);
      case 'Status': return orBlank(r.currentStatus);
      case 'Facility': return orBlank(r.currentFacility);
      case 'Race': return orBlank(r.race);
      case 'Sex': return orBlank(r.sex);
      case 'Height': return orBlank(r.height);
      case 'Weight': return orBlank(r.weight);
      case 'Address': return orBlank(r.address);
      case 'City': return orBlank(r.city);
      case 'State': return orBlank(r.state || 'FL');
      case 'ZIP': return orBlank(r.zip);
      case 'MugshotURL': return orBlank(r.mugshotUrl);
      case 'Charges': return Array.isArray(r.charges) ? r.charges.join(' | ') : orBlank(r.charges);
      case 'DetailURL': return orBlank(r.detailUrl);
      case 'CreatedAt': return new Date(); // Always set CreatedAt on write
      default: return ''; // Handle unknown columns gracefully
    }
  });
}

/** * Converts a row object (where keys are header names) back into 
 * the internal item shape used by the scraper logic.
 */
function rowToItem_(o){ 
  return {
    bookingNumber: o.BookingNumber, 
    personId: o.PersonID, 
    fullName: o.FullName,
    firstName: o.First, 
    middleName: o.Middle, 
    lastName: o.Last, 
    dob: o.DOB,
    bookingDate: o.BookingDate, 
    bookingTime: o.BookingTime, 
    currentStatus: o.Status,
    currentFacility: o.Facility, 
    race: o.Race, 
    sex: o.Sex, 
    height: o.Height, 
    weight: o.Weight,
    address: o.Address, 
    city: o.City, 
    state: o.State, 
    zip: o.ZIP, 
    mugshotUrl: o.MugshotURL,
    charges: (o.Charges || '').split('|').map(s => s.trim()).filter(Boolean),
    detailUrl: o.DetailURL
    // Note: CreatedAt is not typically needed in the item object
  };
}

/**
 * Gets all data rows from a sheet and returns them as an array of objects,
 * using the provided header array as keys.
 */
function getRowsAsObjects_(sheet, header) {
  const last = sheet.getLastRow();
  if (last < 2) return []; // No data rows
  const values = sheet.getRange(2, 1, last - 1, header.length).getValues();
  return values.map(row => {
    const obj = {};
    header.forEach((colName, index) => {
      obj[colName] = row[index];
    });
    return obj;
  });
}

/**
 * Utility to return an empty string if value is null or undefined.
 */
function orBlank(v){ 
  return v == null ? '' : v; 
}