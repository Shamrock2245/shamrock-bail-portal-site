/**
 * Live portal case status.
 * File: backend/portalCaseStatus.js
 *
 * No Wix imports. Proposed leads contract (Leads Ops, not live here):
 *   GET https://leads.shamrockbailbonds.biz/api/portal/case-status?case_id=&person_id=
 *   -> { paperwork, signatures: { indemnitor, defendant, cosigners: [...] }, paid }
 *
 * person_id and case_id come only from the validated session. Client query
 * values are ignored. Auth headers match resolveDashboardKey().
 * A 404, timeout, or other error returns ok:false so the page can keep
 * showing the Wix Cases fields it already loaded.
 * Nothing here logs ids, keys, or the response body.
 */

import { LEADS_BASE, DEFAULT_TIMEOUT_MS, resolveDashboardKey } from './portal-signin-dispatch.js';
import { paperworkText } from '../public/portal-case-status-view.js';

export {
    paperworkLooksComplete,
    shouldShowPayNow,
    wixCaseStatusFallback,
    dashboardStatusFields,
    signaturesAreComplete
} from '../public/portal-case-status-view.js';

export const STATUS_PATH = '/api/portal/case-status';
export const STATUS_ROLES = ['defendant', 'indemnitor', 'coindemnitor'];

export function identityFromSession(session, roles) {
    if (!session || session.valid !== true) return null;
    const personId = typeof session.personId === 'string' ? session.personId.trim() : '';
    const caseId = typeof session.caseId === 'string' ? session.caseId.trim() : '';
    const role = typeof session.role === 'string' ? session.role.trim().toLowerCase() : '';
    const allowed = Array.isArray(roles) && roles.length ? roles : STATUS_ROLES;
    if (!personId || !caseId || !allowed.includes(role)) return null;
    if (personId.length > 128 || caseId.length > 128) return null;
    return { personId, caseId, role };
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
        event: 'portal_case_status',
        step: event.step || '',
        reason: event.reason || '',
        status: event.status || 0
    };
    try {
        if (logger && typeof logger.warn === 'function') logger.warn(JSON.stringify(safe));
    } catch (e) { /* logging must not break the dashboard */ }
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

function asBool(value) {
    return value === true;
}

export function normalizeLeadsStatus(data) {
    if (!data || typeof data !== 'object') return null;
    if (!Object.prototype.hasOwnProperty.call(data, 'paperwork')) return null;
    if (!data.signatures || typeof data.signatures !== 'object') return null;
    if (!Array.isArray(data.signatures.cosigners)) return null;
    let paid = null;
    if (data.paid === true) paid = true;
    else if (data.paid === false) paid = false;
    else return null;
    return {
        source: 'leads',
        paperwork: paperworkText(data.paperwork) || 'Not on file',
        signatures: {
            indemnitor: asBool(data.signatures.indemnitor),
            defendant: asBool(data.signatures.defendant),
            cosigners: data.signatures.cosigners.slice(0, 20)
        },
        paid: paid
    };
}

/**
 * GET case status. Client case_id and person_id on `input` are never read.
 */
export async function fetchPortalCaseStatus(input, deps) {
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
    const identity = identityFromSession(session, STATUS_ROLES);
    if (!identity) {
        const role = session && typeof session.role === 'string' ? session.role.trim().toLowerCase() : '';
        const reason = session && session.valid === true && !STATUS_ROLES.includes(role) ? 'role' : 'session';
        logSafe(deps, { step: 'session', reason: reason });
        return { ok: false, reason: reason };
    }
    const keyInfo = await resolveDashboardKey(deps.getSecret);
    if (!keyInfo || !keyInfo.key) {
        logSafe(deps, { step: 'auth', reason: 'missing_key' });
        return { ok: false, reason: 'auth' };
    }
    const params = new URLSearchParams();
    params.set('case_id', identity.caseId);
    params.set('person_id', identity.personId);
    const base = (deps && deps.leadsBase) || LEADS_BASE;
    const timeoutMs = (deps && deps.timeoutMs) || DEFAULT_TIMEOUT_MS;
    try {
        const response = await withTimeout(deps.fetchImpl(base + STATUS_PATH + '?' + params.toString(), {
            method: 'GET',
            headers: authHeaders(keyInfo.key)
        }), timeoutMs);
        const status = response && response.status ? response.status : 0;
        if (!response || status === 404 || !response.ok) {
            logSafe(deps, { step: 'status', reason: status === 404 ? 'not_found' : 'upstream', status: status });
            return { ok: false, reason: 'unavailable' };
        }
        const data = await readJson(response);
        const normalized = normalizeLeadsStatus(data);
        if (!normalized) {
            logSafe(deps, { step: 'status', reason: 'shape', status: status });
            return { ok: false, reason: 'unavailable' };
        }
        logSafe(deps, { step: 'status', reason: 'ok', status: status });
        return { ok: true, status: normalized };
    } catch (error) {
        const timedOut = !!(error && error.code === 'timeout');
        logSafe(deps, { step: 'status', reason: timedOut ? 'timeout' : 'error' });
        return { ok: false, reason: timedOut ? 'timeout' : 'unavailable' };
    }
}
