/**
 * Test_InitIntakeQueue.js
 * Run this function manually once to add headers to the Telegram_IntakeQueue sheet if it is empty.
 */
function INIT_TELEGRAM_INTAKE_QUEUE_HEADERS() {
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('TARGET_SPREADSHEET_ID'));
    if (!ss) {
        console.error("Could not find Spreadsheet. Make sure TARGET_SPREADSHEET_ID is set in Script Properties.");
        return;
    }

    const sheetName = 'Telegram_IntakeQueue';
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        console.log(`Sheet '${sheetName}' not found. Creating it now...`);
        sheet = ss.insertSheet(sheetName);
    }

    const lastRow = sheet.getLastRow();

    if (lastRow === 0) {
        // Sheet is empty, add headers
        const headers = [
            'Timestamp',
            'IntakeID',
            'Role',
            'Email',
            'Phone',
            'FullName',
            'DefendantName',
            'DefendantPhone',
            'CaseNumber',
            'Status',
            'References',
            'EmployerInfo',
            'ResidenceType',
            'ProcessedAt',
            'Language',
            'BookingNumber',
            'County',
            'Charges',
            'BailAmount',
            'AI_Risk',
            'AI_Rationale',
            'AI_Score'
        ];
        sheet.appendRow(headers);
        sheet.setFrozenRows(1);
        console.log(`Headers added to '${sheetName}'.`);
    } else {
        console.log(`Sheet '${sheetName}' already has data (Last Row: ${lastRow}). No headers added.`);
    }
}
