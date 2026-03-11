/**
 * IMPROVED PARSING FUNCTIONS
 * Enhanced name and address parsing with suffix handling
 */

/**
 * Parse full name into components with suffix handling
 * Handles: Jr, Sr, II, III, IV, V, etc.
 * Returns: {firstName, middleName, lastName, suffix, fullName}
 */
function parseFullName(nameString) {
  if (!nameString) return {firstName: '', middleName: '', lastName: '', suffix: '', fullName: ''};
  
  var name = String(nameString).trim().replace(/\s+/g, ' ');
  
  // Common suffixes
  var suffixes = ['JR', 'SR', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
                  'JR.', 'SR.', '2ND', '3RD', '4TH', '5TH'];
  
  var suffix = '';
  var nameParts = name.split(' ');
  
  // Check if last part is a suffix
  if (nameParts.length > 1) {
    var lastPart = nameParts[nameParts.length - 1].toUpperCase().replace(/\./g, '');
    if (suffixes.indexOf(lastPart) > -1 || suffixes.indexOf(lastPart + '.') > -1) {
      suffix = nameParts.pop();
    }
  }
  
  // Check for "Last, First Middle" format
  if (name.indexOf(',') > -1) {
    var parts = name.split(',');
    var lastName = parts[0].trim();
    var restParts = parts[1].trim().split(' ');
    
    // Remove suffix if it's in the rest parts
    if (restParts.length > 0) {
      var lastRestPart = restParts[restParts.length - 1].toUpperCase().replace(/\./g, '');
      if (suffixes.indexOf(lastRestPart) > -1 || suffixes.indexOf(lastRestPart + '.') > -1) {
        suffix = restParts.pop();
      }
    }
    
    var firstName = restParts[0] || '';
    var middleName = restParts.slice(1).join(' ');
    
    return {
      firstName: firstName,
      middleName: middleName,
      lastName: lastName,
      suffix: suffix,
      fullName: buildFullNameFromParts(firstName, middleName, lastName, suffix)
    };
  }
  
  // Standard "First Middle Last" format
  if (nameParts.length === 1) {
    return {
      firstName: '',
      middleName: '',
      lastName: nameParts[0],
      suffix: suffix,
      fullName: nameParts[0] + (suffix ? ' ' + suffix : '')
    };
  }
  
  if (nameParts.length === 2) {
    return {
      firstName: nameParts[0],
      middleName: '',
      lastName: nameParts[1],
      suffix: suffix,
      fullName: buildFullNameFromParts(nameParts[0], '', nameParts[1], suffix)
    };
  }
  
  // 3+ parts: First Middle(s) Last
  var firstName = nameParts[0];
  var lastName = nameParts[nameParts.length - 1];
  var middleName = nameParts.slice(1, nameParts.length - 1).join(' ');
  
  return {
    firstName: firstName,
    middleName: middleName,
    lastName: lastName,
    suffix: suffix,
    fullName: buildFullNameFromParts(firstName, middleName, lastName, suffix)
  };
}

/**
 * Build full name from parts (Last, First Middle Suffix)
 */
function buildFullNameFromParts(first, middle, last, suffix) {
  if (!first && !last) return '';
  if (!last) return first + (suffix ? ' ' + suffix : '');
  if (!first) return last + (suffix ? ' ' + suffix : '');
  
  var name = last + ', ' + first;
  if (middle) name += ' ' + middle;
  if (suffix) name += ' ' + suffix;
  
  return name;
}

/**
 * Enhanced address parsing
 * Handles various formats and extracts street, city, state, ZIP
 */
function parseAddress(addressString) {
  if (!addressString) {
    return {street: '', city: '', state: '', zip: ''};
  }
  
  var addr = String(addressString).trim().replace(/\s{2,}/g, ' ');
  
  // Format 1: "123 Main St, Fort Myers, FL 33901"
  var match = addr.match(/^(.+?),\s*([^,]+?),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/i);
  if (match) {
    return {
      street: match[1].trim(),
      city: match[2].trim(),
      state: match[3].toUpperCase(),
      zip: match[4]
    };
  }
  
  // Format 2: "123 Main St Fort Myers FL 33901" (no commas)
  match = addr.match(/^(.+?)\s+([A-Z][A-Za-z\s]+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (match) {
    var street = match[1].trim();
    var cityRaw = match[2].trim();
    var state = match[3].toUpperCase();
    var zip = match[4];
    
    // Try to find where street ends and city begins
    // Look for common street type indicators
    var streetTypes = ['ST', 'STREET', 'AVE', 'AVENUE', 'RD', 'ROAD', 'DR', 'DRIVE', 
                       'LN', 'LANE', 'WAY', 'BLVD', 'BOULEVARD', 'CT', 'COURT', 
                       'CIR', 'CIRCLE', 'TER', 'TERRACE', 'PKWY', 'PARKWAY', 
                       'HWY', 'HIGHWAY', 'PL', 'PLACE', 'TRL', 'TRAIL', 'LOOP'];
    
    var streetParts = street.split(' ');
    var cityParts = cityRaw.split(' ');
    
    // Check if last word of street is a street type
    for (var i = streetParts.length - 1; i >= 0; i--) {
      var word = streetParts[i].toUpperCase().replace(/\./g, '');
      if (streetTypes.indexOf(word) > -1) {
        // Found street type, split here
        var actualStreet = streetParts.slice(0, i + 1).join(' ');
        var actualCity = streetParts.slice(i + 1).concat(cityParts).join(' ');
        return {
          street: actualStreet,
          city: actualCity,
          state: state,
          zip: zip
        };
      }
    }
    
    return {
      street: street,
      city: cityRaw,
      state: state,
      zip: zip
    };
  }
  
  // Format 3: "123 Main St 33901" (just street and ZIP)
  match = addr.match(/^(.+?)\s+(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return {
      street: match[1].trim(),
      city: '',
      state: 'FL', // Default to Florida
      zip: match[2]
    };
  }
  
  // Format 4: Just ZIP code
  match = addr.match(/^(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return {
      street: '',
      city: '',
      state: 'FL',
      zip: match[1]
    };
  }
  
  // Fallback: treat entire string as street
  return {
    street: addr,
    city: '',
    state: '',
    zip: ''
  };
}

/**
 * Test the parsing functions
 */
function testParsing() {
  Logger.log('=== NAME PARSING TESTS ===');
  
  var names = [
    'Smith, John',
    'Smith, John Jr',
    'Smith, John Michael Jr.',
    'John Smith',
    'John Michael Smith',
    'Smith, John M.',
    'SMITH, JOHN JR',
    'Smith, John II'
  ];
  
  names.forEach(function(name) {
    var parsed = parseFullName(name);
    Logger.log(name + ' → First: ' + parsed.firstName + ' | Last: ' + parsed.lastName + ' | Suffix: ' + parsed.suffix);
  });
  
  Logger.log('\n=== ADDRESS PARSING TESTS ===');
  
  var addresses = [
    '123 Main St, Fort Myers, FL 33901',
    '456 Oak Avenue Fort Myers FL 33901',
    '789 Pine Rd 33901',
    '1234 SW 15th Street Fort Myers FL 33901',
    '555 Broadway, Fort Myers, FL 33901-1234'
  ];
  
  addresses.forEach(function(addr) {
    var parsed = parseAddress(addr);
    Logger.log(addr);
    Logger.log('  → Street: ' + parsed.street + ' | City: ' + parsed.city + ' | State: ' + parsed.state + ' | ZIP: ' + parsed.zip);
  });
}

