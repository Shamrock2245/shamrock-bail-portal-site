/**
 * ============================================
 * COLLIER COUNTY ARREST SCRAPER v3.0
 * ============================================
 * Simplified: Just parse the default results page
 * (Page loads with yesterday's arrests by default)
 */

// Configuration
var COLLIER_CONFIG = {
  SPREADSHEET_ID: '1jq1-N7sCbwSiYPLAdI2ZnxhLzym1QsOSuHPy-Gw07Qc',
  TAB_NAME: 'Collier_County_Arrests',
  QUALIFIED_SHEET_ID: '1_8jmb3UsbDNWoEtD2_5O27JNvXKBExrQq2pG0W-mPJI',
  QUALIFIED_TAB_NAME: 'Qualified_Arrests',
  BASE_URL: 'https://www2.colliersheriff.org/arrestsearch/Report.aspx',
  COUNTY: 'Collier'
};

/**
 * Main function - Run Collier County scraper
 */
function runCollierArrestsNow() {
  var startTime = new Date();
  Logger.log('═══════════════════════════════════════');
  Logger.log('🚦 Starting Collier County Arrest Scraper v3.0');
  Logger.log('═══════════════════════════════════════');
  
  try {
    // Get or create the arrests sheet
    var sheet = getOrCreateCollierSheet_();
    var existingData = sheet.getDataRange().getValues();
    var existingBookings = {};
    
    // Build map of existing booking numbers (skip header row)
    for (var i = 1; i < existingData.length; i++) {
      var bookingNum = existingData[i][1]; // Column B = Booking_Number
      if (bookingNum) existingBookings[bookingNum] = true;
    }
    
    Logger.log('📚 Existing rows: ' + (existingData.length - 1));
    
    // Fetch arrests from default page
    Logger.log('📡 Fetching Collier County arrests...');
    var arrests = fetchCollierArrests_();
    
    Logger.log('✅ Parsed ' + arrests.length + ' arrest records');
    
    // Filter to new arrests only
    var newArrests = arrests.filter(function(arrest) {
      return !existingBookings[arrest.Booking_Number];
    });
    
    Logger.log('📥 New arrests: ' + newArrests.length);
    
    if (newArrests.length === 0) {
      Logger.log('ℹ️ No new arrests to add.');
    } else {
      // Write new arrests to sheet
      writeCollierArrestsToSheet_(sheet, newArrests);
      Logger.log('✅ Added ' + newArrests.length + ' new arrests to sheet');
      
      // Score the new arrests
      scoreCollierArrests_(sheet, newArrests);
      
      // Sync qualified arrests (score >= 70)
      syncCollierQualifiedArrests_(newArrests);
      
      // Send Slack notifications
      notifyCollierQualifiedArrests_(newArrests);
    }
    
    var endTime = new Date();
    var duration = Math.round((endTime - startTime) / 1000);
    Logger.log('⏱️ Total execution time: ' + duration + ' seconds');
    Logger.log('═══════════════════════════════════════');
    
    return {
      success: true,
      totalFetched: arrests.length,
      newArrests: newArrests.length,
      duration: duration
    };
    
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log(error.stack);
    throw error;
  }
}

/**
 * Fetch arrests from Collier County website
 * Just GET the default page (shows yesterday's arrests)
 */
function fetchCollierArrests_() {
  try {
    Logger.log('📡 Loading: ' + COLLIER_CONFIG.BASE_URL);
    
    var response = UrlFetchApp.fetch(COLLIER_CONFIG.BASE_URL, {
      method: 'get',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log('⚠️ HTTP ' + response.getResponseCode());
      return [];
    }
    
    var html = response.getContentText();
    Logger.log('📄 HTML received: ' + html.length + ' bytes');
    
    // Parse the results
    return parseCollierHTML_(html);
    
  } catch (error) {
    Logger.log('⚠️ Error fetching Collier arrests: ' + error.message);
    return [];
  }
}

/**
 * Parse Collier County HTML to extract arrest records
 */
function parseCollierHTML_(html) {
  var arrests = [];
  
  try {
    // The page structure: Each arrest is in a block starting with a Name table
    // Pattern: <td>Name</td> ... <td>LASTNAME,FIRSTNAME</td> <td>DOB</td> <td>Residence</td>
    
    // Split by "Name\tDate of Birth\tResidence" header rows
    var nameHeaderRegex = /<td[^>]*>Name<\/td>\s*<td[^>]*>Date of Birth<\/td>\s*<td[^>]*>Residence<\/td>/gi;
    var blocks = html.split(nameHeaderRegex);
    
    Logger.log('🔍 Found ' + (blocks.length - 1) + ' arrest blocks');
    
    // Skip first block (before first arrest)
    for (var i = 1; i < blocks.length; i++) {
      var block = blocks[i];
      var arrest = parseCollierBlock_(block);
      if (arrest && arrest.Booking_Number) {
        arrests.push(arrest);
        Logger.log('✅ Parsed: ' + arrest.Full_Name + ' (' + arrest.Booking_Number + ')');
      }
    }
    
  } catch (error) {
    Logger.log('⚠️ Error parsing HTML: ' + error.message);
    Logger.log(error.stack);
  }
  
  return arrests;
}

/**
 * Parse a single arrest block
 */
function parseCollierBlock_(block) {
  var arrest = {
    County: 'Collier',
    Full_Name: '',
    First_Name: '',
    Last_Name: '',
    DOB: '',
    Address: '',
    City: '',
    State: '',
    ZIP: '',
    Booking_Number: '',
    Booking_Date: '',
    Charges: '',
    Bond_Amount: '',
    Bond_Type: '',
    Bond_Paid: '',
    Case_Number: '',
    Court_Date: '',
    Court_Time: '',
    Court_Location: '',
    Status: '',
    Person_ID: '',
    PIN: '',
    Race: '',
    Sex: '',
    Height: '',
    Weight: '',
    Hair_Color: '',
    Eye_Color: '',
    Age: '',
    Agency: ''
  };
  
  try {
    // Extract name, DOB, residence from first data row
    // Pattern: <td>LASTNAME,FIRSTNAME MIDDLE</td><td>MM/DD/YYYY</td><td>CITY, STATE ZIP</td>
    var firstRowRegex = /<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d{2}\/\d{2}\/\d{4})<\/td>\s*<td[^>]*>([^<]*)<\/td>/i;
    var firstRowMatch = firstRowRegex.exec(block);
    
    if (firstRowMatch) {
      arrest.Full_Name = cleanText_(firstRowMatch[1]);
      arrest.DOB = cleanText_(firstRowMatch[2]);
      var residence = cleanText_(firstRowMatch[3]);
      
      // Parse name (format: "LASTNAME,FIRSTNAME MIDDLE")
      parseCollierName_(arrest.Full_Name, arrest);
      
      // Parse residence (format: "CITY, STATE ZIP")
      parseCollierResidence_(residence, arrest);
    }
    
    // Extract Person ID (A#)
    var aNumMatch = /A#[^\d]*(\d{8})/i.exec(block);
    if (aNumMatch) arrest.Person_ID = aNumMatch[1];
    
    // Extract PIN
    var pinMatch = /PIN[^\d]*(\d{9,10})/i.exec(block);
    if (pinMatch) arrest.PIN = pinMatch[1];
    
    // Extract Race
    var raceMatch = /Race<\/td>\s*<td[^>]*>([^<]+)/i.exec(block);
    if (raceMatch) arrest.Race = cleanText_(raceMatch[1]);
    
    // Extract Sex
    var sexMatch = /Sex<\/td>\s*<td[^>]*>([^<]+)/i.exec(block);
    if (sexMatch) arrest.Sex = cleanText_(sexMatch[1]);
    
    // Extract Height
    var heightMatch = /Height<\/td>\s*<td[^>]*>(\d+)/i.exec(block);
    if (heightMatch) arrest.Height = cleanText_(heightMatch[1]);
    
    // Extract Weight
    var weightMatch = /Weight<\/td>\s*<td[^>]*>(\d+)/i.exec(block);
    if (weightMatch) arrest.Weight = cleanText_(weightMatch[1]);
    
    // Extract Hair Color
    var hairMatch = /Hair Color<\/td>\s*<td[^>]*>([^<]+)/i.exec(block);
    if (hairMatch) arrest.Hair_Color = cleanText_(hairMatch[1]);
    
    // Extract Eye Color
    var eyeMatch = /Eye Color<\/td>\s*<td[^>]*>([^<]+)/i.exec(block);
    if (eyeMatch) arrest.Eye_Color = cleanText_(eyeMatch[1]);
    
    // Extract Booking Date, Number, Agency, Age
    var bookingMatch = /Booking Date<\/td>\s*<td[^>]*>(\d{2}\/\d{2}\/\d{4})<\/td>\s*<td[^>]*>Booking Number<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>Agency<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>Age at Arrest<\/td>\s*<td[^>]*>(\d+)/i.exec(block);
    if (bookingMatch) {
      arrest.Booking_Date = cleanText_(bookingMatch[1]);
      arrest.Booking_Number = cleanText_(bookingMatch[2]);
      arrest.Agency = cleanText_(bookingMatch[3]);
      arrest.Age = cleanText_(bookingMatch[4]);
    }
    
    // Extract charges (multiple rows in Charged table)
    var chargesArray = [];
    var caseNumbers = [];
    var courtDates = [];
    
    // Pattern: <td>MM/DD/YYYY</td><td>Count</td><td>Offense description</td><td>Hold For</td><td>Case Number</td><td>Court Date</td>
    var chargeRegex = /<td[^>]*>(\d{2}\/\d{2}\/\d{4})<\/td>\s*<td[^>]*>(\d+|[^<]*)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>/gi;
    var chargeMatch;
    
    while ((chargeMatch = chargeRegex.exec(block)) !== null) {
      var chargeDate = cleanText_(chargeMatch[1]);
      var offense = cleanText_(chargeMatch[3]);
      var caseNum = cleanText_(chargeMatch[5]);
      var courtDate = cleanText_(chargeMatch[6]);
      
      if (offense && offense.length > 3) {
        chargesArray.push(offense);
        if (caseNum) caseNumbers.push(caseNum);
        if (courtDate) courtDates.push(courtDate);
      }
    }
    
    arrest.Charges = chargesArray.join(' | ');
    arrest.Case_Number = caseNumbers.join(', ');
    arrest.Court_Date = courtDates.length > 0 ? courtDates[0] : '';
    
    // Extract bond status
    var bondMatch = /Bond Status<\/td>[\s\S]*?<td[^>]*>([^<]+)</i.exec(block);
    if (bondMatch) {
      var bondText = cleanText_(bondMatch[1]);
      arrest.Bond_Paid = bondText;
      
      // Parse bond amount if present
      var amountMatch = /\$?([\d,]+)/i.exec(bondText);
      if (amountMatch) {
        arrest.Bond_Amount = amountMatch[1].replace(/,/g, '');
      }
    }
    
    // Extract custody status
    var custodyMatch = /IN CUSTODY/i.exec(block);
    arrest.Status = custodyMatch ? 'In Custody' : 'Released';
    
  } catch (error) {
    Logger.log('⚠️ Error parsing block: ' + error.message);
  }
  
  return arrest;
}

/**
 * Parse name (format: "LASTNAME,FIRSTNAME MIDDLE")
 */
function parseCollierName_(fullName, arrest) {
  if (!fullName) return;
  
  var parts = fullName.split(',');
  if (parts.length >= 2) {
    arrest.Last_Name = parts[0].trim();
    var firstMiddle = parts[1].trim().split(/\s+/);
    arrest.First_Name = firstMiddle[0];
  } else {
    arrest.Last_Name = fullName.trim();
  }
}

/**
 * Parse residence (format: "CITY, STATE ZIP")
 */
function parseCollierResidence_(residence, arrest) {
  if (!residence) return;
  
  arrest.Address = residence;
  
  // Try to extract city, state, ZIP
  var match = /([^,]+),\s*([A-Z]{2})\s+(\d{5})/i.exec(residence);
  if (match) {
    arrest.City = match[1].trim();
    arrest.State = match[2].trim();
    arrest.ZIP = match[3].trim();
  }
}

/**
 * Clean text (trim, remove extra whitespace)
 */
function cleanText_(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Get or create Collier County sheet
 */
function getOrCreateCollierSheet_() {
  var ss = SpreadsheetApp.openById(COLLIER_CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(COLLIER_CONFIG.TAB_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(COLLIER_CONFIG.TAB_NAME);
    
    // Set up headers
    var headers = [
      'County', 'Booking_Number', 'Booking_Date', 'Full_Name', 'First_Name', 'Last_Name',
      'DOB', 'Age', 'Sex', 'Race', 'Height', 'Weight', 'Hair_Color', 'Eye_Color',
      'Address', 'City', 'State', 'ZIP', 'Person_ID', 'PIN', 'Agency',
      'Charges', 'Case_Number', 'Court_Date', 'Court_Time', 'Court_Location',
      'Bond_Amount', 'Bond_Type', 'Bond_Paid', 'Status',
      'Lead_Score', 'Lead_Qualification', 'Search_Links', 'Notes'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    
    Logger.log('✅ Created new sheet: ' + COLLIER_CONFIG.TAB_NAME);
  }
  
  return sheet;
}

/**
 * Write arrests to sheet
 */
function writeCollierArrestsToSheet_(sheet, arrests) {
  if (arrests.length === 0) return;
  
  var rows = arrests.map(function(arrest) {
    return [
      arrest.County,
      arrest.Booking_Number,
      arrest.Booking_Date,
      arrest.Full_Name,
      arrest.First_Name,
      arrest.Last_Name,
      arrest.DOB,
      arrest.Age,
      arrest.Sex,
      arrest.Race,
      arrest.Height,
      arrest.Weight,
      arrest.Hair_Color,
      arrest.Eye_Color,
      arrest.Address,
      arrest.City,
      arrest.State,
      arrest.ZIP,
      arrest.Person_ID,
      arrest.PIN,
      arrest.Agency,
      arrest.Charges,
      arrest.Case_Number,
      arrest.Court_Date,
      arrest.Court_Time,
      arrest.Court_Location,
      arrest.Bond_Amount,
      arrest.Bond_Type,
      arrest.Bond_Paid,
      arrest.Status,
      '', // Lead_Score (filled by scoring function)
      '', // Lead_Qualification
      '', // Search_Links
      ''  // Notes
    ];
  });
  
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Score arrests using LeadScoring.js
 */
function scoreCollierArrests_(sheet, arrests) {
  if (arrests.length === 0) return;
  
  try {
    if (typeof autoScoreNewArrests === 'function') {
      var startRow = sheet.getLastRow() - arrests.length + 1;
      var endRow = sheet.getLastRow();
      Logger.log('📊 Auto-scoring rows ' + startRow + ' to ' + endRow);
      autoScoreNewArrests(startRow, endRow);
    } else {
      Logger.log('⚠️ autoScoreNewArrests function not found');
    }
  } catch (error) {
    Logger.log('⚠️ Error scoring arrests: ' + error.message);
  }
}

/**
 * Sync qualified arrests to separate workbook
 */
function syncCollierQualifiedArrests_(arrests) {
  if (arrests.length === 0) return;
  
  try {
    if (typeof syncQualifiedArrests === 'function') {
      Logger.log('🎯 Syncing qualified arrests...');
      syncQualifiedArrests();
    } else {
      Logger.log('⚠️ syncQualifiedArrests function not found');
    }
  } catch (error) {
    Logger.log('⚠️ Error syncing qualified arrests: ' + error.message);
  }
}

/**
 * Send Slack notifications for qualified arrests
 */
function notifyCollierQualifiedArrests_(arrests) {
  if (arrests.length === 0) return;
  
  try {
    // Filter to qualified arrests (score >= 70)
    var qualified = arrests.filter(function(arrest) {
      return arrest.Lead_Score && arrest.Lead_Score >= 70;
    });
    
    if (qualified.length > 0 && typeof sendSlackNotification === 'function') {
      Logger.log('📢 Sending Slack notifications for ' + qualified.length + ' qualified arrests');
      qualified.forEach(function(arrest) {
        sendSlackNotification(arrest);
      });
    }
  } catch (error) {
    Logger.log('⚠️ Error sending Slack notifications: ' + error.message);
  }
}

