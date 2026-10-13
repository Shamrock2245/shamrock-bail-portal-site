/**
 * Rewrite landing copy before it is rendered, used for SEO, or passed to a page.
 * CMS rows may still say "24/7 Fast Release". That phrase becomes "24/7 Bail Help".
 * Any other "Fast Release" is removed. The CMS record itself is not written.
 */

const PHRASE = '24/7 Fast Release';
const REPLACEMENT = '24/7 Bail Help';
const OTHER = /Fast Release/g;

/**
 * @param {string} value
 * @returns {string}
 */
export function sanitizeFastReleaseText(value) {
    if (typeof value !== 'string' || value.indexOf('Fast Release') === -1) return value;
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
