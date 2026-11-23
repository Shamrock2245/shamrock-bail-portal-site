// Guards the runtime sms: binding for #smsBondsmanBtn (comp-mvl645vm) on the
// Florida Counties (Item) dynamic page. Studio's link panel rejects sms: URLs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/pages/Florida Counties (Item).ygoim.js'), 'utf8');

function load() {
    const grab = (re) => {
        const m = src.match(re);
        assert.ok(m, `missing ${re}`);
        return m[0];
    };
    const safeSelect = grab(/function safeSelect[\s\S]*?\n}\n/);
    const konst = grab(/export const COUNTY_SMS_URL = [^\n]*\n/).replace('export ', '');
    const fn = grab(/export function bindCountySmsButton[\s\S]*?\n}\n/).replace('export ', '');
    return new Function('$w', 'wixLocationFrontend',
        `${safeSelect}\n${konst}\n${fn}\nreturn { bindCountySmsButton, COUNTY_SMS_URL };`);
}

test('onReady calls bindCountySmsButton inside try/catch', () => {
    assert.match(src, /try \{ bindCountySmsButton\(\$w, wixLocationFrontend\); \} catch/);
    assert.match(src, /#smsBondsmanBtn/);
    assert.match(src, /comp-mvl645vm/);
});

test('binds onClick -> location.to(sms:+12399550178)', () => {
    const { bindCountySmsButton } = load()(() => null, {});
    let handler = null;
    const btn = { id: 'x', onClick(h) { handler = h; } };
    const to = [];
    assert.equal(bindCountySmsButton(() => btn, { to: (u) => to.push(u) }), true);
    assert.equal(typeof handler, 'function');
    handler();
    assert.deepEqual(to, ['sms:+12399550178']);
});

test('element without onClick or lookup that throws is a no-op', () => {
    const { bindCountySmsButton } = load()(() => null, {});
    assert.equal(bindCountySmsButton(() => ({ id: 'x' }), {}), false);
});

test('missing element is a no-op', () => {
    const { bindCountySmsButton } = load()(() => null, {});
    assert.equal(bindCountySmsButton(() => { throw new Error('no such element'); }, {}), false);
    assert.equal(bindCountySmsButton(() => null, {}), false);
});
