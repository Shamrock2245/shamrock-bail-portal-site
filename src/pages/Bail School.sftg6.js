/**
 * Shamrock Bail Bonds — Bail School Page
 * URL: /bail-school
 *
 * ARCHITECTURE:
 *  Public UI lives in the Netlify HtmlComponent embed:
 *    https://shamrock-embeds.netlify.app/bail-school.html
 *
 *  This Velo file:
 *    1. Points #bailSchoolEmbed at the cache-busted embed URL
 *    2. Auto-resizes the iframe from embed height postMessages
 *    3. Handles newsletter interest signups from the embed
 *    4. Injects full page SEO (title/meta/OG) + Course/FAQ/Breadcrumb schema
 *
 * ELEMENT IDs (Wix Editor):
 *    #bailSchoolEmbed — HtmlComponent (URL mode)
 *
 * CATALOG SOURCE OF TRUTH:
 *    shamrock-bail-school/lib/courses.ts
 *    netlify-embeds/bail-school.html (COURSES + PROGRAMS_CONFIG)
 *
 * postMessage contract (embed → page):
 *    { type: 'setHeight'|'RESIZE', height: number }
 *    { type: 'SUBSCRIBE_EMAIL'|'bailSchoolNotify', email: string, name?: string }
 *    { type: 'EXPLORE_PROGRAMS' }
 *
 * postMessage contract (page → embed):
 *    { type: 'SUBSCRIBE_SUCCESS', email }
 *    { type: 'SUBSCRIBE_ERROR', message }
 *    { type: 'scrollToSection', sectionId }
 */

import wixSeo from 'wix-seo';
import { submitBailSchoolInterest } from 'backend/bailSchoolInterest';

// ─── EMBED CONFIG ─────────────────────────────────────────────────────────────
// Bump EMBED_VERSION after every Netlify redeploy of bail-school.html
const EMBED_VERSION = '2026-08-06-catalog-v3';
const EMBED_BASE = 'https://shamrock-embeds.netlify.app/bail-school.html';
const EMBED_URL = `${EMBED_BASE}?v=${encodeURIComponent(EMBED_VERSION)}`;
const EMBED_ID = '#bailSchoolEmbed';

const PAGE_URL = 'https://www.shamrockbailbonds.biz/bail-school';
const PAGE_TITLE = 'Shamrock Bail School | 20-Hour & 120-Hour Florida Pre-Licensing';
const PAGE_DESC =
    'Enroll in Shamrock Bail School: 20-Hour Correspondence Course ($199) and 120-Hour Pre-Licensing ($649) with State Exam Simulator & Bail Mentor AI. FLDFS Provider #648-FL (pending approval). Call (239) 332-2245.';
const LOGO_URL = 'https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png';
const SCHOOL_ORIGIN = 'https://school.shamrockbailbonds.biz';

/**
 * Canonical catalog — must stay in lockstep with shamrock-bail-school/lib/courses.ts
 */
const COURSES = {
    '20hr': {
        id: '20hr',
        name: '20-Hour Correspondence Pre-Licensing',
        shortName: '20-Hour Course',
        price: 199,
        listPrice: 299,
        dashboardPath: '/dashboard/correspondence',
        paymentUrl: 'https://swipesimple.com/links/lnk_e7afc13b2c48a8f3a08ed7d8059b6a51',
        mode: 'online',
        workload: 'PT20H'
    },
    '120hr': {
        id: '120hr',
        name: '120-Hour Basic Certification Training',
        shortName: '120-Hour Course',
        price: 649,
        listPrice: 1200,
        dashboardPath: '/dashboard/120hr',
        paymentUrl: 'https://swipesimple.com/links/lnk_d26efb5d83e121cdf8354402893b9c96',
        mode: 'blended',
        workload: 'PT120H',
        scheduleUrl: `${SCHOOL_ORIGIN}/schedule`
    },
    simulator: {
        id: 'simulator',
        name: 'Bail School Flashcards & State Test Simulator Access',
        shortName: 'Simulator & Flashcard Pass',
        price: 49,
        listPrice: 99,
        dashboardPath: '/dashboard/simulator',
        paymentUrl: 'https://swipesimple.com/links/lnk_25a615b543a1260805bbbe3001a24dea',
        mode: 'online',
        workload: undefined
    }
};

// Back-compat alias used by older snippets
const COURSE_PRICES = {
    '20hr': { price: String(COURSES['20hr'].price), listPrice: String(COURSES['20hr'].listPrice), paymentUrl: COURSES['20hr'].paymentUrl },
    '120hr': { price: String(COURSES['120hr'].price), listPrice: String(COURSES['120hr'].listPrice), paymentUrl: COURSES['120hr'].paymentUrl },
    simulator: { price: String(COURSES.simulator.price), listPrice: String(COURSES.simulator.listPrice), paymentUrl: COURSES.simulator.paymentUrl }
};

// ─── FAQ (SEO schema — keep aligned with embed FAQ_DATA) ─────────────────────

const FAQ_DATA = [
    {
        question: 'What is Shamrock Bail School?',
        answer: `Shamrock Bail School is the education division of Shamrock Bail Bonds. We offer Florida pre-licensing programs: a 20-Hour Correspondence Course ($${COURSES['20hr'].price}) and a 120-Hour Basic Certification Training ($${COURSES['120hr'].price}) that includes a 1-year State Exam Simulator and Bail Mentor AI pass.`
    },
    {
        question: 'Do I need any prior experience?',
        answer: 'No prior industry experience is required. Both programs are designed for new students. Florida licensure still requires age 18+, a high school diploma or GED, U.S. citizenship or legal residency, and a clean background check.'
    },
    {
        question: 'How much does the 120-hour course cost?',
        answer: `The 120-Hour Pre-Licensing Course is $${COURSES['120hr'].price} (list $${COURSES['120hr'].listPrice.toLocaleString('en-US')}) via secure SwipeSimple checkout. Tuition includes 1-year access to the State Exam Simulator and Bail Mentor AI. View cohort dates at school.shamrockbailbonds.biz/schedule.`
    },
    {
        question: 'How much is the 20-Hour Correspondence Course?',
        answer: `The 20-Hour Correspondence Pre-Licensing Course is $${COURSES['20hr'].price} (list $${COURSES['20hr'].listPrice}). It is fully online and self-paced with automated FLDFS statutory time tracking.`
    },
    {
        question: 'Do I get a certificate?',
        answer: 'Yes. Completing either pre-licensing course provides an official digital certificate. The 120-Hour program prepares you to sit for the Florida DFS state licensing exam.'
    },
    {
        question: 'Can I take courses from anywhere in Florida?',
        answer: 'Yes. The 20-Hour Correspondence Course is fully online and self-paced. The 120-Hour Course uses live interactive webinars and hybrid cohorts.'
    },
    {
        question: 'Is the State Exam Simulator included?',
        answer: `Yes. The 120-Hour Course includes a free 1-year Bail Mentor AI and State Exam Simulator pass. A standalone simulator pass is also available for $${COURSES.simulator.price}.`
    },
    {
        question: 'How do I become a licensed bail bondsman in Florida?',
        answer: 'Florida requires completing a state-approved 120-hour pre-licensing course, passing the DFS state exam, obtaining a surety appointment, and completing a supervised internship. Our 120-Hour Basic Certification Training covers the pre-licensing curriculum and exam prep.'
    }
];

// ─── PAGE INIT ────────────────────────────────────────────────────────────────

$w.onReady(function () {
    console.log('🟢 Bail School page loading…');

    setupSeoMeta();
    setupEmbed();
    injectSeoSchema();

    console.log('✅ Bail School page ready');
});

// ─── SEO META (page-level, not just JSON-LD) ──────────────────────────────────

function setupSeoMeta() {
    try {
        wixSeo.setTitle(PAGE_TITLE);
        wixSeo.setDescription(PAGE_DESC);
        wixSeo.setMetaTags([
            { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
            { name: 'author', content: 'Shamrock Bail Bonds' },
            { property: 'og:type', content: 'website' },
            { property: 'og:title', content: PAGE_TITLE },
            { property: 'og:description', content: PAGE_DESC },
            { property: 'og:url', content: PAGE_URL },
            { property: 'og:image', content: LOGO_URL },
            { property: 'og:site_name', content: 'Shamrock Bail Bonds' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: PAGE_TITLE },
            { name: 'twitter:description', content: PAGE_DESC },
            { name: 'twitter:image', content: LOGO_URL }
        ]);
        if (typeof wixSeo.setLinks === 'function') {
            wixSeo.setLinks([{ rel: 'canonical', href: PAGE_URL }]);
        }
        console.log('✅ SEO meta set');
    } catch (err) {
        console.error('❌ SEO meta error:', err);
    }
}

// ─── EMBED SETUP ─────────────────────────────────────────────────────────────

function getEmbed() {
    try {
        return $w(EMBED_ID);
    } catch (_) {
        return null;
    }
}

function setupEmbed() {
    const embed = getEmbed();
    if (!embed) {
        console.warn(`⚠️ ${EMBED_ID} not found — add an HtmlComponent with this ID in the Wix Editor`);
        return;
    }

    try {
        // Initial height so page is usable before first postMessage
        try {
            embed.style.height = '2400px';
        } catch (_) { /* style may be locked in some contexts */ }

        embed.src = EMBED_URL;
        console.log('🔗 Bail School embed URL:', EMBED_URL);

        if (typeof embed.onMessage === 'function') {
            embed.onMessage((event) => {
                const data = normalizeMessage(event && event.data);
                if (!data || !data.type) return;

                console.log('📨 embed → page:', data.type);

                switch (data.type) {
                    case 'setHeight':
                    case 'RESIZE':
                        handleResize(data.height);
                        break;
                    case 'SUBSCRIBE_EMAIL':
                    case 'bailSchoolNotify':
                        handleEmailSubscription(data.email, data.name);
                        break;
                    case 'EXPLORE_PROGRAMS':
                        postToEmbed({ type: 'scrollToSection', sectionId: 'programs' });
                        break;
                    default:
                        // Ignore unknown types quietly (forward-compat)
                        break;
                }
            });
        } else {
            console.warn('⚠️ embed.onMessage unavailable on this HtmlComponent');
        }

    } catch (err) {
        console.error('❌ Embed setup failed:', err);
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

    // HtmlComponent sometimes nests: { data: { type, ... } }
    if (raw.type) return raw;
    if (raw.data && typeof raw.data === 'object') {
        if (raw.data.type) return raw.data;
        // Some hosts: { data: "{\"type\":...}" }
        if (typeof raw.data === 'string') {
            try {
                return JSON.parse(raw.data);
            } catch (_) {
                return null;
            }
        }
    }
    return raw;
}

// ─── RESIZE ──────────────────────────────────────────────────────────────────

function handleResize(height) {
    const h = typeof height === 'string' ? parseFloat(height) : Number(height);
    if (!h || !isFinite(h) || h < 100) return;

    const embed = getEmbed();
    if (!embed) return;

    // Clamp: min usable viewport, max prevents runaway FAQ expansion bugs
    const px = Math.min(Math.max(Math.ceil(h), 600), 14000);

    try {
        embed.style.height = `${px}px`;
    } catch (err) {
        console.error('❌ Resize error:', err);
    }
}

// ─── EMAIL / INTEREST ────────────────────────────────────────────────────────

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

let _subscribeInFlight = false;

async function handleEmailSubscription(email, name) {
    const cleaned = String(email || '').trim().toLowerCase();
    if (!isValidEmail(cleaned)) {
        postToEmbed({ type: 'SUBSCRIBE_ERROR', message: 'Please enter a valid email address' });
        return;
    }
    if (_subscribeInFlight) return;
    _subscribeInFlight = true;

    console.log('📧 Bail School interest:', cleaned);

    try {
        const result = await submitBailSchoolInterest({
            email: cleaned,
            name: name || '',
            source: 'Bail School page embed'
        });
        const payload = result || {};
        const ok = payload.success === true || payload.ok === true;

        if (ok) {
            postToEmbed({ type: 'SUBSCRIBE_SUCCESS', email: cleaned });
            console.log('✅ Interest saved');
        } else {
            postToEmbed({
                type: 'SUBSCRIBE_ERROR',
                message: payload.message || 'Unable to subscribe right now. Call (239) 332-2245.'
            });
        }
    } catch (err) {
        console.error('❌ Subscription error:', err);
        postToEmbed({
            type: 'SUBSCRIBE_ERROR',
            message: 'Server error. Please try again or call (239) 332-2245.'
        });
    } finally {
        _subscribeInFlight = false;
    }
}

function postToEmbed(msg) {
    const embed = getEmbed();
    if (!embed || typeof embed.postMessage !== 'function') return;
    try {
        embed.postMessage(msg);
    } catch (err) {
        console.error('❌ postMessage to embed failed:', err);
    }
}

// ─── STRUCTURED DATA ─────────────────────────────────────────────────────────

function injectSeoSchema() {
    try {
        const org = {
            '@type': 'Organization',
            name: 'Shamrock Bail Bonds',
            url: 'https://www.shamrockbailbonds.biz',
            logo: LOGO_URL,
            telephone: '+1-239-332-2245',
            sameAs: [
                'https://www.shamrockbailbonds.biz',
                SCHOOL_ORIGIN
            ]
        };

        const faqSchema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_DATA.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer
                }
            }))
        };

        const course20hrSchema = {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: COURSES['20hr'].name,
            description:
                'Self-paced Florida pre-licensing correspondence course with statutory time tracking, quizzes, final exam, and digital certificate. FLDFS Provider #648-FL (pending course approval).',
            provider: org,
            offers: {
                '@type': 'Offer',
                price: String(COURSES['20hr'].price),
                priceCurrency: 'USD',
                url: COURSES['20hr'].paymentUrl,
                availability: 'https://schema.org/InStock',
                category: 'Pre-Licensing'
            },
            hasCourseInstance: [
                {
                    '@type': 'CourseInstance',
                    courseMode: COURSES['20hr'].mode,
                    courseWorkload: COURSES['20hr'].workload
                }
            ]
        };

        const course120hrSchema = {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: COURSES['120hr'].name,
            description:
                'Complete 120-hour Florida bail bond pre-licensing with live webinars, hybrid cohorts, and bundled 1-year State Exam Simulator & Bail Mentor AI. FLDFS Provider #648-FL (pending course approval).',
            provider: org,
            offers: {
                '@type': 'Offer',
                price: String(COURSES['120hr'].price),
                priceCurrency: 'USD',
                url: COURSES['120hr'].paymentUrl,
                availability: 'https://schema.org/InStock',
                category: 'Pre-Licensing'
            },
            hasCourseInstance: [
                {
                    '@type': 'CourseInstance',
                    courseMode: COURSES['120hr'].mode,
                    courseWorkload: COURSES['120hr'].workload,
                    location: {
                        '@type': 'Place',
                        name: 'Shamrock Bail Bonds — Fort Myers',
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: '1528 Broadway',
                            addressLocality: 'Fort Myers',
                            addressRegion: 'FL',
                            postalCode: '33901',
                            addressCountry: 'US'
                        }
                    }
                }
            ]
        };

        const simulatorSchema = {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: COURSES.simulator.name,
            description:
                'Standalone 1-year pass for Bail Mentor AI, Pearson VUE–style state exam simulator, and master flashcards. Included free with 120-Hour enrollment.',
            provider: org,
            offers: {
                '@type': 'Offer',
                price: String(COURSES.simulator.price),
                priceCurrency: 'USD',
                url: COURSES.simulator.paymentUrl,
                availability: 'https://schema.org/InStock'
            }
        };

        const eduOrgSchema = {
            '@context': 'https://schema.org',
            '@type': 'EducationalOrganization',
            name: 'Shamrock Bail School',
            url: PAGE_URL,
            description: PAGE_DESC,
            parentOrganization: org,
            address: {
                '@type': 'PostalAddress',
                streetAddress: '1528 Broadway',
                addressLocality: 'Fort Myers',
                addressRegion: 'FL',
                postalCode: '33901',
                addressCountry: 'US'
            },
            telephone: '+1-239-332-2245'
        };

        const breadcrumbSchema = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.shamrockbailbonds.biz' },
                { '@type': 'ListItem', position: 2, name: 'Bail School', item: PAGE_URL }
            ]
        };

        wixSeo.setStructuredData([
            eduOrgSchema,
            faqSchema,
            course20hrSchema,
            course120hrSchema,
            simulatorSchema,
            breadcrumbSchema
        ]);
        console.log('✅ Structured data injected (EduOrg, FAQ, Courses, Breadcrumb)');
    } catch (err) {
        console.error('❌ SEO schema injection error:', err);
    }
}

// Trigger Wix CLI Sync: 3
// Expose for debugging in Preview console if needed
// eslint-disable-next-line no-unused-vars
const _BAIL_SCHOOL_DEBUG = { COURSES, COURSE_PRICES, EMBED_URL, FAQ_DATA };
