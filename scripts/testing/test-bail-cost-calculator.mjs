import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePremium, formatUsd, CALCULATOR_FOOTNOTE } from '../../src/public/bailCostCalculator.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

assert.equal(computePremium([500, 750]), 200);
assert.equal(computePremium([10000]), 1000);
assert.equal(computePremium([]), 0);
assert.equal(computePremium(['']), 0);
assert.equal(computePremium([0]), 0);
assert.equal(computePremium([null, undefined, 'abc', -5]), 0);
assert.equal(computePremium(['$10,000', '']), 1000);
assert.equal(computePremium([1000]), 100);
assert.equal(computePremium([2500]), 250);
assert.equal(computePremium([500, '', 0]), 100);
assert.equal(formatUsd(1000), '$1,000.00');

const html = readFileSync(join(root, 'src/public/bail-cost-calculator.html'), 'utf8');
const fn = html.match(/function computePremium[\s\S]*?\n}\n/)[0];
const inlined = new Function(fn + '; return computePremium;')();
for (const set of [[500, 750], [10000], [], [''], [0], ['$1,234.50', 99], [1, 2, 3]]) {
    assert.equal(inlined(set), computePremium(set), JSON.stringify(set));
}
assert.ok(html.includes(CALCULATOR_FOOTNOTE));
for (const s of ['tel:+12393322245', 'tel:+17272952245', 'sms:+12399550178', 'Call 239-332-2245', 'Español 727-295-2245', 'Text 239-955-0178']) assert.ok(html.includes(s), s);
assert.ok(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|955-0301|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html), 'no network/storage/external font/retired phone');
assert.ok(!/\b(fast|quick|minutes)\b/i.test(html));
console.log('bail cost calculator ok');
