/**
 * Bail cost calculator logic. Pure functions: no storage, no network, no PII.
 * Florida state premium = sum over charges of max(10% x bond, $100).
 * Blank, 0, or any value that is not a complete number counts as no charge ($0).
 * Federal bonds are not estimated here.
 * Keep computePremium identical to the copy inlined in bail-cost-calculator.html
 * (scripts/testing/test-bail-cost-calculator.mjs checks they agree).
 */

/**
 * @param {Array<number|string|null|undefined>} amounts bond amount per charge
 * @returns {number} total premium in dollars
 */
export function computePremium(amounts) {
    let cents = 0;
    (amounts || []).forEach(function (raw) {
        const text = String(raw == null ? '' : raw).replace(/[$,\s]/g, '');
        if (!/^\d+(\.\d+)?$/.test(text)) return;
        const bond = parseFloat(text);
        if (!isFinite(bond) || bond <= 0) return;
        cents += Math.max(Math.round(bond * 10), 10000);
    });
    return cents / 100;
}

/**
 * @param {number} dollars
 * @returns {string} e.g. "$1,000.00"
 */
export function formatUsd(dollars) {
    return '$' + dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const CALCULATOR_FOOTNOTE = 'Florida state charges only: 10% per charge, $100 minimum per charge. Federal bonds are 15% and are not included in this estimate. Collateral and any fees are explained before you sign.';
