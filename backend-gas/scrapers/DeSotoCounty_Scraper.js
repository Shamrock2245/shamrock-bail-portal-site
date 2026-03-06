/**
 * DeSoto County Arrest Scraper
 * Implements standard COUNTY_ADAPTER_TEMPLATE.md pattern
 * 
 * Target: http://jail.desotosheriff.org/DCN/inmates
 */

const DESOTO = {
    SHEET_ID: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',
    TAB_NAME: 'DeSoto',
    COUNTY_NAME: 'DeSoto',
    BASE_URL: 'http://jail.desotosheriff.org/DCN',
    INMATES_URL: 'http://jail.desotosheriff.org/DCN/inmates',
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    TIMEZONE: 'America/New_York'
};

// ============================================================================
// PUBLIC ENTRY POINT
// ============================================================================

function runDeSotoArrestsNow() {
    const startMs = Date.now();
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) {
        Logger.log('🚫 Another DeSoto run is in progress.');
        return;
    }

    try {
        Logger.log('═══════════════════════════════════════');
        Logger.log('🚦 Starting DeSoto County Arrest Scraper');

        const sheet = ds_getOrCreateTargetSheet_();

        // 1. FETCH ROSTER (Today's / recent arrests)
        const rosterLinks = ds_fetchRoster_();
        Logger.log('📥 Found ' + rosterLinks.length + ' recent arrest links');

        if (!rosterLinks || rosterLinks.length === 0) {
            Logger.log('ℹ️ No recent records found.');
            return;
        }

        // Load existing
        const existing = ds_loadExistingBookingNumbers_(sheet);
        const newLinks = rosterLinks.filter(function (r) { return !existing.has(r.bookingNumber); });
        Logger.log('📥 Total fetched: ' + rosterLinks.length + ' | New: ' + newLinks.length);

        if (newLinks.length === 0) {
            Logger.log('ℹ️ No new rows to write.');
            return;
        }

        // 2. FETCH DETAILS
        const validRecords = [];
        // Only process up to a certain limit per run to avoid timeouts
        const maxProcess = Math.min(newLinks.length, 50);
        for (let i = 0; i < maxProcess; i++) {
            const item = newLinks[i];
            Logger.log('Scraping details for ' + item.bookingNumber + ' (' + (i + 1) + '/' + maxProcess + ')');
            const detailRecord = ds_getArrestDetails_(item.url, item);
            if (detailRecord) {
                validRecords.push(detailRecord);
            }
            Utilities.sleep(2000); // 2 seconds between detail pages
        }

        Logger.log('⚡ Normalized ' + validRecords.length + ' valid records');

        // 3. LOAD (Upsert)
        if (validRecords.length > 0) {
            ds_upsertStrict_(sheet, validRecords);
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

/**
 * Phase 2: fetchRoster
 * Retrieves main list of inmates, capturing recent arrests.
 */
function ds_fetchRoster_() {
    const resp = ds_httpFetch_(DESOTO.INMATES_URL);
    if (!resp) throw new Error("GET Roster failed");

    const html = resp.content;

    const tableRe = /<table[^>]*id="gvInmates_DXMainTable"[^>]*>([\s\S]*?)<\/table>/i;
    const tableMatch = tableRe.exec(html);

    if (!tableMatch) return [];

    const results = [];
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;

    // We only care about up to last 48 hours for new entries usually.
    // Actually, we fetch all from page 1, since the roster defaults to date sorted or alphabetical?
    // It looks like it might default alphabetical. Given there's only 154 items total (Page 1 of 2),
    // we could just fetch all, but for Phase 2 we only check if their Admit Date is within 48h.
    // We'll scrape everything we see on page 1, and check Admit Date in the detail page, 
    // but to save API calls we can parse Admit Date from roster if available.
    // Roster cols: Name, Age, Race, Sex, Admit Date

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (2 * 86400000));

    while ((trMatch = trRe.exec(tableMatch[1])) !== null) {
        const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        let tdMatch;
        let cells = [];
        let link = null;

        while ((tdMatch = tdRe.exec(trMatch[1])) !== null) {
            let cellHtml = tdMatch[1];
            const linkMatch = /<a[^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/i.exec(cellHtml);
            if (linkMatch) {
                link = linkMatch[1];
                cellHtml = linkMatch[2];
            }
            let val = cellHtml.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
            if (val || link) cells.push({ text: val, link: link });
        }

        if (cells.length >= 5) {
            // cells[0]: Name, cells[1]: Age, cells[2]: Race, cells[3]: Sex, cells[4]: Admit Date
            const name = cells[0].text;
            const admitDateStr = cells[4].text; // e.g., '11/28/2025' or '2/26/2026'
            const detailUrl = cells[0].link; // e.g., 'inmate-details?id=...&bid=...'

            if (!detailUrl) continue;

            let bookingNumber = '';
            const bidMatch = /bid=([^&]+)/i.exec(detailUrl);
            if (bidMatch) {
                bookingNumber = decodeURIComponent(bidMatch[1]);
            } else {
                // fallback
                bookingNumber = name + '_' + admitDateStr;
            }

            let admitDate = new Date(admitDateStr);
            if (!isNaN(admitDate.getTime())) {
                // If older than 3 days, skip.
                if (admitDate.getTime() < twoDaysAgo.getTime() - 86400000) {
                    continue;
                }
            }

            results.push({
                name: name,
                admitDateStr: admitDateStr,
                url: (detailUrl.startsWith('http') ? detailUrl : (detailUrl.startsWith('/') ? 'http://jail.desotosheriff.org' + detailUrl : DESOTO.BASE_URL + '/' + detailUrl)),
                bookingNumber: bookingNumber
            });
        }
    }

    return results;
}

/**
 * Phase 3: getArrestDetails
 */
function ds_getArrestDetails_(bookingUrl, baseData) {
    const resp = ds_httpFetch_(bookingUrl);
    if (!resp) return null;
    const html = resp.content;

    // Parse Demographics
    const demographics = {};
    const dvDetailRe = /<table[^>]*id="dvDetail"[^>]*>([\s\S]*?)<\/table>/i;
    const dvDetailMatch = dvDetailRe.exec(html);
    if (dvDetailMatch) {
        const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let trMatch;
        while ((trMatch = trRe.exec(dvDetailMatch[1])) !== null) {
            const tdRe = /<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
            const tdMatch = tdRe.exec(trMatch[1]);
            if (tdMatch) {
                let key = tdMatch[1].replace(/<[^>]+>/g, '').trim();
                let value = tdMatch[2].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
                if (key) demographics[key] = value;
            }
        }
    }

    // Parse Charges
    // Because nested tables break standard regex, we split by row classes
    const chargeChunks = html.split('class="dxgvDataRow');
    const charges = [];
    let totalBond = 0;

    // Start from index 1 because 0 is everything before the first data row
    for (let i = 1; i < chargeChunks.length; i++) {
        let rowHtml = chargeChunks[i].split('</tr>')[0];
        const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        let tdMatch;
        const rowCells = [];
        while ((tdMatch = tdRe.exec(rowHtml)) !== null) {
            rowCells.push(tdMatch[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
        }

        // DeSoto Grid Columns:
        // 0: Charge, 1: Offense Date, 2: Court Type, 3: Court Date, 4: Docket Number, 5: Bond, 6: Bond Type, ...
        if (rowCells.length >= 6) {
            let chargeDesc = rowCells[0];
            let bondStr = rowCells[5];

            charges.push(chargeDesc);

            let bondAmt = parseFloat(bondStr.replace(/[^0-9.]/g, ''));
            if (!isNaN(bondAmt)) {
                totalBond += bondAmt;
            }
        }
    }

    // Name split
    let first = '', middle = '', last = '';
    const nameParts = baseData.name.split(',');
    if (nameParts.length > 0) last = nameParts[0].trim();
    if (nameParts.length > 1) {
        const rem = nameParts[1].trim().split(' ');
        first = rem[0];
        if (rem.length > 1) middle = rem.slice(1).join(' ');
    }

    const mugshotUrlMatch = /id="mugShotImg"[^>]*src=['"]([^'"]+)['"]/i.exec(html);
    let mugshotUrl = '';
    if (mugshotUrlMatch) {
        mugshotUrl = mugshotUrlMatch[1];
        if (!mugshotUrl.startsWith('http')) {
            mugshotUrl = DESOTO.BASE_URL + '/' + mugshotUrl;
        }
    }

    let dbDate = ds_parseDate_(demographics['Date of Birth']);
    let bkDate = ds_parseDate_(demographics['Admit Date']);

    return {
        bookingNumber: baseData.bookingNumber,
        personId: '',
        fullName: baseData.name,
        firstName: first,
        lastName: last,
        middleName: middle,
        dob: dbDate || demographics['Date of Birth'] || '',
        bookingDate: bkDate || demographics['Admit Date'] || baseData.admitDateStr,
        bookingTime: demographics['Admit Time'] || '',
        currentStatus: 'In Custody',
        currentFacility: demographics['Housing Location'] || 'DeSoto County Jail',
        race: demographics['Race'] || '',
        sex: demographics['Sex'] || '',
        height: demographics['Height'] || '',
        weight: demographics['Weight'] || '',
        address: demographics['Address'] || '',
        city: '', // Parsed inside address line usually
        state: 'FL',
        zip: '',
        mugshotUrl: mugshotUrl,
        charges: charges.join(' | '),
        bondAmount: totalBond > 0 ? totalBond.toFixed(2) : '',
        bondPaid: '',
        bondType: '',
        courtType: '',
        caseNumber: '',
        courtDate: '',
        courtTime: '',
        courtLocation: '',
        detailUrl: bookingUrl
    };
}

// ============================================================================
// SHEET I/O
// ============================================================================

function ds_headers_() {
    return ['Scrape_Timestamp', 'County', 'Booking_Number', 'Person_ID', 'Full_Name', 'First_Name', 'Middle_Name', 'Last_Name', 'DOB', 'Booking_Date', 'Booking_Time', 'Status', 'Facility', 'Race', 'Sex', 'Height', 'Weight', 'Address', 'City', 'State', 'ZIP', 'Mugshot_URL', 'Charges', 'Bond_Amount', 'Bond_Paid', 'Bond_Type', 'Court_Type', 'Case_Number', 'Court_Date', 'Court_Time', 'Court_Location', 'Detail_URL'];
}

function ds_getOrCreateTargetSheet_() {
    const ss = SpreadsheetApp.openById(DESOTO.SHEET_ID);
    let sh = ss.getSheetByName(DESOTO.TAB_NAME);
    if (!sh) {
        sh = ss.insertSheet(DESOTO.TAB_NAME);
    }

    const hdr = ds_headers_();
    let firstRow = [];
    if (sh.getLastRow() >= 1) {
        firstRow = sh.getRange(1, 1, 1, hdr.length).getValues()[0];
    }
    if (!firstRow[0] || firstRow[0] !== hdr[0]) {
        sh.getRange(1, 1, 1, hdr.length).setValues([hdr]);
        sh.setFrozenRows(1);
    }
    return sh;
}

function ds_loadExistingBookingNumbers_(sheet) {
    var set = new Set(), last = sheet.getLastRow();
    if (last < 2) return set;
    var bookingNumberIdx = ds_headers_().indexOf('Booking_Number') + 1;
    var vals = sheet.getRange(2, bookingNumberIdx, last - 1, 1).getValues();
    for (var i = 0; i < vals.length; i++) {
        var v = vals[i][0];
        if (v != null && v !== '') set.add(String(v).trim());
    }
    return set;
}

function ds_upsertStrict_(sheet, records) {
    if (!records || !records.length) return;

    const hdr = ds_headers_();
    const width = hdr.length;
    const last = sheet.getLastRow();
    const existing = new Map();
    const bookingNumberIdx = hdr.indexOf('Booking_Number') + 1;

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
        const row = ds_recordToRow_(r);
        const key = String(r.bookingNumber).trim();

        if (existing.has(key)) {
            updates.push({ row: existing.get(key), values: row });
        } else {
            appends.push(row);
        }
    });

    if (updates.length) {
        updates.forEach(u => sheet.getRange(u.row, 1, 1, width).setValues([u.values]));
    }
    if (appends.length) {
        sheet.getRange(sheet.getLastRow() + 1, 1, appends.length, width).setValues(appends);
    }
}

function ds_recordToRow_(r) {
    return [
        new Date(),
        DESOTO.COUNTY_NAME,
        ds_limitString_(r.bookingNumber, 100),
        ds_limitString_(r.personId, 100),
        ds_limitString_(r.fullName, 200),
        ds_limitString_(r.firstName, 100),
        ds_limitString_(r.middleName, 100),
        ds_limitString_(r.lastName, 100),
        ds_limitString_(r.dob, 50),
        ds_limitString_(r.bookingDate, 50),
        ds_limitString_(r.bookingTime, 50),
        ds_limitString_(r.currentStatus, 50),
        ds_limitString_(r.currentFacility, 150),
        ds_limitString_(r.race, 50),
        ds_limitString_(r.sex, 20),
        ds_limitString_(r.height, 50),
        ds_limitString_(r.weight, 50),
        ds_limitString_(r.address, 300),
        ds_limitString_(r.city, 100),
        ds_limitString_(r.state, 20),
        ds_limitString_(r.zip, 20),
        ds_limitString_(r.mugshotUrl, 500),
        ds_limitString_(r.charges, 8000),
        ds_limitString_(r.bondAmount, 50),
        ds_limitString_(r.bondPaid, 20),
        ds_limitString_(r.bondType, 50),
        ds_limitString_(r.courtType, 100),
        ds_limitString_(r.caseNumber, 100),
        ds_limitString_(r.courtDate, 50),
        ds_limitString_(r.courtTime, 50),
        ds_limitString_(r.courtLocation, 300),
        ds_limitString_(r.detailUrl, 500)
    ];
}

// ============================================================================
// HELPERS
// ============================================================================

function ds_httpFetch_(url) {
    try {
        const resp = UrlFetchApp.fetch(url, {
            method: 'get',
            muteHttpExceptions: true,
            followRedirects: true,
            headers: { 'User-Agent': DESOTO.USER_AGENT }
        });
        return { code: resp.getResponseCode(), content: resp.getContentText() };
    } catch (e) {
        Logger.log("Fetch Error: " + e.message);
        return null;
    }
}

function ds_limitString_(v, n) {
    if (!v) return '';
    const s = String(v);
    return s.length > n ? s.substring(0, n) : s;
}

function ds_parseDate_(dStr) {
    if (!dStr) return '';
    // Expected formats like MM-DD-YYYY or MM/DD/YYYY
    let m = /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/.exec(dStr);
    if (m) {
        let mo = m[1].length === 1 ? '0' + m[1] : m[1];
        let dd = m[2].length === 1 ? '0' + m[2] : m[2];
        return m[3] + '-' + mo + '-' + dd;
    }
    return '';
}
