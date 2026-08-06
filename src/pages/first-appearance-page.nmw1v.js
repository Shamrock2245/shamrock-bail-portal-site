/**
 * First Appearance county pSEO page
 * File: first-appearance-page.nmw1v.js
 * URL:  /first-appearance/{county-slug}
 *
 * Populates schedule, livestream/Zoom access, FAQs, and SEO for every
 * Florida county using backend/first-appearance-api.jsw.
 *
 * Element IDs are resilient — missing Editor elements are skipped.
 */

import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixSeo from 'wix-seo';
import {
    generateFirstAppearanceCountyPage,
    trackFirstAppearancePageView
} from 'backend/first-appearance-api';

const HUB_URL = '/first-appearance-hub';
const PHONE = 'tel:+12393322245';
const PHONE_DISPLAY = '(239) 332-2245';

const Select = (selector) => {
    try {
        return /** @type {any} */ ($w)(selector);
    } catch (_) {
        return null;
    }
};

function setText(ids, text) {
    if (text == null || text === '') return;
    const list = Array.isArray(ids) ? ids : [ids];
    for (const id of list) {
        try {
            const el = Select(id);
            if (el && typeof el.text === 'string') el.text = String(text);
            else if (el && 'html' in el && typeof el.html === 'string') el.html = String(text);
        } catch (_) {
            /* skip */
        }
    }
}

function setLink(ids, href) {
    if (!href) return;
    const list = Array.isArray(ids) ? ids : [ids];
    for (const id of list) {
        try {
            const el = Select(id);
            if (el) el.link = href;
        } catch (_) {
            /* skip */
        }
    }
}

function expand(ids) {
    const list = Array.isArray(ids) ? ids : [ids];
    for (const id of list) {
        try {
            const el = Select(id);
            if (el && typeof el.expand === 'function') el.expand();
            if (el && typeof el.show === 'function') el.show();
        } catch (_) {
            /* skip */
        }
    }
}

function collapse(ids) {
    const list = Array.isArray(ids) ? ids : [ids];
    for (const id of list) {
        try {
            const el = Select(id);
            if (el && typeof el.collapse === 'function') el.collapse();
        } catch (_) {
            /* skip */
        }
    }
}

function normalizeSlug(raw) {
    return String(raw || '')
        .toLowerCase()
        .trim()
        .replace(/-county$/i, '')
        .replace(/\s+county$/i, '')
        .replace(/\s+/g, '-');
}

function extractSlug() {
    const path = wixLocation.path || [];
    // Router paths: ["lee"] or sometimes full segments
    for (let i = path.length - 1; i >= 0; i--) {
        const seg = path[i];
        if (seg && seg !== 'first-appearance') return normalizeSlug(seg);
    }
    const q = wixLocation.query || {};
    if (q.county || q.c) return normalizeSlug(q.county || q.c);
    return '';
}

$w.onReady(async function () {
    console.log('🟢 First Appearance county page loading…');

    const slug = extractSlug();
    if (!slug) {
        console.warn('[FA County] No slug — redirecting to hub');
        wixLocation.to(HUB_URL);
        return;
    }

    try {
        const result = await generateFirstAppearanceCountyPage(slug);
        if (!result || !result.success || !result.data) {
            console.warn('[FA County] Not found:', slug, result && result.error);
            setText(['#countyName', '#heroTitle', '#pageTitle'], 'First Appearance — Florida');
            setText(
                ['#heroSubtitle', '#pageSubtitle'],
                'We serve all 67 counties. Call us for this county’s First Appearance schedule.'
            );
            setLink(['#heroCallBtn', '#callBtn', '#primaryCallBtn'], PHONE);
            setLink(['#hubLink', '#backToHubBtn'], HUB_URL);
            expand(['#countyContent', '#heroSection']);
            return;
        }

        const d = result.data;
        await setupSEO(d);
        populateUI(d, slug);
        trackFirstAppearancePageView({
            device: wixWindow.formFactor || 'Unknown',
            county: d.county_slug || slug,
            page: 'first-appearance-county'
        }).catch(() => {});

        console.log('✅ First Appearance county ready:', d.county_name);
    } catch (err) {
        console.error('[FA County] Critical error:', err);
        setText(['#countyName'], 'First Appearance Help');
        setLink(['#heroCallBtn'], PHONE);
    }
});

async function setupSEO(d) {
    const title = (d.seo && d.seo.meta_title) || `First Appearance ${d.county_name} County FL | Shamrock Bail Bonds`;
    const desc =
        (d.seo && d.seo.meta_description) ||
        `${d.county_name} County First Appearance schedule and bail help. Call ${PHONE_DISPLAY} 24/7.`;
    const canon = `https://www.shamrockbailbonds.biz${(d.seo && d.seo.canonical_url) || '/first-appearance/' + d.county_slug}`;

    try {
        wixSeo.setTitle(title);
        wixSeo.setMetaTags([
            { name: 'description', content: desc },
            { name: 'robots', content: 'index, follow' },
            { property: 'og:title', content: title },
            { property: 'og:description', content: desc },
            { property: 'og:url', content: canon },
            { property: 'og:type', content: 'article' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: desc }
        ]);
        wixSeo.setLinks([{ rel: 'canonical', href: canon }]);

        const faqs = (d.content && d.content.faq) || [];
        const schemas = [
            {
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
                        name: 'First Appearance',
                        item: 'https://www.shamrockbailbonds.biz' + HUB_URL
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: `${d.county_name} County`,
                        item: canon
                    }
                ]
            },
            {
                '@context': 'https://schema.org',
                '@type': 'WebPage',
                name: title,
                description: desc,
                url: canon
            }
        ];
        if (faqs.length) {
            schemas.push({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map((f) => ({
                    '@type': 'Question',
                    name: f.question,
                    acceptedAnswer: { '@type': 'Answer', text: f.answer }
                }))
            });
        }
        await wixSeo.setStructuredData(schemas);
    } catch (e) {
        console.warn('[FA County] SEO failed:', e.message || e);
    }
}

function populateUI(d, slug) {
    const name = d.county_name || 'Florida';
    const schedule = d.schedule || {};
    const content = d.content || {};
    const resources = d.resources || {};
    const links = d.links || {};

    setText(
        ['#countyName', '#heroTitle', '#pageTitle', '#faCountyName'],
        content.hero_headline || `First Appearance in ${name} County`
    );
    setText(
        ['#heroSubtitle', '#pageSubtitle', '#faSubtitle'],
        content.hero_subheadline || 'Know the schedule. Watch the hearing. Get bail posted fast.'
    );

    setText(['#scheduleTime', '#faSchedule', '#faTime'], schedule.time || schedule.schedule || 'Within 24 hours of arrest');
    setText(['#scheduleLocation', '#faLocation', '#courthouseLocation'], schedule.location || `${name} County Courthouse`);
    setText(['#scheduleNotes', '#faNotes'], schedule.notes || '');
    setText(['#accessType', '#faAccessType'], formatAccess(schedule.accessType));
    setText(['#aboutText', '#faAbout', '#countyAbout'], content.about || '');
    setText(['#whatToExpect', '#faWhatToExpect'], content.what_to_expect || '');
    setText(['#bailInfo', '#faBailInfo'], content.bail_info || '');
    setText(['#serviceAreas', '#faServiceAreas'], content.service_areas || '');
    setText(['#circuitText', '#faCircuit'], d.judicial_circuit || '');
    setText(['#countySeat', '#faCountySeat'], d.county_seat || '');

    const liveUrl = schedule.liveUrl || 'https://courtrooms.flcourts.gov/';
    setLink(['#liveStreamBtn', '#faLiveBtn', '#watchLiveBtn', '#zoomBtn'], liveUrl);
    setLink(['#heroCallBtn', '#callBtn', '#primaryCallBtn', '#stickyCallBtn'], PHONE);
    setLink(['#startOnlineBtn', '#onlineBtn'], '/portal-landing');
    setLink(['#hubLink', '#backToHubBtn', '#allCountiesFaBtn'], HUB_URL + '?county=' + encodeURIComponent(slug));
    setLink(
        ['#bailBondsCountyBtn', '#countyBailLink'],
        links.county_bail_page || `/florida-bail-bonds/${slug}`
    );
    setLink(['#inmateSearchBtn'], resources.inmate_search_url || '');
    setLink(['#clerkWebsiteBtn'], resources.clerk_website || '');
    setLink(['#courtRecordsBtn'], resources.court_records_url || '');

    // Button labels for live access
    const isLive = schedule.accessType === 'zoom' || schedule.accessType === 'livestream';
    setText(
        ['#liveStreamBtn', '#faLiveBtn', '#watchLiveBtn'],
        isLive
            ? schedule.accessType === 'zoom'
                ? 'Join Zoom Hearing'
                : 'Watch Live Stream'
            : 'Open FL Courts Directory'
    );

    populateFaqs(content.faq || []);
    expand(['#countyContent', '#heroSection', '#faContent', '#mainContent']);
}

function formatAccess(type) {
    switch (type) {
        case 'zoom':
            return 'Zoom / remote access';
        case 'livestream':
            return 'Livestream available';
        case 'inperson':
            return 'Primarily in-person';
        default:
            return 'Check FL Courts Directory';
    }
}

function populateFaqs(faqs) {
    if (!faqs || !faqs.length) return;

    // Try common repeater IDs
    const repeaterIds = ['#faqRepeater', '#faFaqRepeater', '#faqList'];
    for (const rid of repeaterIds) {
        try {
            const rep = Select(rid);
            if (!rep || typeof rep.onItemReady !== 'function') continue;

            rep.data = [];
            rep.onItemReady(($item, itemData) => {
                try {
                    const q = $item('#textQuestion') || $item('#faqQuestion') || $item('#question');
                    const a = $item('#textAnswer') || $item('#faqAnswer') || $item('#answer');
                    if (q) q.text = itemData.question || '';
                    if (a) a.text = itemData.answer || '';
                } catch (_) {
                    /* skip item */
                }
            });
            rep.data = faqs.map((f, i) => ({
                _id: `fa-faq-${i}`,
                question: f.question,
                answer: f.answer
            }));
            if (typeof rep.expand === 'function') rep.expand();
            expand(['#sectionFAQ', '#faqSection', '#faFaqSection']);
            return;
        } catch (_) {
            /* try next */
        }
    }

    // Fallback: dump first FAQ into static text if present
    setText(['#faqPreviewQuestion'], faqs[0].question);
    setText(['#faqPreviewAnswer'], faqs[0].answer);
}
