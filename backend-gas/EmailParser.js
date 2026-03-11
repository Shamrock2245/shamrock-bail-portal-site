/**
 * ============================================
 * EMAIL PARSER - Extract Court Date Info
 * ============================================
 * This file handles reading emails and PDFs to find court dates.
 */

/**
 * Parse Court Date Email
 * 
 * This function:
 * 1. Gets the latest message from an email thread
 * 2. Extracts the email body text
 * 3. Checks for PDF attachments and extracts their text
 * 4. Uses pattern matching (regex) to find key information
 * 5. Returns a structured object with all the data
 * 
 * @param {GmailThread} thread - The Gmail thread to parse
 * @return {Object|null} Court date data object, or null if parsing failed
 */
function parseCourtDateEmail(thread) {
  
  // Step 1: Get the latest message in the thread
  var messages = thread.getMessages();
  var latestMessage = messages[messages.length - 1];
  
  // Step 2: Get email content
  var subject = latestMessage.getSubject();
  var emailBody = latestMessage.getPlainBody(); // Plain text version
  
  Logger.log('Parsing email with subject: ' + subject);
  
  // Step 3: Check for PDF attachments
  var pdfText = '';
  var attachments = latestMessage.getAttachments();
  
  Logger.log('Found ' + attachments.length + ' attachment(s)');
  
  attachments.forEach(function(attachment) {
    if (attachment.getContentType() === 'application/pdf') {
      Logger.log('Extracting text from PDF: ' + attachment.getName());
      pdfText += extractTextFromPDF(attachment);
    }
  });
  
  // Step 4: Combine all text for parsing
  var fullText = subject + '\n\n' + emailBody + '\n\n' + pdfText;
  
  Logger.log('Full text length: ' + fullText.length + ' characters');
  Logger.log('First 500 characters:\n' + fullText.substring(0, 500));
  
  // Step 5: Extract data using pattern matching
  var courtData = extractCourtDataFromText(fullText);
  
  if (courtData) {
    // Add metadata
    courtData.rawEmailId = latestMessage.getId();
    courtData.rawEmailDate = latestMessage.getDate();
  }
  
  return courtData;
}

/**
 * Extract Court Data From Text
 * 
 * Uses regular expressions (regex) to find specific patterns in text.
 * Regex is like a "search pattern" - it finds text that matches a format.
 * 
 * @param {String} text - The full text to search
 * @return {Object|null} Extracted data or null if required fields missing
 */
function extractCourtDataFromText(text) {
  
  // These are "patterns" that tell the script what to look for
  // Each pattern is explained below
  var patterns = {
    // Case Number: Looks for format like "24-CF-1234" or "2024-CF-12345"
    // \d means "any digit", {2,4} means "2 to 4 digits"
    caseNumber: /(?:Case\s*(?:No|Number|#)?[\s:]*)?(\d{2,4}-[A-Z]{2}-\d{4,5})/i,
    
    // Defendant Name: Looks for "Defendant: John Smith" or "Name: Jane Doe"
    // [A-Z] means capital letter, [a-z]+ means lowercase letters
    defendantName: /(?:Defendant|Name|In\s+(?:the\s+)?(?:case|matter)\s+of)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    
    // Court Date: Looks for dates like "12/25/2024" or "12-25-24"
    courtDate: /(?:Date|Scheduled|Hearing\s+Date)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    
    // Court Time: Looks for times like "9:30 AM" or "14:00"
    courtTime: /(?:Time|at)[\s:]*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i,
    
    // Location: Looks for "Location: Courtroom 3A" or "Room: 205"
    location: /(?:Location|Room|Courtroom|Division|Court)[\s:]*([^\n]{5,50})/i,
    
    // Hearing Type: Looks for "Type: Arraignment" or "Matter: Pre-Trial"
    hearingType: /(?:Hearing\s*Type|Type\s*of\s*Hearing|Matter|Purpose)[\s:]*([^\n]{5,50})/i
  };
  
  // Try to extract each piece of data
  var courtData = {
    caseNumber: extractPattern(text, patterns.caseNumber),
    defendantName: extractPattern(text, patterns.defendantName),
    courtDate: extractPattern(text, patterns.courtDate),
    courtTime: extractPattern(text, patterns.courtTime) || '9:00 AM', // Default if not found
    location: extractPattern(text, patterns.location) || 'Lee County Courthouse', // Default
    hearingType: extractPattern(text, patterns.hearingType) || 'Hearing' // Default
  };
  
  // Validation: We MUST have case number and date at minimum
  if (!courtData.caseNumber || !courtData.courtDate) {
    Logger.log('❌ Missing required fields. Case Number: ' + courtData.caseNumber + 
               ', Court Date: ' + courtData.courtDate);
    return null;
  }
  
  // Normalize date format to YYYY-MM-DD (standard format)
  courtData.courtDate = normalizeDateFormat(courtData.courtDate);
  
  Logger.log('✅ Successfully extracted court data: ' + JSON.stringify(courtData));
  
  return courtData;
}

/**
 * Extract Pattern - Helper function
 * 
 * This searches for a pattern in text and returns the match.
 * 
 * @param {String} text - Text to search in
 * @param {RegExp} pattern - The pattern to look for
 * @return {String|null} The matched text, or null if not found
 */
function extractPattern(text, pattern) {
  var match = text.match(pattern);
  
  if (match && match[1]) {
    return match[1].trim(); // trim() removes extra spaces
  }
  
  return null;
}

/**
 * Normalize Date Format
 * 
 * Converts dates like "12/25/24" or "12-25-2024" to "2024-12-25"
 * 
 * @param {String} dateString - Date in various formats
 * @return {String} Date in YYYY-MM-DD format
 */
function normalizeDateFormat(dateString) {
  try {
    // JavaScript can parse many date formats automatically
    var parsed = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(parsed.getTime())) {
      Logger.log('⚠️ Could not parse date: ' + dateString);
      return dateString; // Return original if parsing fails
    }
    
    // Format as YYYY-MM-DD
    var year = parsed.getFullYear();
    var month = String(parsed.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    var day = String(parsed.getDate()).padStart(2, '0');
    
    return year + '-' + month + '-' + day;
    
  } catch (error) {
    Logger.log('Error normalizing date: ' + error.message);
    return dateString;
  }
}

/**
 * Extract Text From PDF
 * 
 * Uses Google Drive's OCR (Optical Character Recognition) to read text from PDFs.
 * OCR = "reading" text from images/PDFs
 * 
 * @param {GmailAttachment} attachment - The PDF file
 * @return {String} Extracted text
 */
function extractTextFromPDF(attachment) {
  try {
    // Step 1: Get the temp folder from Drive
    var folderId = getScriptProperty('TEMP_PDF_FOLDER_ID');
    var folder = DriveApp.getFolderById(folderId);
    
    // Step 2: Save PDF to Drive temporarily
    var blob = attachment.copyBlob();
    var pdfFile = folder.createFile(blob);
    
    Logger.log('Saved PDF to Drive: ' + pdfFile.getName());
    
    // Step 3: Convert PDF to Google Doc (this triggers OCR automatically)
    var docFile = Drive.Files.insert({
      title: pdfFile.getName() + '_text',
      mimeType: 'application/vnd.google-apps.document'
    }, pdfFile.getBlob(), {
      ocr: true, // Enable OCR
      ocrLanguage: 'en' // English
    });
    
    Logger.log('Converted PDF to Doc with OCR');
    
    // Step 4: Read text from the converted document
    var docText = DocumentApp.openById(docFile.id).getBody().getText();
    
    Logger.log('Extracted ' + docText.length + ' characters from PDF');
    
    // Step 5: Clean up temporary files
    DriveApp.getFileById(docFile.id).setTrashed(true);
    pdfFile.setTrashed(true);
    
    return docText;
    
  } catch (error) {
    Logger.log('❌ PDF extraction error: ' + error.message);
    return ''; // Return empty string on failure
  }
}
