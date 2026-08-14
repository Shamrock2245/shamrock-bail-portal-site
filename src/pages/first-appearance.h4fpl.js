/**
 * Shamrock Bail Bonds — First Appearance Page (FULL page code)
 * File: first-appearance.h4fpl.js
 * URL:  /first-appearance  (router hub) and /first-appearance-hub (static alias if set)
 *
 * County pSEO pages: /first-appearance/{county-slug} (router → first-appearance-page)
 *
 * This is the complete Velo page for the First Appearance hub.
 * UI is an HtmlComponent embed; this file owns routing of the embed,
 * analytics, and all crawlable SEO (title/meta/canonical/JSON-LD).
 *
 * ARCHITECTURE:
 *  Embed: https://shamrock-embeds.netlify.app/first-appearance.html
 *  Element: #firstAppearanceEmbed (HtmlComponent, URL mode)
 *
 *  Backend (backend/first-appearance-api.jsw):
 *    getFirstAppearanceSchedules({ lat, lon })
 *    trackFirstAppearanceAction(type, context)
 *    trackFirstAppearancePageView(data)
 *
 *  Router note (backend/first-appearance-router.js):
 *    Bare /first-appearance MUST return ok(<hub page name>) so THIS page runs.
 *    If ok() name is not a page ON the router, Wix title becomes "500 | …"
 *    and Google refuses indexing. County paths → first-appearance-page.nmw1v.js
 *    (that page must also be added under the same First-appearance router).
 *
 * postMessage from embed:
 *    setHeight | RESIZE | CTA_CLICK | FAQ_EXPAND | COUNTY_SEARCH | SCROLL_DEPTH
 */

import wixSeo from 'wix-seo';
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import {
    getFirstAppearanceSchedules,
    trackFirstAppearanceAction,
    trackFirstAppearancePageView
} from 'backend/first-appearance-api';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const EMBED_VERSION = '2026-08-06-fa-v6-focus';
const EMBED_ID = '#firstAppearanceEmbed';

/** Build embed URL; pass ?county= when deep-linked so the iframe focuses that card. */
function buildEmbedUrl(focusSlug) {
    let url = `https://shamrock-embeds.netlify.app/first-appearance.html?v=${encodeURIComponent(EMBED_VERSION)}`;
    if (focusSlug) {
        url += `&county=${encodeURIComponent(focusSlug)}`;
    }
    return url;
}

const PAGE_TITLE = 'First Appearance Hearing in Florida | Live Court Schedules | Shamrock Bail Bonds';
const PAGE_DESC =
    'Your loved one has a court date in 24 hours. Learn what happens at a First Appearance hearing in Florida, watch live court streams, and get bail help fast. Serving all 67 Florida counties 24/7. Call (239) 332-2245.';
/**
 * Canonical public hub URL.
 * Router serves this page at /first-appearance. If the Editor page SEO slug
 * is set to first-appearance-hub, both paths can work; prefer the router path
 * for reliability after publish.
 */
const PAGE_URL = 'https://www.shamrockbailbonds.biz/first-appearance';
const LOGO_URL = 'https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png';
const OG_IMAGE = LOGO_URL;

// ─── FAQ DATA (SEO schema — mirrored inside the embed) ───────────────────────

const FAQ_DATA = [
    {
        question: 'How long after arrest is the First Appearance held in Florida?',
        answer:
            "Under Florida Rule of Criminal Procedure 3.130, a First Appearance hearing must be held within 24 hours of arrest. This timeline applies statewide — including Lee, Collier, Charlotte, and all 67 Florida counties. If the 24-hour window passes without a hearing, the defendant may be entitled to release."
    },
    {
        question: "Can I attend my loved one's First Appearance hearing?",
        answer:
            'Yes. First Appearance hearings are public court proceedings. Many Florida counties — including Lee, Collier, and Hillsborough — now broadcast them live via Zoom or online streaming. Family members are encouraged to watch so they know the bond amount immediately and can call Shamrock at (239) 332-2245.'
    },
    {
        question: 'What should the defendant say at First Appearance?',
        answer:
            'At First Appearance, the defendant should say very little. Confirm your name, state you understand your rights, and request a public defender if you cannot afford an attorney. Do NOT explain the facts of the case, offer excuses, or argue with the judge. Anything said in court can be used against you at trial.'
    },
    {
        question: 'What factors does the judge consider when setting bail at First Appearance?',
        answer:
            "Florida judges weigh multiple factors when setting bail: the nature and severity of charges, the defendant's prior criminal record, ties to the community (family, employment, length of residency), flight risk indicators, and whether the defendant poses a danger to the public. Defendants with strong local ties and no prior record typically receive lower bond amounts."
    },
    {
        question: 'What if the judge sets a high bond amount at First Appearance?',
        answer:
            'Call Shamrock Bail Bonds immediately at (239) 332-2245 the moment the bond amount is set. We only require 10% of the bond amount to post bail. Our bondsmen are available 24/7 and can begin the paperwork process while you are still watching the First Appearance hearing.'
    },
    {
        question: 'What is the difference between First Appearance and Arraignment?',
        answer:
            'First Appearance happens within 24 hours of arrest and focuses exclusively on bail — the defendant does not enter a plea. Arraignment is a separate, later hearing (typically within 21 days of arrest for misdemeanors, or at information filing for felonies) where the defendant formally responds to charges with a guilty, not guilty, or no contest plea.'
    },
    {
        question: 'What if there is no probable cause at First Appearance?',
        answer:
            'If the judge finds no probable cause at First Appearance, the defendant must be released immediately under Florida law. The arrest report is reviewed to determine whether there is sufficient evidence that a crime was committed. If probable cause is not established within 33 days (for felonies) or 48 hours (for county court offenses), the charges may be dismissed.'
    },
    {
        question: 'Can the bond amount be changed after First Appearance?',
        answer:
            'Yes. A defense attorney can file a Motion for Bond Reduction or Modification at any time after First Appearance. The court will schedule a bond hearing where the attorney can argue for a lower amount. While the motion is pending, Shamrock can post the current bond to avoid additional jail time.'
    },
    {
        question: "How do I find out if my loved one has a First Appearance scheduled?",
        answer:
            "Call the county jail directly where your loved one is being held — they can confirm if a First Appearance is scheduled and when. You can also search the county clerk's online docket. Shamrock Bail Bonds can look up your loved one's booking record instantly — call (239) 332-2245 with their name and county."
    },
    {
        question: 'How quickly can Shamrock Bail Bonds post bail after First Appearance?',
        answer:
            'Shamrock Bail Bonds can begin the bail process immediately after the bond amount is set at First Appearance — even while the hearing is still in progress. Our office at 1528 Broadway, Fort Myers is steps from the Lee County Justice Center. Most bonds are posted within 1 to 2 hours of receiving the paperwork.'
    },
    {
        question: 'What happens if someone misses their First Appearance?',
        answer:
            'If a defendant is in custody and misses First Appearance, it typically means the hearing was rescheduled or delayed by the facility. If the defendant is out on bail and fails to appear at any scheduled court date, the judge will issue a Failure to Appear warrant, revoke the bond, and the defendant will be re-arrested.'
    },
    {
        question: 'Does Shamrock Bail Bonds handle all Florida counties?',
        answer:
            "Yes. Shamrock Bail Bonds serves all 67 Florida counties. Our Fort Myers office specializes in Southwest Florida (Lee, Collier, Charlotte, Hendry, DeSoto, Sarasota, Manatee), but we process bonds statewide — including Orange, Hillsborough, Palm Beach, Broward, and Miami-Dade. A $125 transfer fee applies for counties outside Lee and Charlotte, waived for bonds over $25,000."
    }
];

// ─── PAGE INIT ────────────────────────────────────────────────────────────────

$w.onReady(function () {
    console.log('🟢 First Appearance hub (h4fpl) loading…');

    // CRITICAL: set crawlable SEO synchronously so Google never sees a blank/500 title
    // if this page successfully loads. (If the router 500s, this file never runs.)
    const focusSlug = resolveFocusSlug();
    setupSEO(focusSlug);
    injectCrawlableCopy(focusSlug);
    setupEmbed(focusSlug);
    sendCountyData(focusSlug);
    trackPageView();

    console.log('✅ First Appearance hub ready', focusSlug ? `(focus: ${focusSlug})` : '');
});

/**
 * County deep-link: /first-appearance/polk  OR  /first-appearance?county=polk
 * Router only has one page (hub + embed); slug focuses that county in the grid.
 */
function resolveFocusSlug() {
    try {
        const q = (wixLocation.query && (wixLocation.query.county || wixLocation.query.c)) || '';
        if (q) {
            return String(q)
                .toLowerCase()
                .trim()
                .replace(/-county$/i, '')
                .replace(/\s+county$/i, '')
                .replace(/\s+/g, '-');
        }
    } catch (_) { /* ignore */ }

    try {
        // Under custom router, path is usually ['polk'] for /first-appearance/polk
        const path = wixLocation.path || [];
        const segs = path
            .map((s) => String(s || '').toLowerCase())
            .filter((s) => s && s !== 'first-appearance' && s !== 'first-appearance-hub');
        if (segs.length) {
            return segs[0].replace(/-county$/i, '');
        }
    } catch (_) { /* ignore */ }

    return '';
}

// ─── HTML EMBED SETUP ─────────────────────────────────────────────────────────

function getEmbed() {
    try {
        return $w(EMBED_ID);
    } catch (_) {
        return null;
    }
}

function setupEmbed(focusSlug) {
    const embed = getEmbed();
    if (!embed) {
        console.warn(
            '[firstAppearanceEmbed] Not found — add HtmlComponent with ID firstAppearanceEmbed on this page'
        );
        return;
    }

    try {
        try {
            embed.style.height = '2200px';
        } catch (_) { /* style may be locked */ }

        const embedUrl = buildEmbedUrl(focusSlug);
        embed.src = embedUrl;
        console.log('🔗 Embed URL set:', embedUrl);

        if (typeof embed.onMessage !== 'function') {
            console.warn('[firstAppearanceEmbed] onMessage unavailable');
            return;
        }

        embed.onMessage((event) => {
            const msg = normalizeMessage(event && event.data);
            if (!msg || !msg.type) return;

            switch (msg.type) {
                case 'setHeight':
                case 'RESIZE':
                    handleResize(msg.height);
                    break;
                case 'CTA_CLICK':
                    handleCtaClick(msg);
                    break;
                case 'FAQ_EXPAND':
                    handleFaqExpand(msg);
                    break;
                case 'COUNTY_SEARCH':
                    handleCountySearch(msg);
                    break;
                case 'SCROLL_DEPTH':
                    handleScrollDepth(msg);
                    break;
                default:
                    break;
            }
        });
    } catch (e) {
        console.warn('[firstAppearanceEmbed] setup failed:', e.message || e);
    }
}

function normalizeMessage(raw) {
    if (raw == null) return null;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch (_) {
            return null;
        }
    }
    if (raw.type) return raw;
    if (raw.data && typeof raw.data === 'object' && raw.data.type) return raw.data;
    return raw;
}

// ─── EMBED AUTO-RESIZE ───────────────────────────────────────────────────────

function handleResize(height) {
    const h = typeof height === 'string' ? parseFloat(height) : Number(height);
    if (!h || !isFinite(h) || h < 100) return;

    const embed = getEmbed();
    if (!embed) return;

    const px = Math.min(Math.max(Math.ceil(h), 600), 14000);
    try {
        embed.style.height = `${px}px`;
    } catch (e) {
        console.warn('Resize error:', e.message);
    }
}

// ─── SEND COUNTY DATA TO EMBED ──────────────────────────────────────────────

/**
 * Try browser geolocation so nearest counties sort first.
 * Fails soft (permission denied / timeout) → catalog falls back to tier order.
 */
async function getVisitorLocation() {
    try {
        if (typeof wixWindow.getCurrentGeolocation !== 'function') return null;
        const geo = await Promise.race([
            wixWindow.getCurrentGeolocation(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('geo timeout')), 6000))
        ]);
        const lat = geo && (geo.coords ? geo.coords.latitude : geo.latitude);
        const lon = geo && (geo.coords ? geo.coords.longitude : geo.longitude);
        if (lat != null && lon != null && isFinite(Number(lat)) && isFinite(Number(lon))) {
            return { lat: Number(lat), lon: Number(lon) };
        }
    } catch (e) {
        console.log('📍 Geolocation unavailable (using SWFL-first order):', e.message || e);
    }
    return null;
}

function postCountiesToEmbed(result) {
    try {
        const embed = getEmbed();
        if (!embed || typeof embed.postMessage !== 'function') return;
        embed.postMessage({
            type: 'updateCounties',
            data: result.counties,
            sortedBy: result.sortedBy || 'tier',
            userLocation: result.userLocation || null,
            totalCounties: result.totalCounties || result.counties.length
        });
        console.log(
            `📊 Sent ${result.counties.length} county schedules to embed (sortedBy=${result.sortedBy || 'tier'})`
        );
    } catch (e) {
        console.warn('Failed to post county data to embed:', e.message);
    }
}

/** Focus a county card in the embed (query, path slug, or explicit). */
function focusCountyInEmbed(slug) {
    if (!slug) return;
    const push = () => {
        try {
            const embed = getEmbed();
            if (!embed || typeof embed.postMessage !== 'function') return;
            embed.postMessage({ type: 'focusCounty', slug });
        } catch (e) {
            console.warn('focusCounty post failed:', e.message);
        }
    };
    setTimeout(push, 800);
    setTimeout(push, 1800);
    setTimeout(push, 3200);
}

async function sendCountyData(focusSlug) {
    try {
        // 1) Immediate fetch without geo so embed gets all 67 quickly
        const initial = await getFirstAppearanceSchedules({});
        if (initial && initial.success && Array.isArray(initial.counties) && initial.counties.length > 0) {
            setTimeout(() => postCountiesToEmbed(initial), 600);
            setTimeout(() => postCountiesToEmbed(initial), 1800);
        }

        focusCountyInEmbed(focusSlug);

        // 2) Re-sort nearest-first once location is available (skip re-sort if user deep-linked a county)
        const loc = await getVisitorLocation();
        if (!loc) return;

        const near = await getFirstAppearanceSchedules({ lat: loc.lat, lon: loc.lon });
        if (near && near.success && Array.isArray(near.counties) && near.counties.length > 0) {
            postCountiesToEmbed(near);
            setTimeout(() => postCountiesToEmbed(near), 500);
            focusCountyInEmbed(focusSlug);
        }
    } catch (e) {
        console.warn('County data fetch failed (embed will use fallback data):', e.message);
    }
}

// ─── EVENT HANDLERS (from embed postMessage) ────────────────────────────────

async function handleCtaClick(msg) {
    const actionMap = {
        phone: 'phone_click',
        online: 'start_online',
        zoom: 'zoom_join',
        livestream: 'livestream_watch',
        courthouse: 'courthouse_info',
        directory: 'directory_click'
    };

    const actionType = actionMap[msg.action] || msg.action;
    console.log(`📞 CTA Click: ${actionType}`, msg.county || '');

    try {
        await trackFirstAppearanceAction(actionType, {
            county: msg.county || null,
            buttonId: msg.buttonId || null,
            device: wixWindow.formFactor || 'Unknown'
        });
    } catch (e) {
        console.warn('CTA tracking failed:', e.message);
    }
}

async function handleFaqExpand(msg) {
    try {
        await trackFirstAppearanceAction('faq_expand', {
            question: msg.question || null,
            device: wixWindow.formFactor || 'Unknown'
        });
    } catch (e) {
        // Non-critical
    }
}

async function handleCountySearch(msg) {
    try {
        await trackFirstAppearanceAction('county_search', {
            searchTerm: msg.term || null,
            resultsCount: msg.resultsCount || 0,
            device: wixWindow.formFactor || 'Unknown'
        });
    } catch (e) {
        // Non-critical
    }
}

async function handleScrollDepth(msg) {
    try {
        await trackFirstAppearanceAction('page_scroll_depth', {
            depth: msg.depth || 0,
            device: wixWindow.formFactor || 'Unknown'
        });
    } catch (e) {
        // Non-critical
    }
}

// ─── PAGE VIEW TRACKING ──────────────────────────────────────────────────────

async function trackPageView() {
    try {
        await trackFirstAppearancePageView({
            device: wixWindow.formFactor || 'Unknown',
            referrer: wixWindow.referrer || null
        });
    } catch (e) {
        console.warn('Page view tracking failed:', e.message);
    }
}

function injectCrawlableCopy(focusSlug) {
    const pretty = focusSlug
        ? focusSlug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Florida';
    const intro = focusSlug
        ? `${pretty} County First Appearance is held within 24 hours of arrest under Florida Rule of Criminal Procedure 3.130. Shamrock Bail Bonds posts the bond 24/7 at (239) 332-2245.`
        : 'Florida First Appearance hearings must occur within 24 hours of arrest. Shamrock Bail Bonds covers all 67 counties. Call (239) 332-2245 as soon as bond is set.';
    const faqText = FAQ_DATA.map((f) => `${f.question} ${f.answer}`).join(' ');
    const ids = ['#seoBody', '#crawlableCopy', '#faIntro', '#pageIntro', '#textSEO'];
    for (const id of ids) {
        try {
            const el = $w(id);
            if (el && typeof el.text === 'string') {
                el.text = `${intro} ${faqText}`;
                el.expand();
                return;
            }
        } catch (e) { /* optional SEO block */ }
    }
}

// ─── SEO ──────────────────────────────────────────────────────────────────────
// Full SEO stack for Google: title, meta, canonical, OG, Twitter, JSON-LD.
// Runs synchronously in onReady so SSR/crawlers get indexable tags when the
// page successfully loads (router must not 500 first).

function setupSEO(focusSlug) {
    try {
        let title = PAGE_TITLE;
        let desc = PAGE_DESC;
        let url = PAGE_URL;
        if (focusSlug) {
            const name = focusSlug
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            title = `First Appearance Hearing in ${name} County, FL | Shamrock Bail Bonds`;
            desc = `${name} County First Appearance schedule, location, and live feed if available. Serving all 67 Florida counties. Call (239) 332-2245.`;
            url = `${PAGE_URL}/${encodeURIComponent(focusSlug)}`;
        }

        wixSeo.setTitle(title);

        wixSeo.setMetaTags([
            { name: 'description', content: desc },
            {
                name: 'robots',
                content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
            },
            {
                name: 'keywords',
                content:
                    'first appearance hearing Florida, first appearance court date, Florida bail hearing, bond set at first appearance, Lee County first appearance, Collier County first appearance, 24 hour bail bonds Florida, live court stream Florida, Shamrock Bail Bonds'
            },
            { property: 'og:title', content: title },
            { property: 'og:description', content: desc },
            { property: 'og:url', content: url },
            { property: 'og:type', content: 'article' },
            { property: 'og:image', content: OG_IMAGE },
            { property: 'og:site_name', content: 'Shamrock Bail Bonds' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: desc },
            { name: 'twitter:image', content: OG_IMAGE }
        ]);

        wixSeo.setLinks([{ rel: 'canonical', href: url }]);

        wixSeo
            .setStructuredData([
                buildBreadcrumbSchema(),
                buildFaqSchema(),
                buildArticleSchema(),
                buildLegalServiceSchema(),
                buildLocalBusinessSchema()
            ])
            .then(() => console.log('✅ SEO: Full structured data set (h4fpl hub)', focusSlug || ''))
            .catch((err) => console.error('❌ SEO setStructuredData error:', err));
    } catch (err) {
        console.error('❌ SEO setup error:', err);
    }
}

// ─── SCHEMA BUILDERS ─────────────────────────────────────────────────────────

function buildBreadcrumbSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.shamrockbailbonds.biz/'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'First Appearance Hearing Guide',
                item: PAGE_URL
            }
        ]
    };
}

function buildFaqSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['.faq-question', '.faq-answer-inner', 'h1', 'h2', '.section-subtitle']
        },
        mainEntity: FAQ_DATA.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: f.answer
            }
        }))
    };
}

function buildArticleSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Florida First Appearance Hearing Guide: What Families Need to Know',
        description:
            'A complete guide to First Appearance hearings in Florida — what happens, how bail is set, and how to get your loved one released fast. Includes live court stream links for multiple counties.',
        url: PAGE_URL,
        datePublished: '2024-01-15',
        dateModified: '2026-08-06',
        wordCount: 4200,
        author: {
            '@type': 'Organization',
            name: 'Shamrock Bail Bonds',
            '@id': 'https://www.shamrockbailbonds.biz/#organization'
        },
        publisher: {
            '@type': 'Organization',
            name: 'Shamrock Bail Bonds',
            logo: {
                '@type': 'ImageObject',
                url: LOGO_URL
            }
        },
        speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: ['h1', 'h2', '.section-subtitle', '.hero .subtitle']
        },
        about: [
            {
                '@type': 'Thing',
                name: 'First Appearance Hearing',
                description:
                    'The initial court proceeding within 24 hours of arrest where bail is set under Florida Rule of Criminal Procedure 3.130'
            },
            {
                '@type': 'Thing',
                name: 'Bail Bonds',
                description: "Surety bonds used to secure a defendant's release from jail pending trial"
            }
        ],
        mentions: [
            {
                '@type': 'LegalService',
                name: 'Shamrock Bail Bonds',
                url: 'https://www.shamrockbailbonds.biz/'
            },
            { '@type': 'Thing', name: 'Florida Rule of Criminal Procedure 3.130' },
            { '@type': 'Thing', name: 'Florida Statute 903' }
        ]
    };
}

function buildLegalServiceSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'LegalService',
        name: 'Shamrock Bail Bonds — First Appearance Bond Services',
        '@id': 'https://www.shamrockbailbonds.biz/#organization',
        url: PAGE_URL,
        description:
            "Professional bail bond services for defendants attending First Appearance hearings across all 67 Florida counties. Available 24/7. 10% premium. Payment plans available.",
        telephone: '+1-239-332-2245',
        priceRange: '$$',
        image: LOGO_URL,
        areaServed: {
            '@type': 'State',
            name: 'Florida',
            containedInPlace: { '@type': 'Country', name: 'United States' }
        },
        serviceType: 'Bail Bond Service',
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'First Appearance Bail Bond Services',
            itemListElement: [
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Surety Bail Bonds at First Appearance',
                        description:
                            'Post bail immediately after the judge sets the bond amount at First Appearance. 10% premium, payment plans available.'
                    }
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Remote Bail Posting (Any County)',
                        description:
                            "Post bail in any of Florida's 67 counties without traveling. Fully digital paperwork and e-signing."
                    }
                }
            ]
        }
    };
}

function buildLocalBusinessSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': 'https://www.shamrockbailbonds.biz/#organization',
        name: 'Shamrock Bail Bonds, LLC',
        image: LOGO_URL,
        logo: { '@type': 'ImageObject', url: LOGO_URL },
        telephone: '+1-239-332-2245',
        url: 'https://www.shamrockbailbonds.biz/',
        priceRange: '$$',
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday'
            ],
            opens: '00:00',
            closes: '23:59'
        },
        address: {
            '@type': 'PostalAddress',
            streetAddress: '1528 Broadway',
            addressLocality: 'Fort Myers',
            addressRegion: 'FL',
            postalCode: '33901',
            addressCountry: 'US'
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 26.6406,
            longitude: -81.8723
        },
        areaServed: [
            { '@type': 'State', name: 'Florida' },
            { '@type': 'AdministrativeArea', name: 'Lee County' },
            { '@type': 'AdministrativeArea', name: 'Collier County' },
            { '@type': 'AdministrativeArea', name: 'Charlotte County' },
            { '@type': 'AdministrativeArea', name: 'Hendry County' },
            { '@type': 'AdministrativeArea', name: 'DeSoto County' },
            { '@type': 'AdministrativeArea', name: 'Manatee County' },
            { '@type': 'AdministrativeArea', name: 'Sarasota County' }
        ],
        sameAs: [
            'https://www.facebook.com/ShamrockBail',
            'https://www.instagram.com/shamrock_bail_bonds',
            'https://t.me/ShamrockBail_bot'
        ],
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            bestRating: '5',
            reviewCount: '150'
        }
    };
}
