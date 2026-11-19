/**
 * Runs the real First Appearance page code (src/pages/First Appearance.eo050.js)
 * under Node with stubbed Wix modules and an injected own-content map.
 * Used by test_fa_enable_county.mjs; no network, no Wix calls.
 *
 * runFaPage(ownContent, pathSegments, { hasContentElement }) waits for the
 * promises $w.onReady returns (what Wix SSR waits for) and returns the
 * wix-seo calls plus what landed in #faCountyHeading / #faCountyContent.
 */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pageSrc = readFileSync(join(root, 'src/pages/First Appearance.eo050.js'), 'utf8');
const seoModule = pathToFileURL(join(root, 'src/public/first-appearance-seo.js')).href;
const tmp = mkdtempSync(join(tmpdir(), 'fa-enable-'));

// Studio placeholders: theme classes the page code copies onto its HTML.
export const STUDIO_BODY_HTML = '<p class="font_8 wixui-rich-text__text">County text</p>';
export const STUDIO_HEADING_HTML = '<h2 class="font_2 wixui-rich-text__text">County heading</h2>';

let variant = 0;
function loadPage(ownContent) {
    variant += 1;
    const wrapper = join(tmp, `fa-seo-${variant}.mjs`);
    writeFileSync(wrapper, `import * as real from ${JSON.stringify(seoModule)};
const OWN = ${JSON.stringify(ownContent)};
export const resolveFirstAppearancePath = (s) => real.resolveFirstAppearancePath(s, OWN);
export const getFaCountyContent = (slug) => real.getFaCountyContent(slug, OWN);
export const faMarkdownToHtml = real.faMarkdownToHtml;
export const buildFirstAppearanceSeo = real.buildFirstAppearanceSeo;
`);
    const src = pageSrc
        .replace("import wixSeo from 'wix-seo';", 'const wixSeo = globalThis.__fa.wixSeo;')
        .replace("import wixWindow from 'wix-window';", 'const wixWindow = globalThis.__fa.wixWindow;')
        .replace("import wixLocation from 'wix-location';", 'const wixLocation = globalThis.__fa.wixLocation;')
        .replace("import { buildPaperworkLaunchpadUrl } from 'public/portal-config';", 'const buildPaperworkLaunchpadUrl = () => "";')
        .replace("from 'public/first-appearance-seo';", `from ${JSON.stringify(pathToFileURL(wrapper).href)};`)
        .replace(/import \{\s*getFirstAppearanceSchedules,\s*trackFirstAppearanceAction,\s*trackFirstAppearancePageView\s*\} from 'backend\/first-appearance-api';/,
            'const { getFirstAppearanceSchedules, trackFirstAppearanceAction, trackFirstAppearancePageView } = globalThis.__fa.api;');
    assert.equal(/^import .* from '(wix-|backend\/|public\/)/m.test(src), false, 'all Wix imports stubbed');
    const file = join(tmp, `page-${variant}.mjs`);
    writeFileSync(file, src);
    return file;
}

export async function runFaPage(ownContent, path, { hasContentElement = true } = {}) {
    const calls = { links: null, metaTags: null, title: null, structured: 0 };
    const elements = {};
    const handlers = [];
    const mk = (id, html) => (elements[id] = elements[id] || {
        id, html, text: '', expanded: false, expand() { this.expanded = true; }
    });
    globalThis.$w = (sel) => {
        if (sel === '#faCountyContent' || sel === '#faCountyHeading') {
            if (!hasContentElement) throw new Error(`no element ${sel}`);
            return mk(sel.slice(1), sel === '#faCountyContent' ? STUDIO_BODY_HTML : STUDIO_HEADING_HTML);
        }
        throw new Error(`no element ${sel}`);
    };
    globalThis.$w.onReady = (fn) => { handlers.push(fn); };
    globalThis.__fa = {
        wixSeo: {
            setLinks: async (l) => { calls.links = l; },
            setMetaTags: async (t) => { calls.metaTags = t; },
            setTitle: async (t) => { calls.title = t; },
            setStructuredData: async () => { calls.structured += 1; }
        },
        wixWindow: { rendering: { env: 'backend' } },
        wixLocation: { path, query: {} },
        api: {
            getFirstAppearanceSchedules: async () => ({ success: false, counties: [] }),
            trackFirstAppearanceAction: async () => {},
            trackFirstAppearancePageView: async () => {}
        }
    };
    const log = console.log, warn = console.warn;
    if (!process.env.FA_DEBUG) { console.log = () => {}; console.warn = () => {}; }
    try {
        await import(pathToFileURL(loadPage(ownContent)).href);
        assert.ok(handlers.length >= 1, 'page registers $w.onReady');
        const rets = handlers.map((fn) => fn());
        assert.ok(rets[0] && typeof rets[0].then === 'function', 'SEO onReady returns a promise for SSR');
        await Promise.all(rets);
    } finally {
        console.log = log; console.warn = warn;
    }
    const tag = (k, v) => (calls.metaTags || []).find((t) => t[k] === v);
    const body = elements.faCountyContent;
    const heading = elements.faCountyHeading;
    return {
        canonical: calls.links ? calls.links[0].href : '(Studio panel default)',
        robots: tag('name', 'robots') ? tag('name', 'robots').content : '(not set)',
        title: calls.title || '(Studio panel)',
        description: tag('name', 'description') ? tag('name', 'description').content : '(Studio panel)',
        ogUrl: tag('property', 'og:url') ? tag('property', 'og:url').content : '',
        headingText: heading && heading.text ? heading.text : '',
        contentHtml: body && body.html !== STUDIO_BODY_HTML ? body.html : '',
        structured: calls.structured
    };
}
