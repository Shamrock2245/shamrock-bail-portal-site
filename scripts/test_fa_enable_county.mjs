/**
 * First Appearance per-county switch, end to end through the real page code
 * (the "first-appearance" router is not active on the Studio site).
 *
 * Covers: lee OFF vs ON; Writer's seoTitle / metaDescription / h1 with generic
 * fallback; body rendered as safe HTML in #faCountyContent; ON with no Studio
 * element; unknown slug; bare hub; the copy-rule validation that must refuse
 * bad entries; and /_functions/sitemap ON vs OFF.
 * SHOW_FA_ENABLE_OUTPUT=1 prints a table.
 */
import assert from 'node:assert/strict';
import { buildSitemapEntries, renderSitemapXml } from '../src/backend/sitemap-builder.js';
import {
    FA_HOURS_LINE,
    firstAppearanceSitemapEntries,
    validateFaCountyEntry,
    faMarkdownToHtml,
    stripEditorNotes
} from '../src/public/first-appearance-seo.js';
import { runFaPage } from './fa_page_harness.mjs';

const HUB = 'https://www.shamrockbailbonds.biz/first-appearance';
const LEE_PATH = ['first-appearance', 'lee'];

// Test-only fixture (not Writer's copy). Exercises every converter feature.
const LEE_BODY = [
    '# Lee County First Appearance (H1 line is dropped from the body)',
    '',
    'Lee County bookings are at the **Downtown jail, 2115 Dr. Martin Luther King Jr. Blvd.**, Fort Myers. [editor: photo here]',
    '',
    '## Where the hearing is held',
    '',
    'See [Lee County bail bonds](https://www.shamrockbailbonds.biz/florida-bail-bonds/lee) or the [court site](https://example.com/court).',
    '',
    '| Charge | Bond |',
    '|---|---|',
    '| Third-degree felony | $2,500 |',
    '',
    '### Questions',
    '',
    '- Call 239-332-2245',
    '- <script>alert(1)</script>',
    '',
    `${FA_HOURS_LINE}.`
].join('\n');
const LEE_ENTRY = {
    lastmod: '2026-12-01',
    h1: 'Lee County First Appearance Hearings',
    seoTitle: 'Lee County First Appearance | Shamrock Bail Bonds',
    metaDescription: 'Lee County first appearance court, jail and bond information. Call (239) 332-2245.',
    body: LEE_BODY
};
const LEE_ON = { lee: LEE_ENTRY };
const LEE_ON_NO_SEO = { lee: { lastmod: '2026-12-01', heading: 'Lee County First Appearance', body: LEE_BODY } };

const rows = [];

// ── validation guard ─────────────────────────────────────────────────────────
assert.deepEqual(validateFaCountyEntry('lee', LEE_ENTRY), { ok: true, errors: [], warnings: [] }, 'clean fixture passes');
const mustFail = {
    'banned number': { body: 'Call 239-955-0301.' },
    'banned number (dots)': { metaDescription: 'Call 239.955.0301' },
    free: { body: 'A free consultation.' },
    best: { seoTitle: 'Best bail in Lee' },
    guarantee: { body: 'We guarantee results.' },
    'fast release': { body: 'Get a fast release.' },
    'quick release': { body: 'Quick release from jail.' },
    'release speed': { body: 'Release speed matters.' },
    'minutes release': { body: 'Out in 30 minutes.' },
    'VERIFY note': { body: 'Weekends too. [VERIFY weekend time]' },
    'office hours: other walk-in line': { body: 'Walk-in hours Mon-Fri 9-6.' },
    'office hours: office hours 8 to 5': { metaDescription: 'Office hours are 8 to 5 weekdays.' },
    'office hours: Mon–Fri 9am': { body: 'Come by Mon–Fri 9am to 6pm.' },
    'office hours: 9–5 without the line': { seoTitle: 'Lee bail office open 9–5' },
    'Lee: which facility ... Ortiz': { body: 'Which facility the person is in (Downtown or Ortiz Ave.)' },
    'Lee: booked at Core': { body: 'People are booked at the Core facility.' },
    'Lee: held at Ortiz Avenue': { body: 'Some people are held at the Ortiz Avenue site.' }
};
// 24/7 availability wording and the exact hours line are allowed everywhere.
const mustPass = {
    'Available 24/7 (body)': { body: 'Available 24/7.' },
    'Available 24/7 (meta)': { metaDescription: 'Lee County first appearance information. Available 24/7.' },
    'Available 24/7 (h1)': { h1: 'Lee County Bail Bonds, Available 24/7' },
    'phones answered 24/7, around the clock': { body: 'Phones answered 24/7. We answer around the clock.' },
    'exact hours line': { body: `${FA_HOURS_LINE}.` },
    '"during office hours" with exact line': { body: `Families can walk in during office hours. ${FA_HOURS_LINE}.` },
    'court entrance hours (not office hours)': { body: 'The court lists public entrances open 7:30 a.m. to 5:00 p.m. Monday through Friday.' },
    'Lee: Core named only as a directory listing': { body: 'The Sheriff lists the Corrections Core facility at 2501 Ortiz Ave., (239) 477-1700.' }
};
for (const [name, patch] of Object.entries(mustPass)) {
    const entry = { ...LEE_ENTRY, ...patch };
    if (patch.body) entry.body = `${patch.body}\nLee County bookings are at the Downtown jail, 2115 Dr. Martin Luther King Jr. Blvd.`;
    const v = validateFaCountyEntry('lee', entry);
    assert.equal(v.ok, true, `validation must pass: ${name} -> ${JSON.stringify(v.errors)}`);
}
for (const [name, patch] of Object.entries(mustFail)) {
    const entry = { ...LEE_ENTRY, ...patch };
    if (patch.body) entry.body = `${patch.body}\nLee County bookings are at the Downtown jail, 2115 Dr. Martin Luther King Jr. Blvd.`;
    const v = validateFaCountyEntry('lee', entry);
    assert.equal(v.ok, false, `validation must fail: ${name}`);
    const r = await runFaPage({ lee: entry }, LEE_PATH);
    assert.equal(r.canonical, HUB, `invalid entry never self-canonicals: ${name}`);
    assert.equal(r.contentHtml, '', `invalid entry never renders: ${name}`);
    assert.equal(firstAppearanceSitemapEntries({ lee: entry }).length, 1, `invalid entry stays out of sitemap: ${name}`);
}
const noDowntown = validateFaCountyEntry('lee', { ...LEE_ENTRY, body: 'Lee County first appearance is at the Justice Center.' });
assert.equal(noDowntown.ok, true, 'missing Downtown address is a warning, not a block');
assert.equal(noDowntown.warnings.length, 1);
assert.match(noDowntown.warnings[0].rule, /Downtown jail/);
assert.equal(validateFaCountyEntry('polk', { ...LEE_ENTRY, body: 'Booked at the Core facility.' }).ok, true, 'Lee rule only applies to lee');
assert.equal(validateFaCountyEntry('lee', { ...LEE_ENTRY, seoTitle: 'x'.repeat(61) }).ok, false, 'seoTitle max 60');

// ── converter ────────────────────────────────────────────────────────────────
const html = faMarkdownToHtml(LEE_BODY, { pClass: 'font_8', hClass: 'font_2' });
assert.equal(html.includes('H1 line is dropped'), false, 'markdown H1 not repeated in body');
assert.match(html, /<h2 class="font_2">Where the hearing is held<\/h2>/);
assert.match(html, /<h3 class="font_2">Questions<\/h3>/);
assert.match(html, /<strong>Downtown jail, 2115 Dr\. Martin Luther King Jr\. Blvd\.<\/strong>/);
assert.match(html, /<a href="https:\/\/www\.shamrockbailbonds\.biz\/florida-bail-bonds\/lee">Lee County bail bonds<\/a>/);
assert.equal(html.includes('example.com'), false, 'external link becomes plain text');
assert.match(html, /the court site\./);
assert.match(html, /<ul><li><p class="font_8">Third-degree felony: \$2,500<\/p><\/li><\/ul>/, 'table -> list');
assert.equal(html.includes('|'), false, 'no table pipes');
assert.equal(/<script/i.test(html), false, 'raw HTML escaped');
assert.match(html, /&lt;script&gt;/);
assert.equal(/\[|\]/.test(html), false, 'bracketed notes stripped');
assert.equal(stripEditorNotes('A [VERIFY x] b [note] [l](https://www.shamrockbailbonds.biz/)'), 'A b [l](https://www.shamrockbailbonds.biz/)');
const mobileHtml = faMarkdownToHtml(LEE_BODY, { pClass: 'font_8', hClass: 'font_2', h2Px: 24, h3Px: 20 });
assert.match(mobileHtml, /<h2 class="font_2"><span style="font-size:24px;">Where the hearing is held<\/span><\/h2>/);
assert.match(mobileHtml, /<h3 class="font_2"><span style="font-size:20px;">Questions<\/span><\/h3>/);
assert.equal(/font-size/.test(html), false, 'desktop keeps theme heading sizes');
assert.equal(faMarkdownToHtml('## x', { h2Px: '24px;color:red' }).includes('style'), false, 'size must be a number');
assert.equal(faMarkdownToHtml('[x](javascript:alert(1))').includes('href'), false, 'non-https link dropped');
assert.equal(faMarkdownToHtml('[x](https://shamrockbailbonds.biz.evil.com/)').includes('href'), false, 'lookalike host dropped');

// ── page code ────────────────────────────────────────────────────────────────
const off = await runFaPage({}, LEE_PATH);
rows.push(['lee OFF', off]);
assert.equal(off.canonical, HUB);
assert.equal(off.robots, 'index, follow');
assert.equal(off.contentHtml, '');
assert.match(off.title, /Lee County, FL \| Shamrock Bail Bonds/, 'generic title');
assert.ok(off.description.includes(FA_HOURS_LINE), 'generic description uses the exact hours line');

const on = await runFaPage(LEE_ON, LEE_PATH);
rows.push(['lee ON (Writer SEO fields)', on]);
assert.equal(on.canonical, `${HUB}/lee`, 'enabled county self-canonicals');
assert.equal(on.ogUrl, `${HUB}/lee`);
assert.equal(on.robots, 'index, follow', 'enabled county has no noindex');
assert.equal(on.title, LEE_ENTRY.seoTitle, "Writer's SEO title");
assert.equal(on.description, LEE_ENTRY.metaDescription, "Writer's meta description");
assert.equal(on.headingText, LEE_ENTRY.h1, 'h1 text -> #faCountyHeading (H2-styled element)');
assert.equal(on.contentHtml, faMarkdownToHtml(LEE_BODY, { pClass: 'font_8 wixui-rich-text__text', hClass: 'font_2 wixui-rich-text__text' }), 'body -> #faCountyContent.html with Studio classes');
assert.equal(on.structured, 1, 'JSON-LD call awaited in the same promise');

const onMobile = await runFaPage(LEE_ON, LEE_PATH, { formFactor: 'Mobile' });
rows.push(['lee ON, formFactor Mobile', onMobile]);
assert.match(onMobile.contentHtml, /<h2 class="font_2 wixui-rich-text__text"><span style="font-size:24px;">/, 'mobile h2 24px');
assert.match(onMobile.contentHtml, /<h3 class="font_2 wixui-rich-text__text"><span style="font-size:20px;">/, 'mobile h3 20px');
assert.equal(/font-size/.test(on.contentHtml), false, 'desktop: no size override');

const onNoSeo = await runFaPage(LEE_ON_NO_SEO, LEE_PATH);
rows.push(['lee ON (no seoTitle/metaDescription)', onNoSeo]);
assert.equal(onNoSeo.canonical, `${HUB}/lee`);
assert.equal(onNoSeo.title, off.title, 'falls back to generic title');
assert.equal(onNoSeo.description, off.description, 'falls back to generic description');
assert.equal(onNoSeo.headingText, 'Lee County First Appearance', 'legacy heading field still works');

const onNoEl = await runFaPage(LEE_ON, LEE_PATH, { hasContentElement: false });
rows.push(['lee ON, no #faCountyContent in Studio', onNoEl]);
assert.equal(onNoEl.canonical, HUB, 'no element -> no self-canonical on duplicate text');
assert.equal(onNoEl.title, off.title, 'no element -> generic title');

const onOther = await runFaPage(LEE_ON, ['first-appearance', 'polk']);
rows.push(['polk while only lee ON', onOther]);
assert.equal(onOther.canonical, HUB);

const unknown = await runFaPage(LEE_ON, ['first-appearance', 'nonexistent-county']);
rows.push(['unknown slug', unknown]);
assert.equal(unknown.robots, 'noindex, follow');
assert.equal(unknown.canonical, HUB);

const hub = await runFaPage(LEE_ON, ['first-appearance']);
rows.push(['bare hub', hub]);
assert.equal(hub.canonical, '(Studio panel default)', 'hub tags untouched');
assert.equal(hub.robots, '(not set)');

// ── sitemap ON vs OFF ────────────────────────────────────────────────────────
const smOff = renderSitemapXml(buildSitemapEntries({ firstAppearance: firstAppearanceSitemapEntries({}) }));
const smOn = renderSitemapXml(buildSitemapEntries({ firstAppearance: firstAppearanceSitemapEntries(LEE_ON) }));
assert.equal(smOff.includes(`${HUB}/lee<`), false);
assert.match(smOn, /<loc>https:\/\/www\.shamrockbailbonds\.biz\/first-appearance\/lee<\/loc>\n    <lastmod>2026-12-01<\/lastmod>/);
assert.equal(firstAppearanceSitemapEntries({ lee: { lastmod: '2026-12-01', body: '' } }).length, 1);
assert.equal(firstAppearanceSitemapEntries({ lee: { lastmod: 'soon', body: 'x' } }).length, 1);

if (process.env.SHOW_FA_ENABLE_OUTPUT) {
    console.log('validation must-fail cases (all refused, hub canonical, not in sitemap): ' + Object.keys(mustFail).join('; '));
    console.log('validation must-pass cases: ' + Object.keys(mustPass).join('; '));
    console.log('case | canonical | robots | title | description | #faCountyHeading | #faCountyContent');
    for (const [name, r] of rows) {
        console.log(`${name} | ${r.canonical} | ${r.robots} | ${r.title} | ${r.description} | ${r.headingText || '-'} | ${r.contentHtml ? `${r.contentHtml.length} chars HTML` : '-'}`);
    }
    console.log('--- #faCountyContent.html, lee ON ---\n' + on.contentHtml);
    const pick = (xml) => (xml.match(/<url>\n    <loc>[^<]*first-appearance[^<]*<\/loc>[\s\S]*?<\/url>/g) || []).join('\n');
    console.log('--- /_functions/sitemap first-appearance entries, lee OFF ---\n' + pick(smOff));
    console.log('--- /_functions/sitemap first-appearance entries, lee ON ---\n' + pick(smOn));
}
console.log('first-appearance enable-county checks ok');
