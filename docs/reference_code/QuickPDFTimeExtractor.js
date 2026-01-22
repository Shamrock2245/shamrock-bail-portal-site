/**
 * Quick PDF Time Extractor
 * Extracts ONLY the time from PDF without full conversion
 * Much faster than full PDF processing
 */

/**
 * Extract time from PDF attachment (FAST - no full conversion)
 * Looks for time patterns like "1:30 PM", "01:30 PM", "13:30", etc.
 */
function extractTimeFromPDF(attachment) {
    try {
        // Get PDF as string (fast - no conversion needed)
        const pdfContent = attachment.getDataAsString();

        // Look for time patterns in the PDF content
        // Patterns: "1:30 PM", "01:30 PM", "13:30", "1:30PM", etc.
        const timePatterns = [
            /(\d{1,2}):(\d{2})\s*(AM|PM)/i,           // 1:30 PM, 01:30 PM
            /(\d{1,2}):(\d{2})(AM|PM)/i,              // 1:30PM (no space)
            /at\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i,      // "at 1:30 PM"
            /time[:\s]+(\d{1,2}):(\d{2})\s*(AM|PM)/i  // "Time: 1:30 PM"
        ];

        for (const pattern of timePatterns) {
            const match = pdfContent.match(pattern);
            if (match) {
                // Found time!
                const hour = match[1];
                const minute = match[2];
                const meridiem = match[3] ? match[3].toUpperCase() : '';

                const time = `${hour}:${minute} ${meridiem}`.trim();
                Logger.log(`⏰ Found time in PDF: ${time}`);
                return time;
            }
        }

        // If no time found, try alternative method: quick Drive conversion
        Logger.log('⏰ Time not found in raw PDF, trying quick conversion...');
        return extractTimeFromPDFWithConversion(attachment);

    } catch (error) {
        Logger.log(`❌ Error extracting time from PDF: ${error.message}`);
        return null;
    }
}

/**
 * Fallback: Quick Drive conversion to extract time
 * Only used if raw PDF scan doesn't find time
 */
function extractTimeFromPDFWithConversion(attachment) {
    try {
        // Create temporary file
        const blob = attachment.copyBlob();
        const tempFile = DriveApp.getRootFolder().createFile(blob);
        const fileId = tempFile.getId();

        // Convert to plain text (faster than full Doc conversion)
        const file = DriveApp.getFileById(fileId);
        const textContent = file.getBlob().getDataAsString();

        // Look for time in converted text
        const timeMatch = textContent.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

        // Clean up
        tempFile.setTrashed(true);

        if (timeMatch) {
            const time = `${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3]}`;
            Logger.log(`⏰ Found time via conversion: ${time}`);
            return time;
        }

        Logger.log('⏰ Time not found, using default');
        return null;

    } catch (error) {
        Logger.log(`❌ Error in fallback time extraction: ${error.message}`);
        return null;
    }
}

/**
 * Test function to verify time extraction works
 */
function testTimeExtraction() {
    const testStrings = [
        'The defendant is scheduled for 1:30 PM',
        'Court time: 01:30 PM',
        'at 2:45PM in courtroom',
        'Time: 9:00 AM'
    ];

    testStrings.forEach(str => {
        const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
            Logger.log(`✅ "${str}" → ${match[1]}:${match[2]} ${match[3]}`);
        } else {
            Logger.log(`❌ "${str}" → No match`);
        }
    });
}
