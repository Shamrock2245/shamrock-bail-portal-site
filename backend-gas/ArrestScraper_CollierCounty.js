/**
 * ArrestScraper_CollierCounty.gs
 * 
 * Production-grade Google Apps Script module for scraping arrest data from
 * Collier County Sheriff's Office (Florida).
 * 
 * Target site: https://ww2.colliersheriff.org/arrestsearch/Searchmobile.aspx
 * 
 * This module handles ASP.NET WebForms with VIEWSTATE, EVENTVALIDATION, and
 * Telerik controls. It mimics mobile browser behavior to search and parse
 * arrest records from the HTML results table.
 * 
 * Part of: Shamrock Bail Bonds automation project
 * Author: Generated for shamrock-automations Apps Script project
 * Date: November 20, 2025
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const COLLIER_BASE_URL = 'https://www2.colliersheriff.org';
const COLLIER_SEARCH_URL = 'https://www2.colliersheriff.org/arrestsearch/Report.aspx';

// Mobile User-Agent (iPhone Safari) - mimics real mobile browser
const COLLIER_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

// TODO: Paste the actual "Today's Arrests" ClientState JSON blob from Charles Proxy capture here
// This should be the value of brdTodayArrests_ClientState when "Today's Arrests" is selected
const TODAYS_ARRESTS_CLIENT_STATE = '{"value":"0"}'; // PLACEHOLDER - update from Charles capture

// TODO: If there's a specific button field name from Charles capture, update here
const SEARCH_BUTTON_FIELD = 'btnSearch';
const SEARCH_BUTTON_VALUE = 'Search';

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Convenience test function for "Today's Arrests" search.
 * 
 * This mimics the mobile UI's "Today's Arrests" toggle and logs the results.
 * Use this to verify the scraper is working correctly.
 * 
 * @returns {void}
 */
function runCollierTodayArrestsTest() {
  Logger.log('=== Collier County: Today\'s Arrests Test ===');
  
  try {
    const rows = runCollierSearch({ todaysArrests: true });
    
    Logger.log('Success! Retrieved ' + rows.length + ' rows (including header).');
    Logger.log('Results:');
    Logger.log(JSON.stringify(rows, null, 2));
    
  } catch (error) {
    Logger.log('ERROR: ' + error.message);
    Logger.log('Stack: ' + error.stack);
  }
}

/**
 * Core entrypoint for Collier County arrest search.
 * 
 * Performs a search on the Collier County Sheriff's arrest database and
 * returns parsed results as a 2D array (rows and columns).
 * 
 * @param {Object} options - Search parameters
 * @param {string} [options.firstName] - First name to search
 * @param {string} [options.lastName] - Last name to search
 * @param {boolean} [options.todaysArrests] - If true, search for today's arrests only
 * @returns {Array<Array<string>>} 2D array where each row is an array of cell strings
 *   Example: [["Name", "Booking #", ...], ["DOE, JOHN", "123456", ...], ...]
 * @throws {Error} If HTTP request fails or parsing fails
 */
function runCollierSearch(options) {
  options = options || {};
  
  Logger.log('Starting Collier County search with options: ' + JSON.stringify(options));
  
  // Step 1: GET the search form page
  const getResp = getSearchPage_();
  const getHtml = getResp.getContentText();
  
  // Step 2: Extract cookies from GET response
  const cookies = getCookies_(getResp);
  const cookieHeader = cookies.join('; ');
  
  Logger.log('Extracted ' + cookies.length + ' cookies from initial GET');
  
  // Step 3: Parse all form inputs from the GET HTML
  const basePayload = extractAllInputs_(getHtml);
  
  Logger.log('Extracted ' + Object.keys(basePayload).length + ' form inputs');
  
  // Step 4: Apply search options to the payload
  applySearchOptions_(basePayload, options);
  
  // Step 5: POST the search
  const postResp = postSearch_(basePayload, cookieHeader);
  const resultsHtml = postResp.getContentText();
  
  // Step 6: Parse the results table
  const rows = parseFirstHtmlTableToRows_(resultsHtml);
  
  Logger.log('Parsed ' + rows.length + ' rows from results table');
  
  return rows;
}

// ============================================================================
// HTTP OPERATIONS
// ============================================================================

/**
 * Performs GET request to the search page.
 * 
 * @returns {HTTPResponse} The response object
 * @throws {Error} If request fails or returns non-200 status
 * @private
 */
function getSearchPage_() {
  Logger.log('GET: ' + COLLIER_SEARCH_URL);
  
  const options = {
    method: 'get',
    headers: {
      'User-Agent': COLLIER_USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    },
    muteHttpExceptions: true,
    followRedirects: true
  };
  
  const resp = UrlFetchApp.fetch(COLLIER_SEARCH_URL, options);
  const statusCode = resp.getResponseCode();
  
  if (statusCode !== 200) {
    const snippet = resp.getContentText().substring(0, 500);
    throw new Error(
      'GET request failed with status ' + statusCode + '. ' +
      'Response snippet: ' + snippet
    );
  }
  
  Logger.log('GET successful (200 OK)');
  return resp;
}

/**
 * Performs POST request to submit the search form.
 * 
 * @param {Object} payload - Form data to POST
 * @param {string} cookieHeader - Cookie header string
 * @returns {HTTPResponse} The response object (after redirects)
 * @throws {Error} If request fails or returns error status
 * @private
 */
function postSearch_(payload, cookieHeader) {
  Logger.log('POST: ' + COLLIER_SEARCH_URL);
  
  const options = {
    method: 'post',
    payload: payload,
    headers: {
      'User-Agent': COLLIER_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader,
      'Referer': COLLIER_SEARCH_URL,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Origin': COLLIER_BASE_URL
    },
    muteHttpExceptions: true,
    followRedirects: true
  };
  
  const resp = UrlFetchApp.fetch(COLLIER_SEARCH_URL, options);
  const statusCode = resp.getResponseCode();
  
  // Accept 2xx and 3xx status codes (redirects are followed automatically)
  if (statusCode < 200 || statusCode >= 400) {
    const snippet = resp.getContentText().substring(0, 500);
    throw new Error(
      'POST request failed with status ' + statusCode + '. ' +
      'Response snippet: ' + snippet
    );
  }
  
  Logger.log('POST successful (status ' + statusCode + ')');
  return resp;
}

// ============================================================================
// PAYLOAD MANIPULATION
// ============================================================================

/**
 * Applies search options to the base payload.
 * 
 * Modifies the payload object in-place to include search parameters and
 * button click simulation.
 * 
 * @param {Object} payload - Base payload extracted from form inputs
 * @param {Object} options - Search options from runCollierSearch
 * @private
 */
function applySearchOptions_(payload, options) {
  // Apply first name if provided
  if (options.firstName && 'txtFirstName' in payload) {
    payload.txtFirstName = options.firstName;
    Logger.log('Applied firstName: ' + options.firstName);
  }
  
  // Apply last name if provided
  if (options.lastName && 'txtLastName' in payload) {
    payload.txtLastName = options.lastName;
    Logger.log('Applied lastName: ' + options.lastName);
  }
  
  // Apply "Today's Arrests" toggle if requested
  if (options.todaysArrests) {
    // TODO: Update this field name and value based on Charles Proxy capture
    // The field name might be brdTodayArrests_ClientState or similar
    if ('brdTodayArrests_ClientState' in payload) {
      payload.brdTodayArrests_ClientState = TODAYS_ARRESTS_CLIENT_STATE;
      Logger.log('Applied todaysArrests ClientState');
    }
    
    // Some sites use a checkbox or radio button value
    if ('chkCustodyOnly_ClientState' in payload) {
      // Adjust as needed based on Charles capture
      // payload.chkCustodyOnly_ClientState = '{"value":"true"}';
    }
  }
  
  // Simulate button click (if the form uses a button field)
  // TODO: Verify the exact field name from Charles Proxy capture
  if (SEARCH_BUTTON_FIELD) {
    payload[SEARCH_BUTTON_FIELD] = SEARCH_BUTTON_VALUE;
    Logger.log('Applied search button: ' + SEARCH_BUTTON_FIELD);
  }
  
  // Some ASP.NET forms use __EVENTTARGET instead of a button field
  // Uncomment and adjust if needed based on Charles capture:
  // if ('__EVENTTARGET' in payload) {
  //   payload.__EVENTTARGET = 'btnSearch';
  // }
  // if ('__EVENTARGUMENT' in payload) {
  //   payload.__EVENTARGUMENT = '';
  // }
}

// ============================================================================
// PARSING UTILITIES
// ============================================================================

/**
 * Extracts Set-Cookie headers from HTTP response.
 * 
 * @param {HTTPResponse} resp - The HTTP response object
 * @returns {Array<string>} Array of cookie strings in "name=value" format
 * @private
 */
function getCookies_(resp) {
  const headers = resp.getAllHeaders();
  const cookies = [];
  
  // Set-Cookie can appear multiple times, so we need to handle it specially
  if (headers['Set-Cookie']) {
    let setCookieHeaders = headers['Set-Cookie'];
    
    // Normalize to array
    if (typeof setCookieHeaders === 'string') {
      setCookieHeaders = [setCookieHeaders];
    }
    
    // Extract just the name=value part (before first semicolon)
    for (let i = 0; i < setCookieHeaders.length; i++) {
      const cookieHeader = setCookieHeaders[i];
      const cookieValue = cookieHeader.split(';')[0].trim();
      if (cookieValue) {
        cookies.push(cookieValue);
      }
    }
  }
  
  return cookies;
}

/**
 * Extracts all form input fields from HTML.
 * 
 * Parses <input> tags and builds an object mapping input names to values.
 * This captures VIEWSTATE, EVENTVALIDATION, ClientState fields, and all
 * other form inputs generically.
 * 
 * @param {string} html - The HTML content to parse
 * @returns {Object} Object mapping input names to values
 * @private
 */
function extractAllInputs_(html) {
  const inputs = {};
  
  // Regex to match <input> tags with name attribute
  // This handles both self-closing and non-self-closing input tags
  const inputRegex = /<input\s+([^>]*?)(?:\/?>|>)/gi;
  
  let match;
  while ((match = inputRegex.exec(html)) !== null) {
    const inputTag = match[1];
    
    // Extract name attribute
    const nameMatch = /name=["']([^"']+)["']/i.exec(inputTag);
    if (!nameMatch) continue;
    
    const name = nameMatch[1];
    
    // Extract value attribute (may be empty)
    const valueMatch = /value=["']([^"']*)["']/i.exec(inputTag);
    const value = valueMatch ? valueMatch[1] : '';
    
    inputs[name] = decodeHtmlEntities_(value);
  }
  
  // Also extract textarea fields (some forms use these)
  const textareaRegex = /<textarea\s+([^>]*?)>(.*?)<\/textarea>/gi;
  while ((match = textareaRegex.exec(html)) !== null) {
    const textareaTag = match[1];
    const textareaContent = match[2];
    
    const nameMatch = /name=["']([^"']+)["']/i.exec(textareaTag);
    if (!nameMatch) continue;
    
    const name = nameMatch[1];
    inputs[name] = decodeHtmlEntities_(textareaContent);
  }
  
  return inputs;
}

/**
 * Parses the first HTML table into a 2D array of rows and cells.
 * 
 * Extracts all rows and cells from the first <table> found in the HTML.
 * Strips tags, decodes entities, and trims whitespace.
 * 
 * @param {string} html - The HTML content containing a table
 * @returns {Array<Array<string>>} 2D array of table data
 * @throws {Error} If no table is found
 * @private
 */
function parseFirstHtmlTableToRows_(html) {
  // Find the first <table>...</table> block
  const tableMatch = /<table[^>]*?>([\s\S]*?)<\/table>/i.exec(html);
  
  if (!tableMatch) {
    throw new Error('No <table> found in HTML. The search may have returned no results or the page structure changed.');
  }
  
  const tableHtml = tableMatch[1];
  const rows = [];
  
  // Extract all <tr>...</tr> blocks
  const trRegex = /<tr[^>]*?>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  
  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const rowHtml = trMatch[1];
    const cells = [];
    
    // Extract all <td>...</td> and <th>...</th> blocks
    const cellRegex = /<t[hd][^>]*?>([\s\S]*?)<\/t[hd]>/gi;
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      let cellContent = cellMatch[1];
      
      // Convert <br> tags to newlines
      cellContent = cellContent.replace(/<br\s*\/?>/gi, '\n');
      
      // Strip all remaining HTML tags
      cellContent = cellContent.replace(/<[^>]+>/g, '');
      
      // Decode HTML entities
      cellContent = decodeHtmlEntities_(cellContent);
      
      // Trim whitespace
      cellContent = cellContent.trim();
      
      cells.push(cellContent);
    }
    
    // Only add non-empty rows
    if (cells.length > 0 && cells.some(cell => cell !== '')) {
      rows.push(cells);
    }
  }
  
  return rows;
}

/**
 * Decodes basic HTML entities.
 * 
 * Handles common entities like &nbsp;, &amp;, &lt;, &gt;, &quot;, &#39;
 * 
 * @param {string} str - String containing HTML entities
 * @returns {string} Decoded string
 * @private
 */
function decodeHtmlEntities_(str) {
  if (!str) return '';
  
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    // Handle numeric entities (e.g., &#160; for nbsp)
    .replace(/&#(\d+);/g, function(match, dec) {
      return String.fromCharCode(dec);
    })
    // Handle hex entities (e.g., &#xA0; for nbsp)
    .replace(/&#x([0-9A-Fa-f]+);/g, function(match, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

// ============================================================================
// ADDITIONAL HELPER FUNCTIONS (if needed in future)
// ============================================================================

/**
 * Formats arrest data rows for standardized output.
 * 
 * This can be used to normalize Collier County data to match the format
 * used by other counties (e.g., Lee County) for consistent internal processing.
 * 
 * TODO: Implement this once we know the exact column structure from Collier results
 * 
 * @param {Array<Array<string>>} rows - Raw table rows from parseFirstHtmlTableToRows_
 * @returns {Array<Object>} Array of standardized arrest record objects
 * @private
 */
function formatArrestData_(rows) {
  // Example implementation (adjust based on actual column structure):
  // 
  // const header = rows[0];
  // const dataRows = rows.slice(1);
  // 
  // return dataRows.map(row => {
  //   return {
  //     name: row[0],
  //     bookingNumber: row[1],
  //     dob: row[2],
  //     arrestDate: row[3],
  //     // ... etc
  //   };
  // });
  
  // For now, just return the raw rows
  return rows;
}