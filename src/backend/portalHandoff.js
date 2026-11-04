/**
 * Paperwork handoff token.
 * File: backend/portalHandoff.js
 *
 * No Wix imports. The .jsw wrapper validates the portal session and passes it in.
 * person_id and case_id come only from that session. Client fields with those
 * names are ignored. Proposed leads contract (Leads Ops, not live here):
 *
 *   POST https://leads.shamrockbailbonds.biz/api/portal/handoff-token
 *   { case_id, role, person_id }
 *   -> { token, expires_at }
 *
 * The token is short-lived and single-use. This module does not store it.
 * Auth headers match resolveDashboardKey(): X-API-Key and X-Internal-Token.
 * A 404, timeout, or other error returns ok:false so the page can open the
 * launchpad without ht (the paperwork app then uses its PIN sign-in).
 * Nothing here logs the session token, handoff token, API key, or ids.
 */

import { LEADS_BASE, DEFAULT_TIMEOUT_MS, resolveDashboardKey } from './portal-signin-dispatch.js';

export const HANDOFF_PATH = '/api/portal/handoff-token';
export const HANDOFF_ROLES = ['defendant', 'indemnitor', 'coindemnitor'];

export function identityFromSession(session, roles) {
    if (!session || session.valid !== true) return null;
    const personId = typeof session.personId === 'string' ? session.personId.trim() : '';
    const caseId = typeof session.caseId === 'string' ? session.caseId.trim() : '';
    const role = typeof session.role === 'string' ? session.role.trim().toLowerCase() : '';
    const allowed = Array.isArray(roles) && roles.length ? roles : HANDOFF_ROLES;
    if (!personId || !caseId || !allowed.includes(role)) return null;
    if (personId.length > 128 || caseId.length > 128) return null;
    return { personId, caseId, role };
}

export function acceptableHandoffToken(token, sessionToken) {
    const value = typeof token === 'string' ? token.trim() : '';
    if (!value || value.length > 256) return '';
    if (!/^[A-Za-z0-9._~-]+$/.test(value)) return '';
    const session = typeof sessionToken === 'string' ? sessionToken : '';
    if (session && (value === session || value.indexOf(session) !== -1)) return '';
    return value;
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
        event: 'portal_handoff',
        step: event.step || '',
        reason: event.reason || '',
        status: event.status || 0
    };
    try {
        if (logger && typeof logger.warn === 'function') logger.warn(JSON.stringify(safe));
    } catch (e) { /* logging must not break the launch */ }
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
 * Mint a handoff token. `input` may contain client case_id / person_id / role;
 * those fields are never read. Only the validated session supplies them.
 */
export async function mintHandoffToken(input, deps) {
    const sessionToken = sessionTokenFrom(input);
    if (!deps || typeof deps.validateSession !== 'function' || typeof deps.fetchImpl !== 'function') {
        return { ok: false, reason: 'session' };
    }
    let session = null;
    try {
        session = await deps.validateSession(sessionToken);
    } catch (e) {
        logSafe(deps, { step: 'session', reason: 'error' });
        return { ok: false, reason: 'session' };
    }
    const identity = identityFromSession(session, HANDOFF_ROLES);
    if (!identity) {
        const role = session && typeof session.role === 'string' ? session.role.trim().toLowerCase() : '';
        const reason = session && session.valid === true && !HANDOFF_ROLES.includes(role) ? 'role' : 'session';
        logSafe(deps, { step: 'session', reason: reason });
        return { ok: false, reason: reason };
    }
    const keyInfo = await resolveDashboardKey(deps.getSecret);
    if (!keyInfo || !keyInfo.key) {
        logSafe(deps, { step: 'auth', reason: 'missing_key' });
        return { ok: false, reason: 'auth' };
    }
    const body = {
        case_id: identity.caseId,
        role: identity.role,
        person_id: identity.personId
    };
    const base = (deps && deps.leadsBase) || LEADS_BASE;
    const timeoutMs = (deps && deps.timeoutMs) || DEFAULT_TIMEOUT_MS;
    try {
        const response = await withTimeout(deps.fetchImpl(base + HANDOFF_PATH, {
            method: 'POST',
            headers: authHeaders(keyInfo.key),
            body: JSON.stringify(body)
        }), timeoutMs);
        const status = response && response.status ? response.status : 0;
        if (!response || status === 404 || !response.ok) {
            logSafe(deps, { step: 'handoff', reason: status === 404 ? 'not_found' : 'upstream', status: status });
            return { ok: false, reason: 'unavailable' };
        }
        const data = await readJson(response);
        const token = acceptableHandoffToken(data && data.token, sessionToken);
        if (!token) {
            logSafe(deps, { step: 'handoff', reason: 'token', status: status });
            return { ok: false, reason: 'token' };
        }
        const expires = data && typeof data.expires_at === 'string' ? data.expires_at : '';
        logSafe(deps, { step: 'handoff', reason: 'ok', status: status });
        return { ok: true, token: token, expires_at: expires };
    } catch (error) {
        const timedOut = !!(error && error.code === 'timeout');
        logSafe(deps, { step: 'handoff', reason: timedOut ? 'timeout' : 'error' });
        return { ok: false, reason: timedOut ? 'timeout' : 'unavailable' };
    }
}
