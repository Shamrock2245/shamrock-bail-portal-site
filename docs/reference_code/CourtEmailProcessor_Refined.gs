/**
 * Court Email Processor for Shamrock Bail Bonds - REFINED VERSION
 * 
 * Automatically processes court date and forfeiture emails.
 * Creates calendar events in admin@shamrockbailbonds.biz calendar.
 * Automatically shares events with defendants if their email is found in the system.
 * Posts notifications to Slack channels.
 * 
 * Requirements: 
 * 1. Enable Gmail, Calendar, Sheets, and Drive services in Apps Script.
 * 2. Enable "Drive API" Advanced Service for PDF-to-Text conversion.
 * 
 * Author: Shamrock Bail Bonds & Antigravity AI
 * Version: 3.0 - Enhanced Extraction & Auto-Share
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Master Sheet for Email Lookups
  masterSheetId: '121z5R6Hpqur54GNPC8L26ccfDPLHTJc3_LU6G7IV_0E',
  
  // Calendar configuration
  calendarId: 'admin@shamrockbailbonds.biz', 
  
  // Slack webhook URLs
  slackWebhooks: {
    courtDates: '', // Add webhook URL for #court-dates
    forfeitures: ''  // Add webhook URL for #forfeitures
  },
  
  // Email whitelist
  emailWhitelist: {
    specific: ['infocriminalbonds@leeclerk.org', 'automail@leeclerk.org'],
    domains: ['leeclerk.org', 'collierclerk.com', 'hendryso.org', 'charlotteclerk.com', 'manateeclerk.com', 'sarasotaclerk.com', 'desotoclerk.com', 'hillsboroughclerk.com'],
    patterns: [/.*clerk.*\.org$/i, /.*clerk.*\.gov$/i, /.*county.*\.org$/i, /.*county.*\.gov$/i]
  },
  
  // Processing settings
  maxEmailsPerRun: 15,
  batchSize: 10,
  maxExecutionTime: 240000, // 4 mins
  lookbackDays: 30,
  skipAlreadyProcessed: true,
  preventDuplicates: true,
  
  // Gmail labels
  labels: {
    courtDate: 'Processed - Court Date',
    forfeiture: 'Processed - Forfeiture',
    error: 'Processing Error'
  },
  
  // Calendar event colors
  colors: {
    courtDate: CalendarApp.EventColor.BLUE,
    forfeitureDate: CalendarApp.EventColor.RED,
    forfeitureReceived: CalendarApp.EventColor.ORANGE
  },
  
  // Subject line keywords
  keywords: {
    courtDate: ['SERVICE OF COURT DOCUMENT for Case Number', 'Notice of Appearance', 'Court Date Notice'],
    forfeiture: ['Notice of Forfeiture', 'FORFEITURE']
  }
};

// ============================================================================
// MAIN PROCESSING FUNCTIONS
// ============================================================================

/**
 * Main function to process court emails
 */
function processCourtEmails() {
  const startTime = new Date().getTime();
  
  try {
    Logger.log('🚀 Starting refined court email processor...');
    
    const emails = getUnprocessedEmails(CONFIG.lookbackDays);
    Logger.log(`📧 Found ${emails.length} unprocessed emails`);
    
    if (emails.length === 0) return { processed: 0, skipped: 0, errors: 0 };
    
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    
    const batchSize = Math.min(CONFIG.batchSize, emails.length);
    
    for (let i = 0; i < batchSize; i++) {
      if (new Date().getTime() - startTime > CONFIG.maxExecutionTime) break;
      
      const message = emails[i];
      try {
        Logger.log(`\n[${i + 1}/${batchSize}] Processing: ${message.getSubject()}`);
        const result = processEmail(message);
        if (result.success) processed++;
        else if (result.skipped) skipped++;
        else errors++;
      } catch (error) {
        errors++;
        Logger.log(`❌ Error processing email: ${error.message}`);
        labelEmail(message, CONFIG.labels.error);
      }
    }
    
    Logger.log(`\n📊 Batch complete: ✅ ${processed} | ⏭️ ${skipped} | ❌ ${errors}`);
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
  const isForfeiture = CONFIG.keywords.forfeiture.some(k => subject.includes(k));
  
  return isForfeiture ? processForfeitureEmail(message) : processCourtDateEmail(message);
}

/**
 * Process court date email
 */
function processCourtDateEmail(message) {
  const data = extractCourtDateData(message);
  if (!data) return { success: false, error: 'Extraction failed' };
  
  // Attempt to find defendant email for auto-sharing
  data.defendantEmail = lookupDefendantEmail(data.defendant, data.caseNumber);
  if (data.defendantEmail) {
    Logger.log(`🔍 Found defendant email: ${data.defendantEmail}`);
  }
  
  createCourtDateEvent(data);
  
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
  const data = extractForfeitureData(message);
  if (!data) return { success: false, error: 'Extraction failed' };
  
  createForfeitureEvents(data);
  
  if (CONFIG.slackWebhooks.forfeitures) {
    postToSlack(CONFIG.slackWebhooks.forfeitures, formatForfeitureSlackMessage(data));
  }
  
  labelEmail(message, CONFIG.labels.forfeiture);
  return { success: true };
}

// ============================================================================
// DATA EXTRACTION & LOOKUP
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
      bonds: [], // Add logic if needed
      charges: [],
      emailDate: message.getDate()
    };
  } catch (e) {
    Logger.log(`❌ Extraction error: ${e.message}`);
    return null;
  }
}

/**
 * Extract forfeiture data
 */
function extractForfeitureData(message) {
  try {
    const subject = message.getSubject();
    const body = message.getPlainBody();
    
    // Case Number
    const caseMatch = subject.match(/(\d{2}-[A-Z]+-\d+)/i) || body.match(/Case\s*No\.?\s*[:\s]*(\d{2}-[A-Z]+-\d+)/i);
    const caseNumber = caseMatch ? caseMatch[1] : 'Unknown';
    
    // Defendant
    let defendant = 'Unknown';
    const defendantMatch = body.match(/(?:Parties|Defendant|Name of Defendant|In Re:)\s*[:\s]+([^\n\r,]+)/i);
    if (defendantMatch) defendant = defendantMatch[1].trim();

    // Forfeiture Date (Default to email date if not found)
    let forfeitureDate = message.getDate();
    const dateMatch = body.match(/Forfeiture Date[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i);
    if (dateMatch) {
       forfeitureDate = new Date(dateMatch[1]);
    }

    return {
      caseNumber,
      defendant,
      forfeitureDate,
      emailDate: message.getDate()
    };
  } catch (e) {
    Logger.log(`❌ Forfeiture extraction error: ${e.message}`);
    return null;
  }
}

/**
 * Lookup defendant email in Master Sheet
 */
function lookupDefendantEmail(name, caseNumber) {
  if (!name || name === 'Unknown') return null;
  
  try {
    const ss = SpreadsheetApp.openById(CONFIG.masterSheetId);
    
    // Sheets to check
    const sheetsToCheck = ['Defendant Locations', 'PortalUsers', 'ArrestLeads'];
    const searchName = name.toLowerCase();
    
    for (const sheetName of sheetsToCheck) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      if (data.length < 2) continue;
      
      // Map columns (simplified search)
      const headers = data[0].map(h => h.toString().toLowerCase());
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const caseIdx = headers.findIndex(h => h.includes('case'));
      
      if (emailIdx === -1) continue;
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowEmail = row[emailIdx];
        if (!rowEmail) continue;
        
        // Match by Name OR Case Number
        const rowName = nameIdx !== -1 ? row[nameIdx].toString().toLowerCase() : '';
        const rowCase = caseIdx !== -1 ? row[caseIdx].toString().toLowerCase() : '';
        
        if ((rowName && (rowName.includes(searchName) || searchName.includes(rowName))) || 
            (caseNumber !== 'Unknown' && rowCase && rowCase.includes(caseNumber.toLowerCase()))) {
          return rowEmail;
        }
      }
    }
  } catch (e) {
    Logger.log(`⚠️ Email lookup error: ${e.message}`);
  }
  return null;
}

/**
 * Robust text extraction from PDF
 */
function extractTextFromPDF(attachment) {
  try {
    // Advanced Service Drive API must be enabled
    const resource = {
      title: attachment.getName(),
      mimeType: attachment.getContentType()
    };
    
    // Convert PDF to Google Doc
    const file = Drive.Files.insert(resource, attachment, { ocr: true });
    const doc = DocumentApp.openById(file.id);
    const text = doc.getBody().getText();
    
    // Clean up
    Drive.Files.remove(file.id);
    return text;
  } catch (e) {
    Logger.log(`⚠️ OCR failed, using string fallback: ${e.message}`);
    return attachment.getDataAsString();
  }
}

// ============================================================================
// CALENDAR & SLACK
// ============================================================================

/**
 * Create court date event and share with defendant
 */
function createCourtDateEvent(data) {
  const calendar = CalendarApp.getCalendarById(CONFIG.calendarId);
  if (!calendar) throw new Error('Target calendar not found');
  
  const title = `Court: ${data.defendant} - ${data.caseNumber}`;
  const description = `Court Appearance\n\nDefendant: ${data.defendant}\nCase: ${data.caseNumber}\nRoom: ${data.courtroom}`;
  
  // Duplicate check
  if (CONFIG.preventDuplicates) {
    const existing = calendar.getEventsForDay(data.courtDate);
    if (existing.some(e => e.getTitle() === title)) return;
  }
  
  const options = {
    description: description,
    location: `Courtroom ${data.courtroom}`,
    guests: data.defendantEmail || '', // AUTO-SHARE
    sendInvites: true
  };
  
  const event = calendar.createEvent(title, data.courtDate, new Date(data.courtDate.getTime() + 60 * 60 * 1000), options);
  event.setColor(CONFIG.colors.courtDate);
  Logger.log(`📅 Created & Shared event: ${title}`);
}

/**
 * Create forfeiture events
 */
function createForfeitureEvents(data) {
  const calendar = CalendarApp.getCalendarById(CONFIG.calendarId);
  if (!calendar) throw new Error('Target calendar not found');

  const title = `FORFEITURE: ${data.defendant} - ${data.caseNumber}`;
  const description = `⚠️ NOTICE OF FORFEITURE\n\nDefendant: ${data.defendant}\nCase: ${data.caseNumber}\nDate Issued: ${data.forfeitureDate}`;

  // Duplicate check
  if (CONFIG.preventDuplicates) {
    const existing = calendar.getEventsForDay(data.forfeitureDate);
    if (existing.some(e => e.getTitle() === title)) return;
  }

  const event = calendar.createAllDayEvent(title, data.forfeitureDate, {
    description: description
  });
  event.setColor(CONFIG.colors.forfeitureDate);
  Logger.log(`🚨 Created Forfeiture event: ${title}`);
}

// ... (Rest of the functions: getUnprocessedEmails, labelEmail, postToSlack, etc. remain similar to original)

function getUnprocessedEmails(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const dateStr = Utilities.formatDate(cutoff, "GMT", "yyyy/MM/dd");
  const threads = GmailApp.search(`has:attachment after:${dateStr}`, 0, CONFIG.maxEmailsPerRun);
  const messages = [];
  threads.forEach(t => t.getMessages().forEach(m => {
    if (isFromWhitelistedSender(m.getFrom()) && !isAlreadyProcessed(m) && isCourtEmail(m)) messages.push(m);
  }));
  return messages;
}

function isFromWhitelistedSender(from) {
  const f = from.toLowerCase();
  if (CONFIG.emailWhitelist.specific.some(s => f.includes(s))) return true;
  if (CONFIG.emailWhitelist.domains.some(d => f.includes(`@${d}`))) return true;
  return CONFIG.emailWhitelist.patterns.some(p => p.test(f));
}

function isAlreadyProcessed(m) {
  return m.getThread().getLabels().some(l => Object.values(CONFIG.labels).includes(l.getName()));
}

function isCourtEmail(m) {
  const s = m.getSubject();
  return CONFIG.keywords.courtDate.concat(CONFIG.keywords.forfeiture).some(k => s.includes(k));
}

function labelEmail(m, l) {
  let label = GmailApp.getUserLabelByName(l) || GmailApp.createLabel(l);
  m.getThread().addLabel(label);
}

function postToSlack(url, msg) {
  try {
    UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(msg) });
  } catch (e) { Logger.log(`Slack error: ${e.message}`); }
}

function formatCourtDateSlackMessage(d) {
  return { text: `🏛️ *Court Date Found*\n*Defendant:* ${d.defendant}\n*Case:* ${d.caseNumber}\n*Date:* ${d.courtDate.toLocaleString()}\n*Room:* ${d.courtroom}\n*Shared with:* ${d.defendantEmail || 'None (Email not found)'}` };
}

function formatForfeitureSlackMessage(d) {
  return { text: `🚨 *FORFEITURE NOTICE*\n*Defendant:* ${d.defendant}\n*Case:* ${d.caseNumber}\n*Date:* ${d.forfeitureDate.toLocaleDateString()}` };
}
