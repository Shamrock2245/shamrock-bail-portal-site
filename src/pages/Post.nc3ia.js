import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import wixData from 'wix-data';

$w.onReady(async function () {
    await updatePostSEO();
});

async function updatePostSEO() {
    // 1. Get current post slug from URL
    const path = wixLocation.path;
    const slug = path.length > 0 ? path[path.length - 1] : null;

    if (!slug) return;

    try {
        // 2. Fetch Post Data
        const result = await wixData.query("Blog/Posts")
            .eq("slug", slug)
            .limit(1)
            .find();

        if (result.items.length === 0) {
            console.warn("[Post SEO] Post not found for slug:", slug);
            return;
        }

        const post = result.items[0];
        const postUrl = wixLocation.url;
        const logoUrl = "https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png";
        const imageUrl = post.coverImage || logoUrl;
        const excerpt = post.excerpt || "Read the latest bail bond news and Florida legal insights from Shamrock Bail Bonds.";
        const publishDate = post.publishedDate || post._createdDate;
        const modifiedDate = post.lastPublishedDate || post._updatedDate;
        const postTitle = `${post.title} | Shamrock Bail Bonds`;

        // 3. Set Meta Tags (E-E-A-T optimized)
        wixSeo.setTitle(postTitle);
        wixSeo.setMetaTags([
            { "name": "description", "content": excerpt },
            { "property": "og:title", "content": postTitle },
            { "property": "og:description", "content": excerpt },
            { "property": "og:image", "content": imageUrl },
            { "property": "og:url", "content": postUrl },
            { "property": "og:type", "content": "article" },
            { "property": "og:site_name", "content": "Shamrock Bail Bonds" },
            { "property": "article:published_time", "content": publishDate },
            { "property": "article:modified_time", "content": modifiedDate },
            { "property": "article:author", "content": "Shamrock Bail Bonds Legal Team" },
            { "property": "article:section", "content": "Bail Bonds" },
            { "name": "twitter:card", "content": "summary_large_image" },
            { "name": "twitter:title", "content": postTitle },
            { "name": "twitter:description", "content": excerpt },
            { "name": "robots", "content": "index, follow, max-snippet:-1, max-image-preview:large" }
        ]);

        wixSeo.setLinks([
            { "rel": "canonical", "href": postUrl }
        ]);

        // 4. Build comprehensive structured data
        const schemas = [
            // BlogPosting with full E-E-A-T signals
            {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": post.title,
                "description": excerpt,
                "image": imageUrl,
                "datePublished": publishDate,
                "dateModified": modifiedDate,
                "wordCount": post.plainContent ? post.plainContent.split(/\s+/).length : undefined,
                "inLanguage": "en-US",
                "articleSection": "Bail Bonds & Legal Resources",
                "author": {
                    "@type": "Organization",
                    "name": "Shamrock Bail Bonds Legal Team",
                    "url": "https://www.shamrockbailbonds.biz/",
                    "logo": {
                        "@type": "ImageObject",
                        "url": logoUrl
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
                    "telephone": "239-332-2245",
                    "sameAs": [
                        "https://www.facebook.com/ShamrockBail",
                        "https://www.instagram.com/shamrock_bail_bonds"
                    ]
                },
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": postUrl
                },
                // Local authority signal
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
                    "name": "Southwest Florida"
                },
                "keywords": "Bail Bonds, Florida Law, Fort Myers Court" +
                    (post.hashtags && post.hashtags.length ? ", " + post.hashtags.join(", ") : ""),
                // Speakable for AI voice search (embedded in BlogPosting)
                "speakable": {
                    "@type": "SpeakableSpecification",
                    "cssSelector": [
                        "[data-hook='post-title']",
                        "[data-hook='post-description']",
                        "h1", "h2",
                        ".post-content p:first-of-type"
                    ]
                }
            },
            // Breadcrumb trail
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.shamrockbailbonds.biz/blog" },
                    { "@type": "ListItem", "position": 3, "name": post.title, "item": postUrl }
                ]
            }
        ];

        await wixSeo.setStructuredData(schemas);
        console.log("[OK] Blog Post SEO set:", post.title);

    } catch (err) {
        console.error("[Post SEO] Failed to load post data:", err);
    }
}
