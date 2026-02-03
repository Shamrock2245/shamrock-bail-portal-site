/**
 * Secure Logging Utility (Backend Only)
 * Filename: backend/logging.js
 * 
 * Handles PII redaction and secure logging.
 * Extracted from utils.jsw to prevent client-side bundling issues.
 */

/**
 * Securely log data with PII redaction
 * @param {string} message - Log message
 * @param {object} data - Data object to log
 * @param {string} level - 'info', 'warn', 'error'
 */
export function logSafe(message, data = {}, level = 'info') {
    try {
        const maskedData = maskPII(JSON.parse(JSON.stringify(data)));
        console[level](message, maskedData);
    } catch (error) {
        console.error('Error in logSafe:', error);
        console[level](message, '[Data Redaction Failed]');
    }
}

/**
 * Recursive PII masker
 * Masks: email, phone, password, token, key
 */
function maskPII(obj) {
    const SENSITIVE_KEYS = ['email', 'phone', 'password', 'token', 'key', 'secret', 'authorization', 'signature'];

    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => maskPII(item));
    }

    Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_KEYS.some(k => lowerKey.includes(k))) {
            if (typeof obj[key] === 'string' && obj[key].length > 4) {
                obj[key] = obj[key].substring(0, 2) + '***' + obj[key].slice(-2);
            } else {
                obj[key] = '***REDACTED***';
            }
        } else {
            obj[key] = maskPII(obj[key]);
        }
    });

    return obj;
}
