/**
 * Rewrite landing copy before it is rendered, used for SEO, or passed to a page.
 * CMS rows with the legacy release-speed tag are rewritten to "24/7 Bail Help".
 * Any remaining occurrence of that legacy tag is removed without writing to CMS.
 */

const LEGACY_TAG = ['Fast', 'Release'].join(' ');
const PHRASE = `24/7 ${LEGACY_TAG}`;
const REPLACEMENT = '24/7 Bail Help';
const OTHER = new RegExp(LEGACY_TAG, 'g');

/**
 * Lee County pages still render the old CMS sentence
 * "fast, confidential". That becomes "confidential, 24/7".
 * No release-speed or time-to-release claim is added.
 * @param {string} value
 * @returns {string}
 */
export function softenLeeCountyCopy(value) {
    if (typeof value !== 'string' || !/fast,\s*confidential/i.test(value)) return value;
    return value.replace(/fast,\s*confidential/gi, 'confidential, 24/7');
}

/**
 * Visible Lee County booking line. People are booked at the Downtown
 * facility on Dr. Martin Luther King Jr. Blvd. This sentence does not
 * name a release time.
 */
export const LEE_DOWNTOWN_BOOKING_SENTENCE =
    'People are booked at the Lee County Jail Downtown facility on Dr. Martin Luther King Jr. Blvd.';

function leeCountySlug(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/\s+county$/i, '')
        .replace(/-county$/i, '')
        .trim();
}

/**
 * Lee County pages and Lee city or jail landings on the same template.
 * @param {object} county
 * @returns {boolean}
 */
export function isLeeCountyCopy(county) {
    if (!county || typeof county !== 'object') return false;
    const slug = leeCountySlug(county.county_slug || county.slug);
    const parent = leeCountySlug(county.parent_county_name);
    if (slug === 'lee' || parent === 'lee') return true;
    return leeCountySlug(county.county_name) === 'lee' && !parent;
}

/**
 * Lee about and hero copy names the Downtown booking facility.
 * A CMS line that books people at the Ortiz address, or that says
 * "Core only", is rewritten. Other counties are left unchanged.
 * @param {string} value
 * @param {object} county
 * @returns {string}
 */
export function applyLeeDowntownBooking(value, county) {
    const body = typeof value === 'string' ? value : '';
    if (!isLeeCountyCopy(county)) return body;
    // The facility name contains "Dr." and "Jr.", so the rewrite uses a
    // token until the bad booking clauses are gone. A period is not a
    // safe sentence boundary while that name is in the string.
    const token = '___LEE_DOWNTOWN_FACILITY___';
    const place = 'the Lee County Jail Downtown facility on Dr. Martin Luther King Jr. Blvd';
    let next = body.replace(
        /\b(?:typically |then )?booked at\b[^<]{0,240}?2501 Ortiz Ave[^<.]{0,40}/gi,
        'booked at ' + token
    );
    next = next.replace(
        /\b(?:typically |then )?booked at\b[^<]{0,80}?\bcore\b[^<.]{0,40}/gi,
        'booked at ' + token
    );
    next = next.replace(
        /\bposts bond at\b[^<]{0,200}?2501 Ortiz Ave[^<.]{0,40}/gi,
        'posts bond at ' + token
    );
    next = next.replace(
        /2501 Ortiz Ave[^<.]{0,80} is the booking facility/gi,
        token + ' is where people are booked'
    );
    next = next.replace(/\bcore only\b/gi, token);
    next = next.split(token).join(place);
    if (next.indexOf('Lee County Jail Downtown facility on Dr. Martin Luther King Jr. Blvd') === -1) {
        const sentence = LEE_DOWNTOWN_BOOKING_SENTENCE;
        if (body.indexOf('<') !== -1) {
            next += '<p>' + sentence + '</p>';
        } else {
            next = next ? (next.replace(/\s+$/, '') + ' ' + sentence) : sentence;
        }
    }
    return next;
}

export function softenLeeCountyPage(county) {
    if (!county || typeof county !== 'object') return county;
    const slug = String(county.county_slug || county.slug || '')
        .toLowerCase()
        .replace(/-county$/i, '');
    if (slug !== 'lee') return county;
    const walk = (value) => {
        if (typeof value === 'string') return softenLeeCountyCopy(value);
        if (Array.isArray(value)) return value.map(walk);
        if (!value || typeof value !== 'object') return value;
        const next = Array.isArray(value) ? [] : {};
        Object.keys(value).forEach((key) => {
            next[key] = walk(value[key]);
        });
        return next;
    };
    return walk(county);
}

export function sanitizeFastReleaseText(value) {
    if (typeof value !== 'string' || value.indexOf(LEGACY_TAG) === -1) return value;
    let text = value.split(PHRASE).join(REPLACEMENT);
    text = text.replace(OTHER, '');
    text = text.replace(/[ \t]{2,}/g, ' ');
    text = text.replace(/[ \t]+([,.;:!?])/g, '$1');
    text = text.trim().replace(/\s*[—–-]\s*$/g, '');
    return text.trim();
}

const COPY_FIELDS = ['title', 'h1Headline', 'seoTitle'];

/**
 * Shallow copy with title, h1Headline, and seoTitle sanitized.
 * @param {object} item FloridaCounties item (or the same shape)
 * @returns {object}
 */
export function sanitizeLandingItem(item) {
    if (!item || typeof item !== 'object') return item;
    const next = Object.assign({}, item);
    for (let i = 0; i < COPY_FIELDS.length; i++) {
        const field = COPY_FIELDS[i];
        if (typeof next[field] === 'string') {
            next[field] = sanitizeFastReleaseText(next[field]);
        }
    }
    return next;
}

/**
 * Fields a page or dataset would render from one collection item.
 * @param {object} item
 * @returns {{ title: string, h1Headline: string, seoTitle: string }}
 */
export function renderLandingCopy(item) {
    const clean = sanitizeLandingItem(item || {});
    return {
        title: clean.title || '',
        h1Headline: clean.h1Headline || '',
        seoTitle: clean.seoTitle || ''
    };
}
