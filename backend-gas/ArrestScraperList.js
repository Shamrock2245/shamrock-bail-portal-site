/**
 * ============================================
 * ARREST SCRAPER LIST - Fetch Recent Bookings
 * ============================================
 * This file fetches the list of recent arrests from the main page
 */

/**
 * Fetch Recent Bookings List
 * 
 * Scrapes the Lee County Sheriff's booking search page
 * to get the list of recent bookings.
 * 
 * @return {Array} Array of booking objects with basic info
 */
function fetchRecentBookingsList() {
  
  Logger.log('🔍 Fetching recent bookings list...');
  
  try {
    // Fetch the search page HTML
    var response = UrlFetchApp.fetch(ARREST_SCRAPER_CONFIG.SEARCH_URL, {
      muteHttpExceptions: true,
      followRedirects: true
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log('❌ Failed to fetch booking page. HTTP ' + response.getResponseCode());
      return [];
    }
    
    var html = response.getContentText();
    
    // The Lee County site loads data dynamically via JavaScript
    // We need to extract the data from the page's JSON or API endpoint
    
    // Check if there's an API endpoint we can call directly
    var apiData = extractBookingsFromAPI();
    
    if (apiData && apiData.length > 0) {
      return apiData;
    }
    
    // Fallback: Parse HTML table
    return parseBookingsFromHTML(html);
    
  } catch (error) {
    Logger.log('❌ Error fetching bookings list: ' + error.message);
    return [];
  }
}

/**
 * Extract Bookings From API
 * 
 * Attempts to fetch booking data from the site's API endpoint
 * (if it exists and is publicly accessible)
 */
function extractBookingsFromAPI() {
  
  try {
    // The Lee County site likely uses an AJAX endpoint
    // Common patterns: /api/bookings, /booking-data, /search-results
    
    var possibleEndpoints = [
      ARREST_SCRAPER_CONFIG.BASE_URL + '/wp-json/booking/recent',
      ARREST_SCRAPER_CONFIG.BASE_URL + '/api/recent-bookings',
      ARREST_SCRAPER_CONFIG.BASE_URL + '/booking-data'
    ];
    
    for (var i = 0; i < possibleEndpoints.length; i++) {
      try {
        var response = UrlFetchApp.fetch(possibleEndpoints[i], {
          muteHttpExceptions: true,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.getResponseCode() === 200) {
          var data = JSON.parse(response.getContentText());
          Logger.log('✅ Found API endpoint: ' + possibleEndpoints[i]);
          return parseAPIResponse(data);
        }
        
      } catch (e) {
        // Try next endpoint
        continue;
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('API extraction failed: ' + error.message);
    return null;
  }
}

/**
 * Parse API Response
 * 
 * Converts API JSON data into standardized booking objects
 */
function parseAPIResponse(data) {
  
  var bookings = [];
  
  // API structure will vary - adapt based on actual response
  // This is a template that you'll customize after seeing real data
  
  if (Array.isArray(data)) {
    data.forEach(function(item) {
      bookings.push({
        bookingNumber: item.booking_number || item.id || '',
        fullName: item.name || item.full_name || '',
        dob: item.dob || item.date_of_birth || '',
        bookingDate: item.booking_date || item.booked_on || '',
        bookingTime: item.booking_time || '',
        currentStatus: item.status || 'In Custody',
        currentFacility: item.facility || item.location || '',
        personId: item.person_id || ''
      });
    });
  }
  
  return bookings;
}

/**
 * Parse Bookings From HTML
 * 
 * Extracts booking data by parsing the HTML table structure
 */
function parseBookingsFromHTML(html) {
  
  var bookings = [];
  
  try {
    // Look for table rows containing booking data
    // The structure typically looks like:
    // <tr>
    //   <td>Name</td>
    //   <td>DOB</td>
    //   <td>Booking info</td>
    //   <td>Status</td>
    // </tr>
    
    // Extract all booking numbers (these are typically in links)
    var bookingNumberPattern = /booking\/\?id=(\d+)/gi;
    var matches = [];
    var match;
    
    while ((match = bookingNumberPattern.exec(html)) !== null) {
      matches.push(match[1]);
    }
    
    Logger.log('Found ' + matches.length + ' booking number(s) in HTML');
    
    // For each booking number, extract associated data from the table row
    matches.forEach(function(bookingNumber) {
      
      // Find the table row containing this booking number
      var rowPattern = new RegExp('<tr[^>]*>[\\s\\S]*?' + bookingNumber + '[\\s\\S]*?<\\/tr>', 'i');
      var rowMatch = html.match(rowPattern);
      
      if (rowMatch) {
        var rowHtml = rowMatch[0];
        
        var booking = {
          bookingNumber: bookingNumber,
          fullName: extractTextBetween(rowHtml, /<td[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/td>/, 1),
          dob: extractTextBetween(rowHtml, /DOB[:\s]*([0-9\/]+)/, 1),
          bookingDate: extractTextBetween(rowHtml, /(\d{2}\/\d{2}\/\d{4})/, 1),
          bookingTime: extractTextBetween(rowHtml, /(\d{1,2}:\d{2}:\d{2}\s*[AP]M)/, 1),
          currentStatus: 'In Custody',
          currentFacility: extractTextBetween(rowHtml, /(JAIL|CORE)[^<]*/, 1),
          personId: ''
        };
        
        bookings.push(booking);
      }
    });
    
    // Remove duplicates
    var uniqueBookings = [];
    var seenNumbers = {};
    
    bookings.forEach(function(booking) {
      if (!seenNumbers[booking.bookingNumber]) {
        uniqueBookings.push(booking);
        seenNumbers[booking.bookingNumber] = true;
      }
    });
    
    Logger.log('✅ Extracted ' + uniqueBookings.length + ' unique booking(s) from HTML');
    
    return uniqueBookings;
    
  } catch (error) {
    Logger.log('❌ HTML parsing error: ' + error.message);
    return [];
  }
}

/**
 * Extract Text Between Pattern
 * 
 * Helper function to extract text using regex
 */
function extractTextBetween(text, pattern, groupIndex) {
  try {
    var match = text.match(pattern);
    if (match && match[groupIndex]) {
      return match[groupIndex].trim().replace(/<[^>]*>/g, ''); // Strip HTML tags
    }
  } catch (e) {
    // Ignore
  }
  return '';
}