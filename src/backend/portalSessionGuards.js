/**
 * Portal session checks shared by document reads and detail reads.
 * No Wix imports, so Node tests can load this file directly.
 */

/**
 * Token for getMemberDocuments. A browser-supplied email is never read.
 * Call shapes: (memberEmail, sessionToken), (sessionToken), or ({ sessionToken }).
 */
export function resolveDocumentSessionToken(arg1, arg2) {
    if (typeof arg2 === 'string' && arg2) return arg2;
    if (typeof arg1 === 'string' && arg1 && arg2 === undefined) return arg1;
    if (arg1 && typeof arg1 === 'object' && typeof arg1.sessionToken === 'string') {
        return arg1.sessionToken;
    }
    return '';
}

/**
 * Email that may be used to list a member's documents.
 * Invalid sessions are rejected. A valid session with no email lists nothing.
 */
export function memberDocumentAccess(session) {
    if (!session || session.valid !== true) return { ok: false, email: '' };
    const email = String(session.email || '').trim();
    return { ok: true, email };
}

/** Detail reads require a validated session bound to a person. */
export function portalDetailsSessionOk(session) {
    return !!(session && session.valid && session.personId);
}
