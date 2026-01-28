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
