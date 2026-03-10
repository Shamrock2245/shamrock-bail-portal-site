/**
 * Communication Preferences — Shamrock Bail Bonds Portal
 * Page ID: f870g
 *
 * Allows authenticated portal users (indemnitors and defendants) to manage
 * their communication opt-in/opt-out preferences for:
 *   - SMS (Twilio)
 *   - WhatsApp (Twilio)
 *   - Telegram
 *   - Email
 *
 * Data is read from and written to the 'Portal Users' CMS collection.
 * TheCloser.js (GAS) reads smsOptIn / whatsappOptIn before sending any
 * drip message, so this page is the authoritative opt-out gate.
 *
 * Element IDs expected on the Wix page:
 *   #toggleSms          — Toggle switch for SMS
 *   #toggleWhatsapp     — Toggle switch for WhatsApp
 *   #toggleTelegram     — Toggle switch for Telegram
 *   #toggleEmail        — Toggle switch for Email
 *   #btnSavePrefs       — Save button
 *   #txtStatus          — Status text element
 *   #txtLastUpdated     — "Last updated" text element
 *   #loadingSpinner     — Loading indicator (show/hide)
 */

import wixData from 'wix-data';
import wixWindow from 'wix-window';
import { local } from 'wix-storage';
import { getSessionToken, getSessionData } from 'public/session-manager';
import { validateCustomSession } from 'backend/portal-auth';

// ── State ──────────────────────────────────────────────────────────────────────
let sessionData = null;
let userRecord   = null;

// ── Helpers ────────────────────────────────────────────────────────────────────
function showStatus(msg, isError) {
    try {
        const el = $w('#txtStatus');
        el.text = msg;
        el.style.color = isError ? '#e53e3e' : '#38a169';
        el.show();
        setTimeout(() => { try { el.hide(); } catch (_) {} }, 4000);
    } catch (_) { console.log('[CommPrefs] Status:', msg); }
}

function setLoading(on) {
    try {
        on ? $w('#loadingSpinner').show() : $w('#loadingSpinner').hide();
    } catch (_) { /* spinner element may not exist on all layouts */ }
}

function formatDate(d) {
    if (!d) return 'Never';
    try {
        return new Date(d).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (_) { return String(d); }
}

// ── Load preferences from Portal Users record ──────────────────────────────────
async function loadPreferences() {
    if (!sessionData || !sessionData.personId) {
        showStatus('Session expired. Please log in again.', true);
        return;
    }

    setLoading(true);
    try {
        const results = await wixData.query('Portal Users')
            .eq('personId', sessionData.personId)
            .limit(1)
            .find({ suppressAuth: true });

        if (results.items.length === 0) {
            showStatus('Could not load your preferences. Please try again.', true);
            setLoading(false);
            return;
        }

        userRecord = results.items[0];

        // Defaults: all channels opt-in unless explicitly set to false
        try { $w('#toggleSms').checked       = userRecord.smsOptIn       !== false; } catch (_) {}
        try { $w('#toggleWhatsapp').checked  = userRecord.whatsappOptIn  !== false; } catch (_) {}
        try { $w('#toggleTelegram').checked  = userRecord.telegramOptIn  !== false; } catch (_) {}
        try { $w('#toggleEmail').checked     = userRecord.emailOptIn     !== false; } catch (_) {}

        const lastUpdated = userRecord.prefsUpdatedAt || userRecord.updatedAt;
        try {
            $w('#txtLastUpdated').text = 'Last updated: ' + formatDate(lastUpdated);
        } catch (_) {}

    } catch (err) {
        console.error('[CommPrefs] loadPreferences error:', err);
        showStatus('Error loading preferences.', true);
    } finally {
        setLoading(false);
    }
}

// ── Save preferences to Portal Users record ────────────────────────────────────
async function savePreferences() {
    if (!userRecord) {
        showStatus('No record loaded. Please refresh the page.', true);
        return;
    }

    setLoading(true);
    try {
        let smsOn      = true;
        let waOn       = true;
        let tgOn       = true;
        let emailOn    = true;
        try { smsOn   = $w('#toggleSms').checked; }      catch (_) {}
        try { waOn    = $w('#toggleWhatsapp').checked; } catch (_) {}
        try { tgOn    = $w('#toggleTelegram').checked; } catch (_) {}
        try { emailOn = $w('#toggleEmail').checked; }    catch (_) {}

        const updated = Object.assign({}, userRecord, {
            smsOptIn:       smsOn,
            whatsappOptIn:  waOn,
            telegramOptIn:  tgOn,
            emailOptIn:     emailOn,
            prefsUpdatedAt: new Date().toISOString(),
            updatedAt:      new Date()
        });

        await wixData.update('Portal Users', updated, { suppressAuth: true });

        // Cache locally so fast-path checks (e.g. geolocation-client.js) can read without a DB call
        local.setItem(
            'commPrefs_' + sessionData.personId,
            JSON.stringify({
                smsOptIn:      updated.smsOptIn,
                whatsappOptIn: updated.whatsappOptIn,
                telegramOptIn: updated.telegramOptIn,
                emailOptIn:    updated.emailOptIn,
                savedAt:       updated.prefsUpdatedAt
            })
        );

        userRecord = updated;

        try {
            $w('#txtLastUpdated').text = 'Last updated: ' + formatDate(updated.prefsUpdatedAt);
        } catch (_) {}

        showStatus('✅ Preferences saved successfully.', false);

    } catch (err) {
        console.error('[CommPrefs] savePreferences error:', err);
        showStatus('Error saving preferences. Please try again.', true);
    } finally {
        setLoading(false);
    }
}

// ── Page ready ─────────────────────────────────────────────────────────────────
$w.onReady(async function () {
    setLoading(true);

    // 1. Authenticate session
    const token = getSessionToken();
    if (token) {
        try {
            sessionData = await validateCustomSession(token);
        } catch (e) {
            console.warn('[CommPrefs] Session validation failed:', e.message);
        }
    }

    // Fallback: try cached session data
    if (!sessionData) {
        sessionData = getSessionData();
    }

    if (!sessionData || !sessionData.personId) {
        // Not logged in — redirect to portal landing
        wixWindow.to('/portal');
        return;
    }

    // 2. Load current preferences
    await loadPreferences();

    // 3. Wire save button
    try {
        $w('#btnSavePrefs').onClick(async () => {
            await savePreferences();
        });
    } catch (e) {
        console.warn('[CommPrefs] Save button not found:', e.message);
    }
});
