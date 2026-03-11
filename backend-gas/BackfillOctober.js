/**
 * ============================================
 * LEE COUNTY OCTOBER BACKFILL
 * ============================================
 * Fetches arrests by booking number range (Oct 1-26)
 * Since the API doesn't support date ranges, we loop through booking numbers
 */

function backfillLeeCountyOctober() {
  var startTime = new Date();
  Logger.log('═══════════════════════════════════════');
  Logger.log('🗓️  LEE COUNTY OCTOBER BACKFILL');
  Logger.log('═══════════════════════════════════════');
  
  // Booking number range for October 1-26, 2025
  // Current (Oct 26): 1013832
  // Estimated Oct 1: 1012707 (25 days * 45 bookings/day)
  
  // Check if we should resume from where we left off
  var sheet = getOrCreateTargetSheet_();
  var existingBookings = loadExistingBookingNumbers_(sheet);
  
  // Find the highest booking number we already have
  var maxExisting = 1012707;
  existingBookings.forEach(function(booking) {
    var num = parseInt(booking);
    if (!isNaN(num) && num > maxExisting) {
      maxExisting = num;
    }
  });
  
  var startBooking = Math.max(1012707, maxExisting - 50); // Start 50 before highest to catch gaps
  var endBooking = 1013832;
  var batchSize = 20; // Process in smaller batches to avoid rate limits
  var maxPerRun = 200; // Only process 200 bookings per run to avoid timeouts
  
  // Limit end booking if we'd process too many
  if (endBooking - startBooking > maxPerRun) {
    endBooking = startBooking + maxPerRun;
    Logger.log('⚠️ Limiting to ' + maxPerRun + ' bookings per run to avoid rate limits');
    Logger.log('⚠️ Run again to continue from booking ' + endBooking);
  }
  
  Logger.log('📊 Booking range: ' + startBooking + ' to ' + endBooking);
  Logger.log('📊 Total bookings to check: ' + (endBooking - startBooking));
  Logger.log('📚 Existing rows in sheet: ' + existingBookings.size);
  Logger.log('📍 Highest existing booking: ' + maxExisting);
  
  var stats = {
    checked: 0,
    found: 0,
    new: 0,
    existing: 0,
    errors: 0
  };
  
  var newArrests = [];
  
  // Loop through booking numbers
  for (var bookingNum = startBooking; bookingNum <= endBooking; bookingNum++) {
    stats.checked++;
    
    // Progress update every 50 bookings
    if (stats.checked % 50 === 0) {
      Logger.log('📊 Progress: ' + stats.checked + '/' + (endBooking - startBooking) + 
                 ' | Found: ' + stats.found + ' | New: ' + stats.new);
    }
    
    // Skip if already exists
    if (existingBookings.has(String(bookingNum))) {
      stats.existing++;
      continue;
    }
    
    // Fetch booking data
    try {
      var arrest = fetchBookingByNumber_(bookingNum);
      
      if (arrest) {
        stats.found++;
        stats.new++;
        newArrests.push(arrest);
        
        // Write in batches of 50 to avoid memory issues
        if (newArrests.length >= batchSize) {
          writeBatch_(sheet, newArrests);
          newArrests = [];
          // Reload existing bookings after writing batch
          existingBookings = loadExistingBookingNumbers_(sheet);
        }
      }
      
      // Rate limiting: 1500ms delay between requests to avoid 503/429
      Utilities.sleep(1500);
      
    } catch (error) {
      stats.errors++;
      if (stats.errors % 10 === 0) {
        Logger.log('⚠️ Errors so far: ' + stats.errors);
      }
    }
  }
  
  // Write remaining arrests
  if (newArrests.length > 0) {
    writeBatch_(sheet, newArrests);
    existingBookings = loadExistingBookingNumbers_(sheet);
  }
  
  var duration = Math.round((new Date() - startTime) / 1000);
  Logger.log('═══════════════════════════════════════');
  Logger.log('✅ BACKFILL COMPLETE');
  Logger.log('📊 Checked: ' + stats.checked + ' bookings');
  Logger.log('📊 Found: ' + stats.found + ' arrests');
  Logger.log('📊 New: ' + stats.new + ' arrests');
  Logger.log('📊 Already existed: ' + stats.existing);
  Logger.log('📊 Errors: ' + stats.errors);
  Logger.log('⏱️  Duration: ' + duration + ' seconds');
  Logger.log('═══════════════════════════════════════');
}

/**
 * Fetch a single booking by number using the charges API
 */
function fetchBookingByNumber_(bookingNumber) {
  var url = 'https://www.sheriffleefl.org/public-api/bookings/' + bookingNumber + '/charges';
  var maxRetries = 3;
  
  for (var attempt = 0; attempt < maxRetries; attempt++) {
    try {
      var response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      var code = response.getResponseCode();
      
      if (code === 404) {
        // Booking doesn't exist
        return null;
      }
      
      if (code === 429 || code === 503) {
        // Rate limited - wait longer
        var waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s
        Logger.log('⏳ Rate limited (HTTP ' + code + '), waiting ' + (waitTime/1000) + 's...');
        Utilities.sleep(waitTime);
        continue;
      }
      
      if (code !== 200) {
        Logger.log('⚠️ HTTP ' + code + ' for booking ' + bookingNumber);
        return null;
      }
      
      // Success - break retry loop
      break;
      
    } catch (error) {
      if (attempt === maxRetries - 1) {
        return null;
      }
      Utilities.sleep(2000);
    }
  }
    
  
  try {
    var json = JSON.parse(response.getContentText());
    
    if (!Array.isArray(json) || json.length === 0) {
      return null;
    }
    
    // Parse the first charge record (contains all booking info)
    var firstCharge = json[0];
    
    // Build arrest object
    var arrest = {
      bookingNumber: String(bookingNumber),
      bookingDate: firstCharge.bookingDate || '',
      surName: '',
      givenName: '',
      middleName: '',
      birthDate: '',
      race: '',
      sex: '',
      height: '',
      weight: '',
      hair: '',
      address: '',
      inCustody: false,
      inCustodyText: firstCharge.disposition || '',
      charges: [],
      bondAmount: firstCharge.bondAmount || '',
      bondType: firstCharge.bondTypeName || '',
      bondPaid: firstCharge.bondDatePosted || '',
      caseNumber: firstCharge.caseNumber || '',
      courtDate: firstCharge.hearingDate ? firstCharge.hearingDate.split(' ')[0] : '',
      courtTime: firstCharge.hearingDate ? firstCharge.hearingDate.split(' ')[1] : '',
      courtLocation: firstCharge.courtLocation || '',
      courtType: firstCharge.courtLocation || ''
    };
    
    // Collect all charges
    for (var i = 0; i < json.length; i++) {
      var charge = json[i];
      if (charge.offenseDescription) {
        arrest.charges.push(charge.offenseDescription);
      }
    }
    
    // Try to get full booking details from main API
    try {
      var detailUrl = 'https://www.sheriffleefl.org/public-api/bookings?bookingNumber=' + bookingNumber;
      var detailResp = UrlFetchApp.fetch(detailUrl, {muteHttpExceptions: true});
      
      if (detailResp.getResponseCode() === 200) {
        var detailJson = JSON.parse(detailResp.getContentText());
        if (Array.isArray(detailJson) && detailJson.length > 0) {
          var detail = detailJson[0];
          arrest.surName = detail.surName || '';
          arrest.givenName = detail.givenName || '';
          arrest.middleName = detail.middleName || '';
          arrest.birthDate = detail.birthDate || '';
          arrest.race = detail.race || '';
          arrest.sex = detail.sex || '';
          arrest.height = detail.height || '';
          arrest.weight = detail.weight || '';
          arrest.hair = detail.hair || '';
          arrest.address = detail.address || '';
          arrest.inCustody = detail.inCustody || false;
          arrest.inCustodyText = detail.inCustodyText || '';
        }
      }
    } catch (e) {
      // Detail fetch failed, use what we have from charges
    }
    
    return arrest;
    
  } catch (error) {
    // Silent fail for 404s and network errors
    return null;
  }
}

/**
 * Write a batch of arrests to the sheet
 */
function writeBatch_(sheet, arrests) {
  if (arrests.length === 0) return;
  
  Logger.log('✍️  Writing batch of ' + arrests.length + ' arrests...');
  
  var rows = arrests.map(function(arrest) {
    return [
      'Lee',                                    // County
      arrest.bookingNumber,                     // Booking_Number
      arrest.bookingDate,                       // Booking_Date
      (arrest.surName + ', ' + arrest.givenName).trim(), // Full_Name
      arrest.givenName,                         // First_Name
      arrest.surName,                           // Last_Name
      arrest.birthDate,                         // DOB
      '',                                       // Age
      arrest.sex,                               // Sex
      arrest.race,                              // Race
      arrest.height,                            // Height
      arrest.weight,                            // Weight
      arrest.hair,                              // Hair_Color
      '',                                       // Eye_Color
      arrest.address,                           // Address
      '',                                       // City
      '',                                       // State
      '',                                       // ZIP
      '',                                       // Person_ID
      '',                                       // PIN
      '',                                       // Agency
      arrest.charges.join(' | '),               // Charges
      arrest.caseNumber,                        // Case_Number
      arrest.courtDate,                         // Court_Date
      arrest.courtTime,                         // Court_Time
      arrest.courtLocation,                     // Court_Location
      arrest.bondAmount,                        // Bond_Amount
      arrest.bondType,                          // Bond_Type
      arrest.bondPaid,                          // Bond_Paid
      arrest.inCustodyText,                     // Status
      '',                                       // Lead_Score
      '',                                       // Lead_Qualification
      '',                                       // Search_Links
      ''                                        // Notes
    ];
  });
  
  var startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
  
  // Auto-score the new arrests
  try {
    if (typeof autoScoreNewArrests === 'function') {
      autoScoreNewArrests(startRow, sheet.getLastRow());
    }
  } catch (e) {
    Logger.log('⚠️ Auto-scoring failed: ' + e.message);
  }
  
  // Generate search links
  try {
    if (typeof autoGenerateSearchLinksForNewArrests === 'function') {
      autoGenerateSearchLinksForNewArrests(startRow, sheet.getLastRow());
    }
  } catch (e) {
    Logger.log('⚠️ Search link generation failed: ' + e.message);
  }
}

/**
 * Get or create target sheet (reuse from main scraper)
 */
function getOrCreateTargetSheet_() {
  var ss = SpreadsheetApp.openById('1jq1-N7sCbwSiYPLAdI2ZnxhLzym1QsOSuHPy-Gw07Qc');
  var sheet = ss.getSheetByName('Lee_County_Arrests');
  
  if (!sheet) {
    throw new Error('Lee_County_Arrests sheet not found!');
  }
  
  return sheet;
}

/**
 * Load existing booking numbers (reuse from main scraper)
 */
function loadExistingBookingNumbers_(sheet) {
  var data = sheet.getDataRange().getValues();
  var bookings = new Set();
  
  // Column B = Booking_Number (index 1)
  for (var i = 1; i < data.length; i++) {
    var bookingNum = data[i][1];
    if (bookingNum) {
      bookings.add(String(bookingNum).trim());
    }
  }
  
  return bookings;
}

