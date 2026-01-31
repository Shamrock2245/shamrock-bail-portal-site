/**
 * StatsService.gs
 * Calculates live dashboard statistics from County Sheets
 */

function getCountyStats(countyName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(countyName);

    if (!sheet) {
        return {
            exists: false,
            total: 0,
            today: 0,
            male: 0,
            female: 0,
            avgBond: "$0",
            topCrimes: []
        };
    }

    // 1. Get Data
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { exists: true, total: 0, today: 0 };

    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());

    // 2. Map Columns
    const col = {
        date: headers.indexOf('Booking_Date'),
        sex: headers.indexOf('Sex'),
        bond: headers.indexOf('Bond_Amount'),
        charges: headers.indexOf('Charges')
    };

    // 3. Aggregate
    let todayCount = 0;
    let male = 0;
    let female = 0;
    let totalBond = 0;
    let bondCount = 0;
    const crimes = {};

    // Simple "Today" check (Local Time)
    const todayStr = new Date().toLocaleDateString();

    data.forEach(row => {
        // A. Demographics
        const sex = String(row[col.sex] || "").toUpperCase();
        if (sex.startsWith("M")) male++;
        if (sex.startsWith("F")) female++;

        // B. Date Check
        let rowDateStr = "";
        if (row[col.date] instanceof Date) {
            rowDateStr = row[col.date].toLocaleDateString();
        } else if (typeof row[col.date] === 'string') {
            // Attempt parsing if string
            rowDateStr = new Date(row[col.date]).toLocaleDateString();
        }

        if (rowDateStr === todayStr) {
            todayCount++;
        }

        // C. Bond Avg
        const bPrice = parseBondMoney(row[col.bond]);
        if (bPrice > 0) {
            totalBond += bPrice;
            bondCount++;
        }

        // D. Crimes (Simple frequency)
        const ch = String(row[col.charges] || "");
        if (ch) {
            // Very basic cleaner - take first 20 chars to normalize generic charges
            // or split by delimiter if multi-charge
            const primary = ch.split(/[;,\n]/)[0].trim().toUpperCase();
            if (primary) {
                crimes[primary] = (crimes[primary] || 0) + 1;
            }
        }
    });

    // 4. Format Output
    const avg = bondCount > 0 ? Math.round(totalBond / bondCount) : 0;

    // Sort crimes
    const sortedCrimes = Object.keys(crimes)
        .map(key => ({ name: key, count: crimes[key] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Top 3

    return {
        exists: true,
        total: data.length, // Total records in sheet
        today: todayCount,
        male: male,
        female: female,
        avgBond: "$" + avg.toLocaleString(),
        topCrimes: sortedCrimes
    };
}

// Helper
function parseBondMoney(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return parseFloat(String(val).replace(/[$,]/g, '')) || 0;
}
