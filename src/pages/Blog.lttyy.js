import wixSeo from 'wix-seo';
import wixData from 'wix-data';

$w.onReady(function () {
    updateBlogSEO();
});

async function updateBlogSEO() {
    const pageTitle = "Florida Bail Bond News & Legal Resources | Shamrock Bail Bonds";
    const pageDesc = "Expert insights on Florida bail bonds, court procedures, and legal defense strategies for Lee, Collier, Charlotte, and all 67 Florida counties. Updated daily by licensed bail bond professionals.";
    const pageUrl = "https://www.shamrockbailbonds.biz/blog";
    const logoUrl = "https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png";

    // 1. Meta Tags (Authority + Freshness Focused)
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:type", "content": "blog" },
        { "property": "og:url", "content": pageUrl },
        { "property": "og:image", "content": logoUrl },
        { "property": "og:site_name", "content": "Shamrock Bail Bonds" },
        { "name": "twitter:card", "content": "summary_large_image" },
        { "name": "twitter:title", "content": pageTitle },
        { "name": "twitter:description", "content": pageDesc },
        { "name": "robots", "content": "index, follow, max-snippet:-1, max-image-preview:large" },
        { "name": "keywords", "content": "Florida bail bonds blog, Fort Myers legal news, bail bond tips, court updates Lee County, how to post bail Florida, bail bond costs" }
    ]);

    wixSeo.setLinks([
        { "rel": "canonical", "href": pageUrl }
    ]);

    // 2. Build schemas array
    const schemas = [
        // Blog schema (CollectionPage signals this is an index)
        {
            "@context": "https://schema.org",
            "@type": ["Blog", "CollectionPage"],
            "name": "Shamrock Bail Bonds Legal Blog",
            "url": pageUrl,
            "description": "Expert insights on Florida bail bonds, legal defense tips, and county court procedures from licensed bail bond agents serving all 67 Florida counties.",
            "inLanguage": "en-US",
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
                "areaServed": [
                    "Fort Myers", "Naples", "Cape Coral", "Sarasota",
                    "Bradenton", "Port Charlotte", "Punta Gorda"
                ],
                "sameAs": [
                    "https://www.facebook.com/ShamrockBail",
                    "https://www.instagram.com/shamrock_bail_bonds"
                ]
            }
        },
        // Breadcrumb for navigation context
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
                    "name": "Legal Blog",
                    "item": pageUrl
                }
            ]
        },
        // Speakable - AI voice search targeting for blog content
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "url": pageUrl,
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", "h2", ".blog-post-title", "[data-hook='post-title']"]
            }
        }
    ];

    // 3. Fetch recent posts to build ItemList schema (rich snippet boost)
    try {
        const posts = await wixData.query("Blog/Posts")
            .descending("lastPublishedDate")
            .limit(10)
            .find();

        if (posts.items.length > 0) {
            const itemList = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Latest Bail Bond Articles",
                "numberOfItems": posts.items.length,
                "itemListElement": posts.items.map((post, index) => ({
                    "@type": "ListItem",
                    "position": index + 1,
                    "url": `https://www.shamrockbailbonds.biz/post/${post.slug}`,
                    "name": post.title
                }))
            };
            schemas.push(itemList);
        }
    } catch (e) {
        console.warn("[Blog SEO] Could not fetch posts for ItemList schema:", e.message);
    }

    // 4. Apply all schemas
    wixSeo.setStructuredData(schemas);
}
