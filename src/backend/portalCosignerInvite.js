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
 * person_id, inviter_person_id, and case_id come only from the validated
 * session. Client-supplied ids are ignored. Optional contact fields are
 * validated and then sent. They are never logged.
 * Auth headers match resolveDashboardKey(): X-API-Key and X-Internal-Token.
 * A 404, timeout, or other error returns ok:false.
 */

import { LEADS_BASE, DEFAULT_TIMEOUT_MS, resolveDashboardKey } from './portal-signin-dispatch.js';

export const INVITE_PATH = '/api/portal/cosigner-invite';
export const INVITE_ROLES = ['indemnitor', 'coindemnitor'];
export const LIMITS = { name: 80, email: 254, phoneDigits: 10 };

const NAME_RE = /^[\p{L}][\p{L}\p{M} .'-]{0,79}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const name = cleanString(src.cosigner_name, LIMITS.name);
    if (name === null || (name && !NAME_RE.test(name))) return { ok: false, reason: 'invalid' };
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
    const keyInfo = await resolveDashboardKey(deps.getSecret);
    if (!keyInfo || !keyInfo.key) {
        logSafe(deps, { step: 'auth', reason: 'missing_key' });
        return { ok: false, reason: 'auth' };
    }
    const body = Object.assign({
        case_id: identity.caseId,
        person_id: identity.personId,
        inviter_person_id: identity.personId
    }, validated.fields);
    const base = (deps && deps.leadsBase) || LEADS_BASE;
    const timeoutMs = (deps && deps.timeoutMs) || DEFAULT_TIMEOUT_MS;
    try {
        const response = await withTimeout(deps.fetchImpl(base + INVITE_PATH, {
            method: 'POST',
            headers: authHeaders(keyInfo.key),
            body: JSON.stringify(body)
        }), timeoutMs);
        const status = response && response.status ? response.status : 0;
        if (!response || status === 404 || !response.ok) {
            logSafe(deps, { step: 'invite', reason: status === 404 ? 'not_found' : 'upstream', status: status });
            return { ok: false, reason: 'unavailable' };
        }
        const data = await readJson(response);
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
