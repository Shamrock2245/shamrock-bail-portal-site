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
 *    3. Forwarding county schedule data from backend → embed (postMessage)
 *    4. Tracking CTA engagement events (phone, online, Zoom, FAQ)
 *    5. Full SEO: title, meta tags, canonical, OG, Twitter, structured data
 *       — FAQPage, Article, BreadcrumbList, LegalService, SpeakableSpecification
 *
 * ELEMENT IDs EXPECTED ON PAGE (set in Wix Editor):
 *    #firstAppearanceEmbed   — HtmlComponent (URL mode)
 *
 * BACKEND:
 *    backend/first-appearance-api.jsw
 *      → getFirstAppearanceSchedules()
 *      → trackFirstAppearanceAction(type, context)
 *      → trackFirstAppearancePageView(data)
 */

import wixSeo from 'wix-seo';
import wixWindow from 'wix-window';
import {
    getFirstAppearanceSchedules,
    trackFirstAppearanceAction,
    trackFirstAppearancePageView
} from 'backend/first-appearance-api';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const EMBED_URL = 'https://shamrock-embeds.netlify.app/first-appearance.html';

const PAGE_TITLE = 'First Appearance Hearing in Florida | Live Court Schedules | Shamrock Bail Bonds';
const PAGE_DESC = 'Your loved one has a court date in 24 hours. Learn what happens at a First Appearance hearing in Florida, watch live court streams, and get bail help fast. Serving all 67 Florida counties 24/7. Call (239) 332-2245.';
const PAGE_URL = 'https://www.shamrockbailbonds.biz/first-appearance';
const LOGO_URL = 'https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png';
const OG_IMAGE = 'https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png';

// ─── FAQ DATA (for SEO schema — also rendered inside the embed) ──────────────

const FAQ_DATA = [
    {
        question: "How long after arrest is the First Appearance held in Florida?",
        answer: "Under Florida Rule of Criminal Procedure 3.130, a First Appearance hearing must be held within 24 hours of arrest. This timeline applies statewide — including Lee, Collier, Charlotte, and all 67 Florida counties. If the 24-hour window passes without a hearing, the defendant may be entitled to release."
    },
    {
        question: "Can I attend my loved one's First Appearance hearing?",
        answer: "Yes. First Appearance hearings are public court proceedings. Many Florida counties — including Lee, Collier, and Hillsborough — now broadcast them live via Zoom or online streaming. Family members are encouraged to watch so they know the bond amount immediately and can call Shamrock at (239) 332-2245."
    },
    {
        question: "What should the defendant say at First Appearance?",
        answer: "At First Appearance, the defendant should say very little. Confirm your name, state you understand your rights, and request a public defender if you cannot afford an attorney. Do NOT explain the facts of the case, offer excuses, or argue with the judge. Anything said in court can be used against you at trial."
    },
    {
        question: "What factors does the judge consider when setting bail at First Appearance?",
        answer: "Florida judges weigh multiple factors when setting bail: the nature and severity of charges, the defendant's prior criminal record, ties to the community (family, employment, length of residency), flight risk indicators, and whether the defendant poses a danger to the public. Defendants with strong local ties and no prior record typically receive lower bond amounts."
    },
    {
        question: "What if the judge sets a high bond amount at First Appearance?",
        answer: "Call Shamrock Bail Bonds immediately at (239) 332-2245 the moment the bond amount is set. We only require 10% of the bond amount to post bail. Our bondsmen are available 24/7 and can begin the paperwork process while you are still watching the First Appearance hearing."
    },
    {
        question: "What is the difference between First Appearance and Arraignment?",
        answer: "First Appearance happens within 24 hours of arrest and focuses exclusively on bail — the defendant does not enter a plea. Arraignment is a separate, later hearing (typically within 21 days of arrest for misdemeanors, or at information filing for felonies) where the defendant formally responds to charges with a guilty, not guilty, or no contest plea."
    },
    {
        question: "What if there is no probable cause at First Appearance?",
        answer: "If the judge finds no probable cause at First Appearance, the defendant must be released immediately under Florida law. The arrest report is reviewed to determine whether there is sufficient evidence that a crime was committed. If probable cause is not established within 33 days (for felonies) or 48 hours (for county court offenses), the charges may be dismissed."
    },
    {
        question: "Can the bond amount be changed after First Appearance?",
        answer: "Yes. A defense attorney can file a Motion for Bond Reduction or Modification at any time after First Appearance. The court will schedule a bond hearing where the attorney can argue for a lower amount. While the motion is pending, Shamrock can post the current bond to avoid additional jail time."
    },
    {
        question: "How do I find out if my loved one has a First Appearance scheduled?",
        answer: "Call the county jail directly where your loved one is being held — they can confirm if a First Appearance is scheduled and when. You can also search the county clerk's online docket. Shamrock Bail Bonds can look up your loved one's booking record instantly — call (239) 332-2245 with their name and county."
    },
    {
        question: "How quickly can Shamrock Bail Bonds post bail after First Appearance?",
        answer: "Shamrock Bail Bonds can begin the bail process immediately after the bond amount is set at First Appearance — even while the hearing is still in progress. Our office at 1528 Broadway, Fort Myers is steps from the Lee County Justice Center. Most bonds are posted within 1 to 2 hours of receiving the paperwork."
    },
    {
        question: "What happens if someone misses their First Appearance?",
        answer: "If a defendant is in custody and misses First Appearance, it typically means the hearing was rescheduled or delayed by the facility. If the defendant is out on bail and fails to appear at any scheduled court date, the judge will issue a Failure to Appear warrant, revoke the bond, and the defendant will be re-arrested."
    },
    {
        question: "Does Shamrock Bail Bonds handle all Florida counties?",
        answer: "Yes. Shamrock Bail Bonds serves all 67 Florida counties. Our Fort Myers office specializes in Southwest Florida (Lee, Collier, Charlotte, Hendry, DeSoto, Sarasota, Manatee), but we process bonds statewide — including Orange, Hillsborough, Palm Beach, Broward, and Miami-Dade. A $125 transfer fee applies for counties outside Lee and Charlotte, waived for bonds over $25,000."
    }
];

// ─── PAGE INIT ────────────────────────────────────────────────────────────────

$w.onReady(function () {
    console.log("🟢 First Appearance Page Loading...");

    setupEmbed();
    sendCountyData();
    setupSEO();
    trackPageView();

    console.log("✅ First Appearance Page Ready.");
});

// ─── HTML EMBED SETUP ─────────────────────────────────────────────────────────

function setupEmbed() {
    try {
        const embed = $w('#firstAppearanceEmbed');

        // Set the source URL
        embed.src = EMBED_URL;
        console.log("🔗 Embed URL set:", EMBED_URL);

        // Listen for postMessage events from the embed
        embed.onMessage((event) => {
            const msg = event.data;
            if (!msg || !msg.type) return;

            switch (msg.type) {
                case 'setHeight':
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
                    console.log("ℹ️ Unhandled message:", msg.type);
            }
        });
    } catch (e) {
        console.warn('[firstAppearanceEmbed] Not found — ensure HtmlComponent exists on page:', e.message);
    }
}

// ─── EMBED AUTO-RESIZE ───────────────────────────────────────────────────────

function handleResize(height) {
    if (!height || typeof height !== 'number') return;
    try {
        $w('#firstAppearanceEmbed').style.height = `${Math.ceil(height)}px`;
    } catch (e) {
        console.warn('Resize error:', e.message);
    }
}

// ─── SEND COUNTY DATA TO EMBED ──────────────────────────────────────────────

async function sendCountyData() {
    try {
        const result = await getFirstAppearanceSchedules();
        if (result.success && result.counties.length > 0) {
            // Wait a beat for the embed to load, then send data
            setTimeout(() => {
                try {
                    $w('#firstAppearanceEmbed').postMessage({
                        type: 'updateCounties',
                        data: result.counties
                    });
                    console.log(`📊 Sent ${result.counties.length} county schedules to embed`);
                } catch (e) {
                    console.warn('Failed to post county data to embed:', e.message);
                }
            }, 1500);
        }
    } catch (e) {
        console.warn('County data fetch failed (embed will use fallback data):', e.message);
    }
}

// ─── EVENT HANDLERS (from embed postMessage) ────────────────────────────────

async function handleCtaClick(msg) {
    const actionMap = {
        'phone': 'phone_click',
        'online': 'start_online',
        'zoom': 'zoom_join',
        'livestream': 'livestream_watch',
        'courthouse': 'courthouse_info',
        'directory': 'directory_click'
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
        // Non-critical — don't block
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
        // Non-critical — don't block
    }
}

async function handleScrollDepth(msg) {
    try {
        await trackFirstAppearanceAction('page_scroll_depth', {
            depth: msg.depth || 0,
            device: wixWindow.formFactor || 'Unknown'
        });
    } catch (e) {
        // Non-critical — don't block
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

// ─── SEO ──────────────────────────────────────────────────────────────────────
// Full SEO stack: title, meta, canonical, OG, Twitter, structured data.
// Uses setTimeout(0) to avoid Wix hydration race conditions (per KI).

function setupSEO() {
    setTimeout(() => {
        try {
            // 1. Page Title
            wixSeo.setTitle(PAGE_TITLE);

            // 2. Meta Tags — robots, description, OG, Twitter, keywords
            wixSeo.setMetaTags([
                { "name": "description", "content": PAGE_DESC },
                { "name": "robots", "content": "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
                { "name": "keywords", "content": "first appearance hearing Florida, first appearance court date, Florida bail hearing, bond set at first appearance, Lee County first appearance, Collier County first appearance, 24 hour bail bonds Florida, live court stream Florida, Shamrock Bail Bonds" },
                { "property": "og:title", "content": PAGE_TITLE },
                { "property": "og:description", "content": PAGE_DESC },
                { "property": "og:url", "content": PAGE_URL },
                { "property": "og:type", "content": "article" },
                { "property": "og:image", "content": OG_IMAGE },
                { "property": "og:site_name", "content": "Shamrock Bail Bonds" },
                { "name": "twitter:card", "content": "summary_large_image" },
                { "name": "twitter:title", "content": PAGE_TITLE },
                { "name": "twitter:description", "content": PAGE_DESC },
                { "name": "twitter:image", "content": OG_IMAGE }
            ]);

            // 3. Canonical URL
            wixSeo.setLinks([
                { "rel": "canonical", "href": PAGE_URL }
            ]);

            // 4. Structured Data (JSON-LD)
            wixSeo.setStructuredData([
                buildBreadcrumbSchema(),
                buildFaqSchema(),
                buildArticleSchema(),
                buildLegalServiceSchema(),
                buildLocalBusinessSchema()
            ])
                .then(() => console.log("✅ SEO: Full Structured Data Stack Set"))
                .catch(err => console.error("❌ SEO setStructuredData Error:", err));

        } catch (err) {
            console.error("❌ SEO setup error:", err);
        }
    }, 0);
}

// ─── SCHEMA BUILDERS ─────────────────────────────────────────────────────────

function buildBreadcrumbSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
            { "@type": "ListItem", "position": 2, "name": "First Appearance Hearing Guide", "item": PAGE_URL }
        ]
    };
}

function buildFaqSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": [".faq-question", ".faq-answer-inner", "h1", "h2", ".section-subtitle"]
        },
        "mainEntity": FAQ_DATA.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": f.answer
            }
        }))
    };
}

function buildArticleSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Florida First Appearance Hearing Guide: What Families Need to Know",
        "description": "A complete guide to First Appearance hearings in Florida — what happens, how bail is set, and how to get your loved one released fast. Includes live court stream links for 18 counties.",
        "url": PAGE_URL,
        "datePublished": "2024-01-15",
        "dateModified": "2026-04-27",
        "wordCount": 4200,
        "author": {
            "@type": "Organization",
            "name": "Shamrock Bail Bonds",
            "@id": "https://www.shamrockbailbonds.biz/#organization"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Shamrock Bail Bonds",
            "logo": {
                "@type": "ImageObject",
                "url": LOGO_URL
            }
        },
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", "h2", ".section-subtitle", ".hero .subtitle"]
        },
        "about": [
            { "@type": "Thing", "name": "First Appearance Hearing", "description": "The initial court proceeding within 24 hours of arrest where bail is set under Florida Rule of Criminal Procedure 3.130" },
            { "@type": "Thing", "name": "Bail Bonds", "description": "Surety bonds used to secure a defendant's release from jail pending trial" }
        ],
        "mentions": [
            { "@type": "LegalService", "name": "Shamrock Bail Bonds", "url": "https://www.shamrockbailbonds.biz/" },
            { "@type": "Thing", "name": "Florida Rule of Criminal Procedure 3.130" },
            { "@type": "Thing", "name": "Florida Statute 903" }
        ]
    };
}

function buildLegalServiceSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "LegalService",
        "name": "Shamrock Bail Bonds — First Appearance Bond Services",
        "@id": "https://www.shamrockbailbonds.biz/#organization",
        "url": PAGE_URL,
        "description": "Professional bail bond services for defendants attending First Appearance hearings across all 67 Florida counties. Available 24/7. 10% premium. Payment plans available.",
        "telephone": "+1-239-332-2245",
        "priceRange": "$$",
        "image": LOGO_URL,
        "areaServed": {
            "@type": "State",
            "name": "Florida",
            "containedInPlace": { "@type": "Country", "name": "United States" }
        },
        "serviceType": "Bail Bond Service",
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "First Appearance Bail Bond Services",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Surety Bail Bonds at First Appearance",
                        "description": "Post bail immediately after the judge sets the bond amount at First Appearance. 10% premium, payment plans available."
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Service",
                        "name": "Remote Bail Posting (Any County)",
                        "description": "Post bail in any of Florida's 67 counties without traveling. Fully digital paperwork and e-signing."
                    }
                }
            ]
        }
    };
}

function buildLocalBusinessSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": "https://www.shamrockbailbonds.biz/#organization",
        "name": "Shamrock Bail Bonds, LLC",
        "image": LOGO_URL,
        "logo": { "@type": "ImageObject", "url": LOGO_URL },
        "telephone": "+1-239-332-2245",
        "url": "https://www.shamrockbailbonds.biz/",
        "priceRange": "$$",
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59"
        },
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "1528 Broadway",
            "addressLocality": "Fort Myers",
            "addressRegion": "FL",
            "postalCode": "33901",
            "addressCountry": "US"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 26.6406,
            "longitude": -81.8723
        },
        "areaServed": [
            { "@type": "State", "name": "Florida" },
            { "@type": "AdministrativeArea", "name": "Lee County" },
            { "@type": "AdministrativeArea", "name": "Collier County" },
            { "@type": "AdministrativeArea", "name": "Charlotte County" },
            { "@type": "AdministrativeArea", "name": "Hendry County" },
            { "@type": "AdministrativeArea", "name": "DeSoto County" },
            { "@type": "AdministrativeArea", "name": "Manatee County" },
            { "@type": "AdministrativeArea", "name": "Sarasota County" }
        ],
        "sameAs": [
            "https://www.facebook.com/ShamrockBail",
            "https://www.instagram.com/shamrock_bail_bonds",
            "https://t.me/ShamrockBail_bot"
        ],
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "reviewCount": "150"
        }
    };
}
