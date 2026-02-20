/**
 * AI_BookingParser.gs
 * 
 * " The Clerk "
 * 
 * Uses OpenAI Vision to extract structured data from booking sheets, mugshots, or arrest URLs.
 */

/**
 * Parses a Booking Sheet or Mugshot Image (Base64) - Supports Single or Multiple Images
 * @param {string|string[]} inputData - Raw base64 string OR Array of base64 strings
 * @returns {Object} Structured defendant data
 */
function AI_parseBookingSheet(inputData) {
  if (!inputData || (Array.isArray(inputData) && inputData.length === 0)) {
    console.warn("🤖 Clerk: No images provided to parser.");
    return { error: "No valid images provided." };
  }

  let images = [];

  // Normalize input to array
  if (Array.isArray(inputData)) {
    images = inputData;
  } else {
    images = [inputData];
  }

  // Filter out invalid/empty image data array items
  images = images.filter(img => img && typeof img === 'string' && img.trim().length > 0);

  if (images.length === 0) {
    console.warn("🤖 Clerk: No valid image data after filtering.");
    return { error: "No valid image data." };
  }

  // Prepare content for OpenAI
  // OpenAIClient now accepts an array of { mimeType, data } objects
  const userContent = images.map(base64Data => {
    let cleanData = base64Data;
    let mimeType = 'image/jpeg'; // Default

    if (base64Data.includes('data:image/')) {
      const parts = base64Data.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      cleanData = parts[1];
    }
    return { mimeType: mimeType, data: cleanData };
  });

  const systemPrompt = `
    You are an expert Data Entry Clerk for a Bail Bonds agency.
    Extract the following information from the provided booking document(s), mugshot(s), or screenshot(s).
    
    **INSTRUCTIONS:**
    1. **Combines Pages**: If multiple images are provided, treat them as pages of the SAME booking event. Combine charges and information into a single record.
    2. **OCR Focus**: IGNORE browser tabs, taskbars, and surrounding UI. Focus ONLY on the booking data.
    3. **Address**: Extract the defendant's FULL home address. If it spans multiple lines, combine them.
    4. **Charges**: Extract ALL charges found. 
       - If a bond amount is listed as $5000.00, return generic number 5000.
    5. **Jail/Facility**: Look for "Housing", "Facility", "Jail", or "Custody" location.
    6. **Court/County**: Look for "Court", "County", or "Jurisdiction" (e.g. "Lee", "Collier", "Charlotte").
    7. **Dates**: Extract Arrest Date and Booking Date.
    
    **ROBUSTNESS**:
    - If a field is missing, return null or empty string.
    - If text is blurry, infer from context.
    - Normalize state to 2-letter code (e.g. FL).
    
    Return ONLY JSON matching this schema:
    {
      "firstName": "String",
      "lastName": "String",
      "middleName": "String or null",
      "dob": "YYYY-MM-DD",
      "bookingNumber": "String",
      "arrestDate": "YYYY-MM-DD or null",
      "jailFacility": "String or null",
      "county": "String (e.g. Lee, Collier, Orange) or null",
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
          "courtDate": "YYYY-MM-DD or null",
          "caseNumber": "String or null" 
        }
      ],
      "notes": "String (Any other relevant info, e.g. 'Out of County Warrant')"
    }
    `;

  console.log(`🤖 Clerk: Analyzing ${images.length} document(s)...`);
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
    Extract defendant information from the provided URL.
    Return ONLY JSON.
    Fields: firstName, lastName, dob, bookingNumber, charges, bondAmount, address.
    `;
  console.log("🤖 Clerk: Analyzing URL " + url);
  const result = callOpenAI(systemPrompt, `Analyze this URL/Image: ${url}`, { jsonMode: true });
  return result;
}
