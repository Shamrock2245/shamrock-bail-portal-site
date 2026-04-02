// Privacy Policy — SEO-Enhanced
import wixSeo from 'wix-seo';

$w.onReady(function () {
    setupPageMeta();
    setTimeout(() => { setupStructuredData(); }, 0);
});

function setupPageMeta() {
    const title = 'Privacy Policy | Shamrock Bail Bonds';
    const desc = 'Shamrock Bail Bonds Privacy Policy. Learn how we collect, use, and protect your personal information. We are committed to maintaining the confidentiality of all client data.';
    const url = 'https://www.shamrockbailbonds.biz/privacy-policy';

    wixSeo.setTitle(title);
    wixSeo.setLinks([{ rel: 'canonical', href: url }]);
    wixSeo.setMetaTags([
        { name: 'description', content: desc },
        { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: desc },
        { property: 'og:url', content: url },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Shamrock Bail Bonds, LLC' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title }
    ]);
}

function setupStructuredData() {
    wixSeo.setStructuredData([
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.shamrockbailbonds.biz/" },
                { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://www.shamrockbailbonds.biz/privacy-policy" }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Privacy Policy",
            "url": "https://www.shamrockbailbonds.biz/privacy-policy",
            "description": "Privacy Policy for Shamrock Bail Bonds LLC. Details on data collection, usage, storage, and client confidentiality practices.",
            "publisher": {
                "@type": "Organization",
                "@id": "https://www.shamrockbailbonds.biz/#organization",
                "name": "Shamrock Bail Bonds"
            },
            "inLanguage": "en-US",
            "lastReviewed": "2026-03-01"
        },
        {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://www.shamrockbailbonds.biz/#organization",
            "name": "Shamrock Bail Bonds",
            "url": "https://www.shamrockbailbonds.biz",
            "logo": "https://www.shamrockbailbonds.biz/logo.png",
            "telephone": "+1-239-332-2245",
            "priceRange": "$$",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "1528 Broadway",
                "addressLocality": "Fort Myers",
                "addressRegion": "FL",
                "postalCode": "33901",
                "addressCountry": "US"
            },
            "geo": { "@type": "GeoCoordinates", "latitude": "26.6406", "longitude": "-81.8723" },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "00:00", "closes": "23:59"
            },
            "sameAs": [
                "https://www.facebook.com/ShamrockBail",
                "https://www.instagram.com/shamrock_bail_bonds",
                "https://t.me/ShamrockBail_bot"
            ]
        }
    ]).catch(function(e) { console.error('[SEO] Privacy Policy schema error:', e); });
}
