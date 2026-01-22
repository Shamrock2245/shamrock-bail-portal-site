/**
 * LeadScoringSystem.gs (Robust + Menu-safe)
 *
 * Robust lead scoring + qualification routing for SWFL Arrest Scrapers.
 * - Enforces 34-column schema (Lead_Score, Lead_Status)
 * - Scores each arrest record with a practical model
 * - Released NEVER qualifies (hard rule)
 * - Routes passing leads (Warm/Hot) to "Qualified" tab in target spreadsheet
 * - Dedupes by Booking_Number + County
 *
 * Date: Dec 14, 2025
 */

// ============================================================================
// CONFIG
// ============================================================================

const SCHEMA_VERSION = "3.1";
const TOTAL_COLUMNS = 34;

// 34-column header order (must match your sheets)
const HEADERS = [
    "Booking_Number", "Full_Name", "First_Name", "Last_Name", "DOB", "Sex", "Race",
    "Arrest_Date", "Arrest_Time", "Booking_Date", "Booking_Time", "Agency",
    "Address", "City", "State", "Zipcode", "Charges", "Charge_1", "Charge_1_Statute",
    "Charge_1_Bond", "Charge_2", "Charge_2_Statute", "Charge_2_Bond", "Bond_Amount",
    "Bond_Type", "Status", "Court_Date", "Case_Number", "Mugshot_URL", "County",
    "Court_Location", "Detail_URL", "Lead_Score", "Lead_Status"
];

// County tabs to score
const COUNTY_TABS = ["Lee", "Collier", "Hendry", "Charlotte", "Manatee", "DeSoto", "Sarasota", "Hillsborough", "Palm Beach"];

// Target spreadsheet + Qualified tab routing
const TARGET_SPREADSHEET_ID = "121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E";
const TARGET_QUALIFIED_TAB_NAME = "Qualified";

// Thresholds
const HOT_THRESHOLD = 70;
const WARM_THRESHOLD = 40;          // passing threshold (Warm/Hot)
const PASS_THRESHOLD = WARM_THRESHOLD;

// Lead status labels
const LEAD_STATUS = {
    HOT: "Hot",
    WARM: "Warm",
    COLD: "Cold",
    DISQUALIFIED: "Disqualified"
};

// HARD RULE: released never qualifies (always true)
const RELEASED_NEVER_QUALIFIES = true;

// Optional: if true, only route if “in custody”. (Recommended, but you asked specifically about Released.)
const REQUIRE_IN_CUSTODY_FOR_QUALIFIED = false;

// Safety: avoid scoring sheets without correct headers
const STRICT_SCHEMA_CHECK = false;

// ============================================================================
// MENU INTEGRATION (SAFE)
// ============================================================================

/**
 * SAFE menu builder.
 * - If called from onOpen(menu), it will add as a submenu.
 * - If accidentally run directly (menu is undefined), it creates its own top-level menu safely.
 */
function addLeadScoringMenuItems(menu) {
    const ui = SpreadsheetApp.getUi();

    // If called without a menu (user clicked Run), create a safe root menu
    const rootMenu =
        (menu && typeof menu.addSeparator === "function")
            ? menu
            : ui.createMenu("🎯 Lead Scoring");

    const scoringMenu = ui.createMenu("🎯 Lead Scoring")
        .addItem("📊 Score + Route (All Counties)", "scoreAndRouteAllSheets")
        .addItem("📤 Route Qualified (All Counties)", "routeQualifiedAllSheets")
        .addSeparator()
        .addItem("🧠 Score Only (All Counties)", "scoreAllSheets")
        .addSeparator()
        .addItem("🔄 Update Schema to 34 Columns", "updateSchemaTo34Columns");

    // If rootMenu is your Bail Suite menu, add as submenu. If rootMenu is standalone, add items directly.
    if (rootMenu !== scoringMenu && typeof rootMenu.addSubMenu === "function") {
        rootMenu.addSeparator();
        rootMenu.addSubMenu(scoringMenu);
    } else {
        // Standalone fallback: add and show
        // (scoringMenu already has items)
        scoringMenu.addToUi();
        return scoringMenu;
    }

    return rootMenu;
}

// ============================================================================
// SCHEMA
// ============================================================================

function updateSchemaTo34Columns() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const results = { success: [], errors: [], timestamp: new Date() };

    COUNTY_TABS.forEach(name => {
        try {
            const sheet = ss.getSheetByName(name);
            if (!sheet) throw new Error(`Sheet not found: ${name}`);
            ensureSheetSchema_(sheet);
            results.success.push(name);
        } catch (e) {
            results.errors.push(`${name}: ${e.message}`);
        }
    });

    // Ensure destination Qualified tab has schema too
    try {
        const target = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
        const q = getOrCreateSheet_(target, TARGET_QUALIFIED_TAB_NAME);
        ensureSheetSchema_(q);
        results.success.push(`[TARGET] ${TARGET_QUALIFIED_TAB_NAME}`);
    } catch (e) {
        results.errors.push(`[TARGET] ${TARGET_QUALIFIED_TAB_NAME}: ${e.message}`);
    }

    SpreadsheetApp.getUi().alert(
        "Schema Update",
        `Updated: ${results.success.length}\n${results.success.join(", ")}\n\nErrors: ${results.errors.length}\n${results.errors.join("\n")}`,
        SpreadsheetApp.getUi().ButtonSet.OK
    );

    return results;
}

function ensureSheetSchema_(sheet) {
    const lastCol = sheet.getLastColumn();
    const headerRow = sheet.getRange(1, 1, 1, Math.max(lastCol, TOTAL_COLUMNS)).getValues()[0] || [];

    const hasLeadCols = headerRow[32] === "Lead_Score" && headerRow[33] === "Lead_Status";
    if (lastCol >= TOTAL_COLUMNS && hasLeadCols) return;

    sheet.getRange(1, 1, 1, TOTAL_COLUMNS).setValues([HEADERS]);

    // Format lead columns
    sheet.getRange(1, 33, 1, 2)
        .setBackground("#111111")
        .setFontColor("#FFFFFF")
        .setFontWeight("bold")
        .setHorizontalAlignment("center");

    sheet.setFrozenRows(1);
    sheet.setColumnWidth(33, 100);
    sheet.setColumnWidth(34, 130);
}

// ============================================================================
// CORE SCORING MODEL
// ============================================================================

/**
 * Returns: { score:number, status:string, qualified:boolean, reasons:string[] }
 */
function scoreArrestRecord(record) {
    let score = 0;
    const reasons = [];
    let disqualified = false;

    const bondAmount = parseMoney_(record.Bond_Amount);
    const bondType = normText_(record.Bond_Type);
    const custody = normText_(record.Status);
    const chargesText = normText_(
        (record.Charges || "") + " " + (record.Charge_1 || "") + " " + (record.Charge_2 || "")
    );
    const arrestDate = parseDate_(record.Arrest_Date) || parseDate_(record.Booking_Date);
    const courtDate = parseDate_(record.Court_Date);

    const inCustody =
        custody.includes("in custody") ||
        custody.includes("incustody") ||
        custody.includes("booked") ||
        custody.includes("jail") ||
        custody.includes("detained") ||
        custody.includes("held");

    const released =
        custody.includes("released") ||
        custody.includes("discharged") ||
        custody.includes("bonded") ||
        custody.includes("posted") ||
        custody.includes("release");

    const transferred = custody.includes("transferred");

    // -----------------------------
    // HARD RULE: Released = never qualified
    // (We still score it, but it can never route.)
    // -----------------------------
    if (RELEASED_NEVER_QUALIFIES && released) {
        reasons.push("Hard rule: Released never qualifies");
    }

    // --- Disqualifiers ---
    const DISQUALIFY_KEYWORDS = [
        "capital", "first degree murder", "murder", "homicide",
        "federal", "u.s. marshal", "us marshal", "dea",
        "ice hold", "immigration hold", "detainer"
    ];

    for (const kw of DISQUALIFY_KEYWORDS) {
        if (chargesText.includes(kw)) {
            disqualified = true;
            score -= 120;
            reasons.push(`Disqualifier: "${kw}" (-120)`);
            break;
        }
    }

    if (bondType.includes("no bond") || bondType.includes("hold") || bondType.includes("no-bond")) {
        disqualified = true;
        score -= 120;
        reasons.push(`No Bond/Hold indicated (-120)`);
    }

    // --- Bond amount scoring ---
    if (bondAmount <= 0) {
        score -= 80;
        reasons.push(`Bond $0/blank (-80)`);
    } else if (bondAmount < 500) {
        score -= 20;
        reasons.push(`Bond <$500 (-20)`);
    } else if (bondAmount < 2500) {
        score += 15;
        reasons.push(`Bond $500–$2,499 (+15)`);
    } else if (bondAmount < 10000) {
        score += 25;
        reasons.push(`Bond $2,500–$9,999 (+25)`);
    } else if (bondAmount <= 50000) {
        score += 35;
        reasons.push(`Bond $10k–$50k (+35)`);
    } else if (bondAmount <= 100000) {
        score += 25;
        reasons.push(`Bond $50k–$100k (+25)`);
    } else {
        score += 15;
        reasons.push(`Bond >$100k (+15)`);
    }

    // --- Bond type scoring ---
    if (bondType.includes("ror") || bondType.includes("r.o.r") || bondType.includes("own recognizance")) {
        score -= 60;
        reasons.push(`Bond Type ROR (-60)`);
    } else if (bondType.includes("see judge") || bondType.includes("to be set") || bondType.includes("tbd")) {
        score -= 35;
        reasons.push(`Bond Type TBD/See Judge (-35)`);
    } else if (bondType.includes("cash") && bondType.includes("only")) {
        score += 8;
        reasons.push(`Bond Type Cash Only (+8)`);
    } else if (bondType.includes("cash")) {
        score += 10;
        reasons.push(`Bond Type Cash (+10)`);
    } else if (bondType.includes("surety")) {
        score += 20;
        reasons.push(`Bond Type Surety (+20)`);
    } else if (bondType) {
        score += 5;
        reasons.push(`Bond Type present (+5)`);
    }

    // --- Custody scoring ---
    if (inCustody) {
        score += 20;
        reasons.push(`In custody (+20)`);
    } else if (released) {
        // still score it down hard (and never qualify anyway)
        score -= 60;
        reasons.push(`Released (-60)`);
    } else if (transferred) {
        score -= 20;
        reasons.push(`Transferred (-20)`);
    }

    // --- Recency ---
    if (arrestDate) {
        const hours = (new Date().getTime() - arrestDate.getTime()) / 36e5;
        if (hours <= 24) { score += 15; reasons.push(`Arrest <24h (+15)`); }
        else if (hours <= 48) { score += 10; reasons.push(`Arrest <48h (+10)`); }
        else if (hours <= 168) { score += 5; reasons.push(`Arrest <7d (+5)`); }
    }

    // --- Court date proximity ---
    if (!courtDate) {
        score -= 10;
        reasons.push(`Missing court date (-10)`);
    } else {
        const days = (courtDate.getTime() - new Date().getTime()) / 86400000;
        if (days >= 0 && days <= 7) { score += 10; reasons.push(`Court within 7 days (+10)`); }
        else if (days > 7 && days <= 30) { score += 5; reasons.push(`Court within 30 days (+5)`); }
    }

    // --- Data completeness ---
    const missing = [];
    const required = ["Booking_Number", "Full_Name", "Charges"];
    required.forEach(k => {
        if (!record[k] || record[k].toString().trim() === "") missing.push(k);
    });

    if (missing.length === 0) {
        score += 10;
        reasons.push(`Core fields present (+10)`);
    } else {
        score -= 20;
        reasons.push(`Missing core fields: ${missing.join(", ")} (-20)`);
    }

    // --- Charge keyword scoring (practical SWFL) ---
    const POSITIVE_CHARGES = [
        { kw: "dui", pts: 14 },
        { kw: "driving under the influence", pts: 14 },
        { kw: "domestic", pts: 12 },
        { kw: "battery", pts: 8 },
        { kw: "drug", pts: 10 },
        { kw: "possession", pts: 8 },
        { kw: "trafficking", pts: 12 },
        { kw: "theft", pts: 8 },
        { kw: "grand theft", pts: 10 },
        { kw: "burglary", pts: 10 },
        { kw: "robbery", pts: 10 },
        { kw: "violation of probation", pts: 14 },
        { kw: "vop", pts: 12 },
        { kw: "warrant", pts: 10 },
        { kw: "failure to appear", pts: 10 },
        { kw: "fta", pts: 8 }
    ];

    let chargeHits = 0;
    for (const item of POSITIVE_CHARGES) {
        if (chargesText.includes(item.kw)) {
            score += item.pts;
            chargeHits++;
            reasons.push(`Charge match "${item.kw}" (+${item.pts})`);
            if (chargeHits >= 4) break;
        }
    }

    score = clamp_(score, -200, 150);

    // Status
    let status;
    if (disqualified || score < 0) status = LEAD_STATUS.DISQUALIFIED;
    else if (score >= HOT_THRESHOLD) status = LEAD_STATUS.HOT;
    else if (score >= WARM_THRESHOLD) status = LEAD_STATUS.WARM;
    else status = LEAD_STATUS.COLD;

    const qualifiedByScore = (score >= PASS_THRESHOLD) && (status === LEAD_STATUS.HOT || status === LEAD_STATUS.WARM);
    const qualifiedByCustody = !REQUIRE_IN_CUSTODY_FOR_QUALIFIED || inCustody;
    const qualifiedByReleaseRule = !(RELEASED_NEVER_QUALIFIES && released);

    return {
        score,
        status,
        qualified: qualifiedByScore && qualifiedByCustody && qualifiedByReleaseRule,
        reasons
    };
}

// ============================================================================
// SCORING + ROUTING PIPELINE
// ============================================================================

function scoreAndRouteAllSheets() {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
        const results = { scored: 0, qualifiedRouted: 0, perCounty: [], errors: [] };

        const targetSS = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
        const qualifiedSheet = getOrCreateSheet_(targetSS, TARGET_QUALIFIED_TAB_NAME);
        ensureSheetSchema_(qualifiedSheet);

        const existingKeys = buildQualifiedKeySet_(qualifiedSheet);

        COUNTY_TABS.forEach(countyName => {
            try {
                const res = scoreAndRouteCounty_(countyName, qualifiedSheet, existingKeys);
                results.scored += res.scored;
                results.qualifiedRouted += res.routed;
                results.perCounty.push(`${countyName}: scored ${res.scored}, routed ${res.routed}`);
            } catch (e) {
                results.errors.push(`${countyName}: ${e.message}`);
            }
        });

        SpreadsheetApp.getUi().alert(
            "Score + Route Complete",
            `Scored: ${results.scored}\nRouted to Qualified: ${results.qualifiedRouted}\n\n${results.perCounty.join("\n")}\n\nErrors: ${results.errors.length}\n${results.errors.join("\n")}`,
            SpreadsheetApp.getUi().ButtonSet.OK
        );

        return results;
    } finally {
        lock.releaseLock();
    }
}

function routeQualifiedAllSheets() {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
        const results = { qualifiedRouted: 0, perCounty: [], errors: [] };

        const targetSS = SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
        const qualifiedSheet = getOrCreateSheet_(targetSS, TARGET_QUALIFIED_TAB_NAME);
        ensureSheetSchema_(qualifiedSheet);

        const existingKeys = buildQualifiedKeySet_(qualifiedSheet);

        COUNTY_TABS.forEach(countyName => {
            try {
                const res = routeQualifiedFromCounty_(countyName, qualifiedSheet, existingKeys);
                results.qualifiedRouted += res.routed;
                results.perCounty.push(`${countyName}: routed ${res.routed}`);
            } catch (e) {
                results.errors.push(`${countyName}: ${e.message}`);
            }
        });

        SpreadsheetApp.getUi().alert(
            "Route Qualified Complete",
            `Routed to Qualified: ${results.qualifiedRouted}\n\n${results.perCounty.join("\n")}\n\nErrors: ${results.errors.length}\n${results.errors.join("\n")}`,
            SpreadsheetApp.getUi().ButtonSet.OK
        );

        return results;
    } finally {
        lock.releaseLock();
    }
}

function scoreAllSheets() {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
        const results = { totalScored: 0, perCounty: [], errors: [] };

        COUNTY_TABS.forEach(countyName => {
            try {
                const count = scoreCountySheet_(countyName);
                results.totalScored += count;
                results.perCounty.push(`${countyName}: ${count}`);
            } catch (e) {
                results.errors.push(`${countyName}: ${e.message}`);
            }
        });

        SpreadsheetApp.getUi().alert(
            "Lead Scoring Complete",
            `Total records scored: ${results.totalScored}\n\n${results.perCounty.join("\n")}\n\nErrors: ${results.errors.length}\n${results.errors.join("\n")}`,
            SpreadsheetApp.getUi().ButtonSet.OK
        );

        return results;
    } finally {
        lock.releaseLock();
    }
}

// ============================================================================
// COUNTY IMPLEMENTATIONS
// ============================================================================

function scoreAndRouteCounty_(countyName, qualifiedSheet, existingKeys) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(countyName);
    if (!sheet) throw new Error(`Sheet not found: ${countyName}`);

    ensureSheetSchema_(sheet);

    const { headers, map } = getHeaderMap_(sheet);
    if (STRICT_SCHEMA_CHECK) validateHeaderExact_(headers);

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { scored: 0, routed: 0 };

    const range = sheet.getRange(2, 1, lastRow - 1, TOTAL_COLUMNS);
    const values = range.getValues();

    const leadScoreIdx = map["Lead_Score"];
    const leadStatusIdx = map["Lead_Status"];

    const scoredUpdates = new Array(values.length);
    const qualifiedRowsToAppend = [];

    let scored = 0;
    let routed = 0;

    for (let r = 0; r < values.length; r++) {
        const row = values[r];
        const record = rowToRecord_(headers, row);

        // Ensure county field exists
        if (!record.County || record.County.toString().trim() === "") {
            record.County = countyName;
            row[map["County"]] = countyName;
        }

        const result = scoreArrestRecord(record);

        row[leadScoreIdx] = result.score;
        row[leadStatusIdx] = result.status;
        scored++;

        // Route qualified
        if (result.qualified) {
            const key = makeQualifiedKey_(record);
            if (!existingKeys.has(key)) {
                existingKeys.add(key);
                qualifiedRowsToAppend.push(row.slice(0, TOTAL_COLUMNS));
                routed++;
            }
        }

        scoredUpdates[r] = row;
    }

    range.setValues(scoredUpdates);

    if (qualifiedRowsToAppend.length) {
        appendRows_(qualifiedSheet, qualifiedRowsToAppend);
    }

    return { scored, routed };
}

function scoreCountySheet_(countyName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(countyName);
    if (!sheet) throw new Error(`Sheet not found: ${countyName}`);

    ensureSheetSchema_(sheet);

    const { headers, map } = getHeaderMap_(sheet);
    if (STRICT_SCHEMA_CHECK) validateHeaderExact_(headers);

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return 0;

    const range = sheet.getRange(2, 1, lastRow - 1, TOTAL_COLUMNS);
    const values = range.getValues();

    const leadScoreIdx = map["Lead_Score"];
    const leadStatusIdx = map["Lead_Status"];

    for (let r = 0; r < values.length; r++) {
        const row = values[r];
        const record = rowToRecord_(headers, row);

        if (!record.County || record.County.toString().trim() === "") {
            record.County = countyName;
            row[map["County"]] = countyName;
        }

        const result = scoreArrestRecord(record);
        row[leadScoreIdx] = result.score;
        row[leadStatusIdx] = result.status;
    }

    range.setValues(values);
    return values.length;
}

function routeQualifiedFromCounty_(countyName, qualifiedSheet, existingKeys) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(countyName);
    if (!sheet) throw new Error(`Sheet not found: ${countyName}`);

    ensureSheetSchema_(sheet);

    const { headers, map } = getHeaderMap_(sheet);
    if (STRICT_SCHEMA_CHECK) validateHeaderExact_(headers);

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { routed: 0 };

    const values = sheet.getRange(2, 1, lastRow - 1, TOTAL_COLUMNS).getValues();

    const leadScoreIdx = map["Lead_Score"];
    const leadStatusIdx = map["Lead_Status"];
    const statusIdx = map["Status"];

    const toAppend = [];
    let routed = 0;

    for (const row of values) {
        const record = rowToRecord_(headers, row);

        if (!record.County || record.County.toString().trim() === "") {
            record.County = countyName;
            row[map["County"]] = countyName;
        }

        // HARD RULE: released never qualifies
        const custody = normText_(row[statusIdx] || "");
        const released =
            custody.includes("released") ||
            custody.includes("discharged") ||
            custody.includes("bonded") ||
            custody.includes("posted") ||
            custody.includes("release");

        if (RELEASED_NEVER_QUALIFIES && released) continue;

        const score = Number(row[leadScoreIdx]) || 0;
        const status = (row[leadStatusIdx] || "").toString();

        const isWarmHot = (status === LEAD_STATUS.WARM || status === LEAD_STATUS.HOT);
        const passes = score >= PASS_THRESHOLD && isWarmHot;

        if (passes) {
            const key = makeQualifiedKey_(record);
            if (!existingKeys.has(key)) {
                existingKeys.add(key);
                toAppend.push(row.slice(0, TOTAL_COLUMNS));
                routed++;
            }
        }
    }

    if (toAppend.length) appendRows_(qualifiedSheet, toAppend);
    return { routed };
}

// ============================================================================
// HELPERS
// ============================================================================

function getHeaderMap_(sheet) {
    const headers = sheet.getRange(1, 1, 1, TOTAL_COLUMNS).getValues()[0];
    const map = {};
    headers.forEach((h, i) => { map[h] = i; });

    if (STRICT_SCHEMA_CHECK) {
        const missing = [];
        HEADERS.forEach(h => { if (map[h] === undefined) missing.push(h); });
        if (missing.length) throw new Error(`Schema mismatch. Missing headers: ${missing.join(", ")}`);
    }

    return { headers, map };
}

function validateHeaderExact_(headers) {
    for (let i = 0; i < HEADERS.length; i++) {
        if (headers[i] !== HEADERS[i]) {
            throw new Error(`Header mismatch at col ${i + 1}: expected "${HEADERS[i]}", got "${headers[i]}"`);
        }
    }
}

function rowToRecord_(headers, row) {
    const o = {};
    for (let i = 0; i < HEADERS.length; i++) {
        const key = headers[i] || HEADERS[i];
        o[key] = row[i];
    }
    return o;
}

function parseMoney_(v) {
    if (v === null || v === undefined) return 0;
    const s = v.toString().replace(/[$,]/g, "").trim();
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

function normText_(v) {
    return (v === null || v === undefined) ? "" : v.toString().toLowerCase().trim();
}

function parseDate_(v) {
    if (!v) return null;
    if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime())) return v;
    const s = v.toString().trim();
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

function clamp_(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function getOrCreateSheet_(ss, name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    return sh;
}

function appendRows_(sheet, rows) {
    if (!rows || !rows.length) return;
    const start = sheet.getLastRow() + 1;
    sheet.getRange(start, 1, rows.length, TOTAL_COLUMNS).setValues(rows);
}

function makeQualifiedKey_(record) {
    const booking = (record.Booking_Number || "").toString().trim();
    const county = (record.County || "").toString().trim();
    return `${booking}||${county}`.toLowerCase();
}

function buildQualifiedKeySet_(qualifiedSheet) {
    const lastRow = qualifiedSheet.getLastRow();
    const keys = new Set();
    if (lastRow <= 1) return keys;

    const numRows = lastRow - 1;
    const bookingVals = qualifiedSheet.getRange(2, 1, numRows, 1).getValues();
    const countyVals = qualifiedSheet.getRange(2, 30, numRows, 1).getValues();

    for (let i = 0; i < numRows; i++) {
        const booking = (bookingVals[i][0] || "").toString().trim();
        const county = (countyVals[i][0] || "").toString().trim();
        if (booking) keys.add(`${booking}||${county}`.toLowerCase());
    }
    return keys;
}
