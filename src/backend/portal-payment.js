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
 * A leads body is accepted only when ok is boolean true, source is
 * "invoice" or "auto", and url is https on a SwipeSimple or Shamrock host.
 * Anything else (missing endpoint, HTTP error, timeout, bad url, no key)
 * falls back to the fixed website pay link. That fallback does not depend
 * on a SwipeSimple feature flag or secret. The case premium is returned
 * with the fallback only when the case record already has one. Bond amount
 * is never turned into a premium. No amount is invented.
 *
 * Invalid, expired, or missing sessions fail closed: no url, no leads call.
 */

export const LEADS_BASE = 'https://leads.shamrockbailbonds.biz';
export const PAYMENT_LINK_PATH = '/api/portal/payment-link';
/** Same link as public/portal-config.js BOND_PAYMENT_LINK. */
export const FALLBACK_PAYMENT_URL = 'https://swipesimple.com/links/lnk_b6bf996f4c57bb340a150e297e769abd';
export const PAYMENT_TIMEOUT_MS = 3000;
export const ESTIMATE_NOTE = 'Amount shown is an estimate; your bail agreement controls.';
export const UNAVAILABLE_NOTE = 'Payment link unavailable right now. Please call (239) 332-2245.';

const PAYMENT_HOST_SUFFIXES = ['swipesimple.com', 'shamrockbailbonds.biz'];
const PAY_ROLES = { defendant: true, indemnitor: true, coindemnitor: true };
const MAX_BODY_CHARS = 8192;
const MAX_ID_CHARS = 200;
const MAX_URL_CHARS = 2000;
const MAX_TIMEOUT_MS = 5000;

const PREMIUM_CENT_FIELDS = ['premiumCents', 'premium_cents'];
const PREMIUM_DOLLAR_FIELDS = ['premiumAmount', 'premium_amount', 'totalPremium', 'total_premium', 'premium'];

function closed(reason) {
    return {
        ok: false,
        url: '',
        amount_cents: null,
        source: '',
        estimate: false,
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

function dollarsToCents(value) {
    if (typeof value === 'number') {
        if (!isFinite(value) || value < 0) return null;
        const scaled = value * 100;
        const cents = Math.round(scaled);
        if (!Number.isSafeInteger(cents)) return null;
        if (Math.abs(scaled - cents) > 1e-6) return null;
        return cents;
    }
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    const plain = /^\$?\d{1,7}(\.\d{1,2})?$/;
    const grouped = /^\$?\d{1,3}(,\d{3})+(\.\d{1,2})?$/;
    if (!plain.test(trimmed) && !grouped.test(trimmed)) return null;
    const stripped = trimmed.replace(/^\$/, '').replace(/,/g, '');
    const dot = stripped.indexOf('.');
    const whole = Number(dot === -1 ? stripped : stripped.slice(0, dot));
    const fracDigits = dot === -1 ? '' : stripped.slice(dot + 1);
    const frac = Number(fracDigits.padEnd(2, '0'));
    if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(frac)) return null;
    const cents = whole * 100 + frac;
    if (!Number.isSafeInteger(cents) || cents < 0) return null;
    return cents;
}

function fieldPresent(record, key) {
    if (!record || typeof record !== 'object') return false;
    if (!Object.prototype.hasOwnProperty.call(record, key)) return false;
    const value = record[key];
    return value !== null && value !== undefined && value !== '';
}

/**
 * Premium already stored on the case, in cents. Missing or unreadable
 * values are null. Bond amount, balance, and down payment are not premiums.
 */
export function readCasePremiumCents(record) {
    if (!record || typeof record !== 'object') return null;
    for (let i = 0; i < PREMIUM_CENT_FIELDS.length; i++) {
        const key = PREMIUM_CENT_FIELDS[i];
        if (!fieldPresent(record, key)) continue;
        const cents = readAmountCents(record[key]);
        if (cents !== null) return cents;
    }
    for (let j = 0; j < PREMIUM_DOLLAR_FIELDS.length; j++) {
        const key = PREMIUM_DOLLAR_FIELDS[j];
        if (!fieldPresent(record, key)) continue;
        const cents = dollarsToCents(record[key]);
        if (cents !== null) return cents;
    }
    return null;
}

function fallbackResult(caseRecord, reason) {
    const url = canonicalPaymentUrl(FALLBACK_PAYMENT_URL);
    if (!url) return closed('fallback_rejected');
    const cents = readCasePremiumCents(caseRecord);
    return {
        ok: true,
        url: url,
        amount_cents: cents,
        source: 'fallback',
        estimate: cents !== null,
        message: ESTIMATE_NOTE,
        reason: reason || 'fallback'
    };
}

function leadsSuccess(data) {
    if (!data || data.ok !== true) return null;
    const source = data.source === 'invoice' || data.source === 'auto' ? data.source : '';
    if (!source) return null;
    const url = canonicalPaymentUrl(data.url);
    if (!url) return null;
    return {
        ok: true,
        url: url,
        amount_cents: readAmountCents(data.amount_cents),
        source: source,
        estimate: false,
        message: '',
        reason: 'leads'
    };
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
        logEvent(deps, 'upstream');
        return null;
    }
    const data = await readBody(response);
    const accepted = leadsSuccess(data);
    if (!accepted) logEvent(deps, 'rejected');
    return accepted;
}

async function readCase(deps, caseId) {
    if (!deps || typeof deps.loadCase !== 'function') return null;
    try {
        const row = await deps.loadCase(caseId);
        if (!row || typeof row !== 'object') return null;
        return row;
    } catch (e) {
        return null;
    }
}

/**
 * @param {string|object} input Session token, or an object whose only read
 *   field is sessionToken. caseId and personId on that object are ignored.
 * @param {object} deps Server dependencies. Not client input.
 * @returns {Promise<{ok:boolean,url:string,amount_cents:number|null,source:string,estimate:boolean,message:string,reason:string}>}
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

    const caseRow = await readCase(deps, session.caseId);
    return fallbackResult(caseRow, 'fallback');
}
