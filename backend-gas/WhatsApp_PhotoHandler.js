/**
 * WhatsApp_PhotoHandler.js
 * 
 * Handles photo uploads from WhatsApp for ID verification
 * Manages:
 * 1. Media download from WhatsApp Cloud API
 * 2. Photo classification (ID front, ID back, selfie)
 * 3. Google Drive storage
 * 4. Compliance logging
 * 
 * Version: 1.0.0
 * Date: 2026-02-19
 */

// =============================================================================
// PHOTO TYPES
// =============================================================================

const PHOTO_TYPES = {
  ID_FRONT: 'id_front',
  ID_BACK: 'id_back',
  SELFIE: 'selfie',
  OTHER: 'other'
};

const PHOTO_REQUIREMENTS = {
  id_front: {
    name: 'Driver License (Front)',
    required: true,
    description: 'Front of your driver license or state ID'
  },
  id_back: {
    name: 'Driver License (Back)',
    required: true,
    description: 'Back of your driver license or state ID'
  },
  selfie: {
    name: 'Selfie with ID',
    required: true,
    description: 'Photo of you holding your ID next to your face'
  }
};

// =============================================================================
// PHOTO UPLOAD STATE
// =============================================================================

/**
 * Get photo upload state for a phone number
 */
function getPhotoUploadState(phoneNumber) {
  const cache = CacheService.getScriptCache();
  const key = `photos_${phoneNumber}`;
  const cached = cache.get(key);
  
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error('Failed to parse photo upload state:', e);
    }
  }
  
  // New photo upload session
  return {
    phoneNumber: phoneNumber,
    caseNumber: null,
    photos: {
      id_front: null,
      id_back: null,
      selfie: null
    },
    uploadedCount: 0,
    startedAt: new Date().toISOString()
  };
}

/**
 * Update photo upload state
 */
function updatePhotoUploadState(phoneNumber, newState) {
  const cache = CacheService.getScriptCache();
  const key = `photos_${phoneNumber}`;
  
  newState.updatedAt = new Date().toISOString();
  cache.put(key, JSON.stringify(newState), 3600); // 1 hour timeout
  
  console.log(`Photo upload state updated: ${phoneNumber} - ${newState.uploadedCount}/3 photos`);
}

/**
 * Clear photo upload state
 */
function clearPhotoUploadState(phoneNumber) {
  const cache = CacheService.getScriptCache();
  cache.remove(`photos_${phoneNumber}`);
}

// =============================================================================
// MAIN PHOTO HANDLER
// =============================================================================

/**
 * Handle incoming photo from WhatsApp
 * @param {string} from - User's phone number
 * @param {string} mediaId - WhatsApp media ID
 * @param {string} mimeType - Media MIME type
 * @param {string} caption - Optional caption from user
 * @returns {object} - { success: boolean, message: string, complete: boolean }
 */
function handlePhotoUpload(from, mediaId, mimeType, caption) {
  console.log(`Photo upload from ${from}: mediaId=${mediaId}, type=${mimeType}`);
  
  try {
    // 1. Get upload state
    const state = getPhotoUploadState(from);
    
    // 2. Find associated case number
    if (!state.caseNumber) {
      state.caseNumber = findCaseNumberByPhone(from);
      if (!state.caseNumber) {
        return {
          success: false,
          message: "I couldn't find your case. Please complete the intake process first before uploading photos.",
          complete: false
        };
      }
    }
    
    // 3. Determine photo type
    const photoType = determinePhotoType(state, caption);
    
    // 4. Download photo from WhatsApp
    const whatsapp = new WhatsAppCloudAPI();
    const photoBlob = whatsapp.downloadMedia(mediaId);
    
    if (!photoBlob) {
      return {
        success: false,
        message: "Sorry, I couldn't download that photo. Please try sending it again.",
        complete: false
      };
    }
    
    // 5. Save to Google Drive
    const driveResult = savePhotoToDrive(photoBlob, state.caseNumber, photoType);
    
    if (!driveResult.success) {
      return {
        success: false,
        message: "There was an error saving your photo. Please try again.",
        complete: false
      };
    }
    
    // 6. Update state
    state.photos[photoType] = {
      fileId: driveResult.fileId,
      fileUrl: driveResult.fileUrl,
      fileName: driveResult.fileName,
      uploadedAt: new Date().toISOString()
    };
    state.uploadedCount++;
    updatePhotoUploadState(from, state);
    
    // 7. Log for compliance
    logProcessingEvent('PHOTO_UPLOADED', {
      caseNumber: state.caseNumber,
      phoneNumber: from,
      photoType: photoType,
      fileId: driveResult.fileId,
      timestamp: new Date().toISOString()
    });
    
    // 8. Generate response
    const response = generatePhotoUploadResponse(state);
    
    return {
      success: true,
      message: response.message,
      complete: response.complete,
      nextStep: response.nextStep
    };
    
  } catch (e) {
    console.error('Photo upload error:', e);
    return {
      success: false,
      message: "There was an error processing your photo. Please try again or contact support.",
      complete: false
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine photo type based on upload state and caption
 */
function determinePhotoType(state, caption) {
  const lowerCaption = (caption || '').toLowerCase();
  
  // Check caption for hints
  if (lowerCaption.includes('front')) {
    return PHOTO_TYPES.ID_FRONT;
  } else if (lowerCaption.includes('back')) {
    return PHOTO_TYPES.ID_BACK;
  } else if (lowerCaption.includes('selfie') || lowerCaption.includes('me')) {
    return PHOTO_TYPES.SELFIE;
  }
  
  // Determine based on what's missing (sequential upload)
  if (!state.photos.id_front) {
    return PHOTO_TYPES.ID_FRONT;
  } else if (!state.photos.id_back) {
    return PHOTO_TYPES.ID_BACK;
  } else if (!state.photos.selfie) {
    return PHOTO_TYPES.SELFIE;
  }
  
  // All required photos uploaded, treat as additional photo
  return PHOTO_TYPES.OTHER;
}

/**
 * Save photo to Google Drive
 */
function savePhotoToDrive(photoBlob, caseNumber, photoType) {
  try {
    // Get or create case folder
    const caseFolderId = getOrCreateCaseFolder(caseNumber);
    
    // Get or create ID_Verification subfolder
    const idFolderId = getOrCreateSubfolder(caseFolderId, 'ID_Verification');
    
    // Generate filename
    const timestamp = new Date().getTime();
    const extension = getFileExtension(photoBlob.getContentType());
    const fileName = `${photoType}_${timestamp}.${extension}`;
    
    // Save file
    const folder = DriveApp.getFolderById(idFolderId);
    const file = folder.createFile(photoBlob.setName(fileName));
    
    // Set sharing permissions (view only)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    console.log(`Photo saved: ${fileName} (${file.getId()})`);
    
    return {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      fileName: fileName
    };
    
  } catch (e) {
    console.error('Error saving photo to Drive:', e);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Get or create case folder in Google Drive
 */
function getOrCreateCaseFolder(caseNumber) {
  const config = getConfig();
  const parentFolderId = config.GOOGLE_DRIVE_OUTPUT_FOLDER_ID;
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  
  // Check if case folder exists
  const folderName = `Case_${caseNumber}`;
  const existingFolders = parentFolder.getFoldersByName(folderName);
  
  if (existingFolders.hasNext()) {
    return existingFolders.next().getId();
  }
  
  // Create new case folder
  const newFolder = parentFolder.createFolder(folderName);
  console.log(`Created case folder: ${folderName} (${newFolder.getId()})`);
  
  return newFolder.getId();
}

/**
 * Get or create subfolder
 */
function getOrCreateSubfolder(parentFolderId, subfolderName) {
  const parentFolder = DriveApp.getFolderById(parentFolderId);
  
  // Check if subfolder exists
  const existingFolders = parentFolder.getFoldersByName(subfolderName);
  
  if (existingFolders.hasNext()) {
    return existingFolders.next().getId();
  }
  
  // Create new subfolder
  const newFolder = parentFolder.createFolder(subfolderName);
  console.log(`Created subfolder: ${subfolderName} (${newFolder.getId()})`);
  
  return newFolder.getId();
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType) {
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif'
  };
  
  return mimeMap[mimeType] || 'jpg';
}

/**
 * Find case number by phone number
 */
function findCaseNumberByPhone(phoneNumber) {
  // Try to find case number from conversation state
  const intakeState = getConversationState(phoneNumber);
  if (intakeState && intakeState.data && intakeState.data.caseNumber) {
    return intakeState.data.caseNumber;
  }
  
  // Try to find from recent cases in Sheets
  try {
    const ss = SpreadsheetApp.openById(getConfig().SPREADSHEET_ID || '');
    const sheet = ss.getSheetByName('Bookings');
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      
      // Search for phone number in recent rows (last 100)
      const startRow = Math.max(1, data.length - 100);
      for (let i = data.length - 1; i >= startRow; i--) {
        const row = data[i];
        // Assuming phone is in column and case number in another
        // Adjust column indices based on your sheet structure
        if (row.includes(phoneNumber)) {
          return row[0]; // Assuming case number is in first column
        }
      }
    }
  } catch (e) {
    console.warn('Could not search Sheets for case number:', e);
  }
  
  return null;
}

/**
 * Generate response message based on upload state
 */
function generatePhotoUploadResponse(state) {
  const uploaded = state.uploadedCount;
  const total = 3; // Required photos
  
  if (uploaded >= total) {
    // All photos uploaded
    return {
      message: `✅ Perfect! All ${total} photos received:
- ${PHOTO_REQUIREMENTS.id_front.name} ✓
- ${PHOTO_REQUIREMENTS.id_back.name} ✓
- ${PHOTO_REQUIREMENTS.selfie.name} ✓

ID verification complete! 🎉

Next step: I'll send you the payment link shortly.`,
      complete: true,
      nextStep: 'payment'
    };
  } else {
    // More photos needed
    const remaining = total - uploaded;
    const nextPhotoType = getNextRequiredPhotoType(state);
    const nextPhotoName = PHOTO_REQUIREMENTS[nextPhotoType].name;
    const nextPhotoDesc = PHOTO_REQUIREMENTS[nextPhotoType].description;
    
    return {
      message: `✅ Photo ${uploaded}/${total} received!

**Next:** Send ${nextPhotoName}
(${nextPhotoDesc})

Just tap the camera icon and send the photo.`,
      complete: false,
      nextStep: nextPhotoType
    };
  }
}

/**
 * Get next required photo type
 */
function getNextRequiredPhotoType(state) {
  if (!state.photos.id_front) return PHOTO_TYPES.ID_FRONT;
  if (!state.photos.id_back) return PHOTO_TYPES.ID_BACK;
  if (!state.photos.selfie) return PHOTO_TYPES.SELFIE;
  return null;
}

/**
 * Check if all required photos are uploaded
 */
function areAllPhotosUploaded(state) {
  return state.photos.id_front && state.photos.id_back && state.photos.selfie;
}

/**
 * Request photo upload via WhatsApp
 * Called after document signing is complete
 */
function requestPhotoUpload(phoneNumber, caseNumber) {
  const whatsapp = new WhatsAppCloudAPI();
  
  // Initialize photo upload state
  const state = getPhotoUploadState(phoneNumber);
  state.caseNumber = caseNumber;
  updatePhotoUploadState(phoneNumber, state);
  
  const message = `Almost done! For compliance, I need photos of your ID.

📸 **Please send 3 photos:**

1️⃣ **Front of your driver license**
2️⃣ **Back of your driver license**
3️⃣ **Selfie of you holding your ID**

Just tap the camera icon 📷 in WhatsApp and send them one by one.

I'll confirm each photo as I receive it!`;
  
  whatsapp.sendText(phoneNumber, message);
  
  logProcessingEvent('PHOTO_UPLOAD_REQUESTED', {
    caseNumber: caseNumber,
    phoneNumber: phoneNumber,
    timestamp: new Date().toISOString()
  });
}

// =============================================================================
// EXPORTS
// =============================================================================

// Functions are global in GAS - no explicit exports needed
