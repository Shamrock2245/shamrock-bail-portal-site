/**
 * Studio no longer has ConsentLightbox. Missing consent fails closed.
 * A stored consent flag still counts. This module does not open a lightbox.
 */

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
 * Browser consent gate. ConsentLightbox is gone, so a browser call does not
 * grant consent. Non-browser rendering keeps the previous pass-through.
 * @param {{ browser: boolean }} env
 * @returns {boolean}
 */
export function showConsentIfNeededResult(env) {
    try {
        if (!env || env.browser !== true) return true;
        return false;
    } catch (e) {
        return false;
    }
}
