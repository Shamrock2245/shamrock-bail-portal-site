//
// Compliance.gs - SOC II Compliance Controls
//

/**
 * Retrieves a secret from Script Properties.
 * @param {string} key The property key.
 * @returns {string} The property value.
 */
function getSecureCredential(key) {
  const props = PropertiesService.getScriptProperties();
  const value = props.getProperty(key);
  if (!value) {
    // Prevent infinite loop if logging itself fails due to missing credentials
    if (key !== 'AUDIT_LOG_SHEET_ID') {
      try {
        logSecurityEvent('MISSING_CREDENTIAL', { key: key });
      } catch (e) {
        console.error('Failed to log missing credential event: ' + e.toString());
      }
    }
    throw new Error('Configuration error: Missing credential ' + key);
  }
  return value;
}

/**
 * Verifies the signature of an incoming webhook request.
 * @param {object} request The request object from doPost.
 * @param {string} secretKey The key for the webhook secret in Script Properties.
 * @param {string} signatureHeader The name of the signature header.
 * @returns {boolean} True if the signature is valid.
 */
function verifyWebhookSignature(request, secretKey, signatureHeader) {
  // If headers are missing or signature header not present
  if (!request || !request.headers || !request.headers[signatureHeader]) {
    logSecurityEvent('WEBHOOK_SIGNATURE_MISSING', { header: signatureHeader });
    return false;
  }

  const signature = request.headers[signatureHeader];
  let secret;
  try {
    secret = getSecureCredential(secretKey);
  } catch (e) {
    console.error('Webhook verification failed: Secret key not found');
    return false;
  }

  const payload = request.postData.contents;

  const expectedSignature = Utilities.computeHmacSha256Signature(payload, secret);
  const encodedExpectedSignature = Utilities.base64Encode(expectedSignature);

  // Simple string comparison (for now - production should use timing-safe comparison if available in GAS)
  if (signature !== encodedExpectedSignature) {
    logSecurityEvent('WEBHOOK_SIGNATURE_INVALID', {
      received: signature,
      computed: encodedExpectedSignature
    });
    return false;
  }
  return true;
}

/**
 * Verifies ElevenLabs mid-call tool requests using a shared secret.
 * The secret can be passed as a query parameter (?secret=xxx) or
 * as an x-tool-secret header. ElevenLabs tool configs allow appending
 * static query params to webhook URLs, making this the simplest auth pattern.
 *
 * @param {object} e - The GAS event parameter from doPost/doGet
 * @returns {boolean} True if authorized
 */
function verifyElevenLabsToolSecret_(e) {
  var secret;
  try {
    secret = PropertiesService.getScriptProperties().getProperty('ELEVENLABS_TOOL_SECRET');
  } catch (_) {
    secret = null;
  }

  if (!secret) {
    Logger.log('⚠️ ELEVENLABS_TOOL_SECRET not set. Auth check skipped (activation mode).');
    return true;
  }

  var provided = '';
  if (e && e.parameter && e.parameter.secret) {
    provided = e.parameter.secret;
  } else if (e && e.headers && e.headers['x-tool-secret']) {
    provided = e.headers['x-tool-secret'];
  }

  if (provided !== secret) {
    logSecurityEvent('ELEVENLABS_TOOL_AUTH_FAIL', {
      tool: (e && e.parameter) ? e.parameter.tool : 'unknown'
    });
    return false;
  }
  return true;
}

/**
 * Verifies Telegram webhook relay requests using a shared secret.
 * The Netlify/Wix relay that forwards Telegram updates to GAS must
 * include the secret in the JSON body as `webhookSecret` or as a
 * query parameter `?secret=xxx`.
 *
 * @param {object} e - The GAS event parameter from doPost
 * @returns {boolean} True if authorized
 */
function verifyTelegramWebhookSecret_(e) {
  var secret;
  try {
    secret = PropertiesService.getScriptProperties().getProperty('TELEGRAM_WEBHOOK_SECRET');
  } catch (_) {
    secret = null;
  }

  if (!secret) {
    Logger.log('⚠️ TELEGRAM_WEBHOOK_SECRET not set. Auth check skipped (activation mode).');
    return true;
  }

  var provided = '';

  // Check query parameter first
  if (e && e.parameter && e.parameter.secret) {
    provided = e.parameter.secret;
  }

  // Check JSON body field
  if (!provided && e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      provided = body.webhookSecret || '';
    } catch (_) {
      // Parse error handled elsewhere
    }
  }

  if (provided !== secret) {
    logSecurityEvent('TELEGRAM_WEBHOOK_AUTH_FAIL', {});
    return false;
  }
  return true;
}
