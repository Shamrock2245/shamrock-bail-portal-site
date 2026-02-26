/**
 * ArrestScraper_CollierCounty.gs
 * 
 * Production-grade Google Apps Script module for scraping arrest data from
 * Collier County Sheriff's Office (Florida).
 * 
 * Standardized to match Lee County ETL pattern (Upsert/Normalize/Schema).
 */

const COLLIER = {
  SHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E', // Same spreadsheet
  TAB_NAME: 'Collier',
  COUNTY_NAME: 'Collier',
  BASE_URL: 'https://www2.colliersheriff.org',
  SEARCH_URL: 'https://www2.colliersheriff.org/arrestsearch/Report.aspx',
  USER_AGENT: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  MAX_CELL_LEN: 49000,
  TIMEZONE: 'America/New_York'
};

// ============================================================================
// PUBLIC ENTRY POINT
// ============================================================================

function runCollierArrestsNow() {
  const startMs = Date.now();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log('🚫 Another Collier run is in progress.');
    return;
  }

  try {
    Logger.log('═══════════════════════════════════════');
    Logger.log('🚦 Starting Collier County Arrest Scraper');

    const sheet = getOrCreateTargetSheet_();

    // 1. SCRAPE
    const rawRows = runCollierSearch_({ todaysArrests: true });
    Logger.log('📥 Extracted ' + rawRows.length + ' raw rows from HTML');

    if (!rawRows || rawRows.length < 2) {
      Logger.log('ℹ️ No records found (or only header).');
      return;
    }

    // 2. TRANSFORM
    // We assume row 0 is headers, so we map them to find indices, 
    // but for now we'll use a standard mapping based on the visual table structure
    // standard: [Name, Booking#, DOB, Arrest Date, Status, Charges...]

    const validRecords = [];
    // Skip header row usually, but check content
    const startIdx = (rawRows[0][0] && rawRows[0][0].toLowerCase().includes('name')) ? 1 : 0;

    for (let i = startIdx; i < rawRows.length; i++) {
      const norm = normalizeCollierRecord_(rawRows[i]);
      if (norm && norm.bookingNumber) {
        validRecords.push(norm);
      }
    }

    Logger.log('⚡ Normalized ' + validRecords.length + ' valid records');

    // 3. LOAD (Upsert)
    if (validRecords.length > 0) {
      upsertStrict_(sheet, validRecords);
    }

    // 4. REPEAT OFFENDER CHECK
    try {
      if (validRecords.length > 0 && typeof checkArrestsForRepeatOffenders === 'function') {
        Logger.log('🔍 Checking for repeat offenders...');
        checkArrestsForRepeatOffenders('Collier');
      }
    } catch (e) {
      Logger.log('⚠️ Repeat offender check failed (non-fatal): ' + e.message);
    }

    const duration = Math.round((Date.now() - startMs) / 1000);
    Logger.log('⏱️ Total: ' + duration + 's');
    Logger.log('═══════════════════════════════════════');

  } catch (e) {
    Logger.log('❌ Fatal: ' + e.message + '\n' + e.stack);
    throw e;
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// CORE SCRAPER (Private)
// ============================================================================

function runCollierSearch_(options) {
  options = options || {};

  // A. GET Search Page
  const getResp = Utils_httpFetch(COLLIER.SEARCH_URL, 'get', null, COLLIER.SEARCH_URL);
  if (!getResp) throw new Error("Initial GET failed");

  const cookies = getCookies_(getResp.headers);
  const cookieHeader = cookies.join('; ');
  const payload = extractAllInputs_(getResp.content);

  // B. Search Params (Today's Arrests)
  if (options.todaysArrests) {
    // Based on inspection, Collier often uses 'brdTodayArrests_ClientState' or similar
    // We set common defaults found in their simple mobile form
    payload['brdTodayArrests_ClientState'] = '{"value":"0"}';
    payload['btnSearch'] = 'Search';
  }

  // C. POST
  const postResp = Utils_httpFetch(COLLIER.SEARCH_URL, 'post', payload, COLLIER.SEARCH_URL, {
    'Cookie': cookieHeader,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Origin': COLLIER.BASE_URL
  });

  if (!postResp) throw new Error("POST Search failed");

  // D. Parse Table
  try {
    return parseFirstHtmlTableToRows_(postResp.content);
  } catch (e) {
    Logger.log("⚠️ Parsing warning: " + e.message);
    return [];
  }
}

// ============================================================================
// TRANSFORM & NORMALIZE
// ============================================================================

function normalizeCollierRecord_(row) {
  // Expected Array Layout (Needs validation against live site, but assuming standard):
  // 0: Name (DOE, JOHN)
  // 1: Booking Number (123456)
  // 2: DOB (10/12/1990)
  // 3: Arrest Date (01/29/2026)
  // 4: Status (In Custody)
  // 5: Charges (DUI; BATTERY...)
  // 6: Bond ($5000)

  // Safety check
  if (!Array.isArray(row) || row.length < 2) return null;

  const nameRaw = safeString_(row[0]);
  const bookingNum = safeString_(row[1]);

  if (!bookingNum || !nameRaw) return null;

  // Parse Name
  let first = '', middle = '', last = '';
  const parts = nameRaw.split(',');
  if (parts.length > 0) last = parts[0].trim();
  if (parts.length > 1) {
    const remaining = parts[1].trim().split(' ');
    first = remaining[0];
    if (remaining.length > 1) middle = remaining.slice(1).join(' ');
  }

  // Dates
  const bookingDate = safeString_(row[3]);
  const dob = safeString_(row[2]);

  return {
    bookingNumber: bookingNum,
    personId: '', // Collier doesn't strongly expose PermID in table
    fullName: nameRaw,
    firstName: first,
    lastName: last,
    middleName: middle,
    dob: dob,
    bookingDate: bookingDate,
    bookingTime: '',
    currentStatus: safeString_(row[4]),
    currentFacility: 'Collier County Jail',
    race: '', // Often not in main table
    sex: '',  // Often not in main table
    height: '',
    weight: '',
    address: '', // Requires detail scrape (future)
    city: '',
    state: 'FL',
    zip: '',
    mugshotUrl: '', // Requires detail scrape (future)
    charges: safeString_(row[5]),
    bondAmount: safeString_(row[6]),
    bondPaid: '',
    bondType: '',
    courtType: '',
    caseNumber: '',
    courtDate: '',
    courtTime: '',
    courtLocation: '',
    detailUrl: ''
  };
}

// ============================================================================
// LOAD (Upsert Strict)
// ============================================================================

function headers_() {
  return ['Scrape_Timestamp', 'County', 'Booking_Number', 'Person_ID', 'Full_Name', 'First_Name', 'Middle_Name', 'Last_Name', 'DOB', 'Booking_Date', 'Booking_Time', 'Status', 'Facility', 'Race', 'Sex', 'Height', 'Weight', 'Address', 'City', 'State', 'ZIP', 'Mugshot_URL', 'Charges', 'Bond_Amount', 'Bond_Paid', 'Bond_Type', 'Court_Type', 'Case_Number', 'Court_Date', 'Court_Time', 'Court_Location', 'Detail_URL'];
}

function getOrCreateTargetSheet_() {
  const ss = SpreadsheetApp.openById(COLLIER.SHEET_ID);
  let sh = ss.getSheetByName(COLLIER.TAB_NAME);
  if (!sh) {
    sh = ss.insertSheet(COLLIER.TAB_NAME);
  }

  const hdr = headers_();
  // Check headers match
  const firstRow = sh.getRange(1, 1, 1, hdr.length).getValues()[0];
  if (firstRow[0] !== hdr[0]) {
    sh.getRange(1, 1, 1, hdr.length).setValues([hdr]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function upsertStrict_(sheet, records) {
  if (!records || !records.length) return;

  const hdr = headers_();
  const width = hdr.length;
  const last = sheet.getLastRow();
  const existing = new Map();
  const bookingNumberIdx = hdr.indexOf('Booking_Number') + 1;

  // Index existing records
  if (last >= 2) {
    const keys = sheet.getRange(2, bookingNumberIdx, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i][0];
      if (k) existing.set(String(k).trim(), i + 2);
    }
  }

  const updates = [];
  const appends = [];

  records.forEach(r => {
    const row = recordToRow_(r);
    const key = String(r.bookingNumber).trim();

    if (existing.has(key)) {
      updates.push({ row: existing.get(key), values: row });
    } else {
      appends.push(row);
    }
  });

  // Batch Writes
  if (updates.length) {
    updates.forEach(u => sheet.getRange(u.row, 1, 1, width).setValues([u.values]));
  }
  if (appends.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, appends.length, width).setValues(appends);
  }
}

function recordToRow_(r) {
  return [
    new Date(),
    COLLIER.COUNTY_NAME,
    limitString_(r.bookingNumber, 100),
    limitString_(r.personId, 100),
    limitString_(r.fullName, 200),
    limitString_(r.firstName, 100),
    limitString_(r.middleName, 100),
    limitString_(r.lastName, 100),
    limitString_(r.dob, 50),
    limitString_(r.bookingDate, 50),
    limitString_(r.bookingTime, 50),
    limitString_(r.currentStatus, 50),
    limitString_(r.currentFacility, 150),
    limitString_(r.race, 50),
    limitString_(r.sex, 20),
    limitString_(r.height, 50),
    limitString_(r.weight, 50),
    limitString_(r.address, 300),
    limitString_(r.city, 100),
    limitString_(r.state, 20),
    limitString_(r.zip, 20),
    limitString_(r.mugshotUrl, 500),
    limitString_(r.charges, 8000), // Charges is already stringified in normalize if needed
    limitString_(r.bondAmount, 50),
    limitString_(r.bondPaid, 20),
    limitString_(r.bondType, 50),
    limitString_(r.courtType, 100),
    limitString_(r.caseNumber, 100),
    limitString_(r.courtDate, 50),
    limitString_(r.courtTime, 50),
    limitString_(r.courtLocation, 300),
    limitString_(r.detailUrl, 500)
  ];
}

// ============================================================================
// HELPERS
// ============================================================================

function extractAllInputs_(html) {
  const inputs = {};
  const re = /<input[^>]+name=["']([^"']+)["'][^>]*value=["']([^"']*)["']/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    inputs[match[1]] = match[2];
  }
  return inputs;
}

function parseFirstHtmlTableToRows_(html) {
  const tableMatch = /<table[^>]*?>([\s\S]*?)<\/table>/i.exec(html);
  if (!tableMatch) return [];

  const rows = [];
  const trRe = /<tr[^>]*?>([\s\S]*?)<\/tr>/gi;
  let trMatch;

  while ((trMatch = trRe.exec(tableMatch[1])) !== null) {
    const cells = [];
    const tdRe = /<t[hd][^>]*?>([\s\S]*?)<\/t[hd]>/gi;
    let tdMatch;
    while ((tdMatch = tdRe.exec(trMatch[1])) !== null) {
      let val = tdMatch[1].replace(/<[^>]+>/g, '').trim(); // Text only
      cells.push(val);
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function Utils_httpFetch(url, method, payload, referer, headers) {
  const opts = {
    method: method,
    muteHttpExceptions: true,
    followRedirects: true,
    headers: headers || { 'User-Agent': COLLIER.USER_AGENT }
  };
  if (payload) opts.payload = payload;

  try {
    const resp = UrlFetchApp.fetch(url, opts);
    return { code: resp.getResponseCode(), content: resp.getContentText(), headers: resp.getAllHeaders() };
  } catch (e) {
    Logger.log("Fetch Error: " + e.message);
    return null;
  }
}

function getCookies_(headers) {
  if (!headers || !headers['Set-Cookie']) return [];
  const raw = headers['Set-Cookie'];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map(c => c.split(';')[0].trim()).filter(c => c);
}

function safeString_(v) { return v ? String(v).trim() : ''; }
function limitString_(v, n) {
  if (!v) return '';
  const s = String(v);
  return s.length > n ? s.substring(0, n) : s;
}