/**
 * Statewide county hub. The live page is /florida-bail-bonds-1.
 * /florida-bail-bonds 301s there, because a static page cannot share the
 * dynamic county prefix /florida-bail-bonds/{County Slug}.
 *
 * The 67-county list is built in public/floridaCountyDirectory.js.
 * Studio Layers has no text or HTML element for that list. The lookup
 * is guarded and does nothing until a rich text element with id
 * comp-mumy2zct is added. repeater1 is the button list and is left alone.
 */
import wixSeo from 'wix-seo';
import {
    appendHubCountyDirectory,
    buildHubCityDirectoryHtml,
    buildHubCountyDirectoryHtml,
    HUB_COUNTY_DIRECTORY_ELEMENT_ID
} from 'public/floridaCountyDirectory';

$w.onReady(function () {
    try { setHubLocalBusiness(); } catch (e) { console.warn('[County Hub] SEO failed', e); }
    let directory = '';
    try {
        directory = buildHubCountyDirectoryHtml() + buildHubCityDirectoryHtml();
    } catch (e) {
        console.warn('[County Hub] directory html failed', e);
        return;
    }
    if (!paintHubDirectory(directory)) {
        console.warn('[County Hub] ' + HUB_COUNTY_DIRECTORY_ELEMENT_ID + ' has no html');
    }
});

/**
 * Match the directory rich text by id. $w('#id') is often a stub without
 * .html, so the Text collection is checked first. repeater1 is not read.
 * A missing element is a no-op.
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
    } catch (e) { /* directory element is not on this canvas */ }
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
        url: 'https://www.shamrockbailbonds.biz/florida-bail-bonds-1',
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
