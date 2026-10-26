/**
 * county-page.js - Dynamic County Page Code for Wix Studio
 * Page: Florida Counties (Item) (/florida-bail-bonds/{county-slug})
 * Branch: Wix studio version (branchId 12e252e4-45a8-4bcc-840b-64d4edbdcaa4)
 * 
 * Handles:
 * 1. Binds dynamic dataset fields (County Name, Jail Info, Clerk Info, Copy)
 * 2. Injects dynamic SEO Title, Meta Description, and LocalBusiness Schema
 * 3. Wires up official inmate search, jail call, and clerk court link buttons
 * 4. Connects immediate emergency bondsman contact CTAs (English, Spanish, SMS)
 */

import wixSeoFrontend from 'wix-seo-frontend';
import wixWindowFrontend from 'wix-window-frontend';
import wixLocationFrontend from 'wix-location-frontend';

$w.onReady(function () {
    const dataset = $w('#countyDataset');

    if (dataset) {
        dataset.onReady(() => {
            const item = dataset.getCurrentItem();
            if (item) {
                applyCountySEO(item);
                bindCountyActions(item);
            }
        });
    }
});

/**
 * Injects Dynamic SEO Metadata and JSON-LD Structured Data
 * @param {Object} item - Current Florida Counties collection record
 */
function applyCountySEO(item) {
    const countyName = item.countyName || 'Florida';
    const seoTitle = item.seoTitle || `${countyName} County Bail Bonds | 24/7 Jail Release | Shamrock`;
    const seoDesc = item.seoDescription || `Need bail in ${countyName} County, FL? Shamrock Bail Bonds provides 24/7 licensed bail help for the ${item.jailName || countyName + ' County Jail'}. Call 239-332-2245 now.`;

    // 1. Title and Description
    wixSeoFrontend.setTitle(seoTitle);
    wixSeoFrontend.setMetaTags([
        { name: 'description', content: seoDesc },
        { property: 'og:title', content: seoTitle },
        { property: 'og:description', content: seoDesc },
        { property: 'og:type', content: 'website' }
    ]);

    // 2. LocalBusiness / AdministrativeArea JSON-LD Schema
    const countySchema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": `Shamrock Bail Bonds — ${countyName} County`,
        "description": `Licensed Florida bail bond agency serving ${countyName} County, the ${item.jailName || 'county jail'}, and surrounding municipalities.`,
        "url": `https://www.shamrockbailbonds.biz/florida-bail-bonds/${item.countySlug || ''}`,
        "telephone": "+1-239-332-2245",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "1528 Broadway",
            "addressLocality": "Fort Myers",
            "addressRegion": "FL",
            "postalCode": "33901",
            "addressCountry": "US"
        },
        "areaServed": {
            "@type": "AdministrativeArea",
            "name": `${countyName} County, Florida`
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "09:00",
            "closes": "17:00"
        },
        "contactPoint": [
            {
                "@type": "ContactPoint",
                "telephone": "+1-239-332-2245",
                "contactType": "Emergency Bail Dispatch (English)",
                "areaServed": "US-FL",
                "availableLanguage": ["English"],
                "hoursAvailable": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                }
            },
            {
                "@type": "ContactPoint",
                "telephone": "+1-727-295-2245",
                "contactType": "Customer Service (Spanish Line)",
                "areaServed": "US-FL",
                "availableLanguage": ["Spanish"],
                "hoursAvailable": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                }
            },
            {
                "@type": "ContactPoint",
                "telephone": "+1-239-955-0178",
                "contactType": "24/7 SMS & iMessage Support",
                "areaServed": "US-FL"
            }
        ]
    };

    wixSeoFrontend.setStructuredData([countySchema]);
}

/**
 * Florida Counties CMS uses bookingWebsiteLink, bookingPhoneNumber, and
 * countyClerkWebsitelink. Older copies and the official-sources catalog use
 * jailBookingUrl / inmateSearchUrl, jailPhone, and clerkWebsite.
 */
function firstCountyText(record, keys) {
    const item = record || {};
    for (let i = 0; i < keys.length; i++) {
        const value = item[keys[i]];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
}

function countyActionTargets(item) {
    return {
        inmateUrl: firstCountyText(item, ['bookingWebsiteLink', 'jailBookingUrl', 'inmateSearchUrl']),
        jailPhone: firstCountyText(item, ['bookingPhoneNumber', 'jailPhone']),
        clerkUrl: firstCountyText(item, ['countyClerkWebsitelink', 'clerkWebsite'])
    };
}

/**
 * openModal() accepts only HTTPS and ignores target. A button link opens the
 * real URL, including http sheriff and clerk sites, in a new browser tab.
 */
function bindExternalResource(button, url) {
    if (!button || !url || url.indexOf('http') !== 0) return false;
    button.link = url;
    button.target = '_blank';
    return true;
}

/**
 * Binds UI Action Buttons to Official County Jail & Clerk Endpoints
 * @param {Object} item - Current Florida Counties collection record
 */
function bindCountyActions(item) {
    const targets = countyActionTargets(item);

    // Official Inmate Lookup Button
    if ($w('#inmateLookupBtn')) {
        if (bindExternalResource($w('#inmateLookupBtn'), targets.inmateUrl)) {
            $w('#inmateLookupBtn').onClick(() => {
                trackEvent('jail_inmate_lookup', item.countySlug);
            });
            $w('#inmateLookupBtn').enable();
        } else {
            $w('#inmateLookupBtn').onClick(() => {
                // If booking URL not available, direct to phone verification
                wixLocationFrontend.to('tel:2393322245');
            });
        }
    }

    // Call County Jail Facility
    if ($w('#callJailFacilityBtn') && targets.jailPhone) {
        $w('#callJailFacilityBtn').onClick(() => {
            trackEvent('call_jail_facility', item.countySlug);
            wixLocationFrontend.to(`tel:${targets.jailPhone.replace(/[^0-9]/g, '')}`);
        });
    }

    // Official Clerk of Court Website
    if (bindExternalResource($w('#clerkWebsiteBtn'), targets.clerkUrl)) {
        $w('#clerkWebsiteBtn').onClick(() => {
            trackEvent('clerk_website_click', item.countySlug);
        });
    }

    // Immediate Bail Bondsman Contact Buttons
    if ($w('#bondsmanCallBtn')) {
        $w('#bondsmanCallBtn').onClick(() => {
            trackEvent('call_english', `county_${item.countySlug}`);
        });
    }

    if ($w('#spanishCallBtn')) {
        $w('#spanishCallBtn').onClick(() => {
            trackEvent('call_spanish', `county_${item.countySlug}`);
        });
    }

    if ($w('#smsBondsmanBtn')) {
        $w('#smsBondsmanBtn').onClick(() => {
            trackEvent('sms_click', `county_${item.countySlug}`);
        });
    }

    if ($w('#startOnlineBtn')) {
        $w('#startOnlineBtn').onClick(() => {
            wixLocationFrontend.to('/portal-landing');
        });
    }
}

function trackEvent(action, label) {
    try {
        if (wixWindowFrontend.trackEvent) {
            wixWindowFrontend.trackEvent('CustomEvent', {
                event: 'county_page_interaction',
                eventCategory: 'County Lead Engagement',
                eventAction: action,
                eventLabel: label
            });
        }
    } catch (e) {
        console.warn('Analytics suppressed:', e.message);
    }
}
