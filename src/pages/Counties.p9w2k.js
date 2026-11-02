/**
 * Statewide county hub. The live page is /florida-bail-bonds-1.
 * /florida-bail-bonds 301s there, because a static page cannot share the
 * dynamic county prefix /florida-bail-bonds/{County Slug}.
 * Studio has no #comp-mumy2zct. repeater1 is the county list and is left
 * alone. This file only sets LocalBusiness JSON-LD.
 */
import wixSeo from 'wix-seo';

$w.onReady(function () {
    // #comp-mumy2zct is not on the Studio page. Do not walk repeater1 or Text.
    try { setHubLocalBusiness(); } catch (e) { console.warn('[County Hub] SEO failed', e); }
});

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
