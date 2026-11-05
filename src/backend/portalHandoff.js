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
 * Contract: shamrock-leads docs/contracts/paperwork-handoff-token.md
 * (paperwork app PR 315). case_id is the bond case id, not a POA number.
 * role is indemnitor, coindemnitor, or defendant. person_id is that signer.
 * token is v1.<base64url>.<base64url>. expires_at is ISO-8601 UTC.
 * The body has those three keys only. This module does not sign or store
 * the token, and it does not insert the jti row.
 *
 * PAPERWORK_HANDOFF_ENABLED defaults to off on the paperwork app. A 404,
 * a non-contract token, a timeout, or any other mint failure returns
 * ok:false so the page opens the launchpad with no ht. The app then shows
 * its PIN sign-in and grants nothing from the token.
 * Auth headers match resolveDashboardKey(): X-API-Key and X-Internal-Token.
 * Nothing here logs the session token, handoff token, API key, or ids.
 */

import { LEADS_BASE, DEFAULT_TIMEOUT_MS, resolveDashboardKey } from './portal-signin-dispatch.js';

export const HANDOFF_PATH = '/api/portal/handoff-token';
export const HANDOFF_ROLES = ['defendant', 'indemnitor', 'coindemnitor'];
export const HANDOFF_TOKEN_MAX = 4000;
const HANDOFF_TOKEN_RE = /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const EXPIRES_AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|\+00:00)$/;

/** Same folding the paperwork app uses before it compares the role hint. */
export function normalizeHandoffRole(raw) {
    const value = String(raw || '').trim().toLowerCase().replace(/-/g, '').replace(/_/g, '');
    if (value === 'defendant' || value === 'def' || value === 'inmate') return 'defendant';
    if (value === 'coindemnitor' || value === 'co') return 'coindemnitor';
    if (value === 'indemnitor' || value === 'ind') return 'indemnitor';
    return '';
}

export function identityFromSession(session, roles) {
    if (!session || session.valid !== true) return null;
    const personId = typeof session.personId === 'string' ? session.personId.trim() : '';
    const caseId = typeof session.caseId === 'string' ? session.caseId.trim() : '';
    const role = normalizeHandoffRole(session.role);
    const allowed = Array.isArray(roles) && roles.length ? roles : HANDOFF_ROLES;
    if (!personId || !caseId || !allowed.includes(role)) return null;
    if (personId.length > 128 || caseId.length > 128) return null;
    return { personId, caseId, role };
}

export function acceptableHandoffToken(token, sessionToken) {
    const value = typeof token === 'string' ? token.trim() : '';
    if (!value || value.length > HANDOFF_TOKEN_MAX) return '';
    if (!HANDOFF_TOKEN_RE.test(value)) return '';
    const session = typeof sessionToken === 'string' ? sessionToken : '';
    if (session && (value === session || value.indexOf(session) !== -1)) return '';
    return value;
}

export function acceptableExpiresAt(value) {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    if (!EXPIRES_AT_RE.test(text)) return '';
    const parsed = Date.parse(text);
    if (!Number.isFinite(parsed)) return '';
    return text;
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
        const posted = await withTimeout((async () => {
            const response = await deps.fetchImpl(base + HANDOFF_PATH, {
                method: 'POST',
                headers: authHeaders(keyInfo.key),
                body: JSON.stringify(body)
            });
            const status = response && response.status ? response.status : 0;
            if (!response || status === 404 || !response.ok) {
                return { response: response, status: status, data: null };
            }
            const data = await readJson(response);
            return { response: response, status: status, data: data };
        })(), timeoutMs);
        const response = posted && posted.response;
        const status = posted && posted.status ? posted.status : 0;
        const data = posted && posted.data;
        if (!response || status === 404 || !response.ok) {
            logSafe(deps, { step: 'handoff', reason: status === 404 ? 'not_found' : 'upstream', status: status });
            return { ok: false, reason: 'unavailable' };
        }
        const token = acceptableHandoffToken(data && data.token, sessionToken);
        const expires = acceptableExpiresAt(data && data.expires_at);
        if (!token || !expires) {
            logSafe(deps, { step: 'handoff', reason: 'token', status: status });
            return { ok: false, reason: 'token' };
        }
        logSafe(deps, { step: 'handoff', reason: 'ok', status: status });
        // role and case_id are the claims inside the token. The launch URL
        // must repeat these exact strings. person_id stays off the URL.
        return {
            ok: true,
            token: token,
            expires_at: expires,
            case_id: body.case_id,
            role: body.role
        };
    } catch (error) {
        const timedOut = !!(error && error.code === 'timeout');
        logSafe(deps, { step: 'handoff', reason: timedOut ? 'timeout' : 'error' });
        return { ok: false, reason: timedOut ? 'timeout' : 'unavailable' };
    }
}
