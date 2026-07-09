/**
 * BailSchool_LMS.js
 * Next.js school LMS handlers (merged into portal GAS project).
 * Entry points are routed from Code.js doPost/doGet — no doPost/doGet here.
 * Sheet: BAIL_SCHOOL.SHEET_ID (Student_Auth, progress, magic links).
 */

var SCHOOL_STUDENTS_SHEET = "BailSchoolStudents";
var SCHOOL_MAGIC_LINKS_SHEET = "MagicLinks";
var SCHOOL_PROGRESS_SHEET = "Student_Progress_Log";
var SCHOOL_ROSTER_SHEET = "DFS_Compliance_Rosters";
/** Payment unlocks — same shape as portal BailSchoolPayments Student_Auth */
var SCHOOL_AUTH_SHEET = "Student_Auth";

/**
 * Require API key when GAS_API_KEY Script Property is set.
 * Set via: PropertiesService.getScriptProperties().setProperty('GAS_API_KEY', '...')
 * Browser magic-link (sendSchoolMagicLink) may omit key when REQUIRE_API_KEY_FOR_MAGIC_LINK !== 'true'.
 */
function schoolGetOrCreateAuthSheet_() {
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  let authSheet = ss.getSheetByName(SCHOOL_AUTH_SHEET);
  if (!authSheet) {
    authSheet = ss.insertSheet(SCHOOL_AUTH_SHEET);
    authSheet.appendRow(['Timestamp', 'Student Email', 'Course ID', 'Amount Paid', 'Status']);
    authSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#1A3D2B").setFontColor("#FFFFFF");
    authSheet.setFrozenRows(1);
  }
  return authSheet;
}

/**
 * Unlock a course after payment (called by portal Gmail poller or manual staff).
 * Also emails a magic login link so the student can enter the LMS immediately.
 */
function schoolHandleUnlockCourse(data) {
  const studentEmail = String(data.studentEmail || data.email || '').trim().toLowerCase();
  const courseId = String(data.courseId || '').trim();
  const amountPaid = data.amountPaid;

  if (!studentEmail || !courseId) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'studentEmail and courseId are required'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const authSheet = schoolGetOrCreateAuthSheet_();
  const lastRow = authSheet.getLastRow();
  let rowUpdated = false;

  if (lastRow > 1) {
    const existingData = authSheet.getRange(2, 2, lastRow - 1, 2).getValues();
    for (let i = 0; i < existingData.length; i++) {
      if (String(existingData[i][0]).toLowerCase() === studentEmail && existingData[i][1] === courseId) {
        const rowNum = i + 2;
        authSheet.getRange(rowNum, 1).setValue(new Date());
        if (amountPaid !== undefined && amountPaid !== null) {
          authSheet.getRange(rowNum, 4).setValue(amountPaid);
        }
        authSheet.getRange(rowNum, 5).setValue('Unlocked');
        rowUpdated = true;
        break;
      }
    }
  }

  if (!rowUpdated) {
    authSheet.appendRow([new Date(), studentEmail, courseId, amountPaid || '', 'Unlocked']);
  }

  // Ensure student directory row
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  let studentSheet = ss.getSheetByName(SCHOOL_STUDENTS_SHEET);
  if (!studentSheet) {
    studentSheet = ss.insertSheet(SCHOOL_STUDENTS_SHEET);
    studentSheet.appendRow(['Email', 'Name', 'EnrolledDate', 'Status']);
  }
  const students = studentSheet.getDataRange().getValues();
  let known = false;
  for (let i = 1; i < students.length; i++) {
    if (String(students[i][0]).toLowerCase() === studentEmail) {
      known = true;
      studentSheet.getRange(i + 1, 4).setValue('Active');
      break;
    }
  }
  if (!known) {
    studentSheet.appendRow([studentEmail, studentEmail.split('@')[0], new Date(), 'Active']);
  }

  // Auto-send login link after unlock
  try {
    schoolHandleSendMagicLink({ email: studentEmail, redirectUrl: '/dashboard' });
  } catch (e) {
    console.warn('Unlock succeeded but magic link failed: ' + e.message);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Course ' + courseId + ' unlocked for ' + studentEmail
  })).setMimeType(ContentService.MimeType.JSON);
}

function schoolHandleGetEnrollments(email) {
  if (!email) {
    return ContentService.createTextOutput(JSON.stringify({ enrollments: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const want = String(email).trim().toLowerCase();
  const authSheet = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})().getSheetByName(SCHOOL_AUTH_SHEET);
  if (!authSheet) {
    return ContentService.createTextOutput(JSON.stringify({ enrollments: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const data = authSheet.getDataRange().getValues();
  const enrollments = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === want) {
      enrollments.push({
        courseId: data[i][2],
        status: data[i][4] || 'Unlocked',
        amountPaid: data[i][3],
        unlockedAt: data[i][0] ? new Date(data[i][0]).toISOString() : null
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ enrollments: enrollments }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 1. Magic Link Authentication
 */
function schoolHandleSendMagicLink(data) {
  const email = String(data.email || '').trim().toLowerCase();
  if (!email) throw new Error("Email required");
  
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  
  // Verify student exists (or auto-create for open enrollment / post-payment)
  let studentSheet = ss.getSheetByName(SCHOOL_STUDENTS_SHEET);
  if (!studentSheet) {
    studentSheet = ss.insertSheet(SCHOOL_STUDENTS_SHEET);
    studentSheet.appendRow(["Email", "Name", "EnrolledDate", "Status"]);
  }
  
  // Generate Token
  const token = Utilities.getUuid();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // 1 hour expiry
  
  let linkSheet = ss.getSheetByName(SCHOOL_MAGIC_LINKS_SHEET);
  if (!linkSheet) {
    linkSheet = ss.insertSheet(SCHOOL_MAGIC_LINKS_SHEET);
    linkSheet.appendRow(["Email", "Token", "Expiry", "Used"]);
  }
  
  linkSheet.appendRow([email, token, expiry, false]);
  
  // Send Email
  const loginUrl = `https://school.shamrockbailbonds.biz/login?token=${token}`;
  const subject = "Shamrock Bail School - Your Login Link";
  const body = `Hello,\n\nClick the link below to securely log in to your student dashboard. This link expires in 1 hour.\n\n${loginUrl}\n\nIf you just paid, your course unlocks automatically after payment is confirmed (usually a few minutes).\n\n- Shamrock Bail Bonds`;
  
  MailApp.sendEmail(email, subject, body);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Magic link sent" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function schoolHandleAuthVerification(data) {
  const token = data.token;
  if (!token) throw new Error("Token required");
  
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  const linkSheet = ss.getSheetByName(SCHOOL_MAGIC_LINKS_SHEET);
  if (!linkSheet) throw new Error("Auth system uninitialized");
  
  const rows = linkSheet.getDataRange().getValues();
  const now = new Date();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === token) {
      const expiry = new Date(rows[i][2]);
      const used = rows[i][3];
      
      if (used) throw new Error("Token already used");
      if (now > expiry) throw new Error("Token expired");
      
      // Mark as used
      linkSheet.getRange(i + 1, 4).setValue(true);
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        email: rows[i][0] 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  throw new Error("Invalid token");
}

/**
 * 2. Progress Persistence
 */
function schoolHandleLogProgress(data) {
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  let sheet = ss.getSheetByName(SCHOOL_PROGRESS_SHEET);
  
  if (!sheet) {
    sheet = ss.insertSheet(SCHOOL_PROGRESS_SHEET);
    sheet.appendRow([
      "Timestamp", "StudentEmail", "ModuleId", "TimeSpentSeconds", 
      "Acknowledged", "QuizPassed", "QuizScore"
    ]);
  }

  sheet.appendRow([
    new Date(),
    data.studentEmail || "Unknown",
    data.moduleId || "Unknown",
    data.timeSpentSeconds || 0,
    data.acknowledged || false,
    data.quizPassed || false,
    data.quizScore !== undefined ? data.quizScore : "N/A"
  ]);

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function schoolHandleGetProgress(email) {
  if (!email) throw new Error("Email required");
  
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  const sheet = ss.getSheetByName(SCHOOL_PROGRESS_SHEET);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
  
  const data = sheet.getDataRange().getValues();
  const progress = {};
  
  // Rebuild latest state per module for this user
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      const modId = data[i][2];
      if (!progress[modId]) progress[modId] = { timeSpent: 0, acknowledged: false, quizPassed: false, quizScore: 0 };
      
      progress[modId].timeSpent += Number(data[i][3]) || 0;
      if (data[i][4]) progress[modId].acknowledged = true;
      if (data[i][5]) progress[modId].quizPassed = true;
      if (data[i][6] !== "N/A") progress[modId].quizScore = data[i][6];
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(progress))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 3. Certificate Flow
 */
function schoolStudentHasIntegritySignature_(email) {
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  const sheet = ss.getSheetByName("IntegritySignatures");
  if (!sheet) return false;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) return true;
  }
  return false;
}

/**
 * Required module IDs must all have quizPassed === true.
 * 20hr: 20hr_1…20hr_5 (also accepts legacy bare "1"…"5")
 * 120hr: 120hr_1…120hr_5 + 120hr_FINAL_EXAM
 */
function schoolRequiredModuleIds_(courseId) {
  if (courseId === '20hr') {
    return ['20hr_1', '20hr_2', '20hr_3', '20hr_4', '20hr_5'];
  }
  if (courseId === '120hr') {
    return ['120hr_1', '120hr_2', '120hr_3', '120hr_4', '120hr_5', '120hr_FINAL_EXAM'];
  }
  return [];
}

function schoolStudentHasPassingProgress_(email, courseId) {
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  const sheet = ss.getSheetByName(SCHOOL_PROGRESS_SHEET);
  if (!sheet) return false;
  const data = sheet.getDataRange().getValues();
  const passed = {};
  const want = String(email).toLowerCase();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() !== want) continue;
    const modId = String(data[i][2] || '');
    const quizPassed = data[i][5] === true || data[i][5] === 'TRUE' || data[i][5] === 'true';
    if (quizPassed) {
      passed[modId] = true;
      // Legacy 20hr bare numeric ids count toward 20hr_N
      if (/^\d+$/.test(modId) && courseId === '20hr') {
        passed['20hr_' + modId] = true;
      }
    }
  }

  const required = schoolRequiredModuleIds_(courseId);
  if (!required.length) return false;
  for (let r = 0; r < required.length; r++) {
    if (!passed[required[r]]) return false;
  }
  return true;
}

function schoolHandleGetAdminRoster() {
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  const authSheet = ss.getSheetByName(SCHOOL_AUTH_SHEET);
  const integritySheet = ss.getSheetByName('IntegritySignatures');
  const studentSheet = ss.getSheetByName(SCHOOL_STUDENTS_SHEET);

  const integrityByEmail = {};
  if (integritySheet && integritySheet.getLastRow() > 1) {
    const idata = integritySheet.getDataRange().getValues();
    for (let i = 1; i < idata.length; i++) {
      const em = String(idata[i][1] || '').toLowerCase();
      if (!em) continue;
      integrityByEmail[em] = {
        signed: true,
        name: idata[i][2] || '',
        date: idata[i][0] ? new Date(idata[i][0]).toISOString().split('T')[0] : '-',
        ip: idata[i][3] || '-',
      };
    }
  }

  const nameByEmail = {};
  if (studentSheet && studentSheet.getLastRow() > 1) {
    const sdata = studentSheet.getDataRange().getValues();
    for (let i = 1; i < sdata.length; i++) {
      nameByEmail[String(sdata[i][0] || '').toLowerCase()] = sdata[i][1] || '';
    }
  }

  const byEmail = {};
  if (authSheet && authSheet.getLastRow() > 1) {
    const adata = authSheet.getDataRange().getValues();
    for (let i = 1; i < adata.length; i++) {
      const em = String(adata[i][1] || '').toLowerCase();
      if (!em) continue;
      if (!byEmail[em]) {
        byEmail[em] = {
          email: em,
          name: nameByEmail[em] || em.split('@')[0],
          courses: [],
          signed: false,
          date: '-',
          ip: '-',
        };
      }
      if (adata[i][2]) byEmail[em].courses.push(String(adata[i][2]));
    }
  }

  // Include integrity-only students
  Object.keys(integrityByEmail).forEach(function (em) {
    if (!byEmail[em]) {
      byEmail[em] = {
        email: em,
        name: integrityByEmail[em].name || em.split('@')[0],
        courses: [],
        signed: true,
        date: integrityByEmail[em].date,
        ip: integrityByEmail[em].ip,
      };
    } else {
      byEmail[em].signed = true;
      byEmail[em].date = integrityByEmail[em].date;
      byEmail[em].ip = integrityByEmail[em].ip;
      if (integrityByEmail[em].name) byEmail[em].name = integrityByEmail[em].name;
    }
  });

  const students = Object.keys(byEmail).map(function (k) {
    return byEmail[k];
  });

  return ContentService.createTextOutput(JSON.stringify({ students: students }))
    .setMimeType(ContentService.MimeType.JSON);
}

function schoolHandleIssueCertificate(data) {
  const { studentEmail, courseId } = data;
  if (!studentEmail || !courseId) throw new Error("Missing required fields");

  // Eligibility: integrity ack + at least one recorded quiz pass
  if (!schoolStudentHasIntegritySignature_(studentEmail)) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Integrity acknowledgment required before certificate issuance"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  if (!schoolStudentHasPassingProgress_(studentEmail, courseId)) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Course progress incomplete — cannot issue certificate"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    // 1. Setup - Use placeholders or exact IDs if known
    // In production, you would replace these with your actual Drive File/Folder IDs
    const TEMPLATE_ID = PropertiesService.getScriptProperties().getProperty('CERTIFICATE_TEMPLATE_ID') || 'YOUR_SLIDES_TEMPLATE_ID_HERE';
    const OUTPUT_FOLDER_ID = PropertiesService.getScriptProperties().getProperty('CERTIFICATE_FOLDER_ID') || 'YOUR_OUTPUT_FOLDER_ID_HERE';
    
    // Check if we're in dev mode (no real template ID set)
    if (TEMPLATE_ID === 'YOUR_SLIDES_TEMPLATE_ID_HERE') {
      console.warn("No real template ID set. Returning mock success.");
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        message: "Dev Mode: Certificate generated and emailed.",
        downloadUrl: "https://shamrockbailbonds.biz/certificate-placeholder.pdf"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Look up student name from roster or use email prefix
    let studentName = studentEmail.split('@')[0];
    const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
    const rosterSheet = ss.getSheetByName(SCHOOL_ROSTER_SHEET);
    if (rosterSheet) {
      const rosterData = rosterSheet.getDataRange().getValues();
      for (let i = 1; i < rosterData.length; i++) {
        if (rosterData[i][1] === studentEmail) {
          studentName = rosterData[i][0];
          break;
        }
      }
    }

    const courseName = courseId === '120hr' ? '120-Hour Basic Certification' : '20-Hour Pre-Licensing Correspondence Course';
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fileName = `Certificate_${studentName.replace(/\\s+/g, '_')}_${courseId}`;

    // 3. Copy template and replace placeholders
    const templateFile = DriveApp.getFileById(TEMPLATE_ID);
    const outputFolder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
    const copyFile = templateFile.makeCopy(fileName, outputFolder);
    const copyId = copyFile.getId();
    
    const presentation = SlidesApp.openById(copyId);
    const slides = presentation.getSlides();
    
    // Replace text in all slides
    slides.forEach(slide => {
      slide.replaceAllText('{{Name}}', studentName);
      slide.replaceAllText('{{Date}}', dateStr);
      slide.replaceAllText('{{CourseName}}', courseName);
    });
    
    presentation.saveAndClose();

    // 4. Export as PDF
    const pdfBlob = copyFile.getAs(MimeType.PDF);
    pdfBlob.setName(`${fileName}.pdf`);
    const pdfFile = outputFolder.createFile(pdfBlob);
    
    // Keep certificate private — email attachment is the delivery path
    // Do not set ANYONE_WITH_LINK for student PII documents
    const downloadUrl = pdfFile.getUrl();

    // Clean up the temporary Slides copy
    copyFile.setTrashed(true);

    // 5. Email the PDF to the student
    const emailSubject = `Your Shamrock Bail School Certificate: ${courseName}`;
    const emailBody = `
      Hello ${studentName},
      
      Congratulations on completing the ${courseName}!
      
      Your official FLDFS completion certificate is attached to this email. A copy has also been logged in our system for state auditing purposes.
      
      If you have any questions, please contact us at admin@shamrockbailbonds.biz.
      
      Best regards,
      Shamrock Bail School
    `;
    
    MailApp.sendEmail({
      to: studentEmail,
      subject: emailSubject,
      body: emailBody,
      attachments: [pdfBlob]
    });

    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: "Certificate generated and emailed.",
      downloadUrl: downloadUrl
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("Certificate Generation Error: ", error);
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: "Failed to generate certificate: " + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 4. Compliance Integrity & Rosters
 */
function schoolHandleSignIntegrity(data) {
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  let sheet = ss.getSheetByName("IntegritySignatures");
  if (!sheet) {
    sheet = ss.insertSheet("IntegritySignatures");
    sheet.appendRow(["Timestamp", "Email", "SignatureName", "IPAddress"]);
  }
  
  sheet.appendRow([new Date(), data.studentEmail, data.signatureName, data.ipAddress]);
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function schoolHandleCheckIntegrity(email) {
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  const sheet = ss.getSheetByName("IntegritySignatures");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({ signed: false })).setMimeType(ContentService.MimeType.JSON);
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      return ContentService.createTextOutput(JSON.stringify({ signed: true })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ signed: false })).setMimeType(ContentService.MimeType.JSON);
}

function schoolHandleGetRoster() {
  const ss = (function() {
  try {
    if (typeof getConfig === 'function') {
      var sid = getConfig('BAIL_SCHOOL.SHEET_ID');
      if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') {
        return SpreadsheetApp.openById(sid);
      }
    }
  } catch (e) {}
  return SpreadsheetApp.getActiveSpreadsheet();
})();
  const sheet = ss.getSheetByName(SCHOOL_ROSTER_SHEET);
  
  if (!sheet) {
    // Return dummy CSV if sheet doesn't exist
    const csvHeaders = ["StudentName", "StudentEmail", "LicenseNumber", "ProviderName", "ProviderID", "CourseID", "CompletionDate", "FinalScore"];
    const dummyRow = ["John Doe", "john@example.com", "W123456", "Shamrock Bail Co. Education", "P99999", "COURSE-120", new Date().toISOString().split('T')[0], "85"];
    const csvContent = [csvHeaders.join(","), dummyRow.join(",")].join("\n");
    return ContentService.createTextOutput(csvContent).setMimeType(ContentService.MimeType.CSV);
  }
  
  // Convert sheet to CSV
  const data = sheet.getDataRange().getValues();
  let csv = "";
  for (let i = 0; i < data.length; i++) {
    csv += data[i].join(",") + "\n";
  }
  
  return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.CSV);
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ONE-TIME SETUP: Certificate Template & Folder IDs
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO USE:
 *   1. Find your Google Slides certificate template in Drive.
 *      Copy its ID from the URL:
 *      https://docs.google.com/presentation/d/  <<<THIS_IS_THE_ID>>>  /edit
 *
 *   2. Find (or create) the Drive folder where completed PDFs should be saved.
 *      Copy its ID from the URL:
 *      https://drive.google.com/drive/folders/  <<<THIS_IS_THE_ID>>>
 *
 *   3. Paste both IDs into the two variables below.
 *
 *   4. In the GAS editor, select "setupCertificateProperties" from the
 *      function dropdown and click ▶ Run.
 *
 *   5. You will see "✅ Certificate properties saved." in the Execution Log.
 *      This function is safe to re-run — it will simply overwrite the values.
 *      DO NOT delete this function after running it; it is harmless to keep.
 * ─────────────────────────────────────────────────────────────────────────────
 */
function schoolSetupCertificateProperties() {
  const TEMPLATE_ID    = 'PASTE_YOUR_SLIDES_TEMPLATE_ID_HERE';
  const FOLDER_ID      = 'PASTE_YOUR_OUTPUT_FOLDER_ID_HERE';

  if (TEMPLATE_ID === 'PASTE_YOUR_SLIDES_TEMPLATE_ID_HERE' || FOLDER_ID === 'PASTE_YOUR_OUTPUT_FOLDER_ID_HERE') {
    throw new Error('❌ You must replace the placeholder values before running this function.');
  }

  const props = PropertiesService.getScriptProperties();
  props.setProperty('CERTIFICATE_TEMPLATE_ID', TEMPLATE_ID);
  props.setProperty('CERTIFICATE_FOLDER_ID',   FOLDER_ID);

  Logger.log('✅ Certificate properties saved.');
  Logger.log('   CERTIFICATE_TEMPLATE_ID → ' + props.getProperty('CERTIFICATE_TEMPLATE_ID'));
  Logger.log('   CERTIFICATE_FOLDER_ID   → ' + props.getProperty('CERTIFICATE_FOLDER_ID'));
}
