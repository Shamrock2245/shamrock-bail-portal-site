/**
 * ============================================
 * ARREST SCRAPER - COMPLETE VERSION
 * ============================================
 */

/**
 * Main Scraper Function - DEBUG MODE
 */
function scrapeRecentArrests() {
  Logger.log('🚔 Starting arrest scraper (DEBUG MODE)...');
  
  try {
    // Step 1: Test sheet access
    Logger.log('Step 1: Testing sheet access...');
    var sheet = getOrCreateArrestSheet();
    Logger.log('✅ Sheet access successful: ' + sheet.getName());
    
    // Step 2: Test URL fetch
    Logger.log('Step 2: Testing URL fetch...');
    Logger.log('URL: ' + ARREST_SCRAPER_CONFIG.SEARCH_URL);
    
    var response = UrlFetchApp.fetch(ARREST_SCRAPER_CONFIG.SEARCH_URL, {
      muteHttpExceptions: true,
      followRedirects: true
    });
    
    var responseCode = response.getResponseCode();
    Logger.log('Response code: ' + responseCode);
    
    if (responseCode !== 200) {
      Logger.log('❌ Failed to fetch page. Response: ' + response.getContentText().substring(0, 500));
      return;
    }
    
    var html = response.getContentText();
    Logger.log('✅ Successfully fetched page. Length: ' + html.length + ' characters');
    
    // Step 3: Log first 2000 characters to see structure
    Logger.log('First 2000 characters of HTML:');
    Logger.log(html.substring(0, 2000));
    
    // Step 4: Try to find booking numbers
    Logger.log('Step 4: Searching for booking numbers...');
    var bookingNumberPattern = /booking\/\?id=(\d+)/gi;
    var matches = [];
    var match;
    
    while ((match = bookingNumberPattern.exec(html)) !== null) {
      matches.push(match[1]);
    }
    
    Logger.log('Found ' + matches.length + ' booking number(s)');
    
    if (matches.length > 0) {
      Logger.log('Sample booking numbers: ' + matches.slice(0, 5).join(', '));
      
      // Step 5: Try to fetch one detail page
      Logger.log('Step 5: Testing detail page fetch for booking: ' + matches[0]);
      var detailUrl = ARREST_SCRAPER_CONFIG.DETAIL_URL_TEMPLATE + matches[0];
      Logger.log('Detail URL: ' + detailUrl);
      
      var detailResponse = UrlFetchApp.fetch(detailUrl, {
        muteHttpExceptions: true,
        followRedirects: true
      });
      
      Logger.log('Detail page response code: ' + detailResponse.getResponseCode());
      Logger.log('Detail page length: ' + detailResponse.getContentText().length);
      
      // Log first 2000 characters of detail page
      Logger.log('First 2000 characters of detail page:');
      Logger.log(detailResponse.getContentText().substring(0, 2000));
    } else {
      Logger.log('⚠️ No booking numbers found. Let\'s try alternative patterns...');
      
      // Try alternative patterns
      var altPatterns = [
        /id=(\d{6,})/gi,
        /booking_id=(\d+)/gi,
        /person_id=(\d+)/gi
      ];
      
      altPatterns.forEach(function(pattern, index) {
        var altMatches = [];
        while ((match = pattern.exec(html)) !== null) {
          altMatches.push(match[1]);
        }
        Logger.log('Pattern ' + (index + 1) + ' found: ' + altMatches.length + ' matches');
        if (altMatches.length > 0) {
          Logger.log('Sample: ' + altMatches.slice(0, 3).join(', '));
        }
      });
    }
    
    Logger.log('✅ Debug test complete');
    
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);
  }
}

/**
 * Get or Create Arrest Sheet
 */
function getOrCreateArrestSheet() {
  var ss = SpreadsheetApp.openById(ARREST_SCRAPER_CONFIG.SHEET_ID);
  var sheet = ss.getSheetByName(ARREST_SCRAPER_CONFIG.ARREST_SHEET_NAME);
  
  if (!sheet) {
    Logger.log('📄 Creating new arrest sheet...');
    
    // Create new sheet at position 0 (first tab)
    sheet = ss.insertSheet(ARREST_SCRAPER_CONFIG.ARREST_SHEET_NAME, 0);
    
    // Set up headers
    var headers = [
      'Scrape_Timestamp', 'Booking_Number', 'Booking_Date', 'Booking_Time',
      'Person_ID', 'Last_Name', 'First_Name', 'Middle_Name', 'Full_Name',
      'DOB', 'Age', 'Race', 'Sex', 'Height', 'Weight',
      'Address', 'City', 'State', 'Zip', 'Mugshot_URL',
      'Charge_1', 'Charge_1_Arrest_By', 'Bond_1_Type', 'Bond_1_Amount', 'Bond_1_Paid_Date',
      'Court_1_Location', 'Court_1_Case_Number', 'Court_1_Hearing',
      'Charge_2', 'Charge_2_Arrest_By', 'Bond_2_Type', 'Bond_2_Amount', 'Bond_2_Paid_Date',
      'Court_2_Location', 'Court_2_Case_Number', 'Court_2_Hearing',
      'Charge_3', 'Charge_3_Arrest_By', 'Bond_3_Type', 'Bond_3_Amount', 'Bond_3_Paid_Date',
      'Court_3_Location', 'Court_3_Case_Number', 'Court_3_Hearing',
      'Current_Status', 'Current_Facility', 'Detail_Page_URL',
      'Already_Contacted', 'Contact_Date', 'Agent_Assigned', 'Notes'
    ];
    
    // Write headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format header row
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4285F4')
      .setFontColor('#FFFFFF');
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    Logger.log('✅ Created arrest sheet with headers');
  }
  
  // Make sure it's the first sheet
  var allSheets = ss.getSheets();
  var currentIndex = -1;
  
  for (var i = 0; i < allSheets.length; i++) {
    if (allSheets[i].getName() === ARREST_SCRAPER_CONFIG.ARREST_SHEET_NAME) {
      currentIndex = i;
      break;
    }
  }
  
  if (currentIndex > 0) {
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(1); // Move to first position
  }
  
  return sheet;
}

/**
 * Get Existing Booking Numbers
 */
function getExistingBookingNumbers(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return []; // No data yet
  }
  
  // Get booking number column
  var bookingCol = ARREST_SCRAPER_CONFIG.ARREST_COLUMNS.BOOKING_NUMBER;
  var bookingNumbers = sheet.getRange(2, bookingCol, lastRow - 1, 1).getValues();
  
  // Flatten and convert to strings
  return bookingNumbers.map(function(row) {
    return String(row[0]).trim();
  }).filter(function(num) {
    return num !== '';
  });
}

/**
 * Write Arrests To Sheet
 */
function writeArrestsToSheet(sheet, arrestData) {
  if (arrestData.length === 0) return;
  
  // Convert arrest objects to row arrays
  var rows = arrestData.map(function(arrest) {
    return arrestToRow(arrest);
  });
  
  // Append to sheet
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
  
  Logger.log('✅ Wrote ' + rows.length + ' row(s) to sheet starting at row ' + startRow);
}

/**
 * Convert Arrest Object To Row Array
 */
function arrestToRow(arrest) {
  var row = new Array(51); // 51 columns total
  
  // Fill in the data
  row[0] = new Date(); // Scrape timestamp
  row[1] = arrest.bookingNumber || '';
  row[2] = arrest.bookingDate || '';
  row[3] = arrest.bookingTime || '';
  row[4] = arrest.personId || '';
  row[5] = arrest.lastName || '';
  row[6] = arrest.firstName || '';
  row[7] = arrest.middleName || '';
  row[8] = arrest.fullName || '';
  row[9] = arrest.dob || '';
  row[10] = arrest.age || '';
  row[11] = arrest.race || '';
  row[12] = arrest.sex || '';
  row[13] = arrest.height || '';
  row[14] = arrest.weight || '';
  row[15] = arrest.address || '';
  row[16] = arrest.city || '';
  row[17] = arrest.state || '';
  row[18] = arrest.zip || '';
  row[19] = arrest.mugshotUrl || '';
  
  // Charges (up to 3)
  if (arrest.charges && arrest.charges.length > 0) {
    for (var i = 0; i < Math.min(3, arrest.charges.length); i++) {
      var baseCol = 20 + (i * 8);
      row[baseCol] = arrest.charges[i].description || '';
      row[baseCol + 1] = arrest.charges[i].arrestBy || '';
      row[baseCol + 2] = arrest.charges[i].bondType || '';
      row[baseCol + 3] = arrest.charges[i].bondAmount || '';
      row[baseCol + 4] = arrest.charges[i].bondPaidDate || '';
      row[baseCol + 5] = arrest.charges[i].courtLocation || '';
      row[baseCol + 6] = arrest.charges[i].courtCaseNumber || '';
      row[baseCol + 7] = arrest.charges[i].courtHearing || '';
    }
  }
  
  row[44] = arrest.currentStatus || '';
  row[45] = arrest.currentFacility || '';
  row[46] = arrest.detailUrl || '';
  row[47] = false; // Already_Contacted
  row[48] = ''; // Contact_Date
  row[49] = ''; // Agent_Assigned
  row[50] = ''; // Notes
  
  return row;
}

/**
 * Notify New Arrests
 */
function notifyNewArrests(count) {
  var message = '🚔 NEW ARRESTS SCRAPED\n\n';
  message += '   • ' + count + ' new booking(s) added to Lee County Arrests sheet\n';
  message += '   • Time: ' + new Date().toLocaleString();
  
  try {
    postToSlack('#court-dates', message, false);
  } catch (error) {
    Logger.log('Slack notification failed: ' + error.message);
  }
}
