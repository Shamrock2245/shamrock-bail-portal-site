/**
 * Portal invoice link.
 * File: backend/portal-payment.js
 *
 * No Wix imports. Callers pass fetch, secrets, session lookup, and case
 * lookup so tests can mock every network and CMS call.
 *
 * Final leads contract (shamrock-leads 3bca506). After the Wix session is validated and
 * this member is confirmed as the indemnitor on the case, the booking
 * number comes from that case record only.
 *
 * Machine key (dashboard/auth/pin_middleware.py is_machine_auth_valid):
 * leads accepts X-API-Key, X-Api-Key, or X-Internal-Token when the value
 * equals env GAS_API_KEY, LEADS_INTERNAL_TOKEN, or INTERNAL_API_TOKEN.
 * LEADS_API_KEY is not accepted. GET /api/portal/tokens/{booking} and
 * POST /api/portal/generate both use _staff_actor, so a valid machine key
 * is accepted on both. This module sends Wix secret GAS_API_KEY and, when
 * that secret is missing or leads answers staff_auth_required, returns
 * call_only without trying LEADS_API_KEY.
 *
 * An active indemnitor token is reused from the token list. Otherwise one
 * is minted with {booking_number, role:'indemnitor'}. The token never
 * leaves this module: it is not returned, not logged, and not copied into
 * an error. POST /api/portal/{token}/invoice-link sends exactly
 * {send_copy:false, channel:'imessage'} and never an amount.
 *
 * The browser result is only {state, payment_url?, amount_cents?}.
 */

export const LEADS_BASE = 'https://leads.shamrockbailbonds.biz';
export const PAYMENT_FALLBACK_MODE = 'call_only';
export const MACHINE_KEY_SECRET = 'GAS_API_KEY';
export const PREMIUM_DUE_LABEL = 'Premium due';
export const CALL_NOTE = 'Please call (239) 332-2245.';
export const PREPARED_NOTE = 'Your link is being prepared, please try again in a moment';
export const EXPIRED_NOTE = 'Your payment link expired. Please call (239) 332-2245.';
export const PAID_NOTE = 'Paid';
export const PAYMENT_TIMEOUT_MS = 3000;
export const INVOICE_RETRY_MAX = 3;
export const INVOICE_RETRY_SECONDS = 3;
/**
 * Machine-key finding from shamrock-leads 3bca506 is_machine_auth_valid.
 * LEADS_API_KEY is not accepted. Token list and generate both accept the
 * machine key. The Wix secret that can match is GAS_API_KEY.
 */
export const MACHINE_KEY_FINDING = 'LEADS_API_KEY is not accepted. is_machine_auth_valid accepts GAS_API_KEY, LEADS_INTERNAL_TOKEN, or INTERNAL_API_TOKEN via X-API-Key, X-Api-Key, or X-Internal-Token. GET /api/portal/tokens/{booking_number} and POST /api/portal/generate both accept that machine key. Missing Wix GAS_API_KEY falls back to call_only.';

const INVOICE_BODY = { send_copy: false, channel: 'imessage' };
const PAYMENT_HOST_SUFFIXES = ['swipesimple.com', 'shamrockbailbonds.biz'];
const INDEMNITOR_ROLES = { indemnitor: true, coindemnitor: true };
const MAX_BODY_CHARS = 8192;
const MAX_ID_CHARS = 200;
const MAX_URL_CHARS = 2000;
const MAX_TIMEOUT_MS = 5000;
const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

function clientState(state, extra) {
    const out = { state: state };
    if (state === 'ok' && extra) {
        out.payment_url = extra.payment_url;
        out.amount_cents = extra.amount_cents;
    }
    return out;
}

function logEvent(deps, reason) {
    const logger = (deps && deps.logger) || console;
    const safe = {
        event: 'portal_payment',
        reason: String(reason || '').replace(/[^a-z0-9_]/gi, '').slice(0, 40)
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
    return String(session && session.role || '').trim().toLowerCase();
}

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

/** https on a SwipeSimple or Shamrock host, and not a static /links/ or lnk_ page. */
export function canonicalPaymentUrl(value) {
    if (typeof value !== 'string') return '';
    const raw = value.trim();
    if (!raw || raw.length > MAX_URL_CHARS) return '';
    if (/[\u0000-\u001F\u007F\\]/.test(raw)) return '';
    if (raw.toLowerCase().indexOf('lnk_') !== -1) return '';
    let parsed;
    try {
        parsed = new URL(raw);
    } catch (e) {
        return '';
    }
    if (parsed.protocol !== 'https:') return '';
    if (parsed.username || parsed.password) return '';
    if (parsed.port && parsed.port !== '443') return '';
    if (parsed.pathname.toLowerCase().indexOf('/links/') !== -1) return '';
    let host = String(parsed.hostname || '').toLowerCase();
    if (host.charAt(host.length - 1) === '.') host = host.slice(0, -1);
    if (!host || host.indexOf('..') !== -1 || host.indexOf('%') !== -1) return '';
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return '';
    if (host.indexOf(':') !== -1 || host.charAt(0) === '[') return '';
    if (!hostAllowed(host)) return '';
    if (parsed.hostname !== host) {
        try { parsed.hostname = host; } catch (e) { return ''; }
    }
    if (parsed.hostname !== host) return '';
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return '';
    if (parsed.href.toLowerCase().indexOf('lnk_') !== -1) return '';
    return parsed.href;
}

export function readAmountCents(value) {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) return null;
    return value;
}

function sanitizeToken(value) {
    if (typeof value !== 'string') return '';
    const token = value.trim();
    if (!TOKEN_RE.test(token)) return '';
    return token;
}

function bookingFromCase(row) {
    if (!row || typeof row !== 'object') return '';
    const keys = ['bookingNumber', 'booking_number', 'defendantBookingNumber'];
    for (let i = 0; i < keys.length; i++) {
        const booking = sessionId(row[keys[i]]);
        if (booking) return booking;
    }
    return '';
}

function contactEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function contactPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 11 && digits.charAt(0) === '1') return digits.slice(1);
    return digits.length === 10 ? digits : '';
}

/**
 * True only when the validated session is an indemnitor (or co-indemnitor)
 * bound to this case. Defendant, staff, and a cosigner on a different case
 * are not this case's indemnitor.
 */
export function memberIsCaseIndemnitor(session, caseRow, caseId) {
    const role = sessionRole(session);
    if (!INDEMNITOR_ROLES[role]) return false;
    if (!caseRow || typeof caseRow !== 'object') return false;
    const boundId = sessionId(caseRow._id) || caseId;
    if (!boundId || boundId !== caseId) return false;
    const personId = sessionId(session && session.personId);
    if (personId === 'indemnitor_' + boundId || personId === 'coindemnitor_' + boundId) return true;
    const email = contactEmail(session && session.email);
    const emailKeys = ['indemnitorEmail', 'indemnitor2Email', 'indemnitor3Email', 'coindemnitorEmail'];
    for (let i = 0; i < emailKeys.length; i++) {
        const onFile = contactEmail(caseRow[emailKeys[i]]);
        if (email && onFile && email === onFile) return true;
    }
    const phone = contactPhone(session && session.phone);
    const phoneKeys = ['indemnitorPhone', 'indemnitor2Phone', 'coindemnitorPhone'];
    for (let j = 0; j < phoneKeys.length; j++) {
        const onFile = contactPhone(caseRow[phoneKeys[j]]);
        if (phone && onFile && phone === onFile) return true;
    }
    return false;
}

async function readSession(deps, token) {
    if (!token || !deps || typeof deps.validateSession !== 'function') return null;
    let session;
    try {
        session = await deps.validateSession(token);
    } catch (e) {
        return null;
    }
    if (!session || session.valid !== true) return null;
    if (sessionExpired(session)) return null;
    const caseId = caseIdFromSession(session);
    const personId = sessionId(session.personId);
    const role = sessionRole(session);
    if (!caseId || !personId || !role) return null;
    return {
        personId: personId,
        caseId: caseId,
        role: role,
        email: session.email,
        phone: session.phone
    };
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
    if (/^[a-z0-9.-]+\.test$/.test(host)) return parsed.origin;
    return '';
}

async function machineKey(deps) {
    if (!deps || typeof deps.getSecret !== 'function') return '';
    let value = '';
    try {
        value = await deps.getSecret(MACHINE_KEY_SECRET);
    } catch (e) {
        return '';
    }
    if (typeof value !== 'string') return '';
    const key = value.trim();
    if (!key || key.length > 500) return '';
    if (/[\u0000-\u001F\u007F]/.test(key)) return '';
    return key;
}

function machineHeaders(key) {
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': key
    };
}

function timeoutMs(deps) {
    const requested = Number(deps && deps.timeoutMs);
    if (Number.isFinite(requested) && requested > 0 && requested <= MAX_TIMEOUT_MS) return requested;
    return PAYMENT_TIMEOUT_MS;
}

function requestWithTimeout(fetchImpl, url, options, ms) {
    let timer;
    const pending = Promise.resolve().then(function () {
        return fetchImpl(url, options);
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

async function requestJson(deps, url, options) {
    let response;
    try {
        response = await requestWithTimeout(deps.fetchImpl, url, options, timeoutMs(deps));
    } catch (e) {
        logEvent(deps, e && e.code === 'timeout' ? 'timeout' : 'unreachable');
        return null;
    }
    const data = await readBody(response);
    return {
        status: response && Number(response.status) || 0,
        data: data
    };
}

function waitSeconds(deps, seconds) {
    const ms = Math.round(seconds * 1000);
    if (deps && typeof deps.sleep === 'function') return Promise.resolve(deps.sleep(ms));
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function retrySeconds(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > 30) {
        return INVOICE_RETRY_SECONDS;
    }
    return value;
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

function indemnitorTokenFromList(data) {
    const list = data && Array.isArray(data.tokens) ? data.tokens : [];
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item || String(item.role || '').toLowerCase() !== 'indemnitor') continue;
        const token = sanitizeToken(item.token);
        if (token) return token;
    }
    return '';
}

async function resolveIndemnitorToken(deps, origin, booking, key) {
    const listed = await requestJson(deps, origin + '/api/portal/tokens/' + encodeURIComponent(booking), {
        method: 'GET',
        headers: machineHeaders(key)
    });
    if (!listed) return { token: '', rejected: false };
    if (listed.status === 401) return { token: '', rejected: true };
    if (listed.status === 200) {
        const existing = indemnitorTokenFromList(listed.data);
        if (existing) return { token: existing, rejected: false };
    }
    const minted = await requestJson(deps, origin + '/api/portal/generate', {
        method: 'POST',
        headers: machineHeaders(key),
        body: JSON.stringify({ booking_number: booking, role: 'indemnitor' })
    });
    if (!minted) return { token: '', rejected: false };
    if (minted.status === 401) return { token: '', rejected: true };
    if (minted.status === 201 && minted.data && minted.data.success === true) {
        return { token: sanitizeToken(minted.data.token), rejected: false };
    }
    return { token: '', rejected: false };
}

function classifyInvoice(status, data, token) {
    if (status === 200 && data && data.ok === true) {
        const paymentUrl = canonicalPaymentUrl(data.payment_url);
        const cents = readAmountCents(data.amount_cents);
        if (!paymentUrl || !cents || paymentUrl.indexOf(token) !== -1) return { kind: 'call_only' };
        return { kind: 'ok', payment_url: paymentUrl, amount_cents: cents };
    }
    if (status === 202 && data && data.error === 'in_progress') {
        return { kind: 'retry', wait: retrySeconds(data.retry_after_seconds) };
    }
    if (status === 401) return { kind: 'expired' };
    if (status === 403 && data && data.error === 'role_not_indemnitor') return { kind: 'role_not_indemnitor' };
    if (status === 409 && data && data.error === 'already_paid') return { kind: 'already_paid' };
    if (status === 429) return { kind: 'rate_limited' };
    return { kind: 'call_only' };
}

/**
 * The only function that calls invoice-link. 202 is retried here. 4xx is not.
 */
async function fetchInvoiceLink(deps, origin, token) {
    const url = origin + '/api/portal/' + encodeURIComponent(token) + '/invoice-link';
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(INVOICE_BODY)
    };
    let retries = 0;
    while (retries <= INVOICE_RETRY_MAX) {
        const response = await requestJson(deps, url, options);
        if (!response) return { kind: 'call_only' };
        const classified = classifyInvoice(response.status, response.data, token);
        if (classified.kind !== 'retry') return classified;
        if (retries >= INVOICE_RETRY_MAX) return { kind: 'preparing' };
        retries += 1;
        await waitSeconds(deps, classified.wait);
    }
    return { kind: 'preparing' };
}

function toClient(kind, extra) {
    if (kind === 'ok') return clientState('ok', extra);
    if (kind === 'preparing') return clientState('preparing');
    if (kind === 'role_not_indemnitor') return clientState('role_not_indemnitor');
    if (kind === 'already_paid') return clientState('already_paid');
    if (kind === 'expired') return clientState('expired');
    if (kind === 'rate_limited') return clientState('rate_limited');
    return clientState('call_only');
}

/**
 * @param {string|object} input Session token. Only sessionToken is read.
 * @param {object} deps Server dependencies. Not client input.
 * @returns {Promise<{state:string,payment_url?:string,amount_cents?:number}>}
 */
export async function getPaymentLinkForSession(input, deps) {
    const wixToken = sessionTokenFromInput(input);
    if (!wixToken) {
        logEvent(deps, 'no_session');
        return clientState('call_only');
    }
    const session = await readSession(deps, wixToken);
    if (!session) {
        logEvent(deps, 'invalid');
        return clientState('call_only');
    }
    if (!INDEMNITOR_ROLES[session.role]) {
        logEvent(deps, 'role_not_indemnitor');
        return clientState('role_not_indemnitor');
    }
    const caseRow = await readCase(deps, session.caseId);
    if (!memberIsCaseIndemnitor(session, caseRow, session.caseId)) {
        logEvent(deps, 'role_not_indemnitor');
        return clientState('role_not_indemnitor');
    }
    const booking = bookingFromCase(caseRow);
    if (!booking) {
        logEvent(deps, 'no_booking');
        return clientState('call_only');
    }
    if (PAYMENT_FALLBACK_MODE !== 'call_only') {
        logEvent(deps, 'bad_fallback_mode');
        return clientState('call_only');
    }
    const origin = leadsOrigin(deps);
    if (!origin) {
        logEvent(deps, 'bad_origin');
        return clientState('call_only');
    }
    const key = await machineKey(deps);
    if (!key) {
        logEvent(deps, 'machine_key_missing');
        return clientState('call_only');
    }
    if (!deps || typeof deps.fetchImpl !== 'function') {
        logEvent(deps, 'fetch_unavailable');
        return clientState('call_only');
    }
    const resolved = await resolveIndemnitorToken(deps, origin, booking, key);
    if (resolved.rejected) {
        logEvent(deps, 'machine_key_rejected');
        return clientState('call_only');
    }
    if (!resolved.token) {
        logEvent(deps, 'no_portal_token');
        return clientState('call_only');
    }
    const invoice = await fetchInvoiceLink(deps, origin, resolved.token);
    logEvent(deps, invoice.kind);
    return toClient(invoice.kind, invoice);
}
