/**
 * Pure verbatim charge parsing and normalization helpers for Wix Velo backend.
 *
 * CRITICAL LAW (AGENTS.md):
 * Charges MUST preserve exact verbatim county/sheriff/clerk wording.
 * Never split on commas (e.g. "BATTERY, DOMESTIC" is one charge).
 * Never strip statutes, digits, punctuation, or parenthetical codes.
 *
 * @module chargeVerbatim
 */

import { calculateBondFee, calculateTransferFee } from 'backend/bailCalculator';

/**
 * Split a plain charge text block only on explicit roster delimiters (|, newline, ;).
 * Never splits on commas.
 * @param {string} str
 * @returns {string[]}
 */
export function parseChargesString(str) {
    if (!str || typeof str !== 'string') return [];
    return str
        .split(/[|\r\n;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

/**
 * Extract a Florida statute citation when present, without mutating the charge string.
 * @param {string} desc
 * @returns {string}
 */
export function extractStatute(desc) {
    const match = String(desc || '').match(/\b\d{3}\.\d{2,4}(?:\([a-z0-9]+\))?\b/i);
    return match ? match[0] : '';
}

/**
 * Extract an inline bond amount ($X,XXX.XX) when embedded in a charge line.
 * @param {string} desc
 * @returns {number}
 */
export function extractChargeBond(desc) {
    const match = String(desc || '').match(/\$[\d,]+(?:\.\d{2})?/);
    if (match) {
        return parseFloat(match[0].replace(/[\$,]/g, ''));
    }
    return 0;
}

/**
 * Infer charge level from verbatim string without modifying description text.
 * @param {string} desc
 * @returns {string}
 */
export function inferChargeLevel(desc) {
    const text = String(desc || '');
    if (/\(LEV:F\b|\bfelony\b/i.test(text)) return 'Felony';
    if (/\(LEV:M\b|\bmisdemeanor\b/i.test(text)) return 'Misdemeanor';
    return 'Unknown';
}

function readRawChargeRows(raw) {
    if (!raw || typeof raw !== 'object') return [];
    if (Array.isArray(raw.charge_details) && raw.charge_details.length > 0) return raw.charge_details;
    if (Array.isArray(raw.charge_list) && raw.charge_list.length > 0) return raw.charge_list;
    if (Array.isArray(raw.charges) && raw.charges.length > 0) return raw.charges;
    if (typeof raw.charges === 'string' && raw.charges.trim()) {
        return parseChargesString(raw.charges);
    }
    return [];
}

/**
 * Normalizes arrest lead record into canonical case facts structure while
 * preserving exact verbatim charge strings.
 * @param {Object} raw - Raw lead data from scraper/CMS
 * @param {string} [defaultCounty='Lee'] - Fallback county
 * @returns {Object} Structured case facts
 */
export function normalizeLeadMatch(raw, defaultCounty = 'Lee') {
    const r = raw || {};
    const rawCharges = readRawChargeRows(r);

    let totalBond = Number(r.totalBond || r.total_bond_amount || r.totalBondAmount || r.bond_amount || 0);

    const structuredCharges = rawCharges
        .map((c) => {
            if (typeof c === 'string') {
                const verbatim = c.trim();
                if (!verbatim) return null;
                return {
                    statute: extractStatute(verbatim),
                    description: verbatim,
                    verbatimText: verbatim,
                    bondAmount: extractChargeBond(verbatim) || 0,
                    chargeLevel: inferChargeLevel(verbatim),
                };
            }
            if (c && typeof c === 'object') {
                const verbatim = String(
                    c.verbatimText ||
                    c.verbatim ||
                    c.charge_text ||
                    c.charge ||
                    c.description ||
                    c.charge_description ||
                    c.chargeDescription ||
                    ''
                ).trim();
                return {
                    statute: String(c.statute || extractStatute(verbatim) || '').trim(),
                    description: verbatim,
                    verbatimText: verbatim,
                    bondAmount: Number(c.bondAmount || c.bond_amount || 0),
                    chargeLevel: c.chargeLevel || c.charge_level || inferChargeLevel(verbatim),
                };
            }
            return null;
        })
        .filter((row) => row && row.description);

    if (!totalBond) {
        totalBond = structuredCharges.reduce((sum, c) => sum + (Number(c.bondAmount) || 0), 0);
    }

    const county = r.county || defaultCounty;
    const feeCalculation = calculateBondFee(totalBond, Math.max(structuredCharges.length, 1));
    const transferFee = calculateTransferFee(county).fee || 0;

    return {
        defendantName: r.defendantName || r.defendant_name || r.name || '',
        bookingNumber: r.bookingNumber || r.booking_number || '',
        caseNumbers: r.caseNumber || r.caseNumbers ? [r.caseNumber || r.caseNumbers].flat() : [],
        county,
        jailFacility: r.jailFacility || r.facility || r.jail || `${county} County Jail / Detention Center`,
        charges: structuredCharges,
        totalBond,
        premiumEstimate: feeCalculation.premium + transferFee,
        transferFee,
        courtDates: r.courtDate || r.court_date ? [
            {
                date: r.courtDate || r.court_date,
                courtroom: r.courtroom || 'Courtroom 1',
                time: r.courtTime || '09:00 AM',
                zoomLink: r.zoomLink || '',
            },
        ] : [],
        bookingDate: r.bookingDate || r.booking_date || new Date().toISOString().split('T')[0],
        mugshotUrl: r.mugshotUrl || r.mugshot || null,
    };
}
