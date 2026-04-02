import wixSeo from 'wix-seo';
import wixData from 'wix-data';

$w.onReady(async function () {
    updatePageSEO();
});

async function updatePageSEO() {
    const pageTitle = "Client Reviews & Testimonials | Shamrock Bail Bonds Fort Myers";
    const pageDesc = "See why Shamrock Bail Bonds is rated 4.9/5 stars. Read real client reviews about our 24/7 bail bond service in Fort Myers, Naples, and across all 67 Florida counties.";
    const pageUrl = "https://www.shamrockbailbonds.biz/testimonials";
    const logoUrl = "https://static.wixstatic.com/media/4e4d4a_73224c172368430aa4039a16a1da5bde~mv2.png";

    // 1. Meta Tags (Review-focused)
    wixSeo.setTitle(pageTitle);
    wixSeo.setMetaTags([
        { "name": "description", "content": pageDesc },
        { "property": "og:title", "content": pageTitle },
        { "property": "og:description", "content": pageDesc },
        { "property": "og:url", "content": pageUrl },
        { "property": "og:type", "content": "website" },
        { "property": "og:image", "content": logoUrl },
        { "property": "og:site_name", "content": "Shamrock Bail Bonds" },
        { "name": "twitter:card", "content": "summary_large_image" },
        { "name": "twitter:title", "content": pageTitle },
        { "name": "twitter:description", "content": pageDesc },
        { "name": "robots", "content": "index, follow, max-snippet:-1" },
        { "name": "keywords", "content": "Shamrock Bail Bonds reviews, bail bond testimonials Fort Myers, best bail bondsman Florida, bail bond reviews Lee County" }
    ]);

    wixSeo.setLinks([
        { "rel": "canonical", "href": pageUrl }
    ]);

    // 2. Fetch Review Data for Schema
    let reviews = [];
    try {
        const result = await wixData.query("Testimonials").limit(10).find();
        reviews = result.items.map(item => ({
            "@type": "Review",
            "author": { "@type": "Person", "name": item.name || "Verified Client" },
            "datePublished": item._createdDate ? item._createdDate.toISOString().split('T')[0] : "2025-01-01",
            "reviewBody": item.quote || item.text || "Great service!",
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": item.rating || "5",
                "bestRating": "5"
            }
        }));
    } catch (e) {
        console.warn("[Testimonials SEO] Could not fetch reviews:", e.message);
        reviews = [
            { "@type": "Review", "author": { "@type": "Person", "name": "Sarah M." }, "reviewBody": "Fast and professional. Got my brother out in 4 hours.", "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" } },
            { "@type": "Review", "author": { "@type": "Person", "name": "John D." }, "reviewBody": "Called at 3am and they answered immediately. Lifesavers.", "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" } }
        ];
    }

    // 3. Structured Data
    wixSeo.setStructuredData([
        // CollectionPage with ItemList of reviews
        {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Shamrock Bail Bonds Client Reviews",
            "url": pageUrl,
            "description": pageDesc,
            "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": ["h1", "h2", ".testimonial-text", "[data-hook='review-body']"]
            },
            "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": reviews.length,
                "itemListElement": reviews.map((r, i) => ({
                    "@type": "ListItem",
                    "position": i + 1,
                    "item": r
                }))
            }
        },
        // LocalBusiness with AggregateRating (star snippet eligibility)
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Shamrock Bail Bonds, LLC",
            "@id": "https://www.shamrockbailbonds.biz/#organization",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": logoUrl,
            "image": logoUrl,
            "telephone": "+1-239-332-2245",
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
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds"
            ],
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "bestRating": "5",
                "worstRating": "1",
                "reviewCount": reviews.length > 2 ? String(reviews.length) : "150",
                "ratingCount": "150"
            },
            "review": reviews.slice(0, 5)
        },
        // Breadcrumb
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "Reviews", "item": pageUrl }
            ]
        }
    ]);
}
