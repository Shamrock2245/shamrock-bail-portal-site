/**
 * ============================================
 * BailSchool_Progress.js
 * ============================================
 * Handles incoming webhooks from the Next.js Bail School frontend.
 * Upserts student progress into the designated Google Sheet.
 */

function handleBailSchoolProgress(data) {
  try {
    const sheetId = getConfig('BAIL_SCHOOL.SHEET_ID');
    const tabName = getConfig('BAIL_SCHOOL.TAB_NAME') || 'Student_Progress_Log';

    if (!sheetId || sheetId === 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
      return { success: false, error: 'Bail School Sheet ID not configured in CONFIG.js' };
    }

    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName(tabName);

    // Auto-create tab if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      sheet.appendRow(['StudentID', 'ModuleID', 'TimeSpentSeconds', 'QuizPassed', 'Acknowledged', 'LastUpdated']);
      sheet.setFrozenRows(1);
    }

    const studentId = data.studentId || 'anonymous';
    const moduleId = data.moduleId;
    const timeSpent = data.timeSpent || 0;
    const quizPassed = data.quizPassed || false;
    const acknowledged = data.acknowledged || false;
    const timestamp = new Date();

    if (!moduleId) {
      return { success: false, error: 'ModuleID is required' };
    }

    // Attempt to UPSERT based on StudentID + ModuleID
    const lastRow = sheet.getLastRow();
    let rowUpdated = false;

    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 2).getValues(); // [StudentID, ModuleID]
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] == studentId && ids[i][1] == moduleId) {
          // Found existing row for this student + module. Update it.
          const rowNum = i + 2;
          
          // Get existing time and add if it's an incremental update, or just overwrite if frontend sends total
          // Assuming frontend sends the total session time we should ADD to the existing time in DB, 
          // or frontend sends cumulative total time. Let's assume frontend sends cumulative total time for that module.
          
          sheet.getRange(rowNum, 3).setValue(timeSpent);
          
          // Only update quiz/ack if they are true
          if (quizPassed) sheet.getRange(rowNum, 4).setValue(true);
          if (acknowledged) sheet.getRange(rowNum, 5).setValue(true);
          
          sheet.getRange(rowNum, 6).setValue(timestamp);
          
          rowUpdated = true;
          break;
        }
      }
    }

    if (!rowUpdated) {
      // Append new row
      sheet.appendRow([studentId, moduleId, timeSpent, quizPassed, acknowledged, timestamp]);
    }

    return { success: true, message: 'Progress logged successfully' };

  } catch (error) {
    console.error('Error logging Bail School progress:', error);
    return { success: false, error: error.message };
  }
}
