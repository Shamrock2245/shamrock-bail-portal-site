/**
 * ============================================
 * QUALIFIED ARRESTS SYNC
 * ============================================
 * Automatically syncs hot leads (score >= 70) to Qualified_Arrests sheet
 * and performs family/contact search automation
 */

/**
 * Sync qualified arrests to the qualified arrests sheet
 */
function syncQualifiedArrests() {
  if (!CONFIG.QUALIFIED_ARRESTS.ENABLED) {
    Logger.log('ℹ️ Qualified arrests sync is disabled in CONFIG');
    return;
  }
  
  Logger.log('🎯 Starting qualified arrests sync for all counties...');
  
  try {
    // Sync Lee County
    syncCountyQualifiedArrests('Lee', CONFIG.ARRESTS.SHEET_ID, CONFIG.ARRESTS.TAB_NAME);
    
    // Sync Collier County if configured
    if (CONFIG.COLLIER && CONFIG.COLLIER.SHEET_ID && CONFIG.COLLIER.TAB_NAME) {
      syncCountyQualifiedArrests('Collier', CONFIG.COLLIER.SHEET_ID, CONFIG.COLLIER.TAB_NAME);
    }
    
    Logger.log('✅ All counties synced');
    
  } catch (error) {
    Logger.log('❌ Error syncing qualified arrests: ' + error.message);
    throw error;
  }
}

/**
 * Sync qualified arrests for a specific county
 */
function syncCountyQualifiedArrests(countyName, sheetId, tabName) {
  Logger.log('🎯 Syncing ' + countyName + ' County qualified arrests...');
  
  try {
    // Get source sheet
    var sourceSheet = SpreadsheetApp.openById(sheetId).getSheetByName(tabName);
    if (!sourceSheet) {
      throw new Error('Source sheet not found: ' + CONFIG.ARRESTS.TAB_NAME);
    }
    
    // Get destination sheet (Qualified Arrests)
    var destSheet = getOrCreateQualifiedArrestsSheet();
    
    // Get all arrests with Lead_Score >= MIN_SCORE
    var qualifiedArrests = getQualifiedArrests(sourceSheet);
    Logger.log('📊 Found ' + qualifiedArrests.length + ' qualified arrests');
    
    if (qualifiedArrests.length === 0) {
      Logger.log('ℹ️ No qualified arrests to sync');
      return;
    }
    
    // Get existing booking numbers in qualified sheet
    var existingBookings = getExistingBookingNumbers(destSheet);
    
    // Filter out arrests that are already in qualified sheet (by county + booking number)
    var newQualified = qualifiedArrests.filter(function(arrest) {
      var key = countyName + '-' + arrest.Booking_Number;
      return !existingBookings.has(key);
    });
    
    Logger.log('📥 New qualified arrests to sync: ' + newQualified.length);
    
    if (newQualified.length === 0) {
      Logger.log('ℹ️ All qualified arrests are already synced');
      return;
    }
    
    // Add new qualified arrests to destination sheet
    addQualifiedArrestsToSheet(destSheet, newQualified, countyName);
    
    // Perform family search if enabled
    if (CONFIG.QUALIFIED_ARRESTS.FAMILY_SEARCH.ENABLED) {
      Logger.log('🔍 Starting family/contact search for new qualified arrests...');
      performFamilySearchForArrests(destSheet, newQualified);
    }
    
    // Send Slack notification for new qualified arrests
    if (getSlackWebhookUrl()) {
      notifySlackOfQualifiedArrests(newQualified);
    }
    
    Logger.log('✅ ' + countyName + ' County sync complete');
    
  } catch (error) {
    Logger.log('❌ Error syncing qualified arrests: ' + error.message);
    throw error;
  }
}

/**
 * Get or create the qualified arrests sheet
 */
function getOrCreateQualifiedArrestsSheet() {
  var ss = SpreadsheetApp.openById(CONFIG.QUALIFIED_ARRESTS.SHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.QUALIFIED_ARRESTS.TAB_NAME);
  
  if (!sheet) {
    Logger.log('📋 Creating qualified arrests sheet...');
    sheet = ss.insertSheet(CONFIG.QUALIFIED_ARRESTS.TAB_NAME);
    
    // Set up headers
    var headers = [
      'Sync_Date',
      'County',
      'Person_ID',
      'Booking_Number',
      'Full_Name',
      'First_Name',
      'Last_Name',
      'DOB',
      'Address',
      'City',
      'State',
      'ZIP',
      'Booking_Date',
      'Status',
      'All_Charges',
      'Bond_Amount',
      'Bond_Type',
      'Bond_Paid',
      'Case_Numbers',
      'Court_Date',
      'Court_Time',
      'Court_Location',
      'Lead_Score',
      'Lead_Status',
      'Detail_URL',
      'Mugshot_URL',
      // Family search columns
      'Family_Search_Status',
      'Potential_Contacts_Found',
      'Contact_1_Name',
      'Contact_1_Relationship',
      'Contact_1_Phone',
      'Contact_1_Email',
      'Contact_1_Source',
      'Contact_2_Name',
      'Contact_2_Relationship',
      'Contact_2_Phone',
      'Contact_2_Email',
      'Contact_2_Source',
      'Contact_3_Name',
      'Contact_3_Relationship',
      'Contact_3_Phone',
      'Contact_3_Email',
      'Contact_3_Source',
      'Google_Search',
      'WhitePages_Search',
      'TruePeopleSearch',
      'Facebook_Search',
      'Instagram_Search',
      'Notes'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#00A86B').setFontColor('#FFFFFF');
    
    Logger.log('✅ Qualified arrests sheet created');
  }
  
  return sheet;
}

/**
 * Get qualified arrests from source sheet (score >= MIN_SCORE)
 */
function getQualifiedArrests(sourceSheet) {
  var data = sourceSheet.getDataRange().getValues();
  var headers = data[0];
  
  // Find column indices
  var colMap = {};
  headers.forEach(function(h, i) {
    if (h) colMap[h] = i;
  });
  
  var scoreCol = colMap['Lead_Score'];
  if (scoreCol === undefined) {
    Logger.log('⚠️ Lead_Score column not found. Run lead scoring first.');
    return [];
  }
  
  var qualified = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var score = parseFloat(row[scoreCol]);
    
    if (!isNaN(score) && score >= CONFIG.QUALIFIED_ARRESTS.MIN_SCORE) {
      var arrest = {
        Person_ID: row[colMap['Person_ID']] || '',
        Booking_Number: row[colMap['Booking_Number']] || '',
        Full_Name: row[colMap['Full_Name']] || '',
        First_Name: row[colMap['First_Name']] || '',
        Last_Name: row[colMap['Last_Name']] || '',
        DOB: row[colMap['DOB']] || '',
        Address: row[colMap['Address']] || '',
        City: row[colMap['City']] || '',
        State: row[colMap['State']] || '',
        ZIP: row[colMap['ZIP']] || '',
        Booking_Date: row[colMap['Booking_Date']] || '',
        Status: row[colMap['Status']] || '',
        Charges: row[colMap['Charges']] || '',
        Bond_Amount: row[colMap['Bond_Amount']] || '',
        Bond_Type: row[colMap['Bond_Type']] || '',
        Bond_Paid: row[colMap['Bond_Paid']] || '',
        Case_Number: row[colMap['Case_Number']] || '',
        Court_Date: row[colMap['Court_Date']] || '',
        Court_Time: row[colMap['Court_Time']] || '',
        Court_Location: row[colMap['Court_Location']] || '',
        Lead_Score: score,
        Lead_Status: row[colMap['Lead_Status']] || '',
        Detail_URL: row[colMap['Detail_URL']] || '',
        Mugshot_URL: row[colMap['Mugshot_URL']] || ''
      };
      
      qualified.push(arrest);
    }
  }
  
  return qualified;
}

/**
 * Get existing booking numbers from qualified sheet
 */
function getExistingBookingNumbers(sheet) {
  var data = sheet.getDataRange().getValues();
  var bookingNumbers = new Set();
  
  if (data.length < 2) return bookingNumbers;
  
  var headers = data[0];
  var countyCol = headers.indexOf('County');
  var bookingCol = headers.indexOf('Booking_Number');
  
  if (bookingCol === -1) return bookingNumbers;
  
  for (var i = 1; i < data.length; i++) {
    var county = countyCol !== -1 ? data[i][countyCol] : 'Lee';
    var bookingNum = data[i][bookingCol];
    if (bookingNum) {
      // Use County-BookingNumber as key for deduplication
      var key = String(county).trim() + '-' + String(bookingNum).trim();
      bookingNumbers.add(key);
    }
  }
  
  return bookingNumbers;
}

/**
 * Add qualified arrests to the qualified sheet
 */
function addQualifiedArrestsToSheet(sheet, arrests, countyName) {
  var rows = arrests.map(function(arrest) {
    return [
      new Date(),                    // Sync_Date
      countyName || 'Lee',           // County
      arrest.Person_ID,              // Person_ID
      arrest.Booking_Number,         // Booking_Number
      arrest.Full_Name,
      arrest.First_Name,
      arrest.Last_Name,
      arrest.DOB,
      arrest.Address,
      arrest.City,
      arrest.State,
      arrest.ZIP,
      arrest.Booking_Date,
      arrest.Status,
      arrest.Charges,                // All_Charges (pipe-separated)
      arrest.Bond_Amount,
      arrest.Bond_Type,
      arrest.Bond_Paid,
      arrest.Case_Number,            // Case_Numbers (comma-separated)
      arrest.Court_Date,
      arrest.Court_Time,
      arrest.Court_Location,
      arrest.Lead_Score,
      arrest.Lead_Status,
      arrest.Detail_URL,
      arrest.Mugshot_URL,
      'Pending',                     // Family_Search_Status
      '',                            // Potential_Contacts_Found
      '', '', '', '', '',            // Contact_1
      '', '', '', '', '',            // Contact_2
      '', '', '', '', '',            // Contact_3
      '',                            // Google_Search
      '',                            // WhitePages_Search
      '',                            // TruePeopleSearch
      '',                            // Facebook_Search
      '',                            // Instagram_Search
      ''                             // Notes
    ];
  });
  
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
  
  Logger.log('✅ Added ' + rows.length + ' qualified arrests to sheet');
}

/**
 * Perform family/contact search for new qualified arrests
 */
function performFamilySearchForArrests(sheet, arrests) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colMap = {};
  headers.forEach(function(h, i) {
    if (h) colMap[h] = i + 1;
  });
  
  var data = sheet.getDataRange().getValues();
  
  arrests.forEach(function(arrest, index) {
    try {
      Logger.log('🔍 Searching for family/contacts: ' + arrest.Full_Name);
      
      // Find the row for this arrest
      var rowIndex = -1;
      for (var i = 1; i < data.length; i++) {
        if (data[i][colMap['Booking_Number'] - 1] === arrest.Booking_Number) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex === -1) {
        Logger.log('⚠️ Could not find row for booking ' + arrest.Booking_Number);
        return;
      }
      
      // Generate search URLs
      var searchUrls = generateFamilySearchUrls(arrest);
      
      // Update search URL columns
      if (colMap['Google_Search']) {
        sheet.getRange(rowIndex, colMap['Google_Search']).setValue(searchUrls.google || '');
      }
      if (colMap['WhitePages_Search']) {
        sheet.getRange(rowIndex, colMap['WhitePages_Search']).setValue(searchUrls.whitepages || '');
      }
      if (colMap['TruePeopleSearch']) {
        sheet.getRange(rowIndex, colMap['TruePeopleSearch']).setValue(searchUrls.truepeoplesearch || '');
      }
      if (colMap['Facebook_Search']) {
        sheet.getRange(rowIndex, colMap['Facebook_Search']).setValue(searchUrls.facebook || '');
      }
      if (colMap['Instagram_Search']) {
        sheet.getRange(rowIndex, colMap['Instagram_Search']).setValue(searchUrls.instagram || '');
      }
      
      // Update status
      if (colMap['Family_Search_Status']) {
        sheet.getRange(rowIndex, colMap['Family_Search_Status']).setValue('Search URLs Generated');
      }
      
      // Add note
      if (colMap['Notes']) {
        var note = 'Family search URLs generated. Use these links to find potential contacts who can help secure bond.';
        sheet.getRange(rowIndex, colMap['Notes']).setValue(note);
      }
      
      // Throttle to avoid rate limits
      if (index < arrests.length - 1) {
        Utilities.sleep(CONFIG.QUALIFIED_ARRESTS.FAMILY_SEARCH.SEARCH_DELAY_MS);
      }
      
    } catch (error) {
      Logger.log('⚠️ Error searching for ' + arrest.Full_Name + ': ' + error.message);
    }
  });
  
  Logger.log('✅ Family search complete for ' + arrests.length + ' arrests');
}

/**
 * Generate family search URLs for an arrest
 */
function generateFamilySearchUrls(arrest) {
  var urls = {};
  
  var name = arrest.Full_Name || '';
  var firstName = arrest.First_Name || '';
  var lastName = arrest.Last_Name || '';
  var city = arrest.City || '';
  var state = arrest.State || 'FL';
  
  // Google search - relatives and family
  if (name) {
    urls.google = 'https://www.google.com/search?q=' + 
      encodeURIComponent(name + ' relatives ' + city + ' ' + state + ' phone contact');
  }
  
  // WhitePages
  if (firstName && lastName && city) {
    urls.whitepages = 'https://www.whitepages.com/name/' + 
      encodeURIComponent(firstName + '-' + lastName) + '/' + 
      encodeURIComponent(city + '-' + state);
  }
  
  // TruePeopleSearch
  if (firstName && lastName) {
    urls.truepeoplesearch = 'https://www.truepeoplesearch.com/results?' +
      'firstname=' + encodeURIComponent(firstName) +
      '&lastname=' + encodeURIComponent(lastName) +
      '&citystatezip=' + encodeURIComponent(city + ', ' + state);
  }
  
  // Facebook
  if (name) {
    urls.facebook = 'https://www.facebook.com/search/people/?q=' + 
      encodeURIComponent(name + ' ' + city + ' ' + state);
  }
  
  // Instagram
  if (name) {
    var instagramName = name.replace(/\s+/g, '').toLowerCase();
    urls.instagram = 'https://www.instagram.com/explore/tags/' + encodeURIComponent(instagramName) + '/';
  }
  
  return urls;
}

/**
 * Send Slack notification for new qualified arrests
 */
function notifySlackOfQualifiedArrests(arrests) {
  var webhookUrl = getSlackWebhookUrl();
  if (!webhookUrl) return;
  
  try {
    var message = '🔥 *NEW QUALIFIED LEADS - ACTION REQUIRED*\n\n';
    message += arrests.length + ' new hot lead(s) added to Qualified Arrests sheet:\n\n';
    
    arrests.slice(0, 5).forEach(function(arrest) {
      message += '• *' + arrest.Full_Name + '* (Score: ' + arrest.Lead_Score + ')\n';
      message += '  Bond: $' + arrest.Bond_Amount + ' | ' + arrest.Bond_Type + '\n';
      if (arrest.Charges) {
        var charges = arrest.Charges.split(' | ')[0]; // First charge only
        message += '  Charge: ' + charges + '\n';
      }
      message += '\n';
    });
    
    if (arrests.length > 5) {
      message += '_...and ' + (arrests.length - 5) + ' more_\n\n';
    }
    
    message += '📋 View all: <https://docs.google.com/spreadsheets/d/' + CONFIG.QUALIFIED_ARRESTS.SHEET_ID + '|Qualified Arrests Sheet>';
    
    var payload = {
      text: message,
      channel: CONFIG.SLACK_CHANNELS.QUALIFIED_LEADS
    };
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    UrlFetchApp.fetch(webhookUrl, options);
    Logger.log('✅ Slack notification sent for qualified arrests');
    
  } catch (error) {
    Logger.log('⚠️ Failed to send Slack notification: ' + error.message);
  }
}

/**
 * Menu function to manually sync qualified arrests
 */
function manualSyncQualifiedArrests() {
  var ui = SpreadsheetApp.getUi();
  
  var response = ui.alert(
    'Sync Qualified Arrests',
    'This will sync all arrests with Lead_Score >= ' + CONFIG.QUALIFIED_ARRESTS.MIN_SCORE + ' to the Qualified Arrests sheet.\n\nContinue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response === ui.Button.YES) {
    try {
      syncQualifiedArrests();
      ui.alert('✅ Qualified arrests synced successfully!');
    } catch (error) {
      ui.alert('❌ Error: ' + error.message);
    }
  }
}

/**
 * View qualified arrests sheet
 */
function viewQualifiedArrestsSheet() {
  try {
    var url = 'https://docs.google.com/spreadsheets/d/' + CONFIG.QUALIFIED_ARRESTS.SHEET_ID;
    var html = '<html><body><script>window.open("' + url + '", "_blank"); google.script.host.close();</script></body></html>';
    var htmlOutput = HtmlService.createHtmlOutput(html).setWidth(200).setHeight(100);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Opening Qualified Arrests...');
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error: ' + error.message);
  }
}

