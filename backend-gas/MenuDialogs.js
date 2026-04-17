/**
 * =====================================================================
 * MENU DIALOGS — HTML-Based Status Dashboards
 * =====================================================================
 * Professional branded dialogs replacing raw ui.alert() text walls.
 * 
 * @author  Shamrock Automation
 * @version 3.0.0
 * @updated 2026-04-17
 */

// ====================================================================
// SHARED CSS TEMPLATE
// ====================================================================

var DIALOG_CSS_ = [
  '<style>',
  '  * { margin: 0; padding: 0; box-sizing: border-box; }',
  '  body { font-family: "Segoe UI", "Roboto", -apple-system, sans-serif; background: #0f1a0f; color: #e0e0e0; padding: 20px; }',
  '  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2E7D32; padding-bottom: 15px; }',
  '  .header h1 { color: #4CAF50; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }',
  '  .header .subtitle { color: #81C784; font-size: 12px; margin-top: 4px; }',
  '  .section { background: #1a2e1a; border-radius: 8px; padding: 14px; margin-bottom: 12px; border: 1px solid #2E7D32; }',
  '  .section-title { color: #4CAF50; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }',
  '  .row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #1e3a1e; }',
  '  .row:last-child { border-bottom: none; }',
  '  .label { color: #b0b0b0; font-size: 13px; }',
  '  .value { font-weight: 600; font-size: 13px; }',
  '  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }',
  '  .badge-green { background: #1B5E20; color: #A5D6A7; }',
  '  .badge-red { background: #4a1111; color: #EF9A9A; }',
  '  .badge-yellow { background: #4a3f11; color: #FFF59D; }',
  '  .badge-blue { background: #0D47A1; color: #90CAF9; }',
  '  .footer { text-align: center; color: #666; font-size: 11px; margin-top: 16px; padding-top: 12px; border-top: 1px solid #1e3a1e; }',
  '  table { width: 100%; border-collapse: collapse; }',
  '  th { text-align: left; color: #4CAF50; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 4px; border-bottom: 1px solid #2E7D32; }',
  '  td { padding: 6px 4px; font-size: 12px; border-bottom: 1px solid #1e3a1e; }',
  '</style>'
].join('\n');


// ====================================================================
// 1. SYSTEM STATUS DASHBOARD
// ====================================================================

function showSystemStatusDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var counties = ['Lee', 'Collier', 'Hendry', 'Charlotte', 'Manatee', 'Sarasota', 'Hillsborough', 'DeSoto'];
  var triggers = ScriptApp.getProjectTriggers();

  // Collect county data
  var countyRows = '';
  var totalRecords = 0;
  counties.forEach(function(county) {
    var sheet = ss.getSheetByName(county);
    var count = 0;
    var status = '<span class="badge badge-red">Missing</span>';
    if (sheet) {
      count = Math.max(0, sheet.getLastRow() - 1);
      status = '<span class="badge badge-green">Active</span>';
    }
    totalRecords += count;
    countyRows += '<tr><td>' + county + '</td><td style="text-align:right">' + count.toLocaleString() + '</td><td style="text-align:center">' + status + '</td></tr>';
  });

  // Build trigger summary
  var triggerBadge = triggers.length > 0
    ? '<span class="badge badge-green">✅ ' + triggers.length + ' Active</span>'
    : '<span class="badge badge-red">❌ None</span>';

  var html = '<html><head>' + DIALOG_CSS_ + '</head><body>';
  html += '<div class="header"><h1>🍀 System Status Dashboard</h1><div class="subtitle">Shamrock Automation v3.0</div></div>';

  // Overview section
  html += '<div class="section">';
  html += '<div class="section-title">📊 Overview</div>';
  html += '<div class="row"><span class="label">Total Arrest Records</span><span class="value">' + totalRecords.toLocaleString() + '</span></div>';
  html += '<div class="row"><span class="label">Active Triggers</span><span class="value">' + triggerBadge + '</span></div>';
  html += '<div class="row"><span class="label">County Sheets</span><span class="value">' + counties.length + ' configured</span></div>';
  html += '<div class="row"><span class="label">Last Refreshed</span><span class="value">' + new Date().toLocaleString() + '</span></div>';
  html += '</div>';

  // County table
  html += '<div class="section">';
  html += '<div class="section-title">🚔 County Arrest Data</div>';
  html += '<table><tr><th>County</th><th style="text-align:right">Records</th><th style="text-align:center">Status</th></tr>';
  html += countyRows;
  html += '</table></div>';

  html += '<div class="footer">Shamrock Bail Bonds — Fast. Frictionless. Everywhere.</div>';
  html += '</body></html>';

  var output = HtmlService.createHtmlOutput(html).setWidth(420).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(output, '📊 System Status');
}


// ====================================================================
// 2. TRIGGER DASHBOARD
// ====================================================================

function showTriggerDashboard() {
  var triggers = ScriptApp.getProjectTriggers();
  var activeFunctions = {};
  triggers.forEach(function(t) {
    activeFunctions[t.getHandlerFunction()] = {
      type: String(t.getEventType()),
      id: t.getUniqueId()
    };
  });

  var registry = [
    { name: 'Lee County Scraper',    fn: 'runLeeArrestsNow',               interval: 'Every 1 hour' },
    { name: 'The Scout (Multi)',     fn: 'runAllCountyScrapers',            interval: 'Every 6 hours' },
    { name: 'The Closer',           fn: 'runTheCloser',                    interval: 'Every 30 min' },
    { name: 'Court Email Processor', fn: 'processCourtDateEmails',          interval: 'Every 15 min' },
    { name: 'TG Court Reminders',   fn: 'TG_processCourtDateReminders',    interval: 'Every 30 min' },
    { name: 'TG Weekly Payments',   fn: 'TG_processWeeklyPaymentProgress', interval: 'Mon @ 10 AM' },
    { name: 'Social Auto-Posting',  fn: 'runAutoPostingEngine',            interval: 'Every 5 min' },
    { name: 'Daily Slack Summary',  fn: 'sendDailySummaryToSlack',         interval: 'Daily @ 5 PM' }
  ];

  var rows = '';
  var activeCount = 0;
  registry.forEach(function(reg) {
    var isActive = activeFunctions.hasOwnProperty(reg.fn);
    if (isActive) activeCount++;
    var badge = isActive
      ? '<span class="badge badge-green">✅ Active</span>'
      : '<span class="badge badge-red">❌ Missing</span>';
    rows += '<tr><td>' + reg.name + '</td><td style="font-family:monospace;font-size:11px;color:#888">' + reg.fn + '</td><td>' + reg.interval + '</td><td style="text-align:center">' + badge + '</td></tr>';
  });

  // Also show any "extra" triggers not in the registry
  var extraRows = '';
  triggers.forEach(function(t) {
    var fn = t.getHandlerFunction();
    var isInRegistry = registry.some(function(r) { return r.fn === fn; });
    if (!isInRegistry) {
      extraRows += '<tr><td colspan="3" style="color:#FFF59D">' + fn + '</td><td style="text-align:center"><span class="badge badge-yellow">⚡ Extra</span></td></tr>';
    }
  });

  var html = '<html><head>' + DIALOG_CSS_ + '</head><body>';
  html += '<div class="header"><h1>⚙️ Trigger Dashboard</h1><div class="subtitle">' + activeCount + ' of ' + registry.length + ' core triggers active | ' + triggers.length + ' total triggers</div></div>';

  html += '<div class="section">';
  html += '<div class="section-title">Core Automation Triggers</div>';
  html += '<table><tr><th>Module</th><th>Function</th><th>Schedule</th><th style="text-align:center">Status</th></tr>';
  html += rows;
  html += '</table></div>';

  if (extraRows) {
    html += '<div class="section">';
    html += '<div class="section-title">Additional Triggers</div>';
    html += '<table><tr><th colspan="3">Function</th><th style="text-align:center">Status</th></tr>';
    html += extraRows;
    html += '</table></div>';
  }

  html += '<div class="footer">Run ⚙️ System > Reinstall All Triggers to reset</div>';
  html += '</body></html>';

  var output = HtmlService.createHtmlOutput(html).setWidth(580).setHeight(480);
  SpreadsheetApp.getUi().showModalDialog(output, '⚙️ Triggers');
}


// ====================================================================
// 3. CONFIGURATION REPORT
// ====================================================================

function showConfigurationReport() {
  var checks = [];

  // Script properties
  var props = PropertiesService.getScriptProperties();
  var propKeys = [
    { key: 'SLACK_WEBHOOK_COURT',    label: 'Slack Webhook (Court)' },
    { key: 'TEMP_PDF_FOLDER_ID',     label: 'PDF Temp Folder' },
    { key: 'COMPANY_CALENDAR_ID',    label: 'Company Calendar' },
    { key: 'SIGNNOW_ACCESS_TOKEN',   label: 'SignNow Token' },
    { key: 'OPENAI_API_KEY',         label: 'OpenAI API Key' },
    { key: 'STAFF_TELEGRAM_CHAT_ID', label: 'Staff Telegram Chat ID' },
    { key: 'GAS_WEB_APP_URL',        label: 'GAS Web App URL' }
  ];

  propKeys.forEach(function(p) {
    var val = props.getProperty(p.key);
    checks.push({
      label: p.label,
      status: val ? 'pass' : 'fail',
      detail: val ? '✅ Configured' : '❌ Missing'
    });
  });

  // Triggers
  var triggers = ScriptApp.getProjectTriggers();
  checks.push({
    label: 'Automation Triggers',
    status: triggers.length >= 8 ? 'pass' : (triggers.length > 0 ? 'warn' : 'fail'),
    detail: triggers.length + ' active (' + (triggers.length >= 8 ? 'all core' : 'some missing') + ')'
  });

  // Gmail label
  try {
    var label = GmailApp.getUserLabelByName('CourtDate/Processed');
    checks.push({ label: 'Gmail Court Label', status: label ? 'pass' : 'warn', detail: label ? '✅ Exists' : '⚠️ Will create on first run' });
  } catch (e) {
    checks.push({ label: 'Gmail Court Label', status: 'warn', detail: '⚠️ Cannot check (permissions)' });
  }

  var rows = '';
  var issues = 0;
  checks.forEach(function(c) {
    var badgeClass = c.status === 'pass' ? 'badge-green' : (c.status === 'warn' ? 'badge-yellow' : 'badge-red');
    var icon = c.status === 'pass' ? '✅' : (c.status === 'warn' ? '⚠️' : '❌');
    if (c.status === 'fail') issues++;
    rows += '<div class="row"><span class="label">' + c.label + '</span><span class="badge ' + badgeClass + '">' + c.detail + '</span></div>';
  });

  var html = '<html><head>' + DIALOG_CSS_ + '</head><body>';
  html += '<div class="header"><h1>🔍 Configuration Report</h1><div class="subtitle">';
  html += issues === 0 ? '✅ All systems configured' : '⚠️ ' + issues + ' issue(s) found';
  html += '</div></div>';

  html += '<div class="section">';
  html += '<div class="section-title">System Configuration</div>';
  html += rows;
  html += '</div>';

  html += '<div class="footer">Set missing properties in: Extensions > Apps Script > ⚙️ Project Settings > Script Properties</div>';
  html += '</body></html>';

  var output = HtmlService.createHtmlOutput(html).setWidth(440).setHeight(460);
  SpreadsheetApp.getUi().showModalDialog(output, '🔍 Configuration');
}


// ====================================================================
// 4. ABOUT DIALOG
// ====================================================================

function showAboutDialog() {
  var triggers = ScriptApp.getProjectTriggers();

  var html = '<html><head>' + DIALOG_CSS_ + '</head><body>';
  html += '<div class="header">';
  html += '<h1 style="font-size:28px">🍀</h1>';
  html += '<h1>Shamrock Automation</h1>';
  html += '<div class="subtitle">Version 3.0.0 — Unified Menu System</div>';
  html += '</div>';

  html += '<div class="section">';
  html += '<div class="section-title">The Digital Bail Agency</div>';
  html += '<div class="row"><span class="label">Mission</span><span class="value" style="color:#4CAF50">Fast. Frictionless. Everywhere.</span></div>';
  html += '<div class="row"><span class="label">Active Triggers</span><span class="value">' + triggers.length + '</span></div>';
  html += '<div class="row"><span class="label">AI Agents</span><span class="value">9 Digital Employees</span></div>';
  html += '<div class="row"><span class="label">Counties Covered</span><span class="value">24+ Active</span></div>';
  html += '</div>';

  html += '<div class="section">';
  html += '<div class="section-title">🤖 Agent Roster</div>';
  var agents = [
    { name: 'The Concierge', role: '24/7 Client Support' },
    { name: 'Shannon', role: 'Voice Intake (ElevenLabs)' },
    { name: 'The Clerk', role: 'Booking Scraper & OCR' },
    { name: 'The Analyst', role: 'Risk Assessment' },
    { name: 'The Closer', role: 'Lead Recovery Drip' },
    { name: 'The Investigator', role: 'Background Checks' },
    { name: 'Manus Brain', role: 'Telegram AI' },
    { name: 'The Watchdog', role: 'System Health Monitor' },
    { name: 'Bounty Hunter', role: 'High-Value Lead Surfacing' }
  ];
  agents.forEach(function(a) {
    html += '<div class="row"><span class="label">' + a.name + '</span><span class="value" style="font-size:11px">' + a.role + '</span></div>';
  });
  html += '</div>';

  html += '<div class="footer">Shamrock Bail Bonds — 1528 Broadway, Ft. Myers, FL 33901<br>Built with ☁️ Google Apps Script + ☕ determination</div>';
  html += '</body></html>';

  var output = HtmlService.createHtmlOutput(html).setWidth(420).setHeight(560);
  SpreadsheetApp.getUi().showModalDialog(output, '🍀 About');
}
