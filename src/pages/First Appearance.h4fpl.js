/**
 * Shamrock Bail Bonds — First Appearance Page
 * URL: /first-appearance
 *
 * ARCHITECTURE:
 *  The entire page UI is rendered inside a single HtmlComponent embed
 *  hosted at: https://shamrock-embeds.netlify.app/first-appearance.html
 *
 *  This Velo file handles:
 *    1. Setting the embed URL
 *    2. Auto-resizing the iframe based on content height
 *    3. Injecting SEO structured data (FAQPage, Breadcrumb, Event)
 *
 * ELEMENT IDs EXPECTED ON PAGE (set in Wix Editor):
 *    #firstAppearanceEmbed   — HtmlComponent (URL mode)
 */

import wixSeo from 'wix-seo';

// ─── EMBED CONFIG ─────────────────────────────────────────────────────────────

const EMBED_URL = 'https://shamrock-embeds.netlify.app/first-appearance.html';

// ─── FAQ DATA (for SEO schema — also rendered inside the embed) ──────────────

const FAQ_DATA = [
    {
        question: "How long after arrest is the First Appearance held?",
        answer: "Under Florida Rule of Criminal Procedure 3.130, the First Appearance must be held within 24 hours of arrest. If it is not, the defendant may be entitled to release."
    },
    {
        question: "Can I attend my loved one's First Appearance?",
        answer: "Many Florida counties now broadcast First Appearance hearings live via Zoom or online streaming. You can watch using the links in our county schedule table above. Some courtrooms (like Hillsborough) are primarily in-person and may have limited public seating."
    },
    {
        question: "What should the defendant say at First Appearance?",
        answer: "Very little. The defendant should confirm their name and that they understand their rights. They should NOT explain the facts of the case, argue with the judge, or make any statements about what happened. Everything said in court is recorded."
    },
    {
        question: "What if the judge sets a high bond amount?",
        answer: "Call Shamrock Bail Bonds immediately at 239-332-2245. We only require 10% of the bond amount (the Florida-regulated premium). We can also discuss payment plans and begin the process the moment the bond is set."
    },
    {
        question: "What is the difference between First Appearance and Arraignment?",
        answer: "First Appearance happens within 24 hours of arrest and focuses on bail. Arraignment is a separate, later hearing where the defendant formally enters a plea of Guilty, Not Guilty, or No Contest. They are two distinct steps in the criminal process."
    },
    {
        question: "What if there is no probable cause at First Appearance?",
        answer: "If the judge finds there is no probable cause to support the arrest, the defendant must be released immediately. This is rare but does happen, particularly in cases where the arrest report is incomplete."
    },
    {
        question: "Can the bond amount be changed after First Appearance?",
        answer: "Yes. An attorney can file a motion to reduce or modify the bond at a later hearing. However, the fastest path to release is to post the bond that is set at First Appearance and work with an attorney afterward."
    }
];

// ─── PAGE INIT ────────────────────────────────────────────────────────────────

$w.onReady(function () {
    console.log("🟢 First Appearance Page Loading...");

    setupEmbed();
    setupSEO();

    console.log("✅ First Appearance Page Ready.");
});

// ─── HTML EMBED SETUP ─────────────────────────────────────────────────────────

function setupEmbed() {
    try {
        const embed = $w('#firstAppearanceEmbed');

        // Set the source URL
        embed.src = EMBED_URL;

        // Listen for postMessage events from the embed (auto-resize)
        embed.onMessage((event) => {
            const msg = event.data;
            if (msg && msg.type === 'setHeight' && typeof msg.height === 'number') {
                embed.style.height = msg.height;
            }
        });
    } catch (e) {
        console.warn('[firstAppearanceEmbed] Not found — ensure HtmlComponent exists on page:', e.message);
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
            { "@type": "ListItem", "position": 2, "name": "First Appearance", "item": "https://www.shamrockbailbonds.biz/first-appearance" }
        ]
    };

    const eventSchema = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": "Florida First Appearance Hearings — Live Schedule",
        "description": "Daily First Appearance hearings across Florida counties. Lee County at 10 AM, Hillsborough at 1:30 PM, and more.",
        "eventAttendanceMode": "https://schema.org/MixedEventAttendanceMode",
        "location": {
            "@type": "Place",
            "name": "Florida Courts",
            "address": {
                "@type": "PostalAddress",
                "addressRegion": "FL",
                "addressCountry": "US"
            }
        },
        "organizer": {
            "@type": "Organization",
            "name": "Florida Courts",
            "url": "https://courtrooms.flcourts.gov/"
        }
    };

    wixSeo.setStructuredData([faqSchema, breadcrumbSchema, eventSchema])
        .then(() => console.log("✅ SEO: Structured Data Set"))
        .catch(err => console.error("❌ SEO Error:", err));
}
