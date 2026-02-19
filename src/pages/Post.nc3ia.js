import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import wixData from 'wix-data';

$w.onReady(async function () {
    await updatePostSEO();
});

async function updatePostSEO() {
    // 1. Get current post slug from URL
    // Format: /post/some-article-slug usually
    const path = wixLocation.path;
    const slug = path.length > 0 ? path[path.length - 1] : null;

    if (!slug) return;

    try {
        // 2. Fetch Post Data (Assuming 'Blog/Posts' collection)
        const result = await wixData.query("Blog/Posts")
            .eq("slug", slug)
            .limit(1)
            .find();

        if (result.items.length === 0) {
            console.warn("Post not found for SEO schema generation");
            return;
        }

        const post = result.items[0];
        const postUrl = wixLocation.url;
        const imageUrl = post.coverImage || "https://www.shamrockbailbonds.biz/logo.png"; // Fallback
        const excerpt = post.excerpt || "Read the latest bail bond news and Florida legal insights from Shamrock Bail Bonds.";

        // 3. Set Meta Tags (Crucial for Social Sharing & SERP Snippets)
        wixSeo.setTitle(`${post.title} | Shamrock Bail Bonds`);
        wixSeo.setMetaTags([
            { "name": "description", "content": excerpt },
            { "property": "og:title", "content": `${post.title} | Shamrock Bail Bonds` },
            { "property": "og:description", "content": excerpt },
            { "property": "og:image", "content": imageUrl },
            { "property": "og:url", "content": postUrl },
            { "property": "og:type", "content": "article" },
            { "name": "twitter:card", "content": "summary_large_image" }
        ]);

        wixSeo.setLinks([
            { "rel": "canonical", "href": postUrl }
        ]);

        // 4. Generate Deep Schema
        wixSeo.setStructuredData([
            {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": post.title,
                "image": imageUrl,
                "datePublished": post.publishedDate || post._createdDate,
                "dateModified": post.lastPublishedDate || post._updatedDate,
                "author": {
                    "@type": "Person",
                    "name": "Shamrock Bail Bonds Legal Team", // Unified authority voice
                    "url": "https://www.shamrockbailbonds.biz/about"
                },
                "publisher": {
                    "@type": "LocalBusiness",
                    "name": "Shamrock Bail Bonds",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://www.shamrockbailbonds.biz/logo.png"
                    },
                    "sameAs": [
                        "https://www.facebook.com/ShamrockBail",
                        "https://www.instagram.com/shamrock_bail_bonds"
                    ]
                },
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": postUrl
                },
                // 4. LOCAL AUTHORITY SIGNAL: Spatial Coverage
                "contentLocation": {
                    "@type": "Place",
                    "name": "Fort Myers, FL",
                    "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": 26.6406,
                        "longitude": -81.8723
                    }
                },
                "spatialCoverage": "Southwest Florida",
                "keywords": "Bail Bonds, Florida Law, Fort Myers Court, " + (post.hashtags ? post.hashtags.join(", ") : "")
            },
            {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.shamrockbailbonds.biz/blog" },
                    { "@type": "ListItem", "position": 3, "name": post.title, "item": postUrl }
                ]
            }
        ])
            .then(() => console.log("✅ Deep Blog Post SEO Set for:", post.title))
            .catch(e => console.error("❌ Blog Post SEO Error", e));

    } catch (err) {
        console.error("Failed to load post data for SEO", err);
    }
}
