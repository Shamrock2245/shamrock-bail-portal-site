/**
 * Communication preferences — save and load helpers.
 *
 * The .jsw wrapper wires Wix APIs. Tests inject fakes. Persist only after
 * the GAS consent gate resolves OK. personId comes from a validated
 * session, never from the client payload. All-channels-off is a valid
 * withdrawal and is stored as explicit false opt-outs.
 */

const CHANNELS = ['smsOptIn', 'whatsappOptIn', 'telegramOptIn', 'emailOptIn'];

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
    const digits = phone.replace(/\D/g, '');
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

async function personIdFromSession(input, deps) {
    const token = input && input.sessionToken;
    if (!token || typeof deps.validateSession !== 'function') return '';
    try {
        const session = await deps.validateSession(token);
        if (session && session.valid && session.personId) return String(session.personId);
    } catch (e) { /* invalid or expired session — treat as anonymous */ }
    return '';
}

export async function getCommunicationPreferences(input, deps) {
    const personId = await personIdFromSession(input, deps);
    if (!personId) return { ok: true, data: null };
    const row = await deps.queryUsers(personId);
    if (!row) return { ok: true, data: null };
    return {
        ok: true,
        data: {
            firstName: row.firstName || '',
            lastName: row.lastName || '',
            phone: row.phone || '',
            email: row.email || '',
            caseNumber: row.caseNumber || row.bookingNumber || '',
            // Legacy rows may omit a flag; keep previous pre-fill (treat missing as on).
            // Explicit false from an all-off save stays false.
            smsOptIn: row.smsOptIn !== false,
            whatsappOptIn: row.whatsappOptIn !== false,
            telegramOptIn: row.telegramOptIn !== false,
            emailOptIn: row.emailOptIn !== false,
            lastUpdated: row.prefsUpdatedAt || row.updatedAt || ''
        }
    };
}

export async function saveCommunicationPreferences(input, deps) {
    const validated = validateCommPrefsInput(input);
    if (!validated.ok) return { ok: false, error: validated.error };

    const prefs = validated.prefs;
    let gasResult;
    try {
        gasResult = await deps.syncToGas(prefs);
    } catch (err) {
        return { ok: false, error: 'Could not update the consent gate. Your preferences were not saved. Please try again.' };
    }
    if (!gasResult || gasResult.success !== true) {
        return { ok: false, error: 'Could not update the consent gate. Your preferences were not saved. Please try again.' };
    }

    const personId = await personIdFromSession(input, deps);
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
        if (personId) {
            const existing = await deps.queryUsers(personId);
            if (existing) {
                await deps.updateUser(Object.assign({}, existing, fields));
            } else {
                await deps.insertUser(Object.assign({ personId, createdAt: timestamp }, fields));
            }
        } else {
            await deps.insertUser(Object.assign({ personId: '', createdAt: timestamp }, fields));
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
