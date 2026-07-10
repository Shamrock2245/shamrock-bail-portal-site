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
 * Resolve Bail School spreadsheet.
 *
 * Order:
 *  1. Script Property BAIL_SCHOOL_SHEET_ID (preferred — set by setupBailSchoolSpreadsheet)
 *  2. CONFIG.BAIL_SCHOOL.SHEET_ID when not a placeholder
 *  3. Auto-provision a new spreadsheet and persist BAIL_SCHOOL_SHEET_ID
 *
 * NEVER use SpreadsheetApp.getActiveSpreadsheet() — this project may be
 * container-bound (or previously polluted) to the main bonds workbook which
 * is already near the 10M cell limit. LMS must stay on its own small file.
 *
 * IMPORTANT: Do NOT call getConfig('BAIL_SCHOOL.SHEET_ID'). Code.js defines
 * getConfig() with no path arg and shadows CONFIG.js's path-based getConfig.
 */
function schoolResolveSpreadsheet_() {
  var sid = schoolReadConfiguredSheetId_();
  if (sid) {
    try {
      var ss = SpreadsheetApp.openById(sid);
      // Reject clearly wrong hosts (main leads workbook / oversized files)
      if (schoolSpreadsheetLooksUsable_(ss)) {
        return ss;
      }
      console.warn('schoolResolveSpreadsheet_: rejecting oversized/wrong sheet ' + sid);
      try {
        PropertiesService.getScriptProperties().deleteProperty('BAIL_SCHOOL_SHEET_ID');
      } catch (delErr) {}
    } catch (openErr) {
      console.error('schoolResolveSpreadsheet_: openById failed for ' + sid + ': ' + openErr);
      try {
        PropertiesService.getScriptProperties().deleteProperty('BAIL_SCHOOL_SHEET_ID');
      } catch (delErr2) {}
    }
  }
  return schoolProvisionSpreadsheet_();
}

/**
 * LMS sheet should be small / purpose-built. Reject workbooks that are already
 * near Google's 10M cell cap (e.g. main arrest/leads sheet mis-bound as school).
 */
function schoolSpreadsheetLooksUsable_(ss) {
  if (!ss) return false;
  try {
    var sheets = ss.getSheets();
    var totalCells = 0;
    for (var i = 0; i < sheets.length; i++) {
      var sh = sheets[i];
      totalCells += sh.getMaxRows() * sh.getMaxColumns();
      if (totalCells > 2000000) return false; // 2M max-cells soft limit for LMS host
    }
    // If Student_Auth already exists, treat as intentional LMS workbook
    if (ss.getSheetByName(SCHOOL_AUTH_SHEET)) return true;
    // Prefer named LMS titles; still allow empty new files
    var name = String(ss.getName() || '').toLowerCase();
    if (name.indexOf('bail school') !== -1 || name.indexOf('lms') !== -1) return true;
    // Brand-new / small file without Student_Auth yet — OK
    if (sheets.length <= 12 && totalCells < 500000) return true;
    return false;
  } catch (e) {
    return false;
  }
}

/** @returns {string} sheet id or empty string */
function schoolReadConfiguredSheetId_() {
  var sid = '';
  try {
    sid = PropertiesService.getScriptProperties().getProperty('BAIL_SCHOOL_SHEET_ID') || '';
  } catch (e0) {}
  if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') return String(sid).trim();

  try {
    if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.BAIL_SCHOOL && CONFIG.BAIL_SCHOOL.SHEET_ID) {
      sid = CONFIG.BAIL_SCHOOL.SHEET_ID || '';
    }
  } catch (e1) {}
  if (sid && sid !== 'YOUR_BAIL_SCHOOL_SHEET_ID_HERE') return String(sid).trim();
  return '';
}

/** Create LMS spreadsheet + core tabs; persist Script Property. */
function schoolProvisionSpreadsheet_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var existing = schoolReadConfiguredSheetId_();
    if (existing) {
      try {
        var existingSs = SpreadsheetApp.openById(existing);
        if (schoolSpreadsheetLooksUsable_(existingSs)) {
          schoolEnsureCoreTabs_(existingSs);
          return existingSs;
        }
        PropertiesService.getScriptProperties().deleteProperty('BAIL_SCHOOL_SHEET_ID');
      } catch (reopenErr) {
        console.warn('schoolProvisionSpreadsheet_: configured id unusable, creating new: ' + reopenErr);
        try {
          PropertiesService.getScriptProperties().deleteProperty('BAIL_SCHOOL_SHEET_ID');
        } catch (d) {}
      }
    }
    var ss = SpreadsheetApp.create('Shamrock Bail School LMS');
    var id = ss.getId();
    PropertiesService.getScriptProperties().setProperty('BAIL_SCHOOL_SHEET_ID', id);
    schoolEnsureCoreTabs_(ss);
    console.log('Provisioned Bail School spreadsheet: ' + id + ' https://docs.google.com/spreadsheets/d/' + id);
    return ss;
  } finally {
    try {
      lock.releaseLock();
    } catch (unlockErr) {}
  }
}

/** Ensure Student_Auth, BailSchoolStudents, MagicLinks, progress tabs exist. */
function schoolEnsureCoreTabs_(ss) {
  if (!ss) return;
  var auth = ss.getSheetByName(SCHOOL_AUTH_SHEET);
  if (!auth) {
    auth = ss.insertSheet(SCHOOL_AUTH_SHEET);
    auth.appendRow(['Timestamp', 'Student Email', 'Course ID', 'Amount Paid', 'Status']);
    auth.getRange('A1:E1').setFontWeight('bold').setBackground('#1A3D2B').setFontColor('#FFFFFF');
    auth.setFrozenRows(1);
  }
  var students = ss.getSheetByName(SCHOOL_STUDENTS_SHEET);
  if (!students) {
    students = ss.insertSheet(SCHOOL_STUDENTS_SHEET);
    students.appendRow(['Email', 'Name', 'EnrolledDate', 'Status']);
    students.getRange('A1:D1').setFontWeight('bold');
    students.setFrozenRows(1);
  }
  var links = ss.getSheetByName(SCHOOL_MAGIC_LINKS_SHEET);
  if (!links) {
    links = ss.insertSheet(SCHOOL_MAGIC_LINKS_SHEET);
    links.appendRow(['Email', 'Token', 'Expiry', 'Used']);
    links.getRange('A1:D1').setFontWeight('bold');
    links.setFrozenRows(1);
  }
  var progress = ss.getSheetByName(SCHOOL_PROGRESS_SHEET);
  if (!progress) {
    progress = ss.insertSheet(SCHOOL_PROGRESS_SHEET);
    progress.appendRow([
      'Timestamp', 'StudentEmail', 'ModuleId', 'TimeSpentSeconds',
      'Acknowledged', 'QuizPassed', 'QuizScore'
    ]);
    progress.getRange('A1:G1').setFontWeight('bold');
    progress.setFrozenRows(1);
  }
  // Drop default "Sheet1" if we created named tabs and it is empty
  try {
    var def = ss.getSheetByName('Sheet1');
    if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) {
      ss.deleteSheet(def);
    }
  } catch (delErr) {}
}

/**
 * One-shot setup: ensure sheet exists, return id + URL for ops/docs.
 * Run from Apps Script editor or: clasp run setupBailSchoolSpreadsheet
 */
function setupBailSchoolSpreadsheet() {
  var ss = schoolResolveSpreadsheet_();
  schoolEnsureCoreTabs_(ss);
  var id = ss.getId();
  var url = ss.getUrl();
  PropertiesService.getScriptProperties().setProperty('BAIL_SCHOOL_SHEET_ID', id);
  return {
    success: true,
    sheetId: id,
    url: url,
    message: 'Bail School spreadsheet ready. Script Property BAIL_SCHOOL_SHEET_ID set.'
  };
}



/**
 * Require API key when GAS_API_KEY Script Property is set.
 * Set via: PropertiesService.getScriptProperties().setProperty('GAS_API_KEY', '...')
 * Browser magic-link (sendSchoolMagicLink) may omit key when REQUIRE_API_KEY_FOR_MAGIC_LINK !== 'true'.
 */
function schoolGetOrCreateAuthSheet_() {
  var ss = schoolResolveSpreadsheet_();
  var authSheet = ss.getSheetByName(SCHOOL_AUTH_SHEET);
  if (!authSheet) {
    try {
      authSheet = ss.insertSheet(SCHOOL_AUTH_SHEET);
      authSheet.appendRow(['Timestamp', 'Student Email', 'Course ID', 'Amount Paid', 'Status']);
      authSheet.getRange("A1:E1").setFontWeight("bold").setBackground("#1A3D2B").setFontColor("#FFFFFF");
      authSheet.setFrozenRows(1);
    } catch (insertErr) {
      // Host workbook full / wrong sheet — force dedicated LMS provision
      console.warn('schoolGetOrCreateAuthSheet_ insert failed, re-provisioning: ' + insertErr);
      try {
        PropertiesService.getScriptProperties().deleteProperty('BAIL_SCHOOL_SHEET_ID');
      } catch (d) {}
      ss = schoolProvisionSpreadsheet_();
      authSheet = ss.getSheetByName(SCHOOL_AUTH_SHEET);
      if (!authSheet) {
        throw insertErr;
      }
    }
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
  const ss = schoolResolveSpreadsheet_();
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
  var authSheet;
  try {
    authSheet = schoolResolveSpreadsheet_().getSheetByName(SCHOOL_AUTH_SHEET);
  } catch (cfgErr) {
    return ContentService.createTextOutput(JSON.stringify({
      enrollments: [],
      error: cfgErr.message || String(cfgErr)
    })).setMimeType(ContentService.MimeType.JSON);
  }
  if (!authSheet) {
    return ContentService.createTextOutput(JSON.stringify({
      enrollments: [],
      error: 'Student_Auth sheet missing — run unlock once or create the tab'
    })).setMimeType(ContentService.MimeType.JSON);
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
  
  const ss = schoolResolveSpreadsheet_();
  
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
  
  const ss = schoolResolveSpreadsheet_();
  const linkSheet = ss.getSheetByName(SCHOOL_MAGIC_LINKS_SHEET);
  if (!linkSheet) throw new Error("Auth system uninitialized");
  
  const rows = linkSheet.getDataRange().getValues();
  const now = new Date();
  
  for (let i = 1; i < rows.length; i++) {
    // Token may be UUID string; coerce both sides for Sheets type quirks
    if (String(rows[i][1]).trim() === String(token).trim()) {
      const expiry = new Date(rows[i][2]);
      const used = rows[i][3] === true || rows[i][3] === 'TRUE' || rows[i][3] === 'true';
      const email = String(rows[i][0] || '').trim().toLowerCase();
      
      if (now > expiry) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Token expired'
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // Idempotent: React Strict Mode / double-click re-verifies the same token.
      // Allow already-used tokens until expiry so the student still gets a session.
      if (!used) {
        linkSheet.getRange(i + 1, 4).setValue(true);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        email: email,
        reused: used
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Invalid token'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 2. Progress Persistence
 */
function schoolHandleLogProgress(data) {
  const ss = schoolResolveSpreadsheet_();
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
  
  const ss = schoolResolveSpreadsheet_();
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
  const ss = schoolResolveSpreadsheet_();
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
  const ss = schoolResolveSpreadsheet_();
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
  const ss = schoolResolveSpreadsheet_();
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
    // 1. Drive template + output folder (Script Properties — required for real certs)
    const props = PropertiesService.getScriptProperties();
    const TEMPLATE_ID = (props.getProperty('CERTIFICATE_TEMPLATE_ID') || '').trim();
    const OUTPUT_FOLDER_ID = (props.getProperty('CERTIFICATE_FOLDER_ID') || '').trim();
    const looksPlaceholder = (id) =>
      !id ||
      /YOUR_|PLACEHOLDER|TODO|xxx/i.test(id) ||
      id.length < 20;

    // Fail closed — never return a fake "success" certificate in production
    if (looksPlaceholder(TEMPLATE_ID) || looksPlaceholder(OUTPUT_FOLDER_ID)) {
      console.error(
        'issue_certificate: CERTIFICATE_TEMPLATE_ID / CERTIFICATE_FOLDER_ID not configured'
      );
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error:
          'Certificate templates not configured. Set Script Properties CERTIFICATE_TEMPLATE_ID and CERTIFICATE_FOLDER_ID (Google Slides template + Drive folder).',
        code: 'CERT_TEMPLATE_NOT_CONFIGURED'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Look up student name from roster or use email prefix
    let studentName = studentEmail.split('@')[0];
    const ss = schoolResolveSpreadsheet_();
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
  const ss = schoolResolveSpreadsheet_();
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
  const ss = schoolResolveSpreadsheet_();
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
  const ss = schoolResolveSpreadsheet_();
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
