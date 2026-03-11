/**
 * Charlotte County Arrest Scraper (v1.0)
 * Entry point: runCharlotteCountyScrape
 * 
 * Source: https://inmates.charlottecountyfl.revize.com/
 * Target: Qualified_Arrests spreadsheet, tab "Charlotte County Qualified Arrests"
 * 
 * Features:
 * - Scrapes last 72 hours of arrests
 * - Same scoring logic as Lee County (threshold >= 70)
 * - Writes only qualified arrests to separate county tab
 * - Deduplication by County + Booking_Number
 * - Slack notifications for new qualified arrests
 * - Runs every 30 minutes via trigger
 */

// ========== CONFIG ==========
function getCharlotteConfig_() {
  var base = {
    COUNTY_NAME: 'Charlotte',
    SOURCE_URL: 'https://inmates.charlottecountyfl.revize.com/',
    QUALIFIED_SHEET_ID: '1MJfhMrFNGvUeMxKuFY9JhEOr4IEiCSsMO3-xFOWBIng',
    TAB_NAME: 'Charlotte County Qualified Arrests',
    HOURS_BACK: 72,
    MIN_SCORE: 70,
    RETRY_LIMIT: 3,
    BACKOFF_BASE_MS: 1000,
    MAX_EXECUTION_MS: 300000,
    TIMEZONE: 'America/New_York'
  };
  
  // Override from CONFIG if available
  try {
    if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.CHARLOTTE) {
      var o = CONFIG.CHARLOTTE;
      for (var k in o) base[k] = o[k];
    }
  } catch(_) {}
  
  return base;
}

var CHARLOTTE = getCharlotteConfig_();

// ========== MENU & TRIGGERS ==========
function onOpen_Charlotte() {
  SpreadsheetApp.getUi()
    .createMenu('🟩 Bail Suite')
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Arrests (Charlotte)')
      .addItem('▶️ Run now', 'runCharlotteCountyScrape')
      .addItem('⏰ Install 30-min trigger', 'installCharlotteTrigger')
      .addItem('🛑 Disable triggers', 'disableCharlotteTriggers'))
    .addToUi();
}

function installCharlotteTrigger() {
  // Remove existing triggers
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'runCharlotteCountyScrape') {
      ScriptApp.deleteTrigger(t);
    }
  });
  
  // Install new trigger - every 30 minutes
  ScriptApp.newTrigger('runCharlotteCountyScrape')
    .timeBased()
    .everyMinutes(30)
    .create();
  
  Logger.log('⏰ Installed 30-minute trigger for Charlotte County scraper');
}

function disableCharlotteTriggers() {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'runCharlotteCountyScrape') {
      ScriptApp.deleteTrigger(t);
      n++;
    }
  });
  Logger.log('🛑 Removed ' + n + ' trigger(s) for Charlotte County scraper');
}

// ========== ENTRY POINT ==========
function runCharlotteCountyScrape() {
  var startMs = Date.now();
  var lock = LockService.getScriptLock();
  
  if (!lock.tryLock(30000)) {
    Logger.log('🚫 Another Charlotte County scrape is in progress.');
    return;
  }
  
  try {
    Logger.log('═══════════════════════════════════════');
    Logger.log('🚦 Starting Charlotte County Arrest Scraper');
    Logger.log('═══════════════════════════════════════');
    
    // Fetch arrests from Charlotte County
    var arrests = fetchCharlotteArrests_();
    Logger.log('📥 Total fetched: ' + arrests.length);
    
    if (arrests.length === 0) {
      Logger.log('ℹ️ No arrests found');
      return;
    }
    
    // Score arrests using same logic as Lee County
    var scored = scoreArrests_(arrests);
    Logger.log('📊 Scored: ' + scored.length);
    
    // Filter for qualified arrests (score >= 70)
    var qualified = scored.filter(function(a) {
      return a.Lead_Score >= CHARLOTTE.MIN_SCORE;
    });
    Logger.log('🎯 Qualified arrests: ' + qualified.length + ' (score >= ' + CHARLOTTE.MIN_SCORE + ')');
    
    if (qualified.length === 0) {
      Logger.log('ℹ️ No qualified arrests to write');
      return;
    }
    
    // Write to qualified arrests sheet
    var result = writeToQualifiedSheet_(qualified);
    Logger.log('✅ Inserted: ' + result.inserted + ', Updated: ' + result.updated + ', Skipped: ' + result.skipped);
    
    // Send Slack notifications for new qualified arrests
    if (result.inserted > 0) {
      sendSlackNotifications_(qualified.slice(0, result.inserted));
    }
    
    var duration = Math.round((Date.now() - startMs) / 1000);
    Logger.log('⏱️ Total execution time: ' + duration + ' seconds');
    Logger.log('═══════════════════════════════════════');
    
  } catch (e) {
    Logger.log('❌ Fatal error: ' + (e && e.stack ? e.stack : e));
    throw e;
  } finally {
    lock.releaseLock();
  }
}

// ========== SCRAPING ==========
function fetchCharlotteArrests_() {
  Logger.log('🌐 Fetching arrests from Charlotte County...');
  
  var url = CHARLOTTE.SOURCE_URL;
  var arrests = [];
  
  try {
    // NOTE: This site has Cloudflare protection
    // Options to handle this:
    // 1. Use UrlFetchApp with cookies from manual browser session
    // 2. Use a Cloudflare bypass service
    // 3. Implement browser automation with cookie transfer
    
    var html = fetchWithCloudflareBypass_(url);
    
    if (!html) {
      Logger.log('⚠️ Failed to fetch Charlotte County data (Cloudflare block)');
      return [];
    }
    
    // Parse HTML to extract arrest records
    arrests = parseCharlotteHTML_(html);
    
  } catch (e) {
    Logger.log('⚠️ Error fetching Charlotte arrests: ' + e.message);
  }
  
  return arrests;
}

function fetchWithCloudflareBypass_(url) {
  // METHOD 1: Try with standard fetch (may fail with Cloudflare)
  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    var code = response.getResponseCode();
    if (code === 200) {
      var html = response.getContentText();
      // Check if we got past Cloudflare
      if (html.indexOf('Just a moment') === -1 && html.indexOf('cf-browser-verification') === -1) {
        return html;
      }
    }
  } catch (e) {
    Logger.log('⚠️ Standard fetch failed: ' + e.message);
  }
  
  // METHOD 2: Try with stored cookies (from manual browser session)
  try {
    var cookies = getStoredCloudflareCookies_();
    if (cookies) {
      var response = UrlFetchApp.fetch(url, {
        method: 'get',
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Cookie': cookies
        }
      });
      
      if (response.getResponseCode() === 200) {
        return response.getContentText();
      }
    }
  } catch (e) {
    Logger.log('⚠️ Cookie-based fetch failed: ' + e.message);
  }
  
  // METHOD 3: Return null if all methods fail
  // User will need to manually set up Cloudflare bypass
  return null;
}

function getStoredCloudflareCookies_() {
  // Check script properties for stored Cloudflare cookies
  try {
    var props = PropertiesService.getScriptProperties();
    return props.getProperty('CHARLOTTE_CF_COOKIES');
  } catch (e) {
    return null;
  }
}

function setCloudflareCookies(cookieString) {
  // Store Cloudflare cookies for future requests
  // Call this manually after getting cookies from browser
  var props = PropertiesService.getScriptProperties();
  props.setProperty('CHARLOTTE_CF_COOKIES', cookieString);
  Logger.log('✅ Cloudflare cookies stored');
}

function parseCharlotteHTML_(html) {
  // Parse the HTML to extract arrest records
  // This will need to be customized based on actual HTML structure
  
  var arrests = [];
  
  // TODO: Implement HTML parsing based on actual site structure
  // For now, return empty array
  // When site is accessible, implement proper parsing
  
  Logger.log('⚠️ HTML parsing not yet implemented - waiting for Cloudflare bypass');
  
  return arrests;
}

// ========== SCORING ==========
function scoreArrests_(arrests) {
  // Use same scoring logic as Lee County
  if (typeof scoreArrestLead !== 'function') {
    Logger.log('⚠️ Lead scoring function not found');
    return arrests.map(function(a) {
      a.Lead_Score = 0;
      a.Lead_Status = 'Unknown';
      return a;
    });
  }
  
  return arrests.map(function(arrest) {
    var score = scoreArrestLead(arrest);
    arrest.Lead_Score = score.score;
    arrest.Lead_Status = score.status;
    return arrest;
  });
}

// ========== GOOGLE SHEETS I/O ==========
function writeToQualifiedSheet_(arrests) {
  var ss = SpreadsheetApp.openById(CHARLOTTE.QUALIFIED_SHEET_ID);
  var sheet = ss.getSheetByName(CHARLOTTE.TAB_NAME);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    Logger.log('📋 Creating Charlotte County Qualified Arrests sheet...');
    sheet = ss.insertSheet(CHARLOTTE.TAB_NAME);
    createHeaders_(sheet);
  }
  
  // Get existing data for deduplication
  var existing = loadExistingRecords_(sheet);
  
  var inserted = 0, updated = 0, skipped = 0;
  
  for (var i = 0; i < arrests.length; i++) {
    var arrest = arrests[i];
    var key = makeKey_(arrest);
    
    if (existing.has(key)) {
      // Update existing record
      var rowIndex = existing.get(key);
      updateRow_(sheet, rowIndex, arrest);
      updated++;
    } else {
      // Insert new record
      appendRow_(sheet, arrest);
      inserted++;
    }
  }
  
  return {inserted: inserted, updated: updated, skipped: skipped};
}

function createHeaders_(sheet) {
  var headers = [
    'County',
    'Full_Name',
    'Last_Name',
    'DOB',
    'Booking_Number',
    'Booking_Date',
    'Status',
    'Charges',
    'Bond_Amount',
    'Bond_Type',
    'Court_Date',
    'Court_Time',
    'Address',
    'City',
    'State',
    'ZIP',
    'Lead_Score',
    'Lead_Status',
    'Google_Search',
    'Facebook_Search',
    'TruePeopleSearch',
    'Detail_URL',
    'Ingested_At'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#00A86B')
    .setFontColor('#FFFFFF');
}

function loadExistingRecords_(sheet) {
  var existing = new Map();
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return existing;
  
  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues(); // County, Name, DOB, Booking#, Date
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var county = row[0];
    var bookingNumber = row[4];
    var fullName = row[1];
    var bookingDate = row[5];
    
    var key;
    if (bookingNumber) {
      key = county + '|' + bookingNumber;
    } else {
      key = county + '|' + fullName + '|' + bookingDate;
    }
    
    existing.set(key, i + 2); // Row index (1-indexed, +1 for header)
  }
  
  return existing;
}

function makeKey_(arrest) {
  if (arrest.Booking_Number) {
    return CHARLOTTE.COUNTY_NAME + '|' + arrest.Booking_Number;
  } else {
    return CHARLOTTE.COUNTY_NAME + '|' + arrest.Full_Name + '|' + arrest.Booking_Date;
  }
}

function appendRow_(sheet, arrest) {
  var row = arrestToRow_(arrest);
  sheet.appendRow(row);
}

function updateRow_(sheet, rowIndex, arrest) {
  var row = arrestToRow_(arrest);
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
}

function arrestToRow_(arrest) {
  return [
    CHARLOTTE.COUNTY_NAME,
    arrest.Full_Name || '',
    arrest.Last_Name || '',
    arrest.DOB || '',
    arrest.Booking_Number || '',
    arrest.Booking_Date || '',
    arrest.Status || '',
    arrest.Charges || '',
    arrest.Bond_Amount || 0,
    arrest.Bond_Type || '',
    arrest.Court_Date || '',
    arrest.Court_Time || '',
    arrest.Address || '',
    arrest.City || '',
    arrest.State || 'FL',
    arrest.ZIP || '',
    arrest.Lead_Score || 0,
    arrest.Lead_Status || '',
    arrest.Google_Search || '',
    arrest.Facebook_Search || '',
    arrest.TruePeopleSearch || '',
    arrest.Detail_URL || '',
    new Date()
  ];
}

// ========== SLACK NOTIFICATIONS ==========
function sendSlackNotifications_(arrests) {
  try {
    var props = PropertiesService.getScriptProperties();
    var webhookUrl = props.getProperty('SLACK_WEBHOOK_URL');
    
    if (!webhookUrl) {
      Logger.log('ℹ️ No Slack webhook configured, skipping notifications');
      return;
    }
    
    for (var i = 0; i < Math.min(arrests.length, 10); i++) {
      var arrest = arrests[i];
      var topCharge = arrest.Charges ? arrest.Charges.split('|')[0].trim() : 'Unknown';
      
      var message = {
        text: '🔥 *New Qualified Arrest — Charlotte*\n\n' +
              '*Name:* ' + arrest.Full_Name + '\n' +
              '*Bond:* $' + arrest.Bond_Amount + '\n' +
              '*Charges:* ' + topCharge + '\n' +
              '*Booking #:* ' + arrest.Booking_Number + '\n' +
              '*Score:* ' + arrest.Lead_Score + '/100 (' + arrest.Lead_Status + ')\n' +
              '*Detail:* ' + arrest.Detail_URL
      };
      
      UrlFetchApp.fetch(webhookUrl, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(message),
        muteHttpExceptions: true
      });
      
      Utilities.sleep(1000); // Rate limit
    }
    
    Logger.log('📨 Sent ' + Math.min(arrests.length, 10) + ' Slack notifications');
    
  } catch (e) {
    Logger.log('⚠️ Slack notification error: ' + e.message);
  }
}

// ========== UTILITIES ==========
function safeString_(v) {
  return (v == null || v === undefined) ? '' : String(v).trim();
}

function toTitleCase_(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/\b\w/g, function(char) {
    return char.toUpperCase();
  });
}

function normalizeDate_(dateStr) {
  // Parse various date formats and return YYYY-MM-DD
  if (!dateStr) return '';
  
  try {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    
    return Utilities.formatDate(d, CHARLOTTE.TIMEZONE, 'yyyy-MM-dd');
  } catch (e) {
    return '';
  }
}

function parseLastName_(fullName) {
  // Extract last name from full name
  // Handle formats: "Last, First Middle" or "First Middle Last"
  if (!fullName) return '';
  
  var name = String(fullName).trim();
  
  // Format: "Last, First Middle"
  if (name.indexOf(',') > -1) {
    return name.split(',')[0].trim();
  }
  
  // Format: "First Middle Last" - take last word
  var parts = name.split(' ');
  if (parts.length > 0) {
    return parts[parts.length - 1];
  }
  
  return name;
}

function generateSearchLinks_(fullName) {
  if (!fullName) {
    return {
      Google_Search: '',
      Facebook_Search: '',
      TruePeopleSearch: ''
    };
  }
  
  var encoded = encodeURIComponent(fullName);
  
  return {
    Google_Search: 'https://www.google.com/search?q=' + encoded + '+Florida',
    Facebook_Search: 'https://www.facebook.com/search/top?q=' + encoded,
    TruePeopleSearch: 'https://www.truepeoplesearch.com/resultname?n=' + encoded + '&citystatezip=FL'
  };
}

