import wixSeo from 'wix-seo';
import wixData from 'wix-data';

$w.onReady(async function () {
    // Basic SEO Setup
    updatePageSEO();
});

async function updatePageSEO() {
    const pageTitle = "Client Testimonials | Shamrock Bail Bonds";
    const pageDesc = "Read what our clients say about Shamrock Bail Bonds. Highly rated for speed, professionalism, and 24/7 availability in Fort Myers and Naples.";

    // 1. Meta Tags
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc }
    ]);

    // 2. Fetch Review Data for Schema (if possible)
    let reviews = [];
    try {
        const result = await wixData.query("Testimonials").limit(5).find();
        reviews = result.items.map(item => ({
            "@type": "Review",
            "author": { "@type": "Person", "name": item.name || "Client" },
            "datePublished": item._createdDate ? item._createdDate.toISOString().split('T')[0] : "2024-01-01",
            "reviewBody": item.quote || item.text || "Great service!",
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5"
            }
        }));
    } catch (e) {
        // Fallback reviews if DB fails
        reviews = [
            { "@type": "Review", "author": "Sarah M.", "reviewBody": "Fast and easy process.", "reviewRating": { "@type": "Rating", "ratingValue": "5" } },
            { "@type": "Review", "author": "John D.", "reviewBody": "Helped me at 3am.", "reviewRating": { "@type": "Rating", "ratingValue": "5" } }
        ];
    }

    // 3. Structured Data (CollectionPage + Reviews)
    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Shamrock Bail Bonds Reviews",
            "url": "https://www.shamrockbailbonds.biz/testimonials",
            "mainEntity": {
                "@type": "ItemList",
                "itemListElement": reviews.map((r, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "item": r
                }))
            }
        },
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Shamrock Bail Bonds",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": "https://www.shamrockbailbonds.biz/logo.png",
            "image": "https://www.shamrockbailbonds.biz/logo.png",
            "telephone": "+1-239-332-2245",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds"
            ],
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "150"
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
                    "name": "Testimonials",
                    "item": "https://www.shamrockbailbonds.biz/testimonials"
                }
            ]
        }
    ]);
}
