// Terms of Service — SEO-Enhanced
import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

$w.onReady(function () {
    // Print button
    try {
        const printBtn = $w('#printTermsBtn');
        if (printBtn && printBtn.id) printBtn.onClick(() => wixWindow.print());
    } catch (e) { /* non-fatal */ }

    // Back to Home
    try {
        const backBtn = $w('#backHomeBtn');
        if (backBtn && backBtn.id) backBtn.onClick(() => wixLocation.to('/'));
    } catch (e) { /* non-fatal */ }

    setupPageMeta();
    setTimeout(() => { setupStructuredData(); }, 0);
});

function setupPageMeta() {
    const title = 'Terms of Service | Shamrock Bail Bonds';
    const desc = 'Terms of Service for Shamrock Bail Bonds. Understand our service agreement, bond conditions, indemnitor responsibilities, and legal obligations.';
    const url = 'https://www.shamrockbailbonds.biz/terms-of-service';

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
                { "@type": "ListItem", "position": 2, "name": "Terms of Service", "item": "https://www.shamrockbailbonds.biz/terms-of-service" }
            ]
        },
        {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Terms of Service",
            "url": "https://www.shamrockbailbonds.biz/terms-of-service",
            "description": "Terms of Service for Shamrock Bail Bonds LLC. Covers bond agreements, indemnitor obligations, and payment terms.",
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
    ]).catch(function(e) { console.error('[SEO] Terms schema error:', e); });
}
