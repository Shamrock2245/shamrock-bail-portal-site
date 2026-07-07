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
      sheet.appendRow([
        'Timestamp', 
        'Student ID', 
        'Course/Module ID', 
        'Time Spent (Seconds)', 
        'Quiz Score', 
        'Quiz Passed', 
        'Acknowledged',
        'Compliance Status'
      ]);
      sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#1A3D2B").setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
    }

    const timestamp = new Date();
    const studentId = data.studentId || 'anonymous';
    const moduleId = data.moduleId;
    const timeSpent = data.timeSpent || data.timeSpentSeconds || 0;
    const quizScore = data.quizScore !== undefined ? data.quizScore : "N/A";
    const quizPassed = data.quizPassed || false;
    const acknowledged = data.acknowledged || false;

    if (!moduleId) {
      return { success: false, error: 'ModuleID is required' };
    }

    // Determine compliance status based on FLDFS rules
    let complianceStatus = "Pending";
    if (acknowledged && quizPassed) {
      complianceStatus = "Compliant";
    } else if (quizScore !== "N/A" && !quizPassed) {
      complianceStatus = "Failed - Retake Required";
    }

    // Attempt to UPSERT based on StudentID + ModuleID
    const lastRow = sheet.getLastRow();
    let rowUpdated = false;

    if (lastRow > 1) {
      // Column B is Student ID (2), Column C is Module ID (3)
      const ids = sheet.getRange(2, 2, lastRow - 1, 2).getValues(); 
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] == studentId && ids[i][1] == moduleId) {
          // Found existing row for this student + module. Update it.
          const rowNum = i + 2;
          
          sheet.getRange(rowNum, 1).setValue(timestamp);
          sheet.getRange(rowNum, 4).setValue(timeSpent);
          
          if (quizScore !== "N/A") sheet.getRange(rowNum, 5).setValue(quizScore);
          if (quizPassed) sheet.getRange(rowNum, 6).setValue(true);
          if (acknowledged) sheet.getRange(rowNum, 7).setValue(true);
          
          // Re-evaluate compliance
          const updatedAck = sheet.getRange(rowNum, 7).getValue();
          const updatedQuiz = sheet.getRange(rowNum, 6).getValue();
          const updatedScore = sheet.getRange(rowNum, 5).getValue();
          
          let newStatus = "Pending";
          if (updatedAck && updatedQuiz) {
            newStatus = "Compliant";
          } else if (updatedScore !== "N/A" && !updatedQuiz) {
            newStatus = "Failed - Retake Required";
          }
          
          sheet.getRange(rowNum, 8).setValue(newStatus);
          
          rowUpdated = true;
          break;
        }
      }
    }

    if (!rowUpdated) {
      // Append new row
      sheet.appendRow([timestamp, studentId, moduleId, timeSpent, quizScore, quizPassed, acknowledged, complianceStatus]);
    }

    return { success: true, message: 'Progress logged successfully' };

  } catch (error) {
    console.error('Error logging Bail School progress:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Daily Trigger: Generate Compliance Report
 * Set this up on a daily time-driven trigger in the GAS console.
 */
function generateDailyComplianceReport() {
  const sheetId = getConfig('BAIL_SCHOOL.SHEET_ID');
  if (!sheetId || sheetId === 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') return;

  const ss = SpreadsheetApp.openById(sheetId);
  const logSheet = ss.getSheetByName(getConfig('BAIL_SCHOOL.TAB_NAME') || 'Student_Progress_Log');
  
  if (!logSheet) return; // No logs yet

  const DAILY_REPORT_SHEET = "Daily_Compliance_Reports";
  let reportSheet = ss.getSheetByName(DAILY_REPORT_SHEET);
  if (!reportSheet) {
    reportSheet = ss.insertSheet(DAILY_REPORT_SHEET);
    reportSheet.appendRow(["Report Date", "Total Modules Completed Today", "Total Failed Quizzes Today", "Total Study Hours Logged"]);
    reportSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#F9A826").setFontColor("#1A3D2B");
  }

  const data = logSheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0,0,0,0);
  
  let completedToday = 0;
  let failedToday = 0;
  let totalSecondsToday = 0;

  // Start from row 1 to skip headers
  for (let i = 1; i < data.length; i++) {
    const rowDate = new Date(data[i][0]);
    rowDate.setHours(0,0,0,0);
    
    if (rowDate.getTime() === today.getTime()) {
      if (data[i][5] === true) completedToday++; // Quiz Passed
      if (data[i][4] !== "N/A" && data[i][5] === false) failedToday++; // Quiz Failed
      totalSecondsToday += Number(data[i][3]) || 0; // Time spent
    }
  }

  const totalHours = (totalSecondsToday / 3600).toFixed(2);

  reportSheet.appendRow([
    new Date(),
    completedToday,
    failedToday,
    totalHours
  ]);
}
