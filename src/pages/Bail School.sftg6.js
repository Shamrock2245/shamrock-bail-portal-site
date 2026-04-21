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
    setupMessageListener();
    injectSeoSchema();
});

// ─── EMBED SETUP ─────────────────────────────────────────────────────────────

function setupEmbed() {
    try {
        const embed = $w('#bailSchoolEmbed');
        if (!embed) {
            console.warn("⚠️ #bailSchoolEmbed not found on page");
            return;
        }
        embed.src = EMBED_URL;
        console.log("✅ Bail School embed URL set:", EMBED_URL);
    } catch (err) {
        console.error("❌ Error setting up embed:", err);
    }
}

// ─── MESSAGE LISTENER (postMessage bridge from iframe) ───────────────────────

function setupMessageListener() {
    $w('#bailSchoolEmbed').onMessage((event) => {
        const data = event.data;
        if (!data || !data.type) return;

        console.log("📨 postMessage received:", data.type, data);

        switch (data.type) {
            case 'RESIZE':
                handleResize(data.height);
                break;
            case 'SUBSCRIBE_EMAIL':
                handleEmailSubscription(data.email, data.name);
                break;
            case 'EXPLORE_PROGRAMS':
                handleExplorePrograms();
                break;
            default:
                console.log("ℹ️ Unhandled message type:", data.type);
        }
    });
}

// ─── RESIZE HANDLER ──────────────────────────────────────────────────────────

function handleResize(height) {
    if (!height || typeof height !== 'number') return;
    try {
        $w('#bailSchoolEmbed').style.height = `${Math.ceil(height)}px`;
        console.log("📐 Embed resized to:", height + "px");
    } catch (err) {
        console.error("❌ Resize error:", err);
    }
}

// ─── EMAIL SUBSCRIPTION HANDLER ──────────────────────────────────────────────

async function handleEmailSubscription(email, name) {
    if (!email) {
        console.warn("⚠️ No email provided for subscription");
        return;
    }

    console.log("📧 Processing subscription for:", email);

    try {
        const result = await submitBailSchoolInterest({ email, name: name || '' });
        const payload = result || {};

        if (payload.success) {
            console.log("✅ Subscription saved:", email);
            $w('#bailSchoolEmbed').postMessage({ type: 'SUBSCRIBE_SUCCESS', email });
        } else {
            console.warn("⚠️ Subscription returned non-success:", payload);
            $w('#bailSchoolEmbed').postMessage({ type: 'SUBSCRIBE_ERROR', message: payload.message || 'Unknown error' });
        }
    } catch (err) {
        console.error("❌ Subscription error:", err);
        $w('#bailSchoolEmbed').postMessage({ type: 'SUBSCRIBE_ERROR', message: 'Server error. Please try again.' });
    }
}

// ─── EXPLORE PROGRAMS HANDLER ─────────────────────────────────────────────────

function handleExplorePrograms() {
    // Notify the embed to show "Coming Soon" modal instead of scrolling
    $w('#bailSchoolEmbed').postMessage({ type: 'SHOW_COMING_SOON' });
    console.log("ℹ️ Explore Programs → Coming Soon triggered");
}

// ─── SEO STRUCTURED DATA ──────────────────────────────────────────────────────

function injectSeoSchema() {
    try {
        const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQ_DATA.map(item => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item.answer
                }
            }))
        };

        const courseSchema = {
            "@context": "https://schema.org",
            "@type": "Course",
            "name": "Florida Bail Bond Agent Certification — 120-Hour Pre-Licensing Course",
            "description": "Complete the Florida DBPR-required 120-hour bail bond pre-licensing course at Shamrock Bail School in Fort Myers.",
            "provider": {
                "@type": "Organization",
                "name": "Shamrock Bail Bonds",
                "sameAs": "https://www.shamrockbailbonds.biz"
            },
            "offers": {
                "@type": "Offer",
                "price": "699",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
            },
            "hasCourseInstance": [
                {
                    "@type": "CourseInstance",
                    "courseMode": "onsite",
                    "location": {
                        "@type": "Place",
                        "name": "Shamrock Bail Bonds — Fort Myers",
                        "address": {
                            "@type": "PostalAddress",
                            "streetAddress": "1528 Broadway",
                            "addressLocality": "Fort Myers",
                            "addressRegion": "FL",
                            "postalCode": "33901"
                        }
                    }
                }
            ]
        };

        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz" },
                { "@type": "ListItem", "position": 2, "name": "Bail School", "item": "https://www.shamrockbailbonds.biz/bail-school" }
            ]
        };

        wixSeo.setStructuredData([faqSchema, courseSchema, breadcrumbSchema]);
        console.log("✅ SEO schemas injected (FAQ, Course, Breadcrumb)");
    } catch (err) {
        console.error("❌ SEO schema injection error:", err);
    }
}
