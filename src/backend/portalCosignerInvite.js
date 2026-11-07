/**
 * Co-signer self-invite.
 * File: backend/portalCosignerInvite.js
 *
 * No Wix imports. The portal does not send texts. It asks Leads for an
 * invite URL the signed-in indemnitor can copy or share.
 *
 * Proposed leads contract (Leads Ops, not live here):
 *   POST https://leads.shamrockbailbonds.biz/api/portal/cosigner-invite
 *   { case_id, person_id, inviter_person_id, cosigner_name?, cosigner_phone?, cosigner_email? }
 *   -> { ok, invite_url }
 *
 * person_id, inviter_person_id, and case_id come from the case row's
 * canonical bond id and signer id, not the Wix session _id. Client-supplied
 * ids and role are ignored. Optional contact fields are
 * validated and then sent. They are never logged.
 * Auth headers match resolveDashboardKey(): X-API-Key and X-Internal-Token.
 * A 404 means the route is not on leads yet and returns reason not_found so
 * the page can open the live paperwork launchpad (mode=add-cosigner).
 * A timeout or other error returns ok:false with reason unavailable.
 */

import { LEADS_BASE, DEFAULT_TIMEOUT_MS, resolveDashboardKey } from './portal-signin-dispatch.js';
import { canonicalIdentityFromCase } from './portalHandoff.js';

export const INVITE_PATH = '/api/portal/cosigner-invite';
export const INVITE_ROLES = ['indemnitor', 'coindemnitor'];
export const LIMITS = { name: 80, email: 254, phoneDigits: 10 };

const NAME_RE = /^[\p{L}][\p{L}\p{M} .'-]{0,79}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SMART_APOSTROPHE = /[\u2018\u2019\u201A\u201B\u2032\u02BC]/g;
const SMART_HYPHEN = /[\u2010\u2011\u2012\u2013\u2014\u2212]/g;

/** Fold phone-keyboard apostrophes and hyphens to ASCII. Other characters stay put. */
export function normalizeNamePunctuation(value) {
    return String(value).replace(SMART_APOSTROPHE, "'").replace(SMART_HYPHEN, '-');
}

export function identityFromSession(session, roles) {
    if (!session || session.valid !== true) return null;
    const personId = typeof session.personId === 'string' ? session.personId.trim() : '';
    const caseId = typeof session.caseId === 'string' ? session.caseId.trim() : '';
    const role = typeof session.role === 'string' ? session.role.trim().toLowerCase() : '';
    const allowed = Array.isArray(roles) && roles.length ? roles : INVITE_ROLES;
    if (!personId || !caseId || !allowed.includes(role)) return null;
    if (personId.length > 128 || caseId.length > 128) return null;
    return { personId, caseId, role };
}

function cleanString(value, max) {
    if (value == null || value === '') return '';
    if (typeof value !== 'string') return null;
    if (/[\u0000-\u001F\u007F]/.test(value)) return null;
    const trimmed = value.trim();
    if (trimmed.length > max) return null;
    return trimmed;
}

/**
 * Validate optional co-signer contact fields.
 * Empty fields are omitted. A present but invalid field fails closed.
 * @returns {{ ok: true, fields: object } | { ok: false, reason: 'invalid' }}
 */
export function validateCosignerFields(input) {
    const src = input && typeof input === 'object' ? input : {};
    const fields = {};
    const nameRaw = cleanString(src.cosigner_name, LIMITS.name);
    if (nameRaw === null) return { ok: false, reason: 'invalid' };
    const name = nameRaw ? normalizeNamePunctuation(nameRaw) : '';
    if (name.length > LIMITS.name || (name && !NAME_RE.test(name))) return { ok: false, reason: 'invalid' };
    if (name) fields.cosigner_name = name;
    const phoneRaw = cleanString(src.cosigner_phone, 40);
    if (phoneRaw === null) return { ok: false, reason: 'invalid' };
    if (phoneRaw) {
        let digits = phoneRaw.replace(/\D/g, '');
        if (digits.length === 11 && digits.charAt(0) === '1') digits = digits.slice(1);
        if (digits.length !== LIMITS.phoneDigits) return { ok: false, reason: 'invalid' };
        fields.cosigner_phone = digits;
    }
    const emailRaw = cleanString(src.cosigner_email, LIMITS.email);
    if (emailRaw === null) return { ok: false, reason: 'invalid' };
    const email = emailRaw.toLowerCase();
    if (email && !EMAIL_RE.test(email)) return { ok: false, reason: 'invalid' };
    if (email) fields.cosigner_email = email;
    return { ok: true, fields: fields };
}

export function acceptableInviteUrl(value) {
    if (typeof value !== 'string') return '';
    const url = value.trim();
    if (!url || url.length > 500) return '';
    let parsed;
    try {
        parsed = new URL(url);
    } catch (e) {
        return '';
    }
    if (parsed.protocol !== 'https:') return '';
    if (parsed.username || parsed.password) return '';
    return url;
}

function authHeaders(key) {
    return {
        'Content-Type': 'application/json',
        'X-API-Key': key,
        'X-Internal-Token': key
    };
}

function withTimeout(promise, ms) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            const err = new Error('timeout');
            err.code = 'timeout';
            reject(err);
        }, ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function logSafe(deps, event) {
    const logger = (deps && deps.logger) || console;
    const safe = {
        event: 'portal_cosigner_invite',
        step: event.step || '',
        reason: event.reason || '',
        status: event.status || 0
    };
    try {
        if (logger && typeof logger.warn === 'function') logger.warn(JSON.stringify(safe));
    } catch (e) { /* logging must not break the invite */ }
}

async function readJson(response) {
    let raw = '';
    try {
        raw = await response.text();
    } catch (e) {
        raw = '';
    }
    try {
        return JSON.parse(raw || '{}');
    } catch (e) {
        return {};
    }
}

function sessionTokenFrom(input) {
    if (typeof input === 'string') return input;
    if (input && typeof input.sessionToken === 'string') return input.sessionToken;
    return '';
}

/**
 * Ask leads for a co-signer invite URL.
 * Client case_id, person_id, and inviter_person_id are never read.
 */
export async function requestCosignerInvite(input, deps) {
    const sessionToken = sessionTokenFrom(input);
    if (!deps || typeof deps.validateSession !== 'function' || typeof deps.fetchImpl !== 'function') {
        return { ok: false, reason: 'session' };
    }
    const validated = validateCosignerFields(input);
    if (!validated.ok) {
        logSafe(deps, { step: 'validate', reason: 'invalid' });
        return { ok: false, reason: 'invalid' };
    }
    let session = null;
    try {
        session = await deps.validateSession(sessionToken);
    } catch (e) {
        logSafe(deps, { step: 'session', reason: 'error' });
        return { ok: false, reason: 'session' };
    }
    const identity = identityFromSession(session, INVITE_ROLES);
    if (!identity) {
        const role = session && typeof session.role === 'string' ? session.role.trim().toLowerCase() : '';
        const reason = session && session.valid === true && !INVITE_ROLES.includes(role) ? 'role' : 'session';
        logSafe(deps, { step: 'session', reason: reason });
        return { ok: false, reason: reason };
    }
    if (typeof deps.loadCase !== 'function') {
        logSafe(deps, { step: 'identity', reason: 'case' });
        return { ok: false, reason: 'identity' };
    }
    let caseRow = null;
    try {
        caseRow = await deps.loadCase(identity);
    } catch (e) {
        logSafe(deps, { step: 'identity', reason: 'case' });
        return { ok: false, reason: 'identity' };
    }
    const canonical = canonicalIdentityFromCase(session, caseRow);
    if (!canonical || !INVITE_ROLES.includes(canonical.role)) {
        logSafe(deps, { step: 'identity', reason: 'canonical' });
        return { ok: false, reason: 'identity' };
    }
    const keyInfo = await resolveDashboardKey(deps.getSecret);
    if (!keyInfo || !keyInfo.key) {
        logSafe(deps, { step: 'auth', reason: 'missing_key' });
        return { ok: false, reason: 'auth' };
    }
    const body = Object.assign({
        case_id: canonical.caseId,
        person_id: canonical.personId,
        inviter_person_id: canonical.personId
    }, validated.fields);
    const base = (deps && deps.leadsBase) || LEADS_BASE;
    const timeoutMs = (deps && deps.timeoutMs) || DEFAULT_TIMEOUT_MS;
    try {
        const posted = await withTimeout((async () => {
            const response = await deps.fetchImpl(base + INVITE_PATH, {
                method: 'POST',
                headers: authHeaders(keyInfo.key),
                body: JSON.stringify(body)
            });
            const status = response && response.status ? response.status : 0;
            if (!response || status === 404 || !response.ok) {
                return { status: status, data: null };
            }
            const data = await readJson(response);
            return { status: status, data: data };
        })(), timeoutMs);
        const status = posted && posted.status ? posted.status : 0;
        const data = posted && posted.data;
        if (status === 404) {
            logSafe(deps, { step: 'invite', reason: 'not_found', status: status });
            return { ok: false, reason: 'not_found' };
        }
        if (!posted || status < 200 || status >= 300) {
            logSafe(deps, { step: 'invite', reason: 'upstream', status: status });
            return { ok: false, reason: 'unavailable' };
        }
        const inviteUrl = acceptableInviteUrl(data && (data.invite_url || data.inviteUrl));
        if (!data || data.ok === false || !inviteUrl) {
            logSafe(deps, { step: 'invite', reason: 'url', status: status });
            return { ok: false, reason: 'unavailable' };
        }
        logSafe(deps, { step: 'invite', reason: 'ok', status: status });
        return { ok: true, invite_url: inviteUrl };
    } catch (error) {
        const timedOut = !!(error && error.code === 'timeout');
        logSafe(deps, { step: 'invite', reason: timedOut ? 'timeout' : 'error' });
        return { ok: false, reason: timedOut ? 'timeout' : 'unavailable' };
    }
}
