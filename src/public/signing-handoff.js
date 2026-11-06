/**
 * Decide whether a paperwork preview may open a signing URL.
 * Host allowlist and CMS expired/void flags stay in validateSigningSession.
 * This only accepts that function's result. A truthy raw URL is not enough.
 */

export function signingHandoffDecision(validation) {
    const phone = validation && validation.phone ? String(validation.phone) : '';
    if (!validation || validation.valid !== true) {
        return { action: 'recover', expired: !!(validation && validation.expired), phone: phone };
    }
    const signingUrl = typeof validation.signingUrl === 'string' ? validation.signingUrl.trim() : '';
    if (!signingUrl) {
        return { action: 'recover', expired: true, phone: phone };
    }
    return { action: 'navigate', signingUrl: signingUrl, phone: phone };
}
