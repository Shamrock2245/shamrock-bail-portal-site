/**
 * Statewide county hub. Canonical URL is /florida-bail-bonds.
 * /florida-bail-bonds-1 should 301 to it (docs/seo/redirect-map.csv, applied
 * by Brendan in the Wix dashboard).
 * Appends one crawlable /florida-bail-bonds/{county} anchor for all 67
 * counties onto the body rich text already on this page. SWFL leads that
 * list. The Editor H1 is left as authored.
 */
import wixSeo from 'wix-seo';
import {
    appendHubCountyDirectory,
    buildHubCountyDirectoryHtml,
    HUB_COUNTY_DIRECTORY_ELEMENT_ID
} from 'public/floridaCountyDirectory';

$w.onReady(function () {
    setHubLocalBusiness();
    let directory = '';
    try {
        directory = buildHubCountyDirectoryHtml();
    } catch (e) {
        console.warn('[County Hub] directory html failed', e);
        return;
    }
    if (!paintHubDirectory(directory)) {
        console.warn('[County Hub] ' + HUB_COUNTY_DIRECTORY_ELEMENT_ID + ' has no html');
    }
});

/**
 * #comp-mumy2zct is the existing WRichText. $w('#comp-…') is often a
 * Thunderbolt stub without .html, so the Text collection is matched by id
 * first. The direct selector is only used when .html is already a string.
 */
function paintHubDirectory(directory) {
    const targetId = HUB_COUNTY_DIRECTORY_ELEMENT_ID.replace(/^#/, '');
    let painted = false;
    const apply = function (el) {
        if (!el || el.id !== targetId || typeof el.html !== 'string') return;
        el.html = appendHubCountyDirectory(el.html, directory);
        if (typeof el.expand === 'function') el.expand();
        painted = true;
    };
    try {
        const texts = $w('Text');
        const list = texts && typeof texts.forEach === 'function'
            ? texts
            : (texts && typeof texts.html === 'string' ? [texts] : []);
        if (typeof list.forEach === 'function') {
            list.forEach(function (el) {
                try { apply(el); } catch (e) { /* skip */ }
            });
        }
    } catch (e) { /* Text selector unavailable */ }
    if (painted) return true;
    try {
        apply($w(HUB_COUNTY_DIRECTORY_ELEMENT_ID));
    } catch (e) { /* direct comp id is a stub on Thunderbolt */ }
    return painted;
}

/**
 * Office walk-in hours are Mon–Fri 09:00–17:00.
 * Phone lines stay available 24/7 on contactPoint, not as openingHours.
 */
function setHubLocalBusiness() {
    const phoneHours = {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59'
    };
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': 'https://www.shamrockbailbonds.biz/#business',
        name: 'Shamrock Bail Bonds',
        url: 'https://www.shamrockbailbonds.biz/florida-bail-bonds',
        telephone: '+1-239-332-2245',
        image: 'https://www.shamrockbailbonds.biz/logo.png',
        address: {
            '@type': 'PostalAddress',
            streetAddress: '1528 Broadway',
            addressLocality: 'Fort Myers',
            addressRegion: 'FL',
            postalCode: '33901',
            addressCountry: 'US'
        },
        contactPoint: [
            {
                '@type': 'ContactPoint',
                telephone: '+1-239-332-2245',
                contactType: 'Customer Service',
                areaServed: 'FL',
                availableLanguage: ['English', 'Spanish'],
                hoursAvailable: phoneHours
            },
            {
                '@type': 'ContactPoint',
                telephone: '+1-727-295-2245',
                contactType: 'Customer Service (Spanish line)',
                areaServed: 'FL',
                availableLanguage: ['Spanish'],
                hoursAvailable: phoneHours
            }
        ],
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '17:00'
        }
    };
    try {
        wixSeo.setStructuredData([schema]);
    } catch (e) {
        console.warn('[County Hub] LocalBusiness schema failed', e);
    }
}
