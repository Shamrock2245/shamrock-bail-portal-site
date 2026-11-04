/**
 * Portal payment link resolution.
 * File: backend/portal-payment.js
 *
 * No Wix imports. Callers pass fetch, secrets, and session lookup so tests
 * can mock every network and CMS call.
 *
 * getPaymentLinkForSession(sessionToken) derives case_id and person_id from
 * the server-validated session. Client fields (caseId, personId, case_id,
 * person_id, role) are ignored. Leads is called as:
 *
 *   GET {LEADS_BASE}/api/portal/payment-link?case_id=…&person_id=…
 *
 * Auth headers match portal-signin-dispatch.js (resolveDashboardKey):
 *   X-API-Key and X-Internal-Token are LEADS_API_KEY, or GAS_API_KEY only
 *   when LEADS_API_KEY is unset.
 *
 * A leads body is accepted only when the HTTP status is ok, body.ok is
 * boolean true, source is "invoice" or "auto", and url is https on a
 * SwipeSimple or Shamrock host. A 409 and every other non-ok response,
 * timeout, bad url, or missing key uses PAYMENT_FALLBACK_MODE. The leads
 * HTTP call lives only in fetchLeadsLink.
 *
 * PAYMENT_FALLBACK_MODE is 'call_only': no usable leads link means no url.
 * The page then shows the office phone. This module does not open the
 * website pay link, does not read a premium off the Wix case, and does
 * not text a pay link. Leads sends that text once after signing.
 * amount_cents is copied only from the leads body and labelled Premium due.
 *
 * Invalid, expired, or missing sessions fail closed: no url, no leads call.
 */

export const LEADS_BASE = 'https://leads.shamrockbailbonds.biz';
export const PAYMENT_LINK_PATH = '/api/portal/payment-link';
export const PAYMENT_TIMEOUT_MS = 3000;
export const PREMIUM_DUE_LABEL = 'Premium due';
export const UNAVAILABLE_NOTE = 'Payment link unavailable right now. Please call (239) 332-2245.';
/** Owner decision: with no usable leads link, return no url. */
export const PAYMENT_FALLBACK_MODE = 'call_only';

const PAYMENT_HOST_SUFFIXES = ['swipesimple.com', 'shamrockbailbonds.biz'];
const PAY_ROLES = { defendant: true, indemnitor: true, coindemnitor: true };
const MAX_BODY_CHARS = 8192;
const MAX_ID_CHARS = 200;
const MAX_URL_CHARS = 2000;
const MAX_TIMEOUT_MS = 5000;

function closed(reason) {
    return {
        ok: false,
        url: '',
        amount_cents: null,
        amount_label: '',
        source: '',
        message: UNAVAILABLE_NOTE,
        reason: reason || 'closed'
    };
}

function logEvent(deps, reason) {
    const logger = (deps && deps.logger) || console;
    const safe = {
        event: 'portal_payment',
        reason: String(reason || '').slice(0, 40)
    };
    try {
        if (logger && typeof logger.warn === 'function') {
            logger.warn('[portal-payment] ' + JSON.stringify(safe));
        }
    } catch (e) { /* logging must not break the payment lookup */ }
}

export function sessionTokenFromInput(input) {
    if (typeof input === 'string') return input.trim();
    if (input && typeof input === 'object' && !Array.isArray(input) && typeof input.sessionToken === 'string') {
        return input.sessionToken.trim();
    }
    return '';
}

function sessionId(value) {
    if (typeof value !== 'string') return '';
    const id = value.trim();
    if (!id || id.length > MAX_ID_CHARS) return '';
    if (/[\u0000-\u001F\u007F\s]/.test(id)) return '';
    return id;
}

function sessionRole(session) {
    const role = String(session && session.role || '').trim().toLowerCase();
    return PAY_ROLES[role] ? role : '';
}

/**
 * case_id from the session record only. Older indemnitor sessions store the
 * case id on personId as indemnitor_<caseId> when caseId itself is empty.
 * Nothing in the client argument is consulted.
 */
function caseIdFromSession(session) {
    const direct = sessionId(session && session.caseId);
    if (direct) return direct;
    const personId = sessionId(session && session.personId);
    const prefix = 'indemnitor_';
    if (personId && personId.indexOf(prefix) === 0) return sessionId(personId.slice(prefix.length));
    return '';
}

function sessionExpired(session) {
    if (!session || session.expiresAt == null || session.expiresAt === '') return false;
    const at = new Date(session.expiresAt).getTime();
    if (!Number.isFinite(at)) return true;
    return at <= Date.now();
}

function hostAllowed(host) {
    for (let i = 0; i < PAYMENT_HOST_SUFFIXES.length; i++) {
        const suffix = PAYMENT_HOST_SUFFIXES[i];
        if (host === suffix) return true;
        const dotted = '.' + suffix;
        if (host.length > dotted.length && host.endsWith(dotted)) {
            const prefix = host.slice(0, host.length - dotted.length);
            if (prefix && prefix.indexOf('..') === -1) return true;
        }
    }
    return false;
}

/**
 * https URL whose host is swipesimple.com, shamrockbailbonds.biz, or a
 * subdomain of either. Returns the canonical href, or '' when rejected.
 */
export function canonicalPaymentUrl(value) {
    if (typeof value !== 'string') return '';
    const raw = value.trim();
    if (!raw || raw.length > MAX_URL_CHARS) return '';
    if (/[\u0000-\u001F\u007F\\]/.test(raw)) return '';
    let parsed;
    try {
        parsed = new URL(raw);
    } catch (e) {
        return '';
    }
    if (parsed.protocol !== 'https:') return '';
    if (parsed.username || parsed.password) return '';
    if (parsed.port && parsed.port !== '443') return '';
    let host = String(parsed.hostname || '').toLowerCase();
    if (host.charAt(host.length - 1) === '.') host = host.slice(0, -1);
    if (!host || host.indexOf('..') !== -1 || host.indexOf('%') !== -1) return '';
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return '';
    if (host.indexOf(':') !== -1 || host.charAt(0) === '[') return '';
    if (!hostAllowed(host)) return '';
    // Drop a trailing-dot FQDN so the opened URL is the allowlisted host.
    if (parsed.hostname !== host) {
        try { parsed.hostname = host; } catch (e) { return ''; }
    }
    if (parsed.hostname !== host) return '';
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return '';
    return parsed.href;
}

export function readAmountCents(value) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) return null;
    return value;
}

function leadsAmount(cents) {
    return {
        amount_cents: cents,
        amount_label: cents === null ? '' : PREMIUM_DUE_LABEL
    };
}

/** No usable leads link. Never a website pay link and never a case premium. */
function applyFallback(deps) {
    logEvent(deps, PAYMENT_FALLBACK_MODE === 'call_only' ? 'call_only' : 'bad_fallback_mode');
    return closed(PAYMENT_FALLBACK_MODE === 'call_only' ? 'call_only' : 'bad_fallback_mode');
}

async function readSession(deps, token) {
    if (!token || !deps || typeof deps.validateSession !== 'function') {
        return { ok: false, reason: 'invalid' };
    }
    let session;
    try {
        session = await deps.validateSession(token);
    } catch (e) {
        return { ok: false, reason: 'invalid' };
    }
    if (!session || session.valid !== true) {
        return { ok: false, reason: session && session.reason === 'expired' ? 'expired' : 'invalid' };
    }
    if (sessionExpired(session)) return { ok: false, reason: 'expired' };
    const personId = sessionId(session.personId);
    const caseId = caseIdFromSession(session);
    const role = sessionRole(session);
    if (!personId || !caseId || !role) return { ok: false, reason: 'invalid' };
    return { ok: true, session: { personId: personId, caseId: caseId, role: role } };
}

function leadsOrigin(deps) {
    const raw = deps && typeof deps.leadsBase === 'string' && deps.leadsBase
        ? deps.leadsBase.trim()
        : LEADS_BASE;
    let parsed;
    try {
        parsed = new URL(raw);
    } catch (e) {
        return '';
    }
    if (parsed.protocol !== 'https:') return '';
    if (parsed.username || parsed.password) return '';
    const host = parsed.hostname.toLowerCase();
    if (host === 'leads.shamrockbailbonds.biz') return parsed.origin;
    // Reserved .test hosts are for the unit-test double only. The web module
    // does not pass leadsBase, so production always uses LEADS_BASE.
    if (/^[a-z0-9.-]+\.test$/.test(host)) return parsed.origin;
    return '';
}

async function dashboardKey(deps) {
    const resolve = deps && deps.resolveDashboardKey;
    if (typeof resolve !== 'function') return { key: '', source: '' };
    try {
        const info = await resolve(deps.getSecret);
        const key = info && typeof info.key === 'string' ? info.key.trim() : '';
        const source = info && typeof info.source === 'string' ? info.source : '';
        if (!key || key.length > 500) return { key: '', source: '' };
        if (/[\u0000-\u001F\u007F]/.test(key)) return { key: '', source: '' };
        return { key: key, source: source };
    } catch (e) {
        return { key: '', source: '' };
    }
}

function authHeaders(key) {
    // Same pair portal-signin-dispatch.js sends for dashboard calls.
    return {
        'Content-Type': 'application/json',
        'X-API-Key': key,
        'X-Internal-Token': key
    };
}

function timeoutMs(deps) {
    const requested = Number(deps && deps.timeoutMs);
    if (Number.isFinite(requested) && requested > 0 && requested <= MAX_TIMEOUT_MS) return requested;
    return PAYMENT_TIMEOUT_MS;
}

function requestWithTimeout(fetchImpl, url, headers, ms) {
    let timer;
    const pending = Promise.resolve().then(function () {
        return fetchImpl(url, { method: 'GET', headers: headers });
    });
    const timeout = new Promise(function (_, reject) {
        timer = setTimeout(function () {
            const err = new Error('timeout');
            err.code = 'timeout';
            reject(err);
        }, ms);
    });
    return Promise.race([pending, timeout]).finally(function () {
        clearTimeout(timer);
        pending.catch(function () { /* abandoned after timeout */ });
    });
}

async function readBody(response) {
    if (!response || typeof response.text !== 'function') return null;
    let raw = '';
    try {
        raw = await response.text();
    } catch (e) {
        return null;
    }
    if (typeof raw !== 'string' || raw.length > MAX_BODY_CHARS) return null;
    try {
        const data = JSON.parse(raw);
        if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
        return data;
    } catch (e) {
        return null;
    }
}

function paymentRequestUrl(origin, session) {
    const url = new URL(PAYMENT_LINK_PATH, origin);
    url.searchParams.set('case_id', session.caseId);
    url.searchParams.set('person_id', session.personId);
    return url.href;
}

/**
 * The only function that calls leads. A future POST or 409 body
 * (for example premium_unconfirmed) changes here. HTTP 409 and every
 * other non-ok status return null so the caller uses PAYMENT_FALLBACK_MODE.
 * A usable link requires HTTP ok, body.ok === true, source invoice|auto,
 * and an allowlisted https url. The response object is never returned whole.
 */
async function fetchLeadsLink(deps, origin, session, keyInfo) {
    if (!deps || typeof deps.fetchImpl !== 'function') return null;
    const url = paymentRequestUrl(origin, session);
    let response;
    try {
        response = await requestWithTimeout(deps.fetchImpl, url, authHeaders(keyInfo.key), timeoutMs(deps));
    } catch (e) {
        logEvent(deps, e && e.code === 'timeout' ? 'timeout' : 'unreachable');
        return null;
    }
    if (!response || response.ok !== true) {
        const status = response && Number(response.status);
        logEvent(deps, status === 409 ? 'http_409' : 'upstream');
        return null;
    }
    const data = await readBody(response);
    if (!data || data.ok !== true) {
        logEvent(deps, 'rejected');
        return null;
    }
    const source = data.source === 'invoice' || data.source === 'auto' ? data.source : '';
    const link = source ? canonicalPaymentUrl(data.url) : '';
    if (!source || !link) {
        logEvent(deps, 'rejected');
        return null;
    }
    const amount = leadsAmount(readAmountCents(data.amount_cents));
    return {
        ok: true,
        url: link,
        amount_cents: amount.amount_cents,
        amount_label: amount.amount_label,
        source: source,
        message: '',
        reason: 'leads'
    };
}

/**
 * @param {string|object} input Session token, or an object whose only read
 *   field is sessionToken. caseId and personId on that object are ignored.
 * @param {object} deps Server dependencies. Not client input.
 * @returns {Promise<{ok:boolean,url:string,amount_cents:number|null,amount_label:string,source:string,message:string,reason:string}>}
 */
export async function getPaymentLinkForSession(input, deps) {
    const token = sessionTokenFromInput(input);
    if (!token) {
        logEvent(deps, 'no_session');
        return closed('no_session');
    }
    const lookedUp = await readSession(deps, token);
    if (!lookedUp.ok) {
        logEvent(deps, lookedUp.reason);
        return closed(lookedUp.reason);
    }
    const session = lookedUp.session;

    const origin = leadsOrigin(deps);
    const keyInfo = origin ? await dashboardKey(deps) : { key: '', source: '' };
    if (origin && keyInfo.key) {
        const link = await fetchLeadsLink(deps, origin, session, keyInfo);
        if (link) return link;
    } else if (!keyInfo.key) {
        logEvent(deps, origin ? 'missing_key' : 'bad_origin');
    }

    return applyFallback(deps);
}
