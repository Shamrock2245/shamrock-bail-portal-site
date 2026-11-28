/**
 * First Appearance URL rules shared by page code, the router and the custom sitemap.
 *
 * Indexing audit, 2026-11-19: all 67 /first-appearance/<county> URLs served
 * the same text as the /first-appearance hub, and any slug returned 200.
 *
 * Until a county has its own content:
 *   - /first-appearance/<county> canonicals to /first-appearance.
 *   - It is left out of every sitemap.
 * Unknown slugs are noindex with a hub canonical in page code. The router
 * (if a router prefix is registered in Studio) returns a real 404.
 *
 * Per-county switch: when Writer's content for a county is ready, add it to
 * FA_OWN_CONTENT_COUNTIES as { lastmod, heading, body }. That county then:
 *   - keeps robots "index, follow" (never noindex),
 *   - self-canonicals to https://www.shamrockbailbonds.biz/first-appearance/<slug>,
 *   - rejoins /_functions/sitemap with lastmod as its <lastmod>.
 * The router is not active on the Studio site (Wix rejected the
 * "first-appearance" prefix), so page code applies all of this. The static
 * page shows the county text only if the Studio page has a text element
 * with ID faCountyContent (and optionally faCountyHeading). If that element
 * is missing, page code falls back to the hub canonical.
 *
 * Pure module: no Wix imports, so Node tests can load it.
 */

export const FA_SITE_URL = 'https://www.shamrockbailbonds.biz';
export const FA_HUB_PATH = '/first-appearance';

/**
 * Date the hub content last changed, as YYYY-MM-DD, for sitemap lastmod.
 * Empty means lastmod is omitted. Set it only from a real content edit.
 */
export const FA_HUB_LASTMOD = '';

export const FA_COUNTY_SLUGS = Object.freeze([
    'alachua', 'baker', 'bay', 'bradford', 'brevard', 'broward', 'calhoun', 'charlotte',
    'citrus', 'clay', 'collier', 'columbia', 'desoto', 'dixie', 'duval', 'escambia',
    'flagler', 'franklin', 'gadsden', 'gilchrist', 'glades', 'gulf', 'hamilton', 'hardee',
    'hendry', 'hernando', 'highlands', 'hillsborough', 'holmes', 'indian-river', 'jackson',
    'jefferson', 'lafayette', 'lake', 'lee', 'leon', 'levy', 'liberty', 'madison',
    'manatee', 'marion', 'martin', 'miami-dade', 'monroe', 'nassau', 'okaloosa',
    'okeechobee', 'orange', 'osceola', 'palm-beach', 'pasco', 'pinellas', 'polk',
    'putnam', 'santa-rosa', 'sarasota', 'seminole', 'st-johns', 'st-lucie', 'sumter',
    'suwannee', 'taylor', 'union', 'volusia', 'wakulla', 'walton', 'washington'
]);

/**
 * Counties whose /first-appearance/<slug> page has its own content.
 * Shape:
 *   '<slug>': {
 *     lastmod: 'YYYY-MM-DD',   // date this county content went live (sitemap lastmod)
 *     body: '...',             // required, Writer's markdown (safe subset, see faMarkdownToHtml)
 *     h1: '...',               // optional, county H1 text for #faCountyHeading
 *                              //   (an H2-styled Studio element, not a true <h1>)
 *     heading: '...',          // optional, older name for h1
 *     seoTitle: '...',         // optional, <title> (max 60); generic title if missing
 *     metaDescription: '...'   // optional, meta description (max 160); generic if missing
 *   }
 * An entry only turns on when validateFaCountyEntry() passes.
 * Empty until Writer's county content is ready and reviewed.
 */
export const FA_OWN_CONTENT_COUNTIES = Object.freeze({});

// ─── Copy rules for county entries ───────────────────────────────────────────

export const FA_HOURS_LINE = 'Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7';

const BANNED_RULES = [
    { rule: 'banned number 239-955-0301', re: /955[\s.\-)]*0301/ },
    { rule: "banned claim 'free'", re: /\bfree\b/i },
    { rule: "banned claim 'best'", re: /\bbest\b/i },
    { rule: 'banned guarantee claim', re: /\bguarantee/i },
    { rule: 'banned speed/release-time wording', re: /\b(fast|faster|fastest|quick|quickly|quicker|speed|speedy|rapid|instant|instantly|minutes?)\b/i },
    { rule: 'editor note [VERIFY ...] left in copy', re: /\[\s*VERIFY\b[^\]]*\]/i }
];

// Office-hours statements. 24/7 availability wording ("Available 24/7",
// "Phones answered 24/7") is allowed anywhere; only a statement of office or
// walk-in hours that is not the exact FA_HOURS_LINE is blocked.
const OFFICE_HOURS_RES = [
    /\b(walk-in|walk in|office|business) hours\b\s*(are|is|:|-|–)?\s*[^.\n]{0,30}?(\d|\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\b)/gi,
    /\bMon(day)?\s*[–-]\s*Fri(day)?\s*,?\s*\d/gi,
    /(?<![\d\-–])9\s*(a\.?m\.?)?\s*(–|-|to)\s*5(?![\d,])/gi
];

// Brendan 2026-10-30 instruction: Lee intro/service-area copy says arrestees are
// booked at the Lee County Jail Downtown facility on Dr. Martin Luther King Jr.
// Blvd., with no Core mention (replaces the earlier "Downtown Jail and Core"
// wording). Naming Core / Ortiz Ave as a booking or holding facility is blocked;
// not naming the Downtown address is only a warning.
const LEE_DOWNTOWN_RE = /2115 Dr\.? (Martin Luther King Jr\.|MLK Jr\.) Blvd/i;
const LEE_CORE_AS_FACILITY_RES = [
    /\b(book(ed|ing)|hold(s|ing)?|held|housed|which facility|which jail|taken to)\b[^?\n]{0,120}?(\bOrtiz\b|\bCore\b)/gi,
    /(\bOrtiz\b|\bCore\b)[^?\n]{0,80}?\b(book(ed|ing)|hold(s|ing)?|held|housed)\b/gi
];

function entryTextFields(e) {
    return [
        ['body', String(e.body || '')],
        ['h1', String(e.h1 || e.heading || '')],
        ['seoTitle', String(e.seoTitle || '')],
        ['metaDescription', String(e.metaDescription || '')]
    ];
}

/**
 * Copy-rule check for an enable entry. Returns { ok, errors: [{ rule, field, match }] }.
 * getFaCountyContent() refuses any entry that fails, so a bad entry can
 * never self-canonical, show on the page or join the sitemap.
 */
export function validateFaCountyEntry(slug, entry) {
    const errors = [];
    const warnings = [];
    const e = entry && typeof entry === 'object' ? entry : {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.lastmod || ''))) errors.push({ rule: 'lastmod must be YYYY-MM-DD', field: 'lastmod', match: String(e.lastmod || '') });
    if (!String(e.body || '').trim()) errors.push({ rule: 'body is required', field: 'body', match: '' });
    if (e.seoTitle && String(e.seoTitle).length > 60) errors.push({ rule: 'seoTitle over 60 chars', field: 'seoTitle', match: String(e.seoTitle) });
    if (e.metaDescription && String(e.metaDescription).length > 160) errors.push({ rule: 'metaDescription over 160 chars', field: 'metaDescription', match: String(e.metaDescription) });

    const scan = (field, text, re, rule) => {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
            errors.push({ rule, field, match: snippet(text, m.index, m[0].length) });
            if (!re.global) break;
        }
    };
    for (const [field, text] of entryTextFields(e)) {
        if (!text) continue;
        for (const { rule, re } of BANNED_RULES) {
            const m = text.match(re);
            if (m) errors.push({ rule, field, match: snippet(text, m.index, m[0].length) });
        }
        const rest = text.split(FA_HOURS_LINE).join(' ');
        for (const re of OFFICE_HOURS_RES) scan(field, rest, re, `office hours must be stated exactly as "${FA_HOURS_LINE}"`);
        if (slug === 'lee') {
            const before = errors.length;
            for (const re of LEE_CORE_AS_FACILITY_RES) scan(field, text, re, 'Lee: Core / Ortiz Ave named as a booking or holding facility (Brendan 2026-10-30: booked at the Downtown facility, no Core mention)');
            // the two Lee patterns can hit the same sentence; keep one per snippet
            const seen = new Set();
            for (let i = errors.length - 1; i >= before; i--) {
                const k = errors[i].match.slice(0, 60);
                if (seen.has(k)) errors.splice(i, 1); else seen.add(k);
            }
        }
    }
    if (slug === 'lee' && !LEE_DOWNTOWN_RE.test(String(e.body || ''))) {
        warnings.push({ rule: 'Lee body does not name the Downtown jail, 2115 Dr. Martin Luther King Jr. Blvd. (Brendan 2026-10-30)', field: 'body', match: '' });
    }
    return { ok: errors.length === 0, errors, warnings };
}

function snippet(text, index, len) {
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + len + 50);
    return (start > 0 ? '…' : '') + text.slice(start, end).replace(/\s+/g, ' ').trim() + (end < text.length ? '…' : '');
}

/** Minimum body heading sizes inside #faCountyContent on mobile. */
export const FA_MOBILE_HEADING_PX = Object.freeze({ h2: 24, h3: 20 });

// ─── Safe markdown → Wix Text .html ──────────────────────────────────────────

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const INTERNAL_LINK_RE = /^https:\/\/(www\.)?shamrockbailbonds\.biz(\/[A-Za-z0-9\-._~/%#?=&]*)?$/;

/** Remove [VERIFY ...] and any other [bracketed editor note] (keeps [text](url) links). */
export function stripEditorNotes(md) {
    return String(md || '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\[[^\]\n]*\](?!\()/g, '')
        .replace(/[ \t]+([.,;:])/g, '$1')
        .replace(/[ \t]{2,}/g, ' ');
}

function inlineMd(text) {
    // Pull out links first so their URLs are never touched by other rules.
    const links = [];
    let t = String(text).replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
        links.push({ label, url });
        return `\u0000${links.length - 1}\u0000`;
    });
    t = escapeHtml(t).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*/g, '');
    return t.replace(/\u0000(\d+)\u0000/g, (_, i) => {
        const { label, url } = links[Number(i)];
        const safeLabel = escapeHtml(label).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*/g, '');
        if (!INTERNAL_LINK_RE.test(url)) return safeLabel; // external: text only
        return `<a href="${escapeHtml(url)}">${safeLabel}</a>`;
    });
}

/**
 * Convert Writer's markdown (safe subset) to HTML for a Wix Text element's .html.
 * Supported: paragraphs, ## / ### headings (h2/h3), **bold**, - and 1. lists,
 * [text](https://www.shamrockbailbonds.biz/...) links. A "# " H1 line is dropped
 * (the H1 text goes to #faCountyHeading). Tables become simple lists. Everything
 * else is escaped. Editor notes in [brackets] are removed first.
 *
 * opts.pClass / opts.hClass: Studio theme classes copied from the element's
 * own placeholder so the text keeps the page's body and H2 styles.
 * opts.h2Px / opts.h3Px: optional font size for body h2/h3, written the way the
 * Wix rich-text editor writes it (<h2 class><span style="font-size:24px">).
 * Page code passes 24/20 on mobile (FA_MOBILE_HEADING_PX).
 */
export function faMarkdownToHtml(md, opts) {
    const o = opts || {};
    const cls = (c) => (c && /^[A-Za-z0-9_\- ]+$/.test(c) ? ` class="${c}"` : '');
    const P = cls(o.pClass), H = cls(o.hClass), H3 = cls(o.h3Class || o.hClass);
    const px = (n) => (Number.isFinite(n) && n >= 10 && n <= 72 ? Math.round(n) : 0);
    const sized = (html, n) => (px(n) ? `<span style="font-size:${px(n)}px;">${html}</span>` : html);
    const lines = stripEditorNotes(md).replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let i = 0;
    const isBlockStart = (l) => /^(#{1,6} |\||\s*[-*] |\s*\d+\. )/.test(l);
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }
        let m;
        if ((m = line.match(/^(#{1,6}) +(.+)$/))) {
            const level = m[1].length;
            if (level === 2) out.push(`<h2${H}>${sized(inlineMd(m[2].trim()), o.h2Px)}</h2>`);
            else if (level >= 3) out.push(`<h3${H3}>${sized(inlineMd(m[2].trim()), o.h3Px)}</h3>`);
            i++;
            continue;
        }
        if (line.trim().startsWith('|')) {
            const rows = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++; }
            const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
            const body = rows.filter((r, idx) => idx !== 0 && !/^\|?[\s:\-|]+\|?$/.test(r));
            const header = rows.length ? cells(rows[0]) : [];
            if (header.length) out.push(`<p${P}><strong>${inlineMd(header.join(' — '))}</strong></p>`);
            if (body.length) out.push('<ul>' + body.map((r) => `<li><p${P}>${inlineMd(cells(r).join(': '))}</p></li>`).join('') + '</ul>');
            continue;
        }
        if ((m = line.match(/^\s*([-*]|\d+\.) +/))) {
            const ordered = /\d/.test(m[1]);
            const items = [];
            while (i < lines.length && /^\s*([-*]|\d+\.) +/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*([-*]|\d+\.) +/, ''));
                i++;
            }
            const tag = ordered ? 'ol' : 'ul';
            out.push(`<${tag}>` + items.map((t) => `<li><p${P}>${inlineMd(t)}</p></li>`).join('') + `</${tag}>`);
            continue;
        }
        const para = [];
        while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) { para.push(lines[i].trim()); i++; }
        if (para.length) out.push(`<p${P}>${inlineMd(para.join(' '))}</p>`);
        else i++;
    }
    return out.join('\n');
}

/** Own-content entry for a slug, or null. Needs a valid lastmod, a body and a passing validation. */
export function getFaCountyContent(slug, ownContent = FA_OWN_CONTENT_COUNTIES) {
    const map = ownContent || {};
    if (!slug || !Object.prototype.hasOwnProperty.call(map, slug)) return null;
    const e = map[slug];
    if (!e || typeof e !== 'object') return null;
    if (!validateFaCountyEntry(slug, e).ok) return null;
    const h1 = String(e.h1 || e.heading || '').trim();
    return {
        lastmod: String(e.lastmod),
        h1,
        heading: h1,
        body: String(e.body).trim(),
        seoTitle: String(e.seoTitle || '').trim(),
        metaDescription: String(e.metaDescription || '').trim()
    };
}

export function faCountyName(slug) {
    return String(slug || '')
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

/** Lowercase, trim, drop a trailing "-county" / " county". */
export function normalizeFaSlug(raw) {
    return String(raw || '')
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
        .replace(/-county$/, '');
}

/** Match "palmbeach" or "stjohns" to the hyphenated county slug. */
function matchCompactSlug(slug) {
    const compact = slug.replace(/[^a-z]/g, '');
    return FA_COUNTY_SLUGS.find((s) => s.replace(/-/g, '') === compact) || '';
}

export function faHasOwnContent(slug, ownContent = FA_OWN_CONTENT_COUNTIES) {
    return getFaCountyContent(slug, ownContent) !== null;
}

/**
 * Classify the path segments after /first-appearance.
 *
 * Returns:
 *   kind:       'hub' | 'county' | 'unknown'
 *   slug:       canonical county slug ('' for hub/unknown)
 *   rawSlug:    first segment as requested
 *   canonical:  absolute canonical URL
 *   robots:     'index, follow' | 'noindex, follow'
 *   inSitemap:  boolean
 *   redirectTo: path for a 301 when the request is a variant of a known
 *               county (case, "-county", "palmbeach"); '' otherwise
 */
export function resolveFirstAppearancePath(segments, ownContent = FA_OWN_CONTENT_COUNTIES) {
    const segs = (Array.isArray(segments) ? segments : [segments])
        .map((s) => String(s == null ? '' : s).trim())
        .filter((s) => s && s !== 'first-appearance' && s !== 'first-appearance-hub');

    const hubUrl = FA_SITE_URL + FA_HUB_PATH;

    if (!segs.length) {
        return {
            kind: 'hub', slug: '', rawSlug: '', canonical: hubUrl,
            robots: 'index, follow', inSitemap: true, redirectTo: ''
        };
    }

    const rawSlug = segs[0];
    if (segs.length > 1) {
        return {
            kind: 'unknown', slug: '', rawSlug, canonical: hubUrl,
            robots: 'noindex, follow', inSitemap: false, redirectTo: ''
        };
    }

    const normalized = normalizeFaSlug(rawSlug);
    let slug = FA_COUNTY_SLUGS.indexOf(normalized) > -1 ? normalized : matchCompactSlug(normalized);

    if (!slug) {
        return {
            kind: 'unknown', slug: '', rawSlug, canonical: hubUrl,
            robots: 'noindex, follow', inSitemap: false, redirectTo: ''
        };
    }

    const own = faHasOwnContent(slug, ownContent);
    const countyPath = `${FA_HUB_PATH}/${slug}`;
    return {
        kind: 'county',
        slug,
        rawSlug,
        canonical: own ? FA_SITE_URL + countyPath : hubUrl,
        robots: 'index, follow',
        inSitemap: own,
        redirectTo: rawSlug === slug ? '' : countyPath
    };
}

/**
 * Sitemap entries for First Appearance: the hub plus counties that have
 * their own content. lastmod is a real content date, never "today".
 */
export function firstAppearanceSitemapEntries(ownContent = FA_OWN_CONTENT_COUNTIES) {
    const entries = [{ path: FA_HUB_PATH, lastmod: FA_HUB_LASTMOD, title: 'First Appearance Hearings in Florida' }];
    FA_COUNTY_SLUGS.forEach((slug) => {
        const content = getFaCountyContent(slug, ownContent);
        if (!content) return;
        entries.push({
            path: `${FA_HUB_PATH}/${slug}`,
            lastmod: content.lastmod,
            title: `First Appearance Hearing in ${faCountyName(slug)} County, FL`
        });
    });
    return entries;
}

/**
 * SEO tags page code sets on /first-appearance/<segment> URLs.
 * Returns null for the bare hub (the Studio SEO panel owns it).
 *
 * contentShown: whether page code actually put the county's own text on
 * the page. An enabled county whose text could not be shown falls back to
 * the hub canonical so a duplicate never self-canonicals.
 * content: getFaCountyContent() result; its seoTitle / metaDescription are
 * used for an enabled, shown county, with the generic text as fallback.
 */
export function buildFirstAppearanceSeo(route, contentShown, content) {
    if (!route || route.kind === 'hub') return null;
    const hubUrl = FA_SITE_URL + FA_HUB_PATH;
    if (route.kind === 'unknown') {
        return { canonical: hubUrl, robots: 'noindex, follow', title: '', description: '', selfCanonical: false };
    }
    const name = faCountyName(route.slug);
    const self = route.inSitemap && contentShown === true;
    const canonical = self ? FA_SITE_URL + `${FA_HUB_PATH}/${route.slug}` : hubUrl;
    const genericTitle = `First Appearance Hearing in ${name} County, FL | Shamrock Bail Bonds`;
    const genericDesc = `${name} County First Appearance court information. Call (239) 332-2245. ${FA_HOURS_LINE}.`;
    const c = self && content ? content : null;
    return {
        canonical,
        robots: 'index, follow',
        title: (c && c.seoTitle) || genericTitle,
        description: (c && c.metaDescription) || genericDesc,
        selfCanonical: self
    };
}
