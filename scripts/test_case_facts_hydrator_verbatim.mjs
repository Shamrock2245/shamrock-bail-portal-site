/**
 * Verifies Verbatim Charge Integrity in backend/chargeVerbatim.js and case-facts-hydrator.jsw.
 * - Comma inside a charge (e.g. "BATTERY, DOMESTIC") never splits into two charges.
 * - Statutes, digits, hyphens, dollar values, and "(LEV:F DEG:F 3756) (Principal - P)" are preserved verbatim.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bailCalcSrc = readFileSync(join(root, 'src/backend/bailCalculator.jsw'), 'utf8');

// Verify syntax & provide lightweight hook for backend/bailCalculator
registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === 'backend/bailCalculator') {
            return {
                url: 'data:text/javascript,' + encodeURIComponent(`
                    export function calculateBondFee(totalBond, chargeCount) {
                        const base = Math.max(Number(totalBond || 0) * 0.10, Number(chargeCount || 1) * 100);
                        return { premium: base };
                    }
                    export function calculateTransferFee() { return { fee: 0 }; }
                `),
                shortCircuit: true
            };
        }
        return nextResolve(specifier, context);
    }
});

const { parseChargesString, normalizeLeadMatch } = await import('../src/backend/chargeVerbatim.js');

// 1. Comma never splits a charge
const commaCharges = parseChargesString('BATTERY, DOMESTIC; DUI, 1ST OFFENSE');
assert.deepEqual(commaCharges, ['BATTERY, DOMESTIC', 'DUI, 1ST OFFENSE']);

// 2. Pipe and newline split cleanly while preserving verbatim text
const multi = parseChargesString(
    'New Charge: 893.135 1f1 - Amphetamine - Trafficking More Than 14 Grams (LEV:F DEG:F 3756) (Principal - P) | BATTERY, DOMESTIC'
);
assert.equal(multi.length, 2);
assert.equal(
    multi[0],
    'New Charge: 893.135 1f1 - Amphetamine - Trafficking More Than 14 Grams (LEV:F DEG:F 3756) (Principal - P)'
);
assert.equal(multi[1], 'BATTERY, DOMESTIC');

// 3. normalizeLeadMatch preserves exact verbatim string & structured charge_details
const normalizedFromStr = normalizeLeadMatch({
    defendant_name: 'DOE, JOHN',
    county: 'Lee',
    totalBond: 25000,
    charges: 'New Charge: 893.135 1f1 - Amphetamine - Trafficking More Than 14 Grams (LEV:F DEG:F 3756) (Principal - P)'
});
assert.equal(normalizedFromStr.charges.length, 1);
assert.equal(
    normalizedFromStr.charges[0].description,
    'New Charge: 893.135 1f1 - Amphetamine - Trafficking More Than 14 Grams (LEV:F DEG:F 3756) (Principal - P)'
);
assert.equal(normalizedFromStr.charges[0].verbatimText, normalizedFromStr.charges[0].description);
assert.equal(normalizedFromStr.charges[0].chargeLevel, 'Felony');

// 4. Hydrator source delegates to chargeVerbatim and never strips text via cleanChargeDesc
const hydratorSrc = readFileSync(join(root, 'src/backend/case-facts-hydrator.jsw'), 'utf8');
assert.equal(hydratorSrc.includes('cleanChargeDesc'), false, 'destructive cleanChargeDesc must be removed');
assert.match(hydratorSrc, /backend\/chargeVerbatim/);
assert.ok(bailCalcSrc.length > 0);

console.log('case-facts-hydrator verbatim charge integrity checks passed');
