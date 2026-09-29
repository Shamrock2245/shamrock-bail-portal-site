/**
 * Primary H1 for city landings on the Florida county template.
 * Pattern (Brendan-approved): "{City} Bail Bonds ({County} County)".
 * Jail and county pages keep their existing headlines.
 *
 * CMS field used by SSR:
 * Florida Counties display field is `h1Headline` (the Editor item title).
 * `title` is the same hero string when records are synced from local-landings.
 * `countyName` is only the short place label ("Fort Myers"). The live hero
 * Rich Text `#comp-mkzw2dj2` is what Bingbot reads, and it currently renders
 * that short label. Do not treat `countyName` as the H1.
 */

/**
 * @param {string} cityName
 * @param {string} countyName County name with or without a trailing " County"
 * @returns {string} Empty when either name is missing
 */
export function formatCityHeroHeadline(cityName, countyName) {
    const city = String(cityName || '').trim();
    const county = String(countyName || '').replace(/\s+County$/i, '').trim();
    if (!city || !county) return '';
    return `${city} Bail Bonds (${county} County)`;
}

/**
 * Visible hero H1. City landings always use the city pattern, even when
 * CMS `h1Headline` still has the older "24/7 Fast Release" string.
 * County and jail landings return the generated/CMS headline unchanged.
 * @param {object} county Page payload from generateCountyPage
 * @returns {string}
 */
export function resolvePrimaryHeroH1(county) {
    if (!county) return '';
    if (county.landing_type === 'city') {
        const cityH1 = formatCityHeroHeadline(
            county.display_name || county.county_name,
            county.parent_county_name
        );
        if (cityH1) return cityH1;
    }
    const fromContent = county.content && county.content.hero_headline;
    if (fromContent) return fromContent;
    const label = county.county_name_full || county.county_name || '';
    return label ? `${label} Bail Bonds — 24/7 Fast Release` : '';
}

const CITY_H1_PATTERN = /^.+ Bail Bonds \(.+ County\)$/;

/**
 * Headline already stored on the dynamic-page dataset item.
 * Prefer `h1Headline` (collection display field / Editor item title), then
 * `title`. Never `countyName`.
 * @param {object} item Wix dataset current item
 * @returns {string}
 */
export function heroH1FromCmsItem(item) {
    if (!item || typeof item !== 'object') return '';
    const h1 = String(item.h1Headline || '').trim();
    const title = String(item.title || '').trim();
    if (CITY_H1_PATTERN.test(h1)) return h1;
    if (CITY_H1_PATTERN.test(title)) return title;
    if (/bail bonds/i.test(h1)) return h1;
    if (/bail bonds/i.test(title)) return title;
    return '';
}

/**
 * Replace the visible text of the first <h1> and keep its Editor markup
 * (font, letter-spacing, color spans).
 * @param {string} html
 * @param {string} headline
 * @returns {string} Empty when `html` has no h1
 */
export function rewriteRichTextH1Html(html, headline) {
    const text = String(headline || '').trim();
    const source = String(html || '');
    if (!text || !/<h1\b/i.test(source)) return '';
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    let replaced = false;
    return source.replace(/(<h1\b[^>]*>)([\s\S]*?)(<\/h1>)/i, (match, open, inner, close) => {
        const innerNext = inner.replace(/>([^<]*)</g, (full, nodeText) => {
            if (!String(nodeText).trim()) return full;
            if (replaced) return '><';
            replaced = true;
            return '>' + escaped + '<';
        });
        if (!replaced) {
            replaced = true;
            return open + escaped + close;
        }
        return open + innerNext + close;
    });
}
