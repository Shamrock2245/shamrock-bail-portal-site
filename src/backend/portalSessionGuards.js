/**
 * Portal session checks shared by document reads and detail reads.
 * No Wix imports, so Node tests can load this file directly.
 */

/**
 * Token for getMemberDocuments. A browser-supplied email is never read.
 * Call shapes: (memberEmail, sessionToken), (sessionToken), or ({ sessionToken }).
 */
export function resolveDocumentSessionToken(arg1, arg2) {
    if (typeof arg2 === 'string' && arg2) return arg2;
    if (typeof arg1 === 'string' && arg1 && arg2 === undefined) return arg1;
    if (arg1 && typeof arg1 === 'object' && typeof arg1.sessionToken === 'string') {
        return arg1.sessionToken;
    }
    return '';
}

/**
 * Email that may be used to list a member's documents.
 * Invalid sessions are rejected. A valid session with no email lists nothing.
 */
export function memberDocumentAccess(session) {
    if (!session || session.valid !== true) return { ok: false, email: '' };
    const email = String(session.email || '').trim();
    return { ok: true, email };
}

/** Detail reads require a validated session bound to a person. */
export function portalDetailsSessionOk(session) {
    return !!(session && session.valid && session.personId);
}

/**
 * Second-cosigner fields. A primary indemnitorEmail match is not a co-indemnitor.
 */
/**
 * One slot is one cosigner. Email, phone, and name from different slots
 * must not be mixed when several second cosigners are on the same bond.
 */
export const COINDEMNITOR_SLOTS = [
    { email: ['indemnitor2Email'], phone: ['indemnitor2Phone'], name: ['indemnitor2Name'] },
    { email: ['indemnitor3Email'], phone: ['indemnitor3Phone'], name: ['indemnitor3Name'] },
    {
        email: ['coindemnitorEmail', 'coIndemnitorEmail'],
        phone: ['coindemnitorPhone', 'coIndemnitorPhone'],
        name: ['coindemnitorName', 'coIndemnitorName']
    }
];
export const COINDEMNITOR_EMAIL_FIELDS = COINDEMNITOR_SLOTS.reduce(function (keys, slot) {
    return keys.concat(slot.email);
}, []);
export const COINDEMNITOR_PHONE_FIELDS = COINDEMNITOR_SLOTS.reduce(function (keys, slot) {
    return keys.concat(slot.phone);
}, []);

const DETAIL_SURFACES = {
    defendant: ['defendant'],
    indemnitor: ['indemnitor', 'coindemnitor']
};

const ROLE_PREFIXES = {
    defendant: ['defendant_'],
    indemnitor: ['indemnitor_intake_', 'indemnitor_'],
    // Longer prefixes first. coindemnitor_ alone must not eat coindemnitor_indemnitor3_.
    coindemnitor: [
        'coindemnitor_intake_',
        'coindemnitor_indemnitor2_',
        'coindemnitor_indemnitor3_',
        'coindemnitor_coindemnitor_',
        'coindemnitor_'
    ]
};

const ROLE_CONTACT_FIELDS = {
    defendant: { email: ['defendantEmail'], phone: ['defendantPhone'] },
    indemnitor: { email: ['indemnitorEmail'], phone: ['indemnitorPhone'] },
    coindemnitor: { email: COINDEMNITOR_EMAIL_FIELDS, phone: COINDEMNITOR_PHONE_FIELDS }
};

/**
 * defendant, indemnitor, or coindemnitor. Blank and unknown values are blank.
 * @param {string} role
 * @returns {'defendant'|'indemnitor'|'coindemnitor'|''}
 */
export function normalizePortalRole(role) {
    const value = String(role || '').toLowerCase().trim();
    if (value === 'defendant' || value === 'indemnitor' || value === 'coindemnitor') return value;
    if (value === 'co-indemnitor' || value === 'co') return 'coindemnitor';
    return '';
}

/**
 * Detail reads are role-gated. A defendant session cannot read indemnitor
 * details, and a cosigner session cannot read the defendant detail payload.
 * @param {object|null} session
 * @param {'defendant'|'indemnitor'} surface
 */
export function portalDetailRoleOk(session, surface) {
    if (!portalDetailsSessionOk(session)) return false;
    const allowed = DETAIL_SURFACES[surface];
    if (!allowed) return false;
    return allowed.indexOf(normalizePortalRole(session.role)) !== -1;
}

/**
 * Exact phone strings safe to query. Short or partial numbers return nothing
 * so a contains-match cannot attach a sign-in to another person.
 * @param {string} phoneInput
 * @returns {string[]}
 */
export function phoneLookupVariants(phoneInput) {
    const clean = String(phoneInput || '').replace(/\D/g, '');
    let ten = '';
    if (clean.length === 10) ten = clean;
    else if (clean.length === 11 && clean.charAt(0) === '1') ten = clean.slice(1);
    else return [];
    return [
        ten,
        '1' + ten,
        '+1' + ten,
        '(' + ten.slice(0, 3) + ') ' + ten.slice(3, 6) + '-' + ten.slice(6),
        ten.slice(0, 3) + '-' + ten.slice(3, 6) + '-' + ten.slice(6)
    ];
}

function isBusinessCaseKey(value) {
    return /^case-/i.test(value) || /^intake-/i.test(value);
}

function pushDocumentId(ids, value) {
    const id = String(value || '').trim();
    if (!id || id.length > 128 || id.startsWith('new_') || isBusinessCaseKey(id)) return;
    if (ids.indexOf(id) === -1) ids.push(id);
}

/**
 * Primary keys this session may load. A business CASE- / INTAKE- key is not a
 * document id. A new_ person id is not a document id. Prefixes are stripped
 * only for the session's own role.
 * @param {object|null} session
 * @returns {string[]}
 */
export function boundDocumentIds(session) {
    const ids = [];
    if (!session || typeof session !== 'object') return ids;
    const role = normalizePortalRole(session.role);
    const caseId = typeof session.caseId === 'string' ? session.caseId.trim() : '';
    const personId = typeof session.personId === 'string' ? session.personId.trim() : '';
    if (/^intake-/i.test(caseId)) pushDocumentId(ids, caseId.replace(/^intake-/i, ''));
    else pushDocumentId(ids, caseId);
    if (!personId || personId.startsWith('new_')) return ids;
    const prefixes = ROLE_PREFIXES[role] || [];
    let stripped = false;
    for (let i = 0; i < prefixes.length; i++) {
        if (personId.startsWith(prefixes[i])) {
            pushDocumentId(ids, personId.slice(prefixes[i].length));
            stripped = true;
            break;
        }
    }
    if (!stripped && role === 'defendant' && !/^(indemnitor_|coindemnitor_)/.test(personId)) {
        pushDocumentId(ids, personId);
    }
    return ids;
}

/**
 * Stable person id for one cosigner slot on a case. Two slots on the same
 * record must not share coindemnitor_<record id>.
 * @param {string} recordId
 * @param {string} field
 * @returns {string}
 */
export function cosignerPersonId(recordId, field) {
    const id = String(recordId || '').trim();
    const slot = slotForField(field);
    if (!id || !slot) return '';
    let slotId = 'coindemnitor';
    if (slot.email.indexOf('indemnitor2Email') !== -1) slotId = 'indemnitor2';
    else if (slot.email.indexOf('indemnitor3Email') !== -1) slotId = 'indemnitor3';
    return 'coindemnitor_' + slotId + '_' + id;
}

/**
 * True when the document id embedded in personId is this case or intake id.
 * Slot-scoped cosigner ids count. A business CASE- key does not.
 * @param {string} personId
 * @param {string} role
 * @param {string} documentId
 */
export function personIdOwnsDocument(personId, role, documentId) {
    const wanted = String(documentId || '').trim();
    if (!wanted) return false;
    const ids = boundDocumentIds({
        valid: true,
        personId: personId,
        role: role,
        caseId: ''
    });
    return ids.indexOf(wanted) !== -1;
}

/**
 * A stored session may be handed out again only when the new contact does
 * not contradict the contact already on that session.
 * @param {object|null} existing
 * @param {object|null} incoming
 */
export function sessionContactsCompatible(existing, incoming) {
    const existingEmail = existing && existing.email;
    const incomingEmail = incoming && incoming.email;
    if (existingEmail && incomingEmail && !emailsEqual(existingEmail, incomingEmail)) return false;
    const existingPhone = existing && existing.phone;
    const incomingPhone = incoming && incoming.phone;
    if (existingPhone && incomingPhone && !phonesEqual(existingPhone, incomingPhone)) return false;
    return true;
}

function emailsEqual(left, right) {
    const a = String(left || '').trim().toLowerCase();
    const b = String(right || '').trim().toLowerCase();
    return !!a && a === b;
}

function phonesEqual(left, right) {
    const a = String(left || '').replace(/\D/g, '');
    const b = String(right || '').replace(/\D/g, '');
    if (a.length < 10 || b.length < 10) return false;
    return a.slice(-10) === b.slice(-10);
}

/**
 * True when the session contact is on this row for the session role.
 * Co-indemnitor contact does not match the primary indemnitor fields.
 */
export function recordMatchesRoleContact(record, session, role) {
    const keys = ROLE_CONTACT_FIELDS[normalizePortalRole(role)];
    if (!keys || !record || typeof record !== 'object' || !session) return false;
    for (let i = 0; i < keys.email.length; i++) {
        if (emailsEqual(session.email, record[keys.email[i]])) return true;
    }
    for (let j = 0; j < keys.phone.length; j++) {
        if (phonesEqual(session.phone, record[keys.phone[j]])) return true;
    }
    return false;
}

/**
 * True when this Cases or IntakeQueue row belongs to the session.
 * Sharing a caseId field is not enough unless the session contact is on that
 * row for the session role. A primary-key hit must be an id the session was
 * minted with.
 * @param {object|null} session
 * @param {object|null} record
 */
export function sessionOwnsCaseRecord(session, record) {
    if (!portalDetailsSessionOk(session) || !record || typeof record !== 'object') return false;
    const role = normalizePortalRole(session.role);
    if (!role) return false;
    const recordId = typeof record._id === 'string' ? record._id.trim() : '';
    if (!recordId || recordId.startsWith('new_')) return false;
    if (boundDocumentIds(session).indexOf(recordId) !== -1) return true;
    const caseField = typeof record.caseId === 'string' ? record.caseId.trim() : '';
    const sessionCase = typeof session.caseId === 'string' ? session.caseId.trim() : '';
    if (!caseField || !sessionCase || caseField !== sessionCase) return false;
    return recordMatchesRoleContact(record, session, role);
}

/**
 * Role to put on a magic link.
 * preferredRole is only a hint. A contact that is not on file is never a
 * co-indemnitor. A primary indemnitor match is never relabeled co-indemnitor.
 * A second-cosigner match stays co-indemnitor even on the default tab.
 * @param {string} preferredRole
 * @param {{defendant?: boolean, indemnitor?: boolean, coindemnitor?: boolean}} found
 * @returns {'defendant'|'indemnitor'|'coindemnitor'}
 */
export function resolveSignInRole(preferredRole, found) {
    const pref = normalizePortalRole(preferredRole) || 'indemnitor';
    const has = {
        defendant: !!(found && found.defendant),
        indemnitor: !!(found && found.indemnitor),
        coindemnitor: !!(found && found.coindemnitor)
    };
    const any = has.defendant || has.indemnitor || has.coindemnitor;
    if (!any) return pref === 'defendant' ? 'defendant' : 'indemnitor';
    if (pref === 'defendant' && has.defendant) return 'defendant';
    if (pref === 'coindemnitor' && has.coindemnitor) return 'coindemnitor';
    if ((pref === 'indemnitor' || pref === 'coindemnitor') && has.indemnitor) return 'indemnitor';
    if (pref === 'defendant' && has.indemnitor) return 'indemnitor';
    if (pref === 'defendant' && has.coindemnitor) return 'coindemnitor';
    if (has.defendant) return 'defendant';
    if (has.coindemnitor) return 'coindemnitor';
    return 'indemnitor';
}

function slotForField(field) {
    const key = String(field || '');
    for (let i = 0; i < COINDEMNITOR_SLOTS.length; i++) {
        const slot = COINDEMNITOR_SLOTS[i];
        if (slot.email.indexOf(key) !== -1 || slot.phone.indexOf(key) !== -1 || slot.name.indexOf(key) !== -1) {
            return slot;
        }
    }
    return null;
}

function slotValue(row, keys, matchedField) {
    if (matchedField && keys.indexOf(matchedField) !== -1 && row[matchedField]) return row[matchedField];
    for (let i = 0; i < keys.length; i++) {
        if (row[keys[i]]) return row[keys[i]];
    }
    return '';
}

/**
 * Email, phone, and name from the cosigner slot that owns `field`.
 * A different slot's phone or name is left blank.
 * @param {object|null} record
 * @param {string} field
 */
export function cosignerContactForField(record, field) {
    const row = record && typeof record === 'object' ? record : {};
    const slot = slotForField(field);
    if (!slot) return { email: '', phone: '', name: '' };
    return {
        email: String(slotValue(row, slot.email, field) || ''),
        phone: String(slotValue(row, slot.phone, field) || ''),
        name: String(slotValue(row, slot.name, field) || '')
    };
}

function matchingSlotField(row, session, kind) {
    const email = session && session.email;
    const phone = session && session.phone;
    for (let s = 0; s < COINDEMNITOR_SLOTS.length; s++) {
        const keys = COINDEMNITOR_SLOTS[s][kind];
        for (let i = 0; i < keys.length; i++) {
            const hit = kind === 'email'
                ? emailsEqual(email, row[keys[i]])
                : phonesEqual(phone, row[keys[i]]);
            if (hit) return keys[i];
        }
    }
    return '';
}

/**
 * The cosigner slot for this session.
 * Every slot email is checked before any phone, so a shared household
 * number does not assign a later cosigner's email to an earlier name.
 * No match returns only the session's own contact, never another slot.
 * @param {object|null} record
 * @param {object|null} session
 */
export function cosignerContactForSession(record, session) {
    const row = record && typeof record === 'object' ? record : {};
    const matchedField = matchingSlotField(row, session, 'email') || matchingSlotField(row, session, 'phone');
    if (matchedField) return cosignerContactForField(row, matchedField);
    return {
        email: session && session.email ? String(session.email) : '',
        phone: session && session.phone ? String(session.phone) : '',
        name: session && session.name ? String(session.name) : ''
    };
}

function splitPerson(name, email, phone, sessionFallback) {
    const fallbackName = sessionFallback && sessionFallback.name ? sessionFallback.name : '';
    const full = String(name || fallbackName || '').trim();
    const parts = full.split(/\s+/).filter(Boolean);
    const fallbackEmail = sessionFallback && sessionFallback.email ? sessionFallback.email : '';
    const fallbackPhone = sessionFallback && sessionFallback.phone ? sessionFallback.phone : '';
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' '),
        email: String(email || fallbackEmail || ''),
        phone: String(phone || fallbackPhone || '')
    };
}

/**
 * Name and contact the dashboard may show for this session.
 * A co-indemnitor sees their own session contact, not the primary indemnitor's.
 * @param {object|null} session
 * @param {object|null} record
 */
export function detailIdentity(session, record) {
    const role = normalizePortalRole(session && session.role);
    const row = record && typeof record === 'object' ? record : {};
    if (role === 'defendant') {
        return splitPerson(row.defendantName, row.defendantEmail, row.defendantPhone, session);
    }
    if (role === 'coindemnitor') {
        const slot = cosignerContactForSession(row, session);
        const email = (session && session.email) || slot.email;
        const phone = (session && session.phone) || slot.phone;
        const name = slot.name || (session && session.name) || '';
        return splitPerson(name, email, phone, null);
    }
    if (role === 'indemnitor') {
        return splitPerson(row.indemnitorName, row.indemnitorEmail, row.indemnitorPhone, session);
    }
    return splitPerson('', '', '', null);
}
