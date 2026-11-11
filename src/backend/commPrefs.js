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

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

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

function hmacBuffersEqual(left, right) {
    if (!left || !right || left.length !== right.length) return false;
    return timingSafeEqual(left, right);
}

export function hashPhoneRef(digits, secret) {
    const normalized = phoneDigits(digits);
    if (!normalized || !secret) return '';
    return createHmac('sha256', secret).update('commprefs-ph:' + normalized).digest('base64url');
}

function phoneRefMatches(digits, ref, secret) {
    if (!ref || !secret) return false;
    const expected = hashPhoneRef(digits, secret);
    if (!expected) return false;
    const left = Buffer.from(expected, 'base64url');
    const right = Buffer.from(String(ref), 'base64url');
    return hmacBuffersEqual(left, right);
}

function sealPhoneRef(digits, secret) {
    const normalized = phoneDigits(digits);
    if (!normalized || !secret) return '';
    const key = createHash('sha256').update('commprefs-seal:' + secret).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(normalized, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64url');
}

function openPhoneRef(blob, secret) {
    if (!blob || !secret || typeof blob !== 'string') return '';
    try {
        const key = createHash('sha256').update('commprefs-seal:' + secret).digest();
        const buf = Buffer.from(blob, 'base64url');
        if (buf.length < 29) return '';
        const iv = buf.subarray(0, 12);
        const tag = buf.subarray(12, 28);
        const enc = buf.subarray(28);
        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const digits = phoneDigits(decipher.update(enc, undefined, 'utf8') + decipher.final('utf8'));
        return digits.length >= 10 ? digits : '';
    } catch (e) {
        return '';
    }
}

// Row identity only: _id, personId, or contactId/wixContactId.
// A shared phone is not enough — household members must not be treated
// as the same Portal Users row when minting.
function sameContactRecord(a, b) {
    if (!a || !b) return false;
    if (a._id && b._id && String(a._id) === String(b._id)) return true;
    if (a.personId && b.personId && String(a.personId) === String(b.personId)) return true;
    const aContact = a.contactId || a.wixContactId || '';
    const bContact = b.contactId || b.wixContactId || '';
    if (aContact && bContact && String(aContact) === String(bContact)) return true;
    return false;
}

async function lookupByField(deps, field, value) {
    if (!value) return null;
    const seed = { personId: '', contactId: '', phone: '', email: '' };
    seed[field] = value;
    return lookupContact(seed, deps);
}

async function listContactsByPhone(deps, phone) {
    if (!phone || !deps || typeof deps.listUsersByPhone !== 'function') return [];
    try {
        const rows = await deps.listUsersByPhone(phone);
        return Array.isArray(rows) ? rows : [];
    } catch (e) {
        return [];
    }
}

function bindMintIdentity(row, contactId, personId, suppliedPhone, email) {
    const resolvedPhone = (row && phoneDigits(row.phone).length >= 10)
        ? String(row.phone)
        : suppliedPhone;
    if (!resolvedPhone || phoneDigits(resolvedPhone).length < 10) {
        return { ok: false, error: 'A resolvable phone number is required to mint a preferences link.' };
    }
    return {
        ok: true,
        row: row || null,
        phone: resolvedPhone,
        email: (row && row.email) || email || '',
        contactId: contactId || (row && (row.contactId || row.wixContactId)) || '',
        personId: personId || (row && row.personId) || ''
    };
}

async function resolveMintIdentity(src, deps) {
    const contactId = String(src.contactId || '').trim();
    const personId = String(src.personId || '').trim();
    const phone = String(src.phone || '').trim();
    const email = String(src.email || '').trim().toLowerCase();
    const suppliedPhone = phone && phoneDigits(phone).length >= 10 ? phone : '';

    if (personId || contactId) {
        const byPerson = personId ? await lookupByField(deps, 'personId', personId) : null;
        const byContact = contactId ? await lookupByField(deps, 'contactId', contactId) : null;

        if (byPerson && byContact && !sameContactRecord(byPerson, byContact)) {
            return { ok: false, error: MINT_MISMATCH_ERROR };
        }

        const row = byPerson || byContact || null;
        if (row) {
            if (suppliedPhone && phoneDigits(row.phone).length >= 10 && !phonesEqual(row.phone, suppliedPhone)) {
                return { ok: false, error: MINT_MISMATCH_ERROR };
            }
            return bindMintIdentity(row, contactId, personId, suppliedPhone, email);
        }

        // IDs did not resolve. Do not run a first-match phone query
        // to pick a row. A supplied phone is enough to mint a
        // phone-scoped token that still carries the claimed IDs.
        if (suppliedPhone) {
            return bindMintIdentity(null, contactId, personId, suppliedPhone, email);
        }
        const byEmail = email ? await lookupByField(deps, 'email', email) : null;
        return bindMintIdentity(byEmail, contactId, personId, '', email);
    }

    if (suppliedPhone) {
        const matches = await listContactsByPhone(deps, suppliedPhone);
        if (matches.length > 1) {
            return { ok: false, error: MINT_AMBIGUOUS_CONTACT_ERROR, code: 'ambiguous_contact' };
        }
        if (matches.length === 1) {
            return bindMintIdentity(matches[0], '', '', suppliedPhone, email);
        }
        // No Portal Users row: phone-only token, no row PII, no CMS bind.
        return bindMintIdentity(null, '', '', suppliedPhone, '');
    }

    const byEmail = email ? await lookupByField(deps, 'email', email) : null;
    return bindMintIdentity(byEmail, '', '', '', email);
}

/**
 * Mint a personal signed preferences-link token for leads / Node-RED.
 * Does not send texts or emails. Fails closed if COMM_PREFS_LINK_SECRET
 * is missing. Not a client-invokable web method.
 */
export async function mintCommPrefsLinkToken(input, deps) {
    const src = input && typeof input === 'object' ? input : {};
    const phone = String(src.phone || '').trim();
    if (phone && phoneDigits(phone).length < 10) {
        return { ok: false, error: 'Please enter a valid phone number.' };
    }
    const resolved = await resolveMintIdentity(src, deps);
    if (!resolved.ok) return resolved;
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
    const digits = phoneDigits(resolved.phone);
    // Opaque claims only: no raw phone or email. The hashed phone
    // reference plus a sealed server-side handle let redeem resolve
    // the number without putting PII in the cpt token.
    const payload = compactPayload({
        typ: LINK_TOKEN_TYPE,
        contactId: resolved.contactId || undefined,
        personId: resolved.personId || undefined,
        ph: hashPhoneRef(digits, secret),
        pr: sealPhoneRef(digits, secret),
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
            personId: identity.personId || '',
            contactId: identity.contactId || '',
            phone: identity.phone || '',
            email: identity.email || ''
        })) || null;
    } catch (e) {
        return null;
    }
}

// Link tokens without a bound contact/person id must not fall through
// to a first-match phone query (household numbers are not unique).
async function lookupBoundContact(identity, deps) {
    if (!identity) return null;
    if (identity.source === 'link') {
        if (!identity.personId && !identity.contactId) return null;
        return lookupContact({
            personId: identity.personId || '',
            contactId: identity.contactId || '',
            phone: '',
            email: ''
        }, deps);
    }
    return lookupContact(identity, deps);
}

function enrichIdentity(identity, row) {
    if (!row) return identity;
    return {
        source: identity.source,
        personId: identity.personId || row.personId || '',
        contactId: identity.contactId || row.contactId || row.wixContactId || '',
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
    const personId = payload.personId ? String(payload.personId) : '';
    const contactId = payload.contactId ? String(payload.contactId) : '';
    // Never resolve a link identity by phone: a shared household
    // number must not bind an arbitrary Portal Users row.
    let row = (personId || contactId)
        ? await lookupBoundContact({
            source: 'link',
            personId: personId,
            contactId: contactId
        }, deps)
        : null;
    let phone = (row && row.phone) || '';
    let email = (row && row.email) || '';
    // Legacy tokens minted with plaintext phone/email are still honored
    // so already-issued links keep working. New tokens never include them.
    if (!phone && payload.phone) phone = String(payload.phone);
    if (!email && payload.email) email = String(payload.email);
    if (!phone && payload.pr) {
        const opened = openPhoneRef(payload.pr, secret);
        if (opened) phone = opened;
    }
    if (phone && payload.ph && !row && !phoneRefMatches(phone, payload.ph, secret)) {
        return null;
    }
    const seed = {
        source: 'link',
        personId: personId,
        contactId: contactId,
        phone: phone,
        email: email,
        channels: channels,
        firstName: '',
        lastName: '',
        caseNumber: ''
    };
    if (!seed.personId && !seed.contactId && !seed.phone && !seed.email) return null;
    return enrichIdentity(seed, row);
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
export const LOAD_ERROR =
    "We couldn't load your preferences, please try again or call (239) 332-2245.";
export const CONFLICT_ERROR =
    'Your preferences were updated in another session. Please reload and try again, or call (239) 332-2245.';
export const UNSAFE_OMIT_ERROR =
    "We couldn't safely update your preferences. Please call (239) 332-2245.";
export const MINT_MISMATCH_ERROR =
    'The supplied phone number does not match the referenced contact.';
export const MINT_AMBIGUOUS_CONTACT_ERROR =
    'ambiguous_contact, supply contactId or personId';

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
 * When the GAS read explicitly reports found === false (no CommPrefs row),
 * CMS flags are ignored for the effective / displayed state so a CMS-only
 * opt-out is not shown as already enforced. Those opt-outs are still
 * carried to GAS on the next save.
 */
export function mergeConsentBaseline(gasPrefs, cmsRow, found) {
    const gas = normalizeFlagMap(gasPrefs);
    const cms = normalizeFlagMap(cmsRow);
    const ignoreCms = found === false;
    const out = unknownChannelFlags();
    for (let i = 0; i < CHANNELS.length; i++) {
        const key = CHANNELS[i];
        if (gas[key] === true || gas[key] === false) out[key] = gas[key];
        else if (!ignoreCms && (cms[key] === true || cms[key] === false)) out[key] = cms[key];
        else out[key] = null;
    }
    return out;
}

function cmsOnlyExplicitOptOuts(cmsRow) {
    const cms = normalizeFlagMap(cmsRow);
    const out = {};
    for (let i = 0; i < CHANNELS.length; i++) {
        const key = CHANNELS[i];
        if (cms[key] === false) out[key] = false;
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
        } else if (baseline && (baseline[key] === true || baseline[key] === false)) {
            // Unchanged known out-of-scope value. Unknowns are omitted
            // so they are never written as true or false.
            out[key] = baseline[key];
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
        const known = baseline ? baseline[key] : null;
        // Ignore omitted keys, keys that match the baseline, and keys
        // whose baseline is unknown/null. Reject only an attempt to
        // change an out-of-scope channel away from a known value.
        if (known !== true && known !== false) continue;
        const wanted = requested[key] === true;
        if (wanted !== known) changes.push(name);
    }
    return changes;
}

function readLoadedBaseline(input) {
    if (!input || typeof input !== 'object') return null;
    const src = input.baseline;
    if (!src || typeof src !== 'object' || Array.isArray(src)) return null;
    return normalizeFlagMap(src);
}

function flagsDiffer(left, right) {
    const a = left === true ? true : (left === false ? false : null);
    const b = right === true ? true : (right === false ? false : null);
    return a !== b;
}

function sentChannelKeys(input) {
    const keys = [];
    for (let i = 0; i < CHANNELS.length; i++) {
        const key = CHANNELS[i];
        if (inputHasExplicitFlag(input, key)) keys.push(key);
    }
    return keys;
}

// Only in-scope flags the client actually sent (user-changed, or first
// set from unknown). Unchanged and out-of-scope channels are omitted
// when the live gate advertises that it preserves omitted flags.
function applyChangedChannels(input, requested, scope) {
    const out = {};
    for (let i = 0; i < CHANNEL_NAMES.length; i++) {
        const name = CHANNEL_NAMES[i];
        const key = channelKey(name);
        if (scope.indexOf(name) === -1) continue;
        if (!inputHasExplicitFlag(input, key)) continue;
        out[key] = requested[key] === true;
    }
    return out;
}

function buildGasChannelFlags(input, requested, baseline, scope, preservesOmitted) {
    const flags = {};
    let omittedUnknown = false;
    for (let i = 0; i < CHANNEL_NAMES.length; i++) {
        const name = CHANNEL_NAMES[i];
        const key = channelKey(name);
        const inScope = scope.indexOf(name) !== -1;
        if (inScope && inputHasExplicitFlag(input, key)) {
            flags[key] = requested[key] === true;
            continue;
        }
        const known = baseline && (baseline[key] === true || baseline[key] === false);
        if (known) {
            // Until the gate advertises that it preserves omitted flags,
            // resend known baseline values so a live fail-open upsert
            // cannot flip them to true.
            if (!preservesOmitted) flags[key] = baseline[key];
            continue;
        }
        if (preservesOmitted) continue;
        omittedUnknown = true;
    }
    if (omittedUnknown) {
        return { ok: false, error: UNSAFE_OMIT_ERROR, code: 'unsafe_omit' };
    }
    return { ok: true, flags: flags };
}

function mergeReturnedPrefs(baseline, written) {
    const out = unknownChannelFlags();
    for (let i = 0; i < CHANNELS.length; i++) {
        const key = CHANNELS[i];
        if (written && (written[key] === true || written[key] === false)) out[key] = written[key];
        else if (baseline && (baseline[key] === true || baseline[key] === false)) out[key] = baseline[key];
        else out[key] = null;
    }
    return out;
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

/**
 * Trust GAS consent flags only when the response explicitly says a
 * CommPrefs row exists (`found === true`). Any response without that
 * marker — including the pre-redeploy getCommPreferences shape that
 * fail-opens a missing row to true — is treated as unknown/null for
 * every channel.
 */
export function storedGasPrefsFromResult(result) {
    if (!result || typeof result !== 'object') return unknownChannelFlags();
    if (result.found !== true) return unknownChannelFlags();
    const src = Object.prototype.hasOwnProperty.call(result, 'prefs') ? result.prefs : result;
    return normalizeFlagMap(src);
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
        return {
            ok: true,
            prefs: storedGasPrefsFromResult(result),
            // Preserve the tri-state: true, false, or missing. A missing
            // found marker is a legacy read, not the same as found: false.
            found: result.found === true ? true : (result.found === false ? false : undefined),
            preservesOmitted: result.preservesOmitted === true
        };
    } catch (e) {
        return { ok: false, error: GAS_READ_ERROR };
    }
}

export async function getCommunicationPreferences(input, deps) {
    const auth = await resolveCommPrefsAuth(input, deps);
    if (!auth.ok) return auth;

    const identity = auth.identity;
    const row = await lookupBoundContact(identity, deps);
    const phone = identity.phone || (row && row.phone) || '';
    if (!phone) {
        return { ok: false, error: LOAD_ERROR, code: 'load_failed' };
    }
    const gasRead = await readGasPrefs(phone, deps);
    if (!gasRead.ok) {
        return { ok: false, error: LOAD_ERROR, code: 'load_failed' };
    }
    const flags = mergeConsentBaseline(gasRead.prefs, row, gasRead.found);
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
    const existing = await lookupBoundContact(identity, deps);
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
    const baseline = mergeConsentBaseline(gasRead.prefs, existing, gasRead.found);
    const scope = (identity.channels && identity.channels.length) ? identity.channels : CHANNEL_NAMES.slice();

    const loadedBaseline = readLoadedBaseline(input);
    if (!loadedBaseline) {
        return { ok: false, error: CONFLICT_ERROR, code: 'conflict' };
    }
    const sentKeys = sentChannelKeys(input);
    for (let i = 0; i < sentKeys.length; i++) {
        const key = sentKeys[i];
        if (flagsDiffer(baseline[key], loadedBaseline[key])) {
            return { ok: false, error: CONFLICT_ERROR, code: 'conflict' };
        }
    }

    const violations = outOfScopeChanges(input, requested, baseline, scope);
    if (violations.length) {
        return { ok: false, error: SCOPE_MISMATCH_ERROR, code: 'scope_mismatch' };
    }

    const scoped = applyChangedChannels(input, requested, scope);
    const preservesOmitted = gasRead.preservesOmitted === true;
    // When the GAS row is absent, carry CMS-only explicit opt-outs so
    // they become enforced instead of remaining display-only. CMS
    // opt-ins are never carried. A user-sent value for the same
    // channel wins.
    const pendingOptOuts = gasRead.found === false ? cmsOnlyExplicitOptOuts(existing) : {};
    let gasFlags = scoped;
    if (Object.keys(scoped).length || Object.keys(pendingOptOuts).length) {
        const built = buildGasChannelFlags(input, requested, baseline, scope, preservesOmitted);
        if (!built.ok) return built;
        gasFlags = built.flags;
        const pendingKeys = Object.keys(pendingOptOuts);
        for (let i = 0; i < pendingKeys.length; i++) {
            const key = pendingKeys[i];
            if (!Object.prototype.hasOwnProperty.call(gasFlags, key)) {
                gasFlags[key] = false;
            }
        }
    }
    const prefs = Object.assign({
        firstName: requested.firstName,
        lastName: requested.lastName,
        caseNumber: requested.caseNumber,
        phone: serverPhone,
        email: serverEmail || requested.email
    }, gasFlags);

    let gasResult;
    if (Object.keys(gasFlags).length) {
        try {
            gasResult = await deps.syncToGas(prefs);
        } catch (err) {
            return { ok: false, error: 'Could not update the consent gate. Your preferences were not saved. Please try again.' };
        }
        if (!gasResult || gasResult.success !== true) {
            return { ok: false, error: 'Could not update the consent gate. Your preferences were not saved. Please try again.' };
        }
    }

    const timestamp = deps.now ? deps.now() : new Date();
    const isoNow = timestamp.toISOString();
    const fields = {
        firstName: prefs.firstName,
        lastName: prefs.lastName,
        phone: prefs.phone,
        email: prefs.email,
        caseNumber: prefs.caseNumber,
        prefsUpdatedAt: isoNow,
        updatedAt: timestamp
    };
    for (let i = 0; i < CHANNELS.length; i++) {
        const key = CHANNELS[i];
        if (prefs[key] === true || prefs[key] === false) fields[key] = prefs[key];
    }

    const bindCms = identity.source !== 'link' || !!(identity.personId || identity.contactId || existing);

    try {
        if (!bindCms) {
            // Phone-only link: update the consent gate, but do not
            // insert or update a Portal Users row.
        } else if (existing) {
            await deps.updateUser(Object.assign({}, existing, fields));
        } else {
            const insertFields = Object.assign({ createdAt: timestamp }, fields);
            // Never insert a contactId as personId. Restore each only
            // into its own namespace.
            const personId = identity.personId || '';
            const contactId = identity.contactId || '';
            if (personId) insertFields.personId = personId;
            if (contactId) insertFields.contactId = contactId;
            await deps.insertUser(insertFields);
        }
    } catch (err) {
        return { ok: false, error: 'Error saving preferences. Please try again.' };
    }

    return {
        ok: true,
        lastUpdated: isoNow,
        prefs: mergeReturnedPrefs(baseline, Object.assign({}, baseline, gasFlags, scoped))
    };
}
