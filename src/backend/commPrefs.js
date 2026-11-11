/**
 * Communication preferences — save, load, and personal-link helpers.
 *
 * The .jsw wrapper wires Wix APIs. Tests inject fakes. Persist only after
 * the GAS consent gate resolves OK. Consent changes require a validated
 * Wix member or portal session whose server-derived contact matches, or a
 * personal signed link token (HMAC + expiry). Client-supplied phone and
 * personId are ignored for identity. All-channels-off is a valid withdrawal
 * and is stored as explicit false opt-outs.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export const COMM_PREFS_LINK_SECRET_NAME = 'COMM_PREFS_LINK_SECRET';
export const AUTH_REQUIRED_ERROR =
    'Please use the personal link from your text message or sign in to view or change your communication preferences.';
export const CHANNEL_NAMES = ['sms', 'whatsapp', 'telegram', 'email'];
export const CHANNELS = ['smsOptIn', 'whatsappOptIn', 'telegramOptIn', 'emailOptIn'];
export const DEFAULT_LINK_TTL_SECONDS = 7 * 24 * 60 * 60;
export const LINK_TOKEN_TYPE = 'commprefs';

const AUTH_FAIL = { ok: false, error: AUTH_REQUIRED_ERROR, code: 'auth_required' };

export function phoneDigits(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length >= 11 && digits.charAt(0) === '1') return digits.slice(-10);
    if (digits.length >= 10) return digits.slice(-10);
    return digits;
}

export function emailsEqual(a, b) {
    const left = String(a || '').trim().toLowerCase();
    const right = String(b || '').trim().toLowerCase();
    return Boolean(left && right && left === right);
}

export function phonesEqual(a, b) {
    const left = phoneDigits(a);
    const right = phoneDigits(b);
    return left.length === 10 && left === right;
}

export function normalizeChannelScope(raw) {
    if (raw == null || raw === '' || raw === '*' || raw === 'all') return CHANNEL_NAMES.slice();
    const list = Array.isArray(raw) ? raw : String(raw).split(/[,\s]+/);
    const out = [];
    for (let i = 0; i < list.length; i++) {
        let name = String(list[i] || '').trim().toLowerCase();
        if (!name) continue;
        if (name === '*' || name === 'all') return CHANNEL_NAMES.slice();
        name = name.replace(/optin$/, '');
        if (CHANNEL_NAMES.indexOf(name) !== -1 && out.indexOf(name) === -1) out.push(name);
    }
    return out;
}

function channelKey(name) {
    return name + 'OptIn';
}

/**
 * Same algorithm as generateSignedToken / verifySignedToken in auth-utils.jsw.
 * Kept here so tests and this module do not have to import a .jsw file.
 */
export function signCommPrefsPayload(payload, secret) {
    const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const signature = createHmac('sha256', secret).update(payloadBase64).digest('base64url');
    return payloadBase64 + '.' + signature;
}

export function verifyCommPrefsPayload(token, secret) {
    try {
        if (!token || !secret || typeof token !== 'string' || typeof secret !== 'string') return null;
        const parts = token.split('.');
        if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
        const expected = createHmac('sha256', secret).update(parts[0]).digest('base64url');
        const sigBuffer = Buffer.from(parts[1], 'base64url');
        const expectedBuffer = Buffer.from(expected, 'base64url');
        if (sigBuffer.length !== expectedBuffer.length) return null;
        if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
        return JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    } catch (e) {
        return null;
    }
}

export function validateCommPrefsInput(input) {
    const src = input && typeof input === 'object' ? input : {};
    const firstName = String(src.firstName || '').trim();
    const lastName = String(src.lastName || '').trim();
    const phone = String(src.phone || '').trim();
    const email = String(src.email || '').trim();
    const caseNumber = String(src.caseNumber || '').trim();

    if (!firstName || !lastName) {
        return { ok: false, error: 'First name and last name are required.' };
    }
    if (!phone) {
        return { ok: false, error: 'Phone number is required.' };
    }
    const digits = phoneDigits(phone);
    if (digits.length < 10) {
        return { ok: false, error: 'Please enter a valid phone number.' };
    }

    const prefs = {
        firstName,
        lastName,
        phone,
        email,
        caseNumber,
        smsOptIn: src.smsOptIn === true,
        whatsappOptIn: src.whatsappOptIn === true,
        telegramOptIn: src.telegramOptIn === true,
        emailOptIn: src.emailOptIn === true
    };
    return { ok: true, prefs };
}

/**
 * Inspect a GAS updateCommPrefs response. HTTP 2xx is not enough:
 * the gate returns { success: false } in the JSON body for validation
 * and auth failures.
 */
export function interpretGasCommPrefsResult(response, body) {
    if (!response || response.ok !== true) {
        const status = response && response.status != null ? response.status : 'error';
        return { success: false, error: 'GAS returned ' + status };
    }
    if (!body || body.success !== true) {
        const detail = body && (body.error || body.message);
        return {
            success: false,
            error: detail || 'GAS consent gate rejected the update.'
        };
    }
    return { success: true, result: body };
}

function signToken(payload, secret, deps) {
    if (deps && typeof deps.signToken === 'function') return deps.signToken(payload, secret);
    return signCommPrefsPayload(payload, secret);
}

function verifyToken(token, secret, deps) {
    if (deps && typeof deps.verifyToken === 'function') return deps.verifyToken(token, secret);
    return verifyCommPrefsPayload(token, secret);
}

async function readLinkSecret(deps) {
    if (!deps || typeof deps.getLinkSecret !== 'function') return '';
    try {
        const secret = await deps.getLinkSecret();
        return secret && typeof secret === 'string' ? secret : '';
    } catch (e) {
        return '';
    }
}

function compactPayload(payload) {
    const out = {};
    Object.keys(payload).forEach((key) => {
        if (payload[key] !== undefined && payload[key] !== '') out[key] = payload[key];
    });
    return out;
}

/**
 * Mint a personal signed preferences-link token for leads / Node-RED.
 * Does not send texts or emails. Fails closed if COMM_PREFS_LINK_SECRET
 * is missing. Not a client-invokable web method.
 */
export async function mintCommPrefsLinkToken(input, deps) {
    const src = input && typeof input === 'object' ? input : {};
    const contactId = String(src.contactId || src.personId || '').trim();
    const phone = String(src.phone || '').trim();
    const email = String(src.email || '').trim().toLowerCase();
    if (phone && phoneDigits(phone).length < 10) {
        return { ok: false, error: 'Please enter a valid phone number.' };
    }
    let resolvedPhone = phone && phoneDigits(phone).length >= 10 ? phone : '';
    if (!resolvedPhone && (contactId || email)) {
        const row = await lookupContact({
            personId: contactId,
            contactId: contactId,
            phone: '',
            email: email
        }, deps);
        if (row && phoneDigits(row.phone).length >= 10) resolvedPhone = String(row.phone);
    }
    if (!resolvedPhone || phoneDigits(resolvedPhone).length < 10) {
        return { ok: false, error: 'A resolvable phone number is required to mint a preferences link.' };
    }
    const channels = normalizeChannelScope(src.channels);
    if (!channels.length) {
        return { ok: false, error: 'A channel scope is required.' };
    }
    const secret = await readLinkSecret(deps);
    if (!secret) {
        return { ok: false, error: 'Preferences link signing is not configured.' };
    }
    const now = deps && deps.now ? deps.now() : new Date();
    const ttlRaw = Number(src.expiresInSeconds || src.ttlSeconds);
    const ttl = ttlRaw > 0 ? Math.floor(ttlRaw) : DEFAULT_LINK_TTL_SECONDS;
    const exp = Math.floor(now.getTime() / 1000) + ttl;
    const payload = compactPayload({
        typ: LINK_TOKEN_TYPE,
        contactId: contactId || undefined,
        phone: phoneDigits(resolvedPhone),
        email: email || undefined,
        channels: channels,
        exp: exp
    });
    return {
        ok: true,
        token: signToken(payload, secret, deps),
        expiresAt: new Date(exp * 1000).toISOString(),
        channels: channels
    };
}

function linkTokenFromInput(input) {
    if (!input || typeof input !== 'object') return '';
    return String(input.linkToken || input.cpt || '').trim();
}

async function lookupContact(identity, deps) {
    if (!deps || typeof deps.queryUsersByContact !== 'function') return null;
    try {
        return (await deps.queryUsersByContact({
            personId: identity.personId || identity.contactId || '',
            phone: identity.phone || '',
            email: identity.email || ''
        })) || null;
    } catch (e) {
        return null;
    }
}

function enrichIdentity(identity, row) {
    if (!row) return identity;
    return {
        source: identity.source,
        personId: identity.personId || row.personId || '',
        contactId: identity.contactId || row.contactId || '',
        phone: identity.phone || row.phone || '',
        email: identity.email || row.email || '',
        channels: identity.channels && identity.channels.length ? identity.channels : CHANNEL_NAMES.slice(),
        firstName: identity.firstName || row.firstName || '',
        lastName: identity.lastName || row.lastName || '',
        caseNumber: identity.caseNumber || row.caseNumber || row.bookingNumber || ''
    };
}

function identitiesCompatible(a, b) {
    if (!a || !b) return false;
    if (a.personId && b.personId && String(a.personId) === String(b.personId)) return true;
    if (a.contactId && b.contactId && String(a.contactId) === String(b.contactId)) return true;
    if (phonesEqual(a.phone, b.phone)) return true;
    if (emailsEqual(a.email, b.email)) return true;
    return false;
}

function mergeIdentities(sessionIdentity, linkIdentity) {
    return {
        source: sessionIdentity.source,
        personId: sessionIdentity.personId || linkIdentity.personId || '',
        contactId: sessionIdentity.contactId || linkIdentity.contactId || '',
        phone: sessionIdentity.phone || linkIdentity.phone || '',
        email: sessionIdentity.email || linkIdentity.email || '',
        channels: linkIdentity.channels && linkIdentity.channels.length
            ? linkIdentity.channels
            : CHANNEL_NAMES.slice(),
        firstName: sessionIdentity.firstName || linkIdentity.firstName || '',
        lastName: sessionIdentity.lastName || linkIdentity.lastName || '',
        caseNumber: sessionIdentity.caseNumber || linkIdentity.caseNumber || ''
    };
}

async function identityFromSession(input, deps) {
    const token = input && input.sessionToken;
    if (!token || typeof deps.validateSession !== 'function') return null;
    let session;
    try {
        session = await deps.validateSession(token);
    } catch (e) {
        return null;
    }
    if (!session || session.valid !== true) return null;
    const seed = {
        source: 'session',
        personId: session.personId ? String(session.personId) : '',
        contactId: '',
        phone: session.phone || '',
        email: session.email || '',
        channels: CHANNEL_NAMES.slice(),
        firstName: '',
        lastName: '',
        caseNumber: ''
    };
    if (!seed.personId && !seed.phone && !seed.email) return null;
    return enrichIdentity(seed, await lookupContact(seed, deps));
}

function memberPhone(member) {
    const details = (member && member.contactDetails) || {};
    const phones = details.phones || details.phone || [];
    const list = Array.isArray(phones) ? phones : [phones];
    for (let i = 0; i < list.length; i++) {
        const entry = list[i];
        if (!entry) continue;
        if (typeof entry === 'string' && entry.trim()) return entry.trim();
        const value = entry.number || entry.phone || entry.value || '';
        if (value) return String(value);
    }
    return '';
}

function memberEmail(member) {
    if (member && member.loginEmail) return String(member.loginEmail);
    const details = (member && member.contactDetails) || {};
    const emails = details.emails || details.email || [];
    const list = Array.isArray(emails) ? emails : [emails];
    for (let i = 0; i < list.length; i++) {
        const entry = list[i];
        if (!entry) continue;
        if (typeof entry === 'string' && entry.trim()) return entry.trim();
        const value = entry.email || entry.value || '';
        if (value) return String(value);
    }
    return '';
}

async function identityFromMember(deps) {
    if (!deps || typeof deps.getCurrentMember !== 'function') return null;
    let member;
    try {
        member = await deps.getCurrentMember();
    } catch (e) {
        return null;
    }
    if (!member) return null;
    const seed = {
        source: 'member',
        personId: '',
        contactId: member.contactId ? String(member.contactId) : '',
        phone: memberPhone(member),
        email: memberEmail(member),
        channels: CHANNEL_NAMES.slice(),
        firstName: (member.contactDetails && member.contactDetails.firstName) || '',
        lastName: (member.contactDetails && member.contactDetails.lastName) || '',
        caseNumber: ''
    };
    if (!seed.contactId && !seed.phone && !seed.email) return null;
    return enrichIdentity(seed, await lookupContact(seed, deps));
}

async function identityFromLinkToken(input, deps) {
    const token = linkTokenFromInput(input);
    if (!token) return null;
    const secret = await readLinkSecret(deps);
    if (!secret) return null;
    const payload = verifyToken(token, secret, deps);
    if (!payload || payload.typ !== LINK_TOKEN_TYPE) return null;
    const now = deps && deps.now ? deps.now() : new Date();
    const exp = Number(payload.exp);
    if (!exp || now.getTime() / 1000 >= exp) return null;
    const channels = normalizeChannelScope(payload.channels);
    if (!channels.length) return null;
    const seed = {
        source: 'link',
        personId: payload.contactId ? String(payload.contactId) : '',
        contactId: payload.contactId ? String(payload.contactId) : '',
        phone: payload.phone || '',
        email: payload.email || '',
        channels: channels,
        firstName: '',
        lastName: '',
        caseNumber: ''
    };
    if (!seed.personId && !seed.phone && !seed.email) return null;
    return enrichIdentity(seed, await lookupContact(seed, deps));
}

/**
 * Resolve the caller from a portal/Wix session or a personal signed link.
 * Client-supplied phone and personId are not used for identity.
 */
export async function resolveCommPrefsAuth(input, deps) {
    const sessionIdentity = (await identityFromSession(input, deps)) || (await identityFromMember(deps));
    const linkIdentity = await identityFromLinkToken(input, deps);
    if (sessionIdentity && linkIdentity) {
        if (!identitiesCompatible(sessionIdentity, linkIdentity)) return AUTH_FAIL;
        return { ok: true, identity: mergeIdentities(sessionIdentity, linkIdentity) };
    }
    if (sessionIdentity) return { ok: true, identity: sessionIdentity };
    if (linkIdentity) return { ok: true, identity: linkIdentity };
    return AUTH_FAIL;
}

export const SCOPE_MISMATCH_ERROR =
    'This link can only change the communication channel it was sent for. Other channels were not updated.';
export const GAS_READ_ERROR =
    'Could not read current consent from the gate. Your preferences were not saved. Please try again.';

function explicitFlag(record, key) {
    if (!record || typeof record !== 'object') return undefined;
    const alts = key === 'whatsappOptIn' ? ['whatsappOptIn', 'whatsAppOptIn'] : [key];
    for (let i = 0; i < alts.length; i++) {
        const k = alts[i];
        if (Object.prototype.hasOwnProperty.call(record, k) && record[k] !== undefined && record[k] !== null) {
            return record[k] === true;
        }
    }
    return undefined;
}

function normalizeFlagMap(src) {
    const out = unknownChannelFlags();
    if (!src || typeof src !== 'object') return out;
    for (let i = 0; i < CHANNELS.length; i++) {
        const key = CHANNELS[i];
        const value = explicitFlag(src, key);
        out[key] = value === undefined ? null : value;
    }
    return out;
}

function unknownChannelFlags() {
    return {
        smsOptIn: null,
        whatsappOptIn: null,
        telegramOptIn: null,
        emailOptIn: null
    };
}

/**
 * Merge consent flags. GAS values win, then an explicit CMS value.
 * Missing (undefined) legacy flags stay unknown — never opted in via !== false.
 */
export function mergeConsentBaseline(gasPrefs, cmsRow) {
    const gas = normalizeFlagMap(gasPrefs);
    const cms = normalizeFlagMap(cmsRow);
    const out = unknownChannelFlags();
    for (let i = 0; i < CHANNELS.length; i++) {
        const key = CHANNELS[i];
        if (gas[key] === true || gas[key] === false) out[key] = gas[key];
        else if (cms[key] === true || cms[key] === false) out[key] = cms[key];
        else out[key] = null;
    }
    return out;
}

function applyScopedChannels(requested, baseline, scope) {
    const out = {};
    for (let i = 0; i < CHANNEL_NAMES.length; i++) {
        const name = CHANNEL_NAMES[i];
        const key = channelKey(name);
        if (scope.indexOf(name) !== -1) {
            out[key] = requested[key] === true;
        } else {
            out[key] = baseline && baseline[key] === true;
        }
    }
    return out;
}

function inputHasExplicitFlag(input, key) {
    if (!input || typeof input !== 'object') return false;
    return Object.prototype.hasOwnProperty.call(input, key) && input[key] !== undefined && input[key] !== null;
}

function outOfScopeChanges(input, requested, baseline, scope) {
    const changes = [];
    for (let i = 0; i < CHANNEL_NAMES.length; i++) {
        const name = CHANNEL_NAMES[i];
        if (scope.indexOf(name) !== -1) continue;
        const key = channelKey(name);
        if (!inputHasExplicitFlag(input, key)) continue;
        const wanted = requested[key] === true;
        const known = baseline ? baseline[key] : null;
        if (known === true || known === false) {
            if (wanted !== known) changes.push(name);
        } else {
            changes.push(name);
        }
    }
    return changes;
}

function presentContact(identity, row) {
    return {
        firstName: (row && row.firstName) || (identity && identity.firstName) || '',
        lastName: (row && row.lastName) || (identity && identity.lastName) || '',
        phone: (identity && identity.phone) || (row && row.phone) || '',
        email: (identity && identity.email) || (row && row.email) || '',
        caseNumber: (row && (row.caseNumber || row.bookingNumber)) || (identity && identity.caseNumber) || '',
        lastUpdated: (row && (row.prefsUpdatedAt || row.updatedAt)) || ''
    };
}

async function readGasPrefs(phone, deps) {
    if (!deps || typeof deps.getGasPrefs !== 'function') {
        return { ok: false, error: GAS_READ_ERROR };
    }
    if (!phone) {
        return { ok: false, error: GAS_READ_ERROR };
    }
    try {
        const result = await deps.getGasPrefs(phone);
        if (!result || typeof result !== 'object') {
            return { ok: false, error: GAS_READ_ERROR };
        }
        if (result.ok === false) {
            return { ok: false, error: result.error || GAS_READ_ERROR };
        }
        const src = result.ok === true ? result.prefs : result;
        return { ok: true, prefs: normalizeFlagMap(src) };
    } catch (e) {
        return { ok: false, error: GAS_READ_ERROR };
    }
}

export async function getCommunicationPreferences(input, deps) {
    const auth = await resolveCommPrefsAuth(input, deps);
    if (!auth.ok) return auth;

    const identity = auth.identity;
    const row = await lookupContact(identity, deps);
    const phone = identity.phone || (row && row.phone) || '';
    const gasRead = await readGasPrefs(phone, deps);
    const gasPrefs = gasRead.ok ? gasRead.prefs : null;
    const flags = mergeConsentBaseline(gasPrefs, row);
    const contact = presentContact(identity, row);
    return {
        ok: true,
        data: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            phone: contact.phone,
            email: contact.email,
            caseNumber: contact.caseNumber,
            smsOptIn: flags.smsOptIn,
            whatsappOptIn: flags.whatsappOptIn,
            telegramOptIn: flags.telegramOptIn,
            emailOptIn: flags.emailOptIn,
            channels: (identity.channels && identity.channels.length) ? identity.channels.slice() : CHANNEL_NAMES.slice(),
            lastUpdated: contact.lastUpdated
        }
    };
}

export async function saveCommunicationPreferences(input, deps) {
    const auth = await resolveCommPrefsAuth(input, deps);
    if (!auth.ok) return auth;

    const identity = auth.identity;
    const existing = await lookupContact(identity, deps);
    const serverPhone = identity.phone || (existing && existing.phone) || '';
    const serverEmail = identity.email || (existing && existing.email) || '';

    // Overlay server-derived contact before validation. Client phone is not
    // used for matching or for the GAS upsert key.
    const overlaid = Object.assign({}, input && typeof input === 'object' ? input : {}, {
        phone: serverPhone,
        email: serverEmail || (input && input.email) || '',
        firstName: (input && input.firstName) || identity.firstName || (existing && existing.firstName) || '',
        lastName: (input && input.lastName) || identity.lastName || (existing && existing.lastName) || ''
    });
    const validated = validateCommPrefsInput(overlaid);
    if (!validated.ok) return { ok: false, error: validated.error };

    const requested = validated.prefs;
    const gasRead = await readGasPrefs(serverPhone, deps);
    if (!gasRead.ok) {
        return { ok: false, error: GAS_READ_ERROR };
    }
    const baseline = mergeConsentBaseline(gasRead.prefs, existing);
    const scope = (identity.channels && identity.channels.length) ? identity.channels : CHANNEL_NAMES.slice();

    const violations = outOfScopeChanges(input, requested, baseline, scope);
    if (violations.length) {
        return { ok: false, error: SCOPE_MISMATCH_ERROR, code: 'scope_mismatch' };
    }

    for (let i = 0; i < CHANNEL_NAMES.length; i++) {
        const name = CHANNEL_NAMES[i];
        if (scope.indexOf(name) !== -1) continue;
        const known = baseline[channelKey(name)];
        if (known !== true && known !== false) {
            return { ok: false, error: GAS_READ_ERROR };
        }
    }

    const scoped = applyScopedChannels(requested, baseline, scope);
    const prefs = Object.assign({}, requested, scoped, {
        phone: serverPhone,
        email: serverEmail || requested.email
    });

    let gasResult;
    try {
        gasResult = await deps.syncToGas(prefs);
    } catch (err) {
        return { ok: false, error: 'Could not update the consent gate. Your preferences were not saved. Please try again.' };
    }
    if (!gasResult || gasResult.success !== true) {
        return { ok: false, error: 'Could not update the consent gate. Your preferences were not saved. Please try again.' };
    }

    const personId = identity.personId || (existing && existing.personId) || '';
    const timestamp = deps.now ? deps.now() : new Date();
    const isoNow = timestamp.toISOString();
    const fields = {
        firstName: prefs.firstName,
        lastName: prefs.lastName,
        phone: prefs.phone,
        email: prefs.email,
        caseNumber: prefs.caseNumber,
        smsOptIn: prefs.smsOptIn,
        whatsappOptIn: prefs.whatsappOptIn,
        telegramOptIn: prefs.telegramOptIn,
        emailOptIn: prefs.emailOptIn,
        prefsUpdatedAt: isoNow,
        updatedAt: timestamp
    };

    try {
        if (existing) {
            await deps.updateUser(Object.assign({}, existing, fields));
        } else {
            await deps.insertUser(Object.assign({ personId: personId, createdAt: timestamp }, fields));
        }
    } catch (err) {
        return { ok: false, error: 'Error saving preferences. Please try again.' };
    }

    return {
        ok: true,
        lastUpdated: isoNow,
        prefs: CHANNELS.reduce((out, key) => {
            out[key] = prefs[key];
            return out;
        }, {})
    };
}
