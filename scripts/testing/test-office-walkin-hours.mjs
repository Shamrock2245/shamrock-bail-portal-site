/**
 * Office JSON-LD is Mon–Fri 09:00–17:00. Phone contact points stay 24/7.
 * The Spanish line stays 727-295-2245.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const pages = [
    'src/pages/Contact.ilgty.js',
    'src/pages/Privacy Policy.kq1bu.js',
    'src/pages/Testimonials (List).bv3hz.js',
    'src/pages/first-appearance.h4fpl.js',
    'src/pages/terms-and-conditions.e6rv6.js',
    'scripts/seo/seo-rich-results.jsw',
    'src/backend/seoConfig.js'
];

for (const rel of pages) {
    const text = read(rel);
    assert.equal(text.includes('955-0301'), false, `${rel} must not use the retired Spanish line`);
    const hasOfficeHours = text.includes('Mo-Fr 09:00-17:00') || text.includes('OFFICE_OPENING_HOURS');
    assert.equal(hasOfficeHours, true, `${rel} office openingHours`);
    assert.equal(text.includes('"09:00"') || text.includes("'09:00'"), true, `${rel} opens 09:00`);
    assert.equal(text.includes('"17:00"') || text.includes("'17:00'"), true, `${rel} closes 17:00`);
    assert.equal(text.includes('00:00'), true, `${rel} phone hours stay overnight`);
    assert.equal(text.includes('23:59'), true, `${rel} phone hours stay overnight`);
}

const contact = read('src/pages/Contact.ilgty.js');
assert.ok(
    contact.includes('Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7'),
    'Contact copy keeps the walk-in sentence already on main'
);

const seo = read('src/backend/seoConfig.js');
assert.ok(seo.includes("display:  '(727) 295-2245'"), 'Spanish line stays 727-295-2245');
assert.ok(seo.includes('const PHONE_HOURS'), 'phone hours are separate from office hours');
assert.ok(!/dayOfWeek:\s*HOURS\.dayOfWeek/.test(seo), 'contact points must not reuse office HOURS');

console.log('office walk-in hours checks ok');
