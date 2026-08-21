/**
 * Shamrock Bail Bonds - Fortune 50 Legal Newsroom & Editorial Index
 * Page: /blog (Blog.lttyy.js)
 * 
 * Features:
 * - Institutional Editorial Header & Topic Taxonomy
 * - Dynamic Search & Filter Handlers (Defensive Wix Velo bindings)
 * - E-E-A-T Authority Schemas (Blog, CollectionPage, ItemList, BreadcrumbList, Speakable)
 * - 24/7 Crisis Mobile Sticky Action Controls
 */

import wixSeo from 'wix-seo';
import wixData from 'wix-data';
import wixLocation from 'wix-location';

$w.onReady(function () {
    console.log("[Shamrock Newsroom] Initializing Fortune 50 Editorial Index...");
    
    // 1. Initialize SEO, Meta Tags & Schema Graphs
    initBlogSEO();

    // 2. Initialize Interactive Newsroom UI Components (Safe Bindings)
    initEditorialUI();
});

/**
 * Sets comprehensive SEO meta tags and Schema.org structured data.
 */
async function initBlogSEO() {
    const pageTitle = "Florida Bail Bond Legal Newsroom & Statutory Insights | Shamrock Bail Bonds";
    const pageDesc = "Institutional legal insights, Florida bail statutes analysis (F.S. Ch. 903 & 648), county jail release guides, and cosigner defense protocols. Published by licensed Florida bail professionals.";
    const pageUrl = "https://www.shamrockbailbonds.biz/blog";
    const logoUrl = "https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png";

    // 1. Institutional Meta Tags
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:type", "content": "website" },
        { "property": "og:url", "content": pageUrl },
        { "property": "og:image", "content": logoUrl },
        { "property": "og:site_name", "content": "Shamrock Bail Bonds Legal Newsroom" },
        { "name": "twitter:card", "content": "summary_large_image" },
        { "name": "twitter:title", "content": pageTitle },
        { "name": "twitter:description", "content": pageDesc },
        { "name": "robots", "content": "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
        { "name": "keywords", "content": "Florida bail bond statutes, Fort Myers legal news, Florida bail bonds blog, cosigner rights Florida, First Appearance court guide, F.S. 903 bail law" }
    ]);

    wixSeo.setLinks([
        { "rel": "canonical", "href": pageUrl }
    ]);

    // 2. Build Structured Data Graphs
    const schemas = [
        // Collection & Blog Schema
        {
            "@context": "https://schema.org",
            "@type": ["Blog", "CollectionPage"],
            "name": "Shamrock Bail Bonds Legal Newsroom & Editorial",
            "url": pageUrl,
            "description": pageDesc,
            "inLanguage": "en-US",
            "isPartOf": {
                "@type": "WebSite",
                "name": "Shamrock Bail Bonds",
                "url": "https://www.shamrockbailbonds.biz/"
            },
            "publisher": {
                "@type": "LocalBusiness",
                "name": "Shamrock Bail Bonds, LLC",
                "@id": "https://www.shamrockbailbonds.biz/#organization",
                "logo": {
                    "@type": "ImageObject",
                    "url": logoUrl
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
                "priceRange": "$$",
                "areaServed": [
                    "Fort Myers", "Naples", "Cape Coral", "Punta Gorda",
                    "Port Charlotte", "Sarasota", "Bradenton", "All 67 Florida Counties"
                ],
                "sameAs": [
                    "https://www.facebook.com/ShamrockBail",
                    "https://www.instagram.com/shamrock_bail_bonds",
                    "https://t.me/ShamrockBail_bot"
                ]
            }
        },
        // Breadcrumb Trail
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://www.shamrockbailbonds.biz/"
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Legal Newsroom",
                    "item": pageUrl
                }
            ]
        },
        // Speakable Specification for Voice / AI Search
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "url": pageUrl,
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", "h2", ".newsroom-headline", ".executive-summary", "[data-hook='post-title']"]
            }
        }
    ];

    // 3. Query Recent Published Posts to Hydrate ItemList Schema
    try {
        const posts = await wixData.query("Blog/Posts")
            .descending("lastPublishedDate")
            .limit(12)
            .find();

        if (posts && posts.items && posts.items.length > 0) {
            const itemList = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Featured Florida Bail & Legal Briefings",
                "numberOfItems": posts.items.length,
                "itemListElement": posts.items.map((post, idx) => ({
                    "@type": "ListItem",
                    "position": idx + 1,
                    "url": `https://www.shamrockbailbonds.biz/post/${post.slug || post.postPageUrl || ''}`,
                    "name": post.title
                }))
            };
            schemas.push(itemList);
        }
    } catch (e) {
        console.warn("[Newsroom SEO] Error populating ItemList schema:", e ? e.message : e);
    }

    // 4. Apply schemas
    wixSeo.setStructuredData(schemas);
}

/**
 * Initializes interactive UI widgets, category filters, search input,
 * and emergency hotline hooks with defensive element checks.
 */
function initEditorialUI() {
    // Safe element selector helper
    const getEl = (id) => {
        try {
            return $w(id);
        } catch (err) {
            return null;
        }
    };

    // 1. Topic Taxonomy Filter Buttons (Category Selection)
    const categoryButtons = [
        { id: "#btnCatAll", filter: null },
        { id: "#btnCatStatutes", filter: "Florida Legal Updates" },
        { id: "#btnCatHowBailWorks", filter: "How Bail Bonds Work" },
        { id: "#btnCatCountySpotlight", filter: "County Spotlight" },
        { id: "#btnCatBailTips", filter: "Bail Bond Tips" }
    ];

    categoryButtons.forEach(({ id, filter }) => {
        const btn = getEl(id);
        if (btn && typeof btn.onClick === 'function') {
            btn.onClick(() => {
                filterNewsroomByCategory(filter);
            });
        }
    });

    // 2. Real-time Search Input Handler
    const searchInput = getEl("#inputNewsroomSearch");
    if (searchInput && typeof searchInput.onInput === 'function') {
        let debounceTimer;
        searchInput.onInput((event) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = (event.target.value || '').trim();
                filterNewsroomBySearch(query);
            }, 300);
        });
    }

    // 3. Emergency 24/7 Hotline Buttons
    const callHotlineBtn = getEl("#btnNewsroomEmergencyCall");
    if (callHotlineBtn && typeof callHotlineBtn.onClick === 'function') {
        callHotlineBtn.onClick(() => {
            wixLocation.to('tel:+12393322245');
        });
    }

    const startPortalBtn = getEl("#btnNewsroomStartPaperwork");
    if (startPortalBtn && typeof startPortalBtn.onClick === 'function') {
        startPortalBtn.onClick(() => {
            wixLocation.to('/portal-landing');
        });
    }

    // 4. Newsletter / Advisory Alert Subscription Hook
    const subscribeBtn = getEl("#btnSubscribeLegalAlerts");
    const emailInput = getEl("#inputSubscribeEmail");
    if (subscribeBtn && emailInput && typeof subscribeBtn.onClick === 'function') {
        subscribeBtn.onClick(async () => {
            const email = (emailInput.value || '').trim();
            if (!email || !email.includes('@')) {
                showToastMessage("#txtSubscribeMsg", "Please enter a valid email address.", "error");
                return;
            }
            try {
                // Save subscriber or show confirmation
                showToastMessage("#txtSubscribeMsg", "Thank you. You are subscribed to Florida Legal & Bail Advisories.", "success");
                emailInput.value = "";
            } catch (err) {
                console.error("[Newsroom] Subscription error:", err);
            }
        });
    }
}

/**
 * Filter blog dataset by category if a custom dataset or repeater is present.
 */
function filterNewsroomByCategory(categoryName) {
    try {
        const dataset = $w("#dynamicDataset") || $w("#datasetBlog");
        if (dataset && typeof dataset.setFilter === 'function') {
            if (!categoryName) {
                dataset.setFilter(wixData.filter());
            } else {
                dataset.setFilter(wixData.filter().eq("category", categoryName));
            }
        }
    } catch (e) {
        // Dataset not present on native blog widget; graceful no-op
    }
}

/**
 * Filter blog dataset by search query.
 */
function filterNewsroomBySearch(query) {
    try {
        const dataset = $w("#dynamicDataset") || $w("#datasetBlog");
        if (dataset && typeof dataset.setFilter === 'function') {
            if (!query) {
                dataset.setFilter(wixData.filter());
            } else {
                dataset.setFilter(
                    wixData.filter()
                        .contains("title", query)
                        .or(wixData.filter().contains("excerpt", query))
                );
            }
        }
    } catch (e) {
        // Dataset not present on native blog widget; graceful no-op
    }
}

/**
 * Helper to display feedback messages safely.
 */
function showToastMessage(textId, msg, type = "info") {
    try {
        const txt = $w(textId);
        if (txt) {
            txt.text = msg;
            if (typeof txt.show === 'function') txt.show();
        }
    } catch (e) {
        // Ignore if element is not in DOM
    }
}
