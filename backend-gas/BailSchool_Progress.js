/**
 * ============================================
 * BailSchool_Progress.js
 * ============================================
 * Handles incoming webhooks from the Next.js Bail School frontend.
 * Upserts student progress into the designated Google Sheet.
 */

function handleBailSchoolProgress(data) {
  try {
    var tabName = 'Student_Progress_Log';
    try {
      if (typeof CONFIG !== 'undefined' && CONFIG.BAIL_SCHOOL && CONFIG.BAIL_SCHOOL.TAB_NAME) {
        tabName = CONFIG.BAIL_SCHOOL.TAB_NAME;
      }
    } catch (tErr) {}

    var ss;
    if (typeof schoolResolveSpreadsheet_ === 'function') {
      ss = schoolResolveSpreadsheet_();
    } else {
      var sheetId = '';
      try {
        sheetId = PropertiesService.getScriptProperties().getProperty('BAIL_SCHOOL_SHEET_ID') || '';
      } catch (pErr) {}
      try {
        if ((!sheetId || sheetId === 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') &&
            typeof CONFIG !== 'undefined' && CONFIG.BAIL_SCHOOL) {
          sheetId = CONFIG.BAIL_SCHOOL.SHEET_ID || '';
        }
      } catch (cErr) {}
      if (!sheetId || sheetId === 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return { success: false, error: 'Bail School Sheet ID not configured — run setupBailSchoolSpreadsheet()' };
      }
      ss = SpreadsheetApp.openById(sheetId);
    }
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
  var ss;
  try {
    if (typeof schoolResolveSpreadsheet_ === 'function') {
      ss = schoolResolveSpreadsheet_();
    } else {
      var sheetId = PropertiesService.getScriptProperties().getProperty('BAIL_SCHOOL_SHEET_ID') || '';
      if (!sheetId || sheetId === 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        if (typeof CONFIG !== 'undefined' && CONFIG.BAIL_SCHOOL) {
          sheetId = CONFIG.BAIL_SCHOOL.SHEET_ID || '';
        }
      }
      if (!sheetId || sheetId === 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') return;
      ss = SpreadsheetApp.openById(sheetId);
    }
  } catch (e) {
    return;
  }
  var tabName = 'Student_Progress_Log';
  try {
    if (typeof CONFIG !== 'undefined' && CONFIG.BAIL_SCHOOL && CONFIG.BAIL_SCHOOL.TAB_NAME) {
      tabName = CONFIG.BAIL_SCHOOL.TAB_NAME;
    }
  } catch (tErr) {}
  const logSheet = ss.getSheetByName(tabName);
  
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

/**
 * Handle Webhook from Node-RED to unlock a course upon SwipeSimple payment
 */
function handleBailSchoolUnlock(data) {
  try {
    const studentEmail = data.studentEmail;
    const courseId = data.courseId;
    const amountPaid = data.amountPaid;

    if (!studentEmail || !courseId) {
      return { success: false, error: 'StudentEmail and CourseID are required' };
    }

    // Prefer LMS resolver (Script Property / auto-provision). Do NOT use
    // getConfig('BAIL_SCHOOL.SHEET_ID') — Code.js getConfig() has no path arg.
    let ss;
    if (typeof schoolResolveSpreadsheet_ === 'function') {
      ss = schoolResolveSpreadsheet_();
    } else {
      var sheetId = '';
      try {
        sheetId = PropertiesService.getScriptProperties().getProperty('BAIL_SCHOOL_SHEET_ID') || '';
      } catch (pErr) {}
      if (!sheetId || sheetId === 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        try {
          if (typeof CONFIG !== 'undefined' && CONFIG.BAIL_SCHOOL) {
            sheetId = CONFIG.BAIL_SCHOOL.SHEET_ID || '';
          }
        } catch (cErr) {}
      }
      if (!sheetId || sheetId === 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return { success: false, error: 'Bail School Sheet ID not configured — run setupBailSchoolSpreadsheet()' };
      }
      ss = SpreadsheetApp.openById(sheetId);
    }
    let authSheet = ss.getSheetByName('Student_Auth');

    // Auto-create Auth tab if it doesn't exist
    if (!authSheet) {
      authSheet = ss.insertSheet('Student_Auth');
      authSheet.appendRow(['Timestamp', 'Student Email', 'Course ID', 'Amount Paid', 'Status']);
      authSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#1A3D2B").setFontColor("#FFFFFF");
      authSheet.setFrozenRows(1);
    }

    // Attempt to UPSERT
    const lastRow = authSheet.getLastRow();
    let rowUpdated = false;

    if (lastRow > 1) {
      const existingData = authSheet.getRange(2, 2, lastRow - 1, 2).getValues(); // [Email, CourseID]
      for (let i = 0; i < existingData.length; i++) {
        if (existingData[i][0] === studentEmail && existingData[i][1] === courseId) {
          const rowNum = i + 2;
          authSheet.getRange(rowNum, 1).setValue(new Date());
          authSheet.getRange(rowNum, 4).setValue(amountPaid);
          authSheet.getRange(rowNum, 5).setValue("Unlocked");
          rowUpdated = true;
          break;
        }
      }
    }

    if (!rowUpdated) {
      authSheet.appendRow([new Date(), studentEmail, courseId, amountPaid, "Unlocked"]);
    }

    // Optional dual-write: notify school Next.js GAS web app (same Student_Auth if shared sheet).
    // Set Script Property BAIL_SCHOOL_WEBHOOK_URL to school Code.gs /exec URL if separate project.
    try {
      var schoolWebhook = PropertiesService.getScriptProperties().getProperty('BAIL_SCHOOL_WEBHOOK_URL');
      var schoolKey = PropertiesService.getScriptProperties().getProperty('BAIL_SCHOOL_API_KEY')
        || PropertiesService.getScriptProperties().getProperty('GAS_API_KEY');
      if (schoolWebhook) {
        UrlFetchApp.fetch(schoolWebhook, {
          method: 'post',
          contentType: 'application/json',
          muteHttpExceptions: true,
          payload: JSON.stringify({
            action: 'unlock_course',
            studentEmail: studentEmail,
            courseId: courseId,
            amountPaid: amountPaid,
            apiKey: schoolKey || ''
          })
        });
      }
    } catch (dualErr) {
      console.warn('School webhook dual-write skipped/failed:', dualErr);
    }

    return { success: true, message: `Course ${courseId} unlocked for ${studentEmail}` };

  } catch (error) {
    console.error('Error unlocking course:', error);
    return { success: false, error: error.message };
  }
}

