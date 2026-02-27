/**
 * ============================================================================
 * Telegram_OCR.js
 * ============================================================================
 * ID Photo OCR — Extracts name, DOB, DL number, and address from
 * Florida driver's license / state ID photos using Google Cloud Vision API.
 * 
 * USAGE:
 *   var result = processIDPhoto(telegramFileId, chatId, userId);
 *   // result = { success, firstName, lastName, dob, dlNumber, address }
 * 
 * DEPENDS ON:
 *   - Telegram_API.js (TelegramBotAPI for file download)
 *   - Google Cloud Vision API (TEXT_DETECTION)
 *   - Script Property: GOOGLE_CLOUD_PROJECT_ID
 * 
 * FALLBACK:
 *   If Vision API is not configured, saves photo to Drive and returns null.
 * ============================================================================
 */

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Process an ID photo from Telegram and attempt OCR extraction.
 * 
 * @param {string} fileId   - Telegram file_id of the photo
 * @param {string} chatId   - Chat ID for sending feedback
 * @param {string} userId   - User ID for file naming
 * @returns {object|null}   - { firstName, lastName, dob, dlNumber, address, rawText } or null
 */
function processIDPhoto(fileId, chatId, userId) {
    try {
        // 1. Download photo from Telegram
        var bot = new TelegramBotAPI();
        var fileInfo = bot.getFile(fileId);
        if (!fileInfo || !fileInfo.file_path) {
            console.error('OCR: Failed to get file info for ' + fileId);
            return null;
        }

        var config = getTelegramConfig();
        var fileUrl = 'https://api.telegram.org/file/bot' + config.botToken + '/' + fileInfo.file_path;
        var imageBlob = UrlFetchApp.fetch(fileUrl).getBlob();

        // 2. Attempt OCR via Google Cloud Vision
        var ocrText = _callCloudVisionOCR(imageBlob);
        if (!ocrText) {
            console.log('OCR: Vision API returned no text or not configured');
            // Save photo to Drive as fallback
            _saveIDPhotoDrive(imageBlob, userId);
            return null;
        }

        // 3. Parse FL Driver's License fields from OCR text
        var parsed = _parseFloridaDL(ocrText);

        // Log for analytics
        if (typeof logBotEvent === 'function') {
            logBotEvent('ocr_processed', String(userId), {
                success: !!parsed.dlNumber,
                fieldsExtracted: Object.keys(parsed).filter(function (k) { return !!parsed[k]; }).length
            });
        }

        parsed.rawText = ocrText;
        parsed.success = !!(parsed.dlNumber || parsed.firstName || parsed.dob);
        return parsed;

    } catch (e) {
        console.error('OCR processing error: ' + e.message);
        return null;
    }
}

// ============================================================================
// GOOGLE CLOUD VISION API
// ============================================================================

/**
 * Call Google Cloud Vision TEXT_DETECTION on an image.
 * Returns the extracted text or null if API is not configured.
 * 
 * @param {Blob} imageBlob - The image to process
 * @returns {string|null}  - Extracted text
 */
function _callCloudVisionOCR(imageBlob) {
    try {
        var props = PropertiesService.getScriptProperties();
        var apiKey = props.getProperty('GOOGLE_CLOUD_VISION_API_KEY');

        // Fallback: use the GAS built-in access token if no explicit key
        if (!apiKey) {
            // Try using the Apps Script OAuth token for the Vision API
            // This requires the Cloud project to have Vision API enabled
            return _callVisionWithServiceAccount(imageBlob);
        }

        var url = 'https://vision.googleapis.com/v1/images:annotate?key=' + apiKey;
        var imageBytes = Utilities.base64Encode(imageBlob.getBytes());

        var payload = {
            requests: [{
                image: { content: imageBytes },
                features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
            }]
        };

        var response = UrlFetchApp.fetch(url, {
            method: 'POST',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });

        if (response.getResponseCode() !== 200) {
            console.error('Vision API error: ' + response.getResponseCode() + ' ' + response.getContentText().substring(0, 200));
            return null;
        }

        var result = JSON.parse(response.getContentText());
        var annotations = result.responses && result.responses[0] && result.responses[0].textAnnotations;
        if (annotations && annotations.length > 0) {
            return annotations[0].description; // Full text block
        }

        return null;

    } catch (e) {
        console.error('Cloud Vision API error: ' + e.message);
        return null;
    }
}

/**
 * Fallback: Use Apps Script service account OAuth token for Vision API.
 * Requires the GAS project's Cloud project to have Vision API enabled.
 */
function _callVisionWithServiceAccount(imageBlob) {
    try {
        var token = ScriptApp.getOAuthToken();
        var url = 'https://vision.googleapis.com/v1/images:annotate';
        var imageBytes = Utilities.base64Encode(imageBlob.getBytes());

        var payload = {
            requests: [{
                image: { content: imageBytes },
                features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
            }]
        };

        var response = UrlFetchApp.fetch(url, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            contentType: 'application/json',
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });

        if (response.getResponseCode() !== 200) {
            console.warn('Vision API (SA) returned ' + response.getResponseCode() + ': ' + response.getContentText().substring(0, 200));
            return null;
        }

        var result = JSON.parse(response.getContentText());
        var annotations = result.responses && result.responses[0] && result.responses[0].textAnnotations;
        return (annotations && annotations.length > 0) ? annotations[0].description : null;

    } catch (e) {
        console.warn('Vision API (SA) not available: ' + e.message);
        return null;
    }
}

// ============================================================================
// FLORIDA DL PARSER
// ============================================================================

/**
 * Parse Florida Driver's License OCR text for key fields.
 * FL DL format patterns:
 *   - DL Number: starts with letter + 12 digits (e.g., D123-456-78-901-2)
 *   - DOB: "DOB MM/DD/YYYY" or "MM-DD-YYYY"
 *   - Name: "LN <last>" and "FN <first>" or "1 <last>\n2 <first>"
 *   - Address: Multi-line address block
 * 
 * @param {string} text - Full OCR text
 * @returns {object} { firstName, lastName, dob, dlNumber, address }
 */
function _parseFloridaDL(text) {
    var result = {
        firstName: '',
        lastName: '',
        dob: '',
        dlNumber: '',
        address: ''
    };

    if (!text) return result;

    var lines = text.split('\n').map(function (l) { return l.trim(); });

    // --- DL Number ---
    // Florida format: letter + 12 digits (may have dashes/spaces)
    var dlMatch = text.match(/[A-Z]\s*\d[\d\s\-]{10,15}\d/);
    if (dlMatch) {
        result.dlNumber = dlMatch[0].replace(/[\s\-]/g, '');
        // Ensure it's exactly 13 chars (1 letter + 12 digits)
        if (result.dlNumber.length > 13) {
            result.dlNumber = result.dlNumber.substring(0, 13);
        }
    }

    // --- DOB ---
    var dobMatch = text.match(/(?:DOB|DATE OF BIRTH|DB)[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dobMatch) {
        result.dob = dobMatch[1].replace(/-/g, '/');
    } else {
        // Try standalone date pattern near "DOB" context
        var dateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
            result.dob = dateMatch[1];
        }
    }

    // --- Name ---
    // Pattern 1: "LN <last>" and "FN <first>"
    var lnMatch = text.match(/(?:LN|LAST NAME|1)[:\s]+([A-Z][A-Z\s\-']+)/i);
    var fnMatch = text.match(/(?:FN|FIRST NAME|2)[:\s]+([A-Z][A-Z\s\-']+)/i);
    if (lnMatch) result.lastName = _cleanName(lnMatch[1]);
    if (fnMatch) result.firstName = _cleanName(fnMatch[1]);

    // Pattern 2: If no LN/FN match, look for name on line after "FLORIDA" header
    if (!result.lastName && !result.firstName) {
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].match(/FLORIDA/i) && i + 1 < lines.length) {
                var nameLine = lines[i + 1];
                var nameParts = nameLine.split(/[\s,]+/).filter(function (p) { return p.length > 1; });
                if (nameParts.length >= 2) {
                    result.lastName = _cleanName(nameParts[0]);
                    result.firstName = _cleanName(nameParts[1]);
                }
                break;
            }
        }
    }

    // --- Address ---
    // Look for street address pattern (number + street name)
    var addrMatch = text.match(/(\d+\s+[A-Z][A-Z0-9\s]{3,}(?:ST|AVE|BLVD|DR|RD|LN|CT|WAY|PL|CIR|TRL|TER)[A-Z]*)/i);
    if (addrMatch) {
        result.address = addrMatch[1].trim();
        // Try to grab city/state/zip on next lines
        var addrIdx = text.indexOf(addrMatch[0]);
        var afterAddr = text.substring(addrIdx + addrMatch[0].length, addrIdx + addrMatch[0].length + 100);
        var cityMatch = afterAddr.match(/([A-Z][A-Z\s]+),?\s*FL\s*(\d{5})/i);
        if (cityMatch) {
            result.address += ', ' + cityMatch[1].trim() + ', FL ' + cityMatch[2];
        }
    }

    return result;
}

// ============================================================================
// HELPERS
// ============================================================================

function _cleanName(name) {
    return name.replace(/[^A-Za-z\s\-']/g, '').trim().split(/\s+/)[0];
}

function _saveIDPhotoDrive(imageBlob, userId) {
    try {
        var config = getConfig();
        var folderId = config.GOOGLE_DRIVE_FOLDER_ID;
        if (!folderId) return;

        var folder = DriveApp.getFolderById(folderId);
        var fileName = 'ID_' + (userId || 'unknown') + '_' + Date.now() + '.jpg';
        imageBlob.setName(fileName);
        folder.createFile(imageBlob);
        console.log('ID photo saved to Drive: ' + fileName);
    } catch (e) {
        console.warn('Failed to save ID photo to Drive: ' + e.message);
    }
}
