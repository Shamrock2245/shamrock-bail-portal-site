// Guards the county write-up box (#box35 / comp-mvsbu2xu) and quick facts
// section (#leeAnswersSection / comp-mvsfvdu9) on the Florida Counties (Item)
// dynamic page: both are hidden in Studio, so global.css clears the layout
// Hide and page code expands them; the write-up is re-applied after the
// dataset binding (jailPage.localAngle) overwrites it in the browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/pages/Florida Counties (Item).ygoim.js'), 'utf8');
const css = readFileSync(join(root, 'src/styles/global.css'), 'utf8');

function loadReapply() {
    const grab = (re) => {
        const m = src.match(re);
        assert.ok(m, `missing ${re}`);
        return m[0];
    };
    const safeSelect = grab(/function safeSelect[\s\S]*?\n}\n/);
    const fn = grab(/export function reapplyAfterDatasetBinding[\s\S]*?\n}\n/).replace('export ', '');
    return new Function('setTimeout', `${safeSelect}\n${fn}\nreturn reapplyAfterDatasetBinding;`);
}

test('global.css clears the Studio Hide on the write-up box and quick facts section', () => {
    assert.match(css, /#comp-mvsbu2xu,[^{]*#comp-mvsfvdu9 \{[^}]*--l_display: initial !important;/);
});

test('page code expands #box35 and #leeAnswersSection (element ids unchanged)', () => {
    assert.match(src, /expandNode\(safeSelect\(\$wFn, '#box35'\)\)/);
    assert.match(src, /expandNode\(safeSelect\(\$wFn, '#leeAnswersSection'\)\)/);
    assert.match(src, /safeSelect\(\$wFn, '#countyAboutText'\)/);
});

test('write-up html is re-applied after the dataset binding overwrites it', () => {
    const timers = [];
    const reapply = loadReapply()((fn, ms) => timers.push({ fn, ms }));
    const readyCbs = [];
    let viewportCb = null;
    const dataset = { id: 'countyDataset', onReady(cb) { readyCbs.push(cb); } };
    const about = { id: 'countyAboutText', html: '', onViewportEnter(cb) { viewportCb = cb; } };
    const want = '<p>Local copy</p><ul><li><a href="/florida-bail-bonds/tampa">Tampa</a></li></ul>';
    const apply = () => { if (about.html !== want) about.html = want; };
    const $wFn = (sel) => (sel === '#countyDataset' ? dataset : null);

    apply();
    reapply($wFn, about, apply);
    assert.equal(readyCbs.length, 1);
    assert.equal(typeof viewportCb, 'function');

    // Binding pass replaces the write-up with the bound field (links lost).
    about.html = '<p>Local copy</p>';
    readyCbs[0]();
    assert.equal(about.html, want);

    about.html = '';
    timers.forEach((t) => t.fn());
    assert.equal(about.html, want);
    assert.ok(timers.some((t) => t.ms === 0));

    about.html = '';
    viewportCb();
    assert.equal(about.html, want);
});

test('missing dataset and missing onViewportEnter are no-ops', () => {
    const reapply = loadReapply()(() => {});
    assert.doesNotThrow(() => reapply(() => null, { id: 'x' }, () => {}));
    assert.doesNotThrow(() => reapply(() => null, null, () => {}));
});
