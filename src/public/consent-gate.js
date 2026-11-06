/**
 * Shared SMS/email consent gate for the Studio portal landing page.
 * There is no ConsentLightbox. Consent stays fail-closed: a browser visitor
 * continues only when shamrock_sms_consent is already "true", or after
 * consentRecordFromAffirmative(true) from an explicit button tap.
 * #105 and #108 both import this file. Keep these export names stable.
 */

export const SMS_CONSENT_KEY = 'shamrock_sms_consent';
export const SMS_CONSENT_TIME_KEY = 'shamrock_consent_timestamp';

export function hasStoredSmsConsent(storedValue) {
    return storedValue === 'true';
}

export function geolocationWithoutLightbox(existingConsent) {
    if (existingConsent) {
        return { proceed: true };
    }
    return {
        proceed: false,
        result: {
            success: false,
            error: 'Consent not given',
            fallback: 'ip'
        }
    };
}

/**
 * Browser gate. Non-browser rendering passes through.
 * In the browser, only a stored "true" flag counts. Omitting storedConsent
 * stays closed so a fresh visitor is not treated as consented.
 * @param {{ browser?: boolean, storedConsent?: string }} env
 * @returns {boolean}
 */
export function showConsentIfNeededResult(env) {
    try {
        if (!env || env.browser !== true) return true;
        return hasStoredSmsConsent(env.storedConsent);
    } catch (e) {
        return false;
    }
}

/**
 * Record consent only after an explicit accept. Anything other than true
 * returns null and must not be written.
 * @param {boolean} accepted
 * @returns {{key:string,value:string,timeKey:string,timeValue:string}|null}
 */
export function consentRecordFromAffirmative(accepted) {
    if (accepted !== true) return null;
    return {
        key: SMS_CONSENT_KEY,
        value: 'true',
        timeKey: SMS_CONSENT_TIME_KEY,
        timeValue: new Date().toISOString()
    };
}
