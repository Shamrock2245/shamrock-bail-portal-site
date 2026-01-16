import wixSeo from 'wix-seo';

$w.onReady(function () {
    updateBlogSEO();
});

function updateBlogSEO() {
    const pageTitle = "Florida Bail Bond News & Legal Updates | Shamrock Bail Bonds";
    const pageDesc = "Stay informed with the latest bail bond news, legal updates, and court resources for Lee, Collier, and Charlotte counties. Your local authority on Florida bail laws.";
    const pageUrl = "https://www.shamrockbailbonds.biz/blog";

    // 1. Meta Tags (Authority Focused)
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:type", "content": "blog" },
        { "name": "keywords", "content": "Florida Bail Laws, Fort Myers Legal News, Bail Bond Tips, Court Updates Lee County" }
    ]);

    // 2. Structured Data (Blog + Publisher Authority)
    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Shamrock Bail Bonds Legal Blog",
            "url": pageUrl,
            "description": "Expert insights on Florida bail bonds, legal defense tips, and county court procedures.",
            "publisher": {
                "@type": "LocalBusiness",
                "name": "Shamrock Bail Bonds",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.shamrockbailbonds.biz/logo.png"
                },
                "areaServed": ["Fort Myers", "Naples", "Cape Coral", "Sarasota", "Bradenton"] // Reinforcing local reach
            }
        },
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
        }
    ]);
}
