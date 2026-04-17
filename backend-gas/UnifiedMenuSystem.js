/**
 * =====================================================================
 * UNIFIED MENU SYSTEM — Shamrock Automation
 * =====================================================================
 * Single onOpen() owner. Replaces MenuSystem.js + ComprehensiveMenuSystem.js
 * 
 * 8 Submenus:
 *   1. Paperwork & Data Entry
 *   2. Arrest Scrapers
 *   3. Lead Scoring & Routing
 *   4. Court Automation
 *   5. Reporting & Finance
 *   6. AI Agents
 *   7. System Management
 *   8. Help & Info
 * 
 * @author  Shamrock Automation
 * @version 3.0.0
 * @updated 2026-04-17
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('🍀 Shamrock Automation')

    // ── 1. PAPERWORK & DATA ENTRY ──────────────────────────────────
    .addSubMenu(ui.createMenu('📄 Paperwork & Data Entry')
      .addItem('📝 Open Data Entry Form', 'menu_openDataEntryForm')
      .addItem('📋 Send Selected Row to Form', 'sendSelectedRowToForm')
      .addSeparator()
      .addItem('🔍 Inspect SignNow Template Fields', 'inspectSignNowTemplateFields')
      .addItem('📋 View Field Mapping', 'menu_openFieldMappingSheet')
      .addSeparator()
      .addItem('🧪 Test SignNow Connection', 'testSignNowConnection'))

    // ── 2. ARREST SCRAPERS ─────────────────────────────────────────
    .addSubMenu(ui.createMenu('🚔 Arrest Scrapers')
      .addItem('▶️ Run Lee County Now', 'menu_runLeeScraper')
      .addItem('▶️ Run Collier County Now', 'menu_runCollierScraper')
      .addItem('▶️ Run Hendry County Now', 'menu_runHendryScraper')
      .addItem('▶️ Run Sarasota County Now', 'menu_runSarasotaScraper')
      .addItem('🔄 Run All Counties (The Scout)', 'menu_runAllScrapers')
      .addSeparator()
      .addItem('🔄 Backfill Existing Records (Lee)', 'backfillExistingRecords')
      .addItem('🔍 Check for Status Changes', 'checkForChanges')
      .addItem('🔄 Update In-Custody Status (Active Sheet)', 'updateInCustodyStatus')
      .addSeparator()
      .addItem('📊 View Arrest Stats', 'menu_viewArrestStats')
      .addItem('🔧 Setup Arrest Sheet', 'getOrCreateArrestSheet'))

    // ── 3. LEAD SCORING & ROUTING ──────────────────────────────────
    .addSubMenu(buildLeadScoringMenu_(ui))

    // ── 4. COURT AUTOMATION ────────────────────────────────────────
    .addSubMenu(ui.createMenu('⚖️ Court Automation')
      .addItem('🔍 Process Court Emails Now', 'processCourtDateEmails')
      .addItem('📅 Process Daily Court Reminders', 'processDailyCourtReminders')
      .addItem('📊 View Court Date Status', 'menu_viewCourtDateStatus')
      .addSeparator()
      .addItem('🧪 Test Email Parser', 'menu_testEmailParser')
      .addItem('📧 Test Reminder Email', 'menu_testReminderEmail'))

    // ── 5. REPORTING & FINANCE ─────────────────────────────────────
    .addSubMenu(ui.createMenu('📈 Reporting & Finance')
      .addItem('📊 Generate Liability Report', 'menu_runLiabilityReport')
      .addItem('💰 Run Payment Reconciliation', 'menu_runPaymentRecon')
      .addItem('📋 Generate Bond Report', 'menu_runBondReport')
      .addSeparator()
      .addItem('📊 Send Daily Ops Report Now', 'menu_runDailyOps')
      .addItem('📊 View System Stats', 'menu_viewStats'))

    // ── 6. AI AGENTS ───────────────────────────────────────────────
    .addSubMenu(ui.createMenu('🤖 AI Agents')
      .addItem('🔄 Run The Closer (Drip Campaign)', 'menu_runCloser')
      .addItem('🧪 Test The Closer', 'testTheCloser')
      .addSeparator()
      .addItem('🧪 Test OpenAI Connection', 'testOpenAIConnection')
      .addItem('🧪 Test Grok Connection', 'testGrokConnection'))

    // ── 7. SYSTEM MANAGEMENT ───────────────────────────────────────
    .addSubMenu(ui.createMenu('⚙️ System Management')
      .addItem('🔧 Reinstall All Triggers (8 Core)', 'menu_reinstallTriggers')
      .addItem('📋 View Active Triggers', 'menu_viewTriggers')
      .addItem('🗑️ Remove All Triggers', 'menu_removeTriggers')
      .addSeparator()
      .addItem('🩺 Run System Health Check', 'menu_runHealthCheck')
      .addItem('🔍 Check Configuration', 'menu_checkConfig')
      .addSeparator()
      .addItem('🎨 Style All County Sheets', 'styleAllCountySheets')
      .addSeparator()
      .addItem('🔧 Configure SignNow', 'configureSignNow')
      .addItem('🔧 Configure Slack Webhooks', 'configureSlackWebhook')
      .addItem('🔄 Refresh Token Services', 'installAllTokenRefreshTriggers'))

    // ── 8. HELP & INFO ─────────────────────────────────────────────
    .addSubMenu(ui.createMenu('❓ Help & Info')
      .addItem('📊 View System Status Dashboard', 'menu_showStatusDashboard')
      .addItem('📖 View Documentation', 'menu_showDocs')
      .addItem('🐛 View Error Log', 'menu_showErrorLog')
      .addItem('ℹ️ About Shamrock Automation', 'menu_showAbout'))

    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

/**
 * Build the Lead Scoring submenu, hooking into LeadScoringSystem.js if available.
 */
function buildLeadScoringMenu_(ui) {
  var menu = ui.createMenu('🎯 Lead Scoring & Routing');

  // If LeadScoringSystem exposes its own menu builder, use it
  if (typeof addLeadScoringMenuItems === 'function') {
    addLeadScoringMenuItems(menu);
    menu.addSeparator();
  } else {
    menu.addItem('📊 Score All Leads', 'scoreAllLeads');
  }

  menu
    .addItem('🎯 Sync Qualified Arrests', 'manualSyncQualifiedArrests')
    .addItem('📊 View Qualified Arrests Sheet', 'viewQualifiedArrestsSheet')
    .addItem('🚀 Route Leads to Slack', 'routeLeeArrestLeadsNow')
    .addSeparator()
    .addItem('🔍 Generate Search Links (All Rows)', 'generateAllSearchLinks')
    .addItem('🔍 Generate Search Links (Selected)', 'generateSearchLinksForSelectedRow')
    .addItem('🌐 Open All Search Links (Selected)', 'openAllSearchLinks')
    .addItem('📋 Open Bond Form (Selected Row)', 'openBondFormForSelectedRow');

  return menu;
}


// ====================================================================
// MENU WRAPPER FUNCTIONS
// ====================================================================
// Thin wrappers that add toast feedback before delegating to real logic.
// Named `menu_*` to avoid collisions with the underlying functions.
// ====================================================================

// ── Paperwork ──
function menu_openDataEntryForm() {
  showToast_('📝 Opening data entry form...', 'Paperwork');
  openDataEntryForm();
}

function menu_openFieldMappingSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('SignNow_Current_Fields');
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Field mapping sheet not found. Please run "Inspect SignNow Template Fields" first.');
    return;
  }
  ss.setActiveSheet(sheet);
  showToast_('✅ Showing field mapping reference', 'Paperwork');
}

// ── Scrapers ──
function menu_runLeeScraper() {
  showToast_('🚔 Running Lee County scraper...', 'Arrest Scraper');
  runLeeArrestsNow();
  showToast_('✅ Lee County scraper complete', 'Arrest Scraper');
}

function menu_runCollierScraper() {
  showToast_('🚔 Running Collier County scraper...', 'Arrest Scraper');
  runCollierArrestsNow();
  showToast_('✅ Collier County scraper complete', 'Arrest Scraper');
}

function menu_runHendryScraper() {
  showToast_('🚔 Running Hendry County scraper...', 'Arrest Scraper');
  runHendryArrestsNow();
  showToast_('✅ Hendry County scraper complete', 'Arrest Scraper');
}

function menu_runSarasotaScraper() {
  showToast_('🚔 Running Sarasota County scraper...', 'Arrest Scraper');
  runSarasotaArrestsNow();
  showToast_('✅ Sarasota County scraper complete', 'Arrest Scraper');
}

function menu_runAllScrapers() {
  showToast_('🔄 Running The Scout (all counties)...', 'Arrest Scraper');
  runAllCountyScrapers();
  showToast_('✅ All county scrapers complete', 'Arrest Scraper');
}

function menu_viewArrestStats() {
  viewArrestStats();
}

// ── Court ──
function menu_viewCourtDateStatus() {
  viewCourtDateStatus();
}

function menu_testEmailParser() {
  testEmailParser();
}

function menu_testReminderEmail() {
  testReminderEmail();
}

// ── Reporting ──
function menu_runLiabilityReport() {
  showToast_('📊 Generating liability report...', 'Reporting');
  if (typeof generateLiabilityReport === 'function') {
    generateLiabilityReport();
    showToast_('✅ Liability report complete', 'Reporting');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ BondReportingEngine.js not loaded.\n\nThe generateLiabilityReport function is not available.');
  }
}

function menu_runPaymentRecon() {
  showToast_('💰 Running payment reconciliation...', 'Reporting');
  if (typeof runPaymentPlanReconciliation === 'function') {
    runPaymentPlanReconciliation();
    showToast_('✅ Payment reconciliation complete', 'Reporting');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ PaymentPlanReconciliation.js not loaded.');
  }
}

function menu_runBondReport() {
  showToast_('📋 Generating bond report...', 'Reporting');
  if (typeof generateBondReport === 'function') {
    generateBondReport();
    showToast_('✅ Bond report complete', 'Reporting');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ BondReportingEngine.js not loaded.');
  }
}

function menu_runDailyOps() {
  showToast_('📊 Running daily ops report...', 'Reporting');
  if (typeof sendDailyOpsReport === 'function') {
    sendDailyOpsReport();
    showToast_('✅ Daily ops report sent', 'Reporting');
  } else if (typeof testDailyOpsReport === 'function') {
    testDailyOpsReport();
    showToast_('✅ Daily ops report test sent', 'Reporting');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ DailyOpsReport.js not loaded.');
  }
}

function menu_viewStats() {
  if (typeof getSystemStats === 'function') {
    var stats = getSystemStats();
    SpreadsheetApp.getUi().alert('📊 System Stats\n\n' + JSON.stringify(stats, null, 2));
  } else {
    viewStatus();
  }
}

// ── AI Agents ──
function menu_runCloser() {
  showToast_('🤖 Running The Closer drip campaign...', 'AI Agents');
  if (typeof runTheCloser === 'function') {
    runTheCloser();
    showToast_('✅ The Closer complete', 'AI Agents');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ TheCloser.js not loaded.');
  }
}

// ── System Management ──
function menu_reinstallTriggers() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '🔧 Reinstall All Triggers',
    'This will remove ALL existing triggers and reinstall the 8 core automation triggers.\n\nProceed?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  showToast_('🔧 Installing triggers...', 'System');
  var result = installAllTriggers();
  showToast_('✅ Triggers installed: ' + (result ? result.installed : '8') + '/8', 'System');
}

function menu_viewTriggers() {
  showTriggerDashboard();
}

function menu_removeTriggers() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '🗑️ Remove All Triggers',
    '⚠️ This will remove ALL automation triggers.\n\nThe system will stop running automatically until you reinstall them.\n\nProceed?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  removeAllTriggers();
  showToast_('✅ All triggers removed', 'System');
}

function menu_runHealthCheck() {
  showToast_('🩺 Running system health check...', 'System');
  if (typeof runSystemHealthCheck === 'function') {
    runSystemHealthCheck();
  } else {
    showConfigurationReport();
  }
}

function menu_checkConfig() {
  showConfigurationReport();
}

// ── Help ──
function menu_showStatusDashboard() {
  showSystemStatusDashboard();
}

function menu_showDocs() {
  var ui = SpreadsheetApp.getUi();
  var docs = '📖 SHAMROCK AUTOMATION SYSTEM v3.0\n';
  docs += '═══════════════════════════════════════\n\n';
  docs += 'MENU GUIDE:\n\n';
  docs += '📄 Paperwork — Generate SignNow documents, data entry\n';
  docs += '🚔 Scrapers  — Run county arrest scrapers on demand\n';
  docs += '🎯 Leads     — Score, qualify, and route arrest leads\n';
  docs += '⚖️ Court     — Process court emails, send reminders\n';
  docs += '📈 Reports   — Liability, payments, daily ops\n';
  docs += '🤖 AI Agents — The Closer drip campaigns, AI tests\n';
  docs += '⚙️ System    — Triggers, health checks, configuration\n\n';
  docs += '═══════════════════════════════════════\n';
  docs += 'QUICK START:\n';
  docs += '1. ⚙️ System > Check Configuration\n';
  docs += '2. ⚙️ System > Reinstall All Triggers\n';
  docs += '3. ⚙️ System > Style All County Sheets\n\n';
  docs += 'AUTOMATION RUNS 24/7 AFTER TRIGGERS ARE INSTALLED.\n';
  docs += 'View execution logs: Extensions > Apps Script > Executions';
  ui.alert(docs);
}

function menu_showErrorLog() {
  SpreadsheetApp.getUi().alert(
    '🐛 Error Log\n\n' +
    'To view the detailed execution log:\n\n' +
    '1. Click "Extensions" in the Google Sheets menu\n' +
    '2. Click "Apps Script"\n' +
    '3. Click "Executions" on the left sidebar\n\n' +
    'This shows all script runs, errors, and log messages.'
  );
}

function menu_showAbout() {
  showAboutDialog();
}
