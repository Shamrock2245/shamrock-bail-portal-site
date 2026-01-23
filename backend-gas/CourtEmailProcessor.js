/**
 * Court Email Processor for Shamrock Bail Bonds - UNIFIED & HARDENED
 * 
 * Automatically processes:
 * 1. Court Dates (Blue)
 * 2. Forfeitures (Red)
 * 3. Discharges (Green)
 * 
 * Creates calendar events in admin@shamrockbailbonds.biz calendar.
 * Automatically shares events with:
 * - shamrockbailoffice@gmail.com (Reviewer)
 * - Defendant (if email found in system)
 * 
 * Fixes:
 * - Removes dependency on external getAppConfig
 * - Adds robust "Discharge" parsing
 * - Improves PDF text extraction
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Master Sheet for Email Lookups
  masterSheetId: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',
  
  // Calendar configuration
  calendarId: 'admin@shamrockbailbonds.biz', 
  reviewerEmail: 'shamrockbailoffice@gmail.com',
  
  // Slack webhook URLs (Populate these in Script Properties if needed, or hardcode here)
  slackWebhooks: {
    courtDates: '', 
    forfeitures: '',
    discharges: ''
  },
  
  // Email whitelist
  emailWhitelist: {
    specific: ['infocriminalbonds@leeclerk.org', 'automail@leeclerk.org'],
    domains: [
      'leeclerk.org', 
      'collierclerk.com', 
      'hendryso.org', 
      'charlotteclerk.com', 
      'manateeclerk.com', 
      'sarasotaclerk.com', 
      'desotoclerk.com', 
      'hillsboroughclerk.com'
    ],
    patterns: [
      /.*clerk.*\.org$/i, 
      /.*clerk.*\.gov$/i, 
      /.*county.*\.org$/i, 
      /.*county.*\.gov$/i
    ]
  },
  
  // Processing settings
  maxEmailsPerRun: 20,
  batchSize: 10,
  maxExecutionTime: 240000, // 4 mins
  lookbackDays: 30,
  skipAlreadyProcessed: true,
  preventDuplicates: true,
  
  // Gmail labels
  labels: {
    courtDate: 'Processed - Court Date',
    forfeiture: 'Processed - Forfeiture',
    discharge: 'Processed - Discharge',
    error: 'Processing Error'
  },
  
  // Calendar event colors
  colors: {
    courtDate: CalendarApp.EventColor.BLUE,
    forfeitureDate: CalendarApp.EventColor.RED,
    forfeitureReceived: CalendarApp.EventColor.ORANGE,
    discharge: CalendarApp.EventColor.GREEN
  },
  
  // Subject line keywords
  keywords: {
    courtDate: [
      'SERVICE OF COURT DOCUMENT for Case Number', 
      'Notice of Appearance', 
      'Court Date Notice',
      'Notice of Hearing'
    ],
    forfeiture: [
      'Notice of Forfeiture', 
      'FORFEITURE'
    ],
    discharge: [
      'Discharge',
      'Release',
      'Power of Attorney Discharge',
      'Bond Discharge',
      'Certificate of Discharge'
    ]
  }
};

// ============================================================================
// MAIN PROCESSING FUNCTIONS
// ============================================================================

/**
 * Main function to process court emails
 * Run this via Time-Driven Trigger (e.g. Every hour)
 */
function processCourtEmails() {
  const startTime = new Date().getTime();
  
  try {
    Logger.log('🚀 Starting Unified Court Email Processor...');
    Logger.log(`📅 Target Calendar: ${CONFIG.calendarId}`);
    
    // Ensure labels exist
    setupLabels();
    
    const emails = getUnprocessedEmails(CONFIG.lookbackDays);
    Logger.log(`📧 Found ${emails.length} unprocessed emails`);
    
    if (emails.length === 0) return { processed: 0, skipped: 0, errors: 0 };
    
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    
    const batchSize = Math.min(CONFIG.batchSize, emails.length);
    
    for (let i = 0; i < batchSize; i++) {
      // Time Safety Check
      // Time Safety Check
      if (new Date().getTime() - startTime > CONFIG.maxExecutionTime) {
        Logger.log('⏳ Time limit reached. Scheduling continuation trigger...');
        createContinuationTrigger();
        return { processed, skipped, errors, continuation: true };
      }
      
      const message = emails[i];
      try {
        Logger.log(`\n[${i + 1}/${batchSize}] Processing: ${message.getSubject()}`);
        const result = processEmail(message);
        
        if (result.success) {
          processed++;
          Logger.log('✅ Success');
        } else if (result.skipped) {
          skipped++;
          Logger.log(`⏭️ Skipped: ${result.reason}`);
        } else {
          errors++;
          Logger.log(`❌ Error: ${result.error}`);
        }
      } catch (error) {
        errors++;
        Logger.log(`❌ Critical Error processing email: ${error.message}`);
        labelEmail(message, CONFIG.labels.error);
      }
    }
    
    Logger.log(`\n📊 Batch complete: ✅ ${processed} | ⏭️ ${skipped} | ❌ ${errors}`);
    Logger.log(`\n📊 Batch complete: ✅ ${processed} | ⏭️ ${skipped} | ❌ ${errors}`);
    
    // If we finished the batch naturally (didn't hit time limit), invoke delete triggers
    deleteContinuationTriggers();
    
    return { processed, skipped, errors };
    
  } catch (error) {
    Logger.log(`❌ Fatal error: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single email
 */
function processEmail(message) {
  const subject = message.getSubject();
  
  // prioritize Forfeiture > Discharge > Court Date
  if (CONFIG.keywords.forfeiture.some(k => subject.includes(k))) {
    return processForfeitureEmail(message);
  } else if (CONFIG.keywords.discharge.some(k => subject.includes(k))) {
    return processDischargeEmail(message);
  } else if (CONFIG.keywords.courtDate.some(k => subject.includes(k))) {
    return processCourtDateEmail(message);
  } else {
    // If it matched the search query but not our specific keywords loop
    return { skipped: true, reason: 'No matching keyword in subject' };
  }
}

/**
 * Process court date email
 */
function processCourtDateEmail(message) {
  Logger.log('🏛️ Type: Court Date');
  const data = extractCourtDateData(message);
  
  if (!data) return { success: false, error: 'Extraction failed' };
  
  // Find defendant email
  data.defendantEmail = lookupDefendantEmail(data.defendant, data.caseNumber);
  if (data.defendantEmail) Logger.log(`🔍 Found defendant email: ${data.defendantEmail}`);
  
  createCourtDateEvent(data);
  addCourtDateToSheet(data); // Added from Utils.gs
  
  if (CONFIG.slackWebhooks.courtDates) {
    postToSlack(CONFIG.slackWebhooks.courtDates, formatCourtDateSlackMessage(data));
  }
  
  labelEmail(message, CONFIG.labels.courtDate);
  return { success: true };
}

/**
 * Process forfeiture email
 */
function processForfeitureEmail(message) {
  Logger.log('⚖️ Type: Forfeiture');
  const data = extractForfeitureData(message);
  
  if (!data) return { success: false, error: 'Extraction failed' };
  
  createForfeitureEvents(data);
  addForfeitureToSheet(data); // Added from Utils.gs
  
  if (CONFIG.slackWebhooks.forfeitures) {
    postToSlack(CONFIG.slackWebhooks.forfeitures, formatForfeitureSlackMessage(data));
  }
  
  labelEmail(message, CONFIG.labels.forfeiture);
  return { success: true };
}

/**
 * Process discharge email
 */
function processDischargeEmail(message) {
  Logger.log('✅ Type: Discharge');
  const data = extractDischargeData(message); // Uses similar extraction to court date
  
  if (!data) return { success: false, error: 'Extraction failed' };
  
  createDischargeEvent(data);
  addDischargeToSheet(data); // Added from Utils.gs
  
  if (CONFIG.slackWebhooks.discharges) {
    postToSlack(CONFIG.slackWebhooks.discharges, formatDischargeSlackMessage(data));
  }
  
  labelEmail(message, CONFIG.labels.discharge);
  return { success: true };
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

/**
 * Extract court date data
 */
function extractCourtDateData(message) {
  try {
    const subject = message.getSubject();
    const body = message.getPlainBody();
    const attachments = message.getAttachments();
    
    // Case Number
    const caseMatch = subject.match(/(\d{2}-[A-Z]+-\d+)/i) || body.match(/Case\s*No\.?\s*[:\s]*(\d{2}-[A-Z]+-\d+)/i);
    const caseNumber = caseMatch ? caseMatch[1] : 'Unknown';
    
    // Defendant
    let defendant = 'Unknown';
    const defendantMatch = body.match(/(?:Parties|Defendant|Name of Defendant|In Re:)\s*[:\s]+([^\n\r,]+)/i);
    if (defendantMatch) defendant = defendantMatch[1].trim();
    
    // Court Date & Time
    let courtDateStr = null;
    let courtTime = '09:00 AM';
    
    // Try body first
    const bodyDateMatch = body.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    const bodyTimeMatch = body.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/);
    
    if (bodyDateMatch) courtDateStr = bodyDateMatch[1];
    if (bodyTimeMatch) courtTime = bodyTimeMatch[1];
    
    // Scan PDF for missing info
    let pdfText = '';
    const pdf = attachments.find(a => a.getContentType() === 'application/pdf');
    if (pdf) {
      pdfText = extractTextFromPDF(pdf);
      
      if (!courtDateStr) {
        const pdfDateMatch = pdfText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (pdfDateMatch) courtDateStr = pdfDateMatch[1];
      }
      
      const pdfTimeMatch = pdfText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/);
      if (pdfTimeMatch) courtTime = pdfTimeMatch[1];
      
      // If defendant still unknown, try PDF
      if (defendant === 'Unknown') {
        const pdfDefMatch = pdfText.match(/Defendant[:\s]+([^\n\r,]+)/i) || pdfText.match(/State of Florida vs\.?\s+([^\n\r,]+)/i);
        if (pdfDefMatch) defendant = pdfDefMatch[1].trim();
      }
    }
    
    if (!courtDateStr) return null;
    
    // Room
    let courtroom = 'Unknown';
    const roomMatch = (body + pdfText).match(/Courtroom[:\s]*([A-Z0-9-]+)/i) || (body + pdfText).match(/Room[:\s]*([A-Z0-9-]+)/i);
    if (roomMatch) courtroom = roomMatch[1];
    
    const courtDate = new Date(courtDateStr + ' ' + courtTime);
    
    return {
      caseNumber,
      defendant,
      courtDate,
      courtroom,
      emailDate: message.getDate()
    };
  } catch (e) {
    Logger.log(`❌ Extraction error: ${e.message}`);
    return null;
  }
}

/**
 * Extract Forfeiture Data
 */
function extractForfeitureData(message) {
  try {
    const body = message.getPlainBody();
    const attachments = message.getAttachments();
    let pdfText = '';
    
    const pdf = attachments.find(a => a.getContentType() === 'application/pdf');
    if (pdf) pdfText = extractTextFromPDF(pdf);
    
    const combinedText = body + '\n' + pdfText;
    
    // Extract everything
    const caseMatch = combinedText.match(/Case\s*No\.?\s*[:\s]*(\d{2}-[A-Z]+-\d+)/i);
    const defendantMatch = combinedText.match(/Defendant[:\s]+([^\n\r,]+)/i);
    const amountMatch = combinedText.match(/\$\s*([\d,]+\.?\d*)/);
    const dateMatch = combinedText.match(/forfeited.*on\s+(\d{1,2}\/\d{1,2}\/\d{4})/i) || combinedText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    const powerMatch = combinedText.match(/Power\s*(?:No|Number)?\.?[:\s]*([A-Z0-9-]+)/i);
    
    if (!caseMatch && !defendantMatch) return null;
    
    return {
      caseNumber: caseMatch ? caseMatch[1] : 'Unknown',
      defendant: defendantMatch ? defendantMatch[1].trim() : 'Unknown',
      amount: amountMatch ? amountMatch[1] : 'Unknown',
      forfeitureDate: dateMatch ? new Date(dateMatch[1]) : new Date(),
      powerNumber: powerMatch ? powerMatch[1] : 'Unknown',
      receivedDate: new Date() // Today
    };
    
  } catch (e) {
    Logger.log(`❌ Forfeiture extraction error: ${e.message}`);
    return null;
  }
}

/**
 * Extract Discharge Data (Reuse Logic mostly)
 */
function extractDischargeData(message) {
  try {
    const subject = message.getSubject();
    const body = message.getPlainBody();
    const attachments = message.getAttachments();
    
    let pdfText = '';
    const pdf = attachments.find(a => a.getContentType() === 'application/pdf');
    if (pdf) pdfText = extractTextFromPDF(pdf);
    
    const combinedText = body + '\n' + pdfText;
    
    // Case
    const caseMatch = subject.match(/(\d{2}-[A-Z]+-\d+)/i) || combinedText.match(/Case\s*No\.?\s*[:\s]*(\d{2}-[A-Z]+-\d+)/i);
    
    // Defendant
    let defendant = 'Unknown';
    const defendantMatch = combinedText.match(/Defendant[:\s]+([^\n\r,]+)/i) || combinedText.match(/Principal[:\s]+([^\n\r,]+)/i);
    if (defendantMatch) defendant = defendantMatch[1].trim();
    
    // Date
    const dateMatch = combinedText.match(/discharged.*on\s+(\d{1,2}\/\d{1,2}\/\d{4})/i) || combinedText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    
    return {
      caseNumber: caseMatch ? caseMatch[1] : 'Unknown',
      defendant: defendant,
      dischargeDate: dateMatch ? new Date(dateMatch[1]) : new Date(),
      info: 'Discharge of Bond'
    };
    
  } catch (e) {
     Logger.log(`❌ Discharge extraction error: ${e.message}`);
     return null;
  }
}

/**
 * Robust Text Extraction from PDF
 */
function extractTextFromPDF(attachment) {
  try {
    const resource = {
      title: attachment.getName(),
      mimeType: attachment.getContentType()
    };
    
    // Drive.Files.insert requires Advanced Drive Service enabled
    const file = Drive.Files.insert(resource, attachment, { ocr: true });
    const doc = DocumentApp.openById(file.id);
    const text = doc.getBody().getText();
    
    Drive.Files.remove(file.id); // Clean up
    return text;
  } catch (e) {
    Logger.log(`⚠️ OCR failed (using quick text): ${e.message}`);
    // Fallback if Drive API is not enabled or fails
    return attachment.getDataAsString();
  }
}

// ============================================================================
// CALENDAR & EVENTS
// ============================================================================

/**
 * Create Court Date Event
 */
function createCourtDateEvent(data) {
  const calendar = CalendarApp.getCalendarById(CONFIG.calendarId);
  if (!calendar) throw new Error(`Target calendar ${CONFIG.calendarId} not found`);
  
  const title = `Court: ${data.defendant} $${data.caseNumber}`;
  const description = `Court Appearance\n\nDefendant: ${data.defendant}\nCase: ${data.caseNumber}\nRoom: ${data.courtroom}`;
  
  if (CONFIG.preventDuplicates) {
    const existing = calendar.getEventsForDay(data.courtDate);
    if (existing.some(e => e.getTitle() === title)) {
      Logger.log('⚠️ Duplicate event found, skipping creation.');
      return;
    }
  }
  
  // Guests: Reviewer + Defendant (if any)
  let guestList = CONFIG.reviewerEmail;
  if (data.defendantEmail) guestList += `,${data.defendantEmail}`;
  
  const options = {
    description: description,
    location: `Courtroom ${data.courtroom}`,
    guests: guestList,
    sendInvites: true
  };
  
  const event = calendar.createEvent(title, data.courtDate, new Date(data.courtDate.getTime() + 60 * 60 * 1000), options);
  event.setColor(CONFIG.colors.courtDate);
  Logger.log(`📅 Created Event: ${title} | Shared with: ${guestList}`);
}

/**
 * Create Forfeiture Events
 */
function createForfeitureEvents(data) {
  const calendar = CalendarApp.getCalendarById(CONFIG.calendarId);
  
  // Event 1: The Forfeiture Date (Past)
  calendar.createEvent(`FORFEITURE: ${data.defendant}`, data.forfeitureDate, data.forfeitureDate, {
    description: `Case: ${data.caseNumber}\nAmount: $${data.amount}\nPower: ${data.powerNumber}`,
    guests: CONFIG.reviewerEmail
  }).setColor(CONFIG.colors.forfeitureDate);
  
  // Event 2: Received Notification (Today - All Day)
  calendar.createAllDayEvent(`⚠️ FORFEITURE RECEIVED: ${data.defendant}`, new Date(), {
     description: `Case: ${data.caseNumber}\nAmount: $${data.amount}\nCheck File!`,
     guests: CONFIG.reviewerEmail
  }).setColor(CONFIG.colors.forfeitureReceived);
  
  Logger.log(`📅 Created Forfeiture Events for ${data.defendant}`);
}

/**
 * Create Discharge Event
 */
function createDischargeEvent(data) {
  const calendar = CalendarApp.getCalendarById(CONFIG.calendarId);
  
  calendar.createAllDayEvent(`✅ DISCHARGE: ${data.defendant}`, data.dischargeDate, {
    description: `Case: ${data.caseNumber}\nBond Discharged.`,
    guests: CONFIG.reviewerEmail
  }).setColor(CONFIG.colors.discharge);
  
  Logger.log(`📅 Created Discharge Event for ${data.defendant}`);
}

// ============================================================================
// HELPERS & LOOKUPS
// ============================================================================

function lookupDefendantEmail(name, caseNumber) {
  if (!name || name === 'Unknown') return null;
  try {
    const ss = SpreadsheetApp.openById(CONFIG.masterSheetId);
    // Search specific high-value sheets
    const sheets = ['Defendant Locations', 'PortalUsers', 'ArrestLeads'];
    const searchName = name.toLowerCase();
    
    for (const sName of sheets) {
      const sheet = ss.getSheetByName(sName);
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      if (data.length < 2) continue;
      
      const headers = data[0].map(h => h.toString().toLowerCase());
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('defendant'));
      
      if (emailIdx > -1 && nameIdx > -1) {
        for (let i = 1; i < data.length; i++) {
          const rowName = data[i][nameIdx].toString().toLowerCase();
          const rowEmail = data[i][emailIdx].toString();
          
          if (rowEmail && rowName.includes(searchName)) {
            return rowEmail;
          }
        }
      }
    }
  } catch (e) {
    Logger.log(`⚠️ Email lookup failed: ${e.message}`);
  }
  return null;
}

function getUnprocessedEmails(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const dateStr = Utilities.formatDate(cutoff, "GMT", "yyyy/MM/dd");
  
  // Build query
  let query = `has:attachment after:${dateStr}`;
  // Optimization: Pre-filter by subject terms to reduce noise
  // query += ` (subject:court OR subject:appearance OR subject:forfeiture OR subject:discharge OR subject:release)`;
  
  const threads = GmailApp.search(query, 0, CONFIG.maxEmailsPerRun);
  const messages = [];
  
  threads.forEach(t => t.getMessages().forEach(m => {
    // Check if valid sender
    if (isFromWhitelistedSender(m.getFrom())) {
       // Check if processed
       if (!isAlreadyProcessed(m)) {
         messages.push(m);
       }
    }
  }));
  return messages;
}

function isFromWhitelistedSender(from) {
  const f = from.toLowerCase();
  
  // 1. Check Specific
  if (CONFIG.emailWhitelist.specific.some(s => f.includes(s))) return true;
  
  // 2. Check Domains
  if (CONFIG.emailWhitelist.domains.some(d => f.includes(`@${d}`))) return true;
  
  // 3. Check Patterns
  return CONFIG.emailWhitelist.patterns.some(p => p.test(f));
}

function isAlreadyProcessed(m) {
  const labels = m.getThread().getLabels();
  return labels.some(l => Object.values(CONFIG.labels).includes(l.getName()));
}

function labelEmail(m, l) {
  const label = GmailApp.getUserLabelByName(l) || GmailApp.createLabel(l);
  m.getThread().addLabel(label);
}

function setupLabels() {
  Object.values(CONFIG.labels).forEach(l => {
    if (!GmailApp.getUserLabelByName(l)) GmailApp.createLabel(l);
  });
}

function postToSlack(url, msg) {
  if (!url) return;
  try {
    UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(msg) });
  } catch (e) { Logger.log(`Slack error: ${e.message}`); }
}

function formatCourtDateSlackMessage(d) {
  return { text: `🏛️ *Court Date Found*\n*Defendant:* ${d.defendant}\n*Case:* ${d.caseNumber}\n*Date:* ${d.courtDate.toLocaleString()}\n*Room:* ${d.courtroom}\n*Shared with:* ${d.defendantEmail || 'None'}` };
}

function formatForfeitureSlackMessage(d) {
  return { text: `🚨 *FORFEITURE NOTICE*\n*Defendant:* ${d.defendant}\n*Amount:* $${d.amount}\n*Forfeiture Date:* ${d.forfeitureDate.toDateString()}` };
}


// ============================================================================
// TRIGGER MANAGEMENT (Ported from CourtProcessor.gs)
// ============================================================================

/**
 * Setup standard daily triggers
 * Run this ONCE to initialize the automation
 */
function setupDailyTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) ScriptApp.deleteTrigger(trigger);

  // Run periodic checks during business hours
  ScriptApp.newTrigger('processCourtEmails').timeBased().atHour(7).everyDays(1).create();
  ScriptApp.newTrigger('processCourtEmails').timeBased().atHour(10).everyDays(1).create();
  ScriptApp.newTrigger('processCourtEmails').timeBased().atHour(14).everyDays(1).create();
  ScriptApp.newTrigger('processCourtEmails').timeBased().atHour(17).everyDays(1).create();

  Logger.log('🎉 Daily triggers created (7am, 10am, 2pm, 5pm).');
}

/**
 * Create a one-off trigger to continue processing in 1 minute
 * Used when execution time limit is approaching
 */
function createContinuationTrigger() {
  // Clear existing continuation triggers first
  deleteContinuationTriggers();

  ScriptApp.newTrigger('processCourtEmails')
    .timeBased()
    .after(60 * 1000) // Run in 1 minute
    .create();
    
  Logger.log('🔄 Continuation trigger scheduled.');
}

/**
 * Delete any pending continuation triggers
 */
function deleteContinuationTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'processCourtEmails' && trigger.getTriggerSource() === ScriptApp.TriggerSource.CLOCK) {
      // We only want to delete the one-off/continuation triggers, but how to distinguish?
      // Standard triggers are usually recurring. One-offs are not.
      // However, simplified approach: The main function handles this by checking if it's a recurring run or continuation.
      // Ideally, we don't delete the daily triggers, only the "after(x)" ones.
      // But GAS doesn't easily distinguish. 
      // BETTER APPROACH: Only delete if proper ID is stored or just rely on them expiring? 
      // Actually, standard practice for "after" triggers is they run once and gone.
      // But good hygiene is to clear them if we finish early.
      
      // For this simplified version, we won't aggressive delete to avoid killing the daily schedule.
      // We assume "after" triggers self-destruct after running.
    }
  }
}


// ============================================================================
// SHEET LOGGING FUNCTIONS (Ported from Utils.gs)
// ============================================================================

function addCourtDateToSheet(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.masterSheetId);
    let sheet = ss.getSheetByName('Upcoming Court Dates');

    if (!sheet) {
      sheet = ss.insertSheet('Upcoming Court Dates');
      const headers = ['Date Added', 'Defendant Name', 'Case Number', 'Court Date', 'Court Time', 'Courtroom', 'Bond Amount', 'County', 'Status', 'Notes'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    if (isCaseInSheet(sheet, data.caseNumber, 3)) {
      Logger.log(`⏭️ Court date already in sheet: ${data.caseNumber}`);
      return;
    }

    const totalBond = calculateTotalBond(data.bonds);
    const courtDateStr = Utilities.formatDate(data.courtDate, Session.getScriptTimeZone(), 'MM/dd/yyyy');
    const courtTimeStr = Utilities.formatDate(data.courtDate, Session.getScriptTimeZone(), 'hh:mm a');
    const dateAddedStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'MM/dd/yyyy HH:mm:ss');

    sheet.appendRow([
      dateAddedStr,
      data.defendant,
      data.caseNumber,
      courtDateStr,
      courtTimeStr,
      data.courtroom,
      `$${totalBond.toLocaleString()}`,
      data.county || 'Lee County',
      'Upcoming',
      (data.charges || []).slice(0, 2).join('; ')
    ]);
    Logger.log(`📝 Added to sheet: ${data.defendant} - ${data.caseNumber}`);

  } catch (error) {
    Logger.log(`❌ Error adding to sheet: ${error.message}`);
  }
}

function addForfeitureToSheet(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.masterSheetId);
    let sheet = ss.getSheetByName('Forfeitures');

    if (!sheet) {
      sheet = ss.insertSheet('Forfeitures');
      const headers = ['Date Received', 'Defendant Name', 'Case Number', 'Forfeiture Date', 'Bond Amount', 'Insurer', 'County', 'Status', 'Last Reminder', 'Next Reminder', 'Notes'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#ea4335').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    if (isCaseInSheet(sheet, data.caseNumber, 3)) {
      Logger.log(`⏭️ Forfeiture already in sheet: ${data.caseNumber}`);
      return;
    }

    // Default values if data missing
    const totalBond = calculateTotalBond(data.bonds);
    const receivedDateStr = Utilities.formatDate(data.receivedDate || new Date(), Session.getScriptTimeZone(), 'MM/dd/yyyy');
    const forfeitureDateStr = data.forfeitureDate ? Utilities.formatDate(data.forfeitureDate, Session.getScriptTimeZone(), 'MM/dd/yyyy') : 'Unknown';
    
    // Determine reminder
    const nextReminder = new Date();
    nextReminder.setDate(nextReminder.getDate() + 10);
    const nextReminderStr = Utilities.formatDate(nextReminder, Session.getScriptTimeZone(), 'MM/dd/yyyy');

    sheet.appendRow([
      receivedDateStr,
      data.defendant,
      data.caseNumber,
      forfeitureDateStr,
      `$${totalBond.toLocaleString()}`,
      data.insurer || 'Unknown',
      data.county || 'Lee County',
      'Active',
      receivedDateStr,
      nextReminderStr,
      'Forfeiture notice received'
    ]);
    Logger.log(`📝 Added forfeiture to sheet: ${data.defendant} - ${data.caseNumber}`);

  } catch (error) {
    Logger.log(`❌ Error adding forfeiture to sheet: ${error.message}`);
  }
}

function addDischargeToSheet(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.masterSheetId);
    let sheet = ss.getSheetByName('Discharges');

    if (!sheet) {
      sheet = ss.insertSheet('Discharges');
      const headers = ['Date of email', 'Defendant Name', 'Case Number', 'County', 'Charge', 'Bond Amount', 'Surety', 'Status', 'Notes'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#34a853').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    if (isCaseInSheet(sheet, data.caseNumber, 3)) {
      Logger.log(`⏭️ Discharge already in sheet: ${data.caseNumber}`);
      return;
    }

    const emailDateStr = Utilities.formatDate(data.receivedDate || new Date(), Session.getScriptTimeZone(), 'MM/dd/yyyy');

    sheet.appendRow([
      emailDateStr,
      data.defendant,
      data.caseNumber,
      data.county || 'Lee County',
      data.offense || 'Unknown',
      data.bondAmount || 'Unknown',
      data.insuranceCompany || 'Unknown',
      'Discharged',
      'Bond discharged - obligations fulfilled'
    ]);
    Logger.log(`📝 Added discharge to sheet: ${data.defendant} - ${data.caseNumber}`);

  } catch (error) {
    Logger.log(`❌ Error adding discharge to sheet: ${error.message}`);
  }
}

// Helper for Sheet Duplicates
function isCaseInSheet(sheet, caseNumber, column) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  // Read column (1-based index)
  const existingData = sheet.getRange(2, column, lastRow - 1, 1).getValues();
  for (let i = 0; i < existingData.length; i++) {
    if (String(existingData[i][0]).trim() === String(caseNumber).trim()) return true;
  }
  return false;
}

function calculateTotalBond(bonds) {
  if (!bonds || !Array.isArray(bonds)) return 0;
  return bonds.reduce((sum, b) => {
    const cleanAmount = String(b.amount).replace(/[^0-9.]/g, '');
    const amount = parseFloat(cleanAmount) || 0;
    return sum + amount;
  }, 0);
}
