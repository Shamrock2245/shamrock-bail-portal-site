/**
 * Shamrock Bail Bonds — Bail School Page
 * URL: /bail-school
 *
 * ARCHITECTURE:
 *  The entire page UI is rendered inside a single HtmlComponent embed
 *  hosted at: https://shamrock-embeds.netlify.app/bail-school.html
 *
 *  This Velo file handles:
 *    1. Setting the embed URL
 *    2. Auto-resizing the iframe based on content height
 *    3. Handling newsletter email subscriptions from the embed
 *    4. Injecting SEO structured data (FAQPage, Course, Breadcrumb)
 *
 * ELEMENT IDs EXPECTED ON PAGE (set in Wix Editor):
 *    #bailSchoolEmbed   — HtmlComponent (URL mode)
 */

import wixSeo from 'wix-seo';
import { submitBailSchoolInterest } from 'backend/bailSchoolInterest';

// ─── EMBED CONFIG ─────────────────────────────────────────────────────────────

const EMBED_URL = 'https://shamrock-embeds.netlify.app/bail-school.html';

// ─── FAQ DATA (for SEO schema — also rendered inside the embed) ──────────────

const FAQ_DATA = [
    {
        question: "What is Shamrock Bail School?",
        answer: "Shamrock Bail School is an education program by Shamrock Bail Bonds offering courses from basic co-signer education to full 120-hour Florida bail bond agent certification."
    },
    {
        question: "Do I need any prior experience?",
        answer: "No. The Indemnitor Basics course requires zero prior knowledge. The Agent Path requires a high school diploma or GED and a clean criminal background."
    },
    {
        question: "How much does the 120-hour course cost?",
        answer: "The Agent Path is $699. We offer competitive rates for the Fort Myers and Southwest Florida area, and payment plans may be available for qualified applicants. Contact us for details."
    },
    {
        question: "Is the Indemnitor Basics course really free?",
        answer: "Yes. We believe every co-signer should understand their rights and obligations before signing a bail bond. The 2-hour online course is completely free."
    },
    {
        question: "Do I get a certificate?",
        answer: "Yes. Each completed course provides a certificate of completion. The Agent Path certificate qualifies you to sit for the Florida bail bond licensing exam."
    },
    {
        question: "Can I take courses from anywhere in Florida?",
        answer: "The Indemnitor Basics course is fully online. The Agent Path is hybrid (online + in-person at our Fort Myers location). Risk Management & Skip Tracing is in-person only."
    },
    {
        question: "Will completing the Agent Path guarantee me a job?",
        answer: "While we cannot guarantee employment, Shamrock Bail Bonds actively recruits from our Agent Path graduates and provides mentorship and apprenticeship opportunities."
    },
    {
        question: "How do I become a licensed bail bondsman in Florida?",
        answer: "Florida requires a 120-hour pre-licensing course (like our Agent Path), passing the state licensing exam, obtaining a surety bond, and submitting a Florida DBPR application."
    },
    {
        question: "What is the Bail Bond Masterclass?",
        answer: "The Bail Bond Masterclass is a comprehensive, self-paced online course available on the Skool platform. It's designed for anyone in the bail bond industry who wants to level up their skills in sales, compliance, fugitive recovery, marketing, and agency operations."
    }
];

// ─── PAGE INIT ────────────────────────────────────────────────────────────────

$w.onReady(function () {
    console.log("🟢 Bail School Page Loading...");

    setupEmbed();
    setupSEO();

    console.log("✅ Bail School Page Ready.");
});

// ─── HTML EMBED SETUP ─────────────────────────────────────────────────────────

function setupEmbed() {
    try {
        const embed = $w('#bailSchoolEmbed');

        // Set the source URL
        embed.src = EMBED_URL;

        // Listen for postMessage events from the embed
        embed.onMessage((event) => {
            const msg = event.data;

            // Auto-resize iframe height
            if (msg && msg.type === 'setHeight' && typeof msg.height === 'number') {
                embed.style.height = msg.height;
            }

            // Newsletter email captured in embed
            if (msg && msg.type === 'bailSchoolNotify' && msg.email) {
                console.log('📧 Bail School Notify:', msg.email);
                submitBailSchoolInterest(msg.email)
                    .then(result => console.log('✅ Bail School signup saved:', result))
                    .catch(err => console.error('❌ Bail School signup error:', err));
            }
        });
    } catch (e) {
        console.warn('[bailSchoolEmbed] Not found — ensure HtmlComponent exists on page:', e.message);
    }
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

function setupSEO() {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQ_DATA.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f.answer
            }
        }))
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
            { "@type": "ListItem", "position": 2, "name": "Bail School", "item": "https://www.shamrockbailbonds.biz/bail-school" }
        ]
    };

    const courseSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": "Shamrock Bail School",
        "description": "Florida bail bond education — from informed co-signer to licensed bail bond agent.",
        "url": "https://www.shamrockbailbonds.biz/bail-school",
        "parentOrganization": {
            "@type": "Organization",
            "name": "Shamrock Bail Bonds",
            "url": "https://www.shamrockbailbonds.biz"
        },
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "1528 Broadway",
            "addressLocality": "Fort Myers",
            "addressRegion": "FL",
            "postalCode": "33901",
            "addressCountry": "US"
        },
        "telephone": "+1-239-332-2245",
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Bail School Programs",
            "itemListElement": [
                {
                    "@type": "Course",
                    "name": "Indemnitor Basics",
                    "description": "What Every Co-Signer Must Know. Understand your legal obligations, financial risks, and rights.",
                    "timeRequired": "PT2H",
                    "educationalLevel": "Beginner",
                    "isAccessibleForFree": true,
                    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
                },
                {
                    "@type": "Course",
                    "name": "The Agent Path",
                    "description": "120-hour state-approved Florida bail bond agent certification program. First class starts June 2026.",
                    "timeRequired": "PT120H",
                    "educationalLevel": "Professional",
                    "offers": { "@type": "Offer", "price": "699", "priceCurrency": "USD" }
                },
                {
                    "@type": "Course",
                    "name": "Risk Management & Skip Tracing",
                    "description": "Advanced fugitive recovery and high-stakes bond management.",
                    "timeRequired": "PT5H",
                    "educationalLevel": "Advanced",
                    "offers": { "@type": "Offer", "price": "249", "priceCurrency": "USD" }
                },
                {
                    "@type": "Course",
                    "name": "Bail Bond Masterclass",
                    "description": "Level up every facet of the bail bond game — sales, compliance, fugitive recovery, marketing, and agency operations. Available on the Skool platform.",
                    "educationalLevel": "All Levels",
                    "courseMode": "online"
                }
            ]
        }
    };

    wixSeo.setStructuredData([faqSchema, breadcrumbSchema, courseSchema])
        .then(() => console.log("✅ SEO: Bail School Structured Data Set"))
        .catch(err => console.error("❌ SEO Error:", err));
}
