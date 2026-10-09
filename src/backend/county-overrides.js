/**
 * Runtime copy overrides for the Lee and Collier county pages only.
 *
 * The Florida Counties template serves every county, city, and jail landing.
 * These overrides replace the rendered About body, city list, and FAQ set
 * for the slugs `lee` and `collier`. They do not write the CMS. Every other
 * slug is returned unchanged.
 *
 * Transfer-bond URL: none. There is no live transfer-bond page, so the
 * sentence is plain text with the office phone and no anchor.
 */

export const SPANISH_LINE_LABEL = 'Se habla español / 24/7 line: (727) 295-2245';
export const HOURS_LINE = 'Office walk-in hours Mon–Fri 9–5 · Phones answered 24/7';
export const TRANSFER_LINE = 'Out-of-state or transfer bonds? We write transfer bonds throughout the US — call (239) 332-2245.';
export const FAQ_CAP = 15;
export const COUNTY_HUB_URL = 'https://www.shamrockbailbonds.biz/florida-bail-bonds-1';

const OFFICE_PHONE = '(239) 332-2245';

const LEE_CITIES = [
    'Fort Myers',
    'Cape Coral',
    'Bonita Springs',
    'Estero',
    'Lehigh Acres',
    'Fort Myers Beach',
    'Sanibel',
    'North Fort Myers'
];

const COLLIER_CITIES = [
    'Naples',
    'Marco Island',
    'Immokalee',
    'Golden Gate',
    'Ave Maria',
    'Everglades City'
];

function p(html) {
    return `<p>${html}</p>`;
}

function joinParagraphs(parts) {
    return parts.map(p).join('');
}

function stripTags(html) {
    return String(html || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatCityList(cities) {
    if (!cities || cities.length === 0) return '';
    if (cities.length === 1) return cities[0];
    if (cities.length === 2) return `${cities[0]} and ${cities[1]}`;
    return `${cities.slice(0, -1).join(', ')}, and ${cities[cities.length - 1]}`;
}

const LEE_ABOUT_HTML = joinParagraphs([
    'Shamrock Bail Bonds posts surety bonds in Lee County, Florida, 24 hours a day. The Lee County Sheriff\'s Office runs two jail sites in Fort Myers: the Downtown Jail, 2115 Dr Martin Luther King Jr Blvd, Fort Myers, FL 33901, which is the county\'s central intake and booking facility, and Core, 2501 Ortiz Ave, Fort Myers, FL 33905.',
    `We serve all of Lee County, including ${formatCityList(LEE_CITIES)}.`,
    `Florida regulates the premium: 10% of the bail amount, with a $100 minimum per charge. Call ${OFFICE_PHONE} with the person's name and we will confirm the booking, explain payment options, and send the paperwork to your phone. You do not have to come to our office at 1528 Broadway, Fort Myers, unless you want to.`,
    HOURS_LINE,
    `Court records and case information: <a href="https://www.leeclerk.org/">Lee County Clerk of Court</a>. First Appearance must take place within 24 hours of arrest; see our <a href="/first-appearance/lee">Lee County First Appearance guide</a>. Arrested in another county? Start at our <a href="/florida-bail-bonds-1">Florida County Directory</a>.`,
    TRANSFER_LINE
]);

const COLLIER_ABOUT_HTML = joinParagraphs([
    'Shamrock Bail Bonds posts surety bonds in Collier County, Florida, 24 hours a day. The Collier County Sheriff\'s Office runs two jail sites: the Naples Jail Center, 3347 Tamiami Trail E, Naples, FL 34112, and the Immokalee Jail Center, 302 Stockade Rd, Immokalee, FL 34142. The Sheriff\'s Office notes that some people arrested in Naples are housed in Immokalee and the reverse, so call us with the person\'s name and we will confirm where they are.',
    `We serve all of Collier County, including ${formatCityList(COLLIER_CITIES)}.`,
    `Florida regulates the premium: 10% of the bail amount, with a $100 minimum per charge. Call ${OFFICE_PHONE} and we will confirm the booking, explain payment options, and send the paperwork to your phone. You do not have to come to our office at 1528 Broadway, Fort Myers, unless you want to.`,
    HOURS_LINE,
    `Court records and case information: <a href="https://www.collierclerk.com/">Collier County Clerk of the Circuit Court &amp; Comptroller</a>, 3315 Tamiami Trail East, Suite 102, Naples. First Appearance must take place within 24 hours of arrest; see our <a href="/first-appearance/collier">Collier County First Appearance guide</a>. Arrested in another county? Start at our <a href="/florida-bail-bonds-1">Florida County Directory</a>.`,
    TRANSFER_LINE
]);

function faq(id, question, answer) {
    return { _id: id, question, answer };
}

const LEE_FAQS = [
    faq(
        'lee-override-01',
        'Where can I find bail bonds in Lee County Florida?',
        'Shamrock Bail Bonds is a licensed local bail bond agency serving Lee County in the 20th Judicial Circuit of Florida. We provide confidential bail bond services for people arrested anywhere in Lee County. Our office is at 1528 Broadway, Fort Myers, FL 33901, and our phones are answered 24/7 at (239) 332-2245.'
    ),
    faq(
        'lee-override-02',
        'Who offers 24/7 bail bond services in Lee County?',
        `Shamrock Bail Bonds answers phones 24/7 for Lee County arrests and can post a bond at any hour, including nights, weekends, and holidays. ${HOURS_LINE}`
    ),
    faq(
        'lee-override-03',
        'How does the bail bond process work in Lee County?',
        'In Lee County, the bail bond process begins after booking and bond setting by a judge in the 20th Judicial Circuit. You may post a cash bond with the court or use a licensed surety agent like Shamrock Bail Bonds by paying the state-mandated 10% premium.'
    ),
    faq(
        'lee-override-04',
        'How long does it take to get out of jail in Lee County?',
        'Release timing is controlled by the jail. After Shamrock Bail Bonds posts the bond, the Lee County Sheriff\'s Office processes the release, and a pending First Appearance hearing or court hold can add time. We keep you updated until your loved one is out.'
    ),
    faq(
        'lee-override-05',
        'How much does a bail bond cost in Lee County Florida?',
        'Florida law requires a bail bond premium of 10% of the total bond amount, with a $100 minimum per charge. This fee is non-refundable and applies to all licensed bail bond agents, including Shamrock Bail Bonds.'
    ),
    faq(
        'lee-override-06',
        'What is 10% of a $5,000 bond in Lee County?',
        'Ten percent of a $5,000 bond is $500. This is the state-mandated, non-refundable premium when using a licensed bail bond agent like Shamrock Bail Bonds in Lee County.'
    ),
    faq(
        'lee-override-07',
        'Do I have to pay the full bail amount in Lee County?',
        'Only if you post a cash bond directly with the court. When using Shamrock Bail Bonds, you pay only the 10% premium and we guarantee the full bond amount to the Lee County court.'
    ),
    faq(
        'lee-override-08',
        'What is the difference between cash bail and surety bail in Lee County?',
        'Cash bail requires paying 100% of the bond to the court. Surety bail allows you to pay 10% to a licensed agent like Shamrock Bail Bonds, who posts the bond on your behalf under Florida law.'
    ),
    faq(
        'lee-override-09',
        'Is the bail bond premium refundable in Florida?',
        'No. Florida law states that the 10% bail bond premium is earned upon posting and is non-refundable, regardless of the case outcome.'
    ),
    faq(
        'lee-override-10',
        'What happens if someone misses court in Lee County?',
        'Missing a court date in Lee County may result in a bench warrant and bond forfeiture. If Shamrock Bail Bonds posted the bond, immediate contact is critical to address the situation.'
    ),
    faq(
        'lee-override-11',
        'What is a First Appearance hearing in Lee County?',
        'A First Appearance is when a judge in the 20th Judicial Circuit reviews charges, bond eligibility, and release conditions within 24 hours of arrest under Florida Rule of Criminal Procedure 3.130. See our Lee County First Appearance guide at shamrockbailbonds.biz/first-appearance/lee or call (239) 332-2245.'
    ),
    faq(
        'lee-override-12',
        'What areas of Lee County do you serve?',
        `We serve all of Lee County, including ${formatCityList(LEE_CITIES)}.`
    ),
    faq(
        'lee-override-13',
        'Can you help with an active warrant in Lee County?',
        'Yes, we can assist with active warrants in Lee County. We can help arrange a self-surrender with the court, which often results in a smoother process. Call us confidentially to discuss your situation.'
    ),
    faq(
        'lee-override-14',
        'Which jail is my loved one in, in Lee County?',
        'The Lee County Sheriff\'s Office runs two jail sites in Fort Myers: the Downtown Jail at 2115 Dr Martin Luther King Jr Blvd, the county\'s central intake and booking facility, and Core at 2501 Ortiz Ave. Use the Sheriff\'s arrest search or call us at (239) 332-2245 and we will look up the booking.'
    ),
    faq(
        'lee-override-15',
        'Where do I find Lee County court records?',
        'Court records are kept by the Lee County Clerk of Court (leeclerk.org). Use the Clerk\'s online records search, or call us and we will help you find the case.'
    )
];

const COLLIER_FAQS = [
    faq(
        'collier-override-01',
        'How do I bail someone out of jail in Collier County, Florida?',
        'Collier County arrests are held at the Naples Jail Center or the Immokalee Jail Center. To post a bail bond, call Shamrock Bail Bonds at (239) 332-2245. We will confirm the booking, prepare the bond documents, and post the bond. The jail then processes the release.'
    ),
    faq(
        'collier-override-02',
        'Where can I find bail bonds in Collier County, Florida?',
        'Shamrock Bail Bonds is a licensed bail bond agency serving Collier County in the 20th Judicial Circuit of Florida. We provide confidential bail bond services for people arrested anywhere in Collier County. Our office is at 1528 Broadway, Fort Myers, FL 33901, and our phones are answered 24/7 at (239) 332-2245.'
    ),
    faq(
        'collier-override-03',
        'Who offers 24/7 bail bond services in Collier County?',
        `Shamrock Bail Bonds answers phones 24/7 for Collier County arrests and can post a bond at any hour, including nights, weekends, and holidays. ${HOURS_LINE}`
    ),
    faq(
        'collier-override-04',
        'How long does it take to get out of jail in Collier County?',
        'Release timing is controlled by the jail. After Shamrock Bail Bonds posts the bond, the Collier County jail processes the release, and a pending First Appearance hearing or court hold can add time. We keep you updated until your loved one is out.'
    ),
    faq(
        'collier-override-05',
        'How much does a bail bond cost in Collier County, Florida?',
        'Florida law requires a bail bond premium of 10% of the total bond amount, with a $100 minimum per charge. This fee is non-refundable and applies to all licensed bail bond agents, including Shamrock Bail Bonds.'
    ),
    faq(
        'collier-override-06',
        'What is 10% of a $5,000 bond in Collier County?',
        'Ten percent of a $5,000 bond is $500. This is the state-mandated, non-refundable premium when using a licensed bail bond agent like Shamrock Bail Bonds in Collier County.'
    ),
    faq(
        'collier-override-07',
        'Do I have to pay the full bail amount in Collier County?',
        'Only if you post a cash bond directly with the court. When using Shamrock Bail Bonds, you pay only the 10% premium and we guarantee the full bond amount to the Collier County court.'
    ),
    faq(
        'collier-override-08',
        'What is the difference between cash bail and surety bail in Collier County?',
        'Cash bail requires paying 100% of the bond to the court. Surety bail allows you to pay 10% to a licensed agent like Shamrock Bail Bonds, who posts the bond on your behalf under Florida law.'
    ),
    faq(
        'collier-override-09',
        'Is the bail bond premium refundable in Florida?',
        'No. Florida law states that the 10% bail bond premium is earned upon posting and is non-refundable, regardless of the case outcome.'
    ),
    faq(
        'collier-override-10',
        'What happens if someone misses court in Collier County?',
        'Missing a court date in Collier County may result in a bench warrant and bond forfeiture. If Shamrock Bail Bonds posted the bond, immediate contact is critical to address the situation.'
    ),
    faq(
        'collier-override-11',
        'What is a First Appearance hearing in Collier County?',
        'A First Appearance is when a judge in the 20th Judicial Circuit reviews charges, bond eligibility, and conditions within 24 hours of arrest under Florida Rule of Criminal Procedure 3.130. This hearing sets the bond amount and release conditions. For live schedules and court streams, see our First Appearance guide at shamrockbailbonds.biz/first-appearance/collier or call (239) 332-2245.'
    ),
    faq(
        'collier-override-12',
        'What areas of Collier County do you serve?',
        `We serve all of Collier County, including ${formatCityList(COLLIER_CITIES)}.`
    ),
    faq(
        'collier-override-13',
        'Can you help with an active warrant in Collier County?',
        'Yes, we can assist with active warrants in Collier County. We can help arrange a self-surrender with the court, which often results in a smoother process. Call us confidentially to discuss your situation.'
    ),
    faq(
        'collier-override-14',
        'Which jail is my loved one in, in Collier County?',
        'The Collier County Sheriff\'s Office runs the Naples Jail Center (3347 Tamiami Trail E, Naples) and the Immokalee Jail Center (302 Stockade Rd, Immokalee). Housing is based on the person\'s needs, not where they live, so check the Sheriff\'s inmate search or call us at (239) 332-2245.'
    ),
    faq(
        'collier-override-15',
        'Where do I find Collier County court records?',
        'Court records are kept by the Collier County Clerk of the Circuit Court & Comptroller, 3315 Tamiami Trail East, Suite 102, Naples, FL 34112, (239) 252-2646 (collierclerk.com).'
    )
];

const OVERRIDES = {
    lee: {
        cities: LEE_CITIES,
        aboutHtml: LEE_ABOUT_HTML,
        serviceAreas: `We serve all of Lee County, including ${formatCityList(LEE_CITIES)}.`,
        faqs: LEE_FAQS
    },
    collier: {
        cities: COLLIER_CITIES,
        aboutHtml: COLLIER_ABOUT_HTML,
        serviceAreas: `We serve all of Collier County, including ${formatCityList(COLLIER_CITIES)}.`,
        faqs: COLLIER_FAQS
    }
};

export function normalizeCountySlug(raw) {
    return String(raw || '')
        .toLowerCase()
        .trim()
        .replace(/^\/+/, '')
        .replace(/-county$/i, '');
}

export function countySlugOf(countyOrSlug) {
    if (!countyOrSlug) return '';
    if (typeof countyOrSlug === 'string') return normalizeCountySlug(countyOrSlug);
    return normalizeCountySlug(
        countyOrSlug.county_slug || countyOrSlug.slug || countyOrSlug.countySlug || ''
    );
}

export function hasCountyOverride(countyOrSlug) {
    return Object.prototype.hasOwnProperty.call(OVERRIDES, countySlugOf(countyOrSlug));
}

function copyFaqs(faqs) {
    return faqs.slice(0, FAQ_CAP).map((item) => ({
        _id: item._id,
        question: item.question,
        answer: item.answer
    }));
}

/** Curated FAQ list for lee/collier, or null so the page keeps the CMS query. */
export function getCountyOverrideFaqs(countyOrSlug) {
    const spec = OVERRIDES[countySlugOf(countyOrSlug)];
    if (!spec) return null;
    return copyFaqs(spec.faqs);
}

/**
 * Replace About, cities, and embedded FAQs for lee/collier.
 * Returns the same object for every other slug, including city and jail landings.
 * Does not change hero_headline.
 */
export function applyCountyContentOverride(county) {
    if (!county || typeof county !== 'object') return county;
    const spec = OVERRIDES[countySlugOf(county)];
    if (!spec) return county;
    const cities = spec.cities.slice();
    const content = county.content || {};
    return {
        ...county,
        cities,
        facts: {
            ...(county.facts || {}),
            major_cities: cities.slice()
        },
        content: {
            ...content,
            about_county: stripTags(spec.aboutHtml),
            about_html: spec.aboutHtml,
            service_areas: spec.serviceAreas,
            faq: copyFaqs(spec.faqs)
        }
    };
}

/** FAQPage JSON-LD for the questions actually rendered. Null when the list is empty. */
export function buildFaqPageSchema(faqs) {
    const visible = (faqs || []).filter((item) => item && item.question && item.answer);
    if (visible.length === 0) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: visible.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer
            }
        }))
    };
}

/** True only for a non-empty http or https URL. tel:, relative, and blank values are not shown. */
export function isHttpUrl(value) {
    const url = String(value || '').trim();
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

/**
 * Speed / hour-promise patterns for the Lee and Collier render.
 * "within 24 hours" is Florida Rule 3.130 and is removed before the check.
 */
const SPEED_PATTERNS = [
    /within\s+(?:several|a few|\d+)\s+hours/i,
    /\bminutes\b/i,
    /as quickly as possible/i,
    /\bfast(?:er|est)?\b/i,
    /\bexpedit\w*/i,
    /\bquickly\b/i
];

export function findDisallowedSpeedClaims(text) {
    const scrubbed = String(text || '').replace(/within 24 hours/gi, '');
    const hits = [];
    for (const pattern of SPEED_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(scrubbed)) hits.push(pattern.source);
    }
    return hits;
}

export function renderedOverrideBundle(countyOrSlug) {
    const spec = OVERRIDES[countySlugOf(countyOrSlug)];
    if (!spec) return null;
    const faqs = copyFaqs(spec.faqs);
    return {
        aboutHtml: spec.aboutHtml,
        aboutText: stripTags(spec.aboutHtml),
        serviceAreas: spec.serviceAreas,
        cities: spec.cities.slice(),
        faqs,
        strings: [
            spec.aboutHtml,
            stripTags(spec.aboutHtml),
            spec.serviceAreas,
            ...faqs.flatMap((item) => [item.question, item.answer])
        ]
    };
}
