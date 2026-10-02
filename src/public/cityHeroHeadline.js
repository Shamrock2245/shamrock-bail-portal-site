/**
 * Primary H1 for city landings on the Florida county template.
 * Pattern (Brendan-approved): "{City} Bail Bonds ({County} County)".
 * Jail and county pages keep their existing headlines.
 *
 * SSR field map (FloridaCounties / place landings) — confirmed 2026-09-29:
 *   - Live Bingbot H1 on /florida-bail-bonds/fort-myers is bare "Fort Myers"
 *     from Editor rich-text comp-mkzw2dj2 (dataset-bound published HTML).
 *   - That SSR text tracks the short CMS name (countyName / display name),
 *     NOT seoTitle (SSR <title> is already correct) and NOT the Velo-applied
 *     hero_headline / h1Headline pattern below.
 *   - Client $w.onReady overwrites #countyName / #countyNameHeadline /
 *     #dynamicHeader via resolvePrimaryHeroH1 (city pattern). Bots that skip
 *     JS never see that overwrite.
 *   - Generator: city content.hero_headline = formatCityHeroHeadline(...);
 *     jail prefers CMS h1Headline; county uses h1Headline when it contains
 *     "bail", else a default. CMS schema also has title + seoTitle +
 *     seoDescription — title/seoTitle are SEO panel fields; H1 SSR binding
 *     is separate from those.
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
