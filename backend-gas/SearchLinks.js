/**
 * ============================================
 * SEARCH LINKS GENERATOR
 * ============================================
 * Generates search URLs for Google, Facebook, and TruePeopleSearch
 * to help investigate defendants and indemnitors
 */

var SEARCH_CONFIG = {
  // Column names in the arrest sheet
  GOOGLE_SEARCH_COL: 'Google_Search',
  FACEBOOK_SEARCH_COL: 'Facebook_Search',
  TRUEPEOPLESEARCH_COL: 'TruePeopleSearch',
  
  // Auto-generate links on new arrests
  AUTO_GENERATE: true
};

/**
 * Generate all search links for a given row
 */
function generateSearchLinksForRow(rowIndex) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Lee_County_Arrests');
  
  if (!sheet) {
    Logger.log('❌ Lee_County_Arrests sheet not found');
    return;
  }
  
  // Get header row to find column indices
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colMap = {};
  headers.forEach(function(h, i) {
    if (h) colMap[h] = i + 1;
  });
  
  // Ensure search columns exist
  ensureSearchColumns(sheet, headers, colMap);
  
  // Get row data
  var rowData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Extract person info
  var fullName = rowData[colMap['Full_Name'] - 1] || '';
  var firstName = rowData[colMap['First_Name'] - 1] || '';
  var lastName = rowData[colMap['Last_Name'] - 1] || '';
  var city = rowData[colMap['City'] - 1] || '';
  var state = rowData[colMap['State'] - 1] || 'FL';
  var age = calculateAge(rowData[colMap['DOB'] - 1]);
  
  // Generate search URLs
  var googleUrl = generateGoogleSearchUrl(fullName, city, state);
  var facebookUrl = generateFacebookSearchUrl(fullName, city, state);
  var truePeopleUrl = generateTruePeopleSearchUrl(firstName, lastName, city, state);
  
  // Write URLs to sheet
  if (colMap[SEARCH_CONFIG.GOOGLE_SEARCH_COL]) {
    sheet.getRange(rowIndex, colMap[SEARCH_CONFIG.GOOGLE_SEARCH_COL]).setValue(googleUrl);
  }
  if (colMap[SEARCH_CONFIG.FACEBOOK_SEARCH_COL]) {
    sheet.getRange(rowIndex, colMap[SEARCH_CONFIG.FACEBOOK_SEARCH_COL]).setValue(facebookUrl);
  }
  if (colMap[SEARCH_CONFIG.TRUEPEOPLESEARCH_COL]) {
    sheet.getRange(rowIndex, colMap[SEARCH_CONFIG.TRUEPEOPLESEARCH_COL]).setValue(truePeopleUrl);
  }
  
  Logger.log('✅ Generated search links for row ' + rowIndex);
}

/**
 * Generate search links for all rows that don't have them
 */
function generateAllSearchLinks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Lee_County_Arrests');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert('❌ Lee_County_Arrests sheet not found');
    return;
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('ℹ️ No data rows to process');
    return;
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colMap = {};
  headers.forEach(function(h, i) {
    if (h) colMap[h] = i + 1;
  });
  
  // Ensure search columns exist
  ensureSearchColumns(sheet, headers, colMap);
  
  var googleCol = colMap[SEARCH_CONFIG.GOOGLE_SEARCH_COL];
  var count = 0;
  
  // Process each row
  for (var i = 2; i <= lastRow; i++) {
    var googleLink = sheet.getRange(i, googleCol).getValue();
    
    // Only generate if Google search link is empty (assume if Google is empty, all are empty)
    if (!googleLink || googleLink === '') {
      generateSearchLinksForRow(i);
      count++;
      
      // Throttle to avoid hitting rate limits
      if (count % 10 === 0) {
        Utilities.sleep(1000);
      }
    }
  }
  
  SpreadsheetApp.getUi().alert('✅ Generated search links for ' + count + ' rows');
  Logger.log('✅ Generated search links for ' + count + ' rows');
}

/**
 * Generate search links for selected row
 */
function generateSearchLinksForSelectedRow() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var selection = sheet.getActiveRange();
  var rowIndex = selection.getRow();
  
  if (rowIndex < 2) {
    SpreadsheetApp.getUi().alert('❌ Please select a data row (not the header)');
    return;
  }
  
  if (sheet.getName() !== 'Lee_County_Arrests') {
    SpreadsheetApp.getUi().alert('❌ Please select a row in the Lee_County_Arrests sheet');
    return;
  }
  
  generateSearchLinksForRow(rowIndex);
  SpreadsheetApp.getUi().alert('✅ Search links generated for row ' + rowIndex);
}

/**
 * Ensure search columns exist in the sheet
 */
function ensureSearchColumns(sheet, headers, colMap) {
  var needsUpdate = false;
  var columnsToAdd = [];
  
  if (!colMap[SEARCH_CONFIG.GOOGLE_SEARCH_COL]) {
    columnsToAdd.push(SEARCH_CONFIG.GOOGLE_SEARCH_COL);
    needsUpdate = true;
  }
  if (!colMap[SEARCH_CONFIG.FACEBOOK_SEARCH_COL]) {
    columnsToAdd.push(SEARCH_CONFIG.FACEBOOK_SEARCH_COL);
    needsUpdate = true;
  }
  if (!colMap[SEARCH_CONFIG.TRUEPEOPLESEARCH_COL]) {
    columnsToAdd.push(SEARCH_CONFIG.TRUEPEOPLESEARCH_COL);
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    columnsToAdd.forEach(function(colName) {
      sheet.insertColumnAfter(sheet.getLastColumn());
      var col = sheet.getLastColumn();
      sheet.getRange(1, col).setValue(colName);
      colMap[colName] = col;
    });
    
    Logger.log('✅ Added search columns: ' + columnsToAdd.join(', '));
  }
}

/**
 * Generate Google search URL
 */
function generateGoogleSearchUrl(fullName, city, state) {
  if (!fullName) return '';
  
  var query = fullName;
  if (city) query += ' ' + city;
  if (state) query += ' ' + state;
  
  var encoded = encodeURIComponent(query);
  return 'https://www.google.com/search?q=' + encoded;
}

/**
 * Generate Facebook search URL
 */
function generateFacebookSearchUrl(fullName, city, state) {
  if (!fullName) return '';
  
  var query = fullName;
  if (city) query += ' ' + city;
  if (state) query += ' ' + state;
  
  var encoded = encodeURIComponent(query);
  return 'https://www.facebook.com/search/people/?q=' + encoded;
}

/**
 * Generate TruePeopleSearch URL
 */
function generateTruePeopleSearchUrl(firstName, lastName, city, state) {
  if (!lastName) return '';
  
  // TruePeopleSearch uses a specific URL format
  var baseUrl = 'https://www.truepeoplesearch.com/results?';
  var params = [];
  
  if (firstName) params.push('firstname=' + encodeURIComponent(firstName));
  if (lastName) params.push('lastname=' + encodeURIComponent(lastName));
  if (city) params.push('citystatezip=' + encodeURIComponent(city + (state ? ', ' + state : '')));
  
  return baseUrl + params.join('&');
}

/**
 * Calculate age from DOB
 */
function calculateAge(dob) {
  if (!dob) return null;
  
  try {
    var birthDate = new Date(dob);
    var today = new Date();
    var age = today.getFullYear() - birthDate.getFullYear();
    var monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (e) {
    return null;
  }
}

/**
 * Open all search links for selected row in new tabs
 */
function openAllSearchLinks() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var selection = sheet.getActiveRange();
  var rowIndex = selection.getRow();
  
  if (rowIndex < 2) {
    SpreadsheetApp.getUi().alert('❌ Please select a data row (not the header)');
    return;
  }
  
  if (sheet.getName() !== 'Lee_County_Arrests') {
    SpreadsheetApp.getUi().alert('❌ Please select a row in the Lee_County_Arrests sheet');
    return;
  }
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colMap = {};
  headers.forEach(function(h, i) {
    if (h) colMap[h] = i + 1;
  });
  
  var rowData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  var googleUrl = rowData[colMap[SEARCH_CONFIG.GOOGLE_SEARCH_COL] - 1];
  var facebookUrl = rowData[colMap[SEARCH_CONFIG.FACEBOOK_SEARCH_COL] - 1];
  var truePeopleUrl = rowData[colMap[SEARCH_CONFIG.TRUEPEOPLESEARCH_COL] - 1];
  
  var html = '<html><body><script>';
  if (googleUrl) html += 'window.open("' + googleUrl + '", "_blank");';
  if (facebookUrl) html += 'window.open("' + facebookUrl + '", "_blank");';
  if (truePeopleUrl) html += 'window.open("' + truePeopleUrl + '", "_blank");';
  html += 'google.script.host.close();</script></body></html>';
  
  var htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(200)
    .setHeight(100);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Opening search links...');
}

/**
 * Auto-generate search links when scraper adds new arrests
 * Called by the scraper after adding new rows
 */
function autoGenerateSearchLinksForNewArrests(startRow, endRow) {
  if (!SEARCH_CONFIG.AUTO_GENERATE) return;
  
  Logger.log('🔍 Auto-generating search links for rows ' + startRow + '-' + endRow);
  
  for (var i = startRow; i <= endRow; i++) {
    try {
      generateSearchLinksForRow(i);
    } catch (e) {
      Logger.log('⚠️ Error generating search links for row ' + i + ': ' + e.message);
    }
  }
}

