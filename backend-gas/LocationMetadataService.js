/**
 * LocationMetadataService.js
 * 
 * Handles GPS location and device metadata capture from WhatsApp
 * For compliance and verification purposes
 * 
 * Captures:
 * 1. GPS coordinates (latitude, longitude)
 * 2. Timestamp (UTC)
 * 3. Phone number
 * 4. Device information (from webhook headers)
 * 
 * Note: IMEI is NOT accessible via WhatsApp API due to privacy restrictions
 * 
 * Version: 1.0.0
 * Date: 2026-02-19
 */

// =============================================================================
// LOCATION HANDLING
// =============================================================================

/**
 * Handle incoming location message from WhatsApp or Telegram
 * @param {object} webhookPayload - WhatsApp or Telegram webhook payload
 * @returns {object} - { success: boolean, location: object, message: string }
 */
function handleLocationMessage(webhookPayload) {
  const platform = webhookPayload.platform || 'whatsapp';
  console.log(`Processing location message from ${platform}...`);
  
  try {
    // 1. Extract location data
    const location = extractLocationData(webhookPayload);
    
    if (!location) {
      return {
        success: false,
        message: 'Could not extract location data from webhook'
      };
    }
    
    // 2. Find associated case
    const caseNumber = findCaseByPhone(location.phoneNumber);
    
    if (!caseNumber) {
      console.warn(`No case found for phone: ${location.phoneNumber}`);
      return {
        success: false,
        message: 'No associated case found. Please complete intake first.'
      };
    }
    
    // 3. Extract device metadata
    const metadata = extractDeviceMetadata(webhookPayload);
    
    // 4. Combine location and metadata
    const fullData = {
      ...location,
      ...metadata,
      caseNumber: caseNumber
    };
    
    // 5. Save to Google Drive
    const saveResult = saveLocationMetadata(caseNumber, fullData);
    
    if (!saveResult.success) {
      return {
        success: false,
        message: 'Failed to save location data'
      };
    }
    
    // 6. Log for compliance
    logProcessingEvent('LOCATION_CAPTURED', {
      caseNumber: caseNumber,
      phoneNumber: location.phoneNumber,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp
    });
    
    // 7. Send confirmation to user
    sendLocationConfirmation(location.phoneNumber, caseNumber, location);
    
    return {
      success: true,
      location: fullData,
      message: 'Location captured successfully'
    };
    
  } catch (e) {
    console.error('Location handling error:', e);
    return {
      success: false,
      message: e.message
    };
  }
}

// =============================================================================
// DATA EXTRACTION
// =============================================================================

/**
 * Extract location data from WhatsApp webhook
 */
function extractLocationData(webhookPayload) {
  try {
    // WhatsApp Cloud API location message structure:
    // {
    //   "from": "1234567890",
    //   "timestamp": "1234567890",
    //   "type": "location",
    //   "location": {
    //     "latitude": 26.1234,
    //     "longitude": -81.5678,
    //     "name": "Optional location name",
    //     "address": "Optional address"
    //   }
    // }
    
    if (webhookPayload.type !== 'location' && !webhookPayload.location) {
      return null;
    }
    
    const loc = webhookPayload.location || {};
    const from = webhookPayload.from || webhookPayload.phoneNumber;
    const timestamp = webhookPayload.timestamp 
      ? new Date(parseInt(webhookPayload.timestamp) * 1000).toISOString()
      : new Date().toISOString();
    
    return {
      latitude: loc.latitude,
      longitude: loc.longitude,
      accuracy: loc.accuracy || null,
      name: loc.name || null,
      address: loc.address || null,
      phoneNumber: from,
      timestamp: timestamp
    };
    
  } catch (e) {
    console.error('Error extracting location data:', e);
    return null;
  }
}

/**
 * Extract device metadata from webhook
 */
function extractDeviceMetadata(webhookPayload) {
  try {
    // Available metadata from WhatsApp webhook:
    // - Phone number (from)
    // - Timestamp
    // - Message ID
    // - Profile name
    
    // Note: IMEI, device model, OS version are NOT available via WhatsApp API
    // This is by design for user privacy
    
    return {
      phoneNumber: webhookPayload.from || webhookPayload.phoneNumber,
      profileName: webhookPayload.name || webhookPayload.profile?.name || null,
      messageId: webhookPayload.id || webhookPayload.messageId || null,
      whatsappId: webhookPayload.from || null,
      capturedAt: new Date().toISOString(),
      
      // These would be available if webhook included headers
      // But WhatsApp Cloud API doesn't provide device details
      deviceType: 'WhatsApp (Unknown Device)',
      platform: 'Unknown',
      imei: 'Not Available (Privacy Protected)',
      
      // Note for compliance
      privacyNote: 'Device details (IMEI, model, OS) are not accessible via WhatsApp Cloud API for user privacy protection.'
    };
    
  } catch (e) {
    console.error('Error extracting device metadata:', e);
    return {};
  }
}

// =============================================================================
// DATA STORAGE
// =============================================================================

/**
 * Save location and metadata to Google Drive
 */
function saveLocationMetadata(caseNumber, data) {
  try {
    // 1. Get or create case folder
    const caseFolderId = getOrCreateCaseFolder(caseNumber);
    
    // 2. Create or update metadata.json
    const folder = DriveApp.getFolderById(caseFolderId);
    const fileName = 'metadata.json';
    
    // Check if metadata file exists
    const existingFiles = folder.getFilesByName(fileName);
    let metadata = {};
    
    if (existingFiles.hasNext()) {
      // Load existing metadata
      const file = existingFiles.next();
      const content = file.getBlob().getDataAsString();
      metadata = JSON.parse(content);
    }
    
    // 3. Add location data
    if (!metadata.locations) {
      metadata.locations = [];
    }
    
    metadata.locations.push({
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      name: data.name,
      address: data.address,
      timestamp: data.timestamp,
      capturedAt: data.capturedAt
    });
    
    // 4. Add device metadata (if not already present)
    if (!metadata.device) {
      metadata.device = {
        phoneNumber: data.phoneNumber,
        profileName: data.profileName,
        whatsappId: data.whatsappId,
        deviceType: data.deviceType,
        platform: data.platform,
        imei: data.imei,
        privacyNote: data.privacyNote
      };
    }
    
    // 5. Add case info
    metadata.caseNumber = caseNumber;
    metadata.lastUpdated = new Date().toISOString();
    
    // 6. Save to Drive
    const blob = Utilities.newBlob(
      JSON.stringify(metadata, null, 2),
      'application/json',
      fileName
    );
    
    // Delete old file if exists
    if (existingFiles.hasNext()) {
      while (existingFiles.hasNext()) {
        existingFiles.next().setTrashed(true);
      }
    }
    
    const newFile = folder.createFile(blob);
    
    console.log(`Metadata saved for case: ${caseNumber} (${newFile.getId()})`);
    
    return {
      success: true,
      fileId: newFile.getId(),
      fileUrl: newFile.getUrl()
    };
    
  } catch (e) {
    console.error('Error saving location metadata:', e);
    return {
      success: false,
      error: e.message
    };
  }
}

// =============================================================================
// USER COMMUNICATION
// =============================================================================

/**
 * Send location confirmation to user
 */
function sendLocationConfirmation(phoneNumber, caseNumber, location) {
  try {
    const whatsapp = new WhatsAppCloudAPI();
    
    // Format coordinates for Google Maps link
    const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    
    const message = `✅ **Location received!**

📍 **Coordinates:**
Latitude: ${location.latitude}
Longitude: ${location.longitude}

${location.address ? `Address: ${location.address}\n\n` : ''}[View on Google Maps](${mapsLink})

Location data has been securely recorded for compliance.

🎉 **All verification steps complete!**

Next: Our team will process your bond and contact you with release details.

Questions? Just reply!`;
    
    whatsapp.sendText(phoneNumber, message);
    
    console.log(`Location confirmation sent to: ${phoneNumber}`);
    
  } catch (e) {
    console.error('Error sending location confirmation:', e);
  }
}

/**
 * Request location from user
 * Called after ID verification is complete
 */
function requestLocationShare(phoneNumber, caseNumber) {
  try {
    const whatsapp = new WhatsAppCloudAPI();
    
    const message = `Almost done! One last step for compliance.

📍 **Please share your current location:**

1. Tap the **+** icon (bottom left)
2. Select **Location**
3. Tap **Send Your Current Location**

This helps us verify you're in Florida and completes your verification process.

(This is required by state regulations)`;
    
    whatsapp.sendText(phoneNumber, message);
    
    logProcessingEvent('LOCATION_REQUESTED', {
      caseNumber: caseNumber,
      phoneNumber: phoneNumber,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Location request sent to: ${phoneNumber}`);
    
  } catch (e) {
    console.error('Error requesting location:', e);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Find case number by phone number
 */
function findCaseByPhone(phoneNumber) {
  // Try conversation state first
  const intakeState = getConversationState(phoneNumber);
  if (intakeState && intakeState.data && intakeState.data.caseNumber) {
    return intakeState.data.caseNumber;
  }
  
  // Try photo upload state
  const photoState = getPhotoUploadState(phoneNumber);
  if (photoState && photoState.caseNumber) {
    return photoState.caseNumber;
  }
  
  // Try Sheets lookup
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.openById(config.SPREADSHEET_ID || '');
    const sheet = ss.getSheetByName('Bookings');
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      
      // Search recent rows
      for (let i = data.length - 1; i >= Math.max(1, data.length - 100); i--) {
        const row = data[i];
        // Check if phone number matches (adjust column index as needed)
        if (row.includes(phoneNumber)) {
          return row[0]; // Assuming case number is in first column
        }
      }
    }
  } catch (e) {
    console.warn('Could not search Sheets for case:', e);
  }
  
  return null;
}

/**
 * Get metadata for a case
 */
function getCaseMetadata(caseNumber) {
  try {
    const caseFolderId = getOrCreateCaseFolder(caseNumber);
    const folder = DriveApp.getFolderById(caseFolderId);
    const files = folder.getFilesByName('metadata.json');
    
    if (files.hasNext()) {
      const file = files.next();
      const content = file.getBlob().getDataAsString();
      return JSON.parse(content);
    }
    
    return null;
    
  } catch (e) {
    console.error('Error getting case metadata:', e);
    return null;
  }
}

/**
 * Verify location is in Florida
 */
function isLocationInFlorida(latitude, longitude) {
  // Florida bounding box (approximate)
  const floridaBounds = {
    north: 31.0,
    south: 24.5,
    east: -80.0,
    west: -87.6
  };
  
  return (
    latitude >= floridaBounds.south &&
    latitude <= floridaBounds.north &&
    longitude >= floridaBounds.west &&
    longitude <= floridaBounds.east
  );
}

/**
 * Calculate distance between two coordinates (in miles)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// =============================================================================
// EXPORTS
// =============================================================================

// Functions are global in GAS - no explicit exports needed
