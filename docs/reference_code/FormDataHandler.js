/**
 * ============================================================================
 * FormDataHandler.gs (Hardened + Workflow-Congruent)
 * ============================================================================
 *
 * HELPER FUNCTIONS ONLY - No doGet() here!
 * All web app entry points are in Code.gs
 *
 * Uses unique constant names prefixed with FDH_ to avoid conflicts with Code.gs
 * ============================================================================
 */

// Use unique prefixed names to avoid conflicts with Code.gs
const FDH_SHEET_NAME = "Manual_Bookings";
const FDH_SPREADSHEET_ID = ""; // Leave blank to use active spreadsheet

const FDH_CANONICAL_FIELDS = [
    "Timestamp", "Booking_Number", "Full_Name", "First_Name", "Middle_Name", "Last_Name",
    "DOB", "Sex", "Race", "Booking_Date", "Booking_Time", "Arrest_Date", "Arrest_Time",
    "County", "Agency", "Address", "City", "State", "Zipcode", "Charges",
    "Charge_1", "Charge_1_Statute", "Charge_1_Bond", "Charge_2", "Charge_2_Statute", "Charge_2_Bond",
    "Bond_Amount", "Bond_Type", "Status", "Court_Date", "Case_Number", "Court_Location",
    "Mugshot_URL", "Detail_URL", "Phone", "Email", "Notes", "Lead_Score", "Lead_Status", "extra_fields_json"
];

// Mapping aliases for robust data ingestion
const FDH_HEADER_ALIASES = {
    Timestamp: ["Timestamp", "timestamp", "Created", "Created_At"],
    Booking_Number: ["Booking_Number", "Booking Number", "bookingNumber", "Booking #", "Booking"],
    Full_Name: ["Full_Name", "Full Name", "defendant-full-name", "Defendant Full Name"],
    First_Name: ["First_Name", "First Name"],
    Middle_Name: ["Middle_Name", "Middle Name"],
    Last_Name: ["Last_Name", "Last Name"],
    DOB: ["DOB", "Date of Birth", "Birthdate"],
    Sex: ["Sex", "Gender"],
    Race: ["Race"],
    Booking_Date: ["Booking_Date", "Booking Date"],
    Booking_Time: ["Booking_Time", "Booking Time"],
    Arrest_Date: ["Arrest_Date", "Arrest Date"],
    Arrest_Time: ["Arrest_Time", "Arrest Time"],
    County: ["County"],
    Agency: ["Agency"],
    Address: ["Address", "Street Address", "defendant-address", "defendant-street-address"],
    City: ["City"],
    State: ["State"],
    Zipcode: ["Zipcode", "ZIP", "Zip", "ZIP Code"],
    Charges: ["Charges", "Charge Summary", "charges"],
    Charge_1: ["Charge_1", "Charge 1"],
    Charge_1_Statute: ["Charge_1_Statute", "Charge 1 Statute"],
    Charge_1_Bond: ["Charge_1_Bond", "Charge 1 Bond"],
    Charge_2: ["Charge_2", "Charge 2"],
    Charge_2_Statute: ["Charge_2_Statute", "Charge 2 Statute"],
    Charge_2_Bond: ["Charge_2_Bond", "Charge 2 Bond"],
    Bond_Amount: ["Bond_Amount", "Bond Amount", "Total Bond"],
    Bond_Type: ["Bond_Type", "Bond Type"],
    Status: ["Status"],
    Court_Date: ["Court_Date", "Court Date"],
    Case_Number: ["Case_Number", "Case Number"],
    Court_Location: ["Court_Location", "Court Location"],
    Mugshot_URL: ["Mugshot_URL", "Mugshot URL"],
    Detail_URL: ["Detail_URL", "Detail URL"],
    Phone: ["Phone", "Phone Number"],
    Email: ["Email", "Email Address"],
    Notes: ["Notes"],
    Lead_Score: ["Lead_Score", "Lead Score"],
    Lead_Status: ["Lead_Status", "Lead Status"],
    extra_fields_json: ["extra_fields_json", "Extra Fields", "extra_fields"]
};

// ============================================================================
// PUBLIC API (called from Code.gs)
// ============================================================================

function saveBookingData(payload) {
    const lock = LockService.getDocumentLock();
    try {
        lock.waitLock(30000);
        if (!payload || typeof payload !== "object") throw new Error("Invalid payload");

        const ss = FDH_getSpreadsheet_();
        const sheet = FDH_ensureSheet_(ss);
        const normalized = FDH_normalizeIncoming_(payload);

        // Hardened: Auto-score if missing (uses LeadScoringSystem.gs if available)
        if (typeof scoreArrestRecord === 'function' && (normalized.Lead_Score === "" || normalized.Lead_Score === undefined)) {
            try {
                const scoreResult = scoreArrestRecord(normalized);
                normalized.Lead_Score = scoreResult.score;
                normalized.Lead_Status = scoreResult.status;
            } catch (e) {
                Logger.log("[saveBookingData] Scoring warning: " + e.message);
            }
        }

        if (!normalized.Booking_Number && !normalized.Full_Name && !normalized.Phone) {
            throw new Error("Submission looks empty");
        }

        const headerRow = FDH_getHeaderRow_(sheet);
        const headerIndex = FDH_buildHeaderIndex_(headerRow);
        const ts = new Date();
        normalized.Timestamp = ts;

        const bookingNumber = (normalized.Booking_Number || "").toString().trim();
        let rowNumber = bookingNumber ? FDH_findRowByBooking_(sheet, headerIndex, bookingNumber) : null;
        if (!rowNumber) rowNumber = sheet.getLastRow() + 1;

        FDH_writeRecord_(sheet, headerIndex, rowNumber, normalized);

        return { success: true, message: "Saved (row " + rowNumber + ")", bookingNumber: bookingNumber || "N/A", row: rowNumber, timestamp: ts.toISOString() };
    } catch (err) {
        Logger.log("[saveBookingData] Error: " + err);
        return { success: false, message: "Failed: " + err.message, error: String(err) };
    } finally {
        try { lock.releaseLock(); } catch (e) { }
    }
}

function getBookingByNumber(bookingNumber) {
    try {
        if (!bookingNumber) return null;
        const ss = FDH_getSpreadsheet_();
        const sheet = ss.getSheetByName(FDH_SHEET_NAME);
        if (!sheet) return null;

        const headers = FDH_getHeaderRow_(sheet);
        const headerIndex = FDH_buildHeaderIndex_(headers);
        const rowNumber = FDH_findRowByBooking_(sheet, headerIndex, bookingNumber);
        if (!rowNumber) return null;

        const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
        const obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
    } catch (err) {
        Logger.log("[getBookingByNumber] Error: " + err);
        return null;
    }
}

function deleteBooking(bookingNumber) {
    const lock = LockService.getDocumentLock();
    try {
        lock.waitLock(30000);
        if (!bookingNumber) return false;

        const ss = FDH_getSpreadsheet_();
        const sheet = ss.getSheetByName(FDH_SHEET_NAME);
        if (!sheet) return false;

        const headers = FDH_getHeaderRow_(sheet);
        const headerIndex = FDH_buildHeaderIndex_(headers);
        const rowNumber = FDH_findRowByBooking_(sheet, headerIndex, bookingNumber);
        if (!rowNumber) return false;

        sheet.deleteRow(rowNumber);
        return true;
    } catch (err) {
        Logger.log("[deleteBooking] Error: " + err);
        return false;
    } finally {
        try { lock.releaseLock(); } catch (e) { }
    }
}

// ============================================================================
// NORMALIZATION
// ============================================================================

function FDH_normalizeIncoming_(payload) {
    const flat = FDH_flattenPayload_(payload);
    const getAny = (...keys) => { for (const k of keys) { const v = FDH_getFlat_(flat, k); if (v !== "") return v; } return ""; };

    const fullName = getAny("defendant.fullName", "defendantFullName", "defendant-full-name", "Full_Name", "fullName");
    const streetAddress = getAny("defendant.streetAddress", "defendantStreetAddress", "defendant-street-address", "Address", "address");
    const bookingNumber = getAny("defendant.arrestNumber", "defendantArrestNumber", "defendant-arrest-number", "Booking_Number", "bookingNumber");
    const chargesArray = FDH_extractCharges_(payload, flat);
    const chargeSummary = FDH_buildChargeSummary_(chargesArray) || getAny("Charges", "charges");
    const bondAmount = FDH_normalizeMoney_(getAny("Bond_Amount", "bondAmount", "totalBond")) || FDH_sumChargeBonds_(chargesArray);
    const phone = FDH_cleanPhone_(getAny("defendant.phone", "defendantPhone", "defendant-phone", "Phone", "phone"));
    const email = getAny("defendant.email", "defendantEmail", "defendant-email", "Email", "email");
    const parsedName = FDH_parseName_(fullName);
    const dob = FDH_normalizeDate_(getAny("defendant.dob", "defendantDOB", "defendant-dob", "DOB"));

    const record = {
        Timestamp: "",
        Booking_Number: bookingNumber,
        Full_Name: parsedName.full || fullName,
        First_Name: parsedName.first,
        Middle_Name: parsedName.middle,
        Last_Name: parsedName.last,
        DOB: dob,
        Sex: getAny("defendant.sex", "Sex"),
        Race: getAny("defendant.race", "Race"),
        Booking_Date: FDH_normalizeDate_(getAny("Booking_Date", "bookingDate")),
        Booking_Time: FDH_normalizeTime_(getAny("Booking_Time", "bookingTime")),
        Arrest_Date: FDH_normalizeDate_(getAny("Arrest_Date", "arrestDate")),
        Arrest_Time: FDH_normalizeTime_(getAny("Arrest_Time", "arrestTime")),
        County: getAny("County", "county", "defendant.county"),
        Agency: getAny("Agency", "agency"),
        Address: streetAddress,
        City: getAny("defendant.city", "City"),
        State: (getAny("defendant.state", "State") || "FL").toUpperCase(),
        Zipcode: getAny("defendant.zip", "Zipcode", "zip"),
        Charges: chargeSummary,
        Charge_1: (chargesArray[0] && chargesArray[0].description) || getAny("Charge_1"),
        Charge_1_Statute: (chargesArray[0] && chargesArray[0].statute) || "",
        Charge_1_Bond: FDH_normalizeMoney_((chargesArray[0] && chargesArray[0].bondAmount) || getAny("Charge_1_Bond")),
        Charge_2: (chargesArray[1] && chargesArray[1].description) || getAny("Charge_2"),
        Charge_2_Statute: (chargesArray[1] && chargesArray[1].statute) || "",
        Charge_2_Bond: FDH_normalizeMoney_((chargesArray[1] && chargesArray[1].bondAmount) || getAny("Charge_2_Bond")),
        Bond_Amount: FDH_normalizeMoney_(bondAmount),
        Bond_Type: getAny("Bond_Type", "bondType"),
        Status: getAny("Status", "status"),
        Court_Date: FDH_normalizeDate_(getAny("Court_Date", "courtDate")),
        Case_Number: (chargesArray[0] && chargesArray[0].caseNumber) || getAny("Case_Number", "caseNumber"),
        Court_Location: getAny("Court_Location", "courtLocation"),
        Mugshot_URL: getAny("Mugshot_URL", "mugshotUrl"),
        Detail_URL: getAny("Detail_URL", "detailUrl"),
        Phone: phone,
        Email: email,
        Notes: getAny("Notes", "notes"),
        Lead_Score: getAny("Lead_Score", "leadScore"),
        Lead_Status: getAny("Lead_Status", "leadStatus"),
        extra_fields_json: ""
    };

    const extra = FDH_buildExtraFields_(payload, flat, record, chargesArray);
    record.extra_fields_json = JSON.stringify(extra);
    return record;
}

function FDH_flattenPayload_(payload) {
    const out = {};
    const walk = (obj, prefix) => {
        if (!obj || typeof obj !== "object") return;
        Object.keys(obj).forEach(key => {
            const val = obj[key];
            const path = prefix ? prefix + "." + key : key;
            if (val === null || val === undefined) { out[path] = ""; return; }
            if (Array.isArray(val)) { out[path] = JSON.stringify(val); return; }
            if (typeof val === "object") { walk(val, path); return; }
            out[path] = String(val).trim();
            if (!prefix && out[key] === undefined) out[key] = out[path];
        });
    };
    walk(payload, "");
    return out;
}

function FDH_getFlat_(flat, key) {
    if (!flat) return "";
    if (flat[key] !== undefined) return String(flat[key] || "").trim();
    const alt1 = key.replace(/-/g, "_");
    if (flat[alt1] !== undefined) return String(flat[alt1] || "").trim();
    const alt2 = key.replace(/_/g, "-");
    if (flat[alt2] !== undefined) return String(flat[alt2] || "").trim();
    return "";
}

function FDH_extractCharges_(payload, flat) {
    if (payload && Array.isArray(payload.charges)) return payload.charges;
    const raw = FDH_getFlat_(flat, "charges");
    if (raw) { try { const arr = JSON.parse(raw); if (Array.isArray(arr)) return arr; } catch (e) { } }

    const charge1 = { description: FDH_getFlat_(flat, "charge-1-desc") || FDH_getFlat_(flat, "Charge_1"), statute: FDH_getFlat_(flat, "Charge_1_Statute"), bondAmount: FDH_getFlat_(flat, "Charge_1_Bond"), caseNumber: FDH_getFlat_(flat, "Case_Number") };
    const charge2 = { description: FDH_getFlat_(flat, "charge-2-desc") || FDH_getFlat_(flat, "Charge_2"), statute: FDH_getFlat_(flat, "Charge_2_Statute"), bondAmount: FDH_getFlat_(flat, "Charge_2_Bond") };
    const arr = [];
    if (charge1.description || charge1.bondAmount) arr.push(charge1);
    if (charge2.description || charge2.bondAmount) arr.push(charge2);
    return arr;
}

function FDH_buildChargeSummary_(chargesArray) {
    if (!Array.isArray(chargesArray) || chargesArray.length === 0) return "";
    return chargesArray.map((c, idx) => {
        const bits = [];
        if (c.description) bits.push(c.description);
        if (c.statute) bits.push("§" + c.statute);
        if (c.bondAmount) bits.push("$" + FDH_normalizeMoney_(c.bondAmount));
        return bits.length ? "#" + (idx + 1) + " " + bits.join(" | ") : "";
    }).filter(Boolean).join(" ; ");
}

function FDH_sumChargeBonds_(chargesArray) {
    if (!Array.isArray(chargesArray)) return "";
    const total = chargesArray.reduce((sum, c) => sum + (parseFloat(String(c.bondAmount || "").replace(/[^0-9.]/g, "")) || 0), 0);
    return total ? total.toFixed(2) : "";
}

function FDH_buildExtraFields_(payload, flat, record, chargesArray) {
    const extra = {};
    if (payload && payload.indemnitors) extra.indemnitors = payload.indemnitors;
    if (payload && payload.documents) extra.documents = payload.documents;
    if (payload && payload.signingMethod) extra.signingMethod = payload.signingMethod;
    if (Array.isArray(chargesArray) && chargesArray.length) extra.charges = chargesArray;

    const ssn = FDH_getFlat_(flat, "defendant-ssn");
    const dl = FDH_getFlat_(flat, "defendant-dl");
    if (ssn) extra.defendant_ssn = ssn;
    if (dl) extra.defendant_dl = dl;

    extra._meta = { receivedAt: new Date().toISOString(), handlerVersion: "FormDataHandler.gs v4.0" };
    return extra;
}

// ============================================================================
// SHEET IO
// ============================================================================

function FDH_getSpreadsheet_() {
    if (FDH_SPREADSHEET_ID) return SpreadsheetApp.openById(FDH_SPREADSHEET_ID);
    return SpreadsheetApp.getActiveSpreadsheet();
}

function FDH_ensureSheet_(ss) {
    let sheet = ss.getSheetByName(FDH_SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(FDH_SHEET_NAME);
        sheet.getRange(1, 1, 1, FDH_CANONICAL_FIELDS.length).setValues([FDH_CANONICAL_FIELDS]);
        sheet.getRange(1, 1, 1, FDH_CANONICAL_FIELDS.length).setBackground("#111111").setFontColor("#FFFFFF").setFontWeight("bold");
        sheet.setFrozenRows(1);
    }
    return sheet;
}

function FDH_getHeaderRow_(sheet) {
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim());
}

function FDH_buildHeaderIndex_(headers) {
    const headerToIndex = {};
    headers.forEach((h, i) => { if (h) headerToIndex[h] = i + 1; });

    const canonicalToCol = {};
    Object.keys(FDH_HEADER_ALIASES).forEach(canonical => {
        const variants = FDH_HEADER_ALIASES[canonical] || [canonical];
        for (const v of variants) { if (headerToIndex[v]) { canonicalToCol[canonical] = headerToIndex[v]; break; } }
    });
    FDH_CANONICAL_FIELDS.forEach(c => { if (!canonicalToCol[c] && headerToIndex[c]) canonicalToCol[c] = headerToIndex[c]; });

    return { headers, headerToIndex, canonicalToCol };
}

function FDH_findRowByBooking_(sheet, headerIndex, bookingNumber) {
    const col = headerIndex.canonicalToCol["Booking_Number"] || headerIndex.headerToIndex["Booking_Number"] || headerIndex.headerToIndex["Booking Number"];
    if (!col) return null;
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;
    const values = sheet.getRange(2, col, lastRow - 1, 1).getValues();
    const target = String(bookingNumber).trim();
    for (let i = 0; i < values.length; i++) { if (String(values[i][0] || "").trim() === target) return i + 2; }
    return null;
}

function FDH_writeRecord_(sheet, headerIndex, rowNumber, record) {
    const updates = [];
    Object.keys(record).forEach(canonical => {
        const col = headerIndex.canonicalToCol[canonical];
        if (col) updates.push({ col, value: record[canonical] });
    });

    const lastCol = sheet.getLastColumn();
    const row = sheet.getRange(rowNumber, 1, 1, lastCol).getValues()[0];
    updates.forEach(u => { row[u.col - 1] = u.value; });
    sheet.getRange(rowNumber, 1, 1, lastCol).setValues([row]);
}

// ============================================================================
// SANITIZERS
// ============================================================================

function FDH_normalizeMoney_(money) {
    if (!money) return "";
    const s = String(money).trim().toLowerCase();
    if (s.includes("no bond")) return "NO BOND";
    if (s.includes("hold")) return "HOLD";
    const cleaned = s.replace(/[$,]/g, "").replace(/[^\d.]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? "" : n.toFixed(2);
}

function FDH_normalizeDate_(d) {
    if (!d) return "";
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return Utilities.formatDate(parsed, Session.getScriptTimeZone(), "yyyy-MM-dd");
    return String(d).trim();
}

function FDH_normalizeTime_(t) {
    if (!t) return "";
    const s = String(t).trim();
    if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5);
    return s;
}

function FDH_cleanPhone_(s) {
    const d = String(s || "").replace(/[^\d]/g, "");
    if (d.length === 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
    return String(s || "").trim();
}

function FDH_parseName_(fullName) {
    const s = String(fullName || "").trim();
    if (!s) return { full: "", first: "", middle: "", last: "" };
    if (s.includes(",")) {
        const parts = s.split(",");
        const last = FDH_title_(parts[0]);
        const rest = FDH_title_(parts[1] || "");
        const bits = rest.split(/\s+/).filter(Boolean);
        return { full: (bits.join(" ") + " " + last).trim(), first: bits[0] || "", middle: bits.slice(1).join(" "), last };
    }
    const bits = s.split(/\s+/).filter(Boolean);
    if (bits.length === 1) return { full: FDH_title_(s), first: FDH_title_(bits[0]), middle: "", last: "" };
    if (bits.length === 2) return { full: FDH_title_(s), first: FDH_title_(bits[0]), middle: "", last: FDH_title_(bits[1]) };
    return { full: bits.map(FDH_title_).join(" "), first: FDH_title_(bits[0]), middle: bits.slice(1, -1).map(FDH_title_).join(" "), last: FDH_title_(bits[bits.length - 1]) };
}

function FDH_title_(s) {
    return String(s || "").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim();
}