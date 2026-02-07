/**
 * AI_BookingParser.gs
 * 
 * " The Clerk "
 * 
 * Uses OpenAI Vision to extract structured data from booking sheets, mugshots, or arrest URLs.
 */

/**
 * Parses a Booking Sheet or Mugshot Image (Base64)
 * @param {string} base64Data - Raw base64 string (with or without data:image/ prefix)
 * @returns {Object} Structured defendant data
 */
function AI_parseBookingSheet(base64Data) {
    // 1. Clean Base64
    let cleanData = base64Data;
    let mimeType = 'image/jpeg'; // Default

    if (base64Data.includes('data:image/')) {
        const parts = base64Data.split(';base64,');
        mimeType = parts[0].replace('data:', '');
        cleanData = parts[1];
    }

    const systemPrompt = `
    You are an expert Data Entry Clerk for a Bail Bonds agency.
    Extract the following information from the provided booking document, mugshot, or screenshot.
    
    **OCR INSTRUCTIONS:**
    - If the image is a screenshot, IGNORE browser tabs, taskbars, and surrounding UI. Focus ONLY on the booking data.
    - If text is blurry, use context to infer the most likely characters (e.g. '0' vs 'O').
    - Simplify verbose charge descriptions to their core offense (e.g. "POSS CONT SUBS" -> "Possession of Controlled Substance").
    - **Court Dates**: Look for next court appearance, arraignment, or trial dates associated with charges.
    
    Return ONLY JSON matching this schema:
    {
      "firstName": "String",
      "lastName": "String",
      "middleName": "String or null",
      "dob": "YYYY-MM-DD",
      "bookingNumber": "String",
      "address": { 
        "street": "String", 
        "city": "String", 
        "state": "String (2 char)", 
        "zip": "String" 
      },
      "charges": [
        {
          "description": "String",
          "statute": "String or null",
          "degree": "String (M1, M2, F3, F2, F1, PBL) or null",
          "bond": "Number (no currency symbols)",
          "bondType": "String (surety, cash, property) or null",
          "courtDate": "YYYY-MM-DD or null"
        }
      ]
    }
    `;

    const userContent = {
        mimeType: mimeType,
        data: cleanData
    };

    console.log("🤖 Clerk: Reading document...");
    const result = callOpenAI(systemPrompt, userContent, { jsonMode: true });

    if (!result) return { error: "Failed to read document." };
    return result;
}

/**
 * Parses a Public URL (Image or Page)
 * @param {string} url 
 */
function AI_extractBookingFromUrl(url) {
    const systemPrompt = `
    You are an expert Data Entry Clerk.
    Extract defendant information from the provided URL or Image URL.
    Return ONLY JSON.
    
    Fields: firstName, lastName, dob, bookingNumber, charges, bondAmount, address.
    `;

    // OpenAI supports image_url natively in the user content array
    // We need to bypass the standard callOpenAI helper if it doesn't support 'image_url' param directly,
    // BUT helper supports object with mimeType/data.
    // Let's rely on the text helper for now if it's a page, or simple text if it's a known site.
    // If it's an image URL, we can construct the message manually or update callOpenAI.

    // For now, treat as text/analysis request
    console.log("🤖 Clerk: Analyzing URL " + url);

    // Note: Standard GPT-4o cannot "browse" live without tools, but can process image URLs if passed correctly.
    // This implementation assumes the URL is passed as text for context or is a direct image link ref.

    const result = callOpenAI(systemPrompt, `Analyze this URL/Image: ${url}`, { jsonMode: true });
    return result;
}
