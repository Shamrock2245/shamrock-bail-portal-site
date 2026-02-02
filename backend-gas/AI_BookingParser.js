/**
 * AI_BookingParser.js
 * 
 * " The Data Entry Clerk "
 * 
 * Extracts structured data from Booking Sheets (PDFs/Images/Text).
 * Usage: PASS in the base64 string of the file.
 */

/**
 * Extracts entities from a Booking Sheet.
 * @param {string|Object} fileData - Text string OR { mimeType: 'image/png', data: 'base64...' }
 * @returns {Object} Structured data { defendantName, bookingNumber, charges: [], courtDate, bondAmount }
 */
function AI_parseBookingSheet(fileData) {
    console.log("🤖 Parser: Extracting data from booking sheet...");

    let contentToAnalyze = fileData;

    // 1. Detect if input is a URL
    if (typeof fileData === 'string' && fileData.trim().startsWith('http')) {
        console.log(`🔗 URL Detected: ${fileData}`);
        try {
            const response = UrlFetchApp.fetch(fileData.trim(), { muteHttpExceptions: true });
            if (response.getResponseCode() === 200) {
                // Get text content - primitive HTML stripping to save tokens
                let html = response.getContentText();
                // For safety and tokens, truncate if massive
                if (html.length > 50000) html = html.substring(0, 50000);
                contentToAnalyze = "Scraped Webpage Content:\n" + html;
            } else {
                return { success: false, error: `Failed to fetch URL: ${response.getResponseCode()}` };
            }
        } catch (e) {
            return { success: false, error: "URL Fetch Error: " + e.message };
        }
    }

    const systemPrompt = `
    You are a Data Entry Clerk.
    Extract the following fields from the Booking Sheet provided (Image, Text, or HTML).
    
    Fields Required:
    - Defendant Full Name
    - Booking Number (or Arrest #)
    - Arrest Date (YYYY-MM-DD)
    - List of Charges (Array of strings)
    - Total Bond Amount (Number)
    - Next Court Date (YYYY-MM-DD HH:MM) IF present.

    **Output JSON only:**
    {
        "defendantName": "String",
        "bookingNumber": "String",
        "arrestDate": "String",
        "charges": ["Charge 1", "Charge 2"],
        "totalBond": Number,
        "courtDate": "String" | null
    }
    `;

    // Increased tokens for extracting long lists of charges
    const result = callOpenAI(systemPrompt, contentToAnalyze, { jsonMode: true, maxTokens: 1000 });

    if (!result) {
        console.error("Parser failed to extract data. Check OPENAI_API_KEY in Script Properties.");
        return { 
            success: false, 
            error: "AI Extraction Failed - Verify OPENAI_API_KEY is set (run setupOpenAIKey() in OpenAIClient.js)" 
        };
    }

    return { success: true, data: result };
}

/**
 * Test Wrapper for direct execution in IDE
 */
function testBookingParser() {
    // Mock text input
    const mockText = "Booking Report: John Doe, ID: 12345, Arrested: 01/01/2025. Charge: DUI. Bond: $500.";
    const res = AI_parseBookingSheet(mockText);
    console.log(JSON.stringify(res));
}
