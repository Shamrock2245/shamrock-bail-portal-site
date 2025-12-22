/**
 * Google Apps Script - Geolocation Logging Extension
 * Add this to your centralized GAS backend (Code.gs)
 */

/**
 * Log defendant location to a dedicated Google Sheet
 * @param {Object} data - { memberEmail, latitude, longitude, address, intersection, timestamp, userAgent }
 */
function logDefendantLocation(data) {
  try {
    const SPREADSHEET_ID = '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E'; // Master Sheet ID
    const SHEET_NAME = 'Defendant Locations';
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'Timestamp', 
        'Member Email', 
        'Latitude', 
        'Longitude', 
        'Formatted Address', 
        'Closest Intersection', 
        'User Agent'
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f3f3f3');
      sheet.setFrozenRows(1);
    }
    
    // Append data
    sheet.appendRow([
      data.timestamp || new Date(),
      data.memberEmail,
      data.latitude,
      data.longitude,
      data.address,
      data.intersection,
      data.userAgent
    ]);
    
    return { success: true };
  } catch (error) {
    console.error('logDefendantLocation error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * UPDATE: Modify your doPost(e) handler to include the logDefendantLocation action
 * 
 * Example:
 * 
 * function doPost(e) {
 *   const request = JSON.parse(e.postData.contents);
 *   const { action, data } = request;
 *   
 *   let result;
 *   switch(action) {
 *     case 'logDefendantLocation':
 *       result = logDefendantLocation(data);
 *       break;
 *     // ... other actions
 *   }
 *   
 *   return ContentService.createTextOutput(JSON.stringify(result))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 */
