/**
 * seoConfig.js — Shamrock Bail Bonds
 * Centralized NAP (Name, Address, Phone) and SEO configuration.
 *
 * SINGLE SOURCE OF TRUTH for all structured data, meta tags, and
 * GEO signals across the Wix/Velo codebase.
 *
 * RULES:
 *   - Never hardcode NAP data in any other file.
 *   - Import from this module in seo-helper.jsw, seo-rich-results.jsw,
 *     seoUtils.js, and all page-level Velo files.
 *   - Do NOT modify without updating docs/seo/NAP_GUIDE.md.
 *
 * Last updated: 2026-07-04
 */

// ─── CANONICAL NAP ────────────────────────────────────────────────────────────

export const BUSINESS_NAME       = 'Shamrock Bail Bonds, LLC';
export const BUSINESS_SHORT_NAME = 'Shamrock Bail Bonds';

export const ADDRESS = {
    streetAddress:   '1528 Broadway',
    addressLocality: 'Fort Myers',
    addressRegion:   'FL',
    postalCode:      '33901',
    addressCountry:  'US',
    /** Full formatted string for display use */
    formatted:       '1528 Broadway, Fort Myers, FL 33901',
};

export const GEO = {
    latitude:  '26.6406',
    longitude: '-81.8723',
    /** ICBM / geo.position format */
    icbm:      '26.6406, -81.8723',
};

/** Primary contact — Fort Myers / SWFL */
export const PHONE_PRIMARY = {
    display:  '(239) 332-2245',
    e164:     '+12393322245',
    tel:      'tel:+12393322245',
    areaCode: '239',
};

/** Secondary contact — Tampa Bay / St. Pete */
export const PHONE_SECONDARY = {
    display:  '(727) 295-2245',
    e164:     '+17272952245',
    tel:      'tel:+17272952245',
    areaCode: '727',
    note:     'After-Hours & AI Agent Line',
};

export const EMAIL_PRIMARY = 'admin@shamrockbailbonds.biz';
export const EMAIL_SCHOOL  = 'school@shamrockbailbonds.biz';

export const SITE_URL = 'https://www.shamrockbailbonds.biz';

// ─── BUSINESS METADATA ────────────────────────────────────────────────────────

export const FOUNDING_DATE     = '2012';
export const FOUNDING_LOCATION = 'Fort Myers, FL';
export const SLOGAN            = 'Fort Myers Since 2012';
export const PRICE_RANGE       = '$$';
export const LANGUAGES         = ['English', 'Spanish'];
export const PAYMENT_ACCEPTED  = ['Cash', 'Credit Card', 'Debit Card', 'Payment Plan'];
export const CURRENCIES        = 'USD';

/** Hours: 24/7 */
export const HOURS = {
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens:     '00:00',
    closes:    '23:59',
};

// ─── SOCIAL PROFILES (sameAs) ─────────────────────────────────────────────────

export const SOCIAL_PROFILES = [
    'https://www.facebook.com/ShamrockBail',
    'https://www.instagram.com/shamrock_bail_bonds',
    'https://www.youtube.com/@ShamrockBailBonds_FL',
    'https://t.me/Shamrock_Bail_Bonds',
    'https://www.tiktok.com/@shamrockbailbonds',
    'https://www.yelp.com/biz/shamrock-bail-bonds-fort-myers',
];

// ─── CONTACT POINTS (Schema.org ContactPoint array) ──────────────────────────

export const CONTACT_POINTS = [
    {
        '@type':             'ContactPoint',
        telephone:           PHONE_PRIMARY.e164,
        contactType:         'Customer Service',
        areaServed:          'US-FL',
        availableLanguage:   LANGUAGES,
        hoursAvailable: {
            '@type':     'OpeningHoursSpecification',
            dayOfWeek:   HOURS.dayOfWeek,
            opens:       HOURS.opens,
            closes:      HOURS.closes,
        },
    },
    {
        '@type':           'ContactPoint',
        telephone:         PHONE_SECONDARY.e164,
        contactType:       'Customer Service',
        areaServed:        ['Tampa Bay Area', 'St. Petersburg', 'US-FL'],
        availableLanguage: LANGUAGES,
        description:       PHONE_SECONDARY.note,
    },
];

// ─── AREA SERVED ──────────────────────────────────────────────────────────────

export const AREA_SERVED = [
    { '@type': 'State',              name: 'Florida',              '@id': 'https://en.wikipedia.org/wiki/Florida' },
    { '@type': 'AdministrativeArea', name: 'Southwest Florida' },
    { '@type': 'AdministrativeArea', name: 'Southeast Florida' },
    { '@type': 'AdministrativeArea', name: 'Central Florida' },
    { '@type': 'AdministrativeArea', name: 'Tampa Bay Area' },
    { '@type': 'AdministrativeArea', name: 'North Florida' },
    { '@type': 'AdministrativeArea', name: 'Florida Panhandle' },
];

/** GeoCircle: ~300 miles from Fort Myers covers entire state */
export const SERVICE_AREA = {
    '@type': 'GeoCircle',
    geoMidpoint: {
        '@type':    'GeoCoordinates',
        latitude:   GEO.latitude,
        longitude:  GEO.longitude,
    },
    geoRadius: '482803', // meters
};

// ─── KNOWS ABOUT (GEO/AI signals) ────────────────────────────────────────────

export const KNOWS_ABOUT = [
    'Bail Near Me',
    'Local Bondsman',
    'Lee County Bail Bonds',
    'Charlotte County Bail Bonds',
    'Collier County Bail Bonds',
    'Manatee County Bail Bonds',
    'Sarasota County Bail Bonds',
    'Hendry County Bail Bonds',
    'DeSoto County Bail Bonds',
    'Glades County Bail Bonds',
    'Bail Bonds',
    'Surety Bonds',
    'Immigration Bail Bonds',
    'Florida Criminal Justice System',
    'Jail Release Process',
    'Court Appearances',
    'Indemnitor Responsibilities',
    'Bail Bond Payment Plans',
    'Florida Statute Chapter 648',
    'Florida Statute Chapter 903',
    'First Appearance Hearing',
    'Pretrial Release',
];

// ─── SERVICES CATALOG ─────────────────────────────────────────────────────────

export const SERVICES = [
    {
        name:        'Surety Bail Bonds',
        description: 'Standard bail bonds at 10% premium as regulated by Florida statute. Available for all charges.',
    },
    {
        name:        'Emergency After-Hours Bail Bonds',
        description: '24/7 emergency bail bond posting for immediate jail release, nights, weekends, and holidays.',
    },
    {
        name:        'Immigration Bail Bonds',
        description: 'Specialized immigration bonds for ICE detainees in Florida. Bilingual Spanish support available.',
    },
    {
        name:        'Bail Bond Payment Plans',
        description: 'Flexible payment plans for bail bond premiums. No credit check required for qualifying bonds.',
    },
];

// ─── COUNTY PAGE URL BUILDER ──────────────────────────────────────────────────

/**
 * Returns the canonical URL for a county dynamic page.
 * @param {string} slug - lowercase, hyphenated county slug (e.g. 'lee-county')
 * @returns {string}
 */
export function countyPageUrl(slug) {
    return `${SITE_URL}/florida-bail-bonds/${slug}`;
}

/**
 * Returns the county-specific LocalBusiness name.
 * @param {string} countyName - e.g. 'Lee County'
 * @returns {string}
 */
export function countyBusinessName(countyName) {
    return `${BUSINESS_SHORT_NAME} — ${countyName}`;
}
