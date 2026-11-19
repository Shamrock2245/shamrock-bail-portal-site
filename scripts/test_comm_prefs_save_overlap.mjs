/**
 * Communication Preferences embed: overlapping / stale save answers.
 * Runs the embed's inline script against a tiny fake DOM and fake timers.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const embedPath = join(root, 'src/custom-embeds/communication-preferences-embed.html');
const pagePath = join(root, 'src/pages/Communication Preferences.zc3fn.js');

const html = readFileSync(embedPath, 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));

function makeHarness() {
    const els = new Map();
    const make = (id) => {
        const listeners = {};
        const classes = new Set();
        const el = {
            id, value: 'x', checked: true, textContent: '', className: '', disabled: false,
            classList: {
                add: (c) => classes.add(c),
                remove: (c) => classes.delete(c),
                toggle: (c, on) => (on === undefined ? !classes.has(c) : on) ? classes.add(c) : classes.delete(c),
                contains: (c) => classes.has(c)
            },
            addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn); },
            click: () => { if (!el.disabled) (listeners.click || []).forEach((fn) => fn()); },
            closest: () => el,
            querySelector: () => el
        };
        return el;
    };
    const document = {
        getElementById: (id) => { if (!els.has(id)) els.set(id, make(id)); return els.get(id); },
        querySelectorAll: () => []
    };
    // fake timers
    let now = 0; let nextId = 1; const timers = new Map();
    const setTimeout = (fn, ms) => { const id = nextId++; timers.set(id, { fn, at: now + ms }); return id; };
    const clearTimeout = (id) => { timers.delete(id); };
    const advance = (ms) => {
        now += ms;
        for (const [id, t] of [...timers]) if (t.at <= now) { timers.delete(id); t.fn(); }
    };
    const sent = [];
    let onMessage;
    const window = {
        parent: { postMessage: (m) => sent.push(m) },
        addEventListener: (t, fn) => { if (t === 'message') onMessage = fn; }
    };
    vm.runInNewContext(script, { document, window, setTimeout, clearTimeout });
    const btn = document.getElementById('btnSave');
    return {
        btn, sent, advance,
        toast: document.getElementById('statusToast'),
        lastUpdated: document.getElementById('lastUpdated'),
        reply: (msg) => onMessage({ data: msg })
    };
}

// 1. A second click while a save is in flight is ignored.
{
    const h = makeHarness();
    h.btn.click();
    assert.equal(h.btn.disabled, true);
    h.btn.click();
    assert.equal(h.sent.length, 1, 'no second save while the first is in flight');
    assert.equal(typeof h.sent[0].requestId, 'number');
}

// 2. A matching answer clears the watchdog and re-enables the button.
{
    const h = makeHarness();
    h.btn.click();
    h.reply({ type: 'saveSuccess', requestId: h.sent[0].requestId, data: { lastUpdated: 'Today' } });
    assert.equal(h.btn.disabled, false);
    assert.match(h.toast.textContent, /saved successfully/);
    h.advance(25000);
    assert.match(h.toast.textContent, /saved successfully/, 'cleared watchdog must not fire later');
}

// 3. Timeout re-enables; a late answer from the old attempt cannot settle a retry.
{
    const h = makeHarness();
    h.btn.click();
    const first = h.sent[0].requestId;
    h.advance(20000);
    assert.equal(h.btn.disabled, false);
    assert.match(h.toast.textContent, /239-332-2245/);
    h.btn.click();
    const second = h.sent[1].requestId;
    assert.notEqual(first, second);
    assert.equal(h.btn.disabled, true);
    h.reply({ type: 'saveSuccess', requestId: first, data: { lastUpdated: 'Stale' } });
    assert.equal(h.btn.disabled, true, 'stale answer must not release the retry');
    assert.equal(h.lastUpdated.textContent, '');
    h.advance(19000); // retry watchdog must still be armed (not cleared by the stale answer)
    assert.equal(h.btn.disabled, true);
    h.advance(1000);
    assert.equal(h.btn.disabled, false, 'retry watchdog still fires');
}

// 4. A late answer for a timed-out attempt is shown when nothing newer is in flight.
{
    const h = makeHarness();
    h.btn.click();
    const first = h.sent[0].requestId;
    h.advance(20000);
    h.reply({ type: 'saveSuccess', requestId: first, data: { lastUpdated: 'Late' } });
    assert.match(h.toast.textContent, /saved successfully/);
    assert.equal(h.lastUpdated.textContent, 'Last updated: Late');
}

// 4b. A late success from a timed-out attempt is ignored once a newer attempt was made,
//     even if the newer attempt was rejected and nothing is in flight any more.
{
    const h = makeHarness();
    h.btn.click();
    const first = h.sent[0].requestId;
    h.advance(20000);
    h.btn.click(); // retry with edited values
    const second = h.sent[1].requestId;
    // page refuses the retry because the first write is still unresolved
    h.reply({ type: 'saveError', requestId: second, message: 'Your previous save is still finishing.' });
    assert.equal(h.btn.disabled, false);
    assert.match(h.toast.textContent, /still finishing/);
    h.reply({ type: 'saveSuccess', requestId: first, data: { lastUpdated: 'Superseded' } });
    assert.doesNotMatch(h.toast.textContent, /saved successfully/, 'superseded answer must not report success');
    assert.equal(h.lastUpdated.textContent, '');
    assert.equal(h.btn.disabled, false);
}

// 5. Answers without a request id are ignored when idle and accepted when active.
{
    const h = makeHarness();
    h.reply({ type: 'saveSuccess' });
    assert.equal(h.toast.textContent, '');
    h.btn.click();
    h.reply({ type: 'saveError', message: 'Nope' });
    assert.equal(h.btn.disabled, false);
    assert.equal(h.toast.textContent, 'Nope');
}

// 6. Page code echoes the request id and refuses overlapping writes.
{
    const page = readFileSync(pagePath, 'utf8');
    assert.match(page, /savePreferences\(formData, requestId\)/);
    assert.match(page, /type: 'saveSuccess',\s+requestId/);
    assert.match(page, /type: 'saveError',\s+requestId/);
    assert.match(page, /if \(saveInFlight\)/);
    assert.match(page, /finally \{\s+saveInFlight = false;/);
}

// Element IDs the page code and styles rely on stay put.
for (const id of ['btnSave', 'statusToast', 'lastUpdated', 'firstName', 'lastName', 'phone', 'email', 'caseNumber',
    'toggleSms', 'toggleWhatsapp', 'toggleTelegram', 'toggleEmail']) {
    assert.ok(html.includes(`id="${id}"`), `embed keeps #${id}`);
}

console.log('communication preferences save-overlap tests passed');
