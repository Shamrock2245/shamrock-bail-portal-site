/**
 * Studio cutover redirect import:
 * - no duplicate sources
 * - every Wix import target starts with /
 * - row count matches the cutover doc
 * - 67 /bail-bonds/{slug}-county rows match DASHBOARD_URL_REDIRECTS
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    DASHBOARD_URL_REDIRECTS,
    FLORIDA_COUNTY_SLUGS
} from '../src/backend/seo-redirects.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'https://www.shamrockbailbonds.biz';
const EXPECTED_REDIRECT_ROWS = 195;
const EXPECTED_URL_MAP_ROWS = 434;
const EXPECTED_COUNTY_SUFFIX = 67;
const PUBLISH_NOTE = 'remove page at publish time (Brendan publishes)';
const FRAGMENT_FALLBACK = 'FALLBACK: use /bail-school if Wix Redirect Manager rejects the fragment.';
const MY_ORDERS_NOTE = 'Unmapped target to verify: /myorders. Do not guess a new target.';
const COUNTY_REASON = 'County suffix alias from DASHBOARD_URL_REDIRECTS. 301 to the live county page.';

function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    cell += '"';
                    i += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                cell += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ',') {
            row.push(cell);
            cell = '';
        } else if (c === '\n') {
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
        } else if (c !== '\r') {
            cell += c;
        }
    }
    if (cell.length || row.length) {
        row.push(cell);
        rows.push(row);
    }
    return rows.filter((item) => item.some((value) => value.length));
}

function records(file, headers) {
    const rows = parseCsv(readFileSync(join(root, file), 'utf8'));
    assert.deepEqual(rows[0], headers, file + ' header');
    return rows.slice(1).map((row) => {
        assert.equal(row.length, headers.length, file + ' column count');
        return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
    });
}

function pathOf(url) {
    if (url.startsWith(HOST)) {
        return url.slice(HOST.length) || '/';
    }
    return url;
}

const redirects = records('docs/studio-cutover-redirects.csv', ['Old URL', 'New URL']);
const urlMap = records('docs/studio-cutover-url-map.csv', [
    'old_url', 'studio_url', 'action', 'reason', 'protected', 'clicks', 'impressions'
]);

assert.equal(redirects.length, EXPECTED_REDIRECT_ROWS);
assert.equal(urlMap.length, EXPECTED_URL_MAP_ROWS);
assert.equal(FLORIDA_COUNTY_SLUGS.length, EXPECTED_COUNTY_SUFFIX);

const sources = redirects.map((row) => row['Old URL']);
assert.equal(new Set(sources).size, sources.length, 'duplicate redirect source');
assert.deepEqual(sources, [...sources].sort(), 'redirect rows stay sorted by Old URL');

for (const row of redirects) {
    assert.equal(row['Old URL'].startsWith('/'), true, row['Old URL']);
    assert.equal(row['New URL'].startsWith('/'), true, row['Old URL'] + ' -> ' + row['New URL']);
    assert.equal(row['New URL'].startsWith('//'), false, row['New URL']);
}

const bySource = new Map(redirects.map((row) => [row['Old URL'], row['New URL']]));
const countyFromDashboard = DASHBOARD_URL_REDIRECTS.filter((row) => row.from.endsWith('-county'));
assert.equal(countyFromDashboard.length, EXPECTED_COUNTY_SUFFIX);

for (const slug of FLORIDA_COUNTY_SLUGS) {
    const from = '/bail-bonds/' + slug + '-county';
    const to = '/florida-bail-bonds/' + slug;
    const dashboard = DASHBOARD_URL_REDIRECTS.find((row) => row.from === from);
    assert.ok(dashboard, from);
    assert.equal(dashboard.to, to);
    assert.equal(dashboard.status, 301);
    assert.equal(bySource.get(from), to);
}

const suffixSources = sources.filter((source) => /^\/bail-bonds\/[a-z-]+-county$/.test(source));
assert.equal(suffixSources.length, EXPECTED_COUNTY_SUFFIX);

const mapByPath = new Map(urlMap.map((row) => [pathOf(row.old_url), row]));
assert.equal(mapByPath.size, urlMap.length, 'duplicate URL map source');

const mapRedirects = urlMap.filter((row) => row.action === '301');
assert.equal(mapRedirects.length, EXPECTED_REDIRECT_ROWS);
for (const row of mapRedirects) {
    const target = pathOf(row.studio_url);
    assert.equal(target.startsWith('/'), true, row.old_url + ' -> ' + row.studio_url);
    assert.equal(bySource.get(pathOf(row.old_url)), target);
}
for (const [source, target] of bySource) {
    const row = mapByPath.get(source);
    assert.ok(row, 'URL map missing ' + source);
    assert.equal(row.action, '301');
    assert.equal(pathOf(row.studio_url), target);
}

for (const slug of FLORIDA_COUNTY_SLUGS) {
    const row = mapByPath.get('/bail-bonds/' + slug + '-county');
    assert.equal(row.reason, COUNTY_REASON);
    assert.equal(row.protected, 'y');
    assert.equal(row.clicks, '0');
    assert.equal(row.impressions, '0');
}

assert.equal(bySource.get('/how-to-become-a-bondsman'), '/bail-school#become-a-bondsman');
assert.equal(bySource.get('/become-a-bondsman'), '/bail-school#become-a-bondsman');
assert.match(mapByPath.get('/how-to-become-a-bondsman').reason, /FALLBACK: use \/bail-school if Wix Redirect Manager rejects the fragment\./);
assert.match(mapByPath.get('/become-a-bondsman').reason, /FALLBACK: use \/bail-school if Wix Redirect Manager rejects the fragment\./);

assert.equal(bySource.get('/home'), '/');
assert.equal(bySource.get('/portal-staff'), '/portal-landing');
assert.equal(bySource.get('/faq'), '/how-bail-works');
assert.ok(mapByPath.get('/home').reason.includes(PUBLISH_NOTE));
assert.ok(mapByPath.get('/portal-staff').reason.includes(PUBLISH_NOTE));
assert.equal(mapByPath.get('/faq').reason, 'Existing Wix redirect (REDIRECTOR)');
assert.equal(mapByPath.get('/faq').studio_url, HOST + '/how-bail-works');

assert.equal(bySource.get('/my-orders'), '/myorders');
assert.ok(mapByPath.get('/my-orders').reason.includes('Unmapped target to verify'));
assert.ok(mapByPath.get('/my-orders').reason.includes(MY_ORDERS_NOTE));

const unchanged = {
    '/espanol': {
        studio_url: 'TODO-VERIFY (/ or dedicated Spanish landing page)',
        action: 'TODO-VERIFY',
        reason: 'Awaiting Brendan decision: redirect to homepage vs Spanish landing'
    },
    '/spanish': {
        studio_url: 'TODO-VERIFY (/ or dedicated Spanish landing page)',
        action: 'TODO-VERIFY',
        reason: 'Awaiting Brendan decision: redirect to homepage vs Spanish landing'
    },
    '/make-a-payment': {
        studio_url: 'TODO-VERIFY (SwipeSimple external payment link or /portal-indemnitor)',
        action: 'TODO-VERIFY',
        reason: 'Awaiting Brendan decision: direct SwipeSimple link vs portal payment'
    },
    '/payment': {
        studio_url: 'TODO-VERIFY (SwipeSimple external payment link or /portal-indemnitor)',
        action: 'TODO-VERIFY',
        reason: 'Awaiting Brendan decision: direct SwipeSimple link vs portal payment'
    }
};
for (const [path, expected] of Object.entries(unchanged)) {
    const row = mapByPath.get(path);
    assert.equal(row.studio_url, expected.studio_url);
    assert.equal(row.action, expected.action);
    assert.equal(row.reason, expected.reason);
    assert.equal(bySource.has(path), false, path + ' must stay out of the Wix import');
}

const doc = readFileSync(join(root, 'docs/STUDIO_CUTOVER.md'), 'utf8');
assert.ok(doc.includes(EXPECTED_REDIRECT_ROWS + ' redirect rows'));
assert.ok(doc.includes(EXPECTED_URL_MAP_ROWS + ' URL map rows'));
assert.ok(doc.includes(PUBLISH_NOTE));
assert.ok(doc.includes(FRAGMENT_FALLBACK));
assert.ok(doc.includes('unmapped target to verify'));

const generator = readFileSync(join(root, 'scripts/seo/generate_url_map_and_redirects.py'), 'utf8');
assert.ok(generator.includes(COUNTY_REASON));
assert.ok(generator.includes(PUBLISH_NOTE));
assert.ok(generator.includes(FRAGMENT_FALLBACK));
assert.ok(generator.includes(MY_ORDERS_NOTE));
assert.match(generator, /\/bail-bonds\/" \+ slug \+ "-county"/);

console.log('studio cutover redirects ok (' + redirects.length + ' import rows, ' + urlMap.length + ' url-map rows)');
