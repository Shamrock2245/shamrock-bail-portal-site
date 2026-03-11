/**
 * ============================================
 * MENU SYSTEM - Custom Google Sheets Menu
 * ============================================
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🍀 Shamrock Automation')
    
    // ===== PHASE 1: PAPERWORK GENERATION =====
    .addSubMenu(ui.createMenu('📄 Phase 1: Paperwork')
      .addItem('🔍 1. Inspect SignNow Template Fields', 'inspectSignNowTemplateFields')
      .addItem('📝 2. Open Data Entry Form', 'openDataEntryForm')
      .addSeparator()
      .addItem('📋 View Field Mapping', 'openFieldMappingSheet'))
    
    // ===== MODULE 1: COURT DATE AUTOMATION =====
    .addSubMenu(ui.createMenu('⚖️ Module 1: Court Automation')
      .addItem('🔍 Process Court Emails Now', 'processCourtDateEmails')
      .addItem('📊 View Court Date Status', 'viewCourtDateStatus')
      .addSeparator()
      .addItem('🧪 Test Email Parser', 'testEmailParser')
      .addItem('📧 Test Reminder Email', 'testReminderEmail'))

    // ===== ARREST SCRAPER =====
    .addSubMenu(ui.createMenu('🚔 Arrest Scraper')
      .addItem('▶️ Run Lee County Scraper', 'runLeeArrestsNow')
      .addItem('▶️ Run Collier County Scraper', 'runCollierArrestsNow')
      .addItem('🔄 Backfill Existing Records', 'backfillExistingRecords')
      .addItem('🗓️ Backfill October (Lee County)', 'backfillLeeCountyOctober')
      .addSeparator()
      .addItem('📋 Open Bond Form (Selected Row)', 'openBondFormForSelectedRow')
      .addItem('📊 Score All Leads', 'scoreAllLeads')
      .addSeparator()
      .addItem('🔍 Generate Search Links (All Rows)', 'generateAllSearchLinks')
      .addItem('🔍 Generate Search Links (Selected Row)', 'generateSearchLinksForSelectedRow')
      .addItem('🌐 Open All Search Links (Selected Row)', 'openAllSearchLinks')
      .addSeparator()
      .addItem('🎯 Sync Qualified Arrests', 'manualSyncQualifiedArrests')
      .addItem('📊 View Qualified Arrests Sheet', 'viewQualifiedArrestsSheet')
      .addSeparator()
      .addItem('📊 View Arrest Stats', 'viewArrestStats')
      .addItem('🔧 Setup Arrest Sheet', 'getOrCreateArrestSheet')
      .addItem('⏰ Install Scraper Trigger', 'installArrestScraperTrigger')
      .addItem('🗑️ Remove Scraper Trigger', 'removeArrestScraperTrigger'))



    // ===== SIGNNOW & SLACK =====
    .addSubMenu(ui.createMenu('📨 SignNow & Slack')
      .addItem('🔧 Configure SignNow', 'configureSignNow')
      .addItem('🧪 Test SignNow Connection', 'testSignNowConnection')
      .addSeparator()
      .addItem('🔧 Configure Slack Webhook', 'configureSlackWebhook')
      .addItem('📊 Send Test Slack Message', 'testSlackNotification')
      .addSeparator()
      .addItem('🚀 Route New Leads to Slack', 'routeLeeArrestLeadsNow'))
    
    // ===== SYSTEM MANAGEMENT =====
    .addSubMenu(ui.createMenu('⚙️ System Management')
      .addItem('🔧 Install Automation Triggers', 'installAllTriggers')
      .addItem('📋 List Active Triggers', 'listAllTriggers')
      .addItem('🗑️ Remove All Triggers', 'removeAllTriggers')
      .addSeparator()
      .addItem('🔍 Check Configuration', 'checkConfiguration'))
    
    // ===== HELP & INFO =====
    .addSubMenu(ui.createMenu('❓ Help & Info')
      .addItem('📖 View Documentation', 'showDocumentation')
      .addItem('🐛 View Error Log', 'showErrorLog')
      .addItem('ℹ️ About This System', 'showAboutDialog'))
    
    .addToUi();
  
  Logger.log('✅ Custom menu created successfully');
}

function onInstall(e) {
  onOpen(e);
}

// ============================================
// PHASE 1 MENU FUNCTIONS
// ============================================

function openDataEntryForm() {
  var html = HtmlService.createHtmlOutputFromFile('Form')
    .setWidth(800)
    .setHeight(600)
    .setTitle('Shamrock Bail Bonds - Data Entry');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Generate Bond Paperwork');
}

function openFieldMappingSheet() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('SignNow_Current_Fields');
  
  if (!sheet) {
    ui.alert('Field mapping sheet not found. Please run "Inspect SignNow Template Fields" first.');
    return;
  }
  
  ss.setActiveSheet(sheet);
  ui.alert('✅ Showing field mapping reference');
}

// ============================================
// MODULE 1 MENU FUNCTIONS
// ============================================

function viewCourtDateStatus() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    var allData = sheet.getDataRange().getValues();
    var upcomingCourts = [];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (var i = 1; i < allData.length; i++) {
      var courtDate = allData[i][CONFIG.COLUMNS.COURT_DATE - 1];
      if (courtDate) {
        var courtDateTime = new Date(courtDate);
        if (courtDateTime >= today) {
          upcomingCourts.push({
            name: allData[i][CONFIG.COLUMNS.DEFENDANT_NAME - 1],
            caseNumber: allData[i][CONFIG.COLUMNS.CASE_NUMBER - 1],
            date: courtDate,
            time: allData[i][CONFIG.COLUMNS.COURT_TIME - 1],
            reminder7d: allData[i][CONFIG.COLUMNS.REMINDER_7D - 1],
            reminder3d: allData[i][CONFIG.COLUMNS.REMINDER_3D - 1],
            reminder1d: allData[i][CONFIG.COLUMNS.REMINDER_1D - 1]
          });
        }
      }
    }
    
    upcomingCourts.sort(function(a, b) {
      return new Date(a.date) - new Date(b.date);
    });
    
    var message = '📅 UPCOMING COURT DATES\n';
    message += '═══════════════════════════════\n\n';
    
    if (upcomingCourts.length === 0) {
      message += 'No upcoming court dates scheduled.';
    } else {
      upcomingCourts.forEach(function(court, index) {
        message += (index + 1) + '. ' + court.name + '\n';
        message += '   Case: ' + court.caseNumber + '\n';
        message += '   Date: ' + court.date + ' at ' + court.time + '\n';
        message += '   Reminders: ';
        
        var reminders = [];
        if (court.reminder7d) reminders.push('7d ✓');
        if (court.reminder3d) reminders.push('3d ✓');
        if (court.reminder1d) reminders.push('1d ✓');
        
        message += reminders.length > 0 ? reminders.join(', ') : 'None sent yet';
        message += '\n\n';
      });
      
      message += '═══════════════════════════════\n';
      message += 'Total: ' + upcomingCourts.length + ' upcoming court date(s)';
    }
    
    ui.alert(message);
    
  } catch (error) {
    ui.alert('Error: ' + error.message);
  }
}

function testEmailParser() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Test Email Parser',
    'Enter the subject line of a court date email to test:\n\n(The email must be in your inbox)',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var searchSubject = response.getResponseText();
  if (!searchSubject) {
    ui.alert('No subject line entered.');
    return;
  }
  
  try {
    var threads = GmailApp.search('subject:"' + searchSubject + '"', 0, 1);
    
    if (threads.length === 0) {
      ui.alert('❌ No email found with that subject line.');
      return;
    }
    
    ui.alert('🔍 Found email. Attempting to parse...\n\nCheck the execution log for detailed results.');
    
    var courtData = parseCourtDateEmail(threads[0]);
    
    if (!courtData) {
      ui.alert('❌ Parsing failed. Check the execution log for details.\n\nGo to: Extensions > Apps Script > Execution log');
      return;
    }
    
    var resultMsg = '✅ PARSING SUCCESSFUL!\n\n';
    resultMsg += 'Extracted Data:\n';
    resultMsg += '━━━━━━━━━━━━━━━━━━━\n';
    resultMsg += 'Case Number: ' + (courtData.caseNumber || 'Not found') + '\n';
    resultMsg += 'Defendant: ' + (courtData.defendantName || 'Not found') + '\n';
    resultMsg += 'Court Date: ' + (courtData.courtDate || 'Not found') + '\n';
    resultMsg += 'Court Time: ' + (courtData.courtTime || 'Not found') + '\n';
    resultMsg += 'Location: ' + (courtData.location || 'Not found') + '\n';
    resultMsg += 'Hearing Type: ' + (courtData.hearingType || 'Not found') + '\n';
    
    ui.alert(resultMsg);
    
  } catch (error) {
    ui.alert('❌ Error: ' + error.message);
    Logger.log('Test parser error: ' + error.message);
  }
}

function testReminderEmail() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Test Reminder Email',
    'Enter your email address to receive a test reminder:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var testEmail = response.getResponseText();
  if (!testEmail || testEmail.indexOf('@') === -1) {
    ui.alert('Invalid email address.');
    return;
  }
  
  try {
    var testClientData = {
      rowNumber: 999,
      caseNumber: '24-CF-12345',
      defendantName: 'John Doe (TEST)',
      defendantEmail: testEmail,
      defendantPhone: '(239) 555-1234',
      indemnitorEmail: ''
    };
    
    var testCourtData = {
      courtDate: '2024-12-25',
      courtTime: '9:00 AM',
      location: 'Lee County Courthouse - Room 3A',
      hearingType: 'Arraignment'
    };
    
    sendReminderEmail(testClientData, testCourtData, '7d');
    
    ui.alert('✅ Test email sent to: ' + testEmail + '\n\nCheck your inbox!');
    
  } catch (error) {
    ui.alert('❌ Error sending test email: ' + error.message);
  }
}

// ============================================
// ARREST SCRAPER MENU FUNCTIONS
// ============================================

function viewArrestStats() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var ss = SpreadsheetApp.openById(ARREST_SCRAPER_CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(ARREST_SCRAPER_CONFIG.ARREST_SHEET_NAME);
    
    if (!sheet) {
      ui.alert('Arrest sheet not found. Run "Setup Arrest Sheet" first.');
      return;
    }
    
    var lastRow = sheet.getLastRow();
    var totalArrests = lastRow - 1;
    
    var message = '📊 ARREST SCRAPER STATISTICS\n';
    message += '═══════════════════════════════\n\n';
    message += '📋 Total arrests in database: ' + totalArrests + '\n\n';
    
    if (totalArrests > 0) {
      var lastRowData = sheet.getRange(lastRow, 1, 1, 10).getValues()[0];
      message += '🕐 Last arrest scraped:\n';
      message += '   • Time: ' + lastRowData[0] + '\n';
      message += '   • Name: ' + lastRowData[8] + '\n';
      message += '   • Booking #: ' + lastRowData[1] + '\n';
    }
    
    ui.alert(message);
    
  } catch (error) {
    ui.alert('Error: ' + error.message);
  }
}

function installArrestScraperTrigger() {
  var ui = SpreadsheetApp.getUi();
  
  removeArrestScraperTrigger();
  
  ScriptApp.newTrigger('scrapeRecentArrests')
    .timeBased()
    .everyMinutes(30)
    .create();
  
  ui.alert('✅ Arrest scraper trigger installed!\n\n' +
           'The system will now check for new arrests every 30 minutes.');
}

function removeArrestScraperTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'scrapeRecentArrests') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  SpreadsheetApp.getUi().alert('✅ Arrest scraper trigger removed.');
}

// ============================================
// SYSTEM MANAGEMENT FUNCTIONS
// ============================================

function testSlackNotification() {
  var ui = SpreadsheetApp.getUi();
  
  try {
    var testMessage = '🧪 TEST MESSAGE\n\n' +
                      'This is a test notification from the Shamrock Automation System.\n' +
                      'Time: ' + new Date().toString();
    
    postToSlack(CONFIG.SLACK_CHANNELS.COURT_DATES, testMessage, false);
    
    ui.alert('✅ Test message sent to Slack!\n\nCheck your #court-dates channel.');
    
  } catch (error) {
    ui.alert('❌ Error: ' + error.message + 
             '\n\nMake sure you have set up the Slack webhook in Script Properties.');
  }
}

function checkConfiguration() {
  var ui = SpreadsheetApp.getUi();
  var report = '🔍 CONFIGURATION CHECK\n';
  report += '═══════════════════════════════\n\n';
  
  var issues = [];
  
  var slackWebhook = getScriptProperty('SLACK_WEBHOOK_COURT');
  var pdfFolder = getScriptProperty('TEMP_PDF_FOLDER_ID');
  var calendarId = getScriptProperty('COMPANY_CALENDAR_ID');
  
  report += '📋 Script Properties:\n';
  report += '  • Slack Webhook: ' + (slackWebhook ? '✅ Set' : '❌ Missing') + '\n';
  report += '  • PDF Folder: ' + (pdfFolder ? '✅ Set' : '❌ Missing') + '\n';
  report += '  • Calendar ID: ' + (calendarId ? '✅ Set' : '❌ Missing') + '\n\n';
  
  if (!slackWebhook) issues.push('Slack webhook not configured');
  if (!pdfFolder) issues.push('PDF temp folder not configured');
  if (!calendarId) issues.push('Calendar ID not configured');
  
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    report += '📊 Google Sheet:\n';
    report += '  • Sheet ID: ✅ Valid\n';
    report += '  • Sheet Name: ' + (sheet ? '✅ Found' : '❌ Not found') + '\n\n';
    
    if (!sheet) issues.push('Sheet "' + CONFIG.SHEET_NAME + '" not found');
    
  } catch (error) {
    report += '📊 Google Sheet:\n';
    report += '  • ❌ Error: ' + error.message + '\n\n';
    issues.push('Cannot access sheet');
  }
  
  var label = GmailApp.getUserLabelByName('CourtDate/Processed');
  report += '📧 Gmail:\n';
  report += '  • Label: ' + (label ? '✅ Exists' : '⚠️ Will be created on first run') + '\n\n';
  
  var triggers = ScriptApp.getProjectTriggers();
  report += '⏰ Triggers:\n';
  report += '  • Active triggers: ' + triggers.length + '\n';
  
  if (triggers.length === 0) {
    report += '  • ⚠️ No triggers installed. Run "Install Automation Triggers" to set up.\n\n';
    issues.push('No triggers installed');
  } else {
    report += '  • ✅ Automation is active\n\n';
  }
  
  report += '═══════════════════════════════\n';
  
  if (issues.length === 0) {
    report += '✅ ALL SYSTEMS CONFIGURED!\n';
    report += '\nYour automation is ready to run.';
  } else {
    report += '⚠️ ISSUES FOUND: ' + issues.length + '\n\n';
    issues.forEach(function(issue, index) {
      report += '  ' + (index + 1) + '. ' + issue + '\n';
    });
  }
  
  ui.alert(report);
}

function showDocumentation() {
  var ui = SpreadsheetApp.getUi();
  var docs = '📖 SHAMROCK AUTOMATION SYSTEM\n';
  docs += '═══════════════════════════════\n\n';
  docs += 'QUICK START:\n\n';
  docs += '1. Complete configuration:\n';
  docs += '   • Set up Script Properties (⚙️ Settings)\n';
  docs += '   • Update CONFIG.gs with your column numbers\n';
  docs += '   • Fill in company phone number\n\n';
  docs += '2. Install triggers:\n';
  docs += '   • System Management > Install Automation Triggers\n\n';
  docs += '3. Test the system:\n';
  docs += '   • Run "Check Configuration" to verify setup\n';
  docs += '   • Use "Test Email Parser" with a sample email\n\n';
  docs += 'DAILY USAGE:\n\n';
  docs += '• The system runs automatically in the background\n';
  docs += '• Check Slack #court-dates for notifications\n';
  docs += '• View "Court Date Status" for upcoming dates\n\n';
  docs += '═══════════════════════════════\n';
  docs += 'For detailed help, contact your developer.';
  
  ui.alert(docs);
}

function showErrorLog() {
  var ui = SpreadsheetApp.getUi();
  
  ui.alert('📋 ERROR LOG\n\n' +
           'To view the detailed execution log:\n\n' +
           '1. Click "Extensions" in the menu\n' +
           '2. Click "Apps Script"\n' +
           '3. Click "Executions" on the left sidebar\n\n' +
           'This shows all script runs, errors, and log messages.');
}

function showAboutDialog() {
  var ui = SpreadsheetApp.getUi();
  var about = '🍀 SHAMROCK BAIL BONDS\n';
  about += 'Automation System v2.0\n';
  about += '═══════════════════════════════\n\n';
  about += '✨ FEATURES:\n\n';
  about += '📄 Phase 1: Paperwork Generation\n';
  about += '  • Automated SignNow document creation\n';
  about += '  • Pre-filled bail bond forms\n';
  about += '  • E-signature workflow\n\n';
  about += '⚖️ Module 1: Court Date Automation\n';
  about += '  • Automatic email monitoring\n';
  about += '  • Court date parsing & tracking\n';
  about += '  • Google Calendar integration\n';
  about += '  • Automated reminders (7d, 3d, 1d)\n';
  about += '  • Slack notifications\n\n';
  about += '🚔 Arrest Scraper\n';
  about += '  • Continuous arrest monitoring\n';
  about += '  • Automated data collection\n';
  about += '  • Lead generation\n\n';
  about += '💰 Module 2: Payment Automation\n';
  about += '  • (Coming soon)\n\n';
  about += '═══════════════════════════════\n';
  about += 'Built with Google Apps Script\n';
  about += 'Powered by ☕ and determination';
  
  ui.alert(about);
}
