/**
 * Shamrock Bail Bonds — Bail School Page
 * URL: /bail-school
 *
 * ARCHITECTURE:
 *  The entire page UI is rendered inside a single HtmlComponent embed
 *  hosted at: https://shamrock-embeds.netlify.app/bail-school.html
 *
 *  This Velo file handles:
 *    1. Setting the embed URL (cache-busted)
 *    2. Auto-resizing the iframe based on content height
 *    3. Handling newsletter email subscriptions from the embed
 *    4. Injecting SEO structured data (FAQPage, Course ×2, Breadcrumb)
 *
 * ELEMENT IDs EXPECTED ON PAGE (set in Wix Editor):
 *    #bailSchoolEmbed   — HtmlComponent (URL mode)
 *
 * CATALOG SOURCE OF TRUTH:
 *    shamrock-bail-school/lib/courses.ts
 *    netlify-embeds/bail-school.html (PROGRAMS_CONFIG + COURSES)
 */

import wixSeo from 'wix-seo';
import { submitBailSchoolInterest } from 'backend/bailSchoolInterest';

// ─── EMBED CONFIG ─────────────────────────────────────────────────────────────
// Bump EMBED_VERSION when redeploying Netlify so HtmlComponent bypasses CDN/browser cache.
const EMBED_VERSION = '2026-08-06-catalog-v2';
const EMBED_URL = `https://shamrock-embeds.netlify.app/bail-school.html?v=${EMBED_VERSION}`;

// Canonical prices (must match shamrock-bail-school/lib/courses.ts)
const COURSE_PRICES = {
    '20hr': { price: '199', listPrice: '299', paymentUrl: 'https://swipesimple.com/links/lnk_e7afc13b2c48a8f3a08ed7d8059b6a51' },
    '120hr': { price: '649', listPrice: '1200', paymentUrl: 'https://swipesimple.com/links/lnk_d26efb5d83e121cdf8354402893b9c96' },
    simulator: { price: '49', listPrice: '99', paymentUrl: 'https://swipesimple.com/links/lnk_25a615b543a1260805bbbe3001a24dea' }
};

// ─── FAQ DATA (SEO schema — mirrored inside the embed FAQ_DATA) ───────────────

const FAQ_DATA = [
    {
        question: 'What is Shamrock Bail School?',
        answer: 'Shamrock Bail School is the education division of Shamrock Bail Bonds. We offer Florida pre-licensing programs: a 20-Hour Correspondence Course ($199) and a 120-Hour Basic Certification Training ($649) that includes a 1-year State Exam Simulator and Bail Mentor AI pass.'
    },
    {
        question: 'Do I need any prior experience?',
        answer: 'No prior industry experience is required. Both programs are designed for new students. Florida licensure still requires age 18+, a high school diploma or GED, U.S. citizenship or legal residency, and a clean background check.'
    },
    {
        question: 'How much does the 120-hour course cost?',
        answer: 'The 120-Hour Pre-Licensing Course is $649 (list $1,200) via secure SwipeSimple checkout. Tuition includes 1-year access to the State Exam Simulator and Bail Mentor AI. View cohort dates at school.shamrockbailbonds.biz/schedule.'
    },
    {
        question: 'How much is the 20-Hour Correspondence Course?',
        answer: 'The 20-Hour Correspondence Pre-Licensing Course is $199 (list $299). It is fully online and self-paced with automated FLDFS statutory time tracking.'
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
        answer: 'Yes. The 120-Hour Course includes a free 1-year Bail Mentor AI and State Exam Simulator pass. A standalone simulator pass is also available for $49.'
    },
    {
        question: 'How do I become a licensed bail bondsman in Florida?',
        answer: 'Florida requires completing a state-approved 120-hour pre-licensing course, passing the DFS state exam, obtaining a surety appointment, and completing a supervised internship. Our 120-Hour Basic Certification Training covers the pre-licensing curriculum and exam prep.'
    }
];

// ─── PAGE INIT ────────────────────────────────────────────────────────────────

$w.onReady(function () {
    console.log('🟢 Bail School Page Loading...');

    setupEmbed();
    setupMessageListener();
    injectSeoSchema();
});

// ─── EMBED SETUP ─────────────────────────────────────────────────────────────

function setupEmbed() {
    try {
        const embed = $w('#bailSchoolEmbed');
        if (!embed) {
            console.warn('⚠️ #bailSchoolEmbed not found on page');
            return;
        }
        embed.src = EMBED_URL;
        console.log('✅ Bail School embed URL set:', EMBED_URL);
    } catch (err) {
        console.error('❌ Error setting up embed:', err);
    }
}

// ─── MESSAGE LISTENER (postMessage bridge from iframe) ───────────────────────
// Accept both historical and current message type names from the embed.

function setupMessageListener() {
    try {
        $w('#bailSchoolEmbed').onMessage((event) => {
            const data = normalizeMessage(event && event.data);
            if (!data || !data.type) return;

            console.log('📨 postMessage received:', data.type, data);

            switch (data.type) {
                case 'RESIZE':
                case 'setHeight':
                    handleResize(data.height);
                    break;
                case 'SUBSCRIBE_EMAIL':
                case 'bailSchoolNotify':
                    handleEmailSubscription(data.email, data.name);
                    break;
                case 'EXPLORE_PROGRAMS':
                    handleExplorePrograms();
                    break;
                default:
                    console.log('ℹ️ Unhandled message type:', data.type);
            }
        });
    } catch (err) {
        console.error('❌ Message listener setup failed:', err);
    }
}

function normalizeMessage(raw) {
    if (!raw) return null;
    // Some HtmlComponent hosts wrap payload
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch (_) {
            return null;
        }
    }
    if (raw.type) return raw;
    if (raw.data && raw.data.type) return raw.data;
    return raw;
}

// ─── RESIZE HANDLER ──────────────────────────────────────────────────────────

function handleResize(height) {
    const h = Number(height);
    if (!h || !isFinite(h) || h < 200) return;
    try {
        // Cap absurd values; min keeps first paint usable
        const px = Math.min(Math.max(Math.ceil(h), 400), 12000);
        $w('#bailSchoolEmbed').style.height = `${px}px`;
        console.log('📐 Embed resized to:', px + 'px');
    } catch (err) {
        console.error('❌ Resize error:', err);
    }
}

// ─── EMAIL SUBSCRIPTION HANDLER ──────────────────────────────────────────────

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

async function handleEmailSubscription(email, name) {
    const cleaned = String(email || '').trim().toLowerCase();
    if (!isValidEmail(cleaned)) {
        console.warn('⚠️ Invalid email for subscription:', email);
        postToEmbed({ type: 'SUBSCRIBE_ERROR', message: 'Please enter a valid email address' });
        return;
    }

    console.log('📧 Processing subscription for:', cleaned);

    try {
        const result = await submitBailSchoolInterest({ email: cleaned, name: name || '' });
        const payload = result || {};

        if (payload.success) {
            console.log('✅ Subscription saved:', cleaned);
            postToEmbed({ type: 'SUBSCRIBE_SUCCESS', email: cleaned });
        } else {
            console.warn('⚠️ Subscription returned non-success:', payload);
            postToEmbed({ type: 'SUBSCRIBE_ERROR', message: payload.message || 'Unknown error' });
        }
    } catch (err) {
        console.error('❌ Subscription error:', err);
        postToEmbed({ type: 'SUBSCRIBE_ERROR', message: 'Server error. Please try again.' });
    }
}

function postToEmbed(msg) {
    try {
        $w('#bailSchoolEmbed').postMessage(msg);
    } catch (err) {
        console.error('❌ postMessage to embed failed:', err);
    }
}

// ─── EXPLORE PROGRAMS HANDLER ─────────────────────────────────────────────────

function handleExplorePrograms() {
    postToEmbed({ type: 'scrollToSection', sectionId: 'programs' });
    console.log('ℹ️ Explore Programs → scroll to #programs');
}

// ─── SEO STRUCTURED DATA ──────────────────────────────────────────────────────

function injectSeoSchema() {
    try {
        const faqSchema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_DATA.map(item => ({
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
            name: '20-Hour Correspondence Pre-Licensing',
            description: 'Self-paced Florida pre-licensing correspondence course with statutory time tracking, quizzes, final exam, and digital certificate.',
            provider: {
                '@type': 'Organization',
                name: 'Shamrock Bail Bonds',
                sameAs: 'https://www.shamrockbailbonds.biz'
            },
            offers: {
                '@type': 'Offer',
                price: COURSE_PRICES['20hr'].price,
                priceCurrency: 'USD',
                url: COURSE_PRICES['20hr'].paymentUrl,
                availability: 'https://schema.org/InStock'
            },
            hasCourseInstance: [
                {
                    '@type': 'CourseInstance',
                    courseMode: 'online',
                    courseWorkload: 'PT20H'
                }
            ]
        };

        const course120hrSchema = {
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: '120-Hour Basic Certification Training',
            description: 'Complete 120-hour Florida bail bond pre-licensing course with live webinars, hybrid cohorts, and bundled 1-year State Exam Simulator & Bail Mentor AI.',
            provider: {
                '@type': 'Organization',
                name: 'Shamrock Bail Bonds',
                sameAs: 'https://www.shamrockbailbonds.biz'
            },
            offers: {
                '@type': 'Offer',
                price: COURSE_PRICES['120hr'].price,
                priceCurrency: 'USD',
                url: COURSE_PRICES['120hr'].paymentUrl,
                availability: 'https://schema.org/InStock'
            },
            hasCourseInstance: [
                {
                    '@type': 'CourseInstance',
                    courseMode: 'blended',
                    courseWorkload: 'PT120H',
                    location: {
                        '@type': 'Place',
                        name: 'Shamrock Bail Bonds — Fort Myers',
                        address: {
                            '@type': 'PostalAddress',
                            streetAddress: '1528 Broadway',
                            addressLocality: 'Fort Myers',
                            addressRegion: 'FL',
                            postalCode: '33901'
                        }
                    }
                }
            ]
        };

        const breadcrumbSchema = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.shamrockbailbonds.biz' },
                { '@type': 'ListItem', position: 2, name: 'Bail School', item: 'https://www.shamrockbailbonds.biz/bail-school' }
            ]
        };

        wixSeo.setStructuredData([faqSchema, course20hrSchema, course120hrSchema, breadcrumbSchema]);
        console.log('✅ SEO schemas injected (FAQ, Course 20hr, Course 120hr, Breadcrumb)');
    } catch (err) {
        console.error('❌ SEO schema injection error:', err);
    }
}

// Trigger Wix CLI Sync: 2
