/**
 * Primary H1 for city landings on the Florida county template.
 * Pattern (Brendan-approved): "{City} Bail Bonds ({County} County)".
 * Jail and county pages keep their existing headlines.
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
