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
    6. **Court/County**: Look for "Court", "County", or "Jurisdiction" (e.g. "Lee", "Collier", "Orange", "Charlotte", "Manatee", "Sarasota", "Hendry", "Pinellas", "Glades").
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
      "county": "String (e.g. Lee, Collier, Orange, Charlotte, Manatee, Sarasota, Hendry, Pinellas, Glades) or null",
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
  const result = callOpenAI(systemPrompt, userContent, { jsonMode: true, useKnowledgeBase: true });

  if (!result) return { error: "Failed to read document." };
  return result;
}

/**
 * Parses a Public URL (Image or Page)
 * Detects Lee County Sheriff URLs and calls the public JSON API directly.
 * Falls back to AI extraction for other URLs.
 * @param {string} url 
 * @returns {Object} Structured defendant data matching Clerk schema
 */
function AI_extractBookingFromUrl(url) {
  console.log("🤖 Clerk: Analyzing URL " + url);

  // ── Lee County Sheriff Direct API Path ──
  const leeMatch = url.match(/sheriffleefl\.org\/booking\/?\?id=(\d+)/i);
  if (leeMatch) {
    console.log("🤖 Clerk: Detected Lee County booking URL — using direct API (id=" + leeMatch[1] + ")");
    return fetchLeeCountyBooking(leeMatch[1]);
  }

  // ── Fallback: AI extraction for non-Lee URLs ──
  // NOTE: This approach is limited — GPT cannot fetch URLs. It works best
  // for direct image URLs (e.g. .jpg/.png) where OpenAI Vision can analyze them.
  const systemPrompt = `
    You are an expert Data Entry Clerk.
    Extract defendant information from the provided URL.
    Return ONLY JSON.
    Fields: firstName, lastName, dob, bookingNumber, charges, bondAmount, address.
    `;
  const result = callOpenAI(systemPrompt, `Analyze this URL/Image: ${url}`, { jsonMode: true, useKnowledgeBase: true });
  return result;
}

/**
 * Fetches booking data directly from Lee County Sheriff's public JSON API.
 * Endpoints:
 *   GET /public-api/bookings/{id}         → Defendant profile
 *   GET /public-api/bookings/{id}/charges → Charges array
 * 
 * @param {string} bookingId - The numeric booking ID (e.g. "1021476")
 * @returns {Object} Structured data matching the standard Clerk schema
 */
function fetchLeeCountyBooking(bookingId) {
  const BASE = "https://www.sheriffleefl.org/public-api";
  const headers = {
    "x-requested-with": "XMLHttpRequest",
    "Referer": "https://www.sheriffleefl.org/booking/?id=" + bookingId
  };
  const fetchOpts = { method: "get", headers: headers, muteHttpExceptions: true };

  try {
    // ── 1. Fetch Profile ──
    const profileUrl = BASE + "/bookings/" + bookingId;
    const profileResp = UrlFetchApp.fetch(profileUrl, fetchOpts);
    if (profileResp.getResponseCode() !== 200) {
      console.error("🤖 Clerk: Lee API profile returned " + profileResp.getResponseCode());
      return { error: "Lee County API returned status " + profileResp.getResponseCode() };
    }
    const profile = JSON.parse(profileResp.getContentText());

    // ── 2. Fetch Charges ──
    const chargesUrl = BASE + "/bookings/" + bookingId + "/charges";
    const chargesResp = UrlFetchApp.fetch(chargesUrl, fetchOpts);
    let charges = [];
    if (chargesResp.getResponseCode() === 200) {
      charges = JSON.parse(chargesResp.getContentText());
    } else {
      console.warn("🤖 Clerk: Lee API charges returned " + chargesResp.getResponseCode());
    }

    // ── 3. Parse Address ──
    const rawAddr = profile.address || profile.Address || "";
    const addrParsed = parseLeeAddress(rawAddr);

    // ── 4. Parse Height (stored as "506" → 5'06") ──
    const rawHeight = String(profile.height || "");
    const heightFormatted = rawHeight.length >= 3
      ? rawHeight.slice(0, -2) + "'" + rawHeight.slice(-2) + '"'
      : rawHeight;

    // ── 5. Map to Clerk Schema ──
    const result = {
      firstName: capitalizeWord(profile.givenName || ""),
      lastName: capitalizeWord(profile.surName || ""),
      middleName: capitalizeWord(profile.middleName || "") || null,
      dob: formatLeeDate(profile.birthDate),
      bookingNumber: String(profile.bookingNumber || bookingId),
      arrestDate: formatLeeDate(profile.bookingDate || profile.bookDate),
      jailFacility: profile.housing || profile.facility || null,
      county: "Lee",
      address: addrParsed,
      charges: charges.map(function (c) {
        return {
          description: c.offenseDescription || c.description || "",
          statute: c.offenseCode || c.statute || null,
          degree: c.degree || c.offenseDegree || null,
          bond: parseFloat(c.bondAmount || c.bond || 0),
          bondType: (c.bondTypeName || c.bondType || "").toLowerCase() || null,
          courtDate: formatLeeDate(c.hearingDate || c.courtDate),
          caseNumber: c.caseNumber || c.caseNo || null
        };
      }),
      notes: [
        profile.status ? "Status: " + profile.status : null,
        heightFormatted ? "Height: " + heightFormatted : null,
        profile.weight ? "Weight: " + profile.weight + "lbs" : null,
        profile.race ? "Race: " + profile.race : null,
        profile.sex ? "Sex: " + profile.sex : null
      ].filter(Boolean).join(" | ")
    };

    console.log("🤖 Clerk: Lee County API → " + result.firstName + " " + result.lastName + " | " + charges.length + " charge(s)");
    return result;

  } catch (e) {
    console.error("🤖 Clerk: Lee County API fetch failed — " + e.message);
    return { error: "Lee County API error: " + e.message };
  }
}

// ── Helpers ──

/**
 * Parse a Lee County address string like "1602 CYPRESS DR FORT MYERS FL 33907"
 */
function parseLeeAddress(raw) {
  if (!raw) return { street: "", city: "", state: "FL", zip: "" };
  const str = raw.trim();

  // Try to extract zip (5 digits at end)
  const zipMatch = str.match(/(\d{5})(-\d{4})?$/);
  const zip = zipMatch ? zipMatch[1] : "";
  let rest = zipMatch ? str.slice(0, zipMatch.index).trim() : str;

  // Try to extract state (2 chars before zip)
  const stateMatch = rest.match(/\b([A-Z]{2})$/);
  const state = stateMatch ? stateMatch[1] : "FL";
  rest = stateMatch ? rest.slice(0, stateMatch.index).trim() : rest;

  // Known FL cities in Lee County area
  const cities = [
    "FORT MYERS", "FT MYERS", "FT. MYERS", "CAPE CORAL", "LEHIGH ACRES",
    "BONITA SPRINGS", "ESTERO", "SANIBEL", "NORTH FORT MYERS", "N FORT MYERS",
    "PINE ISLAND", "MATLACHA", "ALVA", "BUCKINGHAM", "GATEWAY"
  ];

  let city = "";
  let street = rest;
  for (var i = 0; i < cities.length; i++) {
    const idx = rest.toUpperCase().lastIndexOf(cities[i]);
    if (idx > 0) {
      street = rest.slice(0, idx).trim();
      city = capitalizeWord(cities[i]);
      break;
    }
  }

  // If no city found, split on last two words as best guess
  if (!city && rest.includes(" ")) {
    const parts = rest.split(/\s+/);
    if (parts.length >= 3) {
      city = capitalizeWord(parts.slice(-2).join(" "));
      street = parts.slice(0, -2).join(" ");
    }
  }

  return { street: capitalizeWord(street), city: city, state: state, zip: zip };
}

/**
 * Format Lee County date strings: "1983-04-25 00:00:00.000" → "1983-04-25"
 */
function formatLeeDate(dateStr) {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  // Already YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  // Try parsing as date
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return Utilities.formatDate(d, "America/New_York", "yyyy-MM-dd");
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * Capitalize first letter of each word, lowercase the rest
 * "FORT MYERS" → "Fort Myers", "JOURDAN" → "Jourdan"
 */
function capitalizeWord(str) {
  if (!str) return "";
  return String(str).replace(/\b\w+/g, function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });
}
