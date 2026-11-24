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
    const laterFn = grab(/function later[\s\S]*?\n}\n/);
    const fn = grab(/export function reapplyAfterDatasetBinding[\s\S]*?\n}\n/).replace('export ', '');
    return new Function('setTimeout', `${safeSelect}\n${laterFn}\n${fn}\nreturn reapplyAfterDatasetBinding;`);
}

test('global.css clears the Studio Hide via custom classes (Wix rewrites #comp- selectors)', () => {
    assert.match(css, /\.county-writeup-box,[^{]*\.county-quickfacts-section \{[^}]*--l_display: initial !important;/);
    const block = css.slice(css.lastIndexOf('/*', css.indexOf('COUNTY ITEM PAGE')));
    assert.doesNotMatch(block.replace(/\/\*[\s\S]*?\*\//g, ''), /#comp-/);
});

test('page code adds the custom classes', () => {
    assert.match(src, /addCustomClass\(box, 'county-writeup-box'\)/);
    assert.match(src, /addCustomClass\(qfSection, 'county-quickfacts-section'\)/);
    assert.match(src, /addCustomClass\(safeSelect\(\$wFn, '#text61'\), 'county-writeup-heading'\)/);
    assert.match(src, /addCustomClass\(about, 'county-writeup-text'\)/);
});

test('addCustomClass is safe without customClassList', () => {
    const m = src.match(/export function addCustomClass[\s\S]*?\n}\n/);
    const addCustomClass = new Function(`${m[0].replace('export ', '')}\nreturn addCustomClass;`)();
    const added = [];
    assert.equal(addCustomClass({ customClassList: { add: (c) => added.push(c) } }, 'x'), true);
    assert.deepEqual(added, ['x']);
    assert.equal(addCustomClass({}, 'x'), false);
    assert.equal(addCustomClass(null, 'x'), false);
});

test('page code expands #box35 and #leeAnswersSection (element ids unchanged)', () => {
    assert.match(src, /safeSelect\(\$wFn, '#box35'\)/);
    assert.match(src, /expandNode\(box\)/);
    assert.match(src, /safeSelect\(\$wFn, '#leeAnswersSection'\)/);
    assert.match(src, /expandNode\(qfSection\)/);
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

test('write-up re-apply always writes (alternating a trailing zero-width space)', () => {
    assert.doesNotMatch(src, /if \(about\.html !== aboutHtml\)/);
    assert.match(src, /about\.html = flip \? aboutHtml : `\$\{aboutHtml\}\\u200B`;/);
});

test('FAQ repeater data is re-applied after #dataset1', () => {
    assert.match(src, /reapplyAfterDatasetBinding\(\$wFn, repeater, \(\) => \{[\s\S]*?repeater\.data = faqs\.map[\s\S]*?\}, \['#dataset1'\]\);/);
    const timers = [];
    const reapply = loadReapply()((fn, ms) => { timers.push({ fn, ms }); return { unref() {} }; });
    const readyCbs = [];
    const ds = { id: 'dataset1', onReady(cb) { readyCbs.push(cb); } };
    const repeater = { id: 'countyFaqRepeater', data: [] };
    const faqs = [{ _id: 'a', title: 'Q', answer: 'A' }];
    reapply((sel) => (sel === '#dataset1' ? ds : null), repeater, () => { repeater.data = faqs.map((f) => Object.assign({}, f)); }, ['#dataset1']);
    repeater.data = [];
    readyCbs[0]();
    assert.equal(repeater.data.length, 1);
});
