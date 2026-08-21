/**
 * Shamrock Bail Bonds - Fortune 50 Legal Newsroom Article Experience
 * Page: /post/{slug} (Post.nc3ia.js)
 * 
 * Features:
 * - Institutional E-E-A-T Editorial Header & Reading Time Calculation
 * - Statutory Accuracy Byline (F.S. Ch. 648 & 903 Review)
 * - Multi-Channel Sharing Triggers (Native Share, Copy Link, WhatsApp, SMS)
 * - Contextual 24/7 Crisis Hotline & Digital Intake Navigation
 * - Advanced NewsArticle / BlogPosting / Speakable Schema.org Structured Data
 */

import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import wixData from 'wix-data';

$w.onReady(async function () {
    console.log("[Shamrock Newsroom] Initializing Article Intelligence & E-E-A-T Engine...");
    
    // 1. Fetch Post Data and Inject Fortune-50 SEO & Structured Data
    const postData = await updatePostSEO();

    // 2. Initialize Interactive Article Controls & Engagement Handlers
    if (postData) {
        initArticleUI(postData);
    }
});

/**
 * Loads post data and configures enterprise-grade SEO, OpenGraph, and Schema.org markup.
 */
async function updatePostSEO() {
    const path = wixLocation.path;
    const slug = path && path.length > 0 ? path[path.length - 1] : null;

    if (!slug) return null;

    try {
        const result = await wixData.query("Blog/Posts")
            .eq("slug", slug)
            .limit(1)
            .find();

        if (!result || result.items.length === 0) {
            console.warn("[Newsroom Article] Post not found for slug:", slug);
            return null;
        }

        const post = result.items[0];
        const postUrl = wixLocation.url;
        const logoUrl = "https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png";
        const imageUrl = post.coverImage || logoUrl;
        const excerpt = post.excerpt || "Authoritative Florida bail bond intelligence and legal defense guidance from Shamrock Bail Bonds.";
        const publishDate = post.publishedDate || post._createdDate || new Date().toISOString();
        const modifiedDate = post.lastPublishedDate || post._updatedDate || publishDate;
        const postTitle = `${post.title} | Shamrock Legal Newsroom`;
        
        // Calculate Word Count & Reading Time
        const textContent = post.plainContent || post.description || excerpt || "";
        const wordCount = textContent.trim().split(/\s+/).filter(Boolean).length || 600;
        const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

        // 1. Meta Tags (E-E-A-T & Google Discover Optimized)
        wixSeo.setTitle(postTitle);
        wixSeo.setMetaTags([
            { "name": "description", "content": excerpt },
            { "property": "og:title", "content": postTitle },
            { "property": "og:description", "content": excerpt },
            { "property": "og:image", "content": imageUrl },
            { "property": "og:url", "content": postUrl },
            { "property": "og:type", "content": "article" },
            { "property": "og:site_name", "content": "Shamrock Bail Bonds Legal Newsroom" },
            { "property": "article:published_time", "content": publishDate },
            { "property": "article:modified_time", "content": modifiedDate },
            { "property": "article:author", "content": "Shamrock Bail Bonds Editorial Board" },
            { "property": "article:section", "content": "Florida Bail Statutes & Criminal Justice" },
            { "name": "twitter:card", "content": "summary_large_image" },
            { "name": "twitter:title", "content": postTitle },
            { "name": "twitter:description", "content": excerpt },
            { "name": "twitter:image", "content": imageUrl },
            { "name": "robots", "content": "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" }
        ]);

        wixSeo.setLinks([
            { "rel": "canonical", "href": postUrl }
        ]);

        // 2. Comprehensive Fortune-50 Structured Data Graph
        const schemas = [
            {
                "@context": "https://schema.org",
                "@type": ["NewsArticle", "BlogPosting"],
                "headline": post.title,
                "description": excerpt,
                "image": [imageUrl],
                "datePublished": publishDate,
                "dateModified": modifiedDate,
                "wordCount": wordCount,
                "timeRequired": `PT${readTimeMinutes}M`,
                "inLanguage": "en-US",
                "isAccessibleForFree": true,
                "articleSection": "Florida Bail Law & Procedure",
                "author": {
                    "@type": "Organization",
                    "name": "Shamrock Bail Bonds Editorial Board",
                    "url": "https://www.shamrockbailbonds.biz/about",
                    "logo": {
                        "@type": "ImageObject",
                        "url": logoUrl
                    }
                },
                "reviewedBy": {
                    "@type": "Person",
                    "name": "Licensed Florida Bail Bond Agent (F.S. Ch. 648)",
                    "jobTitle": "Compliance & Legal Review Officer",
                    "worksFor": {
                        "@type": "Organization",
                        "name": "Shamrock Bail Bonds, LLC"
                    }
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
                    "sameAs": [
                        "https://www.facebook.com/ShamrockBail",
                        "https://www.instagram.com/shamrock_bail_bonds",
                        "https://t.me/ShamrockBail_bot"
                    ]
                },
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": postUrl
                },
                "contentLocation": {
                    "@type": "Place",
                    "name": "Fort Myers, FL",
                    "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": 26.6406,
                        "longitude": -81.8723
                    }
                },
                "spatialCoverage": {
                    "@type": "Place",
                    "name": "Florida Statewide (All 67 Counties)"
                },
                "about": [
                    { "@type": "Thing", "name": "Bail in Florida" },
                    { "@type": "Thing", "name": "Florida Statutes Chapter 903" },
                    { "@type": "Thing", "name": "Florida Statutes Chapter 648" }
                ],
                "keywords": "Florida Bail Bonds, F.S. 903, F.S. 648, Fort Myers Jail, First Appearance Court" +
                    (post.hashtags && post.hashtags.length ? ", " + post.hashtags.join(", ") : ""),
                "speakable": {
                    "@type": "SpeakableSpecification",
                    "cssSelector": [
                        "[data-hook='post-title']",
                        "h1", "h2",
                        ".executive-summary",
                        ".post-content p:first-of-type"
                    ]
                }
            },
            // Breadcrumb Trail
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                    { "@type": "ListItem", "position": 2, "name": "Legal Newsroom", "item": "https://www.shamrockbailbonds.biz/blog" },
                    { "@type": "ListItem", "position": 3, "name": post.title, "item": postUrl }
                ]
            }
        ];

        await wixSeo.setStructuredData(schemas);
        console.log("[OK] Enterprise Article Structured Data Configured:", post.title);

        return {
            ...post,
            wordCount,
            readTimeMinutes,
            postUrl
        };

    } catch (err) {
        console.error("[Newsroom Article] Error setting article SEO:", err);
        return null;
    }
}

/**
 * Initializes interactive article tools (read time badge, share buttons, emergency CTA).
 */
function initArticleUI(post) {
    const getEl = (id) => {
        try {
            return $w(id);
        } catch (e) {
            return null;
        }
    };

    // 1. Reading Time & Word Count Badge
    const readTimeTxt = getEl("#txtArticleReadTime");
    if (readTimeTxt) {
        readTimeTxt.text = `${post.readTimeMinutes} min read · Fact-Checked`;
    }

    const reviewBadgeTxt = getEl("#txtArticleReviewer");
    if (reviewBadgeTxt) {
        reviewBadgeTxt.text = "Reviewed for Florida Statutory Compliance (F.S. Ch. 648 & 903)";
    }

    // 2. Share Actions
    const shareBtn = getEl("#btnArticleShare");
    if (shareBtn && typeof shareBtn.onClick === 'function') {
        shareBtn.onClick(() => {
            if (typeof navigator !== 'undefined' && navigator.share) {
                navigator.share({
                    title: post.title,
                    text: post.excerpt,
                    url: post.postUrl
                }).catch(() => {});
            } else {
                // Fallback: Copy link
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(post.postUrl);
                    const toast = getEl("#txtShareFeedback");
                    if (toast) {
                        toast.text = "Article link copied to clipboard!";
                        if (typeof toast.show === 'function') toast.show();
                    }
                }
            }
        });
    }

    // 3. Contextual Emergency Bail Hotline & Portal Navigation
    const callHotlineBtn = getEl("#btnPostEmergencyCall");
    if (callHotlineBtn && typeof callHotlineBtn.onClick === 'function') {
        callHotlineBtn.onClick(() => {
            wixLocation.to('tel:+12393322245');
        });
    }

    const startPortalBtn = getEl("#btnPostStartPaperwork");
    if (startPortalBtn && typeof startPortalBtn.onClick === 'function') {
        startPortalBtn.onClick(() => {
            wixLocation.to('/portal-landing');
        });
    }
}
