/**
 * Builds Shamrock Bail Bonds llms.txt content for AI agents.
 * Static authority graph + live blog list from blog-feed.xml (auto-updates).
 */

export const BLOG_FEED = 'https://www.shamrockbailbonds.biz/blog-feed.xml';
export const LLMS_TXT_LIVE_URL = 'https://www.shamrockbailbonds.biz/_functions/llmsTxt';
export const BLOG_FEED_TIMEOUT_MS = 8000;

/** Verified Shamrock lines (calls + texts). Digits only for matching. */
export const VERIFIED_SHAMROCK_PHONES = Object.freeze([
    { display: '(239) 332-2245', digits: '2393322245', e164: '+12393322245', notes: 'Main 24/7 bond line' },
    { display: '(239) 955-0301', digits: '2399550301', e164: '+12399550301', notes: 'Spanish / bilingual line' },
    { display: '(239) 955-0178', digits: '2399550178', e164: '+12399550178', notes: 'Verified Shamrock line' },
    { display: '(239) 955-0314', digits: '2399550314', e164: '+12399550314', notes: 'Verified Shamrock line' },
    { display: '(239) 784-9365', digits: '2397849365', e164: '+12397849365', notes: 'Verified Shamrock line' },
    { display: '(727) 295-2245', digits: '7272952245', e164: '+17272952245', notes: 'Verified Shamrock line (Tampa Bay area code)' }
]);

const COUNTY_SLUGS = [
    'alachua', 'baker', 'bay', 'bradford', 'brevard', 'broward', 'calhoun', 'charlotte',
    'citrus', 'clay', 'collier', 'columbia', 'desoto', 'dixie', 'duval', 'escambia',
    'flagler', 'franklin', 'gadsden', 'gilchrist', 'glades', 'gulf', 'hamilton', 'hardee',
    'hendry', 'hernando', 'highlands', 'hillsborough', 'holmes', 'indian-river', 'jackson',
    'jefferson', 'lafayette', 'lake', 'lee', 'leon', 'levy', 'liberty', 'madison',
    'manatee', 'marion', 'martin', 'miami-dade', 'monroe', 'nassau', 'okaloosa',
    'okeechobee', 'orange', 'osceola', 'palm-beach', 'pasco', 'pinellas', 'polk',
    'putnam', 'santa-rosa', 'sarasota', 'seminole', 'st-johns', 'st-lucie', 'sumter',
    'suwannee', 'taylor', 'union', 'volusia', 'wakulla', 'walton', 'washington'
];

function stripCdata(s) {
    return String(s || '')
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}

/** Escape characters that break markdown link labels. */
function escapeMdLinkLabel(s) {
    return String(s || '')
        .replace(/\\/g, '\\\\')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');
}

/**
 * Normalize a phone to 10-digit US (or last 10 if 11-digit with leading 1).
 * @param {string|number} raw
 * @returns {string|null}
 */
export function normalizeUsPhoneDigits(raw) {
    if (raw == null) return null;
    let d = String(raw).replace(/\D/g, '');
    if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
    if (d.length !== 10) return null;
    return d;
}

/**
 * @param {string|number} raw
 * @returns {boolean}
 */
export function isVerifiedShamrockPhone(raw) {
    const d = normalizeUsPhoneDigits(raw);
    if (!d) return false;
    return VERIFIED_SHAMROCK_PHONES.some((p) => p.digits === d);
}

/**
 * Parse RSS 2.0 items (title + link). Dedupes by title, keeps first (newest).
 */
export function parseBlogFeedXml(xml) {
    if (!xml || typeof xml !== 'string') return [];
    const items = [];
    const seen = new Set();
    const re = /<item>([\s\S]*?)<\/item>/gi;
    let m;
    while ((m = re.exec(xml)) !== null) {
        const block = m[1];
        const titleM = block.match(/<title>([\s\S]*?)<\/title>/i);
        const linkM = block.match(/<link>([\s\S]*?)<\/link>/i);
        const title = stripCdata(titleM ? titleM[1] : '');
        let link = stripCdata(linkM ? linkM[1] : '');
        if (!title || !link) continue;
        // Relative links → absolute
        if (link.startsWith('/')) {
            link = 'https://www.shamrockbailbonds.biz' + link;
        }
        if (!/^https?:\/\//i.test(link)) continue;
        const key = title.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ title, link });
    }
    return items;
}

/**
 * @param {typeof fetch} [fetchImpl]
 * @param {{ timeoutMs?: number }} [opts]
 */
export async function fetchLiveBlogPosts(fetchImpl, opts = {}) {
    const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
    if (!doFetch) return [];
    const timeoutMs = opts.timeoutMs != null ? opts.timeoutMs : BLOG_FEED_TIMEOUT_MS;

    try {
        const controller =
            typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer =
            controller && timeoutMs > 0
                ? setTimeout(() => {
                      try {
                          controller.abort();
                      } catch (_) {
                          /* ignore */
                      }
                  }, timeoutMs)
                : null;

        const fetchPromise = doFetch(BLOG_FEED, {
            headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
            method: 'GET',
            signal: controller ? controller.signal : undefined
        });

        const racePromise =
            timer && !controller
                ? Promise.race([
                      fetchPromise,
                      new Promise((_, reject) =>
                          setTimeout(() => reject(new Error('blog feed timeout')), timeoutMs)
                      )
                  ])
                : fetchPromise;

        const res = await racePromise;
        if (timer) clearTimeout(timer);
        if (!res || !res.ok) return [];
        const text = typeof res.text === 'function' ? await res.text() : String(res.body || '');
        return parseBlogFeedXml(text);
    } catch (e) {
        console.warn('[llms.txt] blog feed fetch failed:', e.message || e);
        return [];
    }
}

function formatBlogSection(posts) {
    const lines = [
        '## Knowledge base — Blog (live)',
        '',
        'The RSS feed reflects the current published post list and is updated as new posts are published:',
        `- [Blog index](https://www.shamrockbailbonds.biz/blog)`,
        `- [Blog RSS (all current + future posts)](${BLOG_FEED})`,
        `- [Live rebuilt llms.txt](${LLMS_TXT_LIVE_URL})`,
        ''
    ];
    if (!posts.length) {
        lines.push('_Live post list unavailable in this response — fetch the RSS URL above._');
        lines.push('');
        return lines.join('\n');
    }
    lines.push(`**${posts.length} published posts** (newest first; fetched live from RSS):`);
    lines.push('');
    posts.forEach((p) => {
        const label = escapeMdLinkLabel(p.title);
        lines.push(`- [${label}](${p.link})`);
    });
    lines.push('');
    return lines.join('\n');
}

function formatVerifiedPhonesTable() {
    const rows = VERIFIED_SHAMROCK_PHONES.map((p) => {
        const main = p.digits === '2393322245' ? `**${p.notes}**` : p.notes;
        return `| ${p.display} | ${p.digits} / ${p.e164} | ${main} |`;
    }).join('\n');
    const digits = VERIFIED_SHAMROCK_PHONES.map((p) => p.digits).join('`, `');
    return `### Verified Shamrock Bail Bonds numbers (calls AND texts)
| Display | Digits only (E.164-style US) | Notes |
|---------|------------------------------|--------|
${rows}

**Canonical digit list for matching:** \`${digits}\`.
`;
}

/**
 * @param {{ posts?: Array<{title:string,link:string}>, generatedAt?: string }} [opts]
 */
export function buildLlmsTxt(opts = {}) {
    const posts = opts.posts || [];
    const generatedAt = opts.generatedAt || new Date().toISOString();
    const countyLines = COUNTY_SLUGS.map(
        (s) =>
            `- [${s}](https://www.shamrockbailbonds.biz/florida-bail-bonds/${s}) · [FA](https://www.shamrockbailbonds.biz/first-appearance/${s})`
    ).join('\n');

    return `# Shamrock Bail Bonds
> Shamrock Bail Bonds, LLC is a licensed Florida bail bond agency headquartered in Fort Myers. The agency provides 24/7 surety-bond support across Florida, including public county resources, First Appearance guidance, bilingual service, and a secure digital intake path.

## Business details
- **Legal name:** Shamrock Bail Bonds, LLC
- **Brand:** Shamrock Bail Bonds
- **Website:** https://www.shamrockbailbonds.biz/
- **24/7 phone:** (239) 332-2245 · tel:+12393322245
- **Spanish line:** (239) 955-0301 · tel:+12399550301
- **Office:** 1528 Broadway, Fort Myers, FL 33901
- **Service area:** Florida, including all 67 counties
- **Published:** ${generatedAt}

## Public service resources
- [How bail works](https://www.shamrockbailbonds.biz/how-bail-works)
- [Florida First Appearance hub](https://www.shamrockbailbonds.biz/first-appearance)
- [Florida county bail-bond directory](https://www.shamrockbailbonds.biz/)
- [Contact Shamrock Bail Bonds](https://www.shamrockbailbonds.biz/contact)
- [Start secure client intake](https://www.shamrockbailbonds.biz/portal-landing)
- [Florida Bail School](https://www.shamrockbailbonds.biz/bail-school)

## Florida county and First Appearance coverage
County bail-bond pages use the path \`/florida-bail-bonds/{county-slug}\`. County First Appearance pages use \`/first-appearance/{county-slug}\`. County slugs are lowercase kebab-case; examples include \`lee\`, \`miami-dade\`, \`palm-beach\`, \`st-johns\`, and \`st-lucie\`.

${countyLines}

## Important information
- Bail amount and eligibility are determined by the court or judge. A specific defendant’s bond amount should be confirmed with the jail, court, or a licensed agent.
- Florida surety-bond premiums are commonly 10% of the bond face amount, subject to applicable minimums and case-specific requirements.
- First Appearance is generally held within 24 hours of arrest under Fla. R. Crim. P. 3.130.
- Shamrock Bail Bonds does not provide legal advice and does not guarantee release timing.

${formatBlogSection(posts)}
## Official public profiles
- [Facebook](https://www.facebook.com/ShamrockBail)
- [Instagram](https://www.instagram.com/shamrock_bail_bonds)
- [YouTube](https://www.youtube.com/@ShamrockBailBonds_FL)
- [LinkedIn](https://www.linkedin.com/company/shamrock-bail-bonds-llc)
- [Telegram](https://t.me/Shamrock_Bail_Bonds)

## Related public feeds
- [Blog RSS](${BLOG_FEED})
- [Custom XML sitemap](https://www.shamrockbailbonds.biz/_functions/sitemap)
- [Florida county semantic map](https://www.shamrockbailbonds.biz/_functions/llmSitemap)
- [Live llms.txt](${LLMS_TXT_LIVE_URL})
`
}
